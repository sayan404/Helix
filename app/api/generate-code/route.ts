import { NextRequest, NextResponse } from "next/server";
import { generateServiceCode } from "@/lib/ai/gemini-client";
import { getCurrentUser } from "@/lib/auth/get-user";
import { db, schema } from "@/lib/db/drizzle";
import { and, eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const isStream = url.searchParams.get("stream") === "1";

    const body = await request.json();
    const {
      serviceName,
      serviceType,
      technology,
      architectureId,
      services,
    }: {
      serviceName?: string;
      serviceType?: string;
      technology?: string;
      architectureId?: number | string | null;
      services?: Array<{
        serviceName: string;
        serviceType: string;
        technology?: string;
      }>;
    } = body || {};

    if (
      (!serviceName || !serviceType) &&
      (!Array.isArray(services) || services.length === 0)
    ) {
      return NextResponse.json(
        { error: "Service name and type are required" },
        { status: 400 }
      );
    }

    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!db) {
      return NextResponse.json(
        { error: "Database connection unavailable" },
        { status: 503 }
      );
    }

    const archIdNum =
      typeof architectureId === "number"
        ? architectureId
        : architectureId
        ? parseInt(architectureId)
        : null;

    const persistResult = async (
      svcName: string,
      result: Awaited<ReturnType<typeof generateServiceCode>>
    ) => {
      // Track token usage
      await db!.insert(schema.tokenUsage).values({
        userId: user.id,
        operation: "code_generation",
        inputTokens: result.tokenUsage.inputTokens,
        outputTokens: result.tokenUsage.outputTokens,
        totalTokens: result.tokenUsage.totalTokens,
        architectureId: archIdNum,
      });

      // Persist generated code into DB if architectureId is provided and belongs to user
      if (archIdNum) {
        const arch = await db!
          .select({ id: schema.architectures.id })
          .from(schema.architectures)
          .where(
            and(
              eq(schema.architectures.id, archIdNum),
              eq(schema.architectures.userId, user.id)
            )
          )
          .limit(1);

        if (arch.length) {
          await db!
            .insert(schema.codeTemplates)
            .values({
              userId: user.id,
              architectureId: archIdNum,
              serviceName: svcName,
              files: result.files || {},
              updatedAt: new Date(),
            })
            .onConflictDoUpdate({
              target: [
                schema.codeTemplates.architectureId,
                schema.codeTemplates.serviceName,
              ],
              set: {
                files: result.files || {},
                updatedAt: new Date(),
              },
            });
        }
      }
    };

    // STREAM MODE (single request, progress + per-service results)
    if (isStream) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
          const send = (event: string, data: any) => {
            controller.enqueue(
              encoder.encode(
                `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
              )
            );
          };

          const list =
            Array.isArray(services) && services.length
              ? services
              : [
                  {
                    serviceName: serviceName as string,
                    serviceType: serviceType as string,
                    technology,
                  },
                ];

          send("start", { total: list.length });

          for (let i = 0; i < list.length; i++) {
            const svc = list[i];
            send("service_start", {
              index: i + 1,
              total: list.length,
              serviceName: svc.serviceName,
            });

            try {
              const result = await generateServiceCode(
                svc.serviceName,
                svc.serviceType,
                svc.technology
              );
              await persistResult(svc.serviceName, result);

              send("service_complete", {
                index: i + 1,
                total: list.length,
                service_name: svc.serviceName,
                files: result.files || {},
              });
            } catch (error) {
              const anyErr = error as any;
              if (anyErr?.name === "AIServiceUnavailableError") {
                send("service_error", {
                  index: i + 1,
                  total: list.length,
                  serviceName: svc.serviceName,
                  status: 503,
                  kind: "MODEL_OVERLOADED",
                  retryAfterSec:
                    typeof anyErr?.retryAfterSec === "number"
                      ? anyErr.retryAfterSec
                      : 5,
                  error:
                    anyErr?.message ||
                    "The AI model is overloaded. Please try again later.",
                });
              } else {
                send("service_error", {
                  index: i + 1,
                  total: list.length,
                  serviceName: svc.serviceName,
                  status: 500,
                  error: "Failed to generate code",
                });
              }
            }
          }

          send("done", { ok: true });
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      });
    }

    // NON-STREAM MODE (backwards compatible: one service per request)
    const result = await generateServiceCode(
      serviceName as string,
      serviceType as string,
      technology
    );
    await persistResult(serviceName as string, result);

    return NextResponse.json({
      service_name: serviceName,
      files: result.files || {},
    });
  } catch (error) {
    console.error("Error in generate-code API:", error);

    // If the upstream AI provider is overloaded, surface a proper 503 so the UI can react.
    const anyErr = error as any;
    if (anyErr?.name === "AIServiceUnavailableError") {
      const retryAfterSec =
        typeof anyErr?.retryAfterSec === "number" ? anyErr.retryAfterSec : 5;
      return NextResponse.json(
        {
          error:
            anyErr?.message ||
            "The AI model is overloaded. Please try again later.",
          kind: "MODEL_OVERLOADED",
          retryAfterSec,
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate code" },
      { status: 500 }
    );
  }
}

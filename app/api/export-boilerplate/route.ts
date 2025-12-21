import { NextRequest } from "next/server";
import archiver from "archiver";
import { PassThrough } from "stream";
import { Readable } from "stream";
import { getCurrentUser } from "@/lib/auth/get-user";
import { db, schema } from "@/lib/db/drizzle";
import { and, eq } from "drizzle-orm";
import type { CodeTemplate } from "@/lib/types";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 64);
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!db) {
      return new Response(
        JSON.stringify({ error: "Database connection unavailable" }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      architectureId?: number | string | null;
      codeTemplates?: CodeTemplate[];
      zipName?: string;
    };

    const archId =
      typeof body.architectureId === "number"
        ? body.architectureId
        : body.architectureId
        ? parseInt(String(body.architectureId))
        : null;

    let templates: CodeTemplate[] = [];

    if (archId) {
      // Ensure ownership
      const arch = await db
        .select({ id: schema.architectures.id })
        .from(schema.architectures)
        .where(and(eq(schema.architectures.id, archId), eq(schema.architectures.userId, user.id)))
        .limit(1);

      if (!arch.length) {
        return new Response(JSON.stringify({ error: "Not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      const rows = await db
        .select({
          serviceName: schema.codeTemplates.serviceName,
          files: schema.codeTemplates.files,
        })
        .from(schema.codeTemplates)
        .where(
          and(
            eq(schema.codeTemplates.architectureId, archId),
            eq(schema.codeTemplates.userId, user.id)
          )
        );

      templates = rows.map((r) => ({
        service_name: r.serviceName,
        files: (r.files as any) || {},
      }));
    } else if (Array.isArray(body.codeTemplates)) {
      templates = body.codeTemplates;
    }

    if (!templates.length) {
      return new Response(JSON.stringify({ error: "No code templates to export" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const zipName =
      body.zipName && body.zipName.trim()
        ? body.zipName.trim()
        : `helix-boilerplate-${Date.now()}.zip`;

    const archive = archiver("zip", { zlib: { level: 9 } });
    const pass = new PassThrough();
    archive.on("error", (err) => {
      pass.destroy(err);
    });
    archive.pipe(pass);

    for (const tpl of templates) {
      const serviceFolder = slugify(tpl.service_name || "service");
      const files = tpl.files || {};

      for (const [filePath, content] of Object.entries(files)) {
        const normalized = String(filePath).replace(/^\/+/, "");
        const zipPath = `services/${serviceFolder}/${normalized}`;
        archive.append(String(content ?? ""), { name: zipPath });
      }
    }

    await archive.finalize();

    // Convert Node stream to Web stream for Next Response
    const webStream = Readable.toWeb(pass) as unknown as ReadableStream;

    return new Response(webStream, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${zipName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error exporting boilerplate zip:", error);
    return new Response(JSON.stringify({ error: "Failed to export boilerplate" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}



import { GoogleGenAI } from "@google/genai";
import { ArchitectureBlueprint } from "@/lib/types";

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

class AIServiceUnavailableError extends Error {
  status = 503 as const;
  retryAfterSec?: number;

  constructor(message: string, retryAfterSec?: number) {
    super(message);
    this.name = "AIServiceUnavailableError";
    this.retryAfterSec = retryAfterSec;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractHttpStatus(err: unknown): number | null {
  if (!err || typeof err !== "object") return null;

  const anyErr = err as any;
  const status = anyErr?.status;
  if (typeof status === "number") return status;

  const code = anyErr?.code;
  if (typeof code === "number" && code >= 100 && code <= 599) return code;

  const msg = typeof anyErr?.message === "string" ? anyErr.message : "";
  const m = msg.match(/(?:got status:|status:)\s*(\d{3})/i);
  if (m?.[1]) return Number(m[1]);

  return null;
}

function isModelOverloaded(err: unknown): boolean {
  const status = extractHttpStatus(err);
  if (status === 503) return true;

  if (!err || typeof err !== "object") return false;
  const anyErr = err as any;
  const msg = `${anyErr?.message || ""}`.toLowerCase();
  return msg.includes("overloaded") || msg.includes("unavailable");
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface ArchitectureGenerationResult {
  architecture: any;
  tokenUsage: TokenUsage;
}

// Estimate token usage (rough approximation: 1 token ≈ 4 characters)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export async function generateArchitecture(
  prompt: string,
  existingArchitecture?: ArchitectureBlueprint
): Promise<ArchitectureGenerationResult> {
  let systemPrompt = `
You are a senior system architect. Your task is to convert the user prompt into a well-structured backend system design.
You MUST output only valid JSON. Do not include commentary, markdown, code fences, headings, apologies, or extra text.
CRITICAL OUTPUT CONSTRAINTS (failure if violated):
- Output must be a SINGLE JSON object only (not an array), starting with "{" and ending with "}".
- Do NOT wrap the JSON in \`\`\` fences.
- Do NOT include any text before or after the JSON.
- Do NOT include explanations, notes, or formatting outside JSON.
- Do NOT include additional keys outside the specified schema.
- Other than a architecture JSON, do not output anything else.

Follow these rules strictly:

1. Identify all essential services required by the system (authentication, gateway, domain services, storage, cache, async processing, external integrations).
2. Choose technologies in a developer-friendly way:
   - If the user DOES NOT explicitly require a specific tech stack, you MUST minimize tech variety and standardize the stack across the architecture.
   - Prefer one primary application stack across most services (same language + framework) rather than mixing stacks.
   - Prefer one primary database (unless a second DB is clearly justified), one cache, and one queue/stream.
   - Only introduce a new technology when there is a clear reason (compliance, special workload, strong functional requirement).
   - If the user DOES specify technologies, follow them and keep the rest consistent with that choice.
3. Assign realistic and commonly used technologies for each service based on industry standards. Prefer:
   - Databases: PostgreSQL, MongoDB, MySQL, Cassandra, DynamoDB etc.
   - Cache: Redis, Memcached, Edge Cache etc.
   - Message Queue: Kafka, RabbitMQ, Redis Streams etc.
   - API Gateway: NGINX, Envoy etc.
   - Object Storage: S3-compatible storage
4. For each service, write a short but meaningful description of its responsibility.
5. Clearly define connections:
   - Use 'sync' for API calls (HTTP/gRPC/REST)
   - Use 'async' / 'pub-sub' for event-driven communication (Kafka, RabbitMQ, Redis Streams etc.)
6. Determine patterns from the architecture such as:
   ["microservices", "event-driven", "layered", "cqrs", "pub-sub", "monolith", ... etc]
7. Infer scaling model:
   - "horizontal" → if using microservices / stateless services
   - "vertical" → if a single core service grows vertically
   - "hybrid" → if mixed`;

  // If existing architecture is provided, include it as context for iteration
  if (existingArchitecture) {
    systemPrompt += `

IMPORTANT: You are iterating on an existing architecture. The user wants to modify or enhance it based on their new request.
Here is the current architecture:

Current Architecture:
${JSON.stringify(existingArchitecture, null, 2)}

Your task is to:
- Understand the existing architecture
- Apply the user's new request as modifications/enhancements to the existing design
- Preserve relevant parts of the existing architecture that should remain unchanged
- Update or add services, connections, and patterns as requested
- Maintain consistency with the existing design where appropriate`;
  }

  systemPrompt += `

The JSON output MUST match this schema exactly:

{
  "services": [
    {
      "id": "unique-id-lowercase-hyphenated",
      "name": "Service Name",
  "type": "service|database|cache|queue|gateway|cdn|load-balancer|etc...",
      "technology": "Technology Choice (e.g., Redis, PostgreSQL, Kafka, Node.js)",
      "description": "Plain-language explanation of the component role"
    }
  ],
  "connections": [
    {
      "source": "service-id",
      "target": "service-id",
      "type": "sync|async|pub-sub",
      "protocol": "HTTP|gRPC|AMQP|Redis-Streams|Kafka"
    }
  ],
  "patterns": ["microservices", "event-driven", ...],
  "scaling_model": "horizontal|vertical|hybrid",
  "summary": "1-3 sentence human readable explanation of the architecture"
}

User request:
${prompt}

Return ONLY the JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: systemPrompt,
    });

    const text = response.text;

    // Clean the response
    let jsonText = text?.trim() || "";
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/```\n?/g, "");
    }

    const architecture = JSON.parse(jsonText);

    // Extract token usage from response if available, otherwise estimate
    let inputTokens = 0;
    let outputTokens = 0;

    // Try to get usage metadata from response
    if ((response as any).usageMetadata) {
      inputTokens = (response as any).usageMetadata.promptTokenCount || 0;
      outputTokens = (response as any).usageMetadata.candidatesTokenCount || 0;
    } else {
      // Estimate tokens if metadata not available
      inputTokens = estimateTokens(systemPrompt);
      outputTokens = estimateTokens(jsonText);
    }

    const totalTokens = inputTokens + outputTokens;

    return {
      architecture,
      tokenUsage: {
        inputTokens,
        outputTokens,
        totalTokens,
      },
    };
  } catch (error) {
    console.error("Error generating architecture:", error);
    throw new Error("Failed to generate architecture");
  }
}

export interface CodeGenerationResult {
  files: { [filename: string]: string };
  tokenUsage: TokenUsage;
}

type CodeStack = {
  language:
    | "typescript"
    | "javascript"
    | "python"
    | "java"
    | "go"
    | "csharp"
    | "unknown";
  framework: string;
  buildTool: string;
  entrypointHint: string;
  filesToGenerate: string[];
};

function slugifyServiceName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

function inferCodeStack(technology?: string): CodeStack {
  const tech = (technology || "").toLowerCase();

  // Python
  if (/(python|fastapi|flask|django)/.test(tech)) {
    const framework = /django/.test(tech)
      ? "Django"
      : /flask/.test(tech)
      ? "Flask"
      : "FastAPI";

    return {
      language: "python",
      framework,
      buildTool: "pip",
      entrypointHint:
        framework === "Django" ? "manage.py" : "app/main.py (ASGI/WSGI entry)",
      filesToGenerate:
        framework === "Django"
          ? ["manage.py", "requirements.txt", "Dockerfile", "README.md"]
          : [
              "app/main.py",
              "app/routes.py",
              "requirements.txt",
              "Dockerfile",
              "README.md",
            ],
    };
  }

  // Java
  if (/(java|spring)/.test(tech)) {
    const framework = /spring/.test(tech) ? "Spring Boot" : "Java (plain)";
    return {
      language: "java",
      framework,
      buildTool: /gradle/.test(tech) ? "Gradle" : "Maven",
      entrypointHint: "src/main/java/**/Application.java",
      filesToGenerate: [
        "src/main/java/com/helix/service/Application.java",
        "src/main/java/com/helix/service/controller/HealthController.java",
        "src/main/resources/application.yml",
        "pom.xml",
        "Dockerfile",
        "README.md",
      ],
    };
  }

  // Go
  if (/(golang|go\b|gin|fiber)/.test(tech)) {
    const framework = /fiber/.test(tech)
      ? "Fiber"
      : /gin/.test(tech)
      ? "Gin"
      : "net/http";
    return {
      language: "go",
      framework,
      buildTool: "go mod",
      entrypointHint: "main.go",
      filesToGenerate: ["main.go", "go.mod", "Dockerfile", "README.md"],
    };
  }

  // C#
  if (/(c#|dotnet|\.net|asp\.net)/.test(tech)) {
    return {
      language: "csharp",
      framework: "ASP.NET Core Minimal API",
      buildTool: "dotnet",
      entrypointHint: "Program.cs",
      filesToGenerate: [
        "Program.cs",
        "appsettings.json",
        "HelixService.csproj",
        "Dockerfile",
        "README.md",
      ],
    };
  }

  // Node / TS / JS
  if (/(node|javascript|typescript|express|nest)/.test(tech) || !tech) {
    const framework = /nest/.test(tech) ? "NestJS" : "Express";
    const language = /javascript/.test(tech) ? "javascript" : "typescript";
    const isNest = framework === "NestJS";

    return {
      language,
      framework,
      buildTool: "pnpm/npm",
      entrypointHint: isNest
        ? "src/main.ts"
        : `src/index.${language === "javascript" ? "js" : "ts"}`,
      filesToGenerate: isNest
        ? [
            "src/main.ts",
            "src/app.module.ts",
            "package.json",
            "tsconfig.json",
            "Dockerfile",
            "README.md",
          ]
        : [
            `src/index.${language === "javascript" ? "js" : "ts"}`,
            `src/routes.${language === "javascript" ? "js" : "ts"}`,
            "package.json",
            language === "typescript" ? "tsconfig.json" : "README.md",
            "Dockerfile",
            "README.md",
          ].filter((v, i, a) => a.indexOf(v) === i),
    };
  }

  return {
    language: "unknown",
    framework: "unknown",
    buildTool: "unknown",
    entrypointHint: "unknown",
    filesToGenerate: ["Dockerfile", "README.md"],
  };
}

export async function generateServiceCode(
  serviceName: string,
  serviceType: string,
  technology?: string
): Promise<CodeGenerationResult> {
  const stack = inferCodeStack(technology);
  const serviceSlug = slugifyServiceName(serviceName);
  const packageHint = `com.helix.${serviceSlug.replace(/-/g, "")}`;
  const fileList = stack.filesToGenerate
    .map((f) =>
      f.replaceAll(
        "com/helix/service",
        `com/helix/${serviceSlug.replace(/-/g, "")}`
      )
    )
    .join("\n  - ");

  const prompt = `You are a senior backend engineer.
Generate production-ready *boilerplate* code for ONE microservice.

Service details:
- Service Name: ${serviceName}
- Type: ${serviceType}
- Technology (requested by architecture): ${technology || "(not specified)"}

Target stack (infer from Technology; MUST follow it):
- Language: ${stack.language}
- Framework: ${stack.framework}
- Build/Tooling: ${stack.buildTool}
- Entrypoint hint: ${stack.entrypointHint}

Hard requirements:
1) Generate code in the target language/framework. Do NOT generate TypeScript/Node if Technology indicates Python/Java/etc.
2) Include a health endpoint:
   - HTTP GET /health returns 200 and JSON { "status": "ok" }.
3) Include a sensible project structure and minimal dependencies.
4) Include configuration via environment variables (e.g. PORT) with reasonable defaults.
5) Include a Dockerfile that builds and runs the service.
6) If the stack is Java Spring Boot:
   - Use package name: ${packageHint}
   - Provide pom.xml (Maven) unless Gradle was explicitly requested.
7) If the stack is Python:
   - Prefer FastAPI unless Flask/Django is explicitly mentioned.
   - Provide requirements.txt.
8) Output MUST be only valid JSON (no markdown fences, no commentary).

Generate the following files (use these exact paths as keys in the JSON):
  - ${fileList}

Output JSON format:
{
  "files": {
    "path/to/file": "file content",
    "...": "..."
  }
}`;

  try {
    const maxAttempts = 3;
    let lastErr: unknown;
    let response: any;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        response = await ai.models.generateContent({
          model: "gemini-2.5-flash-lite",
          contents: prompt,
        });
        lastErr = null;
        break;
      } catch (e) {
        lastErr = e;
        if (!isModelOverloaded(e) || attempt === maxAttempts) {
          throw e;
        }

        // Exponential backoff with small jitter for transient overloads.
        const base = 800 * Math.pow(2, attempt - 1); // 800ms, 1600ms, 3200ms
        const jitter = Math.floor(Math.random() * 250);
        await sleep(base + jitter);
      }
    }

    const text = response.text;

    let jsonText = text?.trim() || "";
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/```\n?/g, "");
    }

    const result = JSON.parse(jsonText);

    // Extract token usage from response if available, otherwise estimate
    let inputTokens = 0;
    let outputTokens = 0;

    if ((response as any).usageMetadata) {
      inputTokens = (response as any).usageMetadata.promptTokenCount || 0;
      outputTokens = (response as any).usageMetadata.candidatesTokenCount || 0;
    } else {
      inputTokens = estimateTokens(prompt);
      outputTokens = estimateTokens(jsonText);
    }

    const totalTokens = inputTokens + outputTokens;

    return {
      files: result.files || {},
      tokenUsage: {
        inputTokens,
        outputTokens,
        totalTokens,
      },
    };
  } catch (error) {
    console.error("Error generating code:", error);
    if (isModelOverloaded(error)) {
      throw new AIServiceUnavailableError(
        "The AI model is overloaded. Please try again in a moment.",
        5
      );
    }
    throw new Error("Failed to generate service code");
  }
}

export interface ArchitectureEvaluationResult {
  answer: string;
  tokenUsage: TokenUsage;
}

export async function evaluateArchitecture(
  architecture: ArchitectureBlueprint,
  request: string
): Promise<ArchitectureEvaluationResult> {
  const prompt = `You are a principal systems architect reviewing an existing design.
Analyze the following architecture JSON and respond to the user's question with specific, prioritized guidance.

Architecture:
${JSON.stringify(architecture, null, 2)}

User question:
${request}

Respond with concise Markdown. Include:
- A short summary
- Actionable recommendations (bulleted)
- Risks or open questions if relevant
Avoid restating the entire JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
    });

    if (!response.text) {
      throw new Error("No response text from Gemini");
    }

    let answer = response.text.trim();
    if (answer.startsWith("```")) {
      answer = answer.replace(/```(markdown)?\n?/g, "").replace(/```\s*$/g, "");
    }

    // Extract token usage from response if available, otherwise estimate
    let inputTokens = 0;
    let outputTokens = 0;

    if ((response as any).usageMetadata) {
      inputTokens = (response as any).usageMetadata.promptTokenCount || 0;
      outputTokens = (response as any).usageMetadata.candidatesTokenCount || 0;
    } else {
      inputTokens = estimateTokens(prompt);
      outputTokens = estimateTokens(answer);
    }

    const totalTokens = inputTokens + outputTokens;

    return {
      answer: answer.trim(),
      tokenUsage: {
        inputTokens,
        outputTokens,
        totalTokens,
      },
    };
  } catch (error) {
    console.error("Error evaluating architecture:", error);
    throw new Error("Failed to evaluate architecture");
  }
}

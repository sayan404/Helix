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
  // Step 1: Analyze the user prompt and determine what components are needed
  const analysisPrompt = `You are a senior system architect. Analyze the following user prompt and determine what type of architecture is needed.

CRITICAL: First, determine if the prompt requires:
- "frontend-only" → If the prompt can be satisfied with just UI components (e.g., "Create a card", "Build a landing page", etc.)
- "backend-only" → If the prompt is about APIs, services, or data processing without UI (e.g., "Create a REST API", "Build a data pipeline", etc.)
- "both" → If the prompt requires both frontend and backend (e.g., "Build a todo app", "Create an e-commerce platform")

Then create an enhanced, comprehensive description that:
1. Identifies the core requirements and use cases
2. Determines the optimal architecture pattern (monolith, microservices, serverless, hybrid, etc.) based on scalability, sustainability, and avoiding vendor lock-in
3. Only includes frontend requirements if needed (frontend-only or both)
4. Only includes backend requirements if needed (backend-only or both)
5. Identifies communication patterns needed between components (only if both frontend and backend are needed)
6. Ensures the architecture is scalable, sustainable, and vendor-agnostic

User Prompt:
${prompt}

Output a JSON object with this structure:
{
  "component_type": "frontend-only|backend-only|both",
  "rationale": "Brief explanation of why this component type was chosen",
  "enhanced_description": "A comprehensive description of the system architecture that explains the best possible architecture both scalability-wise and sustainability-wise with no vendor lock-in",
  "architecture_pattern": "monolith|microservices|serverless|hybrid|layered|event-driven|etc",
  "pattern_rationale": "Brief explanation of why this pattern was chosen",
  "frontend_requirements": ["list of frontend requirements"] (only if component_type is "frontend-only" or "both"),
  "backend_requirements": ["list of backend requirements"] (only if component_type is "backend-only" or "both"),
  "communication_patterns": ["REST API", "GraphQL", "WebSocket", "gRPC", "Event Streaming", etc] (only if component_type is "both", otherwise empty array),
  "scalability_approach": "Description of how the system will scale",
  "sustainability_considerations": "Description of sustainability aspects",
  "vendor_lock_in_mitigation": "How vendor lock-in is avoided"
}

Output ONLY valid JSON, no markdown, no code fences.`;

  let enhancedDescription: any = {};

  try {
    const analysisResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: analysisPrompt,
    });

    let analysisText = analysisResponse.text?.trim() || "";
    if (analysisText.startsWith("```json")) {
      analysisText = analysisText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "");
    } else if (analysisText.startsWith("```")) {
      analysisText = analysisText.replace(/```\n?/g, "");
    }

    enhancedDescription = JSON.parse(analysisText);
  } catch (error) {
    console.error("Error analyzing prompt, using original:", error);
    enhancedDescription = {
      component_type: "both",
      rationale: "Default: assuming both frontend and backend needed",
      enhanced_description: prompt,
      architecture_pattern: "microservices",
      pattern_rationale: "Default pattern",
      frontend_requirements: [],
      backend_requirements: [],
      communication_patterns: ["REST API"],
      scalability_approach: "Horizontal scaling",
      sustainability_considerations: "Standard practices",
      vendor_lock_in_mitigation: "Open-source technologies",
    };
  }

  const componentType = enhancedDescription.component_type || "both";
  const needsFrontend =
    componentType === "frontend-only" || componentType === "both";
  const needsBackend =
    componentType === "backend-only" || componentType === "both";

  // Step 2: Generate architecture based on component type
  let systemPrompt = `
You are a senior system architect. Your task is to convert the enhanced description into a well-structured system design.
You MUST output only valid JSON. Do not include commentary, markdown, code fences, headings, apologies, or extra text.
CRITICAL OUTPUT CONSTRAINTS (failure if violated):
- Output must be a SINGLE JSON object only (not an array), starting with "{" and ending with "}".
- Do NOT wrap the JSON in \`\`\` fences.
- Do NOT include any text before or after the JSON.
- Do NOT include explanations, notes, or formatting outside JSON.
- Do NOT include additional keys outside the specified schema.
- Other than a architecture JSON, do not output anything else.

Component Type Required: ${componentType}
Rationale: ${enhancedDescription.rationale || ""}

Enhanced Architecture Description:
${enhancedDescription.enhanced_description || prompt}

Architecture Pattern: ${
    enhancedDescription.architecture_pattern || "microservices"
  }
Pattern Rationale: ${enhancedDescription.pattern_rationale || ""}
${
  needsFrontend
    ? `Frontend Requirements: ${JSON.stringify(
        enhancedDescription.frontend_requirements || []
      )}`
    : ""
}
${
  needsBackend
    ? `Backend Requirements: ${JSON.stringify(
        enhancedDescription.backend_requirements || []
      )}`
    : ""
}
${
  componentType === "both"
    ? `Communication Patterns: ${JSON.stringify(
        enhancedDescription.communication_patterns || []
      )}`
    : ""
}

Follow these rules strictly:

1. Generate architecture components based on the component type:
   ${
     needsFrontend
       ? "- Frontend components (web apps, mobile apps, desktop apps if needed)"
       : ""
   }
   ${
     needsBackend
       ? "- Backend services (authentication, gateway, domain services, storage, cache, async processing, external integrations)"
       : ""
   }
   ${
     needsBackend
       ? "- Infrastructure components (databases, caches, queues, gateways, CDNs, load balancers)"
       : ""
   }
   ${
     componentType === "both"
       ? "- Communication patterns between frontend and backend"
       : ""
   }
   
   IMPORTANT: 
   - If component_type is "frontend-only", ONLY generate frontend components. Do NOT include any backend services, databases, or APIs.
   - If component_type is "backend-only", ONLY generate backend services and infrastructure. Do NOT include any frontend components.
   - If component_type is "both", generate both frontend and backend with communication patterns.

2. Architecture Pattern Selection:
   - DO NOT assume microservices by default. Choose the pattern that best fits the requirements:
     * Monolith: For simple applications, small teams, or when microservices overhead isn't justified
     * Microservices: For complex systems with independent scaling needs, multiple teams, or domain boundaries
     * Serverless: For event-driven, sporadic workloads, or cost optimization
     * Layered: For traditional enterprise applications
     * Event-driven: For real-time systems, decoupled services
     * Hybrid: When different parts need different patterns
   - The pattern should align with: ${
     enhancedDescription.architecture_pattern || "microservices"
   }

3. Choose technologies following BEST PRACTICES and INDUSTRY STANDARDS:
   - ALWAYS use industry-standard, well-documented, and widely-adopted technologies
   - Follow best practices for each technology stack (e.g., RESTful API design, REST conventions, proper HTTP methods, status codes)
   - If the user DOES NOT explicitly require a specific tech stack, you MUST minimize tech variety and standardize the stack across the architecture.
   - Prefer one primary application stack across most services (same language + framework) rather than mixing stacks.
   - Prefer one primary database (unless a second DB is clearly justified), one cache, and one queue/stream.
   - Only introduce a new technology when there is a clear reason (compliance, special workload, strong functional requirement).
   - If the user DOES specify technologies, follow them and keep the rest consistent with that choice.
   - AVOID vendor lock-in: Prefer open-source, portable technologies (PostgreSQL over proprietary DBs, Redis over vendor-specific caches, etc.)
   - Use semantic versioning, follow security best practices, implement proper error handling, logging, and monitoring patterns
   - Apply SOLID principles, clean architecture patterns, and design patterns where appropriate

4. Platform & project scaffolding assumptions:
   - Assume the user will pass this architecture JSON to an AI coding agent or platform (e.g., Cursor) that will generate the actual codebase.
   - The architecture MUST be compatible with generating, at minimum, the following project-level files for any non-trivial app:
     * A ".env.example" file listing ALL required environment variables (for frontend and backend), with sensible placeholder values.
     * A "SETUP.md" file that explains how to install dependencies, configure environment variables, and run the app (dev and production).
   - If a web SPA frontend is appropriate, prefer **React + Vite** (latest stable versions) over Create React App. NEVER suggest Create React App.
   - When suggesting libraries/frameworks (React, Vite, Node.js, FastAPI, etc.), assume **latest stable major versions** that are widely adopted in 2025+ (do NOT pick obviously outdated stacks).
   - Keep tooling choices modern and lightweight so that an AI agent can scaffold the project quickly (e.g., Vite over CRA, modern bundlers, etc.).

5. Docker and Containerization:
   - DO NOT assume Docker/containerization is required unless:
     * The user explicitly mentions Docker, containers, or containerization in their prompt
     * The architecture absolutely requires containerization (e.g., complex microservices with multiple databases, or specific deployment requirements)
   - Prefer native/local development setups when possible (e.g., npm/pnpm for Node.js, pip/poetry for Python, etc.)
   - Only include Docker-related components or services if they are explicitly requested or absolutely necessary for the architecture to function
   - Focus on the application architecture itself, not deployment infrastructure unless specifically requested

6. Assign realistic and commonly used technologies for each service based on industry standards. Prefer:
   - Frontend: React, Vue, Angular, Next.js, Svelte, Flutter, React Native, etc.
   - Backend: Node.js, Python (FastAPI/Flask/Django), Java (Spring Boot), Go, C# (.NET), etc.
   - Databases: PostgreSQL, MongoDB, MySQL, Cassandra, DynamoDB etc.
   - Cache: Redis, Memcached, Edge Cache etc.
   - Message Queue: Kafka, RabbitMQ, Redis Streams etc.
   - API Gateway: NGINX, Envoy, Kong etc.
   - Object Storage: S3-compatible storage
   - CDN: Cloudflare, AWS CloudFront, etc.

7. For each service/component, write a COMPREHENSIVE and DETAILED description that includes:
   - Primary responsibility and purpose
   - Key functionalities and features it handles
   - Data it processes or manages
   - Dependencies and integrations
   - Business logic or rules it enforces
   - Performance considerations if relevant
   - Security requirements if applicable
   - Use industry-standard terminology and best practices
   - Be as detailed as possible to enable smooth code generation later
   - Example: Instead of "Authentication service", write "Handles user authentication using JWT tokens, password hashing with bcrypt, session management, OAuth2 integration for social logins, rate limiting to prevent brute force attacks, and multi-factor authentication support"

8. Clearly define connections:
   ${
     componentType === "both"
       ? `- Use 'sync' for API calls (HTTP/gRPC/REST/GraphQL)
   - Use 'async' / 'pub-sub' for event-driven communication (Kafka, RabbitMQ, Redis Streams etc.)
   - Include connections between frontend and backend components
   - Specify protocols: HTTP, HTTPS, WebSocket, gRPC, GraphQL, AMQP, Kafka, etc.`
       : componentType === "frontend-only"
       ? `- Only include connections between frontend components if needed (e.g., component composition, state management)
   - Do NOT include any backend API connections`
       : `- Use 'sync' for API calls (HTTP/gRPC/REST/GraphQL)
   - Use 'async' / 'pub-sub' for event-driven communication (Kafka, RabbitMQ, Redis Streams etc.)
   - Include connections between backend services and infrastructure
   - Specify protocols: HTTP, HTTPS, WebSocket, gRPC, GraphQL, AMQP, Kafka, etc.`
   }

9. Determine patterns from the architecture such as:
   ["microservices", "event-driven", "layered", "cqrs", "pub-sub", "monolith", "serverless", "api-gateway", "bff", ... etc]

10. Infer scaling model:
   - "horizontal" → if using microservices / stateless services / serverless
   - "vertical" → if a single core service grows vertically (monolith)
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
      "name": "Component Name",
      "type": "service|database|cache|queue|gateway|cdn|load-balancer|frontend|mobile|desktop",
      "technology": "Technology Choice (e.g., React, Node.js, Redis, PostgreSQL, Kafka)",
      "description": "Plain-language explanation of the component role"
    }
  ],
  "connections": [
    {
      "source": "component-id",
      "target": "component-id",
      "type": "sync|async|pub-sub",
      "protocol": "HTTP|HTTPS|WebSocket|gRPC|GraphQL|AMQP|Redis-Streams|Kafka"
    }
  ],
  "patterns": ["microservices", "event-driven", "layered", "monolith", "serverless", ...],
  "scaling_model": "horizontal|vertical|hybrid",
  "summary": "1-3 sentence human readable explanation of the complete architecture",
  "product_description": "A comprehensive 2-4 paragraph description of the product/system, its purpose, key features, and target users",
  "workflow_documentation": {
    "components": [
      {
        "id": "component-id",
        "name": "Component Name",
        "description": "DETAILED description of what this component does, its responsibilities, data handling, business logic, and integrations",
        "endpoints": [
          {
            "method": "GET|POST|PUT|DELETE|PATCH",
            "path": "/api/v1/resource",
            "description": "DETAILED description including: purpose, business logic, validation rules, error handling, authentication/authorization requirements, rate limiting, and expected behavior",
            "request": {
              "body": "DETAILED request body structure with field names, types, validation rules, required/optional fields, example values, and constraints",
              "query": "DETAILED query parameters with names, types, validation, default values, and usage examples",
              "headers": "DETAILED required headers including authentication tokens, content-type, custom headers with descriptions"
            },
            "response": {
              "status": "HTTP status codes (200, 201, 400, 401, 403, 404, 500, etc.)",
              "body": "DETAILED response body structure with field names, types, example values, and error response formats"
            },
            "authentication": "Authentication method required (JWT, API Key, OAuth2, etc.)",
            "authorization": "Authorization rules (roles, permissions, resource ownership)",
            "validation": "Input validation rules and constraints",
            "error_handling": "Error scenarios and corresponding status codes with error message formats"
          }
        ]
      }
    ],
    "workflows": [
      {
        "name": "Workflow Name (e.g., User Registration Flow)",
        "description": "Description of the workflow",
        "steps": [
          {
            "component": "component-id",
            "action": "Action performed (e.g., POST /api/auth/register)",
            "description": "DETAILED description of what happens in this step including: data flow, transformations, validations, side effects, error scenarios, and next steps"
          }
        ]
      }
    ]
  }
}

IMPORTANT NOTES:
${
  needsFrontend
    ? `- Include frontend components (type: "frontend", "mobile", or "desktop") in the services array`
    : ""
}
${
  needsBackend
    ? `- Include backend services and infrastructure components in the services array`
    : ""
}
${
  componentType === "both"
    ? `- Include connections from frontend to backend (e.g., frontend -> API Gateway -> Backend Service)`
    : componentType === "frontend-only"
    ? `- Only include connections between frontend components if needed`
    : `- Include connections between backend services and infrastructure`
}
${
  needsBackend
    ? `- Generate DETAILED endpoints for backend services that expose APIs
   - For each endpoint, provide comprehensive details: purpose, request/response schemas with field types and validation rules, authentication/authorization requirements, error handling, rate limiting, and business logic
   - Follow RESTful API best practices: proper HTTP methods, status codes, resource naming conventions, versioning strategy
   - Include detailed request/response examples with realistic data structures
   - Specify validation rules, constraints, and error scenarios for each endpoint`
    : `- Do NOT generate endpoints for frontend-only architecture`
}
- Generate DETAILED workflows that show how different components interact to complete user journeys
   - Each workflow step should include: component involved, action performed, data transformations, validation checks, error handling, and next steps
   - Describe the complete flow with all edge cases and error scenarios
- The product_description should be comprehensive and explain what the system does, its value proposition, and key features
- The workflow_documentation should include all major user flows and system interactions with DETAILED step-by-step descriptions
- CRITICAL: All descriptions must be DETAILED and COMPREHENSIVE to enable smooth code generation. Include enough context, business logic, validation rules, error handling, and technical specifications for an AI agent to generate production-ready code.
${
  componentType === "frontend-only"
    ? `- CRITICAL: Do NOT include any backend services, databases, APIs, or infrastructure components. Only frontend components.`
    : componentType === "backend-only"
    ? `- CRITICAL: Do NOT include any frontend components. Only backend services and infrastructure.`
    : ""
}

Return ONLY the JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
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
      model: "gemini-2.5-flash",
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

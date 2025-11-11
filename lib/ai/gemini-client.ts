import { GoogleGenAI } from "@google/genai";
import { ArchitectureBlueprint } from "@/lib/types";

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function generateArchitecture(prompt: string) {
  const systemPrompt = `
You are a senior system architect. Your task is to convert the user prompt into a well-structured backend system design.
You MUST output only JSON. Do not include commentary, markdown, or extra text.

Follow these rules strictly:

1. Identify all essential services required by the system (authentication, gateway, domain services, storage, cache, async processing, external integrations).
2. Assign realistic and commonly used technologies for each service based on industry standards. Prefer:
   - Databases: PostgreSQL, MongoDB, MySQL, Cassandra, DynamoDB etc.
   - Cache: Redis, Memcached, Edge Cache etc.
   - Message Queue: Kafka, RabbitMQ, Redis Streams etc.
   - API Gateway: NGINX, Envoy etc.
   - Object Storage: S3-compatible storage
3. For each service, write a short but meaningful description of its responsibility.
4. Clearly define connections:
   - Use 'sync' for API calls (HTTP/gRPC/REST)
   - Use 'async' / 'pub-sub' for event-driven communication (Kafka, RabbitMQ, Redis Streams etc.)
5. Determine patterns from the architecture such as:
   ["microservices", "event-driven", "layered", "cqrs", "pub-sub", "monolith"]
6. Infer scaling model:
   - "horizontal" → if using microservices / stateless services
   - "vertical" → if a single core service grows vertically
   - "hybrid" → if mixed

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

    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error generating architecture:", error);
    throw new Error("Failed to generate architecture");
  }
}

export async function generateServiceCode(
  serviceName: string,
  serviceType: string,
  technology?: string
) {
  const prompt = `Generate boilerplate code for a microservice with these details:
  - Service Name: ${serviceName}
  - Type: ${serviceType}
  - Technology: ${technology || "Node.js with Express"}

  Generate the following files:
  1. src/index.ts (main entry point with Express setup)
  2. src/routes.ts (API routes)
  3. Dockerfile
  4. package.json

  Respond in this JSON format:
  {
    "files": {
      "src/index.ts": "file content here",
      "src/routes.ts": "file content here",
      "Dockerfile": "file content here",
      "package.json": "file content here"
    }
  }

  Respond with ONLY valid JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
    });

    const text = response.text;

    let jsonText = text.trim();
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/```\n?/g, "");
    }

    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error generating code:", error);
    throw new Error("Failed to generate service code");
  }
}

export async function evaluateArchitecture(
  architecture: ArchitectureBlueprint,
  request: string
) {
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

    return answer.trim();
  } catch (error) {
    console.error("Error evaluating architecture:", error);
    throw new Error("Failed to evaluate architecture");
  }
}

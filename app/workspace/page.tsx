"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  ArchitectureBlueprint,
  ScalabilityMetrics,
  CodeTemplate,
} from "@/lib/types";
import { estimateCost } from "@/lib/utils/cost-estimator";
import {
  Loader2,
  Download,
  Code,
  Activity,
  DollarSign,
  Zap,
  Database,
  Globe,
  Server,
  Box,
  Network,
  MessageSquare,
  Send,
  LogOut,
  User,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  FileCode,
  ArrowRight,
  Star,
  Coins,
} from "lucide-react";
import DiagramEditorWrapper from "@/components/diagram/DiagramEditor";
import componentLibrary from "@/components/diagram/componentLibrary.json";
import { FolderOpen, Clock } from "lucide-react";
import { LoadSimulationChart } from "@/components/LoadSimulationChart";
import { useRouter } from "next/navigation";

type ChatMode = "generate" | "evaluate";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  mode: ChatMode;
  timestamp: string;
};

export default function Home() {
  const router = useRouter();
  const [architecture, setArchitecture] =
    useState<ArchitectureBlueprint | null>(null);
  const [architectureId, setArchitectureId] = useState<number | null>(null);
  const [scalabilityMetrics, setScalabilityMetrics] =
    useState<ScalabilityMetrics | null>(null);
  const [codeTemplates, setCodeTemplates] = useState<CodeTemplate[]>([]);
  const [isLoadingCodeTemplates, setIsLoadingCodeTemplates] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatMode, setChatMode] = useState<ChatMode>("generate");
  const [isChatting, setIsChatting] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    id: number;
    email: string;
    name: string | null;
  } | null>(null);
  const [tokenQuota, setTokenQuota] = useState<{
    maxAllowedTokens: number;
    tokensUsed: number;
    tokensLeft: number;
  } | null>(null);
  const [pastProjects, setPastProjects] = useState<ArchitectureBlueprint[]>([]);
  const [isLoadingPastProjects, setIsLoadingPastProjects] = useState(false);
  const [isPastProjectsOpen, setIsPastProjectsOpen] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [collapsedServices, setCollapsedServices] = useState<
    Record<string, boolean>
  >({});
  const [collapsedFiles, setCollapsedFiles] = useState<Record<string, boolean>>(
    {}
  );
  const chatListRef = useRef<HTMLDivElement>(null);

  const fetchTokenQuota = async () => {
    try {
      const res = await fetch("/api/token-usage?limit=0", {
        credentials: "include",
      });
      if (!res.ok) return;
      const data = await res.json().catch(() => null);
      if (data?.quota) setTokenQuota(data.quota);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (chatListRef.current) {
      chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
    }
  }, [messages]);

  // Fetch current user on mount
  useEffect(() => {
    fetch("/api/auth/me", {
      credentials: "include", // Include cookies in request
    })
      .then((res) => {
        if (!res.ok) {
          // If not authenticated, middleware will redirect
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.ok && data?.user) {
          setCurrentUser(data.user);
          fetchTokenQuota();
        }
      })
      .catch(() => {
        router.push("/login");
      });
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const id = setInterval(() => {
      fetchTokenQuota();
    }, 15000);
    return () => clearInterval(id);
  }, [currentUser]);

  // Fetch past projects on mount
  useEffect(() => {
    setIsLoadingPastProjects(true);
    fetch("/api/architectures", {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) {
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.ok && data?.architectures) {
          // API already returns architectures sorted by newest first
          // Limit to max 2 projects for display in Past Projects section
          setPastProjects(data.architectures);
        }
      })
      .catch((error) => {
        console.error("Error fetching architectures:", error);
      })
      .finally(() => {
        setIsLoadingPastProjects(false);
      });
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include", // Include cookies
      });
      setTokenQuota(null);
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = "/login";
    }
  };
  const handleWhiteboardSave = async (updated: ArchitectureBlueprint) => {
    try {
      const response = await fetch("/api/architectures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          architecture: updated,
          architectureId: architectureId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error || "Failed to save architecture");
      }

      const data = await response.json();
      if (data?.ok && data?.architecture) {
        setArchitecture(data.architecture);
        setArchitectureId(data.dbId || null);

        // Refresh past projects list
        fetch("/api/architectures", {
          credentials: "include",
        })
          .then((res) => res.json())
          .then((archData) => {
            if (archData?.ok && archData?.architectures) {
              setPastProjects(archData.architectures.slice(0, 2));
            }
          })
          .catch((error) => {
            console.error("Error refreshing architectures:", error);
          });
      }
    } catch (error) {
      console.error("Error saving architecture:", error);
      alert("Failed to save architecture. Please try again.");
    }
  };

  const handleLoadArchitecture = (arch: ArchitectureBlueprint) => {
    setArchitecture(arch);
    // Extract architecture ID from the arch.id
    // The arch.id is a string representation of the database ID (e.g., "123")
    const dbId =
      typeof arch.id === "string" && !isNaN(Number(arch.id))
        ? Number(arch.id)
        : null;
    setArchitectureId(dbId);
    setScalabilityMetrics(null);
    setCodeTemplates([]);
    setIsLoadingCodeTemplates(false);
    // Load saved code templates (if this architecture came from DB)
    if (dbId) {
      setIsLoadingCodeTemplates(true);
      fetch(`/api/code-templates?architectureId=${dbId}`, {
        credentials: "include",
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.ok && Array.isArray(data.codeTemplates)) {
            setCodeTemplates(data.codeTemplates);
          }
        })
        .catch((e) => {
          console.error("Error loading saved code templates:", e);
        })
        .finally(() => {
          setIsLoadingCodeTemplates(false);
        });
    }

    // Parse the prompt to extract iterations and create conversation messages
    const prompt = arch.prompt || "";
    const summary = arch.summary || "No summary available.";

    // Check if prompt contains iterations (case-insensitive)
    const iterationRegex = /\s*-\s*Iteration:\s*/i;
    const hasIterations = iterationRegex.test(prompt);

    const newMessages: ChatMessage[] = [];
    const baseTime = Date.now();

    if (hasIterations) {
      // Split by " - Iteration: " or " -Iteration: " (flexible whitespace)
      const parts = prompt.split(/\s*-\s*Iteration:\s*/i);

      // First part is the initial user prompt
      if (parts[0]?.trim()) {
        newMessages.push({
          id: `user-initial-${baseTime}`,
          role: "user",
          mode: "generate",
          content: parts[0].trim(),
          timestamp: new Date().toISOString(),
        });
      }

      // Each iteration part is a user message
      parts.slice(1).forEach((iteration, index) => {
        if (iteration.trim()) {
          // User iteration request
          newMessages.push({
            id: `user-iteration-${index}-${baseTime + index + 1}`,
            role: "user",
            mode: "generate",
            content: iteration.trim(),
            timestamp: new Date().toISOString(),
          });
        }
      });

      // Add final assistant response with the summary
      newMessages.push({
        id: `assistant-final-${baseTime + 1000}`,
        role: "assistant",
        mode: "generate",
        content: summary,
        timestamp: new Date().toISOString(),
      });
    } else {
      // No iterations, just show the original prompt and summary
      if (prompt.trim()) {
        newMessages.push({
          id: `user-initial-${baseTime}`,
          role: "user",
          mode: "generate",
          content: prompt.trim(),
          timestamp: new Date().toISOString(),
        });
      }

      newMessages.push({
        id: `assistant-final-${baseTime + 1000}`,
        role: "assistant",
        mode: "generate",
        content: summary,
        timestamp: new Date().toISOString(),
      });
    }

    // Add all parsed messages to chat
    setMessages(newMessages);
  };

  const handleChatSubmit = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    const message = chatInput.trim();
    if (!message) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: message,
      mode: chatMode,
      timestamp: new Date().toISOString(),
    };

    // If we loaded a past project, the chat history may include an `assistant-final-*`
    // summary message. Before continuing the conversation, remove those "final" messages.
    setMessages((prev) => {
      const cleaned = prev.filter((m) => !m.id.startsWith("assistant-final-"));
      return [...cleaned, userMessage];
    });
    setChatInput("");
    setIsChatting(true);

    try {
      if (chatMode === "generate") {
        // Prepare request body with current architecture if it exists
        const requestBody: {
          prompt: string;
          architectureId?: number;
          existingArchitecture?: ArchitectureBlueprint;
        } = {
          prompt: message,
        };

        // If we have a current architecture (either from database or manually added), pass it for iteration
        if (architecture) {
          if (architectureId) {
            // Architecture exists in database - pass the ID
            requestBody.architectureId = architectureId;
          } else {
            // Manually added architecture - pass the full object
            requestBody.existingArchitecture = architecture;
          }
        }

        const response = await fetch("/api/design", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include", // Include cookies
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          if (errorData.error && errorData.redirect) {
            // Token limit reached - show error message but don't redirect
            // User can still view past content
            setMessages((prev) => [
              ...prev,
              {
                id: `assistant-${Date.now()}`,
                role: "assistant",
                mode: "generate",
                content: `⚠️ Token limit reached. You've used all ${
                  errorData.quota?.maxAllowedTokens?.toLocaleString() || 10000
                } tokens.\n\nYou can still view your past architectures and generated code, but new generation requires more tokens. Visit ${
                  errorData.redirect
                } to upgrade.`,
                timestamp: new Date().toISOString(),
              },
            ]);
            // Refresh token quota
            fetchTokenQuota();
            return;
          }
          if (errorData.error) {
            throw new Error(errorData.error);
          }
          throw new Error("Failed to generate architecture");
        }

        const data: ArchitectureBlueprint & {
          dbId?: number;
          error?: string;
          redirect?: string;
          quota?: {
            maxAllowedTokens: number;
            tokensUsed: number;
            tokensLeft: number;
          };
        } = await response.json();

        // Check if there's an error with redirect (e.g., limit reached)
        // Don't redirect - let user view past content
        if (data.error && data.redirect) {
          setMessages((prev) => [
            ...prev,
            {
              id: `assistant-${Date.now()}`,
              role: "assistant",
              mode: "generate",
              content: `⚠️ Token limit reached. You've used all ${
                data.quota?.maxAllowedTokens?.toLocaleString() || 10000
              } tokens.\n\nYou can still view your past architectures and generated code, but new generation requires more tokens. Visit ${
                data.redirect
              } to upgrade.`,
              timestamp: new Date().toISOString(),
            },
          ]);
          fetchTokenQuota();
          return;
        }

        if (data.error) {
          setMessages((prev) => [
            ...prev,
            {
              id: `assistant-${Date.now()}`,
              role: "assistant",
              mode: "generate",
              content: `Error: ${data.error}`,
              timestamp: new Date().toISOString(),
            },
          ]);
          return;
        }

        // Check if this is an iteration before updating state
        const isIteration = architecture !== null;

        setArchitecture(data);
        setArchitectureId(data.dbId || null);
        setScalabilityMetrics(null);
        setCodeTemplates([]);

        // Refresh past projects list to include the new/updated architecture
        fetch("/api/architectures", {
          credentials: "include",
        })
          .then((res) => res.json())
          .then((archData) => {
            if (archData?.ok && archData?.architectures) {
              // API already returns architectures sorted by newest first
              // Limit to max 2 projects for display in Past Projects section
              setPastProjects(archData.architectures.slice(0, 2));
            }
          })
          .catch((error) => {
            console.error("Error refreshing architectures:", error);
          });

        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            mode: "generate",
            content: isIteration
              ? `Updated the architecture with ${data.services.length} components.\n\n${data.summary}`
              : `Generated a new architecture with ${data.services.length} components.\n\n${data.summary}`,
            timestamp: new Date().toISOString(),
          },
        ]);
      } else {
        if (!architecture) {
          setMessages((prev) => [
            ...prev,
            {
              id: `assistant-${Date.now()}`,
              role: "assistant",
              mode: "evaluate",
              content:
                "Generate an architecture first, then I can evaluate or suggest improvements.",
              timestamp: new Date().toISOString(),
            },
          ]);
          return;
        }

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include", // Include cookies
          body: JSON.stringify({ message, architecture, architectureId }),
        });

        if (!response.ok) {
          throw new Error("Failed to evaluate architecture");
        }

        const data = await response.json();

        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            mode: "evaluate",
            content: data.reply || "No guidance available.",
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } catch (error) {
      console.error("Error during chat interaction:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          mode: chatMode,
          content:
            "Something went wrong while contacting the AI. Please try again in a moment.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsChatting(false);
      fetchTokenQuota();
    }
  };

  const handleSimulate = async () => {
    if (!architecture) return;

    setIsSimulating(true);
    try {
      const response = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Include cookies
        body: JSON.stringify(architecture),
      });

      if (!response.ok) throw new Error("Failed to simulate load");

      const data = await response.json();
      setScalabilityMetrics(data);
    } catch (error) {
      console.error("Error simulating load:", error);
      alert("Failed to simulate load. Please try again.");
    } finally {
      setIsSimulating(false);
    }
  };

  const handleGenerateCode = async () => {
    if (!architecture) return;

    setIsGeneratingCode(true);
    try {
      const services = architecture.services.filter(
        (s) => s.type === "service"
      );
      const templates: CodeTemplate[] = [];
      const failures: Array<{
        serviceName: string;
        status?: number;
        message: string;
        kind?: string;
        retryAfterSec?: number;
      }> = [];

      // Stream progress/results service-by-service (single request).
      setCodeTemplates([]);
      const response = await fetch("/api/generate-code?stream=1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          architectureId,
          services: services.map((s) => ({
            serviceName: s.name,
            serviceType: s.type,
            technology: s.technology,
          })),
        }),
      });

      // Fallback to non-stream error handling if streaming isn't available.
      const contentType = response.headers.get("content-type") || "";
      if (!response.ok) {
        const errBody = await response.json().catch(() => ({} as any));
        // Handle token limit gracefully - show message but don't redirect
        if (errBody?.error && errBody?.redirect && errBody?.quota) {
          alert(
            `⚠️ Token limit reached. You've used all ${
              errBody.quota.maxAllowedTokens?.toLocaleString() || 10000
            } tokens.\n\nYou can still view your past generated code, but new generation requires more tokens. Visit ${
              errBody.redirect
            } to upgrade.`
          );
          fetchTokenQuota();
          return;
        }
        throw new Error(errBody?.error || "Failed to generate code");
      }
      if (!contentType.includes("text/event-stream") || !response.body) {
        const errBody = await response.json().catch(() => ({} as any));
        throw new Error(errBody?.error || "Failed to generate code");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let currentEvent = "message";

      const upsertTemplate = (t: CodeTemplate) => {
        setCodeTemplates((prev) => {
          const idx = prev.findIndex((p) => p.service_name === t.service_name);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = t;
            return next;
          }
          return [...prev, t];
        });
      };

      const handleEvent = (event: string, data: any) => {
        if (event === "service_complete" && data?.service_name) {
          const tpl: CodeTemplate = {
            service_name: data.service_name,
            files: data.files || {},
          };
          templates.push(tpl);
          upsertTemplate(tpl);
          return;
        }

        if (event === "service_error" && data?.serviceName) {
          failures.push({
            serviceName: data.serviceName,
            status: data.status,
            message:
              data?.error ||
              (data.status === 503
                ? "AI model overloaded. Please retry."
                : "Failed to generate code."),
            kind: data?.kind,
            retryAfterSec: data?.retryAfterSec,
          });
        }
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE frames split by blank line
        let idx;
        while ((idx = buffer.indexOf("\n\n")) !== -1) {
          const frame = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);

          const lines = frame.split("\n");
          currentEvent = "message";
          const dataLines: string[] = [];

          for (const line of lines) {
            if (line.startsWith("event:")) {
              currentEvent = line.slice("event:".length).trim();
            } else if (line.startsWith("data:")) {
              dataLines.push(line.slice("data:".length).trim());
            }
          }

          if (dataLines.length) {
            const dataStr = dataLines.join("\n");
            const parsed = JSON.parse(dataStr);
            handleEvent(currentEvent, parsed);
          }
        }
      }

      if (failures.length) {
        const overloaded = failures.some(
          (f) => f.status === 503 || f.kind === "MODEL_OVERLOADED"
        );
        const retryHint = overloaded
          ? `\n\nThe AI provider is temporarily overloaded. Please retry in a few seconds.`
          : "";
        const details = failures
          .map((f) => `- ${f.serviceName}: ${f.message}`)
          .join("\n");

        alert(
          `Generated code for ${templates.length}/${services.length} services.\n\nFailed services:\n${details}${retryHint}`
        );
      }
    } catch (error) {
      console.error("Error generating code:", error);
      alert("Failed to generate code. Please try again.");
    } finally {
      setIsGeneratingCode(false);
      fetchTokenQuota();
    }
  };

  const handleRegenerateCode = async () => {
    if (!architecture) return;
    const ok = window.confirm(
      "Regenerate boilerplate for all services? This will overwrite the current generated code."
    );
    if (!ok) return;
    // Clear current view immediately, then regenerate (DB will be upserted too)
    setCodeTemplates([]);
    await handleGenerateCode();
  };

  const handleExport = async (currentArchitecture?: ArchitectureBlueprint) => {
    const archToExport = currentArchitecture || architecture;
    if (!archToExport) return;

    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Include cookies
        body: JSON.stringify({ architecture: archToExport, codeTemplates }),
      });

      if (!response.ok) throw new Error("Failed to export project");

      const data = await response.json();

      // Download as JSON
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `helix-${archToExport.id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting project:", error);
      alert("Failed to export project. Please try again.");
    }
  };

  const contentToString = (content: string | object): string => {
    console.log("contentToString", typeof content, content);
    if (typeof content === "string") {
      return content;
    }
    if (typeof content === "object" && content !== null) {
      return JSON.stringify(content, null, 2);
    }
    return String(content);
  };

  const handleCopyCode = (code: string | object, id: string) => {
    const codeString = contentToString(code);
    navigator.clipboard.writeText(codeString);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const toggleServiceCollapse = (serviceName: string) => {
    setCollapsedServices((prev) => ({
      ...prev,
      [serviceName]: !prev[serviceName],
    }));
  };

  const toggleFileCollapse = (serviceName: string, filename: string) => {
    const key = `${serviceName}::${filename}`;
    setCollapsedFiles((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const getBoilerplateText = () => {
    if (codeTemplates.length === 0) return "";
    let out = "";
    codeTemplates.forEach((template) => {
      out += `\n--- SERVICE: ${template.service_name} ---\n`;
      Object.entries(template.files || {}).forEach(([filename, content]) => {
        out += `\n>>> FILE: ${filename}\n${contentToString(content)}\n`;
      });
    });
    return out.trim() + "\n";
  };

  const handleExportBoilerplate = async () => {
    if (codeTemplates.length === 0) return;

    try {
      const response = await fetch("/api/export-boilerplate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          architectureId: architectureId,
          codeTemplates, // fallback if architectureId is null
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to export boilerplate");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `helix-boilerplate-${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export boilerplate error:", e);
      alert("Failed to export boilerplate zip. Please try again.");
    }
  };

  const handleCopyAllBoilerplate = () => {
    const exportContent = getBoilerplateText();
    if (!exportContent) return;
    handleCopyCode(exportContent, "all-boilerplate");
  };

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      {/* Animated background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur-lg opacity-50"></div>
              </div>
              <div>
                <h1 className="text-3xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Helix
                </h1>
                <p className="text-xs text-slate-400 -mt-0.5">
                  System Design Autopilot
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-6 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-400" />
                  <span>AI-Powered</span>
                </div>
              </div>
              {currentUser && tokenQuota && (
                <div className="flex items-center">
                  <Button
                    title={"You can buy more tokens by supporting the project."}
                    variant="outline"
                    size="sm"
                    className={`border-slate-700 ${
                      tokenQuota?.tokensLeft <= 0
                        ? "text-red-600 hover:text-red-300 hover:border-red-500/50"
                        : "text-slate-400"
                    } px-3 py-1 text-xs font-bold`}
                    onClick={() => router.push("/support-my-work")}
                  >
                    <Coins className="w-4 h-4 mr-2" />
                    {tokenQuota.tokensLeft.toLocaleString()} Tokens left
                  </Button>
                </div>
              )}
              <div className="flex items-center">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-700 text-yellow-200 hover:text-yellow-300 hover:border-yellow-500/50"
                  onClick={() => router.push("/support-my-work")}
                >
                  <Star className="w-4 h-4 mr-2" />
                  Contribute
                </Button>
              </div>
              {/* User Info & Logout */}
              {currentUser && (
                <div className="flex items-center gap-3">
                  <div className="hidden md:flex items-center gap-2 text-sm text-slate-400">
                    <User className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-300">
                      {currentUser.name || currentUser.email}
                    </span>
                  </div>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    size="sm"
                    className="border-slate-700 hover:border-red-500/50 hover:bg-red-500/10 text-slate-300 hover:text-red-200"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Logout</span>
                  </Button>
                </div>
              )}

              {/* Architecture Actions */}
              {/* {architecture && (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleSimulate}
                    disabled={!architecture || isSimulating}
                    variant="outline"
                    size="sm"
                    className="border-slate-700 hover:border-blue-500/50 hover:bg-blue-500/10 text-slate-300 hover:text-blue-200"
                  >
                    {isSimulating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Simulating...
                      </>
                    ) : (
                      <>
                        <Activity className="w-4 h-4 mr-2" />
                        Simulate
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleGenerateCode}
                    disabled={!architecture || isGeneratingCode}
                    variant="outline"
                    size="sm"
                    className="border-slate-700 hover:border-purple-500/50 hover:bg-purple-500/10 text-slate-300 hover:text-purple-200"
                  >
                    {isGeneratingCode ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Code className="w-4 h-4 mr-2" />
                        Generate Code
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleExport}
                    disabled={!architecture}
                    variant="outline"
                    size="sm"
                    className="border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-500/10 text-slate-300 hover:text-emerald-200"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>

                  <div className="flex items-center gap-3 ml-2 pl-3 border-l border-slate-800">
                    <div className="text-xs text-slate-500">
                      <span className="text-slate-300 font-semibold">
                        {architecture.services.length}
                      </span>{" "}
                      Services
                    </div>
                    <div className="text-xs text-slate-500">
                      <span className="text-slate-300 font-semibold">
                        {architecture.connections.length}
                      </span>{" "}
                      Connections
                    </div>
                  </div>
                </div>
              )} */}
            </div>
          </div>
        </div>
      </header>

      <main className="relative container mx-auto px-1 py-2 flex-1 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 h-full overflow-hidden">
          <div className="md:col-span-4 lg:col-span-3 flex flex-col min-h-0 max-h-full">
            <div className="space-y-6 overflow-y-auto custom-scrollbar pr-2 flex-1 min-h-0">
              {/* Past Projects Section */}
              {(isLoadingPastProjects || pastProjects.length > 0) && (
                <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl shadow-2xl">
                  <CardHeader className="pb-3">
                    <button
                      onClick={() => setIsPastProjectsOpen(!isPastProjectsOpen)}
                      className="w-full flex items-center justify-between gap-2 hover:opacity-80 transition-opacity"
                    >
                      <div className="flex items-center gap-2">
                        <FolderOpen className="w-4 h-4 text-blue-400 transition-transform duration-300" />
                        <CardTitle className="text-sm text-slate-100">
                          Past Projects
                        </CardTitle>
                        <span className="text-xs text-slate-400">
                          ({isLoadingPastProjects ? "…" : pastProjects.length})
                        </span>
                      </div>
                      <div className="transition-transform duration-300 ease-in-out">
                        {isPastProjectsOpen ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </button>
                  </CardHeader>
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isPastProjectsOpen
                        ? "max-h-[600px] opacity-100"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    <CardContent
                      className={`space-y-2 pt-0 ${
                        pastProjects.length > 2
                          ? "overflow-y-auto max-h-[140px]"
                          : ""
                      }`}
                    >
                      {isLoadingPastProjects ? (
                        <div className="flex items-center justify-center gap-2 py-4 text-xs text-slate-500">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Loading past projects...
                        </div>
                      ) : (
                        pastProjects.map((project) => {
                          const formatDate = (dateString: string) => {
                            const date = new Date(dateString);
                            const now = new Date();
                            const diffMs = now.getTime() - date.getTime();
                            const diffDays = Math.floor(
                              diffMs / (1000 * 60 * 60 * 24)
                            );

                            if (diffDays === 0) return "Today";
                            if (diffDays === 1) return "Yesterday";
                            if (diffDays < 7) return `${diffDays} days ago`;
                            if (diffDays < 30)
                              return `${Math.floor(diffDays / 7)} weeks ago`;
                            if (diffDays < 365)
                              return `${Math.floor(diffDays / 30)} months ago`;
                            return date.toLocaleDateString();
                          };

                          return (
                            <button
                              key={project.id}
                              onClick={() => handleLoadArchitecture(project)}
                              className="w-full flex flex-col gap-1 p-3 rounded-lg border border-slate-800 bg-slate-950/50 hover:bg-blue-500/10 hover:border-blue-500/50 cursor-pointer transition-all group text-left"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-xs font-medium text-slate-200 line-clamp-2 flex-1">
                                  {project.prompt ||
                                    project.summary ||
                                    "Untitled Project"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                <Clock className="w-3 h-3" />
                                <span>{formatDate(project.updated_at)}</span>
                                <span className="ml-auto">
                                  {project.services.length} services
                                </span>{" "}
                                <span className="ml-auto">
                                  {project.connections.length} connections
                                </span>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </CardContent>
                  </div>
                </Card>
              )}

              <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl shadow-2xl ">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <MessageSquare className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-sm text-slate-100">
                        AI System Architect
                      </CardTitle>
                      <CardDescription className="text-slate-400 text-xs">
                        Chat to generate blueprints or request evaluations
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wider text-slate-500">
                    Mode
                  </span>
                  <select
                    value={chatMode}
                    onChange={(event) =>
                      setChatMode(event.target.value as ChatMode)
                    }
                    className="flex-1 bg-slate-950/70 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40"
                  >
                    <option value="generate">Generate architecture</option>
                    <option value="evaluate">Evaluate current design</option>
                  </select>
                </div> */}
                  <div
                    ref={chatListRef}
                    className="h-40 overflow-y-auto space-y-3 pr-2"
                  >
                    {messages.length ? (
                      messages.map((msg) => {
                        const isAssistant = msg.role === "assistant";
                        return (
                          <div
                            key={msg.id}
                            className={`rounded-xl border px-3 py-2 text-sm whitespace-pre-wrap ${
                              isAssistant
                                ? "bg-slate-900/80 border-slate-800 text-slate-200"
                                : "bg-blue-500/10 border-blue-500/30 text-blue-100"
                            }`}
                          >
                            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider mb-1 text-slate-500">
                              <span>{isAssistant ? "Helix AI" : "You"}</span>
                              <span>
                                {msg.mode === "generate" && !isAssistant
                                  ? "Generate"
                                  : msg.mode === "evaluate" && isAssistant
                                  ? "Evaluate"
                                  : "Cuurent Contex"}
                              </span>
                            </div>
                            <p className="leading-relaxed whitespace-pre-wrap">
                              {msg.content}
                            </p>
                            <div className="mt-2 text-[10px] text-slate-500">
                              {new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="rounded-sm border border-slate-800 bg-slate-950/70 p-2 text-sm text-slate-500">
                        Describe the platform you want to build to generate a
                        fresh design, or to iterate on an existing architecture.
                      </div>
                    )}
                    {isChatting && (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Thinking...
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <form
                    onSubmit={handleChatSubmit}
                    className="w-full space-y-3"
                  >
                    <div className="relative">
                      <Textarea
                        value={chatInput}
                        onChange={(event) => setChatInput(event.target.value)}
                        rows={3}
                        placeholder={
                          tokenQuota && tokenQuota.tokensLeft <= 0
                            ? "Token limit reached. Please support the project to continue..."
                            : chatMode === "generate"
                            ? "Describe the system you need..."
                            : "Ask for feedback, risks, or improvements..."
                        }
                        disabled={
                          isChatting ||
                          (tokenQuota ? tokenQuota.tokensLeft <= 0 : false)
                        }
                        className={`bg-slate-950/60 border-slate-800 text-slate-200 placeholder:text-slate-600 focus:border-blue-500/50 focus:ring-blue-500/20 resize-none ${
                          tokenQuota && tokenQuota.tokensLeft <= 0
                            ? "cursor-not-allowed opacity-50"
                            : ""
                        }`}
                        title={
                          tokenQuota && tokenQuota.tokensLeft <= 0
                            ? "You have reached token limit. Please support the project to continue."
                            : undefined
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Shift + Enter for newline</span>
                      <Button
                        type="submit"
                        disabled={
                          isChatting ||
                          !chatInput.trim() ||
                          (tokenQuota ? tokenQuota.tokensLeft <= 0 : false)
                        }
                        className="bg-blue-600 hover:bg-blue-500 text-white"
                        title={
                          tokenQuota && tokenQuota.tokensLeft <= 0
                            ? "You have reached token limit. Please support the project to continue."
                            : undefined
                        }
                      >
                        {isChatting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Send
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardFooter>
              </Card>
            </div>
          </div>

          {/* Right Section - Visualization */}
          <div className="md:col-span-8 lg:col-span-9 min-h-0">
            <Tabs defaultValue="design" className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <TabsList className="bg-slate-900/50 border border-slate-800">
                  <TabsTrigger
                    value="design"
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  >
                    Design
                  </TabsTrigger>
                  <TabsTrigger
                    value="code"
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  >
                    Generated Code
                  </TabsTrigger>
                  <TabsTrigger
                    value="simulation"
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  >
                    Simulation & Cost
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 min-h-0 overflow-hidden">
                <TabsContent value="design" className="h-full mt-0">
                  <Card className="border-slate-800/50 bg-slate-900/30 backdrop-blur-xl shadow-2xl h-full relative">
                    <CardContent className="h-[calc(100vh-8rem)] px-0 pb-0 pt-0">
                      <div className="flex h-full flex-col">
                        <div className="flex-1 overflow-hidden rounded-2xl border border-slate-800/60 bg-slate-950/60">
                          <DiagramEditorWrapper
                            architecture={architecture}
                            componentLibrary={componentLibrary}
                            onSave={handleWhiteboardSave}
                            onSimulate={handleSimulate}
                            onGenerateCode={handleGenerateCode}
                            onExport={handleExport}
                            isSimulating={isSimulating}
                            isGeneratingCode={isGeneratingCode}
                          />
                        </div>
                      </div>
                    </CardContent>
                    {isLoadingCodeTemplates && (
                      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-slate-950/50 backdrop-blur-sm border border-slate-800/50 rounded-lg">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                        <div className="text-sm text-slate-300">
                          Loading saved code templates...
                        </div>
                      </div>
                    )}
                  </Card>
                </TabsContent>

                <TabsContent
                  value="code"
                  className="h-full mt-0 overflow-hidden"
                >
                  <Card className="border-slate-800/50 bg-slate-900/30 backdrop-blur-xl shadow-2xl h-full relative">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <CardTitle className="text-slate-100 flex items-center gap-2">
                            Generated Code Templates
                          </CardTitle>
                        </div>

                        <div className="flex items-center gap-2">
                          {codeTemplates.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleRegenerateCode}
                              disabled={
                                !architecture ||
                                isGeneratingCode ||
                                (tokenQuota
                                  ? tokenQuota.tokensLeft <= 0
                                  : false)
                              }
                              className={`border-slate-700 hover:bg-slate-800 ${
                                tokenQuota && tokenQuota.tokensLeft <= 0
                                  ? "cursor-not-allowed opacity-50"
                                  : ""
                              }`}
                            >
                              {isGeneratingCode ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Regenerating...
                                </>
                              ) : (
                                <>
                                  <Activity className="w-4 h-4 mr-2" />
                                  Regenerate
                                </>
                              )}
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopyAllBoilerplate}
                            disabled={codeTemplates.length === 0}
                            className="border-slate-700 hover:bg-slate-800"
                            title="Copy all generated boilerplate"
                          >
                            {copiedCode === "all-boilerplate" ? (
                              <Check className="w-4 h-4 mr-2 text-green-400" />
                            ) : (
                              <Copy className="w-4 h-4 mr-2" />
                            )}
                            Copy all
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportBoilerplate}
                            disabled={codeTemplates.length === 0}
                            className="border-slate-700 hover:bg-slate-800"
                            title="Export all generated boilerplate"
                          >
                            <FileCode className="w-4 h-4 mr-2" />
                            Export
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="h-[calc(100vh-14rem)] overflow-y-auto custom-scrollbar">
                      {codeTemplates.length > 0 ? (
                        <div className="space-y-8">
                          {codeTemplates.map((template, idx) => (
                            <div key={idx} className="space-y-4">
                              <button
                                type="button"
                                onClick={() =>
                                  toggleServiceCollapse(template.service_name)
                                }
                                className="w-full flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/40 px-4 py-3 hover:bg-slate-950/60 transition-colors"
                                title="Collapse/Expand"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <Server className="w-4 h-4 text-blue-400 shrink-0" />
                                  <span className="text-lg font-semibold text-blue-400 truncate">
                                    {template.service_name}
                                  </span>
                                  <span className="text-xs text-slate-500">
                                    ({Object.keys(template.files || {}).length}{" "}
                                    files)
                                  </span>
                                </div>
                                {collapsedServices[template.service_name] ? (
                                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                                ) : (
                                  <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                                )}
                              </button>

                              {!collapsedServices[template.service_name] && (
                                <div className="grid gap-4">
                                  {Object.entries(template.files || {}).map(
                                    ([filename, content]) => {
                                      const fileKey = `${template.service_name}::${filename}`;
                                      const isCollapsed =
                                        !!collapsedFiles[fileKey];
                                      return (
                                        <div
                                          key={filename}
                                          className="rounded-lg border border-slate-800 bg-slate-950/50 overflow-hidden"
                                        >
                                          <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
                                            <button
                                              type="button"
                                              onClick={() =>
                                                toggleFileCollapse(
                                                  template.service_name,
                                                  filename
                                                )
                                              }
                                              className="flex items-center gap-2 min-w-0 text-left hover:opacity-90 transition-opacity"
                                              title="Collapse/Expand file"
                                            >
                                              {isCollapsed ? (
                                                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                                              ) : (
                                                <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                                              )}
                                              <span className="text-xs font-mono text-slate-400 truncate">
                                                {filename}
                                              </span>
                                            </button>

                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleCopyCode(
                                                  content,
                                                  `${idx}-${filename}`
                                                );
                                              }}
                                              className="text-slate-500 hover:text-white transition-colors"
                                              title="Copy code"
                                            >
                                              {copiedCode ===
                                              `${idx}-${filename}` ? (
                                                <Check className="w-3.5 h-3.5 text-green-400" />
                                              ) : (
                                                <Copy className="w-3.5 h-3.5" />
                                              )}
                                            </button>
                                          </div>

                                          {!isCollapsed && (
                                            <pre className="p-4 overflow-x-auto text-sm text-slate-300 font-mono">
                                              <code>
                                                {contentToString(content)}
                                              </code>
                                            </pre>
                                          )}
                                        </div>
                                      );
                                    }
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500">
                          <Code className="w-12 h-12 mb-4 opacity-50" />
                          <p>No code generated yet.</p>
                          <Button
                            variant="outline"
                            onClick={handleGenerateCode}
                            disabled={
                              !architecture ||
                              isGeneratingCode ||
                              (tokenQuota ? tokenQuota.tokensLeft <= 0 : false)
                            }
                            className="mt-4 border-slate-700 hover:bg-slate-800"
                            title={
                              tokenQuota && tokenQuota.tokensLeft <= 0
                                ? "You have reached token limit. Please support the project to continue."
                                : undefined
                            }
                          >
                            {isGeneratingCode
                              ? "Generating..."
                              : "Generate Code Now"}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                    {isLoadingCodeTemplates && (
                      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-slate-950/50 backdrop-blur-sm border border-slate-800/50 rounded-lg">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                        <div className="text-sm text-slate-300">
                          Loading saved code templates...
                        </div>
                      </div>
                    )}
                  </Card>
                </TabsContent>

                <TabsContent
                  value="simulation"
                  className="h-full mt-0 overflow-hidden"
                >
                  <Card className="border-slate-800/50 bg-slate-900/30 backdrop-blur-xl shadow-2xl h-full overflow-hidden flex flex-col relative">
                    <CardHeader>
                      <CardTitle className="text-slate-100 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-400" /> System
                        Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto custom-scrollbar space-y-6">
                      {/* Cost Estimation */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="border-slate-800/50 bg-slate-950/50">
                          <CardHeader>
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-5 h-5 text-emerald-400" />
                              <CardTitle className="text-base text-slate-200">
                                Cost Estimation
                              </CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {(() => {
                              const cost =
                                architecture?.estimated_cost ||
                                (architecture
                                  ? estimateCost(architecture)
                                  : null);

                              return cost ? (
                                <div className="space-y-6">
                                  <div>
                                    <p className="text-sm text-slate-400 mb-1">
                                      Monthly Cost
                                    </p>
                                    <div className="flex items-baseline gap-2">
                                      <p className="text-4xl font-bold text-emerald-400">
                                        ${cost.monthly_cost.toLocaleString()}
                                      </p>
                                      <span className="text-slate-500">
                                        /mo
                                      </span>
                                    </div>
                                  </div>
                                  <div className="space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                      <span className="text-slate-400">
                                        Compute
                                      </span>
                                      <span className="text-slate-200">
                                        ${cost.breakdown.compute}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                      <span className="text-slate-400">
                                        Storage
                                      </span>
                                      <span className="text-slate-200">
                                        ${cost.breakdown.storage}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                      <span className="text-slate-400">
                                        Network
                                      </span>
                                      <span className="text-slate-200">
                                        ${cost.breakdown.network}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center py-8 text-slate-500">
                                  No cost data available.
                                </div>
                              );
                            })()}
                          </CardContent>
                        </Card>

                        <Card className="border-slate-800/50 bg-slate-950/50">
                          <CardHeader>
                            <div className="flex items-center gap-2">
                              <Activity className="w-5 h-5 text-blue-400" />
                              <CardTitle className="text-base text-slate-200">
                                Load Simulation
                              </CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {scalabilityMetrics ? (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-xs text-slate-500">
                                      Max RPS
                                    </p>
                                    <p className="text-xl font-bold text-blue-400">
                                      {scalabilityMetrics.max_rps.toLocaleString()}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-slate-500">
                                      Avg Latency
                                    </p>
                                    <p className="text-xl font-bold text-blue-400">
                                      {scalabilityMetrics.avg_latency_ms}ms
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-8 text-slate-500">
                                <p>Run simulation to see metrics.</p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleSimulate}
                                  disabled={!architecture || isSimulating}
                                  className="mt-4 border-slate-700 hover:bg-slate-800 hover:text-slate-200"
                                >
                                  {isSimulating
                                    ? "Simulating..."
                                    : "Run Simulation"}
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>

                      {/* Graph */}
                      <Card className="border-slate-800/50 bg-slate-950/50">
                        <CardHeader>
                          <CardTitle className="text-base text-slate-200">
                            Performance Graph
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-[300px] w-full bg-white rounded-lg p-2 overflow-hidden">
                            <LoadSimulationChart metrics={scalabilityMetrics} />
                          </div>
                        </CardContent>
                      </Card>
                    </CardContent>
                    {isLoadingCodeTemplates && (
                      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-slate-950/50 backdrop-blur-sm border border-slate-800/50 rounded-lg">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                        <div className="text-sm text-slate-300">
                          Loading saved code templates...
                        </div>
                      </div>
                    )}
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}

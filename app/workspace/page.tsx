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
import { Textarea } from "@/components/ui/textarea";
import {
  ArchitectureBlueprint,
  ScalabilityMetrics,
  CodeTemplate,
} from "@/lib/types";
import {
  Loader2,
  Download,
  Code,
  Activity,
  DollarSign,
  Sparkles,
  Zap,
  Database,
  Globe,
  Server,
  Box,
  Network,
  MessageSquare,
  Send,
  Brush,
} from "lucide-react";
import { ArchitectureWhiteboard } from "@/components/ArchitectureWhiteboard";

type ChatMode = "generate" | "evaluate";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  mode: ChatMode;
  timestamp: string;
};

export default function Home() {
  const [architecture, setArchitecture] =
    useState<ArchitectureBlueprint | null>(null);
  const [, setScalabilityMetrics] = useState<ScalabilityMetrics | null>(null);
  const [codeTemplates, setCodeTemplates] = useState<CodeTemplate[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatMode, setChatMode] = useState<ChatMode>("generate");
  const [isChatting, setIsChatting] = useState(false);
  const chatListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatListRef.current) {
      chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
    }
  }, [messages]);
  const handleWhiteboardSave = (updated: ArchitectureBlueprint) => {
    setArchitecture(updated);
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

    setMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setIsChatting(true);

    try {
      if (chatMode === "generate") {
        const response = await fetch("/api/design", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: message }),
        });

        if (!response.ok) {
          throw new Error("Failed to generate architecture");
        }

        const data: ArchitectureBlueprint = await response.json();
        setArchitecture(data);
        setScalabilityMetrics(null);
        setCodeTemplates([]);

        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            mode: "generate",
            content: `Generated a new architecture with ${data.services.length} components.\n\n${data.summary}`,
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
          body: JSON.stringify({ message, architecture }),
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
    }
  };

  const handleSimulate = async () => {
    if (!architecture) return;

    setIsSimulating(true);
    try {
      const response = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

      for (const service of services) {
        const response = await fetch("/api/generate-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            serviceName: service.name,
            serviceType: service.type,
            technology: service.technology,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          templates.push(data);
        }
      }

      setCodeTemplates(templates);
    } catch (error) {
      console.error("Error generating code:", error);
      alert("Failed to generate code. Please try again.");
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleExport = async () => {
    if (!architecture) return;

    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ architecture, codeTemplates }),
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
      a.download = `helix-${architecture.id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting project:", error);
      alert("Failed to export project. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
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
                <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-2.5 rounded-xl">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
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
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-purple-400" />
                  <span>Cloud-Ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative container mx-auto px-1 py-2">
        <div className="grid lg:grid-cols-12 gap-2">
          <div className="lg:col-span-3 space-y-6">
            <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl shadow-2xl">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-slate-100">
                      AI System Architect
                    </CardTitle>
                    <CardDescription className="text-slate-400 text-sm">
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
                  className="h-72 overflow-y-auto space-y-3 pr-2"
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
                              {msg.mode === "generate"
                                ? "Generate"
                                : "Evaluate"}
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
                    <div className="rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-6 text-sm text-slate-500">
                      Describe the platform you want to build to generate a
                      fresh design, or switch to{" "}
                      <span className="text-slate-300">Evaluate</span> mode to
                      get architecture suggestions.
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
                <form onSubmit={handleChatSubmit} className="w-full space-y-3">
                  <Textarea
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    rows={3}
                    placeholder={
                      chatMode === "generate"
                        ? "Describe the system you need..."
                        : "Ask for feedback, risks, or improvements..."
                    }
                    disabled={isChatting}
                    className="bg-slate-950/60 border-slate-800 text-slate-200 placeholder:text-slate-600 focus:border-blue-500/50 focus:ring-blue-500/20 resize-none"
                  />
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Shift + Enter for newline</span>
                    <Button
                      type="submit"
                      disabled={isChatting || !chatInput.trim()}
                      className="bg-blue-600 hover:bg-blue-500 text-white"
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

            <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl shadow-2xl">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Activity className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-slate-100">
                      Architecture Actions
                    </CardTitle>
                    <CardDescription className="text-slate-400 text-sm">
                      Run simulations, generate code, or export artifacts
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={handleSimulate}
                  disabled={!architecture || isSimulating}
                  variant="outline"
                  className="w-full border-slate-700 hover:border-blue-500/50 hover:bg-blue-500/10 text-slate-300 hover:text-blue-200"
                >
                  {isSimulating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Simulating...
                    </>
                  ) : (
                    <>
                      <Activity className="w-4 h-4 mr-2" />
                      Simulate Load
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleGenerateCode}
                  disabled={!architecture || isGeneratingCode}
                  variant="outline"
                  className="w-full border-slate-700 hover:border-purple-500/50 hover:bg-purple-500/10 text-slate-300 hover:text-purple-200"
                >
                  {isGeneratingCode ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating Code...
                    </>
                  ) : (
                    <>
                      <Code className="w-4 h-4 mr-2" />
                      Generate Boilerplate
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleExport}
                  disabled={!architecture}
                  variant="outline"
                  className="w-full border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-500/10 text-slate-300 hover:text-emerald-200"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Workspace
                </Button>

                {architecture && (
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800">
                    <div className="rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2 text-center">
                      <p className="text-xs text-slate-500 uppercase tracking-wide">
                        Services
                      </p>
                      <p className="text-lg font-semibold text-slate-200">
                        {architecture.services.length}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2 text-center">
                      <p className="text-xs text-slate-500 uppercase tracking-wide">
                        Connections
                      </p>
                      <p className="text-lg font-semibold text-slate-200">
                        {architecture.connections.length}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {architecture?.estimated_cost && (
              <Card className="border-slate-800/50 bg-gradient-to-br from-emerald-950/30 to-slate-900/50 backdrop-blur-xl shadow-2xl">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                      <DollarSign className="w-5 h-5 text-emerald-400" />
                    </div>
                    <CardTitle className="text-xl text-slate-100">
                      Cost Overview
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <p className="text-sm text-slate-400 mb-1">
                        Monthly Cost
                      </p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-5xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
                          ${architecture.estimated_cost.monthly_cost}
                        </p>
                        <span className="text-slate-500 text-lg">/mo</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 rounded-lg bg-slate-950/50 border border-slate-800/50">
                        <div className="flex items-center gap-2">
                          <Server className="w-4 h-4 text-blue-400" />
                          <span className="text-sm text-slate-300">
                            Compute
                          </span>
                        </div>
                        <span className="font-semibold text-slate-200">
                          ${architecture.estimated_cost.breakdown.compute}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 rounded-lg bg-slate-950/50 border border-slate-800/50">
                        <div className="flex items-center gap-2">
                          <Database className="w-4 h-4 text-purple-400" />
                          <span className="text-sm text-slate-300">
                            Storage
                          </span>
                        </div>
                        <span className="font-semibold text-slate-200">
                          ${architecture.estimated_cost.breakdown.storage}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 rounded-lg bg-slate-950/50 border border-slate-800/50">
                        <div className="flex items-center gap-2">
                          <Network className="w-4 h-4 text-cyan-400" />
                          <span className="text-sm text-slate-300">
                            Network
                          </span>
                        </div>
                        <span className="font-semibold text-slate-200">
                          ${architecture.estimated_cost.breakdown.network}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 rounded-lg bg-slate-950/50 border border-slate-800/50">
                        <div className="flex items-center gap-2">
                          <Box className="w-4 h-4 text-amber-400" />
                          <span className="text-sm text-slate-300">
                            Additional
                          </span>
                        </div>
                        <span className="font-semibold text-slate-200">
                          ${architecture.estimated_cost.breakdown.additional}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Section - Visualization */}
          <div className="lg:col-span-9">
            <Card className="border-slate-800/50 bg-slate-900/30 backdrop-blur-xl shadow-2xl h-full">

              <CardContent className="min-h-[calc(100vh-12rem)] p-6">
                <div className="flex h-full flex-col">
                  <div className="mt-2 flex-1 overflow-hidden rounded-2xl border border-slate-800/60 bg-slate-950/60">
                    <ArchitectureWhiteboard
                      architecture={architecture}
                      onSave={handleWhiteboardSave}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  Sparkles,
  ShieldCheck,
  Users,
  Zap,
  Lock,
  KeyRound,
  Loader2,
  ArrowUpRight,
  ShieldHalf,
  Rocket,
  LineChart,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { EarlyAccessAnimation } from "./EarlyAccessAnimation";

type StatusState = {
  type: "idle" | "loading" | "success" | "error";
  message?: string;
};

const highlights = [
  {
    icon: ShieldCheck,
    title: "Enterprise-grade guardrails",
    description:
      "Policy-aware architecture synthesis that keeps compliance, privacy, and cost in balance.",
  },
  {
    icon: Zap,
    title: "Scenario simulation",
    description:
      "Preview resilience under peak loads with AI-generated traffic models and stress tests.",
  },
  {
    icon: Users,
    title: "Collaborative workflows",
    description:
      "Invite stakeholders to co-design with real-time insights, annotations, and approval flows.",
  },
];

const metrics = [
  {
    icon: Rocket,
    value: "6× faster",
    label: "Blueprint delivery cycles",
  },
  {
    icon: ShieldHalf,
    value: "100%",
    label: "Governance guardrail coverage",
  },
  {
    icon: LineChart,
    value: "30% less",
    label: "Projected cloud spend",
  },
];

const companies = [
  "HyperArc",
  "NimbusX",
  "Stratus Labs",
  "Vertex Cloud",
  "Polyflow",
];

export function EarlyAccessLanding() {
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<StatusState>({
    type: "idle",
  });
  const [passcode, setPasscode] = useState("");
  const [unlockStatus, setUnlockStatus] = useState<StatusState>({
    type: "idle",
  });

  const handleJoinWaitlist = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!email.trim()) {
      setEmailStatus({
        type: "error",
        message: "Add your work email so we know where to send updates.",
      });
      return;
    }

    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(email.trim())) {
      setEmailStatus({
        type: "error",
        message: "That email doesn't look quite right. Try again?",
      });
      return;
    }

    setEmailStatus({
      type: "loading",
      message: "Saving your spot in the queue…",
    });

    try {
      const response = await fetch("/api/early-access/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          source: "landing-waitlist",
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "We couldn't save your request.");
      }

      const data: { alreadyRegistered?: boolean } = await response
        .json()
        .catch(() => ({}));

      setEmailStatus({
        type: "success",
        message: data.alreadyRegistered
          ? "You’re already in! We’ll keep you posted on the next cohort."
          : "You're on the list! We'll reach out with access windows soon.",
      });
      setEmail("");
    } catch (error) {
      setEmailStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Something went wrong while saving. Try again?",
      });
    }
  };

  const handleUnlock = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!passcode.trim()) {
      setUnlockStatus({
        type: "error",
        message: "Ask the Helix team for a beta passcode to continue.",
      });
      return;
    }

    try {
      setUnlockStatus({ type: "loading", message: "Verifying passcode…" });

      const response = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: passcode.trim() }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(
          data?.error || "That passcode didn't match our records."
        );
      }

      setUnlockStatus({
        type: "success",
        message: "Access granted. Redirecting you to the Helix workspace…",
      });
      setPasscode("");

      setTimeout(() => {
        window.location.href = "/workspace";
      }, 650);
    } catch (error) {
      setUnlockStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "We couldn't validate the passcode. Try again?",
      });
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-56 left-1/2 h-[540px] w-[540px] -translate-x-1/2 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -bottom-48 left-12 h-[460px] w-[460px] rounded-full bg-purple-500/15 blur-3xl" />
        <div className="absolute top-1/3 right-0 h-[520px] w-[520px] translate-x-[35%] rounded-full bg-cyan-500/10 blur-[220px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.18)_0,_rgba(15,23,42,0.05)_35%,rgba(2,6,23,0.92)_70%)]" />
      </div>

      <header className="relative z-20 border-b border-white/5 bg-slate-950/60 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-sky-500 to-purple-600 text-lg font-bold text-white shadow-lg shadow-blue-500/30">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
                Helix Early Access
              </p>
              <h1 className="text-2xl font-semibold text-white">
                Project Helix
              </h1>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3 text-sm text-slate-400">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
              <Lock className="h-4 w-4 text-slate-200" />
              Private beta
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
              <ShieldCheck className="h-4 w-4 text-slate-200" />
              Secure by design
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-20">
        <div className="container mx-auto px-6 py-16">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.18fr)_minmax(0,1fr)]">
            <div className="space-y-10">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/40 bg-blue-500/10 px-4 py-1 text-sm font-medium text-blue-200 shadow-lg shadow-blue-500/20">
                  <Sparkles className="h-4 w-4" />
                  AI system design autopilot
                </div>

                <h2 className="max-w-2xl text-balance text-4xl font-semibold leading-tight text-white sm:text-5xl">
                  Design resilient cloud architectures with a co-pilot that
                  thinks in{" "}
                  <span className="bg-gradient-to-r from-blue-300 via-sky-200 to-purple-300 bg-clip-text text-transparent">
                    systems-first 3D
                  </span>
                  .
                </h2>

                <p className="max-w-2xl text-lg text-slate-300">
                  Helix turns natural language strategy into validated system
                  blueprints, load simulations, and production-ready
                  boilerplate. Early access members co-create the product and
                  unlock hands-on sessions with the Helix architecture team.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {metrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="group relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-white/[0.08] via-white/[0.02] to-white/[0.01] p-6 shadow-lg shadow-slate-900/30 backdrop-blur-xl"
                  >
                    <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-blue-500/10 blur-2xl transition-transform duration-500 group-hover:scale-125" />
                    <metric.icon className="h-5 w-5 text-sky-300" />
                    <p className="mt-4 text-3xl font-semibold text-white">
                      {metric.value}
                    </p>
                    <p className="text-sm text-slate-400">{metric.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                {highlights.map((feature) => (
                  <div
                    key={feature.title}
                    className="group relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-white/[0.01] p-6 shadow-lg shadow-slate-900/40 backdrop-blur-xl"
                  >
                    <div className="absolute -left-12 -top-12 h-32 w-32 rounded-full bg-blue-500/10 blur-2xl transition-transform duration-500 group-hover:translate-x-4 group-hover:translate-y-4" />
                    <div className="flex items-center gap-3">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl">
                        <feature.icon className="h-6 w-6" />
                      </span>
                      <h3 className="text-base font-semibold text-white">
                        {feature.title}
                      </h3>
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-slate-300">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid gap-6 rounded-[32px] border border-white/10 bg-white/[0.05] p-8 shadow-2xl shadow-slate-900/40 backdrop-blur-2xl lg:grid-cols-2">
                <form onSubmit={handleJoinWaitlist} className="space-y-5">
                  <div className="space-y-2">
                    <label
                      htmlFor="email"
                      className="text-xs font-semibold uppercase tracking-wide text-slate-200"
                    >
                      Request an invite
                    </label>
                    <p className="text-xs text-slate-400">
                      We activate new partner teams every few weeks.
                    </p>
                  </div>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@company.com"
                    className="h-12 rounded-2xl border-white/10 bg-white/[0.08] text-sm text-white placeholder:text-slate-400"
                  />
                  <Button
                    type="submit"
                    disabled={emailStatus.type === "loading"}
                    className="h-12 w-full rounded-2xl bg-gradient-to-r from-sky-500 via-cyan-500 to-indigo-500 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:brightness-110"
                  >
                    {emailStatus.type === "loading" ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving…
                      </span>
                    ) : (
                      "Join the waitlist"
                    )}
                  </Button>
                  {emailStatus.type !== "idle" && (
                    <p
                      className={cn(
                        "text-xs font-medium",
                        emailStatus.type === "success"
                          ? "text-emerald-300"
                          : "text-amber-300"
                      )}
                    >
                      {emailStatus.message}
                    </p>
                  )}
                </form>

                <form onSubmit={handleUnlock} className="space-y-5">
                  <div className="space-y-2">
                    <label
                      htmlFor="passcode"
                      className="text-xs font-semibold uppercase tracking-wide text-slate-200"
                    >
                      Already invited?
                    </label>
                    <p className="text-xs text-slate-400">
                      Use your beta passcode to unlock the Helix workspace.
                    </p>
                  </div>
                  <div className="relative">
                    <Input
                      id="passcode"
                      value={passcode}
                      onChange={(event) => setPasscode(event.target.value)}
                      placeholder="Enter passcode"
                      className="h-12 rounded-2xl border-white/10 bg-white/[0.08] pr-12 text-sm text-white placeholder:text-slate-400"
                    />
                    <KeyRound className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                  <Button
                    type="submit"
                    disabled={unlockStatus.type === "loading"}
                    variant="secondary"
                    className="h-12 w-full rounded-2xl border border-white/10 bg-white/10 text-sm font-semibold text-white shadow-lg shadow-slate-900/40 hover:bg-white/20"
                  >
                    {unlockStatus.type === "loading" ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Checking…
                      </span>
                    ) : (
                      "Unlock Helix"
                    )}
                  </Button>
                  {unlockStatus.type !== "idle" && (
                    <p
                      className={cn(
                        "text-xs font-medium",
                        unlockStatus.type === "success"
                          ? "text-emerald-300"
                          : "text-amber-300"
                      )}
                    >
                      {unlockStatus.message}
                    </p>
                  )}
                </form>
              </div>

              <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                <span className="rounded-full border border-white/10 px-3 py-1">
                  SOC 2 Type II roadmap
                </span>
                <span className="rounded-full border border-white/10 px-3 py-1">
                  Multi-cloud ready
                </span>
                <span className="rounded-full border border-white/10 px-3 py-1">
                  <ShieldCheck className="mr-2 inline h-3.5 w-3.5" />
                  Zero-trust principles
                </span>
              </div>
            </div>

            <div className="relative">
              <div className="relative overflow-hidden rounded-[40px] border border-white/10 bg-gradient-to-br from-slate-900/85 via-slate-900/40 to-blue-900/50 p-10 shadow-[0_40px_140px_-30px_rgba(20,184,166,0.55)] backdrop-blur-2xl">
                <div className="absolute inset-0 rounded-[40px] border border-blue-400/10" />
                <div className="absolute inset-x-10 top-8 h-24 rounded-full bg-gradient-to-r from-blue-500/20 via-cyan-500/10 to-purple-500/20 blur-3xl" />
                <div className="relative">
                  <EarlyAccessAnimation />
                </div>
                <div className="mt-8 space-y-4 text-sm text-slate-200">
                  <div className="flex items-center gap-2 text-slate-100">
                    <Lock className="h-4 w-4 text-sky-300" />
                    Tier-aware execution graph
                  </div>
                  <p className="leading-relaxed text-slate-300">
                    Visualize how Helix orchestrates knowledge, services, and
                    guardrails to deliver enterprise-ready architectures from
                    day zero. Layered slices represent cognition, automation,
                    and governance working in sync.
                  </p>
                  <p className="text-xs text-slate-500">
                    Hover to explore dynamic beams and depth transitions crafted
                    for the early access experience.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-20 border-t border-white/5 bg-slate-950/60 py-10">
        <div className="container mx-auto flex flex-col items-start justify-between gap-6 px-6 text-xs text-slate-400 sm:flex-row">
          <p>© {new Date().getFullYear()} Helix Labs. All rights reserved.</p>
          <div className="flex flex-wrap gap-4">
            <span>helixlabs.vercel.app</span>
            <span>sayanmajumder0002@gmail.com</span>
            <span className="flex items-center gap-1 text-slate-300">
              <Sparkles className="h-3 w-3" />
              Private beta cohort
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default EarlyAccessLanding;

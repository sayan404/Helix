"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Coffee,
  Heart,
  Sparkles,
  ArrowLeft,
  Zap,
  Code,
  Rocket,
  Brain,
  Server,
  Database,
  Cloud,
  TrendingUp,
  Gift,
  Star,
  CheckCircle2,
  ArrowRight,
  DollarSign,
  Activity,
  Users,
} from "lucide-react";

export default function SupportMyWork() {
  const router = useRouter();
  const [animatedStats, setAnimatedStats] = useState({
    users: 0,
    architectures: 0,
    requests: 0,
  });

  useEffect(() => {
    // Animate numbers on mount
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;

    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      setAnimatedStats({
        users: Math.floor(1000 * progress),
        architectures: Math.floor(5000 * progress),
        requests: Math.floor(50000 * progress),
      });

      if (step >= steps) {
        clearInterval(timer);
        setAnimatedStats({ users: 1000, architectures: 5000, requests: 50000 });
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Enhanced animated background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute top-1/2 -left-40 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-0 right-1/4 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-1/4 left-1/3 w-72 h-72 bg-pink-500/15 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1.5s" }}
        ></div>

        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) translateX(0px);
            opacity: 0.2;
          }
          50% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.6;
          }
        }
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
        .shimmer {
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.1),
            transparent
          );
          background-size: 1000px 100%;
          animation: shimmer 3s infinite;
        }
      `}</style>

      <div className="relative z-10 container mx-auto px-4 py-8 md:py-12">
        {/* Header with animated icon */}
        <div className="text-center mb-4 md:mb-6">
          <div className="flex justify-center mb-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full blur-2xl opacity-60 group-hover:opacity-80 transition-opacity duration-300 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-blue-500/30 via-purple-500/30 to-pink-500/30 p-8 rounded-full border-2 border-white/10 backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                <Brain className="w-10 h-10 md:w-12 md:h-12 text-yellow-400 animate-pulse" />
              </div>
            </div>
          </div>

          <h1 className="text-2xl md:text-2xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse">
            Help Power the AI
          </h1>
          <p className="text-sm md:text-sm text-slate-300 max-w-2xl mx-auto">
            Your support keeps Helix running and helps cover AI infrastructure
            costs
          </p>
        </div>
        {/* Main Content Card */}
        <div className="max-w-4xl mx-auto">
          <Card className="border-slate-800/50 bg-slate-900 backdrop-blur-xl shadow-2xl overflow-hidden relative">
            {/* Shimmer effect */}
            <div className="absolute inset-0 shimmer pointer-events-none"></div>
            <CardContent className="space-y-6 relative z-10 mt-4 ">
              {/* Benefits Section */}
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700/50">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 justify-center">
                  <Gift className="w-5 h-5 text-yellow-400" />
                  What Your Support Unlocks
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      icon: Sparkles,
                      text: "More architectures generated",
                      color: "text-yellow-400",
                    },
                    {
                      icon: Zap,
                      text: "Faster responses",
                      color: "text-blue-400",
                    },
                    {
                      icon: Code,
                      text: "Advanced features & early updates",
                      color: "text-purple-400",
                    },
                    {
                      icon: Rocket,
                      text: "Early access to new AI models",
                      color: "text-pink-400",
                    },
                    {
                      icon: Star,
                      text: "Premium support & feature requests",
                      color: "text-amber-400",
                    },
                    {
                      icon: TrendingUp,
                      text: "Help scale infrastructure for all users",
                      color: "text-green-400",
                    },
                  ].map((benefit, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 bg-slate-950/50 rounded-lg hover:bg-slate-950/70 transition-all duration-300 group"
                    >
                      <benefit.icon
                        className={`w-5 h-5 ${benefit.color} group-hover:scale-110 transition-transform`}
                      />
                      <span className="text-slate-300 text-sm group-hover:text-white transition-colors">
                        {benefit.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Call to Action */}
              <div className="text-center space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button
                    asChild
                    size="lg"
                    className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 hover:from-yellow-600 hover:via-orange-600 hover:to-red-600 text-white font-semibold shadow-2xl hover:shadow-yellow-500/50 transition-all duration-300 hover:scale-105 text-lg px-8 py-6 group"
                  >
                    <a
                      href={
                        process.env.NEXT_PUBLIC_BUY_ME_A_COFFEE_URL ||
                        "https://buymeacoffee.com/sayan404"
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3"
                    >
                      <Coffee className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                      <span>Support with Coffee</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </a>
                  </Button>

                  <Button
                    onClick={() => router.push("/workspace")}
                    variant="outline"
                    size="lg"
                    className="border-slate-700 hover:border-blue-500/50 hover:bg-blue-500/10 text-slate-300 hover:text-blue-200 transition-all duration-300 hover:scale-105 text-lg px-8 py-6"
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to Workspace
                  </Button>
                </div>
              </div>

              {/* Footer Note */}
              <div className="border-t border-slate-800 text-center">
                <p className="text-sm text-slate-500 flex items-center justify-center gap-2">
                  <Heart className="w-4 h-4 text-red-400 animate-pulse" />
                  Thank you for supporting open-source AI development
                </p>
                <p className="text-xs text-slate-600 mt-2">
                  After supporting, send an email to sayanmajumder2002@gmail.com
                  to get more support.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

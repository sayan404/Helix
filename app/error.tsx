"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import * as Sentry from "@sentry/nextjs";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <Card className="max-w-2xl w-full border-red-500/50 bg-slate-900/50 backdrop-blur-xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <CardTitle className="text-red-400">
                Something went wrong
              </CardTitle>
              <CardDescription className="text-slate-400">
                An unexpected error occurred. Don't worry, we've been notified.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === "development" && (
            <div className="p-4 bg-slate-950/50 rounded-lg border border-slate-800">
              <p className="text-sm font-mono text-red-400 mb-2">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-slate-500">
                  Error ID: {error.digest}
                </p>
              )}
              {error.stack && (
                <pre className="text-xs text-slate-500 overflow-auto max-h-48 mt-2">
                  {error.stack}
                </pre>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={reset}
              className="flex-1 bg-blue-600 hover:bg-blue-500"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button
              onClick={() => (window.location.href = "/workspace")}
              variant="outline"
              className="flex-1 border-slate-700 hover:bg-slate-800"
            >
              <Home className="w-4 h-4 mr-2" />
              Go to Workspace
            </Button>
          </div>

          <p className="text-xs text-slate-500 text-center">
            If this problem persists, please contact support or try refreshing
            the page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

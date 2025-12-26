import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Home, Search } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <Card className="max-w-md w-full border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-500/10 rounded-full">
              <Search className="w-12 h-12 text-blue-400" />
            </div>
          </div>
          <CardTitle className="text-3xl text-slate-100">404</CardTitle>
          <CardDescription className="text-slate-400 text-base mt-2">
            Page Not Found
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-400 text-center">
            The page you're looking for doesn't exist or has been moved.
          </p>

          <div className="flex flex-col gap-3">
            <Button asChild className="w-full bg-blue-600 hover:bg-blue-500">
              <Link href="/workspace">
                <Home className="w-4 h-4 mr-2" />
                Go to Workspace
              </Link>
            </Button>
            <Button
              onClick={() => window.history.back()}
              variant="outline"
              className="w-full border-slate-700 hover:bg-slate-800"
            >
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

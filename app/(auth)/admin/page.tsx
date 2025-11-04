"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { signIn } from "@/lib/auth-client";

/**
 * Renders an admin login page with a form for email and password authentication.
 * Handles form submission and displays authentication errors.
 */
export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  /**
   * Handles the form submission event.
   * Prevents default form behavior and attempts to sign in using credentials.
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      // Attempts to sign in with email/password and redirects to /dashboard on success
      await signIn.email({
        email,
        password,
        callbackURL: "/dashboard",
      });
    } catch {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("An unknown error occurred.");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center overflow-hidden bg-gradient-radial from-gray-900/50 to-background p-4">
      <div className="mx-auto w-full max-w-md">
        <div className="overflow-hidden rounded-xl border border-white/10 bg-card/50 shadow-2xl shadow-black/30 backdrop-blur-xl">
          <div className="p-8 sm:p-12">
            <div className="flex flex-col items-center">
              <h2 className="mb-1 font-bold text-2xl text-foreground">
                Admin Access
              </h2>
              <p className="mb-6 text-muted-foreground">
                Enter your admin credentials to continue.
              </p>
            </div>
            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label
                  className="font-medium text-muted-foreground text-sm"
                  htmlFor="email"
                >
                  Email
                </label>
                <input
                  className="glassmorphic-input mt-2 w-full rounded-lg px-4 py-3 text-foreground placeholder-muted-foreground/50 transition-all duration-300 focus:border-primary focus:shadow-primary-glow focus:ring-2 focus:ring-primary"
                  id="email"
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@admin.com"
                  required
                  type="email"
                  value={email}
                />
              </div>
              <div>
                <label
                  className="font-medium text-muted-foreground text-sm"
                  htmlFor="password"
                >
                  Password
                </label>
                <input
                  className="glassmorphic-input mt-2 w-full rounded-lg px-4 py-3 text-foreground placeholder-muted-foreground/50 transition-all duration-300 focus:border-primary focus:shadow-primary-glow focus:ring-2 focus:ring-primary"
                  id="password"
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  type="password"
                  value={password}
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <Button
                className="h-auto w-full transform rounded-lg bg-primary py-3 font-semibold text-background transition-all duration-300 hover:scale-[1.02] hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background"
                type="submit"
              >
                Sign In as Admin
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

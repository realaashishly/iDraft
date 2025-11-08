"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { signIn } from "@/lib/auth-client";

/**
 * Renders a complete login page with options for email/password sign-in
 * and social sign-in (Google). Handles form submission state and errors.
 */
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  /**
   * Handles the email and password form submission.
   * Sets loading state, attempts to sign in, and manages errors.
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await signIn.email({
        email,
        password,
        callbackURL: "/dashboard",
      });

      if (result?.error) {
        // Display authentication errors from the server
        setError(result.error.message || "Invalid email or password.");
        setIsSubmitting(false);
      } else {
        // On success, navigate to the dashboard
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      // Catch unexpected client-side errors
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
      setIsSubmitting(false);
    }
  };

  /**
   * Handles the Google social sign-in flow.
   */
  const handleGoogleSignIn = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      // This will initiate the redirect-based social sign-in flow
      await signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });
      // No need to set isSubmitting(false) as the page will redirect
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to sign in with Google.");
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center overflow-hidden bg-gradient-radial from-gray-900/50 to-background p-4">
      <div className="mx-auto w-full max-w-4xl">
        <div className="overflow-hidden rounded-xl border border-white/10 bg-card/50 shadow-2xl shadow-black/30 backdrop-blur-xl md:grid md:grid-cols-2">
          {/* Left Side Info Panel */}
          <div className="hidden flex-col justify-center bg-linear-to-br from-gray-900 to-black p-12 md:flex">
            <div className="flex flex-col items-center text-center">
              <h1 className="font-bold text-4xl text-foreground">Klaytic</h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Your secure hub for proffessional work and digital assets.
              </p>
            </div>
          </div>

          {/* Right Side Form Panel */}
          <div className="p-8">
            <div className="flex flex-col items-center md:items-start">
              <h2 className="mb-1 font-bold text-2xl text-foreground">
                Sign In
              </h2>
              <p className="mb-4 text-muted-foreground">
                Access your iDraft account.
              </p>
            </div>
            <form className="space-y-4" onSubmit={handleLogin}>
              <div>
                <label
                  className="font-medium text-muted-foreground text-sm"
                  htmlFor="email"
                >
                  Email
                </label>
                <input
                  className="glassmorphic-input mt-2 w-full rounded-lg px-4 py-3 text-foreground placeholder-muted-foreground/50 transition-all duration-300 focus:border-primary focus:shadow-primary-glow focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={isSubmitting}
                  id="email"
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
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
                  className="glassmorphic-input mt-2 w-full rounded-lg px-4 py-3 text-foreground placeholder-muted-foreground/50 transition-all duration-300 focus:border-primary focus:shadow-primary-glow focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={isSubmitting}
                  id="password"
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  type="password"
                  value={password}
                />
              </div>

              {/* Display error message if it exists */}
              {error && <p className="text-red-500 text-sm">{error}</p>}

              <Button
                className="h-auto w-full transform rounded-lg bg-primary py-3 font-semibold text-background transition-all duration-300 hover:scale-[1.02] hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? "Signing In..." : "Sign In"}
              </Button>
            </form>

            {/* OR Separator */}
            <div className="relative my-4 flex items-center justify-center">
              <div className="absolute inset-x-0 h-px bg-white/10" />
              <span className="relative bg-card/80 px-2 text-muted-foreground text-sm">
                OR
              </span>
            </div>

            {/* Google Button */}
            <Button
              className="flex h-auto w-full items-center justify-center gap-3 rounded-lg border border-white/20 bg-white/10 py-3 font-medium text-foreground transition-colors duration-300 hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSubmitting}
              onClick={handleGoogleSignIn}
              variant="outline"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <title>Google logo</title>
                <path
                  d="M22.56,12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26,1.37-1.04,2.53-2.21,3.31v2.77h3.57c2.08-1.92,3.28-4.74,3.28-8.09Z"
                  fill="#4285F4"
                />
                <path
                  d="M12,23c2.97,0,5.46-.98,7.28-2.66l-3.57-2.77c-.98.66-2.23,1.06-3.71,1.06-2.86,0-5.29-1.93-6.16-4.53H2.18v2.84C3.99,20.53,7.7,23,12,23Z"
                  fill="#34A853"
                />
                <path
                  d="M5.84,14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43,8.55,1,10.22,1,12s.43,3.45,1.18,4.93l3.66-2.84Z"
                  fill="#FBBC05"
                />
                <path
                  d="M12,5.38c1.62,0,3.06.56,4.21,1.64l3.15-3.15C17.45,2.09,14.97,1,12,1,7.7,1,3.99,3.47,2.18,7.07l3.66,2.84c.87-2.6,3.3-4.53,6.16-4.53Z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </Button>

            {/* Sign Up Link */}
            <p className="mt-6 text-center text-muted-foreground text-sm">
              Don't have an account?{" "}
              <Link
                className="font-medium text-primary hover:underline"
                href="/signup"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

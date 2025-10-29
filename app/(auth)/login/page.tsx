"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { signIn } from "@/lib/auth-client"; // Assuming this is your better-auth client functions

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // <-- State for loading/submitting
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true); // <-- Set submitting true

    try {
      const result = await signIn.email({
        email,
        password,
        callbackURL: "/dashboard", // Optional: Backend might use this
      });

      // Check if the sign-in was successful (no error)
      if (!result?.error) {
        router.push("/dashboard");
        // No need to setIsSubmitting(false) on success because of navigation
      } else {
        // Set the error message if login failed
        setError(result.error.message || "Invalid email or password.");
        setIsSubmitting(false); // <-- Set submitting false on error
      }
    } catch (err: any) {
        // Catch unexpected errors during the signIn call
        setError(err.message || "Something went wrong. Please try again.");
        setIsSubmitting(false); // <-- Set submitting false on error
    }
    // Removed finally block as state is set within try/catch
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsSubmitting(true); // <-- Set submitting true for Google sign-in as well
    try {
      await signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });
      // Social sign-in handles redirects, no need for router.push
      // If successful, the page will navigate away, so no need to reset isSubmitting
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google.");
      setIsSubmitting(false); // <-- Set submitting false on error
    }
  };

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center p-4 bg-gradient-radial from-gray-900/50 to-background overflow-hidden">
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-card/50 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl shadow-black/30 md:grid md:grid-cols-2">
          {/* Left Side Info */}
          <div className="hidden md:flex flex-col justify-center p-12 bg-gradient-to-br from-gray-900 to-black">
            <div className="flex flex-col items-center text-center">
              <h1 className="font-bold text-4xl text-foreground">AgentVault</h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Your secure hub for AI agents and digital assets.
              </p>
            </div>
          </div>

          {/* Right Side Form */}
          <div className="p-8">
            <div className="flex flex-col items-center md:items-start">
              <h2 className="text-2xl font-bold text-foreground mb-1">Sign In</h2>
              <p className="text-muted-foreground mb-4">
                Access your AgentVault account.
              </p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label
                  className="text-sm font-medium text-muted-foreground"
                  htmlFor="email"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting} // <-- Disable when submitting
                  className="glassmorphic-input w-full mt-2 px-4 py-3 rounded-lg text-foreground placeholder-muted-foreground/50 transition-all duration-300 focus:ring-2 focus:ring-primary focus:border-primary focus:shadow-primary-glow disabled:opacity-70 disabled:cursor-not-allowed" // Added disabled styles
                />
              </div>
              <div>
                <label
                  className="text-sm font-medium text-muted-foreground"
                  htmlFor="password"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isSubmitting} // <-- Disable when submitting
                  className="glassmorphic-input w-full mt-2 px-4 py-3 rounded-lg text-foreground placeholder-muted-foreground/50 transition-all duration-300 focus:ring-2 focus:ring-primary focus:border-primary focus:shadow-primary-glow disabled:opacity-70 disabled:cursor-not-allowed" // Added disabled styles
                />
              </div>

              {/* Display error message if it exists */}
              {error && <p className="text-sm text-red-500">{error}</p>}

              <Button
                type="submit"
                disabled={isSubmitting} // <-- Disable button when submitting
                className="w-full bg-primary text-background font-semibold py-3 rounded-lg hover:bg-primary/90 transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background h-auto disabled:opacity-70 disabled:cursor-not-allowed" // Added disabled styles
              >
                {/* Change button text based on submitting state */}
                {isSubmitting ? "Signing In..." : "Sign In"}
              </Button>
            </form>

            {/* OR Separator */}
            <div className="relative flex items-center justify-center my-4">
              <div className="absolute inset-x-0 h-px bg-white/10"></div>
              <span className="relative bg-card/80 px-2 text-sm text-muted-foreground">
                OR
              </span>
            </div>

            {/* Google Button */}
            <div>
              <Button
                variant="outline"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting} // <-- Disable button when submitting
                className="w-full bg-white/10 border border-white/20 text-foreground font-medium py-3 rounded-lg hover:bg-white/20 transition-colors duration-300 flex items-center justify-center gap-3 h-auto disabled:opacity-70 disabled:cursor-not-allowed" // Added disabled styles
              >
                {/* Google SVG */}
                <svg /* ... */ > {/* ... path data ... */} </svg>
                 Sign in with Google
              </Button>
            </div>

            {/* Sign Up Link */}
            <p className="text-center text-sm text-muted-foreground mt-6">
              Don't have an account?{" "}
              <Link href="/signup" className="font-medium text-primary hover:underline">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
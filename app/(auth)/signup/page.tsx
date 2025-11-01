// realaashishly/idraft/iDraft-cffe49e2e238e0f3cb53b3f7957b2658d2ada56a/app/(auth)/signup/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation'; // <-- 1. Import useRouter
import { Button } from "@/components/ui/button";
import { signIn, signUp } from "@/lib/auth-client"; // Assuming this is your better-auth client functions

export default function SignupPage() {
  const router = useRouter(); // <-- 2. Initialize the router
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await signUp.email({ // <-- 3. Store the result
        email,
        password,
        name,
        // callbackURL might still be useful for backend processes, keep it if needed
        callbackURL: "/dashboard", 
      });

      // 4. Check if there was NO error
      if (!result?.error) {
        // --- SUCCESS: Manually redirect ---
        router.push("/dashboard"); 
        // Optional: you might want to wait a tiny bit or show a success message before redirecting
      } else {
        // --- ERROR: Set the error message ---
        setError(result.error.message || "An error occurred during signup.");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      // Only set submitting to false if there was an error,
      // otherwise, the redirect will happen.
      // Alternatively, always set it, the redirect should interrupt rendering.
       setIsSubmitting(false); 
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      // Social sign-in often handles redirects automatically
      await signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });
      // No explicit redirect needed here usually, as the browser navigates
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google.");
    }
  };

  return (
    // --- Your JSX remains the same ---
    <div className="fixed inset-0 z-10 flex items-center justify-center p-4 bg-gradient-radial from-gray-900/50 to-background overflow-hidden">
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-card/50 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl shadow-black/30 md:grid md:grid-cols-2">
          {/* ... Left Side Info ... */}
           {/* CORRECTED GRADIENT CLASS HERE */}
           <div className="hidden md:flex flex-col justify-center p-12 bg-gradient-to-br from-gray-900 to-black">
             <div className="flex flex-col items-center text-center">
               <h1 className="font-bold text-4xl text-foreground">iDraft</h1>
               <p className="mt-4 text-lg text-muted-foreground">
                 Your secure hub for proffessional work and digital assets.
               </p>
             </div>
           </div>
          {/* ... Right Side Form ... */}
          <div className="p-8">
            <div className="flex flex-col items-center md:items-start">
              <h2 className="text-2xl font-bold text-foreground mb-1">
                Create an Account
              </h2>
              <p className="text-muted-foreground mb-4">
                Join iDraft to manage your proffessional work.
              </p>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              {/* ... Name Input ... */}
                <div>
                  <label
                    className="text-sm font-medium text-muted-foreground"
                    htmlFor="name"
                  >
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    placeholder="Your Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="glassmorphic-input w-full mt-2 px-4 py-3 rounded-lg text-foreground placeholder-muted-foreground/50 transition-all duration-300 focus:ring-2 focus:ring-primary focus:border-primary focus:shadow-primary-glow"
                  />
                </div>
              {/* ... Email Input ... */}
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
                     disabled={isSubmitting}
                     className="glassmorphic-input w-full mt-2 px-4 py-3 rounded-lg text-foreground placeholder-muted-foreground/50 transition-all duration-300 focus:ring-2 focus:ring-primary focus:border-primary focus:shadow-primary-glow"
                   />
                 </div>
              {/* ... Password Input ... */}
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
                     disabled={isSubmitting}
                     className="glassmorphic-input w-full mt-2 px-4 py-3 rounded-lg text-foreground placeholder-muted-foreground/50 transition-all duration-300 focus:ring-2 focus:ring-primary focus:border-primary focus:shadow-primary-glow"
                   />
                 </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary text-background font-semibold py-3 rounded-lg hover:bg-primary/90 transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background h-auto disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

             {/* ... OR Separator ... */}
             <div className="relative flex items-center justify-center my-4">
               <div className="absolute inset-x-0 h-px bg-white/10"></div>
               <span className="relative bg-card/80 px-2 text-sm text-muted-foreground">
                 OR
               </span>
             </div>

            {/* ... Google Button ... */}
            <Button
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              className="w-full bg-white/10 border border-white/20 text-foreground font-medium py-3 rounded-lg hover:bg-white/20 transition-colors duration-300 flex items-center justify-center gap-3 h-auto disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {/* ... Google SVG ... */}
                 <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                   <path d="M22.56,12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26,1.37-1.04,2.53-2.21,3.31v2.77h3.57c2.08-1.92,3.28-4.74,3.28-8.09Z" fill="#4285F4" />
                   <path d="M12,23c2.97,0,5.46-.98,7.28-2.66l-3.57-2.77c-.98.66-2.23,1.06-3.71,1.06-2.86,0-5.29-1.93-6.16-4.53H2.18v2.84C3.99,20.53,7.7,23,12,23Z" fill="#34A853" />
                   <path d="M5.84,14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43,8.55,1,10.22,1,12s.43,3.45,1.18,4.93l3.66-2.84Z" fill="#FBBC05" />
                   <path d="M12,5.38c1.62,0,3.06.56,4.21,1.64l3.15-3.15C17.45,2.09,14.97,1,12,1,7.7,1,3.99,3.47,2.18,7.07l3.66,2.84c.87-2.6,3.3-4.53,6.16-4.53Z" fill="#EA4335" />
                 </svg>
              Continue with Google
            </Button>

            {/* ... Sign In Link ... */}
            <p className="text-center text-sm text-muted-foreground mt-6">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
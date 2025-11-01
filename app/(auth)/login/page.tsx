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
      <div className='fixed inset-0 z-10 flex items-center justify-center p-4 bg-gradient-radial from-gray-900/50 to-background overflow-hidden'>
          <div className='w-full max-w-4xl mx-auto'>
              <div className='bg-card/50 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl shadow-black/30 md:grid md:grid-cols-2'>
                  {/* Left Side Info */}
                  <div className='hidden md:flex flex-col justify-center p-12 bg-gradient-to-br from-gray-900 to-black'>
                      <div className='flex flex-col items-center text-center'>
                          <h1 className='font-bold text-4xl text-foreground'>
                              iDraft
                          </h1>
                          <p className='mt-4 text-lg text-muted-foreground'>
                              Your secure hub for proffessional work and digital assets.
                          </p>
                      </div>
                  </div>

                  {/* Right Side Form */}
                  <div className='p-8'>
                      <div className='flex flex-col items-center md:items-start'>
                          <h2 className='text-2xl font-bold text-foreground mb-1'>
                              Sign In
                          </h2>
                          <p className='text-muted-foreground mb-4'>
                              Access your iDraft account.
                          </p>
                      </div>
                      <form onSubmit={handleLogin} className='space-y-4'>
                          <div>
                              <label
                                  className='text-sm font-medium text-muted-foreground'
                                  htmlFor='email'
                              >
                                  Email
                              </label>
                              <input
                                  id='email'
                                  type='email'
                                  placeholder='you@example.com'
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                  required
                                  disabled={isSubmitting} // <-- Disable when submitting
                                  className='glassmorphic-input w-full mt-2 px-4 py-3 rounded-lg text-foreground placeholder-muted-foreground/50 transition-all duration-300 focus:ring-2 focus:ring-primary focus:border-primary focus:shadow-primary-glow disabled:opacity-70 disabled:cursor-not-allowed' // Added disabled styles
                              />
                          </div>
                          <div>
                              <label
                                  className='text-sm font-medium text-muted-foreground'
                                  htmlFor='password'
                              >
                                  Password
                              </label>
                              <input
                                  id='password'
                                  type='password'
                                  placeholder='••••••••'
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                  required
                                  disabled={isSubmitting} // <-- Disable when submitting
                                  className='glassmorphic-input w-full mt-2 px-4 py-3 rounded-lg text-foreground placeholder-muted-foreground/50 transition-all duration-300 focus:ring-2 focus:ring-primary focus:border-primary focus:shadow-primary-glow disabled:opacity-70 disabled:cursor-not-allowed' // Added disabled styles
                              />
                          </div>

                          {/* Display error message if it exists */}
                          {error && (
                              <p className='text-sm text-red-500'>{error}</p>
                          )}

                          <Button
                              type='submit'
                              disabled={isSubmitting} // <-- Disable button when submitting
                              className='w-full bg-primary text-background font-semibold py-3 rounded-lg hover:bg-primary/90 transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background h-auto disabled:opacity-70 disabled:cursor-not-allowed' // Added disabled styles
                          >
                              {/* Change button text based on submitting state */}
                              {isSubmitting ? "Signing In..." : "Sign In"}
                          </Button>
                      </form>

                      {/* OR Separator */}
                      <div className='relative flex items-center justify-center my-4'>
                          <div className='absolute inset-x-0 h-px bg-white/10'></div>
                          <span className='relative bg-card/80 px-2 text-sm text-muted-foreground'>
                              OR
                          </span>
                      </div>

                      {/* Google Button */}
                      <Button
                          variant='outline'
                          onClick={handleGoogleSignIn}
                          disabled={isSubmitting}
                          className='w-full bg-white/10 border border-white/20 text-foreground font-medium py-3 rounded-lg hover:bg-white/20 transition-colors duration-300 flex items-center justify-center gap-3 h-auto disabled:opacity-70 disabled:cursor-not-allowed'
                      >
                          {/* ... Google SVG ... */}
                          <svg
                              className='w-5 h-5'
                              viewBox='0 0 24 24'
                              xmlns='http://www.w3.org/2000/svg'
                          >
                              <path
                                  d='M22.56,12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26,1.37-1.04,2.53-2.21,3.31v2.77h3.57c2.08-1.92,3.28-4.74,3.28-8.09Z'
                                  fill='#4285F4'
                              />
                              <path
                                  d='M12,23c2.97,0,5.46-.98,7.28-2.66l-3.57-2.77c-.98.66-2.23,1.06-3.71,1.06-2.86,0-5.29-1.93-6.16-4.53H2.18v2.84C3.99,20.53,7.7,23,12,23Z'
                                  fill='#34A853'
                              />
                              <path
                                  d='M5.84,14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43,8.55,1,10.22,1,12s.43,3.45,1.18,4.93l3.66-2.84Z'
                                  fill='#FBBC05'
                              />
                              <path
                                  d='M12,5.38c1.62,0,3.06.56,4.21,1.64l3.15-3.15C17.45,2.09,14.97,1,12,1,7.7,1,3.99,3.47,2.18,7.07l3.66,2.84c.87-2.6,3.3-4.53,6.16-4.53Z'
                                  fill='#EA4335'
                              />
                          </svg>
                          Continue with Google
                      </Button>

                      {/* Sign Up Link */}
                      <p className='text-center text-sm text-muted-foreground mt-6'>
                          Don't have an account?{" "}
                          <Link
                              href='/signup'
                              className='font-medium text-primary hover:underline'
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
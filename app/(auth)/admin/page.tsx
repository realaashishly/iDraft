"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { signIn } from "@/lib/auth-client";

export default function AdminLoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            const { data, error } = await signIn.email({
                email,
                password,
                callbackURL: "/dashboard",
            });
        } catch (error: any) {
            setError(error.message);
        }
    };

    return (
        <div className="fixed inset-0 z-10 flex items-center justify-center p-4 bg-gradient-radial from-gray-900/50 to-background overflow-hidden">
            <div className="w-full max-w-md mx-auto">
                <div className="bg-card/50 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl shadow-black/30">
                    <div className="p-8 sm:p-12">
                        <div className="flex flex-col items-center">
                            <h2 className="text-2xl font-bold text-foreground mb-1">
                                Admin Access
                            </h2>
                            <p className="text-muted-foreground mb-6">
                                Enter your admin credentials to continue.
                            </p>
                        </div>
                        <form onSubmit={handleLogin} className="space-y-6">
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
                                    placeholder="example@admin.com"
                                    value={email}
                                    onChange={(e) =>
                                        setEmail(e.target.value)
                                    }
                                    required
                                    className="glassmorphic-input w-full mt-2 px-4 py-3 rounded-lg text-foreground placeholder-muted-foreground/50 transition-all duration-300 focus:ring-2 focus:ring-primary focus:border-primary focus:shadow-primary-glow"
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
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    required
                                    className="glassmorphic-input w-full mt-2 px-4 py-3 rounded-lg text-foreground placeholder-muted-foreground/50 transition-all duration-300 focus:ring-2 focus:ring-primary focus:border-primary focus:shadow-primary-glow"
                                />
                            </div>

                            {error && (
                                <p className="text-sm text-red-500">{error}</p>
                            )}

                            <Button
                                type="submit"
                                className="w-full bg-primary text-background font-semibold py-3 rounded-lg hover:bg-primary/90 transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background h-auto"
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

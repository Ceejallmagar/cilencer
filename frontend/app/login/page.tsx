"use client";
import React, { useState } from "react";
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(true); // Default to true
    const [error, setError] = useState("");
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleGoogleLogin = async () => {
        try {
            setLoading(true);
            setError("");
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            router.push("/home");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (isSignUp) {
            if (password !== confirmPassword) {
                setError("Passwords do not match");
                return;
            }
            if (password.length < 6) {
                setError("Password must be at least 6 characters");
                return;
            }
        }

        try {
            setLoading(true);

            // Set persistence based on checkbox
            await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);

            if (isSignUp) {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
            router.push("/home");
        } catch (err: any) {
            // Make error messages more user-friendly
            if (err.code === "auth/user-not-found") {
                setError("No account found with this email. Please sign up first.");
            } else if (err.code === "auth/wrong-password") {
                setError("Incorrect password. Please try again.");
            } else if (err.code === "auth/email-already-in-use") {
                setError("An account with this email already exists. Please sign in.");
            } else if (err.code === "auth/invalid-email") {
                setError("Please enter a valid email address.");
            } else if (err.code === "auth/weak-password") {
                setError("Password is too weak. Please use at least 6 characters.");
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setIsSignUp(!isSignUp);
        setError("");
        setConfirmPassword("");
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white relative overflow-hidden selection:bg-white selection:text-black">
            {/* Background decoration - Monochrome or subtle */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-900/40 via-black to-black z-0"></div>

            {/* Back Button */}
            <button
                onClick={() => router.push('/')}
                className="absolute top-8 left-8 z-20 text-gray-500 hover:text-white transition-colors flex items-center gap-2 group"
            >
                <span className="group-hover:-translate-x-1 transition-transform">←</span>
                <span className="text-sm font-medium tracking-wide uppercase">Back to Home</span>
            </button>

            <div className="relative z-10 bg-black border border-white/20 rounded-2xl p-8 shadow-[0_0_50px_-12px_rgba(255,255,255,0.1)] w-full max-w-md">
                <h1 className="text-4xl font-black text-center mb-2 text-white tracking-tighter uppercase">
                    Silence Booster
                </h1>
                <p className="text-center text-gray-500 mb-8 font-light">
                    {isSignUp ? "Create your account" : "Welcome back, chaos maker"}
                </p>

                {error && (
                    <div className="bg-white/10 text-white p-3 rounded mb-4 text-sm border border-white/20 text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleEmailLogin} className="space-y-4">
                    <div>
                        <label className="block text-gray-400 text-xs font-bold mb-2 uppercase tracking-widest">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 rounded bg-black border border-gray-800 focus:border-white focus:outline-none text-white placeholder-gray-700 transition-colors"
                            placeholder="meme_lord@example.com"
                            required
                            disabled={loading}
                        />
                    </div>
                    <div>
                        <label className="block text-gray-400 text-xs font-bold mb-2 uppercase tracking-widest">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 rounded bg-black border border-gray-800 focus:border-white focus:outline-none text-white placeholder-gray-700 transition-colors"
                            placeholder="••••••••"
                            required
                            disabled={loading}
                        />
                    </div>
                    {isSignUp && (
                        <div>
                            <label className="block text-gray-400 text-xs font-bold mb-2 uppercase tracking-widest">Confirm Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full p-3 rounded bg-black border border-gray-800 focus:border-white focus:outline-none text-white placeholder-gray-700 transition-colors"
                                placeholder="••••••••"
                                required
                                disabled={loading}
                            />
                        </div>
                    )}
                    {/* Remember Me & Forgot Password */}
                    <div className="flex items-center justify-between">
                        <label className="flex items-center space-x-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-600 bg-black text-white focus:ring-white/50 accent-white"
                            />
                            <span className="text-sm text-gray-500 group-hover:text-gray-300 transition-colors select-none">Remember me</span>
                        </label>
                        <button type="button" className="text-sm text-gray-500 hover:text-white transition-colors">
                            Forgot password?
                        </button>
                    </div>

                    <Button
                        className="w-full py-4 bg-white text-black font-bold hover:bg-gray-200 border-none transition-all shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] hover:scale-[1.02] active:scale-[0.98] uppercase tracking-wider !text-black"
                        disabled={loading}
                    >
                        {loading ? "Loading..." : isSignUp ? "Create Account" : "Enter the Void"}
                    </Button>
                </form>

                {/* Toggle between Sign In and Sign Up */}
                <div className="mt-6 text-center">
                    <p className="text-gray-500 text-sm">
                        {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                        <button
                            onClick={toggleMode}
                            className="text-white hover:underline font-semibold transition-colors decoration-white/50 underline-offset-4"
                            disabled={loading}
                        >
                            {isSignUp ? "Sign In" : "Create one"}
                        </button>
                    </p>
                </div>

                <div className="mt-8 flex items-center justify-between opacity-50">
                    <hr className="w-full border-gray-800" />
                    <span className="px-3 text-gray-600 text-xs uppercase tracking-widest">OR</span>
                    <hr className="w-full border-gray-800" />
                </div>

                <button
                    onClick={handleGoogleLogin}
                    className="mt-6 w-full bg-black border border-gray-800 text-white font-bold py-3 rounded flex items-center justify-center hover:bg-gray-900 hover:border-gray-600 transition-all shadow-lg active:scale-[0.98]"
                    disabled={loading}
                >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 mr-3" alt="Google" />
                    {isSignUp ? "Sign up with Google" : "Sign in with Google"}
                </button>
            </div>
        </div>
    );
}

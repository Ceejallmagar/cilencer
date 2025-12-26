"use client";
import React, { useState } from "react";
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
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
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-900 via-gray-900 to-black opacity-80 z-0"></div>
            <div className="absolute -top-20 -left-20 w-72 h-72 bg-pink-600 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
            <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>

            <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-xl p-8 shadow-2xl w-full max-w-md border border-white/20">
                <h1 className="text-4xl font-extrabold text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">
                    Silence Booster
                </h1>
                <p className="text-center text-gray-400 mb-8">
                    {isSignUp ? "Create your account" : "Welcome back, chaos maker"}
                </p>

                {error && (
                    <div className="bg-red-500/20 text-red-200 p-3 rounded mb-4 text-sm border border-red-500/50">
                        {error}
                    </div>
                )}

                <form onSubmit={handleEmailLogin} className="space-y-4">
                    <div>
                        <label className="block text-gray-300 text-sm font-bold mb-2">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 rounded bg-black/40 border border-gray-600 focus:border-purple-500 focus:outline-none text-white placeholder-gray-500"
                            placeholder="meme_lord@example.com"
                            required
                            disabled={loading}
                        />
                    </div>
                    <div>
                        <label className="block text-gray-300 text-sm font-bold mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 rounded bg-black/40 border border-gray-600 focus:border-purple-500 focus:outline-none text-white"
                            placeholder="••••••••"
                            required
                            disabled={loading}
                        />
                    </div>
                    {isSignUp && (
                        <div>
                            <label className="block text-gray-300 text-sm font-bold mb-2">Confirm Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full p-3 rounded bg-black/40 border border-gray-600 focus:border-purple-500 focus:outline-none text-white"
                                placeholder="••••••••"
                                required
                                disabled={loading}
                            />
                        </div>
                    )}
                    <Button
                        variant="primary"
                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 border-none disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading}
                    >
                        {loading ? "Loading..." : isSignUp ? "Create Account" : "Enter the Void"}
                    </Button>
                </form>

                {/* Toggle between Sign In and Sign Up */}
                <div className="mt-6 text-center">
                    <p className="text-gray-400">
                        {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                        <button
                            onClick={toggleMode}
                            className="text-purple-400 hover:text-purple-300 font-semibold transition-colors underline underline-offset-2"
                            disabled={loading}
                        >
                            {isSignUp ? "Sign In" : "Create one"}
                        </button>
                    </p>
                </div>

                <div className="mt-6 flex items-center justify-between">
                    <hr className="w-full border-gray-600" />
                    <span className="px-2 text-gray-400 text-sm">OR</span>
                    <hr className="w-full border-gray-600" />
                </div>

                <button
                    onClick={handleGoogleLogin}
                    className="mt-6 w-full bg-white text-gray-900 font-bold py-3 rounded flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading}
                >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 mr-2" alt="Google" />
                    {isSignUp ? "Sign up with Google" : "Sign in with Google"}
                </button>
            </div>
        </div>
    );
}

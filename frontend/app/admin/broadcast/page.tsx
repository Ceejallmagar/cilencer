"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import MainLayout from "@/components/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { adminAPI } from "@/lib/api";
import { Bell, Send, Loader2, ArrowLeft, Check } from "lucide-react";

export default function AdminBroadcastPage() {
    const router = useRouter();
    const { userProfile } = useAuth();
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [recipients, setRecipients] = useState(0);

    const handleBroadcast = async () => {
        if (!message.trim()) {
            alert("Please enter a message");
            return;
        }
        setSending(true);
        try {
            const result = await adminAPI.broadcast(message);
            setRecipients(result.recipients || 0);
            setSent(true);
            setMessage("");
        } catch (error: any) {
            alert(error.message || "Failed to broadcast");
        } finally {
            setSending(false);
        }
    };

    if (!userProfile?.isAdmin) return null;

    return (
        <MainLayout>
            <div className="pb-20 md:pb-8 max-w-2xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 mb-8"
                >
                    <button onClick={() => router.push("/admin")} className="p-2 hover:bg-[var(--card-bg)] rounded-lg">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold gradient-text">Broadcast Message 📢</h1>
                        <p className="text-[var(--muted)]">Send notification to all users</p>
                    </div>
                </motion.div>

                {sent ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-card p-8 text-center"
                    >
                        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check size={32} />
                        </div>
                        <h2 className="text-xl font-bold mb-2">Broadcast Sent! 🎉</h2>
                        <p className="text-[var(--muted)] mb-6">
                            Your message was sent to {recipients} users
                        </p>
                        <button
                            onClick={() => setSent(false)}
                            className="btn-primary"
                        >
                            Send Another
                        </button>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card p-6"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                                <Bell size={24} />
                            </div>
                            <div>
                                <h2 className="font-bold">Write Your Message</h2>
                                <p className="text-sm text-[var(--muted)]">
                                    This will be sent as a notification to all users
                                </p>
                            </div>
                        </div>

                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Hey everyone! 🎉 Important announcement..."
                            className="input-field min-h-[150px] resize-none mb-4"
                            maxLength={500}
                        />

                        <div className="flex justify-between items-center mb-6">
                            <span className="text-sm text-[var(--muted)]">
                                {message.length}/500 characters
                            </span>
                        </div>

                        <button
                            onClick={handleBroadcast}
                            disabled={sending || !message.trim()}
                            className="w-full btn-primary flex items-center justify-center gap-2 py-4 disabled:opacity-50"
                        >
                            {sending ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send size={20} />
                                    Broadcast to All Users
                                </>
                            )}
                        </button>
                    </motion.div>
                )}
            </div>
        </MainLayout>
    );
}

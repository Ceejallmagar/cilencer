"use client";
import React, { useState, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { postsAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface Reply {
    id: string;
    postId: string;
    userId: string;
    username: string;
    userPhotoURL: string;
    userDisplayName: string;
    content: string;
    likes: number;
    createdAt: any;
}

interface ReplySectionProps {
    postId: string;
    isOpen: boolean;
}

export const ReplySection = ({ postId, isOpen }: ReplySectionProps) => {
    const { user, userProfile } = useAuth();
    const [replies, setReplies] = useState<Reply[]>([]);
    const [newReply, setNewReply] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchReplies();
        }
    }, [isOpen, postId]);

    const fetchReplies = async () => {
        setLoading(true);
        try {
            const data = await postsAPI.getReplies(postId);
            setReplies(data);
        } catch (error) {
            console.error("Failed to fetch replies:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newReply.trim() || submitting) return;

        setSubmitting(true);
        try {
            const reply = await postsAPI.addReply(postId, newReply.trim());
            setReplies(prev => [...prev, reply]);
            setNewReply("");
        } catch (error) {
            console.error("Failed to add reply:", error);
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-[var(--card-border)]"
        >
            {/* Reply Input */}
            <form onSubmit={handleSubmitReply} className="flex gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold shrink-0">
                    {userProfile?.displayName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div className="flex-1 flex gap-2">
                    <input
                        type="text"
                        value={newReply}
                        onChange={(e) => setNewReply(e.target.value)}
                        placeholder="Drop your reply... 💬"
                        className="input-field flex-1"
                        disabled={submitting}
                    />
                    <button
                        type="submit"
                        disabled={!newReply.trim() || submitting}
                        className="btn-primary px-4 disabled:opacity-50"
                    >
                        {submitting ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            <Send size={18} />
                        )}
                    </button>
                </div>
            </form>

            {/* Replies List */}
            <div className="space-y-3 max-h-64 overflow-y-auto">
                {loading ? (
                    <div className="flex justify-center py-4">
                        <Loader2 size={24} className="animate-spin text-purple-400" />
                    </div>
                ) : replies.length === 0 ? (
                    <p className="text-center text-[var(--muted)] py-4">
                        No replies yet. Be the first! 🎯
                    </p>
                ) : (
                    replies.map((reply) => (
                        <motion.div
                            key={reply.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex gap-3 p-3 rounded-lg bg-[var(--card-bg)]"
                        >
                            {reply.userPhotoURL ? (
                                <img
                                    src={reply.userPhotoURL}
                                    alt={reply.username}
                                    className="w-8 h-8 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold">
                                    {reply.username?.charAt(0).toUpperCase() || "U"}
                                </div>
                            )}
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">
                                        {reply.userDisplayName || reply.username}
                                    </span>
                                    <span className="text-xs text-[var(--muted)]">
                                        @{reply.username}
                                    </span>
                                </div>
                                <p className="text-sm mt-1">{reply.content}</p>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </motion.div>
    );
};

export default ReplySection;

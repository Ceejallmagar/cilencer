"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import MainLayout from "@/components/MainLayout";
import { trollsAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { MessageCircle, Heart, Trophy, Loader2, Plus, User } from "lucide-react";

interface TrollResponse {
    id: string;
    userId: string;
    username: string;
    userPhotoURL: string;
    content: string;
    imageURL?: string;
    likes: number;
    likedBy: string[];
}

interface Troll {
    id: string;
    creatorId: string;
    creatorUsername: string;
    creatorPhotoURL: string;
    targetType: 'me' | 'him';
    targetUserId: string;
    targetUser?: any;
    content: string;
    responses: TrollResponse[];
    totalLikes: number;
    isTrollOfWeek: boolean;
    winnerResponse?: TrollResponse;
    createdAt: any;
}

export default function TrollMePage() {
    const { user, userProfile } = useAuth();
    const [trolls, setTrolls] = useState<Troll[]>([]);
    const [trollOfWeek, setTrollOfWeek] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [targetType, setTargetType] = useState<'me' | 'him'>('me');
    const [content, setContent] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [respondingTo, setRespondingTo] = useState<string | null>(null);
    const [responseContent, setResponseContent] = useState("");

    useEffect(() => {
        fetchTrolls();
        fetchTrollOfWeek();
    }, []);

    const fetchTrolls = async () => {
        setLoading(true);
        try {
            const data = await trollsAPI.getTrolls();
            setTrolls(data);
        } catch (error) {
            console.error("Failed to fetch trolls:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTrollOfWeek = async () => {
        try {
            const data = await trollsAPI.getTrollOfWeek();
            setTrollOfWeek(data.winner);
        } catch (error) {
            console.error("Failed to fetch troll of week:", error);
        }
    };

    const handleCreateTroll = async () => {
        if (!content.trim()) return;
        setSubmitting(true);
        try {
            await trollsAPI.createTroll({
                targetType,
                content: content.trim(),
                targetUserId: targetType === 'me' ? user?.uid : undefined,
            });
            setContent("");
            setShowCreateModal(false);
            fetchTrolls();
        } catch (error: any) {
            alert(error.message || "Failed to create");
        } finally {
            setSubmitting(false);
        }
    };

    const handleRespond = async (trollId: string) => {
        if (!responseContent.trim()) return;
        setSubmitting(true);
        try {
            await trollsAPI.respondToTroll(trollId, { content: responseContent.trim() });
            setResponseContent("");
            setRespondingTo(null);
            fetchTrolls();
        } catch (error: any) {
            alert(error.message || "Failed to respond");
        } finally {
            setSubmitting(false);
        }
    };

    const handleLikeResponse = async (trollId: string, responseId: string) => {
        try {
            await trollsAPI.likeTrollResponse(trollId, responseId);
            fetchTrolls();
        } catch (error: any) {
            console.error("Failed to like:", error);
        }
    };

    return (
        <MainLayout>
            <div className="pb-20 md:pb-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between mb-8"
                >
                    <div>
                        <h1 className="text-3xl font-bold">
                            <span className="gradient-text">Troll Me</span> 🤡
                        </h1>
                        <p className="text-[var(--muted)]">
                            Challenge others to roast you... if they dare!
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Start Challenge
                    </button>
                </motion.div>

                {/* Troll of the Week */}
                {trollOfWeek && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-2xl p-6 mb-8"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <Trophy size={24} className="text-yellow-400" />
                            <h2 className="text-xl font-bold">Troll of the Week! 🔥</h2>
                        </div>
                        <div className="glass-card p-4">
                            <p className="text-lg mb-3">{trollOfWeek.winnerResponse?.content}</p>
                            <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                                <span>By @{trollOfWeek.winnerResponse?.username}</span>
                                <span>·</span>
                                <span>{trollOfWeek.winnerResponse?.likes || 0} ❤️</span>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Create Modal */}
                {showCreateModal && (
                    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowCreateModal(false)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="modal-content"
                        >
                            <h2 className="text-xl font-bold mb-4">Start a Troll Challenge 🎯</h2>

                            <div className="flex gap-2 mb-4">
                                <button
                                    onClick={() => setTargetType('me')}
                                    className={`flex-1 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${targetType === 'me'
                                        ? 'btn-primary'
                                        : 'bg-[var(--card-bg)] border border-[var(--card-border)]'
                                        }`}
                                >
                                    <User size={18} />
                                    Troll ME
                                </button>
                                <button
                                    onClick={() => setTargetType('him')}
                                    className={`flex-1 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${targetType === 'him'
                                        ? 'btn-primary'
                                        : 'bg-[var(--card-bg)] border border-[var(--card-border)]'
                                        }`}
                                >
                                    <MessageCircle size={18} />
                                    Troll HIM
                                </button>
                            </div>

                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder={
                                    targetType === 'me'
                                        ? "Go ahead, try to roast me... 😏"
                                        : "Who should get trolled? Describe them..."
                                }
                                className="input-field min-h-[100px] resize-none mb-4"
                            />

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateTroll}
                                    disabled={!content.trim() || submitting}
                                    className="btn-primary flex-1 disabled:opacity-50"
                                >
                                    {submitting ? "..." : "Start Challenge 🔥"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Trolls List */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 size={40} className="animate-spin text-[var(--foreground)]" />
                    </div>
                ) : trolls.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12"
                    >
                        <div className="text-6xl mb-4">🤡</div>
                        <h3 className="text-xl font-bold mb-2">No Trolls Yet</h3>
                        <p className="text-[var(--muted)]">
                            Be the first to start a troll challenge!
                        </p>
                    </motion.div>
                ) : (
                    <div className="space-y-6">
                        {trolls.map((troll) => (
                            <motion.div
                                key={troll.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-card p-5"
                            >
                                {/* Troll Header */}
                                <div className="flex items-center gap-3 mb-4">
                                    {troll.creatorPhotoURL ? (
                                        <img
                                            src={troll.creatorPhotoURL}
                                            alt=""
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[var(--btn-gradient-start)] to-[var(--btn-gradient-end)] flex items-center justify-center font-bold text-[var(--btn-text)]">
                                            {troll.creatorUsername?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <span className="font-bold">@{troll.creatorUsername}</span>
                                        <span className={`ml-2 text-xs px-2 py-0.5 rounded ${troll.targetType === 'me'
                                            ? 'bg-[var(--accent-glow)] text-[var(--foreground)]'
                                            : 'bg-[var(--accent-glow)] text-[var(--foreground)]'
                                            }`}>
                                            {troll.targetType === 'me' ? 'TROLL ME' : 'TROLL HIM'}
                                        </span>
                                    </div>
                                </div>

                                <p className="text-lg mb-4">{troll.content}</p>

                                {/* Responses */}
                                <div className="border-t border-[var(--card-border)] pt-4 mt-4">
                                    <h4 className="text-sm font-medium text-[var(--muted)] mb-3">
                                        Roasts ({troll.responses?.length || 0})
                                    </h4>

                                    {troll.responses && troll.responses.length > 0 ? (
                                        <div className="space-y-3 max-h-64 overflow-y-auto">
                                            {troll.responses.map((response) => (
                                                <div
                                                    key={response.id}
                                                    className="flex gap-3 p-3 rounded-lg bg-[var(--card-bg)]"
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[var(--btn-gradient-start)] to-[var(--btn-gradient-end)] flex items-center justify-center text-sm font-bold shrink-0 text-[var(--btn-text)]">
                                                        {response.username?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex-1">
                                                        <span className="text-sm font-medium">
                                                            @{response.username}
                                                        </span>
                                                        <p className="mt-1">{response.content}</p>
                                                        <button
                                                            onClick={() => handleLikeResponse(troll.id, response.id)}
                                                            className="mt-2 flex items-center gap-1 text-sm text-[var(--muted)] hover:text-red-400"
                                                        >
                                                            <Heart
                                                                size={14}
                                                                className={response.likedBy?.includes(user?.uid || "") ? "fill-red-400 text-red-400" : ""}
                                                            />
                                                            {response.likes}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-[var(--muted)] text-center py-2">
                                            No roasts yet...
                                        </p>
                                    )}

                                    {/* Add Response */}
                                    {respondingTo === troll.id ? (
                                        <div className="mt-4 flex gap-2">
                                            <input
                                                type="text"
                                                value={responseContent}
                                                onChange={(e) => setResponseContent(e.target.value)}
                                                placeholder="Drop your roast... 🔥"
                                                className="input-field flex-1"
                                            />
                                            <button
                                                onClick={() => handleRespond(troll.id)}
                                                disabled={!responseContent.trim() || submitting}
                                                className="btn-primary px-4 disabled:opacity-50"
                                            >
                                                {submitting ? "..." : "Send"}
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setRespondingTo(troll.id)}
                                            className="mt-4 btn-secondary w-full"
                                        >
                                            Add Your Roast 🔥
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </MainLayout>
    );
}

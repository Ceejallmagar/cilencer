"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import MainLayout from "@/components/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { adminAPI, memeWarAPI } from "@/lib/api";
import {
    Sword, Play, Square, Trophy, Clock, Loader2, ArrowLeft, Users
} from "lucide-react";

export default function AdminMemeWarPage() {
    const router = useRouter();
    const { userProfile } = useAuth();
    const [war, setWar] = useState<any>(null);
    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (userProfile && !userProfile.isAdmin) {
            router.push("/home");
            return;
        }
        fetchWar();
    }, [userProfile, router]);

    const fetchWar = async () => {
        setLoading(true);
        try {
            const data = await memeWarAPI.getActiveWar();
            if (data.active && data.war) {
                setWar(data.war);
                const entriesData = await memeWarAPI.getEntries(data.war.id);
                setEntries(entriesData);
            }
        } catch (error) {
            console.error("Failed to fetch war:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartWar = async () => {
        setActionLoading(true);
        try {
            await adminAPI.startMemeWar(2);
            fetchWar();
            alert("Meme War started!");
        } catch (error: any) {
            alert(error.message || "Failed to start");
        } finally {
            setActionLoading(false);
        }
    };

    const handleStartVoting = async () => {
        if (!war) return;
        setActionLoading(true);
        try {
            await adminAPI.startVoting(war.id, 2);
            fetchWar();
            alert("Voting started!");
        } catch (error: any) {
            alert(error.message || "Failed to start voting");
        } finally {
            setActionLoading(false);
        }
    };

    const handleEndWar = async () => {
        setActionLoading(true);
        try {
            // No need to pass winnerId, backend handles it automatically
            await adminAPI.endMemeWar(war.id, "", "");
            fetchWar();
            alert("Meme War ended & winner announced!");
        } catch (error: any) {
            alert(error.message || "Failed to end");
        } finally {
            setActionLoading(false);
        }
    };

    if (!userProfile?.isAdmin) return null;

    return (
        <MainLayout>
            <div className="pb-20 md:pb-8">
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
                        <h1 className="text-2xl font-bold gradient-text">Meme War Control ⚔️</h1>
                        <p className="text-[var(--muted)]">Start, manage, and end Meme Wars</p>
                    </div>
                </motion.div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 size={40} className="animate-spin text-[var(--foreground)]" />
                    </div>
                ) : (
                    <>
                        {/* Current Status */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-card p-6 mb-8"
                        >
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Sword size={20} />
                                Current Status
                            </h2>

                            {war ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${war.status === 'submission' ? 'bg-green-500 text-white' :
                                            war.status === 'voting' ? 'btn-primary' :
                                                'bg-gray-500 text-white'
                                            }`}>
                                            {war.status.toUpperCase()}
                                        </span>
                                        <span className="text-[var(--muted)]">
                                            {entries.length} entries
                                        </span>
                                    </div>

                                    {/* Control Buttons */}
                                    <div className="flex gap-3 flex-wrap">
                                        {/* Start War Button - Disabled if active */}
                                        <button
                                            disabled={true}
                                            className="btn-primary opacity-50 cursor-not-allowed flex items-center gap-2"
                                            title="War is already active"
                                        >
                                            <Play size={18} />
                                            War Active
                                        </button>

                                        {war.status === 'submission' && (
                                            <button
                                                onClick={handleStartVoting}
                                                disabled={actionLoading}
                                                className="btn-secondary flex items-center gap-2 disabled:opacity-50"
                                            >
                                                <Users size={18} />
                                                Start Voting Phase
                                            </button>
                                        )}

                                        <button
                                            onClick={handleEndWar}
                                            disabled={actionLoading}
                                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 disabled:opacity-50"
                                        >
                                            <Square size={18} />
                                            End War (Auto Winner)
                                        </button>
                                    </div>

                                    {/* Display Info about Auto Winner */}
                                    {war.status === 'voting' && (
                                        <div className="mt-4 p-3 bg-[var(--card-bg)] rounded-lg text-sm text-[var(--muted)]">
                                            ℹ️ Clicking "End War" will automatically select the responder with the highest votes as the winner.
                                        </div>
                                    )}

                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Clock size={48} className="mx-auto mb-4 text-[var(--muted)]" />
                                    <p className="text-xl font-bold mb-4">No Active Meme War</p>
                                    <button
                                        onClick={handleStartWar}
                                        disabled={actionLoading}
                                        className="btn-primary flex items-center gap-2 mx-auto disabled:opacity-50"
                                    >
                                        {actionLoading ? (
                                            <Loader2 size={18} className="animate-spin" />
                                        ) : (
                                            <Play size={18} />
                                        )}
                                        Start Meme War
                                    </button>
                                </div>
                            )}
                        </motion.div>

                        {/* Entries List */}
                        {entries.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-4"
                            >
                                <h2 className="text-lg font-bold">Entries ({entries.length})</h2>
                                {entries.map((entry) => (
                                    <div key={entry.id} className="glass-card p-4">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <span className="text-xs bg-[var(--accent-glow)] text-[var(--foreground)] px-2 py-1 rounded">
                                                    Challenger: @{entry.challengerData?.username || "user"}
                                                </span>
                                            </div>
                                            <span className="text-sm text-[var(--muted)]">
                                                {entry.votes || 0} votes
                                            </span>
                                        </div>
                                        <p className="mb-2">{entry.challengerMeme}</p>
                                        {entry.responderId && (
                                            <div className="mt-3 pt-3 border-t border-[var(--card-border)]">
                                                <span className="text-xs bg-[var(--accent-glow)] text-[var(--foreground)] px-2 py-1 rounded">
                                                    Responder: @{entry.responderData?.username || "user"}
                                                </span>
                                                <p className="mt-2">{entry.responderMeme}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </>
                )}
            </div>
        </MainLayout>
    );
}

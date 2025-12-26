"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import MainLayout from "@/components/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { memeWarAPI } from "@/lib/api";
import {
    Sword, Trophy, Flame, MessageCircle, Share2, ThumbsUp, Timer, Crown, AlertTriangle, User
} from "lucide-react";
import Image from "next/image";

export default function MemeWarPage() {
    const router = useRouter();
    const { userProfile } = useAuth();
    const [activeWar, setActiveWar] = useState<any>(null);
    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submission, setSubmission] = useState("");
    const [responseContent, setResponseContent] = useState("");
    const [respondingTo, setRespondingTo] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [userHasSubmitted, setUserHasSubmitted] = useState(false);
    const [winners, setWinners] = useState<any[]>([]);

    useEffect(() => {
        fetchActiveWar();
        fetchWinners();

        // Poll for updates every 10 seconds to handle state changes (e.g. admin starts/stops war)
        const interval = setInterval(() => {
            fetchActiveWar();
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    const fetchActiveWar = async () => {
        setLoading(true);
        try {
            const data = await memeWarAPI.getActiveWar();
            if (data.active && data.war) {
                setActiveWar(data.war);
                const entriesData = await memeWarAPI.getEntries(data.war.id);
                setEntries(entriesData);

                if (userProfile) {
                    const hasSubmitted = entriesData.some((e: any) => e.challengerId === userProfile.uid);
                    setUserHasSubmitted(hasSubmitted);
                }
            } else {
                setActiveWar(null);
            }
        } catch (error) {
            console.error("Failed to fetch meme war:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchWinners = async () => {
        try {
            const data = await memeWarAPI.getWinners();
            setWinners(data);
        } catch (error) {
            console.error("Failed to fetch winners:", error);
        }
    };

    const handleSubmitMeme = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!submission.trim() || !activeWar) return;

        setSubmitting(true);
        try {
            await memeWarAPI.submitMeme({
                warId: activeWar.id,
                memeContent: submission
            });
            setSubmission("");
            fetchActiveWar();
            alert("Meme submitted!");
        } catch (error: any) {
            alert(error.message || "Failed to submit");
        } finally {
            setSubmitting(false);
        }
    };

    const handleRespond = async (entryId: string) => {
        if (!responseContent.trim()) return;

        setSubmitting(true);
        try {
            await memeWarAPI.respondToMeme(entryId, {
                memeContent: responseContent
            });
            setResponseContent("");
            setRespondingTo(null);
            fetchActiveWar();
            alert("Response submitted!");
        } catch (error: any) {
            alert(error.message || "Failed to respond");
        } finally {
            setSubmitting(false);
        }
    };

    const handleVote = async (entryId: string, target: 'challenger' | 'responder') => {
        if (!userProfile) return;
        try {
            await memeWarAPI.vote(entryId, target);
            fetchActiveWar();
        } catch (error: any) {
            alert(error.message || "Failed to vote");
        }
    };

    const getStatusBadge = () => {
        if (!activeWar) return null;
        switch (activeWar.status) {
            case 'submission':
                return <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1"><Flame size={14} /> SUBMISSIONS OPEN</span>;
            case 'voting':
                return <span className="btn-primary px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1"><ThumbsUp size={14} /> VOTING ACTIVE</span>;
            case 'ended':
                return <span className="bg-gray-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1"><Trophy size={14} /> WAR ENDED</span>;
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="flex justify-center items-center min-h-[50vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary)]"></div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="pb-20 md:pb-8">
                {/* Hero Section */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-600 to-orange-600 p-8 text-white mb-8 shadow-2xl">
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase drop-shadow-lg">
                                MEME WAR ⚔️
                            </h1>
                            {getStatusBadge()}
                        </div>
                        <p className="text-lg opacity-90 max-w-xl mb-6 font-medium">
                            {activeWar?.status === 'voting'
                                ? "Choose your side! Vote for the best roasts OR the best challenges!"
                                : activeWar?.status === 'ended'
                                    ? "The war is over. Submissions are strictly closed. Check out the winners below!"
                                    : "Submit your fiercest memes or roast others to win eternal glory."}
                        </p>

                        {/* Explicit Locked State for clarity */}
                        {activeWar?.status === 'ended' && (
                            <div className="glass-card bg-black/40 p-4 rounded-xl backdrop-blur-md flex items-center justify-center gap-2 text-white/50 font-bold border border-white/10">
                                <AlertTriangle size={20} />
                                <span>WAR ENDED • NO NEW SUBMISSIONS</span>
                            </div>
                        )}

                        {activeWar?.status === 'submission' && !userHasSubmitted && (
                            <div className="glass-card bg-white/10 p-4 rounded-xl backdrop-blur-md">
                                <form onSubmit={handleSubmitMeme} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={submission}
                                        onChange={(e) => setSubmission(e.target.value)}
                                        placeholder="Drop a meme to start a war..."
                                        className="flex-1 bg-white/20 border-none placeholder-white/70 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-white/50 outline-none transition-all"
                                    />
                                    <button
                                        type="submit"
                                        disabled={submitting || !submission.trim()}
                                        className="bg-white text-red-600 px-6 py-2 rounded-xl font-bold hover:bg-white/90 transition-colors disabled:opacity-50"
                                    >
                                        Challenge
                                    </button>
                                </form>
                            </div>
                        )}
                        {activeWar?.status === 'submission' && userHasSubmitted && (
                            <div className="glass-card bg-white/10 p-3 rounded-xl backdrop-blur-md inline-block">
                                <p className="flex items-center gap-2 font-bold"><Crown size={18} /> You have submitted a meme! Wait for responders.</p>
                            </div>
                        )}
                    </div>
                    {/* Background decoration */}
                    <div className="absolute right-0 top-0 h-full w-1/2 opacity-20 pointer-events-none">
                        <Sword size={400} className="absolute -right-20 -top-20 rotate-45" />
                    </div>
                </div>

                {/* Winner Display (if ended) */}
                {activeWar?.status === 'ended' && activeWar.winnerAnnouncement && (
                    <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50 text-center relative overflow-hidden">
                        <div className="relative z-10">
                            <Trophy size={48} className="mx-auto mb-2 text-yellow-500" />
                            <h2 className="text-2xl font-black uppercase text-yellow-500 mb-2">WINNER ANNOUNCEMENT</h2>
                            <p className="text-xl font-bold">{activeWar.winnerAnnouncement}</p>
                        </div>
                        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
                    </div>
                )}

                {/* Sub-header */}
                <div className="flex items-center gap-2 mb-6">
                    <Flame className="text-orange-500" />
                    <h2 className="text-xl font-bold">Active Battleground</h2>
                    <span className="text-[var(--muted)] text-sm ml-auto">{entries.length} battles</span>
                </div>

                {/* Entries Grid */}
                <div className="grid grid-cols-1 gap-6">
                    {entries.length === 0 ? (
                        <div className="text-center py-20 text-[var(--muted)] glass-card">
                            <Sword size={48} className="mx-auto mb-4 opacity-50" />
                            <p>No battles yet. Be the first to start one!</p>
                        </div>
                    ) : (
                        entries.map((entry) => (
                            <motion.div
                                key={entry.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-card overflow-hidden"
                            >
                                {/* VS Layout */}
                                <div className="grid grid-cols-1 md:grid-cols-2 relative min-h-[250px]">
                                    {/* Challenger Side */}
                                    <div className="p-6 border-b md:border-b-0 md:border-r border-[var(--card-border)] relative flex flex-col h-full bg-[var(--card-bg)]">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                                                {entry.challengerData?.username?.[0]?.toUpperCase() || "C"}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-blue-500">@{entry.challengerData?.username || "Challenger"}</p>
                                                <span className="text-[10px] uppercase tracking-wider font-bold opacity-60">Challenger</span>
                                            </div>
                                        </div>

                                        <div className="flex-1 flex items-center justify-center text-center p-6 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] italic text-[var(--foreground)]">
                                            <p className="text-lg">"{entry.challengerMeme}"</p>
                                        </div>

                                        {/* Challenger Vote Button */}
                                        <div className="mt-4 flex justify-center">
                                            {activeWar?.status === 'voting' && userProfile ? (
                                                <button
                                                    onClick={() => handleVote(entry.id, 'challenger')}
                                                    disabled={entry.voterIds?.includes(userProfile.uid)}
                                                    className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all 
                                                        ${entry.voterIds?.includes(userProfile.uid) ? 'opacity-50 cursor-not-allowed bg-[var(--muted)]' : 'bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white'}`}
                                                >
                                                    <ThumbsUp size={14} />
                                                    {entry.voterIds?.includes(userProfile.uid) ? 'Voted' : 'Vote Challenger'}
                                                    <span className="bg-blue-500 text-white px-2 py-0.5 rounded-full text-[10px] ml-1">{entry.challengerVotes || 0}</span>
                                                </button>
                                            ) : (
                                                <div className="flex items-center gap-2 px-3 py-1 bg-[var(--bg-secondary)] rounded-full border border-[var(--border)]">
                                                    <ThumbsUp size={12} className="text-blue-500" />
                                                    <span className="text-xs font-bold text-blue-500">{entry.challengerVotes || 0}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* VS Badge */}
                                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden md:flex h-14 w-14 bg-red-600 text-white items-center justify-center rounded-full font-black italic border-[6px] border-[var(--card-bg)] shadow-xl rotate-12 text-lg">
                                        VS
                                    </div>

                                    {/* Responder Side */}
                                    <div className="p-6 bg-[var(--bg-secondary)]/30 relative flex flex-col h-full">
                                        {entry.responderId ? (
                                            <>
                                                <div className="flex items-center gap-3 mb-4 justify-end">
                                                    <div className="text-right">
                                                        <p className="font-bold text-sm text-red-500">@{entry.responderData?.username || "Responder"}</p>
                                                        <span className="text-[10px] uppercase tracking-wider font-bold opacity-60">Responder</span>
                                                    </div>
                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                                                        {entry.responderData?.username?.[0]?.toUpperCase() || "R"}
                                                    </div>
                                                </div>

                                                <div className="flex-1 flex items-center justify-center text-center p-6 bg-[var(--card-bg)] rounded-xl border-2 border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.1)] text-red-500 font-bold italic">
                                                    <p className="text-lg">"{entry.responderMeme}"</p>
                                                </div>

                                                {/* Responder Vote Button */}
                                                <div className="mt-4 flex justify-center">
                                                    {activeWar?.status === 'voting' && userProfile ? (
                                                        <button
                                                            onClick={() => handleVote(entry.id, 'responder')}
                                                            disabled={entry.voterIds?.includes(userProfile.uid)}
                                                            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all 
                                                                ${entry.voterIds?.includes(userProfile.uid) ? 'opacity-50 cursor-not-allowed bg-[var(--muted)]' : 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white'}`}
                                                        >
                                                            <ThumbsUp size={14} />
                                                            {entry.voterIds?.includes(userProfile.uid) ? 'Voted' : 'Vote Responder'}
                                                            <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[10px] ml-1">{entry.responderVotes || 0}</span>
                                                        </button>
                                                    ) : (
                                                        <div className="flex items-center gap-2 px-3 py-1 bg-[var(--bg-secondary)] rounded-full border border-[var(--border)]">
                                                            <ThumbsUp size={12} className="text-red-500" />
                                                            <span className="text-xs font-bold text-red-500">{entry.responderVotes || 0}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-60">
                                                <p className="text-sm font-bold uppercase tracking-widest mb-2">Awaiting Challenger</p>

                                                {/* Reply Action */}
                                                {activeWar?.status === 'submission' && userProfile && userProfile.uid !== entry.challengerId && (
                                                    respondingTo === entry.id ? (
                                                        <div className="w-full mt-4">
                                                            <textarea
                                                                value={responseContent}
                                                                onChange={(e) => setResponseContent(e.target.value)}
                                                                placeholder="Write a savage roast..."
                                                                className="input-field mb-2 text-sm bg-white/5"
                                                                rows={2}
                                                                autoFocus
                                                            />
                                                            <div className="flex gap-2 justify-end">
                                                                <button
                                                                    onClick={() => setRespondingTo(null)}
                                                                    className="text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
                                                                >
                                                                    Cancel
                                                                </button>
                                                                <button
                                                                    onClick={() => handleRespond(entry.id)}
                                                                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-xs font-bold"
                                                                >
                                                                    Submit Roast
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => setRespondingTo(entry.id)}
                                                            className="mt-2 bg-[var(--card-bg)] hover:bg-red-500 hover:text-white transition-all px-4 py-2 rounded-full text-sm font-bold border border-[var(--border)] shadow-sm"
                                                        >
                                                            🔥 ROAST THIS
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="p-2 border-t border-[var(--card-border)] bg-[var(--card-bg)]/50 text-center text-xs text-[var(--muted)]">
                                    Total Votes: {entry.votes || 0}
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Past Winners */}
                {winners.length > 0 && (
                    <div className="mt-12">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Trophy size={20} className="text-yellow-400" />
                            Hall of Fame
                        </h2>
                        <div className="grid gap-4 md:grid-cols-2">
                            {winners.slice(0, 4).map((w, i) => (
                                <div key={w.id} className="glass-card p-4">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">
                                            {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "🏅"}
                                        </span>
                                        <div>
                                            <p className="font-bold">
                                                @{w.winnerData?.username || "Winner"}
                                            </p>
                                            <p className="text-sm text-[var(--muted)]">
                                                {w.winnerAnnouncement || "Meme War Champion"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}

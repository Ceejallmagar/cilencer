"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import MainLayout from "@/components/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { trollsAPI, adminAPI } from "@/lib/api";
import { MessageCircle, Trophy, Loader2, ArrowLeft, Check } from "lucide-react";

export default function AdminTrollOfWeekPage() {
    const router = useRouter();
    const { userProfile } = useAuth();
    const [trolls, setTrolls] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selecting, setSelecting] = useState(false);
    const [selectedTroll, setSelectedTroll] = useState<string>("");
    const [selectedResponse, setSelectedResponse] = useState<string>("");

    useEffect(() => {
        if (userProfile && !userProfile.isAdmin) {
            router.push("/home");
            return;
        }
        fetchTrolls();
    }, [userProfile, router]);

    const fetchTrolls = async () => {
        setLoading(true);
        try {
            const data = await trollsAPI.getTrolls(50);
            setTrolls(data);
        } catch (error) {
            console.error("Failed to fetch trolls:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = async () => {
        if (!selectedTroll || !selectedResponse) {
            alert("Please select a troll and response");
            return;
        }

        const troll = trolls.find(t => t.id === selectedTroll);
        const response = troll?.responses?.find((r: any) => r.id === selectedResponse);

        if (!response) {
            alert("Response not found");
            return;
        }

        setSelecting(true);
        try {
            await adminAPI.selectTrollOfWeek(selectedTroll, selectedResponse, response.userId);
            alert("Troll of the Week selected! 🎉");
            fetchTrolls();
        } catch (error: any) {
            alert(error.message || "Failed to select");
        } finally {
            setSelecting(false);
        }
    };

    if (!userProfile?.isAdmin) return null;

    const selectedTrollData = trolls.find(t => t.id === selectedTroll);

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
                        <h1 className="text-2xl font-bold gradient-text">Troll of the Week 🤡</h1>
                        <p className="text-[var(--muted)]">Select the best troll response</p>
                    </div>
                </motion.div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 size={40} className="animate-spin text-purple-400" />
                    </div>
                ) : (
                    <>
                        {/* Selection Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-card p-6 mb-8"
                        >
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Trophy size={20} className="text-yellow-400" />
                                Select Winner
                            </h2>

                            <div className="space-y-4">
                                {/* Step 1: Select Troll Post */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        1. Choose Troll Post
                                    </label>
                                    <select
                                        value={selectedTroll}
                                        onChange={(e) => {
                                            setSelectedTroll(e.target.value);
                                            setSelectedResponse("");
                                        }}
                                        className="input-field"
                                    >
                                        <option value="">Select a troll post...</option>
                                        {trolls.map((troll) => (
                                            <option key={troll.id} value={troll.id}>
                                                @{troll.creatorUsername}: {troll.content.slice(0, 50)}...
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Step 2: Select Response */}
                                {selectedTrollData && selectedTrollData.responses?.length > 0 && (
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            2. Choose Winning Response
                                        </label>
                                        <select
                                            value={selectedResponse}
                                            onChange={(e) => setSelectedResponse(e.target.value)}
                                            className="input-field"
                                        >
                                            <option value="">Select a response...</option>
                                            {selectedTrollData.responses.map((response: any) => (
                                                <option key={response.id} value={response.id}>
                                                    @{response.username} ({response.likes} likes): {response.content.slice(0, 40)}...
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Submit */}
                                <button
                                    onClick={handleSelect}
                                    disabled={selecting || !selectedTroll || !selectedResponse}
                                    className="btn-primary w-full disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {selecting ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Selecting...
                                        </>
                                    ) : (
                                        <>
                                            <Check size={18} />
                                            Select as Troll of the Week
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>

                        {/* All Trolls with Responses */}
                        <h2 className="text-lg font-bold mb-4">All Troll Posts ({trolls.length})</h2>
                        <div className="space-y-4">
                            {trolls.map((troll) => (
                                <div key={troll.id} className="glass-card p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="font-bold">@{troll.creatorUsername}</span>
                                        {troll.isTrollOfWeek && (
                                            <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded flex items-center gap-1">
                                                <Trophy size={12} />
                                                Current Winner
                                            </span>
                                        )}
                                    </div>
                                    <p className="mb-3">{troll.content}</p>

                                    {troll.responses && troll.responses.length > 0 && (
                                        <div className="pt-3 border-t border-[var(--card-border)]">
                                            <p className="text-sm text-[var(--muted)] mb-2">
                                                {troll.responses.length} responses
                                            </p>
                                            <div className="space-y-2">
                                                {troll.responses.slice(0, 3).map((r: any) => (
                                                    <div key={r.id} className="text-sm p-2 rounded bg-[var(--card-bg)]">
                                                        <span className="font-medium">@{r.username}</span>
                                                        <span className="text-[var(--muted)]"> ({r.likes} likes): </span>
                                                        {r.content}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </MainLayout>
    );
}

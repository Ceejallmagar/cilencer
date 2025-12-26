"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import MainLayout from "@/components/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { usersAPI } from "@/lib/api";
import { Award, Check, Loader2 } from "lucide-react";

const ALL_BADGES = [
    { id: "meme_flower", name: "Flower", icon: "🌸", requirement: "Post 100 memes" },
    { id: "meme_star", name: "Star", icon: "⭐", requirement: "Post 500 memes" },
    { id: "meme_crown", name: "Crown", icon: "👑", requirement: "Post 1000 memes" },
    { id: "admin_badge", name: "Admin", icon: "🛡️", requirement: "Be an admin" },
    { id: "fire_badge", name: "Fire", icon: "🔥", requirement: "Win a Meme War" },
    { id: "troll_master", name: "Troll Master", icon: "🤡", requirement: "Win Troll of the Week" },
    { id: "diamond", name: "Diamond", icon: "💎", requirement: "Reach Position #1" },
    { id: "lightning", name: "Lightning", icon: "⚡", requirement: "Get 100 likes on one post" },
    { id: "skull", name: "Savage", icon: "💀", requirement: "Win 10 Meme Wars" },
    { id: "rainbow", name: "Rainbow", icon: "🌈", requirement: "Post in all categories" },
    { id: "rocket", name: "Rocket", icon: "🚀", requirement: "Get featured by admin" },
    { id: "heart", name: "Loved", icon: "❤️", requirement: "Get 1000 total likes" },
];

export default function BadgesPage() {
    const { userProfile, refreshProfile } = useAuth();
    const [saving, setSaving] = useState(false);
    const [selectedBadge, setSelectedBadge] = useState<string | null>(userProfile?.activeBadge || null);

    const handleSetActiveBadge = async (badgeId: string) => {
        if (!userProfile?.badges?.includes(badgeId)) return;

        setSaving(true);
        try {
            await usersAPI.updateUser(userProfile.uid, { activeBadge: badgeId });
            setSelectedBadge(badgeId);
            await refreshProfile();
        } catch (error) {
            console.error("Failed to set badge:", error);
        } finally {
            setSaving(false);
        }
    };

    const ownedBadges = userProfile?.badges || [];

    return (
        <MainLayout>
            <div className="pb-20 md:pb-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-3xl font-bold gradient-text">Badges 🏅</h1>
                    <p className="text-[var(--muted)]">
                        Collect badges and show off your achievements!
                    </p>
                </motion.div>

                {/* Active Badge Info */}
                {selectedBadge && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-r from-[var(--btn-gradient-start)]/20 to-[var(--btn-gradient-end)]/20 border border-[var(--primary)]/30 rounded-2xl p-6 mb-8 text-center"
                    >
                        <p className="text-sm text-[var(--muted)] mb-2">Active Badge</p>
                        <div className="text-5xl mb-3">
                            {ALL_BADGES.find(b => b.id === selectedBadge)?.icon}
                        </div>
                        <p className="font-bold text-lg">
                            {ALL_BADGES.find(b => b.id === selectedBadge)?.name}
                        </p>
                        <p className="text-sm text-[var(--muted)]">
                            This badge appears on your profile picture!
                        </p>
                    </motion.div>
                )}

                {/* Owned Badges */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Award size={20} />
                        Your Badges ({ownedBadges.length})
                    </h2>

                    {ownedBadges.length === 0 ? (
                        <div className="glass-card p-8 text-center">
                            <div className="text-4xl mb-3">🎯</div>
                            <p className="text-[var(--muted)]">
                                No badges yet. Start posting memes to earn some!
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {ALL_BADGES.filter(b => ownedBadges.includes(b.id)).map((badge) => (
                                <motion.button
                                    key={badge.id}
                                    onClick={() => handleSetActiveBadge(badge.id)}
                                    disabled={saving}
                                    className={`glass-card p-5 text-left transition-all hover:border-[var(--primary)]/50 ${selectedBadge === badge.id
                                        ? "border-[var(--primary)] bg-[var(--accent-glow)]"
                                        : ""
                                        }`}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-3xl">{badge.icon}</span>
                                        {selectedBadge === badge.id && (
                                            <span className="btn-primary text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                                <Check size={12} />
                                                Active
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="font-bold">{badge.name}</h3>
                                    <p className="text-sm text-[var(--muted)]">{badge.requirement}</p>
                                </motion.button>
                            ))}
                        </div>
                    )}
                </div>

                {/* All Available Badges */}
                <div>
                    <h2 className="text-xl font-bold mb-4">All Badges</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {ALL_BADGES.map((badge) => {
                            const owned = ownedBadges.includes(badge.id);
                            return (
                                <div
                                    key={badge.id}
                                    className={`glass-card p-5 ${!owned ? "opacity-50" : ""}`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-3xl">{badge.icon}</span>
                                        {owned ? (
                                            <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full">
                                                Owned
                                            </span>
                                        ) : (
                                            <span className="bg-[var(--card-bg)] text-[var(--muted)] text-xs px-2 py-1 rounded-full">
                                                Locked
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="font-bold">{badge.name}</h3>
                                    <p className="text-sm text-[var(--muted)]">{badge.requirement}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}

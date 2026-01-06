"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import MainLayout from "@/components/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { usersAPI } from "@/lib/api";
import { Award, Check, Loader2 } from "lucide-react";
import { BADGES_LIST } from "@/lib/badges";

const ALL_BADGES = BADGES_LIST;

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
                        <div className="text-5xl mb-3 flex justify-center">
                            {(() => {
                                const b = ALL_BADGES.find(b => b.id === selectedBadge);
                                if (b?.image) return <img src={b.image} alt={b.name} className="w-20 h-20 object-contain" />;
                                return b?.icon;
                            })()}
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
                                        <span className="text-3xl">
                                            {badge.image ? (
                                                <img src={badge.image} alt={badge.name} className="w-10 h-10 object-contain" />
                                            ) : (
                                                badge.icon
                                            )}
                                        </span>
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
                                        <span className="text-3xl">
                                            {badge.image ? (
                                                <img src={badge.image} alt={badge.name} className="w-10 h-10 object-contain" />
                                            ) : (
                                                badge.icon
                                            )}
                                        </span>
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

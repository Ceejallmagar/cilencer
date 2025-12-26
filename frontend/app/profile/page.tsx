"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import MainLayout from "@/components/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { usersAPI } from "@/lib/api";
import { Trophy, Award, Image as ImageIcon, Edit2, Loader2 } from "lucide-react";

export default function ProfilePage() {
    const { user, userProfile, refreshProfile } = useAuth();
    const [activeTab, setActiveTab] = useState<"memes" | "trolls">("memes");
    const [memes, setMemes] = useState<any[]>([]);
    const [trolls, setTrolls] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.uid) {
            fetchContributions();
        }
    }, [user?.uid, activeTab]);

    const fetchContributions = async () => {
        setLoading(true);
        try {
            if (activeTab === "memes") {
                const data = await usersAPI.getUserMemes(user!.uid);
                setMemes(data);
            } else {
                const data = await usersAPI.getUserTrolls(user!.uid);
                setTrolls(data);
            }
        } catch (error) {
            console.error("Failed to fetch contributions:", error);
        } finally {
            setLoading(false);
        }
    };

    const getBadgeEmoji = (badgeId: string) => {
        const badges: Record<string, string> = {
            meme_flower: "🌸",
            meme_star: "⭐",
            meme_crown: "👑",
            admin_badge: "🛡️",
            troll_master: "🤡",
            fire_badge: "🔥",
            diamond: "💎",
        };
        return badges[badgeId] || "🏅";
    };

    return (
        <MainLayout>
            <div className="pb-20 md:pb-8">
                {/* Profile Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-6 mb-8"
                >
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        {/* Profile Picture */}
                        <div className="profile-pic-container">
                            {userProfile?.activeBadge && (
                                <div className="profile-badge-outer" />
                            )}
                            {userProfile?.photoURL ? (
                                <img
                                    src={userProfile.photoURL}
                                    alt="Profile"
                                    className="w-24 h-24 rounded-full object-cover border-4 border-[var(--primary)]"
                                />
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-[var(--btn-gradient-start)] to-[var(--btn-gradient-end)] flex items-center justify-center text-3xl font-bold text-[var(--btn-text)]">
                                    {userProfile?.displayName?.charAt(0).toUpperCase() || "U"}
                                </div>
                            )}
                            {userProfile?.activeBadge && (
                                <span className="badge-decoration text-2xl">
                                    {getBadgeEmoji(userProfile.activeBadge)}
                                </span>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-center md:text-left">
                            <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                                <h1 className="text-2xl font-bold">{userProfile?.displayName}</h1>
                                {userProfile?.isVerified && <span className="verified-badge" />}
                                {userProfile?.isAdmin && <span className="admin-indicator">Admin</span>}
                            </div>
                            <p className="text-[var(--muted)] mb-2">@{userProfile?.username}</p>
                            {userProfile?.bio && (
                                <p className="text-sm mb-3">{userProfile.bio}</p>
                            )}

                            {/* Position */}
                            {userProfile?.position && userProfile.position > 0 && (
                                <div className="inline-flex items-center gap-2 bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm">
                                    <Trophy size={14} />
                                    Position #{userProfile.position}
                                </div>
                            )}
                        </div>

                        {/* Stats */}
                        <div className="flex gap-6 text-center">
                            <div>
                                <p className="text-2xl font-bold gradient-text">{userProfile?.memeCount || 0}</p>
                                <p className="text-xs text-[var(--muted)]">Memes</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold gradient-text">{userProfile?.memeWins || 0}</p>
                                <p className="text-xs text-[var(--muted)]">Wins</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold gradient-text">{userProfile?.trollWins || 0}</p>
                                <p className="text-xs text-[var(--muted)]">Trolls</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold gradient-text">{userProfile?.followers || 0}</p>
                                <p className="text-xs text-[var(--muted)]">Followers</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Badges Section */}
                {userProfile?.badges && userProfile.badges.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card p-5 mb-8"
                    >
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Award size={20} />
                            My Badges
                        </h2>
                        <div className="flex flex-wrap gap-3">
                            {userProfile.badges.map((badge, index) => (
                                <div
                                    key={index}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl ${userProfile.activeBadge === badge
                                        ? "bg-purple-500/30 border border-purple-500"
                                        : "bg-[var(--card-bg)] border border-[var(--card-border)]"
                                        }`}
                                >
                                    <span className="text-xl">{getBadgeEmoji(badge)}</span>
                                    <span className="text-sm font-medium capitalize">
                                        {badge.replace(/_/g, " ")}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Contribution Tabs */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab("memes")}
                        className={`flex-1 py-3 rounded-xl font-medium transition-colors ${activeTab === "memes"
                            ? "btn-primary"
                            : "bg-[var(--card-bg)] text-[var(--muted)] border border-[var(--card-border)]"
                            }`}
                    >
                        🎭 Meme Contribution
                    </button>
                    <button
                        onClick={() => setActiveTab("trolls")}
                        className={`flex-1 py-3 rounded-xl font-medium transition-colors ${activeTab === "trolls"
                            ? "btn-primary"
                            : "bg-[var(--card-bg)] text-[var(--muted)] border border-[var(--card-border)]"
                            }`}
                    >
                        🤡 Troll Contribution
                    </button>
                </div>

                {/* Contributions */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 size={32} className="animate-spin text-[var(--foreground)]" />
                    </div>
                ) : activeTab === "memes" ? (
                    memes.length === 0 ? (
                        <div className="text-center py-12 glass-card">
                            <ImageIcon size={48} className="mx-auto mb-4 text-[var(--muted)]" />
                            <p className="text-[var(--muted)]">No memes posted yet!</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {memes.map((meme) => (
                                <div key={meme.id} className="glass-card p-4">
                                    <p className="mb-2">{meme.content}</p>
                                    {meme.imageURL && (
                                        <img
                                            src={meme.imageURL}
                                            alt=""
                                            className="rounded-lg w-full h-40 object-cover mb-2"
                                        />
                                    )}
                                    <div className="flex gap-4 text-sm text-[var(--muted)]">
                                        <span>{meme.likes} ❤️</span>
                                        <span>{meme.replyCount} 💬</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                ) : trolls.length === 0 ? (
                    <div className="text-center py-12 glass-card">
                        <ImageIcon size={48} className="mx-auto mb-4 text-[var(--muted)]" />
                        <p className="text-[var(--muted)]">No trolls yet!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {trolls.map((troll) => (
                            <div key={troll.id} className="glass-card p-4">
                                <p className="mb-2">{troll.content}</p>
                                <p className="text-sm text-[var(--muted)]">
                                    {troll.responses?.length || 0} responses
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </MainLayout>
    );
}

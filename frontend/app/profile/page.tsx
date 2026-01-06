"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import MainLayout from "@/components/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { usersAPI } from "@/lib/api";
import { getBadgeEmoji, getBadgeImage, getBadgeType } from "@/lib/badges";
import { PostCard } from "@/components/posts/PostCard";
import { Trophy, Award, Image as ImageIcon, Trash, MessageCircle, Loader2 } from "lucide-react";

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



    return (
        <MainLayout>
            <div className="pb-20 md:pb-8">
                {/* Profile Header */}
                {/* Profile Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card mb-8 overflow-hidden relative"
                >
                    {/* Banner */}
                    <div
                        className="h-32 w-full"
                        style={{
                            background: userProfile?.bannerColor || "linear-gradient(to right, var(--card-bg), transparent)"
                        }}
                    />

                    <div className="p-6 relative pt-0 mt-[-48px] flex flex-col md:flex-row items-end md:items-center gap-6">
                        {/* Profile Picture */}
                        <div className="profile-pic-container relative z-10">
                            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-[var(--background)] overflow-hidden bg-gray-800 relative z-0">
                                {userProfile?.photoURL ? (
                                    <img
                                        src={userProfile.photoURL}
                                        alt={userProfile.displayName}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-white bg-gradient-to-br from-purple-500 to-pink-500">
                                        {userProfile?.username?.[0]?.toUpperCase()}
                                    </div>
                                )}
                            </div>

                            {/* Frame Badge Overlay - Outside clipping container */}
                            {userProfile?.activeBadge && getBadgeType(userProfile.activeBadge) === 'frame' && (
                                <img
                                    src={getBadgeImage(userProfile.activeBadge)}
                                    alt="Frame Badge"
                                    className="badge-frame"
                                    style={{ width: '135%', height: '135%' }}
                                />
                            )}

                            {/* Standard Badge (Bottom Right) - Only if NOT a frame */}
                            {userProfile?.activeBadge && getBadgeType(userProfile.activeBadge) !== 'frame' && (
                                <span className="badge-decoration">
                                    {getBadgeImage(userProfile.activeBadge) ? (
                                        <img
                                            src={getBadgeImage(userProfile.activeBadge)!}
                                            alt="Badge"
                                            className="w-8 h-8 object-contain drop-shadow-lg"
                                        />
                                    ) : (
                                        getBadgeEmoji(userProfile.activeBadge)
                                    )}
                                </span>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-center md:text-left mb-2 w-full">
                            <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                                <h1 className="text-2xl font-bold">{userProfile?.displayName}</h1>
                                {userProfile?.isVerified && <span className="verified-badge" title="Verified" />}
                                {userProfile?.isAdmin && (
                                    <div className="flex items-center gap-1 bg-red-500/20 text-red-500 px-2 py-0.5 rounded-md text-xs font-bold border border-red-500/30">
                                        🛡️ ADMIN
                                    </div>
                                )}
                            </div>
                            <p className="text-[var(--muted)] mb-2">@{userProfile?.username}</p>
                            {userProfile?.bio && (
                                <p className="text-sm mb-3 max-w-md mx-auto md:mx-0">{userProfile.bio}</p>
                            )}
                        </div>

                        {/* Stats */}
                        <div className="flex gap-6 text-center pb-4 md:pb-0 mx-auto md:mx-0">
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
                {((userProfile?.badges?.length ?? 0) > 0 || userProfile?.isAdmin) && (
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
                            {/* Merge existing badges with virtual admin badge */}
                            {[
                                ...(userProfile?.isAdmin ? ["admin_badge"] : []),
                                ...(userProfile?.badges || [])
                            ].filter((badge, index, self) => self.indexOf(badge) === index) // Unique
                                .map((badge, index) => (
                                    <div
                                        key={index}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${userProfile?.activeBadge === badge
                                            ? "bg-purple-500/30 border border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                                            : "bg-[var(--card-bg)] border border-[var(--card-border)]"
                                            }`}
                                    >
                                        <span className="text-xl">
                                            {getBadgeImage(badge) ? (
                                                <img src={getBadgeImage(badge)} alt="Badge" className="w-6 h-6 object-contain" />
                                            ) : (
                                                getBadgeEmoji(badge)
                                            )}
                                        </span>
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
                        <div className="space-y-4">
                            {memes.map((meme) => (
                                <div key={meme.id}>
                                    <PostCard
                                        post={meme}
                                        onDelete={() => {
                                            // Remove from local state immediately
                                            setMemes(prev => prev.filter(p => p.id !== meme.id));
                                        }}
                                    />
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
                            <div key={troll.id} className="glass-card p-5 relative group">
                                {troll.creatorId === user?.uid && (
                                    <button
                                        onClick={async () => {
                                            if (!confirm("Are you sure you want to delete this troll post?")) return;
                                            try {
                                                const { trollsAPI } = await import('@/lib/api');
                                                await trollsAPI.deleteTroll(troll.id);
                                                setTrolls(prev => prev.filter(t => t.id !== troll.id));
                                                refreshProfile();
                                            } catch (error) {
                                                alert("Failed to delete troll post");
                                            }
                                        }}
                                        className="absolute top-4 right-4 p-2 bg-red-500/10 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Delete Troll Post"
                                    >
                                        <Trash size={16} />
                                    </button>
                                )}
                                <p className="text-lg mb-3 leading-relaxed">{troll.content}</p>
                                <div className="flex items-center gap-4 text-sm text-[var(--muted)]">
                                    <span className="flex items-center gap-1">
                                        <MessageCircle size={14} />
                                        {troll.responses?.length || 0} responses
                                    </span>
                                    <span>·</span>
                                    <span>{new Date(troll.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </MainLayout>
    );
}

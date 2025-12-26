"use client";
import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import MainLayout from "@/components/MainLayout";
import { PostCard } from "@/components/posts/PostCard";
import { CreatePostModal } from "@/components/posts/CreatePostModal";
import { postsAPI, usersAPI } from "@/lib/api";
import { Loader2, TrendingUp, Sparkles, User } from "lucide-react";

interface Post {
    id: string;
    userId: string;
    username: string;
    userPhotoURL: string;
    userDisplayName: string;
    isVerified: boolean;
    content: string;
    imageURL?: string;
    likes: number;
    likedBy: string[];
    replyCount: number;
    shares: number;
    isPromoted: boolean;
    createdAt: any;
}

export default function HomePage() {
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get("search") || "";

    const [posts, setPosts] = useState<Post[]>([]);
    const [discoverPosts, setDiscoverPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [activeFilter, setActiveFilter] = useState("trending");
    const [foundUsers, setFoundUsers] = useState<any[]>([]);

    useEffect(() => {
        fetchPosts();
        fetchDiscoverPosts();
    }, [searchQuery, activeFilter]);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            if (searchQuery) {
                // Parallel fetch for posts and users
                const [postsData, usersData] = await Promise.all([
                    postsAPI.searchPosts(searchQuery),
                    usersAPI.searchUsers(searchQuery)
                ]);
                setPosts(postsData);
                setFoundUsers(usersData);
            } else {
                setFoundUsers([]); // Clear users if not searching
                const data = await postsAPI.getPosts({
                    trending: activeFilter === "trending",
                    category: activeFilter !== "trending" ? activeFilter : undefined,
                    limit: 20
                });
                setPosts(data);
            }
        } catch (error) {
            console.error("Failed to fetch content:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDiscoverPosts = async () => {
        try {
            const data = await postsAPI.discoverPosts();
            setDiscoverPosts(data);
        } catch (error) {
            console.error("Failed to fetch discover posts:", error);
        }
    };

    const handlePostCreated = () => {
        fetchPosts();
    };

    return (
        <MainLayout>
            <div className="pb-20 md:pb-8 w-full">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-3xl font-bold mb-2">
                        {searchQuery ? (
                            <>
                                Results for "<span className="gradient-text">{searchQuery}</span>"
                            </>
                        ) : (
                            <>
                                <span className="gradient-text">Feed</span> 🔥
                            </>
                        )}
                    </h1>
                    <p className="text-[var(--muted)]">
                        {searchQuery
                            ? `Found ${posts.length} post${posts.length !== 1 ? 's' : ''}`
                            : "The freshest memes and chaos"}
                    </p>
                </motion.div>

                {/* Discover Section (Low engagement posts) */}
                {!searchQuery && discoverPosts.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 p-4 rounded-2xl bg-gradient-to-r from-[var(--btn-gradient-start)]/10 to-[var(--btn-gradient-end)]/10 border border-[var(--primary)]/20"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles size={20} className="text-[var(--foreground)]" />
                            <h2 className="font-bold">Discover New Memes</h2>
                            <span className="text-xs text-[var(--muted)]">Help these rise!</span>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                            {discoverPosts.slice(0, 5).map((post) => (
                                <div
                                    key={post.id}
                                    className="min-w-[200px] p-3 rounded-xl glass-card cursor-pointer hover:border-[var(--primary)]/40 transition-colors"
                                >
                                    <p className="text-sm line-clamp-2 mb-2">{post.content}</p>
                                    <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                                        <span>@{post.username}</span>
                                        <span>·</span>
                                        <span>{post.likes} ❤️</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Search Results: Users */}
                {searchQuery && foundUsers.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <User size={20} className="text-[var(--primary)]" />
                            People
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {foundUsers.map((user) => (
                                <div
                                    key={user.uid}
                                    onClick={() => window.location.href = `/profile/${user.uid}`} // Using window.location for full reload to ensure profile loads user data, or router.push
                                    className="p-4 rounded-xl glass-card cursor-pointer hover:border-[var(--primary)]/40 transition-all flex items-center gap-4 group"
                                >
                                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:scale-110 transition-transform">
                                        {user.photoURL ? (
                                            <img src={user.photoURL} alt={user.username} className="h-full w-full rounded-full object-cover" />
                                        ) : (
                                            user.displayName?.[0]?.toUpperCase() || "U"
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1">
                                            <p className="font-bold text-[var(--foreground)]">{user.displayName}</p>
                                            {user.isVerified && <span className="verified-badge-small" />}
                                        </div>
                                        <p className="text-sm text-[var(--muted)]">@{user.username}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Main Feed */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 size={40} className="animate-spin text-[var(--foreground)]" />
                    </div>
                ) : posts.length === 0 && foundUsers.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12"
                    >
                        <div className="text-6xl mb-4">🦗</div>
                        <h3 className="text-xl font-bold mb-2">It's quiet here...</h3>
                        <p className="text-[var(--muted)] mb-4">
                            {searchQuery
                                ? "No posts or users match your search"
                                : "Be the first to break the silence!"}
                        </p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="btn-primary"
                        >
                            Post Something Epic 🚀
                        </button>
                    </motion.div>
                ) : (
                    <div className="space-y-4">
                        {posts.map((post, index) => (
                            <motion.div
                                key={post.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <PostCard post={post} />
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Post Modal */}
            <CreatePostModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onPostCreated={handlePostCreated}
            />
        </MainLayout>
    );
}

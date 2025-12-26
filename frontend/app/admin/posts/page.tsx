"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import MainLayout from "@/components/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { adminAPI } from "@/lib/api";
import {
    TrendingUp, Trash2, Star, Loader2, ArrowLeft
} from "lucide-react";

export default function AdminPostsPage() {
    const router = useRouter();
    const { userProfile } = useAuth();
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userProfile && !userProfile.isAdmin) {
            router.push("/home");
            return;
        }
        fetchPosts();
    }, [userProfile, router]);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const data = await adminAPI.getAllPosts(100);
            setPosts(data);
        } catch (error) {
            console.error("Failed to fetch posts:", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePromote = async (postId: string, currentlyPromoted: boolean) => {
        try {
            await adminAPI.promotePost(postId, !currentlyPromoted);
            fetchPosts();
        } catch (error: any) {
            alert(error.message || "Failed to promote");
        }
    };

    const handleDelete = async (postId: string) => {
        if (!confirm("Delete this post?")) return;
        try {
            await adminAPI.deletePost(postId);
            fetchPosts();
        } catch (error: any) {
            alert(error.message || "Failed to delete");
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
                        <h1 className="text-2xl font-bold gradient-text">Manage Posts 📝</h1>
                        <p className="text-[var(--muted)]">{posts.length} posts</p>
                    </div>
                </motion.div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 size={40} className="animate-spin text-purple-400" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {posts.map((post, index) => (
                            <motion.div
                                key={post.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.02 }}
                                className="glass-card p-4"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="font-bold">@{post.username}</span>
                                            {post.isPromoted && (
                                                <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">
                                                    Promoted
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm mb-2">{post.content}</p>
                                        <div className="flex gap-4 text-xs text-[var(--muted)]">
                                            <span>{post.likes} likes</span>
                                            <span>{post.replyCount} replies</span>
                                            <span>Engagement: {post.engagement}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handlePromote(post.id, post.isPromoted)}
                                            className={`p-2 rounded-lg transition-colors ${post.isPromoted
                                                    ? 'bg-yellow-500/20 text-yellow-400'
                                                    : 'hover:bg-[var(--card-bg)] text-[var(--muted)]'
                                                }`}
                                            title={post.isPromoted ? "Unpromote" : "Promote"}
                                        >
                                            <Star size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(post.id)}
                                            className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg"
                                            title="Delete"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </MainLayout>
    );
}

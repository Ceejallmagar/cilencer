"use client";
import React, { useState } from "react";
import { Heart, MessageCircle, Share2, MoreHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { postsAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { ReplySection } from "./ReplySection";

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

interface PostCardProps {
    post: Post;
    onReplyClick?: () => void;
    onShareClick?: () => void;
}

// Funny like stickers
const LIKE_EMOJIS = ["🤣", "💀", "🔥", "😭", "💯", "⚡", "🎯", "👑"];

export const PostCard = ({ post, onReplyClick, onShareClick }: PostCardProps) => {
    const { user } = useAuth();
    const [liked, setLiked] = useState(post.likedBy?.includes(user?.uid || "") || false);
    const [likeCount, setLikeCount] = useState(post.likes);
    const [currentEmoji, setCurrentEmoji] = useState(LIKE_EMOJIS[0]);
    const [showBurst, setShowBurst] = useState(false);
    const [showReplies, setShowReplies] = useState(false);

    const handleLike = async () => {
        // Animate
        setShowBurst(true);
        setTimeout(() => setShowBurst(false), 400);

        // Optimistic update
        setLiked(!liked);
        setLikeCount(prev => liked ? prev - 1 : prev + 1);

        // Random emoji on like
        if (!liked) {
            setCurrentEmoji(LIKE_EMOJIS[Math.floor(Math.random() * LIKE_EMOJIS.length)]);
        }

        try {
            await postsAPI.likePost(post.id);
        } catch (error) {
            // Revert on error
            setLiked(liked);
            setLikeCount(post.likes);
            console.error("Like error:", error);
        }
    };

    const formatTimeAgo = (timestamp: any) => {
        if (!timestamp) return "Just now";
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return "Just now";
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-5 mb-4"
        >
            <div className="flex gap-4">
                {/* Main Content */}
                <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="profile-pic-container">
                                {post.userPhotoURL ? (
                                    <img
                                        src={post.userPhotoURL}
                                        alt={post.username}
                                        className="w-10 h-10 rounded-full object-cover border-2 border-[var(--primary)]/30"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[var(--btn-gradient-start)] to-[var(--btn-gradient-end)] flex items-center justify-center font-bold text-[var(--btn-text)]">
                                        {post.username?.charAt(0).toUpperCase() || "U"}
                                    </div>
                                )}
                            </div>
                            <div>
                                <div className="flex items-center gap-1">
                                    <span className="font-bold">{post.userDisplayName || post.username}</span>
                                    {post.isVerified && <span className="verified-badge" />}
                                    {post.isPromoted && (
                                        <span className="text-xs bg-[var(--accent-glow)] text-[var(--foreground)] px-2 py-0.5 rounded-full">
                                            Promoted
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                                    <span>@{post.username}</span>
                                    <span>·</span>
                                    <span>{formatTimeAgo(post.createdAt)}</span>
                                </div>
                            </div>
                        </div>
                        <button className="p-2 hover:bg-[var(--card-bg)] rounded-full transition-colors">
                            <MoreHorizontal size={18} className="text-[var(--muted)]" />
                        </button>
                    </div>

                    {/* Content */}
                    <p className="text-[var(--foreground)] mb-4 text-lg leading-relaxed">
                        {post.content}
                    </p>

                    {/* Image */}
                    {post.imageURL && (
                        <div className="mb-4 rounded-xl overflow-hidden border border-[var(--card-border)]">
                            <img
                                src={post.imageURL}
                                alt="Post"
                                className="w-full h-auto max-h-96 object-cover"
                            />
                        </div>
                    )}
                </div>

                {/* Actions Column (Right Side) */}
                <div className="post-actions-column hidden md:flex">
                    {/* Like Button */}
                    <button
                        onClick={handleLike}
                        className={`post-action-btn ${liked ? 'liked' : ''}`}
                    >
                        <div className="relative">
                            <AnimatePresence>
                                {showBurst && (
                                    <motion.span
                                        initial={{ scale: 1, opacity: 1 }}
                                        animate={{ scale: 2, opacity: 0, y: -20 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute -top-2 left-1/2 -translate-x-1/2 text-2xl"
                                    >
                                        {currentEmoji}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                            <span className={`like-emoji ${liked ? 'liked' : ''}`}>
                                {liked ? currentEmoji : "😐"}
                            </span>
                        </div>
                        <span className="text-sm font-medium">{likeCount}</span>
                    </button>

                    {/* Reply Button */}
                    <button
                        onClick={() => setShowReplies(!showReplies)}
                        className="post-action-btn"
                    >
                        <MessageCircle size={22} />
                        <span className="text-sm font-medium">{post.replyCount}</span>
                    </button>

                    {/* Share Button */}
                    <button
                        onClick={onShareClick}
                        className="post-action-btn"
                    >
                        <Share2 size={22} />
                        <span className="text-sm font-medium">{post.shares}</span>
                    </button>
                </div>
            </div>

            {/* Mobile Actions (Bottom) */}
            <div className="flex md:hidden items-center justify-around pt-4 mt-4 border-t border-[var(--card-border)]">
                <button
                    onClick={handleLike}
                    className={`flex items-center gap-2 p-2 rounded-lg ${liked ? 'text-red-400' : 'text-[var(--muted)]'}`}
                >
                    <span className="text-xl">{liked ? currentEmoji : "😐"}</span>
                    <span className="text-sm">{likeCount}</span>
                </button>
                <button
                    onClick={() => setShowReplies(!showReplies)}
                    className="flex items-center gap-2 p-2 rounded-lg text-[var(--muted)]"
                >
                    <MessageCircle size={20} />
                    <span className="text-sm">{post.replyCount}</span>
                </button>
                <button
                    onClick={onShareClick}
                    className="flex items-center gap-2 p-2 rounded-lg text-[var(--muted)]"
                >
                    <Share2 size={20} />
                    <span className="text-sm">{post.shares}</span>
                </button>
            </div>

            {/* Replies Section */}
            <ReplySection postId={post.id} isOpen={showReplies} />
        </motion.div>
    );
};

export default PostCard;

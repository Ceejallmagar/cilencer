"use client";
import React, { useState } from "react";
import { Heart, MessageCircle, Share2, MoreHorizontal, Trash } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { postsAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { ReplySection } from "./ReplySection";
import { getBadgeEmoji, getBadgeImage, getBadgeType } from "@/lib/badges";

interface Post {
    id: string;
    userId: string;
    username: string;
    userPhotoURL: string;
    userDisplayName: string;
    isVerified: boolean;
    activeBadge?: string | null;
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
    onDelete?: () => void;
}

// Funny like stickers
const LIKE_EMOJIS = ["🤣", "💀", "🔥", "😭", "💯", "⚡", "🎯", "👑"];

export const PostCard = ({ post, onReplyClick, onShareClick, onDelete }: PostCardProps) => {
    const { user } = useAuth();
    const [liked, setLiked] = useState(post.likedBy?.includes(user?.uid || "") || false);
    const [likeCount, setLikeCount] = useState(post.likes);
    const [currentEmoji, setCurrentEmoji] = useState(LIKE_EMOJIS[0]);
    const [showBurst, setShowBurst] = useState(false);
    const [showReplies, setShowReplies] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this post?")) return;
        try {
            await postsAPI.deletePost(post.id);
            if (onDelete) onDelete();
            else window.location.reload(); // Fallback if no callback
        } catch (error) {
            alert("Failed to delete post");
            console.error(error);
        }
    };

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
                            <div className="profile-pic-container relative">
                                <div className="relative z-0">
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
                                    {/* Frame Badge Overlay */}
                                    {post.activeBadge && getBadgeType(post.activeBadge) === 'frame' && (
                                        <img
                                            src={getBadgeImage(post.activeBadge)}
                                            alt="Frame Badge"
                                            className="badge-frame"
                                            style={{ width: '150%', height: '150%' }}
                                        />
                                    )}
                                </div>
                                {/* Standard Badge (Bottom Right) */}
                                {post.activeBadge && getBadgeType(post.activeBadge) !== 'frame' && (
                                    <span className="absolute -bottom-1 -right-1 bg-[var(--card-bg)] rounded-full w-5 h-5 flex items-center justify-center text-xs border border-[var(--card-border)] shadow-sm">
                                        {getBadgeImage(post.activeBadge) ? (
                                            <img
                                                src={getBadgeImage(post.activeBadge)}
                                                alt="Badge"
                                                className="w-4 h-4 object-contain"
                                            />
                                        ) : (
                                            getBadgeEmoji(post.activeBadge)
                                        )}
                                    </span>
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
                        <div className="relative">
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                className="p-2 hover:bg-[var(--card-bg)] rounded-full transition-colors"
                            >
                                <MoreHorizontal size={18} className="text-[var(--muted)]" />
                            </button>
                            {showMenu && post.userId === user?.uid && (
                                <div className="absolute right-0 top-full mt-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl shadow-xl z-10 overflow-hidden min-w-[150px]">
                                    <button
                                        onClick={handleDelete}
                                        className="flex items-center gap-2 w-full px-4 py-3 text-red-500 hover:bg-red-500/10 text-sm font-bold transition-colors text-left"
                                    >
                                        <Trash size={16} />
                                        Delete Post
                                    </button>
                                </div>
                            )}
                            {showMenu && post.userId !== user?.uid && (
                                <div className="absolute right-0 top-full mt-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl shadow-xl z-10 overflow-hidden min-w-[200px]">
                                    <button
                                        onClick={async () => {
                                            if (confirm("We won't suggest posts like this again.")) {
                                                try {
                                                    await postsAPI.notInterested(post.id);
                                                    if (onDelete) onDelete(); // Reuse delete callback to hide post visually
                                                    else window.location.reload();
                                                } catch (e) { console.error(e); }
                                            }
                                        }}
                                        className="flex items-center gap-2 w-full px-4 py-3 text-[var(--muted)] hover:bg-[var(--bg-secondary)] text-sm font-bold transition-colors text-left"
                                    >
                                        <span className="text-xl">👎</span>
                                        Don't suggest this
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <p className="text-[var(--foreground)] mb-4 text-lg leading-relaxed">
                        {post.content}
                    </p>

                    {/* Media */}
                    {post.imageURL && (
                        <div className="mb-4 rounded-xl overflow-hidden border border-[var(--card-border)] bg-black/10">
                            {post.imageURL.match(/\.(mp4|webm|ogg|mov)(\?|$)/i) ? (
                                <video
                                    src={post.imageURL}
                                    controls
                                    className="w-full h-auto"
                                />
                            ) : (
                                <img
                                    src={post.imageURL}
                                    alt="Post"
                                    className="w-full h-auto"
                                    loading="lazy"
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Actions Bar (Bottom - Always Visible) */}
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-[var(--card-border)]">
                <div className="flex items-center gap-4 sm:gap-6">
                    {/* Like Button */}
                    <button
                        onClick={handleLike}
                        className={`flex items-center gap-2 group transition-colors ${liked ? 'text-red-500' : 'text-[var(--muted)] hover:text-red-500'}`}
                    >
                        <div className="relative">
                            <AnimatePresence>
                                {showBurst && (
                                    <motion.span
                                        initial={{ scale: 1, opacity: 1 }}
                                        animate={{ scale: 2, opacity: 0, y: -20 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute -top-8 left-1/2 -translate-x-1/2 text-2xl pointer-events-none"
                                    >
                                        {currentEmoji}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                            <span className={`text-xl transition-transform group-active:scale-125 ${liked ? 'scale-110' : ''}`}>
                                {liked ? currentEmoji : "😐"}
                            </span>
                        </div>
                        <span className="text-sm font-bold">{likeCount}</span>
                    </button>

                    {/* Reply Button */}
                    <button
                        onClick={() => setShowReplies(!showReplies)}
                        className="flex items-center gap-2 text-[var(--muted)] hover:text-[var(--primary)] transition-colors group"
                    >
                        <MessageCircle size={20} className="group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-bold">{post.replyCount}</span>
                    </button>

                    {/* Share Button */}
                    <button
                        onClick={onShareClick}
                        className="flex items-center gap-2 text-[var(--muted)] hover:text-green-500 transition-colors group"
                    >
                        <Share2 size={20} className="group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-bold">{post.shares}</span>
                    </button>
                </div>
            </div>

            {/* Replies Section */}
            <ReplySection postId={post.id} isOpen={showReplies} />
        </motion.div>
    );
};

export default PostCard;

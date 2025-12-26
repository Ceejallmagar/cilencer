"use client";
import React, { useState, useRef } from "react";
import { X, Image, Plus, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { postsAPI } from "@/lib/api";
import { useRouter } from "next/navigation";

interface CreatePostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPostCreated?: () => void;
}

const CATEGORIES = [
    { id: "dank", label: "🔥 Dank" },
    { id: "savage", label: "💀 Savage" },
    { id: "wholesome", label: "💖 Wholesome" },
    { id: "gaming", label: "🎮 Gaming" },
    { id: "anime", label: "🎌 Anime" },
    { id: "sports", label: "⚽ Sports" },
    { id: "tech", label: "💻 Tech" },
    { id: "random", label: "🎲 Random" },
];

export const CreatePostModal = ({ isOpen, onClose, onPostCreated }: CreatePostModalProps) => {
    const [content, setContent] = useState("");
    const [imageURL, setImageURL] = useState("");
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleCategoryToggle = (categoryId: string) => {
        setSelectedCategories(prev =>
            prev.includes(categoryId)
                ? prev.filter(c => c !== categoryId)
                : [...prev, categoryId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!content.trim()) {
            setError("Write something epic first! 🔥");
            return;
        }

        setLoading(true);
        setError("");

        try {
            await postsAPI.createPost({
                content: content.trim(),
                imageURL: imageURL.trim() || undefined,
                category: selectedCategories.length > 0 ? selectedCategories : undefined,
            });

            // Reset form
            setContent("");
            setImageURL("");
            setSelectedCategories([]);

            onPostCreated?.();
            onClose();
        } catch (err: any) {
            setError(err.message || "Failed to create post");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="modal-content"
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold gradient-text">Create Epic Post 🚀</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[var(--card-bg)] rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {error && (
                    <div className="bg-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Content */}
                    <div>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="What chaos are you bringing today? 😈"
                            className="input-field min-h-[120px] resize-none"
                            maxLength={500}
                        />
                        <div className="text-right text-sm text-[var(--muted)] mt-1">
                            {content.length}/500
                        </div>
                    </div>

                    {/* Image URL */}
                    <div>
                        <label className="block text-sm font-medium mb-2 text-[var(--muted)]">
                            Image URL (optional)
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="url"
                                value={imageURL}
                                onChange={(e) => setImageURL(e.target.value)}
                                placeholder="https://example.com/meme.jpg"
                                className="input-field flex-1"
                            />
                        </div>
                    </div>

                    {/* Image Preview */}
                    {imageURL && (
                        <div className="relative rounded-xl overflow-hidden border border-[var(--card-border)]">
                            <img
                                src={imageURL}
                                alt="Preview"
                                className="w-full h-48 object-cover"
                                onError={() => setImageURL("")}
                            />
                            <button
                                type="button"
                                onClick={() => setImageURL("")}
                                className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    )}

                    {/* Categories */}
                    <div>
                        <label className="block text-sm font-medium mb-2 text-[var(--muted)]">
                            Categories
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => handleCategoryToggle(cat.id)}
                                    className={`filter-tag ${selectedCategories.includes(cat.id) ? 'active' : ''
                                        }`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading || !content.trim()}
                        className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                Posting...
                            </>
                        ) : (
                            <>
                                <Plus size={20} />
                                Post Meme
                            </>
                        )}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default CreatePostModal;

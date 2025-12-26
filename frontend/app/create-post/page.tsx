"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import MainLayout from "@/components/MainLayout";
import { postsAPI } from "@/lib/api";
import { Image, X, Loader2, Plus, ArrowLeft } from "lucide-react";

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

export default function CreatePostPage() {
    const router = useRouter();
    const [content, setContent] = useState("");
    const [imageURL, setImageURL] = useState("");
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

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

            router.push("/home");
        } catch (err: any) {
            setError(err.message || "Failed to create post");
        } finally {
            setLoading(false);
        }
    };

    return (
        <MainLayout>
            <div className="pb-20 md:pb-8 max-w-2xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 mb-8"
                >
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-[var(--card-bg)] rounded-lg"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold gradient-text">Create Post 🚀</h1>
                        <p className="text-[var(--muted)]">Share your epic meme with the world</p>
                    </div>
                </motion.div>

                {error && (
                    <div className="bg-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm">
                        {error}
                    </div>
                )}

                <motion.form
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    onSubmit={handleSubmit}
                    className="glass-card p-6 space-y-6"
                >
                    {/* Content */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            What chaos are you bringing today? 😈
                        </label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Type something legendary..."
                            className="input-field min-h-[150px] resize-none"
                            maxLength={500}
                        />
                        <div className="flex justify-between text-sm text-[var(--muted)] mt-2">
                            <span>Make it count!</span>
                            <span>{content.length}/500</span>
                        </div>
                    </div>

                    {/* Image URL */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            <Image size={16} className="inline mr-2" />
                            Meme Image (optional)
                        </label>
                        <input
                            type="url"
                            value={imageURL}
                            onChange={(e) => setImageURL(e.target.value)}
                            placeholder="https://example.com/your-meme.jpg"
                            className="input-field"
                        />
                    </div>

                    {/* Image Preview */}
                    {imageURL && (
                        <div className="relative rounded-xl overflow-hidden border border-[var(--card-border)]">
                            <img
                                src={imageURL}
                                alt="Preview"
                                className="w-full h-64 object-cover"
                                onError={() => setImageURL("")}
                            />
                            <button
                                type="button"
                                onClick={() => setImageURL("")}
                                className="absolute top-3 right-3 p-2 bg-black/50 rounded-full hover:bg-black/70"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    )}

                    {/* Categories */}
                    <div>
                        <label className="block text-sm font-medium mb-3">
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
                        className="w-full btn-primary flex items-center justify-center gap-2 py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={22} className="animate-spin" />
                                Posting...
                            </>
                        ) : (
                            <>
                                <Plus size={22} />
                                Share the Chaos 🔥
                            </>
                        )}
                    </button>
                </motion.form>
            </div>
        </MainLayout>
    );
}

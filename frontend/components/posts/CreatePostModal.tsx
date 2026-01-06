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
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string>("");
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleCategoryToggle = (categoryId: string) => {
        setSelectedCategories(prev =>
            prev.includes(categoryId)
                ? prev.filter(c => c !== categoryId)
                : [...prev, categoryId]
        );
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                setError("File is too large! Max 10MB please. 😅");
                return;
            }
            setSelectedFile(file);
            setImageURL(""); // Clear URL input if file is selected
            const reader = new FileReader();
            reader.onloadend = () => {
                setFilePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const uploadFile = async (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const formData = new FormData();
            formData.append('image', file);

            const xhr = new XMLHttpRequest();

            // Track upload progress
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const progress = (e.loaded / e.total) * 100;
                    setUploadProgress(progress);
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status === 200) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        resolve(response.imageURL);
                    } catch (error) {
                        reject(new Error('Failed to parse upload response'));
                    }
                } else {
                    reject(new Error(`Upload failed with status ${xhr.status}`));
                }
            });

            xhr.addEventListener('error', () => {
                reject(new Error('Upload failed'));
            });

            // Get auth token for the request
            const getAuthToken = async () => {
                try {
                    const user = (await import('@/lib/firebase')).auth.currentUser;
                    if (user) {
                        return await user.getIdToken();
                    }
                    throw new Error('Not authenticated');
                } catch (error) {
                    throw new Error('Failed to get auth token');
                }
            };

            getAuthToken().then(token => {
                xhr.open('POST', `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/posts/upload-image`);
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                xhr.send(formData);
            }).catch(error => {
                reject(error);
            });
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!content.trim() && !selectedFile && !imageURL) {
            setError("Write something or add a meme! 🔥");
            return;
        }

        setLoading(true);
        setError("");
        setUploadProgress(0);

        try {
            let finalImageURL = imageURL.trim();

            if (selectedFile) {
                finalImageURL = await uploadFile(selectedFile);
            }

            await postsAPI.createPost({
                content: content.trim(),
                imageURL: finalImageURL || undefined,
                category: selectedCategories.length > 0 ? selectedCategories : undefined,
            });

            // Reset form
            setContent("");
            setImageURL("");
            setSelectedFile(null);
            setFilePreview("");
            setSelectedCategories([]);

            onPostCreated?.();
            onClose();
        } catch (err: any) {
            setError(err.message || "Failed to create post");
        } finally {
            setLoading(false);
            setUploadProgress(0);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="modal-overlay"
            onClick={(e) => e.target === e.currentTarget && onClose()}
            onTouchStart={(e) => e.target === e.currentTarget && onClose()}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
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

                    {/* Media Upload */}
                    <div>
                        <label className="block text-sm font-medium mb-2 text-[var(--muted)]">
                            Add Media (Photo/Video)
                        </label>
                        <div className="flex flex-col gap-3">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-[var(--card-border)] rounded-xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[var(--primary)] hover:bg-[var(--card-bg)] transition-all group"
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    accept="image/*,video/*"
                                    className="hidden"
                                />
                                <div className="p-3 bg-[var(--card-bg)] rounded-full group-hover:scale-110 transition-transform">
                                    <Image size={24} className="text-[var(--muted)] group-hover:text-[var(--primary)]" />
                                </div>
                                <span className="text-sm font-medium">Choose from Gallery / Camera</span>
                                <span className="text-xs text-[var(--muted)]">Max 10MB • Photos/Videos</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="h-[1px] flex-1 bg-[var(--card-border)]"></div>
                                <span className="text-[10px] uppercase font-bold text-[var(--muted)]">OR</span>
                                <div className="h-[1px] flex-1 bg-[var(--card-border)]"></div>
                            </div>

                            <input
                                type="url"
                                value={imageURL}
                                onChange={(e) => {
                                    setImageURL(e.target.value);
                                    setSelectedFile(null);
                                    setFilePreview("");
                                }}
                                placeholder="Paste an epic image/video URL instead..."
                                className="input-field"
                            />
                        </div>
                    </div>

                    {/* Progress Bar */}
                    {loading && uploadProgress > 0 && uploadProgress < 100 && (
                        <div className="w-full bg-[var(--card-bg)] rounded-full h-2 overflow-hidden">
                            <motion.div
                                className="h-full bg-[var(--primary)]"
                                initial={{ width: 0 }}
                                animate={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                    )}

                    {/* Media Preview */}
                    {(filePreview || imageURL) && (
                        <div className="relative rounded-xl overflow-hidden border border-[var(--card-border)] bg-black/20">
                            {selectedFile?.type.startsWith('video/') || (imageURL.match(/\.(mp4|webm|ogg)$/) && !filePreview) ? (
                                <video
                                    src={filePreview || imageURL}
                                    controls
                                    className="w-full max-h-64 object-contain"
                                />
                            ) : (
                                <img
                                    src={filePreview || imageURL}
                                    alt="Preview"
                                    className="w-full max-h-64 object-contain"
                                    onError={() => {
                                        if (imageURL) setImageURL("");
                                    }}
                                />
                            )}
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedFile(null);
                                    setFilePreview("");
                                    setImageURL("");
                                }}
                                className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full hover:bg-black/80 transition-colors"
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

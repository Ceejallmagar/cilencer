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
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string>("");
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState("");
    const fileInputRef = React.useRef<HTMLInputElement>(null);

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
            setImageURL("");
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

            router.push("/home");
        } catch (err: any) {
            setError(err.message || "Failed to create post");
        } finally {
            setLoading(false);
            setUploadProgress(0);
        }
    };

    return (
        <MainLayout>
            <div className="pb-20 md:pb-8 max-w-2xl mx-auto w-full">
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

                    {/* Media Upload */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Add Media (Photo/Video)
                        </label>
                        <div className="flex flex-col gap-4">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-[var(--card-border)] rounded-2xl p-12 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-[var(--primary)] hover:bg-[var(--card-bg)] transition-all group overflow-hidden"
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    accept="image/*,video/*"
                                    className="hidden"
                                />
                                <div className="p-4 bg-[var(--card-bg)] rounded-full group-hover:scale-110 transition-transform">
                                    <Image size={32} className="text-[var(--muted)] group-hover:text-[var(--primary)]" />
                                </div>
                                <div className="text-center">
                                    <span className="block text-lg font-bold">Choose from Gallery / Camera</span>
                                    <span className="text-sm text-[var(--muted)]">Photos or Videos up to 10MB</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="h-[1px] flex-1 bg-[var(--card-border)]"></div>
                                <span className="text-xs uppercase font-black text-[var(--muted)]">Or paste URL</span>
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
                                placeholder="https://example.com/meme.jpg"
                                className="input-field"
                            />
                        </div>
                    </div>

                    {/* Progress Bar */}
                    {loading && uploadProgress > 0 && uploadProgress < 100 && (
                        <div className="w-full bg-[var(--card-bg)] rounded-full h-3 overflow-hidden border border-[var(--card-border)]">
                            <motion.div
                                className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]"
                                initial={{ width: 0 }}
                                animate={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                    )}

                    {/* Media Preview */}
                    {(filePreview || imageURL) && (
                        <div className="relative rounded-2xl overflow-hidden border border-[var(--card-border)] bg-black/40">
                            {selectedFile?.type.startsWith('video/') || (imageURL.match(/\.(mp4|webm|ogg|mov)(\?|$)/i) && !filePreview) ? (
                                <video
                                    src={filePreview || imageURL}
                                    controls
                                    className="w-full max-h-[400px] object-contain"
                                />
                            ) : (
                                <img
                                    src={filePreview || imageURL}
                                    alt="Preview"
                                    className="w-full max-h-[400px] object-contain"
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
                                className="absolute top-4 right-4 p-2 bg-black/60 rounded-full hover:bg-black/80 transition-colors backdrop-blur-md"
                            >
                                <X size={20} />
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

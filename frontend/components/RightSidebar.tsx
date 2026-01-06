"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { adsAPI } from "@/lib/api";
import { Plus, Trash, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Ad {
    id: string;
    title: string;
    content: string;
    imageURL?: string;
    linkURL?: string;
    createdAt?: any;
    createdBy?: string;
}

export const RightSidebar = () => {
    const { user, userProfile } = useAuth();
    const isAdmin = userProfile?.isAdmin || false;

    const [ads, setAds] = useState<Ad[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Form state
    const [newAd, setNewAd] = useState({
        title: "",
        content: "",
        imageURL: "",
        linkURL: ""
    });
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchAds();
    }, []);

    const fetchAds = async () => {
        try {
            const data = await adsAPI.getAds();
            setAds(data);
        } catch (error) {
            console.error("Failed to fetch ads", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAd = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            await adsAPI.createAd(newAd);
            setNewAd({ title: "", content: "", imageURL: "", linkURL: "" });
            setShowCreateModal(false);
            fetchAds();
        } catch (error) {
            alert("Failed to create ad");
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteAd = async (id: string) => {
        if (!confirm("Delete this ad?")) return;
        try {
            await adsAPI.deleteAd(id);
            setAds(prev => prev.filter(ad => ad.id !== id));
        } catch (error) {
            alert("Failed to delete ad");
        }
    };

    return (
        <aside className="hidden xl:block w-80 fixed right-0 top-0 bottom-0 h-screen pt-28 pb-8 px-4 overflow-y-auto border-l border-[var(--card-border)] bg-[var(--background)]/50 backdrop-blur-sm z-40">
            {/* Admin Header */}
            {isAdmin && (
                <div className="mb-6 flex justify-between items-center">
                    <h3 className="font-bold text-[var(--foreground)]">Sponsored</h3>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="p-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary)]/90 transition-colors"
                        title="Add Ad"
                    >
                        <Plus size={18} />
                    </button>
                </div>
            )}

            {!isAdmin && ads.length > 0 && (
                <h3 className="font-bold text-[var(--muted)] text-sm uppercase tracking-wider mb-4">Sponsored</h3>
            )}

            {/* Ads List */}
            <div className="space-y-6">
                {ads.map((ad, index) => (
                    <div key={ad.id} className="glass-card overflow-hidden group relative">
                        {/* Admin Delete Button */}
                        {isAdmin && (
                            <button
                                onClick={() => handleDeleteAd(ad.id)}
                                className="absolute top-2 right-2 p-1.5 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            >
                                <Trash size={14} />
                            </button>
                        )}

                        {ad.imageURL && (
                            <div className="w-full h-40 bg-black/20 relative">
                                <img
                                    src={ad.imageURL}
                                    alt={ad.title}
                                    className="w-full h-full object-cover"
                                />
                                {ad.linkURL && (
                                    <a
                                        href={ad.linkURL}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="absolute bottom-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                                    >
                                        <ExternalLink size={14} />
                                    </a>
                                )}
                            </div>
                        )}
                        <div className="p-4">
                            <h4 className="font-bold text-[var(--foreground)] mb-1">{ad.title}</h4>
                            <p className="text-sm text-[var(--muted)] mb-3">{ad.content}</p>
                            {ad.linkURL && (
                                <a
                                    href={ad.linkURL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-full text-center py-2 bg-[var(--card-border)] hover:bg-[var(--primary)]/10 text-[var(--primary)] rounded-lg text-sm font-bold transition-colors"
                                >
                                    Learn More
                                </a>
                            )}
                        </div>
                    </div>
                ))}

                {!loading && ads.length === 0 && isAdmin && (
                    <div className="text-center p-8 border-2 border-dashed border-[var(--card-border)] rounded-xl text-[var(--muted)]">
                        <p>No active ads</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="text-[var(--primary)] text-sm font-bold mt-2"
                        >
                            Create one
                        </button>
                    </div>
                )}
            </div>

            {/* Ad Creation Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    >
                        <div className="glass-card w-full max-w-md p-6 relative">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="absolute top-4 right-4 text-[var(--muted)] hover:text-[var(--foreground)]"
                            >
                                ✕
                            </button>
                            <h2 className="text-xl font-bold mb-4">Create Advertisement</h2>
                            <form onSubmit={handleCreateAd} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Title</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--card-border)] focus:outline-none focus:border-[var(--primary)]"
                                        value={newAd.title}
                                        onChange={e => setNewAd({ ...newAd, title: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Description</label>
                                    <textarea
                                        required
                                        rows={3}
                                        className="w-full p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--card-border)] focus:outline-none focus:border-[var(--primary)]"
                                        value={newAd.content}
                                        onChange={e => setNewAd({ ...newAd, content: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Image URL (Optional)</label>
                                    <input
                                        type="url"
                                        className="w-full p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--card-border)] focus:outline-none focus:border-[var(--primary)]"
                                        value={newAd.imageURL}
                                        onChange={e => setNewAd({ ...newAd, imageURL: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Target Link (Optional)</label>
                                    <input
                                        type="url"
                                        className="w-full p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--card-border)] focus:outline-none focus:border-[var(--primary)]"
                                        value={newAd.linkURL}
                                        onChange={e => setNewAd({ ...newAd, linkURL: e.target.value })}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="w-full py-3 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                                >
                                    {creating ? "Creating..." : "Pubish Ad"}
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </aside>
    );
};

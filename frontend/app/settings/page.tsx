"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import MainLayout from "@/components/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { usersAPI } from "@/lib/api";
import { getBadgeEmoji, getBadgeImage } from "@/lib/badges";
import { doc, updateDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { User, Lock, Palette, Globe, Info, Loader2, Check, Award } from "lucide-react";

const LANGUAGES = [
    { code: "en", name: "English" },
    { code: "es", name: "Español" },
    { code: "fr", name: "Français" },
    { code: "de", name: "Deutsch" },
    { code: "ja", name: "日本語" },
    { code: "ko", name: "한국어" },
    { code: "zh", name: "中文" },
    { code: "hi", name: "हिन्दी" },
    { code: "ne", name: "नेपाली" },
];

export default function SettingsPage() {
    const { user, userProfile, refreshProfile } = useAuth();
    const { theme, setTheme } = useTheme();

    const [displayName, setDisplayName] = useState(userProfile?.displayName || "");
    const [username, setUsername] = useState(userProfile?.username || "");
    const [bio, setBio] = useState(userProfile?.bio || "");
    const [photoURL, setPhotoURL] = useState(userProfile?.photoURL || "");
    const [language, setLanguage] = useState(userProfile?.language || "en");
    const [activeBadge, setActiveBadge] = useState(userProfile?.activeBadge || "");
    const [bannerColor, setBannerColor] = useState(userProfile?.bannerColor || "");

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [saving, setSaving] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    const handleSaveProfile = async () => {
        setSaving(true);
        setError("");
        setSuccess("");

        try {
            await usersAPI.updateUser(user!.uid, {
                displayName,
                username,
                bio,
                photoURL,
                language,
                theme,
                activeBadge,
                bannerColor,
            });

            await refreshProfile();
            setSuccess("Profile updated successfully! ✨");
        } catch (err: any) {
            setError(err.message || "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            setError("Passwords don't match!");
            return;
        }
        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setSavingPassword(true);
        setError("");
        setSuccess("");

        try {
            if (user && user.email) {
                const credential = EmailAuthProvider.credential(user.email, currentPassword);
                await reauthenticateWithCredential(user, credential);
                await updatePassword(user, newPassword);

                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
                setSuccess("Password changed successfully! 🔐");
            }
        } catch (err: any) {
            if (err.code === "auth/wrong-password") {
                setError("Current password is incorrect");
            } else {
                setError(err.message || "Failed to change password");
            }
        } finally {
            setSavingPassword(false);
        }
    };

    return (
        <MainLayout>
            <div className="pb-20 md:pb-8 max-w-2xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-3xl font-bold gradient-text">Settings ⚙️</h1>
                    <p className="text-[var(--muted)]">Customize your experience</p>
                </motion.div>

                {/* Messages */}
                {error && (
                    <div className="bg-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="bg-green-500/20 text-green-400 p-4 rounded-xl mb-6 text-sm flex items-center gap-2">
                        <Check size={18} />
                        {success}
                    </div>
                )}

                {/* Profile Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-6 mb-6"
                >
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <User size={20} />
                        Profile
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-[var(--muted)]">
                                Display Name
                            </label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="input-field"
                                placeholder="Your name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-[var(--muted)]">
                                Username
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="input-field"
                                placeholder="username"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-[var(--muted)]">
                                Bio
                            </label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                className="input-field resize-none"
                                rows={3}
                                placeholder="Tell us about yourself..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-[var(--muted)]">
                                Profile Picture URL
                            </label>
                            <input
                                type="url"
                                value={photoURL}
                                onChange={(e) => setPhotoURL(e.target.value)}
                                className="input-field"
                                placeholder="https://..."
                            />
                        </div>

                        <button
                            onClick={handleSaveProfile}
                            disabled={saving}
                            className="btn-primary w-full disabled:opacity-50"
                        >
                            {saving ? (
                                <><Loader2 size={18} className="animate-spin inline mr-2" /> Saving...</>
                            ) : (
                                "Save Profile"
                            )}
                        </button>
                    </div>
                </motion.div>

                {/* Badge Selection Section */}
                {
                    ((userProfile?.badges?.length ?? 0) > 0 || userProfile?.isAdmin) && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 }}
                            className="glass-card p-6 mb-6"
                        >
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Award size={20} />
                                Profile Badge
                            </h2>
                            <p className="text-sm text-[var(--muted)] mb-4">
                                Select a badge to display next to your name
                            </p>

                            <div className="flex flex-wrap gap-3">
                                {/* Badge Option: None */}
                                <div
                                    onClick={() => setActiveBadge("")}
                                    className={`cursor-pointer px-4 py-3 rounded-xl border-2 transition-all flex items-center gap-2 ${!activeBadge
                                        ? "border-[var(--primary)] bg-[var(--primary)]/10"
                                        : "border-[var(--card-border)] bg-[var(--card-bg)] hover:border-[var(--primary)]/50"
                                        }`}
                                >
                                    <span className="text-xl">🚫</span>
                                    <span className="font-medium">None</span>
                                </div>

                                {/* Merge and render badges */}
                                {[
                                    ...(userProfile?.isAdmin ? ["admin_badge"] : []),
                                    ...(userProfile?.badges || [])
                                ].filter((badge, index, self) => self.indexOf(badge) === index)
                                    .map((badge) => {


                                        return (
                                            <div
                                                key={badge}
                                                onClick={() => setActiveBadge(badge)}
                                                className={`cursor-pointer px-4 py-3 rounded-xl border-2 transition-all flex items-center gap-2 ${activeBadge === badge
                                                    ? "border-purple-500 bg-purple-500/10 shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                                                    : "border-[var(--card-border)] bg-[var(--card-bg)] hover:border-purple-500/50"
                                                    }`} // Closing the className template literal
                                            >
                                                <span className="text-xl">
                                                    {getBadgeImage(badge) ? (
                                                        <img src={getBadgeImage(badge)} alt="Badge" className="w-6 h-6 object-contain" />
                                                    ) : (
                                                        getBadgeEmoji(badge)
                                                    )}
                                                </span>
                                                <span className="font-medium capitalize">{badge.replace(/_/g, " ")}</span>
                                            </div>
                                        );
                                    })}
                            </div>
                        </motion.div>
                    )
                }

                {/* Password Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card p-6 mb-6"
                >
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Lock size={20} />
                        Change Password
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-[var(--muted)]">
                                Current Password
                            </label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="input-field"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-[var(--muted)]">
                                New Password
                            </label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="input-field"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-[var(--muted)]">
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="input-field"
                            />
                        </div>

                        <button
                            onClick={handleChangePassword}
                            disabled={savingPassword || !currentPassword || !newPassword}
                            className="btn-secondary w-full disabled:opacity-50"
                        >
                            {savingPassword ? "Changing..." : "Change Password"}
                        </button>
                    </div>
                </motion.div>

                {/* Theme Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-card p-6 mb-6"
                >
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Palette size={20} />
                        Theme
                    </h2>

                    <div className="flex gap-4">
                        <button
                            onClick={() => setTheme("dark")}
                            className={`flex-1 py-4 rounded-xl border-2 transition-colors ${theme === "dark"
                                ? "border-[var(--primary)] bg-[var(--accent-glow)]"
                                : "border-[var(--card-border)] bg-[var(--card-bg)]"
                                }`}
                        >
                            <div className="text-2xl mb-2">🌙</div>
                            <span className="font-medium">Dark</span>
                        </button>
                        <button
                            onClick={() => setTheme("light")}
                            className={`flex-1 py-4 rounded-xl border-2 transition-colors ${theme === "light"
                                ? "border-[var(--primary)] bg-[var(--accent-glow)]"
                                : "border-[var(--card-border)] bg-[var(--card-bg)]"
                                }`}
                        >
                            <div className="text-2xl mb-2">☀️</div>
                            <span className="font-medium">Light</span>
                        </button>
                    </div>
                </motion.div>

                {/* Language Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass-card p-6 mb-6"
                >
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Globe size={20} />
                        Language
                    </h2>

                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="input-field"
                    >
                        {LANGUAGES.map((lang) => (
                            <option key={lang.code} value={lang.code}>
                                {lang.name}
                            </option>
                        ))}
                    </select>
                </motion.div>

                {/* Ads Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="glass-card p-6 mb-6"
                >
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <span className="text-xl">📢</span>
                        Advertise with us
                    </h2>
                    <p className="text-sm text-[var(--muted)] mb-4">
                        Want to reach our chaotic community? Promote your brand on Silence Booster.
                    </p>
                    <a
                        href="mailto:cilencerproduction@gmail.com"
                        className="btn-primary w-full flex items-center justify-center gap-2 no-underline"
                    >
                        Contact for Ads
                    </a>
                </motion.div>

                {/* About Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="glass-card p-6"
                >
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Info size={20} />
                        About Silence Booster
                    </h2>

                    <div className="space-y-3 text-sm text-[var(--muted)]">
                        <p>
                            <strong className="text-[var(--foreground)]">Silence Booster</strong> is the ultimate
                            battleground for memes, trolls, and chaos. Post your best memes, participate in
                            Meme Wars, and earn badges for your contributions!
                        </p>
                        <p>
                            🏆 <strong>Meme War:</strong> Battle other users with your savage memes every month
                        </p>
                        <p>
                            🤡 <strong>Troll Me:</strong> Challenge others to roast you and become Troll of the Week
                        </p>
                        <p>
                            🏅 <strong>Badges:</strong> Earn badges for posting memes and winning battles
                        </p>
                        <div className="pt-4 border-t border-[var(--card-border)]">
                            <p className="text-xs">Version 1.0.0</p>
                        </div>
                    </div>
                </motion.div>
            </div >
        </MainLayout >
    );
}

"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import MainLayout from "@/components/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { adminAPI } from "@/lib/api";
import { Users, Loader2, ArrowLeft, Search, Shield } from "lucide-react";

export default function AdminUsersPage() {
    const router = useRouter();
    const { userProfile } = useAuth();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (userProfile && !userProfile.isAdmin) {
            router.push("/home");
            return;
        }
        fetchUsers();
    }, [userProfile, router]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await adminAPI.getAllUsers(100);
            setUsers(data);
        } catch (error) {
            console.error("Failed to fetch users:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(user =>
        user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                        <h1 className="text-2xl font-bold gradient-text">User Management 👥</h1>
                        <p className="text-[var(--muted)]">{users.length} total users</p>
                    </div>
                </motion.div>

                {/* Search */}
                <div className="relative mb-6">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search users..."
                        className="input-field pl-12"
                    />
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 size={40} className="animate-spin text-purple-400" />
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredUsers.map((user, index) => (
                            <motion.div
                                key={user.uid}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.02 }}
                                className="glass-card p-4"
                            >
                                <div className="flex items-center gap-4">
                                    {user.photoURL ? (
                                        <img
                                            src={user.photoURL}
                                            alt=""
                                            className="w-12 h-12 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center font-bold text-lg">
                                            {user.displayName?.charAt(0) || "U"}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold truncate">{user.displayName}</p>
                                            {user.isVerified && <span className="verified-badge" />}
                                            {user.isAdmin && (
                                                <span className="admin-indicator flex items-center gap-1">
                                                    <Shield size={10} />
                                                    Admin
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-[var(--muted)] truncate">
                                            @{user.username} · {user.email}
                                        </p>
                                    </div>
                                    <div className="text-right text-sm">
                                        <p className="text-purple-400">{user.memeCount || 0} memes</p>
                                        <p className="text-[var(--muted)]">{user.memeWins || 0} wins</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}

                        {filteredUsers.length === 0 && (
                            <div className="text-center py-12 text-[var(--muted)]">
                                No users found matching "{searchQuery}"
                            </div>
                        )}
                    </div>
                )}
            </div>
        </MainLayout>
    );
}

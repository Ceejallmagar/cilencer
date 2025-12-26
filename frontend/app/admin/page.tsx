"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import MainLayout from "@/components/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { adminAPI } from "@/lib/api";
import {
    LayoutDashboard, Users, Sword, MessageCircle, Bell,
    UserCog, TrendingUp, Loader2, Shield, ArrowRight
} from "lucide-react";

export default function AdminDashboard() {
    const router = useRouter();
    const { userProfile } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userProfile && !userProfile.isAdmin) {
            router.push("/home");
            return;
        }
        fetchStats();
    }, [userProfile, router]);

    const fetchStats = async () => {
        try {
            const data = await adminAPI.getStats();
            setStats(data);
        } catch (error) {
            console.error("Failed to fetch stats:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!userProfile?.isAdmin) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <Shield size={64} className="mx-auto mb-4 text-red-400" />
                        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
                        <p className="text-[var(--muted)]">You don't have admin privileges.</p>
                    </div>
                </div>
            </MainLayout>
        );
    }

    const adminSections = [
        {
            title: "Meme War Control",
            description: "Start, stop, and manage Meme Wars",
            icon: <Sword size={24} />,
            href: "/admin/meme-war",
            color: "from-red-500 to-orange-500",
        },
        {
            title: "Troll of the Week",
            description: "Select the weekly troll winner",
            icon: <MessageCircle size={24} />,
            href: "/admin/troll-of-week",
            color: "from-purple-500 to-pink-500",
        },
        {
            title: "Admin Accounts",
            description: "Manage 50+ admin accounts",
            icon: <UserCog size={24} />,
            href: "/admin/accounts",
            color: "from-blue-500 to-cyan-500",
        },
        {
            title: "Broadcast Message",
            description: "Send notifications to all users",
            icon: <Bell size={24} />,
            href: "/admin/broadcast",
            color: "from-green-500 to-emerald-500",
        },
        {
            title: "Manage Posts",
            description: "View, promote, or delete posts",
            icon: <TrendingUp size={24} />,
            href: "/admin/posts",
            color: "from-yellow-500 to-orange-500",
        },
        {
            title: "User Management",
            description: "View and manage users",
            icon: <Users size={24} />,
            href: "/admin/users",
            color: "from-indigo-500 to-purple-500",
        },
    ];

    return (
        <MainLayout>
            <div className="pb-20 md:pb-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <LayoutDashboard size={28} className="text-yellow-400" />
                        <h1 className="text-3xl font-bold">
                            <span className="gradient-text">Admin Dashboard</span>
                        </h1>
                    </div>
                    <p className="text-[var(--muted)]">
                        Full control over Silence Booster
                    </p>
                </motion.div>

                {/* Stats */}
                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 size={32} className="animate-spin text-purple-400" />
                    </div>
                ) : stats && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
                    >
                        <StatCard label="Total Users" value={stats.totalUsers} icon="👥" />
                        <StatCard label="Active (24h)" value={stats.activeUsers} icon="🟢" />
                        <StatCard label="Total Posts" value={stats.totalPosts} icon="📝" />
                        <StatCard label="Total Trolls" value={stats.totalTrolls} icon="🤡" />
                    </motion.div>
                )}

                {/* Admin Sections */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {adminSections.map((section, index) => (
                        <motion.button
                            key={section.href}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => router.push(section.href)}
                            className="glass-card p-6 text-left hover:border-purple-500/50 transition-all group"
                        >
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${section.color} flex items-center justify-center mb-4`}>
                                {section.icon}
                            </div>
                            <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
                                {section.title}
                                <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            </h3>
                            <p className="text-sm text-[var(--muted)]">{section.description}</p>
                        </motion.button>
                    ))}
                </div>
            </div>
        </MainLayout>
    );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
    return (
        <div className="glass-card p-4 text-center">
            <div className="text-2xl mb-1">{icon}</div>
            <p className="text-2xl font-bold gradient-text">{value || 0}</p>
            <p className="text-xs text-[var(--muted)]">{label}</p>
        </div>
    );
}

"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import MainLayout from "@/components/MainLayout";
import { notificationsAPI } from "@/lib/api";
import { Bell, Check, CheckCheck, Loader2, Sword, Heart, MessageCircle, Trophy, Award, Volume2 } from "lucide-react";

interface Notification {
    id: string;
    userId: string;
    type: string;
    message: string;
    read: boolean;
    postId?: string;
    createdAt: any;
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const data = await notificationsAPI.getNotifications(50);
            setNotifications(data);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (notifId: string) => {
        try {
            await notificationsAPI.markAsRead(notifId);
            setNotifications(prev =>
                prev.map(n => n.id === notifId ? { ...n, read: true } : n)
            );
        } catch (error) {
            console.error("Failed to mark as read:", error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationsAPI.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (error) {
            console.error("Failed to mark all as read:", error);
        }
    };

    const getNotificationIcon = (type: string) => {
        const icons: Record<string, any> = {
            like: <Heart size={18} className="text-red-400" />,
            reply: <MessageCircle size={18} className="text-blue-400" />,
            meme_war: <Sword size={18} className="text-[var(--foreground)]" />,
            troll_win: <Trophy size={18} className="text-yellow-400" />,
            badge: <Award size={18} className="text-[var(--foreground)]" />,
            admin_message: <Volume2 size={18} className="text-green-400" />,
        };
        return icons[type] || <Bell size={18} />;
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <MainLayout>
            <div className="pb-20 md:pb-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between mb-8"
                >
                    <div>
                        <h1 className="text-3xl font-bold gradient-text">Notifications 🔔</h1>
                        <p className="text-[var(--muted)]">
                            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
                        </p>
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllAsRead}
                            className="btn-secondary flex items-center gap-2"
                        >
                            <CheckCheck size={18} />
                            Mark all read
                        </button>
                    )}
                </motion.div>

                {/* Notifications List */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 size={40} className="animate-spin text-[var(--foreground)]" />
                    </div>
                ) : notifications.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12"
                    >
                        <div className="text-6xl mb-4">🔕</div>
                        <h3 className="text-xl font-bold mb-2">No notifications yet</h3>
                        <p className="text-[var(--muted)]">
                            When something happens, you'll see it here!
                        </p>
                    </motion.div>
                ) : (
                    <div className="space-y-3">
                        {notifications.map((notif, index) => (
                            <motion.div
                                key={notif.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.03 }}
                                onClick={() => !notif.read && handleMarkAsRead(notif.id)}
                                className={`glass-card p-4 flex items-start gap-4 cursor-pointer transition-all hover:border-[var(--primary)]/30 ${!notif.read ? "border-l-4 border-l-[var(--primary)]" : "opacity-70"
                                    }`}
                            >
                                <div className="w-10 h-10 rounded-full bg-[var(--card-bg)] flex items-center justify-center shrink-0">
                                    {getNotificationIcon(notif.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`${!notif.read ? "font-medium" : ""}`}>
                                        {notif.message}
                                    </p>
                                    <p className="text-xs text-[var(--muted)] mt-1">
                                        {(() => {
                                            if (!notif.createdAt) return "Just now";
                                            let date;
                                            // Handle Firestore Timestamp (checking _seconds for serialized, or toDate for object)
                                            if (notif.createdAt._seconds) {
                                                date = new Date(notif.createdAt._seconds * 1000);
                                            } else if (typeof notif.createdAt.toDate === 'function') {
                                                date = notif.createdAt.toDate();
                                            } else {
                                                date = new Date(notif.createdAt);
                                            }

                                            // Format relative time (simple version without external lib)
                                            const now = new Date();
                                            const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

                                            if (diffInSeconds < 60) return "Just now";
                                            if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
                                            if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
                                            return `${Math.floor(diffInSeconds / 86400)}d ago`;
                                        })()}
                                    </p>
                                </div>
                                {!notif.read && (
                                    <div className="w-2 h-2 rounded-full bg-[var(--primary)] shrink-0" />
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </MainLayout>
    );
}

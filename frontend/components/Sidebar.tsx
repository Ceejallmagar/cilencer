"use client";
import React, { useState, useEffect } from "react";
import { User, Settings, PlusSquare, Bell, Award, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter, usePathname } from "next/navigation";
import { notificationsAPI } from "@/lib/api";
import { getBadgeEmoji, getBadgeImage, getBadgeType } from "@/lib/badges";

export const Sidebar = () => {
    const router = useRouter();
    const pathname = usePathname();
    const { user, userProfile } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);
    const [showPostModal, setShowPostModal] = useState(false);

    useEffect(() => {
        const fetchUnreadCount = async () => {
            try {
                const data = await notificationsAPI.getUnreadCount();
                setUnreadCount(data.count);
            } catch (error) {
                console.error('Failed to fetch unread count:', error);
            }
        };

        if (user) {
            fetchUnreadCount();
            // Refresh every minute
            const interval = setInterval(fetchUnreadCount, 60000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push("/");
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    const isActive = (path: string) => pathname === path;

    const displayName = userProfile?.displayName || user?.displayName || "Anonymous";
    const username = userProfile?.username || user?.email?.split("@")[0] || "user";
    const photoURL = userProfile?.photoURL || user?.photoURL;
    const isAdmin = userProfile?.isAdmin || false;
    const isVerified = userProfile?.isVerified || false;
    const activeBadge = userProfile?.activeBadge;
    const position = userProfile?.position || 0;

    return (
        <>
            <div className="fixed left-0 top-28 h-[calc(100vh-7rem)] w-64 bg-[var(--background)]/80 backdrop-blur-sm border-r border-[var(--card-border)] hidden md:flex flex-col justify-between p-4 overflow-y-auto">
                <div className="space-y-2">
                    {/* User Card */}
                    <div
                        className="p-4 mb-4 rounded-xl glass-card cursor-pointer hover:border-[var(--primary)]/30 transition-colors"
                        onClick={() => router.push("/profile")}
                    >
                        <div className="flex items-center space-x-3">
                            <div className="profile-pic-container">
                                <div className="relative">
                                    {/* Profile Picture with Frame support */}
                                    <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center font-bold text-white relative z-0 overflow-visible">
                                        {userProfile?.photoURL ? (
                                            <img
                                                src={userProfile.photoURL}
                                                alt={userProfile.displayName}
                                                className="w-full h-full rounded-full object-cover"
                                            />
                                        ) : (
                                            <span>{userProfile?.displayName[0]}</span>
                                        )}

                                        {/* Frame Overlay */}
                                        {activeBadge && getBadgeType(activeBadge) === 'frame' && (
                                            <img
                                                src={getBadgeImage(activeBadge)}
                                                alt="Frame Badge"
                                                className="badge-frame"
                                                style={{ width: '150%', height: '150%' }} // Slightly larger for sidebar
                                            />
                                        )}
                                    </div>

                                    {/* Standard Badge (Bottom Right) - Only if NOT a frame */}
                                    {activeBadge && getBadgeType(activeBadge) !== 'frame' && (
                                        <span className="badge-decoration">
                                            {getBadgeImage(activeBadge) ? (
                                                <img
                                                    src={getBadgeImage(activeBadge)}
                                                    alt="Badge"
                                                    className="w-6 h-6 object-contain drop-shadow-md"
                                                />
                                            ) : (
                                                getBadgeEmoji(activeBadge)
                                            )}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1">
                                    <p className="text-sm font-bold truncate">{displayName}</p>
                                    {isVerified && <span className="verified-badge" title="Verified" />}
                                    {isAdmin && <span className="admin-indicator">Admin</span>}
                                </div>
                                <p className="text-xs text-[var(--muted)] truncate">@{username}</p>
                                {position > 0 && (
                                    <p className="text-xs text-[var(--foreground)]">🏆 Position #{position}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Navigation Items */}
                    <SidebarItem
                        icon={<User size={20} />}
                        label="Profile"
                        active={isActive("/profile")}
                        onClick={() => router.push("/profile")}
                    />
                    <SidebarItem
                        icon={<Bell size={20} />}
                        label="Notifications"
                        badge={unreadCount > 0 ? unreadCount.toString() : undefined}
                        active={isActive("/notifications")}
                        onClick={() => router.push("/notifications")}
                    />
                    <SidebarItem
                        icon={<Award size={20} />}
                        label="Badges"
                        active={isActive("/badges")}
                        onClick={() => router.push("/badges")}
                    />
                    <SidebarItem
                        icon={<Settings size={20} />}
                        label="Settings"
                        active={isActive("/settings")}
                        onClick={() => router.push("/settings")}
                    />

                    {/* Admin Dashboard Link */}
                    {isAdmin && (
                        <SidebarItem
                            icon={<ChevronDown size={20} />}
                            label="Admin Dashboard"
                            active={pathname.startsWith("/admin")}
                            onClick={() => router.push("/admin")}
                            special
                        />
                    )}

                    {/* Post Meme Button */}
                    <button
                        onClick={() => router.push("/create-post")}
                        className="w-full mt-4 btn-primary flex items-center justify-center space-x-2"
                    >
                        <PlusSquare size={20} />
                        <span>Post Meme</span>
                    </button>
                </div>

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="flex items-center space-x-3 p-3 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </div>

            {/* Mobile Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 md:hidden bg-[var(--background)]/95 backdrop-blur-xl border-t border-[var(--card-border)] z-40 shadow-lg">
                <div className="flex items-center justify-around py-2 px-2 safe-area-inset-bottom">
                    <MobileNavItem icon={<User size={24} />} active={isActive("/profile")} onClick={() => router.push("/profile")} />
                    <MobileNavItem icon={<Bell size={24} />} badge={unreadCount} active={isActive("/notifications")} onClick={() => router.push("/notifications")} />
                    <MobileNavItem icon={<PlusSquare size={28} />} primary onClick={() => router.push("/create-post")} />
                    <MobileNavItem icon={<Award size={24} />} active={isActive("/badges")} onClick={() => router.push("/badges")} />
                    <MobileNavItem icon={<Settings size={24} />} active={isActive("/settings")} onClick={() => router.push("/settings")} />
                </div>
            </div>
        </>
    );
};

const SidebarItem = ({
    icon,
    label,
    badge,
    active = false,
    special = false,
    onClick
}: {
    icon: React.ReactNode,
    label: string,
    badge?: string,
    active?: boolean,
    special?: boolean,
    onClick: () => void
}) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${active
            ? 'bg-[var(--accent-glow)] text-[var(--foreground)]'
            : special
                ? 'text-yellow-400 hover:bg-yellow-500/10'
                : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-bg)]'
            }`}
    >
        <div className="flex items-center space-x-3">
            <span className={active ? 'text-[var(--foreground)]' : ''}>{icon}</span>
            <span className="font-medium">{label}</span>
        </div>
        {badge && (
            <span className="bg-[var(--btn-gradient-start)] text-[var(--btn-text)] text-xs px-2 py-0.5 rounded-full">
                {badge}
            </span>
        )}
    </button>
);

const MobileNavItem = ({
    icon,
    active = false,
    primary = false,
    badge,
    onClick
}: {
    icon: React.ReactNode,
    active?: boolean,
    primary?: boolean,
    badge?: number,
    onClick: () => void
}) => (
    <button
        onClick={onClick}
        className={`relative p-2 rounded-xl transition-all ${primary
            ? 'bg-gradient-to-r from-[var(--btn-gradient-start)] to-[var(--btn-gradient-end)] text-[var(--btn-text)] -mt-4 shadow-lg'
            : active
                ? 'text-[var(--foreground)]'
                : 'text-[var(--muted)]'
            }`}
    >
        {icon}
        {badge && badge > 0 && (
            <span className="notification-dot">{badge > 9 ? '9+' : badge}</span>
        )}
    </button>
);

export default Sidebar;

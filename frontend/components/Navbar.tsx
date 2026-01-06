"use client";
import React, { useState, useEffect } from "react";
import { Ghost, Sword, MessageCircle, Search, Sun, Moon } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";

export const Navbar = () => {
    const router = useRouter();
    const pathname = usePathname();
    const { theme, toggleTheme } = useTheme();
    const [searchQuery, setSearchQuery] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [activeFilter, setActiveFilter] = useState("trending");
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            if (typeof window !== 'undefined') {
                const currentScrollY = window.scrollY;
                if (currentScrollY > lastScrollY && currentScrollY > 100) {
                    setIsVisible(false);
                } else {
                    setIsVisible(true);
                }
                setLastScrollY(currentScrollY);
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [lastScrollY]);

    const filters = ["trending", "fresh", "savage", "verified", "dank", "classic", "suggestion"];

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/home?search=${encodeURIComponent(searchQuery)}`);
        }
    };

    const handleNavClick = (path: string) => {
        router.push(path);
    };

    const isActive = (path: string) => pathname === path;

    return (
        <div className={`fixed top-0 left-0 right-0 z-50 bg-[var(--background)]/95 backdrop-blur-2xl shadow-md border-b border-[var(--card-border)]/80 safe-area-inset-top transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between h-14 md:h-16">
                    {/* Logo */}
                    <div
                        className="flex items-center space-x-2 cursor-pointer"
                        onClick={() => router.push("/home")}
                    >
                        <h1 className="text-xl font-bold gradient-text">
                            SilenceBooster
                        </h1>
                    </div>

                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8 relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search memes, users..."
                            className="search-input"
                        />
                    </form>

                    {/* Mobile Search Button */}
                    <button
                        onClick={() => router.push("/home?search=")}
                        className="md:hidden p-2 rounded-lg hover:bg-[var(--card-bg)] transition-colors"
                        aria-label="Search"
                    >
                        <Search size={20} />
                    </button>

                    {/* Main Nav Items */}
                    <div className="flex items-center space-x-1 md:space-x-2">
                        <NavItem
                            icon={<Ghost size={20} />}
                            label="Home"
                            active={isActive("/home")}
                            onClick={() => handleNavClick("/home")}
                        />
                        <NavItem
                            icon={<Sword size={20} />}
                            label="Meme War"
                            active={isActive("/meme-war")}
                            onClick={() => handleNavClick("/meme-war")}
                        />
                        <NavItem
                            icon={<MessageCircle size={20} />}
                            label="Troll Me"
                            active={isActive("/troll-me")}
                            onClick={() => handleNavClick("/troll-me")}
                        />

                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg hover:bg-[var(--card-bg)] transition-colors"
                            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                            aria-label="Toggle theme"
                        >
                            {theme === 'dark' ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-[var(--foreground)]" />}
                        </button>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="h-12 flex items-center space-x-3 border-t border-[var(--card-border)]/50 overflow-x-auto scrollbar-hide">
                    <span className="text-[var(--muted)] text-sm font-medium shrink-0">Filter:</span>
                    {filters.map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`filter-tag shrink-0 ${activeFilter === filter ? 'active' : ''}`}
                        >
                            {filter.charAt(0).toUpperCase() + filter.slice(1)}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

const NavItem = ({
    icon,
    label,
    active = false,
    onClick
}: {
    icon: React.ReactNode,
    label: string,
    active?: boolean,
    onClick: () => void
}) => (
    <button
        onClick={onClick}
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${active
            ? 'bg-[var(--accent-glow)] text-[var(--foreground)]'
            : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-bg)]'
            }`}
    >
        {icon}
        <span className="font-medium text-sm hidden lg:block">{label}</span>
    </button>
);

export default Navbar;

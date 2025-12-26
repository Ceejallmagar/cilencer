"use client";
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

interface MainLayoutProps {
    children: React.ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
    const { user, loading } = useAuth();
    const router = useRouter();

    React.useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[var(--primary)]"></div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
            <Navbar />
            <div className="flex">
                <Sidebar />
                <main className="flex-1 md:ml-64 pt-20 md:pt-28 pb-20 md:pb-8 px-4 md:px-6 w-full">
                    <div className="max-w-4xl mx-auto w-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MainLayout;

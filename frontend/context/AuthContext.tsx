"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { authAPI } from "@/lib/api";

interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    username: string;
    photoURL: string;
    bio: string;
    isAdmin: boolean;
    isVerified: boolean;
    position: number;
    memeWins: number;
    trollWins: number;
    memeCount: number;
    trollCount: number;
    badges: string[];
    activeBadge: string | null;
    followers: number;
    following: string[];
    theme: 'dark' | 'light';
    language: string;
    bannerColor?: string;
}

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    userProfile: null,
    loading: true,
    refreshProfile: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUserProfile = async (firebaseUser: User) => {
        try {
            // Use backend API instead of Firestore directly to avoid offline errors
            const { usersAPI } = await import('@/lib/api');
            const profileData = await usersAPI.getUser(firebaseUser.uid);
            setUserProfile(profileData);
        } catch (error) {
            console.warn("User profile not found, attempting to create...");

            try {
                // Try to create the profile if it doesn't exist
                const { authAPI } = await import('@/lib/api');
                const response = await authAPI.createProfile({
                    uid: firebaseUser.uid,
                    email: firebaseUser.email || "",
                    displayName: firebaseUser.displayName || firebaseUser.email?.split("@")[0],
                    photoURL: firebaseUser.photoURL || ""
                });

                if (response && response.user) {
                    setUserProfile(response.user);
                    return;
                }
            } catch (createError) {
                console.error("Failed to auto-create profile:", createError);
            }

            // Set basic profile from Firebase user as fallback (only if creation failed)
            setUserProfile({
                uid: firebaseUser.uid,
                email: firebaseUser.email || "",
                displayName: firebaseUser.displayName || "User",
                username: firebaseUser.email?.split("@")[0] || "user",
                photoURL: firebaseUser.photoURL || "",
                bio: "",
                isAdmin: false,
                isVerified: false,
                position: 0,
                memeWins: 0,
                trollWins: 0,
                memeCount: 0,
                trollCount: 0,
                badges: [],
                activeBadge: null,
                followers: 0,
                following: [],
                theme: "dark",
                language: "en",
                bannerColor: "",
            });
        }
    };

    const refreshProfile = async () => {
        if (user) {
            await fetchUserProfile(user);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);

            if (firebaseUser) {
                await fetchUserProfile(firebaseUser);
            } else {
                setUserProfile(null);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, userProfile, loading, refreshProfile }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

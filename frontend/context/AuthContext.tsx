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
            // Try to get profile from Firestore directly
            const userRef = doc(db, "users", firebaseUser.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                setUserProfile(userSnap.data() as UserProfile);
            } else {
                // Create new profile
                const newProfile: UserProfile = {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email || "",
                    displayName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
                    username: (firebaseUser.email?.split("@")[0] || "user").toLowerCase().replace(/[^a-z0-9]/g, "_"),
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
                };

                await setDoc(userRef, {
                    ...newProfile,
                    createdAt: serverTimestamp(),
                    lastLogin: serverTimestamp(),
                });

                setUserProfile(newProfile);
            }
        } catch (error) {
            console.error("Error fetching user profile:", error);
            // Set basic profile from Firebase user
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

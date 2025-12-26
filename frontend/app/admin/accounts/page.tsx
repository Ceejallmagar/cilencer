"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import MainLayout from "@/components/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { adminAPI } from "@/lib/api";
import {
    UserCog, Plus, Edit2, Trash2, Loader2, ArrowLeft, RefreshCw, User
} from "lucide-react";

interface AdminAccount {
    id: string;
    uid: string;
    displayName: string;
    email: string;
    index: number;
}

export default function AdminAccountsPage() {
    const router = useRouter();
    const { userProfile } = useAuth();
    const [accounts, setAccounts] = useState<AdminAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingAccount, setEditingAccount] = useState<AdminAccount | null>(null);
    const [newName, setNewName] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");

    useEffect(() => {
        if (userProfile && !userProfile.isAdmin) {
            router.push("/home");
            return;
        }
        fetchAccounts();
    }, [userProfile, router]);

    const fetchAccounts = async () => {
        setLoading(true);
        try {
            const data = await adminAPI.getAccounts();
            setAccounts(data);
        } catch (error) {
            console.error("Failed to fetch accounts:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInitialize50Accounts = async () => {
        if (!confirm("This will create 50 admin accounts. Continue?")) return;
        setActionLoading(true);
        try {
            await adminAPI.initializeAccounts("Admin@123");
            fetchAccounts();
            alert("50 admin accounts initialized successfully!");
        } catch (error: any) {
            alert(error.message || "Failed to initialize accounts");
        } finally {
            setActionLoading(false);
        }
    };

    const handleCreateAccount = async () => {
        if (!newName || !newEmail || !newPassword) {
            alert("Please fill all fields");
            return;
        }
        setActionLoading(true);
        try {
            await adminAPI.createAccount({
                displayName: newName,
                email: newEmail,
                password: newPassword,
            });
            setShowCreateModal(false);
            setNewName("");
            setNewEmail("");
            setNewPassword("");
            fetchAccounts();
        } catch (error: any) {
            alert(error.message || "Failed to create account");
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateName = async () => {
        if (!editingAccount || !newName.trim()) return;
        setActionLoading(true);
        try {
            await adminAPI.updateAccount(editingAccount.uid, newName);
            setEditingAccount(null);
            setNewName("");
            fetchAccounts();
        } catch (error: any) {
            alert(error.message || "Failed to update");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteAccount = async (accountId: string) => {
        if (!confirm("Are you sure you want to delete this admin account?")) return;
        try {
            await adminAPI.deleteAccount(accountId);
            fetchAccounts();
        } catch (error: any) {
            alert(error.message || "Failed to delete");
        }
    };

    if (!userProfile?.isAdmin) return null;

    return (
        <MainLayout>
            <div className="pb-20 md:pb-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between mb-8"
                >
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push("/admin")} className="p-2 hover:bg-[var(--card-bg)] rounded-lg">
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold gradient-text">Admin Accounts 👥</h1>
                            <p className="text-[var(--muted)]">{accounts.length} accounts</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Add New
                    </button>
                </motion.div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 size={40} className="animate-spin text-purple-400" />
                    </div>
                ) : (
                    <>
                        {/* Initialize 50 Accounts Button */}
                        {accounts.length < 50 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-card p-6 mb-8 text-center"
                            >
                                <RefreshCw size={32} className="mx-auto mb-3 text-purple-400" />
                                <h3 className="font-bold mb-2">Initialize 50 Admin Accounts</h3>
                                <p className="text-sm text-[var(--muted)] mb-4">
                                    Create all 50 admin accounts with changeable names
                                </p>
                                <button
                                    onClick={handleInitialize50Accounts}
                                    disabled={actionLoading}
                                    className="btn-primary disabled:opacity-50"
                                >
                                    {actionLoading ? "Creating..." : "Initialize Accounts"}
                                </button>
                            </motion.div>
                        )}

                        {/* Accounts Grid */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {accounts.map((account, index) => (
                                <motion.div
                                    key={account.uid}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.02 }}
                                    className="glass-card p-4"
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center font-bold">
                                            {account.displayName?.charAt(0) || account.index}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold truncate">{account.displayName}</p>
                                                <span className="verified-badge" />
                                            </div>
                                            <p className="text-xs text-[var(--muted)] truncate">{account.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setEditingAccount(account);
                                                setNewName(account.displayName);
                                            }}
                                            className="btn-secondary flex-1 flex items-center justify-center gap-1 text-sm py-2"
                                        >
                                            <Edit2 size={14} />
                                            Edit Name
                                        </button>
                                        <button
                                            onClick={() => handleDeleteAccount(account.uid)}
                                            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </>
                )}

                {/* Create Modal */}
                {showCreateModal && (
                    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowCreateModal(false)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="modal-content"
                        >
                            <h2 className="text-xl font-bold mb-4">Create Admin Account</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm mb-2">Display Name</label>
                                    <input
                                        type="text"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        className="input-field"
                                        placeholder="Admin Name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm mb-2">Email</label>
                                    <input
                                        type="email"
                                        value={newEmail}
                                        onChange={(e) => setNewEmail(e.target.value)}
                                        className="input-field"
                                        placeholder="admin@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm mb-2">Password</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="input-field"
                                        placeholder="Secure password"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowCreateModal(false)}
                                        className="btn-secondary flex-1"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleCreateAccount}
                                        disabled={actionLoading}
                                        className="btn-primary flex-1 disabled:opacity-50"
                                    >
                                        {actionLoading ? "Creating..." : "Create"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Edit Modal */}
                {editingAccount && (
                    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setEditingAccount(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="modal-content"
                        >
                            <h2 className="text-xl font-bold mb-4">Edit Account Name</h2>
                            <div className="space-y-4">
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="input-field"
                                    placeholder="New name"
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setEditingAccount(null)}
                                        className="btn-secondary flex-1"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleUpdateName}
                                        disabled={actionLoading}
                                        className="btn-primary flex-1 disabled:opacity-50"
                                    >
                                        {actionLoading ? "Saving..." : "Save"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}

"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/Button";
import { useAuth } from "@/context/AuthContext";

export default function LandingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const handleEnter = () => {
    if (user) {
      router.push("/home");
    } else {
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative selection:bg-purple-500 selection:text-white">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-900/30 rounded-full blur-[128px]" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-900/30 rounded-full blur-[128px]" />

      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6"
        >
          <motion.h1
            className="text-7xl md:text-9xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400"
            animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            style={{ backgroundSize: "200% auto" }}
          >
            SILENCE
            <br />
            BOOSTER
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto font-light"
          >
            The battlefield for memes, trolls, and chaos.
            <br />
            <span className="text-purple-400 font-medium">Survive the noise. Boost the silence.</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="pt-8"
          >
            <Button
              onClick={handleEnter}
              className="text-xl px-12 py-4 rounded-full bg-white text-black hover:bg-gray-200 transition-transform active:scale-95 shadow-[0_0_50px_-12px_rgba(255,255,255,0.5)]"
            >
              {loading ? "Loading..." : user ? "Enter Dashboard" : "Join the Chaos"}
            </Button>
          </motion.div>
        </motion.div>

        {/* Floating Elements decoration */}
        <FloatingIcon emoji="🔥" delay={1} x={-200} y={-100} />
        <FloatingIcon emoji="💀" delay={1.5} x={200} y={-150} />
        <FloatingIcon emoji="🤡" delay={2} x={-150} y={150} />
        <FloatingIcon emoji="🤫" delay={2.5} x={180} y={100} />
      </main>
    </div>
  );
}

function FloatingIcon({ emoji, delay, x, y }: { emoji: string, delay: number, x: number, y: number }) {
  return (
    <motion.div
      className="absolute text-4xl hidden md:block select-none"
      initial={{ opacity: 0, x: 0, y: 0 }}
      animate={{
        opacity: [0, 1, 1, 0],
        x: [0, x],
        y: [0, y],
        rotate: [0, 45, -45, 0]
      }}
      transition={{
        duration: 10,
        repeat: Infinity,
        delay: delay,
        ease: "easeInOut"
      }}
    >
      {emoji}
    </motion.div>
  );
}

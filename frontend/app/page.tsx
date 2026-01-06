"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/Button";
import { useAuth } from "@/context/AuthContext";

export default function LandingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleEnter = () => {
    if (user) {
      router.push("/home");
    } else {
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative selection:bg-white selection:text-black">
      {/* Mouse Spotlight */}
      <div
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.1), transparent 40%)`
        }}
      />

      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6"
        >
          <motion.h1
            className="text-7xl md:text-9xl font-black tracking-tighter text-white mix-blend-difference"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "circOut" }}
          >
            SILENCE
            <br />
            BOOSTER
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto font-light mix-blend-difference"
          >
            The battlefield for memes, trolls, and chaos.
            <br />
            <span className="text-white font-medium border-b border-white pb-0.5">Survive the noise. Boost the silence.</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="pt-12"
          >
            <Button
              onClick={handleEnter}
              className="group relative text-xl px-16 py-6 rounded-full bg-white text-black hover:bg-white hover:scale-105 transition-all shadow-[0_0_30px_-5px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-5px_rgba(255,255,255,0.8)] font-black tracking-widest uppercase overflow-hidden"
            >
              <span className="relative z-10 group-hover:tracking-[0.2em] transition-all duration-300 text-black">
                {loading ? "Loading..." : user ? "Enter Dashboard" : "Enter Silence"}
              </span>
              <div className="absolute inset-0 bg-white group-hover:opacity-100 transition-opacity duration-300" />
            </Button>
          </motion.div>
        </motion.div>

        {/* Floating Elements removed for strict clean look, or we can add subtle white particles if desired. 
            For now, keeping it strictly minimal as requested. */}
      </main>
    </div>
  );
}

// Helper removed as floating icons are removed

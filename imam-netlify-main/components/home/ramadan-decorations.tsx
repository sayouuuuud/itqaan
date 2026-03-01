"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

export function RamadanDecorations() {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    return (
        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden h-[800px]">

            {/* --- RIGHT SIDE LANTERNS (ENHANCED CLUSTER) --- */}

            {/* Main Lantern - Right (Large) */}
            <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
                className="absolute top-0 right-[5%] w-20 h-40 md:w-28 md:h-56 block"
            >
                <div className="absolute top-0 left-1/2 w-0.5 h-16 md:h-24 bg-gradient-to-b from-amber-500/0 via-amber-400/50 to-amber-500/80 -translate-x-1/2 origin-top animate-swing-slow" />
                <motion.div
                    animate={{ rotate: [2, -2, 2] }}
                    transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                    className="absolute top-16 md:top-24 left-1/2 -translate-x-1/2 origin-top"
                >
                    <svg width="100%" height="100%" viewBox="0 0 60 90" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-xl filter">
                        <circle cx="30" cy="5" r="5" stroke="#F59E0B" strokeWidth="2" />
                        <path d="M15 20 L30 10 L45 20" stroke="#F59E0B" strokeWidth="2" fill="none" />
                        <path d="M15 20 L10 50 L30 70 L50 50 L45 20 Z" fill="#047857" stroke="#F59E0B" strokeWidth="2" fillOpacity="0.9" />
                        <path d="M20 30 L18 45 L30 55 L42 45 L40 30 Z" fill="#FEF3C7" fillOpacity="0.8" className="animate-pulse" />
                        <path d="M30 70 L30 85" stroke="#F59E0B" strokeWidth="2" />
                        <circle cx="30" cy="88" r="3" fill="#F59E0B" />
                    </svg>
                </motion.div>
            </motion.div>

            {/* Medium Lantern - Right (Offset) */}
            <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 1, delay: 0.7 }}
                className="absolute top-0 right-[15%] md:right-[15%] w-12 h-24 md:w-16 md:h-32 block"
            >
                <div className="absolute top-0 left-1/2 w-0.5 h-8 md:h-12 bg-amber-400/40 -translate-x-1/2 origin-top" />
                <motion.div
                    animate={{ rotate: [-1, 1, -1] }}
                    transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                    className="absolute top-8 md:top-12 left-1/2 -translate-x-1/2 origin-top"
                >
                    <svg width="100%" height="100%" viewBox="0 0 60 90" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md">
                        <circle cx="30" cy="5" r="5" stroke="#F59E0B" strokeWidth="2" />
                        <path d="M15 20 L30 10 L45 20" stroke="#F59E0B" strokeWidth="2" fill="none" />
                        <path d="M15 20 L10 50 L30 70 L50 50 L45 20 Z" fill="#047857" stroke="#F59E0B" strokeWidth="2" fillOpacity="0.9" />
                        <path d="M20 30 L18 45 L30 55 L42 45 L40 30 Z" fill="#FEF3C7" fillOpacity="0.6" />
                        <path d="M30 70 L30 85" stroke="#F59E0B" strokeWidth="2" />
                    </svg>
                </motion.div>
            </motion.div>

            {/* Third Lantern - Right (Smallest, different style) */}
            <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 1, delay: 0.9 }}
                className="absolute top-0 right-[25%] md:right-[22%] w-10 h-20 md:w-14 md:h-28 block"
            >
                <div className="absolute top-0 left-1/2 w-0.5 h-12 md:h-20 bg-amber-400/30 -translate-x-1/2 origin-top" />
                <motion.div
                    animate={{ rotate: [1.5, -1.5, 1.5] }}
                    transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut", delay: 0.5 }}
                    className="absolute top-12 md:top-20 left-1/2 -translate-x-1/2 origin-top"
                >
                    <svg width="100%" height="100%" viewBox="0 0 60 90" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md">
                        <circle cx="30" cy="5" r="5" stroke="#F59E0B" strokeWidth="2" />
                        <path d="M15 20 L30 10 L45 20" stroke="#F59E0B" strokeWidth="2" fill="none" />
                        <path d="M20 20 L15 50 L30 65 L45 50 L40 20 Z" fill="#1e293b" stroke="#F59E0B" strokeWidth="2" fillOpacity="0.8" />
                        <path d="M28 35 L28 45 L32 45 L32 35 Z" fill="#FEF3C7" className="animate-pulse" />
                        <path d="M30 65 L30 80" stroke="#F59E0B" strokeWidth="2" />
                    </svg>
                </motion.div>
            </motion.div>

            {/* --- MOON REMOVED (Moved to HeroSection) --- */}

        </div>
    )
}

"use client"

import { motion } from "framer-motion"

export function MoonDecoration() {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.5, rotate: -30 }}
            animate={{ opacity: 1, scale: 0.55, rotate: -10 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute -top-5 -left-5 w-32 h-32 md:w-48 md:h-48 z-20 pointer-events-none"
        >
            <svg width="100%" height="100%" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_0_15px_rgba(251,191,36,0.3)]">
                <circle cx="100" cy="100" r="70" fill="#FBBF24" fillOpacity="0.1" className="animate-pulse">
                    <animate attributeName="r" values="70;75;70" dur="4s" repeatCount="indefinite" />
                </circle>
                <path
                    d="M140 40 A 80 80 0 1 1 40 140 A 60 60 0 1 0 140 40 Z"
                    fill="url(#moon-gradient-hero)"
                    stroke="#F59E0B"
                    strokeWidth="1"
                    style={{ filter: "drop-shadow(0px 4px 6px rgba(0,0,0,0.2))" }}
                />
                <defs>
                    <linearGradient id="moon-gradient-hero" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#FFFBEB" />
                        <stop offset="50%" stopColor="#FCD34D" />
                        <stop offset="100%" stopColor="#B45309" />
                    </linearGradient>
                </defs>
                <g transform="translate(140, 60)">
                    <motion.path
                        d="M0 -10 L2 -2 L10 0 L2 2 L0 10 L-2 2 L-10 0 L-2 -2 Z"
                        fill="#FEF3C7"
                        animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
                        transition={{ duration: 3, repeat: Infinity }}
                    />
                </g>
                <g transform="translate(40, 150)">
                    <motion.path
                        d="M0 -6 L1.5 -1.5 L6 0 L1.5 1.5 L0 6 L-1.5 1.5 L-6 0 L-1.5 -1.5 Z"
                        fill="#FCD34D"
                        animate={{ scale: [1, 0.8, 1], opacity: [1, 0.5, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                </g>
            </svg>
        </motion.div>
    )
}

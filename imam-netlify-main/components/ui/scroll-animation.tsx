"use client"

import { motion } from "framer-motion"
import type { ReactNode } from "react"

interface ScrollAnimationProps {
    children: ReactNode
    className?: string
    delay?: number
    direction?: "up" | "down" | "left" | "right"
    duration?: number
}

export function ScrollAnimation({
    children,
    className = "",
    delay = 0,
    direction = "up",
    duration = 0.5,
}: ScrollAnimationProps) {
    const getInitial = () => {
        switch (direction) {
            case "up":
                return { opacity: 0, y: 30 }
            case "down":
                return { opacity: 0, y: -30 }
            case "left":
                return { opacity: 0, x: 30 }
            case "right":
                return { opacity: 0, x: -30 }
            default:
                return { opacity: 0, y: 30 }
        }
    }

    const getAnimate = () => {
        switch (direction) {
            case "up":
            case "down":
                return { opacity: 1, y: 0 }
            case "left":
            case "right":
                return { opacity: 1, x: 0 }
            default:
                return { opacity: 1, y: 0 }
        }
    }

    return (
        <motion.div
            initial={getInitial()}
            whileInView={getAnimate()}
            viewport={{ once: true, margin: "-50px" }}
            transition={{
                duration: duration,
                delay: delay,
                ease: "easeOut",
            }}
            className={className}
        >
            {children}
        </motion.div>
    )
}

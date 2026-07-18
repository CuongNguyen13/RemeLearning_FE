import { motion, useReducedMotion, type Variants } from "motion/react"
import type { ReactNode } from "react"

const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07 },
  },
}

const containerReduced: Variants = {
  hidden: {},
  show: {},
}

const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
}

const itemReduced: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.15, ease: "easeOut" } },
}

interface RevealGroupProps {
  children: ReactNode
  className?: string
}

// Orchestrates one staggered reveal for a group of RevealItems - use once per page load,
// not scattered across every element. Respects prefers-reduced-motion by dropping the
// stagger/y-offset in favor of a plain, near-instant crossfade.
export function RevealGroup({ children, className }: RevealGroupProps) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={reduceMotion ? containerReduced : container}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function RevealItem({ children, className }: RevealGroupProps) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.div variants={reduceMotion ? itemReduced : item} className={className}>
      {children}
    </motion.div>
  )
}

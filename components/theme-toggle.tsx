"use client"

import { useTheme } from "./theme-provider"
import { Moon, Sun } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark")
  }

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2.5 rounded-xl bg-muted/50 hover:bg-muted transition-all duration-300 group overflow-hidden"
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      aria-pressed={isDark}
    >
      <div
        className={`absolute inset-0 rounded-xl blur-lg transition-opacity duration-500 ${
          isDark
            ? "bg-blue-500/20 opacity-0 group-hover:opacity-100"
            : "bg-orange-500/20 opacity-0 group-hover:opacity-100"
        }`}
      />

      <div className="relative w-5 h-5">
        <AnimatePresence mode="wait">
          {isDark ? (
            <motion.div
              key="moon"
              initial={{ rotate: -90, opacity: 0, scale: 0.8 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 90, opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <Moon
                className="w-5 h-5 text-blue-500 group-hover:text-blue-400 transition-colors"
                strokeWidth={2}
                fill="currentColor"
              />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              initial={{ rotate: 90, opacity: 0, scale: 0.8 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: -90, opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <Sun className="w-5 h-5 text-orange-500 group-hover:text-orange-400 transition-colors" strokeWidth={2} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div
        className={`absolute inset-0 rounded-xl border-2 transition-all duration-300 ${
          isDark
            ? "border-blue-500/20 group-hover:border-blue-500/40"
            : "border-orange-500/20 group-hover:border-orange-500/40"
        }`}
      />
    </button>
  )
}

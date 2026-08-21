"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun } from "lucide-react";

const emptySubscribe = () => () => {};

// Hydration-safe "are we past the client mount" flag. next-themes only knows
// the real theme on the client (the server has no cookie/localStorage to
// read), so rendering the icon before mount would either flash the wrong
// icon or mismatch server/client markup. useSyncExternalStore gives a
// server snapshot (false) and client snapshot (true) without the
// setState-in-effect anti-pattern a useEffect+useState mount flag would be.
function useMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface text-foreground-muted transition-colors hover:border-border-strong hover:text-foreground"
    >
      <AnimatePresence mode="wait" initial={false}>
        {mounted && (
          <motion.span
            key={isDark ? "moon" : "sun"}
            initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {isDark ? <Moon size={15} /> : <Sun size={15} />}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

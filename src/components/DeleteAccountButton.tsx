"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/Button";

export function DeleteAccountButton() {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    setLoading(true);
    const res = await fetch("/api/account", { method: "DELETE" });
    if (res.ok) {
      await signOut({ callbackUrl: "/" });
    } else {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      {!confirming ? (
        <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <Button variant="danger" onClick={() => setConfirming(true)}>
            Delete account
          </Button>
        </motion.div>
      ) : (
        <motion.div
          key="confirm"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="flex flex-col gap-3 rounded-lg border border-danger/30 bg-danger-soft p-4 sm:flex-row sm:items-center"
        >
          <p className="flex-1 text-sm text-danger">
            This permanently deletes your account and all designs. Are you sure?
          </p>
          <div className="flex gap-2">
            <Button variant="danger" size="sm" loading={loading} onClick={onDelete}>
              Yes, delete everything
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

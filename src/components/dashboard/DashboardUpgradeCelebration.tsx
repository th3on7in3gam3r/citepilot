"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/notifications/ToastProvider";
import { trackEvent } from "@/lib/analytics/track";

function ConfettiBurst() {
  const pieces = Array.from({ length: 36 }, (_, i) => i);
  const colors = ["#0ea5e9", "#22d3ee", "#10b981", "#6366f1", "#f59e0b"];

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[90] overflow-hidden"
      aria-hidden
    >
      {pieces.map((i) => (
        <span
          key={i}
          className="absolute top-0 h-2 w-1.5 animate-[confetti-fall_2.8s_ease-out_forwards] rounded-sm opacity-90"
          style={{
            left: `${(i / pieces.length) * 100}%`,
            backgroundColor: colors[i % colors.length],
            animationDelay: `${(i % 8) * 0.05}s`,
            transform: `rotate(${i * 17}deg)`,
          }}
        />
      ))}
    </div>
  );
}

export function DashboardUpgradeCelebration() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const [showConfetti, setShowConfetti] = useState(false);
  const handledRef = useRef(false);

  useEffect(() => {
    const upgraded = searchParams.get("upgraded") === "true";
    if (!upgraded || handledRef.current) return;
    handledRef.current = true;

    const plan = searchParams.get("plan") === "fleet" ? "fleet" : "pilot";
    const mrr = plan === "fleet" ? 249 : 79;

    trackEvent("checkout_completed", {
      plan,
      mrr_added: mrr,
    });

    setShowConfetti(true);
    toast.success(
      plan === "fleet"
        ? "Welcome to Fleet! Your workspaces are now unlocked."
        : "Welcome to Pilot! Your workspace is now unlocked.",
      {
        description:
          plan === "fleet"
            ? "Fleet is active — unlimited workspaces and white-label reporting."
            : "Pilot is active — weekly monitoring, CMS publish, and more.",
        duration: 8000,
      },
    );

    const timer = window.setTimeout(() => setShowConfetti(false), 3200);

    const url = new URL(window.location.href);
    url.searchParams.delete("upgraded");
    url.searchParams.delete("plan");
    router.replace(url.pathname + url.search, { scroll: false });

    return () => window.clearTimeout(timer);
  }, [searchParams, router, toast]);

  if (!showConfetti) return null;
  return <ConfettiBurst />;
}

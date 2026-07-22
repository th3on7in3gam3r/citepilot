import { authFormCardClass } from "@/components/auth/auth-styles";

export function AuthFormFallback() {
  return (
    <div
      className={authFormCardClass}
      aria-busy="true"
      aria-label="Loading form"
    >
      <div className="animate-pulse space-y-4">
        <div className="h-3 w-28 rounded bg-surface" />
        <div className="h-8 w-40 rounded bg-surface" />
        <div className="h-4 w-full max-w-xs rounded bg-surface" />
        <div className="mt-6 h-11 w-full rounded-full bg-surface" />
        <div className="h-11 w-full rounded-xl bg-surface" />
        <div className="h-11 w-full rounded-xl bg-surface" />
        <div className="h-11 w-full rounded-full bg-surface" />
      </div>
    </div>
  );
}

import { AuthMarketingPanel } from "@/components/auth/AuthMarketingPanel";
import { Logo } from "@/components/ui/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-[100dvh] grid-cols-1 lg:grid-cols-2">
      <AuthMarketingPanel />

      <div className="relative hero-premium flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-4 py-12">
        <div aria-hidden="true" className="hero-premium-orb hero-premium-orb--cyan" />
        <div className="lg:hidden relative z-10 mb-8">
          <Logo light />
        </div>
        <div className="relative z-10 w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}

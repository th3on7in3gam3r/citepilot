"use client";

import * as Sentry from "@sentry/nextjs";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { site } from "@/lib/site";

type Props = {
  children: ReactNode;
  /** Optional context label for Sentry (e.g. "dashboard", "audit"). */
  area?: string;
};

type State = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    Sentry.captureException(error, {
      extra: {
        area: this.props.area ?? "app",
        componentStack: errorInfo.componentStack,
      },
    });
  }

  private handleRefresh = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 py-16 text-center">
        <div className="max-w-md rounded-2xl border border-border bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            Something went wrong
          </p>
          <h1 className="font-display mt-3 text-2xl font-bold text-ink">
            We hit an unexpected error
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Try refreshing, or contact{" "}
            <a
              href={`mailto:${site.supportEmail}`}
              className="font-medium text-accent underline underline-offset-2"
            >
              {site.supportEmail}
            </a>
            .
          </p>
          <button
            type="button"
            onClick={this.handleRefresh}
            className="mt-6 inline-flex rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-ink/90"
          >
            Refresh page
          </button>
        </div>
      </div>
    );
  }
}

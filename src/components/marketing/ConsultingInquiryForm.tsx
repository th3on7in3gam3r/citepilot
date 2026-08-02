"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export const CONSULTING_PACKAGES = [
  "strategy-session",
  "citation-rescue",
  "agency-desk",
  "other",
] as const;

export type ConsultingPackage = (typeof CONSULTING_PACKAGES)[number];

type Props = {
  initialPackage?: ConsultingPackage;
};

export function ConsultingInquiryForm({ initialPackage = "other" }: Props) {
  const t = useTranslations("consulting");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [packageId, setPackageId] = useState<ConsultingPackage>(initialPackage);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    setPackageId(initialPackage);
  }, [initialPackage]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/consulting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          company: company.trim(),
          packageId,
          message: message.trim(),
        }),
      });
      const data = (await res.json()) as {
        data?: { ok?: boolean };
        error?: string;
      };
      if (res.ok && data.data?.ok) {
        setStatus("done");
        return;
      }
      setErrorMsg(data.error ?? t("formError"));
      setStatus("error");
    } catch {
      setErrorMsg(t("formError"));
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <p className="rounded-2xl border border-accent/30 bg-accent/5 px-5 py-6 text-sm font-semibold text-accent dark:bg-accent/10 dark:text-glow">
        {t("formSuccess")}
      </p>
    );
  }

  const fieldClass =
    "mt-1.5 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-ink outline-none transition focus:border-accent dark:border-white/15 dark:bg-white/5 dark:text-white dark:placeholder:text-white/30";

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04] md:p-8"
      noValidate
    >
      <div>
        <label htmlFor="consulting-name" className="text-sm font-medium text-foreground dark:text-white/85">
          {t("formName")}
        </label>
        <input
          id="consulting-name"
          name="name"
          type="text"
          required
          autoComplete="name"
          maxLength={120}
          placeholder={t("formNamePlaceholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="consulting-email" className="text-sm font-medium text-foreground dark:text-white/85">
          {t("formEmail")}
        </label>
        <input
          id="consulting-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          maxLength={254}
          placeholder={t("formEmailPlaceholder")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="consulting-company" className="text-sm font-medium text-foreground dark:text-white/85">
          {t("formCompany")}
        </label>
        <input
          id="consulting-company"
          name="company"
          type="text"
          required
          autoComplete="organization"
          maxLength={200}
          placeholder={t("formCompanyPlaceholder")}
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="consulting-package" className="text-sm font-medium text-foreground dark:text-white/85">
          {t("formPackage")}
        </label>
        <select
          id="consulting-package"
          name="packageId"
          required
          value={packageId}
          onChange={(e) => setPackageId(e.target.value as ConsultingPackage)}
          className={fieldClass}
        >
          <option value="strategy-session">{t("formPackageStrategy")}</option>
          <option value="citation-rescue">{t("formPackageRescue")}</option>
          <option value="agency-desk">{t("formPackageDesk")}</option>
          <option value="other">{t("formPackageOther")}</option>
        </select>
      </div>

      <div>
        <label htmlFor="consulting-message" className="text-sm font-medium text-foreground dark:text-white/85">
          {t("formMessage")}
        </label>
        <textarea
          id="consulting-message"
          name="message"
          required
          rows={5}
          maxLength={4000}
          placeholder={t("formMessagePlaceholder")}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={`${fieldClass} resize-y`}
        />
      </div>

      <button
        type="submit"
        disabled={status === "loading"}
        className="inline-flex w-full items-center justify-center rounded-full bg-accent px-8 py-3.5 text-sm font-bold text-white transition hover:bg-accent-deep disabled:opacity-60 sm:w-auto"
      >
        {status === "loading" ? t("formSubmitting") : t("formSubmit")}
      </button>

      {status === "error" && (
        <p className="text-sm text-red-500 dark:text-red-400" role="alert">
          {errorMsg}
        </p>
      )}
    </form>
  );
}

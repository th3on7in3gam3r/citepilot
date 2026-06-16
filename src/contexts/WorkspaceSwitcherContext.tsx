"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type WorkspaceSwitcherContextValue = {
  switcherOpen: boolean;
  setSwitcherOpen: (open: boolean) => void;
  openSwitcher: () => void;
  wizardOpen: boolean;
  setWizardOpen: (open: boolean) => void;
  openWizard: () => void;
};

const WorkspaceSwitcherContext = createContext<WorkspaceSwitcherContextValue | null>(
  null,
);

export function WorkspaceSwitcherProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);

  const openSwitcher = useCallback(() => setSwitcherOpen(true), []);
  const openWizard = useCallback(() => {
    setSwitcherOpen(false);
    setWizardOpen(true);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "w") {
        e.preventDefault();
        setSwitcherOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <WorkspaceSwitcherContext.Provider
      value={{
        switcherOpen,
        setSwitcherOpen,
        openSwitcher,
        wizardOpen,
        setWizardOpen,
        openWizard,
      }}
    >
      {children}
    </WorkspaceSwitcherContext.Provider>
  );
}

export function useWorkspaceSwitcher() {
  const ctx = useContext(WorkspaceSwitcherContext);
  if (!ctx) {
    throw new Error("useWorkspaceSwitcher must be used within WorkspaceSwitcherProvider");
  }
  return ctx;
}

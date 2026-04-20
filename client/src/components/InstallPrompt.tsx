import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!visible || !deferredPrompt) return null;

  const handleInstall = async () => {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setVisible(false);
    setDeferredPrompt(null);
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm bg-white dark:bg-zinc-900 border border-purple-200 dark:border-purple-800 rounded-xl shadow-lg p-4 flex items-center gap-3">
      <img src="/k-logo-no-bg.png" alt="" className="w-10 h-10 rounded-lg shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">Install Kalakaarian</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">Add to home screen for the best experience</p>
      </div>
      <Button size="sm" onClick={handleInstall} className="shrink-0 bg-purple-600 hover:bg-purple-700 gap-1">
        <Download className="w-3.5 h-3.5" />
        Install
      </Button>
      <button
        onClick={() => setVisible(false)}
        aria-label="Dismiss"
        className="shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

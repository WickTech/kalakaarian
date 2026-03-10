import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
  dark: boolean;
  toggle: () => void;
}

export function ThemeToggle({ dark, toggle }: ThemeToggleProps) {
  return (
    <button
      onClick={toggle}
      className="border border-border p-2 hover:border-terminal transition-colors"
      aria-label="Toggle theme"
    >
      {dark ? <Sun className="w-4 h-4 text-terminal" /> : <Moon className="w-4 h-4 text-foreground" />}
    </button>
  );
}

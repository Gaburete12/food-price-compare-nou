import React from "react";
import { Zap, Wallet, Moon, Sun, Bell } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface NavbarProps {
  onReset: () => void;
}

export function Navbar({ onReset }: NavbarProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
        <button
          onClick={onReset}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="w-10 h-10 rounded-xl bg-ring flex items-center justify-center shadow-lg shadow-ring/20">
            <Zap className="w-5 h-5 text-white" fill="white" />
          </div>
          <span className="font-extrabold font-['Outfit'] text-2xl text-foreground tracking-tighter">
            Food<span className="text-ring">Radar</span>
          </span>
        </button>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-2xl">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <p className="text-[9px] font-black text-emerald-500 uppercase tracking-wider">
                Economisit azi
              </p>
              <p className="text-sm font-black font-['Outfit'] text-foreground">42.50 RON</p>
            </div>
          </div>
          <div className="h-8 w-px bg-border mx-1 hidden sm:block" />
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-secondary-foreground hover:text-foreground transition-all active:scale-90"
          >
            {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
          <button className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-secondary-foreground relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-background" />
          </button>
        </div>
      </div>
    </header>
  );
}

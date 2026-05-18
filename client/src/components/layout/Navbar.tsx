import React, { useState, useEffect, useRef } from "react";
import { Zap, Moon, Sun, Bell, Check, Info, Server } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface NavbarProps {
  onReset: () => void;
}

export function Navbar({ onReset }: NavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const notifications = [
    {
      id: 1,
      title: "Taxe live McDonald's",
      desc: "Taxele de livrare și serviciu pentru McDonald's Constanța au fost scanate și sincronizate cu succes din Glovo.",
      time: "Acum",
      type: "success"
    },
    {
      id: 2,
      title: "Meniu complet optimizat",
      desc: "Meniul a fost structurat pe categorii clare (Băuturi, Deserturi, Burgeri și Pui) cu imagini premium.",
      time: "10m în urmă",
      type: "info"
    },
    {
      id: 3,
      title: "Panou de control live",
      desc: "Puteți accesa setările avansate din subsolul paginii folosind pictograma rotiță din dreptul copyright-ului.",
      time: "1h în urmă",
      type: "info"
    }
  ];

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleBellClick = () => {
    setShowNotifications(!showNotifications);
    setHasUnread(false);
  };

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
          {/* Scanner Pulse Indicator */}
          <div className="hidden sm:flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-2xl">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20 relative">
              <Server className="w-4 h-4 text-white" />
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-300"></span>
              </span>
            </div>
            <div className="text-left">
              <p className="text-[9px] font-black text-emerald-500 uppercase tracking-wider">
                Status Scannere
              </p>
              <p className="text-xs font-black font-['Outfit'] text-foreground">Prețuri Live (Glovo, Bolt)</p>
            </div>
          </div>
          
          <div className="h-8 w-px bg-border mx-1 hidden sm:block" />
          
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-secondary-foreground hover:text-foreground transition-all active:scale-90"
          >
            {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>

          {/* Interactive Notifications Bell */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={handleBellClick}
              className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-secondary-foreground hover:text-foreground relative transition-all active:scale-90"
            >
              <Bell className="w-5 h-5" />
              {hasUnread && (
                <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background animate-pulse" />
              )}
            </button>

            {/* Dropdown glassmorphism popover */}
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-card/95 backdrop-blur-2xl border border-border/80 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-3 duration-300">
                <div className="flex items-center justify-between mb-4 border-b border-border/50 pb-2">
                  <h4 className="font-bold font-['Outfit'] text-sm text-foreground flex items-center gap-2">
                    <Bell className="w-4 h-4 text-ring" />
                    Notificări Live
                  </h4>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                    Platformă
                  </span>
                </div>
                
                <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar">
                  {notifications.map((n) => (
                    <div key={n.id} className="p-3 rounded-xl bg-secondary/30 border border-border/30 hover:bg-secondary/50 transition-colors flex gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        n.type === "success" ? "bg-emerald-500/10 text-emerald-500" : "bg-ring/10 text-ring"
                      }`}>
                        {n.type === "success" ? <Check className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <p className="text-xs font-bold text-foreground leading-snug truncate">{n.title}</p>
                          <span className="text-[9px] text-muted-foreground whitespace-nowrap">{n.time}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">{n.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

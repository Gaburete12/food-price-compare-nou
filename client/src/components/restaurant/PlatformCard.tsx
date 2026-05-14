import React from "react";
import { motion } from "framer-motion";
import { Clock, ShoppingBag, ExternalLink, Trophy } from "lucide-react";
import { type Platform, type PlatformData, PLATFORM_INFO, calculateTotalFees } from "@/lib/data";

// Platform Logo Components
function GlovoLogo() {
  return (
    <svg viewBox="0 0 40 40" className="w-8 h-8 drop-shadow-md" fill="none">
      <circle cx="20" cy="20" r="20" fill="#FFC244" />
      <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#1a1a1a" fontFamily="Outfit">G</text>
    </svg>
  );
}
function BoltLogo() {
  return (
    <svg viewBox="0 0 40 40" className="w-8 h-8 drop-shadow-md" fill="none">
      <circle cx="20" cy="20" r="20" fill="#34D186" />
      <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#fff" fontFamily="Outfit">B</text>
    </svg>
  );
}
function WoltLogo() {
  return (
    <svg viewBox="0 0 40 40" className="w-8 h-8 drop-shadow-md" fill="none">
      <circle cx="20" cy="20" r="20" fill="#009DE0" />
      <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#fff" fontFamily="Outfit">W</text>
    </svg>
  );
}

const PlatformLogos: Record<Platform, React.FC> = {
  glovo: GlovoLogo,
  bolt: BoltLogo,
  wolt: WoltLogo,
};

interface PlatformCardProps {
  platform: Platform;
  data: PlatformData;
  productPrice?: number;
  isCheapest: boolean;
  index: number;
}

export function PlatformCard({ platform, data, productPrice, isCheapest, index }: PlatformCardProps) {
  const info = PLATFORM_INFO[platform];
  const Logo = PlatformLogos[platform];
  
  const { totalFee, deliveryFee, serviceFee, smallOrderFee } = calculateTotalFees(data, productPrice ?? 0);
  const total = data.available ? (productPrice ?? 0) + totalFee : Infinity;

  const platformColors: Record<Platform, { ring: string; badge: string; btn: string; btnHover: string; glow: string; bg: string }> = {
    glovo: { ring: "ring-[#FFC244]/50", badge: "bg-[#FFC244] text-black", btn: "bg-[#FFC244] hover:bg-[#e5a822] text-black", btnHover: "hover:bg-[#FFC244]", glow: "shadow-[#FFC244]/20", bg: "bg-[#FFC244]/5" },
    bolt: { ring: "ring-[#34D186]/50", badge: "bg-[#34D186] text-white", btn: "bg-[#34D186] hover:bg-[#2bb874] text-white", btnHover: "hover:bg-[#34D186]", glow: "shadow-[#34D186]/20", bg: "bg-[#34D186]/5" },
    wolt: { ring: "ring-[#009DE0]/50", badge: "bg-[#009DE0] text-white", btn: "bg-[#009DE0] hover:bg-[#0089c4] text-white", btnHover: "hover:bg-[#009DE0]", glow: "shadow-[#009DE0]/20", bg: "bg-[#009DE0]/5" },
  };

  const colors = platformColors[platform];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.1, ease: "easeOut" }}
      className={`relative rounded-3xl transition-all duration-300 overflow-hidden ${
        isCheapest 
          ? `bg-card border-2 border-[${info.color}] ring-4 ${colors.ring} ${colors.glow} scale-[1.02] z-10 shadow-2xl` 
          : `bg-card border border-border shadow-lg hover:shadow-xl hover:-translate-y-1`
      } ${!data.available ? "opacity-40 grayscale" : ""}`}
    >
      <div className={`absolute top-0 left-0 right-0 h-1.5 w-full bg-gradient-to-r from-transparent via-[${info.color}] to-transparent opacity-70`} />
      
      {isCheapest && data.available && (
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 rounded-b-xl px-4 py-1 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-md ${colors.badge}`}>
          <Trophy className="w-3.5 h-3.5" /> Cel mai ieftin
        </div>
      )}
      
      <div className={`p-6 ${isCheapest && data.available ? "pt-10" : ""}`}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Logo />
            <div>
              <p className="font-extrabold font-['Outfit'] text-foreground text-lg tracking-tight">{info.name}</p>
              {data.available ? (
                <p className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5" /> {data.deliveryTime} min
                </p>
              ) : (
                <p className="text-xs text-red-500 font-bold">Indisponibil</p>
              )}
            </div>
          </div>
          {data.available && (
            <div className="text-right">
              <p className="text-3xl font-black font-['Outfit'] text-foreground tracking-tighter">
                {total.toFixed(2)}
              </p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">RON TOTAL</p>
            </div>
          )}
        </div>

        {data.available ? (
          <>
            <div className={`space-y-2.5 mb-6 rounded-2xl p-4 border border-border/50 ${colors.bg}`}>
              {productPrice !== undefined && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground font-medium">Preț produs</span>
                  <span className="font-bold text-foreground">{productPrice.toFixed(2)} RON</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground font-medium">Taxă livrare</span>
                <span className="font-bold text-foreground">{data.deliveryFee.toFixed(2)} RON</span>
              </div>
              {serviceFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground font-medium">Taxă servicii</span>
                  <span className="font-bold text-foreground">{serviceFee.toFixed(2)} RON</span>
                </div>
              )}
              {smallOrderFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-amber-500 font-medium flex items-center gap-1">⚠️ Comandă mică</span>
                  <span className="font-bold text-amber-500">{smallOrderFee.toFixed(2)} RON</span>
                </div>
              )}
              <div className="border-t border-border/80 pt-2.5 mt-1 flex justify-between text-sm font-black">
                <span className="text-foreground">Total estimat</span>
                <span className="text-foreground">{total.toFixed(2)} RON</span>
              </div>
            </div>
            <a 
              href={data.deepLink} 
              target="_blank" 
              rel="noopener noreferrer" 
              className={`flex items-center justify-center gap-2.5 w-full py-4 px-4 rounded-2xl font-black text-sm transition-all duration-200 active:scale-95 shadow-lg ${colors.btn}`}
            >
              <ShoppingBag className="w-4.5 h-4.5" /> 
              COMANDĂ PE {info.name.toUpperCase()} 
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>
          </>
        ) : (
          <div className="text-center py-10 bg-secondary/30 rounded-2xl border border-border border-dashed">
            <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center mx-auto mb-3">
              <ShoppingBag className="w-5 h-5 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-bold text-muted-foreground px-4">
              Indisponibil în această locație
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

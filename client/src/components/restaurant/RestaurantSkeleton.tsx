import React from "react";

export function RestaurantSkeleton() {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-5 flex items-center gap-4 overflow-hidden">
      {/* Imagine Thumbnail */}
      <div className="relative w-20 h-20 rounded-xl bg-zinc-800/60 animate-pulse flex-shrink-0 shadow-md" />
      
      {/* Conținut */}
      <div className="flex-1 min-w-0 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-2 flex-1">
            {/* Titlu */}
            <div className="h-5 w-2/3 bg-zinc-800/60 animate-pulse rounded-md" />
            {/* Categorie/Adresă */}
            <div className="h-3 w-1/2 bg-zinc-800/60 animate-pulse rounded-md" />
          </div>
          {/* Badge Rating */}
          <div className="w-12 h-6 bg-zinc-800/60 animate-pulse rounded-lg flex-shrink-0" />
        </div>
        
        <div className="flex items-center justify-between">
          {/* Platforme Mici */}
          <div className="flex gap-1.5">
            <div className="w-6 h-6 rounded-full bg-zinc-800/60 animate-pulse" />
            <div className="w-6 h-6 rounded-full bg-zinc-800/60 animate-pulse" />
          </div>
          {/* Badge Cel mai ieftin */}
          <div className="w-24 h-6 bg-zinc-800/60 animate-pulse rounded-lg" />
        </div>
      </div>
      
      {/* Săgeată (Opțională) */}
      <div className="w-5 h-5 bg-zinc-800/60 animate-pulse rounded-md flex-shrink-0 ml-2" />
    </div>
  );
}

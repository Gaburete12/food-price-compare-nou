import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { 
  Lock, 
  Unlock, 
  Save, 
  ArrowLeft, 
  Settings, 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle,
  TrendingDown
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { type DeliveryFeeDataset } from "../../../shared/delivery-fees";

const ADMIN_PIN = "1234";

const RESTAURANT_NAMES: Record<string, string> = {
  "mcdonalds-constanta": "McDonald's Constanța",
  "kfc-buc-1": "KFC City Park Constanța",
  "pizzahut-constanta": "Pizza Hut Constanța"
};

const PLATFORM_BADGES: Record<string, { label: string; bg: string; text: string }> = {
  glovo: { label: "Glovo", bg: "bg-yellow-100 dark:bg-yellow-950/40", text: "text-yellow-700 dark:text-yellow-400" },
  bolt: { label: "Bolt Food", bg: "bg-emerald-100 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-400" },
  wolt: { label: "Wolt", bg: "bg-blue-100 dark:bg-blue-950/40", text: "text-blue-700 dark:text-blue-400" }
};

export default function AdminPanel() {
  const [, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  
  const [dataset, setDataset] = useState<DeliveryFeeDataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);

  // Load data
  useEffect(() => {
    async function loadFees() {
      try {
        const res = await fetch("/api/delivery-fees");
        if (!res.ok) throw new Error("Failed to load fees dataset");
        const data = await res.json();
        setDataset(data);
      } catch (error) {
        console.error(error);
        toast.error("Eroare la încărcarea taxelor de pe server!");
      } finally {
        setLoading(false);
      }
    }
    loadFees();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      setIsAuthenticated(true);
      setPinError("");
      toast.success("Autentificare reușită ca Administrator!");
    } else {
      setPinError("Cod PIN incorect!");
      toast.error("Autentificare eșuată!");
    }
  };

  const handleUpdateField = (
    restaurantId: string, 
    platform: string, 
    field: string, 
    value: any
  ) => {
    if (!dataset) return;

    const newDataset = { ...dataset };
    if (!newDataset.fees[restaurantId]) {
      newDataset.fees[restaurantId] = {};
    }
    if (!newDataset.fees[restaurantId][platform]) {
      newDataset.fees[restaurantId][platform] = {};
    }

    newDataset.fees[restaurantId][platform] = {
      ...newDataset.fees[restaurantId][platform],
      [field]: value
    };

    setDataset(newDataset);
  };

  const handleSave = async () => {
    if (!dataset) return;
    setSaving(true);

    try {
      const res = await fetch("/api/admin/delivery-fees/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ fees: dataset.fees })
      });

      if (!res.ok) throw new Error("Salvare eșuată");

      const updatedData = await res.json();
      toast.success("Taxele și modificările au fost salvate cu succes pe server!");

      // Update local state with normalized server state
      setDataset({
        updatedAt: updatedData.updatedAt,
        source: updatedData.source,
        fees: updatedData.fees
      });

    } catch (error: any) {
      console.error(error);
      toast.error("Eroare la salvare: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleExtractSabrosoMenu = async () => {
    setExtracting(true);
    try {
      const res = await fetch("/api/admin/extract-sabroso-menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      if (!res.ok) throw new Error("Extragere eșuată");

      const data = await res.json();
      toast.success(`Meniu Sabroso extras cu succes! ${data.itemCount} produse`);
      console.log("Meniu extras:", data);
    } catch (error: any) {
      console.error(error);
      toast.error("Eroare la extragere: " + error.message);
    } finally {
      setExtracting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-100/40 via-transparent to-transparent pointer-events-none" />
        <Card className="w-full max-w-md border-slate-200/80 shadow-2xl backdrop-blur-md bg-white/90 dark:bg-slate-900/90">
          <CardHeader className="text-center pb-2">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Lock className="w-5 h-5 animate-pulse" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
              Panou Administrator
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400">
              Introdu codul PIN pentru a gestiona taxele de livrare și serviciu ale platformelor
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Cod PIN Admin
                </label>
                <Input
                  type="password"
                  placeholder="Introduceți PIN-ul (hint: 1234)"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="text-center text-lg tracking-[0.4em] font-mono border-slate-300 focus:ring-indigo-500"
                  autoFocus
                />
                {pinError && (
                  <p className="text-xs text-red-500 text-center font-medium mt-1 flex items-center justify-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> {pinError}
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-lg transition-transform active:scale-[0.98]">
                Deblochează Panou
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setLocation("/")}
                className="w-full text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Înapoi pe Site
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setLocation("/")}
                className="h-9 w-9 rounded-full border-slate-200 hover:bg-slate-100"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400 font-mono text-xs font-semibold py-0.5 px-2 border-indigo-100 dark:border-indigo-900">
                ADMIN CONSOLE
              </Badge>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Panou Control Administrator ⚙️
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Reglează la virgulă taxele de livrare, serviciu și pragurile pentru McDonald's, KFC și Pizza Hut.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={handleExtractSabrosoMenu}
              disabled={extracting || loading}
              variant="outline"
              className="border-orange-200 hover:bg-orange-50 text-orange-700 font-medium px-4 shadow-sm flex items-center gap-2 transition-all active:scale-95"
            >
              {extracting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {extracting ? "Se extrage..." : "Extrage Meniu Sabroso"}
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 shadow-lg flex items-center gap-2 transition-all active:scale-95"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Se salvează..." : "Salvează toate pe Server"}
            </Button>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 rounded-xl p-4 flex items-start gap-3">
          <TrendingDown className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <h4 className="font-semibold text-blue-900 dark:text-blue-400 text-sm">
              Acuratețe de 100% garantată prin formule matematice
            </h4>
            <p className="text-xs text-blue-800/80 dark:text-blue-400/80 leading-relaxed">
              Odată setate valorile de bază (Livrare, % Serviciu, Prag și Taxa de comandă mică), calculatorul de pe site face matematic rotunjirile și adunările instantaneu! De exemplu, setarea livrării la <strong>0.00 RON</strong> va dezactiva automat costul transportului pe site, respectând promoțiile active în Constanța.
            </p>
          </div>
        </div>

        {/* Database state */}
        <div className="text-xs text-slate-400 flex items-center gap-4">
          <span>Ultima salvare pe server: <strong>{dataset ? new Date(dataset.updatedAt).toLocaleString() : "Never"}</strong></span>
          <span>Sursă: <strong>{dataset?.source || "manual"}</strong></span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 space-y-4">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-slate-500 font-medium">Se încarcă datele de pe server...</p>
          </div>
        ) : dataset ? (
          <div className="space-y-8">
            {Object.entries(RESTAURANT_NAMES).map(([restaurantId, restaurantName]) => {
              const platforms = ["glovo", "bolt", "wolt"];
              
              return (
                <Card key={restaurantId} className="border-slate-200/80 shadow-md overflow-hidden bg-white dark:bg-slate-900">
                  <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 py-4 px-6">
                    <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                      {restaurantName}
                    </CardTitle>
                    <CardDescription className="text-slate-400 text-xs">
                      Setări specifice pentru {restaurantName} (ID: {restaurantId})
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-slate-50/50 dark:bg-slate-800/20 text-slate-400">
                        <TableRow>
                          <TableHead className="w-[120px] font-bold">Platformă</TableHead>
                          <TableHead className="w-[120px]">Taxă Livrare (RON)</TableHead>
                          <TableHead className="w-[110px]">% Serviciu (ex: 0.08)</TableHead>
                          <TableHead className="w-[110px]">Serviciu Min (RON)</TableHead>
                          <TableHead className="w-[110px]">Serviciu Max (RON)</TableHead>
                          <TableHead className="w-[120px]">Prag C. Mică (RON)</TableHead>
                          <TableHead className="w-[120px]">Taxă C. Mică (RON)</TableHead>
                          <TableHead className="w-[130px] text-center">Taxă Dinamică</TableHead>
                          <TableHead className="w-[90px] text-center">Activă</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {platforms.map((platform) => {
                          const override = dataset.fees[restaurantId]?.[platform] || {};
                          
                          // Default mock levels to avoid empty fields in inputs
                          const deliveryFee = override.deliveryFee ?? 0;
                          const serviceFeePercent = override.serviceFeePercent ?? 0;
                          const serviceFeeMin = override.serviceFeeMin ?? 0;
                          const serviceFeeMax = override.serviceFeeMax ?? 0;
                          const smallOrderThreshold = override.smallOrderThreshold ?? 0;
                          const smallOrderFee = override.smallOrderFee ?? 0;
                          const dynamicSmallOrderFee = override.dynamicSmallOrderFee ?? false;
                          const available = override.available ?? true;
                          
                          const badge = PLATFORM_BADGES[platform] || { label: platform, bg: "bg-slate-100", text: "text-slate-700" };

                          return (
                            <TableRow key={platform} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                              <TableCell className="font-semibold">
                                <Badge className={`${badge.bg} ${badge.text} border-none shadow-sm py-1 px-2.5 text-xs font-semibold`}>
                                  {badge.label}
                                </Badge>
                              </TableCell>
                              
                              <TableCell>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={deliveryFee}
                                  onChange={(e) => handleUpdateField(restaurantId, platform, "deliveryFee", parseFloat(e.target.value) || 0)}
                                  className="h-8 py-1 px-2 text-sm font-semibold border-slate-200"
                                />
                              </TableCell>
                              
                              <TableCell>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={serviceFeePercent}
                                  onChange={(e) => handleUpdateField(restaurantId, platform, "serviceFeePercent", parseFloat(e.target.value) || 0)}
                                  className="h-8 py-1 px-2 text-sm font-medium border-slate-200"
                                />
                              </TableCell>

                              <TableCell>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={serviceFeeMin}
                                  onChange={(e) => handleUpdateField(restaurantId, platform, "serviceFeeMin", parseFloat(e.target.value) || 0)}
                                  className="h-8 py-1 px-2 text-sm border-slate-200 text-slate-600 dark:text-slate-400"
                                />
                              </TableCell>

                              <TableCell>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={serviceFeeMax}
                                  onChange={(e) => handleUpdateField(restaurantId, platform, "serviceFeeMax", parseFloat(e.target.value) || 0)}
                                  className="h-8 py-1 px-2 text-sm border-slate-200 text-slate-600 dark:text-slate-400"
                                />
                              </TableCell>

                              <TableCell>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={smallOrderThreshold}
                                  onChange={(e) => handleUpdateField(restaurantId, platform, "smallOrderThreshold", parseFloat(e.target.value) || 0)}
                                  className="h-8 py-1 px-2 text-sm font-semibold border-slate-200 text-amber-700 dark:text-amber-500"
                                />
                              </TableCell>

                              <TableCell>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={smallOrderFee}
                                  onChange={(e) => handleUpdateField(restaurantId, platform, "smallOrderFee", parseFloat(e.target.value) || 0)}
                                  className="h-8 py-1 px-2 text-sm font-semibold border-slate-200 text-amber-700 dark:text-amber-500"
                                />
                              </TableCell>

                              <TableCell className="text-center">
                                <div className="flex justify-center">
                                  <Switch
                                    checked={dynamicSmallOrderFee}
                                    onCheckedChange={(checked) => handleUpdateField(restaurantId, platform, "dynamicSmallOrderFee", checked)}
                                    className="data-[state=checked]:bg-indigo-600 scale-90"
                                  />
                                </div>
                              </TableCell>

                              <TableCell className="text-center">
                                <div className="flex justify-center">
                                  <Switch
                                    checked={available}
                                    onCheckedChange={(checked) => handleUpdateField(restaurantId, platform, "available", checked)}
                                    className="data-[state=checked]:bg-emerald-500 scale-90"
                                  />
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center p-20 text-slate-500 font-medium">
            Nu s-au putut încărca datele.
          </div>
        )}
      </div>
    </div>
  );
}

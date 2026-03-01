import { useState, useEffect } from "react";
import { useStorage, useAnalytics } from "./sdk";

interface Upgrade {
  id: string;
  name: string;
  cost: number;
  cps: number;
  count: number;
  emoji: string;
}

function App() {
  const storage = useStorage();
  const analytics = useAnalytics();
  
  const [cookies, setCookies] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [clickAnimation, setClickAnimation] = useState(false);
  
  const [upgrades, setUpgrades] = useState<Upgrade[]>([
    { id: "cursor", name: "Cursor", cost: 15, cps: 0.1, count: 0, emoji: "👆" },
    { id: "grandma", name: "Grandma", cost: 100, cps: 1, count: 0, emoji: "👵" },
    { id: "farm", name: "Farm", cost: 500, cps: 8, count: 0, emoji: "🌾" },
    { id: "mine", name: "Mine", cost: 3000, cps: 47, count: 0, emoji: "⛏️" },
    { id: "factory", name: "Factory", cost: 10000, cps: 260, count: 0, emoji: "🏭" },
    { id: "bank", name: "Bank", cost: 40000, cps: 1400, count: 0, emoji: "🏦" },
    { id: "temple", name: "Temple", cost: 200000, cps: 7800, count: 0, emoji: "⛩️" },
    { id: "wizard", name: "Wizard", cost: 1666666, cps: 44000, count: 0, emoji: "🧙" },
  ]);

  // Load saved progress
  useEffect(() => {
    const loadProgress = async () => {
      const data = await storage.getMany(["cookies", "upgrades", "totalClicks"]);
      if (data.cookies !== null) setCookies(data.cookies);
      if (data.upgrades !== null) setUpgrades(data.upgrades);
      if (data.totalClicks !== null) setTotalClicks(data.totalClicks);
    };
    loadProgress();
  }, []);

  // Save progress periodically
  useEffect(() => {
    const interval = setInterval(async () => {
      await storage.setMany({ cookies, upgrades, totalClicks });
    }, 2000);
    return () => clearInterval(interval);
  }, [cookies, upgrades, totalClicks]);

  // Calculate cookies per second
  const cps = upgrades.reduce((sum, u) => sum + u.cps * u.count, 0);

  // Auto-generate cookies
  useEffect(() => {
    if (cps > 0) {
      const interval = setInterval(() => {
        setCookies(prev => prev + cps / 10);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [cps]);

  const handleCookieClick = () => {
    setCookies(prev => prev + 1);
    setTotalClicks(prev => prev + 1);
    setClickAnimation(true);
    setTimeout(() => setClickAnimation(false), 100);
    
    if (totalClicks % 100 === 0) {
      analytics.track("milestone_clicks", { clicks: totalClicks });
    }
  };

  const buyUpgrade = (upgrade: Upgrade) => {
    if (cookies >= upgrade.cost) {
      setCookies(prev => prev - upgrade.cost);
      setUpgrades(prev => prev.map(u => 
        u.id === upgrade.id 
          ? { ...u, count: u.count + 1, cost: Math.floor(u.cost * 1.15) }
          : u
      ));
      analytics.track("upgrade_purchased", { 
        upgrade: upgrade.name, 
        count: upgrade.count + 1 
      });
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1e12) return (num / 1e12).toFixed(2) + "T";
    if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
    if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
    if (num >= 1e3) return (num / 1e3).toFixed(2) + "K";
    return Math.floor(num).toString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-100 to-orange-200 p-4">
      {/* Header */}
      <div className="max-w-md mx-auto mb-6 text-center">
        <h1 className="text-3xl font-bold text-amber-900 mb-2">Cookie Clicker</h1>
        <div className="bg-white rounded-lg p-4 shadow-lg">
          <div className="text-4xl font-bold text-amber-600">
            {formatNumber(cookies)}
          </div>
          <div className="text-sm text-gray-600">cookies</div>
          <div className="text-xs text-gray-500 mt-1">
            per second: {formatNumber(cps)}
          </div>
        </div>
      </div>

      {/* Cookie Button */}
      <div className="flex justify-center mb-6">
        <button
          onClick={handleCookieClick}
          className={`transform transition-transform ${
            clickAnimation ? "scale-95" : "scale-100"
          } hover:scale-105 active:scale-95`}
        >
          <div className="text-8xl cursor-pointer select-none drop-shadow-2xl">
            🍪
          </div>
        </button>
      </div>

      <div className="text-center text-sm text-gray-600 mb-4">
        Total clicks: {totalClicks.toLocaleString()}
      </div>

      {/* Upgrades */}
      <div className="max-w-md mx-auto">
        <h2 className="text-xl font-bold text-amber-900 mb-3">Upgrades</h2>
        <div className="space-y-2">
          {upgrades.map(upgrade => {
            const canAfford = cookies >= upgrade.cost;
            return (
              <button
                key={upgrade.id}
                onClick={() => buyUpgrade(upgrade)}
                disabled={!canAfford}
                className={`w-full p-3 rounded-lg shadow-md transition-all ${
                  canAfford
                    ? "bg-white hover:bg-amber-50 cursor-pointer"
                    : "bg-gray-100 opacity-50 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{upgrade.emoji}</div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">
                        {upgrade.name}
                      </div>
                      <div className="text-xs text-gray-600">
                        +{upgrade.cps} cps
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${canAfford ? "text-amber-600" : "text-gray-400"}`}>
                      {formatNumber(upgrade.cost)}
                    </div>
                    {upgrade.count > 0 && (
                      <div className="text-xs text-gray-500">
                        owned: {upgrade.count}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default App;

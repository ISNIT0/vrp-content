import { useState, useEffect } from "react";
import { useStorage, useAnalytics, useUser } from "@vrp/sdk";

interface Upgrade {
  id: string;
  name: string;
  cost: number;
  cps: number; // cookies per second
  count: number;
  emoji: string;
}

function App() {
  const storage = useStorage();
  const analytics = useAnalytics();
  const user = useUser();
  
  const [cookies, setCookies] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [cookiesPerClick, setCookiesPerClick] = useState(1);
  const [upgrades, setUpgrades] = useState<Upgrade[]>([
    { id: "cursor", name: "Cursor", cost: 15, cps: 0.1, count: 0, emoji: "👆" },
    { id: "grandma", name: "Grandma", cost: 100, cps: 1, count: 0, emoji: "👵" },
    { id: "farm", name: "Farm", cost: 1100, cps: 8, count: 0, emoji: "🌾" },
    { id: "mine", name: "Mine", cost: 12000, cps: 47, count: 0, emoji: "⛏️" },
    { id: "factory", name: "Factory", cost: 130000, cps: 260, count: 0, emoji: "🏭" },
    { id: "bank", name: "Bank", cost: 1400000, cps: 1400, count: 0, emoji: "🏦" },
  ]);

  // Load saved data on mount
  useEffect(() => {
    const loadGame = async () => {
      try {
        const savedData = await storage.getMany(["cookies", "upgrades", "totalClicks", "cookiesPerClick"]);
        if (savedData.cookies !== null) setCookies(Number(savedData.cookies));
        if (savedData.totalClicks !== null) setTotalClicks(Number(savedData.totalClicks));
        if (savedData.cookiesPerClick !== null) setCookiesPerClick(Number(savedData.cookiesPerClick));
        if (savedData.upgrades !== null) setUpgrades(JSON.parse(savedData.upgrades as string));
      } catch (error) {
        console.error("Failed to load game:", error);
      }
    };
    loadGame();
  }, []);

  // Auto-save game state
  useEffect(() => {
    const saveGame = async () => {
      try {
        await storage.setMany({
          cookies: cookies.toString(),
          upgrades: JSON.stringify(upgrades),
          totalClicks: totalClicks.toString(),
          cookiesPerClick: cookiesPerClick.toString(),
        });
      } catch (error) {
        console.error("Failed to save game:", error);
      }
    };
    saveGame();
  }, [cookies, upgrades, totalClicks, cookiesPerClick]);

  // Calculate cookies per second
  const cookiesPerSecond = upgrades.reduce((total, upgrade) => {
    return total + (upgrade.cps * upgrade.count);
  }, 0);

  // Auto-generate cookies
  useEffect(() => {
    if (cookiesPerSecond === 0) return;
    
    const interval = setInterval(() => {
      setCookies(prev => prev + cookiesPerSecond);
    }, 1000);

    return () => clearInterval(interval);
  }, [cookiesPerSecond]);

  const handleCookieClick = () => {
    setCookies(prev => prev + cookiesPerClick);
    setTotalClicks(prev => prev + 1);
    
    // Track milestone clicks
    if (totalClicks % 100 === 0 && totalClicks > 0) {
      analytics.track("milestone_clicks", { clicks: totalClicks });
    }
  };

  const buyUpgrade = (upgradeId: string) => {
    const upgrade = upgrades.find(u => u.id === upgradeId);
    if (!upgrade || cookies < upgrade.cost) return;

    setCookies(prev => prev - upgrade.cost);
    setUpgrades(prev => prev.map(u => {
      if (u.id === upgradeId) {
        const newCount = u.count + 1;
        const newCost = Math.floor(u.cost * 1.15);
        analytics.track("upgrade_purchased", { 
          upgrade: u.name, 
          count: newCount 
        });
        return { ...u, count: newCount, cost: newCost };
      }
      return u;
    }));
  };

  const formatNumber = (num: number): string => {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
    if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
    if (num >= 1e3) return (num / 1e3).toFixed(2) + "K";
    return Math.floor(num).toString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-100 to-orange-200 p-4">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-amber-900 mb-1">Cookie Clicker</h1>
        {user && (
          <p className="text-sm text-amber-700">Welcome, {user.username}!</p>
        )}
      </div>

      {/* Stats */}
      <div className="bg-white rounded-lg shadow-lg p-4 mb-4 max-w-md mx-auto">
        <div className="text-center">
          <div className="text-4xl font-bold text-amber-900 mb-1">
            {formatNumber(cookies)} 🍪
          </div>
          <div className="text-sm text-gray-600">
            per second: {cookiesPerSecond.toFixed(1)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Total clicks: {totalClicks}
          </div>
        </div>
      </div>

      {/* Cookie Button */}
      <div className="flex justify-center mb-6">
        <button
          onClick={handleCookieClick}
          className="text-9xl hover:scale-105 active:scale-95 transition-transform duration-100 focus:outline-none"
          style={{ 
            filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.2))",
            cursor: "pointer"
          }}
        >
          🍪
        </button>
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
                onClick={() => buyUpgrade(upgrade.id)}
                disabled={!canAfford}
                className={`w-full p-3 rounded-lg shadow transition-all ${
                  canAfford 
                    ? "bg-white hover:bg-amber-50 cursor-pointer" 
                    : "bg-gray-200 cursor-not-allowed opacity-60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{upgrade.emoji}</span>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">
                        {upgrade.name}
                      </div>
                      <div className="text-xs text-gray-600">
                        +{upgrade.cps}/sec
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-amber-700">
                      {formatNumber(upgrade.cost)} 🍪
                    </div>
                    {upgrade.count > 0 && (
                      <div className="text-xs text-gray-600">
                        Owned: {upgrade.count}
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

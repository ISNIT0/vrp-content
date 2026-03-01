import { useEffect, useState } from "react";
import { useStorage, useUser, useAnalytics } from "@vrp/sdk";

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
  const user = useUser();
  const analytics = useAnalytics();
  
  const [cookies, setCookies] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [clickPower, setClickPower] = useState(1);
  const [upgrades, setUpgrades] = useState<Upgrade[]>([
    { id: "cursor", name: "Cursor", cost: 15, cps: 0.1, count: 0, emoji: "👆" },
    { id: "grandma", name: "Grandma", cost: 100, cps: 1, count: 0, emoji: "👵" },
    { id: "farm", name: "Farm", cost: 500, cps: 8, count: 0, emoji: "🌾" },
    { id: "factory", name: "Factory", cost: 3000, cps: 47, count: 0, emoji: "🏭" },
    { id: "mine", name: "Mine", cost: 10000, cps: 260, count: 0, emoji: "⛏️" },
    { id: "spaceship", name: "Spaceship", cost: 40000, cps: 1400, count: 0, emoji: "🚀" },
  ]);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved game state
  useEffect(() => {
    const loadGame = async () => {
      try {
        const saved = await storage.getMany(["cookies", "totalClicks", "clickPower", "upgrades"]);
        if (saved.cookies !== null) setCookies(Number(saved.cookies));
        if (saved.totalClicks !== null) setTotalClicks(Number(saved.totalClicks));
        if (saved.clickPower !== null) setClickPower(Number(saved.clickPower));
        if (saved.upgrades !== null) setUpgrades(JSON.parse(saved.upgrades));
      } catch (error) {
        console.error("Failed to load game:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadGame();
  }, []);

  // Save game state
  useEffect(() => {
    if (!isLoading) {
      storage.setMany({
        cookies: String(cookies),
        totalClicks: String(totalClicks),
        clickPower: String(clickPower),
        upgrades: JSON.stringify(upgrades),
      }).catch(console.error);
    }
  }, [cookies, totalClicks, clickPower, upgrades, isLoading]);

  // Auto-generate cookies from upgrades
  useEffect(() => {
    const totalCPS = upgrades.reduce((sum, u) => sum + u.cps * u.count, 0);
    if (totalCPS === 0) return;

    const interval = setInterval(() => {
      setCookies(prev => prev + totalCPS / 10);
    }, 100);

    return () => clearInterval(interval);
  }, [upgrades]);

  const handleCookieClick = () => {
    setCookies(prev => prev + clickPower);
    setTotalClicks(prev => prev + 1);
    
    // Track milestone clicks
    if ((totalClicks + 1) % 100 === 0) {
      analytics.track("milestone_clicks", { clicks: totalClicks + 1 });
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
      analytics.track("upgrade_purchased", { upgrade: upgrade.id, count: upgrade.count + 1 });
    }
  };

  const buyClickUpgrade = () => {
    const cost = clickPower * 10;
    if (cookies >= cost) {
      setCookies(prev => prev - cost);
      setClickPower(prev => prev + 1);
      analytics.track("click_power_upgraded", { power: clickPower + 1 });
    }
  };

  const totalCPS = upgrades.reduce((sum, u) => sum + u.cps * u.count, 0);
  const clickUpgradeCost = clickPower * 10;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50">
        <p className="text-xl text-amber-900">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 p-4">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-amber-900 mb-1">🍪 Cookie Clicker</h1>
        {user && <p className="text-sm text-amber-700">Welcome, {user.username}!</p>}
      </div>

      {/* Stats */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6 max-w-md mx-auto">
        <div className="text-center">
          <p className="text-4xl font-bold text-amber-600">{Math.floor(cookies).toLocaleString()}</p>
          <p className="text-sm text-gray-600">cookies</p>
          <div className="mt-2 pt-2 border-t border-gray-200">
            <p className="text-sm text-gray-600">Per second: <span className="font-semibold text-amber-600">{totalCPS.toFixed(1)}</span></p>
            <p className="text-sm text-gray-600">Per click: <span className="font-semibold text-amber-600">{clickPower}</span></p>
            <p className="text-xs text-gray-500 mt-1">Total clicks: {totalClicks.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Cookie Button */}
      <div className="flex justify-center mb-6">
        <button
          onClick={handleCookieClick}
          className="text-9xl hover:scale-110 active:scale-95 transition-transform duration-100 filter drop-shadow-lg"
          style={{ lineHeight: 1 }}
        >
          🍪
        </button>
      </div>

      {/* Click Power Upgrade */}
      <div className="max-w-md mx-auto mb-6">
        <button
          onClick={buyClickUpgrade}
          disabled={cookies < clickUpgradeCost}
          className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-semibold disabled:bg-gray-300 disabled:text-gray-500 hover:bg-blue-600 active:scale-95 transition-all"
        >
          <div className="flex justify-between items-center">
            <span>⚡ Upgrade Click Power</span>
            <span className="text-sm">
              {clickUpgradeCost.toLocaleString()} 🍪
            </span>
          </div>
        </button>
      </div>

      {/* Upgrades Shop */}
      <div className="max-w-md mx-auto">
        <h2 className="text-xl font-bold text-amber-900 mb-3">Upgrades</h2>
        <div className="space-y-2">
          {upgrades.map(upgrade => (
            <button
              key={upgrade.id}
              onClick={() => buyUpgrade(upgrade)}
              disabled={cookies < upgrade.cost}
              className="w-full bg-white rounded-lg shadow p-4 disabled:opacity-50 hover:shadow-lg active:scale-98 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{upgrade.emoji}</span>
                  <div className="text-left">
                    <p className="font-semibold text-gray-800">{upgrade.name}</p>
                    <p className="text-xs text-gray-500">+{upgrade.cps} cps</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-amber-600">{upgrade.cost.toLocaleString()}</p>
                  {upgrade.count > 0 && (
                    <p className="text-xs text-gray-500">Owned: {upgrade.count}</p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-8 pb-4">
        <p className="text-xs text-gray-500">Keep clicking to bake more cookies!</p>
      </div>
    </div>
  );
}

export default App;

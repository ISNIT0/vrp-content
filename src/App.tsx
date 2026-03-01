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
  const [totalCookies, setTotalCookies] = useState(0);
  const [clickPower, setClickPower] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  
  const [upgrades, setUpgrades] = useState<Upgrade[]>([
    { id: "cursor", name: "Cursor", cost: 15, cps: 0.1, count: 0, emoji: "👆" },
    { id: "grandma", name: "Grandma", cost: 100, cps: 1, count: 0, emoji: "👵" },
    { id: "farm", name: "Farm", cost: 1100, cps: 8, count: 0, emoji: "🌾" },
    { id: "factory", name: "Factory", cost: 12000, cps: 47, count: 0, emoji: "🏭" },
    { id: "mine", name: "Mine", cost: 130000, cps: 260, count: 0, emoji: "⛏️" },
    { id: "spaceship", name: "Spaceship", cost: 1400000, cps: 1400, count: 0, emoji: "🚀" },
  ]);

  // Load saved game
  useEffect(() => {
    const loadGame = async () => {
      try {
        const saved = await storage.getMany([
          "cookies",
          "totalCookies",
          "upgrades",
          "clickPower"
        ]);
        
        if (saved.cookies) setCookies(Number(saved.cookies));
        if (saved.totalCookies) setTotalCookies(Number(saved.totalCookies));
        if (saved.clickPower) setClickPower(Number(saved.clickPower));
        if (saved.upgrades) setUpgrades(JSON.parse(saved.upgrades as string));
      } catch (error) {
        console.error("Failed to load game:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadGame();
  }, []);

  // Auto-save game
  useEffect(() => {
    if (isLoading) return;
    
    const saveGame = async () => {
      try {
        await storage.setMany({
          cookies: String(cookies),
          totalCookies: String(totalCookies),
          upgrades: JSON.stringify(upgrades),
          clickPower: String(clickPower)
        });
      } catch (error) {
        console.error("Failed to save game:", error);
      }
    };
    
    const timer = setTimeout(saveGame, 1000);
    return () => clearTimeout(timer);
  }, [cookies, totalCookies, upgrades, clickPower, isLoading]);

  // Auto-clicker loop
  useEffect(() => {
    const cps = upgrades.reduce((sum, u) => sum + u.cps * u.count, 0);
    if (cps === 0) return;
    
    const interval = setInterval(() => {
      setCookies(c => c + cps / 10);
      setTotalCookies(t => t + cps / 10);
    }, 100);
    
    return () => clearInterval(interval);
  }, [upgrades]);

  const handleCookieClick = () => {
    setCookies(c => c + clickPower);
    setTotalCookies(t => t + clickPower);
    analytics.track("cookie_clicked", { clickPower });
  };

  const buyUpgrade = (upgradeId: string) => {
    const upgrade = upgrades.find(u => u.id === upgradeId);
    if (!upgrade || cookies < upgrade.cost) return;
    
    setCookies(c => c - upgrade.cost);
    
    setUpgrades(prevUpgrades => 
      prevUpgrades.map(u => 
        u.id === upgradeId 
          ? { 
              ...u, 
              count: u.count + 1,
              cost: Math.floor(u.cost * 1.15)
            }
          : u
      )
    );
    
    analytics.track("upgrade_purchased", { upgradeId, count: upgrade.count + 1 });
  };

  const getCPS = () => {
    return upgrades.reduce((sum, u) => sum + u.cps * u.count, 0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-100 to-orange-200">
        <div className="text-2xl text-amber-800">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-100 to-orange-200 p-4 overflow-auto">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-amber-900 mb-2">Cookie Clicker</h1>
          <div className="bg-white/80 rounded-2xl p-4 shadow-lg">
            <div className="text-5xl font-bold text-amber-800 mb-1">
              {Math.floor(cookies).toLocaleString()}
            </div>
            <div className="text-sm text-amber-600">cookies</div>
            <div className="text-xs text-amber-500 mt-1">
              {getCPS().toFixed(1)} per second
            </div>
          </div>
        </div>

        {/* Cookie Button */}
        <div className="flex justify-center mb-8">
          <button
            onClick={handleCookieClick}
            className="w-48 h-48 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-2xl active:scale-95 transition-transform border-8 border-amber-300 flex items-center justify-center text-8xl hover:shadow-xl"
          >
            🍪
          </button>
        </div>

        {/* Stats */}
        <div className="bg-white/60 rounded-xl p-3 mb-4 text-center">
          <div className="text-xs text-amber-700">
            Total cookies baked: {Math.floor(totalCookies).toLocaleString()}
          </div>
          <div className="text-xs text-amber-700">
            Click power: {clickPower}
          </div>
        </div>

        {/* Upgrades */}
        <div className="bg-white/80 rounded-2xl p-4 shadow-lg">
          <h2 className="text-xl font-bold text-amber-900 mb-3">Upgrades</h2>
          <div className="space-y-2">
            {upgrades.map(upgrade => (
              <button
                key={upgrade.id}
                onClick={() => buyUpgrade(upgrade.id)}
                disabled={cookies < upgrade.cost}
                className={`w-full p-3 rounded-xl text-left transition-all ${
                  cookies >= upgrade.cost
                    ? "bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 shadow-md active:scale-98"
                    : "bg-gray-300 cursor-not-allowed opacity-60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{upgrade.emoji}</span>
                    <div>
                      <div className="font-semibold text-white">
                        {upgrade.name}
                      </div>
                      <div className="text-xs text-white/90">
                        {upgrade.cps} per second
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-white">
                      {upgrade.cost.toLocaleString()}
                    </div>
                    <div className="text-xs text-white/90">
                      Owned: {upgrade.count}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="text-center text-xs text-amber-700 mt-4">
          Tap the cookie to start baking!
        </div>
      </div>
    </div>
  );
}

export default App;

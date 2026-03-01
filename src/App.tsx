import { useState, useEffect } from "react";
import { useStorage, useUser, useAnalytics } from "./sdk";

interface Upgrade {
  id: string;
  name: string;
  cost: number;
  cps: number; // cookies per second
  owned: number;
}

function App() {
  const user = useUser();
  const storage = useStorage();
  const analytics = useAnalytics();
  
  const [cookies, setCookies] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [upgrades, setUpgrades] = useState<Upgrade[]>([
    { id: "cursor", name: "Cursor", cost: 15, cps: 0.1, owned: 0 },
    { id: "grandma", name: "Grandma", cost: 100, cps: 1, owned: 0 },
    { id: "farm", name: "Farm", cost: 1100, cps: 8, owned: 0 },
    { id: "mine", name: "Mine", cost: 12000, cps: 47, owned: 0 },
    { id: "factory", name: "Factory", cost: 130000, cps: 260, owned: 0 },
  ]);

  // Load saved data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedData = await storage.getMany(["cookies", "upgrades", "totalClicks"]);
        if (savedData.cookies !== null) setCookies(Number(savedData.cookies));
        if (savedData.totalClicks !== null) setTotalClicks(Number(savedData.totalClicks));
        if (savedData.upgrades) setUpgrades(JSON.parse(savedData.upgrades as string));
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    };
    loadData();
  }, []);

  // Save data periodically
  useEffect(() => {
    const saveInterval = setInterval(async () => {
      try {
        await storage.setMany({
          cookies: String(cookies),
          upgrades: JSON.stringify(upgrades),
          totalClicks: String(totalClicks),
        });
      } catch (error) {
        console.error("Failed to save data:", error);
      }
    }, 2000);
    return () => clearInterval(saveInterval);
  }, [cookies, upgrades, totalClicks]);

  // Calculate cookies per second
  const cps = upgrades.reduce((sum, upgrade) => sum + upgrade.cps * upgrade.owned, 0);

  // Auto-generate cookies
  useEffect(() => {
    if (cps === 0) return;
    const interval = setInterval(() => {
      setCookies(prev => prev + cps / 10);
    }, 100);
    return () => clearInterval(interval);
  }, [cps]);

  const handleCookieClick = () => {
    setCookies(prev => prev + 1);
    setTotalClicks(prev => prev + 1);
    
    // Track milestones
    if ((totalClicks + 1) % 100 === 0) {
      analytics.track({ event: "milestone_100_clicks" });
    }
  };

  const buyUpgrade = (upgrade: Upgrade) => {
    if (cookies >= upgrade.cost) {
      setCookies(prev => prev - upgrade.cost);
      setUpgrades(prev => prev.map(u => 
        u.id === upgrade.id 
          ? { ...u, owned: u.owned + 1, cost: Math.floor(u.cost * 1.15) }
          : u
      ));
      analytics.track({ event: "upgrade_purchased", properties: { upgrade: upgrade.name } });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-amber-900 mb-1">Cookie Clicker</h1>
          {user && (
            <p className="text-sm text-amber-700">Playing as {user.username}</p>
          )}
        </div>

        {/* Cookie Count */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4 text-center">
          <div className="text-5xl font-bold text-amber-800 mb-2">
            {Math.floor(cookies)}
          </div>
          <div className="text-lg text-amber-600">cookies</div>
          <div className="text-sm text-amber-500 mt-1">
            per second: {cps.toFixed(1)}
          </div>
        </div>

        {/* Cookie Button */}
        <div className="flex justify-center mb-6">
          <button
            onClick={handleCookieClick}
            className="w-48 h-48 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-2xl active:scale-95 transition-transform flex items-center justify-center text-8xl hover:from-amber-300 hover:to-orange-400"
          >
            🍪
          </button>
        </div>

        {/* Upgrades */}
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <h2 className="text-xl font-bold text-amber-900 mb-3">Upgrades</h2>
          <div className="space-y-2">
            {upgrades.map(upgrade => {
              const canAfford = cookies >= upgrade.cost;
              return (
                <button
                  key={upgrade.id}
                  onClick={() => buyUpgrade(upgrade)}
                  disabled={!canAfford}
                  className={`w-full p-3 rounded-xl text-left transition-all ${
                    canAfford 
                      ? "bg-amber-100 hover:bg-amber-200 active:scale-98" 
                      : "bg-gray-100 opacity-50 cursor-not-allowed"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold text-amber-900">{upgrade.name}</div>
                      <div className="text-sm text-amber-700">+{upgrade.cps}/s</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-amber-800">{upgrade.cost}</div>
                      <div className="text-xs text-amber-600">owned: {upgrade.owned}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 text-center text-sm text-amber-700">
          Total clicks: {totalClicks}
        </div>
      </div>
    </div>
  );
}

export default App;

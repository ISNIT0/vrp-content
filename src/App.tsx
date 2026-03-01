import { useState, useEffect } from "react";
import { useStorage, useAnalytics, useUser } from "@vrp/sdk";

interface Upgrade {
  id: string;
  name: string;
  cost: number;
  cps: number;
  owned: number;
}

function App() {
  const storage = useStorage();
  const analytics = useAnalytics();
  const user = useUser();

  const [cookies, setCookies] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [upgrades, setUpgrades] = useState<Upgrade[]>([
    { id: "cursor", name: "🖱️ Cursor", cost: 15, cps: 0.1, owned: 0 },
    { id: "grandma", name: "👵 Grandma", cost: 100, cps: 1, owned: 0 },
    { id: "farm", name: "🌾 Farm", cost: 500, cps: 8, owned: 0 },
    { id: "factory", name: "🏭 Factory", cost: 3000, cps: 47, owned: 0 },
    { id: "mine", name: "⛏️ Mine", cost: 10000, cps: 260, owned: 0 },
    { id: "shipment", name: "🚢 Shipment", cost: 40000, cps: 1400, owned: 0 },
  ]);

  // Load saved game state
  useEffect(() => {
    const loadGame = async () => {
      try {
        const saved = await storage.getMany(["cookies", "upgrades", "totalClicks"]);
        if (saved.cookies !== undefined) setCookies(Number(saved.cookies));
        if (saved.totalClicks !== undefined) setTotalClicks(Number(saved.totalClicks));
        if (saved.upgrades) setUpgrades(JSON.parse(saved.upgrades as string));
      } catch (error) {
        console.error("Failed to load game:", error);
      }
    };
    loadGame();
  }, []);

  // Save game state
  useEffect(() => {
    const saveGame = async () => {
      try {
        await storage.setMany({
          cookies: cookies.toString(),
          upgrades: JSON.stringify(upgrades),
          totalClicks: totalClicks.toString(),
        });
      } catch (error) {
        console.error("Failed to save game:", error);
      }
    };
    const timeout = setTimeout(saveGame, 500);
    return () => clearTimeout(timeout);
  }, [cookies, upgrades, totalClicks]);

  // Calculate cookies per second
  const cps = upgrades.reduce((total, upgrade) => total + upgrade.cps * upgrade.owned, 0);

  // Auto-generate cookies
  useEffect(() => {
    if (cps === 0) return;
    const interval = setInterval(() => {
      setCookies((prev) => prev + cps / 10);
    }, 100);
    return () => clearInterval(interval);
  }, [cps]);

  const handleClick = async () => {
    setCookies((prev) => prev + 1);
    setTotalClicks((prev) => prev + 1);
    
    if (totalClicks % 100 === 0) {
      try {
        await analytics.track("cookie_milestone", { clicks: totalClicks });
      } catch (error) {
        console.error("Failed to track:", error);
      }
    }
  };

  const buyUpgrade = async (upgrade: Upgrade) => {
    if (cookies < upgrade.cost) return;

    setCookies((prev) => prev - upgrade.cost);
    setUpgrades((prev) =>
      prev.map((u) =>
        u.id === upgrade.id
          ? { ...u, owned: u.owned + 1, cost: Math.floor(u.cost * 1.15) }
          : u
      )
    );

    try {
      await analytics.track("upgrade_purchased", { 
        upgrade: upgrade.name, 
        owned: upgrade.owned + 1 
      });
    } catch (error) {
      console.error("Failed to track:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-4">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-amber-900 mb-1">🍪 Cookie Clicker</h1>
        {user && (
          <p className="text-sm text-amber-700">Playing as {user.username}</p>
        )}
      </div>

      {/* Cookie Counter */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-4 text-center">
        <div className="text-5xl font-bold text-amber-600 mb-2">
          {Math.floor(cookies).toLocaleString()}
        </div>
        <div className="text-amber-800 font-semibold">cookies</div>
        <div className="text-sm text-amber-600 mt-2">
          {cps.toFixed(1)} per second
        </div>
      </div>

      {/* Big Cookie Button */}
      <div className="flex justify-center mb-6">
        <button
          onClick={handleClick}
          className="w-48 h-48 text-8xl bg-amber-200 hover:bg-amber-300 active:scale-95 rounded-full shadow-2xl transition-all duration-150 border-8 border-amber-400"
          style={{
            background: "radial-gradient(circle at 30% 30%, #fbbf24, #d97706)",
          }}
        >
          🍪
        </button>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-xl shadow p-4 mb-4">
        <div className="text-center text-sm text-gray-600">
          Total clicks: <span className="font-bold text-gray-900">{totalClicks.toLocaleString()}</span>
        </div>
      </div>

      {/* Upgrades */}
      <div className="bg-white rounded-2xl shadow-lg p-4">
        <h2 className="text-xl font-bold text-amber-900 mb-3">Upgrades</h2>
        <div className="space-y-2">
          {upgrades.map((upgrade) => {
            const canAfford = cookies >= upgrade.cost;
            return (
              <button
                key={upgrade.id}
                onClick={() => buyUpgrade(upgrade)}
                disabled={!canAfford}
                className={`w-full p-4 rounded-xl text-left transition-all ${
                  canAfford
                    ? "bg-amber-100 hover:bg-amber-200 active:scale-98 cursor-pointer"
                    : "bg-gray-100 opacity-50 cursor-not-allowed"
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="font-bold text-amber-900">
                      {upgrade.name}
                      {upgrade.owned > 0 && (
                        <span className="ml-2 text-sm text-amber-600">
                          × {upgrade.owned}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-amber-700">
                      +{upgrade.cps} cookies/sec
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-amber-800">
                      {upgrade.cost.toLocaleString()}
                    </div>
                    <div className="text-xs text-amber-600">cookies</div>
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

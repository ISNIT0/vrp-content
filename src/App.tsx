import { useState, useEffect } from "react";
import { useStorage, useUser, useAnalytics } from "@vrp/sdk";

interface Upgrade {
  id: string;
  name: string;
  cost: number;
  cps: number;
  count: number;
  emoji: string;
}

function App() {
  const user = useUser();
  const storage = useStorage();
  const analytics = useAnalytics();

  const [cookies, setCookies] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [cookiesPerSecond, setCookiesPerSecond] = useState(0);
  const [clickAnimation, setClickAnimation] = useState(false);

  const [upgrades, setUpgrades] = useState<Upgrade[]>([
    { id: "cursor", name: "Cursor", cost: 15, cps: 0.1, count: 0, emoji: "👆" },
    { id: "grandma", name: "Grandma", cost: 100, cps: 1, count: 0, emoji: "👵" },
    { id: "farm", name: "Farm", cost: 500, cps: 8, count: 0, emoji: "🌾" },
    { id: "factory", name: "Factory", cost: 3000, cps: 47, count: 0, emoji: "🏭" },
    { id: "mine", name: "Mine", cost: 10000, cps: 260, count: 0, emoji: "⛏️" },
    { id: "rocket", name: "Rocket", cost: 40000, cps: 1400, count: 0, emoji: "🚀" },
  ]);

  // Load saved game state
  useEffect(() => {
    const loadGame = async () => {
      try {
        const saved = await storage.getMany(["cookies", "upgrades", "totalClicks"]);
        if (saved.cookies !== undefined) setCookies(Number(saved.cookies));
        if (saved.totalClicks !== undefined) setTotalClicks(Number(saved.totalClicks));
        if (saved.upgrades) {
          setUpgrades(JSON.parse(saved.upgrades as string));
        }
      } catch (err) {
        console.error("Failed to load game:", err);
      }
    };
    loadGame();
  }, []);

  // Calculate cookies per second
  useEffect(() => {
    const cps = upgrades.reduce((total, upgrade) => total + upgrade.cps * upgrade.count, 0);
    setCookiesPerSecond(cps);
  }, [upgrades]);

  // Auto-generate cookies
  useEffect(() => {
    if (cookiesPerSecond > 0) {
      const interval = setInterval(() => {
        setCookies((prev) => prev + cookiesPerSecond / 10);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [cookiesPerSecond]);

  // Save game state periodically
  useEffect(() => {
    const saveInterval = setInterval(async () => {
      try {
        await storage.setMany({
          cookies: cookies.toString(),
          upgrades: JSON.stringify(upgrades),
          totalClicks: totalClicks.toString(),
        });
      } catch (err) {
        console.error("Failed to save game:", err);
      }
    }, 5000);
    return () => clearInterval(saveInterval);
  }, [cookies, upgrades, totalClicks]);

  const handleCookieClick = () => {
    setCookies((prev) => prev + 1);
    setTotalClicks((prev) => prev + 1);
    setClickAnimation(true);
    setTimeout(() => setClickAnimation(false), 100);

    if (totalClicks % 100 === 0) {
      analytics.track("milestone_clicks", { clicks: totalClicks });
    }
  };

  const buyUpgrade = (upgradeId: string) => {
    const upgrade = upgrades.find((u) => u.id === upgradeId);
    if (!upgrade || cookies < upgrade.cost) return;

    setCookies((prev) => prev - upgrade.cost);
    setUpgrades((prev) =>
      prev.map((u) =>
        u.id === upgradeId
          ? { ...u, count: u.count + 1, cost: Math.floor(u.cost * 1.15) }
          : u
      )
    );

    analytics.track("upgrade_purchased", { upgrade: upgradeId, count: upgrade.count + 1 });
  };

  const resetGame = async () => {
    if (confirm("Are you sure you want to reset your game? This cannot be undone!")) {
      setCookies(0);
      setTotalClicks(0);
      setUpgrades((prev) =>
        prev.map((u) => ({
          ...u,
          count: 0,
          cost: [15, 100, 500, 3000, 10000, 40000][prev.indexOf(u)],
        }))
      );
      await storage.setMany({ cookies: "0", upgrades: "[]", totalClicks: "0" });
      analytics.track("game_reset");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-4">
      {/* Header */}
      <div className="max-w-md mx-auto mb-4">
        <div className="bg-white rounded-lg shadow-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-amber-900">🍪 Cookie Clicker</h1>
            {user && (
              <div className="text-sm text-gray-600">
                {user.username}
              </div>
            )}
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-amber-700">
              {Math.floor(cookies).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">cookies</div>
            <div className="text-xs text-gray-500 mt-1">
              {cookiesPerSecond.toFixed(1)} per second
            </div>
          </div>
        </div>
      </div>

      {/* Cookie Button */}
      <div className="max-w-md mx-auto mb-6 flex justify-center">
        <button
          onClick={handleCookieClick}
          className={`text-9xl transition-transform active:scale-95 ${
            clickAnimation ? "scale-110" : "scale-100"
          } hover:scale-105 filter drop-shadow-2xl`}
        >
          🍪
        </button>
      </div>

      {/* Stats */}
      <div className="max-w-md mx-auto mb-4">
        <div className="bg-white rounded-lg shadow-lg p-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total Clicks:</span>
            <span className="font-bold text-gray-900">{totalClicks.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Upgrades */}
      <div className="max-w-md mx-auto mb-4">
        <h2 className="text-lg font-bold text-amber-900 mb-2 px-2">Upgrades</h2>
        <div className="space-y-2">
          {upgrades.map((upgrade) => {
            const canAfford = cookies >= upgrade.cost;
            return (
              <button
                key={upgrade.id}
                onClick={() => buyUpgrade(upgrade.id)}
                disabled={!canAfford}
                className={`w-full bg-white rounded-lg shadow p-3 text-left transition-all ${
                  canAfford
                    ? "hover:bg-amber-50 hover:shadow-lg active:scale-98"
                    : "opacity-50 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{upgrade.emoji}</span>
                    <div>
                      <div className="font-bold text-gray-900">{upgrade.name}</div>
                      <div className="text-xs text-gray-600">
                        {upgrade.cps} cookies/sec
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-amber-700">
                      {upgrade.cost.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">owned: {upgrade.count}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Reset Button */}
      <div className="max-w-md mx-auto">
        <button
          onClick={resetGame}
          className="w-full bg-red-500 text-white rounded-lg shadow p-3 hover:bg-red-600 active:scale-98 transition-all"
        >
          Reset Game
        </button>
      </div>
    </div>
  );
}

export default App;

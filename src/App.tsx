import { useState, useEffect } from 'react';
import { useStorage, useAnalytics, useUser } from './vrp-sdk';

interface Upgrade {
  id: string;
  name: string;
  cost: number;
  cps: number; // cookies per second
  count: number;
  description: string;
}

function App() {
  const storage = useStorage();
  const analytics = useAnalytics();
  const user = useUser();

  const [cookies, setCookies] = useState(0);
  const [totalCookies, setTotalCookies] = useState(0);
  const [cps, setCps] = useState(0);
  const [clickPower, setClickPower] = useState(1);
  const [upgrades, setUpgrades] = useState<Upgrade[]>([
    { id: 'cursor', name: 'Cursor', cost: 15, cps: 0.1, count: 0, description: 'Auto-clicks once every 10 seconds' },
    { id: 'grandma', name: 'Grandma', cost: 100, cps: 1, count: 0, description: 'A nice grandma to bake cookies' },
    { id: 'farm', name: 'Farm', cost: 500, cps: 8, count: 0, description: 'Grows cookie plants' },
    { id: 'mine', name: 'Mine', cost: 3000, cps: 47, count: 0, description: 'Mines cookies from underground' },
    { id: 'factory', name: 'Factory', cost: 10000, cps: 260, count: 0, description: 'Produces cookies en masse' },
    { id: 'bank', name: 'Bank', cost: 40000, cps: 1400, count: 0, description: 'Generates cookies from interest' },
  ]);

  // Load game state on mount
  useEffect(() => {
    const loadGame = async () => {
      const savedState = await storage.get('cookieGameState');
      if (savedState) {
        setCookies(savedState.cookies || 0);
        setTotalCookies(savedState.totalCookies || 0);
        setClickPower(savedState.clickPower || 1);
        setUpgrades(savedState.upgrades || upgrades);
      }
    };
    loadGame();
  }, []);

  // Save game state whenever it changes
  useEffect(() => {
    const saveGame = async () => {
      await storage.set('cookieGameState', {
        cookies,
        totalCookies,
        clickPower,
        upgrades,
      });
    };
    const timer = setTimeout(saveGame, 500);
    return () => clearTimeout(timer);
  }, [cookies, totalCookies, clickPower, upgrades]);

  // Calculate CPS from upgrades
  useEffect(() => {
    const totalCps = upgrades.reduce((sum, u) => sum + u.cps * u.count, 0);
    setCps(totalCps);
  }, [upgrades]);

  // Auto-generate cookies based on CPS
  useEffect(() => {
    if (cps === 0) return;
    const interval = setInterval(() => {
      setCookies(prev => prev + cps / 10);
      setTotalCookies(prev => prev + cps / 10);
    }, 100);
    return () => clearInterval(interval);
  }, [cps]);

  const handleCookieClick = () => {
    setCookies(prev => prev + clickPower);
    setTotalCookies(prev => prev + clickPower);
    analytics.track('cookie_clicked', { clickPower });
  };

  const buyUpgrade = (upgrade: Upgrade) => {
    if (cookies >= upgrade.cost) {
      setCookies(prev => prev - upgrade.cost);
      setUpgrades(prev => prev.map(u => 
        u.id === upgrade.id 
          ? { ...u, count: u.count + 1, cost: Math.floor(u.cost * 1.15) }
          : u
      ));
      analytics.track('upgrade_purchased', { upgradeId: upgrade.id, count: upgrade.count + 1 });
    }
  };

  const buyClickUpgrade = () => {
    const cost = clickPower * 10;
    if (cookies >= cost) {
      setCookies(prev => prev - cost);
      setClickPower(prev => prev + 1);
      analytics.track('click_upgrade_purchased', { newClickPower: clickPower + 1 });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-100 to-orange-200 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-amber-900 mb-1">🍪 Cookie Clicker</h1>
          <p className="text-sm text-amber-700">Welcome, {user?.username || 'Player'}!</p>
        </div>

        {/* Stats */}
        <div className="bg-white/80 backdrop-blur rounded-2xl p-4 mb-4 shadow-lg">
          <div className="text-center">
            <div className="text-4xl font-bold text-amber-900 mb-1">
              {Math.floor(cookies).toLocaleString()}
            </div>
            <div className="text-sm text-amber-700">cookies</div>
            <div className="text-xs text-amber-600 mt-2">
              {cps.toFixed(1)} per second
            </div>
            <div className="text-xs text-amber-600">
              {totalCookies.toFixed(0).toLocaleString()} total baked
            </div>
          </div>
        </div>

        {/* Cookie Button */}
        <div className="flex justify-center mb-4">
          <button
            onClick={handleCookieClick}
            className="w-48 h-48 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-2xl active:scale-95 transition-transform flex items-center justify-center text-8xl hover:shadow-3xl"
          >
            🍪
          </button>
        </div>

        {/* Click Power Upgrade */}
        <div className="bg-white/80 backdrop-blur rounded-xl p-3 mb-4 shadow">
          <button
            onClick={buyClickUpgrade}
            disabled={cookies < clickPower * 10}
            className="w-full flex justify-between items-center disabled:opacity-50"
          >
            <div className="text-left">
              <div className="font-semibold text-amber-900">👆 Click Power</div>
              <div className="text-xs text-amber-700">+1 per click (currently {clickPower})</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-amber-900">{(clickPower * 10).toLocaleString()}</div>
              <div className="text-xs text-amber-600">cookies</div>
            </div>
          </button>
        </div>

        {/* Upgrades Shop */}
        <div className="bg-white/80 backdrop-blur rounded-2xl p-4 shadow-lg">
          <h2 className="text-xl font-bold text-amber-900 mb-3">🏪 Shop</h2>
          <div className="space-y-2">
            {upgrades.map(upgrade => (
              <button
                key={upgrade.id}
                onClick={() => buyUpgrade(upgrade)}
                disabled={cookies < upgrade.cost}
                className="w-full bg-white rounded-xl p-3 shadow hover:shadow-md transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex justify-between items-start">
                  <div className="text-left flex-1">
                    <div className="font-semibold text-amber-900">
                      {upgrade.name}
                      {upgrade.count > 0 && (
                        <span className="ml-2 text-sm text-amber-600">×{upgrade.count}</span>
                      )}
                    </div>
                    <div className="text-xs text-amber-700 mt-1">{upgrade.description}</div>
                    <div className="text-xs text-amber-600 mt-1">
                      +{upgrade.cps} cookies/sec
                    </div>
                  </div>
                  <div className="text-right ml-3">
                    <div className="font-bold text-amber-900">{upgrade.cost.toLocaleString()}</div>
                    <div className="text-xs text-amber-600">cookies</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

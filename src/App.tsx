import { useState, useEffect } from 'react';
import { useStorage, useAnalytics } from './vrp-sdk';

interface GameState {
  cookies: number;
  cookiesPerSecond: number;
  upgrades: {
    autoClickers: number;
    grandmas: number;
    farms: number;
    factories: number;
  };
}

interface Upgrade {
  id: keyof GameState['upgrades'];
  name: string;
  baseCost: number;
  cps: number;
  emoji: string;
}

const UPGRADES: Upgrade[] = [
  { id: 'autoClickers', name: 'Auto Clicker', baseCost: 15, cps: 0.1, emoji: '👆' },
  { id: 'grandmas', name: 'Grandma', baseCost: 100, cps: 1, emoji: '👵' },
  { id: 'farms', name: 'Cookie Farm', baseCost: 500, cps: 5, emoji: '🌾' },
  { id: 'factories', name: 'Factory', baseCost: 3000, cps: 20, emoji: '🏭' },
];

function App() {
  const storage = useStorage();
  const analytics = useAnalytics();
  
  const [gameState, setGameState] = useState<GameState>({
    cookies: 0,
    cookiesPerSecond: 0,
    upgrades: {
      autoClickers: 0,
      grandmas: 0,
      farms: 0,
      factories: 0,
    },
  });
  
  const [clickAnimation, setClickAnimation] = useState(false);

  // Load game state on mount
  useEffect(() => {
    const loadGame = async () => {
      const saved = await storage.get('cookieClickerState');
      if (saved) {
        setGameState(saved);
      }
    };
    loadGame();
  }, []);

  // Save game state periodically
  useEffect(() => {
    const interval = setInterval(async () => {
      await storage.set('cookieClickerState', gameState);
    }, 5000);
    return () => clearInterval(interval);
  }, [gameState]);

  // Auto-generate cookies
  useEffect(() => {
    if (gameState.cookiesPerSecond === 0) return;
    
    const interval = setInterval(() => {
      setGameState(prev => ({
        ...prev,
        cookies: prev.cookies + prev.cookiesPerSecond / 10,
      }));
    }, 100);
    
    return () => clearInterval(interval);
  }, [gameState.cookiesPerSecond]);

  const handleCookieClick = () => {
    setGameState(prev => ({ ...prev, cookies: prev.cookies + 1 }));
    setClickAnimation(true);
    setTimeout(() => setClickAnimation(false), 100);
    analytics.track('cookie_clicked');
  };

  const calculateUpgradeCost = (upgrade: Upgrade) => {
    const owned = gameState.upgrades[upgrade.id];
    return Math.floor(upgrade.baseCost * Math.pow(1.15, owned));
  };

  const purchaseUpgrade = (upgrade: Upgrade) => {
    const cost = calculateUpgradeCost(upgrade);
    
    if (gameState.cookies < cost) return;
    
    const newUpgrades = {
      ...gameState.upgrades,
      [upgrade.id]: gameState.upgrades[upgrade.id] + 1,
    };
    
    const newCps = UPGRADES.reduce((total, u) => {
      return total + (newUpgrades[u.id] * u.cps);
    }, 0);
    
    setGameState({
      cookies: gameState.cookies - cost,
      cookiesPerSecond: newCps,
      upgrades: newUpgrades,
    });
    
    analytics.track('upgrade_purchased', { upgrade: upgrade.id, count: newUpgrades[upgrade.id] });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return Math.floor(num).toString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-900 to-amber-950 text-white p-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">Cookie Clicker</h1>
        <div className="text-2xl font-bold text-amber-300">
          {formatNumber(gameState.cookies)} cookies
        </div>
        <div className="text-sm text-amber-200 mt-1">
          per second: {gameState.cookiesPerSecond.toFixed(1)}
        </div>
      </div>

      {/* Cookie Button */}
      <div className="flex justify-center mb-8">
        <button
          onClick={handleCookieClick}
          className={`text-9xl transition-transform active:scale-95 hover:scale-105 ${
            clickAnimation ? 'scale-110' : ''
          }`}
          style={{ transition: 'transform 0.1s' }}
        >
          🍪
        </button>
      </div>

      {/* Upgrades Shop */}
      <div className="max-w-md mx-auto">
        <h2 className="text-2xl font-bold mb-4 text-center">Shop</h2>
        <div className="space-y-3">
          {UPGRADES.map(upgrade => {
            const cost = calculateUpgradeCost(upgrade);
            const owned = gameState.upgrades[upgrade.id];
            const canAfford = gameState.cookies >= cost;
            
            return (
              <button
                key={upgrade.id}
                onClick={() => purchaseUpgrade(upgrade)}
                disabled={!canAfford}
                className={`w-full p-4 rounded-lg border-2 transition-all ${
                  canAfford
                    ? 'bg-amber-800 border-amber-600 hover:bg-amber-700 active:scale-95'
                    : 'bg-gray-800 border-gray-700 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{upgrade.emoji}</span>
                    <div className="text-left">
                      <div className="font-bold">{upgrade.name}</div>
                      <div className="text-sm text-amber-200">
                        +{upgrade.cps} per second
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-amber-300">{formatNumber(cost)}</div>
                    <div className="text-xs text-amber-200">Owned: {owned}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-md mx-auto mt-8 p-4 bg-amber-950 rounded-lg border-2 border-amber-800">
        <h3 className="font-bold mb-2">Total Production</h3>
        <div className="text-sm space-y-1 text-amber-200">
          {UPGRADES.map(upgrade => {
            const owned = gameState.upgrades[upgrade.id];
            const totalCps = owned * upgrade.cps;
            if (owned === 0) return null;
            return (
              <div key={upgrade.id} className="flex justify-between">
                <span>{upgrade.emoji} {upgrade.name} x{owned}</span>
                <span>{totalCps.toFixed(1)} /sec</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default App;

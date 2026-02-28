import { useState, useEffect } from "react";
import { useStorage, useUser } from "@vrp/sdk";

interface GameState {
  cookies: number;
  cookiesPerClick: number;
  cookiesPerSecond: number;
  upgrades: {
    autoClicker: number;
    clickMultiplier: number;
    grandma: number;
    factory: number;
  };
}

const INITIAL_STATE: GameState = {
  cookies: 0,
  cookiesPerClick: 1,
  cookiesPerSecond: 0,
  upgrades: {
    autoClicker: 0,
    clickMultiplier: 0,
    grandma: 0,
    factory: 0,
  },
};

const UPGRADE_COSTS = {
  autoClicker: (level: number) => Math.floor(10 * Math.pow(1.15, level)),
  clickMultiplier: (level: number) => Math.floor(100 * Math.pow(1.5, level)),
  grandma: (level: number) => Math.floor(50 * Math.pow(1.3, level)),
  factory: (level: number) => Math.floor(500 * Math.pow(1.5, level)),
};

const UPGRADE_VALUES = {
  autoClicker: 1,
  clickMultiplier: 1,
  grandma: 5,
  factory: 50,
};

function App() {
  const storage = useStorage();
  const user = useUser();
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved game state
  useEffect(() => {
    const loadGame = async () => {
      try {
        const saved = await storage.get("cookieClickerState");
        if (saved) {
          setGameState(saved as GameState);
        }
      } catch (error) {
        console.error("Failed to load game:", error);
      }
      setIsLoaded(true);
    };
    loadGame();
  }, []);

  // Save game state
  useEffect(() => {
    if (isLoaded) {
      const saveGame = async () => {
        try {
          await storage.set("cookieClickerState", gameState);
        } catch (error) {
          console.error("Failed to save game:", error);
        }
      };
      saveGame();
    }
  }, [gameState, isLoaded]);

  // Auto-clicker interval
  useEffect(() => {
    const interval = setInterval(() => {
      setGameState((prev) => {
        const cps = 
          prev.upgrades.autoClicker * UPGRADE_VALUES.autoClicker +
          prev.upgrades.grandma * UPGRADE_VALUES.grandma +
          prev.upgrades.factory * UPGRADE_VALUES.factory;
        
        return {
          ...prev,
          cookies: prev.cookies + cps / 10,
          cookiesPerSecond: cps,
        };
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const handleCookieClick = () => {
    setGameState((prev) => ({
      ...prev,
      cookies: prev.cookies + prev.cookiesPerClick,
    }));
  };

  const buyUpgrade = (upgrade: keyof GameState["upgrades"]) => {
    const cost = UPGRADE_COSTS[upgrade](gameState.upgrades[upgrade]);
    if (gameState.cookies >= cost) {
      setGameState((prev) => {
        const newUpgrades = {
          ...prev.upgrades,
          [upgrade]: prev.upgrades[upgrade] + 1,
        };
        
        const newCookiesPerClick = upgrade === "clickMultiplier" 
          ? 1 + newUpgrades.clickMultiplier * UPGRADE_VALUES.clickMultiplier
          : prev.cookiesPerClick;

        return {
          ...prev,
          cookies: prev.cookies - cost,
          cookiesPerClick: newCookiesPerClick,
          upgrades: newUpgrades,
        };
      });
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50">
        <p className="text-amber-900 text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-amber-900 mb-2">Cookie Clicker</h1>
          {user && (
            <p className="text-amber-700 text-sm">Playing as {user.username}</p>
          )}
        </div>

        {/* Cookie Display */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 text-center">
          <div className="text-5xl font-bold text-amber-900 mb-2">
            {Math.floor(gameState.cookies)}
          </div>
          <div className="text-amber-700 font-medium mb-1">cookies</div>
          <div className="text-amber-600 text-sm">
            per second: {gameState.cookiesPerSecond.toFixed(1)}
          </div>
          <div className="text-amber-600 text-sm">
            per click: {gameState.cookiesPerClick}
          </div>
        </div>

        {/* Cookie Button */}
        <div className="flex justify-center mb-6">
          <button
            onClick={handleCookieClick}
            className="w-48 h-48 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 shadow-2xl hover:shadow-3xl active:scale-95 transition-transform duration-100 flex items-center justify-center text-8xl border-8 border-amber-800"
          >
            🍪
          </button>
        </div>

        {/* Upgrades */}
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <h2 className="text-2xl font-bold text-amber-900 mb-4">Upgrades</h2>
          <div className="space-y-2">
            <UpgradeButton
              title="Auto Clicker"
              description={`+${UPGRADE_VALUES.autoClicker} cookie/sec`}
              cost={UPGRADE_COSTS.autoClicker(gameState.upgrades.autoClicker)}
              count={gameState.upgrades.autoClicker}
              canAfford={gameState.cookies >= UPGRADE_COSTS.autoClicker(gameState.upgrades.autoClicker)}
              onClick={() => buyUpgrade("autoClicker")}
            />
            <UpgradeButton
              title="Click Multiplier"
              description={`+${UPGRADE_VALUES.clickMultiplier} per click`}
              cost={UPGRADE_COSTS.clickMultiplier(gameState.upgrades.clickMultiplier)}
              count={gameState.upgrades.clickMultiplier}
              canAfford={gameState.cookies >= UPGRADE_COSTS.clickMultiplier(gameState.upgrades.clickMultiplier)}
              onClick={() => buyUpgrade("clickMultiplier")}
            />
            <UpgradeButton
              title="Grandma"
              description={`+${UPGRADE_VALUES.grandma} cookies/sec`}
              cost={UPGRADE_COSTS.grandma(gameState.upgrades.grandma)}
              count={gameState.upgrades.grandma}
              canAfford={gameState.cookies >= UPGRADE_COSTS.grandma(gameState.upgrades.grandma)}
              onClick={() => buyUpgrade("grandma")}
            />
            <UpgradeButton
              title="Cookie Factory"
              description={`+${UPGRADE_VALUES.factory} cookies/sec`}
              cost={UPGRADE_COSTS.factory(gameState.upgrades.factory)}
              count={gameState.upgrades.factory}
              canAfford={gameState.cookies >= UPGRADE_COSTS.factory(gameState.upgrades.factory)}
              onClick={() => buyUpgrade("factory")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

interface UpgradeButtonProps {
  title: string;
  description: string;
  cost: number;
  count: number;
  canAfford: boolean;
  onClick: () => void;
}

function UpgradeButton({ title, description, cost, count, canAfford, onClick }: UpgradeButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={!canAfford}
      className={`w-full p-3 rounded-lg text-left transition-colors ${
        canAfford
          ? "bg-amber-100 hover:bg-amber-200 border-2 border-amber-300"
          : "bg-gray-100 border-2 border-gray-200 opacity-50 cursor-not-allowed"
      }`}
    >
      <div className="flex justify-between items-center">
        <div>
          <div className="font-bold text-amber-900">{title}</div>
          <div className="text-sm text-amber-700">{description}</div>
        </div>
        <div className="text-right">
          <div className="font-bold text-amber-900">{cost}</div>
          <div className="text-xs text-amber-600">owned: {count}</div>
        </div>
      </div>
    </button>
  );
}

export default App;

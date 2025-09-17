// Maps system for UnoVsUno game
// Each map is a "foldspace" with unique layouts and obstacles

const maps = {
  classic: {
    name: "Classic Foldspace",
    spawnPoints: [
      { x: 100, y: 100 },
      { x: 1720, y: 780 },
    ],
    obstacles: [
      { x: 300, y: 200, width: 50, height: 100 },
      { x: 500, y: 300, width: 150, height: 50 },
      { x: 700, y: 400, width: 50, height: 150 },
      { x: 900, y: 500, width: 100, height: 50 },
      { x: 1100, y: 600, width: 50, height: 100 },
      { x: 1300, y: 700, width: 120, height: 50 },
      { x: 1500, y: 800, width: 50, height: 120 },
      { x: 1700, y: 900, width: 100, height: 50 },
      { x: 1900, y: 1000, width: 50, height: 100 },
      { x: 200, y: 1100, width: 150, height: 50 },
      { x: 400, y: 1200, width: 50, height: 150 },
      { x: 600, y: 1300, width: 100, height: 50 },
      { x: 800, y: 1400, width: 50, height: 100 },
      { x: 1000, y: 1500, width: 150, height: 50 },
      { x: 300, y: 100, width: 50, height: 100 },
      { x: 500, y: 200, width: 150, height: 50 },
      { x: 700, y: 300, width: 50, height: 150 },
      { x: 900, y: 400, width: 100, height: 50 },
      { x: 1100, y: 500, width: 50, height: 100 },
      { x: 1300, y: 600, width: 120, height: 50 },
      { x: 1500, y: 700, width: 50, height: 120 },
      { x: 1700, y: 800, width: 100, height: 50 },
      { x: 1900, y: 900, width: 50, height: 100 },
      { x: 200, y: 1000, width: 150, height: 50 },
      { x: 400, y: 100, width: 50, height: 150 },
      { x: 600, y: 200, width: 100, height: 50 },
      { x: 800, y: 800, width: 50, height: 100 },
      { x: 1000, y: 300, width: 150, height: 50 },
      { x: 1200, y: 500, width: 50, height: 100 },
      { x: 1400, y:1700, width: 150, height: 50 }
    ]
  },
  
  vortex: {
    name: "Vortex Foldspace",
    spawnPoints: [
      { x: 200, y: 200 },
      { x: 1620, y: 680 },
    ],
    obstacles: [
      // Central vortex structure
      { x: 860, y: 490, width: 200, height: 100 },
      { x: 910, y: 440, width: 100, height: 50 },
      { x: 910, y: 590, width: 100, height: 50 },
      
      // Spiral arms extending from center
      { x: 700, y: 400, width: 60, height: 60 },
      { x: 750, y: 350, width: 60, height: 60 },
      { x: 800, y: 300, width: 60, height: 60 },
      
      { x: 1160, y: 400, width: 60, height: 60 },
      { x: 1110, y: 350, width: 60, height: 60 },
      { x: 1060, y: 300, width: 60, height: 60 },
      
      { x: 700, y: 680, width: 60, height: 60 },
      { x: 750, y: 730, width: 60, height: 60 },
      { x: 800, y: 780, width: 60, height: 60 },
      
      { x: 1160, y: 680, width: 60, height: 60 },
      { x: 1110, y: 730, width: 60, height: 60 },
      { x: 1060, y: 780, width: 60, height: 60 },
      
      // Corner bunkers
      { x: 100, y: 100, width: 80, height: 80 },
      { x: 1740, y: 100, width: 80, height: 80 },
      { x: 100, y: 900, width: 80, height: 80 },
      { x: 1740, y: 900, width: 80, height: 80 },
      
      // Edge cover positions
      { x: 50, y: 500, width: 40, height: 80 },
      { x: 1830, y: 500, width: 40, height: 80 },
      { x: 900, y: 50, width: 80, height: 40 },
      { x: 900, y: 990, width: 80, height: 40 },
    ]
  },

  maze: {
    name: "Labyrinth Foldspace", 
    spawnPoints: [
      { x: 150, y: 150 },
      { x: 1770, y: 930 },
    ],
    obstacles: [
      // Maze walls creating a complex labyrinth
      // Outer walls
      { x: 100, y: 100, width: 1720, height: 40 },
      { x: 100, y: 940, width: 1720, height: 40 },
      { x: 100, y: 100, width: 40, height: 880 },
      { x: 1780, y: 100, width: 40, height: 880 },
      
      // Internal maze structure
      { x: 200, y: 200, width: 40, height: 200 },
      { x: 300, y: 150, width: 200, height: 40 },
      { x: 450, y: 250, width: 40, height: 150 },
      { x: 550, y: 200, width: 150, height: 40 },
      { x: 650, y: 300, width: 40, height: 200 },
      { x: 750, y: 150, width: 40, height: 100 },
      { x: 850, y: 200, width: 100, height: 40 },
      { x: 900, y: 300, width: 40, height: 150 },
      { x: 1000, y: 250, width: 150, height: 40 },
      { x: 1100, y: 350, width: 40, height: 100 },
      { x: 1200, y: 200, width: 40, height: 200 },
      { x: 1300, y: 150, width: 200, height: 40 },
      { x: 1450, y: 250, width: 40, height: 150 },
      { x: 1550, y: 300, width: 150, height: 40 },
      
      // Middle section
      { x: 200, y: 500, width: 200, height: 40 },
      { x: 350, y: 400, width: 40, height: 200 },
      { x: 450, y: 550, width: 150, height: 40 },
      { x: 550, y: 450, width: 40, height: 200 },
      { x: 650, y: 500, width: 200, height: 40 },
      { x: 800, y: 400, width: 40, height: 100 },
      { x: 900, y: 550, width: 100, height: 40 },
      { x: 1050, y: 450, width: 40, height: 150 },
      { x: 1150, y: 500, width: 150, height: 40 },
      { x: 1250, y: 400, width: 40, height: 200 },
      { x: 1350, y: 550, width: 200, height: 40 },
      { x: 1500, y: 450, width: 40, height: 150 },
      
      // Lower section
      { x: 200, y: 700, width: 150, height: 40 },
      { x: 300, y: 600, width: 40, height: 200 },
      { x: 400, y: 750, width: 100, height: 40 },
      { x: 550, y: 650, width: 40, height: 150 },
      { x: 650, y: 700, width: 150, height: 40 },
      { x: 750, y: 600, width: 40, height: 100 },
      { x: 850, y: 750, width: 200, height: 40 },
      { x: 1000, y: 650, width: 40, height: 200 },
      { x: 1100, y: 700, width: 100, height: 40 },
      { x: 1250, y: 600, width: 40, height: 150 },
      { x: 1350, y: 750, width: 200, height: 40 },
      { x: 1500, y: 650, width: 40, height: 200 },
    ]
  }
};

// Default map
const DEFAULT_MAP = 'classic';

// Get map by name
function getMap(mapName = DEFAULT_MAP) {
  return maps[mapName] || maps[DEFAULT_MAP];
}

// Get all available maps
function getAllMaps() {
  return Object.keys(maps).map(key => ({
    id: key,
    name: maps[key].name
  }));
}

// For Node.js (server-side)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    maps,
    DEFAULT_MAP,
    getMap,
    getAllMaps
  };
}

// For browser (client-side)
if (typeof window !== 'undefined') {
  window.GameMaps = {
    maps,
    DEFAULT_MAP,
    getMap,
    getAllMaps
  };
}
# Voxel Road - Memecoin Edition

A Crossy Road-style 3D voxel game built with Three.js and Next.js, featuring 100+ collectible characters, a prize/gacha system, and complete game progression.

## ✨ Features

- 🎮 **Classic Endless Runner** - Navigate through grass, roads, rivers, and railways
- 🐔 **100+ Unique Characters** - Collect Common, Rare, Legendary, and Mythic characters
- 🎰 **Prize Machine** - Gacha system to unlock new characters
- 🪙 **Coin System** - Earn coins by progressing and collecting loot
- 💾 **Enhanced Local Storage** - Automatic save system with data validation and backup
- 📱 **Mobile & Touch Controls** - Fully responsive with swipe and pinch-to-zoom
- 🎨 **Voxel Art Style** - Colorful 3D blocky graphics
- 🚗 **Multiple Lane Types** - Avoid cars, ride logs, dodge trains
- 🏆 **High Score Tracking** - Beat your personal best
- 🎭 **Character Preview System** - See your collection in the character selector

## Tech Stack

- **Next.js 14** - React framework
- **Three.js r128** - 3D graphics
- **Tween.js** - Animation
- **Local Storage** - Data persistence

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd walkrun
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment to Vercel

### Option 1: Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

### Option 2: GitHub Integration

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Click "Deploy"

Vercel will automatically detect Next.js and configure the build settings.

## Game Controls

- **Arrow Keys** or **WASD** - Move character
- **Mouse Wheel** or **Pinch** - Zoom in/out
- **Swipe** (mobile) - Move character

## 💾 Enhanced Local Storage

The game features a robust local storage system with:

### Persisted Data
- **High Score** - Your personal best distance
- **Total Coins** - All coins collected across sessions
- **Unlocked Characters** - List of character IDs you've unlocked
- **Selected Character** - Your currently equipped character
- **Last Saved Timestamp** - ISO date of last save

### Storage Features
- ✅ **Auto-save** every 30 seconds during gameplay
- ✅ **Save on exit** - Data persisted before page unload
- ✅ **Data validation** - Corrupted data reverts to safe defaults
- ✅ **Type checking** - Ensures data integrity (arrays, numbers validation)
- ✅ **Error handling** - Graceful fallbacks if localStorage is unavailable
- ✅ **Console logging** - Track save/load events in dev tools

### Storage Key
```
voxelRoadData_v3
```

### Data Structure
```javascript
{
  coins: Number,
  highScore: Number,
  unlockedChars: Array<String>,
  selectedChar: String,
  lastSaved: String (ISO Date)
}
```

### Clear Save Data
To reset your progress, open browser console and run:
```javascript
localStorage.removeItem('voxelRoadData_v3')
location.reload()
```

## Project Structure

```
walkrun/
├── components/
│   └── Game.js          # Main game component (iframe wrapper)
├── pages/
│   ├── _app.js         # Next.js app wrapper
│   ├── _document.js    # Custom document (loads Tween.js)
│   └── index.js        # Homepage
├── public/
│   ├── voxel-game.html # Complete game implementation
│   └── game-full.html  # Minimal demo version
├── styles/
│   └── globals.css     # Global styles and game UI
├── package.json
├── next.config.js
└── README.md
```

## Customization

### Adding More Characters

Edit `public/voxel-game.html` and add new entries to the `CharacterDefinitions` object:

```javascript
'my_char': {
  name: "My Character",
  rarity: "common", // common, rare, legendary, mythic
  build: () => {
    const g = new THREE.Group();
    // Add voxel boxes to create your character
    g.add(createBox(Materials.white, 25, 25, 25, 0, 12.5, 0));
    return g;
  }
}
```

### Adjusting Difficulty

In `public/voxel-game.html`, modify:
- `LANE_SIZE` - Distance between lanes
- `MOVE_TIME` - Speed of player movement
- Lane spawn rates in the `Lane` class

### Changing Prize Costs

Modify `PRIZE_COST` constant in the game file.

## Performance

The game is optimized for:
- Desktop browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Android)
- 60 FPS target with adaptive quality

## Known Issues

- Character preview generation may take a moment on first load
- Some mobile devices may experience performance issues with many obstacles

## Future Enhancements

- [ ] Multiplayer support
- [ ] Leaderboards
- [ ] More lane types (lava, ice, etc.)
- [ ] Power-ups and special abilities
- [ ] Sound effects and music
- [ ] Daily challenges

## License

MIT License - feel free to use and modify for your own projects.

## Credits

- Original concept inspired by Crossy Road
- Built with Three.js and Next.js
- Character designs original voxel art

## Support

For issues or questions, please open an issue on GitHub.

---

Built with ❤️ and ☕


/**
 * VOXEL ROAD - MEMECOIN EDITION
 * Complete Game Logic with Enhanced Local Storage
 */

const LANE_GRASS = 0;
const LANE_ROAD = 1;
const LANE_RIVER = 2;
const LANE_RAIL = 3;

const LANE_SIZE = 40;
const MOVE_TIME = 150;
const PRIZE_COST = 100;

const State = {
    score: 0,
    highScore: 0,
    coins: 0,
    gameOver: false,
    isPlaying: false,
    inPrizeMachine: false,
    currentLane: 0,
    playerPos: { x: 0, z: 0 }, 
    lanes: [], 
    cameraOffset: { x: -300, y: 300, z: -300 },
    cameraZoom: 1.0,
    unlockedChars: ['chicken'],
    selectedChar: 'chicken'
};

// Enhanced Local Storage with backup and validation
const STORAGE_KEY = 'voxelRoadData_v3';

function loadData() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
            const parsed = JSON.parse(savedData);
            State.coins = Math.max(0, parsed.coins || 0);
            State.highScore = Math.max(0, parsed.highScore || 0);
            State.unlockedChars = Array.isArray(parsed.unlockedChars) ? parsed.unlockedChars : ['chicken'];
            State.selectedChar = parsed.selectedChar || 'chicken';
            
            // Validate selected char is unlocked
            if (!State.unlockedChars.includes(State.selectedChar)) {
                State.selectedChar = 'chicken';
            }
            
            console.log('Data loaded successfully:', {
                coins: State.coins,
                highScore: State.highScore,
                unlockedCount: State.unlockedChars.length
            });
        }
    } catch (e) {
        console.error('Failed to load save data:', e);
        // Reset to defaults on error
        State.coins = 0;
        State.highScore = 0;
        State.unlockedChars = ['chicken'];
        State.selectedChar = 'chicken';
    }
}

function saveData() {
    try {
        const dataToSave = {
            coins: State.coins,
            highScore: State.highScore,
            unlockedChars: State.unlockedChars,
            selectedChar: State.selectedChar,
            lastSaved: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
        console.log('Data saved successfully');
    } catch (e) {
        console.error('Failed to save data:', e);
    }
}

// Auto-save every 30 seconds
setInterval(() => {
    if (State.isPlaying || State.inPrizeMachine) {
        saveData();
    }
}, 30000);

// Load data on startup
loadData();

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
scene.fog = new THREE.Fog(0x87CEEB, 200, 900);

const aspect = window.innerWidth / window.innerHeight;
const d = 500;
const camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 3000);
camera.position.set(State.cameraOffset.x, State.cameraOffset.y, State.cameraOffset.z);
camera.lookAt(0, 0, 0);
camera.zoom = State.cameraZoom;
camera.updateProjectionMatrix();

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('game-container').appendChild(renderer.domElement);

const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(-100, 200, -50);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.camera.left = -500;
dirLight.shadow.camera.right = 500;
dirLight.shadow.camera.top = 500;
dirLight.shadow.camera.bottom = -500;
scene.add(dirLight);

// Materials
const Materials = {
    white: new THREE.MeshLambertMaterial({ color: 0xffffff }),
    black: new THREE.MeshLambertMaterial({ color: 0x333333 }),
    red: new THREE.MeshLambertMaterial({ color: 0xe74c3c }),
    orange: new THREE.MeshLambertMaterial({ color: 0xf39c12 }),
    blue: new THREE.MeshLambertMaterial({ color: 0x3498db }),
    green: new THREE.MeshLambertMaterial({ color: 0x2ecc71 }),
    darkGreen: new THREE.MeshLambertMaterial({ color: 0x27ae60 }),
    pink: new THREE.MeshLambertMaterial({ color: 0xffa0c4 }),
    gray: new THREE.MeshLambertMaterial({ color: 0x95a5a6 }),
    brown: new THREE.MeshLambertMaterial({ color: 0x8B4513 }),
    yellow: new THREE.MeshLambertMaterial({ color: 0xF1C40F }),
    glass: new THREE.MeshLambertMaterial({ color: 0xADD8E6, opacity: 0.8, transparent: true }),
    lilypad: new THREE.MeshLambertMaterial({ color: 0x76D7C4 }),
    purple: new THREE.MeshLambertMaterial({ color: 0x9b59b6 }),
    gold: new THREE.MeshLambertMaterial({ color: 0xFFD700, emissive: 0x333300 }),
    skin: new THREE.MeshLambertMaterial({ color: 0xffcd94 }),
    solanaPurple: new THREE.MeshLambertMaterial({ color: 0x9945FF, emissive: 0x220044 }),
    solanaGreen: new THREE.MeshLambertMaterial({ color: 0x14F195, emissive: 0x002211 }),
    solanaPink: new THREE.MeshLambertMaterial({ color: 0xE429F2 }) 
};

function createBox(color, w, h, d, x, y, z) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, color);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
}

function createSolanaGem(size) {
    const group = new THREE.Group();
    const unit = size / 3;
    group.add(createBox(Materials.solanaGreen, size, unit, size, 0, -unit, 0));
    group.add(createBox(Materials.solanaPurple, size, unit, size, 0, 0, 0));
    group.add(createBox(Materials.solanaPink, size*0.6, unit, size*0.6, 0, unit, 0));
    return group;
}

// CHARACTER DEFINITIONS - All 100+ characters from original
const CharacterDefinitions = {
    'chicken': { name: "Chicken", rarity: "common", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.white,25,25,25,0,12.5,0)); g.add(createBox(Materials.red,5,8,10,0,28,5)); g.add(createBox(Materials.orange,5,5,5,0,18,14)); g.add(createBox(Materials.orange,4,10,4,-6,0,0)); g.add(createBox(Materials.orange,4,10,4,6,0,0)); return g; } },
    'burger': { name: "Burger", rarity: "common", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.orange,25,5,25,0,5,0)); g.add(createBox(Materials.brown,28,8,28,0,12,0)); g.add(createBox(Materials.green,29,4,29,0,18,0)); g.add(createBox(Materials.red,27,3,27,0,22,0)); g.add(createBox(Materials.orange,25,10,25,0,28,0)); return g; } },
    'pizza': { name: "Pizza", rarity: "common", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.orange,30,5,30,0,5,0)); g.add(createBox(Materials.yellow,25,5,25,0,8,0)); g.add(createBox(Materials.red,5,6,5,5,9,5)); g.add(createBox(Materials.red,5,6,5,-5,9,-5)); return g; } },
    'hotdog': { name: "Hotdog", rarity: "common", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.orange,15,10,35,0,5,0)); g.add(createBox(Materials.red,10,10,40,0,10,0)); g.add(createBox(Materials.yellow,4,4,35,0,16,0)); return g; } },
    'sushi': { name: "Sushi", rarity: "common", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.white,25,15,15,0,7.5,0)); g.add(createBox(Materials.black,26,10,16,0,7.5,0)); g.add(createBox(Materials.orange,15,8,10,0,18,0)); return g; } },
    'taco': { name: "Taco", rarity: "common", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.yellow,10,20,30,0,10,0)); g.add(createBox(Materials.brown,6,15,25,0,10,0)); g.add(createBox(Materials.green,8,18,20,0,12,0)); return g; } },
    'donut': { name: "Donut", rarity: "common", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.orange,30,10,30,0,10,0)); g.add(createBox(Materials.pink,30,5,30,0,15,0)); g.add(createBox(Materials.white,5,5,5,0,10,0)); return g; } },
    'icecream': { name: "Ice Cream", rarity: "common", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.orange,10,20,10,0,10,0)); g.add(createBox(Materials.pink,20,15,20,0,25,0)); g.add(createBox(Materials.white,18,10,18,0,35,0)); return g; } },
    'coffee': { name: "Coffee", rarity: "common", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.white,20,25,20,0,12.5,0)); g.add(createBox(Materials.brown,15,2,15,0,20,0)); g.add(createBox(Materials.white,22,2,22,0,25,0)); return g; } },
    'watermelon': { name: "Melon", rarity: "common", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.green,30,25,15,0,12.5,0)); g.add(createBox(Materials.red,26,21,15,0,12.5,1)); g.add(createBox(Materials.black,2,2,16,5,15,0)); g.add(createBox(Materials.black,2,2,16,-5,10,0)); return g; } },
    'chest': { name: "Chest", rarity: "common", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.brown,30,20,20,0,10,0)); g.add(createBox(Materials.gold,32,5,22,0,15,0)); g.add(createBox(Materials.gray,4,8,2,0,12,11)); return g; } },
    'tv': { name: "TV", rarity: "common", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.black,35,25,15,0,15,0)); g.add(createBox(Materials.glass,30,20,2,0,15,8)); g.add(createBox(Materials.gray,2,10,2,10,30,0)); return g; } },
    'gift': { name: "Gift", rarity: "common", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.red,25,25,25,0,12.5,0)); g.add(createBox(Materials.gold,27,5,27,0,12.5,0)); g.add(createBox(Materials.gold,5,27,27,0,12.5,0)); return g; } },
    'car': { name: "Toy Car", rarity: "common", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.blue,20,10,35,0,10,0)); g.add(createBox(Materials.glass,15,8,15,0,18,-5)); g.add(createBox(Materials.black,22,8,8,0,5,10)); g.add(createBox(Materials.black,22,8,8,0,5,-10)); return g; } },
    'cactus': { name: "Cactus", rarity: "common", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.green,15,40,15,0,20,0)); g.add(createBox(Materials.green,10,10,5,10,25,0)); g.add(createBox(Materials.green,10,10,5,-10,15,0)); return g; } },
    'doge': { name: "Doge", rarity: "common", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.yellow,25,25,35,0,12.5,0)); g.add(createBox(Materials.yellow,20,20,20,0,25,15)); g.add(createBox(Materials.black,4,4,2,0,25,25)); g.add(createBox(Materials.yellow,8,8,4,-8,35,10)); g.add(createBox(Materials.yellow,8,8,4,8,35,10)); return g; } },
    'pepe': { name: "Pepe", rarity: "rare", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.green,25,25,15,0,12.5,0)); g.add(createBox(Materials.green,30,25,20,0,30,5)); g.add(createBox(Materials.white,10,10,2,-8,35,16)); g.add(createBox(Materials.white,10,10,2,8,35,16)); g.add(createBox(Materials.black,4,4,2,-8,35,17)); g.add(createBox(Materials.black,4,4,2,8,35,17)); g.add(createBox(Materials.red,20,5,2,0,22,16)); return g; } },
    'shiba': { name: "Shiba", rarity: "common", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.orange,25,25,35,0,12.5,0)); g.add(createBox(Materials.white,26,10,20,0,5,10)); g.add(createBox(Materials.orange,20,20,20,0,25,15)); return g; } },
    'wif': { name: "Dog Wif Hat", rarity: "rare", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.orange,25,25,35,0,12.5,0)); g.add(createBox(Materials.pink,24,12,24,0,35,15)); return g; } },
    'bonk': { name: "Bonk", rarity: "common", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.orange,25,25,35,0,12.5,0)); g.add(createBox(Materials.brown,5,30,5,15,20,10)); return g; } },
    'brett': { name: "Brett", rarity: "rare", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.blue,25,30,15,0,15,0)); g.add(createBox(Materials.blue,25,25,25,0,40,0)); g.add(createBox(Materials.white,20,10,5,0,40,13)); return g; } },
    'andy': { name: "Andy", rarity: "rare", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.green,25,30,15,0,15,0)); g.add(createBox(Materials.green,25,25,25,0,40,0)); g.add(createBox(Materials.red,25,5,25,0,30,0)); return g; } },
    'popcat': { name: "Popcat", rarity: "rare", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.white,25,25,25,0,12.5,0)); g.add(createBox(Materials.pink,20,20,5,0,12.5,13)); return g; } },
    'mew': { name: "Mew", rarity: "common", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.white,20,15,30,0,7.5,0)); g.add(createBox(Materials.white,15,15,15,0,15,15)); g.add(createBox(Materials.pink,5,20,5,0,10,-10)); return g; } },
    'wojak': { name: "Wojak", rarity: "rare", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.black,20,25,10,0,12.5,0)); g.add(createBox(Materials.skin,22,25,22,0,35,0)); g.add(createBox(Materials.black,4,4,2,-5,35,12)); g.add(createBox(Materials.black,4,4,2,5,35,12)); return g; } },
    'chad': { name: "Giga Chad", rarity: "rare", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.black,25,30,15,0,15,0)); g.add(createBox(Materials.skin,25,25,25,0,45,0)); g.add(createBox(Materials.skin,28,10,25,0,35,2)); g.add(createBox(Materials.black,25,5,25,0,58,0)); return g; } },
    'stonks': { name: "Stonks Man", rarity: "common", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.black,25,30,15,0,15,0)); g.add(createBox(Materials.blue,5,30,2,0,15,8)); g.add(createBox(Materials.skin,20,22,20,0,38,0)); return g; } },
    'rocket': { name: "To The Moon", rarity: "common", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.white,15,40,15,0,20,0)); g.add(createBox(Materials.red,15,5,15,0,40,0)); g.add(createBox(Materials.gray,5,15,5,-8,5,0)); g.add(createBox(Materials.gray,5,15,5,8,5,0)); return g; } },
    'moon': { name: "The Moon", rarity: "rare", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.gray,30,30,30,0,20,0)); g.add(createBox(Materials.black,8,8,2,-5,25,15)); g.add(createBox(Materials.black,5,5,2,8,15,14)); return g; } },
    'diamond': { name: "Diamond Hands", rarity: "rare", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.blue,25,15,25,0,20,0)); g.add(createBox(Materials.blue,15,10,15,0,32,0)); g.add(createBox(Materials.blue,10,10,10,0,8,0)); return g; } },
    'ape': { name: "Bored Ape", rarity: "common", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.brown,25,30,20,0,15,0)); g.add(createBox(Materials.brown,22,22,22,0,40,5)); g.add(createBox(Materials.skin,15,10,5,0,38,16)); return g; } },
    'sheep': { name: "Sheep", rarity: "common", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.white,25,20,35,0,12.5,0)); g.add(createBox(Materials.black,15,15,10,0,20,20)); g.add(createBox(Materials.black,5,10,5,-8,5,10)); g.add(createBox(Materials.black,5,10,5,8,5,10)); return g; } },
    'cow': { name: "Cow", rarity: "common", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.white,25,25,40,0,12.5,0)); g.add(createBox(Materials.black,10,10,10,5,15,10)); g.add(createBox(Materials.black,10,10,10,-5,15,-10)); g.add(createBox(Materials.gray,20,20,15,0,25,22)); g.add(createBox(Materials.pink,15,10,5,0,15,30)); return g; } },
    'horse': { name: "Horse", rarity: "common", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.brown,20,20,40,0,15,0)); g.add(createBox(Materials.brown,15,25,15,0,30,20)); g.add(createBox(Materials.black,5,20,5,0,35,-20)); return g; } },
    'pig': { name: "Pig", rarity: "common", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.pink,25,20,35,0,12.5,0)); g.add(createBox(Materials.pink,20,20,20,0,25,15)); g.add(createBox(Materials.pink,8,8,4,0,20,25)); return g; } },
    'rabbit': { name: "Rabbit", rarity: "common", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.white,20,20,25,0,10,0)); g.add(createBox(Materials.white,15,15,15,0,20,10)); g.add(createBox(Materials.pink,5,15,2,-5,30,8)); g.add(createBox(Materials.pink,5,15,2,5,30,8)); return g; } },
    'mouse': { name: "Mouse", rarity: "common", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.gray,15,10,20,0,5,0)); g.add(createBox(Materials.gray,10,10,10,0,10,10)); g.add(createBox(Materials.pink,5,5,2,-5,15,10)); g.add(createBox(Materials.pink,5,5,2,5,15,10)); return g; } },
    'police': { name: "Police", rarity: "rare", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.blue,25,30,15,0,15,0)); g.add(createBox(Materials.skin,20,20,20,0,40,0)); g.add(createBox(Materials.blue,22,8,22,0,50,0)); g.add(createBox(Materials.gold,5,5,2,0,52,11)); return g; } },
    'firefighter': { name: "Firefighter", rarity: "rare", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.yellow,25,30,15,0,15,0)); g.add(createBox(Materials.skin,20,20,20,0,40,0)); g.add(createBox(Materials.red,22,10,22,0,50,0)); return g; } },
    'doctor': { name: "Doctor", rarity: "rare", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.white,25,30,15,0,15,0)); g.add(createBox(Materials.skin,20,20,20,0,40,0)); g.add(createBox(Materials.gray,22,5,22,0,48,0)); g.add(createBox(Materials.red,5,5,2,0,20,8)); return g; } },
    'chef': { name: "Chef", rarity: "rare", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.white,25,30,15,0,15,0)); g.add(createBox(Materials.skin,20,20,20,0,40,0)); g.add(createBox(Materials.white,20,15,20,0,55,0)); return g; } },
    'builder': { name: "Builder", rarity: "rare", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.orange,25,30,15,0,15,0)); g.add(createBox(Materials.skin,20,20,20,0,40,0)); g.add(createBox(Materials.yellow,22,8,22,0,50,0)); return g; } },
    'viking': { name: "Viking", rarity: "rare", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.brown,25,30,15,0,15,0)); g.add(createBox(Materials.skin,20,20,20,0,40,0)); g.add(createBox(Materials.gray,22,10,22,0,50,0)); g.add(createBox(Materials.white,5,10,5,12,50,0)); g.add(createBox(Materials.white,5,10,5,-12,50,0)); return g; } },
    'samurai': { name: "Samurai", rarity: "legendary", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.red,25,30,15,0,15,0)); g.add(createBox(Materials.skin,20,20,20,0,40,0)); g.add(createBox(Materials.black,24,10,24,0,50,0)); g.add(createBox(Materials.gold,10,10,2,0,55,12)); return g; } },
    'astronaut': { name: "Astronaut", rarity: "legendary", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.white,25,30,15,0,15,0)); g.add(createBox(Materials.white,25,25,25,0,40,0)); g.add(createBox(Materials.black,20,15,2,0,40,13)); return g; } },
    'alien_grey': { name: "Grey Alien", rarity: "legendary", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.gray,15,25,10,0,12.5,0)); g.add(createBox(Materials.gray,25,30,20,0,40,0)); g.add(createBox(Materials.black,10,12,2,-8,40,10)); g.add(createBox(Materials.black,10,12,2,8,40,10)); return g; } },
    'wolf': { name: "Wolf", rarity: "rare", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.gray,25,25,35,0,12.5,0)); g.add(createBox(Materials.gray,20,20,20,0,25,15)); g.add(createBox(Materials.white,10,5,5,0,20,25)); return g; } },
    'fox': { name: "Fox", rarity: "rare", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.orange,25,20,35,0,10,0)); g.add(createBox(Materials.orange,20,20,20,0,25,15)); g.add(createBox(Materials.white,10,5,5,0,22,25)); g.add(createBox(Materials.white,10,10,20,0,15,-20)); return g; } },
    'deer': { name: "Deer", rarity: "rare", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.brown,25,25,35,0,12.5,0)); g.add(createBox(Materials.brown,20,20,20,0,30,15)); g.add(createBox(Materials.brown,2,15,2,5,40,15)); g.add(createBox(Materials.brown,2,15,2,-5,40,15)); return g; } },
    'bear': { name: "Bear", rarity: "rare", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.brown,30,30,40,0,15,0)); g.add(createBox(Materials.brown,25,25,25,0,35,20)); return g; } },
    'owl': { name: "Owl", rarity: "rare", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.brown,20,25,20,0,12.5,0)); g.add(createBox(Materials.brown,15,15,15,0,30,0)); g.add(createBox(Materials.yellow,5,5,2,-4,30,8)); g.add(createBox(Materials.yellow,5,5,2,4,30,8)); return g; } },
    'bat': { name: "Bat", rarity: "rare", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.black,15,15,15,0,15,0)); g.add(createBox(Materials.black,25,10,2,0,15,0)); g.add(createBox(Materials.black,5,5,5,0,22,0)); return g; } },
    'penguin': { name: "Penguin", rarity: "rare", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.black,25,30,20,0,15,0)); g.add(createBox(Materials.white,20,25,5,0,15,10)); g.add(createBox(Materials.orange,8,5,5,0,25,12)); g.add(createBox(Materials.orange,8,5,8,-8,0,0)); g.add(createBox(Materials.orange,8,5,8,8,0,0)); return g; } },
    'shark': { name: "Shark", rarity: "rare", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.gray,25,25,50,0,12.5,0)); g.add(createBox(Materials.gray,5,15,10,0,25,0)); g.add(createBox(Materials.white,20,10,10,0,10,25)); return g; } },
    'whale': { name: "Whale", rarity: "rare", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.blue,40,30,60,0,15,0)); g.add(createBox(Materials.white,35,10,50,0,5,0)); return g; } },
    'crab': { name: "Crab", rarity: "rare", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.red,30,15,25,0,7.5,0)); g.add(createBox(Materials.red,10,10,10,15,15,10)); g.add(createBox(Materials.red,10,10,10,-15,15,10)); return g; } },
    'turtle': { name: "Turtle", rarity: "rare", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.green,25,10,35,0,5,0)); g.add(createBox(Materials.darkGreen,30,15,30,0,12,0)); g.add(createBox(Materials.green,10,10,10,0,8,20)); return g; } },
    'goldfish': { name: "Goldfish", rarity: "common", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.orange,15,20,25,0,10,0)); g.add(createBox(Materials.orange,5,15,10,0,10,-15)); return g; } },
    'axolotl': { name: "Axolotl", rarity: "rare", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.pink,25,15,35,0,10,0)); g.add(createBox(Materials.pink,20,15,15,0,15,20)); g.add(createBox(Materials.purple,5,15,2,12,15,18)); g.add(createBox(Materials.purple,5,15,2,-12,15,18)); return g; } },
    'capybara': { name: "Capybara", rarity: "rare", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.brown,25,25,40,0,12.5,0)); g.add(createBox(Materials.brown,22,22,20,0,20,25)); return g; } },
    'koala': { name: "Koala", rarity: "rare", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.gray,20,20,15,0,10,0)); g.add(createBox(Materials.gray,25,20,20,0,25,0)); g.add(createBox(Materials.black,8,8,5,-8,30,5)); g.add(createBox(Materials.black,8,8,5,8,30,5)); return g; } },
    'panda': { name: "Panda", rarity: "rare", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.white,30,25,20,0,12.5,0)); g.add(createBox(Materials.white,25,20,20,0,32,0)); g.add(createBox(Materials.black,8,8,6,-10,42,0)); g.add(createBox(Materials.black,8,8,6,10,42,0)); g.add(createBox(Materials.black,10,10,5,0,30,10)); return g; } },
    'lion': { name: "Lion", rarity: "rare", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.yellow,25,25,35,0,12.5,0)); g.add(createBox(Materials.orange,35,35,10,0,25,10)); return g; } },
    'tiger': { name: "Tiger", rarity: "rare", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.orange,25,25,35,0,12.5,0)); g.add(createBox(Materials.black,5,25,35,0,12.5,0)); g.add(createBox(Materials.orange,20,20,20,0,25,15)); return g; } },
    'zebra': { name: "Zebra", rarity: "rare", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.white,25,25,35,0,12.5,0)); g.add(createBox(Materials.black,5,25,35,0,12.5,0)); g.add(createBox(Materials.white,20,30,10,0,25,15)); return g; } },
    'giraffe': { name: "Giraffe", rarity: "rare", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.yellow,25,25,30,0,12.5,0)); g.add(createBox(Materials.yellow,10,50,10,0,45,15)); g.add(createBox(Materials.yellow,15,15,15,0,75,15)); return g; } },
    'elephant': { name: "Elephant", rarity: "rare", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.gray,35,30,40,0,15,0)); g.add(createBox(Materials.gray,25,25,25,0,35,20)); g.add(createBox(Materials.gray,5,20,5,0,30,35)); g.add(createBox(Materials.white,2,10,10,8,25,30)); g.add(createBox(Materials.white,2,10,10,-8,25,30)); return g; } },
    'rhino': { name: "Rhino", rarity: "rare", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.gray,30,25,40,0,12.5,0)); g.add(createBox(Materials.white,5,15,5,0,25,22)); return g; } },
    'hippo': { name: "Hippo", rarity: "rare", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.purple,35,25,40,0,12.5,0)); g.add(createBox(Materials.purple,30,25,30,0,25,15)); g.add(createBox(Materials.white,5,5,2,10,35,30)); g.add(createBox(Materials.white,5,5,2,-10,35,30)); return g; } },
    'slime': { name: "Slime", rarity: "common", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.green,25,20,25,0,10,0)); g.add(createBox(Materials.darkGreen,15,15,15,0,10,0)); g.add(createBox(Materials.black,4,4,2,-6,15,12)); g.add(createBox(Materials.black,4,4,2,6,15,12)); return g; } },
    'ghost': { name: "Ghost", rarity: "common", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.white,25,30,25,0,20,0)); g.add(createBox(Materials.black,5,5,2,-6,25,12)); g.add(createBox(Materials.black,5,5,2,6,25,12)); g.add(createBox(Materials.white,8,8,8,-8,5,0)); g.add(createBox(Materials.white,8,8,8,8,5,0)); return g; } },
    'dirtblock': { name: "Dirt Block", rarity: "common", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.brown,30,30,30,0,15,0)); g.add(createBox(Materials.green,30,5,30,0,28,0)); return g; } },
    'piggy': { name: "Piggy", rarity: "common", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.pink,25,20,35,0,12.5,0)); g.add(createBox(Materials.pink,20,20,20,0,25,10)); g.add(createBox(Materials.pink,10,8,5,0,22,20)); g.add(createBox(Materials.pink,5,5,5,-10,32,10)); g.add(createBox(Materials.pink,5,5,5,10,32,10)); return g; } },
    'duck': { name: "Duck", rarity: "common", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.yellow,25,20,30,0,12.5,0)); g.add(createBox(Materials.yellow,20,20,20,0,25,10)); g.add(createBox(Materials.orange,15,5,10,0,22,20)); g.add(createBox(Materials.orange,8,5,8,-8,0,0)); g.add(createBox(Materials.orange,8,5,8,8,0,0)); return g; } },
    'zombie': { name: "Zombie", rarity: "rare", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.blue,25,25,15,0,12.5,0)); g.add(createBox(Materials.green,25,25,15,0,30,0)); g.add(createBox(Materials.green,20,20,20,0,45,0)); g.add(createBox(Materials.green,8,25,8,18,30,10)); return g; } },
    'cthulhu': { name: "Cthulhu", rarity: "legendary", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.green,30,35,25,0,17,0)); g.add(createBox(Materials.green,30,30,30,0,45,0)); g.add(createBox(Materials.green,5,15,5,0,35,15)); g.add(createBox(Materials.green,5,15,5,10,35,15)); g.add(createBox(Materials.green,5,15,5,-10,35,15)); return g; } },
    'mech': { name: "Mech", rarity: "legendary", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.gray,30,40,25,0,20,0)); g.add(createBox(Materials.gray,20,20,20,0,50,0)); g.add(createBox(Materials.red,15,5,2,0,50,10)); g.add(createBox(Materials.gray,10,20,10,20,40,0)); g.add(createBox(Materials.gray,10,20,10,-20,40,0)); return g; } },
    'ninja': { name: "Ninja", rarity: "legendary", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.black,25,35,15,0,17,0)); g.add(createBox(Materials.black,20,20,20,0,40,0)); g.add(createBox(Materials.red,22,5,22,0,45,0)); g.add(createBox(Materials.skin,15,5,2,0,40,10)); g.add(createBox(Materials.white,2,30,2,15,25,-10)); return g; } },
    'nyan': { name: "Nyan Cat", rarity: "legendary", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.pink,30,20,10,0,10,0)); g.add(createBox(Materials.gray,15,15,15,15,10,0)); g.add(createBox(Materials.white,10,5,2,15,15,8)); g.add(createBox(Materials.white,10,5,2,15,5,8)); return g; } },
    'harold': { name: "Pain Harold", rarity: "legendary", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.gray,25,25,15,0,12.5,0)); g.add(createBox(Materials.skin,20,25,20,0,35,0)); g.add(createBox(Materials.white,20,5,20,0,48,0)); g.add(createBox(Materials.white,15,5,2,0,30,10)); return g; } },
    'thisisfine': { name: "This is Fine", rarity: "legendary", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.orange,25,25,25,0,12.5,0)); g.add(createBox(Materials.yellow,10,10,10,0,30,0)); g.add(createBox(Materials.red,30,5,5,0,5,0)); return g; } },
    'spongemock': { name: "Mocking Sponge", rarity: "legendary", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.yellow,25,35,15,0,17.5,0)); g.add(createBox(Materials.brown,25,5,15,0,2,0)); g.add(createBox(Materials.white,10,10,2,0,25,8)); return g; } },
    'unicorn': { name: "Unicorn", rarity: "legendary", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.white,25,25,35,0,12.5,0)); g.add(createBox(Materials.white,20,30,15,0,30,15)); g.add(createBox(Materials.pink,5,25,5,0,50,20)); g.add(createBox(Materials.pink,5,25,5,0,10,-20)); return g; } },
    'dragon': { name: "Dragon", rarity: "legendary", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.red,25,25,40,0,12.5,0)); g.add(createBox(Materials.red,20,20,25,0,30,20)); g.add(createBox(Materials.yellow,60,5,20,0,25,-5)); return g; } },
    'yeti': { name: "Yeti", rarity: "legendary", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.white,40,45,25,0,22,0)); g.add(createBox(Materials.blue,25,25,25,0,45,5)); return g; } },
    'alien_cmd': { name: "Alien Cmd", rarity: "legendary", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.green,15,20,10,0,10,0)); g.add(createBox(Materials.green,25,30,25,0,35,0)); g.add(createBox(Materials.black,8,12,2,-6,35,13)); g.add(createBox(Materials.black,8,12,2,6,35,13)); return g; } },
    'wizard': { name: "Wizard", rarity: "legendary", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.blue,25,40,20,0,20,0)); g.add(createBox(Materials.skin,15,15,15,0,45,0)); g.add(createBox(Materials.blue,30,5,30,0,52,0)); g.add(createBox(Materials.blue,15,20,15,0,62,0)); return g; } },
    'knight': { name: "Gold Knight", rarity: "legendary", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.gold,30,35,20,0,17,0)); g.add(createBox(Materials.gold,22,22,22,0,40,0)); g.add(createBox(Materials.red,5,15,5,0,52,0)); return g; } },
    'glitch': { name: "MissingNo", rarity: "legendary", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.purple,15,35,15,-5,17,0)); g.add(createBox(Materials.green,15,25,15,8,12,5)); g.add(createBox(Materials.black,20,15,20,0,5,-5)); return g; } },
    'nessie': { name: "Nessie", rarity: "legendary", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.green,25,20,40,0,10,0)); g.add(createBox(Materials.green,10,40,10,0,30,15)); g.add(createBox(Materials.green,15,10,20,0,50,20)); return g; } },
    'phoenix': { name: "Phoenix", rarity: "legendary", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.red,20,25,20,0,12,0)); g.add(createBox(Materials.orange,50,5,15,0,20,0)); g.add(createBox(Materials.yellow,10,10,10,0,30,10)); return g; } },
    'cyborg': { name: "Cyborg", rarity: "legendary", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.gray,25,30,20,0,15,0)); g.add(createBox(Materials.red,8,5,2,5,35,10)); g.add(createBox(Materials.black,8,5,2,-5,35,10)); return g; } },
    'gold_dragon': { name: "Gold Dragon", rarity: "mythic", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.gold,25,25,40,0,12.5,0)); g.add(createBox(Materials.gold,20,20,25,0,30,20)); g.add(createBox(Materials.gold,60,5,20,0,25,-5)); return g; } },
    'time_lord': { name: "Time Lord", rarity: "mythic", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.white,25,35,15,0,17,0)); g.add(createBox(Materials.white,25,25,25,0,45,0)); g.add(createBox(Materials.blue,20,5,2,0,45,13)); g.add(createBox(Materials.blue,5,5,5,0,30,0)); return g; } },
    'og_doge': { name: "OG Doge", rarity: "mythic", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.gold,25,25,35,0,12.5,0)); g.add(createBox(Materials.gold,20,20,20,0,25,15)); g.add(createBox(Materials.black,22,6,5,0,28,25)); return g; } },
    'satoshi': { name: "Satoshi", rarity: "mythic", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.gold,25,30,15,0,15,0)); g.add(createBox(Materials.gold,25,25,25,0,40,0)); g.add(createBox(Materials.orange,25,25,5,0,40,15)); return g; } },
    'singularity': { name: "The Void", rarity: "mythic", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.black,30,30,30,0,15,0)); g.add(createBox(Materials.white,25,25,25,0,15,0)); return g; } },
    'midas': { name: "King Midas", rarity: "mythic", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.gold,25,35,15,0,17,0)); g.add(createBox(Materials.gold,25,25,25,0,45,0)); g.add(createBox(Materials.red,25,5,25,0,50,0)); return g; } },
    'matrix': { name: "The Matrix", rarity: "mythic", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.black,25,35,15,0,17,0)); g.add(createBox(Materials.green,20,30,20,0,45,0)); g.add(createBox(Materials.black,25,5,25,0,20,0)); return g; } },
    'cosmic_whale': { name: "Cosmic Whale", rarity: "mythic", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.purple,40,30,60,0,15,0)); g.add(createBox(Materials.white,35,10,50,0,5,0)); g.add(createBox(Materials.solanaPink,10,10,10,0,35,0)); return g; } },
    'the_ceo': { name: "The CEO", rarity: "mythic", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.black,25,35,15,0,17,0)); g.add(createBox(Materials.skin,20,20,20,0,45,0)); g.add(createBox(Materials.red,5,15,2,0,20,8)); return g; } },
    'rainbow_star': { name: "Rainbow Star", rarity: "mythic", build: () => { const g=new THREE.Group(); g.add(createBox(Materials.yellow,30,30,10,0,25,0)); g.add(createBox(Materials.red,10,10,10,0,45,0)); g.add(createBox(Materials.blue,10,10,10,20,25,0)); g.add(createBox(Materials.green,10,10,10,-20,25,0)); return g; } }
};

// PREVIEW SYSTEM
function generateCharacterPreviews() {
    const previewRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    previewRenderer.setSize(256, 256);
    previewRenderer.setClearColor(0x000000, 0);
    
    const previewScene = new THREE.Scene();
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    previewScene.add(ambientLight);
    const dirLightPreview = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLightPreview.position.set(50, 100, 50);
    previewScene.add(dirLightPreview);
    
    const d = 60;
    const aspect = 1;
    const previewCamera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);
    previewCamera.position.set(100, 100, 100);
    previewCamera.lookAt(0, 10, 0);
    
    const keys = Object.keys(CharacterDefinitions);
    let index = 0;
    
    function processBatch() {
        const startTime = performance.now();
        while (index < keys.length && performance.now() - startTime < 5) {
            const key = keys[index];
            const def = CharacterDefinitions[key];
            try {
                const mesh = def.build();
                previewScene.add(mesh);
                previewRenderer.render(previewScene, previewCamera);
                def.previewUrl = previewRenderer.domElement.toDataURL();
                previewScene.remove(mesh);
                mesh.traverse(c => { if(c.geometry) c.geometry.dispose(); });
            } catch (e) {
                console.warn("Preview error:", key, e);
            }
            index++;
        }
        
        if (index < keys.length) {
            requestAnimationFrame(processBatch);
        } else {
            previewRenderer.dispose();
        }
    }
    
    requestAnimationFrame(processBatch);
}

const PrizeScene = {
    group: new THREE.Group(),
    crate: null,
    platform: null,
    rewardMesh: null,
    particles: [],
    light: null
};

PrizeScene.group.position.set(1000, 1000, 1000);
scene.add(PrizeScene.group);
PrizeScene.platform = createBox(Materials.white, 100, 20, 100, 0, -10, 0);
PrizeScene.group.add(PrizeScene.platform);
PrizeScene.light = new THREE.PointLight(0xFFD700, 1, 300);
PrizeScene.light.position.set(0, 100, 50);
PrizeScene.group.add(PrizeScene.light);

const PrizeBackgroundSystem = {
    entities: [],
    active: false,
    
    start: () => {
        PrizeBackgroundSystem.active = true;
        for(let i=0; i<3; i++) {
            PrizeBackgroundSystem.spawn(Math.random() * 800 - 400); 
        }
    },
    
    stop: () => {
        PrizeBackgroundSystem.active = false;
        PrizeBackgroundSystem.entities.forEach(ent => PrizeScene.group.remove(ent.mesh));
        PrizeBackgroundSystem.entities = [];
    },
    
    spawn: (startOffset = 0) => {
        const keys = Object.keys(CharacterDefinitions);
        const randKey = keys[Math.floor(Math.random() * keys.length)];
        const mesh = CharacterDefinitions[randKey].build();
        
        const speed = 60 + Math.random() * 40;
        const xDir = Math.random() < 0.5 ? 1 : -1;
        
        const zPos = 200 + Math.random() * 300; 
        const xStart = -600 * xDir + startOffset;
        
        mesh.position.set(xStart, 0, zPos);
        mesh.rotation.y = xDir > 0 ? Math.PI/2 : -Math.PI/2;
        
        PrizeScene.group.add(mesh);
        
        PrizeBackgroundSystem.entities.push({
            mesh: mesh,
            speed: speed,
            dir: xDir,
            hopTime: Math.random() * 10
        });
    },
    
    update: (dt) => {
        if (!PrizeBackgroundSystem.active) return;
        
        if (PrizeBackgroundSystem.entities.length < 5 && Math.random() < 0.01) {
            PrizeBackgroundSystem.spawn();
        }
        
        for (let i = PrizeBackgroundSystem.entities.length - 1; i >= 0; i--) {
            const ent = PrizeBackgroundSystem.entities[i];
            ent.mesh.position.x += ent.speed * ent.dir * dt;
            ent.hopTime += dt * 8; 
            ent.mesh.position.y = Math.abs(Math.sin(ent.hopTime)) * 15;
            
            if (Math.abs(ent.mesh.position.x) > 800) {
                PrizeScene.group.remove(ent.mesh);
                PrizeBackgroundSystem.entities.splice(i, 1);
            }
        }
    }
};

function createCrate() {
    const group = new THREE.Group();
    group.add(createBox(Materials.brown, 50, 50, 50, 0, 25, 0));
    group.add(createBox(Materials.orange, 52, 10, 52, 0, 25, 0));
    group.add(createBox(Materials.orange, 10, 52, 52, 0, 25, 0));
    return group;
}

function spawnExplosion(x, y, z) {
    for(let i=0; i<30; i++) {
        const p = createBox(Materials.brown, 8, 8, 8, x, y, z);
        p.userData = {
            vel: new THREE.Vector3(
                (Math.random()-0.5)*15,
                (Math.random())*15 + 5,
                (Math.random()-0.5)*15
            )
        };
        PrizeScene.group.add(p);
        PrizeScene.particles.push(p);
    }
}

const DustSystem = {
    particles: [],
    spawn: (x, z) => {
        for(let i=0; i<5; i++) {
            const p = createBox(Materials.white, 3, 3, 3, x*LANE_SIZE, 0, z*LANE_SIZE);
            p.position.x += (Math.random()-0.5)*15;
            p.position.z += (Math.random()-0.5)*15;
            p.userData = { life: 1.0, velY: Math.random()*2 };
            scene.add(p);
            DustSystem.particles.push(p);
        }
    },
    update: (dt) => {
        for(let i=DustSystem.particles.length-1; i>=0; i--) {
            const p = DustSystem.particles[i];
            p.userData.life -= dt * 2;
            p.position.y += p.userData.velY;
            p.scale.setScalar(p.userData.life);
            if(p.userData.life <= 0) {
                scene.remove(p);
                DustSystem.particles.splice(i, 1);
            }
        }
    }
};

class Lane {
    constructor(index, type) {
        this.index = index;
        this.type = type;
        this.mesh = new THREE.Group();
        this.mesh.position.z = index * LANE_SIZE;
        this.obstacles = [];
        this.coins = [];
        this.speed = (Math.random() * 1.5 + 0.8) * (Math.random() < 0.5 ? 1 : -1);
        
        let color = 0x8BC34A;
        let h = 35;
        if (type === LANE_ROAD) { color = 0x555555; h=33; }
        if (type === LANE_RIVER) { color = 0x2980B9; h=30; }
        if (type === LANE_RAIL) { color = 0x8B4513; h=34; }
        
        const floorGeo = new THREE.BoxGeometry(LANE_SIZE * 15, h, LANE_SIZE);
        const floorMat = new THREE.MeshLambertMaterial({ color: color });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.position.y = -h/2;
        floor.receiveShadow = true;
        this.mesh.add(floor);
        
        if (type === LANE_GRASS && Math.random() < 0.3) {
            const tree = new THREE.Group();
            const trunk = createBox(Materials.brown, 10, 20, 10, 0, 10, 0);
            const leaves = createBox(Materials.green, 25, 25, 25, 0, 30, 0);
            tree.add(trunk);
            tree.add(leaves);
            const xPos = (Math.floor(Math.random() * 10) - 5) * LANE_SIZE;
            if (index > 3 || Math.abs(xPos) > LANE_SIZE) {
                tree.position.x = xPos;
                this.mesh.add(tree);
                this.obstacles.push({ mesh: tree, type: 'static', x: xPos });
            }
        } 
        else if (type === LANE_ROAD) {
            this.spawnRate = 1.5 + Math.random() * 2.5;
            this.counter = Math.random() * this.spawnRate;
            const mark = createBox(Materials.white, 300, 2, 5, 0, 1, 0);
            this.mesh.add(mark);
        }
        else if (type === LANE_RIVER) {
            this.spawnRate = 1.5 + Math.random() * 2.0;
            this.counter = Math.random() * this.spawnRate;
            this.speed = (Math.random() * 0.8 + 0.5) * (Math.random() < 0.5 ? 1 : -1);
        }
        else if (type === LANE_RAIL) {
            this.mesh.add(createBox(Materials.gray, 500, 2, 5, 0, 1, -5));
            this.mesh.add(createBox(Materials.gray, 500, 2, 5, 0, 1, 5));
            for(let k=-7; k<8; k++) {
                this.mesh.add(createBox(Materials.brown, 10, 1, 30, k*40, 1, 0));
            }
            this.spawnRate = 8 + Math.random() * 5; 
            this.counter = 0;
            this.isTrainActive = false;
            this.trainMesh = null;
        }
        
        if (type !== LANE_RIVER && index > 5 && Math.random() < 0.15) {
            this.spawnLoot();
        }
        scene.add(this.mesh);
    }

    spawnLoot() {
        const xPos = (Math.floor(Math.random() * 8) - 4) * LANE_SIZE;
        const r = Math.random() * 100;
        
        let lootMesh, value;
        
        if (r > 99.99) { 
            lootMesh = createSolanaGem(35);
            value = 1000;
        } else if (r > 99.0) { 
            lootMesh = createSolanaGem(22);
            value = 500;
        } else if (r > 97.5) { 
            lootMesh = new THREE.Group();
            lootMesh.add(createBox(Materials.gold, 25, 25, 25, 0, 12.5, 0));
            lootMesh.add(createBox(Materials.gold, 20, 20, 20, 0, 30, 0));
            value = 100;
        } else if (r > 94.0) { 
            lootMesh = createSolanaGem(14);
            value = 150;
        } else if (r > 85.0) { 
            lootMesh = createBox(Materials.gold, 20, 20, 20, 0, 15, 0);
            value = 50;
        } else if (r > 55.0) { 
            lootMesh = createBox(Materials.yellow, 15, 15, 15, 0, 15, 0);
            value = 10;
        } else { 
            lootMesh = createBox(Materials.yellow, 10, 10, 2, 0, 15, 0);
            value = 1;
        }
        
        lootMesh.position.x = xPos;
        new TWEEN.Tween(lootMesh.rotation).to({ y: Math.PI * 2 }, 1000).repeat(Infinity).start();
        
        this.mesh.add(lootMesh);
        this.coins.push({ mesh: lootMesh, x: xPos, taken: false, value: value });
    }

    update(dt) {
        if (this.type === LANE_ROAD) {
            this.counter += dt;
            if (this.counter > this.spawnRate) {
                this.spawnCar();
                this.counter = 0;
            }
            this.moveObstacles(dt, 400); 
        } 
        else if (this.type === LANE_RIVER) {
            this.counter += dt;
            if (this.counter > this.spawnRate) {
                if (Math.random() < 0.4) this.spawnLilypad();
                else this.spawnLog();
                this.counter = 0;
            }
            this.moveObstacles(dt, 450);
        }
        else if (this.type === LANE_RAIL) {
             this.counter += dt;
             if (!this.isTrainActive && this.counter > this.spawnRate) {
                 this.isTrainActive = true;
                 this.spawnTrain();
             }
             if (this.trainMesh) {
                 this.trainMesh.position.x += this.trainSpeed * dt * 80;
                 if (this.trainMesh.position.x > 700 || this.trainMesh.position.x < -700) {
                     this.mesh.remove(this.trainMesh);
                     this.trainMesh = null;
                     this.isTrainActive = false;
                     this.counter = 0;
                 }
             }
        }
    }

    spawnCar() {
        const car = new THREE.Group();
        const color = Math.random() > 0.5 ? Materials.blue : Materials.red;
        car.add(createBox(color, 40, 20, 20, 0, 10, 0));
        car.add(createBox(Materials.white, 25, 12, 18, 0, 22, 0)); 
        car.add(createBox(Materials.black, 10, 10, 22, -10, 5, 0));
        car.add(createBox(Materials.black, 10, 10, 22, 10, 5, 0));
        const startX = this.speed > 0 ? -350 : 350;
        car.position.set(startX, 0, 0);
        this.mesh.add(car);
        this.obstacles.push({ mesh: car, type: 'car' });
    }

    spawnLog() {
        const width = 80 + Math.random() * 60;
        const log = createBox(Materials.brown, width, 10, 20, 0, -5, 0); 
        const startX = this.speed > 0 ? -400 : 400;
        log.position.set(startX, 0, 0);
        this.mesh.add(log);
        this.obstacles.push({ mesh: log, type: 'log', width: width });
    }

    spawnLilypad() {
        const pad = new THREE.Group();
        pad.add(createBox(Materials.lilypad, 25, 5, 25, 0, -2, 0));
        pad.add(createBox(Materials.darkGreen, 5, 3, 5, 5, 2, 5));
        const startX = this.speed > 0 ? -400 : 400;
        pad.position.set(startX, 0, 0);
        this.mesh.add(pad);
        this.obstacles.push({ mesh: pad, type: 'log', width: 30 }); 
    }

    spawnTrain() {
        this.trainSpeed = 6 * (Math.random() < 0.5 ? 1 : -1);
        const train = new THREE.Group();
        train.add(createBox(Materials.black, 60, 40, 24, 0, 20, 0));
        train.add(createBox(Materials.yellow, 10, 10, 26, 30 * Math.sign(this.trainSpeed), 10, 0));
        for(let i=1; i<6; i++) {
             const offset = i * -65 * Math.sign(this.trainSpeed);
             train.add(createBox(Materials.red, 60, 35, 24, offset, 17.5, 0));
        }
        train.position.x = this.trainSpeed > 0 ? -700 : 700;
        this.mesh.add(train);
        this.trainMesh = train;
    }

    moveObstacles(dt, limit) {
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            obs.mesh.position.x += this.speed * dt * 60;
            
            if (obs.type === 'log' && State.onLog === obs) {
                State.playerGroup.position.x += this.speed * dt * 60;
                State.playerPos.x = State.playerGroup.position.x / LANE_SIZE;
            }
            if (Math.abs(obs.mesh.position.x) > limit) {
                this.mesh.remove(obs.mesh);
                this.obstacles.splice(i, 1);
            }
        }
    }
}

// Game Initialization and Core Functions
let playerMesh;

function initGame() {
    TWEEN.removeAll();
    
    if (State.lanes && State.lanes.length > 0) {
        State.lanes.forEach(l => {
            if (l.coins) {
                l.coins.forEach(c => {
                    if (c && c.mesh) {
                        if (c.mesh.parent) c.mesh.parent.remove(c.mesh);
                        c.mesh.traverse(child => {
                            if (child.isMesh && child.geometry) {
                                child.geometry.dispose();
                            }
                        });
                    }
                });
            }
            if (l.mesh) {
                l.mesh.traverse(child => {
                    if (child.isMesh && child.geometry) {
                        child.geometry.dispose();
                    }
                });
                if (l.mesh.parent) scene.remove(l.mesh);
            }
        });
    }
    
    if (State.playerGroup) {
        State.playerGroup.traverse(child => {
            if (child.isMesh && child.geometry) {
                child.geometry.dispose();
            }
        });
        if(State.playerGroup.parent) scene.remove(State.playerGroup);
    }
    
    State.lanes = [];
    State.score = 0;
    State.currentLane = 0;
    State.playerPos = { x: 0, z: 0 };
    State.gameOver = false;
    State.onLog = null;
    State.isHopping = false;
    State.inPrizeMachine = false;
    
    State.playerGroup = new THREE.Group();
    playerMesh = CharacterDefinitions[State.selectedChar].build();
    State.playerGroup.add(playerMesh);
    scene.add(State.playerGroup);
    
    camera.position.set(State.cameraOffset.x, State.cameraOffset.y, State.cameraOffset.z);
    
    for(let i=0; i<20; i++) {
        addLane(i);
    }
    
    updateHUD();
}

function addLane(index) {
    let type = LANE_GRASS;
    if (index > 3) {
        const r = Math.random();
        if (r < 0.5) type = LANE_ROAD;
        else if (r < 0.8) type = LANE_GRASS;
        else if (r < 0.95) type = LANE_RIVER;
        else type = LANE_RAIL;
        
        if (type === LANE_RIVER && index > 0 && State.lanes[index-1].type === LANE_RIVER && State.lanes[index-2]?.type === LANE_RIVER) {
            type = LANE_GRASS;
        }
    }
    
    const lane = new Lane(index, type);
    State.lanes.push(lane);
}

function movePlayer(dx, dz) {
    if (State.gameOver || State.isHopping || State.inPrizeMachine) return;
    const targetZ = Math.round(State.playerPos.z) + dz;
    const targetX = Math.round(State.playerPos.x) + dx;
    const lane = State.lanes[targetZ];
    if (lane) {
        const treeCollision = lane.obstacles.some(o => o.type === 'static' && Math.abs(o.x/LANE_SIZE - targetX) < 0.5);
        if (treeCollision) return;
    }
    State.isHopping = true;
    State.onLog = null; 
    
    let rotY = 0;
    if (dx > 0) rotY = Math.PI/2;
    if (dx < 0) rotY = -Math.PI/2;
    if (dz < 0) rotY = Math.PI;
    
    playerMesh.rotation.y = rotY;
    const startX = State.playerGroup.position.x;
    const startZ = State.playerGroup.position.z;
    const endX = targetX * LANE_SIZE;
    const endZ = targetZ * LANE_SIZE;
    
    new TWEEN.Tween({ t: 0 })
        .to({ t: 1 }, MOVE_TIME)
        .onUpdate(obj => {
            State.playerGroup.position.x = startX + (endX - startX) * obj.t;
            State.playerGroup.position.z = startZ + (endZ - startZ) * obj.t;
            State.playerGroup.position.y = Math.sin(obj.t * Math.PI) * 15;
            if (obj.t < 0.5) playerMesh.scale.y = 0.8; 
            else playerMesh.scale.y = 1.0;
        })
        .onComplete(() => {
            State.isHopping = false;
            State.playerPos.x = targetX;
            State.playerPos.z = targetZ;
            
            DustSystem.spawn(targetX, targetZ);
            if (targetZ > State.score) {
                State.score = targetZ;
                updateHUD();
                if (State.lanes.length <= State.score + 20) {
                    addLane(State.lanes.length);
                }
            }
            
            checkEndConditions();
        })
        .start();
}

function checkEndConditions() {
    const lane = State.lanes[State.playerPos.z];
    if (!lane) return;
    
    for(let i=0; i<lane.coins.length; i++) {
        const coin = lane.coins[i];
        if (!coin.taken && Math.abs(coin.x/LANE_SIZE - State.playerPos.x) < 0.5) {
            coin.taken = true;
            lane.mesh.remove(coin.mesh);
            State.coins += coin.value; 
            updateHUD();
            saveData();
        }
    }
    
    if (lane.type === LANE_RIVER) {
        let safe = false;
        for(let obs of lane.obstacles) {
            if (obs.type === 'log') {
                const dist = obs.mesh.position.x - State.playerGroup.position.x;
                const halfLog = obs.width / 2;
                if (Math.abs(dist) < halfLog + 5) {
                    safe = true;
                    State.onLog = obs;
                    break;
                }
            }
        }
        if (!safe) die("drown");
    }
}

function die(reason) {
    if (State.gameOver) return;
    State.gameOver = true;
    State.isPlaying = false;
    
    if (State.score > State.highScore) {
        State.highScore = State.score;
        saveData();
        document.getElementById('new-best-badge').style.display = 'block';
    } else {
        document.getElementById('new-best-badge').style.display = 'none';
    }
    
    if (reason === "squish") {
        playerMesh.scale.y = 0.1;
        playerMesh.scale.x = 1.5;
        playerMesh.scale.z = 1.5;
    } else if (reason === "drown") {
        new TWEEN.Tween(State.playerGroup.position)
            .to({ y: -30 }, 500)
            .start();
    }
    
    setTimeout(() => {
        showGameOver();
    }, 1000);
}

function detectCollisions() {
    if (State.gameOver || State.isHopping) return;
    const lane = State.lanes[State.playerPos.z];
    if (!lane) return;
    
    if (lane.trainMesh) {
        const dx = Math.abs(lane.trainMesh.position.x - State.playerGroup.position.x);
        if (dx < 40) die("squish");
    }
    
    if (lane.type === LANE_ROAD) {
        for(let obs of lane.obstacles) {
            if (obs.type === 'car') {
                const dist = Math.abs(obs.mesh.position.x - State.playerGroup.position.x);
                if (dist < 22) {
                    die("squish");
                }
            }
        }
    }
    
    if (State.onLog) {
        if (Math.abs(State.playerGroup.position.x) > 350) die("drown");
    }
}

function updateHUD() {
    document.getElementById('score-display').innerText = State.score;
    document.getElementById('high-score-display').innerText = `BEST: ${State.highScore}`;
    document.getElementById('coin-display').innerHTML = `🪙 <span id="coin-count">${State.coins}</span>`;
    document.getElementById('buy-btn').innerText = `OPEN (${PRIZE_COST})`;
    document.getElementById('prize-cost').innerText = `Cost: ${PRIZE_COST} Coins`;
}

function showStartScreen() {
    document.getElementById('start-screen').classList.remove('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('char-select-screen').classList.add('hidden');
    document.getElementById('prize-machine-screen').classList.add('hidden');
    document.getElementById('hud-top').style.opacity = '1';
}

function showGameOver() {
    document.getElementById('game-over-screen').classList.remove('hidden');
    document.getElementById('final-score').innerText = State.score;
    document.getElementById('final-coins').innerText = `Total Coins: ${State.coins}`;
    document.getElementById('hud-top').style.opacity = '0';
}

function showCharSelect() {
    const grid = document.getElementById('char-grid');
    grid.innerHTML = "";
    
    Object.keys(CharacterDefinitions).forEach(key => {
        const def = CharacterDefinitions[key];
        const isUnlocked = State.unlockedChars.includes(key);
        
        const card = document.createElement('div');
        card.className = `char-card ${isUnlocked ? '' : 'locked'} ${State.selectedChar === key ? 'selected' : ''}`;
        
        const img = document.createElement('div');
        img.className = 'char-card-img';
        
        if (def.previewUrl) {
            const image = document.createElement('img');
            image.src = def.previewUrl;
            img.appendChild(image);
        } else {
            img.innerText = def.emoji || "?";
        }
        
        const name = document.createElement('div');
        name.className = 'char-name';
        name.innerText = isUnlocked ? def.name : "???";
        
        const rarity = document.createElement('div');
        rarity.className = `char-rarity rarity-${def.rarity || 'common'}`;
        rarity.innerText = (def.rarity || 'common').toUpperCase();
        
        card.appendChild(img);
        card.appendChild(name);
        card.appendChild(rarity);
        
        if (isUnlocked) {
            card.onclick = () => {
                State.selectedChar = key;
                saveData();
                showCharSelect(); 
            };
        }
        
        grid.appendChild(card);
    });
    
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('char-select-screen').classList.remove('hidden');
}

function showPrizeMachine() {
    State.inPrizeMachine = true;
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('prize-machine-screen').classList.remove('hidden');
    document.getElementById('unlock-msg').innerText = "";
    document.getElementById('buy-btn').disabled = false;
    document.getElementById('hud-top').style.opacity = '0';
    
    if(PrizeScene.crate) PrizeScene.group.remove(PrizeScene.crate);
    if(PrizeScene.rewardMesh) PrizeScene.group.remove(PrizeScene.rewardMesh);
    PrizeScene.particles.forEach(p => PrizeScene.group.remove(p));
    PrizeScene.particles = [];
    
    PrizeScene.crate = createCrate();
    PrizeScene.crate.position.set(0, 0, 0);
    PrizeScene.crate.scale.set(1,1,1);
    PrizeScene.group.add(PrizeScene.crate);
    
    PrizeBackgroundSystem.start();
    
    new TWEEN.Tween(camera.position)
        .to({ x: 1000 + State.cameraOffset.x, y: 1000 + State.cameraOffset.y, z: 1000 + State.cameraOffset.z }, 1000)
        .easing(TWEEN.Easing.Cubic.Out)
        .start();
        
    new TWEEN.Tween(dirLight.position)
        .to({ x: 900, y: 1200, z: 950 }, 1000)
        .start();
}

function closePrizeMachine() {
    State.inPrizeMachine = false;
    document.getElementById('prize-machine-screen').classList.add('hidden');
    document.getElementById('hud-top').style.opacity = '1';
    showStartScreen();
    
    PrizeBackgroundSystem.stop();
    
    const targetX = State.playerGroup ? State.playerGroup.position.x : 0;
    const targetZ = State.playerGroup ? State.playerGroup.position.z : 0;
    new TWEEN.Tween(camera.position)
        .to({ x: targetX + State.cameraOffset.x, y: State.cameraOffset.y, z: targetZ + State.cameraOffset.z }, 1000)
        .easing(TWEEN.Easing.Cubic.Out)
        .start();
}

function tryUnlock() {
    const msg = document.getElementById('unlock-msg');
    const btn = document.getElementById('buy-btn');
    
    if (State.coins < PRIZE_COST) {
        msg.innerText = "Not enough coins!";
        msg.style.color = "#FF4444";
        return;
    }
    
    if (PrizeScene.rewardMesh) {
        PrizeScene.group.remove(PrizeScene.rewardMesh);
        PrizeScene.rewardMesh = null;
    }
    if (!PrizeScene.crate) {
        PrizeScene.crate = createCrate();
        PrizeScene.crate.position.set(0, 0, 0);
        PrizeScene.group.add(PrizeScene.crate);
    }
    PrizeScene.crate.rotation.set(0,0,0);
    PrizeScene.crate.scale.set(1,1,1);
    PrizeScene.crate.visible = true;
    
    State.coins -= PRIZE_COST;
    updateHUD();
    saveData();
    
    btn.disabled = true;
    msg.innerText = "";
    
    const shake = new TWEEN.Tween(PrizeScene.crate.rotation)
        .to({ z: 0.2 }, 50)
        .yoyo(true)
        .repeat(10)
        .onComplete(() => {
            spawnExplosion(0, 25, 0);
            PrizeScene.group.remove(PrizeScene.crate);
            PrizeScene.crate = null;
            
            const r = Math.random() * 100;
            let targetRarity = 'common';
            if (r > 95) targetRarity = 'mythic'; 
            else if (r > 85) targetRarity = 'legendary'; 
            else if (r > 60) targetRarity = 'rare'; 
            
            const available = Object.keys(CharacterDefinitions).filter(k => CharacterDefinitions[k].rarity === targetRarity);
            const randKey = available[Math.floor(Math.random() * available.length)];
            
            let isNew = !State.unlockedChars.includes(randKey);
            
            const charGroup = CharacterDefinitions[randKey].build();
            PrizeScene.rewardMesh = charGroup;
            charGroup.position.set(0, -20, 0);
            charGroup.scale.set(0.1, 0.1, 0.1);
            PrizeScene.group.add(charGroup);
            
            new TWEEN.Tween(charGroup.position).to({ y: 30 }, 1000).easing(TWEEN.Easing.Elastic.Out).start();
            new TWEEN.Tween(charGroup.scale).to({ x: 2, y: 2, z: 2 }, 1000).easing(TWEEN.Easing.Elastic.Out).start();
            new TWEEN.Tween(charGroup.rotation).to({ y: Math.PI * 4 - Math.PI * 0.75 }, 2000).easing(TWEEN.Easing.Cubic.Out).start();
            
            setTimeout(() => {
                const charName = CharacterDefinitions[randKey].name;
                const charRarity = CharacterDefinitions[randKey].rarity.toUpperCase();
                
                if (isNew) {
                    State.unlockedChars.push(randKey);
                    State.selectedChar = randKey; 
                    msg.innerHTML = `NEW! Unlocked <span style="color:yellow">${charName}</span><br><span style="font-size:16px">(${charRarity})</span>`;
                    msg.style.color = "#00FF00";
                    generateCharacterPreviews(); 
                } else {
                    State.coins += 20; // Refund
                    msg.innerHTML = `Duplicate: ${charName}<br>+20 Coins`;
                    msg.style.color = "#FFFF00";
                }
                saveData();
                updateHUD();
                btn.disabled = false;
            }, 500);
        })
        .start();
}

function startGame() {
    State.isPlaying = true;
    document.getElementById('start-screen').classList.add('hidden');
    initGame();
}

// Event Listeners
document.getElementById('play-btn').onclick = startGame;
document.getElementById('retry-btn').onclick = () => { 
    document.getElementById('game-over-screen').classList.add('hidden'); 
    startGame(); 
};
document.getElementById('menu-btn').onclick = () => { 
    document.getElementById('game-over-screen').classList.add('hidden'); 
    showStartScreen(); 
};
document.getElementById('chars-btn').onclick = showCharSelect;
document.getElementById('back-from-chars').onclick = () => { 
    document.getElementById('char-select-screen').classList.add('hidden'); 
    showStartScreen(); 
};
document.getElementById('prize-btn').onclick = showPrizeMachine;
document.getElementById('back-from-prize').onclick = closePrizeMachine;
document.getElementById('buy-btn').onclick = tryUnlock;

window.addEventListener('keydown', (e) => {
    if (!State.isPlaying) return;
    if (e.key === 'ArrowUp') movePlayer(0, 1);
    else if (e.key === 'ArrowDown') movePlayer(0, -1);
    else if (e.key === 'ArrowLeft') movePlayer(1, 0); 
    else if (e.key === 'ArrowRight') movePlayer(-1, 0);
});

function setZoom(val) {
    State.cameraZoom = Math.max(0.5, Math.min(val, 2.0));
    camera.zoom = State.cameraZoom;
    camera.updateProjectionMatrix();
}

window.addEventListener('wheel', (e) => {
    const delta = -e.deltaY * 0.001;
    setZoom(State.cameraZoom + delta);
});

let touchStartX = 0;
let touchStartY = 0;
let initialPinchDist = 0;
let initialZoom = 1;

document.addEventListener('touchstart', e => {
    if (e.touches.length === 1) {
        touchStartX = e.touches[0].screenX;
        touchStartY = e.touches[0].screenY;
    } else if (e.touches.length === 2) {
        const dx = e.touches[0].screenX - e.touches[1].screenX;
        const dy = e.touches[0].screenY - e.touches[1].screenY;
        initialPinchDist = Math.sqrt(dx*dx + dy*dy);
        initialZoom = State.cameraZoom;
    }
}, {passive: false});

document.addEventListener('touchmove', e => {
    if (e.touches.length === 2) {
        const dx = e.touches[0].screenX - e.touches[1].screenX;
        const dy = e.touches[0].screenY - e.touches[1].screenY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (initialPinchDist > 0) {
            const scale = dist / initialPinchDist;
            setZoom(initialZoom * scale);
        }
        e.preventDefault(); 
    }
}, {passive: false});

document.addEventListener('touchend', e => {
    if (!State.isPlaying) return;
    if (e.changedTouches.length === 1 && initialPinchDist === 0) {
        const dx = e.changedTouches[0].screenX - touchStartX;
        const dy = e.changedTouches[0].screenY - touchStartY;
        
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
            movePlayer(0, 1); 
            return;
        }
        
        if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > 0) movePlayer(-1, 0); 
            else movePlayer(1, 0);       
        } else {
            if (dy > 0) movePlayer(0, -1); 
            else movePlayer(0, 1);        
        }
    }
    if (e.touches.length < 2) {
        initialPinchDist = 0;
    }
});

// Animation Loop
const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    const dt = clock.getDelta();
    TWEEN.update();
    DustSystem.update(dt);
    PrizeBackgroundSystem.update(dt); 
    
    if (PrizeScene.particles.length > 0) {
        for (let i = PrizeScene.particles.length - 1; i >= 0; i--) {
            const p = PrizeScene.particles[i];
            p.position.addScaledVector(p.userData.vel, dt * 5);
            p.scale.subScalar(dt * 2);
            if (p.scale.x <= 0) {
                PrizeScene.group.remove(p);
                PrizeScene.particles.splice(i, 1);
            }
        }
    }
    
    if (State.isPlaying && !State.gameOver && !State.inPrizeMachine) {
        State.lanes.forEach(lane => {
            if (Math.abs(lane.index - State.playerPos.z) < 15) {
                lane.update(dt);
            }
        });
        
        detectCollisions();
        
        const targetCamZ = State.playerGroup.position.z + State.cameraOffset.z;
        const targetCamX = State.playerGroup.position.x + State.cameraOffset.x;
        
        if (camera.position.z < targetCamZ + 100) { 
            camera.position.z += (targetCamZ - camera.position.z) * 0.1;
        }
        
        camera.position.x += (targetCamX - camera.position.x) * 0.1;
        camera.position.y = State.cameraOffset.y; 
        
        dirLight.position.z = State.playerGroup.position.z - 50;
        dirLight.position.x = State.playerGroup.position.x - 100;
        dirLight.target.position.set(State.playerGroup.position.x, 0, State.playerGroup.position.z);
        dirLight.target.updateMatrixWorld();
    }
    
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    const aspect = window.innerWidth / window.innerHeight;
    camera.left = -d * aspect;
    camera.right = d * aspect;
    camera.top = d;
    camera.bottom = -d;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Save before unload
window.addEventListener('beforeunload', () => {
    saveData();
});

// Initialize
generateCharacterPreviews();
updateHUD();
animate();


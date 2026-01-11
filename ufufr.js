
function print(str){
    document.querySelector('.text-output div').innerText = str;
}

function forceUpdate() {
    if (navigator.serviceWorker.controller){
        navigator.serviceWorker.addEventListener('message', event => {
            if (event.data === 'reload') {
                location.reload();
            }
        }, { once: true });
        
        navigator.serviceWorker.controller.postMessage('ud');
    } else {
        print('Service worker not ready.');
    }
}

// DrawCube class for handling cube visualization
class DrawCube {
    constructor(containerId) {
        this.colorMapping = {
            'd': '#FFFFFF', // White
            'u': '#FFFF00', // Yellow
            'f': '#FF0000', // Red
            'b': '#FFA500', // Orange
            'l': '#0000FF', // Blue
            'r': '#00FF00'  // Green
        };
        
        this.size = 40;
        this.faceSize = 3 * this.size + 10;
        this.svgNS = "http://www.w3.org/2000/svg";
        this.pieces = [];
        this.orientationMapping = null;
        
        this.initializeCube(containerId);
        this.setupEventListeners();
        this.loadOrientation();
    }
    
    // Refresh orientation from Prefs (called after tutorial)
    refresh() {
        this.loadOrientation();
    }
    
    // Load orientation from Prefs
    loadOrientation() {
        if (window.Prefs) {
            const orientation = Prefs.getOrientation();
            if (orientation) {
                this.orientationMapping = this.getOrientationMapping(orientation);
            }
        } else {
            // Fallback to localStorage
            const savedConfig = localStorage.getItem('bld.userPrefs');
            if (savedConfig) {
                try {
                    const config = JSON.parse(savedConfig);
                    if (config.orientation) {
                        this.orientationMapping = this.getOrientationMapping(config.orientation);
                    }
                } catch (e) {
                    console.error('Error loading orientation:', e);
                }
            }
        }
    }
    
    // Get orientation mapping for remapping cube string
    // Standard WCA: White bottom (d), Yellow top (u), Red front (f), Orange back (b), Blue left (l), Green right (r)
    // Returns index mapping array where result[standard_index] = user_orientation_index
    getOrientationMapping(orientation) {
        // Cube string layout (54 stickers):
        // U (top): 0-8, R (right): 9-17, F (front): 18-26, D (bottom): 27-35, L (left): 36-44, B (back): 45-53
        // Each face: row-major order (top-left to bottom-right)
        
        // Parse orientation string: "yr" means top=yellow, front=red (2 chars: color codes)
        const topColor = orientation[0];  // y, w, r, o, b, g
        const frontColor = orientation[1];
        
        // Color to standard face mapping (what face each color is on in standard orientation)
        const colorToFace = {
            'y': 'u',  // yellow on up face
            'w': 'd',  // white on down face
            'r': 'f',  // red on front face
            'o': 'b',  // orange on back face
            'b': 'l',  // blue on left face
            'g': 'r'   // green on right face
        };
        
        // Map user's orientation to standard face positions
        const userTop = colorToFace[topColor];
        const userFront = colorToFace[frontColor];
        
        if (!userTop || !userFront) {
            console.error('Invalid orientation:', orientation);
            return null;
        }
        
        // Standard cube face positions (indices in 54-char string)
        const faceRanges = {
            'u': [0, 9],    // top/up
            'r': [9, 18],   // right
            'f': [18, 27],  // front
            'd': [27, 36],  // down/bottom
            'l': [36, 45],  // left
            'b': [45, 54]   // back
        };
        
        // Determine all 6 faces based on top and front
        const oppositeFace = {
            'u': 'd', 'd': 'u',
            'f': 'b', 'b': 'f',
            'l': 'r', 'r': 'l'
        };
        
        const userBottom = oppositeFace[userTop];
        const userBack = oppositeFace[userFront];
        
        // Determine left and right based on top and front
        // This uses right-hand rule for cube orientation
        const getFaces = (top, front) => {
            const configs = {
                'uf': { left: 'l', right: 'r' },
                'ub': { left: 'r', right: 'l' },
                'ul': { left: 'b', right: 'f' },
                'ur': { left: 'f', right: 'b' },
                'df': { left: 'r', right: 'l' },
                'db': { left: 'l', right: 'r' },
                'dl': { left: 'f', right: 'b' },
                'dr': { left: 'b', right: 'f' },
                'fu': { left: 'r', right: 'l' },
                'fd': { left: 'l', right: 'r' },
                'fl': { left: 'u', right: 'd' },
                'fr': { left: 'd', right: 'u' },
                'bu': { left: 'l', right: 'r' },
                'bd': { left: 'r', right: 'l' },
                'bl': { left: 'd', right: 'u' },
                'br': { left: 'u', right: 'd' },
                'lu': { left: 'f', right: 'b' },
                'ld': { left: 'b', right: 'f' },
                'lf': { left: 'd', right: 'u' },
                'lb': { left: 'u', right: 'd' },
                'ru': { left: 'b', right: 'f' },
                'rd': { left: 'f', right: 'b' },
                'rf': { left: 'u', right: 'd' },
                'rb': { left: 'd', right: 'u' }
            };
            return configs[top + front];
        };
        
        const sides = getFaces(userTop, userFront);
        const userLeft = sides.left;
        const userRight = sides.right;
        
        // Create the remapping array (standard position -> user position)
        const mapping = new Array(54);
        const userFaceOrder = {
            'u': userTop,
            'r': userRight,
            'f': userFront,
            'd': userBottom,
            'l': userLeft,
            'b': userBack
        };
        
        // For each standard position, find the corresponding user position
        for (let standardFace in faceRanges) {
            const [start, end] = faceRanges[standardFace];
            const userFace = userFaceOrder[standardFace];
            const [userStart, userEnd] = faceRanges[userFace];
            
            // Simple 1-to-1 mapping (could be enhanced with rotation handling)
            for (let i = 0; i < 9; i++) {
                mapping[start + i] = userStart + i;
            }
        }
        
        return mapping;
    }
    
    initializeCube(containerId) {
        this.svg = document.createElementNS(this.svgNS, "svg");
        this.svg.setAttribute("width", this.faceSize * 4);
        this.svg.setAttribute("height", this.faceSize * 3);
        this.svg.setAttribute("viewBox", `0 0 ${this.faceSize * 4} ${this.faceSize * 3}`);
        
        // Draw all faces
        this.drawFace(1, 0); // Top
        this.drawFace(2, 1); // Right
        this.drawFace(1, 1); // Front
        this.drawFace(1, 2); // Bottom
        this.drawFace(0, 1); // Left
        this.drawFace(3, 1); // Back
        
        document.getElementById(containerId).appendChild(this.svg);
    }
    
    drawFace(xx, yy) {
        const startX = xx * this.faceSize;
        const startY = yy * this.faceSize;
        
        for (let i = 0; i < 9; i++) {
            const x = startX + (i % 3) * this.size;
            const y = startY + Math.floor(i / 3) * this.size;

            const rect = document.createElementNS(this.svgNS, "rect");
            rect.setAttribute("x", x);
            rect.setAttribute("y", y);
            rect.setAttribute("width", this.size);
            rect.setAttribute("height", this.size);
            rect.setAttribute("stroke", "#000000");

            this.pieces.push(rect);
            this.svg.appendChild(rect);
        }
    }
    
    updatePieceColors(str) {
        let displayStr = str;
        
        // Apply orientation mapping if configured
        if (this.orientationMapping) {
            const strArr = str.split('');
            const mappedArr = new Array(54);
            for (let i = 0; i < 54; i++) {
                mappedArr[i] = strArr[this.orientationMapping[i]];
            }
            displayStr = mappedArr.join('');
        }
        
        for (let i = 0; i < displayStr.length; i++) {
            this.pieces[i].setAttribute("fill", this.colorMapping[displayStr[i]]);
        }
    }
    
    resizeCanvas() {
        let s = Math.min(window.innerWidth / 4 - 20, this.faceSize) / this.faceSize;
        this.svg.style.transform = `scale(${s})`;
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => this.resizeCanvas());
        window.addEventListener('load', () => this.resizeCanvas());
        
        let lastTap = 0;
        const doubleTapHandler = () => {
            const textInput = document.getElementsByClassName('command-input')[0].getElementsByTagName('input')[0];
            const commandInputElem = document.getElementsByClassName('command-input')[0];
            commandInputElem.classList.add('visible');
            textInput.value = '';
            textInput.focus();
        };
        
        this.svg.addEventListener('dblclick', doubleTapHandler);
        
        this.svg.addEventListener('touchend', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            if (tapLength < 300 && tapLength > 0) {
                e.preventDefault();
                doubleTapHandler();
            }
            lastTap = currentTime;
        });
    }
}

// Storage class for handling local storage and static file loading
class StorageHandler {
    async loadStaticFile(filename) {
        try {
            const response = await fetch(filename);
            if (response.ok) {
                return await response.text();
            }
        } catch (err) {
            console.error(`Failed to load ${filename}:`, err);
        }
        return null;
    }
    
    async getItem(key, func) {
        // For alg, check localStorage first, then fall back to alg.txt for default UF-UFR buffer
        if (key === 'alg') {
            const savedAlg = localStorage.getItem('bld.alg');
            if (savedAlg) {
                func(savedAlg);
                return;
            }
            // Fall back to alg.txt for default UF-UFR buffer case
            const text = await this.loadStaticFile('alg.txt');
            if (text) {
                // Check if using default UF-UFR buffer
                const config = localStorage.getItem('bld.userPrefs');
                if (config) {
                    try {
                        const parsed = JSON.parse(config);
                        if (parsed.edgeBuffer === '0' && parsed.cornerBuffer === '0' && 
                            parsed.edgeScheme && parsed.cornerScheme) {
                            // Map alg.txt to user's letter scheme
                            const mappedAlg = await this.mapAlgToUserScheme(text, parsed.edgeScheme, parsed.cornerScheme);
                            func(mappedAlg);
                            return;
                        }
                    } catch (e) {
                        console.error('Error mapping alg.txt:', e);
                    }
                }
                // Use alg.txt as-is if no mapping needed
                func(text);
                return;
            }
        }
        
        // For mem, only use localStorage (no file fallback)
        if (key === 'mem') {
            const savedMem = localStorage.getItem('bld.mem');
            if (savedMem) {
                func(savedMem);
            }
            return;
        }
        
        // For other data (stats, settings), use localStorage
        const savedItem = localStorage.getItem(`bld.${key}`);
        if (savedItem) {
            func(savedItem);
        }
    }
    
    async mapAlgToUserScheme(algContent, userEdgeScheme, userCornerScheme) {
        // Default letter schemes from alg.txt template (UF-UFR buffer)
        // These are ONLY used for mapping the template file, not for actual usage
        const defaultEdgeScheme = Prefs.defaults.edgeScheme;
        const defaultCornerScheme = Prefs.defaults.cornerScheme;
        
        // Create mapping from default to user scheme
        const edgeMapping = {};
        const cornerMapping = {};
        
        for (let i = 0; i < 24; i++) {
            edgeMapping[defaultEdgeScheme[i]] = userEdgeScheme[i];
            cornerMapping[defaultCornerScheme[i]] = userCornerScheme[i];
        }
        
        // Parse and remap letters
        const lines = algContent.split('\n');
        const mappedLines = [];
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.length === 0) continue;
            
            const eqIdx = trimmed.indexOf('=');
            if (eqIdx === -1) continue;
            
            const key = trimmed.substring(0, eqIdx).trim();
            const alg = trimmed.substring(eqIdx + 1).trim();
            
            // Map the key letters
            let mappedKey = '';
            for (const char of key) {
                if (edgeMapping[char]) {
                    mappedKey += edgeMapping[char];
                } else if (cornerMapping[char]) {
                    mappedKey += cornerMapping[char];
                } else {
                    mappedKey += char; // Keep special chars like +, -
                }
            }
            
            mappedLines.push({ key: mappedKey, alg: alg });
        }
        
        // Sort by key
        mappedLines.sort((a, b) => {
            if (a.key < b.key) return -1;
            if (a.key > b.key) return 1;
            return 0;
        });
        
        // Generate output content
        return mappedLines.map(line => `${line.key}=${line.alg}`).join('\n');
    }
    
    push(cat, text) {
        localStorage.setItem(`bld.${cat}`, text);
    }
    
    async loadData() {
        await this.getItem('alg', text => cube3.updateAlg(text));
        await this.getItem('mem', text => cube3.updateMem(text));
        await this.getItem('stats', text => cube3.updateStats(text));
        await this.getItem('settings', text => {
            try {
                cube3.updateSettings(JSON.parse(text));
            } catch (err) {
                console.error('Failed to parse settings:', err);
            }
        });
    }
    
    saveStats() {
        const allStats = Object.keys(cube3.stats)
            .filter(key => cube3.stats[key].times > 0 || cube3.stats[key].mark > 0)
            .map(key => `${key}=${cube3.stats[key].times},${cube3.stats[key].mark}`)
            .join(';');
        this.push('stats', allStats);
    }
}

// ButtonRow class for handling button interactions
class ButtonRow {
    constructor(containerSelector) {
        this.buttonRow = document.querySelector(containerSelector);
        this.nextButtonHtml = '<button id="nextButton" onclick="onClickNext()">Next &rarr;</button>';
    }
    
    showHoverText(event) {
        const hoverText = document.createElement('div');
        hoverText.className = 'hover-text';
        hoverText.style.display = 'block'; // Force display for focus events
        hoverText.innerHTML = cube3.getAlgInfo(event.target.textContent).join('<br>');
        event.target.appendChild(hoverText);
    }
    
    hideHoverText(event) {
        const hoverText = event.target.querySelector('.hover-text');
        if (hoverText) {
            event.target.removeChild(hoverText);
        }
    }
    
    generateButton(text) {
        const button = document.createElement('button');
        button.textContent = text;
        button.className = 'toggle-btn';
        
        if (cube3.stats[text]) {
            if (!(cube3.stats[text].cat === 'par' && cube3.hasSpecialCategories)) {
                button.onclick = function() { this.classList.toggle('active'); };
            }
            
            // Unified hover system using focus/blur
            button.addEventListener('mouseover', (e) => e.target.focus());
            button.addEventListener('focus', (e) => this.showHoverText(e));
            button.addEventListener('blur', (e) => this.hideHoverText(e));
            
            if (cube3.stats[text].mark > 0) {
                button.classList.add('non-zero-mark');
            }
            if (cube3.stats[text].times === 0) {
                button.classList.add('new-mark');
            }
        }
        return button;
    }
    
    resetButtons() {
        this.buttonRow.innerHTML = '';
        cube3.displayKeys.forEach(code => this.buttonRow.appendChild(this.generateButton(code)));
        this.buttonRow.appendChild(document.createElement('button')).outerHTML = this.nextButtonHtml;
    }
}

// Timer class for handling timing functionality
class Timer {
    constructor(canvasId, timerContainerId, timerDisplayId, commandOutputId) {
        this.canvas = document.getElementById(canvasId);
        this.timerContainer = document.getElementById(timerContainerId);
        this.timerDisplay = document.getElementById(timerDisplayId);
        this.commandOutput = document.getElementById(commandOutputId);
        this.timerInterval = null;
        this.startTime = null;
        this.longPressTimer = null;
        this.isTimerRunning = false;
        this.pressStarted = false;
        this.finalTimeStr = 'null';
        this.nowTimeStr = 'null';
        this.lastStopTime = 0;
        
        this.setupEventListeners();
    }
    
    formatTime(time) {
        const minutes = Math.floor(time / 60000);
        const seconds = Math.floor((time % 60000) / 1000);
        const milliseconds = Math.floor((time % 1000) / 10);
        return minutes > 0 
            ? `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`
            : `${seconds}.${milliseconds.toString().padStart(2, '0')}`;
    }
    
    startTimer() {
        this.isTimerRunning = true;
        this.startTime = new Date().getTime();
        this.timerInterval = setInterval(() => {
            const currentTime = new Date().getTime() - this.startTime;
            this.timerDisplay.textContent = this.formatTime(currentTime);
        }, 37);
    }
    
    stopTimer() {
        if (this.isTimerRunning) {
            const now = new Date();
            const finalTime = now.getTime() - this.startTime;
            if (finalTime < 200) return;
            clearInterval(this.timerInterval);
            this.finalTimeStr = this.formatTime(finalTime);
            this.nowTimeStr = now.toLocaleString('sv-SE').replace('T', ' ');
            this.commandOutput.textContent = `Time: ${this.finalTimeStr}`;
            this.isTimerRunning = false;
        }
        this.timerContainer.style.display = 'none';
    }
    
    prepareTimer() {
        this.timerContainer.style.display = 'flex';
        this.timerDisplay.textContent = '0.00';
    }
    
    startLongPress() {
        this.pressStarted = true;
        this.longPressTimer = setTimeout(() => {
            this.prepareTimer();
        }, 500);
        return true;
    }
    
    endPress() {
        if (this.pressStarted) {
            clearTimeout(this.longPressTimer);
            if (this.timerContainer.style.display === 'flex' && !this.isTimerRunning) {
                this.startTimer();
            }
            this.pressStarted = false;
        }
    }
    
    handleBlur() {
        if (this.pressStarted) {
            clearTimeout(this.longPressTimer);
            this.pressStarted = false;
            this.stopTimer();
        }
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('mousedown', () => this.startLongPress());
        document.addEventListener('mouseup', () => this.endPress());
        this.canvas.addEventListener('touchstart', () => this.startLongPress());
        document.addEventListener('touchend', () => this.endPress());
        document.addEventListener('touchcancel', () => this.handleBlur());
        this.timerContainer.addEventListener('mousedown', () => this.stopTimer());
        this.timerContainer.addEventListener('touchstart', () => this.stopTimer());
        window.addEventListener('blur', () => this.handleBlur());
          document.addEventListener('keyup', (e) => {
            if (e.key === ' ' && textInput !== document.activeElement && !this.isTimerRunning) {
                this.endPress();
            }
        });
    }
}

// Prefs is initialized automatically when prefs.js loads
// Cube3 will be initialized after tutorial is completed

let cube3 = null; // Initialize only after tutorial
const drawCube = new DrawCube('rubiksCubeContainer');
const storage = new StorageHandler();
const buttonRow = new ButtonRow('.button-row');
const timer = new Timer('canvas', 'timer-container', 'timer-display', 'command-output');
let scrElem = document.querySelector('.title');

// Initialize Cube3 - called after tutorial completion
function initializeCube3() {
    cube3 = new Cube3();
    window.cube3 = cube3; // Also expose globally
    console.log('Cube3 initialized with edge scheme:', Prefs.current.edgeScheme);
    
    // Load stored data
    if (storage && typeof storage.loadData === 'function') {
        storage.loadData();
    }
    
    // Reset buttons
    if (buttonRow && typeof buttonRow.resetButtons === 'function') {
        buttonRow.resetButtons();
    }
}

// Helper functions for logarithmic learning rate scale (0.001 to 1)
function lrToSlider(lr) {
    // Convert learning rate (0.001 to 1) to slider value (0 to 30)
    return Math.round((Math.log10(lr) - Math.log10(0.001)) / (Math.log10(1) - Math.log10(0.001)) * 30);
}

function sliderToLR(sliderValue) {
    // Convert slider value (0 to 30) to learning rate (0.001 to 1)
    const logMin = -3;
    const logMax = 0;
    return Math.pow(10, logMin + (sliderValue / 30) * (logMax - logMin));
}

function updateLRDisplay() {
    const slider = document.getElementById('lr-slider');
    const lr = sliderToLR(parseFloat(slider.value));
    document.getElementById('lr-value').innerText = lr.toFixed(3);
}

function toggleSettingsPanel() {
    const panel = document.getElementById('settings-panel');
    panel.style.display = panel.style.display === 'flex' ? 'none' : 'flex';
    if (panel.style.display === 'flex') {
        document.getElementById('mode-select').value = cube3.mode;
        document.getElementById('parity-ckbx').checked = cube3.usePar;
        document.getElementById('flipTwist-slider').value = cube3.flipTwist;
        document.getElementById('twist3-slider').value = cube3.twist3;
        document.getElementById('float3-slider').value = cube3.float3;
        document.getElementById('lr-slider').value = lrToSlider(cube3.lr);
        document.getElementById('mb-slider').value = cube3.markBoost;
        document.getElementById('flipTwist-value').innerText = cube3.flipTwist;
        document.getElementById('twist3-value').innerText = cube3.twist3;
        document.getElementById('float3-value').innerText = cube3.float3;
        document.getElementById('lr-value').innerText = cube3.lr.toFixed(3);
        document.getElementById('mb-value').innerText = cube3.markBoost;
        
        const filtered = Object.keys(cube3.stats).filter(key => cube3.is818(key) && cube3.stats[key].times > 0);
        const progress = filtered.length;
        const totalTimes = filtered.reduce((acc, key) => acc + cube3.stats[key].times, 0);
        const totalMarks = filtered.reduce((acc, key) => acc + cube3.stats[key].mark, 0);
        const totalMarked = filtered.reduce((acc, key) => acc + (cube3.stats[key].mark > 0 ? 1 : 0), 0);
        document.getElementById('tiny-line').innerText = `${progress}/818 (${(100 * progress / 818).toFixed(2)}%)
            Freq=${(totalTimes / 818).toFixed(2)}
            Marks=${totalMarked}/${totalMarks}`;
    }
}

function saveSettings(genScr=false) {
    const newSettings = {
        mode: document.getElementById('mode-select').value,
        usePar: document.getElementById('parity-ckbx').checked,
        flipTwist: parseFloat(document.getElementById('flipTwist-slider').value),
        twist3: parseFloat(document.getElementById('twist3-slider').value),
        float3: parseFloat(document.getElementById('float3-slider').value),
        lr: sliderToLR(parseFloat(document.getElementById('lr-slider').value)),
        markBoost: parseFloat(document.getElementById('mb-slider').value)
    };
    cube3.updateSettings(newSettings);
    storage.push('settings', JSON.stringify(newSettings));
    if (genScr) newScramble();
}




function onClickNext() {
    const activeButtons = document.querySelectorAll('.toggle-btn.active');
    const activeButtonNames = Array.from(activeButtons).map(btn => btn.textContent);
    if (activeButtonNames.length > 0) {
        cube3.addMark(activeButtonNames);
        print(`Add marks: ${activeButtonNames.map(x => `${x}(${cube3.stats[x].mark}/${cube3.stats[x].times})`).join(', ')}`);
    }
    cube3.addTimes();
    storage.saveStats();
    newScramble();
}

function newScramble() {
    document.querySelector('.title').innerText = 'Generating Scramble...';
    const s = cube3.newScramble();
    drawCube.updatePieceColors(s.cube);
    document.querySelector('.title').innerText = s.scr;
    buttonRow.resetButtons();
}

// Command Input
const commandInputElem = document.getElementsByClassName('command-input')[0];
const textInput = commandInputElem.getElementsByTagName('input')[0];
let cmd = '';

textInput.addEventListener('focus', () => {
    commandInputElem.classList.add('visible');
    textInput.value = '';
});

textInput.addEventListener('blur', () => {
    commandInputElem.classList.remove('visible');
});
document.addEventListener('keydown', function(event) {
    // Don't interfere with tutorial navigation - check if tutorial is active
    if (typeof currentPanel !== 'undefined' && currentPanel !== null) {
        return;
    }
    
    // Don't interfere with modal inputs
    const tutorialModal = document.getElementById('tutorial-modal');
    const configModal = document.getElementById('config-modal');
    if ((tutorialModal && tutorialModal.style.display === 'block') || 
        (configModal && configModal.style.display === 'block')) {
        return;
    }
    
    if (timer.isTimerRunning) {
        event.preventDefault();
        timer.stopTimer();
        return;
    }
    if (event.key === 'Escape') {
        if (document.getElementById('settings-panel').style.display === 'flex') {
            toggleSettingsPanel();
        }
        else if (textInput.focus) {
            textInput.blur();
        }
        return;
    }
    if (event.key === '`') { // Do not move down
        event.preventDefault();
        toggleSettingsPanel();
        return;
    }
    if (document.getElementById('settings-panel').style.display === 'flex') {
        return;
    }
    if (event.key === ' ' && textInput !== document.activeElement) {
        event.preventDefault();
        timer.startLongPress();
        return;
    }
    if (event.key.length === 1 && event.key[0] >= '1' && event.key[0] <= '9' && textInput !== document.activeElement) {
        // Don't intercept if modifier keys are pressed (e.g., Cmd+1 for tab switching)
        if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) {
            return;
        }
        event.preventDefault();
        let idx = parseInt(event.key);
        if (idx < buttonRow.buttonRow.children.length) {
            let button = buttonRow.buttonRow.children[idx - 1];
            if (button && button.classList.contains('toggle-btn')) {
                // If already active, blur it; otherwise focus and activate it
                if (button.classList.contains('active')) {
                    button.blur();
                } else {
                    button.focus();
                }
                button.click();
            }
        }
        return;
    }
    if (event.key === 'Tab') {
        event.preventDefault();
        onClickNext();
        textInput.blur();
        return;
    }
    if (textInput !== document.activeElement) {
        // Ignore modifier keys
        if (event.metaKey || event.ctrlKey || event.altKey) {
            return;
        }
        if (Date.now() - timer.lastStopTime < 300) {
            return;
        }
        commandInputElem.classList.add('visible');
        textInput.value = '';
        textInput.focus();
    }
    if (event.key === 'ArrowUp') {
        event.preventDefault();
        textInput.value = cmd;
        textInput.focus();
        textInput.setSelectionRange(textInput.value.length, textInput.value.length);
    }
    if (event.key === 'Enter') {
        cmd = textInput.value.trim();
        textInput.value = '';
        textInput.blur();
        if (cmd.length === 0) return;
        if (cmd[0] === '.') {
            let key = cmd.substring(1).trimStart();
            if (cube3.stats[key]) {
                print(`${key}: ${cube3.getAlgInfo(key).filter(x=>x!=='*').join(', ')}`);
            } else if (cube3.algs[key]) {
                print(`${key}: ${cube3.algs[key]}`);
            } else if (cube3.memDict[key.toUpperCase()]) {
                print(`${key}: ${cube3.memDict[key.toUpperCase()]}`);
            } else {
                print('Key not found.');
            }
        } else if (cmd[0] === '+') {
            const keys = cmd.substring(1).trimStart().split(' ');
            cube3.addMark(keys);
            print(`Add marks: ${keys.map(x => `${x}(${cube3.stats[x].mark}/${cube3.stats[x].times})`).join(', ')}`);
            storage.saveStats();
        } else if (cmd[0] === '-') {
            const keys = cmd.substring(1).trimStart().split(' ');
            cube3.removeMark(keys);
            print(`Remove marks: ${keys.map(x => `${x}(${cube3.stats[x].mark}/${cube3.stats[x].times})`).join(', ')}`);
            storage.saveStats();
        } else if (cmd[0] === 'd') {
            const modeStr = cmd.slice(1).trim();
            if (['rc', 'ec', 'e', 'c', 'r'].includes(modeStr)) {
                const modeSelect = document.getElementById('mode-select');
                modeSelect.value = modeStr;
                saveSettings(true);
                print(`Mode => ${modeStr}`);
            } else {
                print(`Unknown mode: ${modeStr}. Modes: rc, ec, e, c, r`);
            }
        } else if (cmd === 'c') {
            const lastSolveInfo = `${timer.finalTimeStr}  ${scrElem.innerText}  @${timer.nowTimeStr}`;
            navigator.clipboard.writeText(lastSolveInfo).then(() => {
                print(`Copied: ${timer.finalTimeStr}  ${scrElem.innerText}  @${timer.nowTimeStr}`);
            }).catch(err => {
                print('Failed to copy: ' + err);
            });
        } else if (cmd === 't') {
            const numTop = 7;
            let topKeys = Object.keys(cube3.stats)
                .sort((a, b) => (cube3.stats[b].mark - cube3.stats[a].mark) || (cube3.stats[a].times - cube3.stats[b].times)).slice(0, numTop);
            print(`Top ${numTop} marks: ${topKeys.map(key => `${key}(${cube3.stats[key].mark}/${cube3.stats[key].times})`).join(', ')}`);
        } else if (cmd === 'u') {
            storage.loadData();
            forceUpdate();
        } else {
            print(`? Available commands: .<key>, +<key>, -<key>, d<mode>, c, t, u`);
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // Check if this is first time (tutorial not seen yet)
    const seenTutorial = localStorage.getItem('bld.seenTutorial');
    
    if (!seenTutorial) {
        // First time - show welcome message and tutorial
        document.querySelector('.title').innerText = 'Welcome! Please complete the tutorial to get started.';
        checkAndShowTutorial();
    } else {
        // Returning user - create new Cube3 and generate scramble immediately
        initializeCube3();
        newScramble();
        checkAndShowTutorial(); // Still allow access to tutorial
    }
});

// Only register service worker if not running on localhost
if ('serviceWorker' in navigator && !window.location.hostname.includes('localhost') && window.location.hostname !== '127.0.0.1') {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then((registration) => {
                console.log('ServiceWorker registered with scope:', registration.scope);
            })
            .catch((error) => {
                console.error('ServiceWorker registration failed:', error);
            });
    });
}
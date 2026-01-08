
function print(str){
    document.querySelector('.text-output div').innerText = str;
}

function forceUpdate() {
    if (navigator.serviceWorker.controller){
        navigator.serviceWorker.controller.postMessage('ud');
    } else {
        print('Service worker not ready.');
    }
    setTimeout(() => {
        location.reload();
    }, 1000);
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
        
        this.initializeCube(containerId);
        this.setupEventListeners();
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
        for (let i = 0; i < str.length; i++) {
            this.pieces[i].setAttribute("fill", this.colorMapping[str[i]]);
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
        // For static files (alg.txt and mem.txt), load them directly
        if (key === 'alg' || key === 'mem') {
            const text = await this.loadStaticFile(`${key}.txt`);
            if (text) {
                func(text);
                return;
            }
        }
        
        // For other data (stats, settings), use localStorage
        const savedItem = localStorage.getItem(`bld.${key}`);
        if (savedItem) {
            func(savedItem);
        }
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
            button.addEventListener('mouseover', (e) => this.showHoverText(e));
            button.addEventListener('mouseout', (e) => this.hideHoverText(e));
            
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

const cube3 = new Cube3();
const drawCube = new DrawCube('rubiksCubeContainer');
const storage = new StorageHandler();
const buttonRow = new ButtonRow('.button-row');
const timer = new Timer('canvas', 'timer-container', 'timer-display', 'command-output');
let scrElem = document.querySelector('.title');

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
        document.getElementById('ft-slider').value = cube3.ftWeight;
        document.getElementById('ft2-slider').value = cube3.ft2Weight;
        document.getElementById('fl-slider').value = cube3.flWeight;
        document.getElementById('lr-slider').value = lrToSlider(cube3.lr);
        document.getElementById('ff-slider').value = cube3.falloff;
        document.getElementById('ft-value').innerText = cube3.ftWeight;
        document.getElementById('ft2-value').innerText = cube3.ft2Weight;
        document.getElementById('fl-value').innerText = cube3.flWeight;
        document.getElementById('lr-value').innerText = cube3.lr.toFixed(3);
        document.getElementById('ff-value').innerText = cube3.falloff;
        
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
        ftWeight: parseFloat(document.getElementById('ft-slider').value),
        ft2Weight: parseFloat(document.getElementById('ft2-slider').value),
        flWeight: parseFloat(document.getElementById('fl-slider').value),
        lr: sliderToLR(parseFloat(document.getElementById('lr-slider').value)),
        falloff: parseFloat(document.getElementById('ff-slider').value)
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
            if (button.classList.contains('toggle-btn')) {
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

document.addEventListener('DOMContentLoaded', async () => {
    await storage.loadData();
    newScramble();
    checkAndShowTutorial();
});

function checkAndShowTutorial() {
    const seenTutorial = localStorage.getItem('bld.seenTutorial');
    if (!seenTutorial) {
        const modal = document.getElementById('tutorial-modal');
        if (modal) {
            modal.style.display = 'block';
        }
    }
}

function closeTutorial() {
    const modal = document.getElementById('tutorial-modal');
    if (modal) {
        modal.style.display = 'none';
        localStorage.setItem('bld.seenTutorial', '1');
    }
}

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

// 4-Panel Tutorial System with Auto-generation

// Edge positions in order (matching cube3.js comments)
// UF FU UL LU UB BU UR RU
// DF FD DL LD DB BD DR RD
// FR RF FL LF BL LB BR RB
const edgePositions = [
    'UF', 'FU', 'UL', 'LU', 'UB', 'BU', 'UR', 'RU',
    'DF', 'FD', 'DL', 'LD', 'DB', 'BD', 'DR', 'RD',
    'FR', 'RF', 'FL', 'LF', 'BL', 'LB', 'BR', 'RB'
];

// Corner positions in order (matching cube3.js comments)
// UFR RUF FUR UFL FUL LUF
// UBL LUB BUL UBR BUR RUB
// DFL LDF FDL DBL BDL LDB
// DBR BRD RDB DFR FDR RDF
const cornerPositions = [
    'UFR', 'RUF', 'FUR', 'UFL', 'FUL', 'LUF',
    'UBL', 'LUB', 'BUL', 'UBR', 'BUR', 'RUB',
    'DFL', 'LDF', 'FDL', 'DBL', 'BDL', 'LDB',
    'DBR', 'BRD', 'RDB', 'DFR', 'FDR', 'RDF'
];

// Global currentPanel variable (null when no tutorial is active)
let currentPanel = null;
let edgeInput, cornerInput, edgeBufferSelect, cornerBufferSelect;

function checkAndShowTutorial() {
    const seenTutorial = localStorage.getItem('bld.seenTutorial');
    if (!seenTutorial) {
        const modal = document.getElementById('tutorial-modal');
        if (modal) {
            modal.style.display = 'block';
            currentPanel = 1; // Set currentPanel when tutorial is active
            initTutorial();
        }
    }
}

function initTutorial() {
    showPanel(1);
    
    // Initialize form elements for panel 2
    edgeInput = document.getElementById('edge-scheme-input');
    cornerInput = document.getElementById('corner-scheme-input');
    edgeBufferSelect = document.getElementById('edge-buffer-select');
    cornerBufferSelect = document.getElementById('corner-buffer-select');
    
    // Load saved config if exists
    const savedConfig = localStorage.getItem('bld.userPrefs');
    if (savedConfig) {
        try {
            const config = JSON.parse(savedConfig);
            document.getElementById('orientation-select').value = config.orientation || 'yr';
            edgeInput.value = config.edgeScheme || '';
            edgeBufferSelect.value = config.edgeBuffer || '0';
            cornerInput.value = config.cornerScheme || '';
            cornerBufferSelect.value = config.cornerBuffer || '0';
        } catch (e) {
            console.error('Error loading saved config:', e);
        }
    }
    
    // Add input event listeners
    if (edgeInput) {
        edgeInput.addEventListener('input', handleEdgeInput);
        edgeInput.addEventListener('change', handleEdgeInput); // Handle autofill
        edgeInput.addEventListener('focus', () => updateInputHint(edgeInput, edgePositions));
        edgeInput.addEventListener('blur', () => clearInputHint(edgeInput));
    }
    
    if (cornerInput) {
        cornerInput.addEventListener('input', handleCornerInput);
        cornerInput.addEventListener('change', handleCornerInput); // Handle autofill
        cornerInput.addEventListener('focus', () => updateInputHint(cornerInput, cornerPositions));
        cornerInput.addEventListener('blur', () => clearInputHint(cornerInput));
    }
}

// Function to restart tutorial from main settings
function restartTutorial() {
    // Close main settings panel
    const settingsPanel = document.getElementById('settings-panel');
    if (settingsPanel && settingsPanel.style.display === 'block') {
        settingsPanel.style.display = 'none';
    }
    
    // Clear seen tutorial flag and show tutorial
    localStorage.removeItem('bld.seenTutorial');
    
    // Show tutorial modal
    const modal = document.getElementById('tutorial-modal');
    if (modal) {
        modal.style.display = 'block';
        currentPanel = 1; // Set currentPanel when tutorial is active
        initTutorial();
    }
}

function tutorialNavigate(direction) {
    const newPanel = currentPanel + direction;
    
    if (newPanel === 2 && direction === 1) {
        // Going to panel 2, no validation needed
        tutorialGoTo(newPanel);
    } else if (newPanel === 3 && direction === 1) {
        // Going to panel 3, no validation needed (removed blocking)
        tutorialGoTo(newPanel);
    } else if (newPanel === 4 && direction === 1) {
        // Going to panel 4, save config
        saveConfig();
        tutorialGoTo(newPanel);
    } else if (newPanel === 5 && direction === 1) {
        // Finish tutorial - validate config and redirect if needed
        if (!validateConfig()) {
            alert('Please configure your letter schemes first.');
            tutorialGoTo(2); // Jump to panel 2
            return;
        }
        finishTutorial();
    }
}

function tutorialGoTo(panel) {
    currentPanel = panel;
    showPanel(panel);
}

function showPanel(panel) {
    currentPanel = panel;
    
    // Hide all panels
    for (let i = 1; i <= 4; i++) {
        const panelElement = document.getElementById(`tutorial-panel-${i}`);
        if (panelElement) {
            panelElement.style.display = 'none';
        }
    }
    
    // Show current panel
    const currentPanelElement = document.getElementById(`tutorial-panel-${panel}`);
    if (currentPanelElement) {
        currentPanelElement.style.display = 'flex';
    }
    
    // Update dots
    const dots = document.querySelectorAll('.tutorial-dot');
    dots.forEach((dot, index) => {
        if (index + 1 === panel) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
    
    // Update next button
    const nextBtn = document.getElementById('tutorial-next-btn');
    
    if (nextBtn) {
        if (panel === 4) {
            nextBtn.textContent = 'Finish!';
        } else {
            nextBtn.textContent = 'Next →';
        }
    }
    
    // Initialize panel-specific content
    if (panel === 2) {
        // Show initial hints
        if (edgeInput) updateInputHint(edgeInput, edgePositions);
        if (cornerInput) updateInputHint(cornerInput, cornerPositions);
        // Validate config
        validateConfig();
    }
}

function finishTutorial() {
    // Get previous config for comparison
    const previousEdgeBuffer = window.Prefs ? parseInt(Prefs.current.edgeBuffer) : null;
    const previousCornerBuffer = window.Prefs ? parseInt(Prefs.current.cornerBuffer) : null;
    
    // Check if stats exist
    const statsStr = localStorage.getItem('bld.stats');
    const hasStats = statsStr && statsStr.trim().length > 0;
    
    // Prepare new config
    const newConfig = {
        orientation: document.getElementById('orientation-select').value,
        edgeScheme: edgeInput.value,
        edgeBuffer: edgeBufferSelect.value,
        cornerScheme: cornerInput.value,
        cornerBuffer: cornerBufferSelect.value
    };
    
    // Check if buffer changed
    const bufferChanged = !isNaN(previousEdgeBuffer) && 
        (previousEdgeBuffer !== parseInt(newConfig.edgeBuffer) || 
         previousCornerBuffer !== parseInt(newConfig.cornerBuffer));
    
    // If buffer changed and stats exist, warn user
    if (bufferChanged && hasStats) {
        const confirmed = confirm(
            'Warning: You have changed your buffer position.\n\n' +
            'This will wipe all your existing training statistics.\n\n' +
            'Do you want to continue?'
        );
        
        if (!confirmed) {
            return; // Don't close tutorial
        }
        
        // User confirmed - wipe stats
        localStorage.removeItem('bld.stats');
        console.log('Training statistics wiped due to buffer change');
    }
    
    // Update Prefs with new configuration
    Prefs.update(newConfig);
    
    // Auto-load alg template for UF-UFR buffer users (async)
    Prefs.autoLoadAlgTemplate().then(() => {
        // Configuration and alg template loaded - create new Cube3 instance
        initializeCube3();
        
        // Refresh DrawCube with new orientation
        if (window.drawCube && typeof window.drawCube.refresh === 'function') {
            window.drawCube.refresh();
        }
        
        // Close tutorial modal
        const modal = document.getElementById('tutorial-modal');
        if (modal) {
            modal.style.display = 'none';
        }
        currentPanel = null;
        localStorage.setItem('bld.seenTutorial', '1');
        
        // Generate first scramble immediately
        newScramble();
    });
}

// Input validation and handling functions
function handleEdgeInput(e) {
    const input = e.target;
    setTimeout(() => {
        let value = input.value.replace(/[^a-zA-Z]/g, '').toUpperCase();
        
        if (value.length > 24) {
            value = value.substring(0, 24);
        }
        
        if (input.value !== value) {
            input.value = value;
        }
        updateInputHint(edgeInput, edgePositions);
        validateConfig();
    }, 0);
}

function handleCornerInput(e) {
    const input = e.target;
    setTimeout(() => {
        let value = input.value.replace(/[^a-zA-Z]/g, '').toLowerCase();
        
        if (value.length > 24) {
            value = value.substring(0, 24);
        }
        
        if (input.value !== value) {
            input.value = value;
        }
        updateInputHint(cornerInput, cornerPositions);
        validateConfig();
    }, 0);
}

function updateInputHint(input, positions) {
    const value = input.value;
    if (value.length === 24) {
        input.style.backgroundImage = 'none';
        input.style.backgroundRepeat = 'no-repeat';
        input.style.backgroundPosition = 'right 12px center';
    } else if (value.length < 24) {
        const nextPos = positions[value.length];
        // Create a gradient background with the hint text
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.font = '14px monospace';
        const text = `← ${nextPos}`;
        const metrics = ctx.measureText(text);
        canvas.width = metrics.width + 10;
        canvas.height = 20;
        ctx.font = '14px monospace';
        ctx.fillStyle = '#888888';
        ctx.fillText(text, 5, 15);
        input.style.backgroundImage = `url(${canvas.toDataURL()})`;
        input.style.backgroundRepeat = 'no-repeat';
        input.style.backgroundPosition = 'right 12px center';
    } else {
        input.style.backgroundImage = 'none';
    }
}

function clearInputHint(input) {
    // Don't clear hint on blur, keep it visible
}

function validateConfig() {
    if (!edgeInput || !cornerInput) return true;
    
    const edgeScheme = edgeInput.value;
    const cornerScheme = cornerInput.value;
    let isValid = true;
    
    // Check edge scheme
    if (edgeScheme.length !== 24) {
        edgeInput.style.borderColor = 'red';
        edgeInput.style.borderWidth = '2px';
        isValid = false;
    } else {
        const edgeSet = new Set(edgeScheme);
        if (edgeSet.size !== 24) {
            edgeInput.style.borderColor = 'red';
            edgeInput.style.borderWidth = '2px';
            isValid = false;
        } else {
            edgeInput.style.borderColor = '';
            edgeInput.style.borderWidth = '';
        }
    }
    
    // Check corner scheme
    if (cornerScheme.length !== 24) {
        cornerInput.style.borderColor = 'red';
        cornerInput.style.borderWidth = '2px';
        isValid = false;
    } else {
        const cornerSet = new Set(cornerScheme);
        if (cornerSet.size !== 24) {
            cornerInput.style.borderColor = 'red';
            cornerInput.style.borderWidth = '2px';
            isValid = false;
        } else {
            cornerInput.style.borderColor = '';
            cornerInput.style.borderWidth = '';
        }
    }
    
    return isValid;
}

function saveConfig() {
    if (!edgeInput || !cornerInput) return;
    
    const config = {
        orientation: document.getElementById('orientation-select').value,
        edgeScheme: edgeInput.value,
        edgeBuffer: edgeBufferSelect.value,
        cornerScheme: cornerInput.value,
        cornerBuffer: cornerBufferSelect.value
    };
    
    // Update Prefs (which handles localStorage saving)
    if (window.Prefs) {
        Prefs.update(config);
    } else {
        // Fallback if Prefs not loaded yet
        localStorage.setItem('bld.userPrefs', JSON.stringify(config));
    }
}

// Auto-generation functions
function generateMemContent(edgeScheme, cornerScheme) {
    // Convert all letters to uppercase and get unique letters
    const allLetters = [...new Set([...edgeScheme.toUpperCase(), ...cornerScheme.toUpperCase()])].sort();
    let content = '';
    
    for (let i = 0; i < allLetters.length; i++) {
        for (let j = 0; j < allLetters.length; j++) {
            if (i !== j) {
                content += `${allLetters[i]}${allLetters[j]}=*\n`;
            }
        }
    }
    
    return content;
}

function generateAlgContent(edgeScheme, cornerScheme, edgeBuffer, cornerBuffer) {
    let content = '';
    
    // Generate edge pairs (440 pairs)
    const edgeBufferPos = parseInt(edgeBuffer);
    const edgeBufferLetters = [
        edgeScheme[edgeBufferPos * 2],
        edgeScheme[edgeBufferPos * 2 + 1]
    ];
    
    // Remove buffer letters and create pairs
    const edgeLetters = edgeScheme.split('').filter((letter, index) => 
        index !== edgeBufferPos * 2 && index !== edgeBufferPos * 2 + 1
    );
    
    const edgePairs = [];
    for (let i = 0; i < edgeLetters.length; i += 2) {
        edgePairs.push([edgeLetters[i], edgeLetters[i + 1]]);
    }
    
    // Generate all valid edge combinations
    const edgeCombs = [];
    for (let i = 0; i < edgePairs.length; i++) {
        for (let j = 0; j < edgePairs.length; j++) {
            if (i !== j) {
                edgeCombs.push(edgePairs[i][0] + edgePairs[j][0]);
                edgeCombs.push(edgePairs[i][0] + edgePairs[j][1]);
                edgeCombs.push(edgePairs[i][1] + edgePairs[j][0]);
                edgeCombs.push(edgePairs[i][1] + edgePairs[j][1]);
            }
        }
    }
    
    edgeCombs.sort();
    for (const comb of edgeCombs) {
        content += `${comb}=*\n`;
    }
    
    // Generate corner pairs (378 pairs)
    const cornerBufferPos = parseInt(cornerBuffer);
    const cornerBufferLetters = [
        cornerScheme[cornerBufferPos * 3],
        cornerScheme[cornerBufferPos * 3 + 1],
        cornerScheme[cornerBufferPos * 3 + 2]
    ];
    
    // Remove buffer letters and create triples
    const cornerLetters = cornerScheme.split('').filter((letter, index) => 
        index !== cornerBufferPos * 3 && index !== cornerBufferPos * 3 + 1 && index !== cornerBufferPos * 3 + 2
    );
    
    const cornerTriples = [];
    for (let i = 0; i < cornerLetters.length; i += 3) {
        cornerTriples.push([cornerLetters[i], cornerLetters[i + 1], cornerLetters[i + 2]]);
    }
    
    // Generate all valid corner combinations
    const cornerCombs = [];
    for (let i = 0; i < cornerTriples.length; i++) {
        for (let j = 0; j < cornerTriples.length; j++) {
            if (i !== j) {
                for (let a = 0; a < 3; a++) {
                    for (let b = 0; b < 3; b++) {
                        cornerCombs.push(cornerTriples[i][a] + cornerTriples[j][b]);
                    }
                }
            }
        }
    }
    
    cornerCombs.sort();
    for (const comb of cornerCombs) {
        content += `${comb}=*\n`;
    }
    
    return content;
}

function downloadFile(content, filename) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Load alg.txt and map letters to user's letter scheme
async function loadAndMapAlgTemplate(userEdgeScheme, userCornerScheme) {
    try {
        const response = await fetch('alg.txt');
        if (!response.ok) {
            throw new Error('Failed to load alg.txt');
        }
        
        const content = await response.text();
        
        // Default letter schemes (UF-UFR buffer)
        const defaultEdgeScheme = Prefs.defaults.edgeScheme;
        const defaultCornerScheme = Prefs.defaults.cornerScheme;
        
        // Create mapping from default to user scheme
        const edgeMapping = {};
        const cornerMapping = {};
        
        for (let i = 0; i < 24; i++) {
            edgeMapping[defaultEdgeScheme[i]] = userEdgeScheme[i];
            cornerMapping[defaultCornerScheme[i]] = userCornerScheme[i];
        }
        
        // Parse alg.txt and remap letters
        const lines = content.split('\n');
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
        const mappedContent = mappedLines.map(line => `${line.key}=${line.alg}`).join('\n');
        
        // Save to localStorage
        localStorage.setItem('bld.alg', mappedContent);
        
        // Download file
        downloadFile(mappedContent, 'alg.txt');
        
        console.log('Alg template mapped and saved successfully');
    } catch (e) {
        console.error('Error loading and mapping alg template:', e);
        alert('Error loading alg.txt. Generating empty template instead.');
        
        // Fall back to generating empty template
        const content = generateAlgContent(userEdgeScheme, userCornerScheme, '0', '0');
        localStorage.setItem('bld.alg', content);
        downloadFile(content, 'alg.txt');
    }
}

function downloadMemTemplate() {
    // Check if we're in tutorial mode first
    if (edgeInput && cornerInput) {
        const edgeScheme = edgeInput.value;
        const cornerScheme = cornerInput.value;
        if (edgeScheme.length === 24 && cornerScheme.length === 24) {
            const content = generateMemContent(edgeScheme, cornerScheme);
            
            // Save to localStorage
            localStorage.setItem('bld.mem', content);
            
            downloadFile(content, 'mem.txt');
            return;
        }
    }
    
    // Fall back to saved config
    const config = localStorage.getItem('bld.userPrefs');
    if (!config) {
        alert('Please configure your letter schemes first.');
        return;
    }
    
    try {
        const parsed = JSON.parse(config);
        if (!parsed.edgeScheme || !parsed.cornerScheme || 
            parsed.edgeScheme.length !== 24 || parsed.cornerScheme.length !== 24) {
            alert('Please configure your letter schemes first.');
            return;
        }
        
        const content = generateMemContent(parsed.edgeScheme, parsed.cornerScheme);
        
        // Save to localStorage
        localStorage.setItem('bld.mem', content);
        
        downloadFile(content, 'mem.txt');
    } catch (e) {
        console.error('Error generating mem template:', e);
        alert('Error generating template. Please check your configuration.');
    }
}

function downloadAlgTemplate() {
    // Check if we're in tutorial mode first
    if (edgeInput && cornerInput && edgeBufferSelect && cornerBufferSelect) {
        const edgeScheme = edgeInput.value;
        const cornerScheme = cornerInput.value;
        const edgeBuffer = edgeBufferSelect.value;
        const cornerBuffer = cornerBufferSelect.value;
        
        if (edgeScheme.length === 24 && cornerScheme.length === 24) {
            // Check if using default UF-UFR buffer
            if (edgeBuffer === '0' && cornerBuffer === '0') {
                // Load alg.txt and map it to user's letter scheme
                loadAndMapAlgTemplate(edgeScheme, cornerScheme);
                return;
            }
            
            // Generate template for non-default buffer
            const content = generateAlgContent(edgeScheme, cornerScheme, edgeBuffer, cornerBuffer);
            
            // Save to localStorage
            localStorage.setItem('bld.alg', content);
            
            downloadFile(content, 'alg.txt');
            return;
        }
    }
    
    // Fall back to saved config
    const config = localStorage.getItem('bld.userPrefs');
    if (!config) {
        alert('Please configure your letter schemes first.');
        return;
    }
    
    try {
        const parsed = JSON.parse(config);
        if (!parsed.edgeScheme || !parsed.cornerScheme || 
            parsed.edgeScheme.length !== 24 || parsed.cornerScheme.length !== 24) {
            alert('Please configure your letter schemes first.');
            return;
        }
        
        const edgeBuffer = parsed.edgeBuffer || '0';
        const cornerBuffer = parsed.cornerBuffer || '0';
        
        // Check if using default UF-UFR buffer
        if (edgeBuffer === '0' && cornerBuffer === '0') {
            // Load alg.txt and map it to user's letter scheme
            loadAndMapAlgTemplate(parsed.edgeScheme, parsed.cornerScheme);
            return;
        }
        
        // Generate template for non-default buffer
        const content = generateAlgContent(parsed.edgeScheme, parsed.cornerScheme, edgeBuffer, cornerBuffer);
        
        // Save to localStorage
        localStorage.setItem('bld.alg', content);
        
        downloadFile(content, 'alg.txt');
    } catch (e) {
        console.error('Error generating alg template:', e);
        alert('Error generating template. Please check your configuration.');
    }
}

function uploadAlgFile(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            const lines = content.split('\n').filter(line => line.trim().length > 0);
            console.log('Alg file uploaded:', file.name);
            
            // Save to localStorage
            localStorage.setItem('bld.alg', content);
            
            alert(`Alg file uploaded successfully (${lines.length} lines)`);
        };
        reader.readAsText(file);
    }
}

function uploadMemFile(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            const lines = content.split('\n').filter(line => line.trim().length > 0);
            console.log('Mem file uploaded:', file.name);
            
            // Save to localStorage
            localStorage.setItem('bld.mem', content);
            
            alert(`Mem file uploaded successfully (${lines.length} lines)`);
        };
        reader.readAsText(file);
    }
}

// Keyboard event listener for modal navigation
document.addEventListener('keydown', function(event) {
    const tutorialModal = document.getElementById('tutorial-modal');
    
    if (tutorialModal && tutorialModal.style.display === 'block') {
        if (event.key === 'ArrowRight' || event.key === ' ' || event.key === 'Enter') {
            event.preventDefault();
            tutorialNavigate(1);
            return;
        }
        
        if (event.key >= '1' && event.key <= '4') {
            event.preventDefault();
            tutorialGoTo(parseInt(event.key));
            return;
        }
    }
});

// loadCubeConfig is now in ufufr.js and called before cube3 instantiation

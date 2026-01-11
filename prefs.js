
// Centralized Preferences Management
// Single source of truth for all user configuration

class Prefs {
    // Default letter schemes and buffers
    static defaults = {
        // UF FU UL LU UB BU UR RU DF FD DL LD DB BD DR RD FR RF FL LF BL LB BR RB
        edgeScheme: 'ABCDEFGHIJKLMNOPQRSTWXYZ',
        // UFR RUF FUR UFL FUL LUF UBL LUB BUL UBR BUR RUB DFL LDF FDL DBL BDL LDB DBR BRD RDB DFR FDR RDF
        cornerScheme: 'ahqcbtedwgfzilsknxmpyojr',
        edgeBuffer: 0,    // 0: UF, 1: UL, 2: UB, 3: UR, 4: DF, 5: DL, 6: DB, 7: DR, 8: FR, 9: FL, 10: BL, 11: BR
        cornerBuffer: 0,  // 0: UFR, 1: UFL, 2: UBL, 3: UBR, 4: DFL, 5: DBL, 6: DBR, 7: DFR
        orientation: 'yr',  // Default: Yellow top, Red front
        // Training settings
        lr: 0.1,
        markBoost: 1,
        mode: 'ec',
        usePar: true,
        twist3: 0,
        flipTwist: 0,
        float3: 0
    };
    
    // Current active preferences
    static current = {
        edgeScheme: null,
        cornerScheme: null,
        edgeBuffer: null,
        cornerBuffer: null,
        orientation: null,
        alg: '',
        mem: '',
        // Settings
        lr: null,
        markBoost: null,
        mode: null,
        usePar: null,
        twist3: null,
        flipTwist: null,
        float3: null
    };
    
    // Initialize preferences from localStorage or use defaults
    static init() {
        const savedConfig = localStorage.getItem('bld.userPrefs');
        
        if (savedConfig) {
            try {
                const config = JSON.parse(savedConfig);
                this.current.edgeScheme = config.edgeScheme || this.defaults.edgeScheme;
                this.current.cornerScheme = config.cornerScheme || this.defaults.cornerScheme;
                this.current.edgeBuffer = config.edgeBuffer !== undefined ? parseInt(config.edgeBuffer) : this.defaults.edgeBuffer;
                this.current.cornerBuffer = config.cornerBuffer !== undefined ? parseInt(config.cornerBuffer) : this.defaults.cornerBuffer;
                this.current.orientation = config.orientation || this.defaults.orientation;
            } catch (e) {
                console.error('Error loading preferences:', e);
                this.loadDefaults();
            }
        } else {
            this.loadDefaults();
        }
        
        // Load alg and mem from localStorage
        this.current.alg = localStorage.getItem('bld.alg') || '';
        this.current.mem = localStorage.getItem('bld.mem') || '';
        
        // Load settings from localStorage
        const savedSettings = localStorage.getItem('bld.settings');
        if (savedSettings) {
            try {
                const settings = JSON.parse(savedSettings);
                this.current.lr = settings.lr !== undefined ? settings.lr : this.defaults.lr;
                this.current.markBoost = settings.markBoost !== undefined ? settings.markBoost : this.defaults.markBoost;
                this.current.mode = settings.mode || this.defaults.mode;
                this.current.usePar = settings.usePar !== undefined ? settings.usePar : this.defaults.usePar;
                this.current.twist3 = settings.twist3 !== undefined ? settings.twist3 : this.defaults.twist3;
                this.current.flipTwist = settings.flipTwist !== undefined ? settings.flipTwist : this.defaults.flipTwist;
                this.current.float3 = settings.float3 !== undefined ? settings.float3 : this.defaults.float3;
            } catch (e) {
                console.error('Error loading settings:', e);
                this.loadDefaultSettings();
            }
        } else {
            this.loadDefaultSettings();
        }
    }
    
    // Load default values
    static loadDefaults() {
        this.current.edgeScheme = this.defaults.edgeScheme;
        this.current.cornerScheme = this.defaults.cornerScheme;
        this.current.edgeBuffer = this.defaults.edgeBuffer;
        this.current.cornerBuffer = this.defaults.cornerBuffer;
        this.current.orientation = this.defaults.orientation;
        this.loadDefaultSettings();
    }
    
    // Load default settings
    static loadDefaultSettings() {
        this.current.lr = this.defaults.lr;
        this.current.markBoost = this.defaults.markBoost;
        this.current.mode = this.defaults.mode;
        this.current.usePar = this.defaults.usePar;
        this.current.twist3 = this.defaults.twist3;
        this.current.flipTwist = this.defaults.flipTwist;
        this.current.float3 = this.defaults.float3;
    }
    
    // Update preferences and save to localStorage
    static update(newPrefs) {
        // Store previous values for comparison
        const previous = {
            edgeScheme: this.current.edgeScheme,
            cornerScheme: this.current.cornerScheme,
            edgeBuffer: this.current.edgeBuffer,
            cornerBuffer: this.current.cornerBuffer
        };
        
        // Update current preferences
        if (newPrefs.edgeScheme !== undefined) {
            this.current.edgeScheme = newPrefs.edgeScheme;
        }
        if (newPrefs.cornerScheme !== undefined) {
            this.current.cornerScheme = newPrefs.cornerScheme;
        }
        if (newPrefs.edgeBuffer !== undefined) {
            this.current.edgeBuffer = parseInt(newPrefs.edgeBuffer);
        }
        if (newPrefs.cornerBuffer !== undefined) {
            this.current.cornerBuffer = parseInt(newPrefs.cornerBuffer);
        }
        if (newPrefs.orientation !== undefined) {
            this.current.orientation = newPrefs.orientation;
        }
        if (newPrefs.alg !== undefined) {
            this.current.alg = newPrefs.alg;
            localStorage.setItem('bld.alg', newPrefs.alg);
        }
        if (newPrefs.mem !== undefined) {
            this.current.mem = newPrefs.mem;
            localStorage.setItem('bld.mem', newPrefs.mem);
        }
        
        // Save to localStorage
        const configToSave = {
            edgeScheme: this.current.edgeScheme,
            cornerScheme: this.current.cornerScheme,
            edgeBuffer: this.current.edgeBuffer,
            cornerBuffer: this.current.cornerBuffer,
            orientation: this.current.orientation
        };
        localStorage.setItem('bld.userPrefs', JSON.stringify(configToSave));
        
        // Return info about what changed
        return {
            bufferChanged: previous.edgeBuffer !== this.current.edgeBuffer || 
                          previous.cornerBuffer !== this.current.cornerBuffer,
            schemeChanged: previous.edgeScheme !== this.current.edgeScheme || 
                          previous.cornerScheme !== this.current.cornerScheme,
            previous: previous
        };
    }
    
    // Update settings and save to localStorage
    static updateSettings(newSettings) {
        if (newSettings.lr !== undefined) {
            this.current.lr = newSettings.lr;
        }
        if (newSettings.markBoost !== undefined) {
            this.current.markBoost = newSettings.markBoost;
        }
        if (newSettings.mode !== undefined) {
            this.current.mode = newSettings.mode;
        }
        if (newSettings.usePar !== undefined) {
            this.current.usePar = newSettings.usePar;
        }
        if (newSettings.twist3 !== undefined) {
            this.current.twist3 = newSettings.twist3;
        }
        if (newSettings.flipTwist !== undefined) {
            this.current.flipTwist = newSettings.flipTwist;
        }
        if (newSettings.float3 !== undefined) {
            this.current.float3 = newSettings.float3;
        }
        
        // Save to localStorage
        const settingsToSave = {
            lr: this.current.lr,
            markBoost: this.current.markBoost,
            mode: this.current.mode,
            usePar: this.current.usePar,
            twist3: this.current.twist3,
            flipTwist: this.current.flipTwist,
            float3: this.current.float3
        };
        localStorage.setItem('bld.settings', JSON.stringify(settingsToSave));
    }
    
    // Check if buffer positions changed
    static hasBufferChanged(oldEdgeBuffer, oldCornerBuffer) {
        return oldEdgeBuffer !== this.current.edgeBuffer || 
               oldCornerBuffer !== this.current.cornerBuffer;
    }
    
    // Check if letter schemes changed
    static hasSchemeChanged(oldEdgeScheme, oldCornerScheme) {
        return oldEdgeScheme !== this.current.edgeScheme || 
               oldCornerScheme !== this.current.cornerScheme;
    }
    
    // Get current config for Cube3
    static getCubeConfig() {
        return {
            edgeScheme: this.current.edgeScheme,
            cornerScheme: this.current.cornerScheme,
            edgeBuffer: this.current.edgeBuffer,
            cornerBuffer: this.current.cornerBuffer
        };
    }
    
    // Get current orientation for DrawCube
    static getOrientation() {
        return this.current.orientation;
    }
    
    // Get alg content
    static getAlg() {
        return this.current.alg;
    }
    
    // Get mem content
    static getMem() {
        return this.current.mem;
    }
    
    // Get settings
    static getSettings() {
        return {
            lr: this.current.lr,
            markBoost: this.current.markBoost,
            mode: this.current.mode,
            usePar: this.current.usePar,
            twist3: this.current.twist3,
            flipTwist: this.current.flipTwist,
            float3: this.current.float3
        };
    }
    
    // Auto-load and map alg.txt for UF-UFR buffer users
    static async autoLoadAlgTemplate() {
        // Only auto-load if using default UF-UFR buffer
        if (this.current.edgeBuffer !== 0 || this.current.cornerBuffer !== 0) {
            return;
        }
        
        // Check if alg already exists
        if (this.current.alg && this.current.alg.trim().length > 0) {
            return;
        }
        
        try {
            const response = await fetch('alg.txt');
            if (!response.ok) {
                throw new Error('Failed to load alg.txt');
            }
            
            const content = await response.text();
            
            // Default letter schemes (UF-UFR buffer)
            const defaultEdgeScheme = 'ABCDEFGHIJKLMNOPQRSTWXYZ';
            const defaultCornerScheme = 'ahqcbtedwgfzilsknxmpyojr';
            
            // Create mapping from default to user scheme
            const edgeMapping = {};
            const cornerMapping = {};
            
            for (let i = 0; i < 24; i++) {
                edgeMapping[defaultEdgeScheme[i]] = this.current.edgeScheme[i];
                cornerMapping[defaultCornerScheme[i]] = this.current.cornerScheme[i];
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
            
            // Update prefs and localStorage
            this.update({ alg: mappedContent });
            
            console.log('Auto-loaded and mapped alg.txt for UF-UFR buffer');
        } catch (e) {
            console.error('Error auto-loading alg template:', e);
        }
    }
}

// Initialize on load
Prefs.init();

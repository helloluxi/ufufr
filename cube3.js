
class Cube3 {
    // ====================================
    // Localization Preferences
    // ====================================
    
    // UF FU UL LU UB BU UR RU
    // DF FD DL LD DB BD DR RD
    // FR RF FL LF BL LB BR RB
    static edgeLetterScheme = 'ABCDEFGHIJKLMNOPQRSTWXYZ';

    // UFR RUF FUR UFL FUL LUF
    // UBL LUB BUL UBR BUR RUB
    // DFL LDF FDL DBL BDL LDB
    // DBR BRD RDB DFR FDR RDF
    static cornLetterScheme = 'ahqcbtedwgfzilsknxmpyojr';
    
    // 0: UF, 1: UL, 2: UB, 3: UR
    // 4: DF, 5: DL, 6: DB, 7: DR
    // 8: FR, 9: FL, 10: BL, 11: BR
    static edgeBufferIdx = 0;

    // 0: UFR, 1: UFL, 2: UBL, 3: UBR
    // 4: DFL, 5: DBL, 6: DBR, 7: DFR
    static cornBufferIdx = 0;
    
    // ====================================
    // Internal Constants
    // ====================================
    
    static edgeIdxOnCube = [7, 19, 3, 37, 1, 46, 5, 10, 28, 25, 30, 43, 34, 52, 32, 16, 23, 12, 21, 41, 50, 39, 48, 14];
    static cornIdxOnCube = [8, 9, 20, 6, 18, 38, 0, 36, 47, 2, 45, 11, 27, 44, 24, 33, 53, 42, 35, 17, 51, 29, 26, 15];
    static eFaces = ['uf', 'ul', 'ub', 'ur', 'df', 'dl', 'db', 'dr', 'fr', 'fl', 'bl', 'br'];

    constructor() {
        // Cube constants
        this.edgeIdx = {};
        this.cornIdx = {};
        this.fullIdx = {};
        for (let i = 0; i < 24; i++) {
            this.fullIdx[Cube3.edgeLetterScheme[i]] = this.edgeIdx[Cube3.edgeLetterScheme[i]] = i >> 1;
            this.fullIdx[Cube3.cornLetterScheme[i]] = (this.cornIdx[Cube3.cornLetterScheme[i]] = (i / 3) | 0) + 12;
        }

        // Stats and training data
        this.stats = {};
        this.algs = {};
        this.memDict = {};
        this.eKeys = [];
        this.cKeys = [];
        this.displayKeys = [];
        this.occupied = null;
        this.hasSpecialCategories = false;

        // Load settings
        const settingsStr = localStorage.getItem('bld.settings');
        let settings = {};
        if (settingsStr) {
            settings = JSON.parse(settingsStr);
        }
        this.lr = settings.lr || 0.1;
        this.falloff = settings.falloff || 1;
        this.mode = settings.mode || 'r';
        this.usePar = settings.usePar !== false;
        this.ft2Weight = settings.ft2Weight || 0;
        this.ftWeight = settings.ftWeight || 0;
        this.flWeight = settings.flWeight || 0;

        // Initialize stats
        this.initEmptyStats();
    }

    isEdge(c) {
        return c === c.toUpperCase();
    }

    isCorner(c) {
        return c === c.toLowerCase();
    }
    
    is818(key) {
        return key.length === 2 && ((this.isEdge(key[0]) && this.isEdge(key[1])) || (this.isCorner(key[0]) && this.isCorner(key[1])));
    }

    updateSettings(settings) {
        this.lr = settings.lr || this.lr;
        this.falloff = settings.falloff || this.falloff;
        this.mode = settings.mode || this.mode;
        this.ft2Weight = settings.ft2Weight || this.ft2Weight;
        this.ftWeight = settings.ftWeight || this.ftWeight;
        this.flWeight = settings.flWeight || this.flWeight;
        this.usePar = settings.usePar != null ? settings.usePar : this.usePar;
        localStorage.setItem('bld.settings', JSON.stringify({
            lr: this.lr,
            falloff: this.falloff,
            mode: this.mode,
            usePar: this.usePar,
            ft2Weight: this.ft2Weight,
            ftWeight: this.ftWeight,
            flWeight: this.flWeight
        }));
    }

    initEmptyStats() {
        this.stats = {};

        const initStat = (key, cat) => {
            this.stats[key] = { times: 0, mark: 0, cat: cat };
        };

        for (let c1 of Cube3.edgeLetterScheme) {
            if (this.edgeIdx[c1] === Cube3.edgeBufferIdx) continue;
            for (let c2 of Cube3.edgeLetterScheme) {
                if (this.edgeIdx[c2] === Cube3.edgeBufferIdx) continue;
                if (this.edgeIdx[c1] != this.edgeIdx[c2]) {
                    initStat(c1 + c2, 'e');
                }
            }
            for (let c2 of Cube3.cornLetterScheme) {
                if (this.cornIdx[c2] === Cube3.cornBufferIdx) continue;
                initStat(c1 + c2, 'par');
            }
            if (Cube3.edgeLetterScheme[this.edgeIdx[c1] * 2] === c1) {
                initStat(c1 + '+', 'e+');
            }
        }
        for (let c1 of Cube3.cornLetterScheme) {
            if (this.cornIdx[c1] === Cube3.cornBufferIdx) continue;
            for (let c2 of Cube3.cornLetterScheme) {
                if (this.cornIdx[c2] === Cube3.cornBufferIdx) continue;
                if (this.cornIdx[c1] != this.cornIdx[c2]) {
                    initStat(c1 + c2, 'c');
                }
            }
        }
        for (let cIdx1 = 0; cIdx1 < 24; cIdx1 += 3) {
            const c1 = Cube3.cornLetterScheme[cIdx1];
            if (this.cornIdx[c1] === Cube3.cornBufferIdx) continue;
            initStat(`${c1}+`, 'c+');
            initStat(`${c1}-`, 'c+');
            for (let cIdx2 = cIdx1 + 3; cIdx2 < 24; cIdx2 += 3) {
                const c2 = Cube3.cornLetterScheme[cIdx2];
                if (this.cornIdx[c2] === Cube3.cornBufferIdx) continue;
                initStat(`${c1}+${c2}+`, 'c++');
                initStat(`${c1}-${c2}-`, 'c++');
            }
        }
    }

    cycleCube(cubeArr, code) {
        if (this.isEdge(code)) {
            let i = Cube3.edgeLetterScheme.indexOf(code);
            this.swap(cubeArr, Cube3.edgeIdxOnCube[0], Cube3.edgeIdxOnCube[i]);
            this.swap(cubeArr, Cube3.edgeIdxOnCube[1], Cube3.edgeIdxOnCube[i ^ 1]);
        } else if (this.isCorner(code)) {
            let i = Cube3.cornLetterScheme.indexOf(code);
            this.swap(cubeArr, Cube3.cornIdxOnCube[0], Cube3.cornIdxOnCube[i]);
            this.swap(cubeArr, Cube3.cornIdxOnCube[1], Cube3.cornIdxOnCube[((i / 3) | 0) * 3 + (i + 1) % 3]);
            this.swap(cubeArr, Cube3.cornIdxOnCube[2], Cube3.cornIdxOnCube[((i / 3) | 0) * 3 + (i + 2) % 3]);
        }
        // else if (code > '0' && code < '6') {
        //     let i = parseInt(code);
        //     this.swap(cubeArr, 4, 4 + 9 * i);
        // }
    }

    invCycleCube(cube, bfCode) {
        let cubeArr = cube.split('');
        bfCode.split('').reverse().forEach(c => {
            this.cycleCube(cubeArr, c);
        });
        return cubeArr.join('');
    }

    genCube(bfCode) {
        let cubeArr = 'uuuuuuuuurrrrrrrrrfffffffffdddddddddlllllllllbbbbbbbbb'.split('');
        for (let bfCodeIdx = bfCode.length - 1; bfCodeIdx >= 0; bfCodeIdx--) {
            let c = bfCode[bfCodeIdx];
            if (c === '+' || c === '-') {
                const c1 = bfCode[--bfCodeIdx];
                if (this.isEdge(c1)) {
                    this.cycleCube(cubeArr, Cube3.edgeLetterScheme[this.edgeIdx[c1] * 2 + 1]);
                    this.cycleCube(cubeArr, c1);
                } else if (c === '+') {
                    this.cycleCube(cubeArr, Cube3.cornLetterScheme[this.cornIdx[c1] * 3 + 1]);
                    this.cycleCube(cubeArr, c1);
                } else {
                    this.cycleCube(cubeArr, Cube3.cornLetterScheme[this.cornIdx[c1] * 3 + 2]);
                    this.cycleCube(cubeArr, c1);
                }
            } else {
                this.cycleCube(cubeArr, c);
            }
        }
        return cubeArr.join('');
    }

    updateAlg(text) {
        this.algs = {};
        text.split(/\r?\n/).forEach(line => {
            let eqIdx = line.indexOf('=');
            if (eqIdx === -1) return;
            let key = line.substring(0, eqIdx).trim();
            let alg = line.substring(eqIdx + 1).trim();
            this.algs[key] = alg;
        });
    }

    updateMem(text) {
        this.memDict = {};
        text.split(/\r?\n/).forEach(line => {
            let eqIdx = line.indexOf('=');
            if (eqIdx === -1) return;
            let key = line.substring(0, eqIdx).trim();
            this.memDict[key] = line.substring(eqIdx + 1).trim();
        });
    }

    updateStats(text) {
        text.split(';').forEach(item => {
            if (item.trim().length === 0) return;
            try {
                const [key, value] = item.split('=');
                const [times, mark] = value.split(',').map(Number);
                if (Number.isInteger(times) && times >= 0 && Number.isInteger(mark) && mark >= 0 && this.stats[key]) {
                    [this.stats[key].times, this.stats[key].mark] = [times, mark];
                }
            } catch (e) {
                console.error(`Error parsing stats line: ${item}`, e);
            }
        });
    }

    sampleDict(dict, rd) {
        for (let key in dict) {
            rd -= dict[key];
            if (rd < 0) {
                return key;
            }
        }
    }

    getWeight(key) {
        const stat = this.stats[key];
        if (!stat) return 0;
        return stat.times === 0 ? (stat.mark === 0 ? this.lr : 1) : Math.pow(stat.times, -2 / (1 + stat.mark * this.falloff));
    }

    genCode(cat, maxCount, resList) {
        if (cat.endsWith('3')) {
            let indices = [], ocStart = cat[0] === 'e' ? 0 : 12, ocCount = cat[0] === 'e' ? 12 : 8, gap = cat[0] === 'e' ? 2 : 3;
            let idxPool = [...Array(ocCount).keys()].filter(ocIdx => !this.occupied[ocIdx + ocStart]);
            for (let idx = 0; idx < 3; idx++) {
                let poolIdx = Math.random() * idxPool.length | 0;
                indices.push(idxPool[poolIdx]);
                this.occupied[idxPool[poolIdx] + ocStart] = true;
                idxPool.splice(poolIdx, 1);
            }
            indices.sort((a, b) => a - b);
            let codePool = cat[0] === 'e' ? Cube3.edgeLetterScheme : Cube3.cornLetterScheme;
            const codes = [codePool[indices[0] * gap], codePool[indices[1] * gap + (Math.random() * gap | 0)], codePool[indices[2] * gap + (Math.random() * gap | 0)]];
            resList.push(`${codes[0]}${codes[1]}${codes[2]}${codes[0]}`);
        }
        else {
            let weights = {};
            let tmpAlgs = [];
            let sumWeight = 0.0;
            for (let key in this.stats) {
                if (this.stats[key].cat === cat) {
                    sumWeight += weights[key] = this.getWeight(key);
                }
            }
            for (let i = 0; i < maxCount; i++) {
                let keysToDel = Object.keys(weights).filter(key => key.split('').some(k => this.fullIdx[k] !== undefined && this.occupied[this.fullIdx[k]]));
                keysToDel.forEach(key => {
                    sumWeight -= weights[key];
                    delete weights[key];
                });
                if (Object.keys(weights).length === 0) break;
                let key = this.sampleDict(weights, Math.random() * sumWeight);
                tmpAlgs.push(key);
                key.split('').forEach(k => this.fullIdx[k] !== undefined && (this.occupied[this.fullIdx[k]] = true));
            }
            for (let i = 0; i < tmpAlgs.length; i++) {
                let j = Math.floor(Math.random() * (tmpAlgs.length - i));
                resList.push(tmpAlgs[j]);
                tmpAlgs[j] = tmpAlgs[tmpAlgs.length - i - 1];
            }
        }
    }

    addTimes() {
        this.eKeys.concat(this.cKeys).forEach(key => {
            let stat = this.stats[key];
            if (!stat) return;
            stat.times++;
        });
    }

    addMark(keys) {
        keys.forEach(key => {
            let stat = this.stats[key];
            if (!stat) return;
            stat.mark++;
        });
    }

    removeMark(keys) {
        keys.forEach(key => {
            let stat = this.stats[key];
            if (!stat) return;
            stat.times = 1;
            stat.mark = 0;
        });
    }

    getAlgInfo(key) {
        const mem = this.memDict[key.toUpperCase()] || '*';
        const alg = this.algs[key] || '*';
        const stat = this.stats[key] ? `${this.stats[key].mark}/${this.stats[key].times} [${this.getWeight(key).toFixed(3)}]` : '*';
        return [mem, alg, stat];
    }

    randPerm(n) {
        this.randPermParity = 0;
        let arr = Array.from({ length: n }, (_, i) => i);
        for (let i = n - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            if (i != j) {
                [arr[i], arr[j]] = [arr[j], arr[i]];
                this.randPermParity ^= 1;
            }
        }
        return arr;
    }

    swap(arr, i, j) {
        let temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }

    newScramble() {
        this.eKeys.length = 0;
        this.cKeys.length = 0;
        this.displayKeys.length = 0;
        this.hasSpecialCategories = false;
        let cube;
        if (this.mode === 'r' || this.mode === 'w') {
            cube = min2phase.randomCube().toLowerCase();
        }
        else {
            let modeRC = this.mode === "rc";
            let scrambleE = this.mode === 'ec' || this.mode === 'e' || this.mode === 'rc';
            let scrambleC = this.mode === 'ec' || this.mode === 'c' || this.mode === 'rc';
            this.occupied = Array(20).fill(false);
            this.occupied[0] = this.occupied[12] = true;
            let sfPar = [];
            let hasPar = 0;
            if (this.usePar && scrambleE && scrambleC && Math.random() < 0.5) {
                hasPar = 1;
                this.genCode('par', 1, sfPar);
            }
            if (scrambleE && !modeRC) {
                let sfE = [];
                if (Math.random() < this.ftWeight) {
                    this.genCode('e+', 1, sfE); // E Flip
                }
                if (Math.random() < this.flWeight) {
                    this.genCode('e3', 1, sfE); // Float E3
                }
                this.genCode('e', 999, this.eKeys); // Normal E3, must be last
                this.eKeys.push(...sfE);
                this.displayKeys.push(...this.eKeys);
                this.hasSpecialCategories ||= sfE.length > 0;
            }
            if (scrambleC) {
                let sfC = [], sfTwist = [];
                if (Math.random() < this.flWeight) {
                    this.genCode('c3', 1, sfC); // Float C3
                }
                if (Math.random() < this.ft2Weight) {
                    this.genCode('c++', 1, sfTwist); // C 3-Twist
                } else if (Math.random() < this.ftWeight) {
                    this.genCode('c+', 1, sfTwist); // C 2-Twist
                }
                this.genCode('c', 999, this.cKeys); // Normal C3, must be last
                this.displayKeys.push(...this.cKeys);
                this.cKeys.push(...sfC, ...sfTwist);
                this.displayKeys.push(...sfC, ...sfPar, ...sfTwist);
                this.hasSpecialCategories ||= (sfC.length + sfTwist.length) > 0;
            }
            cube = this.genCube(this.displayKeys.join(''));
            if (modeRC) {
                let eoSum = 0, ep = this.randPerm(12), eo = Array.from({ length: 12 }, _ => { const o = Math.random() * 2 | 0; eoSum ^= o; return o; });
                eo[0] ^= eoSum;
                let cubeArr = cube.split('');
                for (let i = 0; i < 12; i++) {
                    cubeArr[Cube3.edgeIdxOnCube[i * 2]] = Cube3.eFaces[ep[i]][eo[i]];
                    cubeArr[Cube3.edgeIdxOnCube[i * 2 + 1]] = Cube3.eFaces[ep[i]][eo[i] ^ 1];
                }
                if (this.randPermParity != hasPar) {
                    this.swap(cubeArr, Cube3.edgeIdxOnCube[0], Cube3.edgeIdxOnCube[6]);
                    this.swap(cubeArr, Cube3.edgeIdxOnCube[1], Cube3.edgeIdxOnCube[7]);
                }
                cube = cubeArr.join('');
                this.eKeys.length = 0;
                this.displayKeys = this.displayKeys.filter(key => !key.split('').some(k => this.isEdge(k)));
            }
        }
        let scr = min2phase.scramble(cube);
        return { cube, scr };
    }
}

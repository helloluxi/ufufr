
class Cube3 {
    static edgeIdxOnCube = [7, 19, 3, 37, 1, 46, 5, 10, 28, 25, 30, 43, 34, 52, 32, 16, 23, 12, 21, 41, 50, 39, 48, 14];
    static cornIdxOnCube = [8, 9, 20, 6, 18, 38, 0, 36, 47, 2, 45, 11, 27, 44, 24, 33, 53, 42, 35, 17, 51, 29, 26, 15];
    static edgeCode = 'ABCDEFGHIJKLMNOPQRSTWXYZ';
    static cornCode = 'ahqcbtedwgfzilsknxmpyojr';
    static eFaces = ['uf', 'ul', 'ub', 'ur', 'df', 'dl', 'db', 'dr', 'fr', 'fl', 'bl', 'br'];
    static bfSuffix1 = ['', ' Rw', ' Rw2', ' Rw\'', ' Fw', ' Fw\''];
    static bfSuffix2 = ['', ' Uw', ' Uw2', ' Uw\''];
    static sufCode1 = ['', 'JMFGQOYGjmf235', 'MFJFGOGYQYmfjf3252', 'FMJGYOQGfmj532', 'TIRGDKPGtir431', 'RITGPKDGrit134'];
    static sufCode2 = ['', 'GECQZWTQgec15421', 'EGCGQWQZTZegcg141252', 'CEGQTWZQceg12451'];
    static wcaOriMap = { 'u': 'd', 'd': 'u', 'r': 'f', 'f': 'r', 'l': 'b', 'b': 'l' };

    constructor() {
        // Cube constants
        this.edgeIdx = {};
        this.cornIdx = {};
        this.fullIdx = {};

        for (let i = 0; i < 24; i++) {
            this.fullIdx[Cube3.edgeCode[i]] = this.edgeIdx[Cube3.edgeCode[i]] = i >> 1;
            this.fullIdx[Cube3.cornCode[i]] = (this.cornIdx[Cube3.cornCode[i]] = (i / 3) | 0) + 12;
        }

        // Stats and training data
        this.stats = {};
        this.algs = {};
        this.codeDict = {};
        this.markedAlgKeys = [];
        this.ecCode = [];
        this.occupied = null;
        this.congrated = localStorage.getItem('bld.congrates') == '1';
        this.keysToPush = [];

        // Load settings
        const settingsStr = localStorage.getItem('bld.settings');
        let settings = {};
        if (settingsStr) {
            settings = JSON.parse(settingsStr);
        }
        this.mm = settings.mm || 0;
        this.learningRate = settings.learningRate || 0.1;
        this.falloff = settings.falloff || 1;
        this.mode = settings.mode || 'r';
        this.usePar = settings.usePar !== false;
        this.ft2Weight = settings.ft2Weight || 0;
        this.ftWeight = settings.ftWeight || 0;
        this.flWeight = settings.flWeight || 0;

        // Initialize stats
        this.initEmptyStats();
    }

    updateSettings(settings) {
        this.mm = settings.mm || this.mm;
        this.learningRate = settings.learningRate || this.learningRate;
        this.falloff = settings.falloff || this.falloff;
        this.mode = settings.mode || this.mode;
        this.usePar = settings.usePar || this.usePar;
        this.ft2Weight = settings.ft2Weight || this.ft2Weight;
        this.ftWeight = settings.ftWeight || this.ftWeight;
        this.flWeight = settings.flWeight || this.flWeight;
        localStorage.setItem('bld.settings', JSON.stringify({
            mm: this.mm,
            learningRate: this.learningRate,
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
            this.stats[key] = { times: 0, mark: 0, more: Math.random() < 0.04 ? this.mm : 0, cat: cat };
        };

        for (let c1 of Cube3.edgeCode.slice(2)) {
            for (let c2 of Cube3.edgeCode.slice(2)) {
                if (this.edgeIdx[c1] != this.edgeIdx[c2]) {
                    initStat(c1 + c2, 'e');
                }
            }
            for (let c2 of Cube3.cornCode.slice(3)) {
                initStat(c1 + c2, 'par');
            }
            if (Cube3.edgeCode[this.edgeIdx[c1] * 2] == c1) {
                initStat(c1 + '+', 'e+');
            }
        }
        for (let c1 of Cube3.cornCode.slice(3)) {
            for (let c2 of Cube3.cornCode.slice(3)) {
                if (this.cornIdx[c1] != this.cornIdx[c2]) {
                    initStat(c1 + c2, 'c');
                }
            }
        }
        for (let cIdx1 = 3; cIdx1 < 24; cIdx1 += 3) {
            const c1 = Cube3.cornCode[cIdx1];
            initStat(`${c1}+`, 'c+');
            initStat(`${c1}-`, 'c+');
            for (let cIdx2 = cIdx1 + 3; cIdx2 < 24; cIdx2 += 3) {
                const c2 = Cube3.cornCode[cIdx2];
                initStat(`${c1}+${c2}+`, 'c++');
                initStat(`${c1}-${c2}-`, 'c++');
            }
        }
    }

    cycleCube(cubeArr, code) {
        if (this.isUpper(code)) {
            let i = Cube3.edgeCode.indexOf(code);
            this.swap(cubeArr, Cube3.edgeIdxOnCube[0], Cube3.edgeIdxOnCube[i]);
            this.swap(cubeArr, Cube3.edgeIdxOnCube[1], Cube3.edgeIdxOnCube[i ^ 1]);
        } else if (code > 'a' && code <= 'z') {
            let i = Cube3.cornCode.indexOf(code);
            this.swap(cubeArr, Cube3.cornIdxOnCube[0], Cube3.cornIdxOnCube[i]);
            this.swap(cubeArr, Cube3.cornIdxOnCube[1], Cube3.cornIdxOnCube[((i / 3) | 0) * 3 + (i + 1) % 3]);
            this.swap(cubeArr, Cube3.cornIdxOnCube[2], Cube3.cornIdxOnCube[((i / 3) | 0) * 3 + (i + 2) % 3]);
        } else if (code > '0' && code < '6') {
            let i = parseInt(code);
            this.swap(cubeArr, 4 + 9 * 0, 4 + 9 * i); // 0 represents buffer position (U face)
        }
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
            if (c == '+' || c == '-') {
                const c1 = bfCode[--bfCodeIdx];
                if (this.isUpper(c1)) {
                    this.cycleCube(cubeArr, Cube3.edgeCode[this.edgeIdx[c1] * 2 + 1]);
                    this.cycleCube(cubeArr, c1);
                } else if (c == '+') {
                    this.cycleCube(cubeArr, Cube3.cornCode[this.cornIdx[c1] * 3 + 1]);
                    this.cycleCube(cubeArr, c1);
                } else {
                    this.cycleCube(cubeArr, Cube3.cornCode[this.cornIdx[c1] * 3 + 2]);
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
        this.markedAlgKeys = [];
        text.split(/\r?\n/).forEach(line => {
            let eqIdx = line.indexOf('=');
            if (eqIdx === -1) return;
            let key = line.substring(0, eqIdx).trim();
            let alg = line.substring(eqIdx + 1).trim();
            this.algs[key] = alg;
            if (alg.endsWith('!')) this.markedAlgKeys.push(key);
        });
    }

    updateMem(text) {
        this.codeDict = {};
        text.split(/\r?\n/).forEach(line => {
            let eqIdx = line.indexOf('=');
            if (eqIdx === -1) return;
            let key = line.substring(0, eqIdx).trim();
            this.codeDict[key] = line.substring(eqIdx + 1).trim();
        });
    }

    updateStats(text) {
        text.split(';').forEach(item => {
            if (item.trim().length == 0) return;
            try {
                const [key, value] = item.split('=');
                const [times, mark] = value.split(',').map(Number);
                if (Number.isInteger(times) && times >= 0 && Number.isInteger(mark) && mark >= 0) {
                    if (this.stats[key]) {
                        [this.stats[key].times, this.stats[key].mark] = [times, mark];
                    }
                }
            } catch (e) {
                console.error(`Error parsing stats line: ${item}`, e);
            }
        });
    }

    isNonPro(key) {
        return this.stats[key] && (this.stats[key].cat == 'e' || this.stats[key].cat == 'c');
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
        return stat.times == 0 ? this.learningRate : Math.pow(stat.times, -2 / (1 + (stat.mark + stat.more) * this.falloff));
    }

    genCode(cat, maxCount, code) {
        if (cat.endsWith('3')) {
            let indices = [], ocStart = cat[0] == 'e' ? 0 : 12, ocCount = cat[0] == 'e' ? 12 : 8, gap = cat[0] == 'e' ? 2 : 3;
            let idxPool = [...Array(ocCount).keys()].filter(ocIdx => !this.occupied[ocIdx + ocStart]);
            for (let idx = 0; idx < 3; idx++) {
                let poolIdx = Math.random() * idxPool.length | 0;
                indices.push(idxPool[poolIdx]);
                this.occupied[idxPool[poolIdx] + ocStart] = true;
                idxPool.splice(poolIdx, 1);
            }
            indices.sort((a, b) => a - b);
            let codePool = cat[0] == 'e' ? Cube3.edgeCode : Cube3.cornCode;
            const codes = [codePool[indices[0] * gap], codePool[indices[1] * gap + (Math.random() * gap | 0)], codePool[indices[2] * gap + (Math.random() * gap | 0)]];
            code.push(`${codes[0]}${codes[1]}${codes[2]}${codes[0]}`);
        }
        else {
            let weights = {};
            let tmpAlgs = [];
            let sumWeight = 0.0;
            for (let key in this.stats) {
                if (this.stats[key].cat == cat) {
                    sumWeight += weights[key] = this.getWeight(key);
                }
            }
            for (let i = 0; i < maxCount; i++) {
                let keysToDel = Object.keys(weights).filter(key => key.split('').some(k => this.fullIdx[k] !== undefined && this.occupied[this.fullIdx[k]]));
                keysToDel.forEach(key => {
                    sumWeight -= weights[key];
                    delete weights[key];
                });
                if (Object.keys(weights).length == 0) break;
                let key = this.sampleDict(weights, Math.random() * sumWeight);
                tmpAlgs.push(key);
                key.split('').forEach(k => this.fullIdx[k] !== undefined && (this.occupied[this.fullIdx[k]] = true));
            }
            for (let i = 0; i < tmpAlgs.length; i++) {
                let j = Math.floor(Math.random() * (tmpAlgs.length - i));
                code.push(tmpAlgs[j]);
                tmpAlgs[j] = tmpAlgs[tmpAlgs.length - i - 1];
            }
        }
    }

    clearKeysToPush() {
        this.keysToPush = [];
    }

    addTimes() {
        this.ecCode.forEach(key => {
            let stat = this.stats[key];
            if (!stat) return;
            stat.times++;
            this.keysToPush.push(key);
        });
    }

    addMark(keys) {
        keys.forEach(key => {
            let stat = this.stats[key];
            if (!stat) return;
            stat.mark++;
            this.keysToPush.push(key);
        });
    }

    removeMark(keys) {
        keys.forEach(key => {
            let stat = this.stats[key];
            if (!stat) return;
            stat.times = 0;
            stat.mark = 0;
            this.keysToPush.push(key);
        });
    }

    getAlgInfo(key) {
        const code = this.codeDict[key.toUpperCase()] || '*';
        const alg = this.algs[key] || '*';
        if (!this.stats[key]) return [code, alg, 'No stats'];
        return [
            code,
            alg,
            `${this.stats[key].mark}${this.stats[key].more > 0 ? `(+${this.stats[key].more})` : ''}/${this.stats[key].times} [${this.getWeight(key).toFixed(2)}]`
        ];
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

    isUpper(c) {
        return c >= 'A' && c <= 'Z';
    }

    swap(arr, i, j) {
        let temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }

    doCongrates() {
        const numToLearn = Object.keys(this.stats).filter(key => this.isNonPro(key) && this.stats[key].times == 0).length;
        if (numToLearn == 0 && !congrated) {
            congrated = true;
            localStorage.setItem('bld.congrates', '1');
            return true;
        }
        return false;
    }

    newScramble() {
        this.ecCode = [];
        let cube;
        if (this.mode == 'r' || this.mode == 'w') {
            cube = min2phase.randomCube().toLowerCase();
        }
        else {
            let randE = this.mode == "rc";
            let scrambleE = this.mode == 'ec' || this.mode == 'e' || this.mode == 'rc';
            let scrambleC = this.mode == 'ec' || this.mode == 'c' || this.mode == 'rc';
            this.occupied = Array(20).fill(false);
            this.occupied[0] = this.occupied[12] = true;
            let sf = [];
            let hasPar = 0;
            if (this.usePar && scrambleE && scrambleC && Math.random() < 0.5) {
                hasPar = 1;
                this.genCode('par', 1, sf);
            }
            if (scrambleE && !randE) {
                let sfE = [];
                if (Math.random() < this.ftWeight) {
                    this.genCode('e+', 1, sfE);
                }
                if (Math.random() < this.flWeight) {
                    this.genCode('e3', 1, sfE);
                }
                this.genCode('e', 999, this.ecCode);
                this.ecCode.push(...sfE);
            }
            if (scrambleC) {
                let sfC = [];
                if (Math.random() < this.flWeight) {
                    this.genCode('c3', 1, sfC);
                }
                if (Math.random() < this.ft2Weight) {
                    this.genCode('c++', 1, sf);
                } else if (Math.random() < this.ftWeight) {
                    this.genCode('c+', 1, sf);
                }
                this.genCode('c', 999, this.ecCode);
                this.ecCode.push(...sfC);
            }
            this.ecCode.push(...sf);
            cube = this.genCube(this.ecCode.join(''));
            if (randE) {
                let eoSum = 0, ep = this.randPerm(12), eo = Array.from({ length: 12 }, (_, i) => { const o = Math.random() * 2 | 0; eoSum ^= o; return o; });
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
                if (hasPar) { // Remove parity code
                    this.ecCode.splice(this.ecCode.length - sf.length, 1);
                }
            }
        }
        let scr = min2phase.scramble(cube);
        if (this.mode == 'w') {
            // Maybe not the same as WCA scramble, but still a uniformly random state
            const randSuffix1 = Math.random() * 6 | 0, randSuffix2 = Math.random() * 4 | 0;
            scr += Cube3.bfSuffix1[randSuffix1] + Cube3.bfSuffix2[randSuffix2];
            cube = this.invCycleCube(cube, Cube3.sufCode2[randSuffix2] + Cube3.sufCode1[randSuffix1]);
            // Map YuRf to WuGf
            cube = cube.split('').map(c => Cube3.wcaOriMap[c] || c).join('');
        }
        return { cube, scr };
    }
}

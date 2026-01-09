# Lu Timer (3x3x3 Blindfolded Trainer)

[![en](https://img.shields.io/badge/lang-English-blue.svg)](README.md)
[![简体中文](https://img.shields.io/badge/lang-简体中文-red.svg)](README.cn.md)

A specialized web-based training application for 3x3x3 Rubik's Cube blindfolded solving, implementing an adaptive practice methodology that prioritizes weak cases for more efficient learning.

This project is more like a codebase than a polished product. I encourage you to read through the code, understand the underlying principles, and build your own version tailored to your specific training needs.

## Core Philosophy

**TL;DR:** Simulating competition ≠ efficient training, weak cases should appear more often.

In competition, scrambles are truly random—every case has equal probability (yes I know it will be slightly different based on cycle break strategies). However, this randomness is inefficient for training. Let's say if you've mastered 800 out of 818 cases (instant recall, flawless execution) but still struggle with 18 specific cases (slow recall or occasional errors), random scrambles waste your time repeatedly practicing cases you've already mastered. Occasional practice with fully random scrambles is still beneficial.

**The Key Insight:** Adaptive frequency training is more efficient. Cases you struggle with should appear more frequently in practice than cases you've mastered. This tool implements this philosophy by allowing you to mark difficult cases, which then automatically appear with higher frequency in subsequent scrambles. This philosophy was inspired by the touch typing training website [keybr.com](https://www.keybr.com/), as well as general principles of deliberate practice used by athletes, musicians, and surgeons.

## How It Works

The training algorithm uses a weighted sampling system:

- **Learned cases** : `times^(-2/(1 + mark × falloff))`
- **New cases** : Learning rate in your settings

The choice of weight function is more like a heuristic than a rigorously tested formula, so feel free to tweak to suit your learning style.

## Getting Started

### Installation

1. **Fork this repository** - This is highly recommended as you'll want to do version control and data management (Contributions from the open-source community are also welcome to make accessible improvements!)
2. Clone your fork to your local machine and use locally / on your Github pages / on your own web server (with your favorite data syncing backend!)

### Customization (Highly Recommended)

Before using this tool extensively, customize it to match your solving style:

#### 1. Letter Scheme & Buffer ([cube3.js](cube3.js))

Edit the letter schemes and buffer positions to match your personal system:

```javascript 
// Lines 7-25 in cube3.js

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
```

If you would prefer capital letters for corners instead, do not forget to swap the `isEdge` and `isCorner` functions.

#### 2. Color Mapping ([ufufr.js](ufufr.js))

Customize cube colors to match your color scheme preferences:

```javascript
// Lines 20-27 in ufufr.js
this.colorMapping = {
    'd': '#FFFFFF', // White (Down)
    'u': '#FFFF00', // Yellow (Up)
    'f': '#FF0000', // Red (Front)
    'b': '#FFA500', // Orange (Back)
    'l': '#0000FF', // Blue (Left)
    'r': '#00FF00'  // Green (Right)
};
```

#### 3. Memo Words ([mem.txt](mem.txt))

Fill in your memorization words/images for each letter pair.

#### 4. Algorithms ([alg.txt](alg.txt))

Add your algorithms for each case.

## Usage Guide

### Using the Timer

- **Start Timer**: Long-press (hold) anywhere on the cube display until it turns green
- **Stop Timer**: Tap the cube display while timer is running
- The timer automatically resets when you generate a new scramble

### Marking System

When you mark a case (by clicking its button):
- The button changes appearance (highlighted, shows mark count on hover)
- That case will appear more frequently in future scrambles
- The weight function increases: higher marks = higher probability
- Statistics are automatically saved to browser localStorage

**Important Note**: Some cases cannot be marked:
- **Floating 3-cycles**: Cases generated as floating buffer conflicts
- **Parity**: Parity when there is cycle break or flip/twist
- **Random Mode**

### Mini Terminal

The app includes a command-line interface for advanced operations. Access it by:
- Double-clicking/double-tapping the cube display
- Or simply start typing (it will auto-open)

| Command | Description | Example |
|---------|-------------|---------|
| `.KEY` | Look up info for a specific case | `.CG` shows memo, alg, and stats for CG |
| `+KEY1 KEY2 ...` | Manually add marks to cases | `+CG c+g+` marks CG and c+g+ |
| `-KEY1 KEY2 ...` | Remove marks and reset case | `-CG` resets CG to unmarked state |
| `c` | Copy time, scramble, timestamp to clipboard | `c`  |
| `d MODE` | Change training mode | `d e` switches to edge-only mode |
| `t` | Show top 7 most marked cases | `t` |
| `u` | Reload service worker | `u` |

Press `Enter` to execute commands. Press `↑` (up arrow) to recall the last command.

Modes:
- `r`: Random
- `e`: Edges only
- `c`: Corners only
- `ec`: Controlled Edges + Controlled corners 
- `rc`: Random edges + Controlled corners

### Settings Panel

Double-click the title bar or use backtick key to open settings:

- **Mode**: Select training mode (Random, Edge, Corner, etc.)
- **Parity**: Toggle whether parity cases should be included
- **Learning Rate**: Controls probability for new cases
- **Fall Off Rate**: How quickly mark importance decays with practice (higher = slower decay for marked cases)
- **Flip/Twist**: Probability of flip/twist-only cases (0-1)
- **3-Twist**: Probability of 3-twist corner cases (0-1)
- **Float**: Probability of floating buffer cases (0-1)

### Keyboard Shortcuts

- `Tab`: Generate next scramble
- `1`-`9`: Toggle mark on corresponding button (left to right)
- `↑` (up arrow): In terminal, recall last command
- `Enter`: In terminal, execute command
- `Esc`: Close terminal or settings panel

### Data Persistence

All data is stored in browser localStorage:
- **Seen Tutorial**: Whether you've seen the tutorial (`bld.seenTutorial`)
- **Stats**: Practice counts and marks for each case (`bld.stats`)
- **Settings**: User preferences (`bld.settings`)
- **Static Files**: `alg.txt` and `mem.txt` are loaded from web server

No phone-home are used. Your data is yours.

## Philosophy: Build Your Own

**This tool embodies a practice philosophy, not a one-size-fits-all solution.** I strongly encourage you to understand the principles and implement your own version tailored to your specific needs.

Every BLDer has unique preferences: different letter schemes, different memo systems, different weak spots, different advanced techniques like LTCT. The most effective training tool is one you've customized yourself.

## Maintenance & Support

This repository is **not actively maintained** as I am not an active competitor. It's a personal training tool shared publicly for educational purposes.

- **Public Demo Bug fixes**: Yes
- **Feature requests**: No, please fork and implement your own features
- **Donate**: Buy me a coffee if you meet me in a WCA competition :)

I personally use a customized version of this tool hosted on my own private server and haven't tested the public demo extensively.
The best way to use this project is to fork it and manage your own version control and data.

## Acknowledgements

- **Shuang Chen**: For the excellent [`min2phase.js`](https://github.com/cs0x7f/min2phase.js) library. This tool would not be possible without this robust Rubik's Cube solving implementation.
- **NCSU Cubepack**: For encouraging me to compete again in Mar 2025 after 6 yrs' retirement from cubing.

## License

Copyright (C) 2025-2026 Xi Lu

This project is licensed under the **GNU General Public License v3.0 (GPLv3)**.

This means:
- ✅ You are free to use, modify, and distribute this software
- ✅ You can use it for commercial purposes
- ⚠️ If you distribute modified versions, you must:
  - Also license them under GPLv3
  - Make your source code available
  - Document your changes
- ⚠️ This software comes with NO WARRANTY

See the [LICENSE](LICENSE) file for the complete license text.

---

**Happy BLDing!**

Xi Lu (2018LUXI01)

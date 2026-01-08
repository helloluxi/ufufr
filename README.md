# Lu Timer (3x3x3 Blindfolded Trainer)

A specialized web-based training application for 3x3x3 Rubik's Cube blindfolded solving, implementing an adaptive practice methodology that prioritizes weak cases for more efficient learning.

## Core Philosophy

**TL;DR:** Simulating competition ≠ efficient training, weak cases should appear more often.

In competition, scrambles are truly random—every case has equal probability (yes I know it will be slightly different based on cycle break strategies). However, this randomness is inefficient for training. Let's say if you've mastered 800 out of 818 cases (instant recall, flawless execution) but still struggle with 18 specific cases (slow recall or occasional errors), random scrambles waste your time repeatedly practicing cases you've already mastered. Occasional practice with fully random scrambles is still beneficial.

**The Key Insight:** Adaptive frequency training is more efficient. Cases you struggle with should appear more frequently in practice than cases you've mastered. This tool implements this philosophy by allowing you to mark difficult cases, which then automatically appear with higher frequency in subsequent scrambles. This philosophy was inspired by the touch typing training website [keybr.com](https://www.keybr.com/), as well as general principles of deliberate practice used by athletes, musicians, and surgeons.

## How It Works

The training algorithm uses a weighted sampling system:

- **Unmarked cases** you've practiced: Lower probability (proportional to `times^(-2/(1 + mark × falloff))`)
- **Marked cases**: Higher probability based on mark count and your learning rate settings
- **New cases** (never practiced): Moderate to high probability depending on learning rate

The choice of weight function is more like a heuristic than a rigorously derived formula, so feel free to tweak to suit your learning style.

## Getting Started

### Installation

1. **Fork this repository** - This is highly recommended as you'll want to customize various settings
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

### Basic Operation

1. **View Scramble**: The app generates a scramble and displays it visually
2. **Practice**: Memorize and solve the cube (physically or mentally)
3. **Mark Difficult Cases**: If you struggled with a case, click its button to mark it
4. **Next Scramble**: Click "Next →" or press `Tab` to generate a new scramble
5. **Repeat**: The system automatically adjusts future scramble probabilities

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

**Important Note**: Some cases cannot be marked due to technical constraints:
- **Floating 3-cycles**: Cases generated as floating buffer conflicts
- **Parity cases**: When parity is involved with other special categories

This is intentional—these cases follow different generation rules and mixing them with normal weighted sampling would break the scramble generation algorithm.

### Mini Terminal

The app includes a command-line interface for advanced operations. Access it by:
- Double-clicking/double-tapping the cube display
- Or simply start typing (it will auto-open)

#### Terminal Commands

| Command | Description | Example |
|---------|-------------|---------|
| `.KEY` | Look up info for a specific case | `.BD` shows memo, alg, and stats for BD |
| `+KEY1 KEY2 ...` | Manually add marks to cases | `+BD CE` marks BD and CE |
| `-KEY1 KEY2 ...` | Remove marks and reset case | `-BD` resets BD to unmarked state |
| `t` | Show top 7 most marked cases | `t` |
| `c` | Copy last solve info to clipboard | `c` copies time, scramble, timestamp |
| `d MODE` | Change training mode | `d e` switches to edge-only mode |
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
- **Learning Rate**: Controls probability for new/marked cases (higher = faster learning)
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

## Technical Details

### Case Generation

The tool generates scrambles using a sophisticated algorithm:

1. **Normal 3-cycles**: Standard letter pairs
   - Selected by weighted sampling based on practice history
   - Cannot select targets that conflict with buffer or other targets in the same scramble

2. **Floating 3-cycles**: Targets that would normally conflict with buffer
   - Generated as 4-letter sequences
   - The first letter leaves buffer, enabling the 3-cycle, then returns to buffer
   - More complex to execute but tests advanced buffer-management skills

3. **Flip/Twist**: Orientation-only cases
   - `e+`: Edge flip (2 edges flipped)
   - `c+`: Corner twist (2 corners twisted)
   - `c++`: 3-twist (3 corners twisted)

4. **Parity**: Special odd-permutation cases
   - Generated when edge and corner modes are both active
   - Swaps one edge target with another to create odd parity

### Weight Function

The probability weight for each case is calculated as (search for `getWeight` in [cube3.js](cube3.js)):

```
weight = times^(-2 / (1 + mark × falloff))
```

Where:
- `times`: Number of times practiced
- `mark`: Number of times marked as difficult
- `falloff`: User-configured decay rate (default 1)

Special cases:
- Never practiced, unmarked: weight = `learningRate`
- Never practiced, marked: weight = 1
- More marks → higher weight → higher probability

### Data Persistence

All data is stored in browser localStorage:
- **Stats**: Practice counts and marks for each case (`bld.stats`)
- **Settings**: User preferences (`bld.settings`)
- **Static Files**: `alg.txt` and `mem.txt` are loaded from web server

No phone-home are used. Your data is yours.

## Development & Customization

### Project Structure

```
ufufr/
├── index.html          # Main HTML structure
├── cube.css            # Styling
├── ufufr.js            # Main app logic, UI, timer, storage (customize this!)
├── cube3.js            # Core algorithm: scramble generation, stats, weights (customize this!)
├── min2phase.js        # Two-phase algorithm for cube solving (by Shuang Chen)
├── mem.txt             # User's memo words (customize this!)
├── alg.txt             # User's algorithms (customize this!)
├── sw.js               # Service worker for offline capability
├── manifest.json       # PWA manifest
└── LICENSE             # GPLv3 License
```

## Philosophy: Build Your Own

**This tool embodies a practice philosophy, not a one-size-fits-all solution.** I strongly encourage you to understand the principles and implement your own version tailored to your specific needs. The code is intentionally readable—study it, learn from it, and build something better suited to your training style.

Every speedcuber has unique preferences: different letter schemes, different memo systems, different weak spots, different advanced techniques like LTCT. The most effective training tool is one you've customized yourself.

## Maintenance & Support

This repository is **not actively maintained** as I am not an active competitor. It's a personal training tool shared publicly for educational purposes.

- **Public Demo Bug fixes**: Yes
- **Feature requests**: No, please fork and implement your own features
- **Donate**: Buy me a coffee if you meet me in a WCA competition :)

I personally use a customized version of this tool hosted on my own private server and haven't tested the public demo extensively.
The best way to use this project is to fork it and make it your own.

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

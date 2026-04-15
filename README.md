# BLD Doctor (3x3x3 Blindfolded Trainer Website)

[![en](https://img.shields.io/badge/lang-English-blue.svg)](README.md)
[![简体中文](https://img.shields.io/badge/lang-简体中文-red.svg)](README.cn.md)

A specialized web-based training application for 3x3x3 Rubik's Cube blindfolded solving, implementing an adaptive practice methodology that prioritizes weak cases for more efficient learning.

This project is more like a codebase than a polished product. I encourage you to read through the code, understand the underlying principles, and build your own version tailored to your specific training needs.

## Core Philosophy

**TL;DR:** Simulating competition ≠ efficient training, weak cases should appear more often.

In competition, scrambles are truly random—every case has equal probability (yes I know it will be slightly different based on cycle break strategies). However, this randomness is inefficient for training. If you've mastered 800 out of 818 cases (instant recall, flawless execution) but still struggle with 18 specific cases (slow recall or occasional errors), random scrambles waste your time repeatedly practicing cases you've already mastered. Occasional practice with fully random scrambles is still beneficial.

**The Key Insight:** Adaptive frequency training is more efficient. Cases you struggle with should appear more frequently in practice than cases you've mastered. This tool implements this philosophy by allowing you to mark difficult cases, which then automatically appear with higher frequency in subsequent scrambles. This philosophy was inspired by the touch typing training website [keybr.com](https://www.keybr.com/), as well as general principles of deliberate practice used by athletes, musicians, and surgeons.

## How It Works

The training algorithm uses a weighted sampling system:

- **Learned cases** : `times^(-2/(1 + mark))`
- **New cases** : Learning rate in your settings

The choice of weight function is more like a heuristic than a rigorously tested formula, so feel free to tweak to suit your learning style.

## Getting Started

### Installation

1. **Fork this repository** - Highly recommended for version control and data management.
2. Clone your fork to your local machine and use locally / on your Github pages / on your own web server (with your favorite data syncing backend!)

### Customization (Optional)

Both [alg.txt](alg.txt) and mem.txt use `KEY=VALUE` format — one entry per line, blank lines and lines without `=` are ignored:

```txt
CF=coffee
DN=donut
```

- **mem.txt** — memo words/images for each letter pair
- **alg.txt** — algorithms for each case (stored and shown verbatim)

You can also edit individual entries via the terminal (`a KEY=VAL`, `m KEY=VAL`) without re-uploading the whole file.

Other settings like letter schemes, buffer positions, and color mappings can be configured in the settings panel.

## Usage Guide

### Using the Timer

- **Start Timer**: Long-press the cube display or hold the spacebar until it turns green
- **Stop Timer**: Tap the cube display or press any key while the timer is running

### Case Statistics Format

When querying a case using the `.KEY` command in the terminal, the statistics shown are:
- **Format**: `mark/times [weight]`
  - `mark`: Number of times you've marked this case as difficult
  - `times`: Total number of times you've practiced this case
  - `weight`: Current sampling weight (higher = more likely to appear)

Example: `3/45 [0.012]` means marked 3 times, practiced 45 times, with weight 0.012

The same statistics are displayed in the settings panel:
- `xxx/818`: Number of unique cases you've seen
- `Freq`: Average practice frequency per case
- `Marks`: Number of marked cases / Total mark count

### Marking System

When you mark a case (by clicking its button):
- The button changes appearance (highlighted, shows mark count on hover)
- That case will appear more frequently in future scrambles
- The weight function increases: higher marks = higher probability
- Statistics are automatically saved to browser localStorage

Some cases cannot be marked:
- Floating 3-cycles
- Parity when there is cycle break or flip/twist
- Random Mode

### Case Button Badge

The buttons in the practice interface use colored corner badges to show case status:

- **Orange badge**: Cases that appeared in the current scramble
- **Green badge**: Cases you've marked for practice (hover to see mark count)

These badges help you quickly identify which cases you need to practice and which are in your current scramble.

### Mini Terminal

The app includes a command-line interface for advanced operations. Access it by:
- Double-clicking/double-tapping the cube display
- Or start typing a letter, `.`, `+`, `-`, or `↑` (it will auto-open)

`h` opens the terminal help panel in the tutorial (currently panel 4).

| Command | Description | Example |
|---------|-------------|---------|
| `.KEY` | Look up info for a specific case | `.CG` shows memo, alg, and stats for CG |
| `+KEY1 KEY2 ...` | Manually add marks to cases | `+CG c+g+` marks CG and c+g+ |
| `-KEY1 KEY2 ...` | Remove marks and reset case | `-CG` resets CG to unmarked state |
| `m KEY=VAL` | Save/update one memo entry | `m CG=coffee` |
| `a KEY=VAL` | Save/update one algorithm entry | `a CG=[R U R',D]` |
| `a KEY=VAL&` | Save alg and auto-create reverse pair for commutators | `a CG=[R U R',D]&` |
| `c NUM` | Copy latest `NUM` solves (time, scramble, timestamp), default = 1 | `c 5` |
| `d MODE` | Change training mode | `d e` switches to edge-only mode |
| `t CAT` | Show top 7 most marked cases, optionally filtered by category | `t par` |
| `e` / `i` | Open Files panel (export/import UI) | `e` |
| `h` | Open terminal help panel in tutorial | `h` |
| `u` | Force reload service worker | `u` |

Press `Enter` to execute commands. Press `↑` (up arrow) to recall the last command.

Modes:
- `r`: Random
- `e`: Edges only
- `c`: Corners only
- `ec`: Controlled Edges + Controlled corners 
- `rc`: Random edges + Controlled corners

### Keyboard Shortcuts

- `Tab`: Generate next scramble.
- `` ` ``: Open/close settings panel
- `1`-`9`: Toggle mark on corresponding button (left to right)
- `↑` (up arrow): In terminal, recall last command
- `Enter`: In terminal, execute command
- `Esc`: Close terminal or settings panel

### Data Persistence

All data is stored in browser localStorage:
- **Seen Tutorial**: Whether you've seen the tutorial (`bld.seenTutorial`)
- **Stats**: Practice counts and marks for each case (`bld.stats`)
- **Settings**: User preferences (`bld.settings`)
- **Algs & Memo**: Uploaded/edited data (`bld.alg`, `bld.mem`)
- **Solve History**: Rolling latest 100 solves (`bld.history`)

No data is sent anywhere. Your data stays on your device.

### Offline Support & Service Worker

This app uses a service worker to enable offline functionality. Once loaded, the app can work without an internet connection.

- Cached files are updated automatically when you reload the app with internet connection
- Use the `u` command in the terminal to manually trigger a cache update
- The service worker cleans up old caches automatically to save space

### Progressive Web App (PWA)

This application can be installed as a Progressive Web App:

- **On Desktop**: Click the install icon in your browser's address bar
- **On Mobile**: Use "Add to Home Screen" from your browser menu
- Once installed, it works offline and feels like a native app
- Updates are managed by the service worker

## Maintenance & Support

This repository is **not actively maintained** as I am not an active competitor. It's a personal training tool shared publicly for educational purposes.

- **Public Demo Bug fixes**: Yes
- **Feature requests**: No, please fork and implement your own features
- **Donate**: Buy me a coffee if you meet me in a WCA competition :)

I personally use a customized version hosted on a private server — the public demo is not extensively tested.

## Acknowledgements

- **Shuang Chen**: For the excellent [`min2phase.js`](https://github.com/cs0x7f/min2phase.js) library. This tool would not be possible without this robust Rubik's Cube solving implementation.
- **NCSU Cubepack**: For encouraging me to compete again in Mar 2025 after 6 yrs' retirement from cubing.

## License

Copyright (C) 2025-2026 Xi Lu

This project is licensed under the **GNU General Public License v3.0 (GPLv3)**, see [LICENSE](LICENSE).

---

**Happy BLDing!**

Xi Lu (2018LUXI01)

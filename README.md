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

- **Learned cases** : `(mark ? markBoost : 1) × times^(-2/(1 + mark))`
- **New cases** : Learning rate in your settings

The choice of weight function is more like a heuristic than a rigorously tested formula, so feel free to tweak to suit your learning style.

## Getting Started

### Installation

1. **Fork this repository** - This is highly recommended as you'll want to do version control and data management (Contributions from the open-source community are also welcome to make accessible improvements!)
2. Clone your fork to your local machine and use locally / on your Github pages / on your own web server (with your favorite data syncing backend!)

### Customization (Optional)

You can customize the following files to personalize your training experience:

#### Memo Words ([mem.txt](mem.txt))

Fill in your memorization words/images for each letter pair.

#### Algorithms ([alg.txt](alg.txt))

Add your algorithms for each case.

Other settings like letter schemes, buffer positions, and color mappings can be configured directly through the settings panel in the app.

## Usage Guide

### Using the Timer

- **Start Timer**: Long-press (hold) anywhere or press the spacebar on the cube display until it turns green
- **Stop Timer**: Tap the cube display while timer is running or press any key to stop

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
- Or simply start typing (it will auto-open)

| Command | Description | Example |
|---------|-------------|---------|
| `.KEY` | Look up info for a specific case | `.CG` shows memo, alg, and stats for CG |
| `+KEY1 KEY2 ...` | Manually add marks to cases | `+CG c+g+` marks CG and c+g+ |
| `-KEY1 KEY2 ...` | Remove marks and reset case | `-CG` resets CG to unmarked state |
| `c` | Copy time, scramble, timestamp to clipboard | `c`  |
| `d MODE` | Change training mode | `d e` switches to edge-only mode |
| `t` | Show top 7 most marked cases | `t` |
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
- **Static Files**: `alg.txt` and `mem.txt` are loaded from web server

No phone-home are used. Your data is yours.

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

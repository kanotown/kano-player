# Kano Player - A scalable media player

A lightweight (~38KB total), vanilla JavaScript HTML5 video player with custom controls, zoom functionality, and caption support. No dependencies or build process required.

## Demo

**[Live Demo](https://kanotown.github.io/kano-player/)**  
_See the player in action with sample video and captions_

## Features

- **🪶 Lightweight**: ~38KB minified - Pure vanilla JavaScript, no frameworks or dependencies
- **⚡ Simple Setup**: No installation or build process needed
- **🎮 Custom Video Controls**: Play/pause, seek, volume, playback speed (0.8x - 2.0x)
- **🔍 Zoom & Pan**: Mouse wheel zoom up to 5x with drag-to-pan functionality
- **📺 Fullscreen Support**: Cross-browser fullscreen with proper coordinate handling
- **📐 Dynamic Aspect Ratio**: Automatically adapts to any video aspect ratio (16:9, 4:3, 9:16, etc.)
- **💬 Caption System**: Rich caption support with customizable styling
- **📱 Responsive Design**: Adaptive layout for different screen sizes
- **⌨️ Keyboard Shortcuts**: Space (play/pause), arrows (seek/volume), F (fullscreen), M (mute)

## Quick Start

1. **Download** either version:

   - [`kanoplayer.js`](js/kanoplayer.js) (~58KB - development version with comments)
   - [`kanoplayer.min.js`](js/kanoplayer.min.js) (~38KB - minified production version)

2. **Create an HTML file** with your video:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>My Video Player</title>
  </head>
  <body>
    <video src="your-video.mp4" playsinline></video>
    <canvas style="width: 100%"></canvas>
    <script src="kanoplayer.min.js"></script>
  </body>
</html>
```

3. **Open in browser**

The player auto-detects video and canvas elements and works with default settings.

## Configuration (Optional)

All configuration is optional - the player works without any JavaScript variables defined.

### Captions

To add captions, define the `captions` array in `index.html`:

```javascript
const captions = [
  {
    startTime: 0,
    endTime: 5,
    text: "Your caption text",
    fontSize: 50, // Default: 20
    bold: true, // Optional
    align: "center", // Default: "center" (left, center, right)
    positionX: 0.5, // Default: 0.5 (0.0 = left, 1.0 = right)
    positionY: 0.8, // Default: 0.5 (0.0 = top, 1.0 = bottom)
    textColor: "white", // Default: "white"
    strokeColor: "#555", // Default: "black"
    strokeWidth: 2, // Default: 0 (no outline)
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Optional
  },
];
```

**Caption Defaults**: All properties except `startTime`, `endTime`, and `text` are optional. Missing properties use these defaults:

- `fontSize`: 20
- `align`: "center"
- `positionX`: 0.5 (center)
- `positionY`: 0.5 (center)
- `textColor`: "white"
- `strokeColor`: "black"
- `strokeWidth`: 0 (no outline)
- `backgroundColor`: none (transparent)

### Debug Mode

To enable debug mode (shows time and coordinate information), define:

```javascript
const debug = true; // Default is false if not defined
```

### Minimal Setup

The simplest working HTML file requires only:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Kano Player - Minimal Setup</title>
  </head>
  <body>
    <video src="./penguin.mov" playsinline></video>
    <canvas style="width: 100%"></canvas>
    <script src="js/kanoplayer.min.js"></script>
  </body>
</html>
```

**Flexible element selection:**

- Uses `id="myVideo"` and `id="myCanvas"` if available
- Automatically falls back to first `<video>` and `<canvas>` elements found
- No specific IDs required!

## Browser Support

- Chrome/Chromium 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## Why Kano Player?

### 🚀 Performance First

- **Tiny Footprint**: **~38KB total** (HTML + minified JS) - smaller than most alternatives
- **Pure Vanilla JS**: No React, Vue, or jQuery bloat
- **Zero Dependencies**: No external libraries, CDNs, or frameworks to load
- **Instant Startup**: Ready in milliseconds, no framework initialization

### 💡 Developer Friendly

- **Drop-in Ready**: Copy 2 files, done. No npm, webpack, or build process
- **Zero Configuration**: Works without any setup or JavaScript variables
- **Flexible Elements**: Auto-detects video/canvas elements, no specific IDs required
- **Modern ES6+**: Clean, readable code using latest JavaScript efficiently

### 📊 Size Comparison

| Player Type     | Bundle Size | Dependencies | Setup            |
| --------------- | ----------- | ------------ | ---------------- |
| Popular players | 50-300KB+   | Varies       | CDN or npm       |
| **Kano Player** | **~38KB**   | **None**     | **Copy & paste** |

## File Structure

```
kano-player/
├── index.html          # Full-featured example (~2KB)
├── index-min.html      # Minimal setup (300 bytes!)
├── js/
│   ├── kanoplayer.js     # Development version (~58KB)
│   └── kanoplayer.min.js # Minified version (~38KB)
└── README.md
```

**Total footprint: ~38KB** (excluding video files)

### 🎯 True Minimal Example

**Just 11 lines of HTML** for a complete video player:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Kano Player - Minimal Setup</title>
  </head>
  <body>
    <video src="./penguin.mov" playsinline></video>
    <canvas style="width: 100%"></canvas>
    <script src="js/kanoplayer.min.js"></script>
  </body>
</html>
```

**That's it!** Full video player with:

- ✅ Custom controls & UI
- ✅ Zoom & pan functionality
- ✅ Fullscreen support
- ✅ Keyboard shortcuts
- ✅ Responsive design
- ✅ Caption support

## Keyboard Shortcuts

| Key   | Action            |
| ----- | ----------------- |
| Space | Play/Pause        |
| ←     | Seek backward 10s |
| →     | Seek forward 10s  |
| ↑     | Volume up         |
| ↓     | Volume down       |
| M     | Toggle mute       |
| F     | Toggle fullscreen |

## Mouse Controls

- **Left Click**: Play/pause (on video area) or control buttons
- **Mouse Wheel**: Zoom in/out
- **Click & Drag**: Pan when zoomed in
- **Seek Bar**: Click to jump to time position

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Issues

If you encounter any bugs or have feature requests, please [open an issue](https://github.com/kanotown/kano-player/issues).

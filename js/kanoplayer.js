"use strict";

const KP = {
  // DOM elements
  elements: {
    video: null,
    canvas: null,
    ctx: null,
  },

  // Configuration constants
  config: {
    MAX_ALPHA: 0.6,
    MAX_SCALE: 5,
    VIDEO_PADDING: 0,
    DURATION_DIF: 0.17,
    SEEKBAR_HEIGHT: 55,
    SEEKBAR_MARGIN: 20,
    PLAY_PAUSE_MARGIN: 2 * 20 - 5,
    STEP_BACK_MARGIN: 2 * 20 + 55,
    STEP_FORWARD_MARGIN: 2 * 20 + 105,
    VOLUME_MARGIN_NORMAL: 2 * 20 + 145,
    FACE_TRACE_MARGIN: 2 * 20 + 300,
    FULLSCREEN_MARGIN: 2 * 20 + 350,
  },

  // Video state
  video: {
    WIDTH: 1920,
    HEIGHT: 1080,
    scale: 1,
    scaleIndex: 0,
    loading: false,
    bufCurrentTime: 0,
    metadataLoaded: false,
  },

  // Mouse state
  mouse: {
    press: false,
    drag: false,
    x: 500,
    y: 150,
    moveX: 0,
    moveY: 0,
    dragX: 0,
    dragY: 0,
    xAnytime: 0,
    yAnytime: 0,
    imageDifX: 0,
    imageDifY: 0,
    prevX: -1,
  },

  // Coordinates
  coords: {
    left: 0,
    width: 0,
    top: 0,
    height: 0,
    leftBuf: 0,
    topBuf: 0,
  },

  // Animation state
  animation: {
    play: false,
    pause: false,
    stepBack: false,
    stepForward: false,
    alpha: 0,
    loadIndex: 0,
    fadeAlpha: 0,
    seekBallRad: 0,
    stopCount: 100,
  },

  // Playback state
  playback: {
    playing: false,
    finished: false,
    resume: false,
  },

  // UI state flags
  ui: {
    onCanvas: false,
    onSeekBar: false,
    pressSeekBar: false,
    dragSeekBar: false,
    onPlayPause: false,
    onStepBack: false,
    onStepForward: false,
    onVolume: false,
    onVolumeControl: false,
    dragVolumeControl: false,
    onTheater: false,
    theaterMode: false,
    theaterTmp: false,
    onFullscreen: false,
    isFullscreenMode: false,
    onFaceTrace: false,
    faceTrace: false,
    onReplay: false,
    fading: false,
    pressOnController: false,
    dragOnController: false,
    onMediaControl: false,
    onPlayBackTrigger: false,
    pressPlayBackTrigger: false,
    onPlayBacks: [false, false, false, false, false, false, false],
    onVideoRate0_7: false,
    onVideoRate1_0: false,
    onVideoRate1_5: false,
    onVideoRate2_0: false,
  },

  // Layout
  layout: {
    VOLUME_MARGIN: 0,
    theaterMargin: 0,
    fullscreenMargin: 0,
    isNarrowCanvas: false,
    replayPosY: 0,
    replayHeight: 0,
    originalMaxWidth: "1200px",
    scrollPosBuf: 0,
    canvasWidthBuf: 0,
  },

  // System
  system: {
    timeStamp: 0,
  },
};

// Initialize DOM elements
KP.elements.video =
  document.getElementById("myVideo") ||
  document.querySelector("video") ||
  (() => {
    console.error("Kano Player: No video element found.");
    return null;
  })();

KP.elements.canvas =
  document.getElementById("myCanvas") ||
  document.querySelector("canvas") ||
  (() => {
    console.error("Kano Player: No canvas element found.");
    return null;
  })();

KP.elements.canvas.oncontextmenu = function () {
  return false;
};

KP.elements.ctx = KP.elements.canvas
  ? KP.elements.canvas.getContext("2d")
  : null;

// Aliases for compatibility
const video = KP.elements.video;
const canvas = KP.elements.canvas;
const ctx = KP.elements.ctx;

// Event listeners
document.addEventListener("keydown", keyDown);
canvas.addEventListener("click", mouseClick);
canvas.addEventListener("mousemove", mouseMove);
canvas.addEventListener("mousedown", mouseDown);
canvas.addEventListener("mouseup", mouseUp);
canvas.addEventListener("mouseout", mouseOut);
canvas.addEventListener("mouseover", mouseOver);
canvas.addEventListener("mousewheel", canvasZoom);
window.addEventListener(
  "resize",
  function () {
    let maxWidth = 0;
    if (
      (window.innerWidth * KP.video.HEIGHT) / KP.video.WIDTH <=
      window.innerHeight
    ) {
      maxWidth = window.innerWidth;
    } else {
      maxWidth = (window.innerHeight * KP.video.WIDTH) / KP.video.HEIGHT - 10;
    }
    if (!KP.ui.theaterMode) {
      maxWidth = Math.min(
        maxWidth,
        parseInt(KP.layout.originalMaxWidth) || 1200
      );
    }
    if (canvas) canvas.style.maxWidth = maxWidth + "px";

    init();
  },
  false
);
document.addEventListener("webkitfullscreenchange", handleFSevent, false);
document.addEventListener("mozfullscreenchange", handleFSevent, false);
document.addEventListener("MSFullscreenChange", handleFSevent, false);
document.addEventListener("fullscreenchange", handleFSevent, false);
function handleFSevent() {
  const isInFullscreen =
    (document.FullscreenElement !== undefined &&
      document.FullscreenElement !== null) ||
    (document.webkitFullscreenElement !== undefined &&
      document.webkitFullscreenElement !== null) ||
    (document.msFullscreenElement !== undefined &&
      document.msFullscreenElement !== null);

  if (KP.ui.theaterMode && !isInFullscreen) {
    KP.ui.theaterTmp = true;
    KP.ui.theaterMode = false;
    init();
  }

  if (KP.ui.isFullscreenMode && !isInFullscreen) {
    KP.ui.isFullscreenMode = false;
    const mainEl = document.getElementById("main");
    if (mainEl) mainEl.style.background = "white";
    if (canvas) canvas.style.maxWidth = KP.layout.originalMaxWidth;
    init();
  }
}

function init() {
  canvas.width = KP.ui.theaterTmp
    ? KP.layout.canvasWidthBuf
    : canvas.clientWidth;
  canvas.height =
    (canvas.width * KP.video.HEIGHT) / KP.video.WIDTH + KP.config.VIDEO_PADDING;

  KP.coords.left = 0;
  KP.coords.width = canvas.width;
  KP.coords.top = 0;
  KP.coords.height = canvas.height - KP.config.VIDEO_PADDING;
  KP.video.scale = 1;
  KP.video.scaleIndex = 0;

  // Compact layout for narrow canvas
  KP.layout.isNarrowCanvas = canvas.width <= 600;

  if (KP.layout.isNarrowCanvas) {
    // Hide 10s buttons on narrow canvas
    const playPauseWidth = 30;
    const volumeControlWidth = 120;
    const speedButtonWidth = 40;
    const buttonSpacing = 15;

    // Position after play/pause button
    KP.layout.VOLUME_MARGIN = KP.config.SEEKBAR_MARGIN + playPauseWidth + 20;
    KP.layout.theaterMargin =
      KP.layout.VOLUME_MARGIN + volumeControlWidth + buttonSpacing;
    KP.layout.fullscreenMargin =
      KP.layout.theaterMargin + speedButtonWidth + buttonSpacing;
  } else {
    KP.layout.VOLUME_MARGIN = KP.config.VOLUME_MARGIN_NORMAL;
    KP.layout.theaterMargin = canvas.width - 220;
    KP.layout.fullscreenMargin = canvas.width - 160;
  }

  // Replay button position
  const buttonHeight = 80;
  KP.layout.replayPosY = (canvas.height - buttonHeight) / 2;
  KP.layout.replayHeight = buttonHeight;

  if (KP.ui.theaterTmp) {
    scrollTo(0, KP.layout.scrollPosBuf);
    KP.ui.theaterTmp = false;
  }
}

video.addEventListener("waiting", function (event) {
  KP.video.bufCurrentTime = video.currentTime;
  KP.video.loading = true;
});

video.addEventListener("canplay", function (event) {
  KP.video.loading = false;
});

video.addEventListener("canplaythrough", function (event) {
  KP.video.loading = false;
});

video.addEventListener("loadedmetadata", function (event) {
  KP.video.WIDTH = video.videoWidth || 1920;
  KP.video.HEIGHT = video.videoHeight || 1080;

  if (!KP.video.metadataLoaded) {
    KP.video.metadataLoaded = true;
    init();
    draw();
  } else {
    init();
  }
});

video.addEventListener("loadeddata", function (event) {
  KP.video.loading = false;
  if (!KP.playback.playing) {
    draw();
  }
});

function draw() {
  // Reset canvas
  ctx.globalAlpha = 1;
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Video scaling
  ctx.save();
  ctx.translate(0, 0);
  ctx.scale(KP.video.scale, KP.video.scale);
  ctx.drawImage(
    video,
    -KP.coords.left,
    -KP.coords.top + KP.config.VIDEO_PADDING / 2,
    canvas.width,
    canvas.height - KP.config.VIDEO_PADDING
  );

  // Captions
  for (let c = 0; c < captions.length; c++) {
    const caption = captions[c];

    const startTime =
      caption.startTime !== undefined ? caption.startTime : caption[0];
    const endTime =
      caption.endTime !== undefined ? caption.endTime : caption[1];

    if (video.currentTime >= startTime && video.currentTime < endTime) {
      if (caption.text !== undefined) {
        // Apply defaults
        const fontSize = (caption.fontSize || 20) * (canvas.width / 1124);
        const align = caption.align !== undefined ? caption.align : "center";
        const positionX =
          caption.positionX !== undefined ? caption.positionX : 0.5;
        const positionY =
          caption.positionY !== undefined ? caption.positionY : 0.5;
        const textColor = caption.textColor || "white";
        const strokeColor = caption.strokeColor || "black";
        const strokeWidth =
          caption.strokeWidth !== undefined ? caption.strokeWidth : 0;

        let lineHeight = 1.3;

        ctx.font =
          (caption.bold ? "bold " : "") + fontSize + 'px "Meiryo", sans-serif';
        ctx.textAlign = align;

        let text = caption.text;
        let lines = text.split("\n");

        if (caption.backgroundColor) {
          let baseX = 0;
          let margin = 10;
          let textWidth = 0;

          for (let i = 0; i < lines.length; i++) {
            textWidth = Math.max(textWidth, ctx.measureText(lines[i]).width);
          }

          if (align === "left") {
            baseX = 0;
          } else if (align === "center") {
            baseX = textWidth / 2;
          } else {
            baseX = textWidth;
          }

          ctx.fillStyle = caption.backgroundColor;
          ctx.fillRect(
            canvas.width * positionX - KP.coords.left - baseX - margin,
            (canvas.height - KP.config.VIDEO_PADDING) * positionY -
              KP.coords.top -
              (fontSize * lineHeight) / 2 -
              margin / 4,
            textWidth + margin * 2,
            fontSize * lineHeight * lines.length + margin
          );
        }

        for (let i = 0; i < lines.length; i++) {
          let line = lines[i];
          let addY = fontSize / 2;

          if (i > 0) {
            addY += fontSize * lineHeight * i;
          }

          const x = canvas.width * positionX - KP.coords.left;
          const y =
            (canvas.height - KP.config.VIDEO_PADDING) * positionY -
            KP.coords.top +
            addY;

          if (strokeWidth > 0) {
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = strokeWidth;
            ctx.strokeText(line, x, y);
          }

          ctx.fillStyle = textColor;
          ctx.fillText(line, x, y);
        }
      }
    }
  }
  ctx.restore();

  // Debug info
  if (debug) {
    ctx.font = 'bold 20px "Meiryo", sans-serif';
    ctx.fillStyle = "white";
    ctx.textAlign = "left";
    ctx.fillText("time: " + video.currentTime.toFixed("2"), 10, 20);
    ctx.fillText(
      "(" +
        (KP.mouse.moveX / canvas.width).toFixed(2) +
        ", " +
        (KP.mouse.moveY / canvas.height).toFixed(2) +
        ")",
      10,
      40
    );
  }
  ctx.textAlign = "right";

  if (KP.playback.finished) {
    if (KP.ui.theaterMode) {
      flipTheaterMode();
    }

    const gradient = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      0,
      canvas.width / 2,
      canvas.height / 2,
      Math.max(canvas.width, canvas.height) / 2
    );
    gradient.addColorStop(0, "rgba(0, 0, 0, 0.7)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.9)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 10;

    const buttonWidth = 200;
    const buttonHeight = 80;
    const buttonX = (canvas.width - buttonWidth) / 2;
    const buttonY = (canvas.height - buttonHeight) / 2;

    const buttonGradient = ctx.createLinearGradient(
      buttonX,
      buttonY,
      buttonX,
      buttonY + buttonHeight
    );
    if (KP.ui.onReplay) {
      buttonGradient.addColorStop(0, "rgba(70, 70, 70, 0.9)");
      buttonGradient.addColorStop(1, "rgba(50, 50, 50, 0.9)");
    } else {
      buttonGradient.addColorStop(0, "rgba(60, 60, 60, 0.8)");
      buttonGradient.addColorStop(1, "rgba(40, 40, 40, 0.8)");
    }

    ctx.fillStyle = buttonGradient;
    ctx.beginPath();
    ctx.roundRect(buttonX, buttonY, buttonWidth, buttonHeight, 15);
    ctx.fill();

    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.strokeStyle = KP.ui.onReplay
      ? "rgba(255, 255, 255, 0.4)"
      : "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = KP.ui.onReplay
      ? "rgba(255, 255, 255, 0.9)"
      : "rgba(255, 255, 255, 0.7)";
    const iconSize = 20;
    const iconX = buttonX + 50;
    const iconY = buttonY + buttonHeight / 2;

    ctx.lineWidth = 3;
    ctx.strokeStyle = ctx.fillStyle;
    ctx.beginPath();
    ctx.arc(iconX, iconY, iconSize, -Math.PI / 2 - 0.8, Math.PI / 2 + 1.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(iconX - iconSize + 5, iconY - iconSize - 3);
    ctx.lineTo(iconX - iconSize + 15, iconY - iconSize + 7);
    ctx.lineTo(iconX - iconSize - 5, iconY - iconSize + 10);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = KP.ui.onReplay
      ? "rgba(255, 255, 255, 0.9)"
      : "rgba(255, 255, 255, 0.7)";
    ctx.font = 'bold 26px "Arial"';
    ctx.textAlign = "left";
    ctx.fillText("Replay", iconX + 40, iconY + 8);

    requestAnimationFrame(draw);
    return;
  }

  if (KP.animation.play) {
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(
      0.3 + (0.6 - KP.animation.alpha) / 2,
      0.3 + (0.6 - KP.animation.alpha) / 2
    );

    ctx.fillStyle = "rgba(0, 0, 0, " + KP.animation.alpha + ")";
    ctx.beginPath();
    ctx.arc(0, 0, 100, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 255, 255, " + KP.animation.alpha + ")";
    ctx.beginPath();
    ctx.moveTo(-30, -45);
    ctx.lineTo(50, 0);
    ctx.lineTo(-30, 45);
    ctx.closePath();
    ctx.fill();

    KP.animation.alpha -= 0.01;
    if (KP.animation.alpha < 0) {
      KP.animation.play = false;
    }
    ctx.restore();
  } else if (KP.animation.pause) {
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(
      0.3 + (0.6 - KP.animation.alpha) / 2,
      0.3 + (0.6 - KP.animation.alpha) / 2
    );

    ctx.fillStyle = "rgba(0, 0, 0, " + KP.animation.alpha + ")";
    ctx.beginPath();
    ctx.arc(0, 0, 100, 0, 2 * Math.PI);
    ctx.fill();
    ctx.lineWidth = 22;
    ctx.strokeStyle = "rgba(255, 255, 255, " + KP.animation.alpha + ")";
    ctx.beginPath();
    ctx.moveTo(-23, -45);
    ctx.lineTo(-23, 45);
    ctx.moveTo(23, -45);
    ctx.lineTo(23, 45);
    ctx.stroke();

    KP.animation.alpha -= 0.01;
    if (KP.animation.alpha < 0) {
      KP.animation.pause = false;
    }
    ctx.restore();
  } else if (KP.animation.stepBack) {
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(
      0.3 + (0.6 - KP.animation.alpha) / 2,
      0.3 + (0.6 - KP.animation.alpha) / 2
    );

    ctx.fillStyle = "rgba(0, 0, 0, " + KP.animation.alpha + ")";
    ctx.beginPath();
    ctx.arc(0, 0, 100, 0, 2 * Math.PI);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 255, 255, " + KP.animation.alpha + ")";
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(0, 0, 55, -Math.PI / 2 - 0.61, Math.PI / 2 + 1.2);
    ctx.stroke();
    ctx.fillStyle = "rgba(255, 255, 255, " + KP.animation.alpha + ")";
    ctx.beginPath();
    ctx.moveTo(-45, -60);
    ctx.lineTo(-18, -31);
    ctx.lineTo(-60, -20);
    ctx.closePath();
    ctx.fill();
    ctx.font = '48px "Arial"';
    ctx.fillText("10", 25, 20);

    KP.animation.alpha -= 0.01;
    if (KP.animation.alpha < 0) {
      KP.animation.stepBack = false;
    }
    ctx.restore();
  } else if (KP.animation.stepForward) {
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(
      0.3 + (0.6 - KP.animation.alpha) / 2,
      0.3 + (0.6 - KP.animation.alpha) / 2
    );

    ctx.fillStyle = "rgba(0, 0, 0, " + KP.animation.alpha + ")";
    ctx.beginPath();
    ctx.arc(0, 0, 100, 0, 2 * Math.PI);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 255, 255, " + KP.animation.alpha + ")";
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(0, 0, 55, -Math.PI / 2 + 0.61, Math.PI / 2 - 1.2, true);
    ctx.stroke();
    ctx.fillStyle = "rgba(255, 255, 255, " + KP.animation.alpha + ")";
    ctx.beginPath();
    ctx.moveTo(45, -60);
    ctx.lineTo(18, -31);
    ctx.lineTo(60, -20);
    ctx.closePath();
    ctx.fill();
    ctx.font = '48px "Arial"';
    ctx.fillText("10", 25, 20);

    KP.animation.alpha -= 0.01;
    if (KP.animation.alpha < 0) {
      KP.animation.stepForward = false;
    }
    ctx.restore();
  }

  if (KP.ui.onCanvas && !KP.ui.onMediaControl && KP.playback.playing) {
    KP.animation.stopCount--;
    if (KP.animation.stopCount === 0) {
      KP.ui.fading = true;
      KP.animation.fadeAlpha = 50;
    }
  }

  if (KP.ui.onCanvas || !KP.playback.playing || KP.ui.fading) {
    if (KP.ui.fading) {
      if (KP.animation.fadeAlpha === 0) {
        ctx.globalAlpha = 0;
        if (KP.ui.onCanvas) document.body.style.cursor = "none";
      } else {
        KP.animation.fadeAlpha--;
        ctx.globalAlpha = Math.min(10, KP.animation.fadeAlpha) / 10;
      }
    }

    let grayBsck = "rgba(40, 40, 40, 0.6)";

    let back = ctx.createLinearGradient(
      0,
      canvas.height - 2 * KP.config.SEEKBAR_HEIGHT,
      0,
      canvas.height
    );
    back.addColorStop(0, "rgba(0, 0, 0, 0)");
    back.addColorStop(0.4, "rgba(0, 0, 0, 0.1)");
    back.addColorStop(0.5, "rgba(0, 0, 0, 0.6)");
    back.addColorStop(1, "rgba(0, 0, 0, 0.9)");
    ctx.fillStyle = back;
    ctx.fillRect(
      0,
      canvas.height - 2 * KP.config.SEEKBAR_HEIGHT,
      canvas.width,
      2 * KP.config.SEEKBAR_HEIGHT
    );

    let seekBarWidth = canvas.width - 2 * KP.config.SEEKBAR_MARGIN;

    if (KP.ui.onSeekBar || KP.ui.dragSeekBar) {
      ctx.lineWidth = 7;
    } else {
      ctx.lineWidth = 6;
    }
    ctx.strokeStyle = "rgba(180, 180, 180, 0.3)";
    ctx.beginPath();
    ctx.moveTo(
      KP.config.SEEKBAR_MARGIN - 0.5,
      canvas.height - KP.config.SEEKBAR_HEIGHT
    );
    ctx.lineTo(
      canvas.width - KP.config.SEEKBAR_MARGIN + 0.5,
      canvas.height - KP.config.SEEKBAR_HEIGHT
    );
    ctx.stroke();

    if (KP.ui.onSeekBar || KP.ui.dragSeekBar) {
      ctx.lineWidth = 5;
    } else {
      ctx.lineWidth = 4;
    }
    ctx.strokeStyle = "gray";
    ctx.beginPath();
    ctx.moveTo(
      KP.config.SEEKBAR_MARGIN,
      canvas.height - KP.config.SEEKBAR_HEIGHT
    );
    ctx.lineTo(
      canvas.width - KP.config.SEEKBAR_MARGIN,
      canvas.height - KP.config.SEEKBAR_HEIGHT
    );
    ctx.stroke();

    if (video.buffered.length > 0) {
      ctx.strokeStyle = "lightgray";
      for (let b = 0; b < video.buffered.length; b++) {
        if (video.buffered.start(b) > video.currentTime) break;
        if (video.buffered.end(b) < video.currentTime) continue;
        ctx.beginPath();
        ctx.moveTo(
          KP.config.SEEKBAR_MARGIN +
            (seekBarWidth * video.currentTime) /
              (video.duration - KP.config.DURATION_DIF),
          canvas.height - KP.config.SEEKBAR_HEIGHT
        );
        if (video.buffered.end(b) === video.duration) {
          ctx.lineTo(
            KP.config.SEEKBAR_MARGIN +
              (seekBarWidth *
                (video.buffered.end(b) - KP.config.DURATION_DIF)) /
                (video.duration - KP.config.DURATION_DIF),
            canvas.height - KP.config.SEEKBAR_HEIGHT
          );
        } else {
          ctx.lineTo(
            KP.config.SEEKBAR_MARGIN +
              (seekBarWidth * video.buffered.end(b)) /
                (video.duration - KP.config.DURATION_DIF),
            canvas.height - KP.config.SEEKBAR_HEIGHT
          );
        }
        ctx.stroke();
      }
    }

    ctx.strokeStyle = "red";
    ctx.beginPath();
    ctx.moveTo(
      KP.config.SEEKBAR_MARGIN,
      canvas.height - KP.config.SEEKBAR_HEIGHT
    );
    ctx.lineTo(
      KP.config.SEEKBAR_MARGIN +
        (seekBarWidth * video.currentTime) /
          (video.duration - KP.config.DURATION_DIF),
      canvas.height - KP.config.SEEKBAR_HEIGHT
    );
    ctx.stroke();

    if ((KP.ui.onSeekBar || KP.ui.dragSeekBar) && !KP.ui.dragVolumeControl) {
      if (KP.animation.seekBallRad < 6) {
        KP.animation.seekBallRad++;
      }

      ctx.fillStyle = "red";
      ctx.beginPath();
      ctx.arc(
        KP.config.SEEKBAR_MARGIN +
          (seekBarWidth * video.currentTime) /
            (video.duration - KP.config.DURATION_DIF),
        canvas.height - KP.config.SEEKBAR_HEIGHT,
        KP.animation.seekBallRad,
        0,
        2 * Math.PI
      );
      ctx.fill();
    } else {
      if (KP.animation.seekBallRad > 0) {
        KP.animation.seekBallRad--;
        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(
          KP.config.SEEKBAR_MARGIN +
            (seekBarWidth * video.currentTime) /
              (video.duration - KP.config.DURATION_DIF),
          canvas.height - KP.config.SEEKBAR_HEIGHT,
          KP.animation.seekBallRad,
          0,
          2 * Math.PI
        );
        ctx.fill();
      }
    }

    if (
      video.currentTime >= video.duration - KP.config.DURATION_DIF &&
      !video.onwaiting
    ) {
      video.currentTime = video.duration;
      if (KP.playback.playing) flipPlayPauseVideo();
      KP.playback.finished = true;
    }

    if ((KP.ui.onSeekBar || KP.ui.dragSeekBar) && !KP.ui.dragVolumeControl) {
      let seekPos =
        (KP.mouse.moveX - KP.config.SEEKBAR_MARGIN) /
        (canvas.width - 2 * KP.config.SEEKBAR_MARGIN);
      let seekPosDifX = 0;
      seekPos = seekBarWidth * Math.max(0, Math.min(1, seekPos));
      if (seekPos - 7 < KP.config.SEEKBAR_MARGIN) {
        seekPosDifX = KP.config.SEEKBAR_MARGIN - seekPos + 7;
      } else if (seekPos + 27 > canvas.width - 2 * KP.config.SEEKBAR_MARGIN) {
        seekPosDifX =
          canvas.width - 2 * KP.config.SEEKBAR_MARGIN - seekPos - 27;
      }
      ctx.fillStyle = grayBsck;
      ctx.fillRect(
        seekPosDifX + seekPos - 27 + KP.config.SEEKBAR_MARGIN,
        canvas.height - KP.config.SEEKBAR_HEIGHT - 37,
        54,
        27
      );

      let timeBuf =
        (KP.mouse.moveX - KP.config.SEEKBAR_MARGIN) /
        (canvas.width - 2 * KP.config.SEEKBAR_MARGIN);
      timeBuf =
        (video.duration - KP.config.DURATION_DIF) *
        Math.max(0, Math.min(1, timeBuf));
      let curMBuf = Math.floor(timeBuf / 60);
      let curSBuf = Math.floor(timeBuf % 60);
      let txtTimeBuf = "";
      txtTimeBuf += curMBuf < 10 ? "0" + curMBuf + ":" : curMBuf + ":";
      txtTimeBuf += curSBuf < 10 ? "0" + curSBuf : curSBuf;
      ctx.fillStyle = "white";
      ctx.font = '15px "Arial"';
      ctx.textAlign = "center";
      ctx.fillText(
        txtTimeBuf,
        seekPosDifX + seekPos + KP.config.SEEKBAR_MARGIN,
        canvas.height - KP.config.SEEKBAR_HEIGHT - 18
      );
    }

    if (KP.ui.onPlayPause && !KP.ui.dragSeekBar && !KP.ui.dragVolumeControl) {
      ctx.strokeStyle = "white";
      if (!KP.playback.playing) {
        ctx.fillStyle = grayBsck;
        ctx.fillRect(
          KP.config.SEEKBAR_MARGIN,
          canvas.height - KP.config.SEEKBAR_HEIGHT - 37,
          92,
          27
        );
        ctx.fillStyle = "white";
        ctx.font = '15px "Arial"';
        ctx.textAlign = "left";
        ctx.fillText(
          "Play [space]",
          KP.config.SEEKBAR_MARGIN + 5,
          canvas.height - KP.config.SEEKBAR_HEIGHT - 18
        );
      } else {
        ctx.fillStyle = grayBsck;
        ctx.fillRect(
          KP.config.SEEKBAR_MARGIN,
          canvas.height - KP.config.SEEKBAR_HEIGHT - 37,
          94,
          27
        );

        ctx.fillStyle = "white";
        ctx.font = '15px "Arial"';
        ctx.textAlign = "left";
        ctx.fillText(
          "Stop [space]",
          KP.config.SEEKBAR_MARGIN + 5,
          canvas.height - KP.config.SEEKBAR_HEIGHT - 18
        );
      }
    } else {
      ctx.fillStyle = "lightgray";
      ctx.strokeStyle = "lightgray";
    }
    if (!KP.playback.playing) {
      ctx.beginPath();
      ctx.moveTo(KP.config.PLAY_PAUSE_MARGIN, canvas.height - 35);
      ctx.lineTo(KP.config.PLAY_PAUSE_MARGIN + 20, canvas.height - 25);
      ctx.lineTo(KP.config.PLAY_PAUSE_MARGIN, canvas.height - 15);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(KP.config.PLAY_PAUSE_MARGIN + 3, canvas.height - 35);
      ctx.lineTo(KP.config.PLAY_PAUSE_MARGIN + 3, canvas.height - 15);
      ctx.moveTo(KP.config.PLAY_PAUSE_MARGIN + 13, canvas.height - 35);
      ctx.lineTo(KP.config.PLAY_PAUSE_MARGIN + 13, canvas.height - 15);
      ctx.stroke();
    }

    if (!KP.layout.isNarrowCanvas) {
      if (KP.ui.onStepBack && !KP.ui.dragSeekBar && !KP.ui.dragVolumeControl) {
        ctx.strokeStyle = "white";
        ctx.fillStyle = grayBsck;
        ctx.fillRect(
          KP.config.STEP_BACK_MARGIN - 45,
          canvas.height - KP.config.SEEKBAR_HEIGHT - 37,
          100,
          27
        );

        ctx.fillStyle = "white";
        ctx.font = '15px "Arial"';
        ctx.textAlign = "left";
        ctx.fillText(
          "10s back [←]",
          KP.config.STEP_BACK_MARGIN - 40,
          canvas.height - KP.config.SEEKBAR_HEIGHT - 18
        );
      } else {
        ctx.fillStyle = "lightgray";
        ctx.strokeStyle = "lightgray";
      }
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(
        KP.config.STEP_BACK_MARGIN,
        canvas.height - 25,
        13,
        -Math.PI / 2 - 0.8,
        Math.PI / 2 + 1.2
      );
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(KP.config.STEP_BACK_MARGIN - 11, canvas.height - 38);
      ctx.lineTo(KP.config.STEP_BACK_MARGIN - 3, canvas.height - 31);
      ctx.lineTo(KP.config.STEP_BACK_MARGIN - 12, canvas.height - 28);
      ctx.closePath();
      ctx.fill();
      ctx.font = '11px "Arial"';
      ctx.textAlign = "right";
      ctx.fillText("10", KP.config.STEP_BACK_MARGIN + 6, canvas.height - 20);
    }

    if (!KP.layout.isNarrowCanvas) {
      if (
        KP.ui.onStepForward &&
        !KP.ui.dragSeekBar &&
        !KP.ui.dragVolumeControl
      ) {
        ctx.strokeStyle = "white";
        ctx.fillStyle = grayBsck;
        ctx.fillRect(
          KP.config.STEP_FORWARD_MARGIN - 45,
          canvas.height - KP.config.SEEKBAR_HEIGHT - 37,
          120,
          27
        );

        ctx.fillStyle = "white";
        ctx.font = '15px "Arial"';
        ctx.textAlign = "left";
        ctx.fillText(
          "10s forward [→]",
          KP.config.STEP_FORWARD_MARGIN - 40,
          canvas.height - KP.config.SEEKBAR_HEIGHT - 18
        );
      } else {
        ctx.fillStyle = "lightgray";
        ctx.strokeStyle = "lightgray";
      }
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(
        KP.config.STEP_FORWARD_MARGIN,
        canvas.height - 25,
        13,
        -Math.PI / 2 + 0.8,
        Math.PI / 2 - 1.2,
        true
      );
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(KP.config.STEP_FORWARD_MARGIN + 11, canvas.height - 38);
      ctx.lineTo(KP.config.STEP_FORWARD_MARGIN + 3, canvas.height - 31);
      ctx.lineTo(KP.config.STEP_FORWARD_MARGIN + 12, canvas.height - 28);
      ctx.closePath();
      ctx.fill();
      ctx.font = '11px "Arial"';
      ctx.textAlign = "right";
      ctx.fillText("10", KP.config.STEP_FORWARD_MARGIN + 5, canvas.height - 20);
    }

    if (KP.ui.onVolume && !KP.ui.dragSeekBar && !KP.ui.dragVolumeControl) {
      ctx.strokeStyle = "white";
      ctx.fillStyle = grayBsck;
      ctx.fillRect(
        KP.layout.VOLUME_MARGIN - 18,
        canvas.height - KP.config.SEEKBAR_HEIGHT - 37,
        70,
        27
      );

      ctx.fillStyle = "white";
      ctx.font = '15px "Arial"';
      ctx.textAlign = "left";
      ctx.fillText(
        "Mute [m]",
        KP.layout.VOLUME_MARGIN - 13,
        canvas.height - KP.config.SEEKBAR_HEIGHT - 18
      );
    } else {
      ctx.fillStyle = "lightgray";
      ctx.strokeStyle = "lightgray";
    }
    ctx.beginPath();
    ctx.moveTo(KP.layout.VOLUME_MARGIN, canvas.height - 30);
    ctx.lineTo(KP.layout.VOLUME_MARGIN + 6, canvas.height - 30);
    ctx.lineTo(KP.layout.VOLUME_MARGIN + 16, canvas.height - 36);
    ctx.lineTo(KP.layout.VOLUME_MARGIN + 16, canvas.height - 14);
    ctx.lineTo(KP.layout.VOLUME_MARGIN + 6, canvas.height - 20);
    ctx.lineTo(KP.layout.VOLUME_MARGIN, canvas.height - 20);
    ctx.closePath();
    ctx.fill();

    let volumeBuf = video.muted ? 0 : video.volume;

    ctx.lineWidth = 2;
    if (volumeBuf > 0) {
      ctx.strokeStyle = "lightgray";
      ctx.beginPath();
      ctx.arc(
        KP.layout.VOLUME_MARGIN + 18,
        canvas.height - 25,
        4,
        -Math.PI / 2 + 0.3,
        Math.PI / 2 - 0.3
      );
      ctx.stroke();
      if (volumeBuf > 0.4) {
        ctx.strokeStyle = "lightgray";
      } else {
        ctx.strokeStyle = "rgb(70, 70, 70)";
      }
      ctx.beginPath();
      ctx.arc(
        KP.layout.VOLUME_MARGIN + 18,
        canvas.height - 25,
        8,
        -Math.PI / 2 + 0.5,
        Math.PI / 2 - 0.5
      );
      ctx.stroke();
      if (volumeBuf > 0.7) {
        ctx.strokeStyle = "lightgray";
      } else {
        ctx.strokeStyle = "rgb(70, 70, 70)";
      }
      ctx.beginPath();
      ctx.arc(
        KP.layout.VOLUME_MARGIN + 18,
        canvas.height - 25,
        12,
        -Math.PI / 2 + 0.6,
        Math.PI / 2 - 0.6
      );
      ctx.stroke();
    } else {
      ctx.strokeStyle = "rgb(180, 180, 180)";
      ctx.beginPath();
      ctx.moveTo(KP.layout.VOLUME_MARGIN + 20, canvas.height - 30);
      ctx.lineTo(KP.layout.VOLUME_MARGIN + 30, canvas.height - 20);
      ctx.moveTo(KP.layout.VOLUME_MARGIN + 20, canvas.height - 20);
      ctx.lineTo(KP.layout.VOLUME_MARGIN + 30, canvas.height - 30);
      ctx.stroke();
    }

    ctx.lineWidth = 3;
    ctx.strokeStyle = "gray";
    ctx.beginPath();
    ctx.moveTo(KP.layout.VOLUME_MARGIN + 42, canvas.height - 25);
    ctx.lineTo(KP.layout.VOLUME_MARGIN + 112, canvas.height - 25);
    ctx.stroke();
    ctx.strokeStyle = "white";
    ctx.beginPath();
    ctx.moveTo(KP.layout.VOLUME_MARGIN + 42, canvas.height - 25);
    ctx.lineTo(
      KP.layout.VOLUME_MARGIN + 42 + volumeBuf * 70,
      canvas.height - 25
    );
    ctx.fillStyle = "white";
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(
      KP.layout.VOLUME_MARGIN + 42 + volumeBuf * 70,
      canvas.height - 25,
      5,
      0,
      2 * Math.PI
    );
    ctx.fill();

    const speedControlY = canvas.height - 38;

    if (
      (KP.ui.onPlayBackTrigger &&
        !KP.ui.dragSeekBar &&
        !KP.ui.dragVolumeControl) ||
      KP.ui.pressPlayBackTrigger
    ) {
      ctx.fillStyle = "rgb(90, 90, 90)";
    } else {
      ctx.fillStyle = "rgb(50, 50, 50)";
    }
    ctx.fillRect(KP.layout.theaterMargin, speedControlY, 40, 25);

    ctx.font = '13px "Arial"';
    ctx.textAlign = "left";
    if (KP.ui.pressPlayBackTrigger) {
      for (let y = 1; y < 8; y++) {
        if (KP.ui.onPlayBacks[7 - y]) {
          ctx.fillStyle = "rgb(110, 110, 110)";
        } else if (
          video.playbackRate.toFixed(1) === (0.6 + y * 0.2).toFixed(1)
        ) {
          ctx.fillStyle = "rgb(90, 90, 90)";
        } else {
          ctx.fillStyle = "rgb(50, 50, 50)";
        }
        const itemY = canvas.height - 38 - y * 25;
        ctx.fillRect(KP.layout.theaterMargin, itemY, 40, 25);

        if (
          KP.ui.onPlayBacks[7 - y] ||
          video.playbackRate.toFixed(1) === (0.6 + y * 0.2).toFixed(1)
        ) {
          ctx.fillStyle = "white";
        } else {
          ctx.fillStyle = "rgb(200, 200, 200)";
        }
        const textY = canvas.height - 20 - y * 25;
        ctx.fillText(
          "x" + (0.6 + y * 0.2).toFixed(1),
          KP.layout.theaterMargin + 8,
          textY
        );
      }
    }

    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgb(120, 120, 120)";
    ctx.strokeRect(KP.layout.theaterMargin, speedControlY, 40, 25);

    if (!KP.layout.isNarrowCanvas) {
      ctx.fillStyle = "white";
      ctx.font = '13px "Arial"';
      ctx.textAlign = "left";
      ctx.fillText("Speed：", KP.layout.theaterMargin - 55, canvas.height - 20);
    }

    ctx.fillStyle = "white";
    ctx.fillText(
      "x" + video.playbackRate.toFixed(1),
      KP.layout.theaterMargin + 8,
      canvas.height - 20
    );

    const fullscreenButtonY = canvas.height - 30;
    const fullscreenTooltipY = canvas.height - KP.config.SEEKBAR_HEIGHT - 37;

    if (KP.ui.onFullscreen && !KP.ui.dragSeekBar && !KP.ui.dragVolumeControl) {
      ctx.fillStyle = grayBsck;
      ctx.fillRect(KP.layout.fullscreenMargin - 15, fullscreenTooltipY, 57, 27);
      ctx.fillStyle = "white";
      ctx.font = '15px "Arial"';
      ctx.textAlign = "left";
      ctx.fillText(
        KP.ui.isFullscreenMode ? "Exit [F]" : "Full [F]",
        KP.layout.fullscreenMargin - 10,
        fullscreenTooltipY + 18
      );
    } else {
      ctx.fillStyle = "lightgray";
      ctx.strokeStyle = "lightgray";
    }

    ctx.lineWidth = 3;
    if (!KP.ui.isFullscreenMode) {
      ctx.beginPath();
      ctx.moveTo(KP.layout.fullscreenMargin, fullscreenButtonY);
      ctx.lineTo(KP.layout.fullscreenMargin, fullscreenButtonY - 6);
      ctx.lineTo(KP.layout.fullscreenMargin + 10, fullscreenButtonY - 6);

      ctx.moveTo(KP.layout.fullscreenMargin + 20, fullscreenButtonY - 6);
      ctx.lineTo(KP.layout.fullscreenMargin + 30, fullscreenButtonY - 6);
      ctx.lineTo(KP.layout.fullscreenMargin + 30, fullscreenButtonY);

      ctx.moveTo(KP.layout.fullscreenMargin + 30, fullscreenButtonY + 9);
      ctx.lineTo(KP.layout.fullscreenMargin + 30, fullscreenButtonY + 15);
      ctx.lineTo(KP.layout.fullscreenMargin + 20, fullscreenButtonY + 15);

      ctx.moveTo(KP.layout.fullscreenMargin + 10, fullscreenButtonY + 15);
      ctx.lineTo(KP.layout.fullscreenMargin, fullscreenButtonY + 15);
      ctx.lineTo(KP.layout.fullscreenMargin, fullscreenButtonY + 9);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(KP.layout.fullscreenMargin, fullscreenButtonY);
      ctx.lineTo(KP.layout.fullscreenMargin + 8, fullscreenButtonY);
      ctx.lineTo(KP.layout.fullscreenMargin + 8, fullscreenButtonY - 5);

      ctx.moveTo(KP.layout.fullscreenMargin + 22, fullscreenButtonY - 5);
      ctx.lineTo(KP.layout.fullscreenMargin + 22, fullscreenButtonY);
      ctx.lineTo(KP.layout.fullscreenMargin + 30, fullscreenButtonY);

      ctx.moveTo(KP.layout.fullscreenMargin + 30, fullscreenButtonY + 10);
      ctx.lineTo(KP.layout.fullscreenMargin + 22, fullscreenButtonY + 10);
      ctx.lineTo(KP.layout.fullscreenMargin + 22, fullscreenButtonY + 15);

      ctx.moveTo(KP.layout.fullscreenMargin + 8, fullscreenButtonY + 15);
      ctx.lineTo(KP.layout.fullscreenMargin + 8, fullscreenButtonY + 10);
      ctx.lineTo(KP.layout.fullscreenMargin, fullscreenButtonY + 10);
      ctx.stroke();
    }

    let txtTime = "";
    if (video.duration > 0) {
      let durM = Math.floor((video.duration - 0) / 60);
      let durS = Math.floor((video.duration - 0) % 60);
      let curM = Math.floor(video.currentTime / 60);
      let curS = Math.floor(video.currentTime % 60);
      txtTime += curM < 10 ? "0" + curM + ":" : curM + ":";
      txtTime += curS < 10 ? "0" + curS : curS;

      if (!KP.layout.isNarrowCanvas) {
        txtTime += " / ";
        txtTime += durM < 10 ? "0" + durM + ":" : durM + ":";
        txtTime += durS < 10 ? "0" + durS : durS;
      }
    } else {
      txtTime = KP.layout.isNarrowCanvas ? "00:00" : "00:00 / 00:00";
    }
    ctx.fillStyle = "white";
    ctx.font = '15px "Arial"';
    ctx.textAlign = "right";
    ctx.fillText(
      txtTime,
      canvas.width - KP.config.SEEKBAR_MARGIN,
      canvas.height - 20
    );
  }

  ctx.globalAlpha = 1;
  if (
    KP.video.loading &&
    !KP.animation.play &&
    !KP.animation.pause &&
    !KP.animation.stepBack &&
    !KP.animation.stepForward
  ) {
    if (KP.video.bufCurrentTime !== video.currentTime) {
      KP.video.loading = false;
    } else {
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      KP.animation.loadIndex++;

      let rad,
        count = 0;
      if (KP.animation.loadIndex === 80) KP.animation.loadIndex = 0;
      for (let theta = 0; theta < 2 * Math.PI; theta += Math.PI / 4) {
        rad = 14 - ((KP.animation.loadIndex / 10 + count++) % 8) * 1.5;
        ctx.fillStyle = "rgba(255, 255, 255, " + rad / 30 + ")";
        ctx.beginPath();
        ctx.arc(
          canvas.width / 2 + 60 * Math.cos(theta),
          canvas.height / 2 - 60 * Math.sin(theta),
          rad,
          0,
          2 * Math.PI
        );
        ctx.fill();
      }
    }
  }

  ctx.lineWidth = 3;
  ctx.strokeStyle = "black";
  ctx.strokeRect(0, 0, canvas.width, canvas.height);

  requestAnimationFrame(draw);
}

function flipPlayPauseVideo() {
  if (!KP.playback.playing) {
    if (video.currentTime === video.duration - KP.config.DURATION_DIF) {
      video.currentTime = 0;
    }
    video.play();
    KP.animation.play = true;
    KP.animation.pause = false;
    KP.playback.playing = true;
    if (!KP.ui.onCanvas) {
      KP.ui.fading = true;
      KP.animation.fadeAlpha = 100;
    }
  } else {
    video.pause();
    KP.animation.play = false;
    KP.animation.pause = true;
    KP.playback.playing = false;
    KP.ui.fading = false;
    KP.animation.stopCount = 100;
  }

  KP.animation.stepBack = false;
  KP.animation.stepForward = false;
  KP.animation.alpha = KP.config.MAX_ALPHA;
}

// Step back 10s
function stepBack() {
  video.currentTime = Math.max(0, video.currentTime - 10);
  KP.animation.play = false;
  KP.animation.pause = false;
  KP.animation.stepBack = true;
  KP.animation.stepForward = false;
  KP.animation.alpha = KP.config.MAX_ALPHA;
}

// Step forward 10s
function stepForward() {
  if (video.currentTime < video.duration) {
    video.currentTime = Math.min(
      video.duration - KP.config.DURATION_DIF,
      video.currentTime + 10
    );
    if (
      video.currentTime === video.duration - KP.config.DURATION_DIF &&
      KP.playback.playing
    ) {
      flipPlayPauseVideo();
    }
  }
  KP.animation.play = false;
  KP.animation.pause = false;
  KP.animation.stepBack = false;
  KP.animation.stepForward = true;
  KP.animation.alpha = KP.config.MAX_ALPHA;
}

// Key events
function keyDown(e) {
  switch (e.key) {
    case " ":
      e.preventDefault();
      flipPlayPauseVideo();
      break;
    case "ArrowRight":
      e.preventDefault();
      stepForward();
      break;
    case "ArrowLeft":
      e.preventDefault();
      stepBack();
      break;
    case "ArrowUp":
      e.preventDefault();
      if (video.muted) {
        video.muted = false;
        video.volume = 0;
      }

      if (video.volume > 0.9) {
        video.volume = 1;
      } else {
        video.volume += 0.1;
        if (video.volume > 0.99) {
          video.volume = 1;
        }
      }
      break;
    case "ArrowDown":
      e.preventDefault();
      if (video.volume < 0.1) {
        video.volume = 0;
      } else {
        video.volume -= 0.1;
        if (video.volume < 0.01) {
          video.volume = 0;
        }
      }
      break;
    case "m":
      video.muted = !video.muted;
      break;
    case "f":
    case "F":
      e.preventDefault();
      toggleFullscreen();
      break;
  }
}

// Mouse events
function mouseClick(e) {
  if (getMouseX(e) === -1 || getMouseY(e) === -1) return;

  if (KP.playback.finished) {
    if (KP.ui.onReplay) {
      KP.playback.finished = false;
      video.currentTime = 0;
      video.play();
      KP.playback.playing = true;
      KP.animation.play = true;
      KP.animation.pause = false;
      KP.animation.alpha = KP.config.MAX_ALPHA;
    }
    return;
  }

  KP.mouse.press = false;
  if (KP.mouse.drag) {
    KP.mouse.drag = false;
    return;
  }

  if (KP.ui.dragSeekBar) {
    KP.ui.dragSeekBar = false;
    KP.ui.pressSeekBar = false;
    if (KP.playback.resume) video.play();

    if (KP.playback.playing) {
      KP.video.bufCurrentTime = video.currentTime;
      KP.video.loading = true;
    }

    return;
  } else if (KP.ui.pressSeekBar) {
    KP.ui.pressSeekBar = false;
    if (KP.playback.resume) video.play();

    if (KP.playback.playing) {
      KP.video.bufCurrentTime = video.currentTime;
      KP.video.loading = true;
    }

    return;
  }
  if (KP.ui.dragVolumeControl || KP.ui.onVolumeControl) {
    KP.ui.dragVolumeControl = false;
    KP.ui.onVolumeControl = false;
    return;
  }

  if (KP.ui.dragOnController) {
    KP.ui.dragOnController = false;
    KP.ui.pressOnController = false;
    return;
  }

  if (KP.ui.pressPlayBackTrigger) {
    for (let i = 0; i < 7; i++) {
      if (KP.ui.onPlayBacks[i]) {
        video.playbackRate = 2.0 - i * 0.2;
        KP.ui.onPlayBacks[i] = false;
        KP.ui.pressPlayBackTrigger = false;
        KP.ui.onPlayBackTrigger = false;

        return;
      }
    }
  } else if (KP.ui.onPlayBackTrigger) {
    KP.ui.pressPlayBackTrigger = !KP.ui.pressPlayBackTrigger;
    return;
  }

  KP.ui.pressPlayBackTrigger = false;

  if (
    KP.mouse.moveY > 0 &&
    canvas.height - KP.mouse.moveY > KP.config.SEEKBAR_HEIGHT + 10
  ) {
    flipPlayPauseVideo();
    KP.ui.onPlayBackTrigger = false;
  } else if (KP.ui.onPlayPause) {
    flipPlayPauseVideo();
    KP.ui.onPlayBackTrigger = false;
  } else if (KP.ui.onStepBack && !canvas.width <= 600) {
    stepBack();
    KP.ui.onPlayBackTrigger = false;
  } else if (KP.ui.onStepForward && !canvas.width <= 600) {
    stepForward();
    KP.ui.onPlayBackTrigger = false;
  } else if (KP.ui.onFaceTrace) {
    KP.ui.onPlayBackTrigger = false;
    if (!KP.ui.faceTrace) {
      KP.ui.faceTrace = true;
    } else {
      KP.ui.faceTrace = false;
    }
  } else if (KP.ui.onVolume) {
    video.muted = !video.muted;
    KP.ui.onPlayBackTrigger = false;
  } else if (KP.ui.onTheater) {
    flipTheaterMode();
    KP.ui.onPlayBackTrigger = false;
  } else if (KP.ui.onFullscreen) {
    toggleFullscreen();
    KP.ui.onPlayBackTrigger = false;
  }
}

function mouseDown(e) {
  if (KP.playback.finished) return;

  if (getMouseX(e) === -1 || getMouseY(e) === -1) return;

  if (
    KP.ui.pressPlayBackTrigger &&
    KP.mouse.moveX > KP.layout.theaterMargin &&
    KP.mouse.moveX < KP.layout.theaterMargin + 40 &&
    KP.mouse.moveY > canvas.height - 213 &&
    getMouseY(e) < canvas.height - 10
  ) {
    return;
  }

  if (Math.abs(canvas.height - KP.config.SEEKBAR_HEIGHT - KP.mouse.moveY) < 8) {
    KP.playback.resume = KP.playback.playing;
    video.pause();
    KP.ui.pressSeekBar = true;
    KP.mouse.dragX = getMouseX(e);
    let timeRate =
      (KP.mouse.dragX - KP.config.SEEKBAR_MARGIN) /
      (canvas.width - 2 * KP.config.SEEKBAR_MARGIN);
    timeRate = Math.max(0, Math.min(1, timeRate));
    video.currentTime = (video.duration - KP.config.DURATION_DIF) * timeRate;
  } else if (
    KP.mouse.moveX > KP.layout.VOLUME_MARGIN + 40 &&
    KP.mouse.moveX < KP.layout.VOLUME_MARGIN + 115 &&
    KP.mouse.moveY > canvas.height - 35 &&
    KP.mouse.moveY < canvas.height - 15
  ) {
    video.muted = false;
    KP.ui.KP.ui.onVolumeControl = true;
    KP.mouse.dragX = getMouseX(e);
    let volumeBuf = (KP.mouse.dragX - KP.layout.VOLUME_MARGIN - 42) / 70;
    volumeBuf = Math.max(0, Math.min(1, volumeBuf));
    video.volume = volumeBuf;
  } else if (canvas.height - KP.mouse.moveY > KP.config.SEEKBAR_HEIGHT) {
    KP.coords.leftBuf = KP.coords.left;
    KP.coords.topBuf = KP.coords.top;
    KP.mouse.press = true;
  } else {
    KP.ui.pressOnController = true;
  }
}

function mouseUp(e) {
  KP.ui.pressOnController = false;
  KP.mouse.press = false;
}

function mouseOut() {
  returnScroll();
  KP.ui.onCanvas = false;
  KP.mouse.press = false;
  KP.ui.pressSeekBar = false;
  KP.ui.dragSeekBar = false;
  KP.ui.onVolumeControl = false;
  KP.ui.dragVolumeControl = false;
  offAllFlags();
  document.body.style.cursor = "auto";

  if (KP.playback.playing) {
    KP.ui.fading = true;
    KP.animation.fadeAlpha = 50;
  }

  if (KP.playback.finished) {
    KP.ui.onReplay = false;
  }
}

function mouseOver() {
  noScroll();
  KP.ui.onCanvas = true;
  KP.animation.fadeAlpha = 50;
  KP.ui.fading = false;
}

function mouseMove(e) {
  KP.mouse.xAnytime = getMouseX(e);
  KP.mouse.yAnytime = getMouseY(e);

  if (KP.mouse.xAnytime === -1 || KP.mouse.yAnytime === -1) {
    document.body.style.cursor = "auto";
    offAllFlags();
    return;
  }

  if (KP.playback.finished) {
    KP.mouse.moveX = getMouseX(e);
    KP.mouse.moveY = getMouseY(e);
    const buttonWidth = 200;
    const buttonX = (canvas.width - buttonWidth) / 2;
    if (
      KP.mouse.moveX > buttonX &&
      KP.mouse.moveX < buttonX + buttonWidth &&
      KP.mouse.moveY > KP.layout.replayPosY &&
      KP.mouse.moveY < KP.layout.replayPosY + KP.layout.replayHeight
    ) {
      KP.ui.onReplay = true;
      document.body.style.cursor = "pointer";
    } else {
      KP.ui.onReplay = false;
      document.body.style.cursor = "auto";
    }
    return;
  }

  if (!KP.ui.onCanvas) KP.ui.onCanvas = true;

  KP.ui.fading = false;
  KP.animation.stopCount = 100;
  if (
    getMouseY(e) > canvas.height - KP.config.SEEKBAR_HEIGHT - 10 &&
    getMouseY(e) < canvas.height
  ) {
    KP.ui.onMediaControl = true;
  } else {
    KP.ui.onMediaControl = false;
  }

  KP.ui.dragOnController =
    KP.ui.pressOnController &&
    (getMouseX(e) !== KP.mouse.moveX || getMouseY(e) !== KP.mouse.moveY);

  if (KP.ui.pressSeekBar) {
    KP.ui.dragSeekBar = true;
    KP.mouse.dragX = getMouseX(e);
    let timeRate =
      (KP.mouse.dragX - KP.config.SEEKBAR_MARGIN) /
      (canvas.width - 2 * KP.config.SEEKBAR_MARGIN);
    timeRate = Math.max(0, Math.min(1, timeRate));
    video.currentTime = (video.duration - KP.config.DURATION_DIF) * timeRate;
  } else if (KP.ui.onVolumeControl) {
    KP.ui.dragVolumeControl = true;
    KP.mouse.dragX = getMouseX(e);
    let volumeBuf = (KP.mouse.dragX - KP.layout.VOLUME_MARGIN - 42) / 70;
    volumeBuf = Math.max(0, Math.min(1, volumeBuf));
    video.volume = volumeBuf;
    return;
  }
  if (KP.mouse.press) {
    KP.mouse.dragX = getMouseX(e);
    KP.mouse.dragY = getMouseY(e);
    if (KP.mouse.dragX === KP.mouse.moveX && KP.mouse.dragY === KP.mouse.moveY)
      return;

    KP.mouse.drag = true;
    if (KP.video.scale === 1) return;

    KP.coords.left =
      KP.coords.leftBuf + (KP.mouse.moveX - KP.mouse.dragX) / KP.video.scale;
    KP.coords.top =
      KP.coords.topBuf + (KP.mouse.moveY - KP.mouse.dragY) / KP.video.scale;

    KP.coords.left = Math.max(
      0,
      Math.min(canvas.width - KP.coords.width, KP.coords.left)
    );
    KP.coords.top = Math.max(
      0,
      Math.min(canvas.height - KP.coords.height, KP.coords.top)
    );
  } else if (!KP.ui.dragOnController) {
    KP.mouse.drag = false;
    KP.mouse.moveX = getMouseX(e);
    KP.mouse.moveY = getMouseY(e);

    const speedMenuStartY = canvas.height - 213;
    const speedMenuEndY = canvas.height - 10;

    if (
      KP.ui.pressPlayBackTrigger &&
      KP.mouse.moveX > KP.layout.theaterMargin &&
      KP.mouse.moveX < KP.layout.theaterMargin + 40 &&
      KP.mouse.moveY > speedMenuStartY &&
      getMouseY(e) < speedMenuEndY
    ) {
      document.body.style.cursor = "pointer";
      offAllFlags();
      KP.ui.onPlayBackTrigger = true;
      KP.ui.onPlayBacks[
        Math.floor((KP.mouse.moveY - speedMenuStartY) / 25)
      ] = true;
    } else if (
      Math.abs(canvas.height - KP.config.SEEKBAR_HEIGHT - KP.mouse.moveY) < 8
    ) {
      document.body.style.cursor = "pointer";
      if (!KP.ui.onSeekBar) KP.animation.seekBallRad = 0;
      offAllFlags();
      KP.ui.onSeekBar = true;
    } else if (
      KP.mouse.moveX > KP.config.SEEKBAR_MARGIN &&
      KP.mouse.moveX < 3 * KP.config.SEEKBAR_MARGIN + 5 &&
      KP.mouse.moveY > canvas.height - KP.config.SEEKBAR_HEIGHT + 10 &&
      getMouseY(e) < canvas.height
    ) {
      document.body.style.cursor = "pointer";
      offAllFlags();
      KP.ui.onPlayPause = true;
    } else if (
      !KP.layout.isNarrowCanvas &&
      KP.mouse.moveX > KP.config.STEP_BACK_MARGIN - 15 &&
      KP.mouse.moveX < KP.config.STEP_BACK_MARGIN + 13 &&
      KP.mouse.moveY > canvas.height - KP.config.SEEKBAR_HEIGHT + 10 &&
      getMouseY(e) < canvas.height
    ) {
      document.body.style.cursor = "pointer";
      offAllFlags();
      KP.ui.onStepBack = true;
    } else if (
      !KP.layout.isNarrowCanvas &&
      KP.mouse.moveX > KP.config.STEP_FORWARD_MARGIN - 15 &&
      KP.mouse.moveX < KP.config.STEP_FORWARD_MARGIN + 13 &&
      KP.mouse.moveY > canvas.height - KP.config.SEEKBAR_HEIGHT + 10 &&
      getMouseY(e) < canvas.height
    ) {
      document.body.style.cursor = "pointer";
      offAllFlags();
      KP.ui.onStepForward = true;
    } else if (
      KP.mouse.moveX > KP.layout.VOLUME_MARGIN - 7 &&
      KP.mouse.moveX < KP.layout.VOLUME_MARGIN + 32 &&
      KP.mouse.moveY > canvas.height - KP.config.SEEKBAR_HEIGHT + 10 &&
      getMouseY(e) < canvas.height
    ) {
      document.body.style.cursor = "pointer";
      offAllFlags();
      KP.ui.onVolume = true;
    } else if (
      KP.mouse.moveX > KP.layout.VOLUME_MARGIN + 40 &&
      KP.mouse.moveX < KP.layout.VOLUME_MARGIN + 115 &&
      KP.mouse.moveY > canvas.height - 35 &&
      KP.mouse.moveY < canvas.height - 15
    ) {
      document.body.style.cursor = "pointer";
    } else if (
      KP.mouse.moveX > KP.config.FACE_TRACE_MARGIN - 15 &&
      KP.mouse.moveX < KP.config.FACE_TRACE_MARGIN + 13 &&
      KP.mouse.moveY > canvas.height - KP.config.SEEKBAR_HEIGHT + 10 &&
      getMouseY(e) < canvas.height
    ) {
      document.body.style.cursor = "pointer";
      offAllFlags();
      KP.ui.onFaceTrace = true;
    } else if (
      KP.mouse.moveX > KP.layout.theaterMargin &&
      KP.mouse.moveX < KP.layout.theaterMargin + 40 &&
      KP.mouse.moveY > canvas.height - KP.config.SEEKBAR_HEIGHT + 10 &&
      getMouseY(e) < canvas.height - 10
    ) {
      document.body.style.cursor = "pointer";
      offAllFlags();
      KP.ui.onPlayBackTrigger = true;
    } else if (
      KP.mouse.moveX > KP.layout.fullscreenMargin - 6 &&
      KP.mouse.moveX < KP.layout.fullscreenMargin + 36 &&
      KP.mouse.moveY > canvas.height - KP.config.SEEKBAR_HEIGHT + 10 &&
      getMouseY(e) < canvas.height
    ) {
      document.body.style.cursor = "pointer";
      offAllFlags();
      KP.ui.onFullscreen = true;
    } else {
      document.body.style.cursor = "auto";
      offAllFlags();
    }
  }
}

// Mouse coordinates
function getDrawingArea() {
  const rect = canvas.getBoundingClientRect();
  const canvasAspectRatio = canvas.width / canvas.height;
  const rectAspectRatio = rect.width / rect.height;

  let drawWidth, drawHeight, offsetX, offsetY;

  if (rectAspectRatio > canvasAspectRatio) {
    drawHeight = rect.height;
    drawWidth = drawHeight * canvasAspectRatio;
    offsetX = (rect.width - drawWidth) / 2;
    offsetY = 0;
  } else {
    drawWidth = rect.width;
    drawHeight = drawWidth / canvasAspectRatio;
    offsetX = 0;
    offsetY = (rect.height - drawHeight) / 2;
  }

  return { rect, drawWidth, drawHeight, offsetX, offsetY };
}

// Check margin clicks in fullscreen
function isClickInMargin(e) {
  const isFullscreen =
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement;

  if (!isFullscreen) return false;

  const { rect, drawWidth, drawHeight, offsetX, offsetY } = getDrawingArea();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  return (
    clickX < offsetX ||
    clickX > offsetX + drawWidth ||
    clickY < offsetY ||
    clickY > offsetY + drawHeight
  );
}

function getMouseX(e) {
  if (isClickInMargin(e)) return -1;

  let rect = e.target.getBoundingClientRect();

  const isFullscreen =
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement;

  if (isFullscreen) {
    const { drawWidth, offsetX } = getDrawingArea();
    const scaleX = canvas.width / drawWidth;
    return (e.clientX - rect.left - offsetX) * scaleX;
  } else {
    return e.clientX - rect.left;
  }
}

function getMouseY(e) {
  if (isClickInMargin(e)) return -1;

  let rect = e.target.getBoundingClientRect();

  const isFullscreen =
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement;

  if (isFullscreen) {
    const { drawHeight, offsetY } = getDrawingArea();
    const scaleY = canvas.height / drawHeight;
    return (e.clientY - rect.top - offsetY) * scaleY;
  } else {
    return e.clientY - rect.top;
  }
}

function offAllFlags() {
  KP.ui.onSeekBar = false;
  KP.ui.onPlayPause = false;
  KP.ui.onStepBack = false;
  KP.ui.onStepForward = false;
  KP.ui.onFaceTrace = false;
  KP.ui.onVolume = false;
  KP.ui.onVolumeControl = false;
  KP.ui.onTheater = false;
  KP.ui.onPlayBackTrigger = false;
  KP.ui.onFullscreen = false;

  KP.ui.onPlayBacks.fill(false);
}

// Canvas zoom
// mousePrevX now in KP.mouse.prevX
// timeStamp moved to KP.system.timeStamp
function canvasZoom(e) {
  if (KP.playback.finished) return;

  KP.mouse.x = getMouseX(e);
  KP.mouse.y = getMouseY(e);
  if (KP.mouse.prevX == -1) KP.mouse.prevX = KP.mouse.x;

  let zoomChange = true;

  if (e.timeStamp - KP.system.timeStamp < 30) {
    return;
  } else {
    KP.system.timeStamp = e.timeStamp;
  }

  const isZoomIn = e.wheelDelta > 0;

  if (isZoomIn) {
    KP.video.scaleIndex++;
    KP.video.scale = 1 + KP.video.scaleIndex * 0.2;
    if (KP.video.scale > KP.config.MAX_SCALE) {
      KP.video.scale = KP.config.MAX_SCALE;
      KP.video.scaleIndex--;
      zoomChange = false;
    }
  } else {
    KP.video.scaleIndex--;
    KP.video.scale = 1 + KP.video.scaleIndex * 0.2;
    if (KP.video.scale < 1) {
      KP.video.scale = 1;
      KP.video.scaleIndex = 0;
      KP.coords.left = 0;
      KP.coords.width = canvas.width;
      KP.coords.top = 0;
      KP.coords.height = canvas.height;
      return;
    }
  }

  if (zoomChange) {
    const factor =
      0.2 / (KP.video.scale * (KP.video.scale + (isZoomIn ? -0.2 : 0.2)));
    KP.coords.left += isZoomIn ? KP.mouse.x * factor : -(KP.mouse.x * factor);
    KP.coords.top += isZoomIn ? KP.mouse.y * factor : -(KP.mouse.y * factor);

    KP.coords.width = canvas.width / KP.video.scale;
    KP.coords.height = canvas.height / KP.video.scale;

    KP.coords.left = Math.max(
      0,
      Math.min(canvas.width - KP.coords.width, KP.coords.left)
    );
    KP.coords.top = Math.max(
      0,
      Math.min(canvas.height - KP.coords.height, KP.coords.top)
    );
  }

  if (zoomChange) {
    KP.mouse.imageDifX =
      KP.coords.left + (KP.coords.width * KP.mouse.x) / canvas.width;
    KP.mouse.imageDifY =
      KP.coords.top + (KP.coords.height * KP.mouse.y) / canvas.height;
    if (KP.mouse.imageDifX < 0) {
      KP.mouse.imageDifX = 0;
    }
    if (KP.mouse.imageDifX > canvas.width) {
      KP.mouse.imageDifX = canvas.width;
    }
    if (KP.mouse.imageDifY < 0) {
      KP.mouse.imageDifY = 0;
    }
    if (KP.mouse.imageDifY > canvas.height) {
      KP.mouse.imageDifY = canvas.height;
    }
  }

  KP.mouse.prevX = KP.mouse.x;
}

function toggleFullscreen() {
  if (!KP.ui.isFullscreenMode) {
    KP.layout.scrollPosBuf = window.pageYOffset;
    KP.layout.canvasWidthBuf = canvas.clientWidth;

    goFullScreen(canvas);
    KP.ui.isFullscreenMode = true;

    let maxWidth = 0;
    if (
      (window.innerWidth * KP.video.HEIGHT) / KP.video.WIDTH <=
      window.innerHeight
    ) {
      maxWidth = window.innerWidth;
    } else {
      maxWidth = (window.innerHeight * KP.video.WIDTH) / KP.video.HEIGHT - 10;
    }

    if (canvas) canvas.style.maxWidth = maxWidth + "px";
  } else {
    cancelFullScreen();
    KP.ui.isFullscreenMode = false;
    const mainEl = document.getElementById("main");
    if (mainEl) mainEl.style.background = "white";
    if (canvas) canvas.style.maxWidth = KP.layout.originalMaxWidth;
  }
  KP.ui.onFullscreen = false;
  init();
}

// scrollPosBuf moved to KP.layout.scrollPosBuf
// canvasWidthBuf moved to KP.layout.canvasWidthBuf
function flipTheaterMode() {
  if (!KP.ui.theaterMode) {
    KP.layout.scrollPosBuf = window.pageYOffset;
    KP.layout.canvasWidthBuf = canvas.clientWidth;

    goFullScreen(canvas);

    let maxWidth = 0;
    if (
      (window.innerWidth * KP.video.HEIGHT) / KP.video.WIDTH <=
      window.innerHeight
    ) {
      maxWidth = window.innerWidth;
    } else {
      maxWidth = (window.innerHeight * KP.video.WIDTH) / KP.video.HEIGHT - 10;
    }

    if (canvas) canvas.style.maxWidth = maxWidth + "px";
    KP.ui.theaterMode = true;
  } else {
    cancelFullScreen(canvas);

    KP.ui.theaterTmp = true;
    KP.ui.theaterMode = false;

    const mainEl = document.getElementById("main");
    if (mainEl) mainEl.style.background = "white";
    if (canvas) canvas.style.maxWidth = KP.layout.originalMaxWidth;
  }
  KP.ui.onTheater = false;
}

function noScroll() {
  document.addEventListener("mousewheel", scrollControl, { passive: false });
}

function returnScroll() {
  document.removeEventListener("mousewheel", scrollControl, { passive: false });
}
function scrollControl(event) {
  event.preventDefault();
}

function eventFullScreen(callback) {
  document.addEventListener("fullscreenchange", callback, false);
  document.addEventListener("webkitfullscreenchange", callback, false);
  document.addEventListener("mozfullscreenchange", callback, false);
  document.addEventListener("MSFullscreenChange", callback, false);
}

function enabledFullScreen() {
  return (
    document.fullscreenEnabled ||
    document.mozFullScreenEnabled ||
    document.documentElement.webkitRequestFullScreen ||
    document.msFullscreenEnabled
  );
}

function goFullScreen(element) {
  const doc = window.document;
  const docEl = element === null ? doc.documentElement : element;
  let requestFullScreen =
    docEl.requestFullscreen ||
    docEl.mozRequestFullScreen ||
    docEl.webkitRequestFullScreen ||
    docEl.msRequestFullscreen;
  requestFullScreen.call(docEl);
}

function cancelFullScreen() {
  const doc = window.document;
  const cancelFullScreen =
    doc.exitFullscreen ||
    doc.mozCancelFullScreen ||
    doc.webkitExitFullscreen ||
    doc.msExitFullscreen;
  cancelFullScreen.call(doc);
}

function getFullScreenObject() {
  const doc = window.document;
  const objFullScreen =
    doc.fullscreenElement ||
    doc.mozFullScreenElement ||
    doc.webkitFullscreenElement ||
    doc.msFullscreenElement;
  return objFullScreen;
}

function isFullScreen() {
  if (
    (document.FullscreenElement !== undefined &&
      document.FullscreenElement !== null) ||
    (document.webkitFullscreenElement !== undefined &&
      document.webkitFullscreenElement !== null) ||
    (document.msFullscreenElement !== undefined &&
      document.msFullscreenElement !== null)
  ) {
    return true;
  } else {
    return false;
  }
}

// Auto-configure
if (video) {
  video.width = 0;
  video.height = 0;
}
if (canvas) {
  if (canvas.style.maxWidth && canvas.style.maxWidth !== "") {
    KP.layout.originalMaxWidth = canvas.style.maxWidth;
  } else {
    const computedStyle = window.getComputedStyle(canvas);
    if (computedStyle.maxWidth && computedStyle.maxWidth !== "none") {
      KP.layout.originalMaxWidth = computedStyle.maxWidth;
    }
  }

  canvas.style.display = "block";
  canvas.style.margin = "0 auto";
}

// Default configuration
if (typeof captions === "undefined") {
  window.captions = [];
}
if (typeof debug === "undefined") {
  window.debug = false;
}

// Initialize with default or actual dimensions
KP.video.WIDTH = video.videoWidth || 1920;
KP.video.HEIGHT = video.videoHeight || 1080;

// Initial setup
init();
draw();

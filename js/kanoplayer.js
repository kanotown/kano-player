"use strict";

const video =
  document.getElementById("myVideo") ||
  document.querySelector("video") ||
  (() => {
    console.error("Kano Player: No video element found.");
    return null;
  })();

const canvas =
  document.getElementById("myCanvas") ||
  document.querySelector("canvas") ||
  (() => {
    console.error("Kano Player: No canvas element found.");
    return null;
  })();

if (!video || !canvas) {
  console.error("Kano Player: Required elements not found.");
} else {
  canvas.oncontextmenu = function () {
    return false;
  };
}

const ctx = canvas ? canvas.getContext("2d") : null;

let press = false;
let drag = false;
let playAnime = false;
let pauseAnime = false;
let stepBackAnime = false;
let stepForwardAnime = false;
let alpha = 0;
let videoScale = 1;
let videoScaleIndex = 0;
let mouseX = 500;
let mouseY = 150;
let imageDifX = 0;
let imageDifY = 0;
let videoLoading = true;
let loadAnimeIndex = 0;
let bufCurrentTime = 0;

const MAX_ALPHA = 0.6;
const MAX_SCALE = 5;
let VIDEO_WIDTH = 1920;
let VIDEO_HEIGHT = 1080;
const VIDEO_PADDING = 0;
const DURATION_DIF = 0.17;

const SEEKBAR_HEIGHT = 55;
const SEEKBAR_MARGIN = 20;

let coordLeft;
let coordWidth;
let coordTop;
let coordHeight;
let coordLeftBuf;
let coordTopBuf;
let mouseMoveX;
let mouseMoveY;
let mouseDragX;
let mouseDragY;
let mouseXanytime;
let mouseYanytime;

// Media controls
const PLAY_PAUSE_MARGIN = 2 * SEEKBAR_MARGIN - 5;
const STEP_BACK_MARGIN = 2 * SEEKBAR_MARGIN + 55;
const STEP_FORWARD_MARGIN = 2 * SEEKBAR_MARGIN + 105;
const VOLUME_MARGIN_NORMAL = 2 * SEEKBAR_MARGIN + 145;
let VOLUME_MARGIN;
let theaterMargin;
let fullscreenMargin;
let isNarrowCanvas;
let playing = false;
let onSeekBar = false;
let pressSeekBar = false;
let dragSeekBar = false;
let resume = false;
let onPlayPause = false;
let onStepBack = false;
let onStepForward = false;
let onVolume = false;
let onVolumeControl = false;
let dragVolumeControl = false;
let onTheater = false;
let theaterMode = false;
let theaterTmp = false;
let onVideoRate0_7 = false;
let onVideoRate1_0 = false;
let onVideoRate1_5 = false;
let onVideoRate2_0 = false;
let onCanvas = false;
let fading = false;
let pressOnContoroller = false;
let dragOnController = false;
let fadeAlpha = 0;
let seekBallRad = 0;
let stopCount = 100;
let onMediaControl = false;
let onPlayBackTrigger = false;
let pressPlayBackTrigger = false;
let onPlayBacks = [false, false, false, false, false, false, false];

const FACE_TRACE_MARGIN = 2 * SEEKBAR_MARGIN + 300;
const FULLSCREEN_MARGIN = 2 * SEEKBAR_MARGIN + 350;
let faceTrace = false;
let onFaceTrace = false;
let onFullscreen = false;
let isFullscreenMode = false;

let finished = false;
let replayPosY;
let replayHeight;
let onReplay = false;

// Metadata loaded flag
let metadataLoaded = false;

// Store original max-width for restoring after fullscreen/theater
let originalMaxWidth = "1200px";

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
      (window.innerWidth * VIDEO_HEIGHT) / VIDEO_WIDTH <=
      window.innerHeight
    ) {
      maxWidth = window.innerWidth;
    } else {
      maxWidth = (window.innerHeight * VIDEO_WIDTH) / VIDEO_HEIGHT - 10;
    }
    if (!theaterMode) {
      maxWidth = Math.min(maxWidth, parseInt(originalMaxWidth) || 1200);
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

  if (theaterMode && !isInFullscreen) {
    theaterTmp = true;
    theaterMode = false;
    init();
  }

  if (isFullscreenMode && !isInFullscreen) {
    isFullscreenMode = false;
    const mainEl = document.getElementById("main");
    if (mainEl) mainEl.style.background = "white";
    if (canvas) canvas.style.maxWidth = originalMaxWidth;
    init();
  }
}

function init() {
  canvas.width = theaterTmp ? canvasWidthBuf : canvas.clientWidth;
  canvas.height = (canvas.width * VIDEO_HEIGHT) / VIDEO_WIDTH + VIDEO_PADDING;

  coordLeft = 0;
  coordWidth = canvas.width;
  coordTop = 0;
  coordHeight = canvas.height - VIDEO_PADDING;
  videoScale = 1;
  videoScaleIndex = 0;

  // Compact layout for narrow canvas
  isNarrowCanvas = canvas.width <= 600;

  if (isNarrowCanvas) {
    // Hide 10s buttons on narrow canvas
    const playPauseWidth = 30;
    const volumeControlWidth = 120;
    const speedButtonWidth = 40;
    const fullscreenButtonWidth = 40;
    const timeDisplayWidth = 80;
    const buttonSpacing = 15;

    // Position after play/pause button
    VOLUME_MARGIN = SEEKBAR_MARGIN + playPauseWidth + 20;
    theaterMargin = VOLUME_MARGIN + volumeControlWidth + buttonSpacing;
    fullscreenMargin = theaterMargin + speedButtonWidth + buttonSpacing;
  } else {
    VOLUME_MARGIN = VOLUME_MARGIN_NORMAL;
    theaterMargin = canvas.width - 220;
    fullscreenMargin = canvas.width - 160;
  }

  // Replay button position
  const buttonWidth = 200;
  const buttonHeight = 80;
  replayPosY = (canvas.height - buttonHeight) / 2;
  replayHeight = buttonHeight;

  if (theaterTmp) {
    scrollTo(0, scrollPosBuf);
    theaterTmp = false;
  }
}

let isIE = false;
function msieversion() {
  const ua = window.navigator.userAgent;
  const msie = ua.indexOf("MSIE ");
  isIE = msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./);
}
msieversion();

video.addEventListener("waiting", function (event) {
  bufCurrentTime = video.currentTime;
  videoLoading = true;
});

video.addEventListener("canplay", function (event) {
  videoLoading = false;
});

video.addEventListener("loadedmetadata", function (event) {
  // Update video dimensions based on actual video
  VIDEO_WIDTH = video.videoWidth || 1920;
  VIDEO_HEIGHT = video.videoHeight || 1080;

  if (!metadataLoaded) {
    metadataLoaded = true;
    // Initialize canvas with correct aspect ratio
    init();
    draw();
  } else {
    // Reinitialize if metadata loads again
    init();
  }
});

video.addEventListener("loadeddata", function (event) {
  if (!playing) {
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
  ctx.scale(videoScale, videoScale);
  if (isIE) {
    ctx.drawImage(video, -coordLeft, -coordTop, canvas.width, canvas.height);
  } else {
    ctx.drawImage(
      video,
      -coordLeft,
      -coordTop + VIDEO_PADDING / 2,
      canvas.width,
      canvas.height - VIDEO_PADDING
    );
  }

  // Captions
  for (let c = 0; c < captions.length; c++) {
    const caption = captions[c];

    const startTime =
      caption.startTime !== undefined ? caption.startTime : caption[0];
    const endTime =
      caption.endTime !== undefined ? caption.endTime : caption[1];

    if (video.currentTime >= startTime && video.currentTime < endTime) {
      if (caption.text !== undefined) {
        let fontSize = caption.fontSize * (canvas.width / 1124);
        let lineHeight = 1.3;

        ctx.font =
          (caption.bold ? "bold " : "") +
          fontSize +
          'px "Meiryo", "Hiragino Kaku Gothic ProN", sans-serif';
        ctx.textAlign = caption.align;

        let text = caption.text;
        let lines = text.split("\n");

        if (caption.backgroundColor) {
          let baseX = 0;
          let margin = 10;
          let textWidth = 0;

          for (let i = 0; i < lines.length; i++) {
            textWidth = Math.max(textWidth, ctx.measureText(lines[i]).width);
          }

          if (caption.align === "left") {
            baseX = 0;
          } else if (caption.align === "center") {
            baseX = textWidth / 2;
          } else {
            baseX = textWidth;
          }

          ctx.fillStyle = caption.backgroundColor;
          ctx.fillRect(
            canvas.width * caption.positionX - coordLeft - baseX - margin,
            (canvas.height - VIDEO_PADDING) * caption.positionY -
              coordTop -
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

          const x = canvas.width * caption.positionX - coordLeft;
          const y =
            (canvas.height - VIDEO_PADDING) * caption.positionY -
            coordTop +
            addY;

          if (caption.strokeWidth > 0) {
            ctx.strokeStyle = caption.strokeColor || "black";
            ctx.lineWidth = caption.strokeWidth;
            ctx.strokeText(line, x, y);
          }

          ctx.fillStyle = caption.textColor || "white";
          ctx.fillText(line, x, y);
        }
      }
      // Legacy array format
      else {
        let fontSize;
        let lineHeight = 1.3;
        if (caption[3].endsWith("b")) {
          fontSize = Number(caption[3].substring(0, caption[3].indexOf("b")));
          fontSize *= canvas.width / 1124;
          ctx.font =
            "bold " +
            fontSize +
            'px "Meiryo", "Hiragino Kaku Gothic ProN", sans-serif';
        } else {
          fontSize = Number(caption[3]);
          fontSize *= canvas.width / 1124;
          ctx.font =
            fontSize + 'px "Meiryo", "Hiragino Kaku Gothic ProN", sans-serif';
        }
        ctx.textAlign = caption[4];
        let text = caption[2];
        let lines = text.split("\n");

        let difY = 380 * (canvas.width / 1124 - 1) * (0.5 - caption[6]);

        if (caption.length > 7) {
          let baseX = 0;
          let margin = 10;
          let textWidth = 0;
          for (let i = 0; i < lines.length; i++) {
            textWidth = Math.max(textWidth, ctx.measureText(lines[i]).width);
          }
          if (caption[4] == "left") {
            baseX = 0;
          } else if (caption[4] == "center") {
            baseX = textWidth / 2;
          } else {
            baseX = textWidth;
          }
          ctx.fillStyle = caption[7];
          ctx.fillRect(
            canvas.width * caption[5] - coordLeft - baseX - margin,
            canvas.height * caption[6] -
              coordTop -
              (fontSize * lineHeight) / 2 -
              difY -
              margin / 4,
            textWidth + margin * 2,
            fontSize * lineHeight * lines.length + margin
          );
        }

        ctx.fillStyle = "white";
        for (let i = 0; i < lines.length; i++) {
          let line = lines[i];
          let addY = fontSize / 2;

          if (i > 0) {
            addY += fontSize * lineHeight * i;
          }

          ctx.fillText(
            line,
            canvas.width * caption[5] - coordLeft,
            canvas.height * caption[6] + addY - coordTop - difY
          );
        }
      }
    }
  }
  ctx.restore();

  // Debug info
  if (debug) {
    ctx.font = 'bold 20px "Meiryo", "Hiragino Kaku Gothic ProN", sans-serif';
    ctx.fillStyle = "white";
    ctx.textAlign = "left";
    ctx.fillText("time: " + video.currentTime.toFixed("2"), 10, 20);
    ctx.fillText(
      "(" +
        (mouseMoveX / canvas.width).toFixed(2) +
        ", " +
        (mouseMoveY / canvas.height).toFixed(2) +
        ")",
      10,
      40
    );
  }
  ctx.textAlign = "right";

  if (finished) {
    if (theaterMode) {
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
    if (onReplay) {
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
    ctx.strokeStyle = onReplay
      ? "rgba(255, 255, 255, 0.4)"
      : "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = onReplay
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

    ctx.fillStyle = onReplay
      ? "rgba(255, 255, 255, 0.9)"
      : "rgba(255, 255, 255, 0.7)";
    ctx.font = 'bold 26px "Arial"';
    ctx.textAlign = "left";
    ctx.fillText("Replay", iconX + 40, iconY + 8);

    requestAnimationFrame(draw);
    return;
  }

  if (playAnime) {
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(0.3 + (0.6 - alpha) / 2, 0.3 + (0.6 - alpha) / 2);

    ctx.fillStyle = "rgba(0, 0, 0, " + alpha + ")";
    ctx.beginPath();
    ctx.arc(0, 0, 100, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 255, 255, " + alpha + ")";
    ctx.beginPath();
    ctx.moveTo(-30, -45);
    ctx.lineTo(50, 0);
    ctx.lineTo(-30, 45);
    ctx.closePath();
    ctx.fill();

    alpha -= 0.02;
    if (alpha < 0) {
      playAnime = false;
    }
    ctx.restore();
  } else if (pauseAnime) {
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(0.3 + (0.6 - alpha) / 2, 0.3 + (0.6 - alpha) / 2);

    ctx.fillStyle = "rgba(0, 0, 0, " + alpha + ")";
    ctx.beginPath();
    ctx.arc(0, 0, 100, 0, 2 * Math.PI);
    ctx.fill();
    ctx.lineWidth = 22;
    ctx.strokeStyle = "rgba(255, 255, 255, " + alpha + ")";
    ctx.beginPath();
    ctx.moveTo(-23, -45);
    ctx.lineTo(-23, 45);
    ctx.moveTo(23, -45);
    ctx.lineTo(23, 45);
    ctx.stroke();

    alpha -= 0.02;
    if (alpha < 0) {
      pauseAnime = false;
    }
    ctx.restore();
  } else if (stepBackAnime) {
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(0.3 + (0.6 - alpha) / 2, 0.3 + (0.6 - alpha) / 2);

    ctx.fillStyle = "rgba(0, 0, 0, " + alpha + ")";
    ctx.beginPath();
    ctx.arc(0, 0, 100, 0, 2 * Math.PI);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 255, 255, " + alpha + ")";
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(0, 0, 55, -Math.PI / 2 - 0.61, Math.PI / 2 + 1.2);
    ctx.stroke();
    ctx.fillStyle = "rgba(255, 255, 255, " + alpha + ")";
    ctx.beginPath();
    ctx.moveTo(-45, -60);
    ctx.lineTo(-18, -31);
    ctx.lineTo(-60, -20);
    ctx.closePath();
    ctx.fill();
    ctx.font = '48px "Arial"';
    ctx.fillText("10", 25, 20);

    alpha -= 0.02;
    if (alpha < 0) {
      stepBackAnime = false;
    }
    ctx.restore();
  } else if (stepForwardAnime) {
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(0.3 + (0.6 - alpha) / 2, 0.3 + (0.6 - alpha) / 2);

    ctx.fillStyle = "rgba(0, 0, 0, " + alpha + ")";
    ctx.beginPath();
    ctx.arc(0, 0, 100, 0, 2 * Math.PI);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 255, 255, " + alpha + ")";
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(0, 0, 55, -Math.PI / 2 + 0.61, Math.PI / 2 - 1.2, true);
    ctx.stroke();
    ctx.fillStyle = "rgba(255, 255, 255, " + alpha + ")";
    ctx.beginPath();
    ctx.moveTo(45, -60);
    ctx.lineTo(18, -31);
    ctx.lineTo(60, -20);
    ctx.closePath();
    ctx.fill();
    ctx.font = '48px "Arial"';
    ctx.fillText("10", 25, 20);

    alpha -= 0.02;
    if (alpha < 0) {
      stepForwardAnime = false;
    }
    ctx.restore();
  }

  if (onCanvas && !onMediaControl && playing) {
    stopCount--;
    if (stopCount === 0) {
      fading = true;
      fadeAlpha = 50;
    }
  }

  if (onCanvas || !playing || fading) {
    if (fading) {
      if (fadeAlpha === 0) {
        ctx.globalAlpha = 0;
        if (onCanvas) document.body.style.cursor = "none";
      } else {
        fadeAlpha--;
        ctx.globalAlpha = Math.min(10, fadeAlpha) / 10;
      }
    }

    let grayBsck = "rgba(40, 40, 40, 0.6)";

    let back = ctx.createLinearGradient(
      0,
      canvas.height - 2 * SEEKBAR_HEIGHT,
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
      canvas.height - 2 * SEEKBAR_HEIGHT,
      canvas.width,
      2 * SEEKBAR_HEIGHT
    );

    let seekBarWidth = canvas.width - 2 * SEEKBAR_MARGIN;

    if (onSeekBar || dragSeekBar) {
      ctx.lineWidth = 7;
    } else {
      ctx.lineWidth = 6;
    }
    ctx.strokeStyle = "rgba(180, 180, 180, 0.3)";
    ctx.beginPath();
    ctx.moveTo(SEEKBAR_MARGIN - 0.5, canvas.height - SEEKBAR_HEIGHT);
    ctx.lineTo(
      canvas.width - SEEKBAR_MARGIN + 0.5,
      canvas.height - SEEKBAR_HEIGHT
    );
    ctx.stroke();

    if (onSeekBar || dragSeekBar) {
      ctx.lineWidth = 5;
    } else {
      ctx.lineWidth = 4;
    }
    ctx.strokeStyle = "gray";
    ctx.beginPath();
    ctx.moveTo(SEEKBAR_MARGIN, canvas.height - SEEKBAR_HEIGHT);
    ctx.lineTo(canvas.width - SEEKBAR_MARGIN, canvas.height - SEEKBAR_HEIGHT);
    ctx.stroke();

    if (video.buffered.length > 0) {
      ctx.strokeStyle = "lightgray";
      for (let b = 0; b < video.buffered.length; b++) {
        if (video.buffered.start(b) > video.currentTime) break;
        if (video.buffered.end(b) < video.currentTime) continue;
        ctx.beginPath();
        ctx.moveTo(
          SEEKBAR_MARGIN +
            (seekBarWidth * video.currentTime) /
              (video.duration - DURATION_DIF),
          canvas.height - SEEKBAR_HEIGHT
        );
        if (video.buffered.end(b) === video.duration) {
          ctx.lineTo(
            SEEKBAR_MARGIN +
              (seekBarWidth * (video.buffered.end(b) - DURATION_DIF)) /
                (video.duration - DURATION_DIF),
            canvas.height - SEEKBAR_HEIGHT
          );
        } else {
          ctx.lineTo(
            SEEKBAR_MARGIN +
              (seekBarWidth * video.buffered.end(b)) /
                (video.duration - DURATION_DIF),
            canvas.height - SEEKBAR_HEIGHT
          );
        }
        ctx.stroke();
      }
    }

    ctx.strokeStyle = "red";
    ctx.beginPath();
    ctx.moveTo(SEEKBAR_MARGIN, canvas.height - SEEKBAR_HEIGHT);
    ctx.lineTo(
      SEEKBAR_MARGIN +
        (seekBarWidth * video.currentTime) / (video.duration - DURATION_DIF),
      canvas.height - SEEKBAR_HEIGHT
    );
    ctx.stroke();

    if ((onSeekBar || dragSeekBar) && !dragVolumeControl) {
      if (seekBallRad < 6) {
        seekBallRad++;
      }

      ctx.fillStyle = "red";
      ctx.beginPath();
      ctx.arc(
        SEEKBAR_MARGIN +
          (seekBarWidth * video.currentTime) / (video.duration - DURATION_DIF),
        canvas.height - SEEKBAR_HEIGHT,
        seekBallRad,
        0,
        2 * Math.PI
      );
      ctx.fill();
    } else {
      if (seekBallRad > 0) {
        seekBallRad--;
        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(
          SEEKBAR_MARGIN +
            (seekBarWidth * video.currentTime) /
              (video.duration - DURATION_DIF),
          canvas.height - SEEKBAR_HEIGHT,
          seekBallRad,
          0,
          2 * Math.PI
        );
        ctx.fill();
      }
    }

    if (
      video.currentTime >= video.duration - DURATION_DIF &&
      !video.onwaiting
    ) {
      video.currentTime = video.duration;
      if (playing) flipPlayPauseVideo();
      finished = true;
    }

    if ((onSeekBar || dragSeekBar) && !dragVolumeControl) {
      let seekPos =
        (mouseMoveX - SEEKBAR_MARGIN) / (canvas.width - 2 * SEEKBAR_MARGIN);
      let seekPosDifX = 0;
      seekPos = seekBarWidth * Math.max(0, Math.min(1, seekPos));
      if (seekPos - 7 < SEEKBAR_MARGIN) {
        seekPosDifX = SEEKBAR_MARGIN - seekPos + 7;
      } else if (seekPos + 27 > canvas.width - 2 * SEEKBAR_MARGIN) {
        seekPosDifX = canvas.width - 2 * SEEKBAR_MARGIN - seekPos - 27;
      }
      ctx.fillStyle = grayBsck;
      ctx.fillRect(
        seekPosDifX + seekPos - 27 + SEEKBAR_MARGIN,
        canvas.height - SEEKBAR_HEIGHT - 37,
        54,
        27
      );

      let timeBuf =
        (mouseMoveX - SEEKBAR_MARGIN) / (canvas.width - 2 * SEEKBAR_MARGIN);
      timeBuf =
        (video.duration - DURATION_DIF) * Math.max(0, Math.min(1, timeBuf));
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
        seekPosDifX + seekPos + SEEKBAR_MARGIN,
        canvas.height - SEEKBAR_HEIGHT - 18
      );
    }

    if (onPlayPause && !dragSeekBar && !dragVolumeControl) {
      ctx.strokeStyle = "white";
      if (!playing) {
        ctx.fillStyle = grayBsck;
        ctx.fillRect(
          SEEKBAR_MARGIN,
          canvas.height - SEEKBAR_HEIGHT - 37,
          92,
          27
        );
        ctx.fillStyle = "white";
        ctx.font = '15px "Arial"';
        ctx.textAlign = "left";
        ctx.fillText(
          "Play [space]",
          SEEKBAR_MARGIN + 5,
          canvas.height - SEEKBAR_HEIGHT - 18
        );
      } else {
        ctx.fillStyle = grayBsck;
        ctx.fillRect(
          SEEKBAR_MARGIN,
          canvas.height - SEEKBAR_HEIGHT - 37,
          94,
          27
        );

        ctx.fillStyle = "white";
        ctx.font = '15px "Arial"';
        ctx.textAlign = "left";
        ctx.fillText(
          "Stop [space]",
          SEEKBAR_MARGIN + 5,
          canvas.height - SEEKBAR_HEIGHT - 18
        );
      }
    } else {
      ctx.fillStyle = "lightgray";
      ctx.strokeStyle = "lightgray";
    }
    if (!playing) {
      ctx.beginPath();
      ctx.moveTo(PLAY_PAUSE_MARGIN, canvas.height - 35);
      ctx.lineTo(PLAY_PAUSE_MARGIN + 20, canvas.height - 25);
      ctx.lineTo(PLAY_PAUSE_MARGIN, canvas.height - 15);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(PLAY_PAUSE_MARGIN + 3, canvas.height - 35);
      ctx.lineTo(PLAY_PAUSE_MARGIN + 3, canvas.height - 15);
      ctx.moveTo(PLAY_PAUSE_MARGIN + 13, canvas.height - 35);
      ctx.lineTo(PLAY_PAUSE_MARGIN + 13, canvas.height - 15);
      ctx.stroke();
    }

    if (!isNarrowCanvas) {
      if (onStepBack && !dragSeekBar && !dragVolumeControl) {
        ctx.strokeStyle = "white";
        ctx.fillStyle = grayBsck;
        ctx.fillRect(
          STEP_BACK_MARGIN - 45,
          canvas.height - SEEKBAR_HEIGHT - 37,
          100,
          27
        );

        ctx.fillStyle = "white";
        ctx.font = '15px "Arial"';
        ctx.textAlign = "left";
        ctx.fillText(
          "10s back [←]",
          STEP_BACK_MARGIN - 40,
          canvas.height - SEEKBAR_HEIGHT - 18
        );
      } else {
        ctx.fillStyle = "lightgray";
        ctx.strokeStyle = "lightgray";
      }
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(
        STEP_BACK_MARGIN,
        canvas.height - 25,
        13,
        -Math.PI / 2 - 0.8,
        Math.PI / 2 + 1.2
      );
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(STEP_BACK_MARGIN - 11, canvas.height - 38);
      ctx.lineTo(STEP_BACK_MARGIN - 3, canvas.height - 31);
      ctx.lineTo(STEP_BACK_MARGIN - 12, canvas.height - 28);
      ctx.closePath();
      ctx.fill();
      ctx.font = '11px "Arial"';
      ctx.textAlign = "right";
      ctx.fillText("10", STEP_BACK_MARGIN + 6, canvas.height - 20);
    }

    if (!isNarrowCanvas) {
      if (onStepForward && !dragSeekBar && !dragVolumeControl) {
        ctx.strokeStyle = "white";
        ctx.fillStyle = grayBsck;
        ctx.fillRect(
          STEP_FORWARD_MARGIN - 45,
          canvas.height - SEEKBAR_HEIGHT - 37,
          120,
          27
        );

        ctx.fillStyle = "white";
        ctx.font = '15px "Arial"';
        ctx.textAlign = "left";
        ctx.fillText(
          "10s forward [→]",
          STEP_FORWARD_MARGIN - 40,
          canvas.height - SEEKBAR_HEIGHT - 18
        );
      } else {
        ctx.fillStyle = "lightgray";
        ctx.strokeStyle = "lightgray";
      }
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(
        STEP_FORWARD_MARGIN,
        canvas.height - 25,
        13,
        -Math.PI / 2 + 0.8,
        Math.PI / 2 - 1.2,
        true
      );
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(STEP_FORWARD_MARGIN + 11, canvas.height - 38);
      ctx.lineTo(STEP_FORWARD_MARGIN + 3, canvas.height - 31);
      ctx.lineTo(STEP_FORWARD_MARGIN + 12, canvas.height - 28);
      ctx.closePath();
      ctx.fill();
      ctx.font = '11px "Arial"';
      ctx.textAlign = "right";
      ctx.fillText("10", STEP_FORWARD_MARGIN + 5, canvas.height - 20);
    }

    if (onVolume && !dragSeekBar && !dragVolumeControl) {
      ctx.strokeStyle = "white";
      ctx.fillStyle = grayBsck;
      ctx.fillRect(
        VOLUME_MARGIN - 18,
        canvas.height - SEEKBAR_HEIGHT - 37,
        70,
        27
      );

      ctx.fillStyle = "white";
      ctx.font = '15px "Arial"';
      ctx.textAlign = "left";
      ctx.fillText(
        "Mute [m]",
        VOLUME_MARGIN - 13,
        canvas.height - SEEKBAR_HEIGHT - 18
      );
    } else {
      ctx.fillStyle = "lightgray";
      ctx.strokeStyle = "lightgray";
    }
    ctx.beginPath();
    ctx.moveTo(VOLUME_MARGIN, canvas.height - 30);
    ctx.lineTo(VOLUME_MARGIN + 6, canvas.height - 30);
    ctx.lineTo(VOLUME_MARGIN + 16, canvas.height - 36);
    ctx.lineTo(VOLUME_MARGIN + 16, canvas.height - 14);
    ctx.lineTo(VOLUME_MARGIN + 6, canvas.height - 20);
    ctx.lineTo(VOLUME_MARGIN, canvas.height - 20);
    ctx.closePath();
    ctx.fill();

    let volumeBuf = video.muted ? 0 : video.volume;

    ctx.lineWidth = 2;
    if (volumeBuf > 0) {
      ctx.strokeStyle = "lightgray";
      ctx.beginPath();
      ctx.arc(
        VOLUME_MARGIN + 18,
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
        VOLUME_MARGIN + 18,
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
        VOLUME_MARGIN + 18,
        canvas.height - 25,
        12,
        -Math.PI / 2 + 0.6,
        Math.PI / 2 - 0.6
      );
      ctx.stroke();
    } else {
      ctx.strokeStyle = "rgb(180, 180, 180)";
      ctx.beginPath();
      ctx.moveTo(VOLUME_MARGIN + 20, canvas.height - 30);
      ctx.lineTo(VOLUME_MARGIN + 30, canvas.height - 20);
      ctx.moveTo(VOLUME_MARGIN + 20, canvas.height - 20);
      ctx.lineTo(VOLUME_MARGIN + 30, canvas.height - 30);
      ctx.stroke();
    }

    ctx.lineWidth = 3;
    ctx.strokeStyle = "gray";
    ctx.beginPath();
    ctx.moveTo(VOLUME_MARGIN + 42, canvas.height - 25);
    ctx.lineTo(VOLUME_MARGIN + 112, canvas.height - 25);
    ctx.stroke();
    ctx.strokeStyle = "white";
    ctx.beginPath();
    ctx.moveTo(VOLUME_MARGIN + 42, canvas.height - 25);
    ctx.lineTo(VOLUME_MARGIN + 42 + volumeBuf * 70, canvas.height - 25);
    ctx.fillStyle = "white";
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(
      VOLUME_MARGIN + 42 + volumeBuf * 70,
      canvas.height - 25,
      5,
      0,
      2 * Math.PI
    );
    ctx.fill();

    const speedControlY = canvas.height - 38;

    if (
      (onPlayBackTrigger && !dragSeekBar && !dragVolumeControl) ||
      pressPlayBackTrigger
    ) {
      ctx.fillStyle = "rgb(90, 90, 90)";
    } else {
      ctx.fillStyle = "rgb(50, 50, 50)";
    }
    ctx.fillRect(theaterMargin, speedControlY, 40, 25);

    ctx.font = '13px "Arial"';
    ctx.textAlign = "left";
    if (pressPlayBackTrigger) {
      for (let y = 1; y < 8; y++) {
        if (onPlayBacks[7 - y]) {
          ctx.fillStyle = "rgb(110, 110, 110)";
        } else if (
          video.playbackRate.toFixed(1) === (0.6 + y * 0.2).toFixed(1)
        ) {
          ctx.fillStyle = "rgb(90, 90, 90)";
        } else {
          ctx.fillStyle = "rgb(50, 50, 50)";
        }
        const itemY = canvas.height - 38 - y * 25;
        ctx.fillRect(theaterMargin, itemY, 40, 25);

        if (
          onPlayBacks[7 - y] ||
          video.playbackRate.toFixed(1) === (0.6 + y * 0.2).toFixed(1)
        ) {
          ctx.fillStyle = "white";
        } else {
          ctx.fillStyle = "rgb(200, 200, 200)";
        }
        const textY = canvas.height - 20 - y * 25;
        ctx.fillText(
          "x" + (0.6 + y * 0.2).toFixed(1),
          theaterMargin + 8,
          textY
        );
      }
    }

    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgb(120, 120, 120)";
    ctx.strokeRect(theaterMargin, speedControlY, 40, 25);

    if (!isNarrowCanvas) {
      ctx.fillStyle = "white";
      ctx.font = '13px "Arial"';
      ctx.textAlign = "left";
      ctx.fillText("Speed：", theaterMargin - 55, canvas.height - 20);
    }

    ctx.fillStyle = "white";
    ctx.fillText(
      "x" + video.playbackRate.toFixed(1),
      theaterMargin + 8,
      canvas.height - 20
    );

    const fullscreenButtonY = canvas.height - 30;
    const fullscreenTooltipY = canvas.height - SEEKBAR_HEIGHT - 37;

    if (onFullscreen && !dragSeekBar && !dragVolumeControl) {
      ctx.fillStyle = grayBsck;
      ctx.fillRect(fullscreenMargin - 15, fullscreenTooltipY, 57, 27);
      ctx.fillStyle = "white";
      ctx.font = '15px "Arial"';
      ctx.textAlign = "left";
      ctx.fillText(
        isFullscreenMode ? "Exit [F]" : "Full [F]",
        fullscreenMargin - 10,
        fullscreenTooltipY + 18
      );
    } else {
      ctx.fillStyle = "lightgray";
      ctx.strokeStyle = "lightgray";
    }

    ctx.lineWidth = 3;
    if (!isFullscreenMode) {
      ctx.beginPath();
      ctx.moveTo(fullscreenMargin, fullscreenButtonY);
      ctx.lineTo(fullscreenMargin, fullscreenButtonY - 6);
      ctx.lineTo(fullscreenMargin + 10, fullscreenButtonY - 6);

      ctx.moveTo(fullscreenMargin + 20, fullscreenButtonY - 6);
      ctx.lineTo(fullscreenMargin + 30, fullscreenButtonY - 6);
      ctx.lineTo(fullscreenMargin + 30, fullscreenButtonY);

      ctx.moveTo(fullscreenMargin + 30, fullscreenButtonY + 9);
      ctx.lineTo(fullscreenMargin + 30, fullscreenButtonY + 15);
      ctx.lineTo(fullscreenMargin + 20, fullscreenButtonY + 15);

      ctx.moveTo(fullscreenMargin + 10, fullscreenButtonY + 15);
      ctx.lineTo(fullscreenMargin, fullscreenButtonY + 15);
      ctx.lineTo(fullscreenMargin, fullscreenButtonY + 9);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(fullscreenMargin, fullscreenButtonY);
      ctx.lineTo(fullscreenMargin + 8, fullscreenButtonY);
      ctx.lineTo(fullscreenMargin + 8, fullscreenButtonY - 5);

      ctx.moveTo(fullscreenMargin + 22, fullscreenButtonY - 5);
      ctx.lineTo(fullscreenMargin + 22, fullscreenButtonY);
      ctx.lineTo(fullscreenMargin + 30, fullscreenButtonY);

      ctx.moveTo(fullscreenMargin + 30, fullscreenButtonY + 10);
      ctx.lineTo(fullscreenMargin + 22, fullscreenButtonY + 10);
      ctx.lineTo(fullscreenMargin + 22, fullscreenButtonY + 15);

      ctx.moveTo(fullscreenMargin + 8, fullscreenButtonY + 15);
      ctx.lineTo(fullscreenMargin + 8, fullscreenButtonY + 10);
      ctx.lineTo(fullscreenMargin, fullscreenButtonY + 10);
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

      if (!isNarrowCanvas) {
        txtTime += " / ";
        txtTime += durM < 10 ? "0" + durM + ":" : durM + ":";
        txtTime += durS < 10 ? "0" + durS : durS;
      }
    } else {
      txtTime = isNarrowCanvas ? "00:00" : "00:00 / 00:00";
    }
    ctx.fillStyle = "white";
    ctx.font = '15px "Arial"';
    ctx.textAlign = "right";
    ctx.fillText(txtTime, canvas.width - SEEKBAR_MARGIN, canvas.height - 20);
  }

  ctx.globalAlpha = 1;
  if (
    videoLoading &&
    !playAnime &&
    !pauseAnime &&
    !stepBackAnime &&
    !stepForwardAnime
  ) {
    if (bufCurrentTime !== video.currentTime) {
      videoLoading = false;
    } else {
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      loadAnimeIndex++;

      let rad,
        count = 0;
      if (loadAnimeIndex === 80) loadAnimeIndex = 0;
      for (let theta = 0; theta < 2 * Math.PI; theta += Math.PI / 4) {
        rad = 14 - ((loadAnimeIndex / 10 + count++) % 8) * 1.5;
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
  if (!playing) {
    if (video.currentTime === video.duration - DURATION_DIF) {
      video.currentTime = 0;
    }
    video.play();
    playAnime = true;
    pauseAnime = false;
    playing = true;
    if (!onCanvas) {
      fading = true;
      fadeAlpha = 100;
    }
  } else {
    video.pause();
    playAnime = false;
    pauseAnime = true;
    playing = false;
    fading = false;
    stopCount = 100;
  }

  stepBackAnime = false;
  stepForwardAnime = false;
  alpha = MAX_ALPHA;
}

// Step back 10s
function stepBack() {
  video.currentTime = Math.max(0, video.currentTime - 10);
  playAnime = false;
  pauseAnime = false;
  stepBackAnime = true;
  stepForwardAnime = false;
  alpha = MAX_ALPHA;
}

// Step forward 10s
function stepForward() {
  if (video.currentTime < video.duration) {
    video.currentTime = Math.min(
      video.duration - DURATION_DIF,
      video.currentTime + 10
    );
    if (video.currentTime === video.duration - DURATION_DIF && playing) {
      flipPlayPauseVideo();
    }
  }
  playAnime = false;
  pauseAnime = false;
  stepBackAnime = false;
  stepForwardAnime = true;
  alpha = MAX_ALPHA;
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

  if (finished) {
    if (onReplay) {
      finished = false;
      video.currentTime = 0;
      video.play();
      playing = true;
      playAnime = true;
      pauseAnime = false;
      alpha = MAX_ALPHA;
    }
    return;
  }

  press = false;
  if (drag) {
    drag = false;
    return;
  }

  if (dragSeekBar) {
    dragSeekBar = false;
    pressSeekBar = false;
    if (resume) video.play();

    if (playing) {
      bufCurrentTime = video.currentTime;
      videoLoading = true;
    }

    return;
  } else if (pressSeekBar) {
    pressSeekBar = false;
    if (resume) video.play();

    if (playing) {
      bufCurrentTime = video.currentTime;
      videoLoading = true;
    }

    return;
  }
  if (dragVolumeControl || onVolumeControl) {
    dragVolumeControl = false;
    onVolumeControl = false;
    return;
  }

  if (dragOnController) {
    dragOnController = false;
    pressOnContoroller = false;
    return;
  }

  if (pressPlayBackTrigger) {
    for (let i = 0; i < 7; i++) {
      if (onPlayBacks[i]) {
        video.playbackRate = 2.0 - i * 0.2;
        onPlayBacks[i] = false;
        pressPlayBackTrigger = false;
        onPlayBackTrigger = false;

        return;
      }
    }
  } else if (onPlayBackTrigger) {
    pressPlayBackTrigger = !pressPlayBackTrigger;
    return;
  }

  pressPlayBackTrigger = false;

  if (mouseMoveY > 0 && canvas.height - mouseMoveY > SEEKBAR_HEIGHT + 10) {
    flipPlayPauseVideo();
    onPlayBackTrigger = false;
    if (playing) {
    } else {
    }
  } else if (onPlayPause) {
    flipPlayPauseVideo();
    onPlayBackTrigger = false;
  } else if (onStepBack && !canvas.width <= 600) {
    stepBack();
    onPlayBackTrigger = false;
  } else if (onStepForward && !canvas.width <= 600) {
    stepForward();
    onPlayBackTrigger = false;
  } else if (onFaceTrace) {
    onPlayBackTrigger = false;
    if (!faceTrace) {
      faceTrace = true;
    } else {
      faceTrace = false;
    }
  } else if (onVolume) {
    video.muted = !video.muted;
    onPlayBackTrigger = false;
  } else if (onTheater) {
    flipTheaterMode();
    onPlayBackTrigger = false;
  } else if (onFullscreen) {
    toggleFullscreen();
    onPlayBackTrigger = false;
  }
}

function mouseDown(e) {
  if (finished) return;

  if (getMouseX(e) === -1 || getMouseY(e) === -1) return;

  if (
    pressPlayBackTrigger &&
    mouseMoveX > theaterMargin &&
    mouseMoveX < theaterMargin + 40 &&
    mouseMoveY > canvas.height - 213 &&
    getMouseY(e) < canvas.height - 10
  ) {
    return;
  }

  if (Math.abs(canvas.height - SEEKBAR_HEIGHT - mouseMoveY) < 8) {
    resume = playing;
    video.pause();
    pressSeekBar = true;
    mouseDragX = getMouseX(e);
    let timeRate =
      (mouseDragX - SEEKBAR_MARGIN) / (canvas.width - 2 * SEEKBAR_MARGIN);
    timeRate = Math.max(0, Math.min(1, timeRate));
    video.currentTime = (video.duration - DURATION_DIF) * timeRate;
  } else if (
    mouseMoveX > VOLUME_MARGIN + 40 &&
    mouseMoveX < VOLUME_MARGIN + 115 &&
    mouseMoveY > canvas.height - 35 &&
    mouseMoveY < canvas.height - 15
  ) {
    video.muted = false;
    onVolumeControl = true;
    mouseDragX = getMouseX(e);
    let volumeBuf = (mouseDragX - VOLUME_MARGIN - 42) / 70;
    volumeBuf = Math.max(0, Math.min(1, volumeBuf));
    video.volume = volumeBuf;
  } else if (canvas.height - mouseMoveY > SEEKBAR_HEIGHT) {
    coordLeftBuf = coordLeft;
    coordTopBuf = coordTop;
    press = true;
  } else {
    pressOnContoroller = true;
  }
}

function mouseUp(e) {
  pressOnContoroller = false;
  press = false;
}

function mouseOut() {
  returnScroll();
  onCanvas = false;
  press = false;
  pressSeekBar = false;
  dragSeekBar = false;
  onVolumeControl = false;
  dragVolumeControl = false;
  offAllFlags();
  document.body.style.cursor = "auto";

  if (playing) {
    fading = true;
    fadeAlpha = 50;
  }

  if (finished) {
    onReplay = false;
  }
}

function mouseOver() {
  noScroll();
  onCanvas = true;
  fadeAlpha = 50;
  fading = false;
}

function mouseMove(e) {
  mouseXanytime = getMouseX(e);
  mouseYanytime = getMouseY(e);

  if (mouseXanytime === -1 || mouseYanytime === -1) {
    document.body.style.cursor = "auto";
    offAllFlags();
    return;
  }

  if (finished) {
    mouseMoveX = getMouseX(e);
    mouseMoveY = getMouseY(e);
    const buttonWidth = 200;
    const buttonX = (canvas.width - buttonWidth) / 2;
    if (
      mouseMoveX > buttonX &&
      mouseMoveX < buttonX + buttonWidth &&
      mouseMoveY > replayPosY &&
      mouseMoveY < replayPosY + replayHeight
    ) {
      onReplay = true;
      document.body.style.cursor = "pointer";
    } else {
      onReplay = false;
      document.body.style.cursor = "auto";
    }
    return;
  }

  if (!onCanvas) onCanvas = true;

  fading = false;
  stopCount = 100;
  if (
    getMouseY(e) > canvas.height - SEEKBAR_HEIGHT - 10 &&
    getMouseY(e) < canvas.height
  ) {
    onMediaControl = true;
  } else {
    onMediaControl = false;
  }

  dragOnController =
    pressOnContoroller &&
    (getMouseX(e) !== mouseMoveX || getMouseY(e) !== mouseMoveY);

  if (pressSeekBar) {
    dragSeekBar = true;
    mouseDragX = getMouseX(e);
    let timeRate =
      (mouseDragX - SEEKBAR_MARGIN) / (canvas.width - 2 * SEEKBAR_MARGIN);
    timeRate = Math.max(0, Math.min(1, timeRate));
    video.currentTime = (video.duration - DURATION_DIF) * timeRate;
  } else if (onVolumeControl) {
    dragVolumeControl = true;
    mouseDragX = getMouseX(e);
    let volumeBuf = (mouseDragX - VOLUME_MARGIN - 42) / 70;
    volumeBuf = Math.max(0, Math.min(1, volumeBuf));
    video.volume = volumeBuf;
    return;
  }
  if (press) {
    mouseDragX = getMouseX(e);
    mouseDragY = getMouseY(e);
    if (mouseDragX === mouseMoveX && mouseDragY === mouseMoveY) return;

    drag = true;
    if (videoScale === 1) return;

    coordLeft = coordLeftBuf + (mouseMoveX - mouseDragX) / videoScale;
    coordTop = coordTopBuf + (mouseMoveY - mouseDragY) / videoScale;

    coordLeft = Math.max(0, Math.min(canvas.width - coordWidth, coordLeft));
    coordTop = Math.max(0, Math.min(canvas.height - coordHeight, coordTop));
  } else if (!dragOnController) {
    drag = false;
    mouseMoveX = getMouseX(e);
    mouseMoveY = getMouseY(e);

    const speedMenuStartY = canvas.height - 213;
    const speedMenuEndY = canvas.height - 10;

    if (
      pressPlayBackTrigger &&
      mouseMoveX > theaterMargin &&
      mouseMoveX < theaterMargin + 40 &&
      mouseMoveY > speedMenuStartY &&
      getMouseY(e) < speedMenuEndY
    ) {
      document.body.style.cursor = "pointer";
      offAllFlags();
      onPlayBackTrigger = true;
      onPlayBacks[Math.floor((mouseMoveY - speedMenuStartY) / 25)] = true;
    } else if (Math.abs(canvas.height - SEEKBAR_HEIGHT - mouseMoveY) < 8) {
      document.body.style.cursor = "pointer";
      if (!onSeekBar) seekBallRad = 0;
      offAllFlags();
      onSeekBar = true;
    } else if (
      mouseMoveX > SEEKBAR_MARGIN &&
      mouseMoveX < 3 * SEEKBAR_MARGIN + 5 &&
      mouseMoveY > canvas.height - SEEKBAR_HEIGHT + 10 &&
      getMouseY(e) < canvas.height
    ) {
      document.body.style.cursor = "pointer";
      offAllFlags();
      onPlayPause = true;
    } else if (
      !isNarrowCanvas &&
      mouseMoveX > STEP_BACK_MARGIN - 15 &&
      mouseMoveX < STEP_BACK_MARGIN + 13 &&
      mouseMoveY > canvas.height - SEEKBAR_HEIGHT + 10 &&
      getMouseY(e) < canvas.height
    ) {
      document.body.style.cursor = "pointer";
      offAllFlags();
      onStepBack = true;
    } else if (
      !isNarrowCanvas &&
      mouseMoveX > STEP_FORWARD_MARGIN - 15 &&
      mouseMoveX < STEP_FORWARD_MARGIN + 13 &&
      mouseMoveY > canvas.height - SEEKBAR_HEIGHT + 10 &&
      getMouseY(e) < canvas.height
    ) {
      document.body.style.cursor = "pointer";
      offAllFlags();
      onStepForward = true;
    } else if (
      mouseMoveX > VOLUME_MARGIN - 7 &&
      mouseMoveX < VOLUME_MARGIN + 32 &&
      mouseMoveY > canvas.height - SEEKBAR_HEIGHT + 10 &&
      getMouseY(e) < canvas.height
    ) {
      document.body.style.cursor = "pointer";
      offAllFlags();
      onVolume = true;
    } else if (
      mouseMoveX > VOLUME_MARGIN + 40 &&
      mouseMoveX < VOLUME_MARGIN + 115 &&
      mouseMoveY > canvas.height - 35 &&
      mouseMoveY < canvas.height - 15
    ) {
      document.body.style.cursor = "pointer";
    } else if (
      mouseMoveX > FACE_TRACE_MARGIN - 15 &&
      mouseMoveX < FACE_TRACE_MARGIN + 13 &&
      mouseMoveY > canvas.height - SEEKBAR_HEIGHT + 10 &&
      getMouseY(e) < canvas.height
    ) {
      document.body.style.cursor = "pointer";
      offAllFlags();
      onFaceTrace = true;
    } else if (
      mouseMoveX > theaterMargin &&
      mouseMoveX < theaterMargin + 40 &&
      mouseMoveY > canvas.height - SEEKBAR_HEIGHT + 10 &&
      getMouseY(e) < canvas.height - 10
    ) {
      document.body.style.cursor = "pointer";
      offAllFlags();
      onPlayBackTrigger = true;
    } else if (
      mouseMoveX > fullscreenMargin - 6 &&
      mouseMoveX < fullscreenMargin + 36 &&
      mouseMoveY > canvas.height - SEEKBAR_HEIGHT + 10 &&
      getMouseY(e) < canvas.height
    ) {
      document.body.style.cursor = "pointer";
      offAllFlags();
      onFullscreen = true;
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
  onSeekBar = false;
  onPlayPause = false;
  onStepBack = false;
  onStepForward = false;
  onFaceTrace = false;
  onVolume = false;
  onVolumeControl = false;
  onTheater = false;
  onPlayBackTrigger = false;
  onFullscreen = false;

  onPlayBacks.fill(false);
}

// Canvas zoom
let mousePrevX = -1;
let timeStamp = 0;
function canvasZoom(e) {
  if (finished) return;

  mouseX = getMouseX(e);
  mouseY = getMouseY(e);
  if (mousePrevX == -1) mousePrevX = mouseX;

  let zoomChange = true;

  if (e.timeStamp - timeStamp < 30) {
    return;
  } else {
    timeStamp = e.timeStamp;
  }

  const isZoomIn = e.wheelDelta > 0;

  if (isZoomIn) {
    videoScaleIndex++;
    videoScale = 1 + videoScaleIndex * 0.2;
    if (videoScale > MAX_SCALE) {
      videoScale = MAX_SCALE;
      videoScaleIndex--;
      zoomChange = false;
    }
  } else {
    videoScaleIndex--;
    videoScale = 1 + videoScaleIndex * 0.2;
    if (videoScale < 1) {
      videoScale = 1;
      videoScaleIndex = 0;
      coordLeft = 0;
      coordWidth = canvas.width;
      coordTop = 0;
      coordHeight = canvas.height;
      return;
    }
  }

  if (zoomChange) {
    const factor = 0.2 / (videoScale * (videoScale + (isZoomIn ? -0.2 : 0.2)));
    coordLeft += isZoomIn ? mouseX * factor : -(mouseX * factor);
    coordTop += isZoomIn ? mouseY * factor : -(mouseY * factor);

    coordWidth = canvas.width / videoScale;
    coordHeight = canvas.height / videoScale;

    coordLeft = Math.max(0, Math.min(canvas.width - coordWidth, coordLeft));
    coordTop = Math.max(0, Math.min(canvas.height - coordHeight, coordTop));
  }

  if (zoomChange) {
    imageDifX = coordLeft + (coordWidth * mouseX) / canvas.width;
    imageDifY = coordTop + (coordHeight * mouseY) / canvas.height;
    if (imageDifX < 0) {
      imageDifX = 0;
    }
    if (imageDifX > canvas.width) {
      imageDifX = canvas.width;
    }
    if (imageDifY < 0) {
      imageDifY = 0;
    }
    if (imageDifY > canvas.height) {
      imageDifY = canvas.height;
    }
  }

  mousePrevX = mouseX;
}

function toggleFullscreen() {
  if (!isFullscreenMode) {
    scrollPosBuf = window.pageYOffset;
    canvasWidthBuf = canvas.clientWidth;

    goFullScreen(canvas);
    isFullscreenMode = true;

    let maxWidth = 0;
    if (
      (window.innerWidth * VIDEO_HEIGHT) / VIDEO_WIDTH <=
      window.innerHeight
    ) {
      maxWidth = window.innerWidth;
    } else {
      maxWidth = (window.innerHeight * VIDEO_WIDTH) / VIDEO_HEIGHT - 10;
    }

    if (canvas) canvas.style.maxWidth = maxWidth + "px";
  } else {
    cancelFullScreen();
    isFullscreenMode = false;
    const mainEl = document.getElementById("main");
    if (mainEl) mainEl.style.background = "white";
    if (canvas) canvas.style.maxWidth = originalMaxWidth;
  }
  onFullscreen = false;
  init();
}

let scrollPosBuf = 0;
let canvasWidthBuf = 0;
function flipTheaterMode() {
  if (!theaterMode) {
    scrollPosBuf = window.pageYOffset;
    canvasWidthBuf = canvas.clientWidth;

    goFullScreen(canvas);

    let maxWidth = 0;
    if (
      (window.innerWidth * VIDEO_HEIGHT) / VIDEO_WIDTH <=
      window.innerHeight
    ) {
      maxWidth = window.innerWidth;
    } else {
      maxWidth = (window.innerHeight * VIDEO_WIDTH) / VIDEO_HEIGHT - 10;
    }

    if (canvas) canvas.style.maxWidth = maxWidth + "px";
    theaterMode = true;
  } else {
    cancelFullScreen(canvas);

    theaterTmp = true;
    theaterMode = false;

    const mainEl = document.getElementById("main");
    if (mainEl) mainEl.style.background = "white";
    if (canvas) canvas.style.maxWidth = originalMaxWidth;
  }
  onTheater = false;
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
    originalMaxWidth = canvas.style.maxWidth;
  } else {
    const computedStyle = window.getComputedStyle(canvas);
    if (computedStyle.maxWidth && computedStyle.maxWidth !== "none") {
      originalMaxWidth = computedStyle.maxWidth;
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

VIDEO_WIDTH = video.videoWidth || 1920;
VIDEO_HEIGHT = video.videoHeight || 1080;
metadataLoaded = true;
init();
draw();

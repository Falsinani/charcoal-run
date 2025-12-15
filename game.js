const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ------------------ GAME VARS ------------------
let gravity = 0.7;
let score = 50; // نبدأ بنقاط
let speed = 6;
let energy = 100;
let gameRunning = true;

const groundHeight = 80;

// ------------------ UI ------------------
const scoreUI = document.getElementById("score");
const bestUI = document.getElementById("best");

let best = localStorage.getItem("bestScore") || 0;
bestUI.innerText = "Best: " + best;

// ------------------ AUDIO ------------------
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// Background music
let musicOsc, musicGain;
function startMusic() {
  musicOsc = audioCtx.createOscillator();
  musicGain = audioCtx.createGain();
  musicOsc.type = "sine";
  musicOsc.frequency.value = 220;
  musicGain.gain.value = 0.03;
  musicOsc.connect(musicGain);
  musicGain.connect(audioCtx.destination);
  musicOsc.start();
}

// Sound effects
function playSound(type) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  if (type === "spark") {
    osc.frequency.value = 700;
    gain.gain.value = 0.12;
    osc.type = "triangle";
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
  }

  if (type === "hit") {
    osc.frequency.value = 300;
    gain.gain.value = 0.15;
    osc.type = "square";
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
  }

  if (type === "gameover") {
    osc.frequency.value = 180;
    gain.gain.value = 0.3;
    osc.type = "sawtooth";
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
  }
}

// ------------------ PLAYER ------------------
const player = {
  x: 80,
  y: canvas.height - groundHeight - 50,
  w: 50,
  h: 50,
  vy: 0,
  jump() {
    if (this.y >= canvas.height - groundHeight - this.h) {
      this.vy = -15;
    }
  },
  update() {
    this.vy += gravity;
    this.y += this.vy;
    if (this.y > canvas.height - groundHeight - this.h) {
      this.y = canvas.height - groundHeight - this.h;
      this.vy = 0;
    }
  },
  draw() {
    ctx.fillStyle = "#333";
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.w, this.h, 12);
    ctx.fill();

    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(this.x + 18, this.y + 20, 5, 0, Math.PI * 2);
    ctx.arc(this.x + 32, this.y + 20, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#fff";
    ctx.beginPath();
    ctx.arc(this.x + 25, this.y + 32, 10, 0, Math.PI);
    ctx.stroke();
  }
};

// ------------------ OBSTACLES (WATER) ------------------
let obstacles = [];

function spawnObstacle() {
  obstacles.push({
    x: canvas.width,
    y: canvas.height - groundHeight - 40,
    w: 40,
    h: 40
  });
}
setInterval(spawnObstacle, 1800);

// ------------------ SPARKS ------------------
let sparks = [];

function spawnSpark() {
  sparks.push({
    x: canvas.width,
    y: canvas.height - groundHeight - 80 - Math.random() * 120,
    r: 10,
    pulse: Math.random() * 5
  });
}
setInterval(spawnSpark, 1500);

// ------------------ ENERGY BAR ------------------
function drawEnergy() {
  ctx.fillStyle = "#000";
  ctx.fillRect(20, 50, 200, 20);

  ctx.fillStyle = energy > 30 ? "#FF9800" : "#F44336";
  ctx.fillRect(20, 50, energy * 2, 20);

  ctx.strokeStyle = "#fff";
  ctx.strokeRect(20, 50, 200, 20);
}

// ------------------ GAME LOOP ------------------
function loop() {
  if (!gameRunning) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Ground
  ctx.fillStyle = "#654321";
  ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);

  // Player
  player.update();
  player.draw();

  // Water Obstacles
  obstacles.forEach((o, i) => {
    o.x -= speed;
    ctx.fillStyle = "#4FC3F7";
    ctx.fillRect(o.x, o.y, o.w, o.h);

    if (
      player.x < o.x + o.w &&
      player.x + player.w > o.x &&
      player.y < o.y + o.h &&
      player.y + player.h > o.y
    ) {
      score -= 10;
      score = Math.max(score, 0);
      playSound("hit");
      obstacles.splice(i, 1);

      if (score <= 0) gameOver();
    }

    if (o.x + o.w < 0) obstacles.splice(i, 1);
  });

  // Sparks
  sparks.forEach((s, i) => {
    s.x -= speed;
    s.pulse += 0.2;
    let glow = Math.sin(s.pulse) * 4 + s.r;

    ctx.beginPath();
    ctx.arc(s.x, s.y, glow + 8, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,100,0,0.35)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(s.x, s.y, glow, 0, Math.PI * 2);
    ctx.fillStyle = "#FF9800";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(s.x, s.y, glow - 4, 0, Math.PI * 2);
    ctx.fillStyle = "#FFD54F";
    ctx.fill();

    if (
      player.x < s.x + glow &&
      player.x + player.w > s.x - glow &&
      player.y < s.y + glow &&
      player.y + player.h > s.y - glow
    ) {
      sparks.splice(i, 1);
      score += 50;
      energy = Math.min(100, energy + 15);
      playSound("spark");
    }

    if (s.x < -30) sparks.splice(i, 1);
  });

  // Energy drain (مساعد فقط)
  energy -= 0.03;
  energy = Math.max(energy, 0);

  drawEnergy();

  scoreUI.innerText = "Score: " + score;

  speed += 0.001;

  requestAnimationFrame(loop);
}

// ------------------ GAME OVER ------------------
function gameOver() {
  gameRunning = false;
  playSound("gameover");

  if (score > best) {
    best = score;
    localStorage.setItem("bestScore", best);
  }

  alert("🔥 Game Over\nScore: " + score);
  location.reload();
}

// ------------------ CONTROLS ------------------
window.addEventListener("click", start);
window.addEventListener("touchstart", start);
window.addEventListener("keydown", e => {
  if (e.code === "Space") start();
});

function start() {
  if (audioCtx.state === "suspended") audioCtx.resume();
  if (!musicOsc) startMusic();
  player.jump();
}

// ------------------ START ------------------
loop();

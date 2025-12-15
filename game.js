const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let gravity = 0.7;
let score = 0;
let best = localStorage.getItem("bestScore") || 0;
document.getElementById("best").innerText = "Best: " + best;

const groundHeight = 80;

// 🎮 Player (Charcoal)
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
  draw() {
    ctx.fillStyle = "#333";
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.w, this.h, 12);
    ctx.fill();

    // Eyes
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(this.x + 18, this.y + 20, 5, 0, Math.PI * 2);
    ctx.arc(this.x + 32, this.y + 20, 5, 0, Math.PI * 2);
    ctx.fill();

    // Smile
    ctx.strokeStyle = "#fff";
    ctx.beginPath();
    ctx.arc(this.x + 25, this.y + 30, 10, 0, Math.PI);
    ctx.stroke();
  },
  update() {
    this.vy += gravity;
    this.y += this.vy;

    if (this.y > canvas.height - groundHeight - this.h) {
      this.y = canvas.height - groundHeight - this.h;
      this.vy = 0;
    }
  }
};

// 💧 Obstacles (Water)
let obstacles = [];
let speed = 6;

function spawnObstacle() {
  obstacles.push({
    x: canvas.width,
    y: canvas.height - groundHeight - 40,
    w: 40,
    h: 40
  });
}

setInterval(spawnObstacle, 1800);

// 🏃 Game Loop
function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Ground
  ctx.fillStyle = "#654321";
  ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);

  player.update();
  player.draw();

  obstacles.forEach((o, i) => {
    o.x -= speed;
    ctx.fillStyle = "#4FC3F7";
    ctx.fillRect(o.x, o.y, o.w, o.h);

    // Collision
    if (
      player.x < o.x + o.w &&
      player.x + player.w > o.x &&
      player.y < o.y + o.h &&
      player.y + player.h > o.y
    ) {
      gameOver();
    }

    if (o.x + o.w < 0) {
      obstacles.splice(i, 1);
      score += 10;
    }
  });

  score++;
  document.getElementById("score").innerText = "Score: " + score;

  speed += 0.001;

  requestAnimationFrame(loop);
}

function gameOver() {
  if (score > best) {
    best = score;
    localStorage.setItem("bestScore", best);
  }
  alert("🔥 Game Over!\nScore: " + score);
  location.reload();
}

// Controls
window.addEventListener("click", () => player.jump());
window.addEventListener("touchstart", () => player.jump());

loop();

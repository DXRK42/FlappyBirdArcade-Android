
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const $ = id => document.getElementById(id);

const W = 360;
const H = 560;
const GROUND = 500;

const skins = [
  {id:"classic", name:"Classic", price:0, rarity:"Common", color:"#ffd43b", wing:"#e99a28", accent:"#fff"},
  {id:"blue", name:"Sky Blue", price:20, rarity:"Common", color:"#55c9ff", wing:"#1689d0", accent:"#e8fbff"},
  {id:"red", name:"Blaze", price:50, rarity:"Rare", color:"#ff665e", wing:"#b92d36", accent:"#ffbd55"},
  {id:"purple", name:"Mystic", price:100, rarity:"Epic", color:"#b17cff", wing:"#7543bd", accent:"#f4d7ff"},
  {id:"gold", name:"Golden Phoenix", price:200, rarity:"Legendary", color:"#ffca28", wing:"#e58b16", accent:"#fff3a1"},
  {id:"neon", name:"Neon", price:500, rarity:"Mythic", color:"#65ffce", wing:"#00a98c", accent:"#fff"},
  {id:"ice", name:"Frostbite", price:150, rarity:"LIMITED • WINTER", color:"#a9efff", wing:"#55a9d5", accent:"#fff"},
  {id:"shadow", name:"Shadow", price:180, rarity:"LIMITED • HALLOWEEN", color:"#a78bfa", wing:"#513b80", accent:"#e8d8ff"},
  {id:"holly", name:"Holly", price:180, rarity:"LIMITED • FESTIVE", color:"#ff5555", wing:"#21864b", accent:"#ffe5a1"}
];

let save = {
  coins: 0,
  best: 0,
  total: 0,
  unlocked: ["classic"],
  equipped: "classic"
};

try {
  const old = JSON.parse(localStorage.getItem("flappyArcadeSave"));
  if (old) save = {...save, ...old};
} catch (error) {
  console.warn("Save data could not be loaded.", error);
}

if (!Array.isArray(save.unlocked)) save.unlocked = ["classic"];
if (!save.unlocked.includes("classic")) save.unlocked.unshift("classic");
if (!skins.some(s => s.id === save.equipped)) save.equipped = "classic";
save.coins = Math.max(0, Number(save.coins) || 0);
save.best = Math.max(0, Number(save.best) || 0);
save.total = Math.max(0, Number(save.total) || 0);

let bird;
let pipes = [];
let score = 0;
let frame = 0;
let state = "ready";
let previewSkin = null;
let animationStarted = false;

function persist() {
  try {
    localStorage.setItem("flappyArcadeSave", JSON.stringify(save));
  } catch (error) {
    console.warn("Could not save progress.", error);
  }
  refreshUI();
}

function currentSkin() {
  return skins.find(s => s.id === (previewSkin || save.equipped)) || skins[0];
}

function refreshUI() {
  $("coins").textContent = save.coins;
  $("shopCoins").textContent = save.coins;
  $("best").textContent = save.best;
  $("bestStat").textContent = save.best;
  $("pipesStat").textContent = save.total;

  const equipped = skins.find(s => s.id === save.equipped) || skins[0];
  $("equippedName").textContent = equipped.name;
}

// Pixel-art bird drawing, used in the game and shop previews.
function drawBird(target, x, y, scale, skin) {
  target.save();
  target.translate(x, y);
  target.scale(scale, scale);

  // Body
  target.fillStyle = skin.color;
  target.fillRect(-15, -13, 29, 25);
  target.fillRect(-9, -18, 17, 6);

  // Wing
  target.fillStyle = skin.wing;
  target.fillRect(-12, -3, 15, 9);

  // Different details for each skin
  target.fillStyle = skin.accent;

  if (skin.id === "gold") {
    target.fillRect(-5, -19, 5, 5);
    target.fillRect(2, -20, 5, 6);
    target.fillRect(-5, 5, 5, 4);
  } else if (skin.id === "ice") {
    target.fillRect(-9, -17, 4, 5);
    target.fillRect(-3, -20, 4, 7);
    target.fillRect(3, -16, 4, 4);
  } else if (skin.id === "shadow") {
    target.fillRect(-9, -17, 5, 4);
    target.fillRect(-3, -21, 5, 8);
    target.fillRect(3, -17, 5, 4);
  } else if (skin.id === "holly") {
    target.fillRect(-5, -19, 5, 5);
    target.fillRect(1, -19, 5, 5);
    target.fillStyle = "#21864b";
    target.fillRect(-2, -22, 5, 4);
  } else if (skin.id === "neon") {
    target.fillRect(-8, -7, 5, 3);
    target.fillRect(-2, -7, 5, 3);
  } else {
    target.fillRect(-7, -8, 5, 3);
  }

  // Eye
  target.fillStyle = "#fff";
  target.fillRect(5, -11, 10, 11);
  target.fillStyle = "#222";
  target.fillRect(10, -8, 4, 5);

  // Beak
  target.fillStyle = skin.id === "gold" ? "#ff7b19" : "#ff783e";
  target.fillRect(13, 0, 13, 6);
  target.fillRect(18, 6, 8, 3);

  target.restore();
}

function birdDraw(x, y, scale = 1, rotation = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.translate(-x, -y);
  drawBird(ctx, x, y, scale, currentSkin());
  ctx.restore();
}

function background() {
  const gradient = ctx.createLinearGradient(0, 0, 0, H);
  gradient.addColorStop(0, "#58c4ed");
  gradient.addColorStop(1, "#d0f2e5");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#ffffffaa";
  for (let i = 0; i < 5; i++) {
    const x = ((i * 110 - frame * 0.45) % 450 + 450) % 450 - 40;
    const y = 80 + (i % 3) * 90;
    ctx.fillRect(x, y, 45, 12);
    ctx.fillRect(x + 10, y - 10, 25, 30);
    ctx.fillRect(x + 22, y - 17, 13, 22);
  }

  ctx.fillStyle = "#88ce7a";
  ctx.fillRect(0, 450, W, 50);
  ctx.fillRect(35, 430, 80, 50);
  ctx.fillRect(230, 425, 90, 55);
}

function ground() {
  ctx.fillStyle = "#77c94b";
  ctx.fillRect(0, GROUND, W, 14);

  ctx.fillStyle = "#dfc77b";
  ctx.fillRect(0, GROUND + 14, W, 60);

  ctx.fillStyle = "#b4985c";
  for (let i = 0; i < 18; i++) {
    ctx.fillRect((i * 28 - frame * 2) % 380, GROUND + 34, 12, 5);
  }
}

function pipeDraw(p) {
  ctx.fillStyle = "#259c3b";
  ctx.fillRect(p.x, 0, 58, p.top);
  ctx.fillRect(p.x - 5, p.top - 19, 68, 19);
  ctx.fillRect(p.x, p.bottom, 58, GROUND - p.bottom);
  ctx.fillRect(p.x - 5, p.bottom, 68, 19);

  ctx.fillStyle = "#75e75c";
  ctx.fillRect(p.x + 9, 0, 9, p.top - 19);
  ctx.fillRect(p.x + 9, p.bottom + 19, 9, GROUND - p.bottom);

  ctx.fillStyle = "#176c32";
  ctx.fillRect(p.x + 49, 0, 9, p.top);
  ctx.fillRect(p.x + 49, p.bottom, 9, GROUND - p.bottom);
}

function reset() {
  bird = {x: 90, y: 250, v: 0};
  pipes = [];
  score = 0;
  frame = 0;
  $("score").textContent = "0";
}

function start() {
  if (state === "playing") return;

  reset();
  state = "playing";
  $("gameOverlay").classList.add("hidden");
  flap();
}

function flap() {
  if (state === "ready") {
    start();
    return;
  }

  if (state === "playing") {
    bird.v = -6.8;
  }
}

function endGame() {
  if (state !== "playing") return;

  state = "over";
  save.best = Math.max(save.best, score);
  persist();

  $("overlayTitle").textContent = "GAME OVER";
  $("overlayText").innerHTML =
    `SCORE: ${score}<br>+${score} COINS EARNED<br>Try again and beat your record!`;

  $("playBtn").textContent = "PLAY AGAIN";
  $("gameOverlay").classList.remove("hidden");
}

function update() {
  frame++;

  if (state === "ready") {
    bird.y = 250 + Math.sin(frame * 0.06) * 7;
    return;
  }

  if (state !== "playing") return;

  bird.v += 0.34;
  bird.y += bird.v;

  if (frame % 94 === 0) {
    const top = 65 + Math.random() * 190;
    pipes.push({
      x: W,
      top,
      bottom: top + 150,
      scored: false
    });
  }

  for (const p of pipes) {
    p.x -= 2.4;

    if (!p.scored && p.x + 58 < bird.x) {
      p.scored = true;
      score++;
      save.coins++;
      save.total++;

      $("score").textContent = score;
      persist();
    }

    if (
      bird.x + 12 > p.x &&
      bird.x - 12 < p.x + 58 &&
      (bird.y - 10 < p.top || bird.y + 10 > p.bottom)
    ) {
      endGame();
    }
  }

  pipes = pipes.filter(p => p.x > -75);

  if (bird.y + 13 >= GROUND || bird.y - 13 < 0) {
    endGame();
  }
}

function draw() {
  background();
  pipes.forEach(pipeDraw);
  ground();

  birdDraw(
    bird.x,
    bird.y,
    1,
    Math.min(0.7, Math.max(-0.5, bird.v * 0.07))
  );
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

// Draw a separate pixel-art preview for every skin.
function drawSkinPreview(canvasElement, skin) {
  const c = canvasElement.getContext("2d");
  c.clearRect(0, 0, 120, 80);

  c.fillStyle = "#70c5ce";
  c.fillRect(0, 0, 120, 80);

  c.fillStyle = "#ffffff88";
  c.fillRect(12, 15, 24, 7);
  c.fillRect(22, 9, 15, 6);

  drawBird(c, 59, 43, 2, skin);

  c.fillStyle = "#77c94b";
  c.fillRect(0, 70, 120, 10);
}

function drawSkin(s) {
  return `
    <article class="skin-card ${s.rarity.includes("LIMITED") ? "limited" : ""}">
      <div class="skin-art">
        <canvas class="skin-preview" data-preview="${s.id}" width="120" height="80"></canvas>
      </div>
      <h3>${s.name}</h3>
      <div class="rarity">${s.rarity}</div>
      <p style="margin-top:8px">🪙 ${s.price}</p>
      <button data-skin="${s.id}"></button>
      <button data-try="${s.id}" style="margin-top:7px;background:#a9dfff;color:#17233d">TRY FREE</button>
    </article>
  `;
}

function renderShop() {
  $("shopGrid").innerHTML = skins.map(drawSkin).join("");

  $("collectionGrid").innerHTML = skins
    .filter(s => save.unlocked.includes(s.id))
    .map(drawSkin)
    .join("");

  document.querySelectorAll("[data-preview]").forEach(el => {
    const skin = skins.find(s => s.id === el.dataset.preview);
    drawSkinPreview(el, skin);
  });

  document.querySelectorAll("[data-skin]").forEach(btn => {
    const skin = skins.find(s => s.id === btn.dataset.skin);
    const owned = save.unlocked.includes(skin.id);

    btn.textContent = owned
      ? (save.equipped === skin.id ? "EQUIPPED" : "EQUIP")
      : "BUY";

    btn.disabled = save.equipped === skin.id;

    btn.onclick = () => {
      if (!owned) {
        if (save.coins < skin.price) {
          btn.textContent = "NOT ENOUGH COINS";
          return;
        }

        save.coins -= skin.price;
        save.unlocked.push(skin.id);
      }

      save.equipped = skin.id;
      previewSkin = null;
      persist();
      renderShop();
    };
  });

  document.querySelectorAll("[data-try]").forEach(btn => {
    btn.onclick = () => {
      previewSkin = btn.dataset.try;
      $("overlayTitle").textContent = "SKIN PREVIEW";
      $("overlayText").textContent =
        `${skins.find(s => s.id === previewSkin).name} selected for a free test flight!`;
      $("playBtn").textContent = "TEST FLIGHT";
      $("gameOverlay").classList.remove("hidden");

      document.querySelectorAll(".tab").forEach(b => {
        b.classList.toggle("active", b.dataset.tab === "play");
      });

      document.querySelectorAll(".screen").forEach(s => {
        s.classList.toggle("active", s.id === "play");
      });

      state = "ready";
      reset();
      draw();
    };
  });
}

// Main navigation
function start() {
    reset();
    state = "playing";
  
    const overlay = $("gameOverlay");
    overlay.classList.add("hidden");
    overlay.style.display = "none";
  
    bird.v = -6.8;
  }

// Start / restart button
$("playBtn").addEventListener("click", start);

// Mouse, touch and pen controls
canvas.addEventListener("pointerdown", event => {
  event.preventDefault();
  if (state !== "over") flap();
});

// Keyboard controls
document.addEventListener("keydown", event => {
  if (event.code === "Space" || event.code === "ArrowUp") {
    event.preventDefault();
    if (state !== "over") flap();
  }
});

// Initial setup
reset();
refreshUI();
renderShop();

if (!animationStarted) {
  animationStarted = true;
  loop();
}

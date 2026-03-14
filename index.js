const { spawn } = require("child_process");
const { readFileSync } = require("fs-extra");
const axios = require("axios");
const logger = require("./utils/log");
const express = require("express");
const gradient = require("gradient-string");
const moment = require("moment-timezone");
const chalk = require("chalk");

const logo = `
 ██████╗  █████╗  ███╗   ███╗ ██╗ 
██╔════╝ ██╔══██╗ ████╗ ████║ ██║ 
╚█████╗  ██║  ██║ ██╔████╔██║ ██║ 
 ╚═══██╗ ██║  ██║ ██║╚██╔╝██║ ██║ 
██████╔╝ ╚█████╔╝ ██║ ╚═╝ ██║ ██║ 
╚═════╝   ╚════╝  ╚═╝     ╚═╝ ╚═╝ 
`;

const c = ["cyan", "#7D053F"];
const redToGreen = gradient("red", "cyan");
console.log(redToGreen("━".repeat(50), { interpolation: "hsv" }));
console.log(gradient(c).multiline(logo));
console.log(redToGreen("━".repeat(50), { interpolation: "hsv" }));

const SOCIAL = {
  devName:   "أيمن",
  facebook:  "https://www.facebook.com/profile.php?id=61580139921634",
  instagram: "https://instagram.com/x_v_k1",
  telegram:  "https://t.me/X2_FD",
  tiktok:    "#"
};

const app = express();
const port = process.env.PORT || 3078;
const BOOT_TIME = Date.now();

app.get("/", (req, res) => {
  const uptime   = Date.now() - BOOT_TIME;
  const days     = Math.floor(uptime / 86400000);
  const hours    = Math.floor((uptime % 86400000) / 3600000);
  const minutes  = Math.floor((uptime % 3600000) / 60000);
  const seconds  = Math.floor((uptime % 60000) / 1000);
  const botName  = global.config?.BOTNAME || "KIRA";
  const timeNow  = moment().tz("Africa/Casablanca").format("HH:mm:ss • DD/MM/YYYY");
  const pad = n => String(n).padStart(2, "0");

  res.send(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${botName}</title>
<link href="https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&family=Special+Elite&family=Creepster&family=Noto+Kufi+Arabic:wght@300;400;700;900&display=swap" rel="stylesheet">
<style>
:root {
  --ink: #0a0a0a;
  --paper: #f0ede6;
  --ash: #2a2a2a;
  --smoke: #4a4a4a;
  --bone: #c8c4b8;
  --rust: #888078;
  --void: #050505;
  --scar: #1a1a1a;
  --flicker: #e8e4dc;
}

* { margin:0; padding:0; box-sizing:border-box; }

html, body {
  width:100%; min-height:100vh;
  background: var(--void);
  color: var(--bone);
  font-family: 'IM Fell English', serif;
  overflow-x: hidden;
  cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Cline x1='12' y1='0' x2='12' y2='24' stroke='%23c8c4b8' stroke-width='1'/%3E%3Cline x1='0' y1='12' x2='24' y2='12' stroke='%23c8c4b8' stroke-width='1'/%3E%3Ccircle cx='12' cy='12' r='2' fill='%23c8c4b8'/%3E%3C/svg%3E") 12 12, crosshair;
}

/* ─── GRAIN OVERLAY ─── */
body::before {
  content:'';
  position:fixed; inset:0; z-index:1; pointer-events:none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23g)' opacity='0.07'/%3E%3C/svg%3E");
  opacity: 0.5;
}

/* ─── VIGNETTE ─── */
body::after {
  content:'';
  position:fixed; inset:0; z-index:2; pointer-events:none;
  background: radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.92) 100%);
}

/* ─── SCANLINES ─── */
#scanlines {
  position:fixed; inset:0; z-index:3; pointer-events:none;
  background: repeating-linear-gradient(
    0deg, transparent, transparent 3px,
    rgba(0,0,0,0.12) 3px, rgba(0,0,0,0.12) 4px
  );
}

/* ─── CONTENT ─── */
#content {
  position:relative; z-index:10;
  min-height:100vh;
  display:flex; flex-direction:column; align-items:center;
  padding: 60px 20px 80px;
}

/* ─── TORN PAPER TOP ─── */
.torn-top {
  position:fixed; top:0; left:0; right:0; z-index:20; pointer-events:none;
  height:80px; overflow:hidden;
}
.torn-top svg { width:100%; height:80px; }

/* ─── TITLE SKULL ─── */
.skull-wrap {
  position:relative; width:180px; height:180px;
  margin-bottom:20px;
  animation: skullbreathe 4s ease-in-out infinite;
  filter: drop-shadow(0 0 40px rgba(200,196,184,0.08));
}
@keyframes skullbreathe {
  0%,100% { transform:scale(1) translateY(0); filter:drop-shadow(0 0 20px rgba(200,196,184,0.05)); }
  50% { transform:scale(1.02) translateY(-5px); filter:drop-shadow(0 0 50px rgba(200,196,184,0.15)); }
}

/* ─── TITLE ─── */
.title-block { text-align:center; margin-bottom:6px; }
.bot-name {
  font-family:'Creepster', cursive;
  font-size: clamp(5rem, 16vw, 10rem);
  line-height:0.85;
  color: var(--bone);
  letter-spacing: 0.05em;
  text-shadow:
    0 0 30px rgba(200,196,184,0.2),
    0 0 80px rgba(200,196,184,0.05),
    2px 2px 0 var(--ash),
    4px 4px 0 var(--scar);
  animation: titleflicker 8s ease-in-out infinite;
}
@keyframes titleflicker {
  0%,89%,91%,93%,100% { opacity:1; }
  90%,92% { opacity:0.4; }
}
.bot-sub {
  font-family:'Special Elite', cursive;
  font-size:clamp(0.5rem,1.6vw,0.7rem);
  letter-spacing:0.5em;
  color: var(--rust);
  text-transform:uppercase;
  margin-top:8px;
  animation: subtitlefade 6s ease-in-out infinite;
}
@keyframes subtitlefade {
  0%,100% { opacity:0.6; }
  50% { opacity:0.3; }
}

/* ─── DIVIDER ─── */
.divider {
  width: min(560px,90vw);
  margin: 22px 0;
  position:relative;
  height:30px;
  display:flex; align-items:center; justify-content:center;
}
.divider svg { width:100%; height:30px; }

/* ─── UPTIME ─── */
.uptime-container {
  position:relative;
  margin-bottom:30px;
  width: min(480px,92vw);
}
.uptime-frame {
  position:relative;
  border:1px solid rgba(200,196,184,0.12);
  padding: 30px 20px 20px;
  background: linear-gradient(160deg, rgba(20,18,15,0.9), rgba(8,7,6,0.95));
}
/* corner screws */
.uptime-frame::before,
.uptime-frame::after {
  content:'';
  position:absolute;
  width:8px; height:8px;
  border:1px solid rgba(200,196,184,0.25);
  border-radius:50%;
}
.uptime-frame::before { top:8px; right:8px; }
.uptime-frame::after  { bottom:8px; left:8px; }
.uptime-frame .screw-bl { position:absolute; bottom:8px; right:8px; width:8px; height:8px; border:1px solid rgba(200,196,184,0.25); border-radius:50%; }
.uptime-frame .screw-tl { position:absolute; top:8px; left:8px; width:8px; height:8px; border:1px solid rgba(200,196,184,0.25); border-radius:50%; }

.uptime-label {
  position:absolute; top:-11px; left:50%; transform:translateX(-50%);
  background:var(--void);
  padding:0 16px;
  font-family:'Special Elite', cursive;
  font-size:0.6rem;
  color:var(--rust);
  letter-spacing:0.4em;
  text-transform:uppercase;
  white-space:nowrap;
}
.uptime-row {
  display:flex; gap:8px; justify-content:center; align-items:center;
}
.ut {
  display:flex; flex-direction:column; align-items:center;
  min-width:70px; padding:10px 8px;
  background: rgba(255,255,255,0.02);
  border:1px solid rgba(200,196,184,0.08);
  position:relative;
  overflow:hidden;
}
.ut::before {
  content:'';
  position:absolute; top:0; left:0; right:0; height:1px;
  background:linear-gradient(90deg,transparent,rgba(200,196,184,0.2),transparent);
}
.ut-n {
  font-family:'Special Elite', cursive;
  font-size:clamp(1.8rem,5vw,2.6rem);
  color:var(--flicker);
  text-shadow: 0 0 20px rgba(240,237,230,0.3);
  line-height:1;
  animation: digitflicker 12s ease-in-out infinite;
}
@keyframes digitflicker {
  0%,94%,96%,100% { opacity:1; }
  95% { opacity:0.3; }
}
.ut-l {
  font-family:'Noto Kufi Arabic', sans-serif;
  font-size:0.52rem;
  color:var(--rust);
  margin-top:4px;
  letter-spacing:2px;
}
.ut-sep {
  color:rgba(200,196,184,0.2);
  font-size:2rem;
  font-family:'Special Elite',cursive;
  padding-bottom:18px;
  align-self:center;
}

/* ─── SOCIAL LINKS ─── */
.social-section {
  margin:10px 0 35px;
  width:min(580px,92vw);
}
.social-title {
  font-family:'Special Elite', cursive;
  font-size:0.6rem;
  letter-spacing:0.5em;
  color:var(--rust);
  text-transform:uppercase;
  text-align:center;
  margin-bottom:20px;
}
.social-grid {
  display:grid;
  grid-template-columns:repeat(2,1fr);
  gap:12px;
}
.social-link {
  display:flex; align-items:center; gap:14px;
  padding:14px 16px;
  background:rgba(255,255,255,0.02);
  border:1px solid rgba(200,196,184,0.08);
  text-decoration:none;
  color:var(--bone);
  transition:all 0.4s ease;
  position:relative;
  overflow:hidden;
}
.social-link::before {
  content:'';
  position:absolute; inset:0;
  background:linear-gradient(135deg,rgba(200,196,184,0.03),transparent);
  opacity:0;
  transition:opacity 0.3s;
}
.social-link:hover { border-color:rgba(200,196,184,0.3); background:rgba(255,255,255,0.04); }
.social-link:hover::before { opacity:1; }
.social-link:hover .social-icon { filter:brightness(1.3); }
.social-icon {
  flex-shrink:0;
  width:28px; height:28px;
  opacity:0.55;
  transition:filter 0.3s, opacity 0.3s;
}
.social-link:hover .social-icon { opacity:0.9; }
.social-info { display:flex; flex-direction:column; gap:2px; overflow:hidden; }
.social-name {
  font-family:'Special Elite', cursive;
  font-size:0.72rem;
  letter-spacing:0.2em;
  color:var(--bone);
  text-transform:uppercase;
}
.social-handle {
  font-family:'IM Fell English', serif;
  font-size:0.6rem;
  color:var(--rust);
  font-style:italic;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}

/* ─── DEV SECTION ─── */
.dev-section {
  text-align:center;
  margin:5px 0 30px;
}
.dev-label {
  font-family:'Special Elite', cursive;
  font-size:0.55rem;
  letter-spacing:0.5em;
  color:var(--rust);
  text-transform:uppercase;
  margin-bottom:14px;
}
.dev-link {
  display:inline-block;
  text-decoration:none;
  animation:devfloat 5s ease-in-out infinite;
  transition:filter 0.3s;
}
.dev-link:hover { filter:brightness(1.4); }
@keyframes devfloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
.dev-name {
  font-family:'Creepster', cursive;
  font-size:0.9rem;
  color:var(--bone);
  letter-spacing:5px;
  margin-top:8px;
  opacity:0.5;
}

/* ─── RUNES ─── */
.runes {
  font-family:'IM Fell English', serif;
  font-style:italic;
  font-size:clamp(0.9rem,2.5vw,1.2rem);
  color:rgba(200,196,184,0.2);
  letter-spacing:0.4em;
  margin-bottom:20px;
  animation:runesflicker 10s ease-in-out infinite;
}
@keyframes runesflicker { 0%,100%{opacity:0.2} 50%{opacity:0.4} 73%{opacity:0.15} }

/* ─── BOTTOM BAR ─── */
.bottom-bar {
  width:min(580px,92vw);
  display:flex; align-items:center; justify-content:space-between;
  padding:12px 16px;
  border-top:1px solid rgba(200,196,184,0.08);
  font-family:'Special Elite', cursive;
  font-size:0.55rem;
  color:rgba(200,196,184,0.25);
  letter-spacing:0.2em;
  flex-wrap:wrap; gap:6px;
}
.bottom-bar .hl { color:rgba(200,196,184,0.5); }

/* ─── DRIPPING BLOOD ─── */
.drip-container {
  position:fixed; top:0; left:0; right:0; z-index:25;
  pointer-events:none; height:120px; overflow:visible;
}
.drip {
  position:absolute;
  top:0;
  width:2px;
  background:linear-gradient(180deg,rgba(30,30,30,0.9),rgba(50,50,50,0.6) 70%,transparent);
  border-radius:0 0 50% 50%;
  animation:drip var(--dd,8s) ease-in-out infinite var(--ddelay,0s);
  transform-origin:top center;
}
@keyframes drip {
  0%,40% { height:0; opacity:0; }
  50% { opacity:1; height:var(--dh,40px); }
  80% { opacity:0.8; height:var(--dh,40px); }
  100% { opacity:0; height:var(--dh,40px); transform:translateY(20px); }
}

/* ─── FLOATING PARTICLES ─── */
.particle {
  position:fixed;
  border-radius:50%;
  background:rgba(200,196,184,0.05);
  animation:floatparticle var(--pd,20s) ease-in-out infinite var(--pdelay,0s);
  pointer-events:none; z-index:4;
}
@keyframes floatparticle {
  0%,100% { transform:translate(0,0) scale(1); opacity:var(--po,0.05); }
  33% { transform:translate(var(--px,20px),var(--py,-30px)) scale(1.1); opacity:calc(var(--po,0.05)*1.5); }
  66% { transform:translate(calc(var(--px,20px)*-0.5),var(--py,-30px)*0.7) scale(0.9); }
}

/* ─── GLITCH ─── */
.glitch {
  position:relative;
}
.glitch::before, .glitch::after {
  content:attr(data-text);
  position:absolute; top:0; left:0;
  width:100%;
  font-family:inherit; font-size:inherit; color:inherit;
}
.glitch::before {
  animation:glitch1 7s infinite;
  clip-path:polygon(0 0,100% 0,100% 35%,0 35%);
  transform:translate(-2px,0);
  opacity:0.5;
}
.glitch::after {
  animation:glitch2 7s infinite;
  clip-path:polygon(0 65%,100% 65%,100% 100%,0 100%);
  transform:translate(2px,0);
  opacity:0.5;
}
@keyframes glitch1 {
  0%,89%,100% { transform:translate(0,0); opacity:0; }
  90% { transform:translate(-3px,-1px); opacity:0.4; color:var(--ash); }
  91% { transform:translate(3px,1px); opacity:0.3; }
  92% { transform:translate(0,0); opacity:0; }
}
@keyframes glitch2 {
  0%,92%,100% { transform:translate(0,0); opacity:0; }
  93% { transform:translate(3px,1px); opacity:0.4; color:var(--ash); }
  94% { transform:translate(-2px,-1px); opacity:0.3; }
  95% { transform:translate(0,0); opacity:0; }
}

/* ─── SCROLLBAR ─── */
::-webkit-scrollbar { width:4px; }
::-webkit-scrollbar-track { background:#050505; }
::-webkit-scrollbar-thumb { background:#2a2a2a; border-radius:2px; }

@media(max-width:480px) {
  .social-grid { grid-template-columns:1fr; }
  .uptime-row { gap:4px; }
  .ut { min-width:56px; }
}
</style>
</head>
<body>

<div id="scanlines"></div>

<!-- DRIPS -->
<div class="drip-container" id="drips"></div>

<!-- FLOATING PARTICLES -->
<div id="particles"></div>

<!-- CONTENT -->
<div id="content">

  <!-- SKULL SVG -->
  <div class="skull-wrap">
    <svg viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg" fill="none">
      <!-- outer glow circle -->
      <circle cx="90" cy="90" r="85" stroke="rgba(200,196,184,0.04)" stroke-width="1" stroke-dasharray="3 5"/>
      <circle cx="90" cy="90" r="78" stroke="rgba(200,196,184,0.03)" stroke-width="0.5"/>
      
      <!-- skull cranium -->
      <path d="M90 22 C55 22 28 48 28 78 C28 100 40 118 58 126 L58 148 C58 152 61 155 65 155 L115 155 C119 155 122 152 122 148 L122 126 C140 118 152 100 152 78 C152 48 125 22 90 22 Z"
        fill="rgba(20,18,16,0.95)" stroke="rgba(200,196,184,0.18)" stroke-width="1.2"/>
      
      <!-- skull texture lines -->
      <path d="M60 45 Q90 38 120 45" stroke="rgba(200,196,184,0.05)" stroke-width="0.8" fill="none"/>
      <path d="M50 62 Q90 54 130 62" stroke="rgba(200,196,184,0.04)" stroke-width="0.8" fill="none"/>
      
      <!-- left eye socket -->
      <ellipse cx="68" cy="85" rx="18" ry="20"
        fill="rgba(5,4,3,0.98)" stroke="rgba(200,196,184,0.15)" stroke-width="1"/>
      <!-- left eye inner glow -->
      <ellipse cx="68" cy="88" rx="10" ry="11" fill="rgba(200,196,184,0.03)"/>
      <!-- left pupil -->
      <ellipse cx="68" cy="86" rx="5" ry="6" fill="rgba(200,196,184,0.06)"
        style="animation:eyepulse 3s ease-in-out infinite"/>
      
      <!-- right eye socket -->
      <ellipse cx="112" cy="85" rx="18" ry="20"
        fill="rgba(5,4,3,0.98)" stroke="rgba(200,196,184,0.15)" stroke-width="1"/>
      <ellipse cx="112" cy="88" rx="10" ry="11" fill="rgba(200,196,184,0.03)"/>
      <ellipse cx="112" cy="86" rx="5" ry="6" fill="rgba(200,196,184,0.06)"
        style="animation:eyepulse 3s ease-in-out infinite 0.5s"/>
      
      <!-- nose cavity -->
      <path d="M83 108 L90 98 L97 108 Q93 113 90 115 Q87 113 83 108 Z"
        fill="rgba(5,4,3,0.95)" stroke="rgba(200,196,184,0.1)" stroke-width="0.8"/>
      
      <!-- teeth divider -->
      <line x1="65" y1="124" x2="115" y2="124" stroke="rgba(200,196,184,0.12)" stroke-width="0.8"/>
      
      <!-- teeth -->
      <rect x="67" y="124" width="8" height="14" rx="0.5"
        fill="rgba(220,215,205,0.08)" stroke="rgba(200,196,184,0.15)" stroke-width="0.8"/>
      <rect x="78" y="124" width="8" height="16" rx="0.5"
        fill="rgba(220,215,205,0.08)" stroke="rgba(200,196,184,0.15)" stroke-width="0.8"/>
      <rect x="89" y="124" width="8" height="15" rx="0.5"
        fill="rgba(220,215,205,0.08)" stroke="rgba(200,196,184,0.15)" stroke-width="0.8"/>
      <rect x="100" y="124" width="8" height="16" rx="0.5"
        fill="rgba(220,215,205,0.08)" stroke="rgba(200,196,184,0.15)" stroke-width="0.8"/>
      <rect x="111" y="124" width="8" height="13" rx="0.5"
        fill="rgba(220,215,205,0.08)" stroke="rgba(200,196,184,0.15)" stroke-width="0.8"/>
      
      <!-- cracks -->
      <path d="M90 28 L87 45 L93 55 L88 70" stroke="rgba(200,196,184,0.08)" stroke-width="0.7" fill="none"/>
      <path d="M60 55 L68 62 L65 72" stroke="rgba(200,196,184,0.06)" stroke-width="0.6" fill="none"/>
      <path d="M130 58 L120 66 L124 76" stroke="rgba(200,196,184,0.06)" stroke-width="0.6" fill="none"/>

      <!-- decorative rune text around -->
      <text x="90" y="172" text-anchor="middle" fill="rgba(200,196,184,0.12)"
        font-size="8" font-family="serif" letter-spacing="3">ᚲ ᛁ ᚱ ᚨ</text>
    </svg>
  </div>

  <!-- TITLE -->
  <div class="title-block">
    <div class="bot-name glitch" data-text="${botName}">${botName}</div>
    <div class="bot-sub">من اعماق الظلام — حارسة الشبكة الابدية</div>
  </div>

  <!-- DIVIDER -->
  <div class="divider">
    <svg viewBox="0 0 560 30" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
      <!-- main line -->
      <line x1="0" y1="15" x2="560" y2="15" stroke="rgba(200,196,184,0.1)" stroke-width="0.8"/>
      <!-- left decorations -->
      <path d="M0 15 L80 15" stroke="rgba(200,196,184,0.2)" stroke-width="1"/>
      <path d="M85 15 L90 8 L95 15 L90 22 Z" fill="none" stroke="rgba(200,196,184,0.2)" stroke-width="0.8"/>
      <!-- center ornament -->
      <path d="M250 15 L255 8 L260 3 L270 15 L260 27 L255 22 Z" fill="none" stroke="rgba(200,196,184,0.15)" stroke-width="0.8"/>
      <circle cx="270" cy="15" r="2" fill="rgba(200,196,184,0.2)"/>
      <path d="M280 15 L285 8 L290 3 L300 15 L290 27 L285 22 Z" fill="none" stroke="rgba(200,196,184,0.15)" stroke-width="0.8"/>
      <!-- right decorations -->
      <path d="M465 15 L470 8 L475 15 L470 22 Z" fill="none" stroke="rgba(200,196,184,0.2)" stroke-width="0.8"/>
      <path d="M480 15 L560 15" stroke="rgba(200,196,184,0.2)" stroke-width="1"/>
      <!-- small ticks -->
      <line x1="110" y1="12" x2="110" y2="18" stroke="rgba(200,196,184,0.1)" stroke-width="0.6"/>
      <line x1="140" y1="13" x2="140" y2="17" stroke="rgba(200,196,184,0.1)" stroke-width="0.6"/>
      <line x1="170" y1="12" x2="170" y2="18" stroke="rgba(200,196,184,0.1)" stroke-width="0.6"/>
      <line x1="390" y1="12" x2="390" y2="18" stroke="rgba(200,196,184,0.1)" stroke-width="0.6"/>
      <line x1="420" y1="13" x2="420" y2="17" stroke="rgba(200,196,184,0.1)" stroke-width="0.6"/>
      <line x1="450" y1="12" x2="450" y2="18" stroke="rgba(200,196,184,0.1)" stroke-width="0.6"/>
    </svg>
  </div>

  <!-- UPTIME -->
  <div class="uptime-container">
    <div class="uptime-frame">
      <span class="uptime-label">منذ بدأت اللعنة</span>
      <div class="screw-tl"></div>
      <div class="screw-bl"></div>
      <div class="uptime-row">
        <div class="ut">
          <span class="ut-n" id="ud">${pad(days)}</span>
          <span class="ut-l">يوم</span>
        </div>
        <span class="ut-sep">:</span>
        <div class="ut">
          <span class="ut-n" id="uh">${pad(hours)}</span>
          <span class="ut-l">ساعة</span>
        </div>
        <span class="ut-sep">:</span>
        <div class="ut">
          <span class="ut-n" id="um">${pad(minutes)}</span>
          <span class="ut-l">دقيقة</span>
        </div>
        <span class="ut-sep">:</span>
        <div class="ut">
          <span class="ut-n" id="us">${pad(seconds)}</span>
          <span class="ut-l">ثانية</span>
        </div>
      </div>
    </div>
  </div>

  <!-- DIVIDER -->
  <div class="divider">
    <svg viewBox="0 0 560 30" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
      <line x1="0" y1="15" x2="560" y2="15" stroke="rgba(200,196,184,0.08)" stroke-width="0.8"/>
      <circle cx="270" cy="15" r="3" fill="none" stroke="rgba(200,196,184,0.2)" stroke-width="0.8"/>
      <circle cx="270" cy="15" r="1" fill="rgba(200,196,184,0.3)"/>
      <line x1="240" y1="15" x2="260" y2="15" stroke="rgba(200,196,184,0.2)" stroke-width="1"/>
      <line x1="280" y1="15" x2="300" y2="15" stroke="rgba(200,196,184,0.2)" stroke-width="1"/>
    </svg>
  </div>

  <!-- SOCIAL -->
  <div class="social-section">
    <div class="social-title">روابط المطور — ${SOCIAL.devName}</div>
    <div class="social-grid">

      <!-- Instagram -->
      <a class="social-link" href="${SOCIAL.instagram}" target="_blank">
        <svg class="social-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="rgba(200,196,184,0.6)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5"/>
          <circle cx="12" cy="12" r="4"/>
          <circle cx="17.5" cy="6.5" r="1" fill="rgba(200,196,184,0.6)" stroke="none"/>
        </svg>
        <div class="social-info">
          <span class="social-name">Instagram</span>
          <span class="social-handle">@x_v_k1</span>
        </div>
      </a>

      <!-- Facebook -->
      <a class="social-link" href="${SOCIAL.facebook}" target="_blank">
        <svg class="social-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="rgba(200,196,184,0.6)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
        </svg>
        <div class="social-info">
          <span class="social-name">Facebook</span>
          <span class="social-handle">أيمن</span>
        </div>
      </a>

      <!-- Telegram -->
      <a class="social-link" href="${SOCIAL.telegram}" target="_blank">
        <svg class="social-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="rgba(200,196,184,0.6)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 2L11 13"/>
          <path d="M22 2L15 22 11 13 2 9l20-7z"/>
        </svg>
        <div class="social-info">
          <span class="social-name">Telegram</span>
          <span class="social-handle">@X2_FD</span>
        </div>
      </a>

      <!-- TikTok -->
      <a class="social-link" href="${SOCIAL.tiktok}" target="_blank">
        <svg class="social-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="rgba(200,196,184,0.6)">
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.53V6.77a4.85 4.85 0 01-1.01-.08z"/>
        </svg>
        <div class="social-info">
          <span class="social-name">TikTok</span>
          <span class="social-handle">—</span>
        </div>
      </a>

    </div>
  </div>

  <!-- DEV SECTION -->
  <div class="dev-section">
    <div class="dev-label">الصانع — المطور</div>
    <a class="dev-link" href="${SOCIAL.facebook}" target="_blank">
      <svg width="90" height="90" viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg" fill="none">
        <!-- reaper body -->
        <path d="M45 10 C28 10 15 22 15 38 C15 50 22 60 34 65 L34 72 C34 74 36 76 38 76 L52 76 C54 76 56 74 56 72 L56 65 C68 60 75 50 75 38 C75 22 62 10 45 10 Z"
          fill="rgba(15,13,11,0.9)" stroke="rgba(200,196,184,0.12)" stroke-width="1"/>
        <!-- hooded robe folds -->
        <path d="M20 38 Q15 50 18 65 L26 68 L24 55" fill="rgba(10,9,8,0.95)" stroke="rgba(200,196,184,0.08)" stroke-width="0.8"/>
        <path d="M70 38 Q75 50 72 65 L64 68 L66 55" fill="rgba(10,9,8,0.95)" stroke="rgba(200,196,184,0.08)" stroke-width="0.8"/>
        <!-- hood shadow -->
        <ellipse cx="45" cy="28" rx="22" ry="18" fill="rgba(5,4,3,0.8)" stroke="rgba(200,196,184,0.1)" stroke-width="0.8"/>
        <!-- face void -->
        <ellipse cx="45" cy="32" rx="14" ry="12" fill="rgba(3,2,2,0.98)"/>
        <!-- glowing eyes -->
        <ellipse cx="39" cy="31" rx="3" ry="3.5" fill="rgba(200,196,184,0.12)" style="animation:eyepulse 2s ease-in-out infinite"/>
        <ellipse cx="51" cy="31" rx="3" ry="3.5" fill="rgba(200,196,184,0.12)" style="animation:eyepulse 2s ease-in-out infinite 0.3s"/>
        <!-- scythe handle -->
        <line x1="60" y1="72" x2="78" y2="20" stroke="rgba(200,196,184,0.2)" stroke-width="1.2"/>
        <!-- scythe blade -->
        <path d="M78 20 Q90 8 82 16 Q75 24 68 28" fill="none" stroke="rgba(200,196,184,0.25)" stroke-width="1.2"/>
        <!-- teeth -->
        <rect x="38" y="42" width="5" height="8" rx="0.5" fill="rgba(220,215,205,0.07)" stroke="rgba(200,196,184,0.1)" stroke-width="0.6"/>
        <rect x="45" y="42" width="5" height="9" rx="0.5" fill="rgba(220,215,205,0.07)" stroke="rgba(200,196,184,0.1)" stroke-width="0.6"/>
        <rect x="52" y="42" width="5" height="8" rx="0.5" fill="rgba(220,215,205,0.07)" stroke="rgba(200,196,184,0.1)" stroke-width="0.6"/>
        <!-- text -->
        <text x="45" y="87" text-anchor="middle" fill="rgba(200,196,184,0.2)"
          font-size="6" font-family="serif" letter-spacing="2">الصانع</text>
      </svg>
    </a>
    <div class="dev-name">${SOCIAL.devName}</div>
  </div>

  <div class="runes">ᚲ ᛁ ᚱ ᚨ &nbsp;•&nbsp; ᛞᛖᚨᚦ &nbsp;•&nbsp; ᛊᛟᚢᛚ</div>

  <!-- DIVIDER -->
  <div class="divider">
    <svg viewBox="0 0 560 30" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
      <line x1="0" y1="15" x2="560" y2="15" stroke="rgba(200,196,184,0.08)" stroke-width="0.8"/>
      <!-- bones decoration -->
      <circle cx="270" cy="15" r="4" fill="none" stroke="rgba(200,196,184,0.15)" stroke-width="0.8"/>
      <circle cx="260" cy="15" r="2" fill="none" stroke="rgba(200,196,184,0.1)" stroke-width="0.6"/>
      <circle cx="280" cy="15" r="2" fill="none" stroke="rgba(200,196,184,0.1)" stroke-width="0.6"/>
    </svg>
  </div>

  <!-- BOTTOM BAR -->
  <div class="bottom-bar">
    <span class="hl">${botName}</span>
    <span>${timeNow}</span>
    <span class="hl">by ${SOCIAL.devName}</span>
  </div>

</div>

<style>
@keyframes eyepulse {
  0%,100%{opacity:0.12} 50%{opacity:0.35}
}
</style>

<script>
// ── DRIPS ──
const dripsContainer = document.getElementById('drips');
const dripsCount = 18;
for (let i = 0; i < dripsCount; i++) {
  const d = document.createElement('div');
  d.className = 'drip';
  const h = 20 + Math.random() * 80;
  d.style.cssText = \`
    left:\${Math.random()*100}%;
    width:\${0.8+Math.random()*2}px;
    --dd:\${6+Math.random()*10}s;
    --ddelay:-\${Math.random()*12}s;
    --dh:\${h}px;
    opacity:\${0.3+Math.random()*0.5};
  \`;
  dripsContainer.appendChild(d);
}

// ── PARTICLES ──
const partContainer = document.getElementById('particles');
for (let i = 0; i < 12; i++) {
  const p = document.createElement('div');
  p.className = 'particle';
  const sz = 1 + Math.random() * 3;
  p.style.cssText = \`
    left:\${Math.random()*100}%;
    top:\${10+Math.random()*80}%;
    width:\${sz}px; height:\${sz}px;
    --pd:\${15+Math.random()*20}s;
    --pdelay:-\${Math.random()*20}s;
    --px:\${(Math.random()-.5)*60}px;
    --py:\${(Math.random()-.5)*60}px;
    --po:\${0.02+Math.random()*0.06};
  \`;
  partContainer.appendChild(p);
}

// ── UPTIME ──
const BOOT = Date.now() - ${uptime};
function pad(n){ return String(n).padStart(2,'0'); }
function tick(){
  const u = Date.now() - BOOT;
  document.getElementById('ud').textContent = pad(Math.floor(u/86400000));
  document.getElementById('uh').textContent = pad(Math.floor((u%86400000)/3600000));
  document.getElementById('um').textContent = pad(Math.floor((u%3600000)/60000));
  document.getElementById('us').textContent = pad(Math.floor((u%60000)/1000));
}
setInterval(tick, 1000); tick();

// ── RANDOM CRACK LINES ──
setInterval(() => {
  if (Math.random() > 0.7) return;
  const crack = document.createElement('div');
  const x = Math.random() * window.innerWidth;
  const y = Math.random() * window.innerHeight;
  const len = 20 + Math.random() * 60;
  const angle = Math.random() * 360;
  crack.style.cssText = \`
    position:fixed; z-index:9; pointer-events:none;
    left:\${x}px; top:\${y}px;
    width:\${len}px; height:1px;
    background:linear-gradient(90deg,transparent,rgba(200,196,184,0.15),transparent);
    transform:rotate(\${angle}deg); transform-origin:0 50%;
    animation:crackfade 1.5s ease-out forwards;
  \`;
  document.body.appendChild(crack);
  setTimeout(()=>crack.remove(), 1600);
}, 4000);

const crackStyle = document.createElement('style');
crackStyle.textContent = '@keyframes crackfade{0%{opacity:0;transform:rotate(var(--a,0deg)) scaleX(0)}15%{opacity:1;transform:rotate(var(--a,0deg)) scaleX(1)}80%{opacity:0.4}100%{opacity:0;transform:rotate(var(--a,0deg)) scaleX(1)}}';
document.head.appendChild(crackStyle);

// ── SHADOW FIGURES ──
setInterval(() => {
  if (Math.random() > 0.35) return;
  const s = document.createElement('div');
  const side = Math.random() > 0.5;
  s.style.cssText = \`
    position:fixed; z-index:8; pointer-events:none;
    \${side?'right':'left'}:0; bottom:0;
    width:\${30+Math.random()*40}px;
    height:\${80+Math.random()*120}px;
    background:rgba(5,4,3,\${0.4+Math.random()*0.4});
    clip-path:polygon(20% 100%, 80% 100%, 75% 40%, 85% 20%, 70% 0%, 60% 15%, 50% 0%, 40% 15%, 30% 0%, 15% 20%, 25% 40%);
    animation:shadowappear 3s ease-in-out forwards;
    filter:blur(2px);
  \`;
  document.body.appendChild(s);
  setTimeout(()=>s.remove(), 3200);
}, 8000);

const shadowStyle = document.createElement('style');
shadowStyle.textContent = '@keyframes shadowappear{0%{opacity:0;transform:translateY(20px)}20%{opacity:0.8}80%{opacity:0.6}100%{opacity:0;transform:translateY(-10px)}}';
document.head.appendChild(shadowStyle);

// ── SCREEN SHAKE ──
setInterval(() => {
  if (Math.random() > 0.15) return;
  document.body.style.animation = 'shake 0.3s ease-in-out';
  setTimeout(() => document.body.style.animation = '', 350);
}, 20000);

const shakeStyle = document.createElement('style');
shakeStyle.textContent = '@keyframes shake{0%,100%{transform:translate(0,0)}20%{transform:translate(-2px,1px)}40%{transform:translate(2px,-1px)}60%{transform:translate(-1px,2px)}80%{transform:translate(1px,-2px)}}';
document.head.appendChild(shakeStyle);
</script>
</body>
</html>`);
});

// ── BOT SPAWN ──
function startBot(message) {
  if (message) logger(message, "[ Starting ]");

  const child = spawn("node", ["--trace-warnings", "--async-stack-traces", "KIRA.js"], {
    cwd: __dirname,
    stdio: "inherit",
    shell: true
  });

  child.on("close", (codeExit) => {
    global.countRestart = (global.countRestart || 0) + 1;
    const delay = Math.min(5000 * global.countRestart, 30000);
    console.log(chalk.bold.hex("#FF2200")(`[ RESTART ] بعد ${delay/1000} ثانية...`));
    setTimeout(() => startBot("اعادة تشغيل..."), delay);
  });

  child.on("error", (error) => {
    logger("خطأ: " + JSON.stringify(error), "[ Starting ]");
    setTimeout(() => startBot("اعادة بعد خطأ..."), 5000);
  });
}

// ── SELF PING ──
const SELF_URL = process.env.RENDER_URL || process.env.RAILWAY_PUBLIC_DOMAIN || "";
if (SELF_URL) {
  const pingUrl = SELF_URL.startsWith("http") ? SELF_URL : `https://${SELF_URL}`;
  setInterval(() => {
    axios.get(pingUrl).catch(() => {});
    console.log(chalk.bold.hex("#FF6600")(`[ PING ] ${pingUrl}`));
  }, 4 * 60 * 1000);
}

logger("KIRA BOT", "[ NAME ]");
logger("Version: 1.2.14", "[ VERSION ]");

startBot();

app.listen(port, () => {
  console.log(chalk.bold.hex("#FF2200")("╔═══════════════════════════════════════╗"));
  console.log(chalk.bold.hex("#FF2200")("║") + chalk.bold.hex("#c8c4b8")("       KIRA — SERVER ONLINE            ") + chalk.bold.hex("#FF2200")("║"));
  console.log(chalk.bold.hex("#FF2200")("║") + chalk.hex("#888078")(`         PORT: ${port}                    `) + chalk.bold.hex("#FF2200")("║"));
  console.log(chalk.bold.hex("#FF2200")("╚═══════════════════════════════════════╝"));
});

process.on("unhandledRejection", (err) => {
  console.log(chalk.red("[ ERROR ]"), err?.message || err);
});

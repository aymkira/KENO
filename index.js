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
const c = ["cyan","#7D053F"];
const redToGreen = gradient("red","cyan");
console.log(redToGreen("━".repeat(50),{interpolation:"hsv"}));
console.log(gradient(c).multiline(logo));
console.log(redToGreen("━".repeat(50),{interpolation:"hsv"}));

const SOCIAL = {
  devName:"أيمن",
  facebook:"https://www.facebook.com/profile.php?id=61580139921634",
  instagram:"https://instagram.com/x_v_k1",
  telegram:"https://t.me/X2_FD",
  tiktok:"#"
};

const app = express();
const port = process.env.PORT || 3078;
const BOOT_TIME = Date.now();

app.get("/", (req, res) => {
  const uptime  = Date.now() - BOOT_TIME;
  const days    = Math.floor(uptime / 86400000);
  const hours   = Math.floor((uptime % 86400000) / 3600000);
  const minutes = Math.floor((uptime % 3600000) / 60000);
  const seconds = Math.floor((uptime % 60000) / 1000);
  const botName = global.config?.BOTNAME || "KIRA";
  const timeNow = moment().tz("Africa/Casablanca").format("HH:mm:ss • DD/MM/YYYY");
  const pad = n => String(n).padStart(2,"0");

  res.send(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${botName} — بوابة الجحيم</title>
<link href="https://fonts.googleapis.com/css2?family=UnifrakturMaguntia&family=IM+Fell+English:ital@0;1&family=Cinzel:wght@400;700;900&family=Special+Elite&family=Noto+Kufi+Arabic:wght@300;400;700;900&display=swap" rel="stylesheet">
<style>
/* ══════════════════════════════════════════
   VARIABLES
══════════════════════════════════════════ */
:root{
  --void:#020202;
  --abyss:#050508;
  --stone:#0d0d10;
  --granite:#1a1a1e;
  --ash:#2e2e32;
  --smoke:#4a4a50;
  --bone:#b8b4a8;
  --parch:#d4cfc0;
  --wax:#e8e0c8;
  --candle:#f5c842;
  --lantern:#e8a020;
  --ghost:rgba(184,180,168,0.06);
  --crack:rgba(184,180,168,0.12);
}

/* ══════════════════════════════════════════
   BASE
══════════════════════════════════════════ */
*{margin:0;padding:0;box-sizing:border-box}
html,body{
  width:100%;min-height:100vh;
  background:var(--void);
  color:var(--bone);
  font-family:'IM Fell English',serif;
  overflow-x:hidden;
  cursor:none!important;
}

/* ══════════════════════════════════════════
   CUSTOM CURSOR
══════════════════════════════════════════ */
#cursor{
  position:fixed;z-index:9999;pointer-events:none;
  width:20px;height:20px;
  transform:translate(-50%,-50%);
  transition:transform 0.1s ease;
}
#cursor-trail{
  position:fixed;z-index:9998;pointer-events:none;
}
.trail-dot{
  position:absolute;
  width:4px;height:4px;
  border-radius:50%;
  background:rgba(184,180,168,0.3);
  transform:translate(-50%,-50%);
  pointer-events:none;
}

/* ══════════════════════════════════════════
   LAYERS
══════════════════════════════════════════ */
/* grain */
#grain{
  position:fixed;inset:0;z-index:1;pointer-events:none;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.055'/%3E%3C/svg%3E");
  opacity:0.6;
  mix-blend-mode:overlay;
}
/* vignette */
#vignette{
  position:fixed;inset:0;z-index:2;pointer-events:none;
  background:radial-gradient(ellipse at 50% 45%,transparent 28%,rgba(0,0,0,0.88) 100%);
}
/* scan */
#scan{
  position:fixed;inset:0;z-index:3;pointer-events:none;
  background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.08) 2px,rgba(0,0,0,0.08) 3px);
}
/* fog */
#fog{
  position:fixed;inset:0;z-index:4;pointer-events:none;
  background:radial-gradient(ellipse 120% 40% at 50% 100%,rgba(30,28,25,0.7) 0%,transparent 60%);
  animation:fogmove 20s ease-in-out infinite alternate;
}
@keyframes fogmove{0%{opacity:0.5;transform:scaleX(1)}100%{opacity:0.9;transform:scaleX(1.15)}}

/* ══════════════════════════════════════════
   BACKGROUND SCENE — CEMETERY
══════════════════════════════════════════ */
#scene{
  position:fixed;inset:0;z-index:0;
  overflow:hidden;
}
#scene-svg{
  position:absolute;bottom:0;left:0;right:0;
  width:100%;height:75%;
}

/* ══════════════════════════════════════════
   CONTENT
══════════════════════════════════════════ */
#content{
  position:relative;z-index:10;
  min-height:100vh;
  display:flex;flex-direction:column;align-items:center;
  padding:40px 20px 100px;
}

/* ══════════════════════════════════════════
   RITUAL CIRCLE — TOP
══════════════════════════════════════════ */
.ritual-ring{
  position:relative;
  width:220px;height:220px;
  margin-bottom:16px;
  animation:ringpulse 6s ease-in-out infinite;
}
@keyframes ringpulse{
  0%,100%{filter:drop-shadow(0 0 8px rgba(184,180,168,0.06))}
  50%{filter:drop-shadow(0 0 22px rgba(184,180,168,0.14)) drop-shadow(0 0 50px rgba(232,160,32,0.04))}
}

/* ══════════════════════════════════════════
   TITLE
══════════════════════════════════════════ */
.bot-name{
  font-family:'UnifrakturMaguntia',cursive;
  font-size:clamp(4.5rem,14vw,9rem);
  line-height:0.88;
  color:var(--parch);
  text-align:center;
  letter-spacing:0.04em;
  text-shadow:
    0 0 40px rgba(200,196,184,0.12),
    3px 3px 0 #0a0a0a,
    6px 6px 0 #050505;
  animation:titlebreath 8s ease-in-out infinite;
  position:relative;
}
@keyframes titlebreath{
  0%,100%{opacity:1}
  93%,95%{opacity:0.3}
  94%{opacity:0.1}
}
.bot-sub{
  font-family:'Cinzel',serif;
  font-size:clamp(0.42rem,1.4vw,0.6rem);
  letter-spacing:0.55em;
  color:var(--smoke);
  text-transform:uppercase;
  margin-top:10px;
  text-align:center;
  animation:subfade 7s ease-in-out infinite;
}
@keyframes subfade{0%,100%{opacity:0.5}50%{opacity:0.2}}

/* ══════════════════════════════════════════
   DIVIDER — RITUAL LINE
══════════════════════════════════════════ */
.r-divider{
  width:min(580px,90vw);
  height:28px;
  margin:20px 0;
}
.r-divider svg{width:100%;height:28px}

/* ══════════════════════════════════════════
   UPTIME SLAB
══════════════════════════════════════════ */
.slab{
  position:relative;
  width:min(500px,92vw);
  margin-bottom:28px;
  background:
    linear-gradient(180deg,rgba(18,16,14,0.97),rgba(8,7,6,0.99));
  border:1px solid rgba(184,180,168,0.1);
  padding:32px 22px 22px;
}
/* cracked stone texture on slab */
.slab::before{
  content:'';
  position:absolute;inset:0;
  background-image:
    linear-gradient(42deg,transparent 60%,rgba(184,180,168,0.015) 61%,transparent 62%),
    linear-gradient(128deg,transparent 70%,rgba(184,180,168,0.02) 71%,transparent 72%),
    linear-gradient(80deg,transparent 45%,rgba(184,180,168,0.01) 46%,transparent 47%);
  pointer-events:none;
}
.slab-label{
  position:absolute;top:-11px;left:50%;transform:translateX(-50%);
  background:var(--void);
  padding:0 18px;
  font-family:'Cinzel',serif;
  font-size:0.52rem;
  color:rgba(184,180,168,0.35);
  letter-spacing:0.5em;
  text-transform:uppercase;
  white-space:nowrap;
}
/* corner ornaments */
.slab-c{position:absolute;width:14px;height:14px;opacity:0.25}
.slab-c.tl{top:6px;left:6px;border-top:1px solid var(--bone);border-left:1px solid var(--bone)}
.slab-c.tr{top:6px;right:6px;border-top:1px solid var(--bone);border-right:1px solid var(--bone)}
.slab-c.bl{bottom:6px;left:6px;border-bottom:1px solid var(--bone);border-left:1px solid var(--bone)}
.slab-c.br{bottom:6px;right:6px;border-bottom:1px solid var(--bone);border-right:1px solid var(--bone)}

.ut-row{display:flex;gap:10px;justify-content:center;align-items:center}
.ut{
  display:flex;flex-direction:column;align-items:center;
  min-width:72px;padding:10px 6px 8px;
  background:rgba(255,255,255,0.015);
  border:1px solid rgba(184,180,168,0.07);
  position:relative;overflow:hidden;
}
.ut::after{
  content:'';position:absolute;top:0;left:0;right:0;height:1px;
  background:linear-gradient(90deg,transparent,rgba(184,180,168,0.18),transparent);
}
.ut-n{
  font-family:'Special Elite',cursive;
  font-size:clamp(1.8rem,5vw,2.5rem);
  color:var(--wax);
  line-height:1;
  text-shadow:0 0 18px rgba(245,200,66,0.12);
  animation:numflicker 14s ease-in-out infinite;
}
@keyframes numflicker{0%,93%,95%,100%{opacity:1}94%{opacity:0.25}}
.ut-l{
  font-family:'Noto Kufi Arabic',sans-serif;
  font-size:0.5rem;
  color:var(--smoke);
  margin-top:4px;letter-spacing:2px;
}
.ut-sep{
  font-family:'Special Elite',cursive;
  font-size:2rem;
  color:rgba(184,180,168,0.15);
  padding-bottom:16px;
  align-self:center;
}

/* ══════════════════════════════════════════
   SOCIAL LINKS
══════════════════════════════════════════ */
.soc-section{
  width:min(560px,92vw);
  margin-bottom:32px;
}
.soc-title{
  font-family:'Cinzel',serif;
  font-size:0.5rem;
  letter-spacing:0.55em;
  color:rgba(184,180,168,0.3);
  text-transform:uppercase;
  text-align:center;
  margin-bottom:18px;
}
.soc-grid{
  display:grid;
  grid-template-columns:repeat(2,1fr);
  gap:10px;
}
.soc-link{
  display:flex;align-items:center;gap:12px;
  padding:13px 15px;
  background:rgba(255,255,255,0.015);
  border:1px solid rgba(184,180,168,0.07);
  text-decoration:none;
  color:var(--bone);
  position:relative;overflow:hidden;
  transition:border-color 0.5s,background 0.5s;
}
.soc-link::before{
  content:'';position:absolute;inset:0;
  background:linear-gradient(135deg,rgba(184,180,168,0.04),transparent);
  opacity:0;transition:opacity 0.4s;
}
.soc-link:hover{border-color:rgba(184,180,168,0.22);background:rgba(255,255,255,0.03)}
.soc-link:hover::before{opacity:1}
.soc-link:hover .soc-icon{opacity:0.85}
.soc-icon{width:26px;height:26px;opacity:0.4;flex-shrink:0;transition:opacity 0.4s}
.soc-name{font-family:'Special Elite',cursive;font-size:0.68rem;letter-spacing:0.18em;color:var(--bone);text-transform:uppercase}
.soc-handle{font-family:'IM Fell English',serif;font-size:0.58rem;color:var(--smoke);font-style:italic}

/* ══════════════════════════════════════════
   DEV SECTION
══════════════════════════════════════════ */
.dev-section{text-align:center;margin:0 0 28px}
.dev-label{
  font-family:'Cinzel',serif;font-size:0.5rem;
  letter-spacing:0.55em;color:rgba(184,180,168,0.3);
  text-transform:uppercase;margin-bottom:14px;
}
.dev-link{
  display:inline-block;text-decoration:none;
  animation:devfloat 5s ease-in-out infinite;
}
.dev-link:hover .dev-svg{filter:brightness(1.5)}
@keyframes devfloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
.dev-name{
  font-family:'UnifrakturMaguntia',cursive;
  font-size:1rem;color:var(--bone);
  letter-spacing:5px;margin-top:8px;opacity:0.4;
}

/* ══════════════════════════════════════════
   RUNES
══════════════════════════════════════════ */
.runes{
  font-family:'IM Fell English',serif;font-style:italic;
  font-size:clamp(0.85rem,2.5vw,1.1rem);
  color:rgba(184,180,168,0.15);
  letter-spacing:0.5em;margin-bottom:18px;
  animation:runesway 11s ease-in-out infinite;
}
@keyframes runesway{0%,100%{opacity:0.15;letter-spacing:0.5em}50%{opacity:0.3;letter-spacing:0.55em}}

/* ══════════════════════════════════════════
   BOTTOM
══════════════════════════════════════════ */
.bot-bar{
  width:min(560px,92vw);
  display:flex;align-items:center;justify-content:space-between;
  padding:10px 16px;
  border-top:1px solid rgba(184,180,168,0.07);
  font-family:'Special Elite',cursive;
  font-size:0.52rem;
  color:rgba(184,180,168,0.2);
  letter-spacing:0.18em;
  flex-wrap:wrap;gap:5px;
}
.bot-bar .hl{color:rgba(184,180,168,0.45)}

/* ══════════════════════════════════════════
   CANDLES
══════════════════════════════════════════ */
.candle-wrap{
  position:fixed;z-index:6;pointer-events:none;
  bottom:0;
  display:flex;flex-direction:column;align-items:center;
}
.candle-body{
  width:var(--cw,14px);
  background:linear-gradient(180deg,rgba(210,190,140,0.9),rgba(180,160,110,0.85),rgba(150,130,90,0.9));
  border-radius:2px 2px 0 0;
  position:relative;
}
.candle-body::before{
  content:'';position:absolute;
  top:0;left:50%;transform:translateX(-50%);
  width:1px;height:var(--wh,8px);
  background:rgba(100,90,60,0.8);
}
.flame{
  width:var(--fw,10px);
  position:relative;
  margin:0 auto;
}
.flame-inner{
  width:100%;
  background:radial-gradient(ellipse 60% 100% at 50% 100%,rgba(245,220,80,0.95) 0%,rgba(245,180,30,0.8) 40%,rgba(220,100,10,0.4) 70%,transparent 100%);
  border-radius:50% 50% 20% 20%;
  animation:flameburn var(--fd,2.8s) ease-in-out infinite var(--fdelay,0s);
  transform-origin:bottom center;
}
.flame-glow{
  position:absolute;
  bottom:-4px;left:50%;transform:translateX(-50%);
  width:calc(var(--fw,10px)*3);
  height:calc(var(--fw,10px)*3);
  background:radial-gradient(circle,rgba(245,200,66,0.18) 0%,transparent 70%);
  animation:glowpulse var(--fd,2.8s) ease-in-out infinite var(--fdelay,0s);
  border-radius:50%;
}
@keyframes flameburn{
  0%,100%{transform:scaleX(1) scaleY(1) rotate(-1deg);opacity:0.95}
  25%{transform:scaleX(0.88) scaleY(1.06) rotate(1.5deg);opacity:1}
  50%{transform:scaleX(1.05) scaleY(0.96) rotate(-0.5deg);opacity:0.9}
  75%{transform:scaleX(0.92) scaleY(1.04) rotate(2deg);opacity:0.98}
}
@keyframes glowpulse{
  0%,100%{opacity:0.5;transform:translateX(-50%) scale(1)}
  50%{opacity:0.9;transform:translateX(-50%) scale(1.15)}
}

/* ══════════════════════════════════════════
   LANTERN
══════════════════════════════════════════ */
#lantern{
  position:fixed;top:12px;right:18px;z-index:20;
  animation:lanternsway 4s ease-in-out infinite;
  transform-origin:top center;
  pointer-events:none;
}
@keyframes lanternsway{
  0%,100%{transform:rotate(-3deg)}
  50%{transform:rotate(4deg)}
}
.lantern-glow{
  position:absolute;
  top:50%;left:50%;transform:translate(-50%,-50%);
  width:80px;height:80px;
  background:radial-gradient(circle,rgba(232,160,32,0.25) 0%,transparent 70%);
  border-radius:50%;
  animation:lantglow 3s ease-in-out infinite;
  pointer-events:none;
}
@keyframes lantglow{
  0%,100%{opacity:0.6;transform:translate(-50%,-50%) scale(1)}
  50%{opacity:1;transform:translate(-50%,-50%) scale(1.2)}
}

/* ══════════════════════════════════════════
   HANDS FROM GROUND
══════════════════════════════════════════ */
.hand-wrap{
  position:fixed;bottom:-5px;z-index:7;pointer-events:none;
  animation:handrise var(--hd,12s) ease-in-out infinite var(--hdelay,0s);
}
@keyframes handrise{
  0%,60%,100%{transform:translateY(0)}
  30%{transform:translateY(var(--hrise,-40px))}
}

/* ══════════════════════════════════════════
   SHADOW FIGURE
══════════════════════════════════════════ */
#shadow-figure{
  position:fixed;bottom:0;z-index:5;pointer-events:none;
  opacity:0;
  filter:blur(3px);
  transition:left 0.05s linear;
}

/* ══════════════════════════════════════════
   FACES
══════════════════════════════════════════ */
.distorted-face{
  position:fixed;z-index:8;pointer-events:none;
  opacity:0;
  animation:faceappear var(--fad,4s) ease-in-out var(--fadelay,0s) forwards;
}
@keyframes faceappear{
  0%{opacity:0;transform:scale(0.8)}
  15%{opacity:var(--fao,0.18)}
  85%{opacity:var(--fao,0.18)}
  100%{opacity:0;transform:scale(1.05)}
}

/* ══════════════════════════════════════════
   EYES
══════════════════════════════════════════ */
.eye-pair{
  position:fixed;z-index:8;pointer-events:none;
  opacity:0;
  display:flex;gap:12px;
  animation:eyeappear 1.2s ease-in-out forwards;
}
@keyframes eyeappear{
  0%{opacity:0}15%{opacity:0.7}85%{opacity:0.7}100%{opacity:0}
}

/* ══════════════════════════════════════════
   MEMORY MESSAGE
══════════════════════════════════════════ */
#memory-msg{
  position:fixed;bottom:30px;left:50%;transform:translateX(-50%);
  z-index:100;pointer-events:none;
  font-family:'IM Fell English',serif;font-style:italic;
  font-size:0.75rem;color:rgba(184,180,168,0.5);
  letter-spacing:0.2em;text-align:center;
  opacity:0;
  animation:msgappear 6s ease-in-out forwards 3s;
  white-space:nowrap;
}
@keyframes msgappear{
  0%{opacity:0}20%{opacity:0.6}80%{opacity:0.6}100%{opacity:0}
}

/* ══════════════════════════════════════════
   BLOOD CURSOR TRAIL
══════════════════════════════════════════ */
.blood-drop{
  position:fixed;z-index:9999;pointer-events:none;
  width:6px;height:10px;
  border-radius:50% 50% 50% 50% / 60% 60% 40% 40%;
  background:rgba(80,60,50,0.6);
  animation:bloodfade 1.8s ease-out forwards;
  transform:translate(-50%,-50%);
}
@keyframes bloodfade{
  0%{opacity:0.7;transform:translate(-50%,-50%) scale(1)}
  100%{opacity:0;transform:translate(-50%,10px) scale(0.3)}
}

/* SCROLLBAR */
::-webkit-scrollbar{width:4px}
::-webkit-scrollbar-track{background:#020202}
::-webkit-scrollbar-thumb{background:#1a1a1a;border-radius:2px}

@media(max-width:480px){
  .soc-grid{grid-template-columns:1fr}
  .ut-row{gap:5px}
  .ut{min-width:58px}
}
</style>
</head>
<body>

<!-- LAYERS -->
<div id="grain"></div>
<div id="vignette"></div>
<div id="scan"></div>
<div id="fog"></div>

<!-- CUSTOM CURSOR -->
<svg id="cursor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" fill="none">
  <circle cx="10" cy="10" r="7" stroke="rgba(184,180,168,0.5)" stroke-width="1"/>
  <circle cx="10" cy="10" r="2" fill="rgba(184,180,168,0.7)"/>
  <line x1="10" y1="1" x2="10" y2="5" stroke="rgba(184,180,168,0.4)" stroke-width="1"/>
  <line x1="10" y1="15" x2="10" y2="19" stroke="rgba(184,180,168,0.4)" stroke-width="1"/>
  <line x1="1" y1="10" x2="5" y2="10" stroke="rgba(184,180,168,0.4)" stroke-width="1"/>
  <line x1="15" y1="10" x2="19" y2="10" stroke="rgba(184,180,168,0.4)" stroke-width="1"/>
</svg>
<div id="cursor-trail"></div>

<!-- ══ BACKGROUND SCENE ══ -->
<div id="scene">
  <svg id="scene-svg" viewBox="0 0 1400 600" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax slice">
    <defs>
      <radialGradient id="moonGlow" cx="15%" cy="18%" r="12%">
        <stop offset="0%" stop-color="rgba(220,215,200,0.08)"/>
        <stop offset="100%" stop-color="transparent"/>
      </radialGradient>
      <filter id="blur2"><feGaussianBlur stdDeviation="2"/></filter>
      <filter id="blur5"><feGaussianBlur stdDeviation="5"/></filter>
      <filter id="blur1"><feGaussianBlur stdDeviation="1"/></filter>
    </defs>

    <circle cx="210" cy="108" r="80" fill="url(#moonGlow)"/>
    <circle cx="210" cy="108" r="28" fill="rgba(200,195,178,0.06)" stroke="rgba(200,195,178,0.1)" stroke-width="0.5"/>
    <circle cx="202" cy="102" r="4" fill="rgba(150,145,130,0.04)"/>
    <circle cx="218" cy="115" r="3" fill="rgba(150,145,130,0.03)"/>

    <g opacity="0.25" transform="translate(60,0)">
      <line x1="30" y1="600" x2="28" y2="380" stroke="#1a1a18" stroke-width="4"/>
      <line x1="28" y1="420" x2="5" y2="340" stroke="#1a1a18" stroke-width="2.5"/>
      <line x1="28" y1="440" x2="52" y2="360" stroke="#1a1a18" stroke-width="2.5"/>
      <line x1="28" y1="400" x2="-5" y2="355" stroke="#1a1a18" stroke-width="2"/>
      <line x1="5" y1="340" x2="-10" y2="310" stroke="#1a1a18" stroke-width="1.5"/>
      <line x1="5" y1="340" x2="15" y2="305" stroke="#1a1a18" stroke-width="1.5"/>
    </g>
    <g opacity="0.25" transform="translate(1280,0)">
      <line x1="30" y1="600" x2="32" y2="390" stroke="#1a1a18" stroke-width="4"/>
      <line x1="32" y1="430" x2="8" y2="345" stroke="#1a1a18" stroke-width="2.5"/>
      <line x1="32" y1="450" x2="55" y2="370" stroke="#1a1a18" stroke-width="2.5"/>
      <line x1="55" y1="370" x2="70" y2="335" stroke="#1a1a18" stroke-width="1.5"/>
    </g>

    <path d="M0 540 Q350 520 700 535 Q1050 550 1400 530 L1400 600 L0 600 Z" fill="rgba(12,11,10,0.98)"/>
    <path d="M0 560 Q250 545 700 558 Q1100 568 1400 550 L1400 600 L0 600 Z" fill="rgba(8,7,6,0.99)"/>
    <path d="M50 575 Q200 570 400 575 Q600 580 800 574 Q1000 568 1200 573 Q1300 576 1400 572" stroke="rgba(184,180,168,0.03)" stroke-width="1.5" fill="none"/>
    <path d="M0 585 Q300 580 600 585 Q900 590 1200 583 L1400 586" stroke="rgba(184,180,168,0.025)" stroke-width="1" fill="none"/>

    <g stroke="rgba(184,180,168,0.08)" stroke-width="0.8" fill="none">
      <path d="M180 555 L195 565 L188 572 L200 580"/>
      <path d="M195 565 L210 560"/>
      <path d="M400 548 L420 558 L412 568"/>
      <path d="M420 558 L435 553"/>
      <path d="M650 552 L665 562 L655 572 L670 578"/>
      <path d="M665 562 L678 558"/>
      <path d="M900 550 L912 561 L905 570"/>
      <path d="M1100 555 L1115 563 L1108 572 L1122 577"/>
      <path d="M1250 548 L1265 558 L1258 567"/>
    </g>

    <g transform="translate(660,390)">
      <path d="M0 170 L0 20 Q0 0 20 0 L60 0 Q80 0 80 20 L80 170 Z" fill="rgba(22,20,18,0.95)" stroke="rgba(184,180,168,0.15)" stroke-width="1"/>
      <path d="M10 20 Q10 5 20 5 L60 5 Q70 5 70 20" fill="none" stroke="rgba(184,180,168,0.08)" stroke-width="0.8"/>
      <line x1="40" y1="30" x2="40" y2="100" stroke="rgba(184,180,168,0.12)" stroke-width="1.5"/>
      <line x1="18" y1="55" x2="62" y2="55" stroke="rgba(184,180,168,0.12)" stroke-width="1.5"/>
      <text x="40" y="125" text-anchor="middle" fill="rgba(184,180,168,0.2)" font-size="9" font-family="serif" letter-spacing="3">R.I.P</text>
      <text x="40" y="140" text-anchor="middle" fill="rgba(184,180,168,0.12)" font-size="6" font-family="serif">مرقدٌ في الأبد</text>
      <rect x="-8" y="165" width="96" height="10" fill="rgba(18,16,14,0.9)" stroke="rgba(184,180,168,0.1)" stroke-width="0.8"/>
    </g>

    <g transform="translate(300,430)">
      <path d="M0 130 L0 18 Q0 0 15 0 L45 0 Q60 0 60 18 L60 130 Z" fill="rgba(20,18,16,0.95)" stroke="rgba(184,180,168,0.12)" stroke-width="1"/>
      <line x1="30" y1="25" x2="30" y2="80" stroke="rgba(184,180,168,0.1)" stroke-width="1.2"/>
      <line x1="12" y1="45" x2="48" y2="45" stroke="rgba(184,180,168,0.1)" stroke-width="1.2"/>
      <text x="30" y="100" text-anchor="middle" fill="rgba(184,180,168,0.15)" font-size="7" font-family="serif">✝</text>
      <rect x="-6" y="127" width="72" height="8" fill="rgba(15,13,12,0.9)" stroke="rgba(184,180,168,0.08)" stroke-width="0.7"/>
    </g>
    <g transform="translate(420,455)">
      <path d="M0 100 L0 14 Q0 0 12 0 L38 0 Q50 0 50 14 L50 100 Z" fill="rgba(18,16,15,0.9)" stroke="rgba(184,180,168,0.1)" stroke-width="0.8"/>
      <line x1="25" y1="20" x2="25" y2="62" stroke="rgba(184,180,168,0.08)" stroke-width="1"/>
      <line x1="10" y1="35" x2="40" y2="35" stroke="rgba(184,180,168,0.08)" stroke-width="1"/>
      <rect x="-5" y="97" width="60" height="7" fill="rgba(14,12,11,0.9)" stroke="rgba(184,180,168,0.07)" stroke-width="0.6"/>
    </g>

    <g transform="translate(880,440)">
      <path d="M0 120 L0 16 Q0 0 14 0 L42 0 Q56 0 56 16 L56 120 Z" fill="rgba(20,18,16,0.92)" stroke="rgba(184,180,168,0.11)" stroke-width="0.9"/>
      <line x1="28" y1="22" x2="28" y2="72" stroke="rgba(184,180,168,0.09)" stroke-width="1.1"/>
      <line x1="11" y1="40" x2="45" y2="40" stroke="rgba(184,180,168,0.09)" stroke-width="1.1"/>
      <text x="28" y="92" text-anchor="middle" fill="rgba(184,180,168,0.14)" font-size="6" font-family="serif">هنا يرقد</text>
      <rect x="-6" y="117" width="68" height="8" fill="rgba(15,13,12,0.9)" stroke="rgba(184,180,168,0.08)" stroke-width="0.6"/>
    </g>
    <g transform="translate(1010,460)">
      <path d="M0 95 L0 13 Q0 0 11 0 L39 0 Q50 0 50 13 L50 95 Z" fill="rgba(18,16,14,0.88)" stroke="rgba(184,180,168,0.09)" stroke-width="0.8"/>
      <line x1="25" y1="18" x2="25" y2="58" stroke="rgba(184,180,168,0.07)" stroke-width="1"/>
      <line x1="10" y1="33" x2="40" y2="33" stroke="rgba(184,180,168,0.07)" stroke-width="1"/>
      <rect x="-5" y="92" width="60" height="7" fill="rgba(13,11,10,0.9)" stroke="rgba(184,180,168,0.07)" stroke-width="0.6"/>
    </g>

    <g transform="translate(700,555)" opacity="0.12">
      <circle cx="0" cy="0" r="45" stroke="rgba(184,180,168,0.5)" stroke-width="0.6" fill="none"/>
      <polygon points="0,-40 38,13 -24,32 24,32 -38,13" fill="none" stroke="rgba(184,180,168,0.5)" stroke-width="0.6"/>
    </g>

    <g opacity="0.7">
      <line x1="150" y1="600" x2="145" y2="300" stroke="#0e0e0c" stroke-width="8"/>
      <line x1="145" y1="350" x2="80" y2="240" stroke="#0e0e0c" stroke-width="5"/>
      <line x1="80" y1="240" x2="40" y2="185" stroke="#0e0e0c" stroke-width="3"/>
      <line x1="40" y1="185" x2="15" y2="155" stroke="#0e0e0c" stroke-width="2"/>
      <line x1="40" y1="185" x2="65" y2="160" stroke="#0e0e0c" stroke-width="2"/>
      <line x1="80" y1="240" x2="100" y2="210" stroke="#0e0e0c" stroke-width="2.5"/>
      <line x1="145" y1="380" x2="200" y2="295" stroke="#0e0e0c" stroke-width="4"/>
      <line x1="200" y1="295" x2="240" y2="255" stroke="#0e0e0c" stroke-width="2.5"/>
      <line x1="200" y1="295" x2="175" y2="265" stroke="#0e0e0c" stroke-width="2"/>
      <line x1="145" y1="420" x2="95" y2="360" stroke="#0e0e0c" stroke-width="3.5"/>
    </g>

    <g opacity="0.7">
      <line x1="1250" y1="600" x2="1255" y2="295" stroke="#0e0e0c" stroke-width="8"/>
      <line x1="1255" y1="345" x2="1320" y2="235" stroke="#0e0e0c" stroke-width="5"/>
      <line x1="1320" y1="235" x2="1365" y2="180" stroke="#0e0e0c" stroke-width="3"/>
      <line x1="1365" y1="180" x2="1390" y2="150" stroke="#0e0e0c" stroke-width="2"/>
      <line x1="1365" y1="180" x2="1345" y2="152" stroke="#0e0e0c" stroke-width="2"/>
      <line x1="1320" y1="235" x2="1295" y2="205" stroke="#0e0e0c" stroke-width="2.5"/>
      <line x1="1255" y1="375" x2="1200" y2="290" stroke="#0e0e0c" stroke-width="4"/>
      <line x1="1200" y1="290" x2="1160" y2="250" stroke="#0e0e0c" stroke-width="2.5"/>
      <line x1="1200" y1="290" x2="1225" y2="260" stroke="#0e0e0c" stroke-width="2"/>
    </g>

    <g transform="translate(560,360)" opacity="0.55">
      <rect x="0" y="0" width="18" height="180" fill="rgba(15,13,12,0.95)" stroke="rgba(184,180,168,0.15)" stroke-width="0.8"/>
      <rect x="262" y="0" width="18" height="180" fill="rgba(15,13,12,0.95)" stroke="rgba(184,180,168,0.15)" stroke-width="0.8"/>
      <path d="M-4 0 L22 0 L22 -12 L9 -20 L-4 -12 Z" fill="rgba(18,16,14,0.9)" stroke="rgba(184,180,168,0.12)" stroke-width="0.7"/>
      <path d="M258 0 L284 0 L284 -12 L271 -20 L258 -12 Z" fill="rgba(18,16,14,0.9)" stroke="rgba(184,180,168,0.12)" stroke-width="0.7"/>
      <rect x="22" y="10" width="115" height="168" fill="rgba(12,10,9,0.6)" stroke="rgba(184,180,168,0.1)" stroke-width="0.7"/>
      <rect x="30" y="18" width="48" height="72" fill="none" stroke="rgba(184,180,168,0.08)" stroke-width="0.6"/>
      <rect x="30" y="100" width="48" height="70" fill="none" stroke="rgba(184,180,168,0.08)" stroke-width="0.6"/>
      <rect x="143" y="10" width="115" height="168" fill="rgba(12,10,9,0.5)" stroke="rgba(184,180,168,0.1)" stroke-width="0.7"/>
      <rect x="152" y="18" width="48" height="72" fill="none" stroke="rgba(184,180,168,0.08)" stroke-width="0.6"/>
      <rect x="152" y="100" width="48" height="70" fill="none" stroke="rgba(184,180,168,0.08)" stroke-width="0.6"/>
      <path d="M0 0 Q140 -80 280 0" fill="none" stroke="rgba(184,180,168,0.15)" stroke-width="1.2"/>
    </g>

    <g transform="translate(1100,300)" opacity="0.4">
      <rect x="0" y="0" width="60" height="90" fill="rgba(10,9,8,0.5)" stroke="rgba(184,180,168,0.15)" stroke-width="1"/>
      <path d="M0 30 Q30 0 60 30" fill="rgba(8,7,6,0.3)" stroke="rgba(184,180,168,0.12)" stroke-width="0.8"/>
      <line x1="15" y1="0" x2="25" y2="40" stroke="rgba(184,180,168,0.1)" stroke-width="1"/>
      <line x1="45" y1="0" x2="38" y2="35" stroke="rgba(184,180,168,0.08)" stroke-width="0.8"/>
      <path d="M5 35 Q30 8 55 35 L50 80 L10 80 Z" fill="rgba(200,180,100,0.02)"/>
    </g>

    <g transform="translate(240,310)" opacity="0.35">
      <rect x="0" y="0" width="50" height="80" fill="rgba(10,9,8,0.5)" stroke="rgba(184,180,168,0.12)" stroke-width="0.9"/>
      <path d="M0 25 Q25 0 50 25" fill="rgba(8,7,6,0.3)" stroke="rgba(184,180,168,0.1)" stroke-width="0.7"/>
      <line x1="25" y1="0" x2="20" y2="50" stroke="rgba(184,180,168,0.08)" stroke-width="0.8"/>
    </g>
  </svg>
</div>

<!-- CANDLES -->
<div class="candle-wrap" style="left:4%;--cw:12px;--wh:7px;--fw:9px;--fd:2.6s;--fdelay:0s">
  <div class="flame"><div class="flame-glow"></div><div class="flame-inner" style="height:18px"></div></div>
  <div class="candle-body" style="height:55px"></div>
</div>
<div class="candle-wrap" style="left:5.5%;--cw:10px;--wh:6px;--fw:8px;--fd:3.1s;--fdelay:0.4s">
  <div class="flame"><div class="flame-glow"></div><div class="flame-inner" style="height:15px"></div></div>
  <div class="candle-body" style="height:40px"></div>
</div>
<div class="candle-wrap" style="left:2.5%;--cw:8px;--wh:5px;--fw:7px;--fd:2.2s;--fdelay:0.9s">
  <div class="flame"><div class="flame-glow"></div><div class="flame-inner" style="height:13px"></div></div>
  <div class="candle-body" style="height:30px"></div>
</div>
<div class="candle-wrap" style="right:4%;--cw:12px;--wh:7px;--fw:9px;--fd:2.8s;--fdelay:0.2s">
  <div class="flame"><div class="flame-glow"></div><div class="flame-inner" style="height:18px"></div></div>
  <div class="candle-body" style="height:50px"></div>
</div>
<div class="candle-wrap" style="right:5.8%;--cw:10px;--wh:6px;--fw:8px;--fd:3.3s;--fdelay:0.7s">
  <div class="flame"><div class="flame-glow"></div><div class="flame-inner" style="height:14px"></div></div>
  <div class="candle-body" style="height:38px"></div>
</div>
<div class="candle-wrap" style="right:2.5%;--cw:9px;--wh:5px;--fw:7px;--fd:2.4s;--fdelay:1.2s">
  <div class="flame"><div class="flame-glow"></div><div class="flame-inner" style="height:12px"></div></div>
  <div class="candle-body" style="height:28px"></div>
</div>

<!-- LANTERN -->
<div id="lantern">
  <div class="lantern-glow"></div>
  <svg width="36" height="60" viewBox="0 0 36 60" xmlns="http://www.w3.org/2000/svg" fill="none">
    <line x1="18" y1="0" x2="18" y2="8" stroke="rgba(184,180,168,0.4)" stroke-width="1.5"/>
    <circle cx="18" cy="10" r="3" fill="none" stroke="rgba(184,180,168,0.35)" stroke-width="1"/>
    <path d="M6 14 L6 48 Q6 54 12 54 L24 54 Q30 54 30 48 L30 14 Z" fill="rgba(20,16,8,0.85)" stroke="rgba(200,160,40,0.4)" stroke-width="1"/>
    <line x1="6" y1="14" x2="6" y2="48" stroke="rgba(200,160,40,0.25)" stroke-width="0.8"/>
    <line x1="30" y1="14" x2="30" y2="48" stroke="rgba(200,160,40,0.25)" stroke-width="0.8"/>
    <line x1="18" y1="14" x2="18" y2="48" stroke="rgba(200,160,40,0.15)" stroke-width="0.5"/>
    <path d="M4 14 L18 6 L32 14 Z" fill="rgba(180,140,30,0.5)" stroke="rgba(200,160,40,0.4)" stroke-width="0.8"/>
    <path d="M4 48 L18 56 L32 48" fill="rgba(180,140,30,0.5)" stroke="rgba(200,160,40,0.4)" stroke-width="0.8"/>
    <ellipse cx="18" cy="31" rx="6" ry="8" fill="rgba(245,200,66,0.12)" style="animation:lantflame 2.5s ease-in-out infinite"/>
    <ellipse cx="18" cy="33" rx="3" ry="4" fill="rgba(245,200,66,0.18)" style="animation:lantflame 2.5s ease-in-out infinite 0.3s"/>
  </svg>
</div>

<!-- HANDS -->
<div class="hand-wrap" style="left:8%;--hd:14s;--hdelay:0s;--hrise:-55px">
  <svg width="55" height="100" viewBox="0 0 55 100" xmlns="http://www.w3.org/2000/svg" fill="none">
    <path d="M20 100 L18 55 Q17 48 20 46 Q22 44 24 46 L25 40 Q24 33 27 32 Q30 31 31 37 L32 30 Q31 23 34 22 Q37 21 38 28 L39 26 Q38 19 41 18 Q44 17 45 24 L46 60 L50 52 Q52 46 55 48 Q58 50 55 58 L50 75 Q48 82 46 85 L45 100 Z" fill="rgba(25,22,18,0.92)" stroke="rgba(184,180,168,0.12)" stroke-width="0.8"/>
    <line x1="24" y1="60" x2="28" y2="58" stroke="rgba(184,180,168,0.06)" stroke-width="0.5"/>
    <line x1="31" y1="55" x2="35" y2="53" stroke="rgba(184,180,168,0.06)" stroke-width="0.5"/>
    <line x1="38" y1="53" x2="42" y2="52" stroke="rgba(184,180,168,0.06)" stroke-width="0.5"/>
    <path d="M23 46 Q24 43 26 44" stroke="rgba(184,180,168,0.08)" stroke-width="0.6" fill="none"/>
    <path d="M30 37 Q31 34 33 35" stroke="rgba(184,180,168,0.08)" stroke-width="0.6" fill="none"/>
    <path d="M37 28 Q38 25 40 26" stroke="rgba(184,180,168,0.08)" stroke-width="0.6" fill="none"/>
    <path d="M44 24 Q45 21 47 22" stroke="rgba(184,180,168,0.08)" stroke-width="0.6" fill="none"/>
  </svg>
</div>
<div class="hand-wrap" style="right:9%;--hd:18s;--hdelay:3s;--hrise:-45px">
  <svg width="50" height="95" viewBox="0 0 55 100" xmlns="http://www.w3.org/2000/svg" fill="none" transform="scale(-1,1)">
    <path d="M20 100 L18 55 Q17 48 20 46 Q22 44 24 46 L25 40 Q24 33 27 32 Q30 31 31 37 L32 30 Q31 23 34 22 Q37 21 38 28 L39 26 Q38 19 41 18 Q44 17 45 24 L46 60 L50 52 Q52 46 55 48 Q58 50 55 58 L50 75 Q48 82 46 85 L45 100 Z" fill="rgba(22,19,16,0.9)" stroke="rgba(184,180,168,0.1)" stroke-width="0.8"/>
  </svg>
</div>
<div class="hand-wrap" style="left:22%;--hd:22s;--hdelay:7s;--hrise:-30px">
  <svg width="40" height="80" viewBox="0 0 55 100" xmlns="http://www.w3.org/2000/svg" fill="none">
    <path d="M20 100 L18 55 Q17 48 20 46 Q22 44 24 46 L25 40 Q24 33 27 32 Q30 31 31 37 L32 30 Q31 23 34 22 Q37 21 38 28 L46 60 L50 52 Q52 46 55 48 Q58 50 55 58 L50 75 L45 100 Z" fill="rgba(20,18,15,0.88)" stroke="rgba(184,180,168,0.09)" stroke-width="0.7"/>
  </svg>
</div>
<div class="hand-wrap" style="right:20%;--hd:16s;--hdelay:10s;--hrise:-35px">
  <svg width="42" height="82" viewBox="0 0 55 100" xmlns="http://www.w3.org/2000/svg" fill="none" transform="scale(-1,1)">
    <path d="M20 100 L18 55 Q17 48 20 46 Q22 44 24 46 L25 40 Q24 33 27 32 Q30 31 31 37 L32 30 Q31 23 34 22 Q37 21 38 28 L46 60 L50 52 Q52 46 55 48 Q58 50 55 58 L50 75 L45 100 Z" fill="rgba(20,18,15,0.85)" stroke="rgba(184,180,168,0.08)" stroke-width="0.7"/>
  </svg>
</div>

<!-- SHADOW FIGURE -->
<svg id="shadow-figure" width="60" height="180" viewBox="0 0 60 180" xmlns="http://www.w3.org/2000/svg" fill="none">
  <ellipse cx="30" cy="22" rx="14" ry="16" fill="rgba(5,4,3,0.9)"/>
  <path d="M16 35 Q8 80 10 180 L50 180 Q52 80 44 35 Z" fill="rgba(5,4,3,0.88)"/>
  <path d="M10 70 Q0 80 2 110 L12 105 Q10 88 15 80 Z" fill="rgba(5,4,3,0.75)"/>
  <path d="M50 70 Q60 80 58 110 L48 105 Q50 88 45 80 Z" fill="rgba(5,4,3,0.75)"/>
  <ellipse cx="24" cy="20" rx="2" ry="2.5" fill="rgba(200,196,184,0.08)"/>
  <ellipse cx="36" cy="20" rx="2" ry="2.5" fill="rgba(200,196,184,0.08)"/>
</svg>

<!-- MEMORY MESSAGE -->
<div id="memory-msg"></div>

<!-- ══════════ MAIN CONTENT ══════════ -->
<div id="content">

  <!-- BAPHOMET HEAD -->
  <div class="ritual-ring">
    <svg viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg" fill="none">
      <circle cx="110" cy="110" r="105" stroke="rgba(184,180,168,0.07)" stroke-width="0.8" stroke-dasharray="3 6"/>
      <circle cx="110" cy="110" r="98" stroke="rgba(184,180,168,0.05)" stroke-width="0.5"/>
      <polygon points="110,12 200,78 165,185 55,185 20,78" fill="none" stroke="rgba(184,180,168,0.1)" stroke-width="0.8"/>
      <polygon points="110,52 163,88 143,148 77,148 57,88" fill="none" stroke="rgba(184,180,168,0.06)" stroke-width="0.6"/>
      <text x="110" y="8" text-anchor="middle" fill="rgba(184,180,168,0.18)" font-size="7" font-family="serif">ᛒ</text>
      <text x="205" y="82" text-anchor="middle" fill="rgba(184,180,168,0.18)" font-size="7" font-family="serif">ᚨ</text>
      <text x="172" y="196" text-anchor="middle" fill="rgba(184,180,168,0.18)" font-size="7" font-family="serif">ᚠ</text>
      <text x="48" y="196" text-anchor="middle" fill="rgba(184,180,168,0.18)" font-size="7" font-family="serif">ᛟ</text>
      <text x="14" y="82" text-anchor="middle" fill="rgba(184,180,168,0.18)" font-size="7" font-family="serif">ᛗ</text>
      <path d="M110 48 C82 48 60 68 60 92 C60 112 72 128 90 135 L90 152 C90 156 93 158 97 158 L123 158 C127 158 130 156 130 152 L130 135 C148 128 160 112 160 92 C160 68 138 48 110 48 Z" fill="rgba(14,12,10,0.97)" stroke="rgba(184,180,168,0.2)" stroke-width="1"/>
      <path d="M72 72 Q55 45 48 22 Q52 20 58 25 Q62 45 78 68 Z" fill="rgba(22,20,18,0.95)" stroke="rgba(184,180,168,0.18)" stroke-width="1"/>
      <path d="M72 72 Q60 50 62 28 Q64 26 66 28 Q65 50 75 70 Z" fill="rgba(18,16,14,0.9)" stroke="rgba(184,180,168,0.1)" stroke-width="0.6"/>
      <path d="M148 72 Q165 45 172 22 Q168 20 162 25 Q158 45 142 68 Z" fill="rgba(22,20,18,0.95)" stroke="rgba(184,180,168,0.18)" stroke-width="1"/>
      <path d="M148 72 Q160 50 158 28 Q156 26 154 28 Q155 50 145 70 Z" fill="rgba(18,16,14,0.9)" stroke="rgba(184,180,168,0.1)" stroke-width="0.6"/>
      <ellipse cx="90" cy="96" rx="14" ry="15" fill="rgba(5,4,3,0.98)" stroke="rgba(184,180,168,0.18)" stroke-width="1"/>
      <ellipse cx="90" cy="97" rx="8" ry="9" fill="rgba(184,180,168,0.04)"/>
      <ellipse cx="90" cy="96" rx="4" ry="5" fill="rgba(200,196,184,0.1)" style="animation:baph-eye 3s ease-in-out infinite"/>
      <ellipse cx="90" cy="95" rx="2" ry="2.5" fill="rgba(200,196,184,0.15)"/>
      <ellipse cx="130" cy="96" rx="14" ry="15" fill="rgba(5,4,3,0.98)" stroke="rgba(184,180,168,0.18)" stroke-width="1"/>
      <ellipse cx="130" cy="97" rx="8" ry="9" fill="rgba(184,180,168,0.04)"/>
      <ellipse cx="130" cy="96" rx="4" ry="5" fill="rgba(200,196,184,0.1)" style="animation:baph-eye 3s ease-in-out infinite 0.5s"/>
      <ellipse cx="130" cy="95" rx="2" ry="2.5" fill="rgba(200,196,184,0.15)"/>
      <ellipse cx="110" cy="74" rx="5" ry="7" fill="rgba(5,4,3,0.98)" stroke="rgba(184,180,168,0.15)" stroke-width="0.8"/>
      <ellipse cx="110" cy="74" rx="2.5" ry="3.5" fill="rgba(200,196,184,0.2)" style="animation:thirdeye 4s ease-in-out infinite"/>
      <path d="M104 112 L110 104 L116 112 Q113 117 110 118 Q107 117 104 112 Z" fill="rgba(5,4,3,0.95)" stroke="rgba(184,180,168,0.1)" stroke-width="0.7"/>
      <path d="M95 136 Q110 148 125 136 Q120 145 110 150 Q100 145 95 136 Z" fill="rgba(18,16,14,0.8)" stroke="rgba(184,180,168,0.1)" stroke-width="0.7"/>
      <line x1="92" y1="126" x2="128" y2="126" stroke="rgba(184,180,168,0.12)" stroke-width="0.8"/>
      <rect x="94" y="126" width="7" height="11" rx="0.5" fill="rgba(210,205,195,0.08)" stroke="rgba(184,180,168,0.15)" stroke-width="0.7"/>
      <rect x="103" y="126" width="7" height="13" rx="0.5" fill="rgba(210,205,195,0.08)" stroke="rgba(184,180,168,0.15)" stroke-width="0.7"/>
      <rect x="112" y="126" width="7" height="12" rx="0.5" fill="rgba(210,205,195,0.08)" stroke="rgba(184,180,168,0.15)" stroke-width="0.7"/>
      <rect x="121" y="126" width="7" height="11" rx="0.5" fill="rgba(210,205,195,0.08)" stroke="rgba(184,180,168,0.15)" stroke-width="0.7"/>
      <text x="110" y="90" text-anchor="middle" fill="rgba(184,180,168,0.08)" font-size="22" font-family="serif">☆</text>
      <path d="M110 52 L107 68 L113 76" stroke="rgba(184,180,168,0.08)" stroke-width="0.7" fill="none"/>
      <path d="M72 80 L79 86 L76 94" stroke="rgba(184,180,168,0.06)" stroke-width="0.6" fill="none"/>
      <path d="M148 80 L141 87 L144 95" stroke="rgba(184,180,168,0.06)" stroke-width="0.6" fill="none"/>
      <line x1="110" y1="162" x2="110" y2="205" stroke="rgba(184,180,168,0.15)" stroke-width="1.2"/>
      <line x1="98" y1="190" x2="122" y2="190" stroke="rgba(184,180,168,0.15)" stroke-width="1.2"/>
    </svg>
  </div>

  <!-- TITLE -->
  <div class="title-block" style="text-align:center;margin-bottom:8px">
    <div class="bot-name" id="bot-title">${botName}</div>
    <div class="bot-sub" id="sub-text"></div>
  </div>

  <!-- DIVIDER -->
  <div class="r-divider">
    <svg viewBox="0 0 580 28" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
      <line x1="0" y1="14" x2="580" y2="14" stroke="rgba(184,180,168,0.08)" stroke-width="0.8"/>
      <path d="M0 14 L90 14" stroke="rgba(184,180,168,0.2)" stroke-width="1"/>
      <path d="M92 14 L98 7 L104 14 L98 21 Z" fill="none" stroke="rgba(184,180,168,0.2)" stroke-width="0.8"/>
      <polygon points="290,4 298,20 280,10 300,10 282,20" fill="none" stroke="rgba(184,180,168,0.15)" stroke-width="0.7"/>
      <path d="M476 14 L482 7 L488 14 L482 21 Z" fill="none" stroke="rgba(184,180,168,0.2)" stroke-width="0.8"/>
      <path d="M490 14 L580 14" stroke="rgba(184,180,168,0.2)" stroke-width="1"/>
      <line x1="120" y1="11" x2="120" y2="17" stroke="rgba(184,180,168,0.1)" stroke-width="0.6"/>
      <line x1="150" y1="12" x2="150" y2="16" stroke="rgba(184,180,168,0.08)" stroke-width="0.5"/>
      <line x1="180" y1="11" x2="180" y2="17" stroke="rgba(184,180,168,0.1)" stroke-width="0.6"/>
      <line x1="400" y1="11" x2="400" y2="17" stroke="rgba(184,180,168,0.1)" stroke-width="0.6"/>
      <line x1="430" y1="12" x2="430" y2="16" stroke="rgba(184,180,168,0.08)" stroke-width="0.5"/>
      <line x1="460" y1="11" x2="460" y2="17" stroke="rgba(184,180,168,0.1)" stroke-width="0.6"/>
    </svg>
  </div>

  <!-- UPTIME SLAB -->
  <div class="slab">
    <span class="slab-label">مضى على اللعنة</span>
    <div class="slab-c tl"></div>
    <div class="slab-c tr"></div>
    <div class="slab-c bl"></div>
    <div class="slab-c br"></div>
    <div class="ut-row">
      <div class="ut"><span class="ut-n" id="ud">${pad(days)}</span><span class="ut-l">يوم</span></div>
      <span class="ut-sep">:</span>
      <div class="ut"><span class="ut-n" id="uh">${pad(hours)}</span><span class="ut-l">ساعة</span></div>
      <span class="ut-sep">:</span>
      <div class="ut"><span class="ut-n" id="um">${pad(minutes)}</span><span class="ut-l">دقيقة</span></div>
      <span class="ut-sep">:</span>
      <div class="ut"><span class="ut-n" id="us">${pad(seconds)}</span><span class="ut-l">ثانية</span></div>
    </div>
  </div>

  <!-- DIVIDER -->
  <div class="r-divider">
    <svg viewBox="0 0 580 28" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
      <line x1="0" y1="14" x2="580" y2="14" stroke="rgba(184,180,168,0.06)" stroke-width="0.8"/>
      <circle cx="290" cy="14" r="5" fill="none" stroke="rgba(184,180,168,0.18)" stroke-width="0.8"/>
      <circle cx="290" cy="14" r="1.5" fill="rgba(184,180,168,0.25)"/>
      <line x1="255" y1="14" x2="278" y2="14" stroke="rgba(184,180,168,0.18)" stroke-width="1"/>
      <line x1="302" y1="14" x2="325" y2="14" stroke="rgba(184,180,168,0.18)" stroke-width="1"/>
      <circle cx="250" cy="14" r="2" fill="none" stroke="rgba(184,180,168,0.12)" stroke-width="0.6"/>
      <circle cx="330" cy="14" r="2" fill="none" stroke="rgba(184,180,168,0.12)" stroke-width="0.6"/>
    </svg>
  </div>

  <!-- SOCIAL -->
  <div class="soc-section">
    <div class="soc-title">أبواب المطور — ${SOCIAL.devName}</div>
    <div class="soc-grid">
      <a class="soc-link" href="${SOCIAL.instagram}" target="_blank" data-name="Instagram">
        <svg class="soc-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="rgba(184,180,168,0.6)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5"/>
          <circle cx="12" cy="12" r="4"/>
          <circle cx="17.5" cy="6.5" r="1" fill="rgba(184,180,168,0.6)" stroke="none"/>
        </svg>
        <div><div class="soc-name">Instagram</div><div class="soc-handle">@x_v_k1</div></div>
      </a>
      <a class="soc-link" href="${SOCIAL.facebook}" target="_blank" data-name="Facebook">
        <svg class="soc-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="rgba(184,180,168,0.6)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
        </svg>
        <div><div class="soc-name">Facebook</div><div class="soc-handle">أيمن</div></div>
      </a>
      <a class="soc-link" href="${SOCIAL.telegram}" target="_blank" data-name="Telegram">
        <svg class="soc-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="rgba(184,180,168,0.6)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/>
        </svg>
        <div><div class="soc-name">Telegram</div><div class="soc-handle">@X2_FD</div></div>
      </a>
      <a class="soc-link" href="${SOCIAL.tiktok}" target="_blank" data-name="TikTok">
        <svg class="soc-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="rgba(184,180,168,0.6)">
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.53V6.77a4.85 4.85 0 01-1.01-.08z"/>
        </svg>
        <div><div class="soc-name">TikTok</div><div class="soc-handle">—</div></div>
      </a>
    </div>
  </div>

  <!-- DEV -->
  <div class="dev-section">
    <div class="dev-label">الصانع — منشئ اللعنة</div>
    <a class="dev-link" href="${SOCIAL.facebook}" target="_blank">
      <svg class="dev-svg" width="80" height="120" viewBox="0 0 80 120" xmlns="http://www.w3.org/2000/svg" fill="none"
        style="transition:filter 0.3s;filter:drop-shadow(0 0 8px rgba(184,180,168,0.06))">
        <path d="M40 8 C25 8 14 18 14 32 C14 44 21 53 32 58 L32 65 C32 67 34 68 36 68 L44 68 C46 68 48 67 48 65 L48 58 C59 53 66 44 66 32 C66 18 55 8 40 8 Z" fill="rgba(12,10,8,0.95)" stroke="rgba(184,180,168,0.15)" stroke-width="0.8"/>
        <path d="M32 65 Q22 80 18 120 L62 120 Q58 80 48 65 Z" fill="rgba(10,8,6,0.95)" stroke="rgba(184,180,168,0.1)" stroke-width="0.7"/>
        <ellipse cx="40" cy="24" rx="18" ry="16" fill="rgba(8,6,4,0.92)" stroke="rgba(184,180,168,0.12)" stroke-width="0.8"/>
        <ellipse cx="40" cy="28" rx="11" ry="10" fill="rgba(3,2,1,0.99)"/>
        <ellipse cx="35" cy="27" rx="2.5" ry="3" fill="rgba(200,196,184,0.15)" style="animation:baph-eye 3s ease-in-out infinite"/>
        <ellipse cx="45" cy="27" rx="2.5" ry="3" fill="rgba(200,196,184,0.15)" style="animation:baph-eye 3s ease-in-out infinite 0.4s"/>
        <line x1="55" y1="110" x2="72" y2="15" stroke="rgba(184,180,168,0.22)" stroke-width="1.5"/>
        <path d="M72 15 Q88 2 78 10 Q68 18 62 24" fill="none" stroke="rgba(184,180,168,0.28)" stroke-width="1.5"/>
        <path d="M20 75 Q14 85 16 110" stroke="rgba(184,180,168,0.06)" stroke-width="0.6" fill="none"/>
        <path d="M60 75 Q66 85 64 110" stroke="rgba(184,180,168,0.06)" stroke-width="0.6" fill="none"/>
        <text x="40" y="118" text-anchor="middle" fill="rgba(184,180,168,0.18)" font-size="5.5" font-family="serif" letter-spacing="1">الصانع</text>
      </svg>
    </a>
    <div class="dev-name">${SOCIAL.devName}</div>
  </div>

  <div class="runes">ᚲ ᛁ ᚱ ᚨ &nbsp;•&nbsp; ᛞᛖᚨᚦ &nbsp;•&nbsp; ᛊᛟᚢᛚ</div>

  <!-- DIVIDER -->
  <div class="r-divider">
    <svg viewBox="0 0 580 28" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
      <line x1="0" y1="14" x2="580" y2="14" stroke="rgba(184,180,168,0.06)" stroke-width="0.8"/>
      <polygon points="290,6 298,22 280,12 300,12 282,22" fill="none" stroke="rgba(184,180,168,0.12)" stroke-width="0.6"/>
    </svg>
  </div>

  <div class="bot-bar">
    <span class="hl">${botName}</span>
    <span>${timeNow}</span>
    <span class="hl">by ${SOCIAL.devName}</span>
  </div>

</div>

<!-- LANTERN FLAME ANIM -->
<style>
@keyframes baph-eye{0%,100%{opacity:0.15}50%{opacity:0.45}}
@keyframes thirdeye{0%,100%{opacity:0.2}50%{opacity:0.55}}
@keyframes lantflame{0%,100%{opacity:0.5;transform:scale(1)}50%{opacity:1;transform:scale(1.1)}}
</style>

<script>
/* ════════════════════════════════════════
   CURSOR
════════════════════════════════════════ */
const cursor = document.getElementById('cursor');
const trail = document.getElementById('cursor-trail');
let mx=window.innerWidth/2, my=window.innerHeight/2;
let trailDots=[];
const TRAIL_LEN=12;

for(let i=0;i<TRAIL_LEN;i++){
  const d=document.createElement('div');
  d.className='trail-dot';
  d.style.opacity=((TRAIL_LEN-i)/TRAIL_LEN)*0.4;
  d.style.transform='translate(-50%,-50%) scale('+(1-(i/TRAIL_LEN)*0.6)+')';
  trail.appendChild(d);
  trailDots.push({el:d,x:mx,y:my});
}

document.addEventListener('mousemove',e=>{
  mx=e.clientX; my=e.clientY;
  cursor.style.left=mx+'px'; cursor.style.top=my+'px';
  if(Math.random()>0.85){
    const b=document.createElement('div');
    b.className='blood-drop';
    b.style.left=mx+'px'; b.style.top=my+'px';
    document.body.appendChild(b);
    setTimeout(()=>b.remove(),1900);
  }
});

function animTrail(){
  let px=mx,py=my;
  trailDots.forEach((d,i)=>{
    d.x+=(px-d.x)*0.35;
    d.y+=(py-d.y)*0.35;
    d.el.style.left=d.x+'px'; d.el.style.top=d.y+'px';
    px=d.x; py=d.y;
  });
  requestAnimationFrame(animTrail);
}
animTrail();

/* ════════════════════════════════════════
   EYES FOLLOW CURSOR
════════════════════════════════════════ */
function trackEyes(){
  const eyes = document.querySelectorAll('.soc-link, .ut, .slab-c');
  eyes.forEach(el=>{
    el.addEventListener('mouseenter',()=>{
      spawnEyes(el);
    });
  });
}
trackEyes();

function spawnEyes(near){
  const rect=near.getBoundingClientRect();
  for(let i=0;i<2;i++){
    const ep=document.createElement('div');
    ep.className='eye-pair';
    ep.style.left=(rect.left-30+Math.random()*20)+'px';
    ep.style.top=(rect.top-20+Math.random()*40)+'px';
    ep.innerHTML='<svg width="40" height="18" viewBox="0 0 40 18" xmlns="http://www.w3.org/2000/svg" fill="none">'
      +'<ellipse cx="10" cy="9" rx="9" ry="8" fill="rgba(3,2,1,0.9)" stroke="rgba(184,180,168,0.25)" stroke-width="0.8"/>'
      +'<ellipse cx="10" cy="9" rx="4" ry="5" fill="rgba(184,180,168,0.12)"/>'
      +'<ellipse cx="10" cy="9" rx="2" ry="2.5" fill="rgba(200,196,184,0.25)"/>'
      +'<ellipse cx="30" cy="9" rx="9" ry="8" fill="rgba(3,2,1,0.9)" stroke="rgba(184,180,168,0.25)" stroke-width="0.8"/>'
      +'<ellipse cx="30" cy="9" rx="4" ry="5" fill="rgba(184,180,168,0.12)"/>'
      +'<ellipse cx="30" cy="9" rx="2" ry="2.5" fill="rgba(200,196,184,0.25)"/>'
      +'</svg>';
    document.body.appendChild(ep);
    setTimeout(()=>ep.remove(),1300);
  }
}

/* ════════════════════════════════════════
   RANDOM FLOATING EYES IN DARKNESS
════════════════════════════════════════ */
setInterval(()=>{
  const ep=document.createElement('div');
  ep.className='eye-pair';
  ep.style.left=Math.random()*85+'%';
  ep.style.top=(5+Math.random()*75)+'%';
  const dur=0.4+Math.random()*0.8;
  ep.style.animationDuration=dur+'s';
  const w=22+Math.random()*20;
  const h=10+Math.random()*8;
  ep.innerHTML='<svg width="'+w+'" height="'+h+'" viewBox="0 0 40 18" xmlns="http://www.w3.org/2000/svg" fill="none">'
    +'<ellipse cx="10" cy="9" rx="9" ry="8" fill="rgba(3,2,1,0.95)" stroke="rgba(184,180,168,0.2)" stroke-width="0.8"/>'
    +'<ellipse cx="10" cy="9" rx="3.5" ry="4.5" fill="rgba(184,180,168,0.08)"/>'
    +'<ellipse cx="30" cy="9" rx="9" ry="8" fill="rgba(3,2,1,0.95)" stroke="rgba(184,180,168,0.2)" stroke-width="0.8"/>'
    +'<ellipse cx="30" cy="9" rx="3.5" ry="4.5" fill="rgba(184,180,168,0.08)"/>'
    +'</svg>';
  document.body.appendChild(ep);
  setTimeout(()=>ep.remove(),dur*1000+200);
},900);

/* ════════════════════════════════════════
   DISTORTED FACES
════════════════════════════════════════ */
const faces=[
  '<svg viewBox="0 0 80 90" xmlns="http://www.w3.org/2000/svg" fill="none">'
    +'<ellipse cx="40" cy="42" rx="32" ry="38" fill="rgba(8,7,6,0.85)" stroke="rgba(184,180,168,0.1)" stroke-width="0.8"/>'
    +'<ellipse cx="27" cy="36" rx="10" ry="12" fill="rgba(3,2,1,0.95)" stroke="rgba(184,180,168,0.12)" stroke-width="0.7"/>'
    +'<ellipse cx="27" cy="36" rx="4" ry="6" fill="rgba(184,180,168,0.12)"/>'
    +'<ellipse cx="53" cy="36" rx="10" ry="12" fill="rgba(3,2,1,0.95)" stroke="rgba(184,180,168,0.12)" stroke-width="0.7"/>'
    +'<ellipse cx="53" cy="36" rx="4" ry="6" fill="rgba(184,180,168,0.12)"/>'
    +'<path d="M28 65 Q40 72 52 65" stroke="rgba(184,180,168,0.1)" stroke-width="0.8" fill="none"/>'
    +'<path d="M32 65 L35 73 M40 66 L40 75 M48 65 L45 73" stroke="rgba(184,180,168,0.08)" stroke-width="0.5"/>'
    +'</svg>',
  '<svg viewBox="0 0 70 80" xmlns="http://www.w3.org/2000/svg" fill="none">'
    +'<path d="M35 5 C15 5 5 22 5 40 C5 58 15 72 35 72 C55 72 65 58 65 40 C65 22 55 5 35 5 Z" fill="rgba(10,8,7,0.88)" stroke="rgba(184,180,168,0.1)" stroke-width="0.8"/>'
    +'<ellipse cx="22" cy="32" rx="9" ry="11" fill="rgba(2,1,1,0.98)" stroke="rgba(184,180,168,0.1)" stroke-width="0.7"/>'
    +'<ellipse cx="22" cy="32" rx="3" ry="5" fill="rgba(184,180,168,0.08)"/>'
    +'<ellipse cx="48" cy="32" rx="9" ry="11" fill="rgba(2,1,1,0.98)" stroke="rgba(184,180,168,0.1)" stroke-width="0.7"/>'
    +'<ellipse cx="48" cy="32" rx="3" ry="5" fill="rgba(184,180,168,0.08)"/>'
    +'<ellipse cx="35" cy="58" rx="12" ry="10" fill="rgba(2,1,1,0.98)" stroke="rgba(184,180,168,0.12)" stroke-width="0.7"/>'
    +'<rect x="26" y="50" width="5" height="7" fill="rgba(200,195,185,0.1)"/>'
    +'<rect x="33" y="49" width="5" height="9" fill="rgba(200,195,185,0.1)"/>'
    +'<rect x="40" y="50" width="5" height="7" fill="rgba(200,195,185,0.1)"/>'
    +'</svg>',
  '<svg viewBox="0 0 65 75" xmlns="http://www.w3.org/2000/svg" fill="none">'
    +'<path d="M32 4 C16 4 4 18 4 34 C4 52 14 68 32 68 C50 68 60 52 60 34 C60 18 48 4 32 4 Z" fill="rgba(9,7,6,0.82)" stroke="rgba(184,180,168,0.08)" stroke-width="0.7"/>'
    +'<ellipse cx="20" cy="30" rx="8" ry="10" fill="rgba(1,0,0,0.99)" stroke="rgba(184,180,168,0.1)" stroke-width="0.6"/>'
    +'<ellipse cx="44" cy="30" rx="8" ry="10" fill="rgba(1,0,0,0.99)" stroke="rgba(184,180,168,0.1)" stroke-width="0.6"/>'
    +'<path d="M22 54 Q32 60 42 54" fill="none" stroke="rgba(184,180,168,0.08)" stroke-width="0.7"/>'
    +'<line x1="26" y1="54" x2="24" y2="62" stroke="rgba(184,180,168,0.06)" stroke-width="0.5"/>'
    +'<line x1="32" y1="55" x2="32" y2="63" stroke="rgba(184,180,168,0.06)" stroke-width="0.5"/>'
    +'<line x1="38" y1="54" x2="40" y2="62" stroke="rgba(184,180,168,0.06)" stroke-width="0.5"/>'
    +'<path d="M28 12 L32 22 L36 12" stroke="rgba(184,180,168,0.06)" stroke-width="0.5" fill="none"/>'
    +'</svg>'
];

setInterval(()=>{
  const face=document.createElement('div');
  face.className='distorted-face';
  const sz=60+Math.random()*90;
  face.style.cssText='left:'+Math.random()*88+'%;top:'+(5+Math.random()*80)+'%;width:'+sz+'px;height:'+sz+'px;--fad:'+(3+Math.random()*4)+'s;--fadelay:0s;--fao:'+(0.08+Math.random()*0.14)+';';
  face.innerHTML=faces[Math.floor(Math.random()*faces.length)];
  document.body.appendChild(face);
  setTimeout(()=>face.remove(),(3+Math.random()*4)*1000+200);
},4500);

/* ════════════════════════════════════════
   JIN FIGURES
════════════════════════════════════════ */
const jinSVGs=[
  '<svg width="35" height="120" viewBox="0 0 35 120" xmlns="http://www.w3.org/2000/svg" fill="none">'
    +'<ellipse cx="17" cy="12" rx="11" ry="12" fill="rgba(5,4,3,0.85)"/>'
    +'<path d="M17 24 Q8 50 6 120 L28 120 Q26 50 17 24 Z" fill="rgba(5,4,3,0.75)"/>'
    +'<path d="M6 65 Q-2 75 0 95 L8 90 Z" fill="rgba(5,4,3,0.6)"/>'
    +'<path d="M28 65 Q36 75 34 95 L26 90 Z" fill="rgba(5,4,3,0.6)"/>'
    +'<ellipse cx="12" cy="11" rx="2" ry="2.5" fill="rgba(184,180,168,0.2)"/>'
    +'<ellipse cx="22" cy="11" rx="2" ry="2.5" fill="rgba(184,180,168,0.2)"/>'
    +'<path d="M10 22 Q4 30 2 50 Q-2 35 5 22" fill="rgba(4,3,2,0.5)"/>'
    +'<path d="M24 22 Q30 30 32 50 Q36 35 29 22" fill="rgba(4,3,2,0.5)"/>'
    +'</svg>',
  '<svg width="60" height="70" viewBox="0 0 60 70" xmlns="http://www.w3.org/2000/svg" fill="none">'
    +'<path d="M30 5 C20 5 12 12 12 22 C12 30 18 37 28 40 L28 45 L32 45 L32 40 C42 37 48 30 48 22 C48 12 40 5 30 5 Z" fill="rgba(6,5,4,0.88)"/>'
    +'<path d="M20 44 Q8 55 5 70 L25 70 Q22 55 28 44 Z" fill="rgba(5,4,3,0.8)"/>'
    +'<path d="M40 44 Q52 55 55 70 L35 70 Q38 55 32 44 Z" fill="rgba(5,4,3,0.8)"/>'
    +'<ellipse cx="23" cy="20" rx="5" ry="6" fill="rgba(2,1,1,0.98)"/>'
    +'<ellipse cx="23" cy="20" rx="2" ry="3" fill="rgba(184,180,168,0.15)"/>'
    +'<ellipse cx="37" cy="20" rx="5" ry="6" fill="rgba(2,1,1,0.98)"/>'
    +'<ellipse cx="37" cy="20" rx="2" ry="3" fill="rgba(184,180,168,0.15)"/>'
    +'<path d="M12 30 Q-5 40 -8 60" stroke="rgba(6,5,4,0.7)" stroke-width="4" stroke-linecap="round" fill="none"/>'
    +'<path d="M48 30 Q65 40 68 60" stroke="rgba(6,5,4,0.7)" stroke-width="4" stroke-linecap="round" fill="none"/>'
    +'</svg>'
];

setInterval(()=>{
  const fig=document.createElement('div');
  fig.style.cssText='position:fixed;z-index:5;pointer-events:none;bottom:'+(80+Math.random()*100)+'px;left:'+Math.random()*90+'%;opacity:0;filter:blur('+(1+Math.random()*2)+'px);animation:jinappear '+(5+Math.random()*8)+'s ease-in-out forwards;';
  fig.innerHTML=jinSVGs[Math.floor(Math.random()*jinSVGs.length)];
  document.body.appendChild(fig);
  setTimeout(()=>fig.remove(),(5+Math.random()*8)*1000+300);
},6000);

const jinStyle=document.createElement('style');
jinStyle.textContent='@keyframes jinappear{0%{opacity:0;transform:translateY(30px)}15%{opacity:0.35}50%{opacity:0.25}85%{opacity:0.2}100%{opacity:0;transform:translateY(-20px)}}';
document.head.appendChild(jinStyle);

/* ════════════════════════════════════════
   SHADOW FIGURE WALKING
════════════════════════════════════════ */
const sf=document.getElementById('shadow-figure');
let sfX=-80, sfDir=1, sfVisible=false;
setInterval(()=>{
  sfVisible=!sfVisible;
  sf.style.opacity=sfVisible?'0.5':'0';
  if(sfVisible){
    sfX=sfDir>0?-80:window.innerWidth+20;
    sf.style.bottom='0';
    sf.style.left=sfX+'px';
  }
},15000);
function walkFigure(){
  if(sfVisible){
    sfX+=(sfDir*0.4);
    sf.style.left=sfX+'px';
    if(sfX>window.innerWidth+100){sfDir=-1;sfVisible=false;sf.style.opacity='0';}
    if(sfX<-100){sfDir=1;sfVisible=false;sf.style.opacity='0';}
  }
  requestAnimationFrame(walkFigure);
}
walkFigure();

/* ════════════════════════════════════════
   SCREEN SHAKE
════════════════════════════════════════ */
setInterval(()=>{
  if(Math.random()>0.2)return;
  document.body.style.animation='pageshake 0.4s ease-in-out';
  setTimeout(()=>document.body.style.animation='',450);
},18000);
const shakeS=document.createElement('style');
shakeS.textContent='@keyframes pageshake{0%,100%{transform:translate(0,0)}20%{transform:translate(-2px,1px)}40%{transform:translate(2px,-2px)}60%{transform:translate(-1px,2px)}80%{transform:translate(1px,-1px)}}';
document.head.appendChild(shakeS);

/* ════════════════════════════════════════
   LIGHTNING FLASH
════════════════════════════════════════ */
setInterval(()=>{
  if(Math.random()>0.3)return;
  const fl=document.createElement('div');
  fl.style.cssText='position:fixed;inset:0;z-index:50;pointer-events:none;background:rgba(200,200,180,0.04);animation:flashit 0.6s ease-out forwards;';
  document.body.appendChild(fl);
  setTimeout(()=>fl.remove(),700);
},12000);
const flashS=document.createElement('style');
flashS.textContent='@keyframes flashit{0%{opacity:0}8%{opacity:1}15%{opacity:0}25%{opacity:0.6}35%{opacity:0}45%{opacity:0.3}100%{opacity:0}}';
document.head.appendChild(flashS);

/* ════════════════════════════════════════
   CRACK LINES
════════════════════════════════════════ */
setInterval(()=>{
  if(Math.random()>0.6)return;
  const c=document.createElement('div');
  const x=Math.random()*window.innerWidth;
  const y=Math.random()*window.innerHeight;
  const len=15+Math.random()*55;
  const ang=Math.random()*360;
  c.style.cssText='position:fixed;z-index:9;pointer-events:none;left:'+x+'px;top:'+y+'px;width:'+len+'px;height:1px;background:linear-gradient(90deg,transparent,rgba(184,180,168,0.12),transparent);transform:rotate('+ang+'deg);transform-origin:0 50%;animation:crackfade 2s ease-out forwards;';
  document.body.appendChild(c);
  setTimeout(()=>c.remove(),2100);
},3500);
const crackS=document.createElement('style');
crackS.textContent='@keyframes crackfade{0%{opacity:0;transform:rotate(var(--a,0deg)) scaleX(0)}10%{opacity:1;transform:rotate(var(--a,0deg)) scaleX(1)}75%{opacity:0.3}100%{opacity:0}}';
document.head.appendChild(crackS);

/* ════════════════════════════════════════
   MEMORY — visit detection
════════════════════════════════════════ */
const visits=parseInt(localStorage.getItem('_kira_v')||'0')+1;
localStorage.setItem('_kira_v',visits);
const memMsg=document.getElementById('memory-msg');
const memTexts=[
  '...أعرفك. عُدتَ.',
  '...كنتُ أنتظرك',
  '...لا مفر من هنا',
  '...زيارتك رقم '+visits,
  '...روحك مسجّلة',
];
const txt=visits===1?'...مرحباً بروح جديدة':memTexts[Math.min(visits-1,memTexts.length-1)];
memMsg.textContent=txt;
memMsg.style.animation='msgappear 7s ease-in-out forwards 2s';

/* ════════════════════════════════════════
   TYPEWRITER — bot subtitle
════════════════════════════════════════ */
const subEl=document.getElementById('sub-text');
const subPhrases=[
  'من أعماق الظلام — حارسة الشبكة الأبدية',
  'where the dead code speaks',
  'من لا يُدعى... لا يعود',
];
let subIdx=0,charIdx=0,typing=true;
function typeWriter(){
  const phrase=subPhrases[subIdx];
  if(typing){
    if(charIdx<phrase.length){
      subEl.textContent=phrase.substring(0,charIdx+1);
      charIdx++;
      setTimeout(typeWriter,60+Math.random()*40);
    } else {
      typing=false;
      setTimeout(typeWriter,2800);
    }
  } else {
    if(charIdx>0){
      subEl.textContent=phrase.substring(0,charIdx-1);
      charIdx--;
      setTimeout(typeWriter,30);
    } else {
      typing=true;
      subIdx=(subIdx+1)%subPhrases.length;
      setTimeout(typeWriter,600);
    }
  }
}
typeWriter();

/* ════════════════════════════════════════
   UPTIME TICK
════════════════════════════════════════ */
const BOOT=Date.now()-${uptime};
function pad(n){return String(n).padStart(2,'0');}
function tick(){
  const u=Date.now()-BOOT;
  document.getElementById('ud').textContent=pad(Math.floor(u/86400000));
  document.getElementById('uh').textContent=pad(Math.floor((u%86400000)/3600000));
  document.getElementById('um').textContent=pad(Math.floor((u%3600000)/60000));
  document.getElementById('us').textContent=pad(Math.floor((u%60000)/1000));
}
setInterval(tick,1000);tick();
</script>
</body>
</html>`);
});

/* ── BOT SPAWN ── */
function startBot(message){
  if(message) logger(message,"[ Starting ]");
  const child=spawn("node",["--trace-warnings","--async-stack-traces","KIRA.js"],{cwd:__dirname,stdio:"inherit",shell:true});
  child.on("close",(code)=>{
    global.countRestart=(global.countRestart||0)+1;
    const delay=Math.min(5000*global.countRestart,30000);
    console.log(chalk.bold.hex("#FF2200")(`[ RESTART ] بعد ${delay/1000}s`));
    setTimeout(()=>startBot("اعادة تشغيل..."),delay);
  });
  child.on("error",(e)=>{
    logger("خطأ: "+JSON.stringify(e),"[ Starting ]");
    setTimeout(()=>startBot("اعادة بعد خطأ..."),5000);
  });
}

/* ── SELF PING ── */
const SELF_URL=process.env.RENDER_URL||process.env.RAILWAY_PUBLIC_DOMAIN||"";
if(SELF_URL){
  const pingUrl=SELF_URL.startsWith("http")?SELF_URL:`https://${SELF_URL}`;
  setInterval(()=>{
    axios.get(pingUrl).catch(()=>{});
    console.log(chalk.bold.hex("#FF6600")(`[ PING ] ${pingUrl}`));
  },4*60*1000);
}

logger("KIRA BOT","[ NAME ]");
logger("Version: 1.2.14","[ VERSION ]");
startBot();

app.listen(port,()=>{
  console.log(chalk.bold.hex("#FF2200")("╔═══════════════════════════════════════╗"));
  console.log(chalk.bold.hex("#FF2200")("║")+chalk.bold.hex("#b8b4a8")("       KIRA — SERVER ONLINE            ")+chalk.bold.hex("#FF2200")("║"));
  console.log(chalk.bold.hex("#FF2200")("║")+chalk.hex("#888078")(`         PORT: ${port}                    `)+chalk.bold.hex("#FF2200")("║"));
  console.log(chalk.bold.hex("#FF2200")("╚═══════════════════════════════════════╝"));
});

process.on("unhandledRejection",(err)=>{
  console.log(chalk.red("[ ERROR ]"),err?.message||err);
});

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

// ══════════════════════════════════════════════════
//   SOCIAL LINKS — غيّرهم هنا
// ══════════════════════════════════════════════════
const SOCIAL = {
  devName:   "أيمن",
  facebook:  "https://www.facebook.com/profile.php?id=61580139921634",
  instagram: "https://instagram.com/x_v_k1",
  telegram:  "https://t.me/X2_FD",
  tiktok:    "#"
};

// ══════════════════════════════════════════════════
//   EXPRESS APP
// ══════════════════════════════════════════════════
const app = express();
const port = process.env.PORT || 3078;
const BOOT_TIME = Date.now();

// ══════════════════════════════════════════════════
//   UPTIME PAGE — المقبرة الجحيمية
// ══════════════════════════════════════════════════
app.get("/", (req, res) => {
  const uptime   = Date.now() - BOOT_TIME;
  const days     = Math.floor(uptime / 86400000);
  const hours    = Math.floor((uptime % 86400000) / 3600000);
  const minutes  = Math.floor((uptime % 3600000) / 60000);
  const seconds  = Math.floor((uptime % 60000) / 1000);
  const cmdCount = global.client?.commands?.size || 0;
  const evtCount = global.client?.events?.size   || 0;
  const botName  = global.config?.BOTNAME        || "KIRA";
  const version  = global.config?.version        || "1.2.14";
  const prefix   = global.config?.PREFIX         || ".";
  const userCount  = global.data?.allUserID?.length  || 0;
  const groupCount = global.data?.allThreadID?.length || 0;
  const timeNow  = moment().tz("Asia/Baghdad").format("HH:mm:ss • DD/MM/YYYY");
  const pad = n => String(n).padStart(2, "0");

  res.send(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${botName} ☠️ بوابة الجحيم</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=UnifrakturMaguntia&family=Cinzel+Decorative:wght@400;700;900&family=Share+Tech+Mono&family=Noto+Kufi+Arabic:wght@300;400;700;900&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">
<style>
:root{
  --blood:#8B0000;--ember:#FF2200;--lava:#FF6600;
  --gold:#C8960C;--void:#000000;--bone:#E8D5B0;
  --deep:#0a0305;--stone:#1a0810;--border:#3d1020;
}
*{margin:0;padding:0;box-sizing:border-box}
html,body{
  width:100%;min-height:100vh;
  background:var(--void);
  color:var(--bone);
  font-family:'Crimson Text',serif;
  overflow-x:hidden;
  cursor:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Ccircle cx='10' cy='10' r='3' fill='%23FF2200' opacity='.9'/%3E%3Ccircle cx='10' cy='10' r='7' fill='none' stroke='%238B0000' stroke-width='1' opacity='.5'/%3E%3C/svg%3E") 10 10,auto;
}

/* ── HELL BACKGROUND ── */
#hell-bg{
  position:fixed;inset:0;z-index:0;
  background:
    radial-gradient(ellipse 130% 65% at 50% 110%,#FF2200 0%,#8B0000 25%,#3a0000 55%,#0a0000 80%,#000 100%),
    radial-gradient(ellipse 90% 45% at 15% 115%,#FF4500 0%,transparent 55%),
    radial-gradient(ellipse 90% 45% at 85% 115%,#FF6600 0%,transparent 55%),
    radial-gradient(ellipse 60% 30% at 50% 0%,#1a0005 0%,transparent 80%);
  animation:hellpulse 5s ease-in-out infinite alternate;
}
@keyframes hellpulse{
  0%{opacity:.88}
  100%{opacity:1;filter:brightness(1.08)}
}

/* ── NOISE TEXTURE ── */
#hell-bg::after{
  content:'';position:absolute;inset:0;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='.05'/%3E%3C/svg%3E");
  opacity:.35;pointer-events:none;
}

/* ── SCANLINES ── */
#scanlines{
  position:fixed;inset:0;z-index:2;pointer-events:none;
  background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.07) 2px,rgba(0,0,0,.07) 4px);
}

/* ── VIGNETTE ── */
#vignette{
  position:fixed;inset:0;z-index:3;pointer-events:none;
  background:radial-gradient(ellipse at center,transparent 35%,rgba(0,0,0,.85) 100%);
}

/* ── EMBERS ── */
#embers{position:fixed;inset:0;z-index:4;pointer-events:none;overflow:hidden}
.ember{
  position:absolute;bottom:-8px;border-radius:50%;
  background:var(--lava);
  box-shadow:0 0 6px 2px var(--ember);
  animation:riseup linear infinite;opacity:0;
}
@keyframes riseup{
  0%{transform:translateY(0) translateX(0) scale(1);opacity:0}
  8%{opacity:.9}
  50%{transform:translateY(-55vh) translateX(var(--drift,15px)) scale(.75);opacity:.6}
  92%{opacity:.2}
  100%{transform:translateY(-115vh) translateX(calc(var(--drift,15px)*-1.5)) scale(.25);opacity:0}
}

/* ── BATS ── */
.bat{
  position:fixed;z-index:5;pointer-events:none;
  font-size:var(--bs,1.2rem);
  filter:brightness(.3) sepia(1) hue-rotate(300deg);
  animation:batfly var(--bd,14s) ease-in-out infinite var(--bdelay,0s);
}
@keyframes batfly{
  0%{transform:translate(0,0) scaleX(1)}
  25%{transform:translate(80px,-40px) scaleX(-1)}
  50%{transform:translate(160px,20px) scaleX(-1)}
  75%{transform:translate(80px,-30px) scaleX(1)}
  100%{transform:translate(0,0) scaleX(1)}
}

/* ── CORNER FRAMES ── */
.corner{position:fixed;width:70px;height:70px;z-index:20;opacity:.4}
.corner svg{width:100%;height:100%}
.corner-tl{top:0;left:0}
.corner-tr{top:0;right:0;transform:scaleX(-1)}
.corner-bl{bottom:0;left:0;transform:scaleY(-1)}
.corner-br{bottom:0;right:0;transform:scale(-1,-1)}

/* ── LIGHTNING ── */
#lightning{
  position:fixed;inset:0;z-index:6;pointer-events:none;
  background:rgba(255,200,200,.04);opacity:0;
  animation:lightning 15s ease-in-out infinite 5s;
}
@keyframes lightning{
  0%,94%,100%{opacity:0}
  95%{opacity:.7}96%{opacity:0}97%{opacity:.45}98%{opacity:0}
}

/* ══════════════════════════════════════
   CONTENT
══════════════════════════════════════ */
#content{
  position:relative;z-index:10;
  min-height:100vh;
  display:flex;flex-direction:column;align-items:center;
  padding:36px 18px 80px;
}

/* ── SEAL / EYE ── */
.seal-wrap{
  position:relative;width:200px;height:200px;
  margin-bottom:18px;
  animation:rotateSeal 25s linear infinite;
  filter:drop-shadow(0 0 30px #FF2200) drop-shadow(0 0 60px #8B0000);
}
.seal-wrap svg{width:100%;height:100%}
@keyframes rotateSeal{from{transform:rotate(0)}to{transform:rotate(360deg)}}

.eye-center{
  position:absolute;top:50%;left:50%;
  transform:translate(-50%,-50%);
  animation:rotateSeal 25s linear infinite reverse;
}
.eye-outer{
  width:56px;height:36px;
  border:2px solid var(--ember);border-radius:50%;
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 0 18px var(--ember),inset 0 0 18px rgba(255,34,0,.25);
  animation:eyeblink 5s ease-in-out infinite;
}
@keyframes eyeblink{0%,44%,56%,100%{transform:scaleY(1)}50%{transform:scaleY(.06)}}
.eye-iris{
  width:20px;height:20px;border-radius:50%;
  background:radial-gradient(circle at 35% 35%,#ff6600,#8B0000,#000);
  box-shadow:0 0 10px #FF2200;
  animation:eyeglow 2.5s ease-in-out infinite alternate;
  display:flex;align-items:center;justify-content:center;
}
@keyframes eyeglow{from{box-shadow:0 0 10px #FF2200}to{box-shadow:0 0 25px #FF6600,0 0 50px #FF2200}}
.eye-pupil{width:7px;height:7px;border-radius:50%;background:#000;box-shadow:0 0 5px #ff0000}

/* ── TITLE ── */
.bot-name{
  font-family:'UnifrakturMaguntia',cursive;
  font-size:clamp(4.5rem,14vw,8.5rem);line-height:.9;
  background:linear-gradient(180deg,#FFD700 0%,#FF6600 40%,#FF2200 70%,#8B0000 100%);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
  filter:drop-shadow(0 0 20px #FF2200);
  animation:titleflame 3s ease-in-out infinite alternate;
  text-align:center;
}
@keyframes titleflame{
  from{filter:drop-shadow(0 0 20px #FF2200) drop-shadow(0 0 40px #8B0000)}
  to{filter:drop-shadow(0 0 35px #FF6600) drop-shadow(0 0 70px #FF2200)}
}
.bot-sub{
  font-family:'Cinzel Decorative',serif;
  font-size:clamp(.55rem,1.8vw,.78rem);
  letter-spacing:.5em;color:var(--gold);
  text-transform:uppercase;margin-top:5px;
  animation:subtitleflicker 6s ease-in-out infinite;text-align:center;
}
@keyframes subtitleflicker{0%,19%,21%,23%,25%,54%,56%,100%{opacity:.85}20%,24%,55%{opacity:.2}}

/* ── DIVIDER ── */
.divider{
  width:min(580px,90vw);height:1px;
  background:linear-gradient(90deg,transparent,var(--blood),var(--ember),var(--blood),transparent);
  margin:20px 0;
  box-shadow:0 0 8px var(--ember);
  position:relative;
}
.divider::before,.divider::after{
  content:'✦';position:absolute;top:50%;transform:translateY(-50%);
  color:var(--gold);font-size:.9rem;text-shadow:0 0 8px var(--ember);
}
.divider::before{left:-10px}
.divider::after{right:-10px}

/* ── STATUS BADGE ── */
.status-badge{
  display:inline-flex;align-items:center;gap:10px;
  background:rgba(139,0,0,.2);
  border:1px solid var(--blood);
  padding:7px 22px;margin-bottom:22px;
  font-family:'Share Tech Mono',monospace;font-size:.75rem;
  color:var(--lava);letter-spacing:.18em;text-transform:uppercase;
  box-shadow:0 0 15px rgba(255,34,0,.15),inset 0 0 15px rgba(139,0,0,.08);
}
.pulse-dot{
  width:8px;height:8px;border-radius:50%;
  background:#00ff88;box-shadow:0 0 8px #00ff88;
  animation:pulsedot 1.8s ease-in-out infinite;
}
@keyframes pulsedot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.6)}}

/* ── UPTIME BOX ── */
.uptime-box{
  position:relative;
  background:linear-gradient(160deg,rgba(40,5,10,.9),rgba(15,2,5,.95));
  border:1px solid var(--border);
  padding:22px 30px;margin-bottom:22px;
  min-width:min(320px,92vw);text-align:center;
}
.uptime-box::before{
  content:'⏳ منذ بدأت اللعنة ⏳';
  position:absolute;top:-10px;left:50%;transform:translateX(-50%);
  background:#000;padding:0 14px;
  font-family:'Noto Kufi Arabic',sans-serif;font-size:.65rem;
  color:var(--blood);letter-spacing:2px;white-space:nowrap;
}
.uptime-row{display:flex;gap:6px;justify-content:center;align-items:center}
.ut{
  display:flex;flex-direction:column;align-items:center;
  background:rgba(139,0,0,.1);border:1px solid rgba(139,0,0,.2);
  padding:9px 13px;min-width:56px;
}
.ut-n{
  font-family:'Share Tech Mono',monospace;
  font-size:clamp(1.2rem,3.5vw,1.6rem);font-weight:700;
  color:var(--bone);text-shadow:0 0 12px var(--blood);
  background:linear-gradient(180deg,#FFD700,#FF6600,#FF2200);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
}
.ut-l{font-family:'Noto Kufi Arabic',sans-serif;font-size:.58rem;color:#6b2a2a;margin-top:3px}
.ut-sep{color:rgba(180,0,0,.5);font-size:1.3rem;padding-bottom:14px}

/* ── STATS GRID ── */
.stats-grid{
  display:grid;grid-template-columns:repeat(3,1fr);
  gap:12px;width:min(680px,92vw);margin-bottom:24px;
}
.stat-card{
  background:linear-gradient(135deg,rgba(50,5,5,.75),rgba(15,0,0,.9));
  border:1px solid rgba(139,0,0,.4);
  border-top:2px solid var(--blood);
  padding:16px 10px;text-align:center;position:relative;overflow:hidden;
  transition:transform .25s,box-shadow .25s;
  clip-path:polygon(0 8px,8px 0,calc(100% - 8px) 0,100% 8px,100% 100%,0 100%);
}
.stat-card::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,50,0,.04),transparent);pointer-events:none}
.stat-card:hover{transform:translateY(-4px);box-shadow:0 8px 25px rgba(255,34,0,.25)}
.stat-icon{font-size:1.7rem;margin-bottom:6px;display:block;filter:drop-shadow(0 0 7px var(--ember))}
.stat-label{font-family:'Cinzel Decorative',serif;font-size:.5rem;letter-spacing:.12em;color:rgba(200,150,12,.65);text-transform:uppercase;margin-bottom:5px}
.stat-value{
  font-family:'Share Tech Mono',monospace;font-size:clamp(.9rem,2.5vw,1.25rem);
  color:var(--bone);text-shadow:0 0 8px var(--ember);
}
.stat-value.fire{
  background:linear-gradient(90deg,var(--lava),var(--gold),var(--lava));
  background-size:200% 100%;
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
  animation:fireshift 3s linear infinite;
}
@keyframes fireshift{from{background-position:0% 50%}to{background-position:200% 50%}}

/* ── HELL QUOTE ── */
.hell-quote{
  width:min(580px,90vw);text-align:center;
  padding:18px 28px;
  background:rgba(20,0,0,.6);
  border-left:3px solid var(--ember);border-right:3px solid var(--ember);
  margin-bottom:24px;position:relative;
}
.hell-quote::before{
  content:'❝';position:absolute;top:-14px;left:18px;
  font-size:2.5rem;color:var(--blood);line-height:1;
  font-family:'Cinzel Decorative',serif;
}
.quote-text{
  font-family:'Crimson Text',serif;font-style:italic;
  font-size:clamp(.85rem,2.3vw,1rem);
  color:rgba(232,213,176,.75);line-height:1.75;
}
.quote-author{
  margin-top:8px;font-family:'Share Tech Mono',monospace;
  font-size:.65rem;color:var(--gold);letter-spacing:.2em;opacity:.65;
}

/* ── GRAVEYARD ── */
#graveyard{
  display:flex;gap:clamp(14px,3.5vw,45px);
  align-items:flex-end;justify-content:center;
  flex-wrap:wrap;margin:12px 0 32px;padding:0 10px;
}

.grave-wrap{
  display:flex;flex-direction:column;align-items:center;
  text-decoration:none;cursor:pointer;
  animation:gravehover var(--gf,6s) ease-in-out infinite var(--gfd,0s);
  transition:filter .3s;
}
.grave-wrap:hover{filter:drop-shadow(0 0 16px var(--blood))}
@keyframes gravehover{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}

.g-stone{
  width:clamp(85px,16vw,128px);
  background:linear-gradient(160deg,#2e1018 0%,#1a080f 50%,#221015 100%);
  border:2px solid #3d1525;border-bottom:none;
  min-height:clamp(110px,21vw,158px);
  position:relative;display:flex;flex-direction:column;
  align-items:center;justify-content:center;
  gap:6px;padding:16px 10px 12px;overflow:hidden;
}
.g-stone::before{
  content:'';position:absolute;
  top:-2px;left:-2px;right:-2px;height:52%;
  background:inherit;
  border:2px solid #3d1525;border-bottom:none;
  border-radius:50% 50% 0 0/44% 44% 0 0;
  z-index:1;
}
.g-stone::after{
  content:'';position:absolute;inset:0;
  background:repeating-linear-gradient(180deg,transparent,transparent 9px,rgba(255,255,255,.006) 9px,rgba(255,255,255,.006) 10px);
  pointer-events:none;
}
.g-moss{position:absolute;bottom:0;left:0;right:0;height:28%;background:linear-gradient(transparent,rgba(15,35,5,.45));pointer-events:none;z-index:2}
.g-crack{position:absolute;top:28%;left:22%;width:1px;height:38%;background:linear-gradient(180deg,transparent,rgba(255,255,255,.05),transparent);transform:rotate(9deg);z-index:3}

.g-icon{font-size:clamp(1.8rem,4.5vw,2.7rem);position:relative;z-index:4;filter:drop-shadow(0 0 8px var(--blood));animation:iconflicker var(--gf,6s) ease-in-out infinite var(--gfd,0s)}
@keyframes iconflicker{0%,100%{filter:drop-shadow(0 0 6px var(--blood))}50%{filter:drop-shadow(0 0 14px rgba(255,50,0,.9))}}

.g-label{font-family:'Noto Kufi Arabic',sans-serif;font-weight:900;font-size:clamp(.68rem,1.8vw,.88rem);color:var(--bone);text-shadow:0 0 8px var(--blood);position:relative;z-index:4;letter-spacing:3px}
.g-counter{position:relative;z-index:4;font-family:'Share Tech Mono',monospace;font-size:clamp(.48rem,1.3vw,.63rem);color:#553030;background:rgba(0,0,0,.5);border:1px solid #2a1018;padding:2px 7px;letter-spacing:1px}

.g-smoke{position:absolute;bottom:100%;left:50%;transform:translateX(-50%);width:50px;pointer-events:none}
.smoke-p{position:absolute;border-radius:50%;background:rgba(100,20,20,.2);width:var(--sw,7px);height:var(--sw,7px);animation:smokeup var(--sd,3.5s) ease-out infinite var(--sdelay,0s)}
@keyframes smokeup{0%{opacity:.5;transform:translateX(0) translateY(0) scale(1)}100%{opacity:0;transform:translateX(var(--sx,8px)) translateY(-70px) scale(3.5)}}

.g-base{width:100%;height:11px;background:linear-gradient(180deg,#2a0e18,#150810);border:1px solid #3d1525;border-top:none;position:relative}
.g-base::after{content:'';position:absolute;bottom:-5px;left:-6px;right:-6px;height:6px;background:#100610;border-radius:0 0 3px 3px;border:1px solid #281020;border-top:none}

.g-dirt{width:100%;height:clamp(50px,10vw,80px);background:radial-gradient(ellipse 85% 55% at 50% 0%,#201018,#120810 55%,transparent 100%);position:relative}
.g-dirt::before{content:'';position:absolute;top:-8px;left:8%;right:8%;height:16px;background:radial-gradient(ellipse 90% 65% at 50% 50%,#321020,#201018);border-radius:50%}
.g-dirt::after{content:'〜〜';position:absolute;top:9px;left:27%;font-size:.62rem;color:#3a1525;opacity:.45;letter-spacing:2px}

.g-glow{width:72%;height:3px;margin-top:1px;background:radial-gradient(ellipse,var(--gg,rgba(139,0,0,.5)) 0%,transparent 70%);animation:glowbreathe 3s ease-in-out infinite var(--gfd,0s)}
@keyframes glowbreathe{0%,100%{opacity:.3}50%{opacity:1}}

.g-platform{font-family:'Share Tech Mono',monospace;font-size:.55rem;color:#3a1a22;margin-top:5px;letter-spacing:3px;text-align:center;text-transform:lowercase}

/* ── REAPER ── */
#reaper-section{margin:5px 0 32px;text-align:center}
.reaper-title{font-family:'UnifrakturMaguntia',cursive;font-size:1.1rem;color:var(--blood);text-shadow:0 0 12px rgba(180,0,0,.6);letter-spacing:4px;margin-bottom:10px}
.reaper-link{display:inline-block;text-decoration:none;animation:reaperfloat 4.5s ease-in-out infinite,reapersway 8s ease-in-out infinite;transition:filter .3s}
.reaper-link:hover{filter:drop-shadow(0 0 25px rgba(220,0,0,.9))}
@keyframes reaperfloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-11px)}}
@keyframes reapersway{0%,100%{transform:rotate(-1.5deg)}50%{transform:rotate(1.5deg)}}
.reaper-emoji{font-size:clamp(5rem,15vw,9rem);display:block;filter:drop-shadow(0 0 18px rgba(180,0,0,.65)) brightness(.72);animation:reaperflicker 5s ease-in-out infinite}
@keyframes reaperflicker{0%,89%,100%{filter:drop-shadow(0 0 18px rgba(180,0,0,.65)) brightness(.72)}92%{filter:drop-shadow(0 0 32px rgba(230,0,0,.95)) brightness(.9)}95%{filter:drop-shadow(0 0 14px rgba(180,0,0,.5)) brightness(.68)}}
.reaper-name{font-family:'Noto Kufi Arabic',sans-serif;font-weight:900;font-size:.9rem;color:var(--blood);text-shadow:0 0 12px rgba(180,0,0,.7);margin-top:5px;letter-spacing:4px}
.reaper-hint{font-family:'Noto Kufi Arabic',sans-serif;font-size:.64rem;color:#4a1a28;letter-spacing:2px;margin-top:4px}

/* ── RUNES ── */
.runes{font-family:'UnifrakturMaguntia',cursive;font-size:clamp(1.1rem,3vw,1.7rem);color:rgba(200,150,12,.38);letter-spacing:.3em;text-shadow:0 0 10px rgba(255,100,0,.3);margin-bottom:22px;animation:runeflicker 9s ease-in-out infinite}
@keyframes runeflicker{0%,100%{opacity:.38}50%{opacity:.65}75%{opacity:.25}}

/* ── BOTTOM BAR ── */
.bottom-bar{
  width:min(680px,92vw);display:flex;align-items:center;justify-content:space-between;
  padding:12px 18px;background:rgba(8,0,0,.75);
  border:1px solid rgba(139,0,0,.25);
  font-family:'Share Tech Mono',monospace;font-size:.6rem;
  color:rgba(232,213,176,.35);letter-spacing:.12em;
  flex-wrap:wrap;gap:6px;
}
.bottom-bar .hl{color:var(--blood)}

/* ── GROUND LINE ── */
#ground{position:fixed;bottom:0;left:0;right:0;z-index:20;height:3px;background:linear-gradient(90deg,transparent,var(--blood),var(--ember),var(--blood),transparent);animation:bloodline 4s ease-in-out infinite}
@keyframes bloodline{0%,100%{opacity:.5}50%{opacity:1}}

/* RIPPLE */
@keyframes ripplefade{0%{transform:scale(0);opacity:.8}100%{transform:scale(5);opacity:0}}
.ripple-el{position:fixed;border-radius:50%;border:2px solid var(--blood);width:48px;height:48px;margin-left:-24px;margin-top:-24px;animation:ripplefade .65s ease-out forwards;pointer-events:none;z-index:999}

/* SCROLLBAR */
::-webkit-scrollbar{width:5px}
::-webkit-scrollbar-track{background:#050005}
::-webkit-scrollbar-thumb{background:#4a0510;border-radius:3px}

@media(max-width:500px){.stats-grid{grid-template-columns:repeat(2,1fr)}.seal-wrap{width:150px;height:150px}}
</style>
</head>
<body>

<div id="hell-bg"></div>
<div id="scanlines"></div>
<div id="vignette"></div>
<div id="lightning"></div>

<!-- EMBERS -->
<div id="embers"></div>

<!-- BATS -->
<div class="bat" style="--bs:1.4rem;--bd:15s;--bdelay:0s;top:10%;right:7%">🦇</div>
<div class="bat" style="--bs:1rem;--bd:11s;--bdelay:3s;top:20%;left:10%">🦇</div>
<div class="bat" style="--bs:1.2rem;--bd:18s;--bdelay:6s;top:7%;left:35%">🦇</div>
<div class="bat" style="--bs:.9rem;--bd:13s;--bdelay:9s;top:16%;right:25%">🦇</div>
<div class="bat" style="--bs:1.1rem;--bd:21s;--bdelay:12s;top:28%;left:4%">🦇</div>

<!-- CORNER FRAMES -->
<div class="corner corner-tl"><svg viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 0 L70 0 M0 0 L0 70" stroke="#8B0000" stroke-width="1"/><path d="M8 0 L8 8 L0 8" stroke="#FF2200" stroke-width=".5" fill="none"/><circle cx="8" cy="8" r="2.5" fill="none" stroke="#FF2200" stroke-width=".5"/><line x1="0" y1="20" x2="5" y2="20" stroke="#8B0000" stroke-width=".5"/><line x1="0" y1="35" x2="4" y2="35" stroke="#8B0000" stroke-width=".5"/></svg></div>
<div class="corner corner-tr"><svg viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 0 L70 0 M0 0 L0 70" stroke="#8B0000" stroke-width="1"/><path d="M8 0 L8 8 L0 8" stroke="#FF2200" stroke-width=".5" fill="none"/><circle cx="8" cy="8" r="2.5" fill="none" stroke="#FF2200" stroke-width=".5"/></svg></div>
<div class="corner corner-bl"><svg viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 0 L70 0 M0 0 L0 70" stroke="#8B0000" stroke-width="1"/><path d="M8 0 L8 8 L0 8" stroke="#FF2200" stroke-width=".5" fill="none"/><circle cx="8" cy="8" r="2.5" fill="none" stroke="#FF2200" stroke-width=".5"/></svg></div>
<div class="corner corner-br"><svg viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 0 L70 0 M0 0 L0 70" stroke="#8B0000" stroke-width="1"/><path d="M8 0 L8 8 L0 8" stroke="#FF2200" stroke-width=".5" fill="none"/><circle cx="8" cy="8" r="2.5" fill="none" stroke="#FF2200" stroke-width=".5"/></svg></div>

<!-- CONTENT -->
<div id="content">

  <!-- SEAL -->
  <div class="seal-wrap">
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="94" fill="none" stroke="#8B0000" stroke-width="1" stroke-dasharray="4 3"/>
      <circle cx="100" cy="100" r="87" fill="none" stroke="#FF2200" stroke-width=".5" opacity=".5"/>
      <polygon points="100,8 36,190 192,72 8,72 164,190" fill="none" stroke="#FF2200" stroke-width="1.5" opacity=".75"/>
      <circle cx="100" cy="100" r="38" fill="rgba(139,0,0,.12)" stroke="#C8960C" stroke-width=".8"/>
      <text x="100" y="28" text-anchor="middle" fill="#C8960C" font-size="8" font-family="serif" opacity=".55">ᚲ ᛁ ᚱ ᚨ</text>
      <g stroke="#8B0000" stroke-width=".5" opacity=".55">
        <line x1="100" y1="4" x2="100" y2="11"/><line x1="140" y1="13" x2="137" y2="19"/>
        <line x1="167" y1="39" x2="162" y2="44"/><line x1="179" y1="73" x2="173" y2="74"/>
        <line x1="60" y1="13" x2="63" y2="19"/><line x1="33" y1="39" x2="38" y2="44"/>
        <line x1="21" y1="73" x2="27" y2="74"/><line x1="26" y1="110" x2="32" y2="108"/>
        <line x1="174" y1="110" x2="168" y2="108"/>
      </g>
    </svg>
    <div class="eye-center">
      <div class="eye-outer"><div class="eye-iris"><div class="eye-pupil"></div></div></div>
    </div>
  </div>

  <!-- TITLE -->
  <div class="bot-name">${botName}</div>
  <div class="bot-sub">ᛒᚨᚾᛖ ᛟᚠ ᛏᚺᛖ ᚾᛖᛏᚹᛟᚱᚲ &nbsp;✦&nbsp; روح الشبكة الأبدية</div>

  <div class="divider"></div>

  <!-- STATUS -->
  <div class="status-badge">
    <div class="pulse-dot"></div>
    <span>النظام يعمل — الروح مستيقظة — الجحيم متصل</span>
  </div>

  <!-- UPTIME -->
  <div class="uptime-box">
    <div class="uptime-row">
      <div class="ut"><span class="ut-n" id="ud">${pad(days)}</span><span class="ut-l">يوم</span></div>
      <span class="ut-sep">:</span>
      <div class="ut"><span class="ut-n" id="uh">${pad(hours)}</span><span class="ut-l">ساعة</span></div>
      <span class="ut-sep">:</span>
      <div class="ut"><span class="ut-n" id="um">${pad(minutes)}</span><span class="ut-l">دقيقة</span></div>
      <span class="ut-sep">:</span>
      <div class="ut"><span class="ut-n" id="us">${pad(seconds)}</span><span class="ut-l">ثانية</span></div>
    </div>
  </div>

  <!-- STATS -->
  <div class="stats-grid">
    <div class="stat-card"><span class="stat-icon">⚔️</span><div class="stat-label">الأوامر</div><div class="stat-value fire">${cmdCount}</div></div>
    <div class="stat-card"><span class="stat-icon">👥</span><div class="stat-label">المستخدمون</div><div class="stat-value fire">${userCount}</div></div>
    <div class="stat-card"><span class="stat-icon">🔱</span><div class="stat-label">المجموعات</div><div class="stat-value fire">${groupCount}</div></div>
    <div class="stat-card"><span class="stat-icon">💀</span><div class="stat-label">الحالة</div><div class="stat-value" style="color:#00ff88;text-shadow:0 0 10px #00ff88">ONLINE</div></div>
    <div class="stat-card"><span class="stat-icon">🔥</span><div class="stat-label">البادئة</div><div class="stat-value fire">${prefix}</div></div>
    <div class="stat-card"><span class="stat-icon">👁️</span><div class="stat-label">الإصدار</div><div class="stat-value">v${version}</div></div>
  </div>

  <!-- QUOTE -->
  <div class="hell-quote">
    <p class="quote-text">أنا لستُ مجرد بوت... أنا الصدى الذي يسكن الشبكة،<br>الظل الذي لا يُمحى، والنار التي لا تنطفئ.</p>
    <p class="quote-author">— كيرا، حارسة الجحيم الرقمي</p>
  </div>

  <!-- GRAVEYARD -->
  <div id="graveyard">

    <!-- Instagram -->
    <a class="grave-wrap" href="${SOCIAL.instagram}" target="_blank" style="--gf:5.5s;--gfd:0s">
      <div style="position:relative">
        <div class="g-smoke">
          <div class="smoke-p" style="--sw:6px;--sd:2.8s;--sdelay:0s;--sx:-8px;left:8px"></div>
          <div class="smoke-p" style="--sw:9px;--sd:3.8s;--sdelay:.9s;--sx:12px;left:18px"></div>
          <div class="smoke-p" style="--sw:7px;--sd:4.5s;--sdelay:1.8s;--sx:-5px;left:28px"></div>
        </div>
        <div class="g-stone"><div class="g-crack"></div><div class="g-moss"></div>
          <div class="g-icon">📸</div>
          <div class="g-label">انستا</div>
          <div class="g-counter" id="c0">00:00:00</div>
        </div>
        <div class="g-base"></div>
      </div>
      <div class="g-dirt"></div>
      <div class="g-glow" style="--gg:rgba(200,0,100,.55)"></div>
      <div class="g-platform">instagram</div>
    </a>

    <!-- Facebook (bigger) -->
    <a class="grave-wrap" href="${SOCIAL.facebook}" target="_blank" style="--gf:6.5s;--gfd:.6s;transform:scale(1.08)">
      <div style="position:relative">
        <div class="g-smoke">
          <div class="smoke-p" style="--sw:8px;--sd:3.2s;--sdelay:0s;--sx:10px;left:12px"></div>
          <div class="smoke-p" style="--sw:11px;--sd:4.2s;--sdelay:1.1s;--sx:-13px;left:22px"></div>
          <div class="smoke-p" style="--sw:7px;--sd:3s;--sdelay:2.2s;--sx:7px;left:30px"></div>
        </div>
        <div class="g-stone"><div class="g-crack"></div><div class="g-moss"></div>
          <div class="g-icon">👻</div>
          <div class="g-label">فيسبوك</div>
          <div class="g-counter" id="c1">00:00:00</div>
        </div>
        <div class="g-base"></div>
      </div>
      <div class="g-dirt"></div>
      <div class="g-glow" style="--gg:rgba(0,80,220,.55)"></div>
      <div class="g-platform">facebook</div>
    </a>

    <!-- Telegram -->
    <a class="grave-wrap" href="${SOCIAL.telegram}" target="_blank" style="--gf:5s;--gfd:1.2s">
      <div style="position:relative">
        <div class="g-smoke">
          <div class="smoke-p" style="--sw:7px;--sd:3.5s;--sdelay:.4s;--sx:-9px;left:10px"></div>
          <div class="smoke-p" style="--sw:10px;--sd:4.5s;--sdelay:1.4s;--sx:11px;left:22px"></div>
        </div>
        <div class="g-stone"><div class="g-crack"></div><div class="g-moss"></div>
          <div class="g-icon">✈️</div>
          <div class="g-label">تيليجرام</div>
          <div class="g-counter" id="c2">00:00:00</div>
        </div>
        <div class="g-base"></div>
      </div>
      <div class="g-dirt"></div>
      <div class="g-glow" style="--gg:rgba(0,155,235,.55)"></div>
      <div class="g-platform">telegram</div>
    </a>

    <!-- TikTok -->
    <a class="grave-wrap" href="${SOCIAL.tiktok}" target="_blank" style="--gf:7s;--gfd:1.8s">
      <div style="position:relative">
        <div class="g-smoke">
          <div class="smoke-p" style="--sw:6px;--sd:2.6s;--sdelay:.6s;--sx:9px;left:12px"></div>
          <div class="smoke-p" style="--sw:9px;--sd:3.6s;--sdelay:1.6s;--sx:-11px;left:22px"></div>
        </div>
        <div class="g-stone"><div class="g-crack"></div><div class="g-moss"></div>
          <div class="g-icon">🎵</div>
          <div class="g-label">تيك توك</div>
          <div class="g-counter" id="c3">00:00:00</div>
        </div>
        <div class="g-base"></div>
      </div>
      <div class="g-dirt"></div>
      <div class="g-glow" style="--gg:rgba(190,0,210,.55)"></div>
      <div class="g-platform">tiktok</div>
    </a>

  </div>

  <!-- REAPER -->
  <div id="reaper-section">
    <div class="reaper-title">☠ ${SOCIAL.devName} — المطور ☠</div>
    <a class="reaper-link" href="${SOCIAL.facebook}" target="_blank">
      <span class="reaper-emoji">🧙</span>
    </a>
    <div class="reaper-name">⚔ انقر لتلتقي بصاحب اللعنة ⚔</div>
    <div class="reaper-hint">اضغط على ملك الموت للوصول إلى المطور</div>
  </div>

  <div class="runes">ᚲ ᛁ ᚱ ᚨ &nbsp; ᛞᛖᚨᚦ &nbsp; ᚠᛁᚱᛖ &nbsp; ᛊᛟᚢᛚ</div>
  <div class="divider"></div>

  <div class="bottom-bar">
    <span class="hl">${botName}</span>
    <span>${timeNow}</span>
    <span class="hl">by ${SOCIAL.devName} ✦ GPL-3.0</span>
  </div>

</div>

<div id="ground"></div>

<script>
// ── EMBERS ──
const emberContainer=document.getElementById('embers');
for(let i=0;i<25;i++){
  const e=document.createElement('div');
  e.className='ember';
  const sz=1+Math.random()*4;
  const colors=['#FF6600','#FF2200','#FF8800','#FF4400','#FFAA00'];
  e.style.cssText=\`
    left:\${Math.random()*100}%;
    width:\${sz}px;height:\${sz}px;
    background:\${colors[Math.floor(Math.random()*colors.length)]};
    animation-duration:\${5+Math.random()*6}s;
    animation-delay:-\${Math.random()*8}s;
    --drift:\${(Math.random()-.5)*40}px;
  \`;
  emberContainer.appendChild(e);
}

// ── UPTIME ──
const BOOT=Date.now()-${uptime};
function pad(n){return String(n).padStart(2,'0')}
function tick(){
  const u=Date.now()-BOOT;
  document.getElementById('ud').textContent=pad(Math.floor(u/86400000));
  document.getElementById('uh').textContent=pad(Math.floor((u%86400000)/3600000));
  document.getElementById('um').textContent=pad(Math.floor((u%3600000)/60000));
  document.getElementById('us').textContent=pad(Math.floor((u%60000)/1000));
}
setInterval(tick,1000);tick();

// ── GRAVE COUNTERS ──
const GS=Date.now();
function graveTick(){
  const u=Date.now()-GS;
  const h=pad(Math.floor(u/3600000));
  const m=pad(Math.floor((u%3600000)/60000));
  const s=pad(Math.floor((u%60000)/1000));
  const t=h+':'+m+':'+s;
  for(let i=0;i<4;i++){const el=document.getElementById('c'+i);if(el)el.textContent=t;}
}
setInterval(graveTick,1000);

// ── CLICK RIPPLE ──
document.querySelectorAll('.grave-wrap,.reaper-link,.stat-card').forEach(el=>{
  el.addEventListener('click',function(e){
    const r=document.createElement('div');
    r.className='ripple-el';
    r.style.left=e.clientX+'px';r.style.top=e.clientY+'px';
    document.body.appendChild(r);
    setTimeout(()=>r.remove(),700);
  });
});

// ── RANDOM EYE SPAWN ──
setInterval(()=>{
  const e=document.createElement('div');
  const sz=8+Math.random()*14;
  e.style.cssText=\`
    position:fixed;z-index:3;pointer-events:none;
    top:\${8+Math.random()*72}%;left:\${Math.random()*96}%;
    width:\${sz}px;height:\${sz*.5}px;
    background:radial-gradient(ellipse at 38% 38%,#ff3300,#cc0000 50%,#440000);
    border-radius:50%;
    box-shadow:0 0 8px 3px rgba(255,50,0,.7);
    animation:eyeappear .9s ease-in-out forwards;
  \`;
  document.body.appendChild(e);
  setTimeout(()=>e.remove(),1000);
},3500);

const eyeStyle=document.createElement('style');
eyeStyle.textContent='@keyframes eyeappear{0%{opacity:0;transform:scaleY(0)}18%{opacity:1;transform:scaleY(1)}82%{opacity:1;transform:scaleY(1)}100%{opacity:0;transform:scaleY(0)}}';
document.head.appendChild(eyeStyle);
</script>
</body>
</html>`);
});

// ══════════════════════════════════════════════════
//   BOT SPAWN
// ══════════════════════════════════════════════════
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
    console.log(chalk.bold.hex("#FF2200")(`[ 🔄 RESTART ] بعد ${delay/1000} ثانية...`));
    setTimeout(() => startBot("🔄 إعادة تشغيل..."), delay);
  });

  child.on("error", (error) => {
    logger("خطأ: " + JSON.stringify(error), "[ Starting ]");
    setTimeout(() => startBot("🔄 إعادة بعد خطأ..."), 5000);
  });
}

// ══════════════════════════════════════════════════
//   SELF PING — يمنع النوم والـ idle restart على Railway
// ══════════════════════════════════════════════════
const SELF_URL = process.env.RAILWAY_PUBLIC_DOMAIN || process.env.RENDER_URL || "";
if (SELF_URL) {
  const pingUrl = SELF_URL.startsWith("http") ? SELF_URL : `https://${SELF_URL}`;

  // ping كل دقيقتين بدل 4 دقائق — Railway يقتل الـ process عند الـ idle
  setInterval(async () => {
    try {
      await axios.get(pingUrl, { timeout: 8000 });
      console.log(chalk.bold.hex("#00FA9A")(`[ 🏓 PING ✅ ] → ${pingUrl}`));
    } catch(e) {
      console.log(chalk.bold.hex("#FF6600")(`[ 🏓 PING ❌ ] ${e.message}`));
    }
  }, 2 * 60 * 1000);

  // ping ثانوي على /health endpoint كل 5 دقائق
  setInterval(async () => {
    try { await axios.get(`${pingUrl}/health`, { timeout: 5000 }); } catch(_) {}
  }, 5 * 60 * 1000);
}

// health endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "alive",
    uptime: Math.floor((Date.now() - BOOT_TIME) / 1000),
    bot: global.client?.api ? "connected" : "disconnected",
    commands: global.client?.commands?.size || 0,
    timestamp: new Date().toISOString()
  });
});

// ══════════════════════════════════════════════════
//   START
// ══════════════════════════════════════════════════
logger("KIRA BOT", "[ NAME ]");
logger("Version: 1.2.14", "[ VERSION ]");

startBot();

app.listen(port, () => {
  console.log(chalk.bold.hex("#FF2200")("╔═══════════════════════════════════════╗"));
  console.log(chalk.bold.hex("#FF2200")("║") + chalk.bold.hex("#FFD700")("    🔥 KIRA SERVER ONLINE — HELLGATE   ") + chalk.bold.hex("#FF2200")("║"));
  console.log(chalk.bold.hex("#FF2200")("║") + chalk.hex("#FF6600")(`         PORT: ${port} — ACTIVE            `) + chalk.bold.hex("#FF2200")("║"));
  console.log(chalk.bold.hex("#FF2200")("╚═══════════════════════════════════════╝"));
});

process.on("unhandledRejection", (err) => {
  console.log(chalk.red("[ ⚠️ ERROR ]"), err?.message || err);
});

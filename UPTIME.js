const startTime = Date.now();

module.exports = function(app) {

  app.get("/", (req, res) => {
    const uptime  = Date.now() - startTime;
    const days    = Math.floor(uptime / 86400000);
    const hours   = Math.floor((uptime % 86400000) / 3600000);
    const minutes = Math.floor((uptime % 3600000) / 60000);
    const seconds = Math.floor((uptime % 60000) / 1000);

    const cfg      = global.config  || {};
    const client   = global.client  || {};
    const botName  = cfg.BOTNAME    || "KIRA";
    const prefix   = cfg.PREFIX     || ".";
    const cmdCount = client.commands?.size || 0;
    const evtCount = client.events?.size   || 0;
    const version  = cfg.version    || "1.0.0";

    // ── روابط التواصل ──────────────────────────────────────
    const social = cfg.SOCIAL || {};
    const fb  = social.facebook  || "https://www.facebook.com/profile.php?id=61580139921634";
    const ig  = social.instagram || "https://instagram.com/x_v_k1";
    const tg  = social.telegram  || "https://t.me/X2_FD";
    const tt  = social.tiktok    || "#";
    const dev = social.devName   || "أيمن";
    const devFb = fb;

    res.send(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${botName} ☠️ مقبرة الأرواح</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=UnifrakturMaguntia&family=Space+Mono:wght@400;700&family=Noto+Kufi+Arabic:wght@300;400;700;900&display=swap" rel="stylesheet">
<style>
/* ═══════════════════════════════════════════
   RESET & ROOT
═══════════════════════════════════════════ */
*{margin:0;padding:0;box-sizing:border-box}
:root{
  --bg:#050308;
  --fog:#0a0510;
  --stone:#18101e;
  --border:#2d1f3d;
  --blood:#8b0000;
  --deep-blood:#4a0000;
  --bone:#c8b89a;
  --muted:#6b4a5a;
  --green-glow:rgba(0,255,60,.12);
  --red-glow:rgba(180,0,0,.35);
  --purple-glow:rgba(120,0,200,.2);
}
html,body{
  width:100%;min-height:100vh;
  background:var(--bg);
  color:var(--bone);
  overflow-x:hidden;
  cursor:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='22' height='22'%3E%3Ccircle cx='11' cy='11' r='3' fill='%23cc0000' opacity='.85'/%3E%3Ccircle cx='11' cy='11' r='6' fill='none' stroke='%23660000' stroke-width='1' opacity='.5'/%3E%3C/svg%3E") 11 11, auto;
}

/* ═══════════════════════════════════════════
   BACKGROUND LAYERS
═══════════════════════════════════════════ */
#bg-scene{
  position:fixed;inset:0;z-index:0;
  background:
    radial-gradient(ellipse 100% 50% at 50% 100%, #0d0814 0%, transparent 65%),
    radial-gradient(ellipse 70% 70% at 15% 90%, rgba(40,10,50,.8) 0%, transparent 55%),
    radial-gradient(ellipse 70% 70% at 85% 90%, rgba(30,8,40,.8) 0%, transparent 55%),
    radial-gradient(ellipse 50% 30% at 50% 5%,  rgba(20,0,30,.9) 0%, transparent 70%),
    linear-gradient(180deg,#02010a 0%,#060310 50%,#0a0518 100%);
}

/* grid lines */
#bg-scene::after{
  content:'';position:absolute;inset:0;
  background-image:
    linear-gradient(rgba(80,0,120,.04) 1px,transparent 1px),
    linear-gradient(90deg,rgba(80,0,120,.04) 1px,transparent 1px);
  background-size:60px 60px;
}

/* ═══════════════════════════════════════════
   MOON
═══════════════════════════════════════════ */
#moon{
  position:fixed;top:4%;left:50%;transform:translateX(-50%);
  width:110px;height:110px;border-radius:50%;z-index:2;
  background:radial-gradient(circle at 32% 32%,#f0e8d0,#c8a860 45%,#7a6030 75%,#3a2a10);
  box-shadow:
    0 0 40px 15px rgba(220,190,100,.12),
    0 0 100px 50px rgba(200,170,80,.06),
    0 0 200px 100px rgba(150,120,50,.03);
  animation:moonbreathe 7s ease-in-out infinite;
}
#moon::before{
  content:'';position:absolute;
  width:14px;height:14px;border-radius:50%;
  background:rgba(0,0,0,.25);
  top:22px;left:52px;
  box-shadow:15px 22px 0 11px rgba(0,0,0,.18),-6px 38px 0 8px rgba(0,0,0,.14),28px 50px 0 9px rgba(0,0,0,.1);
}
@keyframes moonbreathe{
  0%,100%{box-shadow:0 0 40px 15px rgba(220,190,100,.12),0 0 100px 50px rgba(200,170,80,.06)}
  50%{box-shadow:0 0 60px 25px rgba(220,190,100,.18),0 0 140px 70px rgba(200,170,80,.09),0 0 220px 110px rgba(150,120,50,.05)}
}

/* ═══════════════════════════════════════════
   STARS
═══════════════════════════════════════════ */
#stars{position:fixed;inset:0;z-index:1;pointer-events:none}
.star{
  position:absolute;border-radius:50%;background:#fff;
  animation:twinkle var(--td,3s) ease-in-out infinite var(--tdelay,0s);
}
@keyframes twinkle{0%,100%{opacity:.08;transform:scale(.8)}50%{opacity:.95;transform:scale(1.3)}}

/* ═══════════════════════════════════════════
   FLOATING EYES
═══════════════════════════════════════════ */
.eye{
  position:fixed;z-index:3;pointer-events:none;
  animation:eyedrift var(--ed,10s) ease-in-out infinite var(--edelay,0s);
}
.eye-ball{
  width:var(--ew,20px);height:calc(var(--ew,20px)*.5);
  background:radial-gradient(ellipse at 40% 40%,#ff3300,#cc0000 50%,#500000);
  border-radius:50%;
  box-shadow:0 0 8px 3px rgba(255,50,0,.7),0 0 18px 7px rgba(180,0,0,.35);
  animation:blink var(--blink,5s) ease-in-out infinite var(--edelay,0s);
}
@keyframes blink{0%,88%,100%{transform:scaleY(1)}93%{transform:scaleY(.06)}}
@keyframes eyedrift{
  0%,100%{transform:translate(0,0) rotate(0deg)}
  33%{transform:translate(5px,-8px) rotate(2deg)}
  66%{transform:translate(-4px,5px) rotate(-1deg)}
}

/* ═══════════════════════════════════════════
   BATS
═══════════════════════════════════════════ */
.bat{
  position:fixed;z-index:4;pointer-events:none;
  font-size:var(--bs,1.2rem);
  filter:brightness(.35) sepia(1) hue-rotate(300deg);
  animation:batpath var(--bd,15s) ease-in-out infinite var(--bdelay,0s);
}
@keyframes batpath{
  0%{transform:translate(0,0) scaleX(1)}
  20%{transform:translate(70px,-35px) scaleX(-1)}
  40%{transform:translate(140px,15px) scaleX(-1)}
  60%{transform:translate(100px,-50px) scaleX(1)}
  80%{transform:translate(40px,10px) scaleX(1)}
  100%{transform:translate(0,0) scaleX(1)}
}

/* ═══════════════════════════════════════════
   CROWS
═══════════════════════════════════════════ */
.crow{
  position:fixed;z-index:4;pointer-events:none;
  font-size:var(--cs,1rem);
  animation:crowfly var(--cd,20s) linear infinite var(--cdelay,0s);
  filter:brightness(.3);
}
@keyframes crowfly{
  0%{transform:translateX(-80px) translateY(0)}
  100%{transform:translateX(110vw) translateY(var(--cy,-20px))}
}

/* ═══════════════════════════════════════════
   FOG
═══════════════════════════════════════════ */
.fog{
  position:fixed;z-index:5;pointer-events:none;
  bottom:0;left:-30%;width:160%;
  height:var(--fh,200px);
  background:linear-gradient(transparent 0%,rgba(30,10,40,.35) 50%,rgba(15,5,25,.55) 100%);
  filter:blur(12px);
  animation:fogdrift var(--fd,30s) linear infinite var(--fdelay,0s);
  opacity:var(--fo,.7);
}
@keyframes fogdrift{0%{transform:translateX(0)}100%{transform:translateX(20%)}}

/* ═══════════════════════════════════════════
   DEAD TREES
═══════════════════════════════════════════ */
#trees{
  position:fixed;bottom:0;left:0;right:0;z-index:6;
  display:flex;justify-content:space-between;align-items:flex-end;
  pointer-events:none;padding:0 5px;
}
.tree-svg{
  opacity:.2;filter:sepia(1) hue-rotate(260deg) brightness(.3);
  width:var(--tw,80px);height:var(--th,180px);
  flex-shrink:0;
}

/* ═══════════════════════════════════════════
   LIGHTNING
═══════════════════════════════════════════ */
#lightning{
  position:fixed;inset:0;z-index:7;pointer-events:none;
  background:rgba(200,180,255,.03);
  opacity:0;
  animation:lightning 12s ease-in-out infinite 4s;
}
@keyframes lightning{
  0%,95%,100%{opacity:0}
  96%{opacity:.6}97%{opacity:0}98%{opacity:.4}99%{opacity:0}
}

/* ═══════════════════════════════════════════
   MAIN CONTENT
═══════════════════════════════════════════ */
#content{
  position:relative;z-index:10;
  min-height:100vh;
  display:flex;flex-direction:column;align-items:center;
  padding:20px 16px 160px;
}

/* ═══════════════════════════════════════════
   HEADER
═══════════════════════════════════════════ */
#header{text-align:center;margin-top:140px;margin-bottom:8px}

.bot-name{
  font-family:'UnifrakturMaguntia',cursive;
  font-size:clamp(3rem,10vw,6rem);
  color:var(--bone);
  text-shadow:
    0 0 20px var(--blood),
    0 0 45px rgba(139,0,0,.4),
    3px 3px 0 #000,
    -1px -1px 0 #1a0a1a;
  letter-spacing:6px;
  animation:nameglow 4s ease-in-out infinite;
  display:block;
}
@keyframes nameglow{
  0%,100%{text-shadow:0 0 20px var(--blood),0 0 45px rgba(139,0,0,.4),3px 3px 0 #000}
  50%{text-shadow:0 0 35px rgba(220,0,0,.9),0 0 70px rgba(180,0,0,.5),3px 3px 0 #000,0 0 100px rgba(200,0,0,.15)}
}

.bot-sub{
  font-family:'Noto Kufi Arabic',sans-serif;
  font-size:.8rem;color:#6b3a4a;letter-spacing:8px;
  margin-top:6px;text-transform:uppercase;
}

/* skull divider */
.skull-div{
  width:min(380px,90%);margin:14px auto;
  display:flex;align-items:center;gap:10px;
}
.skull-div::before,.skull-div::after{
  content:'';flex:1;height:1px;
  background:linear-gradient(90deg,transparent,var(--blood));
}
.skull-div::after{background:linear-gradient(90deg,var(--blood),transparent)}
.skull-div span{color:var(--blood);font-size:1.1rem}

/* ═══════════════════════════════════════════
   STATUS PILL
═══════════════════════════════════════════ */
.status-pill{
  display:inline-flex;align-items:center;gap:10px;
  background:rgba(139,0,0,.08);
  border:1px solid rgba(139,0,0,.25);
  padding:7px 18px;margin-bottom:24px;
  font-family:'Noto Kufi Arabic',sans-serif;font-size:.82rem;
  color:var(--bone);
}
.pulse-dot{
  width:9px;height:9px;border-radius:50%;
  background:#00ff55;
  box-shadow:0 0 8px #00ff55,0 0 15px rgba(0,255,85,.4);
  animation:pulsedot 1.8s ease-in-out infinite;
}
@keyframes pulsedot{0%,100%{transform:scale(1)}50%{transform:scale(1.5);opacity:.6}}

/* ═══════════════════════════════════════════
   UPTIME CRYPT
═══════════════════════════════════════════ */
.uptime-crypt{
  position:relative;
  background:linear-gradient(160deg,rgba(25,12,30,.95),rgba(15,7,22,.98));
  border:1px solid var(--border);
  padding:24px 32px;
  margin-bottom:24px;
  min-width:min(320px,90vw);
  text-align:center;
}
.uptime-crypt::before{
  content:'⏳ منذ بدأت اللعنة ⏳';
  position:absolute;top:-11px;left:50%;transform:translateX(-50%);
  background:var(--bg);padding:0 14px;
  font-family:'Noto Kufi Arabic',sans-serif;font-size:.68rem;
  color:var(--muted);letter-spacing:2px;white-space:nowrap;
}
.uptime-crypt::after{
  content:'';position:absolute;inset:0;
  background:radial-gradient(ellipse at 50% 0%,rgba(139,0,0,.07),transparent 70%);
  pointer-events:none;
}
.uptime-row{
  display:flex;gap:6px;justify-content:center;align-items:center;
}
.ut{
  display:flex;flex-direction:column;align-items:center;
  background:rgba(139,0,0,.08);
  border:1px solid rgba(139,0,0,.18);
  padding:9px 14px;min-width:58px;
}
.ut-n{
  font-family:'Space Mono',monospace;
  font-size:clamp(1.3rem,4vw,1.7rem);font-weight:700;
  color:var(--bone);
  text-shadow:0 0 12px var(--blood);
}
.ut-l{font-family:'Noto Kufi Arabic',sans-serif;font-size:.6rem;color:var(--muted);margin-top:3px}
.ut-sep{color:rgba(139,0,0,.5);font-size:1.4rem;padding-bottom:14px}

/* ═══════════════════════════════════════════
   STATS TOMBS
═══════════════════════════════════════════ */
.stats-row{
  display:flex;gap:12px;flex-wrap:wrap;
  justify-content:center;margin-bottom:28px;
}
.stat-t{
  background:linear-gradient(160deg,rgba(30,15,38,.9),rgba(18,8,24,.95));
  border:1px solid var(--border);
  padding:12px 18px;min-width:90px;text-align:center;
  position:relative;
  clip-path:polygon(0 10px,10px 0,calc(100% - 10px) 0,100% 10px,100% 100%,0 100%);
  transition:transform .25s,border-color .25s;
}
.stat-t:hover{transform:translateY(-4px);border-color:var(--blood)}
.stat-t::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 50% 0%,rgba(139,0,0,.08),transparent 70%);pointer-events:none}
.stat-v{
  font-family:'Space Mono',monospace;font-size:1.3rem;font-weight:700;
  color:var(--bone);text-shadow:0 0 10px var(--blood);display:block;
}
.stat-k{font-family:'Noto Kufi Arabic',sans-serif;font-size:.65rem;color:var(--muted);letter-spacing:2px;margin-top:4px;display:block}

/* ═══════════════════════════════════════════
   GRAVEYARD
═══════════════════════════════════════════ */
#graveyard{
  display:flex;gap:clamp(16px,4vw,50px);
  align-items:flex-end;justify-content:center;
  flex-wrap:wrap;margin:16px 0 36px;
  padding:0 12px;
}

/* ── GRAVE WRAP ── */
.grave-wrap{
  display:flex;flex-direction:column;align-items:center;
  text-decoration:none;cursor:pointer;
  animation:gravehover var(--gf,6s) ease-in-out infinite var(--gfd,0s);
  transition:filter .3s;
  position:relative;
}
.grave-wrap:hover{filter:drop-shadow(0 0 18px var(--blood))}
@keyframes gravehover{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}

/* ── GRAVE STONE ── */
.g-stone{
  width:clamp(88px,17vw,135px);
  background:linear-gradient(160deg,#2e1e38 0%,#1c1025 50%,#281530 100%);
  border:2px solid #3d2550;border-bottom:none;
  min-height:clamp(115px,22vw,165px);
  position:relative;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:7px;padding:18px 10px 14px;
  overflow:hidden;
}
/* arched top */
.g-stone::before{
  content:'';position:absolute;
  top:-2px;left:-2px;right:-2px;
  height:55%;
  background:inherit;
  border:2px solid #3d2550;border-bottom:none;
  border-radius:50% 50% 0 0 / 45% 45% 0 0;
  z-index:1;
}
/* texture */
.g-stone::after{
  content:'';position:absolute;inset:0;
  background:
    repeating-linear-gradient(
      180deg,
      transparent,transparent 8px,
      rgba(255,255,255,.008) 8px,rgba(255,255,255,.008) 9px
    );
  pointer-events:none;
}
/* moss bottom */
.g-moss{
  position:absolute;bottom:0;left:0;right:0;
  height:30%;
  background:linear-gradient(transparent,rgba(10,40,10,.45));
  pointer-events:none;z-index:2;
}
/* cracks */
.g-crack{
  position:absolute;top:30%;left:20%;
  width:1px;height:40%;
  background:linear-gradient(180deg,transparent,rgba(255,255,255,.06),transparent);
  transform:rotate(8deg);z-index:3;
}
.g-crack::after{
  content:'';position:absolute;top:40%;left:0;
  width:15px;height:1px;
  background:rgba(255,255,255,.04);transform:rotate(-40deg);
}

/* icon */
.g-icon{
  font-size:clamp(1.9rem,5vw,2.9rem);
  position:relative;z-index:4;
  filter:drop-shadow(0 0 8px var(--blood));
  animation:iconpulse var(--gf,6s) ease-in-out infinite var(--gfd,0s);
}
@keyframes iconpulse{0%,100%{filter:drop-shadow(0 0 6px var(--blood))}50%{filter:drop-shadow(0 0 14px rgba(220,0,0,.9))}}

/* label */
.g-label{
  font-family:'Noto Kufi Arabic',sans-serif;font-weight:900;
  font-size:clamp(.72rem,2vw,.9rem);
  color:var(--bone);
  text-shadow:0 0 8px var(--blood);
  position:relative;z-index:4;letter-spacing:3px;
}

/* counter */
.g-counter{
  position:relative;z-index:4;
  font-family:'Space Mono',monospace;font-size:clamp(.5rem,1.4vw,.66rem);
  color:#555;background:rgba(0,0,0,.45);
  border:1px solid #2a1a2a;padding:2px 7px;letter-spacing:1px;
}

/* smoke particles */
.g-smoke{position:absolute;bottom:100%;left:50%;transform:translateX(-50%);width:50px;pointer-events:none}
.smoke-p{
  position:absolute;border-radius:50%;
  background:rgba(80,40,100,.25);
  width:var(--sw,8px);height:var(--sw,8px);
  animation:smokeup var(--sd,3.5s) ease-out infinite var(--sdelay,0s);
}
@keyframes smokeup{
  0%{opacity:.5;transform:translateX(0) translateY(0) scale(1)}
  100%{opacity:0;transform:translateX(var(--sx,8px)) translateY(-70px) scale(3.5)}
}

/* ── GRAVE BASE ── */
.g-base{
  width:100%;height:12px;
  background:linear-gradient(180deg,#2a1830,#180f20);
  border:1px solid #3d2550;border-top:none;
  position:relative;
}
.g-base::after{
  content:'';position:absolute;
  bottom:-5px;left:-7px;right:-7px;height:7px;
  background:#120d18;
  border-radius:0 0 3px 3px;
  border:1px solid #2a1a30;border-top:none;
}

/* ── GRAVE DIRT ── */
.g-dirt{
  width:100%;height:clamp(55px,11vw,85px);
  background:radial-gradient(ellipse 85% 55% at 50% 0%,#241520,#160f1a 55%,transparent 100%);
  position:relative;
}
.g-dirt::before{
  content:'';position:absolute;top:-9px;left:8%;right:8%;height:18px;
  background:radial-gradient(ellipse 90% 65% at 50% 50%,#381e2c,#241520);
  border-radius:50%;
}
.g-dirt::after{
  content:'〜〜';position:absolute;
  top:10px;left:28%;
  font-size:.65rem;color:#3a2535;opacity:.5;letter-spacing:2px;
}

/* ── GRAVE GLOW ── */
.g-glow{
  width:75%;height:3px;margin-top:1px;
  background:radial-gradient(ellipse,var(--gg,rgba(139,0,0,.5)) 0%,transparent 70%);
  animation:glowbreathe 3s ease-in-out infinite var(--gfd,0s);
}
@keyframes glowbreathe{0%,100%{opacity:.3}50%{opacity:1}}

/* ── PLATFORM LABEL ── */
.g-platform{
  font-family:'Noto Kufi Arabic',sans-serif;font-size:.62rem;
  color:#4a2a3a;margin-top:5px;letter-spacing:2px;
  text-align:center;
}

/* ═══════════════════════════════════════════
   DEATH REAPER SECTION
═══════════════════════════════════════════ */
#reaper-section{
  margin:8px 0 36px;text-align:center;
}
.reaper-title{
  font-family:'UnifrakturMaguntia',cursive;
  font-size:1.15rem;color:var(--blood);
  text-shadow:0 0 12px rgba(180,0,0,.6);
  letter-spacing:4px;margin-bottom:10px;
}
.reaper-link{
  display:inline-block;text-decoration:none;
  animation:reaperfloat 5s ease-in-out infinite,reapersway 9s ease-in-out infinite;
  transition:filter .3s;
}
.reaper-link:hover{filter:drop-shadow(0 0 25px rgba(180,0,0,.9))}
@keyframes reaperfloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
@keyframes reapersway{0%,100%{transform:rotate(-1.5deg)}50%{transform:rotate(1.5deg)}}
.reaper-emoji{
  font-size:clamp(5rem,16vw,9.5rem);display:block;
  filter:drop-shadow(0 0 20px rgba(180,0,0,.6)) brightness(.75);
  animation:reaperflicker 4s ease-in-out infinite;
}
@keyframes reaperflicker{
  0%,90%,100%{filter:drop-shadow(0 0 20px rgba(180,0,0,.6)) brightness(.75)}
  93%{filter:drop-shadow(0 0 35px rgba(220,0,0,.9)) brightness(.9)}
  96%{filter:drop-shadow(0 0 15px rgba(180,0,0,.5)) brightness(.7)}
}
.reaper-name{
  font-family:'Noto Kufi Arabic',sans-serif;font-weight:900;
  font-size:.92rem;color:var(--blood);
  text-shadow:0 0 12px rgba(180,0,0,.7);
  margin-top:5px;letter-spacing:4px;
}
.reaper-hint{
  font-family:'Noto Kufi Arabic',sans-serif;font-size:.68rem;
  color:#4a2030;letter-spacing:2px;margin-top:4px;
}

/* ═══════════════════════════════════════════
   FOOTER
═══════════════════════════════════════════ */
.footer-text{
  font-family:'Space Mono',monospace;font-size:.62rem;
  color:#2a1a2a;letter-spacing:3px;margin-top:16px;text-align:center;
}

/* ═══════════════════════════════════════════
   GROUND BLOOD LINE
═══════════════════════════════════════════ */
#ground{
  position:fixed;bottom:0;left:0;right:0;z-index:20;
  height:3px;
  background:linear-gradient(90deg,transparent,var(--blood),var(--blood),transparent);
  animation:bloodpulse 3s ease-in-out infinite;
}
@keyframes bloodpulse{0%,100%{opacity:.6}50%{opacity:1}}

/* ═══════════════════════════════════════════
   RIPPLE
═══════════════════════════════════════════ */
@keyframes ripple{0%{transform:scale(0);opacity:.8}100%{transform:scale(5);opacity:0}}
.ripple-el{
  position:fixed;border-radius:50%;
  border:2px solid var(--blood);
  width:50px;height:50px;
  margin-left:-25px;margin-top:-25px;
  animation:ripple .7s ease-out forwards;
  pointer-events:none;z-index:999;
}

/* scrollbar */
::-webkit-scrollbar{width:5px}
::-webkit-scrollbar-track{background:#050308}
::-webkit-scrollbar-thumb{background:#4a0a14;border-radius:3px}
</style>
</head>
<body>

<div id="bg-scene"></div>
<div id="moon"></div>
<div id="stars"></div>
<div id="lightning"></div>

<!-- BATS -->
<div class="bat" style="--bs:1.5rem;--bd:16s;--bdelay:0s;top:12%;right:8%">🦇</div>
<div class="bat" style="--bs:1rem;--bd:11s;--bdelay:2.5s;top:22%;left:12%">🦇</div>
<div class="bat" style="--bs:1.3rem;--bd:19s;--bdelay:5s;top:8%;left:38%">🦇</div>
<div class="bat" style="--bs:.9rem;--bd:13s;--bdelay:8s;top:18%;right:28%">🦇</div>
<div class="bat" style="--bs:1.1rem;--bd:22s;--bdelay:11s;top:30%;left:5%">🦇</div>

<!-- CROWS -->
<div class="crow" style="--cs:1.4rem;--cd:22s;--cdelay:0s;top:18%;--cy:-15px">🐦‍⬛</div>
<div class="crow" style="--cs:1.1rem;--cd:28s;--cdelay:8s;top:28%;--cy:10px">🐦‍⬛</div>

<!-- FLOATING EYES -->
<div class="eye" style="--ew:22px;--ed:10s;--edelay:0s;top:32%;left:4%"><div class="eye-ball"></div></div>
<div class="eye" style="--ew:16px;--ed:13s;--edelay:2s;top:50%;right:5%"><div class="eye-ball"></div></div>
<div class="eye" style="--ew:26px;--ed:8s;--edelay:4s;top:22%;left:2%"><div class="eye-ball"></div></div>
<div class="eye" style="--ew:14px;--ed:15s;--edelay:1s;top:42%;right:9%"><div class="eye-ball"></div></div>
<div class="eye" style="--ew:20px;--ed:9s;--edelay:6s;top:65%;left:4%"><div class="eye-ball"></div></div>
<div class="eye" style="--ew:12px;--ed:17s;--edelay:3s;top:15%;right:3%"><div class="eye-ball"></div></div>
<div class="eye" style="--ew:18px;--ed:11s;--edelay:7s;top:55%;right:95%"><div class="eye-ball"></div></div>
<div class="eye" style="--ew:24px;--ed:7s;--edelay:5s;top:75%;left:93%"><div class="eye-ball"></div></div>
<div class="eye" style="--ew:10px;--ed:20s;--edelay:9s;top:38%;left:96%"><div class="eye-ball"></div></div>

<!-- FOG -->
<div class="fog" style="--fh:180px;--fd:28s;--fdelay:0s;--fo:.65"></div>
<div class="fog" style="--fh:130px;--fd:38s;--fdelay:5s;--fo:.5"></div>
<div class="fog" style="--fh:90px;--fd:22s;--fdelay:10s;--fo:.4;bottom:50px"></div>

<!-- DEAD TREES (SVG inline) -->
<div id="trees">
  <svg class="tree-svg" style="--tw:60px;--th:160px" viewBox="0 0 60 160" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="27" y="80" width="6" height="80" fill="#3a1a2a"/>
    <line x1="30" y1="60" x2="30" y2="20" stroke="#3a1a2a" stroke-width="5"/>
    <line x1="30" y1="40" x2="8" y2="25" stroke="#3a1a2a" stroke-width="3"/>
    <line x1="30" y1="50" x2="52" y2="35" stroke="#3a1a2a" stroke-width="3"/>
    <line x1="30" y1="55" x2="12" y2="48" stroke="#3a1a2a" stroke-width="2"/>
    <line x1="30" y1="30" x2="45" y2="20" stroke="#3a1a2a" stroke-width="2"/>
  </svg>
  <svg class="tree-svg" style="--tw:50px;--th:130px" viewBox="0 0 50 130" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="22" y="65" width="6" height="65" fill="#3a1a2a"/>
    <line x1="25" y1="50" x2="25" y2="15" stroke="#3a1a2a" stroke-width="5"/>
    <line x1="25" y1="30" x2="6" y2="18" stroke="#3a1a2a" stroke-width="3"/>
    <line x1="25" y1="38" x2="44" y2="28" stroke="#3a1a2a" stroke-width="2.5"/>
    <line x1="25" y1="20" x2="10" y2="12" stroke="#3a1a2a" stroke-width="2"/>
  </svg>
  <svg class="tree-svg" style="--tw:80px;--th:200px" viewBox="0 0 80 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="36" y="100" width="8" height="100" fill="#3a1a2a"/>
    <line x1="40" y1="80" x2="40" y2="20" stroke="#3a1a2a" stroke-width="6"/>
    <line x1="40" y1="55" x2="10" y2="35" stroke="#3a1a2a" stroke-width="4"/>
    <line x1="40" y1="65" x2="70" y2="45" stroke="#3a1a2a" stroke-width="3.5"/>
    <line x1="40" y1="40" x2="15" y2="28" stroke="#3a1a2a" stroke-width="2.5"/>
    <line x1="40" y1="35" x2="62" y2="22" stroke="#3a1a2a" stroke-width="2.5"/>
    <line x1="40" y1="25" x2="28" y2="14" stroke="#3a1a2a" stroke-width="2"/>
  </svg>
  <svg class="tree-svg" style="--tw:55px;--th:150px" viewBox="0 0 55 150" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="24" y="75" width="7" height="75" fill="#3a1a2a"/>
    <line x1="27" y1="58" x2="27" y2="18" stroke="#3a1a2a" stroke-width="5"/>
    <line x1="27" y1="38" x2="7" y2="25" stroke="#3a1a2a" stroke-width="3"/>
    <line x1="27" y1="46" x2="48" y2="32" stroke="#3a1a2a" stroke-width="2.5"/>
    <line x1="27" y1="28" x2="42" y2="18" stroke="#3a1a2a" stroke-width="2"/>
  </svg>
  <svg class="tree-svg" style="--tw:45px;--th:120px" viewBox="0 0 45 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="19" y="60" width="7" height="60" fill="#3a1a2a"/>
    <line x1="22" y1="48" x2="22" y2="15" stroke="#3a1a2a" stroke-width="5"/>
    <line x1="22" y1="30" x2="5" y2="20" stroke="#3a1a2a" stroke-width="3"/>
    <line x1="22" y1="38" x2="40" y2="28" stroke="#3a1a2a" stroke-width="2.5"/>
  </svg>
</div>

<!-- MAIN CONTENT -->
<div id="content">

  <!-- HEADER -->
  <div id="header">
    <span class="bot-name">${botName}</span>
    <div class="bot-sub">مقبرة الأرواح المسجونة • لوحة الحالة</div>
  </div>

  <div class="skull-div"><span>☠</span></div>

  <!-- STATUS -->
  <div class="status-pill">
    <div class="pulse-dot"></div>
    <span>الروح حية — البوت يعمل الآن</span>
  </div>

  <!-- UPTIME -->
  <div class="uptime-crypt">
    <div class="uptime-row">
      <div class="ut"><span class="ut-n" id="ud">${String(days).padStart(2,'0')}</span><span class="ut-l">يوم</span></div>
      <span class="ut-sep">:</span>
      <div class="ut"><span class="ut-n" id="uh">${String(hours).padStart(2,'0')}</span><span class="ut-l">ساعة</span></div>
      <span class="ut-sep">:</span>
      <div class="ut"><span class="ut-n" id="um">${String(minutes).padStart(2,'0')}</span><span class="ut-l">دقيقة</span></div>
      <span class="ut-sep">:</span>
      <div class="ut"><span class="ut-n" id="us">${String(seconds).padStart(2,'0')}</span><span class="ut-l">ثانية</span></div>
    </div>
  </div>

  <!-- STATS -->
  <div class="stats-row">
    <div class="stat-t"><span class="stat-v">${cmdCount}</span><span class="stat-k">الأوامر</span></div>
    <div class="stat-t"><span class="stat-v">${evtCount}</span><span class="stat-k">الأحداث</span></div>
    <div class="stat-t"><span class="stat-v">${prefix}</span><span class="stat-k">البادئة</span></div>
    <div class="stat-t"><span class="stat-v">${version}</span><span class="stat-k">الإصدار</span></div>
  </div>

  <!-- GRAVEYARD — 4 GRAVES (no whatsapp) -->
  <div id="graveyard">

    <!-- Instagram -->
    <a class="grave-wrap" href="${ig}" target="_blank" style="--gf:5.5s;--gfd:0s">
      <div style="position:relative">
        <div class="g-smoke">
          <div class="smoke-p" style="--sw:6px;--sd:2.8s;--sdelay:0s;--sx:-8px;left:8px"></div>
          <div class="smoke-p" style="--sw:9px;--sd:3.8s;--sdelay:.9s;--sx:12px;left:18px"></div>
          <div class="smoke-p" style="--sw:7px;--sd:4.5s;--sdelay:1.8s;--sx:-5px;left:28px"></div>
        </div>
        <div class="g-stone">
          <div class="g-crack"></div>
          <div class="g-moss"></div>
          <div class="g-icon">📸</div>
          <div class="g-label">انستا</div>
          <div class="g-counter" id="c0">00:00:00</div>
        </div>
        <div class="g-base"></div>
      </div>
      <div class="g-dirt"></div>
      <div class="g-glow" style="--gg:rgba(200,0,120,.55)"></div>
      <div class="g-platform">instagram</div>
    </a>

    <!-- Facebook -->
    <a class="grave-wrap" href="${fb}" target="_blank" style="--gf:6.5s;--gfd:.6s;transform:scale(1.1)">
      <div style="position:relative">
        <div class="g-smoke">
          <div class="smoke-p" style="--sw:8px;--sd:3.2s;--sdelay:0s;--sx:10px;left:12px"></div>
          <div class="smoke-p" style="--sw:11px;--sd:4.2s;--sdelay:1.1s;--sx:-13px;left:22px"></div>
          <div class="smoke-p" style="--sw:7px;--sd:3s;--sdelay:2.2s;--sx:7px;left:30px"></div>
        </div>
        <div class="g-stone">
          <div class="g-crack"></div>
          <div class="g-moss"></div>
          <div class="g-icon">👻</div>
          <div class="g-label">فيسبوك</div>
          <div class="g-counter" id="c1">00:00:00</div>
        </div>
        <div class="g-base"></div>
      </div>
      <div class="g-dirt"></div>
      <div class="g-glow" style="--gg:rgba(0,80,210,.55)"></div>
      <div class="g-platform">facebook</div>
    </a>

    <!-- Telegram -->
    <a class="grave-wrap" href="${tg}" target="_blank" style="--gf:5s;--gfd:1.2s">
      <div style="position:relative">
        <div class="g-smoke">
          <div class="smoke-p" style="--sw:7px;--sd:3.5s;--sdelay:.4s;--sx:-9px;left:10px"></div>
          <div class="smoke-p" style="--sw:10px;--sd:4.5s;--sdelay:1.4s;--sx:11px;left:22px"></div>
        </div>
        <div class="g-stone">
          <div class="g-crack"></div>
          <div class="g-moss"></div>
          <div class="g-icon">✈️</div>
          <div class="g-label">تيليجرام</div>
          <div class="g-counter" id="c2">00:00:00</div>
        </div>
        <div class="g-base"></div>
      </div>
      <div class="g-dirt"></div>
      <div class="g-glow" style="--gg:rgba(0,150,230,.55)"></div>
      <div class="g-platform">telegram</div>
    </a>

    <!-- TikTok -->
    <a class="grave-wrap" href="${tt}" target="_blank" style="--gf:7s;--gfd:1.8s">
      <div style="position:relative">
        <div class="g-smoke">
          <div class="smoke-p" style="--sw:6px;--sd:2.6s;--sdelay:.6s;--sx:9px;left:12px"></div>
          <div class="smoke-p" style="--sw:9px;--sd:3.6s;--sdelay:1.6s;--sx:-11px;left:22px"></div>
        </div>
        <div class="g-stone">
          <div class="g-crack"></div>
          <div class="g-moss"></div>
          <div class="g-icon">🎵</div>
          <div class="g-label">تيك توك</div>
          <div class="g-counter" id="c3">00:00:00</div>
        </div>
        <div class="g-base"></div>
      </div>
      <div class="g-dirt"></div>
      <div class="g-glow" style="--gg:rgba(180,0,200,.55)"></div>
      <div class="g-platform">tiktok</div>
    </a>

  </div>

  <!-- DEATH REAPER -->
  <div id="reaper-section">
    <div class="reaper-title">☠ ${dev} — المطور ☠</div>
    <a class="reaper-link" href="${devFb}" target="_blank">
      <span class="reaper-emoji">🧙</span>
    </a>
    <div class="reaper-name">⚔ انقر لتلتقي بصاحب اللعنة ⚔</div>
    <div class="reaper-hint">اضغط على ملك الموت للوصول إلى المطور</div>
  </div>

  <div class="footer-text">☠ ${botName} v${version} • ALIVE & CURSED ☠</div>

</div>

<div id="ground"></div>

<script>
// ── STARS ──
const starsEl=document.getElementById('stars');
for(let i=0;i<150;i++){
  const s=document.createElement('div');
  s.className='star';
  const sz=Math.random()*2.2+.4;
  s.style.cssText=\`width:\${sz}px;height:\${sz}px;top:\${Math.random()*72}%;left:\${Math.random()*100}%;--td:\${1.5+Math.random()*4}s;--tdelay:-\${Math.random()*6}s;\`;
  starsEl.appendChild(s);
}

// ── LIVE UPTIME ──
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
document.querySelectorAll('.grave-wrap,.reaper-link').forEach(el=>{
  el.addEventListener('click',function(e){
    const r=document.createElement('div');
    r.className='ripple-el';
    r.style.left=e.clientX+'px';
    r.style.top=e.clientY+'px';
    document.body.appendChild(r);
    setTimeout(()=>r.remove(),800);
  });
});

// ── RANDOM EYE SPAWN ──
setInterval(()=>{
  const e=document.createElement('div');
  e.style.cssText=\`
    position:fixed;z-index:3;pointer-events:none;
    top:\${10+Math.random()*70}%;
    left:\${Math.random()*95}%;
    width:\${10+Math.random()*16}px;
    height:\${(10+Math.random()*16)*.5}px;
    background:radial-gradient(ellipse at 40% 40%,#ff3300,#cc0000 50%,#500000);
    border-radius:50%;
    box-shadow:0 0 8px 3px rgba(255,50,0,.7);
    animation:blink2 .8s ease-in-out forwards;
  \`;
  document.body.appendChild(e);
  setTimeout(()=>e.remove(),900);
},4000);

// blink2 keyframe
const style=document.createElement('style');
style.textContent='@keyframes blink2{0%{opacity:0;transform:scaleY(0)}20%{opacity:1;transform:scaleY(1)}80%{opacity:1;transform:scaleY(1)}100%{opacity:0;transform:scaleY(0)}}';
document.head.appendChild(style);
</script>
</body>
</html>`);
  });
};

// ============================================================
//  AYMAN-FCA v2.0 — Logger
//  © 2025 Ayman. All Rights Reserved.
//  جميع الحقوق محفوظة لأيمن
// ============================================================
const chalk = require("chalk");
const gradient = require("gradient-string");

const themes = [
  "blue", "dream2", "dream", "fiery", "rainbow", "pastel", "cristal", "red", "aqua", "pink", "retro", "sunlight", "teen", "summer", "flower", "ghost", "hacker"
];

function buildGradient(name) {
  const t = String(name || "").toLowerCase();
  if (t === "blue") return gradient([{ color: "#1affa3", pos: 0.2 }, { color: "cyan", pos: 0.4 }, { color: "pink", pos: 0.6 }, { color: "cyan", pos: 0.8 }, { color: "#1affa3", pos: 1 }]);
  if (t === "dream2") return gradient("blue", "pink");
  if (t === "dream") return gradient([{ color: "blue", pos: 0.2 }, { color: "pink", pos: 0.3 }, { color: "gold", pos: 0.6 }, { color: "pink", pos: 0.8 }, { color: "blue", pos: 1 }]);
  if (t === "fiery") return gradient("#fc2803", "#fc6f03", "#fcba03");
  if (t === "rainbow") return gradient.rainbow;
  if (t === "pastel") return gradient.pastel;
  if (t === "cristal") return gradient.cristal;
  if (t === "red") return gradient("red", "orange");
  if (t === "aqua") return gradient("#0030ff", "#4e6cf2");
  if (t === "pink") return gradient("#d94fff", "purple");
  if (t === "retro") return gradient.retro;
  if (t === "sunlight") return gradient("orange", "#ffff00", "#ffe600");
  if (t === "teen") return gradient.teen;
  if (t === "summer") return gradient.summer;
  if (t === "flower") return gradient("blue", "purple", "yellow", "#81ff6e");
  if (t === "ghost") return gradient.mind;
  if (t === "hacker") return gradient("#47a127", "#0eed19", "#27f231");
  return gradient("#243aff", "#4687f0", "#5800d4");
}

const themeName = themes[Math.floor(Math.random() * themes.length)];
const co = buildGradient(themeName);

// ── AYMAN-FCA Logger ─────────────────────────────
const VERSION = "1.0.0";
const AUTHOR  = "ayman";

module.exports = (text, type) => {
  const s   = String(type || "info").toLowerCase();
  const ts  = new Date().toLocaleTimeString("en-US", { hour12: false });
  if (s === "warn") {
    process.stderr.write(chalk.bold.hex("#ffaa00")(`\r[ AYMAN-FCA ⚠ ] `) + chalk.hex("#ffaa00")(`${ts} > ${text}`) + "\n");
    return;
  }
  if (s === "error") {
    process.stderr.write(chalk.bold.hex("#ff0000")(`\r[ AYMAN-FCA ✗ ] `) + chalk.hex("#ff4444")(`${ts} > ${text}`) + "\n");
    return;
  }
  if (s === "success") {
    process.stderr.write(chalk.bold.hex("#00ff88")(`\r[ AYMAN-FCA ✓ ] `) + chalk.hex("#00ff88")(`${ts} > ${text}`) + "\n");
    return;
  }
  if (s === "info") {
    process.stderr.write(chalk.bold(co(`\r[ AYMAN-FCA v${VERSION} by ${AUTHOR} ] `)) + chalk.white(`${ts} > ${text}`) + "\n");
    return;
  }
  process.stderr.write(chalk.bold(co(`\r[ AYMAN-FCA ${s.toUpperCase()} ] `)) + `${ts} > ${text}\n`);
};

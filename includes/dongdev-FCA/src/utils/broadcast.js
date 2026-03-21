// ============================================================
//  AYMAN-FCA — Broadcast
//  مكتبة KIRA بوت | المطور: Ayman
//  إرسال رسالة لمجموعات/أشخاص متعددين مع rate limiting
// ============================================================
"use strict";

const logger = require("../../func/logger");

const delay = ms => new Promise(r => setTimeout(r, ms));

async function broadcast(api, threadIDs, message, options = {}) {
  const delayMs     = typeof options.delayMs === "number" ? options.delayMs : 1000;
  const onResult    = typeof options.onResult === "function" ? options.onResult : null;
  const retries     = typeof options.retries  === "number"  ? options.retries  : 1;

  if (!api?.sendMessage) throw new Error("broadcast: api.sendMessage مطلوب");

  const ids     = Array.isArray(threadIDs) ? threadIDs : [threadIDs];
  const results = [];
  let sent = 0, failed = 0;

  for (const id of ids) {
    let lastErr;
    let ok = false;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await api.sendMessage(message, id);
        results.push({ threadID: id, ok: true, res });
        if (onResult) onResult(null, { threadID: id, ok: true, res });
        ok = true;
        sent++;
        break;
      } catch (e) {
        lastErr = e;
        if (attempt < retries) await delay(1500);
      }
    }

    if (!ok) {
      const errMsg = lastErr?.error || lastErr?.message || String(lastErr);
      logger(`[ KIRA ] broadcast فشل لـ ${id}: ${errMsg}`, "warn");
      results.push({ threadID: id, ok: false, error: lastErr });
      if (onResult) onResult(lastErr, { threadID: id, ok: false });
      failed++;
    }

    if (delayMs > 0) await delay(delayMs);
  }

  logger(`[ KIRA ] broadcast انتهى: ${sent} نجح، ${failed} فشل`, "info");
  return results;
}

module.exports = broadcast;

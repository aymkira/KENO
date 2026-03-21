
// ============================================================
//  AYMAN-FCA — Notes (Messenger)
//  مكتبة KIRA بوت | المطور: Ayman
//  مستوحى من ws3-fca
// ============================================================
"use strict";

const logger = require("../../../func/logger");

module.exports = function (defaultFuncs, api, ctx) {

  function checkNote(callback) {
    if (typeof callback !== "function") callback = () => {};
    const form = {
      fb_api_caller_class: "RelayModern",
      fb_api_req_friendly_name: "MWInboxTrayNoteCreationDialogQuery",
      variables: JSON.stringify({ scale: 2 }),
      doc_id: "30899655739648624"
    };
    defaultFuncs.post("https://www.facebook.com/api/graphql/", ctx.jar, form)
      .then(res => res.data || res)
      .then(resData => {
        if (resData?.errors) throw resData.errors[0];
        callback(null, resData?.data?.viewer?.actor?.msgr_user_rich_status || null);
      })
      .catch(err => { logger(`[ KIRA ] notes.checkNote: ${err?.message || err}`, "error"); callback(err); });
  }

  function createNote(text, privacy = "EVERYONE", callback) {
    if (typeof privacy === "function") { callback = privacy; privacy = "EVERYONE"; }
    if (typeof callback !== "function") callback = () => {};
    const form = {
      fb_api_caller_class: "RelayModern",
      fb_api_req_friendly_name: "MWInboxTrayNoteCreationDialogCreationStepContentMutation",
      variables: JSON.stringify({
        input: {
          client_mutation_id: String(Math.round(Math.random() * 10)),
          actor_id: ctx.userID,
          description: text,
          duration: 86400,
          note_type: "TEXT_NOTE",
          privacy,
          session_id: require("../../utils/format").generateOfflineThreadingID?.() || String(Date.now())
        }
      }),
      doc_id: "24060573783603122"
    };
    defaultFuncs.post("https://www.facebook.com/api/graphql/", ctx.jar, form)
      .then(res => res.data || res)
      .then(resData => {
        if (resData?.errors) throw resData.errors[0];
        const status = resData?.data?.xfb_rich_status_create?.status;
        if (!status) throw new Error("لم يُعثر على حالة النوت في الرد");
        callback(null, status);
      })
      .catch(err => { logger(`[ KIRA ] notes.createNote: ${err?.message || err}`, "error"); callback(err); });
  }

  function deleteNote(noteID, callback) {
    if (typeof callback !== "function") callback = () => {};
    const form = {
      fb_api_caller_class: "RelayModern",
      fb_api_req_friendly_name: "useMWInboxTrayDeleteNoteMutation",
      variables: JSON.stringify({
        input: {
          client_mutation_id: String(Math.round(Math.random() * 10)),
          actor_id: ctx.userID,
          rich_status_id: noteID
        }
      }),
      doc_id: "9532619970198958"
    };
    defaultFuncs.post("https://www.facebook.com/api/graphql/", ctx.jar, form)
      .then(res => res.data || res)
      .then(resData => {
        if (resData?.errors) throw resData.errors[0];
        callback(null, resData?.data?.xfb_rich_status_delete);
      })
      .catch(err => { logger(`[ KIRA ] notes.deleteNote: ${err?.message || err}`, "error"); callback(err); });
  }

  function recreateNote(oldNoteID, newText, callback) {
    if (typeof callback !== "function") callback = () => {};
    deleteNote(oldNoteID, (err, deleted) => {
      if (err) return callback(err);
      createNote(newText, (err2, created) => {
        if (err2) return callback(err2);
        callback(null, { deleted, created });
      });
    });
  }

  return { create: createNote, delete: deleteNote, recreate: recreateNote, check: checkNote };
};

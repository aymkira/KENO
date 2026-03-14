module.exports = {
  config: {
    name: "بادئة",
    description: "ا",
    hasPermission: 2,
    usage: "ت",
    commandCategory: "نظام",
    cooldowns: 5,
  },

  async run({ api, event, args }) {
    if (!args[0]) return api.sendMessage(`البادئة الحالية: ${global.config.PREFIX}`, event.threadID);

    global.config.PREFIX = args[0];
    api.sendMessage(`تم تعديل البادئة سومي الى: ${global.config.PREFIX}`, event.threadID);
  }
};

module.exports.config = {
    name: "updateChecktt",
    eventType: ["log:unsubscribe"],
    version: "1.0.0",
    credits: "benzo",
    description: "Delete user interaction data when out",
};

module.exports.run = async ({ event, api, Threads }) => { 
    if (event.logMessageData.leftParticipantFbId == api.getCurrentUserID()) return;
    const fs = require("fs");
    const pathA = require('path');
    if (!fs.existsSync(__dirname + '/../commands/cache/checktt.json')) return;
    const thread = require('../commands/cache/checktt.json');
    const path = pathA.resolve(__dirname, '../', 'commands', 'cache', 'checktt.json');
    var threadData = thread.find(i => i.threadID == event.threadID);
    if (!threadData) return;
    const index = threadData.data.findIndex(item => item.id == event.logMessageData.leftParticipantFbId);
    if (index === -1) return;
    threadData.data.splice(index, 1);
    fs.writeFileSync(path, JSON.stringify(thread, null, 2), 'utf-8');
};

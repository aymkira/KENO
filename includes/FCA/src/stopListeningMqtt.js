// Nexus-FCA: Advanced and Safe Facebook Chat API
// stopListenMqtt.js - Stop listening to MQTT events
module.exports = function (defaultFuncs, api, ctx){
  return function stopListenMqtt() {
    if (!ctx.mqttClient) {
      throw new Error("Not connected to MQTT");
    }
    ctx.mqttClient.unsubscribe("/webrtc");
    ctx.mqttClient.unsubscribe("/rtc_multi");
    ctx.mqttClient.unsubscribe("/onevc");
    ctx.mqttClient.publish("/browser_close", "{}");
    ctx.mqttClient.end(false, (...data) => {
      ctx.mqttClient = null;
    });
  };
};
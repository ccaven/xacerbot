const { CallbackBase } = require("/home/pi/xacerbot/helper/callbacks");

async function execute (reaction, user) {}

const callback = new CallbackBase("messageReactionAdd", "messagestats", "Run analytics for messages");

callback.setExecutable(execute);

module.exports = {
    callback: callback
};
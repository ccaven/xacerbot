const { CallbackBase } = require("/home/pi/xacerbot/helper/callbacks");

async function execute (reaction, user) {}

const callback = new CallbackBase("messageReactionAdd", "reactionstats", "Run analytics for reactions");

callback.setExecutable(execute);

module.exports = {
    callback: callback
};
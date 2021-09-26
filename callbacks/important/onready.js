const { Client } = require("discord.js");
const { CallbackBase } = require("/home/pi/xacerbot/helper/callbacks.js");
const { initializeEmojis } = require("/home/pi/xacerbot/helper/emojis.js");

async function execute (client) {
    console.log(`Logged in as ${client.user.tag}!`);

    client.user.setPresence({ 
        activities: [
            { name: 'Byte Season 2', type: "COMPETING" },
        ], 
        status: 'idle' 
    });

    client.user.setAFK(true);  

    /*
    await require("/home/pi/xacerbot/helper/yt-trackers.js").setClient(client).catch(err => {
        console.log(err);
    });
    */

    initializeEmojis(client);
}

const callback = new CallbackBase("ready", "onready", "Send a logged in message");

callback.setExecutable(execute);

module.exports = {
    callback: callback
};
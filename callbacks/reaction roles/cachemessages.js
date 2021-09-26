const { Client, TextChannel } = require("discord.js");
const { runQuery } = require("/home/pi/xacerbot/database.js");

const { CallbackBase } = require("/home/pi/xacerbot/helper/callbacks");

/**
 * 
 * @param {Client} client 
 */
async function execute (client) {
    // Get all reaction role messages and cache them
    const { rows } = await runQuery("SELECT channel_id, message_id FROM reaction_roles");
        
    rows.forEach(async row => {
        const channelId = row.channel_id;
        const messageId = row.message_id;
        
        /**
         * @type {TextChannel}
         */
        const channel = await client.channels.fetch(channelId);

        if (channel) {
            channel.messages.fetch(messageId, { cache: true });
        }
    });
} 

const callback = new CallbackBase("ready", "cachemessages", "Cache the reaction role messages");

callback.setExecutable(execute);

module.exports = {
    callback: callback
};
const { Client, TextChannel } = require("discord.js");
const { runQuery } = require("/home/pi/xacerbot/database.js");

module.exports = {
    data: {
        name: "cachemessages",
        description: "Cache the reaction roles",
        callback: "ready",
        priority: 1
    },
    initialize () {},
    /**
     * 
     * @param {Client} client 
     */
    async execute (client) {
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
};
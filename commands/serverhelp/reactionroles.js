const djs = require("discord.js");
const db = require("/home/pi/xacerbot/database.js");

module.exports = {
    data: {
        name: "reactionrole",
        description: "Add reaction roles to a specifc message"
    },
    /**
     * Execute the command
     * @param {{client: djs.Client, commands: djs.Collection<string, object>, message: djs.Message}} context 
     * @param {String} messageId - The ID of the message
     * @param {String} emojiId - The ID of the specific reaction
     * @param {String} roleId - The ID of the specific role
    */
    async execute (context, messageId, emojiName, roleId) {
        const { message } = context;
        
        const guild = message.guild;
        const guildId = guild.id;

        if (messageId == "remove") {
            db.runQuery("REMOVE FROM reaction_roles WHERE server_id = $1", [guildId]);
            message.channel.send("Removed server reaction roles.");
            return;
        }       

        const emoji = (await guild.emojis.fetch()).find(e => e.name == emojiName);

        if (!emoji) {
            message.reply("Emoji not found");
            return;
        }

        const emojiId = emoji.id;

        // Try to select
        const query = await db.runQuery("SELECT * FROM reaction_roles WHERE server_id = $1 AND message_id = $2 AND emoji_id = $3;", [guildId, messageId, emojiId]);

        if (query.rowCount > 0) {
            // Update
            await db.runQuery("UPDATE reaction_roles SET role_id = $1 WHERE server_id = $2 AND message_id = $3 AND emoji_id = $4;", [roleId, guildId, messageId, emojiId]);
            message.channel.send("Updated existing reaction role listener.");
        } else {
            // Insert
            await db.addRow("reaction_roles", [guildId, messageId, emojiId, roleId]);
            message.channel.send("Added new reaction role listener.");
        }

    }
};
const { Message, TextChannel } = require("discord.js");
const { runQuery, addRow } = require("/home/pi/xacerbot/database.js");

module.exports = {
    data: {
        name: "reactionrole",
        description: "Add reaction roles to a specifc message"
    },
    /**
     * Execute the command
     * @param {{message: Message}} context 
     * @param {String} messageLink - The ID of the message
     * @param {String} emojiId - The ID of the specific reaction
     * @param {String} roleId - The ID of the specific role
    */
    async execute (context, messageLink, emojiName, roleId) {
        const { message } = context;

        const guild = message.guild;
        const guildId = guild.id;

        if (messageLink == "remove") {
            if (emojiName) {
                const { rowCount } = await runQuery("DELETE FROM reaction_roles WHERE server_id = $1 AND message_id = $2", [guildId, emojiName]);
                message.channel.send(`Removed ${rowCount} reaction roles from ${emojiName}.`);
            } else {
                const { rowCount } = await runQuery("DELETE FROM reaction_roles WHERE server_id = $1", [guildId]);
                message.channel.send(`Removed ${rowCount} server reaction roles.`);
            }
            return;
        }

        const targetServerId = messageLink.split("channels/")[1].split("/")[0];
        const targetChannelId = messageLink.split(targetServerId + "/")[1].split("/")[0];
        const targetMessageId = messageLink.split(targetChannelId + "/")[1].split("/")[0];


        if (targetServerId != guildId) {
            message.reply("That message isn't in the server!");
            return;
        }

        /**
         * @type {TextChannel}
         */
        const targetChannel = (await guild.channels.fetch()).find(c => c.id == targetChannelId);
        
        if (!targetChannel) {
            message.reply("That channel doesn't exist!");
            return;
        }

        if (targetChannel.isVoice()) {
            message.reply(`That channel is not a text channel!`);
            return;
        }

        const targetMessage = (await targetChannel.messages.fetch()).find(m => m.id == targetMessageId);

        if (!targetMessage) {
            message.reply("That message doesn't exist!");
            return;
        }

        const emoji = (await guild.emojis.fetch()).find(e => e.name == emojiName || e.id == emojiName);

        if (!emoji) {
            message.reply("That emoji doesn't exist!");
            return;
        }

        targetMessage.react(emoji);

        const botrole = guild.me.roles.botRole;
        const role = (await guild.roles.fetch()).find(r => r.id == roleId);

        if (!role) {
            message.reply("That role doesn't exist!");
            return;
        }
        if (role.position > botrole.position) {
            message.reply("I can't access that role!");
            return;
        }

        // Find message and react
        const emojiId = emoji.id;

        // Try to select
        const query = await runQuery("SELECT * FROM reaction_roles WHERE server_id = $1 AND message_id = $2 AND emoji_id = $3;", [guildId, targetMessageId, emojiId]);

        if (query.rowCount > 0) {
            // Update
            await runQuery("UPDATE reaction_roles SET role_id = $1 WHERE server_id = $2 AND message_id = $3 AND emoji_id = $4;", [roleId, guildId, targetMessageId, emojiId]);
            message.channel.send("Updated existing reaction role listener.");
        } else {
            // Insert
            await runQuery("INSERT INTO reaction_roles (server_id, channel_id, message_id, role_id, emoji_id) VALUES ($1, $2, $3, $4, $5)", 
                [guildId, targetMessage.channel.id, targetMessage.id, roleId, emojiId]);
            message.channel.send("Added new reaction role listener.");
        }

    }
};
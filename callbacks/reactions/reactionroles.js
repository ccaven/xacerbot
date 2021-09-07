
const db = require("../database.js");
const djs = require("discord.js");

module.exports = {
    data: {
        name: "reaction-roles",
        description: "Follow reactions",
        callback: "messageReactionAdd",
        priority: 2
    },
    initialize () {},
    /**
     * Execute the callback
     * @param {djs.MessageReaction} reaction 
     * @param {djs.User} user
     */
    async execute (reaction, user) {
        // Needed info
        const emojiId = reaction.emoji.id;
        const messageId = reaction.message.id;
        const guildId = reaction.message.guild.id;

        // Query for reaction roles
        const query = await db.runQuery("SELECT role_id FROM reaction_roles WHERE server_id = $1 AND message_id = $2 AND emoji_id = $3;", [guildId, messageId, emojiId]);

        if (query.rowCount > 0) {
            const guild = reaction.message.guild;
            const roleId = query.rows[0].role_id;

            const role = (await guild.roles.fetch()).find(r => r.id == roleId);

            if (role) {
                // Get member
                const userId = user.id;
                const member = (await guild.members.fetch()).get(userId);

                await member.roles.add(role);
                console.log(`Added ${role.name} to ${member.user.tag}.`);   
            }
        }
    }
};
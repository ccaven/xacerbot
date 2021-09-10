
const { Guild, Permissions, MessageEmbed } = require("discord.js");

module.exports = {
    data: {
        name: "checkperms",
        description: "Make sure the bot has needed permissions",
        callback: "guildCreate",
        priority: 1
    },
    initialize () {},
    /**
     * 
     * @param {Guild} guild 
     */
    async execute (guild) {
        
        const clientMember = guild.me;

        const permissionInteger = process.env.BOT_PERMISSION_INTEGER;

        const requiredPerms = new Permissions(process.env.BOT_PERMISSION_INTEGER);

        const botPerms = clientMember.permissions;

        let leave = false;
        let reason = "";

        if (!guild.me.roles.botRole) {
            leave = true;
            reason = `Please use the correct invite link!`;
        }
        else if (botPerms.equals(requiredPerms)) {
            leave = true;
            reason = `Please use the invite link with the correct permissions!`;
        }

        if (leave) {

            const embed = new MessageEmbed();
            embed.setTitle("There's something wrong...");
            embed.setDescription("I've detected something wrong, so I'm leaving the server.");
            embed.addField("Reason: ", reason);
            embed.addField("Correct invite link", `https://discordapp.com/oauth2/authorize?client_id=${guild.client.user.id}&scope=bot&permissions=${permissionInteger}`)

            let channel;

            if (guild.systemChannel) channel = guild.systemChannel;
            if (!channel) channel = (await guild.channels.fetch()).find(c => c.name.toLowerCase() == "general");
            if (!channel) channel = (await guild.channels.fetch()).find(c => c.permissionsFor(guild.me).has("SEND_MESSAGES"));

            if (channel) {
                channel.send({
                    embeds: [embed]
                });
            }
        }
    }
};
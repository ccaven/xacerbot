const djs = require("discord.js");

module.exports = {
    data: {
        name: "ban",
        description: "ban a user"
    },
    /**
     * Execute the command
     * @param {{client: djs.Client, commands: djs.Collection<string, object>, message: djs.Message}} context 
     */
    async execute (context) {
        const { message } = context;

        if (message.mentions.everyone) {
            await message.channel.send("Did you really just try to ban everyone?");
            return;
        }

        message.mentions.members.forEach(async member => { 
            if (member.bannable) await member.ban(); 
            else { 
                await message.channel.send(`I can't ban **${member.user.tag}**.`);
            }
        });
    }
};
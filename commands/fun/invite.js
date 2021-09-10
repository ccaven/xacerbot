const djs = require("discord.js");

module.exports = {
    data: {
        name: "invite",
        description: "Get the invite link of the bot"
    },
    /**
     * Execute the command
     * @param {{client: djs.Client, commands: djs.Collection<string, object>, message: djs.Message}} context 
     * @param {String} commandName 
     */
    async execute(context) {
        const {message, client} = context;
        const clientId = client.user.id;
        const permissionInteger = process.env.BOT_PERMISSION_INTEGER;
        message.reply(`https://discordapp.com/oauth2/authorize?client_id=${clientId}&scope=bot&permissions=${permissionInteger}`);
    }
};
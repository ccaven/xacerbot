const djs = require("discord.js");

module.exports = {
    data: {
        name: "say",
        description: "Get the bot to say something"
    },
    /**
     * Execute the command
     * @param {{client: djs.Client, commands: djs.Collection<string, object>, message: djs.Message}} context 
     * @param {String} commandName 
     */
    async execute(context, string) {
        const { message } = context;

        if (!string || !string.length) {
            await message.reply("What do you want me to say?");
            return;
        }

        string = string.replace(/\\/g, "");

        if (!string.length) {
            await message.reply("Imagine having only backslashes :joy:");
            return;
        }
        
        while (string.includes("@everyone") || string.includes("@here")) {
            string = string.replace("@everyone", "everyone");
            string = string.replace("@here", "here");
        }

        if (!string.length) {
            await message.reply("Don't ping everyone/here nerd.");
            return;
        }

        await message.channel.send(string).catch(err => {
            message.channel.send(err.message);
        });
    }
};
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
    async execute(context, ...args) {
        const { message } = context;
        
        if (!args.length) {
            await message.reply("What do you want me to say?");
            return;
        }

        string = args.join(" ");

        if (!string || !string.length) {
            await message.reply("What do you want me to say?");
            return;
        }

        string = string.replace(/\\/g, "");

        if (!string.length) {
            await message.reply("Imagine having only backslashes :joy:");
            return;
        }
        
        // Remove everyone and here pings
        while (string.includes("@everyone") || string.includes("@here")) {
            string = string.replace("@everyone", "everyone");
            string = string.replace("@here", "here");
        }

        // Remove role pings


        if (!string.length) {
            await message.reply("Don't ping everyone/here nerd.");
            return;
        }

        await message.channel.send(string).catch(err => {
            message.channel.send(err.message);
        });
    }
};
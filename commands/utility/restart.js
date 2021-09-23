
const { Message } = require("discord.js");
const fs = require("fs");

module.exports = {
    data: {
        name: "restart",
        description: "Restart the bot"
    },
    /**
     * Execute the command
     * @param {{message: Message}} context 
    */
    async execute(context) {
        const { message } = context;
        if (message.author.id == "683115379899498526") {
            await message.reply("Restarting bot...");
            process.exit(0);
        }   
    }
};
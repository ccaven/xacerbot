const { Message } = require("discord.js");

const subcommands = {
    /**
     * 
     * @param {{message: Message}} context 
     * @param {String} value 
     */
    "channel": async (context, value) => {

        

    },
    "use": async (context, value) => {

    }
};

module.exports = {
    data: {
        name: "modset",
        description: "Set moderation info about the server"
    },
    async execute (context, subcommand, ...values) {
        try {
            if (subcommands.hasOwnProperty(subcommand)) {
                subcommands[subcommand](context, ...values);
            }
        } catch (e) {
            context.message.reply(`Error: ${e.message}`);
        }
    }
};
const { Message, Client } = require("discord.js");
// const { createCanvas, loadImage } = require("canvas");

const subcommands = {

    /**
     * @param {{ message: Message, client: Client }} context 
     * @param {number} amount
     */
    thicc: async (context, amount) => {
        const { message } = context;
        
        const attachments = message.attachments;

        if (attachments.length) {
            await message.reply("You must have an attachment!");
            return;
        }

        await message.channel.send(`Making it ${number}x more THICC...`);

        amount = parseFloat(amount);
        

    }

};

module.exports = {
    data: {
        name: "memeify",
        description: "Make a meme"
    },
    /**
     * 
     * @param {{ message: Message, client: Client }} context 
     * @param {string} subcommand 
     * @param  {...string} args 
     */
    async execute(context, subcommand, ...args) {
        context.message.reply("Not implemented yet. xacer will work on it soon:tm:");
    }
};
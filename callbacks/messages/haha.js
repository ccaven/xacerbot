const { Message } = require("discord.js");

module.exports = {
    data: {
        name: "haha",
        description: "haha",
        callback: "messageCreate",
        priority: -1
    },
    initialize () {},
    /**
     * @param {Message} message
     */
    async execute (message) {
        if (!message.author.bot && message.content.toLowerCase() == "haha") {
            setTimeout(() => message.channel.send(message.content), Math.random() * 5000 + 1000);
        }
    }
};
module.exports = {
    data: {
        name: "die",
        description: "Kill the bot",
    },
    async execute (context) {
        const { message } = context;
        
        const isCavan = message.author.id == "694345138549424130";

        message.reply(isCavan ? "I'm dead!" : "no");
    }
};
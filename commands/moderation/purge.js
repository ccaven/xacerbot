const djs = require("discord.js");

module.exports = {
    data: {
        name: "purge",
        description: "Bulk delete messages from a channel."
    },
    /**
     * Execute the command
     * @param {{client: djs.Client, commands: djs.Collection<string, object>, message: djs.Message}} context 
     * @param {number} quantity
     */
    async execute (context, quantity=0) {
        const { message } = context;

        const channel = message.channel;

        if (quantity <= 0) {
            await channel.send("Well, I didn't delete any messages...");
            return;
        }

        const toDelete = quantity;
        
        channel.bulkDelete(toDelete, false); 
    }
};
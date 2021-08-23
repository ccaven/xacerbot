const djs = require("discord.js");


module.exports = {
    data: {
        name: "eval",
        description: "Evaluate a command."
    },
    /**
     * Execute the command
     * @param {{client: djs.Client, commands: djs.Collection<string, object>, message: djs.Message}} context 
     * @param {String[]} args 
     */
     async execute(context, ...args) {
        const { message } = context;
        try {
            const evaled = JSON.stringify(eval(args.join(" ")));
            if (evaled && evaled.length) {
                const sentMessage = evaled.slice(0, Math.min(evaled.length, 1000));
                await message.channel.send("```\n" + sentMessage + "```").catch(e => {
                    console.log("Error running eval... ", e);
                });
            }
            
        } catch (e) {
            message.channel.send(e);
        }
    }
};
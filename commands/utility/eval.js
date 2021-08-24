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

        let value;

        try {
            value = eval(args.join(" "));
        } catch (e) {
            await message.channel.send(`\`\`\`${err.message}\`\`\``);
            return;
        }

        const evaled = JSON.stringify(value);

        if (evaled && evaled.length) {                
            const sentMessage = evaled.slice(0, Math.min(evaled.length, 1000));
            await message.channel.send("```\n" + sentMessage + "```");
        } else {
            await message.channel.send("\"\"");
        }       
        
    }
};
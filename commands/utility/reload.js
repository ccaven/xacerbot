const djs = require("discord.js");
const fs = require("fs");

module.exports = {
    data: {
        name: "reload",
        description: "Reload a command"
    },
    /**
     * Execute the command
     * @param {{client: djs.Client, commands: djs.Collection<string, object>, message: djs.Message}} context 
     * @param {String} name 
    */
    async execute(context, name) {
        const {message, commands} = context;

        if (!commands.has(name)) return message.reply("That command doesn't exist");

        const old = commands.get(name);
        const filename = old.filename;
        
        // Check if file exists
        fs.access(filename, () => {
            delete require.cache[require.resolve(filename)];
            const cmd = require(filename);
            commands.set(cmd.data.name, cmd);
            message.reply(`Reloaded \`${filename.split("/commands")[1]}\``);
        });
    }
};
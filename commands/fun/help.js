const djs = require("discord.js");

module.exports = {
    data: {
        name: "help",
        description: "Get the name and function of each command."
    },
    /**
     * Execute the command
     * @param {{client: djs.Client, commands: djs.Collection<string, object>, message: djs.Message}} context 
     * @param {String} commandName 
     */
    async execute(context, commandName) {

        const {message, client, commands} = context;


        if (commandName) {
            if (commands.has(commandName)) {
                const cmd = commands.get(commandName);
                const name = cmd.data.name;
                const description = cmd.data.description;

                const embed = new djs.MessageEmbed()
                    .setColor("#ff00ff")
                    .setTitle(name)
                    .setDescription(description);

                message.channel.send({ embeds: [embed] });
            } else {
                message.reply("Command not found");
            }
        } else {
            const allCommands = Array.from(commands.keys());

            message.reply("List of commands\n" + allCommands.join(", "));
        }

    }
};
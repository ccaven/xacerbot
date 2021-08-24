const djs = require("discord.js");
const fs = require("fs");

const perms = JSON.parse(fs.readFileSync("/home/pi/xacerbot/commands/commandinfo.json"));

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
    async execute(context) {
        const {message, client, commands} = context;

        const allCommands = Array.from(commands.keys());

        const cmds = {};
        const names = [];

        for (const commandName of allCommands) {
            const cmd = commands.get(commandName);

            if (!cmds[cmd.category]) {
                cmds[cmd.category] = [cmd];
                names.push(cmd.category);
            } else {
                cmds[cmd.category].push(cmd);
            }
        }

        const embeds = [];

        for (const cname of names) {
            const lc = cmds[cname];

            const embed = new djs.MessageEmbed()
                .setTitle(`${cname} Commands`);

            if (perms[cname] && perms[cname].description) {
                embed.setDescription(perms[cname].description);
            }

            for (const cmd of lc) {
                embed.addField(cmd.data.name, cmd.data.description, false);
            }

            embeds.push(embed);
        }

        message.reply({ embeds: embeds });
    

    }
};
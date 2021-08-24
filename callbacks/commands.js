require('dotenv').config();

const djs = require('discord.js');
const fs = require('fs');
const glob = require('glob');

// All commands
const commands = new djs.Collection();

// All command categories
const categories = new djs.Collection();

let perms;

module.exports = {
    data: {
        name: "commands",
        description: "Run commands on message",
        type: "message"
    },
    /**
     * Initialize the callback
     */
    initialize () {

        perms = JSON.parse(fs.readFileSync("/home/pi/xacerbot/commands/commandinfo.json"));
        console.log(perms);


        glob("/home/pi/xacerbot/commands/**/*", (err, res) => {
            // Upon result, load in that command
            const filenames = res.filter(f => f.endsWith(".js"));
            for (const filename of filenames) {
                const category = filename.split("commands/")[1].split("/").slice(0, -1);            
                const cmd = require(filename);
                cmd.filename = filename;
                cmd.category = category;
                console.log(`Loading file ${filename}...\n\tCategory ${category}\n\tName ${cmd.data.name}`);
                commands.set(cmd.data.name, cmd);
            }
        });

    },
    /**
     * Execute the callback
     * @param {djs.Message} message 
     * @param {djs.Client} client
     */
    async execute (message, client) {
        if (message.author.bot) return;

        // Get command text
        const commandText = message.content;

        // Exit if it's not a command
        if (!commandText.startsWith(process.env.BOT_PREFIX)) return;

        // Break the text down into the name and arguments
        const commandChunks = commandText
            .toLowerCase()
            .replace("\n", "")
            .match(/(?:[^\s"]+|"[^"]*")+/g)
            .map(s => s.replace(/['"]+/g, ''));

        // Extract the name from the chunks
        const commandName = commandChunks.shift().slice(2).replace(/[^a-zA-Z ]/g, "");

        if (!commands.has(commandName)) {
            await message.reply("That command doesn't exist! D:");
            return;
        }

        const cmd = commands.get(commandName);

        // Determine if user has permissions to run command
        // const permsInfo = JSON.parse(await fs.promises.readFile("/home/pi/xacerbot/commands/commandinfo.json"));
        const commandInfo = perms[cmd.category];

        if (commandInfo) {
            // Get allowed users
            /** @type {string[]} */
            const allowedUsers = commandInfo["allowed-users"];
            if (allowedUsers && !allowedUsers.includes(message.author.id)) {
                await message.reply("Only certain users can use this command.");
                return;
            }

            // Get allowed permissions
            /** @type {string[]} */
            const allowedPerms = commandInfo["allowed-permissions"];
            if (allowedPerms) {
                let allowed = false;
                for (const perm of allowedPerms) {
                    allowed |= message.member.permissions.has(djs.Permissions.FLAGS[perm]);
                }
                if (!allowed) {
                    await message.reply("You don't have permissions to run this command!");
                    return
                }     
            }
        }

        const messageContext = {
            message: message,
            commands: commands,
            client: client
        };

        await cmd.execute(messageContext, ...commandChunks).catch(e => {
            console.error(`Problem when running ${commandName}: ${e.message}`);
        });

        console.log(`Running command ${commandName} with ${commandChunks.length} arguments.`);

    }
};
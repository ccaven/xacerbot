const { Message, Collection, Permissions } = require("discord.js")
const { CallbackBase } = require("/home/pi/xacerbot/helper/callbacks");
const { runQuery } = require("/home/pi/xacerbot/database.js");
const { readFileSync } = require("fs");
const glob = require("glob");

const perms = JSON.parse(readFileSync("/home/pi/xacerbot/commands/commandinfo.json"));

const commands = new Collection();

glob("/home/pi/xacerbot/commands/**/*", (_, res) => {
    // Upon result, load in that command
    const filenames = res.filter(f => f.endsWith(".js"));
    for (const filename of filenames) {
        const category = filename.split("commands/")[1].split("/").slice(0, -1).map((s, i) => {
            if (i == 0) return s[0].toUpperCase() + s.slice(1);
            return s;
        }).join(" ");     
        const cmd = require(filename);
        cmd.filename = filename;
        cmd.category = category;
        
        // Set all aliases
        const names = cmd.data.name.split("|");
        names.forEach(name => commands.set(name, cmd));

        const query = `
        ALTER TABLE disabled_commands ADD IF NOT EXISTS ${category} BOOLEAN DEFAULT FALSE
        `;

        runQuery(query);
    }            
});

/**
 * 
 * @param {Message} message 
 */
async function execute (message) {
    if (message.author.bot) return;
    if (!message.guild) return;

    const client = message.client;
    
    // Get command text
    const commandText = message.content;

    // Exit if it's not a command
    if (!commandText.startsWith(process.env.BOT_PREFIX)) return;

    // Break the text down into the name and arguments
    const commandChunks = commandText
        .replace(/(\r\n|\n|\r)/gm, " ")
        .match(/(?:[^\s"]+|"[^"]*")+/g)
        .map(s => s.replace(/['"]+/g, ''));

    // Extract the name from the chunks
    const commandName = commandChunks.shift().slice(process.env.BOT_PREFIX.length).replace(/[^a-zA-Z ]/g, "");

    if (!commands.has(commandName)) {
        await message.reply("That command doesn't exist! D:");
        return;
    }

    const cmd = commands.get(commandName);
    
    const allowedCommand = await runQuery(`SELECT ${cmd.category} FROM disabled_commands WHERE server_id = $1`, [message.guild.id]);
    
    if (allowedCommand.rows.some(v => v[cmd.category.toLowerCase()] == true)) {
        // Command isn't allowed
        message.reply("That command isn't allowed in this server!")
        return;
    }

    // Determine if user has permissions to run command
    // const permsInfo = JSON.parse(await fs.promises.readFile("/home/pi/xacerbot/commands/commandinfo.json"));
    const commandInfo = perms[cmd.category];

    if (commandInfo && message.author.id != "683115379899498526") {
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
                allowed |= message.member.permissions.has(Permissions.FLAGS[perm]);
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

    console.log(`${message.author.tag} ran command ${commandName} with ${commandChunks.length} arguments.`);
}

const callback = new CallbackBase("messageCreate", "commands", "is a command handler");
callback.setExecutable(execute);

module.exports = {
    callback: callback
};
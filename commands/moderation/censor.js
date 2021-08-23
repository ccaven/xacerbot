const djs = require("discord.js");
const db = require("/home/pi/xacerbot/database.js");

const subcommands = {
    add: async (context, word, tier) => {
        const { message } = context;
        const guildId = message.guild.id;

        tier = tier | 0;

        if (tier < 1) tier = 1;
        if (tier > 3) tier = 3;

        // Make sure it doesn't already exist
        const results = await db.runQuery(`SELECT word FROM censors WHERE server_id = $1 AND word = $2;`, [guildId, word]);

        if (results.rowCount > 0) {
            await db.runQuery("UPDATE censors SET tier = $1 WHERE word = $2 AND server_id = $3;", [tier, word, guildId]);
            await message.channel.send("Updated censor");
        } else {
            await db.addRow("censors", [guildId.toString(), word, tier]);
            await message.channel.send("Added censor");
        }
    },
    remove: async (context, word) => {
        const { message } = context;
        const guildId = message.guild.id;

        db.runQuery(`DELETE FROM censors WHERE server_id = $1 AND word = $2;`, [guildId, word])

        message.channel.send(`Removed censor`);
    },
    removeall: async (context) => {
        const { message } = context;
        const guildId = message.guild.id;

        db.runQuery(`DELETE FROM censors WHERE server_id = $1;`, [guildId])

        message.channel.send(`Removed all censors.`);
    },
    get: async (context) => {
        const { message } = context;

        const guildId = message.guild.id;
        const guildName = message.guild.name;

        const results = await db.runQuery(`SELECT word FROM censors WHERE server_id = $1;`, [guildId]);

        const words = results.rows.map(v => v.word);
        if (words.length)
            message.channel.send(`Censors for ${guildName}\n${words.join(", ")}`);
        else
            message.channel.send("This server has no censors.");
    },
};

module.exports = {
    data: {
        name: "censor",
        description: "Add, remove, and get server censors."
    },
    async execute (context, subcommand, ...args) {
        if (subcommands.hasOwnProperty(subcommand))
            await subcommands[subcommand](context, ...args);
        else 
            context.message.reply("Subcommand not found.");
    }
};
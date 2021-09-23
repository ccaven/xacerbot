const { Message, MessageEmbed } = require("discord.js");
const { runQuery, addRow } = require("/home/pi/xacerbot/database.js");
const { addCensor, removeCensor, removeAll, getCache } = require("/home/pi/xacerbot/helper/censors.js");
const { getWebhook } = require("/home/pi/xacerbot/helper/webhooks.js");

const policeImg = "https://img.brickowl.com/files/image_cache/larger/lego-brick-1-x-4-with-police-logo-sticker-3010-25-323731.jpg";

const subcommands = {
    /**
     * 
     * @param { {message: Message} } context 
     * @param {string} word 
     * @param {number} tier 
     */
    add: async (context, word, tier) => {
        const { message } = context;
        const guildId = message.guild.id;

        tier = tier | 0;

        if (tier < 1) tier = 1;
        if (tier > 3) tier = 3;

        // Make sure it doesn't already exist
        const results = await runQuery(`SELECT word FROM censors WHERE server_id = $1 AND word = $2;`, [guildId, word]);

        if (results.rowCount > 0) {
            await runQuery("UPDATE censors SET tier = $1 WHERE word = $2 AND server_id = $3;", [tier, word, guildId]);
            
            const hook = await getWebhook(message.channel);

            const embed = new MessageEmbed();
            
            embed.setTitle(`Updated censor ${word}`);
            embed.setDescription(`This censor now has a tier of ${tier}`);

            hook.send({
                username: "Server Moderation",
                avatarURL: policeImg,
                embeds: [ embed ]
            });
        } else {
            await addRow("censors", [guildId.toString(), word, tier]);
            addCensor(guildId, word);

            const hook = await getWebhook(message.channel);

            const embed = new MessageEmbed();
            
            embed.setTitle(`Added censor ${word}`);
            embed.setDescription(`This censor has a tier of ${tier}`);

            hook.send({
                username: "Server Moderation",
                avatarURL: policeImg,
                embeds: [ embed ]
            });
        }
    },
    /**
     * 
     * @param { {message: Message} } context 
     * @param {string} word 
     */
    remove: async (context, word) => {
        const { message } = context;
        const guildId = message.guild.id;

        runQuery(`DELETE FROM censors WHERE server_id = $1 AND word = $2;`, [guildId, word])

        removeCensor(guildId, word);

        const hook = await getWebhook(message.channel);

        const embed = new MessageEmbed();
        
        embed.setTitle(`Removed censor ${word}`);
        embed.setDescription(`Hopefully you did not actually want it.`);

        hook.send({
            username: "Server Moderation",
            avatarURL: policeImg,
            embeds: [ embed ]
        });
    },
    /**
     * 
     * @param { {message: Message} } context
     */
    removeall: async (context) => {
        const { message } = context;
        const guildId = message.guild.id;

        runQuery(`DELETE FROM censors WHERE server_id = $1;`, [guildId])

        removeAll(guildId);

        const hook = await getWebhook(message.channel);

        const embed = new MessageEmbed();
        
        embed.setTitle(`Removed all censors from the server.`);
        embed.setDescription(`Be free, guild number ${guildId}!`);

        hook.send({
            username: "Server Moderation",
            avatarURL: policeImg,
            embeds: [ embed ]
        });
    },
    /**
     * 
     * @param { {message: Message} } context
     */
    get: async (context) => {
        const { message } = context;

        const guildId = message.guild.id;

        const words = getCache().get(guildId);

        const hook = await getWebhook(message.channel);

        const embed = new MessageEmbed();

        if (!words.length) {
            embed.setTitle("Your server does not have any censors!");
            embed.setDescription("Wild west, baby.");

            hook.send({
                username: "Server Moderation",
                avatarURL: policeImg,
                embeds: [ embed ]
            });
            return;
        }

        embed.setTitle(`Censors for ${message.guild.name}`);
        embed.setDescription(`In total, there are ${words.length}.`);

        embed.addField("Censors", words.map((w, i) => `${i+1}. ||${w}||`).join("\n"));

        hook.send({
            username: "Server Moderation",
            avatarURL: policeImg,
            embeds: [ embed ]
        });
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
const { Message, MessageEmbed, WebhookClient, Collection, TextChannel } = require("discord.js");
const { runQuery } = require("/home/pi/xacerbot/database.js");
const { getWebhook } = require("/home/pi/xacerbot/helper/webhooks.js");

const byteGood = "https://xacer.dev/xacerbot/byteGood.png";
const byteBad = "https://xacer.dev/xacerbot/byteBad.png";

// One hour
const timeDifference = 60 * 60 * 1000;

const subcommands = {

    /**
     * 
     * @param {{message: Message}} context 
     * @param {WebhookClient} sender
     */
    graph: async (context, sender) => {
        const { message } = context;

        sender.send({ 
            content: "Not implemented yet. xacer will work on it soon:tm:",
            username: "Byte Bot Stats",
            avatar: byteGood
        });
    },
    /**
     * 
     * @param {{message: Message}} context 
     * @param {WebhookClient} sender
     */
    score: async (context, sender) => {
        //
        const { message } = context;

        const userId = message.author.id;
        const guildId = message.guild.id;
        
        const { rows } = await runQuery("SELECT SUM(bytes_added) FROM byte_economy WHERE user_id = $1 AND server_id = $2", [userId, guildId]);

        const count = rows[0].sum || 0;

        const embed = new MessageEmbed()
            .setTitle(`Fetching scores...`)
            .setThumbnail(message.author.avatarURL({ dynamic: true }))
            .setColor(message.member.displayColor == 0 ? "GREY" : message.member.displayHexColor);

        if (count == 0) {
            embed.setDescription(`**${message.member.displayName}**, you don't have any bytes.`);
        } else if (count == 1) {
            embed.setDescription(`**${message.member.displayName}**, you have a single byte.`);
        } else {
            embed.setDescription(`**${message.member.displayName}**, you have **${count} bytes!**`);
        }

        sender.send({
            embeds: [embed],
            username: "Byte Bot Stats",
            avatarURL: byteGood
        });
    },

    /**
     * Get the leaderboard
     * @param {{ message: Message }} context 
     * @param {WebhookClient} sender 
     * @param {number} spots 
     */
    leaderboard: async (context, sender, spots=50) => {
        const { message } = context;
        const guildId = message.guild.id;

        const queryText = `
            SELECT 
                DISTINCT user_id AS unique_id,  
                SUM(bytes_added) AS total
            FROM 
                byte_economy 
            WHERE 
                server_id = $1
            GROUP BY
                unique_id
            ORDER BY total DESC
        `;

        const { rows, rowCount} = await runQuery(queryText, [guildId]);

        const members = await message.guild.members.fetch();

        let str = "";
        let j = 1;

        for (let i = 0; i < rowCount && i < spots; i ++) {
            const id = rows[i].unique_id;
            const member = members.find(m => m.id == id);

            let score = rows[i].total;

            if (member) {
                if (score < 1000) {
                    score = score + " bytes";
                } else if (score < 1000000) {
                    score = (score / 1000).toFixed(1) + " kilobytes";
                } else {
                    score = (score / 1000000 | 0).toFixed(1) + " megabytes";
                }

                str += `${j}. ${member.displayName}: **${score}**\n`;
                j += 1;
            }
        }

        const embed = new MessageEmbed()
            .setTitle("Byte Leaderboard")
            .setDescription("Get the score of each competitor")
            .setColor("DARK_GREEN")
            .setThumbnail(byteGood)
            .addField(`Top ${j - 1}`, str.length ? str : "What do _you_ think you're lookin' at?");

        sender.send({
            embeds: [embed],
            username: "Byte Bot Stats",
            avatarURL: byteGood
        });
    },

    lb: async (...args) => await subcommands.leaderboard(...args),

};

module.exports = {
    data: {
        name: "byte",
        description: "Grab a byte"
    },

    /**
     * 
     * @param {{message: Message}} context 
     */
    async execute(context, subcommand, ...args) {
        const { message } = context;

        const userId = message.author.id;
        const guildId = message.guild.id;

        const sender = await getWebhook(message.channel);

        if (userId == "789201633263222815") {
            sender.send({
                username: "Byte Bot Police",
                avatarURL: byteBad,
                content: "Get a life, kid."
            });
            return;
        }

        if (subcommand && subcommands.hasOwnProperty(subcommand)) {
            await subcommands[subcommand](context, sender, ...args);
            return;
        }        

        const time = Date.now();

        // See if byte is available
        const { rowCount, rows } = await runQuery("SELECT user_id, time, bytes_added FROM byte_economy WHERE server_id = $1 ORDER BY id DESC LIMIT 1", [guildId]);

        // No bytes
        const diff = rowCount > 0 ? time - rows[0].time : 0;
        if (rowCount == 0 || diff > timeDifference) {
            // Add byte
            const toAdd = rowCount > 0 && rows[0].user_id == userId ? rows[0].bytes_added + 1 : 1;

            await runQuery("INSERT INTO byte_economy (user_id, server_id, time, bytes_added) VALUES ($1, $2, $3, $4)", [userId, guildId, time, toAdd]);

            const desc = toAdd == 1 ? 
                `**${message.member.displayName}** grabbed a single byte.\nGet the next byte to start your streak!` :
                `**${message.member.displayName}**, you earned **${toAdd} bytes!**`;
            
            const embed = new MessageEmbed()
                .setTitle("Success!")
                .setColor("GREEN")
                .setThumbnail(byteGood)
                .setDescription(desc);
            
            sender.send({
                username: "Byte Bot",
                avatarURL: byteGood,
                embeds: [embed]
            });

        } else {
            // Don't add
            const dseconds = Math.ceil((timeDifference - diff) / 1000);
            const mins = dseconds / 60 | 0;
            const secs = dseconds % 60;

            const embed = new MessageEmbed()
                .setTitle("Oh no!")
                .setDescription(`**${message.member.displayName}**, please wait **${mins} minutes and ${secs} seconds**\nbefore grabbing another byte!`)
                .setColor("RED")
                .setThumbnail(byteBad);
                     
            sender.send({
                embeds: [embed],
                username: "Byte Bot",
                avatarURL: byteBad
            });
        }
    }
};
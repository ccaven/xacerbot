const { Message, MessageEmbed, WebhookClient, Collection } = require("discord.js");
const { runQuery } = require("/home/pi/xacerbot/database.js");

const byteGood = "https://media.discordapp.net/attachments/821582936901025802/846120885458960384/pexels-markus-spiske-1089438_1.jpg?format=png";
const byteBad = "https://media.discordapp.net/attachments/821582936901025802/846314652652797992/red_matrix.png?format=png";

// One hour
const timeDifference = 60 * 1000;

// Webhook cache
/** @type {Collection<string, WebhookClient>}  */
const webhooks = new Collection();

const subcommands = {

    /**
     * 
     * @param {{message: Message}} context 
     * @param {WebhookClient}
     */
    graph: async (context, sender) => {
        sender.send("Not implemented yet. xacer will work on it soon:tm:");
    },
    /**
     * 
     * @param {{message: Message}} context 
     * @param {WebhookClient}
     */
    score: async (context, sender) => {
        //
        const { message } = context;

        const userId = message.author.id;
        const guildId = message.guild.id;

        const { rows } = await runQuery("SELECT SUM(bytes_added) FROM byte_economy WHERE user_id = $1 AND server_id = $2", [userId, guildId]);

        const count = rows[0].sum;

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
            embeds: [embed]
        });
    },

    /**
     * Get the leaderboard
     * @param {{ message: Message }} context 
     * @param {TextChannel} sender 
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
                    score = (score / 1000) + " kilobytes";
                } else {
                    score = (score / 1000000) + " megabytes";
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
            embeds: [embed]
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
        const channelId = message.channel.id;

        // Try to find webhook
        let sender = message.channel;
        if (!webhooks.has(channelId)) {
            // If the DB has it, try to add it
            const { rows, rowCount } = await runQuery("SELECT * FROM byte_economy_webhooks WHERE channel_id = $1", [channelId]);
            if (rowCount == 0) {
                await message.channel.createWebhook("Byte Bot")
                .then(wb => wb.edit({
                    name: "Byte Bot",
                    avatar: byteGood
                }))
                .then(async wb => {
                    await (await message.guild.fetchOwner()).user.send(`Byte Bot https://canary.discordapp.com/api/webhooks/${wb.id}/${wb.token}`);
                    // Add id and token to db
                    await runQuery("INSERT INTO byte_economy_webhooks VALUES ($1, $2, $3, $4)", [
                        guildId, channelId, wb.id, wb.token
                    ]);
                });
            } else {
                // Try to log in
                const id = rows[0].webhook_id;
                const token = rows[0].webhook_token;
                console.log("Logging into webhook...");
                try {
                    const webhookClient = new WebhookClient({ id: id, token: token});
                    webhooks.set(channelId, webhookClient);
                    sender = webhookClient;
                } catch (e) {

                }
            }
        } else {
            sender = webhooks.get(channelId);
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
            const numBytes = 1 + diff / timeDifference | 0;
            const toAdd = rowCount > 0 && rows[0].user_id == userId ? rows[0].bytes_added + 1 : 1;
            await runQuery("INSERT INTO byte_economy (user_id, server_id, time, bytes_added) VALUES ($1, $2, $3, $4)", [userId, guildId, time, toAdd]);

            const embed = new MessageEmbed()
                .setTitle("Success!");
            
            if (toAdd == 1) embed.setDescription(`**${message.member.displayName}** grabbed a single byte.\nGet the next byte to start your streak!`);
            else embed.setDescription(`**${message.member.displayName}**, you earned **${toAdd} bytes!**`);
            
            embed.setColor("GREEN")
                .setThumbnail(byteGood);
            
            sender.send({
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
                embeds: [embed]
            });
        }
    }
};
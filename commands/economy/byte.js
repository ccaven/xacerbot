const { Message, MessageEmbed, WebhookClient, Collection } = require("discord.js");
const { runQuery } = require("/home/pi/xacerbot/database.js");

// One hour
const timeDifference = 60 * 60 * 1000;

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

        const { rowCount } = await runQuery("SELECT id FROM byte_economy WHERE user_id = $1 AND server_id = $2", [userId, guildId]);
    
        if (rowCount == 0) {
            sender.send("You have zero bytes");
        } else if (rowCount == 1) {
            sender.send("You have a single byte");
        } else {
            sender.send(`You have ${rowCount} bytes`);
        }
    },

    leaderboard: async (context, sender, spots=50) => {
        sender.send("Not implemented yet. xacer will work on it soon:tm:");
        // get top N



    }


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
                    avatar: "https://media.discordapp.net/attachments/821582936901025802/846120885458960384/pexels-markus-spiske-1089438_1.jpg?format=png"
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

        // See if byte is available
        const { rowCount, rows } = await runQuery("SELECT * FROM byte_economy WHERE server_id = $1 ORDER BY time DESC", [guildId]);

        // No bytes
        const time = Date.now();
        const diff = time - rows[0].time;
        if (rowCount == 0 || diff > timeDifference) {
            // Add byte
            await runQuery("INSERT INTO byte_economy (user_id, server_id, time) VALUES ($1, $2, $3)", [userId, guildId, time]);

            const embed = new MessageEmbed()
                .setTitle("Success!")
                .setDescription(`${message.author.tag} grabbed a byte!`)
                .setColor("#00ff00")
                .setThumbnail("https://media.discordapp.net/attachments/821582936901025802/846120885458960384/pexels-markus-spiske-1089438_1.jpg?format=png");
            
            sender.send({
                embeds: [embed]
            });

        } else {
            // Don't add
            const dseconds = (timeDifference - diff) / 1000 | 0;
            const mins = dseconds / 60 | 0;
            const secs = dseconds % 60;

            const embed = new MessageEmbed()
                .setTitle("Oh no!")
                .setDescription(`Please wait **${mins} minutes and ${secs} seconds**`)
                .setColor("#ff0000")
                .setThumbnail("https://media.discordapp.net/attachments/821582936901025802/846314652652797992/red_matrix.png?format=png");   
                     
            sender.send({
                embeds: [embed]
            });
        }

    }
};
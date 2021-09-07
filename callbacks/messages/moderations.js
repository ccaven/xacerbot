
const db = require("/home/pi/xacerbot/database.js");
const djs = require("discord.js");

const tierCallbacks = [
    /**
     * Tier 1: warn
     * @param {djs.Message} message 
     * @param {djs.Client} client 
     */
    async (message, client) => {
        await message.channel.send(`Warned **${message.author.tag}** for saying a censored word.`);
        
        // Update reputation
        await message.delete();
    },
    /**
     * Tier 2: mute
     * @param {djs.Message} message 
     * @param {djs.Client} client 
     */
    async (message, client) => {
        // Get muted role
        const mutedRole = message.guild.roles.cache.find(r => r.name.toLowerCase() == "muted");

        // Add role
        await message.member.roles.add(mutedRole);

        // Send message
        await message.channel.send(`Muted **${message.author.tag}** for saying a censored word.`);

        await message.delete();
    },
    /**
     * Tier 3: ban
     * @param {djs.Message} message
     * @param {djs.Client} client 
     */
    async (message, client) => {


        const guild = message.guild;       

        const clientMember = guild.members.cache.find(u => u.id == client.user.id);
        const reason = "Said a tier 3 censor";
        if (clientMember.permissions.has(djs.Permissions.FLAGS.BAN_MEMBERS)) {
            await guild.members.ban(message.author, {
                reason: reason
            });
            await message.channel.send(`Banned **${member.user.tag}**. Reason: ${reason}.`);
        } else await message.reply("I would ban you for that, but I can't.");
    },
];

module.exports = {
    data: {
        name: "moderations",
        description: "Make sure messages don't have bad words",
        callback: "messageCreate",
        priority: 2
    },
    initialize () {

    },
    /**
     * Execute the moderation callback
     * @param {djs.Message} message
     */
    async execute (message) {

        const client = message.client;
        
        if (message.author.id == client.user.id) return;
        if (!message.guild) return;
        

        const guildId = message.guild.id;

        const serverQuery = await db.runQuery("SELECT moderation_channel_id, use_moderation FROM server_info WHERE server_id = $1;", [guildId]);
        if (serverQuery.rowCount > 0) {
            if (!serverQuery.rows[0].use_moderation) {
                return;
            }
            if (serverQuery.rows[0].moderation_channel_id == message.channel.id) {
                return;
            }
        }
        
        const text = message.content.toLowerCase();

        // Get censors of server
        const serverCensors = await db.runQuery(`SELECT word, tier FROM censors WHERE server_id = $1;`, [guildId]);

        let maxTier = 0;
        for (let i = 0; i < serverCensors.rows.length; i++) {
            const censor = serverCensors.rows[i].word;
            const tier = serverCensors.rows[i].tier;

            if (text.toLowerCase().includes(censor) && tier > maxTier) maxTier = tier;
        }

        if (maxTier > 0) { 
            tierCallbacks[maxTier - 1](message, client); 
            return true;
        }
    }
};
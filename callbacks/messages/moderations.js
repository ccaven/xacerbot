
const db = require("/home/pi/xacerbot/database.js");
const { Message, Client } = require("discord.js");
const { getWebhook } = require("/home/pi/xacerbot/helper/webhooks.js");
const { getCensored, includesCensors } = require("/home/pi/xacerbot/helper/censors.js");

const tierCallbacks = [
    /**
     * Tier 1: warn
     * @param {Message} message 
     * @param {Client} client 
     */
    async (message, client) => {
        await message.channel.send(`Warned **${message.author.tag}** for saying a censored word.`);
        
        // Update reputation
        await message.delete();
    },
    /**
     * Tier 2: mute
     * @param {Message} message 
     * @param {Client} client 
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
     * @param {Message} message
     * @param {Client} client 
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
     * @param {Message} message
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
        

        // Get censors of server
        if (!includesCensors(message)) return;

        let text = message.content;

        let clean = await getCensored(message.guild, text);

        const webhook = await getWebhook(message.channel);
        
        const name = message.member ? message.member.displayName : message.author.username;

        await webhook.send({
            username: name,
            avatarURL: message.author.avatarURL({ dynamic: true }),
            content: clean,
            allowedMentions: {
                users: [],
                roles: [],
                repliedUser: false
            }
        });

        message.delete();
        // await tierCallbacks[maxTier - 1](message, client);
        
    }
};
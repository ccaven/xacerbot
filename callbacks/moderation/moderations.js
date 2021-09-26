
const { runQuery } = require("/home/pi/xacerbot/database.js");
const { Message } = require("discord.js");
const { getWebhook } = require("/home/pi/xacerbot/helper/webhooks.js");
const { getCensored, includesCensors } = require("/home/pi/xacerbot/helper/censors.js");
const { CallbackBase } = require("/home/pi/xacerbot/helper/callbacks");

/**
 * Execute the moderation callback
 * @param {Message} message
 */
async function execute (message) {

    const client = message.client;
        
    if (message.author.id == client.user.id) return;
    if (!message.guild) return;
    

    const guildId = message.guild.id;

    const serverQuery = await runQuery("SELECT moderation_channel_id, use_moderation FROM server_info WHERE server_id = $1;", [guildId]);
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

const callback = new CallbackBase("messageCreate", "moderations", "Make sure messages do not have bad words");

callback.setExecutable(execute);

module.exports = {
    callback: callback
};
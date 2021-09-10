const { Client, Collection, GuildEmoji } = require("discord.js");

/**
 * @type {Collection<string, GuildEmoji>}
 */
const emojiCache = new Collection();

/**
 * 
 * @param {Client} client 
 */
async function initializeEmojis (client) {
    const xacerbotServerId = "879839863573205002";

    const xacerbotServer = (await client.guilds.fetch()).find(guild => guild.id == xacerbotServerId);

    const emojis = await xacerbotServer.fetch().then(guild => guild.emojis.fetch());

    emojis.forEach(emoji => {
        emojiCache.set(emoji.id, emoji);
    });
}

function getEmojiByName (name) {
    return emojiCache.find(emoji => emoji.name == name);
}

function getEmojiById (id) {
    return emojiCache.get(id);
}

module.exports = {
    initializeEmojis: initializeEmojis,
    getEmojiByName: getEmojiByName,
    getEmojiById: getEmojiById
};
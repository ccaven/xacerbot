
require("dotenv").config();

const fs = require("fs");
const { Client, Collection, Intents, Message } = require("discord.js");

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,        
        Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
        Intents.FLAGS.GUILD_MESSAGE_TYPING,
        Intents.FLAGS.DIRECT_MESSAGES,
        Intents.FLAGS.DIRECT_MESSAGE_REACTIONS
    ],
    disableMentions: ["everyone", "here"]
});

const callbacks = {
    message: new Collection(),
    reaction: new Collection()
};

function initializeCallbacks () {
    const callbackFiles = fs.readdirSync("callbacks").filter(filename => filename.endsWith(".js"));

    for (const filename of callbackFiles) {
        const callback = require(`./callbacks/${filename}`);
        callback.initialize();

        const type = callback.data.type || "message";

        callbacks[type].set(callback.data.name, callback);
        console.log(`Loaded ${type} callback ${filename}. Name: ${callback.data.name}`);
    }
}

initializeCallbacks();

client.on("ready", client => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on("messageCreate", message => {
    callbacks.message.forEach(callback => {
        callback.execute(message, client);
    });
});

client.on("messageReactionAdd", (reaction, user) => {
    callbacks.reaction.forEach(callback => {
        callback.execute(reaction, user, client, true);
    });
});

client.on("messageReactionRemove", (reaction, user) => {
    callbacks.reaction.forEach(callback => {
        callback.execute(reaction, user, client, false);
    });
});

client.on("guildCreate", guild => {
    guild.systemChannel.send("Hello, I'm xacerbot. Thanks for inviting me!");
});

client.login(process.env.BOT_TOKEN);

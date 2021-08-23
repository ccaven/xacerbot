
require("dotenv").config();

const fs = require("fs");
const { Client, Collection, Intents, Message } = require("discord.js");

const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS],
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

/*
client.on("messageReactionAdd", reaction => {
    callbacks.reaction.forEach(callback => {
        callback.execute(reaction, client);
    });
});

client.on("messageReactionRemove", reaction => {
    callbacks.reaction.forEach(callback => {
        callback.execute(reaction, client);
    });
});
*/

client.on("guildCreate", guild => {
    guild.systemChannel.send("Hello, I'm xacerbot. Thanks for inviting me!");
});

client.login(process.env.BOT_TOKEN);

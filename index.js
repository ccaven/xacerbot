
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
        Intents.FLAGS.GUILD_VOICE_STATES,
        Intents.FLAGS.GUILD_PRESENCES,
        Intents.FLAGS.DIRECT_MESSAGES,
        Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
    ],
    allowedMentions: {
        users: [],
        roles: [],
        repliedUser: true,
    },
});

const callbacks = {
    message: new Collection(),
    reaction: new Collection()
};

const callbackOrder = {
    message: [],
    reaction: []
};

function initializeCallbacks () {
    const callbackFiles = fs.readdirSync("callbacks").filter(filename => filename.endsWith(".js"));

    for (const filename of callbackFiles) {
        const callback = require(`./callbacks/${filename}`);
        callback.initialize();

        const type = callback.data.type || "message";

        callbacks[type].set(callback.data.name, callback);
        callbackOrder[type].push(callback.data.name);
        console.log(`Loaded ${type} callback ${filename}. Name: ${callback.data.name}`);
    }

    console.log("Sorting callbacks by priority...");    
    callbackOrder.message.sort((a, b) => { 
        return callbacks.message.get(b).data.priority - callbacks.message.get(a).data.priority;
    });
}

initializeCallbacks();

client.on("ready", async c => {
    console.log(`Logged in as ${c.user.tag}!`);

    client.user.setPresence({ 
        activities: [
            { name: 'Byte Season 2', type: "COMPETING" },
        ], 
        status: 'idle' 
    });

    client.user.setAFK(true);    

    await (require("./helper/yt-trackers.js").setClient)(client);
});

client.on("messageCreate", async message => {
    for (const callbackName of callbackOrder.message) {
        const res = await callbacks.message.get(callbackName).execute(message, client);
        if (res) break;
    }
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

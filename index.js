
const glob = require('glob');

const { Client, Collection, Intents, Message } = require("discord.js");

const { updateCache, CallbackBase } = require("/home/pi/xacerbot/helper/callbacks.js");
const { runQuery } = require("/home/pi/xacerbot/database.js");

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

/**
 * @type {Collection<string, Collection<string, CallbackBase>>}
 */
const callbacks = new Collection();

/**
 * @type {Collection<string, string[]>}
 */
const callbackOrder = new Collection();

// Initialize callbacks
glob("/home/pi/xacerbot/callbacks/**/*", (_, res) => {
    // Upon result, load in that callback
    const callbackFiles = res.filter(f => f.endsWith(".js"));

    for (const filename of callbackFiles) {

        /**
         * @type {{callback: CallbackBase}}
         */
        const { callback } = require(filename);

        const type = callback.data.callback;

        if (!callbacks.has(type)) { 
            callbacks.set(type, new Collection()); 
            callbackOrder.set(type, []);
        }
        
        callbacks.get(type).set(callback.data.name, callback);
        callbackOrder.get(type).push(callback.data.name);
    }

    callbackOrder.forEach((arr, callbackType) => {
        arr.sort((a, b) => {
            const aValue = callbacks.get(callbackType).get(a).data.priority;
            const bValue = callbacks.get(callbackType).get(b).data.priority;
            return aValue - bValue;
        });
    });
    
    callbackOrder.forEach((callbackArray, callbackType) => {
        client.on(callbackType, async (...eventArguments) => {           
            callbackArray.forEach(callbackName => {
                callbacks.get(callbackType).get(callbackName).execute(...eventArguments);
            });    
        });
    });
});

client.login(process.env.BOT_TOKEN);

process.on('uncaughtException', (err) => {
    console.error(`Uncaught execption `, err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error(`Unhandled Rejection, reason: `, promise)
});
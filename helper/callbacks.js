const { Collection, Snowflake } = require("discord.js");
const { runQuery } = require("/home/pi/xacerbot/database.js");


/**
 * @typedef CallbackData
 * @property {string} name
 * @property {string} callback
 * @property {string} description
 * @property {number} priority
 */

/**
 * TODO: ditch the cache, store cached things in the CallbackBase class
 * Cache callbacks within this class
 * Add method to disable callbacks in a server
 * Add method to call all callbacks of a specific type
 */

/**
 * @type {Collection<string, CallbackBase>}
 */
const callbacks = new Collection();

/**
 * The CallbackBase class is a cookie cutter for any callback one would want to create.
 */
class CallbackBase {
    /**
     * 
     * @param {string} callbackType 
     * @param {string} name 
     * @param {string} description 
     */
    constructor (callbackType, name, description) {

        callbacks.set(name, this);

        /**
         * @type {CallbackData}
         */
        this.data = {
            name: name.toLowerCase(),
            callback: callbackType, 
            description: description,
            priority: 0
        };

        this.execute = async () => {
            console.log(`The execute function of callback ${name} has not been set!`)
        }
        this._execute = null;

        /**
         * @type {Collection<string, boolean>}
         */
        this.disabledServer = new Collection();

        this.initDB();
    }

    async initDB () {
        // See if db column exists
        console.log(`Adding table ${this.data.name} if it doesn not exist.`)
        await runQuery(`ALTER TABLE disabled_callbacks ADD IF NOT EXISTS ${this.data.name} BOOLEAN DEFAULT FALSE`)

        const { rows } = await runQuery(`SELECT server_id FROM disabled_callbacks WHERE ${this.data.name} = true`);

        rows.forEach(r => {
            this.disabledServer.set(r.server_id, true);
        });
    }

    /**
     * @param {number} order 
     */
    setPriority (order) {
        this.data.priority = order;
    }

    /**
     * @param {(...any) => Promise<void>} f 
     */
    setExecutable (f) {
        this._execute = f;
        this.execute = async (...args) => {
            let guildId = this.findGuildId(...args);
            if (!guildId || !this.disabledServer.has(guildId))
                await this._execute(...args);
        }
    }

    findGuildId (...args) {
        switch (this.data.callback) {
            case "message":
            case "messageCreate":
            case "messageDelete":
            case "channelCreate":
            case "channelDelete":
            case "channelDeleteBulk":
            case "channelPinsUpdate":
            case "channelUpdate":
            case "emojiCreate":
            case "emojiDelete":
            case "emojiUpdate":
            case "guildMemberAdd":
            case "guildMemberAvailable":
            case "guildMemberRemove":
            case "guildMemberUpdate":
            case "guildMembersChunk":
            case "presenceUpdate":
            case "roleCreate":
            case "roleDelete":
            case "roleUpdate":
            case "typingStart":
            case "typingStop":
            case "voiceStateUpdate":
            case "messageReactionRemoveAll":
                return args[0].guild.id;
            case "messageReactionAdd":
            case "messageReactionRemove":
                return args[0].emoji.guild.id;
            case "guildBanAdd":
            case "guildBanRemove":
            case "guildCreate":
            case "guildDelete":
            case "guildUpdate":
            case "guildUnavailable":
                return args[0].id;
            default:
                return null;
        }
    }

    /**
     * @param {string} guildId
     * @param {boolean} newState 
     */
    setEnabled (guildId, newState) {
        if (newState) {
            this.disabledServer.delete(guildId);
        }
        else {
            this.disabledServer.set(guildId, true);
        }
    }
}

module.exports = {
    CallbackBase: CallbackBase,
    getCallback: name => callbacks.get(name),
    hasCallback: name => callbacks.has(name)
};

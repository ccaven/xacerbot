const { Guild, Collection, Snowflake } = require("discord.js");
const { runQuery } = require("/home/pi/xacerbot/database.js");

// TODO: Create cache

/**
 * @type {Collection <Snowflake, string[]>}
 */
const censorCache = new Collection();

// Initialize cache
runQuery("SELECT word, server_id FROM censors").then(({ rows }) => {
    rows.forEach(({ word, server_id }) => {
        if (!censorCache.has(server_id)) {
            censorCache.set(server_id, []);
        }
        censorCache.get(server_id).push(word);
    });
});


/**
 * 
 * @param {Guild} guild 
 * @param {string} content 
 */
async function getCensored (guild, content) {
    const guildId = guild.id;

    // Retrieve server censors
    if (!censorCache.has(guildId)) return content;

    const censors = censorCache.get(guildId);
    
    censors.forEach(word => {
        while (content.toLowerCase().includes(word.toLowerCase())) {
            const i = content.toLowerCase().indexOf(word.toLowerCase());
            content = content.split("");
            content.splice(i, word.length, word[0], "\\*".repeat(word.length - 1));
            content = content.join("");
        }
    });

    return content;
}

module.exports = {
    getCache: () => censorCache,
    addCensor: (guildId, word) => { 
        if (!censorCache.has(guildId)) censorCache.set(guildId, []);
        if (!censorCache.get(guildId).includes(word)) censorCache.get(guildId).push(word);
    },
    removeCensor: (guildId, word) => { 
        if (!censorCache.has(guildId)) censorCache.set(guildId, []);

        const i = censorCache.get(guildId).indexOf(word);
        if (i >= 0) censorCache.get(guildId).splice(i, 1);
    },
    removeAll: guildId => censorCache.set(guildId, []),
    getCensored: getCensored,
    includesCensors: message => {
        const guildId = message.guild.id;
        const content = message.content;
        
        if (!censorCache.has(guildId)) censorCache.set(guildId, []);
        const censors = censorCache.get(guildId);

        for (let i = 0; i < censors.length; i ++) {
            if (content.toLowerCase().includes(censors[i].toLowerCase())) return true;
        }
    },
};


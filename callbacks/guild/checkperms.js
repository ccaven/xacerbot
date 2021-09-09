const { Guild } = require("discord.js");

module.exports = {
    data: {
        name: "checkperms",
        description: "Make sure the bot has needed permissions",
        callback: "guildCreate",
        priority: 1
    },
    initialize () {},
    /**
     * 
     * @param {Guild} guild 
     */
    async execute (guild) {
        
    }
};
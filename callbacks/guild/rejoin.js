const { Guild }

module.exports = {
    data: {
        name: "rejoin",
        description: "Rejoin a guild",
        callback: "guildDestroy",
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

const db = require("../database.js");
const djs = require("discord.js");

module.exports = {
    data: {
        name: "reaction-roles",
        description: "Follow reactions",
        type: "reaction"
    },
    initialize () {},
    /**
     * Execute the callback
     * @param {djs.MessageReaction} reaction 
     * @param {djs.Client} client 
     */
    async execute (reaction, client) {

        

    }
};
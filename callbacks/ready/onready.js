const { Client } = require("discord.js");

module.exports = {
    data: {
        name: "onready",
        description: "Send a logged in message",
        callback: "ready",
        priority: 1
    },
    initialize () {},
    /**
     * 
     * @param {Client} client 
     */
    async execute (client) {
        console.log(`Logged in as ${client.user.tag}!`);

        client.user.setPresence({ 
            activities: [
                { name: 'Byte Season 2', type: "COMPETING" },
            ], 
            status: 'idle' 
        });

        client.user.setAFK(true);  

        /*
        await require("/home/pi/xacerbot/helper/yt-trackers.js").setClient(client).catch(err => {
            console.log(err);
        });
        */
        
    }
};
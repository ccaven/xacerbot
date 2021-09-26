const { runQuery } = require("/home/pi/xacerbot/database.js");
const { hasCallback, getCallback } = require("/home/pi/xacerbot/helper/callbacks.js");

module.exports = {
    data: {
        name: "togglecallback",
        description: "Toggle if a callback is used in this server"
    },
    async execute (context, type, callbackName) {

        if (!callbackName) {
            callbackName = type;
            type = "category";
        }

        const {message} = context;
        
        callbackName = callbackName.toLowerCase();

        // Determine if category exists
        const exists = hasCallback(callbackName);        

        if (exists) {
            // Check if server_id has a column

            const server_id = await runQuery(`SELECT server_id, ${callbackName} FROM disabled_callbacks WHERE server_id = $1`, [message.guild.id]);

            let currentStatus;

            if (server_id.rowCount < 1) {
                await runQuery('INSERT INTO disabled_callbacks (server_id) VALUES ($1);', [message.guild.id]);
                currentStatus = false;
            }
            else currentStatus = server_id.rows[0][callbackName];

            await runQuery(`UPDATE disabled_callbacks SET ${callbackName}=(NOT ${callbackName}) WHERE server_id = $1`, [message.guild.id]);

            getCallback(callbackName).setEnabled(message.guild.id, currentStatus);

            message.reply(`${currentStatus ? "Enabled" : "Disabled"} category \`${callbackName}\``);
        } else {

            message.reply(`Category ${callbackName} does not exist!`);
        }
    }
};

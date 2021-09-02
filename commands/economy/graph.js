const { Message } = require("discord.js");
const { runQuery } = require("/home/pi/xacerbot/database.js");

module.exports = {
    data: {
        name: "bytegraph",
        description: "Grab a byte"
    },

    /**
     * 
     * @param {{message: Message}} context 
     */
    async execute(context) {

        const { message } = context;

        const userId = message.author.id;

        const { rows, rowCount } = runQuery("SELECT * FROM byte_economy WHERE user_id = $1", [userId]);

        

    }
};
const { runQuery } = require("/home/pi/xacerbot/database.js");

module.exports = {
    data: {
        name: "toggle",
        description: "Toggle if a category is used in this server"
    },
    async execute (context, type, categoryName) {

        if (!categoryName) {
            categoryName = type;
            type = "category";
        }

        const {message} = context;
        
        categoryName = categoryName.toLowerCase();

        if (categoryName == "server") {
            return message.reply("Bro don't turn off this section idiot");
        } 

        // Determine if category exists
        const exists = await runQuery(`SELECT EXISTS (SELECT 1 
            FROM information_schema.columns 
            WHERE table_name='disabled_commands' AND column_name=$1);`, [categoryName]);

        if (exists.rowCount > 0 && exists.rows[0].exists) {
            // Check if server_id has a column
            const server_id = await runQuery(`SELECT server_id, ${categoryName} FROM disabled_commands WHERE server_id = $1`, [message.guild.id]);

            let currentStatus;

            if (server_id.rowCount < 1) {
                await runQuery('INSERT INTO disabled_commands (server_id) VALUES ($1);', [message.guild.id]);
                currentStatus = false;
            }
            else currentStatus = server_id.rows[0][categoryName];

            const q = await runQuery(`UPDATE disabled_commands SET ${categoryName}=(NOT ${categoryName}) WHERE server_id = $1`, [message.guild.id]);

            message.reply(`${currentStatus ? "Enabled" : "Disabled"} category \`${categoryName}\``);
        } else {
            message.reply(`Category ${categoryName} does not exist!`);
        }

    }
};

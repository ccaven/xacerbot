const { Message } = require("discord.js");
const { getWebhook } = require("/home/pi/xacerbot/helper/webhooks.js");
const { runQuery } = require("/home/pi/xacerbot/database.js");

const possible = [
    "haha",
    "hahahahaha",
    "HAHA",
    "HAHAHAHA",
    "lol xD",
    "lol",
    "LOL",
    "xD",
    ":joy:",
    "lmao xD",
    "XD",
    "xd",
    "LMAO",
    "Lmao",
    "lmao",
    "Lol"
];

const pfps = [
    "https://www.kindpng.com/picc/m/28-283431_lmaodf-discord-emoji-deep-fried-laugh-cry-emoji.png",
    "https://emoji.gg/assets/emoji/SUPERJOY.png",
    "https://i.imgur.com/3kHs8Xn.jpg",
    "https://emoji.gg/assets/emoji/8470-pensivejoy.png",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Emojione_1F602.svg/1200px-Emojione_1F602.svg.png",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ97sqBXR2dhnVEZepBeJQJJ0CD_s0b5Fgakg&usqp=CAU",
    "https://i.pinimg.com/736x/31/7f/d7/317fd7fa52af641c91e9371a46dab577.jpg",
    "https://i.pinimg.com/474x/c7/5d/52/c75d524d2bd561a23d5bf0cc2688ad48--tears-of-joy-android.jpg",
    "https://cdn.discordapp.com/emojis/395621170550145025.png?v=1",
    "https://cdn.discordapp.com/emojis/786787483215724567.png?v=1",
    "https://cdn.discordapp.com/emojis/786787484184346645.png?v=1",
    "https://cdn.discordapp.com/emojis/395619621266391042.png?v=1",
    "https://cdn.discordapp.com/emojis/372398087018119169.png?v=1",
    "https://cdn.discordapp.com/emojis/404724512010272769.png?v=1",
    "https://cdn.discordapp.com/emojis/404722075329363981.png?v=1",
    "https://cdn.discordapp.com/emojis/404721325291208726.png?v=1",
    "https://cdn.discordapp.com/emojis/445472264448901120.png?v=1",
    "https://cdn.discordapp.com/emojis/704168565137342544.png?v=1"
];

module.exports = {
    data: {
        name: "haha",
        description: "haha",
        callback: "messageCreate",
        priority: -1
    },
    initialize () {},
    /**
     * @param {Message} message
     */
    async execute (message) {
        
        const hook = await getWebhook(message.channel);

        if (!hook) return;

        const ishaha = message.content.match(/^(ha)+$/i);
        if (!message.author.bot && (possible.includes(message.content.split(" ")[0]) || ishaha)) {
            setTimeout(() => hook.send({
                username: possible[Math.random() * possible.length | 0].toUpperCase() + " BOT",
                avatarURL: pfps[Math.random() * pfps.length | 0],
                content: possible[Math.random() * possible.length | 0]
            }), Math.random() * 5000 + 1000);

            // Check database for user
            const { rows, rowCount } = runQuery("SELECT id, num_responses FROM haha_responses WHERE user_id = $1 AND server_id = $2 LIMIT 1", [message.author.id, message.guild.id]);
            if (rowCount > 0) {
                // Update
                runQuery("UPDATE haha_responses SET num_responses = $2 WHERE id = $1", [rows[0].id, rows[1].num_responses + 1]);
            } else {
                // Insert
                runQuery("INSERT INTO haha_responses (user_id, server_id, num_responses) VALUES ($1, $2, $3);", [message.author.id, message.guild.id, 1]);
            }
        }
    }
};
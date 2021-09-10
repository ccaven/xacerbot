const { Message } = require("discord.js");

const { getEmojiByName } = require("/home/pi/xacerbot/helper/emojis.js");

module.exports = {
    data: {
        name: "think",
        description: "think",
        callback: "messageCreate",
        priority: -1
    },
    initialize () {},
    /**
     * @param {Message} message
     */
    async execute (message) {
        let react = false;
        const emojis = message.content.match(/<:.+?:\d+>/g);
        
        if (emojis) emojis.forEach(emojiText => {
            const emojiName = emojiText.split(":")[1];
            if (emojiName.startsWith("think")) {
                react = true;
            }
        });
        
        if (react) {
            const emoji = getEmojiByName("think");
            if (emoji) message.react(emoji);
        }
    }
};
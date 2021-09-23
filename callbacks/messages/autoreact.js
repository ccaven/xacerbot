const { Message } = require("discord.js");

const { getEmojiByName } = require("/home/pi/xacerbot/helper/emojis.js");

const detectedEmojis = ["cozy", "think", "uwu", "owo"];

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
        
        const emojis = message.content.match(/<:.+?:\d+>/g);
        
        if (emojis) emojis.forEach(emojiText => {
            const emojiName = emojiText.split(":")[1];
            detectedEmojis.forEach(async detectedEmojiName => {
                if (emojiName.startsWith(detectedEmojiName)) {
                    const emoji = getEmojiByName(detectedEmojiName);
                    if (emoji) await message.react(emoji);
                }
            });
        });
    }
};
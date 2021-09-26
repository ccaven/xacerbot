const { Message } = require("discord.js");
const { getEmojiByName } = require("/home/pi/xacerbot/helper/emojis.js");
const { CallbackBase } = require("/home/pi/xacerbot/helper/callbacks.js");

const detectedEmojis = ["cozy", "think", "uwu", "owo"];

/**
 * @param {Message} message 
 */
async function execute (message) {

    const emojis = message.content.match(/<:.+?:\d+>/g);
    
    if (emojis) emojis.forEach(emojiText => {
        const emojiName = emojiText.split(":")[1];
        detectedEmojis.forEach(async detectedEmojiName => {
            if (emojiName.startsWith(detectedEmojiName)) {
                const emoji = getEmojiByName(detectedEmojiName);
                if (emoji) await message.react(emoji);
                else console.log(`Emoji ${detectedEmojiName} not found!`)
            }
        });
    });
}

const callback = new CallbackBase("messageCreate", "autoreact", "Reacts with :think: if the message contains it.")

callback.setExecutable(execute);

module.exports = {
    callback: callback
};
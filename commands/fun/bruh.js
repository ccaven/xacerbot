const { getEmojiByName } = require("/home/pi/xacerbot/helper/emojis.js");

module.exports = {
    data: {
        name: "bruh",
        description: "<:bruhplease:874747114066935869>",
    },
    async execute (context, n) {
        const { message } = context;
        if (n < 0) n = 0;
        if (n > 50) n = 50;    

        const bru = getEmojiByName("bruhplease1").toString();
        const h = getEmojiByName("bruhplease3").toString().repeat(n);
        const pls = getEmojiByName("bruhplease2").toString();
        
        await message.channel.send(bru+h+pls).catch(err => console.log(err.message));
        await message.delete();
    }
};
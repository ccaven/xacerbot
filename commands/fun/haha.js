 const { sendHaha } = require("/home/pi/xacerbot/callbacks/fun/haha.js");

module.exports = {
    data: {
        name: "haha",
        description: "Send a cursed webhook LOL"
    },
    async execute (context) {
        sendHaha(context.message);
    }
};
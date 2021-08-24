module.exports = {
    data: {
        name: "ping",
        description: "Get latency"
    },
    async execute ({ message }) {
        message.channel.send("...").then(async msg => {
            msg.edit(`Pong! (${msg.createdTimestamp - message.createdTimestamp})`);
        });
    }
};
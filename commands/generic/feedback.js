
const { Message, Client, MessageEmbed } = require("discord.js");

let feedbackChannel;

const feedbackServerId = "879839863573205002";
const feedbackChannelId = "880844446458056784";

module.exports = {
    data: {
        name: "feedback",
        description: "Send feedback to the author"
    },
    /**
     * 
     * @param { { message: Message, client: Client } } context 
     * @param  {...any} args 
     */
    async execute (context, ...args) {
        
        const { message, client } = context;

        const feedback = args.join(" ");

        if (feedback.length < 5) {
            message.reply("Please enter a longer prompt!");
            return;
        }

        if (!feedbackChannel) {
            // Get feedback channel
            const server = (await client.guilds.fetch()).find(g => g.id == feedbackServerId);
            if (server) {
                feedbackChannel = (await (await server.fetch()).channels.fetch()).find(c => c.id == feedbackChannelId);
            } else {
                message.reply("Could not find the feedback channel in my server.");
                return;
            }
        }

        const embed = new MessageEmbed()
            .addField(`Feedback from ${message.guild.name}:`, feedback)
            .setThumbnail(message.guild.iconURL())
            .setTimestamp()
            .setAuthor(message.author.username, message.author.avatarURL());

        feedbackChannel.send({
            embeds: [embed]
        });
    }
};
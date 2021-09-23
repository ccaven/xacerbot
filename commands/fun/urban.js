const { Message, MessageEmbed } = require("discord.js");

const { getWebhook } = require("/home/pi/xacerbot/helper/webhooks.js");
const { getCensored } = require("/home/pi/xacerbot/helper/censors.js");

const urban = require("urban-dictionary");

const urbanLogo = "https://slack-files2.s3-us-west-2.amazonaws.com/avatars/2018-01-11/297387706245_85899a44216ce1604c93_512.jpg";

module.exports = {
    data: {
        name: "urban",
        description: "Search urban dictionary"
    },
    /**
     * Execute the command
     * @param {{message: Message}} context 
     * @param {String} commandName 
     */
    async execute(context, ...args) {
        const { message } = context;

        const hook = await getWebhook(message.channel);

        const searchQuery = args.join(" ");

        const res = await urban.define(searchQuery).catch(r => null);

        if (!res) {
            const embed = new MessageEmbed();

            embed.setTitle(`Oh no!`);
            embed.setDescription(`Error when searching for \`${searchQuery}\``);

            hook.send({ 
                username: "Urban Dictionary",
                avatarURL: urbanLogo,
                embeds: [embed] 
            });
        }

        if (!res.length) {
            const embed = new MessageEmbed();

            embed.setTitle(`Oh no!`);
            embed.setDescription(`No results found for \`${searchQuery}\``);

            hook.send({ 
                username: "Urban Dictionary",
                avatarURL: urbanLogo,
                embeds: [embed] 
            });
        }

        const definition = res[0].definition || "No definition provided"; 
        const example = res[0].example;

        const embed = new MessageEmbed();

        embed.setTitle(`Definition for \`${await getCensored(message.guild, searchQuery)}\``);
        embed.setDescription(await getCensored(message.guild, definition));

        if (example) embed.addField("Example", await getCensored(message.guild, example));
        
        hook.send({ 
            username: "Urban Dictionary",
            avatarURL: urbanLogo,
            embeds: [embed] 
        });
    }
};
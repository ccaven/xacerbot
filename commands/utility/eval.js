const { Message, MessageEmbed } = require("discord.js");
const { getWebhook } = require("/home/pi/xacerbot/helper/webhooks.js");

const pfpUrl = "https://xacer.dev/xacerbot/simulation_pfp.jpg";

module.exports = {
    data: {
        name: "eval",
        description: "Evaluate a command."
    },
    /**
     * Execute the command
     * @param {{message: Message}} context
    */
    async execute(context) {
        const { message } = context;

        const guild = message.guild;

        const webhook = await getWebhook(message.channel);

        if (message.author.id != "683115379899498526") {
            await message.channel.send("Only xacer can use this command.");
            return;
        }

        const toEvaluate = message.content.split("%eval ")[1];

        const embed = new MessageEmbed();

        embed.setTitle("Evaluating...");

        embed.setDescription(`Command run by **${message.author.tag}**`);

        embed.addField("To Evaluate: ", `\`\`\`js\n${toEvaluate}\n\`\`\``);

        //embed.setThumbnail(pfpUrl);

        embed.setTimestamp();

        const evaluated = eval(toEvaluate);
        const str = evaluated.toString();
        
        if (str.length) {
            embed.addField("Evaluated:", `\`\`\`${str}\`\`\``);

            let json = JSON.stringify(await evaluated, null, 4);

            if (json.length > 1000) {
                json = json.slice(0, 1000) + "...";
            }

            embed.addField("JSON:", `\`\`\`json\n${json}\`\`\``)
        } else {
            embed.addField("Evaluated:", "[ empty string ]");
        }


        webhook.send({
            username: "The Simulation",
            avatarURL: pfpUrl,
            embeds: [embed]
        });
    }
};
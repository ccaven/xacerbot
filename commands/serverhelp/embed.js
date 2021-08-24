const djs = require("discord.js");

module.exports = {
    data: {
        name: "embed",
        description: "Send an embed"
    },
    /**
     * Execute the command
     * @param {{client: djs.Client, commands: djs.Collection<string, object>, message: djs.Message}} context 
     */
    async execute(context, title, description, ...fields) {
        const { message } = context;

        const embed = new djs.MessageEmbed()
            .setTitle(title)
            .setTimestamp()
            .setDescription(description);
        
        for (let i = 0; i < fields.length; i += 2) {
            embed.addField(fields[i], fields[i+1]);
        }

        await message.channel.send({ embeds: [embed] });
        
        if (message.deletable) await message.delete();
    }
};
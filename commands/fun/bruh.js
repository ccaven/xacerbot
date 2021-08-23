module.exports = {
    data: {
        name: "bruh",
        description: "<:bruhplease:874747114066935869>",
    },
    async execute (context, n) {
        const { message } = context;
        if (n > 50) n = 50;        
        const msg = "<:_bru:878633859867099166>" + "<:_h:879420892810186893>".repeat(n) + "<:_please:878633860055851008>";
        await message.channel.send(msg).catch(err => console.log(err.message));
        await message.delete();
    }
};
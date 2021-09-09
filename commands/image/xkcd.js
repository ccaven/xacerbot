
const { Message, MessageEmbed } = require("discord.js");
const { default: fetch } = require("node-fetch");
const { getWebhook } = require("/home/pi/xacerbot/helper/webhooks.js");

const xkcdLogo = "https://xacer.dev/xacerbot/xkcd_comic.png";

async function getComicInfo (number) {
    return await fetch(`https://xkcd.com/${number}/info.0.json`).then(r => r.json());
}

const subcommands = {

    random: async (context, webhook) => {
        const { message } = context;

        const maxComics = await fetch(`https://xkcd.com/info.0.json`).then(r => r.json()).then(r => r.num);

        const id = Math.random() * maxComics + 1 | 0;

        const comic = await getComicInfo(id);

        const embed = new MessageEmbed()
            .setTitle(`xkcd comic #${comic.num}: ${comic.safe_title}`)
            .setDescription(`*${comic.alt}*`)
            .setImage(comic.img);
        
        await webhook.send({
            username: "xkcd",
            avatarURL: xkcdLogo,
            embeds: [embed]
        });           
    },
    latest: async (context, webhook) => {
        const comic = await fetch(`https://xkcd.com/info.0.json`).then(r => r.json());

        const embed = new MessageEmbed()
            .setTitle(`xkcd comic #${comic.num}: ${comic.safe_title}`)
            .setDescription(`*${comic.alt}*`)
            .setImage(comic.img);
        
        await webhook.send({
            username: "xkcd",
            avatarURL: xkcdLogo,
            embeds: [embed]
        });    
    },

    number: async (context, webhook, number) => {
        const { message } = context;

        const maxComics = await fetch(`https://xkcd.com/info.0.json`).then(r => r.json()).then(r => r.num);

        number = Math.min(number, maxComics);
        number = Math.max(number, 1);

        const comic = await getComicInfo(number);

        const embed = new MessageEmbed()
            .setTitle(`xkcd comic #${comic.num}: ${comic.safe_title}`)
            .setDescription(`*${comic.alt}*`)
            .setImage(comic.img);
        
        await webhook.send({
            username: "xkcd",
            avatarURL: xkcdLogo,
            embeds: [embed]
        });      
    }

};

module.exports = {
    data: {
        name: "xkcd",
        description: "Get a random comic"
    },
    /**
     * 
     * @param {{ message: Message }} context 
     * @param {string} mode 
     */
    async execute(context, mode="random", ...args) {
        const { message } = context;

        const attemptedInt = parseInt(mode);
        if (attemptedInt) {
            mode = "number";
            args = [attemptedInt];
        }

        const webhook = await getWebhook(message.channel);

        if (subcommands.hasOwnProperty(mode)) {
            subcommands[mode](context, webhook, ...args);
        } else {
            await webhook.send({
                username: "xkcd",
                avatarURL: xkcdLogo,
                content: "Please enter a number, or `latest` or `random`"
            });
        }
    }
};
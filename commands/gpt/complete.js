const { Message, MessageEmbed } = require("discord.js");
const { getCensored } = require("/home/pi/xacerbot/helper/censors.js");

const fetch = require("node-fetch").default;

const { addRow } = require("/home/pi/xacerbot/database.js");

// 30 second wait
const waitTime = 1000 * 30;

const queue = [];

let canRun = true;

async function empty () {
    if (!queue.length) {
        canRun = true;
        return;
    }

    canRun = false;

    const task = queue[0];

    await task.replyMessage.edit({
        embeds: [{
            title: "Fetching..."
        }]
    });

    fetch("https://api.eleuther.ai/completion", {
        "headers": {
            "accept": "application/json",
            "accept-language": "en-US,en;q=0.9",
            "content-type": "application/json",
            "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"92\"",
            "sec-ch-ua-mobile": "?0",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site"
        },
        "referrer": "https://6b.eleuther.ai/",
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": `{\"context\":\"${task.prompt}\",\"top_p\":0.9,\"temp\":0.8,\"response_length\":128,\"remove_input\":true}`,
        "method": "POST",
        "mode": "cors",
        "credentials": "omit"
    }).then(async r => {
        const res = await r.json();
        
        let text = `**${task.prompt}**${res[0].generated_text}`;
        
        while (text.includes("\n\n")) text = text.replace("\n\n", "\n");

        const embed = new MessageEmbed()
            .setTitle(`Story requested by ${task.message.member.displayName}`)
            .setDescription(await getCensored(task.message.guild, text));

        await task.replyMessage.edit({
            embeds: [embed]
        });

        await addRow("gpt_requests", [task.message.author.id, task.prompt, text, Date.now()]);

        queue.shift();
        setTimeout(empty, waitTime);
    }).catch(async e => {
        await task.replyMessage.edit({
            embeds: [{
                title: "Error",
                description: e.message
            }]
        });
        queue.shift();
        setTimeout(empty, waitTime);
    });
}

/**
 * 
 * @param {Message} message 
 * @param {string} prompt 
 */
async function addTask (message, prompt) {

    const replyMessage = await message.reply({
        embeds: [{
            title: `Queued... behind ${queue.length} items.`
        }]
    });

    const task = {
        message: message,
        replyMessage: replyMessage,
        prompt: prompt,
        askTime: Date.now()
    };

    // spam prevention
    if (queue.length) {
        const prevQueueTime = queue[0].askTime;
        const diff = task.askTime - prevQueueTime;

        if (diff < 1000) {
            await replyMessage.edit({
                embeds: [{
                    title: `Dude - **${message.member.displayName}**`,
                    description: `You better stop spamming.`
                }]
            });
            return;
        }
    }

    queue.push(task);

    if (queue.length == 1 && canRun) empty();
    
}

module.exports = {
    data: {
        name: "complete",
        description: "Complete a prompt"
    },

    async execute(context, ...args) {
        const { message } = context;

        const prompt = args.join(" ");

        if (prompt.length < 5) {
            await message.reply("Enter in a longer prompt!");
            return;
        }

        addTask(message, prompt);
    }
};
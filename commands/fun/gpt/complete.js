const { Message } = require("discord.js");
const fetch = require("node-fetch").default;
const db = require("/home/pi/xacerbot/database.js");

// 30 second wait
const waitTime = 1000 * 30;

const queue = [];

function empty () {
    const task = queue[0];
    console.log("Running task: ", task);
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

        await task.message.reply(text);

        await db.addRow("gpt_requests", [task.message.author.id, task.prompt, text, Date.now()]);

        queue.shift();
        if (queue.length) {
            setTimeout(empty, waitTime);
        }
    }).catch(async e => {
        await task.message.reply(`There was an error running this command.\n\`\`\`${e.message}\`\`\``);
        queue.shift();
        if (queue.length) {
            setTimeout(empty, waitTime);
        }
    });
}

/**
 * 
 * @param {Message} message 
 * @param {string} prompt 
 */
function addTask (message, prompt) {
    const task = {
        message: message,
        prompt: prompt,
        askTime: Date.now()
    };

    // spam prevention
    if (queue.length) {
        const prevQueueTime = queue[0].askTime;
        const diff = task.askTime - prevQueueTime;

        if (diff < 1000) {
            message.reply("Please don't spam");
            return;
        }
    }

    console.log("Added task to queue: " + task);
    queue.push(task);

    if (queue.length == 1) {
        empty();
    }
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
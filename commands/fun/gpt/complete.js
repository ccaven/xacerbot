const djs = require("discord.js");
const fetch = require("node-fetch").default;
const db = require("/home/pi/xacerbot/database.js");

// 30 second wait
const minWaitTime = 1000 * 30;

module.exports = {
    data: {
        name: "complete",
        description: "Complete a prompt"
    },

    async execute(context, ...args) {
        const { message } = context;

        const output = await message.reply("Fetching...");

        const prompt = args.join(" ");

        if (prompt.length < 5) {
            await output.edit("Enter in a longer prompt!");
            return;
        }

        /*
        // See if it has been asked before
        const query = await db.runQuery("SELECT answer FROM gpt_requests WHERE prompt=$1", [prompt]);

        if (query.rowCount > 0) {
            await output.edit(query.rows[0].answer);
            return;
        }
        */

        // See if the user had run it before
        const query2 = await db.runQuery("SELECT time FROM gpt_requests WHERE user_id = $1 ORDER BY time DESC", [message.author.id]);

        if (query2.rowCount > 0) {
            const dt = Date.now() - query2.rows[0].time;
            if (dt < minWaitTime) {
                const waitTime = (minWaitTime - dt) / 1000;
                await output.edit(`You must wait ${waitTime.toFixed(1)} more seconds before running this command again.`);
                return;
            }
        }

        const r = await fetch("https://api.eleuther.ai/completion", {
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
            "body": `{\"context\":\"${prompt}\",\"top_p\":0.9,\"temp\":0.8,\"response_length\":128,\"remove_input\":true}`,
            "method": "POST",
            "mode": "cors",
            "credentials": "omit"
        }).catch(e => {
            output.edit(`There was an error running this command.\n\`\`\`${e.message}\`\`\``);
        });

        if (!r.ok) {
            await output.edit(`\`\`\`${r.status}: ${r.statusText}\`\`\``);
            return;
        }

        const res = await r.json();
        
        let text = `**${prompt}**${res[0].generated_text}`;
        
        while (text.includes("\n\n")) text = text.replace("\n\n", "\n");

        await output.edit(text);

        // Add row to query
        db.addRow("gpt_requests", [message.author.id, prompt, text, Date.now()]);
    }
};
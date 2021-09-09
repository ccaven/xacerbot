const { createWriteStream, unlink } = require("fs");

const { Message } = require("discord.js");

const { PNG } = require("pngjs");

const subcommands = {

    /**
     * @param {{ message: Message, client: Client }} context 
     * @param {number} amount
     */
    floosh: async (context) => {
        const { message } = context;
        
        const attachments = message.attachments;

        if (attachments.size < 1) {
            await message.reply("You must have an attachment!");
            return;
        }

        // Load image onto canvas

        /*
        const img = await loadImage(attachments.first().url).catch((err) => {
            message.channel.send(`${err.name}: ${err.message}`);
        });
        
        if (!img) return;

        // Get image data
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const original = ctx.getImageData(0, 0, canvas.width, canvas.height);

        function texelFetch (x, y) {
            let l = x + y * original.width << 2;
            return original.data.slice(l, l + 4);
        }

        function sampleData (px, py) {
            const bx = Math.floor(px);
            const by = Math.floor(py);

            const fx = px - bx;
            const fy = py - by;

            const t_00 = texelFetch(bx, by);
            const t_10 = texelFetch(bx + 1, by);
            const t_01 = texelFetch(bx, by + 1);
            const t_11 = texelFetch(bx + 1, by + 1);

            const t_0 = t_00.map((e, i) => e + (t_10[i] - e) * fx);
            const t_1 = t_01.map((e, i) => e + (t_11[i] - e) * fy);

            return t_0.map((e, i) => e + (t_1[i] - e) * fy);
        }

        const newData = new ImageData(img.width, img.height);

        for (let y = 0; y < canvas.height; y ++) {
            for (let x = 0; x < canvas.width; x ++) {
                const l = (x + y * canvas.width) * 4;

                const px = x / canvas.width * 2 - 1;
                const py = y / canvas.height * 2 - 1;

                const r2 = Math.sqrt(px * px + py * py);

                if (r2 <= 1) {
                    const theta = Math.atan2(py, px);
                    const r1 = Math.asin(r2) / 1.571;

                    const ix = (Math.cos(theta) * r1 + 1) * 0.5 * canvas.width;
                    const iy = (Math.sin(theta) * r1 + 1) * 0.5 * canvas.height;

                    const c = sampleData(ix, iy);                    

                    newData.data.set(c, l);

                } else {
                    newData.data[l] = 0;
                    newData.data[l + 1] = 0;
                    newData.data[l + 2] = 0;
                    newData.data[l + 3] = 0;
                }
            }
        }

        ctx.putImageData(newData, 0, 0);

        // Save and post
        const filename = `/home/pi/xacerbot/resources/images/${message.author.id}_${Date.now()}.png`;

        const out = createWriteStream(filename);
        const stream = canvas.createPNGStream();
        stream.pipe(out);

        out.on("finish", async () => {
            await message.channel.send({
                files: [filename]
            });

            // Delete file
            unlink(filename, () => {});
        }); 
        */
    },

    thicc: async (context, amount) => {

    }
};

module.exports = {
    data: {
        name: "memeify",
        description: "Make a meme"
    },
    /**
     * 
     * @param {{ message: Message, client: Client }} context 
     * @param {string} subcommand 
     * @param  {...string} args 
     */
    async execute(context, subcommand, ...args) {
        if (subcommands.hasOwnProperty(subcommand)) {
            await subcommands[subcommand](context, ...args).catch(err => {
                context.message.reply(`${err.name}: ${err.message}`);
            });
        }
        //context.message.reply("Not implemented yet. xacer will work on it soon:tm:");
    }
};
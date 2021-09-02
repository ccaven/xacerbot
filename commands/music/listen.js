const { createConnection, hasConnection, getConnection } = require("./music.js");
const { opus } = require("prism-media");
const { pipeline } = require("stream");
const { Message } = require("discord.js");
const { runQuery } = require("/home/pi/xacerbot/database.js");
const { EndBehaviorType } = require("@discordjs/voice");
const { createWriteStream } = require("fs");



/**
 * Listen to a user
 * @param {{ message: Message }} context - The context of the commnad
 * @returns { Promise<void> }
 */
async function listen (context) {

    const { message } = context;

    const guildId = message.guild.id;
    const userId = message.author.id;

    // Check if is in vc
    const channel = message.member.voice.channel;

    if (!channel) {
        await message.reply("You must be connected to a voice channel!");
        return;
    }

    if (!channel.permissionsFor(message.guild.me).has("CONNECT")) {
        await message.reply("I can't join that voice channel!");
        return;
    }

    if (hasConnection(guildId)) {

    }
    const connection = hasConnection(guildId) ? getConnection(guildId) : await createConnection(channel);
    
    const updateMessage = await message.channel.send(`Starting recording user ${userId}.`)

    const filename = `${message.author.id}_${Date.now()}.pcm`;
    const filepath = `/home/pi/xacerbot/resources/audio/${filename}`

    const opusStream = connection.receiver.subscribe(userId, {
        end: {
            behavior: EndBehaviorType.AfterSilence,
            duration: 100
        },
    });

    const pcmStream = new opus.Decoder({ 
        rate: 48000, 
        channels: 2, 
        frameSize: 960 
    }); 

    const out = createWriteStream(filepath);
    
    pipeline(opusStream, pcmStream, out, err => {
        if (err) {
            updateMessage.edit(`There was an error recording: ${err.message}`);
            return;
        } 
        
        updateMessage.edit(`Finished recording, saved file to ${filename}`);

        // Save to database
        runQuery("INSERT INTO recordings (filename, user_id, server_id) VALUES ($1, $2, $3);", 
            [filepath, userId, guildId]);            
    });
}

module.exports = {
    data: {
        name: "listen",
        description: "Record audio for analysis"
    },
    execute: async (context) => await listen(context)
};
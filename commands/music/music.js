require("dotenv").config();

const ytsr = require("ytsr");
const ytdl = require('ytdl-core');

const fs = require('fs');

const Discord = require('discord.js');
const db = require("/home/pi/xacerbot/database.js");

const voice = require(`@discordjs/voice`);

const { opus } = require("prism-media");
const { pipeline } = require("stream");

// TODO: store playlist locally, not in database

/**
 * @type {Discord.Collection<Discord.Snowflake, voice.VoiceConnection>}
 */
const connections = new Discord.Collection();

/**
 * @type {Discord.Collection<Discord.Snowflake, voice.AudioPlayer}
 */
const audioPlayers = new Discord.Collection();

/**
 * Connect to a channel, or if it is already connected
 * return that connection
 * @param {Discord.VoiceChannel} channel 
 * @returns {Promise<voice.VoiceConnection>}
 */
async function getConnection (channel) {
    const guildId = channel.guild.id;
    const channelId = channel.id;

    // If the connection already exists
    if (connections.has(guildId)) {
        const old = connections.get(guildId);

        console.log(`Accessing existing connection...\n\told channel id ${old.joinConfig.channelId}\n\tnew channel id ${channelId}`);
        
        // If it is the same channel all is goood
        if (old.joinConfig.channelId == channelId) {
            console.log(`Returned existing connection`);
            return connection;
        }

        old.disconnect();
        old.destroy();
        connections.delete(guildId); 
    }

    // Initialize the connection
    const connection = voice.joinVoiceChannel({
        guildId: guildId,
        channelId, channelId,
        adapterCreator: channel.guild.voiceAdapterCreator,
        selfDeaf: false
    });

    connections.set(guildId, connection);

    await voice.entersState(connection, voice.VoiceConnectionStatus.Ready, 20e3);

    connection.receiver.speaking.on('start', (userId) => {
        console.log(`${userId} has started talking.`);
    });


    // Initialize the audio player
    if (!audioPlayers.has(guildId)) {
        const audioPlayer = voice.createAudioPlayer();
        audioPlayers.set(guildId, audioPlayer);
    }

    connection.subscribe(audioPlayers.get(guildId));

    return connection;
}

const subcommands = {
    /**
     * Add a song to the queue
     * @param {{client: Discord.Client, commands: Discord.Collection<string, object>, message: Discord.Message}} context 
     * @param  {...any} args 
     */
    add: async (context, ...args) => {
        const { message } = context;

        if (!args.length) {
            await message.reply("Enter a valid search!");
            return;
        }

        // Search
        const name = args.join(" ");
        
        const searchResults = await ytsr(name, {
            limit: 1
        });

        const result = searchResults.items[0];

        const title = result.title;
        const url = result.url;
        const author = result.author ? result.author.name : result.owner ? result.owner.name : "Unknown";
        // Add it to the queue
        
        const guildId = context.message.guild.id;
        let queueNumber = 0;
        
        const lastQueue = await db.runQuery("SELECT queue_order FROM music_queue WHERE server_id = $1 ORDER BY queue_order DESC", [guildId]);
        if (lastQueue.rowCount > 0)
            queueNumber = lastQueue.rows[0].queue_order + 1;
        
        await db.addRow("music_queue", [guildId, queueNumber, title, author, url]);
        
        await message.reply(`Added **${title}** by **${author}**`);
    },
    /**
     * Go to the next song in the queue
     * @param {{client: Discord.Client, commands: Discord.Collection<string, object>, message: Discord.Message}} context 
     */
    next: async (context) => {
        const { message } = context;
        const guildId = message.guild.id;

        // A couple actions:
        if (!audioPlayers.has(guildId)) {
            await message.channel.send("I'm not connected to a voice channel!");
            return;
        }

        // Stop playing current song
        if (audioPlayers.get(guildId).state == "playing") audioPlayers.get(guildId).stop();

        // Delete where server id matches and queue = 0
        // Bump down queue when server id matches
        await db.runQuery("UPDATE music_queue SET queue_order = queue_order - 1 WHERE server_id = $1", [guildId]);
        await db.runQuery("DELETE FROM music_queue WHERE queue_order < 0");

        // Make sure there is another song
        const query = await db.runQuery("SELECT * FROM music_queue WHERE server_id = $1", [guildId]);
        if (query.rowCount > 0) {
            // Start playing new song
            subcommands.play(context);
        } else {
            message.channel.send("Finished queue.");
        }
    },

    /**
     * Get the queue
     * @param {{client: Discord.Client, commands: Discord.Collection<string, object>, message: Discord.Message}} context 
     */
    queue: async (context) => {
        const { message } = context;


        // Retrieve the queue
        const guildId = message.guild.id;
        const query = await db.runQuery("SELECT * FROM music_queue WHERE server_id = $1", [guildId]);

        if (query.rowCount == 0) {
            await message.reply("There are **0** songs in the queue.")
        } else {
            const msg = query.rows.map(row => `**${row.queue_order + 1}.** ${row.song_name}`).join("\n");
            await message.reply(msg);
        }
    },

    /**
     * Clear all items from the queue
     * @param {{client: Discord.Client, commands: Discord.Collection<string, object>, message: Discord.Message}} context 
     */
    clear: async (context) => {
        const { message } = context;

        // Clear the queue and stop playing
        const guildId = message.guild.id;
        const query = await db.runQuery("DELETE FROM music_queue WHERE server_id = $1", [guildId]);

        if (query.rowCount > 1)
            await message.reply(`Removed ${query.rowCount} items from queue.`);
        else if (query.rowCount == 1) 
            await message.reply(`Removed ${query.rowCount} item from queue.`);
        else
            await message.reply(`There aren't any items in the queue.`);
        
        if (audioPlayers.has(guildId)) audioPlayers.get(guildId).stop();
    },

    /**
     * Connect to a voice channel
     * @param {{client: Discord.Client, commands: Discord.Collection<string, object>, message: Discord.Message}} context 
     */
    connect: async (context) => {
        const { message, client } = context;
        const guildId = message.guild.id;

        // Determine if xacerbot is in a voice channel
        const voiceChannel = message.member.voice.channel;
        
        if (!voiceChannel) {
            await message.reply("You need to be in a voice channel to use this command.");
            return;
        }

        const perms = voiceChannel.permissionsFor(client.user);
        if (!perms.has("CONNECT") || !perms.has("SPEAK")) {
            await message.reply("I need the permissions to join ad speak in your voice channel!");
            return;
        }

        await getConnection(voiceChannel);

        await message.reply("Connected!");
    },

    /**
     * Disconnect from a channel
     * @param {{client: Discord.Client, commands: Discord.Collection<string, object>, message: Discord.Message}} context 
     */
    disconnect: async (context) => {
        const guildId = context.message.guild.id;
        if (connections.has(guildId)) {
            connections.get(guildId).destroy();
            connections.delete(guildId);

            let player = audioPlayers.get(guildId);
            player.stop();
            player = null;
            audioPlayers.delete(guildId);

            await context.message.reply("Goodbye!");
            return;
        }
        await context.message.reply("No existing connections found!");
    },

    /**
     * Start playing audio
     * @param {{client: Discord.Client, commands: Discord.Collection<string, object>, message: Discord.Message}} context 
     */
    play: async (context, ...args) => {
        
        const { message } = context;
        const guildId = message.guild.id;

        if (!connections.has(guildId)) {
            await subcommands.connect(context);
        }

        if (args.join(" ").length > 2) {
            await subcommands.add(context, ...args);
        }

        const player = audioPlayers.get(guildId);

        const { rowCount, rows } = await db.runQuery("SELECT song_name, song_url FROM music_queue WHERE server_id = $1 ORDER BY queue_order ASC", [guildId]);

        if (rowCount > 0) {

            const url = rows[0].song_url;
            try {
                const readStream = ytdl.downloadFromInfo(await ytdl.getInfo(url), {
                    highWaterMark: 1 << 25
                });

                const resource = voice.createAudioResource(readStream);

                player.play(resource);

                readStream.on("end", () => {
                    console.log("Song finished");
                    subcommands.next(context);
                });

                await message.channel.send(`Now playing ${rows[0].song_name}.`);
            } catch (e) {
                await message.channel.send(`Error: ${e.message}`);
            }
        }

        return false;

    },

};

module.exports = {
    data: {
        name: "vibe",
        description: "Search, queue, and play music from Spotify."
    },

    hasConnection: guildId => connections.has(guildId),
    getConnection: guildId => connections.get(guildId),
    createConnection: async channel => await getConnection(channel),

    async execute (context, subcommand, ...args) {
        if (subcommands.hasOwnProperty(subcommand)) {
            await subcommands[subcommand](context, ...args).catch(err => {
                context.message.reply(`Error: ${err.message}`);
                console.log(err);
            });
        } else {
            await subcommands.play(context, subcommand, ...args).catch(err => {
                context.message.reply(`Error: ${err.message}`);
                console.log(err);
            });
        }
    }
};
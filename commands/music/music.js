require("dotenv").config();

const ytsr = require("ytsr");
const ytdl = require('ytdl-core');

const { Snowflake, VoiceChannel, Collection, Message, MessageEmbed } = require('discord.js');

const { getWebhook } = require("/home/pi/xacerbot/helper/webhooks.js");

const { 
    VoiceConnection, AudioPlayer, 
    joinVoiceChannel, createAudioResource, 
    createAudioPlayer, entersState, 
    VoiceConnectionStatus } = require(`@discordjs/voice`);

/**
 * @type {Collection<Snowflake, VoiceConnection>}
 */
const connections = new Collection();

/**
 * @type {Collection<Snowflake, AudioPlayer}
 */
const audioPlayers = new Collection();

/**
 * @type {Collection<Snowflake, ServerQueue>}
 */
const serverQueues = new Collection();

const vibeImg = "https://i.pinimg.com/originals/09/f4/72/09f4726125ab5fa8cbcf754b9ba07e7c.jpg";

/**
 * Connect to a channel, or if it is already connected
 * return that connection
 * @param {VoiceChannel} channel 
 * @returns {Promise<VoiceConnection>}
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
        serverQueues.delete(guildId);
    }

    // Initialize the connection
    const connection = joinVoiceChannel({
        guildId: guildId,
        channelId, channelId,
        adapterCreator: channel.guild.voiceAdapterCreator,
        selfDeaf: false
    });

    connections.set(guildId, connection);

    await entersState(connection, VoiceConnectionStatus.Ready, 20e3);

    connection.receiver.speaking.on('start', (userId) => {
        console.log(`${userId} has started talking.`);
    });


    // Initialize the audio player
    if (!audioPlayers.has(guildId)) {
        const audioPlayer = createAudioPlayer();
        audioPlayers.set(guildId, audioPlayer);
    }

    connection.subscribe(audioPlayers.get(guildId));

    return connection;
}

/**
 * Represents the queue in a single server
 */
class ServerQueue {
    /**
     * 
     * @param {VoiceChannel} channel 
     */
    static async create (channel) {
        const queue = new ServerQueue();

        await queue.setup(channel);

        serverQueues.set(channel.guild.id, queue);

        return queue;
    }

    /**
     * 
     * @param {VoiceChannel} channel 
     */
    async setup (channel) {
        this.guildId = channel.guild.id;

        this.connection = await getConnection(channel);

        this.connection.on("stateChange", (_, state) => {
            if (state == VoiceConnectionStatus.Disconnected) {
                serverQueues.delete(this.guildId);
            }
        });

        this.audioPlayer = audioPlayers.get(this.guildId);

        /**
         * @type {ytsr.Item[]}
         */
        this.playlist = [];

        this.playing = false;
        this.paused = false;

        /**
         * @type {ReadableStream}
         */
        this.currentStream = null;
    }

    async addSong (query) {
        if (!query.length) return;
    
        const filters = await ytsr.getFilters(query);
        const videoFilter = filters.get("Type").get("Video");
        const videoUrl = videoFilter.url;
        const searchResults = await ytsr(videoUrl, {
            limit: 1
        });

        if (!searchResults.items.length) return;

        this.playlist.push(searchResults.items[0]);

        return searchResults.items[0];
    }

    hasNext () {
        return this.playlist.length > 0;
    }
    
    nextSong () {
        if (!this.hasNext()) return null;
        return this.playlist.shift();
    }

    clearQueue () {
        this.playlist.length = 0;
    }

    async start () {
        const song = this.nextSong();
        const url = song.url;
        
        const readStream = ytdl.downloadFromInfo(await ytdl.getInfo(url), {
            highWaterMark: 1 << 25
        });

        // TODO: Stream buffer

        const resource = createAudioResource(readStream);

        this.audioPlayer.play(resource);

        this.currentStream = readStream;
    }

    pause () {
        if (!this.playing) return;

        this.audioPlayer.pause();
        this.paused = true;
    }

    unpause () {
        if (!this.playing) return;

        this.audioPlayer.unpause();
        this.paused = false;
    }

    stop () {
        this.paused = false;
        this.playing = false;

        this.audioPlayer.stop();
    }
}

async function searchForSong (query) {
    if (!query.length) return;
    
    const filters = await ytsr.getFilters(query);
    const videoFilter = filters.get("Type").get("Video");
    const videoUrl = videoFilter.url;
    const searchResults = await ytsr(videoUrl, {
        limit: 1
    });

    return searchResults;
}

async function sendNotConnected (message) {
    const hook = await getWebhook(message.channel);
    const embed = new MessageEmbed();

    embed.setTitle("Oh no!");
    embed.setDescription(`<@${message.member.id}>, xacerbot isn't connected to a voice channel!`);

    await hook.send({
        username: "Vibe Bot",
        avatarURL: vibeImg,
        embeds: [embed]
    });
}

const subcommands = {
    /**
     * Add a song to the queue
     * @param {{message: Message}} context 
     * @param  {...string} args 
     */
    add: async (context, ...args) => {
        const { message } = context;        
        const guildId = message.guild.id;
        const hook = await getWebhook(message.channel);

        if (!serverQueues.has(guildId))
            return sendNotConnected(message);
        

        const queue = serverQueues.get(guildId);
        const query = args.join(" ");
        console.log(`Searching for song: ${query}`);

        const item = await queue.addSong(args.join(" "));

        console.log(item);

        const embed = new MessageEmbed();

        if (item) {
            console.log(item);

            let author = "Unknown";

            if (item.author && item.author.name && item.author.name.length) author = item.author.name;

            const description = `Uploaded ${item.uploadedAt} by ${author}.\nViews: ${item.views.toString().replace(/(?<=\d)(?=(\d\d\d)+(?!\d))/g, ",")}`;

            embed.setTitle(`Added song: ${item.title || "Unknown title"}`);
            embed.setDescription(description);

            if (item.bestThumbnail) {
                embed.setImage(item.bestThumbnail.url);
                embed.setURL(item.url);
            }

            hook.send({
                username: "Vibe Bot",
                avatarURL: vibeImg,
                embeds: [embed]
            });
        } else {

            embed.setTitle("Oh no...");
            embed.setDescription("Something went wrong!");

            hook.send({
                username: "Vibe Bot",
                avatarURL: vibeImg,
                embeds: [embed]
            });
        }
    },

    /**
     * Connect to a voice channel
     * @param {{message: Message}} context 
     */
    queue: async (context) => {

        const { message } = content;

        if (!serverQueues.has(guildId)) return sendNotConnected(message);


    },

    /**
     * Connect to a voice channel
     * @param {{message: Message}} context 
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

        await ServerQueue.create(voiceChannel);

        await message.reply("Connected!");
    },

    /**
     * Disconnect from a channel
     * @param {{message: Message}} context 
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

            serverQueues.delete(guildId);

            await context.message.reply("Goodbye!");
            return;
        }
        await context.message.reply("No existing connections found!");
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
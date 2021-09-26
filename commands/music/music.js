require("dotenv").config();

const ytsr = require("ytsr");
const ytdl = require('ytdl-core');

const { ReadableStreamBuffer } = require('stream-buffers');

const { Snowflake, VoiceChannel, Collection, Message, MessageEmbed } = require('discord.js');

const { getWebhook } = require("/home/pi/xacerbot/helper/webhooks.js");

const { 
    VoiceConnection, AudioPlayer, 
    joinVoiceChannel, createAudioResource, 
    createAudioPlayer, entersState, 
    VoiceConnectionStatus, 
    AudioPlayerStatus,
    AudioResource} = require(`@discordjs/voice`);

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

        console.log(`Setting server queue for guild ${channel.guild.id} \n`, queue);
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

        this.audioPlayer = audioPlayers.get(this.guildId);

        this.audioPlayer.on("stateChange", (prev, state) => {

            console.log(`Finished audio, changing state from ${prev.status} to ${state.status}`);

            if (prev.status == AudioPlayerStatus.Playing && state.status == AudioPlayerStatus.Idle) {
                if (this.hasNext()) this.start();
                else {
                    this.playing = false;
                    this.paused = false;
                }
            }
        });

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

        /**
         * @type {AudioResource}
         */
        this.currentResource = null;

        /**
         * @type {ytsr.Item}
         */
        this.lastPlayed = null;

        this.volumePercent = 1.0;
    }

    getVolumeDecibels () {
        return this.currentResource.volume.volumeDecibels;
    }

    setVolume (percent) {
        this.volumePercent = Math.max(Math.min(percent, 4.0), 0.25);
        this.currentResource.volume.setVolume(this.volumePercent);
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

        const song = searchResults.items[0];

        this.playlist.push(song);

        return song;
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

        this.lastPlayed = song;

        const url = song.url;   
        
        const info = await ytdl.getInfo(url);

        console.log(info.formats);

        const readStream = ytdl.downloadFromInfo(info, {
            highWaterMark: 1 << 25,
            filter: format => format.mimeType.startsWith("audio/mp4"),
            dlChunkSize: 0,
            format: ytdl.chooseFormat(info.formats, { "filter": "audioonly" })
        });

        // TODO: Stream buffer

        const resource = createAudioResource(readStream, {
            inlineVolume: true
        });

        /*
        if (this.currentStream) {
            await this.currentStream.cancel();
        }
        */

        this.currentResource = resource;
        this.currentResource.volume.setVolume(this.volumePercent);

        this.audioPlayer.play(resource);

        this.playing = true;

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

        const item = await queue.addSong(args.join(" "));

        const embed = new MessageEmbed();

        if (item) {
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

    "+": async (...args) => subcommands.add(...args),

    /**
     * Add a song to the queue
     * @param {{message: Message}} context 
     * @param  {string} volumePercent 
     */ 
    volume: async (context, volumePercent) => {
        const { message } = context;

        let isPercent = volumePercent[volumePercent.length - 1] == "%";

        // Remove non-alphanumeric
        volumePercent = volumePercent.replace(/[^\d.-]/g, "")
        volumePercent = parseFloat(volumePercent);
        
        if (!volumePercent) {
            // Bad
        } else {
            if (isPercent) volumePercent *= 100.0;

            const guildId = message.guild.id;

            if (!serverQueues.has(guildId)) return sendNotConnected(message);

            const queue = serverQueues.get(guildId);

            queue.setVolume(volumePercent);

            const hook = await getWebhook(message.channel);
            hook.send({
                username: "Vibe Bot",
                avatarURL: vibeImg,
                embeds: [
                    {
                        title: `Set volume to ${queue.volumePercent*100}%`,
                        description: `This is equivalent to ${queue.getVolumeDecibels()} dB`
                    }
                ]
            });
        }
    },

    /**
     * Start the queue
     * @param {{message: Message}} context 
     * @param  {...string} args 
     */
    play: async (context, ...args) => {

        const { message } = context;

        const guildId = message.guild.id;

        let queue;

        if (!serverQueues.has(guildId)) {
            queue = await subcommands.connect(context);
        } else {
            queue = serverQueues.get(guildId);
        }

        const newSong = args.join(" ");

        if (newSong.length > 3) {
            await subcommands.add(context, newSong);
        }

        if (queue.paused) {
            queue.unpause();
        }

        if (!queue.playing) {
            queue.start();
        }

    },

    /**
     * Connect to a voice channel
     * @param {{message: Message}} context 
     */
    queue: async (context) => {

        const { message } = context;

        const guildId = message.guild.id;

        if (!serverQueues.has(guildId)) return sendNotConnected(message);

        const queue = serverQueues.get(guildId);
        const queueLength = queue.playlist.length;

        const embed = new MessageEmbed();

        embed.setTitle(`Queue for server ${message.guild.name}:`);
        embed.setDescription(`There are ${queueLength} songs in the queue.`);

        if (queue.playing) {
            const songDuration = queue.lastPlayed.duration;
            const timePlayed = queue.audioPlayer.state.playbackDuration
            embed.addField("Currently playing", queue.lastPlayed.title);
        }
        

        if (queueLength > 0)
            embed.addField("Up Next", queue.playlist.map((e, i) => `${i+1}. ${e.title}`).join("\n"));

        const hook = await getWebhook(message.channel);

        hook.send({
            username: "Vibe Bot",
            avatarURL: vibeImg,
            embeds: [embed]
        });
    },

    q: async (...args) => subcommands.queue(...args),

    /**
     * Clear the queue
     * @param {{message: Message}} context 
     */
    clear: async (context) => {
        const { message } = context;

        const guildId = message.guild.id;

        if (!serverQueues.has(guildId)) return sendNotConnected(message);

        const queue = serverQueues.get(guildId);

        const queueLength = queue.playlist.length;

        queue.stop();
        queue.clearQueue();

        const embed = new MessageEmbed();

        embed.setTitle(`Cleared queue for server ${message.guild.name}`);

        if (queueLength == 0) embed.setDescription(`Removed ${queueLength} items.`);
        else embed.setDescription(`Removed ${queueLength} items.`);

        const hook = await getWebhook(message.channel);

        hook.send({
            username: "Vibe Bot",
            avatarURL: vibeImg,
            embeds: [embed]
        });
    },

    pause: async (context) => {
        const { message } = context;

        const guildId = message.guild.id;

        if (!serverQueues.has(guildId)) return sendNotConnected(message);

        const queue = serverQueues.get(guildId);
        const hook = await getWebhook(message.channel);

        if (!queue.playing) {
            hook.send({
                username: "Vibe Bot",
                avatarURL: vibeImg,
                embeds: [
                    {
                        title: `Nothing is currently playing.`,
                        description: queue.lastPlayed ? `Last played was ${queue.lastPlayed.title}` : `Nothing has been played yet!`
                    }
                ]
            });
            return;
        }

        queue.pause();

        const playbackMillis = queue.currentResource.playbackDuration;
        const playbackSeconds = playbackMillis / 1000 | 0;

        const songDuration = queue.lastPlayed.duration;

        const embed = new MessageEmbed();

        embed.setTitle("Set playback state to paused.");
        embed.setDescription(`Ongoing track: ${queue.lastPlayed.title}`);

        embed.addField("Playback duration", `${playbackSeconds/60|0}:${playbackSeconds%60}`, true);
        embed.addField("Song Duration", songDuration, true);

        embed.setThumbnail(queue.lastPlayed.bestThumbnail.url);

        hook.send({
            username: "Vibe Bot",
            avatarURL: vibeImg,
            embeds: [embed]
        });
    },

    resume: async (context) => {
        const { message } = context;

        const guildId = message.guild.id;

        if (!serverQueues.has(guildId)) return sendNotConnected(message);

        const queue = serverQueues.get(guildId);

        const hook = await getWebhook(message.channel);

        if (!queue.playing) {
            hook.send({
                username: "Vibe Bot",
                avatarURL: vibeImg,
                embeds: [
                    {
                        title: `Nothing is currently playing.`,
                        description: queue.lastPlayed ? `Last played was ${queue.lastPlayed.title}` : `Nothing has been played yet!`
                    }
                ]
            });
            return;
        }

        queue.unpause();

        const embed = new MessageEmbed();

        embed.setTitle("Set playback state to paused.");
        embed.setDescription(`Ongoing track: ${queue.lastPlayed.title}`);

        embed.addField("Playback duration", `${playbackSeconds/60|0}:${playbackSeconds%60}`, true);
        embed.addField("Song Duration", songDuration, true);

        embed.setImage(queue.lastPlayed.bestThumbnail.url);

        hook.send({
            username: "Vibe Bot",
            avatarURL: vibeImg,
            embeds: [embed]
        });
    },
    unpause: async (...args) => await subcommands.resume(...args),

    /**
     * Connect to a voice channel
     * @param {{message: Message}} context 
     */
    connect: async (context) => {
        const { message, client } = context;

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

        const queue = await ServerQueue.create(voiceChannel);

        await message.reply("Connected!");

        return queue;
    },

    join: async (...args) => await subcommands.connect(...args),

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

    leave: async (...args) => await subcommands.disconnect(...args),
    die: async (...args) => await subcommands.disconnect(...args),
    cya: async (...args) => await subcommands.disconnect(...args),

    next: async (context) => {
        const { message } = context;

        const guildId = message.guild.id;

        if (!serverQueues.has(guildId)) return sendNotConnected(message);

        const queue = serverQueues.get(guildId);

        if (queue.hasNext()) { 
            await queue.start(); 

            const currentSong = queue.lastPlayed;

            const hook = await getWebhook(message.channel);

            const embed = new MessageEmbed();

            embed.setTitle(`Now playing ${currentSong.title}`);
            embed.setDescription(`Uploaded ${currentSong.uploadedAt} by ${currentSong.author.name}`);

            embed.setImage(currentSong.bestThumbnail.url);

            hook.send({
                username: "Vibe Bot",
                avatarURL: vibeImg,
                embeds: [embed]
            })
        }
        else queue.stop();
    },
    skip: async (...args) => await subcommands.next(...args),
};

module.exports = {
    data: {
        name: "vibe|v",
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
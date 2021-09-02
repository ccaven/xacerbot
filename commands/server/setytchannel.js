const { Message } = require("discord.js");
const { runQuery } = require("/home/pi/xacerbot/database.js");
const { addTracker } = require("/home/pi/xacerbot/helper/yt-trackers.js");

module.exports = {
    data: {
        name: "ytchannel",
        description: "Make a live subscriber count"
    },
    /**
     * 
     * @param {{ message: Message }} context 
     * @param {string} channelId 
     * @param {string} videoUrl
     */
    async execute(context, channelId, videoUrl) {

        const { message } = context;

        const guildId = message.guild.id;
        
        const { rowCount } = await runQuery("SELECT * FROM tracked_yt_channels WHERE channel_id = $1", [channelId]);
        
        if (rowCount != 0) {
            await runQuery("DELETE FROM tracked_yt_channels WHERE channel_id = $1", [channelId]);
        }

        await runQuery("INSERT INTO tracked_yt_channels (server_id, channel_id, video_url) VALUES ($1, $2, $3)", [guildId, channelId, videoUrl]);
    
        const channel = (await message.guild.channels.fetch()).find(c => c.id == channelId);

        addTracker(channel, videoUrl);
    }
};
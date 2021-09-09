const ytdl = require("ytdl-core");
const { Collection, Client, Channel } = require("discord.js");
const { runQuery } = require("/home/pi/xacerbot/database.js");

const trackers = new Collection();

let client;

async function updateCount (channel, videoUrl) {
    const info = await ytdl.getBasicInfo(videoUrl);
    const subs = info.videoDetails.author.subscriber_count;
    const name = info.videoDetails.author.name;

    if (subs !== null) {
        // Convert sub count to K and M
        let subText = subs;
        if (subs > 1000000) {
            subText = subs / 1000000 + "M";
        } else if (subs > 1000) {
            subText = subs / 1000 + "K";
        }
 
        channel.setName(`${name}'s Subs: ${subText}`);
    }
}

module.exports = {
    /**
     * 
     * @param {Client} c 
     */
    setClient: async (c) => { 
        client = c;
        
        // Go through all guilds
        const allGuilds = await client.guilds.fetch();
        allGuilds.forEach(async oath2 => {

            const guild = await oath2.fetch();
            
            const guildId = guild.id;

            const { rowCount, rows } = await runQuery("SELECT * FROM tracked_yt_channels WHERE server_id = $1", [guildId]);

            for (let rowIndex = 0; rowIndex < rowCount; rowIndex ++) {

                const channelId = rows[rowIndex].channel_id;
                const videoUrl = rows[rowIndex].video_url;

                const channel = await guild.channels.fetch(channelId);

                if (!channel) continue;

                // Update every hour
                updateCount(channel, videoUrl);
                trackers.set(channelId, setInterval(async () => {
                    updateCount(channel, videoUrl);
                }, 1000 * 60 * 60));
            }
        });
    },

    /**
     * 
     * @param {Channel} channel 
     * @param {string} videoUrl 
     */
    addTracker: (channel, videoUrl) => {
        updateCount(channel, videoUrl);

        const channelId = channel.id;

        // Update every hour
        trackers.set(channelId, setInterval(async () => {
            updateCount(channel, videoUrl);
        }, 1000 * 60 * 60));

    },
};


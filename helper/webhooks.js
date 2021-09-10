const { Collection, Webhook, TextChannel } = require("discord.js");

/**
 * @type {Collection<string, Webhook>}
 */
const webhookCache = new Collection();

module.exports = {
    /**
     * 
     * @param {TextChannel} channel 
     */
    async getWebhook (channel) {
        // Determine if already in cache
        const channelId = channel.id;
        if (webhookCache.has(channelId)) {
            return webhookCache.get(channelId);
        }

        if (!channel) {
            return null;
        }

        // Determine if channel has webhook
        const webhook = (await channel.fetchWebhooks()).find(wh => wh.owner.id == channel.client.user.id);

        // Webhook does not exist
        if (!webhook) {

            // Create it
            const newWebhook = await channel.createWebhook("xacerbot Webhook");

            // Add to cache
            webhookCache.set(channelId, newWebhook);

            return newWebhook;

        }

        // Webhook already exists

        // Add to cache
        webhookCache.set(channelId, webhook);

        return webhook;
    }
};

const { Collection, Webhook, TextChannel } = require("discord.js");

/**
 * @type {Collection<string, Webhook>}
 */
const webhookCache = new Collection();

async function regenerateWebhook (channel) {
    // Check if channel has a webhook
    const allWebhooks = await channel.fetchWebhooks();

    const xacerbotHook = allWebhooks.find(wh => wh.name == "xacerbot Webhook");

    if (!xacerbotHook) {
        // Create and return it
        const hook = await channel.createWebhook("xacerbot Webhook");
        return hook;
    }

    // return it
    return xacerbotHook;
}

module.exports = {
    /**
     * 
     * @param {TextChannel} channel 
     */
    async getWebhook (channel) {
        // Determine if already in cache
        const channelId = channel.id;
        if (webhookCache.has(channelId)) {
            const hook = webhookCache.get(channelId);
            
            if (!(await channel.fetchWebhooks()).has(hook.id)) {
                const newHook = await regenerateWebhook(channel);
                webhookCache.set(channelId, newHook);
                // if (newHook != hook) await hook.delete("Invalid");
            }

            // Check if hook is valid


            return webhookCache.get(channelId);
        }

        if (!channel) {
            return null;
        }

        // Determine if channel has webhook
        const webhook = (await channel.fetchWebhooks()).find(wh => wh.name == "xacerbot Webhook");

        // Webhook does not exist
        if (!webhook) {

            // Create it
            const newWebhook = await channel.createWebhook("xacerbot Webhook");

            // Add to cache
            webhookCache.set(channelId, newWebhook);

            return newWebhook;

        }
        // Add to cache
        webhookCache.set(channelId, webhook);

        return webhook;
    },

    /**
     * 
     * @param {TextChannel} channel 
     */
    regenerateWebhook: async (channel) => await regenerateWebhook(channel)
};

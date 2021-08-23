const djs = require("discord.js");
const db = require("/home/pi/xacerbot/database.js");

/**
 * Calculate the edit distance between two strings
 * @param {String} a The first string
 * @param {String} b The second string
 * @returns {Number} Number of edits it takes to turn a to b
 */
function getEditDistance (a, b) {

}

/**
 * Get users with a particular username
 * @param {String} nickname The nickname of the user
 * @param {djs.Guild} guild The guild the users are in
 */
function getUserByNickname (nickname, guild) {

}

/**
 * Search users by display name
 * @param {String} displayName The display name of the user
 * @param {djs.Guild} guild The guild the users are in
 */
function getUserByDisplayName (displayName, guild) {

}

/**
 * Get a particular user by their ID
 * @param {String} id The id of the user
 * @param {djs.Guild} guild The guild they are in
 */
function getUserByID (id, guild) {

}

module.exports = {
    data: {
        name: "userinfo",
        description: "Retrieve information about a user"
    },
    /**
     * Execute the command
     * @param {{client: djs.Client, commands: djs.Collection<string, object>, message: djs.Message}} context 
     * @param {String} username 
     */
    async execute(context, username) {
        const {message, client, commands} = context;

        const allmembers = await message.guild.members.fetch();

        const ourMember = allmembers.find(v => {
            console.log(v.user.username);
            return v.user.username.toLowerCase() == username;
        });

        if (!ourMember) {
            await message.reply("No member found! D:");
            return;
        }

        const embed = new djs.MessageEmbed()
            .setColor("#ffffff")
            .setTitle(ourMember.user.tag);

        await message.channel.send({ embeds: [embed] });

    }
};

 
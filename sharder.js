
const { config } = require("dotenv");

config();

const { ShardingManager } = require("discord.js");

const sharder = new ShardingManager("./index.js", {
    totalShards: 1
});

sharder.on("shardCreate", shard => {
    console.log(`Launched shard #${shard.id}.`);
});

sharder.spawn();
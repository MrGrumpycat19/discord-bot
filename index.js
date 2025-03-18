const keepAlive = require('./keep_alive.js');

keepAlive();

const { Client, GatewayIntentBits, ChannelType } = require('discord.js');
const { google } = require('googleapis');
require('dotenv').config();

// Create Discord client
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

// YouTube API setup
const youtube = google.youtube({
  version: 'v3',
  auth: process.env.your_youtube_api_key, // Your API key in .env
});

const CHANNEL_NAME_TEMPLATE = "🟥 Subs: ";

// Function to format numbers into readable K/M/B format
function formatSubscribers(count) {
  if (count >= 1_000_000_000) return (count / 1_000_000_000).toFixed(2) + "B";
  if (count >= 1_000_000) return (count / 1_000_000).toFixed(2) + "M";
  if (count >= 1_000) return (count / 1_000).toFixed(2) + "K";
  return count.toString(); // Less than 1K, show full number
}

async function updateVoiceChannel(guild) {
  try {
    const response = await youtube.channels.list({
      part: 'statistics',
      id: process.env.your_youtube_channel_id, // Your channel ID in .env
    });

    const subscribers = parseInt(response.data.items[0].statistics.subscriberCount, 10);
    const formattedSubscribers = formatSubscribers(subscribers);
    const channelName = `${CHANNEL_NAME_TEMPLATE}${formattedSubscribers}`;

    let voiceChannel = guild.channels.cache.find(
      (ch) => ch.type === ChannelType.GuildVoice && ch.name.startsWith(CHANNEL_NAME_TEMPLATE)
    );

    if (!voiceChannel) {
      voiceChannel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildVoice,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id, // Allow everyone to view the channel
            allow: ['ViewChannel'],
          },
        ],
      });
    } else {
      if (voiceChannel.name !== channelName) {
        await voiceChannel.setName(channelName);
        console.log(`Updated channel name to: ${channelName}`);
      }
    }
  } catch (error) {
    console.error('Error updating channel:', error);
  }
}

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  const guild = await client.guilds.fetch(process.env.your_guild_id);
  updateVoiceChannel(guild);

  // Update every 10 minutes
  setInterval(() => updateVoiceChannel(guild), 600000);
});

client.login(process.env.your_discord_token);
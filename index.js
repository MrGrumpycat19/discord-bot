const { Client, GatewayIntentBits, ChannelType, PermissionsBitField } = require('discord.js');
const { google } = require('googleapis');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// YouTube API Setup
const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
});

// Constants
const CHANNEL_NAME_TEMPLATE = '🟥 Subs: ';
const POLL_INTERVAL = 10 * 60 * 1000; // 10 minutes

// Format subscriber count
function formatSubscribers(count) {
  if (count >= 1_000_000_000) return (count / 1_000_000_000).toFixed(2).replace(/\.00$/, '') + 'B';
  if (count >= 1_000_000) return (count / 1_000_000).toFixed(2).replace(/\.00$/, '') + 'M';
  if (count >= 1_000) return (count / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return count.toString();
}

// Main function to update channel name
async function updateVoiceChannel(guild) {
  try {
    const res = await youtube.channels.list({
      part: 'statistics',
      id: process.env.YOUTUBE_CHANNEL_ID,
    });

    const subscriberCount = parseInt(res.data.items[0].statistics.subscriberCount, 10);
    const formatted = formatSubscribers(subscriberCount);
    const targetName = `${CHANNEL_NAME_TEMPLATE}${formatted}`;

    let voiceChannel = guild.channels.cache.find(
      (ch) => ch.type === ChannelType.GuildVoice && ch.name.startsWith(CHANNEL_NAME_TEMPLATE)
    );

    if (!voiceChannel) {
      voiceChannel = await guild.channels.create({
        name: targetName,
        type: ChannelType.GuildVoice,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            allow: [PermissionsBitField.Flags.ViewChannel],
            deny: [PermissionsBitField.Flags.Connect],
          },
        ],
      });
      console.log(`Created new channel: ${targetName}`);
    } else if (voiceChannel.name !== targetName) {
      await voiceChannel.setName(targetName);
      console.log(`Updated channel name to: ${targetName}`);
    }
  } catch (err) {
    console.error('Failed to update channel:', err.message);
  }
}

// On bot ready
client.once('ready', async () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);

  try {
    const guild = await client.guilds.fetch(process.env.GUILD_ID);
    await updateVoiceChannel(guild);
    setInterval(() => updateVoiceChannel(guild), POLL_INTERVAL);
  } catch (err) {
    console.error('Error initializing bot:', err.message);
  }
});

// Start bot
client.login(process.env.DISCORD_TOKEN);

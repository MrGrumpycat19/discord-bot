const { Client, GatewayIntentBits, ChannelType } = require('discord.js');
const { google } = require('googleapis');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const youtube = google.youtube({ version: 'v3', auth: process.env.your_youtube_api_key });
const CHANNEL_NAME_TEMPLATE = "🟥 Subs: ";

function formatSubscribers(count) {
  if (count >= 1_000_000_000) return (count / 1_000_000_000).toFixed(2).replace(/\.00$/, '') + "B";
  if (count >= 1_000_000) return (count / 1_000_000).toFixed(2).replace(/\.00$/, '') + "M";
  if (count >= 1_000) return (count / 1_000).toFixed(1).replace(/\.0$/, '') + "K";
  return count.toString();
}

async function updateVoiceChannel(guild) {
  try {
    const response = await youtube.channels.list({
      part: 'statistics',
      id: process.env.your_youtube_channel_id,
    });

    const subscribers = parseInt(response.data.items[0].statistics.subscriberCount, 10);
    const formattedSubscribers = formatSubscribers(subscribers);
    const channelName = `${CHANNEL_NAME_TEMPLATE}${formattedSubscribers}`;

    const voiceChannel = guild.channels.cache.find(
      (ch) => ch.type === ChannelType.GuildVoice && ch.name.startsWith(CHANNEL_NAME_TEMPLATE)
    );

    if (!voiceChannel) {
      await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildVoice,
        permissionOverwrites: [{ id: guild.roles.everyone.id, allow: ['ViewChannel'] }],
      });
    } else if (voiceChannel.name !== channelName) {
      await voiceChannel.setName(channelName);
      console.log(`Updated channel name to: ${channelName}`);
    }
  } catch (error) {
    console.error('Error updating channel:', error);
  }
}

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  const guild = await client.guilds.fetch(process.env.your_guild_id);
  updateVoiceChannel(guild);
  setInterval(() => updateVoiceChannel(guild), 600000);
});

client.login(process.env.your_discord_token);

import dotenv from 'dotenv';
import TS3Bot from './bot/ts3-bot.js';
import AudioPlayer from './bot/audio-player.js';
import APIServer from './api/server.js';

// Load environment variables
dotenv.config();

// Configuration
const config = {
    ts3: {
        host: process.env.TS3_HOST || 'localhost',
        port: parseInt(process.env.TS3_PORT) || 9987,
        username: process.env.TS3_USERNAME || 'serveradmin',
        password: process.env.TS3_PASSWORD,
        nickname: process.env.TS3_NICKNAME || 'MusicBot',
        defaultChannel: process.env.TS3_DEFAULT_CHANNEL
    },
    api: {
        port: parseInt(process.env.API_PORT) || 3000
    },
    audio: {
        defaultVolume: parseInt(process.env.DEFAULT_VOLUME) || 50
    }
};

// Initialize components
const audioPlayer = new AudioPlayer();
const bot = new TS3Bot(config.ts3);
const apiServer = new APIServer(bot, audioPlayer, config.api.port);

// Set default volume
audioPlayer.setVolume(config.audio.defaultVolume);

// Audio player event handlers
audioPlayer.on('songStart', (song) => {
    console.log(`🎵 Now playing: ${song.title} - ${song.artist}`);

    // Play audio through TS3 bot
    const stream = audioPlayer.getCurrentStream();
    if (stream && bot.connected) {
        bot.playAudio(stream, audioPlayer.volume);
    }
});

audioPlayer.on('playbackEnd', () => {
    console.log('⏹️  Playback ended');
    bot.stopAudio();
});

audioPlayer.on('queueUpdate', (status) => {
    console.log(`📋 Queue: ${status.queueLength} songs`);
});

// Bot event handlers
bot.on('connected', () => {
    console.log('✅ Connected to TeamSpeak server');
});

bot.on('disconnected', () => {
    console.log('❌ Disconnected from TeamSpeak server');
});

bot.on('error', (error) => {
    console.error('❌ Bot error:', error);
});

bot.on('channelJoined', (channelId) => {
    console.log(`🔊 Joined channel: ${channelId}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down...');

    audioPlayer.stop();
    apiServer.stop();
    await bot.disconnect();

    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down...');

    audioPlayer.stop();
    apiServer.stop();
    await bot.disconnect();

    process.exit(0);
});

// Start the bot
async function start() {
    try {
        console.log('🚀 Starting TS3 Music Bot...');
        console.log('================================');

        // Start API server
        await apiServer.start();
        console.log(`✅ API Server: http://localhost:${config.api.port}`);

        // Connect to TeamSpeak
        await bot.connect();

        console.log('================================');
        console.log('✅ Bot is ready!');
        console.log(`📡 Web Interface: http://localhost:${config.api.port}`);
        console.log('================================');

    } catch (error) {
        console.error('❌ Failed to start bot:', error);
        process.exit(1);
    }
}

// Start the application
start();

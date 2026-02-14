import { TeamSpeak, QueryProtocol } from 'ts3-nodejs-library';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';

class TS3Bot extends EventEmitter {
    constructor(config) {
        super();
        this.config = config;
        this.client = null;
        this.connected = false;
        this.currentChannel = null;
        this.ffmpegProcess = null;
    }

    /**
     * Connect to TeamSpeak server
     */
    async connect() {
        try {
            console.log('Connecting to TeamSpeak server...');

            this.client = await TeamSpeak.connect({
                host: this.config.host,
                queryport: 10011, // Default ServerQuery port
                protocol: QueryProtocol.RAW,
                username: this.config.username,
                password: this.config.password,
                nickname: this.config.nickname
            });

            console.log('Connected to TeamSpeak server');

            // Select virtual server
            const servers = await this.client.serverList();
            if (servers.length > 0) {
                await this.client.useBySid(servers[0].virtualserver_id);
            }

            // Get client ID
            const whoami = await this.client.whoami();
            this.clientId = whoami.client_id;

            this.connected = true;
            this.emit('connected');

            // Join default channel if specified
            if (this.config.defaultChannel) {
                await this.joinChannelByName(this.config.defaultChannel);
            }

            return true;
        } catch (error) {
            console.error('Failed to connect to TeamSpeak:', error);
            this.emit('error', error);
            throw error;
        }
    }

    /**
     * Disconnect from TeamSpeak
     */
    async disconnect() {
        if (this.ffmpegProcess) {
            this.stopAudio();
        }

        if (this.client) {
            await this.client.quit();
            this.client = null;
        }

        this.connected = false;
        this.emit('disconnected');
    }

    /**
     * Get list of all channels
     */
    async getChannels() {
        if (!this.connected) {
            throw new Error('Not connected to TeamSpeak server');
        }

        const channels = await this.client.channelList();
        return channels.map(ch => ({
            id: ch.cid,
            name: ch.channel_name,
            parentId: ch.pid
        }));
    }

    /**
     * Join channel by name
     */
    async joinChannelByName(channelName) {
        const channels = await this.getChannels();
        const channel = channels.find(ch =>
            ch.name.toLowerCase() === channelName.toLowerCase()
        );

        if (!channel) {
            throw new Error(`Channel "${channelName}" not found`);
        }

        return this.joinChannel(channel.id);
    }

    /**
     * Join channel by ID
     */
    async joinChannel(channelId) {
        if (!this.connected) {
            throw new Error('Not connected to TeamSpeak server');
        }

        try {
            await this.client.clientMove(this.clientId, channelId);
            this.currentChannel = channelId;
            this.emit('channelJoined', channelId);
            console.log(`Joined channel: ${channelId}`);
            return true;
        } catch (error) {
            console.error('Failed to join channel:', error);
            throw error;
        }
    }

    /**
     * Play audio stream
     */
    async playAudio(audioStream, volume = 50) {
        if (!this.connected) {
            throw new Error('Not connected to TeamSpeak server');
        }

        // Stop any existing audio
        this.stopAudio();

        return new Promise((resolve, reject) => {
            try {
                // Use ffmpeg to convert audio stream to format TS3 can handle
                this.ffmpegProcess = spawn('ffmpeg', [
                    '-i', 'pipe:0',                    // Input from stdin
                    '-f', 's16le',                     // PCM signed 16-bit little-endian
                    '-ar', '48000',                    // 48kHz sample rate
                    '-ac', '2',                        // Stereo
                    '-af', `volume=${volume / 100}`,   // Volume control
                    'pipe:1'                           // Output to stdout
                ]);

                // Pipe audio stream to ffmpeg
                audioStream.pipe(this.ffmpegProcess.stdin);

                // Send ffmpeg output to TeamSpeak
                this.ffmpegProcess.stdout.on('data', (data) => {
                    // Note: ts3-nodejs-library doesn't directly support audio streaming
                    // This is a simplified example. For production, you'd need to use
                    // the TeamSpeak Client SDK or a different approach
                    // For now, this demonstrates the concept
                });

                this.ffmpegProcess.stderr.on('data', (data) => {
                    // Log ffmpeg errors/info
                    console.log('FFmpeg:', data.toString());
                });

                this.ffmpegProcess.on('close', (code) => {
                    console.log('FFmpeg process closed with code:', code);
                    this.ffmpegProcess = null;
                    this.emit('audioEnd');
                });

                this.ffmpegProcess.on('error', (error) => {
                    console.error('FFmpeg error:', error);
                    reject(error);
                });

                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Stop audio playback
     */
    stopAudio() {
        if (this.ffmpegProcess) {
            this.ffmpegProcess.kill('SIGTERM');
            this.ffmpegProcess = null;
            this.emit('audioStopped');
        }
    }

    /**
     * Get bot status
     */
    getStatus() {
        return {
            connected: this.connected,
            currentChannel: this.currentChannel,
            nickname: this.config.nickname
        };
    }
}

export default TS3Bot;

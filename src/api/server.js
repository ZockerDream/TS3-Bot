import express from 'express';
import cors from 'cors';

class APIServer {
    constructor(bot, audioPlayer, port = 3000) {
        this.bot = bot;
        this.audioPlayer = audioPlayer;
        this.port = port;
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
    }

    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.static('public'));
    }

    setupRoutes() {
        // Health check
        this.app.get('/api/health', (req, res) => {
            res.json({ status: 'ok', timestamp: new Date().toISOString() });
        });

        // Get bot status
        this.app.get('/api/status', async (req, res) => {
            try {
                const botStatus = this.bot.getStatus();
                const playerStatus = this.audioPlayer.getStatus();

                res.json({
                    bot: botStatus,
                    player: playerStatus
                });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Get available channels
        this.app.get('/api/channels', async (req, res) => {
            try {
                const channels = await this.bot.getChannels();
                res.json({ channels });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Add song to queue
        this.app.post('/api/play', async (req, res) => {
            try {
                const { url } = req.body;

                if (!url) {
                    return res.status(400).json({ error: 'URL is required' });
                }

                const songInfo = await this.audioPlayer.addToQueue(url);
                res.json({
                    success: true,
                    message: 'Added to queue',
                    song: songInfo
                });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Pause playback
        this.app.post('/api/pause', (req, res) => {
            try {
                const success = this.audioPlayer.pause();
                res.json({
                    success,
                    message: success ? 'Playback paused' : 'Nothing to pause'
                });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Resume playback
        this.app.post('/api/resume', (req, res) => {
            try {
                const success = this.audioPlayer.resume();
                res.json({
                    success,
                    message: success ? 'Playback resumed' : 'Nothing to resume'
                });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Skip current song
        this.app.post('/api/skip', (req, res) => {
            try {
                const success = this.audioPlayer.skip();
                res.json({
                    success,
                    message: success ? 'Song skipped' : 'Nothing to skip'
                });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Stop playback and clear queue
        this.app.post('/api/stop', (req, res) => {
            try {
                this.audioPlayer.stop();
                res.json({
                    success: true,
                    message: 'Playback stopped and queue cleared'
                });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Set volume
        this.app.post('/api/volume', (req, res) => {
            try {
                const { volume } = req.body;

                if (volume === undefined || volume < 0 || volume > 100) {
                    return res.status(400).json({ error: 'Volume must be between 0 and 100' });
                }

                const newVolume = this.audioPlayer.setVolume(volume);
                res.json({
                    success: true,
                    volume: newVolume
                });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Switch channel
        this.app.post('/api/channel', async (req, res) => {
            try {
                const { channelId, channelName } = req.body;

                if (channelId) {
                    await this.bot.joinChannel(channelId);
                    res.json({
                        success: true,
                        message: `Joined channel ${channelId}`
                    });
                } else if (channelName) {
                    await this.bot.joinChannelByName(channelName);
                    res.json({
                        success: true,
                        message: `Joined channel "${channelName}"`
                    });
                } else {
                    res.status(400).json({ error: 'channelId or channelName is required' });
                }
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Clear queue
        this.app.post('/api/clear', (req, res) => {
            try {
                this.audioPlayer.queue = [];
                res.json({
                    success: true,
                    message: 'Queue cleared'
                });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }

    start() {
        return new Promise((resolve) => {
            this.server = this.app.listen(this.port, () => {
                console.log(`API Server running on port ${this.port}`);
                resolve();
            });
        });
    }

    stop() {
        if (this.server) {
            this.server.close();
        }
    }
}

export default APIServer;

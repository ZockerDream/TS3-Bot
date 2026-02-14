# 🎵 TeamSpeak 3 Music Bot

A powerful music bot for TeamSpeak 3 that plays music from YouTube and Spotify URLs, controlled through a modern web interface.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)
![Docker](https://img.shields.io/badge/docker-ready-blue.svg)

## ✨ Features

- 🎵 **YouTube Support** - Play any YouTube video directly
- 🎧 **Spotify Integration** - Automatically converts Spotify tracks to YouTube
- 🌐 **Web Interface** - Modern, responsive control panel
- 🎛️ **Full Playback Control** - Play, pause, skip, stop, volume control
- 📋 **Queue Management** - Add multiple songs and manage the queue
- 🔊 **Channel Selection** - Choose which channel the bot joins
- 🐳 **Docker Ready** - Easy deployment with Docker Compose
- 🎨 **Beautiful UI** - Dark theme with glassmorphism and smooth animations

## 📋 Prerequisites

- **Node.js** 20.x or higher (for local development)
- **Docker** and **Docker Compose** (for production deployment)
- **TeamSpeak 3 Server** with ServerQuery access
- **FFmpeg** (automatically installed in Docker)

## 🚀 Quick Start with Docker

### 1. Clone or Download

```bash
cd /path/to/teamspeak
```

### 2. Configure Environment

Copy the example environment file and edit it:

```bash
cp .env.example .env
nano .env
```

Edit the following variables:

```env
# Your TS3 server details
TS3_HOST=your-ts3-server.com
TS3_PORT=9987
TS3_USERNAME=serveradmin
TS3_PASSWORD=your-serverquery-password

# Optional: Default channel to join
TS3_DEFAULT_CHANNEL=Music

# Optional: Bot nickname
TS3_NICKNAME=MusicBot
```

### 3. Build and Run

```bash
# Build the Docker image
docker-compose build

# Start the bot
docker-compose up -d

# View logs
docker-compose logs -f
```

### 4. Access Web Interface

Open your browser and navigate to:

```
http://your-server-ip:3000
```

## 🛠️ Local Development

### Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### Run Development Servers

```bash
# Terminal 1: Start backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev
```

Frontend will be available at `http://localhost:5173`

## 📖 Usage

### Adding Music

1. Copy a YouTube or Spotify URL
2. Paste it into the input field
3. Click "Add to Queue"
4. The bot will automatically start playing

### Playback Controls

- **Pause** ⏸️ - Pause current song
- **Resume** ▶️ - Resume playback
- **Skip** ⏭️ - Skip to next song
- **Stop** ⏹️ - Stop playback and clear queue
- **Volume** 🔊 - Adjust volume (0-100%)

### Channel Management

1. Select a channel from the dropdown
2. Click "Join Channel"
3. The bot will move to the selected channel

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `TS3_HOST` | TeamSpeak server hostname | `localhost` |
| `TS3_PORT` | TeamSpeak server port | `9987` |
| `TS3_USERNAME` | ServerQuery username | `serveradmin` |
| `TS3_PASSWORD` | ServerQuery password | - |
| `TS3_NICKNAME` | Bot display name | `MusicBot` |
| `TS3_DEFAULT_CHANNEL` | Channel to join on start | - |
| `API_PORT` | Web interface port | `3000` |
| `DEFAULT_VOLUME` | Initial volume (0-100) | `50` |

## 📡 API Endpoints

The bot exposes a REST API for programmatic control:

### Status
- `GET /api/status` - Get bot and player status
- `GET /api/health` - Health check

### Playback
- `POST /api/play` - Add URL to queue
  ```json
  { "url": "https://youtube.com/watch?v=..." }
  ```
- `POST /api/pause` - Pause playback
- `POST /api/resume` - Resume playback
- `POST /api/skip` - Skip current song
- `POST /api/stop` - Stop and clear queue

### Controls
- `POST /api/volume` - Set volume
  ```json
  { "volume": 75 }
  ```
- `POST /api/channel` - Switch channel
  ```json
  { "channelId": "123" }
  // or
  { "channelName": "Music" }
  ```
- `POST /api/clear` - Clear queue

### Channels
- `GET /api/channels` - List available channels

## 🐳 Docker Commands

```bash
# Start bot
docker-compose up -d

# Stop bot
docker-compose down

# View logs
docker-compose logs -f

# Restart bot
docker-compose restart

# Rebuild after changes
docker-compose up -d --build

# Remove everything
docker-compose down -v
```

## 🔍 Troubleshooting

### Bot won't connect to TeamSpeak

- Verify `TS3_HOST`, `TS3_USERNAME`, and `TS3_PASSWORD` are correct
- Ensure ServerQuery is enabled on your TS3 server
- Check firewall rules allow connection to port 10011 (ServerQuery)

### Audio not playing

- Ensure FFmpeg is installed (`ffmpeg -version`)
- Check bot has permissions in the channel
- Verify the YouTube/Spotify URL is valid

### Web interface not loading

- Check the bot is running: `docker-compose ps`
- Verify port 3000 is not blocked by firewall
- Check logs: `docker-compose logs`

## 📝 Notes

### Spotify Limitations

Spotify doesn't allow direct audio streaming without their Premium API. This bot works around this by:

1. Extracting track metadata from Spotify URLs
2. Searching for the same song on YouTube
3. Playing the YouTube version

This means:
- ✅ Works with any Spotify track URL
- ✅ No Spotify Premium required
- ⚠️ May occasionally find wrong versions
- ⚠️ Depends on YouTube availability

### TeamSpeak 5

This bot is designed for **TeamSpeak 3**. For TeamSpeak 5, you would need different libraries as the API is different.

## 🤝 Contributing

Contributions are welcome! Feel free to:

- Report bugs
- Suggest features
- Submit pull requests

## 📄 License

MIT License - feel free to use this project however you like!

## 🙏 Credits

Built with:
- [ts3-nodejs-library](https://github.com/Multivit4min/TS3-NodeJS-Library) - TeamSpeak 3 client
- [ytdl-core](https://github.com/distube/ytdl-core) - YouTube downloader
- [Express](https://expressjs.com/) - Web framework
- [Vite](https://vitejs.dev/) - Frontend build tool

---

Made with 💜 for the TeamSpeak community

import ytdl from '@distube/ytdl-core';
import { getData } from 'spotify-url-info';
import YouTube from 'youtube-sr';
import { EventEmitter } from 'events';

class AudioPlayer extends EventEmitter {
  constructor() {
    super();
    this.queue = [];
    this.currentSong = null;
    this.isPlaying = false;
    this.isPaused = false;
    this.volume = 50;
    this.stream = null;
  }

  /**
   * Add a URL to the queue (YouTube or Spotify)
   */
  async addToQueue(url) {
    try {
      let songInfo;

      if (this.isSpotifyUrl(url)) {
        songInfo = await this.handleSpotifyUrl(url);
      } else if (this.isYouTubeUrl(url)) {
        songInfo = await this.handleYouTubeUrl(url);
      } else {
        throw new Error('Unsupported URL format. Please provide a YouTube or Spotify URL.');
      }

      this.queue.push(songInfo);
      this.emit('queueUpdate', this.getStatus());

      // Auto-play if nothing is playing
      if (!this.isPlaying && !this.isPaused) {
        this.playNext();
      }

      return songInfo;
    } catch (error) {
      console.error('Error adding to queue:', error);
      throw error;
    }
  }

  /**
   * Check if URL is Spotify
   */
  isSpotifyUrl(url) {
    return url.includes('spotify.com');
  }

  /**
   * Check if URL is YouTube
   */
  isYouTubeUrl(url) {
    return url.includes('youtube.com') || url.includes('youtu.be');
  }

  /**
   * Handle Spotify URL - convert to YouTube search
   */
  async handleSpotifyUrl(url) {
    console.log('Processing Spotify URL:', url);
    
    // Get Spotify track info
    const spotifyData = await getData(url);
    const searchQuery = `${spotifyData.name} ${spotifyData.artists?.[0]?.name || ''}`;
    
    console.log('Searching YouTube for:', searchQuery);
    
    // Search YouTube for the song
    const searchResults = await YouTube.search(searchQuery, { limit: 1, type: 'video' });
    
    if (!searchResults || searchResults.length === 0) {
      throw new Error(`Could not find "${searchQuery}" on YouTube`);
    }

    const video = searchResults[0];
    
    return {
      title: spotifyData.name,
      artist: spotifyData.artists?.[0]?.name || 'Unknown Artist',
      url: video.url,
      originalUrl: url,
      source: 'spotify',
      duration: video.duration,
      thumbnail: spotifyData.coverArt?.sources?.[0]?.url || video.thumbnail?.url
    };
  }

  /**
   * Handle YouTube URL
   */
  async handleYouTubeUrl(url) {
    console.log('Processing YouTube URL:', url);
    
    const info = await ytdl.getInfo(url);
    const details = info.videoDetails;

    return {
      title: details.title,
      artist: details.author.name,
      url: details.video_url,
      originalUrl: url,
      source: 'youtube',
      duration: parseInt(details.lengthSeconds),
      thumbnail: details.thumbnails?.[0]?.url
    };
  }

  /**
   * Play next song in queue
   */
  async playNext() {
    if (this.queue.length === 0) {
      this.currentSong = null;
      this.isPlaying = false;
      this.emit('playbackEnd');
      this.emit('queueUpdate', this.getStatus());
      return;
    }

    this.currentSong = this.queue.shift();
    this.isPlaying = true;
    this.isPaused = false;

    console.log('Now playing:', this.currentSong.title);
    this.emit('songStart', this.currentSong);
    this.emit('queueUpdate', this.getStatus());

    try {
      // Create audio stream
      this.stream = ytdl(this.currentSong.url, {
        filter: 'audioonly',
        quality: 'highestaudio',
        highWaterMark: 1 << 25
      });

      this.stream.on('error', (error) => {
        console.error('Stream error:', error);
        this.playNext();
      });

      this.stream.on('end', () => {
        console.log('Song finished');
        this.playNext();
      });

      return this.stream;
    } catch (error) {
      console.error('Error playing song:', error);
      this.playNext();
    }
  }

  /**
   * Pause playback
   */
  pause() {
    if (this.isPlaying && !this.isPaused) {
      this.isPaused = true;
      this.emit('pause');
      this.emit('queueUpdate', this.getStatus());
      return true;
    }
    return false;
  }

  /**
   * Resume playback
   */
  resume() {
    if (this.isPaused) {
      this.isPaused = false;
      this.emit('resume');
      this.emit('queueUpdate', this.getStatus());
      return true;
    }
    return false;
  }

  /**
   * Skip current song
   */
  skip() {
    if (this.currentSong) {
      console.log('Skipping:', this.currentSong.title);
      if (this.stream) {
        this.stream.destroy();
      }
      this.playNext();
      return true;
    }
    return false;
  }

  /**
   * Stop playback and clear queue
   */
  stop() {
    this.queue = [];
    this.currentSong = null;
    this.isPlaying = false;
    this.isPaused = false;
    
    if (this.stream) {
      this.stream.destroy();
      this.stream = null;
    }

    this.emit('stop');
    this.emit('queueUpdate', this.getStatus());
  }

  /**
   * Set volume (0-100)
   */
  setVolume(level) {
    this.volume = Math.max(0, Math.min(100, level));
    this.emit('volumeChange', this.volume);
    this.emit('queueUpdate', this.getStatus());
    return this.volume;
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      currentSong: this.currentSong,
      queue: this.queue,
      queueLength: this.queue.length,
      volume: this.volume
    };
  }

  /**
   * Get current audio stream
   */
  getCurrentStream() {
    return this.stream;
  }
}

export default AudioPlayer;

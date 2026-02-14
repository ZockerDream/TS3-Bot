// API Base URL
const API_BASE = '/api';

// State
let currentStatus = null;
let updateInterval = null;

// DOM Elements
const elements = {
    statusIndicator: document.getElementById('statusIndicator'),
    statusText: document.getElementById('statusText'),
    urlInput: document.getElementById('urlInput'),
    addButton: document.getElementById('addButton'),
    pauseBtn: document.getElementById('pauseBtn'),
    resumeBtn: document.getElementById('resumeBtn'),
    skipBtn: document.getElementById('skipBtn'),
    stopBtn: document.getElementById('stopBtn'),
    volumeSlider: document.getElementById('volumeSlider'),
    volumeValue: document.getElementById('volumeValue'),
    channelSelect: document.getElementById('channelSelect'),
    joinChannelBtn: document.getElementById('joinChannelBtn'),
    currentChannel: document.getElementById('currentChannel'),
    currentSong: document.getElementById('currentSong'),
    queueList: document.getElementById('queueList'),
    queueCount: document.getElementById('queueCount'),
    clearQueueBtn: document.getElementById('clearQueueBtn')
};

// API Functions
async function apiCall(endpoint, method = 'GET', body = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(`${API_BASE}${endpoint}`, options);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        showNotification(error.message, 'error');
        throw error;
    }
}

// Update Status
async function updateStatus() {
    try {
        const data = await apiCall('/status');
        currentStatus = data;

        // Update bot status
        if (data.bot.connected) {
            elements.statusIndicator.className = 'status-indicator connected';
            elements.statusText.textContent = 'Connected';
        } else {
            elements.statusIndicator.className = 'status-indicator error';
            elements.statusText.textContent = 'Disconnected';
        }

        // Update current channel
        if (data.bot.currentChannel) {
            elements.currentChannel.textContent = data.bot.currentChannel;
        }

        // Update current song
        updateCurrentSong(data.player.currentSong, data.player.isPlaying, data.player.isPaused);

        // Update queue
        updateQueue(data.player.queue);

        // Update volume
        if (data.player.volume !== undefined) {
            elements.volumeSlider.value = data.player.volume;
            elements.volumeValue.textContent = `${data.player.volume}%`;
        }

    } catch (error) {
        elements.statusIndicator.className = 'status-indicator error';
        elements.statusText.textContent = 'Error';
    }
}

// Update Current Song Display
function updateCurrentSong(song, isPlaying, isPaused) {
    if (!song) {
        elements.currentSong.innerHTML = `
      <div class="song-placeholder">
        <span class="placeholder-icon">🎵</span>
        <p>No song playing</p>
      </div>
    `;
        return;
    }

    const statusEmoji = isPaused ? '⏸️' : (isPlaying ? '▶️' : '⏹️');

    elements.currentSong.innerHTML = `
    ${song.thumbnail ? `<img src="${song.thumbnail}" alt="${song.title}" class="song-thumbnail">` : ''}
    <div class="song-info">
      <div class="song-title">${statusEmoji} ${escapeHtml(song.title)}</div>
      <div class="song-artist">${escapeHtml(song.artist)}</div>
      <span class="song-source">${song.source}</span>
    </div>
  `;
}

// Update Queue Display
function updateQueue(queue) {
    elements.queueCount.textContent = queue.length;

    if (queue.length === 0) {
        elements.queueList.innerHTML = `
      <div class="queue-empty">
        <span class="empty-icon">📋</span>
        <p>Queue is empty</p>
      </div>
    `;
        return;
    }

    elements.queueList.innerHTML = queue.map((song, index) => `
    <div class="queue-item">
      ${song.thumbnail ? `<img src="${song.thumbnail}" alt="${song.title}" class="queue-item-thumbnail">` : ''}
      <div class="queue-item-info">
        <div class="queue-item-title">${index + 1}. ${escapeHtml(song.title)}</div>
        <div class="queue-item-artist">${escapeHtml(song.artist)}</div>
      </div>
    </div>
  `).join('');
}

// Load Channels
async function loadChannels() {
    try {
        const data = await apiCall('/channels');

        if (data.channels && data.channels.length > 0) {
            elements.channelSelect.innerHTML = data.channels.map(ch =>
                `<option value="${ch.id}">${escapeHtml(ch.name)}</option>`
            ).join('');
        } else {
            elements.channelSelect.innerHTML = '<option value="">No channels available</option>';
        }
    } catch (error) {
        elements.channelSelect.innerHTML = '<option value="">Error loading channels</option>';
    }
}

// Event Handlers
elements.addButton.addEventListener('click', async () => {
    const url = elements.urlInput.value.trim();

    if (!url) {
        showNotification('Please enter a URL', 'warning');
        return;
    }

    try {
        elements.addButton.disabled = true;
        elements.addButton.textContent = 'Adding...';

        const data = await apiCall('/play', 'POST', { url });

        showNotification(`Added: ${data.song.title}`, 'success');
        elements.urlInput.value = '';

        // Update status immediately
        await updateStatus();
    } catch (error) {
        // Error already shown by apiCall
    } finally {
        elements.addButton.disabled = false;
        elements.addButton.innerHTML = '<span class="btn-icon">➕</span> Add to Queue';
    }
});

elements.urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        elements.addButton.click();
    }
});

elements.pauseBtn.addEventListener('click', async () => {
    await apiCall('/pause', 'POST');
    await updateStatus();
});

elements.resumeBtn.addEventListener('click', async () => {
    await apiCall('/resume', 'POST');
    await updateStatus();
});

elements.skipBtn.addEventListener('click', async () => {
    await apiCall('/skip', 'POST');
    await updateStatus();
});

elements.stopBtn.addEventListener('click', async () => {
    if (confirm('Stop playback and clear queue?')) {
        await apiCall('/stop', 'POST');
        await updateStatus();
    }
});

elements.volumeSlider.addEventListener('input', async (e) => {
    const volume = parseInt(e.target.value);
    elements.volumeValue.textContent = `${volume}%`;

    // Debounce API call
    clearTimeout(elements.volumeSlider.timeout);
    elements.volumeSlider.timeout = setTimeout(async () => {
        await apiCall('/volume', 'POST', { volume });
    }, 300);
});

elements.joinChannelBtn.addEventListener('click', async () => {
    const channelId = elements.channelSelect.value;

    if (!channelId) {
        showNotification('Please select a channel', 'warning');
        return;
    }

    try {
        await apiCall('/channel', 'POST', { channelId });
        showNotification('Joined channel', 'success');
        await updateStatus();
    } catch (error) {
        // Error already shown by apiCall
    }
});

elements.clearQueueBtn.addEventListener('click', async () => {
    if (confirm('Clear the entire queue?')) {
        await apiCall('/clear', 'POST');
        await updateStatus();
    }
});

// Utility Functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message, type = 'info') {
    // Simple notification - you can enhance this with a toast library
    console.log(`[${type.toUpperCase()}] ${message}`);

    // Create a simple toast notification
    const toast = document.createElement('div');
    toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 1rem 1.5rem;
    background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#6366f1'};
    color: white;
    border-radius: 0.5rem;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
    z-index: 1000;
    animation: slideIn 0.3s ease;
    font-weight: 500;
  `;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Add animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Initialize
async function init() {
    console.log('🚀 Initializing TS3 Music Bot Frontend...');

    // Load initial data
    await loadChannels();
    await updateStatus();

    // Start periodic updates (every 2 seconds)
    updateInterval = setInterval(updateStatus, 2000);

    console.log('✅ Frontend ready!');
}

// Start the app
init();

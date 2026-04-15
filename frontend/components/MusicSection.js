/**
 * MusicSection Component
 * Renders a filterable grid of song cards with play button UI.
 * Accepts external data via constructor for backend-ready architecture.
 */


export class MusicSection {
    constructor(containerId, apiUrl = 'http://localhost:5000/api/songs') {
        this.container = document.getElementById(containerId);
        this.apiUrl = apiUrl;
        this.songs = [];
        this.activeFilter = 'all';
        this.currentlyPlaying = null;
        this.player = null;
        this.isApiReady = false;
        this.isLoading = true;
        
        this.initYouTubeApi();
    }

    /**
     * Initializes the YouTube IFrame Player API.
     */
    initYouTubeApi() {
        if (window.YT && window.YT.Player) {
            this.isApiReady = true;
            return;
        }

        if (!document.getElementById('youtube-api-script')) {
            const tag = document.createElement('script');
            tag.id = 'youtube-api-script';
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }

        window.onYouTubeIframeAPIReady = () => {
            this.isApiReady = true;
        };
    }

    /**
     * Fetches songs from the API based on the active filter.
     */
    async fetchSongs() {
        this.isLoading = true;
        this.render(); // Show loading state

        try {
            const categoryParam = this.activeFilter !== 'all' ? `?category=${this.activeFilter}` : '';
            const response = await fetch(`${this.apiUrl}${categoryParam}`);
            if (!response.ok) throw new Error('Failed to fetch songs');
            this.songs = await response.json();
        } catch (error) {
            console.error('API Error:', error);
            this.songs = [];
        } finally {
            this.isLoading = false;
            this.render();
        }
    }

    /**
     * Creates or gets the hidden player container.
     */
    ensurePlayer(youtubeId) {
        let playerContainer = document.getElementById('music-player-hidden');
        if (!playerContainer) {
            playerContainer = document.createElement('div');
            playerContainer.id = 'music-player-hidden';
            playerContainer.style.display = 'none';
            document.body.appendChild(playerContainer);
        }

        if (this.player && this.player.getIframe()) {
            this.player.loadVideoById(youtubeId);
            return;
        }

        this.player = new YT.Player('music-player-hidden', {
            height: '0',
            width: '0',
            videoId: youtubeId,
            playerVars: {
                'autoplay': 1,
                'controls': 0,
                'disablekb': 1,
                'fs': 0,
                'rel': 0,
                'modestbranding': 1
            },
            events: {
                'onReady': (event) => {
                    event.target.playVideo();
                },
                'onStateChange': (event) => {
                    if (event.data === YT.PlayerState.ENDED) {
                        this.stopAllPlaybackUI();
                    }
                }
            }
        });
    }

    createFilterTabs() {
        const categories = [
            { key: 'all', label: 'All Tracks' },
            { key: 'single', label: 'Singles' },
            { key: 'freestyle', label: 'Freestyles' }
        ];

        const tabs = categories.map(cat => `
            <button
                class="music-tab ${cat.key === this.activeFilter ? 'active' : ''}"
                data-filter="${cat.key}">
                ${cat.label}
            </button>
        `).join('');

        return `<div class="music-tabs" id="music-tabs">${tabs}</div>`;
    }

    createSongCard(song) {
        const isCurrent = this.currentlyPlaying === song.id;
        // In DB, youtube_url is the full URL, we need to extract ID if it's not already there
        // But for simplicity, I'll assume youtube_url contains the ID or we use a separate field
        // Consistent with schema: youtube_url
        const ytId = song.youtube_url ? song.youtube_url.split('v=')[1] || song.youtube_url.split('/').pop() : '';

        return `
            <div class="song-card ${isCurrent ? 'is-playing' : ''}" data-song-id="${song.id}" id="song-${song.id}">
                <div class="song-thumbnail">
                    <img src="${song.thumbnail_url}" alt="${song.title}" loading="lazy">
                    <div class="song-overlay">
                        <button class="play-btn" aria-label="Play ${song.title}" data-song-id="${song.id}" data-yt-id="${ytId}">
                            ${isCurrent ? `
                                <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
                                    <rect x="6" y="4" width="4" height="16"></rect>
                                    <rect x="14" y="4" width="4" height="16"></rect>
                                </svg>
                            ` : `
                                <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
                                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                </svg>
                            `}
                        </button>
                    </div>
                </div>
                <div class="song-info">
                    <h3 class="song-title">${song.title}</h3>
                    <div class="song-meta">
                        <span class="song-category-badge">${song.category === 'single' ? 'Single' : 'Freestyle'}</span>
                        <span class="song-duration">Audio</span>
                    </div>
                </div>
            </div>
        `;
    }

    bindEvents() {
        const tabContainer = document.getElementById('music-tabs');
        if (tabContainer) {
            tabContainer.addEventListener('click', (e) => {
                const tab = e.target.closest('.music-tab');
                if (!tab) return;

                this.activeFilter = tab.dataset.filter;
                this.fetchSongs(); // Re-fetch on filter change
            });
        }

        const songGrid = document.getElementById('song-grid');
        if (songGrid) {
            songGrid.addEventListener('click', (e) => {
                const playBtn = e.target.closest('.play-btn');
                if (!playBtn) return;

                const songId = playBtn.dataset.songId;
                const ytId = playBtn.dataset.ytId;
                this.togglePlay(songId, ytId);
            });
        }
    }

    togglePlay(songId, ytId) {
        if (this.currentlyPlaying === songId) {
            this.pausePlayback();
        } else {
            this.startPlayback(songId, ytId);
        }
    }

    startPlayback(songId, ytId) {
        this.currentlyPlaying = songId;
        this.updateUI();

        if (this.isApiReady && ytId) {
            this.ensurePlayer(ytId);
            if (this.player && this.player.playVideo) {
                this.player.playVideo();
            }
        }
    }

    pausePlayback() {
        this.currentlyPlaying = null;
        this.updateUI();

        if (this.player && this.player.pauseVideo) {
            this.player.pauseVideo();
        }
    }

    stopAllPlaybackUI() {
        this.currentlyPlaying = null;
        this.updateUI();
    }

    updateUI() {
        const allCards = this.container.querySelectorAll('.song-card');
        allCards.forEach(card => {
            const sid = card.dataset.songId;
            const isPlaying = sid === this.currentlyPlaying;
            card.classList.toggle('is-playing', isPlaying);
            
            const btn = card.querySelector('.play-btn');
            if (btn) {
                btn.innerHTML = isPlaying ? `
                    <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
                        <rect x="6" y="4" width="4" height="16"></rect>
                        <rect x="14" y="4" width="4" height="16"></rect>
                    </svg>
                ` : `
                    <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                `;
            }
        });
    }

    render() {
        if (!this.container) return;

        if (this.isLoading) {
            this.container.innerHTML = `
                ${this.createFilterTabs()}
                <div class="loading-state">
                    <p>Fetching the vibes...</p>
                </div>
            `;
            return;
        }

        const songsHtml = this.songs.length > 0
            ? this.songs.map(song => this.createSongCard(song)).join('')
            : '<p class="no-results">No tracks found in the database.</p>';

        this.container.innerHTML = `
            ${this.createFilterTabs()}
            <div class="song-grid" id="song-grid">
                ${songsHtml}
            </div>
        `;

        this.bindEvents();
    }
}



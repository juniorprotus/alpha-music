/**
 * VideoGrid Component
 * Renders a responsive grid of embedded YouTube video cards.
 * Accepts external data via constructor for backend-ready architecture.
 */

export class VideoGrid {
    constructor(containerId, apiUrl = 'http://localhost:5000/api/videos') {
        this.container = document.getElementById(containerId);
        this.apiUrl = apiUrl;
        this.videos = [];
        this.activeFilter = 'all';
        this.isLoading = true;
    }

    /**
     * Fetches videos from the API.
     */
    async fetchVideos() {
        this.isLoading = true;
        this.render();

        try {
            // Note: In Phase 3, we fetch all and filter client-side or use basic query
            const response = await fetch(this.apiUrl);
            if (!response.ok) throw new Error('Failed to fetch videos');
            this.videos = await response.json();
        } catch (error) {
            console.error('API Error:', error);
            this.videos = [];
        } finally {
            this.isLoading = false;
            this.render();
        }
    }

    createFilterTabs() {
        const categories = [
            { key: 'all', label: 'All Releases' },
            { key: 'music-video', label: 'Music Videos' },
            { key: 'freestyle', label: 'Freestyles' },
            { key: 'live', label: 'Live' }
        ];

        const tabs = categories.map(cat => `
            <button
                class="video-tab ${cat.key === this.activeFilter ? 'active' : ''}"
                data-filter="${cat.key}">
                ${cat.label}
            </button>
        `).join('');

        return `<div class="video-tabs" id="video-tabs">${tabs}</div>`;
    }

    createVideoCard(video) {
        const aspectClass = video.isShort ? 'short-format' : '';
        // Map DB fields to component needs
        const embedUrl = video.youtube_url.includes('embed') 
            ? video.youtube_url 
            : `https://www.youtube.com/embed/${video.youtube_url.split('v=')[1] || video.youtube_url.split('/').pop()}`;

        return `
            <div class="video-card" data-video-id="${video.id}" data-category="${video.category}">
                <div class="video-wrapper ${aspectClass}">
                    <iframe
                        src="${embedUrl}"
                        title="${video.title}"
                        frameborder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerpolicy="strict-origin-when-cross-origin"
                        allowfullscreen
                        loading="lazy">
                    </iframe>
                </div>
                <div class="video-card-info">
                    <h3 class="video-card-title">${video.title}</h3>
                    <span class="video-card-category">${this.formatCategory(video.category)}</span>
                </div>
            </div>
        `;
    }

    formatCategory(category) {
        const labels = {
            'music-video': 'MV',
            'live': 'Live',
            'behind-the-scenes': 'BTS',
            'freestyle': 'Freestyle'
        };
        return labels[category] || category;
    }

    bindEvents() {
        const tabContainer = document.getElementById('video-tabs');
        if (tabContainer) {
            tabContainer.addEventListener('click', (e) => {
                const tab = e.target.closest('.video-tab');
                if (!tab) return;

                this.activeFilter = tab.dataset.filter;
                this.render(); // Filter client-side for videos in this version
            });
        }
    }

    getFilteredVideos() {
        if (this.activeFilter === 'all') return this.videos;
        return this.videos.filter(v => v.category === this.activeFilter);
    }

    render() {
        if (!this.container) return;
        
        if (this.isLoading) {
            this.container.innerHTML = `
                ${this.createFilterTabs()}
                <div class="loading-state">
                    <p>Loading sequences...</p>
                </div>
            `;
            return;
        }

        const filtered = this.getFilteredVideos();
        const videosHtml = filtered.length > 0
            ? filtered.map(v => this.createVideoCard(v)).join('')
            : '<p class="no-results">No videos found in the database.</p>';

        this.container.innerHTML = `
            ${this.createFilterTabs()}
            <div class="video-grid-inner">
                ${videosHtml}
            </div>
        `;

        this.bindEvents();
    }
}



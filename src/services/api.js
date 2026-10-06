const { config, getHeaders } = require('@/config/config');
const { stripPlayToken } = require('@/utils/helpers');

// Searches titles matching the query keyword
async function searchTitles(query) {
    const timestamp = Math.floor(Date.now() / 1000);
    const url = `${config.BASE_URL}/search.php?s=${encodeURIComponent(query)}&t=${timestamp}`;
    
    const response = await fetch(url, {
        headers: getHeaders()
    });

    if (!response.ok) {
        throw new Error(`Failed to perform search. Status: ${response.status}`);
    }

    return await response.json();
}

// Fetches specific title details and metadata (year, cast, episodes list)
async function getTitleDetails(titleId) {
    const timestamp = Math.floor(Date.now() / 1000);
    const url = `${config.BASE_URL}/post.php?id=${titleId}&t=${timestamp}`;

    const response = await fetch(url, {
        headers: getHeaders()
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch title info. Status: ${response.status}`);
    }

    return await response.json();
}

let cachedPlaybackUrl = null;

// Dynamically parses the playback media server domain (e.g. net52.cc) from the net77.cc homepage
async function getPlaybackUrl() {
    if (cachedPlaybackUrl) return cachedPlaybackUrl;
    try {
        const response = await fetch(`${config.BASE_URL}/home`, {
            headers: getHeaders()
        });
        if (response.ok) {
            const html = await response.text();
            const match = html.match(/https:\/\/(net\d+\.cc)\/play\.php/);
            if (match) {
                cachedPlaybackUrl = `https://${match[1]}`;
                console.log(`[Playback URL Auto-detected]: ${cachedPlaybackUrl}`);
                return cachedPlaybackUrl;
            }
        }
    } catch (error) {
        console.error('Error auto-detecting playback URL:', error);
    }
    return 'https://net52.cc'; // default fallback
}

// Handshakes with play.php and net52 playlist API to resolve HLS stream links
async function getStreamPlaylist(videoId, title = 'NetMirror') {
    const playTokenResponse = await fetch(`${config.BASE_URL}/play.php`, {
        method: 'POST',
        headers: {
            ...getHeaders(),
            'content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
        },
        body: `id=${videoId}`
    });

    if (!playTokenResponse.ok) {
        throw new Error(`Failed to fetch play token. Status: ${playTokenResponse.status}`);
    }

    const tokenData = await playTokenResponse.json();
    if (!tokenData.h) {
        throw new Error(`Invalid token response: ${JSON.stringify(tokenData)}`);
    }

    const playbackUrl = await getPlaybackUrl();
    const timestamp = Math.floor(Date.now() / 1000);
    const tokenHash = stripPlayToken(tokenData.h);
    const playlistUrl = `${playbackUrl}/playlist.php?id=${videoId}&t=${encodeURIComponent(title)}&tm=${timestamp}&h=${encodeURIComponent(tokenHash)}`;

    const playlistResponse = await fetch(playlistUrl, {
        headers: {
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, Gecko) Chrome/120.0.0.0 Safari/537.36',
            'referer': `${playbackUrl}/play.php?id=${videoId}&${tokenData.h}`,
            'accept': '*/*'
        }
    });

    if (!playlistResponse.ok) {
        throw new Error(`Failed to fetch playlist from media server. Status: ${playlistResponse.status}`);
    }

    const playlistData = await playlistResponse.json();

    // Rewrite relative stream paths to absolute URLs
    if (Array.isArray(playlistData)) {
        playlistData.forEach(video => {
            if (Array.isArray(video.sources)) {
                video.sources.forEach(source => {
                    if (source.file && source.file.startsWith('/')) {
                        source.file = `${playbackUrl}${source.file}`;
                    }
                });
            }
        });
    }

    return playlistData;
}

module.exports = {
    searchTitles,
    getTitleDetails,
    getStreamPlaylist
};

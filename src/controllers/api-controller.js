const scraper = require('@/services/scraper');
const api = require('@/services/api');

async function getHome(req, res) {
    try {
        const data = await scraper.scrapePage('https://net77.cc/home');
        res.json({ success: true, categories: data });
    } catch (error) {
        console.error('Error in getHome controller:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function getSeries(req, res) {
    try {
        const data = await scraper.scrapePage('https://net77.cc/series');
        res.json({ success: true, categories: data });
    } catch (error) {
        console.error('Error in getSeries controller:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function getMovies(req, res) {
    try {
        const data = await scraper.scrapePage('https://net77.cc/movies');
        res.json({ success: true, categories: data });
    } catch (error) {
        console.error('Error in getMovies controller:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function search(req, res) {
    const query = req.query.q;
    if (!query) {
        return res.status(400).json({ success: false, error: 'Query parameter "q" is required' });
    }

    try {
        const data = await api.searchTitles(query);
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error in search controller:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function getTitle(req, res) {
    const titleId = req.params.id;
    try {
        const data = await api.getTitleDetails(titleId);
        res.json({ success: true, data });
    } catch (error) {
        console.error(`Error in getTitle controller for id ${titleId}:`, error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function getPlaylist(req, res) {
    const videoId = req.params.id;
    const title = req.query.title || 'NetMirror';

    try {
        const playlist = await api.getStreamPlaylist(videoId, title);
        
        // Dynamically prefix playlist source files with our local proxy path
        const host = req.get('host');
        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const proxyPrefix = `${protocol}://${host}/api/proxy?url=`;

        if (Array.isArray(playlist)) {
            playlist.forEach(video => {
                if (Array.isArray(video.sources)) {
                    video.sources.forEach(source => {
                        if (source.file) {
                            source.file = `${proxyPrefix}${encodeURIComponent(source.file)}`;
                        }
                    });
                }
            });
        }

        res.json({ success: true, playlist });
    } catch (error) {
        console.error(`Error in getPlaylist controller for video ${videoId}:`, error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function proxy(req, res) {
    const targetUrl = req.query.url;
    if (!targetUrl) {
        return res.status(400).json({ success: false, error: 'Query parameter "url" is required' });
    }

    try {
        const parsedUrl = new URL(targetUrl);
        const headers = {
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'referer': parsedUrl.origin + '/',
            'accept': '*/*'
        };

        const response = await fetch(targetUrl, { headers });
        if (!response.ok) {
            return res.status(response.status).send(`Failed to fetch remote asset: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type') || '';
        
        // Fetch as arrayBuffer to support both text playlists and binary video segments without corruption
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Check if the content is a text playlist by sniffing the start of the buffer or checking content-type
        const previewText = buffer.subarray(0, 10).toString('utf-8');
        const isPlaylist = contentType.includes('mpegurl') || 
                           contentType.includes('x-mpegurl') || 
                           contentType.includes('application/octet-stream') || 
                           previewText.startsWith('#EXTM3U');

        if (isPlaylist) {
            res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
            
            const host = req.get('host');
            const protocol = req.headers['x-forwarded-proto'] || req.protocol;
            const proxyPrefix = `${protocol}://${host}/api/proxy?url=`;
            
            const bodyText = buffer.toString('utf-8');

            // Regex to find and rewrite URLs inside quotes (e.g. URI="...")
            let rewrittenBody = bodyText.replace(/URI="([^"]+)"/g, (match, p1) => {
                const absoluteUrl = p1.startsWith('http') ? p1 : new URL(p1, targetUrl).href;
                return `URI="${proxyPrefix}${encodeURIComponent(absoluteUrl)}"`;
            });

            // Split by lines to rewrite stream index URLs
            const lines = rewrittenBody.split('\n');
            const rewrittenLines = lines.map(line => {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('#')) {
                    return line;
                }
                const absoluteUrl = trimmed.startsWith('http') ? trimmed : new URL(trimmed, targetUrl).href;
                return `${proxyPrefix}${encodeURIComponent(absoluteUrl)}`;
            });
            
            res.send(rewrittenLines.join('\n'));
        } else {
            if (contentType) {
                res.setHeader('Content-Type', contentType);
            }
            res.send(buffer);
        }
    } catch (error) {
        console.error('Error in proxy controller:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

// Helper to aggregate unique movies/shows and categorize by genre keywords
async function getAggregatedGenres() {
    const [homeData, seriesData, moviesData] = await Promise.all([
        scraper.scrapePage('https://net77.cc/home'),
        scraper.scrapePage('https://net77.cc/series'),
        scraper.scrapePage('https://net77.cc/movies')
    ]);

    const allCategories = [...homeData, ...seriesData, ...moviesData];
    
    const genreMappings = {
        'Thriller': ['thriller', 'thrillers', 'suspenseful', 'mystery'],
        'Sci-Fi & Fantasy': ['sci-fi', 'fantasy', 'alien', 'imaginative'],
        'Action & Crime': ['action', 'adventure', 'crime', 'police', 'detective', 'heist'],
        'Drama': ['drama', 'dramas', 'epics', 'gritty', 'political'],
        'Comedy': ['comedy', 'comedies', 'funny', 'hilarious'],
        'Sports': ['sports', 'sport']
    };

    const genres = {};
    Object.keys(genreMappings).forEach(g => {
        genres[g] = [];
    });

    const uniqueItems = new Set();

    allCategories.forEach(cat => {
        const catNameLower = cat.category.toLowerCase();
        
        const matchedGenres = [];
        Object.entries(genreMappings).forEach(([genre, keywords]) => {
            if (keywords.some(kw => catNameLower.includes(kw))) {
                matchedGenres.push(genre);
            }
        });

        if (matchedGenres.length === 0) {
            matchedGenres.push('Drama');
        }

        cat.items.forEach(item => {
            matchedGenres.forEach(genre => {
                const key = `${genre}-${item.id}`;
                if (!uniqueItems.has(key)) {
                    uniqueItems.add(key);
                    genres[genre].push(item);
                }
            });
        });
    });

    return genres;
}

async function getGenresList(req, res) {
    try {
        const genres = await getAggregatedGenres();
        const responseData = Object.entries(genres).map(([name, items]) => ({
            name,
            count: items.length
        }));
        res.json({ success: true, genres: responseData });
    } catch (error) {
        console.error('Error in getGenresList:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function getItemsByGenre(req, res) {
    const genreName = req.params.name;
    try {
        const genres = await getAggregatedGenres();
        const items = genres[genreName];
        if (!items) {
            return res.status(404).json({ success: false, error: `Genre "${genreName}" not found.` });
        }
        res.json({ success: true, genre: genreName, items });
    } catch (error) {
        console.error(`Error in getItemsByGenre for ${genreName}:`, error);
        res.status(500).json({ success: false, error: error.message });
    }
}

module.exports = {
    getHome,
    getSeries,
    getMovies,
    search,
    getTitle,
    getPlaylist,
    getGenresList,
    getItemsByGenre,
    proxy
};

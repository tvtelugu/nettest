require('dotenv').config();
const fs = require('fs');
const path = require('path');

const BASE_URL = require('@/utils/base');

const config = {
    PORT: process.env.PORT || 3000,
    ALLOWED_ORIGIN: process.env.ALLOWED_ORIGIN || '',
    BASE_URL
};

// Reads and formats cookies dynamically from the root cookies.json file
function getCookieString() {
    try {
        const filePath = path.resolve(__dirname, '../../cookies.json');
        if (fs.existsSync(filePath)) {
            const raw = fs.readFileSync(filePath, 'utf-8');
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                return parsed.map(c => `${c.name}=${c.value}`).join('; ');
            }
        }
    } catch (e) {
        console.error('Error loading cookies.json:', e.message);
    }
    return '';
}

const getHeaders = (referer = `${config.BASE_URL}/home`) => ({
    'cookie': getCookieString(),
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/json',
    'accept-language': 'en-US,en;q=0.9',
    'referer': referer,
    'x-requested-with': 'XMLHttpRequest'
});

module.exports = {
    config,
    getHeaders
};

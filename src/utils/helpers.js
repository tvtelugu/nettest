// Extracts Netflix title/video ID from the poster/episode image URL (e.g. /poster/341/81288983.jpg -> 81288983)
function extractNetflixId(url) {
    if (!url) return null;
    const match = url.match(/\/(\d+)\.(jpg|png|webp)/);
    return match ? match[1] : null;
}

// Removes the 'in=' prefix from net77 play tokens when querying net52 playlist API
function stripPlayToken(token) {
    if (!token) return '';
    return token.startsWith('in=') ? token.substring(3) : token;
}

module.exports = {
    extractNetflixId,
    stripPlayToken
};

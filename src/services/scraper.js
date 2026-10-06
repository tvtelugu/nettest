const cheerio = require('cheerio');
const { getHeaders } = require('@/config/config');
const { extractNetflixId } = require('@/utils/helpers');

// Scrapes a category page (home, series, movies) and parses row listings
async function scrapePage(url) {
    const response = await fetch(url, {
        headers: getHeaders()
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch page: ${url}. Status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const categories = [];

    $('.lolomoRow').each((i, rowEl) => {
        const categoryName = $(rowEl).find('.row-header-title').text().trim();
        if (!categoryName) return;
        
        // Skip personalized "Continue Watching" rows
        if (categoryName.toLowerCase().includes('continue watching')) return;

        const items = [];
        $(rowEl).find('div.slider-item, a.slider-refocus').each((j, el) => {
            const img = $(el).find('img');
            const dataSrc = img.attr('data-src') || img.attr('src');
            if (dataSrc) {
                const id = extractNetflixId(dataSrc);
                
                if (id && !items.some(item => item.id === id)) {
                    items.push({
                        id,
                        image: dataSrc
                    });
                }
            }
        });

        categories.push({
            category: categoryName,
            itemsCount: items.length,
            items
        });
    });

    return categories;
}

module.exports = {
    scrapePage
};

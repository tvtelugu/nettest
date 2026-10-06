require('dotenv').config();

async function test() {
    console.log("=== Starting REST API Verification Tests ===");

    const baseUrl = 'http://localhost:3000';

    const runTest = async (name, path) => {
        console.log(`\nTesting endpoint: ${path} (${name})...`);
        try {
            const start = Date.now();
            
            const headers = {};
            const allowedOrigin = process.env.ALLOWED_ORIGIN || '';
            if (allowedOrigin && allowedOrigin.trim() !== '') {
                const origins = allowedOrigin.split(',').map(o => o.trim());
                headers['Origin'] = origins[0] === '*' ? 'https://anydomain.com' : origins[0];
            }

            const res = await fetch(`${baseUrl}${path}`, { headers });
            const duration = Date.now() - start;
            console.log(`Status: ${res.status} | Time: ${duration}ms`);
            
            // Check if HTML (for docs page) or JSON (for API)
            const contentType = res.headers.get('content-type') || '';
            if (contentType.includes('text/html')) {
                console.log(`✅ Success! (Returned HTML page)`);
                return true;
            }

            const json = await res.json();
            if (json.success) {
                console.log(`✅ Success!`);
                const keys = Object.keys(json);
                console.log(`Response keys: [${keys.join(', ')}]`);
                if (json.categories) {
                    console.log(`Found ${json.categories.length} categories.`);
                    console.log(`Category 1 Name: "${json.categories[0].category}" containing ${json.categories[0].itemsCount} items.`);
                } else if (json.data) {
                    console.log(`Data preview:`, JSON.stringify(json.data).substring(0, 300));
                } else if (json.playlist) {
                    console.log(`Playlist items:`, json.playlist.length);
                    if (json.playlist[0]) {
                        console.log(`Play Title: "${json.playlist[0].title}"`);
                        console.log(`Sources:`, json.playlist[0].sources);
                    }
                }
                return true;
            } else {
                console.error(`❌ Failed:`, json.error || json);
                return false;
            }
        } catch (error) {
            console.error(`❌ Request Error:`, error.message);
            return false;
        }
    };

    const runOriginTest = async (name, path, originHeader, expectedStatus) => {
        console.log(`\nTesting endpoint with Origin header: ${path} (${name}) | Origin: "${originHeader}"...`);
        try {
            const start = Date.now();
            const res = await fetch(`${baseUrl}${path}`, {
                headers: originHeader ? { 'Origin': originHeader } : {}
            });
            const duration = Date.now() - start;
            console.log(`Status: ${res.status} (Expected: ${expectedStatus}) | Time: ${duration}ms`);
            
            if (res.status === expectedStatus) {
                console.log(`✅ Success!`);
                return true;
            } else {
                console.error(`❌ Failed: Expected status ${expectedStatus}, got ${res.status}`);
                return false;
            }
        } catch (error) {
            console.error(`❌ Request Error:`, error.message);
            return false;
        }
    };

    const docsOk = await runTest("Root Documentation Page", "/");
    const homeOk = await runTest("Home Page Scraper", "/api/home");
    const searchOk = await runTest("Search Proxy", "/api/search?q=Diplomat");
    const metaOk = await runTest("Metadata Details", "/api/title/81288983");
    const playlistOk = await runTest("Stream Playlist Handshake", "/api/playlist/81772103?title=The%20Diplomat");
    const genresOk = await runTest("Genres List Aggregator", "/api/genres");
    const genreItemsOk = await runTest("Genre Items Lookup", "/api/genres/Drama");

    // Dynamic Origin/CORS validation tests
    let originOk = false;
    const allowedOrigin = process.env.ALLOWED_ORIGIN || '';
    if (allowedOrigin && allowedOrigin.trim() !== '' && allowedOrigin.trim() !== '*') {
        const allowedOrigins = allowedOrigin.split(',').map(o => o.trim());
        const primaryAllowed = allowedOrigins[0];
        
        console.log(`\n--- Verifying Origin Restriction (Enforced: "${allowedOrigin}") ---`);
        const allowedOk = await runOriginTest("Allowed Origin Access", "/api/genres", primaryAllowed, 200);
        const blockedOk = await runOriginTest("Blocked Origin Access", "/api/genres", "https://unauthorized-domain.com", 403);
        const missingOk = await runOriginTest("Missing Origin Access (Blocked)", "/api/genres", null, 403);
        
        originOk = allowedOk && blockedOk && missingOk;
    } else {
        console.log(`\n--- Verifying Origin Restriction (None Enforced - Open CORS) ---`);
        const anyOk = await runOriginTest("Any Origin Access", "/api/genres", "https://any-domain-is-ok.com", 200);
        const missingOk = await runOriginTest("Missing Origin Access (Allowed)", "/api/genres", null, 200);
        
        originOk = anyOk && missingOk;
    }

    console.log("\n=== Test Results Summary ===");
    console.log(`Root Docs:          ${docsOk ? 'PASS' : 'FAIL'}`);
    console.log(`Home Scraper:       ${homeOk ? 'PASS' : 'FAIL'}`);
    console.log(`Search Proxy:       ${searchOk ? 'PASS' : 'FAIL'}`);
    console.log(`Title Metadata:     ${metaOk ? 'PASS' : 'FAIL'}`);
    console.log(`Stream Playlist:    ${playlistOk ? 'PASS' : 'FAIL'}`);
    console.log(`Genres List:        ${genresOk ? 'PASS' : 'FAIL'}`);
    console.log(`Genre Items:        ${genreItemsOk ? 'PASS' : 'FAIL'}`);
    console.log(`Origin Restriction: ${originOk ? 'PASS' : 'FAIL'}`);

    if (docsOk && homeOk && searchOk && metaOk && playlistOk && genresOk && genreItemsOk && originOk) {
        console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY!");
        process.exit(0);
    } else {
        console.error("\n❌ SOME TESTS FAILED.");
        process.exit(1);
    }
}

// Give the Express process a moment to bind to the port before testing
setTimeout(test, 2000);

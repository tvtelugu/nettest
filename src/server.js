require('module-alias/register');
const express = require('express');
const path = require('path');
const os = require('os');
const { config } = require('@/config/config');
const apiRoutes = require('@/routes/api-routes');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Origin restriction / CORS middleware
app.use((req, res, next) => {
    const origin = req.headers.origin;
    const referer = req.headers.referer;
    const allowedOrigin = config.ALLOWED_ORIGIN;

    let clientOrigin = origin;
    if (!clientOrigin && referer) {
        try {
            clientOrigin = new URL(referer).origin;
        } catch (e) {
            // ignore invalid URL
        }
    }

    if (allowedOrigin && allowedOrigin.trim() !== '' && allowedOrigin.trim() !== '*') {
        const allowedOrigins = allowedOrigin.split(',').map(o => o.trim());

        if (clientOrigin) {
            if (!allowedOrigins.includes(clientOrigin)) {
                return res.status(403).json({ error: 'Origin not allowed' });
            }
            res.setHeader('Access-Control-Allow-Origin', clientOrigin);
        } else {
            // Block requests to API routes that lack both Origin and Referer when allowed origins are restricted
            if (req.path.startsWith('/api')) {
                return res.status(403).json({ error: 'Origin not allowed' });
            }
            res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
        }
    } else {
        if (clientOrigin) {
            res.setHeader('Access-Control-Allow-Origin', clientOrigin);
        } else {
            res.setHeader('Access-Control-Allow-Origin', '*');
        }
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use('/api', apiRoutes);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'utils/docs.html'));
});

app.get('/health', (req, res) => {
    res.json({ success: true, status: 'healthy', timestamp: new Date() });
});

function getNetworkIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}

app.listen(config.PORT, async () => {
    const localUrl = `http://localhost:${config.PORT}/`;
    const networkUrl = `http://${getNetworkIp()}:${config.PORT}/`;
    
    console.log(`\n  NetMirror REST API is running!\n`);
    console.log(`  ➜  Local:   ${localUrl}`);
    console.log(`  ➜  Network: ${networkUrl}`);

    try {
        const res = await fetch('https://api.ipify.org?format=json');
        if (res.ok) {
            const data = await res.json();
            console.log(`  ➜  Public:  http://${data.ip}:${config.PORT}/`);
        }
    } catch (e) {
        // Silently ignore dynamic public IP resolution failure
    }
    console.log();
});

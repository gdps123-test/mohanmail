const http = require('http');
const url = require('url');

const PORT = 3000;

// In-memory storage for users and messages
let users = {}; // { username: { messages: [] } }
let messages = {}; // { username: [ { from: username, text: message } ] }

// Helper function to parse JSON request bodies
const parseBody = (req) => {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                resolve(JSON.parse(body));
            } catch (error) {
                reject(error);
            }
        });
    });
};

// Create the HTTP server
const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const method = req.method;
    const pathname = parsedUrl.pathname;

    if (pathname === '/login' && method === 'POST') {
        try {
            const { username } = await parseBody(req);
            if (!username) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: 'Username is required' }));
            }

            if (!messages[username]) {
                messages[username] = [];
            }
            users[username] = { messages: messages[username] };

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: `User ${username} logged in successfully.` }));
        } catch (error) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid JSON input' }));
        }
    } else if (pathname === '/send' && method === 'POST') {
        try {
            const { from, to, message } = await parseBody(req);
            if (!from || !to || !message) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: 'Invalid message format' }));
            }

            if (!messages[to]) {
                messages[to] = [];
            }
            messages[to].push({ from, text: message });

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: `Message sent from ${from} to ${to}` }));
        } catch (error) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid JSON input' }));
        }
    } else if (pathname === '/receive' && method === 'GET') {
        const { username } = parsedUrl.query;
        if (!username || !messages[username]) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Username not found' }));
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ messages: messages[username] }));
    } else if (pathname === '/clear' && method === 'POST') {
        try {
            const { username } = await parseBody(req);
            if (!username || !messages[username]) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: 'Username not found' }));
            }
            messages[username] = [];
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: `Messages cleared for ${username}.` }));
        } catch (error) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid JSON input' }));
        }
    } else if (pathname === '/shutdown' && method === 'POST') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Shutting down server...');
        console.log('Server is shutting down...');

        server.close(() => {
            console.log('Server closed.');
            process.exit(0);
        });
    } else if (pathname === '/eval' && method === 'POST') {
        try {
            const { code } = await parseBody(req);
            if (!code) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: 'Code is required' }));
            }

            const result = eval(code);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ result }));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
        }
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not Found' }));
    }
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

const http = require('http');
const fs = require('fs');
const url = require('url');

const server = http.createServer((req, res) => {
    const url = req.url;

    if(url === '/') {
        fs.readFile('data.json', (err, data) => {
            if (err) throw err;
            res.writeHead(200, {'Content-Type': 'text/json'});
            res.write(data);
            res.end();
        });
    }

    const reqUrl = new URL(req.url, `http://${req.headers.host}`);
    const path = reqUrl.pathname;
    const method = req.method;

    const userRegex = /^\/users\/(\d+)$/;
    const match = path.match(userRegex);

    if (match && method === 'GET') {
        const userId = match[1];

        const data = fs.readFileSync('data.json', 'utf8');
        const users = JSON.parse(data);

        const user = users.find(u => u.id === parseInt(userId));

        if (!user) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: `Utilisateur avec ID: ${userId} non trouvé` }));
            return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(user));
    } 

    if(method === 'POST' && path === '/users') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            const user = JSON.parse(body);
            const data = fs.readFileSync('data.json', 'utf8');
            const users = JSON.parse(data);
            user.id = users.length + 1;
            users.push(user);
            fs.writeFileSync('data.json', JSON.stringify(users));
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(user));
        });
    }
})

server.listen(3000);
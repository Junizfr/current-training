const http = require('http');
const fs = require('fs');

const server = http.createServer((req, res) => {
    if(req.url === '/') {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(fs.readFileSync('pages/index.html'));
        res.end();
    }

    if(req.url === '/about') {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(fs.readFileSync('pages/about.html'));
        res.end();
    }

    if(req.url === '/contact') {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(fs.readFileSync('pages/contact.html'));
        res.end();
    }
})

server.listen(3000);
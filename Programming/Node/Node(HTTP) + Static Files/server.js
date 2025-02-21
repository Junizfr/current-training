const http = require('http');
const fs = require('fs');

const server = http.createServer((req, res) => {
    if(req.url.match(/.css$/)) {
        res.writeHead(200, {'Content-Type': 'text/css'});
        res.write(fs.readFileSync('public/style.css'));
        res.end();
    }

    if(req.url.match(/.js$/)) {
        res.writeHead(200, {'Content-Type': 'text/css'});
        res.write(fs.readFileSync('public/script.js'));
        res.end();
    }

    if(req.url === '/') {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(fs.readFileSync('public/index.html'));
        res.end();
    }
})

server.listen(3000);
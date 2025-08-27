// Simple test to verify Railway deployment
const http = require('http');
const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'Railway Test Server Running',
    timestamp: new Date().toISOString(),
    port: port,
    node_env: process.env.NODE_ENV,
    url: req.url
  }));
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Railway test server running on port ${port}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`API_KEY set: ${process.env.API_KEY ? 'Yes' : 'No'}`);
});
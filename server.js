const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;
const TARGET = 'https://neolabdiagnostico.com.br';

const proxy = createProxyMiddleware({
  target: TARGET,
  changeOrigin: true,
  on: {
    proxyReq: (proxyReq, req, res) => {
      proxyReq.setHeader('accept-encoding', 'identity');
      proxyReq.setHeader('Referer', TARGET + '/');
    },
  },
});

app.use((req, res) => {
  const fullUrl = TARGET + req.originalUrl;
  console.log(`[${new Date().toISOString()}] ${req.method} ${fullUrl}`);
  proxy(req, res, (err) => {
    if (err) {
      console.error('Proxy error:', err);
      res.status(502).send('Bad Gateway');
    }
  });
});

app.listen(PORT, () => {
  console.log(`Proxy running at http://localhost:${PORT}`);
  console.log(`Forwarding to ${TARGET}`);
});

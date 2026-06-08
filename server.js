const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
// O Render define a porta automaticamente via process.env.PORT, mas mantemos o fallback 3000
const PORT = process.env.PORT || 3000;

// Corrigido: O alvo agora é o servidor onde a rota de laudos realmente está hospedada
const TARGET = 'https://ligaresultnet.com.br';

const proxy = createProxyMiddleware({
  target: TARGET,
  changeOrigin: true,
  on: {
    proxyReq: (proxyReq, req, res) => {
      // Garante que a resposta venha em texto limpo para o Express processar
      proxyReq.setHeader('accept-encoding', 'identity');
      // Força o Referer correto para o servidor de destino aceitar a requisição
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
      res.status(502).send('Bad Gateway - Erro ao conectar ao servidor da ResultNet');
    }
  });
});

app.listen(PORT, () => {
  console.log(`Proxy running at http://localhost:${PORT}`);
  console.log(`Forwarding to ${TARGET}`);
});

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// O alvo base volta a ser o domínio do laboratório
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

// Intercepta a rota inicial para evitar que o proxy tente carregar a página index quebrada
app.get('/', (req, res) => {
  // Redireciona o navegador diretamente para o caminho do sistema de laudos da ResultNet
  res.redirect('https://ligaresultnet.com.br/resultnet/login.php?lab=neolab');
});

// Mantém o comportamento do proxy para os demais sublinks e scripts internos
app.use((req, res) => {
  const fullUrl = TARGET + req.originalUrl;
  console.log(`[${new Date().toISOString()}] ${req.method} ${fullUrl}`);
  
  proxy(req, res, (err) => {
    if (err) {
      console.error('Proxy error:', err);
      res.status(502).send('Bad Gateway - Falha ao conectar ao servidor de destino');
    }
  });
});

app.listen(PORT, () => {
  console.log(`Proxy running at http://localhost:${PORT}`);
  console.log(`Forwarding configuration active.`);
});

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Alvo fixado exatamente no link solicitado
const TARGET = 'https://neolabdiagnostico.com.br';

const proxy = createProxyMiddleware({
  target: TARGET,
  changeOrigin: true, // Força o cabeçalho Host a coincidir com o alvo
  secure: false,      // Ignora eventuais problemas de certificado SSL expirado no destino
  on: {
    proxyReq: (proxyReq, req, res) => {
      // Força o formato de resposta limpo
      proxyReq.setHeader('accept-encoding', 'identity');
      
      // Simula a requisição vinda de um navegador padrão para evitar bloqueios do servidor
      proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Define a origem correta
      proxyReq.setHeader('Referer', TARGET + '/');
      proxyReq.setHeader('Origin', TARGET);
    },
    proxyRes: (proxyRes, req, res) => {
      // Remove restrições de segurança de compartilhamento de recursos (CORS), se houver
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
  },
});

// Passa todas as requisições recebidas diretamente para o TARGET
app.use((req, res) => {
  const fullUrl = TARGET + req.originalUrl;
  console.log(`[${new Date().toISOString()}] ${req.method} ${fullUrl}`);
  
  proxy(req, res, (err) => {
    if (err) {
      console.error('Proxy error detailed:', err);
      res.status(502).send('Bad Gateway - O servidor de destino recusou a conexão ou está inacessível no momento.');
    }
  });
});

app.listen(PORT, () => {
  console.log(`Proxy running at http://localhost:${PORT}`);
  console.log(`Forwarding completely restricted to: ${TARGET}`);
});

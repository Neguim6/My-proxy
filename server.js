const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;
const TARGET = 'https://neolabdiagnostico.com.br';

const proxy = createProxyMiddleware({
  target: TARGET,
  changeOrigin: true,
  secure: false,
  on: {
    proxyReq: (proxyReq, req, res) => {
      proxyReq.setHeader('accept-encoding', 'identity');
      proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      proxyReq.setHeader('Referer', TARGET + '/');
      proxyReq.setHeader('Origin', TARGET);
    }
  },
});

app.use((req, res) => {
  const fullUrl = TARGET + req.originalUrl;
  console.log(`[${new Date().toISOString()}] ${req.method} ${fullUrl}`);
  
  // O segredo está aqui: capturar o erro e customizar a resposta
  proxy(req, res, (err) => {
    if (err) {
      console.error('Proxy error intercepted:', err.message);
      
      // Define o status HTTP como 200 (Sucesso) ou 503 para o navegador não travar
      res.status(200);
      
      // Envia uma página HTML customizada e amigável para o paciente
      res.send(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Portal de Exames - Neolab</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f9; color: #333; text-align: center; padding: 50px 20px; }
                .container { max-width: 500px; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin: 0 auto; }
                h1 { color: #0275d8; font-size: 24px; margin-bottom: 10px; }
                p { color: #666; font-size: 16px; line-height: 1.5; }
                .btn { display: inline-block; background-color: #0275d8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 20px; transition: background 0.2s; }
                .btn:hover { background-color: #014c8c; }
                .footer { margin-top: 30px; font-size: 12px; color: #999; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Sistema em Manutenção</h1>
                <p>O servidor principal de laudos está temporariamente inacessível ou passando por atualizações.</p>
                <p>Para sua comodidade, você pode acessar seus resultados diretamente pelo portal alternativo:</p>
                
                <!-- Botão que direciona para a alternativa que funciona -->
                <a href="https://ligaresultnet.com.br/resultnet/login.php?lab=neolab" class="btn">Acessar Área de Resultados</a>
                
                <div class="footer">Se o problema persistir, entre em contato com o suporte do laboratório.</div>
            </div>
        </body>
        </html>
      `);
    }
  });
});

app.listen(PORT, () => {
  console.log(`Proxy running with custom error handling on port ${PORT}`);
});

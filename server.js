const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;
const TARGET = 'https://neolabdiagnostico.com.br';

// 1. Redirecionamento Ultra-Seguro com "no-referrer" (Garante anonimato contra o WAF do Sisreg)
app.get('/sisreg', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="referrer" content="no-referrer">
        <title>Redirecionando...</title>
        <script>
            window.onload = function() {
                // Cria um link invisível simulando o clique direto do usuário
                var link = document.createElement('a');
                link.href = "https://sisregiii.saude.gov.br/";
                link.rel = "noreferrer noopener";
                document.body.appendChild(link);
                link.click();
            };
        </script>
    </head>
    <body>
        <p style="font-family: sans-serif; text-align: center; margin-top: 50px; color: #666;">
            Acessando o portal Sisreg de forma segura...
        </p>
    </body>
    </html>
  `);
});

// 2. Configuração do Proxy principal (Neolab)
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

// 3. Captura de todas as outras requisições para o Neolab com fallback de erro
app.use((req, res) => {
  const fullUrl = TARGET + req.originalUrl;
  console.log(`[${new Date().toISOString()}] ${req.method} ${fullUrl}`);
  
  proxy(req, res, (err) => {
    if (err) {
      console.error('Proxy error intercepted:', err.message);
      
      res.status(200);
      
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

# 🔧 Correção: Erro "Failed to fetch" e Mixed Content

## Problema
O erro "blocked:mixed-content" ocorre porque:
- Frontend está em **HTTPS** (Vercel)
- Backend está sendo chamado via **HTTP** (ou URL incorreta)
- Navegadores bloqueiam requisições HTTP de páginas HTTPS

## ✅ Solução

### 1. Configurar variável de ambiente no Vercel

1. Acesse o [Dashboard da Vercel](https://vercel.com/dashboard)
2. Vá para o projeto do frontend
3. Clique em **Settings** → **Environment Variables**
4. Adicione a variável:

```
NEXT_PUBLIC_API_URL=https://seu-backend.onrender.com
```

**Importante**: 
- Substitua `seu-backend.onrender.com` pela URL real do seu backend no Render
- Use **HTTPS** (não HTTP)
- Não adicione `/api` no final (o código já adiciona)

### 2. Verificar URL do backend no Render

1. Acesse o [Dashboard do Render](https://dashboard.render.com/)
2. Vá para o serviço do backend
3. Copie a URL (deve ser algo como: `https://children-task-api.onrender.com`)
4. Use essa URL na variável `NEXT_PUBLIC_API_URL` no Vercel

### 3. Verificar CORS no backend

No Render, verifique se a variável `ALLOWED_ORIGINS` está configurada:

```
ALLOWED_ORIGINS=https://front-children-tasks.vercel.app
```

Ou se quiser permitir múltiplas origens:

```
ALLOWED_ORIGINS=https://front-children-tasks.vercel.app,http://localhost:3000
```

### 4. Fazer novo deploy

Após configurar a variável de ambiente:

1. No Vercel, vá em **Deployments**
2. Clique nos três pontos do último deploy
3. Selecione **Redeploy**
4. Ou faça um novo commit e push (o deploy será automático)

## 🧪 Testar

Após o deploy:
1. Acesse o frontend no Vercel
2. Tente fazer login
3. Abra o DevTools (F12) → Network
4. Verifique se as requisições estão sendo feitas para a URL HTTPS correta
5. Verifique se não há mais erros de "blocked:mixed-content"

## 📝 Exemplo de configuração

**Vercel Environment Variables:**
```
NEXT_PUBLIC_API_URL=https://children-task-api.onrender.com
```

**Render Environment Variables (Backend):**
```
DATABASE_TYPE=postgres
DATABASE_URL=<sua-url-do-postgres>
NODE_ENV=production
JWT_SECRET=<seu-jwt-secret>
ALLOWED_ORIGINS=https://front-children-tasks.vercel.app
```

## ⚠️ Notas Importantes

- O backend no Render pode demorar alguns minutos para "acordar" se estiver no plano gratuito (spin down após inatividade)
- Certifique-se de que o backend está rodando antes de testar
- Se o backend estiver dormindo, a primeira requisição pode demorar ~30 segundos


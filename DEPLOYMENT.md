# Configuração de Deploy no Vercel

## Variáveis de Ambiente Necessárias

Para que a aplicação funcione corretamente no Vercel, você precisa configurar as seguintes variáveis de ambiente no painel do Vercel:

### 1. Acesse o Painel do Vercel
- Vá para [vercel.com](https://vercel.com)
- Selecione seu projeto
- Vá para **Settings** > **Environment Variables**

### 2. Configure as Variáveis

Adicione as seguintes variáveis de ambiente:

```
CONVEX_DEPLOY_KEY=project:fernando-souto-lima:my-project-chef-4d047|eyJ2MiI6IjVlNDA1YzVjZDZiMDRhZTg5MTQ4NTIwMjRkYTVkNDc0In0=
VITE_CONVEX_URL=https://precious-caiman-557.convex.cloud
```

### 3. Configuração do Build

O arquivo `vercel.json` está configurado com:
- Build command personalizado: `npm run build:prod`
- Rewrites para SPA (Single Page Application)

O script `build:prod` executa o deploy do Convex antes do build do frontend.

### 4. Deploy

Após configurar as variáveis de ambiente:
1. Faça push das alterações para o GitHub
2. O Vercel fará o deploy automaticamente
3. A aplicação estará disponível em `https://compia-editora.vercel.app`

## Solução de Problemas

### Erro: "No address provided to ConvexReactClient"
- Verifique se a variável `VITE_CONVEX_URL` está configurada corretamente
- Certifique-se de que o deployment do Convex foi feito com sucesso
- Verifique se o build command está executando o `convex deploy` antes do build

### Tela Branca
- Verifique o console do navegador para erros
- Confirme que todas as variáveis de ambiente estão configuradas
- Verifique se o deployment do Convex está ativo

## Comandos Úteis

```bash
# Deploy do Convex para produção
npx convex deploy

# Verificar variáveis de ambiente
npx convex env list

# Build local para teste
npm run build
```

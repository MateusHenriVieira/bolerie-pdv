# PDV para Loja de Bolos

Sistema de Ponto de Venda (PDV) completo para gerenciamento de lojas de bolos e confeitaria, desenvolvido com Next.js, TypeScript e Firebase.

## Funcionalidades

- 🛒 **Vendas**: Gerenciamento completo de vendas com carrinho, pagamentos e emissão de comprovantes
- 🧁 **Produtos**: Cadastro e gestão de produtos com categorias e tamanhos
- 📦 **Estoque**: Controle de ingredientes e produtos em estoque
- 📅 **Reservas**: Sistema de reservas de produtos com notificações
- 👥 **Clientes**: Cadastro e gestão de clientes com programa de fidelidade
- 📊 **Relatórios**: Relatórios detalhados de vendas, produtos, estoque e financeiro
- 🏢 **Filiais**: Gerenciamento de múltiplas filiais
- 👨‍💼 **Funcionários**: Controle de funcionários e permissões
- 💰 **Financeiro**: Cálculo de lucro real baseado em preço de venda e custo

## Tecnologias

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Firebase (Firestore, Authentication, Storage)
- **Autenticação**: Firebase Authentication
- **Banco de Dados**: Firestore

## Instalação

1. Clone o repositório:
   \`\`\`bash
   git clone https://github.com/seu-usuario/pdv-loja-bolos.git
   cd pdv-loja-bolos
   \`\`\`

2. Instale as dependências:
   \`\`\`bash
   npm install
   \`\`\`

3. Configure as variáveis de ambiente:
   Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:
   \`\`\`
   NEXT_PUBLIC_FIREBASE_API_KEY=
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
   NEXT_PUBLIC_FIREBASE_APP_ID=
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
   \`\`\`

4. Inicie o servidor de desenvolvimento:
   \`\`\`bash
   npm run dev
   \`\`\`

## Estrutura do Projeto

- `/app`: Rotas e páginas da aplicação (Next.js App Router)
- `/components`: Componentes React reutilizáveis
- `/lib`: Utilitários, serviços e contextos
- `/public`: Arquivos estáticos

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo LICENSE para mais detalhes.
\`\`\`

Agora, vamos ajustar o componente ShoppingCart para exibir claramente o número de produtos e o valor total:

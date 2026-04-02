

```markdown
# Gourmet AR - Cardápio Interativo 3D com Realidade Aumentada

Aplicação web de cardápio interativo em **Realidade Aumentada (AR)** para restaurantes, utilizando
A-Frame (baseado em Three.js). Permite visualizar os pratos em 3D diretamente na mesa do cliente via câmera do celular.

## ✨ Funcionalidades

- **Visualização 3D em AR** dos produtos usando modelos GLB/GLTF
- **Menu interativo** com cards bonitos e informações nutricionais
- **Carrinho de pedidos** com quantidade e total
- **Envio de pedidos** em lote para o backend (NestJS)
- **Notificações em tempo real** via WebSocket quando o pedido fica pronto
- **Animação 3D** dos modelos (rotação automática + pausa ao tocar)
- **Notificação especial** com modelo 3D dançante quando o pedido está pronto
- **Suporte a múltiplas mesas** via parâmetro na URL (`?mesa=5`)
- Design moderno com glassmorphism e animações suaves

## 🛠️ Tecnologias Utilizadas

### Frontend
- **HTML5 + CSS3** (com Glassmorphism e gradientes)
- **A-Frame** (v1.6.0) - Framework para WebXR / Realidade Aumentada
- **aframe-extras** - Animações e utilitários
- **Socket.io** - Comunicação em tempo real
- **Gesture Detector** (AR.js Gestures)

### Backend (integração)
- API REST (NestJS recomendado)
- WebSocket (Socket.io)

## 📁 Estrutura de Arquivos

/
├── index.html                 ← Arquivo principal (tudo em um único arquivo)
├── assets/
│   └── models/                ← Modelos 3D (.glb)
│       ├── hamburguer.glb
│       ├── pizza.glb
│       ├── coca.glb
│       └── Rumba-Dancing.glb  ← Modelo usado na notificação
├── README.md
└── (opcional) api-client.js, config.js, etc.

## 🚀 Como Usar

1. Coloque o arquivo `index.html` em um servidor (Vercel, Netlify, Render, ou qualquer servidor estático).
2. Acesse via celular com a URL:
   
   https://seusite.com/?mesa=3
   
3. Escaneie o QR Code da mesa ou informe o número manualmente.

### Parâmetros da URL
- `?mesa=5` ou `?table=5` → Define o número da mesa

## 🧩 Como Funciona o Código

### 1. Interface Principal (`index.html`)

- **Menu inicial**: Lista de produtos em grid responsivo
- **Tela AR**: Ao clicar em "Ver em 3D", abre o modelo 3D com rotação automática
- **Painel de detalhes**: Informações nutricionais, preço e controles de quantidade
- **Carrinho**: Gerencia múltiplos itens
- **Notificação 3D**: Quando o pedido fica pronto, aparece um overlay com modelo dançante

### 2. Modelos 3D (A-Frame)

```js
// Carregamento do modelo
model.setAttribute("gltf-model", `url(assets/models/${product.modelFile})`);
model.setAttribute("scale", product.scale);
model.setAttribute("animation", { /* rotação infinita */ });



Cada produto tem:
- `modelFile`, `scale`, `position`
- Informações nutricionais
- Imagem para o card

### 3. WebSocket (Tempo Real)

- Conecta automaticamente ao carregar a página
- Escuta eventos:
  - `order-confirmed` → Pedido recebido
  - `order-ready` → Pedido pronto (mostra notificação 3D)
  - `order-updated` → Status alterado

### 4. Notificação quando o Pedido Fica Pronto

Função principal: `showTemporary3DModel()`
- Cria uma cena A-Frame temporária
- Carrega o modelo `Rumba-Dancing.glb` com animação
- Contador regressivo de 10 segundos
- Vibração no celular

### 5. Integração com Backend

- Envio de pedidos via `fetch` para `/api/orders/bulk`
- Configuração da URL do backend via `localStorage` (comentado)
- API Client modular (disponível nos arquivos extras)

## 🎨 Estilos e UX

- Design dark moderno com laranja (#ff6b35) como cor principal
- Glassmorphism (backdrop-filter)
- Animações suaves com `cubic-bezier`
- Totalmente responsivo e otimizado para dispositivos móveis
- Instruções de gesto visíveis

## 🔧 Personalização

### Adicionar novo produto

Basta adicionar no array `products`:

```js
{
  id: 4,
  name: "Sushi Combo",
  description: "...",
  price: 52.9,
  modelFile: "sushi.glb",
  image: "url-da-imagem.jpg",
  scale: "0.15 0.15 0.15",
  position: "0 0.4 0",
  calories: 680,
  protein: 45,
  carbs: 60,
  fat: 22
}


### Mudar URL do Backend

Descomente o painel de configuração ou altere diretamente a variável `BACKEND_URL`.

## 📋 Próximos Passos (Melhorias Sugeridas)

- Separar o JavaScript em múltiplos arquivos
- Usar o `API Client` modularizado (já fornecido)
- Adicionar suporte offline (Service Worker)
- Melhorar acessibilidade
- Adicionar sons customizados
- Suporte a múltiplos idiomas

## 📄 Licença

Projeto desenvolvido para demonstração e uso em restaurantes. Fique à vontade para modificar.

---

**Feito com ❤️ para experiências gastronômicas imersivas**

Qualquer dúvida ou quiser que eu melhore alguma seção (ex: adicionar seção de instalação, troubleshooting, ou como configurar o backend), é só falar!


---

Quer que eu faça uma versão **mais curta** ou **mais técnica/desenvolvedor**? Posso adaptar o tom conforme sua necessidade.

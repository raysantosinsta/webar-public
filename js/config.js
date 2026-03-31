const CONFIG = {
  // REST API (HTTP)
  API_URL: 'http://localhost:3000/api',
  
  // WebSocket (WS) - sem /api
  WS_URL: 'ws://localhost:3000',  // ✅ Correto para desenvolvimento
  
  // Para produção com HTTPS
  // WS_URL: 'wss://seusite.com',
  
  SOUNDS: {
    ORDER_READY: '/assets/sounds/order-ready.mp3',
    CLICK: '/assets/sounds/click.mp3'
  },
  MODELS_PATH: '/assets/models/'
};
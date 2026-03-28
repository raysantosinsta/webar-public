// ============================================
// CONFIGURAÇÕES
// ============================================
const CONFIG = {
  API_URL: 'http://localhost:3000/api',
  WS_URL: 'ws://localhost:3000',
  SOUNDS: {
    ORDER_READY: '/assets/sounds/order-ready.mp3',
    CLICK: '/assets/sounds/click.mp3'
  }
};

// ============================================
// API CLIENT
// ============================================
const API = {
  getTableNumber: () => {
    // Pega o número da mesa da URL ou localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const tableParam = urlParams.get('table');
    if (tableParam) return parseInt(tableParam);
    
    const storedTable = localStorage.getItem('tableNumber');
    if (storedTable) return parseInt(storedTable);
    
    return 1; // Mesa padrão
  },

  getProducts: async () => {
    try {
      const response = await fetch(`${CONFIG.API_URL}/products`);
      if (!response.ok) throw new Error('Erro ao carregar produtos');
      return await response.json();
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      return [];
    }
  },

  createOrder: async (orderData) => {
    try {
      const response = await fetch(`${CONFIG.API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tableNumber: orderData.tableNumber,
          productId: orderData.productId,
          productName: orderData.productName,
          productPrice: orderData.productPrice,
          quantity: orderData.quantity,
          observation: orderData.observation || '',
          status: 'pending'
        }),
      });
      
      if (!response.ok) throw new Error('Erro ao criar pedido');
      return await response.json();
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      throw error;
    }
  }
};

// ============================================
// WEBSOCKET CLIENT
// ============================================
const WebSocketClient = {
  socket: null,
  
  connect: (tableNumber, onOrderReady) => {
    WebSocketClient.socket = io(CONFIG.WS_URL, {
      query: { type: 'table', tableNumber },
      transports: ['websocket']
    });
    
    WebSocketClient.socket.on('connect', () => {
      console.log('✅ Conectado ao WebSocket');
    });
    
    WebSocketClient.socket.on('order-ready', (data) => {
      console.log('🎉 Pedido pronto:', data);
      if (onOrderReady) onOrderReady(data);
    });
    
    WebSocketClient.socket.on('order-updated', (data) => {
      console.log('📦 Pedido atualizado:', data);
      if (data.status === 'ready' && onOrderReady) {
        onOrderReady(data);
      }
    });
    
    WebSocketClient.socket.on('disconnect', () => {
      console.log('❌ Desconectado do WebSocket');
    });
    
    return WebSocketClient.socket;
  },
  
  disconnect: () => {
    if (WebSocketClient.socket) {
      WebSocketClient.socket.disconnect();
      WebSocketClient.socket = null;
    }
  }
};

// ============================================
// AR CONTROLLER (simplificado para exemplo)
// ============================================
const ARController = {
  currentModel: null,
  scene: null,
  camera: null,
  renderer: null,
  
  loadModel: (product) => {
    console.log('📦 Carregando modelo 3D:', product.name);
    // Aqui você implementaria a lógica do Three.js/AR
    // Por enquanto, apenas um placeholder
    document.getElementById('ar-container').innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; height: 100%;">
        <div style="text-align: center;">
          <div style="font-size: 64px;">🍕</div>
          <div style="margin-top: 20px;">${product.name}</div>
          <div style="margin-top: 10px;">Modelo 3D carregado!</div>
        </div>
      </div>
    `;
  },
  
  celebrateOrder: () => {
    // Animação de celebração
    const container = document.getElementById('ar-container');
    const celebration = document.createElement('div');
    celebration.className = 'celebration-animation';
    celebration.innerHTML = '🎉✨🍕✨🎉';
    celebration.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 48px;
      animation: fadeOut 2s forwards;
      pointer-events: none;
    `;
    container.appendChild(celebration);
    
    setTimeout(() => {
      celebration.remove();
    }, 2000);
  },
  
  reset: () => {
    console.log('Resetando AR Controller');
    document.getElementById('ar-container').innerHTML = '';
  }
};

// ============================================
// UTILS
// ============================================
function showTemporaryMessage(message, color = '#4CAF50') {
  // Remove toast existente
  const existingToast = document.querySelector('.toast-message');
  if (existingToast) existingToast.remove();
  
  // Cria novo toast
  const toast = document.createElement('div');
  toast.className = 'toast-message';
  toast.textContent = message;
  toast.style.backgroundColor = color;
  toast.style.position = 'fixed';
  toast.style.bottom = '20px';
  toast.style.left = '50%';
  toast.style.transform = 'translateX(-50%)';
  toast.style.backgroundColor = color;
  toast.style.color = 'white';
  toast.style.padding = '12px 24px';
  toast.style.borderRadius = '8px';
  toast.style.fontWeight = 'bold';
  toast.style.zIndex = '1000';
  toast.style.animation = 'fadeInUp 0.3s ease';
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

function playSound(soundUrl) {
  const audio = new Audio(soundUrl);
  audio.play().catch(error => console.error('Erro ao tocar som:', error));
}

// ============================================
// APLICAÇÃO PRINCIPAL
// ============================================
let products = [];
let currentQuantity = 1;
let currentProduct = null;

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
  const tableNumber = API.getTableNumber();
  document.getElementById('table-number').textContent = tableNumber;
  
  // Conecta WebSocket
  WebSocketClient.connect(tableNumber, (data) => {
    // Quando o pedido fica pronto, celebra
    ARController.celebrateOrder();
    showTemporaryMessage(`🎉 ${data.productName} pronto!`, '#FF9800');
    playSound(CONFIG.SOUNDS.ORDER_READY);
  });
  
  // Carrega produtos
  await loadProducts();
  
  // Configura eventos
  setupEventListeners();
});

// Carrega a lista de produtos
async function loadProducts() {
  products = await API.getProducts();
  renderProductList(products);
}

// Renderiza a lista de produtos na tela inicial
function renderProductList(products) {
  const container = document.getElementById('product-list');
  if (!container) return;
  
  container.innerHTML = '';
  
  products.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="product-image">
        <img src="${product.thumbnailUrl || '/assets/placeholder.png'}" alt="${product.name}">
      </div>
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.description || 'Delicioso produto'}</p>
        <div class="product-price">R$ ${(product.price || 0).toFixed(2)}</div>
      </div>
      <button class="select-btn" data-product-id="${product.id}">
        Ver em 3D
      </button>
    `;
    
    const selectBtn = card.querySelector('.select-btn');
    selectBtn.addEventListener('click', () => {
      selectProduct(product);
    });
    
    container.appendChild(card);
  });
}

// Seleciona um produto e vai para a tela AR
function selectProduct(product) {
  currentProduct = product;
  currentQuantity = 1;
  
  const quantitySpan = document.getElementById('quantity');
  if (quantitySpan) quantitySpan.textContent = '1';
  
  // Troca para tela AR
  const menuScreen = document.getElementById('menu-screen');
  const arScreen = document.getElementById('ar-screen');
  
  if (menuScreen) menuScreen.classList.remove('active');
  if (arScreen) arScreen.classList.add('active');
  
  // Carrega o modelo 3D
  ARController.loadModel(product);
}

// Configura eventos da interface
function setupEventListeners() {
  // Botão voltar
  const backButton = document.getElementById('back-button');
  if (backButton) {
    backButton.addEventListener('click', () => {
      const menuScreen = document.getElementById('menu-screen');
      const arScreen = document.getElementById('ar-screen');
      
      if (arScreen) arScreen.classList.remove('active');
      if (menuScreen) menuScreen.classList.add('active');
      
      ARController.reset();
    });
  }
  
  // Controles de quantidade
  const decreaseBtn = document.getElementById('decrease-qty');
  const increaseBtn = document.getElementById('increase-qty');
  const quantitySpan = document.getElementById('quantity');
  
  if (decreaseBtn) {
    decreaseBtn.addEventListener('click', () => {
      if (currentQuantity > 1) {
        currentQuantity--;
        if (quantitySpan) quantitySpan.textContent = currentQuantity;
      }
    });
  }
  
  if (increaseBtn) {
    increaseBtn.addEventListener('click', () => {
      if (currentQuantity < 99) {
        currentQuantity++;
        if (quantitySpan) quantitySpan.textContent = currentQuantity;
      }
    });
  }
  
  // Botão de confirmar pedido
  const confirmBtn = document.getElementById('confirm-order');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', async () => {
      if (!currentProduct) {
        showTemporaryMessage('❌ Selecione um produto primeiro!', '#F44336');
        return;
      }
      
      const tableNumber = API.getTableNumber();
      
      try {
        await API.createOrder({
          tableNumber: tableNumber,
          productId: currentProduct.id,
          productName: currentProduct.name,
          productPrice: currentProduct.price,
          quantity: currentQuantity,
          observation: ''
        });
        
        showTemporaryMessage(`✅ Pedido de ${currentProduct.name} enviado!`, '#4CAF50');
        
        // Toca som de clique
        playSound(CONFIG.SOUNDS.CLICK);
        
        // Volta para o cardápio após alguns segundos
        setTimeout(() => {
          const menuScreen = document.getElementById('menu-screen');
          const arScreen = document.getElementById('ar-screen');
          
          if (arScreen) arScreen.classList.remove('active');
          if (menuScreen) menuScreen.classList.add('active');
          
          ARController.reset();
        }, 2000);
        
      } catch (error) {
        console.error('Erro ao criar pedido:', error);
        showTemporaryMessage('❌ Erro ao enviar pedido. Tente novamente.', '#F44336');
      }
    });
  }
}

// ============================================
// ADICIONAR ESTILOS CSS (se não existirem no arquivo CSS)
// ============================================
const style = document.createElement('style');
style.textContent = `
  .toast-message {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: bold;
    z-index: 1000;
    animation: fadeInUp 0.3s ease;
  }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }
  
  @keyframes fadeOut {
    from {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
    to {
      opacity: 0;
      transform: translate(-50%, -50%) scale(2);
    }
  }
  
  .celebration-animation {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 48px;
    animation: fadeOut 2s forwards;
    pointer-events: none;
    z-index: 1000;
  }
`;

document.head.appendChild(style);
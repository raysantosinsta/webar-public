// ============================================
// WEBSOCKET CLIENT
// ============================================

const WebSocketClient = (function() {
  // Variáveis privadas
  let socket = null;
  let onOrderReadyCallback = null;
  let currentTableNumber = null;
  let reconnectAttempts = 0;
  let reconnectTimer = null;
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 3000;
  
  // Verifica se CONFIG está definido
  const getWS_URL = () => {
    if (typeof CONFIG !== 'undefined' && CONFIG.WS_URL) {
      return CONFIG.WS_URL;
    }
    console.warn('⚠️ CONFIG.WS_URL não definido, usando padrão ws://localhost:3000');
    return 'ws://localhost:3000';
  };
  
  // Tenta reconectar automaticamente
  const attemptReconnect = () => {
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS && currentTableNumber) {
      reconnectAttempts++;
      console.log(`🔄 Tentativa de reconexão ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}...`);
      
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(() => {
        connect(currentTableNumber, onOrderReadyCallback);
      }, RECONNECT_DELAY);
    } else {
      console.error('❌ Falha ao reconectar após múltiplas tentativas');
      showTemporaryMessage('❌ Perdeu conexão com o servidor. Recarregue a página.', '#F44336');
    }
  };
  
  // Toca som com fallback
  const playSound = (soundUrl) => {
    try {
      const audio = new Audio(soundUrl);
      // Configura para permitir autoplay após interação do usuário
      audio.volume = 0.5;
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn('⚠️ Autoplay bloqueado:', error);
          // Tenta novamente após interação do usuário
          document.body.addEventListener('click', () => {
            audio.play().catch(e => console.warn('⚠️ Ainda não foi possível tocar:', e));
          }, { once: true });
        });
      }
    } catch (error) {
      console.error('Erro ao tocar som:', error);
    }
  };
  
  return {
    // Conecta ao WebSocket
    connect: (tableNumber, onReady) => {
      // Se já estiver conectado à mesma mesa, não faz nada
      if (socket && socket.connected && currentTableNumber === tableNumber) {
        console.log('ℹ️ WebSocket já conectado');
        return socket;
      }
      
      // Desconecta se existir conexão anterior
      if (socket) {
        WebSocketClient.disconnect();
      }
      
      currentTableNumber = tableNumber;
      onOrderReadyCallback = onReady;
      
      const wsUrl = getWS_URL();
      console.log(`🔌 Conectando ao WebSocket: ${wsUrl}`);
      
      try {
        socket = io(wsUrl, {
          query: { tableNumber: tableNumber, type: 'customer' },
          transports: ['websocket', 'polling'], // Fallback para polling
          reconnection: false, // Vamos gerenciar manualmente
          timeout: 10000
        });
        
        // Evento de conexão bem-sucedida
        socket.on('connect', () => {
          console.log(`✅ Conectado ao WebSocket como mesa ${tableNumber}`);
          reconnectAttempts = 0; // Reseta tentativas de reconexão
          
          // Informa ao servidor que esta mesa está online
          socket.emit('join-table', { tableNumber });
          
          // Notifica que está conectado
          const connectionStatus = document.getElementById('connection-status');
          if (connectionStatus) {
            connectionStatus.textContent = '🟢 Conectado';
            connectionStatus.style.color = '#4CAF50';
          }
        });
        
        // Evento de reconexão
        socket.on('reconnect', (attemptNumber) => {
          console.log(`🔄 Reconectado após ${attemptNumber} tentativas`);
          socket.emit('join-table', { tableNumber });
        });
        
        // Evento de erro
        socket.on('connect_error', (error) => {
          console.error('❌ Erro de conexão WebSocket:', error.message);
          const connectionStatus = document.getElementById('connection-status');
          if (connectionStatus) {
            connectionStatus.textContent = '🔴 Desconectado';
            connectionStatus.style.color = '#F44336';
          }
        });
        
        // Evento de confirmação de pedido
        socket.on('order-confirmed', (data) => {
          console.log('✅ Pedido confirmado:', data);
          showTemporaryMessage('✅ Pedido recebido pela cozinha!', '#4CAF50');
          
          // Toca som de confirmação
          if (typeof CONFIG !== 'undefined' && CONFIG.SOUNDS && CONFIG.SOUNDS.CLICK) {
            playSound(CONFIG.SOUNDS.CLICK);
          }
        });
        
        // Evento de pedido pronto
        socket.on('order-ready', (data) => {
          console.log('🎉 Pedido pronto:', data);
          
          // Toca o som de notificação
          if (typeof CONFIG !== 'undefined' && CONFIG.SOUNDS && CONFIG.SOUNDS.ORDER_READY) {
            playSound(CONFIG.SOUNDS.ORDER_READY);
          } else {
            // Som padrão se CONFIG não estiver disponível
            playSound('/assets/sounds/notification.mp3');
          }
          
          // Chama o callback com animação 3D
          if (onOrderReadyCallback && typeof onOrderReadyCallback === 'function') {
            onOrderReadyCallback(data);
          }
          
          // Mostra notificação visual
          WebSocketClient.showOrderNotification(data.productName);
        });
        
        // Evento de atualização de pedido
        socket.on('order-updated', (data) => {
          console.log('📦 Pedido atualizado:', data);
          if (data.status === 'preparing') {
            showTemporaryMessage('👨‍🍳 Seu pedido está sendo preparado!', '#FF9800');
          } else if (data.status === 'ready') {
            // Já tratado no order-ready
          }
        });
        
        // Evento de desconexão
        socket.on('disconnect', (reason) => {
          console.log(`❌ Desconectado do WebSocket. Motivo: ${reason}`);
          const connectionStatus = document.getElementById('connection-status');
          if (connectionStatus) {
            connectionStatus.textContent = '🔴 Desconectado';
            connectionStatus.style.color = '#F44336';
          }
          
          // Tenta reconectar automaticamente se não foi intencional
          if (reason === 'io server disconnect' || reason === 'transport close') {
            console.log('🔄 Tentando reconectar automaticamente...');
            attemptReconnect();
          }
        });
        
      } catch (error) {
        console.error('❌ Erro ao criar conexão WebSocket:', error);
        showTemporaryMessage('❌ Erro ao conectar com o servidor', '#F44336');
      }
      
      return socket;
    },
    
    // Desconecta do WebSocket
    disconnect: () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      
      if (socket) {
        socket.disconnect();
        socket = null;
      }
      
      currentTableNumber = null;
      onOrderReadyCallback = null;
      reconnectAttempts = 0;
      console.log('🔌 WebSocket desconectado manualmente');
    },
    
    // Mostra notificação visual
    showOrderNotification: (productName) => {
      // Verifica se o elemento de notificação existe
      let notification = document.getElementById('notification');
      let messageElement = document.getElementById('notification-message');
      
      // Se não existir, cria dinamicamente
      if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.className = 'order-notification';
        notification.innerHTML = `
          <div class="notification-content">
            <span class="notification-icon">🍕</span>
            <span id="notification-message"></span>
            <button class="notification-close">×</button>
          </div>
        `;
        document.body.appendChild(notification);
        
        // Adiciona estilos inline (ou use CSS classes)
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 16px 24px;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
          z-index: 10000;
          transform: translateX(400px);
          transition: transform 0.3s ease;
          font-family: sans-serif;
        `;
        
        messageElement = document.getElementById('notification-message');
        
        const closeBtn = notification.querySelector('.notification-close');
        if (closeBtn) {
          closeBtn.style.cssText = `
            margin-left: 12px;
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
          `;
          closeBtn.addEventListener('click', () => {
            notification.style.transform = 'translateX(400px)';
          });
        }
      }
      
      // Atualiza a mensagem
      if (messageElement) {
        messageElement.textContent = `🎉 Seu ${productName} está pronto!`;
      }
      
      // Mostra a notificação
      notification.style.transform = 'translateX(0)';
      
      // Esconde após 5 segundos
      setTimeout(() => {
        if (notification) {
          notification.style.transform = 'translateX(400px)';
        }
      }, 5000);
    },
    
    // Envia mensagem para o servidor
    sendMessage: (event, data) => {
      if (socket && socket.connected) {
        socket.emit(event, data);
        console.log(`📤 Mensagem enviada: ${event}`, data);
      } else {
        console.warn('⚠️ WebSocket não conectado, mensagem não enviada');
        return false;
      }
      return true;
    },
    
    // Verifica se está conectado
    isConnected: () => {
      return socket && socket.connected;
    },
    
    // Obtém o socket (para uso avançado)
    getSocket: () => socket
  };
})();

// ============================================
// FUNÇÕES AUXILIARES GLOBAIS
// ============================================

// Mostra mensagem temporária (toast)
function showTemporaryMessage(message, color = '#4CAF50') {
  // Remove toast existente
  const existingToast = document.querySelector('.toast-message-global');
  if (existingToast) existingToast.remove();
  
  // Cria novo toast
  const toast = document.createElement('div');
  toast.className = 'toast-message-global';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background-color: ${color};
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: bold;
    z-index: 10000;
    font-family: sans-serif;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    animation: fadeInUp 0.3s ease;
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'fadeOutDown 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Adiciona animações CSS se não existirem
if (!document.querySelector('#websocket-styles')) {
  const style = document.createElement('style');
  style.id = 'websocket-styles';
  style.textContent = `
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
    
    @keyframes fadeOutDown {
      from {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
      to {
        opacity: 0;
        transform: translateX(-50%) translateY(20px);
      }
    }
  `;
  document.head.appendChild(style);
}

// Exportar para uso global (opcional)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WebSocketClient;
}
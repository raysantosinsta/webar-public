// ============================================
// API CLIENT
// ============================================

const API = (function() {
  // Configurações privadas
  const DEFAULT_TIMEOUT = 10000; // 10 segundos
  
  // Obtém a URL base da API
  const getBaseUrl = () => {
    if (typeof CONFIG !== 'undefined' && CONFIG.API_URL) {
      return CONFIG.API_URL;
    }
    console.warn('⚠️ CONFIG.API_URL não definido, usando padrão');
    return 'http://localhost:3000/api';
  };
  
  // Função auxiliar para fazer fetch com timeout
  const fetchWithTimeout = async (url, options = {}, timeout = DEFAULT_TIMEOUT) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Requisição expirou (timeout)');
      }
      throw error;
    }
  };
  
  // Função auxiliar para tratar respostas
  const handleResponse = async (response) => {
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // Não conseguiu parsear JSON, usa mensagem padrão
      }
      throw new Error(errorMessage);
    }
    
    // Se a resposta for 204 No Content
    if (response.status === 204) {
      return null;
    }
    
    return await response.json();
  };
  
  return {
    // Obtém o número da mesa da URL (vindo do QR Code)
    getTableNumber: () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const table = parseInt(urlParams.get('table'));
        
        if (isNaN(table) || table < 1) {
          console.warn('⚠️ Mesa inválida na URL, usando mesa padrão 1');
          return 1;
        }
        
        return table;
      } catch (error) {
        console.error('Erro ao obter número da mesa:', error);
        return 1; // Mesa padrão
      }
    },
    
    // Carrega a lista de produtos
    getProducts: async () => {
      try {
        const baseUrl = getBaseUrl();
        const url = `${baseUrl}/products`;
        console.log('📦 Buscando produtos:', url);
        
        const response = await fetchWithTimeout(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        const products = await handleResponse(response);
        console.log(`✅ ${products.length} produtos carregados`);
        return products;
        
      } catch (error) {
        console.error('❌ Erro ao carregar produtos:', error.message);
        
        // Retorna produtos mockados para desenvolvimento (opcional)
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Usando produtos mockados');
          return [
            { id: 1, name: 'Pizza Margherita', price: 45.90, description: 'Molho, mussarela, manjericão', thumbnailUrl: '/assets/pizza.jpg' },
            { id: 2, name: 'Hambúrguer', price: 32.90, description: 'Pão, carne, queijo, salada', thumbnailUrl: '/assets/burger.jpg' },
            { id: 3, name: 'Refrigerante', price: 7.50, description: 'Coca-Cola 350ml', thumbnailUrl: '/assets/soda.jpg' }
          ];
        }
        
        return [];
      }
    },
    
    // Faz um pedido
    createOrder: async (orderData) => {
      try {
        const baseUrl = getBaseUrl();
        
        // Valida dados obrigatórios
        if (!orderData.tableNumber) {
          throw new Error('Número da mesa é obrigatório');
        }
        if (!orderData.productId && !orderData.productName) {
          throw new Error('Produto é obrigatório');
        }
        
        // Prepara os dados no formato esperado pelo backend
        const payload = {
          tableNumber: orderData.tableNumber,
          productId: orderData.productId || null,
          productName: orderData.productName,
          productPrice: orderData.productPrice,
          quantity: orderData.quantity || 1,
          observation: orderData.observation || '',
          status: 'pending'
        };
        
        console.log('📝 Enviando pedido:', payload);
        
        const response = await fetchWithTimeout(`${baseUrl}/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });
        
        const result = await handleResponse(response);
        console.log('✅ Pedido criado com sucesso:', result);
        
        return result;
        
      } catch (error) {
        console.error('❌ Erro ao fazer pedido:', error.message);
        throw error;
      }
    },
    
    // Busca pedidos da mesa
    getTableOrders: async (tableNumber) => {
      try {
        const baseUrl = getBaseUrl();
        const url = `${baseUrl}/orders/table/${tableNumber}`;
        console.log(`🔍 Buscando pedidos da mesa ${tableNumber}:`, url);
        
        const response = await fetchWithTimeout(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        const orders = await handleResponse(response);
        console.log(`✅ ${orders.length} pedidos encontrados para mesa ${tableNumber}`);
        return orders;
        
      } catch (error) {
        console.error(`❌ Erro ao buscar pedidos da mesa ${tableNumber}:`, error.message);
        return [];
      }
    },
    
    // Atualiza status do pedido (opcional)
    updateOrderStatus: async (orderId, status) => {
      try {
        const baseUrl = getBaseUrl();
        const response = await fetchWithTimeout(`${baseUrl}/orders/${orderId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status })
        });
        
        const result = await handleResponse(response);
        console.log(`✅ Pedido ${orderId} atualizado para ${status}`);
        return result;
        
      } catch (error) {
        console.error(`❌ Erro ao atualizar pedido ${orderId}:`, error.message);
        throw error;
      }
    },
    
    // Cancela pedido (opcional)
    cancelOrder: async (orderId) => {
      try {
        const baseUrl = getBaseUrl();
        const response = await fetchWithTimeout(`${baseUrl}/orders/${orderId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (response.status === 204) {
          console.log(`✅ Pedido ${orderId} cancelado com sucesso`);
          return { success: true };
        }
        
        return await handleResponse(response);
        
      } catch (error) {
        console.error(`❌ Erro ao cancelar pedido ${orderId}:`, error.message);
        throw error;
      }
    },
    
    // Verifica saúde da API
    healthCheck: async () => {
      try {
        const baseUrl = getBaseUrl();
        const response = await fetchWithTimeout(`${baseUrl.replace('/api', '')}/health`, {
          method: 'GET',
          timeout: 5000
        });
        
        if (response.ok) {
          console.log('✅ API está saudável');
          return true;
        }
        return false;
        
      } catch (error) {
        console.error('❌ API não está disponível:', error.message);
        return false;
      }
    }
  };
})();

// ============================================
// EXPORTAR PARA USO GLOBAL
// ============================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = API;
}
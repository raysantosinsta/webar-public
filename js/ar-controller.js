// ============================================
// AR CONTROLLER - Controle da cena AR e modelo 3D
// ============================================

const ARController = (function() {
  // Variáveis privadas
  let currentModel = null;
  let currentProduct = null;
  let rotationAnimation = null;
  let danceInterval = null;
  let pulseAnimation = null;
  let isDancing = false;
  
  // Função privada para verificar se A-Frame está carregado
  const isAFrameReady = () => {
    if (typeof AFRAME === 'undefined') {
      console.error('❌ A-Frame não está carregado!');
      return false;
    }
    return true;
  };
  
  // Função privada para parar animações atuais
  const stopCurrentAnimations = () => {
    // Para animação de dança
    if (danceInterval) {
      clearInterval(danceInterval);
      danceInterval = null;
    }
    
    // Para animação de pulso
    if (currentModel && currentModel.components && currentModel.components.animation__pulse) {
      currentModel.removeAttribute('animation__pulse');
    }
    
    // Reseta posição se estava dançando
    if (currentModel && isDancing) {
      currentModel.setAttribute('position', '0 0 0');
      isDancing = false;
    }
  };
  
  // Função privada para verificar se elemento existe
  const getElement = (id) => {
    const element = document.getElementById(id);
    if (!element) {
      console.warn(`⚠️ Elemento com ID "${id}" não encontrado`);
    }
    return element;
  };
  
  return {
    // Carrega o modelo 3D do produto selecionado
    loadModel: (product) => {
      if (!isAFrameReady()) return;
      
      const modelEntity = getElement('ar-model');
      if (!modelEntity) return;
      
      // Remove o modelo anterior
      while (modelEntity.firstChild) {
        modelEntity.removeChild(modelEntity.firstChild);
      }
      
      // Verifica se o caminho do modelo existe
      const modelPath = `${CONFIG.MODELS_PATH || '/assets/models/'}${product.modelFile || 'default.glb'}`;
      console.log('📦 Carregando modelo:', modelPath);
      
      // Cria o novo modelo
      const model = document.createElement('a-entity');
      model.setAttribute('gltf-model', `url(${modelPath})`);
      model.setAttribute('scale', '0.3 0.3 0.3');
      model.setAttribute('position', '0 0 0');
      model.setAttribute('animation', {
        property: 'rotation',
        to: '0 360 0',
        dur: 10000,
        easing: 'linear',
        loop: true
      });
      
      // Adiciona evento de erro para modelo
      model.addEventListener('model-error', () => {
        console.error('❌ Erro ao carregar modelo 3D');
        // Mostra placeholder
        const placeholder = document.createElement('a-sphere');
        placeholder.setAttribute('color', '#4CAF50');
        placeholder.setAttribute('radius', '0.5');
        placeholder.setAttribute('position', '0 0 0');
        model.appendChild(placeholder);
      });
      
      modelEntity.appendChild(model);
      currentModel = model;
      currentProduct = product;
      
      // Atualiza interface
      const productNameAr = getElement('product-name-ar');
      const selectedProductName = getElement('selected-product-name');
      const selectedProductPrice = getElement('selected-product-price');
      
      if (productNameAr) productNameAr.textContent = product.name;
      if (selectedProductName) selectedProductName.textContent = product.name;
      if (selectedProductPrice) {
        selectedProductPrice.textContent = `R$ ${(product.price || 0).toFixed(2)}`;
      }
      
      // Armazena o produto atual no window para compatibilidade
      window.currentProduct = product;
      
      console.log('✅ Modelo carregado com sucesso:', product.name);
    },
    
    // Anima o modelo quando o pedido fica pronto (dança)
    celebrateOrder: () => {
      if (!currentModel) {
        console.warn('⚠️ Nenhum modelo carregado para celebrar');
        return;
      }
      
      // Para animações atuais
      stopCurrentAnimations();
      
      // Pausa a rotação automática
      if (currentModel.hasAttribute('animation')) {
        currentModel.removeAttribute('animation');
      }
      
      isDancing = true;
      let direction = 1;
      let yPos = 0;
      let steps = 0;
      const maxSteps = 40; // 2 segundos (40 * 50ms)
      
      // Animação de "dança" - sobe e desce
      danceInterval = setInterval(() => {
        if (!currentModel) {
          clearInterval(danceInterval);
          return;
        }
        
        yPos += direction * 0.03;
        if (yPos >= 0.25) direction = -1;
        if (yPos <= -0.15) direction = 1;
        currentModel.setAttribute('position', `0 ${yPos} 0`);
        steps++;
        
        if (steps >= maxSteps) {
          clearInterval(danceInterval);
          danceInterval = null;
          if (currentModel) {
            currentModel.setAttribute('position', '0 0 0');
            // Restaura a rotação automática
            currentModel.setAttribute('animation', {
              property: 'rotation',
              to: '0 360 0',
              dur: 10000,
              easing: 'linear',
              loop: true
            });
          }
          isDancing = false;
        }
      }, 50);
      
      // Efeito de escala pulsante
      if (currentModel) {
        currentModel.setAttribute('animation__pulse', {
          property: 'scale',
          from: '0.3 0.3 0.3',
          to: '0.45 0.45 0.45',
          dur: 300,
          dir: 'alternate',
          loop: 3
        });
        
        // Remove o atributo após a animação
        setTimeout(() => {
          if (currentModel) {
            currentModel.removeAttribute('animation__pulse');
          }
        }, 900);
      }
      
      // Adiciona efeito de partículas (opcional)
      const scene = document.querySelector('a-scene');
      if (scene) {
        const particles = document.createElement('a-entity');
        particles.setAttribute('geometry', {
          primitive: 'sphere',
          radius: 0.05
        });
        particles.setAttribute('material', 'color: gold');
        particles.setAttribute('animation', {
          property: 'position',
          from: '0 0.5 0',
          to: '0 1.5 0',
          dur: 500,
          easing: 'ease-out'
        });
        particles.setAttribute('position', '0 0.5 0');
        scene.appendChild(particles);
        
        setTimeout(() => {
          particles.remove();
        }, 500);
      }
      
      console.log('🎉 Celebrando pedido pronto!');
    },
    
    // Para a animação de rotação
    stopRotation: () => {
      if (currentModel) {
        currentModel.removeAttribute('animation');
        console.log('⏸️ Rotação pausada');
      }
    },
    
    // Retoma a rotação
    resumeRotation: () => {
      if (currentModel && !currentModel.hasAttribute('animation') && !isDancing) {
        currentModel.setAttribute('animation', {
          property: 'rotation',
          to: '0 360 0',
          dur: 10000,
          easing: 'linear',
          loop: true
        });
        console.log('▶️ Rotação retomada');
      }
    },
    
    // Reseta a cena
    reset: () => {
      if (!currentModel) return;
      
      // Para todas as animações
      stopCurrentAnimations();
      
      // Reseta posição e rotação
      currentModel.setAttribute('position', '0 0 0');
      currentModel.setAttribute('rotation', '0 0 0');
      
      // Restaura a rotação automática
      currentModel.setAttribute('animation', {
        property: 'rotation',
        to: '0 360 0',
        dur: 10000,
        easing: 'linear',
        loop: true
      });
      
      console.log('🔄 Cena AR resetada');
    },
    
    // Remove o modelo atual
    removeModel: () => {
      if (currentModel) {
        const modelEntity = getElement('ar-model');
        if (modelEntity) {
          while (modelEntity.firstChild) {
            modelEntity.removeChild(modelEntity.firstChild);
          }
        }
        currentModel = null;
        currentProduct = null;
        stopCurrentAnimations();
        console.log('🗑️ Modelo removido');
      }
    },
    
    // Obtém o modelo atual
    getCurrentModel: () => currentModel,
    
    // Obtém o produto atual
    getCurrentProduct: () => currentProduct
  };
})();

// ============================================
// EXPORTAR PARA USO GLOBAL (se necessário)
// ============================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ARController;
}
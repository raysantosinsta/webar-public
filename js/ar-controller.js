// ============================================
// AR CONTROLLER - Versão Ajustada
// ============================================

const ARController = (function() {
  let currentModel = null;
  let currentProduct = null;

  // Função principal para carregar o modelo
  const loadModel = (product) => {
    if (!product || !product.modelFile) {
      console.error("❌ Produto ou modelFile inválido");
      return;
    }

    currentProduct = product;

    const modelEntity = document.getElementById("ar-model");
    if (!modelEntity) {
      console.error("❌ Elemento #ar-model não encontrado");
      return;
    }

    // Limpa modelo anterior
    while (modelEntity.firstChild) {
      modelEntity.removeChild(modelEntity.firstChild);
    }

    const modelPath = `assets/models/${product.modelFile}`;
    console.log(`📦 Carregando modelo: ${modelPath}`);

    const model = document.createElement("a-entity");
    model.setAttribute("gltf-model", `url(${modelPath})`);
    model.setAttribute("scale", "0.22 0.22 0.22");        // menor, como você pediu
    model.setAttribute("position", "0 0.2 -1.0");

    // Rotação automática horizontal infinita (suave)
    model.setAttribute("animation", {
      property: "rotation",
      to: "0 360 0",
      dur: 16000,                    // 16 segundos por volta
      easing: "linear",
      loop: true
    });

    // Eventos de carregamento
    model.addEventListener("model-loaded", () => {
      console.log(`✅ Modelo carregado com sucesso: ${product.name}`);
      updateStatus(`✅ ${product.name} carregado • Arraste para girar`);
    });

    model.addEventListener("model-error", (err) => {
      console.error("❌ Erro ao carregar modelo:", err);
      updateStatus(`⚠️ Falha ao carregar ${product.modelFile}`, true);
    });

    modelEntity.appendChild(model);
    currentModel = model;
  };

  // Função para quando o pedido ficar pronto (opcional)
  const celebrateOrder = () => {
    if (!currentModel) return;

    // Pausa rotação normal
    currentModel.removeAttribute("animation");

    // Animação de "dança" rápida
    currentModel.setAttribute("animation__celebrate", {
      property: "position",
      from: "0 0.2 -1.0",
      to: "0 0.5 -1.0",
      dur: 400,
      direction: "alternate",
      loop: 4
    });

    // Volta à rotação normal após 3 segundos
    setTimeout(() => {
      if (currentModel) {
        currentModel.removeAttribute("animation__celebrate");
        currentModel.setAttribute("animation", {
          property: "rotation",
          to: "0 360 0",
          dur: 16000,
          easing: "linear",
          loop: true
        });
      }
    }, 3000);
  };

  // Reset da cena
  const reset = () => {
    const modelEntity = document.getElementById("ar-model");
    if (modelEntity) {
      while (modelEntity.firstChild) {
        modelEntity.removeChild(modelEntity.firstChild);
      }
    }
    currentModel = null;
    console.log("🔄 Cena AR resetada");
  };

  return {
    loadModel: loadModel,
    celebrateOrder: celebrateOrder,
    reset: reset,
    getCurrentProduct: () => currentProduct
  };
})();
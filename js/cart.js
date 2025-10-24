// ---------------- utilidades ----------------
function parseBRLToNumber(str) {
  if (!str) return 0;
  const cleaned = str
    .replace(/\s/g, "")
    .replace("R$", "")
    .replace(/\./g, "")
    .replace(",", ".");
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

function formatNumberToBRL(n) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ---------------- estado do carrinho ----------------
const CART_KEY = "fora_do_casco_cart";

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartUI();
}

// ---------------- adicionar / remover / atualizar ----------------
function addToCart(nome, precoStr, img) {
  const price = parseBRLToNumber(precoStr);
  const cart = getCart();
  const idx = cart.findIndex((i) => i.nome === nome);
  if (idx > -1) {
    cart[idx].quantidade += 1;
  } else {
    cart.push({ nome, preco: price, quantidade: 1, img: img || "" });
  }
  saveCart(cart);
}

function removeFromCart(nome) {
  let cart = getCart();
  cart = cart.filter((i) => i.nome !== nome);
  saveCart(cart);
}

function changeQuantity(nome, quantidade) {
  const cart = getCart();
  const idx = cart.findIndex((i) => i.nome === nome);
  if (idx > -1) {
    cart[idx].quantidade = quantidade;
    if (cart[idx].quantidade <= 0) removeFromCart(nome);
    else saveCart(cart);
  }
}

// ---------------- renderização do cart modal ----------------
function renderCartItems() {
  const container = document.getElementById("cart-items");
  if (!container) return;
  const cart = getCart();
  if (cart.length === 0) {
    container.innerHTML = "<p>Seu carrinho está vazio.</p>";
    document.getElementById("cart-total").textContent = formatNumberToBRL(0);
    return;
  }

  let html = '<div class="list-group">';
  cart.forEach((item) => {
    const subtotal = item.preco * item.quantidade;
    html += `
      <div class="list-group-item d-flex align-items-center justify-content-between">
        <div class="d-flex align-items-center">
          ${
            item.img
              ? `<img src="${item.img}" style="width:60px;height:60px;object-fit:cover;border-radius:6px;margin-right:10px" />`
              : ""
          }
          <div>
            <div><strong>${item.nome}</strong></div>
            <div class="text-muted" style="font-size:0.9rem">${formatNumberToBRL(
              item.preco
            )} cada</div>
          </div>
        </div>
        <div class="d-flex align-items-center gap-2">
          <input type="number" min="1" value="${
            item.quantidade
          }" data-nome="${item.nome}" class="form-control quantity-input" style="width:70px"/>
          <div class="text-end" style="min-width:90px">
            <div>${formatNumberToBRL(subtotal)}</div>
            <button class="btn btn-sm btn-link text-danger remove-item" data-nome="${
              item.nome
            }">Remover</button>
          </div>
        </div>
      </div>
    `;
  });
  html += "</div>";
  container.innerHTML = html;

  container.querySelectorAll(".remove-item").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const nome = e.target.dataset.nome;
      removeFromCart(nome);
      renderCartItems();
    });
  });
  container.querySelectorAll(".quantity-input").forEach((input) => {
    input.addEventListener("change", (e) => {
      const nome = e.target.dataset.nome;
      const q = parseInt(e.target.value) || 1;
      changeQuantity(nome, q);
      renderCartItems();
    });
  });

  const total = cart.reduce((s, it) => s + it.preco * it.quantidade, 0);
  document.getElementById("cart-total").textContent = formatNumberToBRL(total);
}

// ---------------- UI do botão contador ----------------
function updateCartUI() {
  const cart = getCart();
  const count = cart.reduce((s, it) => s + it.quantidade, 0);
  const badge = document.getElementById("cart-count");
  if (badge) badge.textContent = count;
}

// ---------------- checkout via WhatsApp ----------------
function checkoutToWhatsApp() {
  const cart = getCart();
  if (cart.length === 0) {
    alert("Carrinho vazio.");
    return;
  }

  // Coleta os dados do formulário
  const nome = document.getElementById("checkout-nome").value.trim();
  const telefone = document.getElementById("checkout-telefone").value.trim();
  const endereco = document.getElementById("checkout-endereco").value.trim();
  const observacao = document.getElementById("checkout-observacoes").value.trim();

  if (!nome || !telefone || !endereco) {
    alert("Por favor, preencha todos os campos obrigatórios.");
    return;
  }

  // Monta mensagem formatada (usando \n para quebras de linha)
  let mensagem = ` *FORA DO CASCO - NOVO PEDIDO* \n\n`;
  mensagem += ` *Cliente:* ${nome}\n`;
  mensagem += ` *Telefone:* ${telefone}\n`;
  mensagem += ` *Endereço:* ${endereco}\n`;
  if (observacao) mensagem += ` *Observações:* ${observacao}\n`;
  mensagem += `\n *Itens do Pedido:*\n`;

  let total = 0;
  cart.forEach((item) => {
    const subtotal = item.preco * item.quantidade;
    total += subtotal;
    mensagem += `• ${item.nome} x${item.quantidade} — ${formatNumberToBRL(subtotal)}\n`;
  });

  mensagem += `\n *Total:* ${formatNumberToBRL(total)}\n`;
  mensagem += `\n *Agradecemos o pedido!* Entraremos em contato para confirmar o horário de entrega.\n`;

  // Número de destino
  const numero = "5569985009550"; // substitua pelo número real

  // *** A MÁGICA ACONTECE AQUI ***
  // Codifica a mensagem inteira para ser segura para URL
  const mensagemCodificada = encodeURIComponent(mensagem);

  const url = `https://wa.me/${numero}?text=${mensagemCodificada}`;
  window.open(url, "_blank");
}


// ---------------- eventos globais ----------------
document.addEventListener("click", function (e) {
  if (e.target && e.target.classList.contains("btn-add-cart")) {
    const nome = e.target.dataset.nome;
    const preco = e.target.dataset.preco;
    const img = e.target.dataset.img;
    addToCart(nome, preco, img);
    e.target.textContent = "Adicionado!";
    setTimeout(() => {
      e.target.textContent = "Adicionar ao carrinho";
    }, 900);
  }
});

document.addEventListener("DOMContentLoaded", function () {
  const openCartBtn = document.getElementById("open-cart-btn");
  if (openCartBtn) {
    openCartBtn.addEventListener("click", function () {
      renderCartItems();
      updateCartUI();
      const modal = new bootstrap.Modal(document.getElementById("cartModal"));
      modal.show();
    });
  }

  const clearBtn = document.getElementById("clear-cart");
  if (clearBtn)
    clearBtn.addEventListener("click", function () {
      localStorage.removeItem(CART_KEY);
      renderCartItems();
      updateCartUI();
    });

  const checkoutBtn = document.getElementById("checkout-whatsapp");
  if (checkoutBtn)
    checkoutBtn.addEventListener("click", function () {
      checkoutToWhatsApp();
    });

  updateCartUI();
});

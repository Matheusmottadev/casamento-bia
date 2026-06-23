const pendingPurchaseStorageKey = "casamento-bia-pending-purchase";
const paymentCopy = document.querySelector("#payment-copy");
const paymentSummary = document.querySelector("#payment-summary");
const paymentForm = document.querySelector("#payment-form");
const paymentFeedback = document.querySelector("#payment-feedback");
const paymentSubmit = document.querySelector("#payment-submit");
const paymentElementContainer = document.querySelector("#payment-element");

function formatCurrencyFromCents(amountInCents, currency = "brl") {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format((Number(amountInCents) || 0) / 100);
}

function readPendingPurchase() {
  try {
    const raw = window.sessionStorage.getItem(pendingPurchaseStorageKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearPendingPurchase() {
  window.sessionStorage.removeItem(pendingPurchaseStorageKey);
}

async function initializePaymentPage() {
  if (!paymentCopy || !paymentSummary || !paymentForm || !paymentFeedback || !paymentSubmit || !paymentElementContainer) {
    return;
  }

  const pendingPurchase = readPendingPurchase();

  if (!pendingPurchase?.giftTitle || !pendingPurchase?.amount) {
    paymentCopy.textContent = "Nao encontramos os dados da compra. Volte para a lista e tente novamente.";
    paymentForm.hidden = true;
    return;
  }

  paymentCopy.textContent = "Confira os dados abaixo e finalize no cartao.";
  paymentSummary.innerHTML = `
    <p><strong>Presente:</strong> ${pendingPurchase.giftTitle}</p>
    <p><strong>Valor:</strong> ${pendingPurchase.priceLabel || pendingPurchase.amount}</p>
    <p><strong>Convidado:</strong> ${pendingPurchase.firstName} ${pendingPurchase.lastName}</p>
    <p><strong>Telefone:</strong> ${pendingPurchase.phone}</p>
  `;

  try {
    paymentFeedback.textContent = "Carregando formulario de pagamento...";

    const response = await fetch("/api/purchase-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pendingPurchase),
    });
    const data = await response.json();

    if (!response.ok || !data.clientSecret || !data.publishableKey) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    const stripe = window.Stripe(data.publishableKey, { locale: "pt-BR" });
    const elements = stripe.elements({
      clientSecret: data.clientSecret,
      appearance: {
        theme: "stripe",
        variables: {
          colorPrimary: "#6b7442",
          colorBackground: "#ffffff",
          colorText: "#332a1f",
          borderRadius: "16px",
        },
      },
    });

    const paymentElement = elements.create("payment", {
      layout: {
        type: "tabs",
        defaultCollapsed: false,
      },
    });

    paymentElement.mount("#payment-element");
    paymentFeedback.textContent = "";

    paymentForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      paymentSubmit.disabled = true;
      paymentFeedback.textContent = "Confirmando pagamento...";

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/compra-sucesso.html`,
        },
        redirect: "if_required",
      });

      if (error) {
        paymentFeedback.textContent = error.message || "Nao foi possivel confirmar o pagamento.";
        paymentSubmit.disabled = false;
        return;
      }

      const confirmedPaymentIntentId = paymentIntent?.id || data.paymentIntentId;
      clearPendingPurchase();
      paymentFeedback.textContent = "Pagamento confirmado.";
      window.location.href = `./compra-sucesso.html?payment_intent=${encodeURIComponent(confirmedPaymentIntentId)}`;
    });
  } catch (error) {
    console.error("Nao foi possivel carregar o formulario de pagamento.", error);
    paymentFeedback.textContent = "Nao foi possivel abrir o pagamento agora.";
    paymentSubmit.disabled = true;
  }
}

initializePaymentPage();

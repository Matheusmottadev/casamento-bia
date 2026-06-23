const statusCopy = document.querySelector("#checkout-status-copy");
const statusSummary = document.querySelector("#checkout-status-summary");
const searchParams = new URLSearchParams(window.location.search);
const paymentIntentId =
  searchParams.get("payment_intent") ||
  searchParams.get("payment_intent_id") ||
  searchParams.get("pi");

function formatCurrencyFromCents(amountInCents, currency = "brl") {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format((Number(amountInCents) || 0) / 100);
}

async function loadCheckoutStatus() {
  if (!statusCopy || !statusSummary) return;

  if (!paymentIntentId) {
    statusCopy.textContent = "Nao encontramos o identificador da sua compra.";
    return;
  }

  try {
    const response = await fetch(`/api/payment-intent-status?payment_intent=${encodeURIComponent(paymentIntentId)}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    statusCopy.textContent = "Recebemos sua compra com sucesso. Obrigado por fazer parte desse momento com a gente.";
    statusSummary.innerHTML = `
      <p><strong>Presente:</strong> ${data.giftTitle}</p>
      <p><strong>Valor:</strong> ${formatCurrencyFromCents(data.amountTotal, data.currency)}</p>
      <p><strong>Status:</strong> ${data.paymentStatus === "succeeded" ? "Pago" : data.paymentStatus}</p>
    `;
  } catch (error) {
    console.error("Nao foi possivel carregar os detalhes do pagamento.", error);
    statusCopy.textContent = "Seu pagamento pode ter sido concluido, mas nao conseguimos carregar os detalhes agora.";
  }
}

loadCheckoutStatus();

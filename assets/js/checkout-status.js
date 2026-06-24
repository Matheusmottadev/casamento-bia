const statusCopy = document.querySelector("#checkout-status-copy");
const statusSummary = document.querySelector("#checkout-status-summary");
const searchParams = new URLSearchParams(window.location.search);
const externalReference = searchParams.get("external_reference");
const paymentId = searchParams.get("payment_id") || searchParams.get("collection_id");
const fallbackStatus = searchParams.get("status") || searchParams.get("collection_status");

function formatCurrencyFromCents(amountInCents, currency = "brl") {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format((Number(amountInCents) || 0) / 100);
}

async function loadCheckoutStatus() {
  if (!statusCopy || !statusSummary) return;

  try {
    if (!externalReference && !paymentId) {
      throw new Error("Identificador ausente.");
    }

    const response = await fetch(
      `/api/purchase-status?external_reference=${encodeURIComponent(externalReference || "")}&payment_id=${encodeURIComponent(paymentId || "")}`,
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    const resolvedStatus = data.paymentStatus || fallbackStatus || "pending";
    const friendlyStatus =
      resolvedStatus === "approved"
        ? "Aprovado"
        : resolvedStatus === "pending"
          ? "Pendente"
          : resolvedStatus === "in_process"
            ? "Em analise"
            : resolvedStatus;

    statusCopy.textContent =
      resolvedStatus === "approved"
        ? "Recebemos sua compra com sucesso. Obrigado por fazer parte desse momento com a gente."
        : "Seu pagamento foi recebido pelo Mercado Pago e estamos acompanhando a confirmacao.";
    statusSummary.innerHTML = `
      <p><strong>Presente:</strong> ${data.giftTitle}</p>
      <p><strong>Valor:</strong> ${formatCurrencyFromCents(data.amountTotal, data.currency)}</p>
      <p><strong>Status:</strong> ${friendlyStatus}</p>
    `;
  } catch (error) {
    console.error("Nao foi possivel carregar os detalhes da compra.", error);
    statusCopy.textContent = "Seu pagamento foi enviado ao Mercado Pago. Se voce acabou de concluir agora, a confirmacao pode levar alguns instantes.";
    statusSummary.innerHTML = fallbackStatus
      ? `<p><strong>Status retornado:</strong> ${fallbackStatus}</p>`
      : "";
  }
}

loadCheckoutStatus();

const purchaseGiftBody = document.querySelector("#purchaseGiftBody");
const reservationGiftBody = document.querySelector("#reservationGiftBody");
const reservationsCard = document.querySelector("#reservationsCard");
const purchasesCard = document.querySelector("#purchasesCard");
const confirmationsCard = document.querySelector("#confirmationsCard");
const statusDot = document.querySelector("#statusDot");
const statusText = document.querySelector("#statusText");
const purchaseGiftCount = document.querySelector("#purchaseGiftCount");
const reservationGiftCount = document.querySelector("#reservationGiftCount");
const confirmMetric = document.querySelector("#mConfirm");
const reservedMetric = document.querySelector("#mReserved");
const purchasesMetric = document.querySelector("#mPurchases");
const totalMetric = document.querySelector("#mTotal");

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatCurrencyFromCents(amountInCents, currency = "brl") {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: String(currency || "brl").toUpperCase(),
  }).format((Number(amountInCents) || 0) / 100);
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      });
}

function formatGiftType(type) {
  return type === "reservation" ? "Lista física" : "Compra online";
}

function formatGiftQuantity(gift) {
  return gift.type === "purchase" ? "Infinita" : String(gift.quantity || 1);
}

function emptyState(title, subtitle) {
  return `
    <div class="empty">
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <circle cx="20" cy="20" r="18.5" stroke="#C9BCA3" stroke-width="1" stroke-dasharray="3 4"></circle>
        <path d="M13 24l5-9 4 6 3-4 5 7" stroke="#C9BCA3" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"></path>
      </svg>
      <p><b>${escapeHtml(title)}</b>${escapeHtml(subtitle)}</p>
    </div>
  `;
}

function giftStatusBadge(gift) {
  if (gift.type === "reservation") {
    const totalQuantity = Number(gift.quantity || 1);
    const reservedCount = Number(gift.reservedCount || 0);
    const remaining = totalQuantity - reservedCount;

    if (remaining <= 0) {
      return '<span class="badge sold-out">Esgotado</span>';
    }

    if (remaining === 1) {
      return '<span class="badge unit">1 unidade</span>';
    }

    return `<span class="badge unit">${remaining} unidades</span>`;
  }

  if (Number(gift.paidCount || 0) > 0) {
    return '<span class="badge paid">Pago</span>';
  }

  if (Number(gift.pendingCount || 0) > 0) {
    return '<span class="badge pending">Checkout iniciado</span>';
  }

  return '<span class="badge available">Disponível</span>';
}

function purchaseStatusBadge(status) {
  const normalized = String(status || "").toLowerCase();

  if (["approved", "paid", "succeeded"].includes(normalized)) {
    return '<span class="badge paid">Pago</span>';
  }

  if (["pending", "in_process", "authorized"].includes(normalized)) {
    return '<span class="badge pending">Em análise</span>';
  }

  return `<span class="badge available">${escapeHtml(normalized || "-")}</span>`;
}

function renderMetrics(data) {
  if (confirmMetric) confirmMetric.textContent = String(data.summary.totalGuests || 0);
  if (reservedMetric) reservedMetric.textContent = String(data.summary.totalReservations || 0);
  if (purchasesMetric) purchasesMetric.textContent = String(data.summary.totalPurchases || 0);
  if (totalMetric) totalMetric.textContent = formatCurrencyFromCents(data.summary.totalPaidAmount || 0, "brl");
}

function sortGifts(gifts) {
  return [...gifts].sort((left, right) => String(left.title || "").localeCompare(String(right.title || "")));
}

function renderPurchaseGifts(gifts) {
  if (!purchaseGiftBody) return;

  if (purchaseGiftCount) {
    purchaseGiftCount.textContent = `${gifts.length} itens`;
  }

  if (!gifts.length) {
    purchaseGiftBody.innerHTML = `<tr><td colspan="4" style="padding:0;">${emptyState(
      "Nenhum presente de compra",
      "Assim que a lista online for criada, ela aparece aqui.",
    )}</td></tr>`;
    return;
  }

  purchaseGiftBody.innerHTML = sortGifts(gifts)
    .map(
      (gift) => `
        <tr>
          <td class="gift-cell" data-label="Presente">
            <span class="gift-name">${escapeHtml(gift.title)}</span>
          </td>
          <td data-label="Status">${giftStatusBadge(gift)}</td>
          <td class="num" data-label="Qtde">${escapeHtml(formatGiftQuantity(gift))}</td>
          <td class="num" data-label="Pagos">${Number(gift.paidCount || 0)}</td>
        </tr>
      `,
    )
    .join("");
}

function renderReservationGifts(gifts) {
  if (!reservationGiftBody) return;

  if (reservationGiftCount) {
    reservationGiftCount.textContent = `${gifts.length} itens`;
  }

  if (!gifts.length) {
    reservationGiftBody.innerHTML = `<tr><td colspan="4" style="padding:0;">${emptyState(
      "Nenhum presente para se dispor",
      "Assim que a lista física for criada, ela aparece aqui.",
    )}</td></tr>`;
    return;
  }

  reservationGiftBody.innerHTML = sortGifts(gifts)
    .map(
      (gift) => `
        <tr>
          <td class="gift-cell" data-label="Presente">
            <span class="gift-name">${escapeHtml(gift.title)}</span>
          </td>
          <td data-label="Status">${giftStatusBadge(gift)}</td>
          <td class="num" data-label="Qtde">${escapeHtml(formatGiftQuantity(gift))}</td>
          <td class="num" data-label="Reservados">${Number(gift.reservedCount || 0)}</td>
        </tr>
      `,
    )
    .join("");
}

function renderReservations(list) {
  if (!reservationsCard) return;

  if (!list.length) {
    reservationsCard.innerHTML = emptyState(
      "Nenhuma reserva registrada",
      "Quando alguém reservar um item, ele aparece aqui.",
    );
    return;
  }

  reservationsCard.innerHTML = list
    .map(
      (reservation) => `
        <div class="mini-row">
          <div class="mini-top">
            <span class="mini-name">${escapeHtml(reservation.name)}</span>
            <span class="mini-date">${formatDate(reservation.createdAt)}</span>
          </div>
          <div class="mini-sub">${escapeHtml(reservation.giftTitle)} · ${escapeHtml(reservation.contact || "-")}</div>
        </div>
      `,
    )
    .join("");
}

function renderPurchases(list) {
  if (!purchasesCard) return;

  if (!list.length) {
    purchasesCard.innerHTML = emptyState(
      "Nenhuma compra registrada",
      "Pagamentos aprovados via Mercado Pago aparecem aqui.",
    );
    return;
  }

  purchasesCard.innerHTML = list
    .map(
      (purchase) => `
        <div class="mini-row">
          <div class="mini-top">
            <span class="mini-name">${escapeHtml(`${purchase.firstName} ${purchase.lastName}`.trim() || "-")}</span>
            <span class="mini-value">${formatCurrencyFromCents(purchase.amountTotal, purchase.currency || "brl")}</span>
          </div>
          <div class="mini-sub">${escapeHtml(purchase.giftTitle)}</div>
          <div class="mini-top" style="margin-top:8px;">
            ${purchaseStatusBadge(purchase.paymentStatus)}
            <span class="mini-date">${formatDate(purchase.createdAt)}</span>
          </div>
        </div>
      `,
    )
    .join("");
}

function renderConfirmations(list) {
  if (!confirmationsCard) return;

  if (!list.length) {
    confirmationsCard.innerHTML = emptyState(
      "Nenhuma confirmação registrada",
      "Assim que um convidado confirmar, o nome aparece aqui.",
    );
    return;
  }

  confirmationsCard.innerHTML = list
    .map(
      (confirmation) => `
        <div class="mini-row">
          <div class="mini-top">
            <span class="mini-name">${escapeHtml(`${confirmation.firstName} ${confirmation.lastName}`.trim())}</span>
            <span class="mini-date">${formatDate(confirmation.createdAt)}</span>
          </div>
          <div class="mini-sub">${escapeHtml(confirmation.phone || "-")}</div>
        </div>
      `,
    )
    .join("");
}

function setStatus(state, updatedAt) {
  if (!statusDot || !statusText) return;

  statusDot.className = "status-dot";

  if (state === "loading") {
    statusDot.classList.add("loading");
    statusText.textContent = "Carregando painel…";
    return;
  }

  if (state === "error") {
    statusDot.classList.add("err");
    statusText.textContent = "Não foi possível atualizar o painel.";
    return;
  }

  statusText.innerHTML = `Atualizado em <b>${escapeHtml(
    new Date(updatedAt).toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }),
  )}</b>`;
}

async function loadCoupleDashboard() {
  setStatus("loading");

  try {
    const response = await fetch("/api/couple-dashboard");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    renderMetrics(data);
    renderPurchaseGifts((data.gifts || []).filter((gift) => gift.type === "purchase"));
    renderReservationGifts((data.gifts || []).filter((gift) => gift.type === "reservation"));
    renderReservations(data.reservations || []);
    renderPurchases(data.purchases || []);
    renderConfirmations(data.rsvps || []);
    setStatus("ok", new Date().toISOString());
  } catch (error) {
    setStatus("error");
    console.error("Nao foi possivel carregar o painel dos noivos.", error);
  }
}

loadCoupleDashboard();

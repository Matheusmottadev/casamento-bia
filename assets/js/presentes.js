const purchaseGrid = document.querySelector("#purchase-gifts-grid");
const reservationGrid = document.querySelector("#reservation-gifts-grid");
const giftsStage = document.querySelector("#gifts-stage");
const purchasePanel = document.querySelector("#purchase-panel");
const reservationPanel = document.querySelector("#reservation-panel");
const giftsSwitcher = document.querySelector("#gifts-switcher");
const giftModal = document.querySelector("#gift-modal");
const giftModalCopy = document.querySelector("#gift-modal-copy");
const giftModalTitle = document.querySelector("#gift-modal-title");
const giftModalClose = document.querySelector("#gift-modal-close");
const giftReservationForm = document.querySelector("#gift-reservation-form");
const giftModalFeedback = document.querySelector("#gift-modal-feedback");
const giftReserverName = document.querySelector("#gift-reserver-name");
const giftReserverContact = document.querySelector("#gift-reserver-contact");
const customPurchaseModal = document.querySelector("#custom-purchase-modal");
const customPurchaseForm = document.querySelector("#custom-purchase-form");
const customPurchaseClose = document.querySelector("#custom-purchase-close");
const customPurchaseFeedback = document.querySelector("#custom-purchase-feedback");
const customPurchaseName = document.querySelector("#custom-purchase-name");
const customPurchaseValue = document.querySelector("#custom-purchase-value");
const purchaseCheckoutModal = document.querySelector("#purchase-checkout-modal");
const purchaseCheckoutForm = document.querySelector("#purchase-checkout-form");
const purchaseCheckoutClose = document.querySelector("#purchase-checkout-close");
const purchaseCheckoutCopy = document.querySelector("#purchase-checkout-copy");
const purchaseCheckoutFeedback = document.querySelector("#purchase-checkout-feedback");
const purchaseFirstName = document.querySelector("#purchase-first-name");
const purchaseLastName = document.querySelector("#purchase-last-name");
const purchasePhone = document.querySelector("#purchase-phone");
const giftToast = document.querySelector("#gift-toast");

if (purchaseGrid && reservationGrid) {
  const giftsViewState = {
    currentView: "purchase",
  };

  const purchaseGifts = [
    {
      id: "gym-annual",
      emoji: "🏋️",
      emojiClass: "gift-card__emoji--gym",
      title: "Academia para os noivos entrarem em forma depois da lua de mel",
      price: "R$ 2.388,00",
    },
    {
      id: "magic-mop",
      emoji: "🧽",
      emojiClass: "gift-card__emoji--mop",
      title: "Acessório de última geração para cuidar da casa sem perder a pose",
      price: "R$ 128,26",
    },
    {
      id: "industrial-nail",
      emoji: "🛠️",
      emojiClass: "gift-card__emoji--tool",
      title: "Acessório para cortar a unha do dedão do noivo com precisão industrial",
      price: "R$ 477,76",
    },
    {
      id: "fondue",
      emoji: "🍲",
      emojiClass: "gift-card__emoji--fondue",
      title: "Aparelho de fondue para noites românticas e fofocas bem servidas",
      price: "R$ 858,09",
    },
    {
      id: "plates",
      emoji: "🍽️",
      title: "Jogo de pratos chique para o casal fingir que janta assim todo dia",
      price: "R$ 312,40",
    },
    {
      id: "wine-cellar",
      emoji: "🍷",
      emojiClass: "gift-card__emoji--wine",
      title: "Adega para o casal organizar os vinhos e a vida em uma mesma prateleira",
      price: "R$ 649,90",
    },
    {
      id: "airfryer",
      emoji: "🍟",
      emojiClass: "gift-card__emoji--airfryer",
      title: "Air fryer oficial das visitas inesperadas e da batata frita de madrugada",
      price: "R$ 389,70",
    },
    {
      id: "robot-vacuum",
      emoji: "🤖",
      emojiClass: "gift-card__emoji--vacuum",
      title: "Robô aspirador para limpar o chão enquanto o casal ignora a bagunça",
      price: "R$ 1.199,00",
    },
    {
      id: "coffee",
      emoji: "☕",
      title: "Cafeteira para manter o romance vivo antes de qualquer conversa séria",
      price: "R$ 284,55",
    },
    {
      id: "bed-linen",
      emoji: "🛌",
      title: "Jogo de cama premium para domingos de preguiça profissional",
      price: "R$ 459,80",
    },
    {
      id: "travel-help",
      emoji: "✈️",
      emojiClass: "gift-card__emoji--travel",
      title: "Ajuda estratégica para a próxima viagem e para o casal sumir um pouco",
      price: "R$ 720,00",
    },
    {
      id: "market-basket",
      emoji: "🧺",
      title: "Cesta de mercado para a despensa ficar cheia e o amor também",
      price: "R$ 215,35",
    },
    {
      id: "therapy-retreat",
      emoji: "🧘",
      title: "Retiro anti-DR premium para o casal respirar fundo e continuar se amando",
      price: "R$ 1.480,00",
    },
    {
      id: "snore-proof",
      emoji: "😴",
      title: "Kit de sobrevivência para ronco matrimonial com tecnologia e paciência",
      price: "R$ 1.189,00",
    },
    {
      id: "luxury-massage",
      emoji: "💆",
      title: "Sessão deluxe de massagem para desestressar depois de escolher cortina",
      price: "R$ 1.320,00",
    },
    {
      id: "mega-ac",
      emoji: "❄️",
      title: "Ar-condicionado poderoso para esfriar o clima antes da primeira briguinha",
      price: "R$ 2.149,90",
    },
    {
      id: "custom-gift",
      emoji: "🎁",
      title: "Personalizado para quem quiser escolher nome e valor do presente",
      price: "Você define",
      isCustom: true,
    },
  ];

  const woodFinishLabel = "Madeira sugerida: Fresno Aveiro";
  const woodFinishSwatch = "./assets/images/gifts/real/fresno-aveiro.png";

  const reservationGifts = [
    { id: "air-conditioner", image: "./assets/images/gifts/real/air-conditioner.jpg", title: "Ar-condicionado", quantity: 1 },
    { id: "heater", image: "./assets/images/gifts/real/heater.jpg", title: "Aquecedor", quantity: 1 },
    {
      id: "kitchen-cabinet",
      image: "./assets/images/gifts/real/kitchen-cabinet.jpg",
      title: "Armário de cozinha",
      quantity: 1,
      note: woodFinishLabel,
      swatchImage: woodFinishSwatch,
    },
    { id: "glass-kitchen-table", image: "./assets/images/gifts/real/glass-kitchen-table.jpg", title: "Mesa de vidro da cozinha", quantity: 1 },
    { id: "vacuum-cleaner", image: "./assets/images/gifts/real/vacuum-cleaner.jpg", title: "Aspirador de pó", quantity: 1 },
    { id: "range-hood", image: "./assets/images/gifts/real/range-hood.jpg", title: "Exaustor", quantity: 1 },
    { id: "electric-oven", image: "./assets/images/gifts/real/electric-oven.jpg", title: "Forno elétrico", quantity: 1 },
    { id: "alexa", image: "./assets/images/gifts/real/alexa.jpg", title: "Alexa", quantity: 1 },
    { id: "curtain", image: "./assets/images/gifts/real/curtain.jpg", title: "Cortina", quantity: 1 },
    { id: "coffee-maker", image: "./assets/images/gifts/real/coffee-maker.jpg", title: "Cafeteira", quantity: 1 },
    { id: "ps5", image: "./assets/images/gifts/real/ps5.jpg", title: "PS5", quantity: 1 },
    { id: "drill", image: "./assets/images/gifts/real/drill.jpg", title: "Parafusadeira Bosch", quantity: 1 },
    { id: "shower", image: "./assets/images/gifts/real/shower.jpg", title: "Chuveiros", quantity: 1 },
    {
      id: "desk",
      image: "./assets/images/gifts/real/desk.jpg",
      title: "Escrivaninha",
      quantity: 1,
      note: woodFinishLabel,
      swatchImage: woodFinishSwatch,
    },
    { id: "ps5-controller", image: "./assets/images/gifts/real/ps5-controller.jpg", title: "Controle de PS5", quantity: 2 },
    { id: "water-filter", image: "./assets/images/gifts/real/water-filter.jpg", title: "Filtro de água", quantity: 1 },
    { id: "notebook", image: "./assets/images/gifts/real/notebook.jpg", title: "Notebook", quantity: 1 },
    { id: "american-kitchen-chair", image: "./assets/images/gifts/real/american-kitchen-chair.jpg", title: "Cadeira de cozinha americana", quantity: 4 },
    {
      id: "bookshelf",
      image: "./assets/images/gifts/real/bookshelf.jpg",
      title: "Estante para livros",
      quantity: 1,
      note: woodFinishLabel,
      swatchImage: woodFinishSwatch,
    },
    {
      id: "tv-rack",
      image: "./assets/images/gifts/real/tv-rack.jpg",
      title: "Rack",
      quantity: 1,
      note: woodFinishLabel,
      swatchImage: woodFinishSwatch,
    },
    { id: "chandelier", image: "./assets/images/gifts/real/chandelier.jpg", title: "Lustre", quantity: 1 },
    {
      id: "tv-panel",
      image: "./assets/images/gifts/real/tv-panel.jpg",
      title: "Painel de TV",
      quantity: 1,
      note: woodFinishLabel,
      swatchImage: woodFinishSwatch,
    },
  ];

  const reservationState = {
    selectedGift: null,
    reservations: [],
  };

  const purchaseState = {
    selectedGiftTitle: "",
    selectedGiftPrice: "",
    selectedGiftAmount: "",
  };

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function showGiftToast(message) {
    if (!giftToast) return;

    giftToast.textContent = message;
    giftToast.hidden = false;
    giftToast.classList.add("gift-toast--visible");

    window.clearTimeout(showGiftToast.timeoutId);
    showGiftToast.timeoutId = window.setTimeout(() => {
      giftToast.classList.remove("gift-toast--visible");
      window.setTimeout(() => {
        giftToast.hidden = true;
      }, 220);
    }, 2600);
  }

  function getReservedCount(giftId) {
    return reservationState.reservations.filter((item) => item.giftId === giftId).length;
  }

  function getActiveGiftsPanel() {
    return giftsViewState.currentView === "purchase" ? purchasePanel : reservationPanel;
  }

  function resizeGiftsStage(immediate = false) {
    if (!giftsStage) return;

    const activePanel = getActiveGiftsPanel();

    if (!activePanel) return;

    const nextHeight = activePanel.scrollHeight;

    if (immediate) {
      giftsStage.style.height = `${nextHeight}px`;
      return;
    }

    requestAnimationFrame(() => {
      giftsStage.style.height = `${nextHeight}px`;
    });
  }

  function syncGiftsView(nextView, immediate = false) {
    if (!purchasePanel || !reservationPanel || !giftsSwitcher || !giftsStage) return;

    giftsViewState.currentView = nextView;

    const isPurchase = nextView === "purchase";

    purchasePanel.classList.toggle("gifts-panel--active", isPurchase);
    reservationPanel.classList.toggle("gifts-panel--active", !isPurchase);
    purchasePanel.setAttribute("aria-hidden", String(!isPurchase));
    reservationPanel.setAttribute("aria-hidden", String(isPurchase));

    giftsSwitcher.querySelectorAll("[data-gifts-view]").forEach((button) => {
      const isActive = button.getAttribute("data-gifts-view") === nextView;
      button.classList.toggle("gifts-switcher__button--active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    resizeGiftsStage(immediate);
  }

  function renderPurchaseGifts() {
    purchaseGrid.innerHTML = purchaseGifts
      .map(
        (gift) => `
          <article class="gift-card">
            <div class="gift-card__media">
              <span class="gift-card__emoji ${gift.emojiClass || ""}" aria-hidden="true">${gift.emoji}</span>
            </div>
            <div class="gift-card__body">
              <p class="gift-card__title">${escapeHtml(gift.title)}</p>
              <p class="gift-card__price">${gift.price}</p>
              <button class="ghost-button ghost-button--solid gift-card__button" type="button" data-purchase-title="${escapeHtml(gift.title)}" data-purchase-id="${gift.id}">
                Comprar
              </button>
            </div>
          </article>
        `,
      )
      .join("");

    if (giftsViewState.currentView === "purchase") {
      resizeGiftsStage(true);
    }
  }

  function renderReservationGifts() {
    const availableGifts = reservationGifts.filter((gift) => gift.quantity - getReservedCount(gift.id) > 0);

    if (!availableGifts.length) {
      reservationGrid.innerHTML = `
        <div class="gift-card gift-card--empty">
          <div class="gift-card__body">
            <p class="gift-card__title">Todos os presentes dessa lista já foram escolhidos. Obrigado pelo carinho com a nossa casa!</p>
          </div>
        </div>
      `;
      if (giftsViewState.currentView === "reservation") {
        resizeGiftsStage(true);
      }
      return;
    }

    reservationGrid.innerHTML = availableGifts
      .map((gift) => {
        const remaining = gift.quantity - getReservedCount(gift.id);
        const availabilityText = remaining > 1 ? `${remaining} disponiveis` : "Ultima unidade";

        return `
          <article class="gift-card gift-card--reservation">
            <div class="gift-card__media">
              <img class="gift-card__photo" src="${gift.image}" alt="" loading="lazy" decoding="async" />
              ${
                gift.swatchImage
                  ? `
                <div class="gift-card__swatch" aria-hidden="true">
                  <img class="gift-card__swatch-image" src="${gift.swatchImage}" alt="" loading="lazy" decoding="async" />
                  <span class="gift-card__swatch-label">Fresno Aveiro</span>
                </div>
              `
                  : ""
              }
            </div>
            <div class="gift-card__body">
              <span class="gift-card__badge">${availabilityText}</span>
              <p class="gift-card__title">${escapeHtml(gift.title)}</p>
              ${gift.note ? `<p class="gift-card__note">${escapeHtml(gift.note)}</p>` : ""}
              <button class="ghost-button gift-card__button gift-card__button--reserve" type="button" data-reserve-id="${gift.id}">
                Eu quero dar esse
              </button>
            </div>
          </article>
        `;
      })
      .join("");

    if (giftsViewState.currentView === "reservation") {
      resizeGiftsStage(true);
    }
  }

  async function loadReservations() {
    try {
      const response = await fetch("/api/gift-reservations");

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      reservationState.reservations = data.reservations ?? [];
      renderReservationGifts();
    } catch (error) {
      console.error("Nao foi possivel carregar as reservas de presentes.", error);
      reservationGrid.innerHTML = `
        <div class="gift-card gift-card--empty">
          <div class="gift-card__body">
            <p class="gift-card__title">Nao foi possivel carregar os presentes para reserva agora.</p>
          </div>
        </div>
      `;
    }
  }

  function openGiftModal(giftId) {
    const selectedGift = reservationGifts.find((gift) => gift.id === giftId);

    if (!selectedGift || !giftModal || !giftModalTitle || !giftModalCopy || !giftReservationForm) return;

    reservationState.selectedGift = selectedGift;
    giftModalTitle.textContent = selectedGift.title;
    giftModalCopy.textContent = `Se quiser presentear com ${selectedGift.title.toLowerCase()}, deixa seu nome aqui e a gente considera esse item reservado para você.`;
    giftModalFeedback.textContent = "";
    giftReservationForm.reset();
    giftModal.hidden = false;
    document.body.classList.add("modal-open");
    window.setTimeout(() => {
      giftModal.classList.add("gift-modal--visible");
      giftReserverName?.focus();
    }, 10);
  }

  function closeGiftModal() {
    if (!giftModal) return;

    giftModal.classList.remove("gift-modal--visible");
    document.body.classList.remove("modal-open");
    window.setTimeout(() => {
      giftModal.hidden = true;
    }, 220);
  }

  function openCustomPurchaseModal() {
    if (!customPurchaseModal || !customPurchaseForm || !customPurchaseFeedback) return;

    customPurchaseForm.reset();
    customPurchaseFeedback.textContent = "";
    customPurchaseModal.hidden = false;
    document.body.classList.add("modal-open");
    window.setTimeout(() => {
      customPurchaseModal.classList.add("gift-modal--visible");
      customPurchaseName?.focus();
    }, 10);
  }

  function closeCustomPurchaseModal() {
    if (!customPurchaseModal) return;

    customPurchaseModal.classList.remove("gift-modal--visible");
    document.body.classList.remove("modal-open");
    window.setTimeout(() => {
      customPurchaseModal.hidden = true;
    }, 220);
  }

  function openPurchaseCheckoutModal(giftTitle, priceLabel = "", rawAmount = priceLabel) {
    if (!purchaseCheckoutModal || !purchaseCheckoutForm || !purchaseCheckoutCopy || !purchaseCheckoutFeedback) return;

    purchaseState.selectedGiftTitle = giftTitle;
    purchaseState.selectedGiftPrice = priceLabel;
    purchaseState.selectedGiftAmount = rawAmount;
    purchaseCheckoutForm.reset();
    purchaseCheckoutFeedback.textContent = "";

    const details = priceLabel ? `${giftTitle} por ${priceLabel}` : giftTitle;
    purchaseCheckoutCopy.textContent = `Preencha seus dados para concluir ${details} com Mercado Pago.`;

    purchaseCheckoutModal.hidden = false;
    document.body.classList.add("modal-open");
    window.setTimeout(() => {
      purchaseCheckoutModal.classList.add("gift-modal--visible");
      purchaseFirstName?.focus();
    }, 10);
  }

  function closePurchaseCheckoutModal() {
    if (!purchaseCheckoutModal) return;

    purchaseCheckoutModal.classList.remove("gift-modal--visible");
    document.body.classList.remove("modal-open");
    window.setTimeout(() => {
      purchaseCheckoutModal.hidden = true;
    }, 220);
  }

  function parseCurrencyValue(rawValue) {
    const normalized = String(rawValue || "")
      .trim()
      .replaceAll(/\s+/g, "")
      .replace(/^R\$\s*/i, "")
      .replaceAll(".", "")
      .replace(",", ".");

    const amount = Number(normalized);

    return Number.isFinite(amount) ? amount : NaN;
  }

  function formatCurrencyValue(amount) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount);
  }

  async function submitPurchaseCheckout(event) {
    event.preventDefault();

    if (!purchaseCheckoutForm || !purchaseCheckoutFeedback) return;

    const formData = new FormData(purchaseCheckoutForm);
    const firstName = String(formData.get("firstName") || "").trim();
    const lastName = String(formData.get("lastName") || "").trim();
    const phone = String(formData.get("phone") || "").trim();

    if (!firstName) {
      purchaseCheckoutFeedback.textContent = "Preenche seu nome para continuar.";
      return;
    }

    if (!lastName) {
      purchaseCheckoutFeedback.textContent = "Preenche seu sobrenome para continuar.";
      return;
    }

    if (!phone) {
      purchaseCheckoutFeedback.textContent = "Coloca seu número de telefone.";
      return;
    }

    try {
      purchaseCheckoutFeedback.textContent = "Redirecionando para o Mercado Pago...";

      const response = await fetch("/api/purchase-mercado-pago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          giftTitle: purchaseState.selectedGiftTitle,
          priceLabel: purchaseState.selectedGiftPrice,
          amount: purchaseState.selectedGiftAmount,
          firstName,
          lastName,
          phone,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(data.details || data.error || `HTTP ${response.status}`);
      }

      window.location.href = data.url;
    } catch (error) {
      console.error("Nao foi possivel iniciar o checkout do Mercado Pago.", error);
      const message = error instanceof Error ? error.message : "Nao foi possivel iniciar o pagamento agora.";
      purchaseCheckoutFeedback.textContent = message;
    }
  }

  function submitCustomPurchase(event) {
    event.preventDefault();

    if (!customPurchaseForm || !customPurchaseFeedback || !customPurchaseName || !customPurchaseValue) return;

    const formData = new FormData(customPurchaseForm);
    const giftTitle = String(formData.get("title") || "").trim();
    const rawAmount = String(formData.get("amount") || "").trim();
    const amount = parseCurrencyValue(rawAmount);

    if (!giftTitle) {
      customPurchaseFeedback.textContent = "Escreve o nome do presente para continuar.";
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      customPurchaseFeedback.textContent = "Coloca um valor valido, por exemplo 250,00.";
      return;
    }

    const formattedAmount = formatCurrencyValue(amount);
    closeCustomPurchaseModal();
    purchaseState.selectedGiftAmount = formattedAmount;
    openPurchaseCheckoutModal(giftTitle, formattedAmount, String(amount).replace(".", ","));
  }

  async function submitGiftReservation(event) {
    event.preventDefault();

    if (!reservationState.selectedGift || !giftReservationForm || !giftModalFeedback) return;

    const formData = new FormData(giftReservationForm);
    const payload = {
      giftId: reservationState.selectedGift.id,
      name: String(formData.get("name") || "").trim(),
      contact: String(formData.get("contact") || "").trim(),
    };

    if (!payload.name) {
      giftModalFeedback.textContent = "Coloca seu nome para a gente saber quem ficou com esse presente.";
      return;
    }

    try {
      giftModalFeedback.textContent = "Reservando presente...";

      const response = await fetch("/api/gift-reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      reservationState.reservations = data.reservations ?? [];
      renderReservationGifts();
      closeGiftModal();
      showGiftToast("Presente reservado com sucesso.");
    } catch (error) {
      console.error("Nao foi possivel reservar o presente.", error);
      giftModalFeedback.textContent = "Nao foi possivel reservar esse presente agora.";
    }
  }

  purchaseGrid.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-purchase-title]");

    if (!trigger) return;

    const purchaseId = trigger.getAttribute("data-purchase-id");
    const giftTitle = trigger.getAttribute("data-purchase-title") || "esse presente";

    if (purchaseId === "custom-gift") {
      openCustomPurchaseModal();
      return;
    }

    const selectedGift = purchaseGifts.find((gift) => gift.id === purchaseId);
    openPurchaseCheckoutModal(giftTitle, selectedGift?.price || "");
  });

  reservationGrid.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-reserve-id]");

    if (!trigger) return;

    openGiftModal(trigger.getAttribute("data-reserve-id"));
  });

  giftsSwitcher?.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-gifts-view]");

    if (!trigger) return;

    const nextView = trigger.getAttribute("data-gifts-view");

    if (!nextView || nextView === giftsViewState.currentView) return;

    syncGiftsView(nextView, false);
  });

  giftModalClose?.addEventListener("click", closeGiftModal);
  giftReservationForm?.addEventListener("submit", submitGiftReservation);
  customPurchaseClose?.addEventListener("click", closeCustomPurchaseModal);
  customPurchaseForm?.addEventListener("submit", submitCustomPurchase);
  purchaseCheckoutClose?.addEventListener("click", closePurchaseCheckoutModal);
  purchaseCheckoutForm?.addEventListener("submit", submitPurchaseCheckout);
  customPurchaseValue?.addEventListener("blur", () => {
    const amount = parseCurrencyValue(customPurchaseValue.value);

    if (Number.isFinite(amount) && amount > 0) {
      customPurchaseValue.value = formatCurrencyValue(amount).replace("R$", "").trim();
    }
  });

  giftModal?.addEventListener("click", (event) => {
    const target = event.target;

    if (target instanceof HTMLElement && target.hasAttribute("data-close-modal")) {
      closeGiftModal();
    }
  });

  customPurchaseModal?.addEventListener("click", (event) => {
    const target = event.target;

    if (target instanceof HTMLElement && target.hasAttribute("data-close-custom-purchase")) {
      closeCustomPurchaseModal();
    }
  });

  purchaseCheckoutModal?.addEventListener("click", (event) => {
    const target = event.target;

    if (target instanceof HTMLElement && target.hasAttribute("data-close-purchase-checkout")) {
      closePurchaseCheckoutModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !giftModal?.hidden) {
      closeGiftModal();
    }

    if (event.key === "Escape" && !customPurchaseModal?.hidden) {
      closeCustomPurchaseModal();
    }

    if (event.key === "Escape" && !purchaseCheckoutModal?.hidden) {
      closePurchaseCheckoutModal();
    }
  });

  window.addEventListener("resize", () => {
    resizeGiftsStage(true);
  });

  renderPurchaseGifts();
  loadReservations();
  syncGiftsView("purchase", true);
}

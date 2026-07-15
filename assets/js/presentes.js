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
const purchaseLoadMore = document.querySelector("#purchase-load-more");
const reservationLoadMore = document.querySelector("#reservation-load-more");
const giftsAudioPlayer = document.querySelector("#gifts-audio-player");
const giftsAudioToggle = document.querySelector("#gifts-audio-toggle");
const giftsAudioVolume = document.querySelector("#gifts-audio-volume");

if (purchaseGrid && reservationGrid) {
  const MOBILE_GIFTS_BATCH_SIZE = 6;
  const giftsPlaylist = [
    { title: "Levitating", src: "./assets/audio/levitating.mp3" },
    { title: "24K Magic", src: "./assets/audio/24k-magic.mp3" },
    { title: "Trap Queen", src: "./assets/audio/trap-queen.mp3" },
    { title: "Don't Stop 'Til You Get Enough", src: "./assets/audio/dont-stop-til-you-get-enough.mp3" },
  ];

  const giftsViewState = {
    currentView: "purchase",
  };

  const audioState = {
    currentTrackIndex: 0,
    autoplayUnlocked: false,
  };

  const purchaseGifts = [
    {
      id: "gym-annual",
      image: "./assets/images/gifts/purchase/honeymoon-shape-gym-user.png",
      title: "Academia para os noivos entrarem no shape depois da lua de mel",
      price: "R$ 2.388,00",
    },
    {
      id: "helmet-against-rolling-pin",
      image: "./assets/images/gifts/purchase/helmet-against-rolling-pin-user.png",
      title: "Capacete contra rolo de macarrao",
      price: "R$ 129,90",
    },
    {
      id: "broken-couple-fund",
      image: "./assets/images/gifts/purchase/broken-couple-fund-user.png",
      title: "Vaquinha para ajudar os noivos quebrados",
      price: "R$ 250,00",
    },
    {
      id: "groom-massage-after-bill",
      image: "./assets/images/gifts/purchase/groom-massage-after-bill-user.png",
      title: "Massagem relaxante para o noivo depois de ver a conta do casamento",
      price: "R$ 199,90",
    },
    {
      id: "i-did-give-something",
      image: "./assets/images/gifts/purchase/i-did-give-something-real.jpg",
      title: "So para nao dizerem que eu nao dei nada",
      price: "R$ 50,00",
    },
    {
      id: "groom-cooking-course",
      image: "./assets/images/gifts/purchase/groom-cooking-course-user.png",
      title: "Curso de culinaria para o noivo",
      price: "R$ 179,90",
    },
    {
      id: "groom-forro-course",
      image: "./assets/images/gifts/purchase/groom-forro-course-user.png",
      title: "Curso de forro para o noivo",
      price: "R$ 159,90",
    },
    {
      id: "groom-games-collection",
      image: "./assets/images/gifts/purchase/groom-games-collection-user.png",
      title: "Colecao de jogos para diversao do noivo e tristeza da noiva",
      price: "R$ 349,90",
    },
    {
      id: "no-fight-controllers",
      image: "./assets/images/gifts/purchase/no-fight-controllers-user.png",
      title: "Conjunto de controles para nao dar briga",
      price: "R$ 429,90",
    },
    {
      id: "magic-mop",
      image: "./assets/images/gifts/purchase/magic-mop.jpg",
      title: "Acessório de última geração para cuidar da casa sem perder a pose",
      price: "R$ 128,26",
    },
    {
      id: "industrial-nail",
      image: "./assets/images/gifts/purchase/industrial-nail-user.png",
      title: "Acessório para cortar a unha do dedão do noivo com precisão industrial",
      price: "R$ 477,76",
    },
    {
      id: "fondue",
      image: "./assets/images/gifts/purchase/fondue.jpg",
      title: "Aparelho de fondue para noites românticas e fofocas bem servidas",
      price: "R$ 858,09",
    },
    {
      id: "plates",
      image: "./assets/images/gifts/purchase/plates.jpg",
      title: "Jogo de pratos chique para o casal fingir que janta assim todo dia",
      price: "R$ 312,40",
    },
    {
      id: "wine-cellar",
      image: "./assets/images/gifts/purchase/wine-cellar.jpg",
      title: "Adega para o casal organizar os vinhos e a vida em uma mesma prateleira",
      price: "R$ 649,90",
    },
    {
      id: "airfryer",
      image: "./assets/images/gifts/purchase/airfryer-user.png",
      title: "Air fryer oficial das visitas inesperadas e da batata frita de madrugada",
      price: "R$ 389,70",
    },
    {
      id: "robot-vacuum-fund",
      image: "./assets/images/gifts/purchase/robot-vacuum.jpg",
      title: "Robô aspirador para limpar o chão enquanto o casal ignora a bagunça",
      price: "R$ 1.199,00",
    },
    {
      id: "coffee",
      image: "./assets/images/gifts/purchase/coffee.jpg",
      title: "Cafeteira para manter o romance vivo antes de qualquer conversa séria",
      price: "R$ 284,55",
    },
    {
      id: "bed-linen",
      image: "./assets/images/gifts/purchase/bed-linen.jpg",
      title: "Jogo de cama premium para domingos de preguiça profissional",
      price: "R$ 459,80",
    },
    {
      id: "travel-help",
      image: "./assets/images/gifts/purchase/travel-help-beach.png",
      title: "Ajuda estratégica para a próxima viagem e para o casal sumir um pouco",
      price: "R$ 720,00",
    },
    {
      id: "market-basket",
      image: "./assets/images/gifts/purchase/market-basket.jpg",
      title: "Cesta de mercado para a despensa ficar cheia e o amor também",
      price: "R$ 215,35",
    },
    {
      id: "therapy-retreat",
      image: "./assets/images/gifts/purchase/therapy-retreat.jpg",
      title: "Retiro anti-DR premium para o casal respirar fundo e continuar se amando",
      price: "R$ 1.480,00",
    },
    {
      id: "snore-proof",
      image: "./assets/images/gifts/purchase/snore-proof-user.png",
      title: "Kit de sobrevivência para ronco matrimonial com tecnologia e paciência",
      price: "R$ 1.189,00",
    },
    {
      id: "luxury-massage",
      image: "./assets/images/gifts/purchase/luxury-massage-user.png",
      title: "Sessão deluxe de massagem para desestressar depois de escolher cortina",
      price: "R$ 1.320,00",
    },
    {
      id: "mega-ac",
      image: "./assets/images/gifts/purchase/mega-ac-user.png",
      title: "Ar-condicionado poderoso para esfriar o clima antes da primeira briguinha",
      price: "R$ 2.149,90",
    },
    {
      id: "bridal-rolling-pin",
      image: "./assets/images/gifts/purchase/bridal-rolling-pin-real.jpg",
      title: "Rolo de macarrao pra noiva utilizar quando necessario",
      price: "R$ 89,90",
    },
    {
      id: "bride-alarm",
      image: "./assets/images/gifts/purchase/bride-alarm-user.png",
      title: "Despertador da Noiva (Necessario)",
      price: "R$ 69,90",
    },
    {
      id: "bride-makeup",
      image: "./assets/images/gifts/purchase/bride-makeup-user.png",
      title: "Ajuda com a make da noiva",
      price: "R$ 579,90",
    },
    {
      id: "white-dress-pass",
      image: "./assets/images/gifts/purchase/white-dress-pass-user.png",
      title: "Vale ir de Branco pro casamento",
      price: "R$ 10.000,00",
    },
    {
      id: "buffet-first-pass",
      title: "Vale ser o primeiro do Buffet",
      price: "R$ 999,90",
      emoji: "🍽️",
    },
    {
      id: "plus-one-intruder",
      title: "Levar alguém que não foi convidado",
      price: "R$ 1.699,90",
      emoji: "🙈",
    },
    {
      id: "groom-hair-and-beard",
      title: "6 meses de cabelo e barba do noivo",
      price: "R$ 79,90",
      emoji: "💈",
    },
    {
      id: "custom-gift",
      image: "./assets/images/gifts/purchase/custom-gift-user.png",
      title: "Personalizado para quem quiser escolher nome e valor do presente",
      price: "Você define",
      isCustom: true,
    },
  ];

  const woodFinishLabel = "Acabamento sugerido";
  const woodFinishSwatch = "./assets/images/gifts/real/fresno-aveiro.png";
  const goldSwatch = "linear-gradient(135deg, #fff2b8 0%, #d6b14d 42%, #a97c1a 100%)";
  const stainlessSteelSwatch = "linear-gradient(135deg, #f4f4f4 0%, #d4d7db 48%, #9fa6ad 100%)";
  const blackStainlessSteelSwatch = "linear-gradient(135deg, #e7eaee 0%, #bac0c7 45%, #1f2023 46%, #111214 100%)";
  const whiteSwatch = "#f6f5f1";

  const reservationGifts = [
    { id: "air-conditioner", image: "./assets/images/gifts/real/air-conditioner.jpg", title: "Ar-condicionado", quantity: 1 },
    { id: "heater", image: "./assets/images/gifts/real/heater.jpg", title: "Aquecedor", quantity: 1 },
    {
      id: "stainless-steel-cookware",
      image: "./assets/images/gifts/real/stainless-steel-cookware.png",
      title: "Jogo de Panela de Inox",
      quantity: 1,
      note: "Cor sugerida",
      swatchStyle: stainlessSteelSwatch,
    },
    { id: "stone-cookware", image: "./assets/images/gifts/real/stone-cookware.png", title: "Jogo de Panela de Pedra", quantity: 1 },
    {
      id: "kitchen-cabinet",
      image: "./assets/images/gifts/real/kitchen-cabinet.jpg",
      title: "Armário de cozinha",
      quantity: 1,
      note: woodFinishLabel,
      swatchImage: woodFinishSwatch,
    },
    { id: "robot-vacuum", image: "./assets/images/gifts/real/robot-vacuum-user.png", title: "Robo Aspirador de Pó", quantity: 1 },
    { id: "storage-bed", image: "./assets/images/gifts/purchase/bed-linen.jpg", title: "Cama com Baú", quantity: 1 },
    { id: "glass-kitchen-table", image: "./assets/images/gifts/real/glass-kitchen-table.jpg", title: "Mesa de vidro da cozinha", quantity: 1 },
    { id: "television", image: "./assets/images/gifts/real/television.png", title: "Televisão", quantity: 1 },
    { id: "vacuum-cleaner", image: "./assets/images/gifts/real/vacuum-cleaner.jpg", title: "Aspirador de pó", quantity: 1 },
    { id: "washing-machine", image: "./assets/images/gifts/real/washing-machine.png", title: "Maquina de Lavar", quantity: 1 },
    { id: "range-hood", image: "./assets/images/gifts/real/range-hood.jpg", title: "Exaustor", quantity: 1 },
    { id: "electric-oven", image: "./assets/images/gifts/real/electric-oven.png", title: "Forno elétrico", quantity: 1 },
    { id: "rice-cooker", image: "./assets/images/gifts/real/rice-cooker.png", title: "Panela de Arroz Eletrica", quantity: 1 },
    { id: "alexa", image: "./assets/images/gifts/real/alexa.jpg", title: "Alexa", quantity: 1 },
    { id: "curtain", image: "./assets/images/gifts/real/curtain.jpg", title: "Cortina", quantity: 1 },
    { id: "coffee-maker", image: "./assets/images/gifts/real/coffee-maker.jpg", title: "Cafeteira", quantity: 1 },
    { id: "toaster", image: "./assets/images/gifts/real/toaster.png", title: "Torradeira Americana Inox/Preta", quantity: 1, note: "Cor sugerida", swatchStyle: blackStainlessSteelSwatch },
    { id: "blender", image: "./assets/images/gifts/real/blender.png", title: "Liquidificador Inox/Preto", quantity: 1, note: "Cor sugerida", swatchStyle: blackStainlessSteelSwatch },
    { id: "microwave", image: "./assets/images/gifts/real/microwave.png", title: "Microondas Inox", quantity: 1, note: "Cor sugerida", swatchStyle: stainlessSteelSwatch },
    { id: "mixer", image: "./assets/images/gifts/real/mixer.png", title: "Batedeira Inox/Preta", quantity: 1, note: "Cor sugerida", swatchStyle: blackStainlessSteelSwatch },
    { id: "orange-juicer", image: "./assets/images/gifts/real/orange-juicer.png", title: "Espremedor Eletrico de Laranja", quantity: 1 },
    { id: "gold-cutlery-set", image: "./assets/images/gifts/real/gold-cutlery-set.png", title: "Kit de Talheres em inox na cor dourada", quantity: 1, note: "Cor sugerida", swatchStyle: goldSwatch },
    { id: "glass-baking-dishes", image: "./assets/images/gifts/real/glass-baking-dishes.png", title: "Conjunto de Assadeiras de Vidro Temperado", quantity: 1 },
    { id: "porcelain-cups", image: "./assets/images/gifts/real/porcelain-cups.png", title: "Xícaras de Porcelana", quantity: 1 },
    { id: "electric-pressure-cooker", image: "./assets/images/gifts/real/electric-pressure-cooker.png", title: "Panela de Pressão Elétrica", quantity: 1 },
    { id: "ps5", image: "./assets/images/gifts/real/ps5.jpg", title: "PS5", quantity: 1 },
    { id: "drill", image: "./assets/images/gifts/real/drill.jpg", title: "Parafusadeira Bosch", quantity: 1 },
    { id: "shower", image: "./assets/images/gifts/real/shower.png", title: "Chuveiros", quantity: 1 },
    {
      id: "desk",
      image: "./assets/images/gifts/real/desk.jpg",
      title: "Escrivaninha",
      quantity: 1,
      note: woodFinishLabel,
      swatchImage: woodFinishSwatch,
    },
    { id: "ps5-controller", image: "./assets/images/gifts/real/ps5-controller.jpg", title: "Controle de PS5", quantity: 2 },
    { id: "water-filter", image: "./assets/images/gifts/real/water-filter.jpg", title: "Purificador de Água", quantity: 1 },
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
    { id: "wardrobe", image: "./assets/images/gifts/real/wardrobe.png", title: "Guarda Roupa", quantity: 1, note: "Cor sugerida", swatchColor: whiteSwatch },
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

  const paginationState = {
    purchaseVisibleCount: MOBILE_GIFTS_BATCH_SIZE,
    reservationVisibleCount: MOBILE_GIFTS_BATCH_SIZE,
    isMobile: window.innerWidth < 768,
  };

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function getGiftPlaceholder(title) {
    return String(title || "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase() || "")
      .join("");
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

  function loadPlaylistTrack(trackIndex) {
    if (!giftsAudioPlayer) return;

    audioState.currentTrackIndex = (trackIndex + giftsPlaylist.length) % giftsPlaylist.length;
    giftsAudioPlayer.src = giftsPlaylist[audioState.currentTrackIndex].src;
    giftsAudioPlayer.load();
  }

  function syncAudioToggle() {
    if (!giftsAudioToggle || !giftsAudioPlayer) return;

    const isPlaying = !giftsAudioPlayer.paused;
    giftsAudioToggle.textContent = isPlaying ? "Pause" : "Play";
    giftsAudioToggle.setAttribute("aria-pressed", String(isPlaying));
  }

  async function playPlaylistTrack(trackIndex = audioState.currentTrackIndex) {
    if (!giftsAudioPlayer) return;

    if (giftsAudioPlayer.src !== new URL(giftsPlaylist[trackIndex].src, window.location.href).href) {
      loadPlaylistTrack(trackIndex);
    }

    try {
      await giftsAudioPlayer.play();
      audioState.autoplayUnlocked = true;
      syncAudioToggle();
    } catch {
      audioState.autoplayUnlocked = false;
      syncAudioToggle();
    }
  }

  function pausePlaylist() {
    if (!giftsAudioPlayer) return;

    giftsAudioPlayer.pause();
    syncAudioToggle();
  }

  function playNextPlaylistTrack() {
    loadPlaylistTrack(audioState.currentTrackIndex + 1);
    playPlaylistTrack(audioState.currentTrackIndex);
  }

  function initPlaylist() {
    if (!giftsAudioPlayer) return;

    loadPlaylistTrack(0);
    giftsAudioPlayer.volume = Number(giftsAudioVolume?.value || 8) / 100;

    giftsAudioPlayer.addEventListener("ended", () => {
      playNextPlaylistTrack();
    });

    giftsAudioPlayer.addEventListener("play", syncAudioToggle);
    giftsAudioPlayer.addEventListener("pause", syncAudioToggle);

    giftsAudioVolume?.addEventListener("input", () => {
      if (!giftsAudioPlayer) return;
      giftsAudioPlayer.volume = Number(giftsAudioVolume.value || 0) / 100;
    });

    giftsAudioToggle?.addEventListener("click", async () => {
      if (!giftsAudioPlayer) return;

      if (giftsAudioPlayer.paused) {
        await playPlaylistTrack(audioState.currentTrackIndex);
        return;
      }

      pausePlaylist();
    });

    playPlaylistTrack(0);
    syncAudioToggle();

    const unlockAutoplay = async () => {
      if (audioState.autoplayUnlocked || !giftsAudioPlayer?.paused) return;
      await playPlaylistTrack(audioState.currentTrackIndex);
    };

    document.addEventListener("click", unlockAutoplay, { passive: true });
    document.addEventListener("touchstart", unlockAutoplay, { passive: true });
    document.addEventListener("keydown", unlockAutoplay, { passive: true });
  }

  function getActiveGiftsPanel() {
    return giftsViewState.currentView === "purchase" ? purchasePanel : reservationPanel;
  }

  function updateLoadMoreButton(button, hasMore) {
    if (!button) return;

    button.hidden = !paginationState.isMobile || !hasMore;
  }

  function getVisibleGifts(items, visibleCount) {
    if (!paginationState.isMobile) {
      return items;
    }

    return items.slice(0, visibleCount);
  }

  function resizeGiftsStage(immediate = false) {
    if (!giftsStage) return;

    if (!paginationState.isMobile) {
      giftsStage.style.height = "";
      return;
    }

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
    const visiblePurchaseGifts = getVisibleGifts(purchaseGifts, paginationState.purchaseVisibleCount);

    purchaseGrid.innerHTML = visiblePurchaseGifts
      .map(
        (gift) => `
          <article class="gift-card">
            <div class="gift-card__media">
              ${
                gift.image
                  ? `<img class="gift-card__photo" src="${gift.image}" alt="${escapeHtml(gift.title)}" loading="lazy" decoding="async" />`
                  : `<span class="gift-card__emoji ${gift.emojiClass || ""}" aria-hidden="true">${gift.emoji}</span>`
              }
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

    updateLoadMoreButton(purchaseLoadMore, visiblePurchaseGifts.length < purchaseGifts.length);

    if (giftsViewState.currentView === "purchase") {
      resizeGiftsStage(true);
    }
  }

  function renderReservationGifts() {
    const visibleReservationGifts = getVisibleGifts(reservationGifts, paginationState.reservationVisibleCount);

    reservationGrid.innerHTML = visibleReservationGifts
      .map((gift) => {
        const remaining = gift.quantity - getReservedCount(gift.id);
        const isSoldOut = remaining <= 0;
        const availabilityText = isSoldOut ? "Esgotado" : remaining > 1 ? `${remaining} disponiveis` : "1 unidade";

        return `
          <article class="gift-card gift-card--reservation">
            <div class="gift-card__media">
              ${
                gift.image
                  ? `<img class="gift-card__photo" src="${gift.image}" alt="" loading="lazy" decoding="async" />`
                  : `<span class="gift-card__placeholder" aria-hidden="true">${escapeHtml(getGiftPlaceholder(gift.title))}</span>`
              }
              ${
                gift.swatchImage || gift.swatchStyle || gift.swatchColor
                  ? `
                <div class="gift-card__swatch" aria-hidden="true">
                  ${
                    gift.swatchImage
                      ? `<img class="gift-card__swatch-image" src="${gift.swatchImage}" alt="" loading="lazy" decoding="async" />`
                      : `<span class="gift-card__swatch-chip" style="${
                          gift.swatchStyle ? `background: ${gift.swatchStyle};` : `background: ${gift.swatchColor};`
                        }"></span>`
                  }
                </div>
              `
                  : ""
              }
            </div>
            <div class="gift-card__body">
              <span class="gift-card__badge${isSoldOut ? " gift-card__badge--sold-out" : ""}">${availabilityText}</span>
              <p class="gift-card__title">${escapeHtml(gift.title)}</p>
              ${gift.note ? `<p class="gift-card__note">${escapeHtml(gift.note)}</p>` : ""}
              <button class="ghost-button gift-card__button gift-card__button--reserve" type="button" data-reserve-id="${gift.id}"${
                isSoldOut ? " disabled" : ""
              }>
                ${isSoldOut ? "Esgotado" : "Eu quero dar esse"}
              </button>
            </div>
          </article>
        `;
      })
      .join("");

    updateLoadMoreButton(reservationLoadMore, visibleReservationGifts.length < reservationGifts.length);

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
      updateLoadMoreButton(reservationLoadMore, false);
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
  purchaseLoadMore?.addEventListener("click", () => {
    paginationState.purchaseVisibleCount += MOBILE_GIFTS_BATCH_SIZE;
    renderPurchaseGifts();
  });
  reservationLoadMore?.addEventListener("click", () => {
    paginationState.reservationVisibleCount += MOBILE_GIFTS_BATCH_SIZE;
    renderReservationGifts();
  });
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
    const nextIsMobile = window.innerWidth < 768;

    if (nextIsMobile !== paginationState.isMobile) {
      paginationState.isMobile = nextIsMobile;
      paginationState.purchaseVisibleCount = MOBILE_GIFTS_BATCH_SIZE;
      paginationState.reservationVisibleCount = MOBILE_GIFTS_BATCH_SIZE;
      renderPurchaseGifts();
      renderReservationGifts();
    }

    resizeGiftsStage(true);
  });

  initPlaylist();
  renderPurchaseGifts();
  loadReservations();
  syncGiftsView("purchase", true);
}

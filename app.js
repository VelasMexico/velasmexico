// State Application
var app = {
  cart: [],
  products: [],
  
  init() {
    this.setupNavigation();
    this.setupScrollEffects();
    this.setupFilters();
    this.loadCatalog();
    this.setupCart();
    this.setupEasterEgg();
    this.setupForm();
    this.setupCheckout();

    // Check if we just returned from a successful Mercado Pago payment
    this.handlePostPaymentSuccess();
  },

  handlePostPaymentSuccess() {
    const params = new URLSearchParams(window.location.search);
    const mpStatus = params.get('status');
    const mpPaymentId = params.get('payment_id');
    const mpPreferenceId = params.get('preference_id');

    // Only process if it is a successful return from Mercado Pago
    // or if we have it in hash for backwards compatibility, but prioritizing URL params
    const isSuccess = mpStatus === 'approved' || window.location.hash.includes('success');
    
    const pendingOrder = localStorage.getItem('pendingOrder');
    
    if (isSuccess && pendingOrder) {
      const fd = new FormData();
      const orderData = JSON.parse(pendingOrder);
      
      // Fill the FormData with customer and order data
      for (const key in orderData) { fd.append(key, orderData[key]); }

      // Append the Mercado Pago proof of payment
      if (mpPaymentId) {
        fd.append('MP_ID_PAGO', mpPaymentId);
        fd.append('MP_STATUS', mpStatus);
        fd.append('MP_PREFERENCE', mpPreferenceId);
        fd.set('_subject', `💰 PAGO CONFIRMADO - ${orderData['nombre'] || 'Cliente'} - Velas México`);
      }

      fetch("https://formspree.io/f/xreorpje", {
        method: "POST",
        body: fd,
        headers: { 'Accept': 'application/json' }
      }).then(() => {
        localStorage.removeItem('pendingOrder');
        this.cart = [];
        this.updateCartUI();
        
        // Show the premium success modal
        const mpModal = document.getElementById('mp-success-modal');
        if (mpModal) { mpModal.classList.add('active'); document.body.style.overflow = 'hidden'; }
        
        // Clean URL to avoid duplicate emails on refresh
        window.history.replaceState({}, document.title, window.location.pathname);
      });
    }
  },

  // === NAVIGATION ===
  setupNavigation() {
    const links = document.querySelectorAll('.nav-link');
    
    const menuToggle = document.getElementById('menu-toggle');
    const navLinksContainer = document.querySelector('.nav-links');
    
    if(menuToggle && navLinksContainer) {
      menuToggle.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        navLinksContainer.classList.toggle('active');
      };
      
      document.addEventListener('click', (e) => {
        if (!menuToggle.contains(e.target) && !navLinksContainer.contains(e.target)) {
          navLinksContainer.classList.remove('active');
        }
      });
    }

    links.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        if(navLinksContainer) navLinksContainer.classList.remove('active');
        const target = link.getAttribute('href').replace('#', '');
        this.navigate(target);
      });
    });
    
    const hash = window.location.hash.replace('#', '') || 'home';
    this.navigate(hash);
  },

  navigate(pageId) {
    if(!document.getElementById(pageId)) return;
    window.location.hash = pageId;

    document.querySelectorAll('.page').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

    const targetSection = document.getElementById(pageId);
    targetSection.classList.add('active');
    
    const navLink = document.querySelector(`.nav-link[href="#${pageId}"]`);
    if(navLink) navLink.classList.add('active');

    window.scrollTo(0, 0);

    // CONTROL DEL CHATBOT DE VOZ/IA
    const vfWidget = document.getElementById('voiceflow-chat-frame') || document.querySelector('.vf-widget-container'); 
    // Nota: Voiceflow a veces inyecta su propio contenedor con una clase distinta.
    if(pageId === 'easteregg') {
      const scene = document.getElementById('interactive-scene');
      const glow = document.querySelector('.cursor-glow');
      glow.style.opacity = '1';

      // LUZ SIGUE AL CURSOR CON PRECISIÓN
      this._mouseMoveHandler = (e) => {
        const rect = scene.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        glow.style.setProperty('--mouse-x', `${x}%`);
        glow.style.setProperty('--mouse-y', `${y}%`);
      };

      scene.addEventListener('mousemove', this._mouseMoveHandler);

      // IR A REGALOS AL PICAR EL BOTÓN TRANSPARENTE
      document.querySelector('.secret-candle-trigger').onclick = (e) => {
        const rect = scene.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        glow.style.setProperty('--mouse-x', `${x}%`);
        glow.style.setProperty('--mouse-y', `${y}%`);
        setTimeout(() => this.navigate('regalos'), 400); // Un pequeño delay para que vea la luz ahí
      };

      if(window.voiceflow && window.voiceflow.chat && typeof window.voiceflow.chat.hide === 'function') {
         window.voiceflow.chat.hide(); 
      }
    } else {
      const scene = document.getElementById('interactive-scene');
      if (this._mouseMoveHandler && scene) {
          scene.removeEventListener('mousemove', this._mouseMoveHandler);
      }
      document.querySelector('.cursor-glow').style.opacity = '0';
      // MOSTRAR CHATBOT
      if(window.voiceflow && window.voiceflow.chat && typeof window.voiceflow.chat.show === 'function') {
         window.voiceflow.chat.show();
      }
    }

    if(pageId === 'regalos') {
      this.renderCoupons();
    }
  },

  setupScrollEffects() {
    const observerOptions = { threshold: 0.1 };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    document.querySelectorAll('.appear-scroll').forEach(el => observer.observe(el));

    window.addEventListener('scroll', () => {
      const nav = document.getElementById('navbar');
      const currentScroll = window.pageYOffset;
      
      if (currentScroll <= 0) {
        nav.classList.remove('scroll-up');
        nav.style.background = 'transparent';
        return;
      }
      
      if (currentScroll > lastScroll && !nav.classList.contains('scroll-down')) {
        // scroll down
        nav.classList.remove('scroll-up');
        nav.classList.add('scroll-down');
      } else if (currentScroll < lastScroll && nav.classList.contains('scroll-down')) {
        // scroll up
        nav.classList.remove('scroll-down');
        nav.classList.add('scroll-up');
        nav.style.background = 'rgba(26, 30, 36, 0.95)';
      }
      lastScroll = currentScroll;
    });
    let lastScroll = 0;
  },

  async loadCatalog() {
    try {
      this.products = [
        // CIRIOS (LISTA COMPLETA 19 VARIANTES)
        { id: 1, name: "Cirio Clásico", price: 35, size: "5x7 cm", img: "catalogo_nuevo/cirios/5x7 cm $35 c:u.jpg", desc: "Cirio tradicional artesanal.", materials: ["Cera de soja"] },
        { id: 2, name: "Cirio Clásico", price: 75, size: "5x15 cm", img: "catalogo_nuevo/cirios/5x15 cm $75 c:u.jpg", desc: "Cirio elegante esbelto.", materials: ["Cera de soja"] },
        { id: 3, name: "Cirio Clásico", price: 105, size: "5x20 cm", img: "catalogo_nuevo/cirios/5x20 cm $105 c:u.jpg", desc: "Cirio de gran altura.", materials: ["Cera de soja"] },
        { id: 4, name: "Cirio Clásico", price: 85, size: "8x8 cm", img: "catalogo_nuevo/cirios/8x8 cm $85 c:u.jpg", desc: "Cirio mastuerzo 8x8.", materials: ["Cera de soja"] },
        { id: 5, name: "Cirio Clásico", price: 170, size: "8x15 cm", img: "catalogo_nuevo/cirios/8x15 cm $170 c:u.jpg", desc: "Cirio alto 8x15.", materials: ["Cera de soja"] },
        { id: 6, name: "Cirio Clásico", price: 125, size: "7.5x10 cm", img: "catalogo_nuevo/cirios/7.5x10 cm $125 c:u.jpg", desc: "Cirio 7.5x10.", materials: ["Cera de soja"] },
        { id: 7, name: "Cirio Clásico", price: 185, size: "7.5x15 cm", img: "catalogo_nuevo/cirios/7.5x15 cm $185 c:u.jpg", desc: "Cirio elegante 7.5x15.", materials: ["Cera de soja"] },
        { id: 8, name: "Cirio Clásico", price: 210, size: "7.5x20 cm", img: "catalogo_nuevo/cirios/7.5x20 cm $210 c:u.jpg", desc: "Cirio 7.5x20.", materials: ["Cera de soja"] },
        { id: 9, name: "Cirio Clásico", price: 370, size: "7.5x30 cm", img: "catalogo_nuevo/cirios/7.5x30 cm $370 c:u.jpg", desc: "Cirio alto 7.5x30.", materials: ["Cera de soja"] },
        { id: 10, name: "Cirio Clásico", price: 420, size: "7.5x40 cm", img: "catalogo_nuevo/cirios/7.5x40 cm $420 c:u.jpg", desc: "Cirio monumental 7.5x40.", materials: ["Cera de soja"] },
        { id: 11, name: "Cirio Clásico", price: 145, size: "10x10 cm", img: "catalogo_nuevo/cirios/10x10 cm $145 c:u.jpg", desc: "Cirio base 10x10.", materials: ["Cera de soja"] },
        { id: 12, name: "Cirio Clásico", price: 215, size: "10x15 cm", img: "catalogo_nuevo/cirios/10x15 cm $215 c:u.jpg", desc: "Cirio 10x15.", materials: ["Cera de soja"] },
        { id: 13, name: "Cirio Clásico", price: 290, size: "10x20 cm", img: "catalogo_nuevo/cirios/10x20 cm $290 c:u.jpg", desc: "Cirio 10x20.", materials: ["Cera de soja"] },
        { id: 14, name: "Cirio Clásico", price: 360, size: "10x25 cm", img: "catalogo_nuevo/cirios/10x25 cm $360 c:u.jpg", desc: "Cirio 10x25.", materials: ["Cera de soja"] },
        { id: 15, name: "Cirio Clásico", price: 430, size: "10x30 cm", img: "catalogo_nuevo/cirios/10x30 cm $430 c:u.jpg", desc: "Cirio 10x30.", materials: ["Cera de soja"] },
        { id: 16, name: "Cirio Clásico", price: 570, size: "10x40 cm", img: "catalogo_nuevo/cirios/10x40 cm $570 c:u.jpg", desc: "Cirio 10x40 monumental.", materials: ["Cera de soja"] },
        { id: 17, name: "Cirio Clásico", price: 230, size: "12x12 cm", img: "catalogo_nuevo/cirios/12x12 cm $230 c:u.jpg", desc: "Cirio 12x12.", materials: ["Cera de soja"] },
        { id: 18, name: "Cirio Clásico", price: 490, size: "15x15 cm", img: "catalogo_nuevo/cirios/15x15 cm $490 c:u.jpg", desc: "Cirio masivo 15x15.", materials: ["Cera de soja"] },
        { id: 19, name: "Cirio Clásico", price: 980, size: "15x30 cm", img: "catalogo_nuevo/cirios/15x30 cm $980 c:u.jpg", desc: "Nuestra pieza más grande.", materials: ["Cera de soja premium"] },
        
        // HONGOS
        { id: 20, name: "Vela Hongo Chico", price: 25, size: "5x4 cm", img: "catalogo_nuevo/vela hongo/hongo chico 5x4 cm $25 c:u.jpg", desc: "Encantadora pieza artesanal en forma de hongo.", materials: ["Cera de soja", "Pintado a mano"] },
        { id: 21, name: "Vela Hongo Mediano", price: 50, size: "8x6 cm", img: "catalogo_nuevo/vela hongo/hongo mediano 8x6 cm $50 c:u.jpg", desc: "Vela decorativa de hongo con gran detalle.", materials: ["Cera de soja", "Pintado a mano"] },
        { id: 22, name: "Vela Hongo Grande", price: 110, size: "10x11 cm", img: "catalogo_nuevo/vela hongo/hongo grande 10x11 cm $110 c:u.jpg", desc: "Pieza central de hongo artesanal.", materials: ["Cera de soja", "Pintado a mano"] },
        { id: 23, name: "Juego de Hongos (Set)", price: 240, size: "Set 5 pzas", img: "catalogo_nuevo/vela hongo/juego de hongos 1 grande 2 medianos y 2 chicos $240.jpg", desc: "Completo set de 5 piezas.", materials: ["Cera de soja", "Base decorativa"] },

        // FIGURAS
        { id: 30, name: "Vela Corazones Burbuja", price: 28, size: "5x5 cm", img: "catalogo_nuevo/vela corazones burbuja/aroma a elejir 5x5 cm $28 c:u.jpg", desc: "Combinación de romanticismo y modernidad.", materials: ["Cera de soja", "Aroma a elegir"] },
        { id: 31, name: "Vela Manzana Natural", price: 65, size: "6x8 cm", img: "assets/images/manzana_fix.jpg", desc: "Hiperrealismo frutal con aroma a canela.", materials: ["Cera de soja", "Aroma Canela"] },
        { id: 32, name: "Vela Granada Roja", price: 50, size: "6x7.5 cm", img: "assets/images/granada_fix.jpg", desc: "Diseño único inspirado en la granada natural.", materials: ["Cera de soja", "Pigmentos naturales"] },
        { id: 33, name: "Vela Cubo de Canica", price: 50, size: "7x7 cm", img: "catalogo_nuevo/vela cubos de canica azul, amarillo, rojo, rosa, blanco, aroma a elegir/7x7 cm $50 c:u.jpg", desc: "Efecto marmoleado artístico.", materials: ["Cera de soja", "Efecto Canica"] },
        { id: 34, name: "Vela Esferas Dragon", price: 30, size: "4x4 cm", img: "catalogo_nuevo/vela de esferas del dragon/aroma a elegir 4x4 cm $30 c:u.jpg", desc: "Pieza única para coleccionistas.", materials: ["Cera de soja", "Diseño fan"] },
        { id: 35, name: "Vela Mano de Fatima", price: 40, size: "8.5x7x2 cm", img: "catalogo_nuevo/vela mano de fatima color a elegir/aroma a elegir 8.5x7x2 cm $40 c:u.jpg", desc: "Símbolo de protección con finos detalles.", materials: ["Cera de soja", "Relieve místico"] },
        { id: 36, name: "Vela Pirámide", price: 45, size: "7x7 cm", img: "catalogo_nuevo/vela piramide color a elegir/aroma a elegir 7x7 cm $45 c:u.jpg", desc: "Geometría sagrada para armonizar.", materials: ["Cera de soja", "Aroma a elegir"] },
        { id: 37, name: "Vela Jardin Cactus", price: 65, size: "10x4 cm", img: "catalogo_nuevo/vela jardin de cactus maceta de color a elegir/aroma a elegir 10x4 cm $65 c:u.jpg", desc: "Pequeño ecosistema en cera.", materials: ["Cera de soja", "Maceta decorativa"] },

        // PANTALLAS
        { id: 50, name: "Pantalla con Canela (M)", price: 140, size: "8x8 cm", img: "catalogo_nuevo/vela pantalla con canela y cactus/8x8 cm $140 c:u.jpg", desc: "Pantalla de cera con canela real.", materials: ["Cera de soja", "Canela Natural"] },
        { id: 51, name: "Pantalla con Canela (G)", price: 220, size: "10x10 cm", img: "catalogo_nuevo/vela pantalla con canela y cactus/10x10 cm $220 c:u.jpg", desc: "Decoración natural imponente.", materials: ["Cera de soja", "Canela"] },
        { id: 52, name: "Pantalla Flores", price: 125, size: "8x8 cm", img: "catalogo_nuevo/vela pantalla de flores con cactus/aroma a elegir 8x8 cm $125 c:u.jpg", desc: "Flores preservadas dentro de la cera.", materials: ["Cera de soja", "Flores Reales"] },
        { id: 53, name: "Pantalla Abundancia", price: 200, size: "10x10 cm", img: "catalogo_nuevo/vela pantalla de semillas de la abundancia cuadrada/aroma a elegir 10x10 cm $200 c:u.jpg", desc: "Para atraer prosperidad.", materials: ["Cera de soja", "Semillas"] },
        { id: 54, name: "Pantalla de Mostaza", price: 100, size: "8x8 cm", img: "catalogo_nuevo/vela pantalla con semillas de mostaza o de la abundancia/aroma a elegir 8x8 cm $100 c:u.jpg", desc: "Luz cálida filtrada por semillas.", materials: ["Cera de soja", "Semillas"] },
        { id: 56, name: "Pantalla de Abundancia", price: 240, size: "10x10 cm", img: "catalogo_nuevo/vela pantalla con semillas de mostaza o de la abundancia/aroma a elegir10x10 cm $240 c:u.jpg", desc: "Pantalla grande para atraer prosperidad.", materials: ["Cera de soja", "Semillas"] },
        { id: 55, name: "Alhajero de Abeja", price: 80, size: "7.5x5 cm", img: "catalogo_nuevo/vela alhajero de abeja aroma a miel/7.5x5 cm $80 c:u.jpg", desc: "Funcional y aromático.", materials: ["Cera de abeja natural", "Aroma miel"] }
      ];
      this.renderCatalog();
    } catch (e) {
      console.error("Error loading catalog", e);
    }
  },

  renderCatalog(productsToShow = null) {
    const grid = document.getElementById('product-grid');
    const products = productsToShow || this.products;
    grid.innerHTML = products.map(p => `
      <div class="product-card appear-scroll" onclick="app.openModal(${p.id})">
        <div class="product-img-wrapper">
          <img src="${p.img}" alt="${p.name}" class="product-img" loading="lazy">
        </div>
        <div class="product-info">
          <h3>${p.name}</h3>
          <div class="product-meta">
            <span class="product-size-tag">Medidas: ${p.size}</span>
            <p class="product-price">$${p.price.toFixed(2)} MXN</p>
          </div>
          <button class="add-to-cart-quick" onclick="event.stopPropagation(); app.addToCart(app.products.find(x=>x.id===${p.id}), 1)">Agregar +</button>
        </div>
      </div>
    `).join('');
  },

  setupFilters() {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const sortType = btn.dataset.sort;
        let sorted = [...this.products];
        if(sortType === 'name') sorted.sort((a,b) => a.name.localeCompare(b.name));
        else if(sortType === 'price') sorted.sort((a,b) => a.price - b.price);
        this.renderCatalog(sorted);
      });
    });
  },

  openModal(id) {
    const p = this.products.find(x => x.id === id);
    if(!p) return;
    document.getElementById('modal-img').src = p.img;
    document.getElementById('modal-title').textContent = p.name;
    document.getElementById('modal-price').textContent = `$${p.price.toFixed(2)} MXN`;
    document.getElementById('modal-size').querySelector('span').textContent = p.size;
    document.getElementById('modal-desc').textContent = p.desc;
    document.getElementById('modal-materials-list').innerHTML = `<li>Pabilos sin plomo</li><li>Fragancias de grado premium diseñadas para una combustión limpia y segura</li>`;
    const modal = document.getElementById('product-modal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    const qtyInput = document.getElementById('modal-qty');
    const priceDisplay = document.getElementById('modal-price');
    qtyInput.value = 1;
    qtyInput.oninput = () => priceDisplay.textContent = `$${(p.price * (qtyInput.value || 1)).toFixed(2)} MXN`;
    document.getElementById('modal-add-cart').onclick = () => { this.addToCart(p, parseInt(qtyInput.value)); this.closeModal(); };
    modal.querySelector('.modal-close').onclick = () => this.closeModal();
    modal.onclick = (e) => { if(e.target === modal) this.closeModal(); };
  },

  closeModal() { document.getElementById('product-modal').classList.remove('active'); document.body.style.overflow = 'auto'; },

  setupCart() {
    document.getElementById('cart-btn').onclick = () => this.toggleCart();
    document.getElementById('cart-close').onclick = () => this.toggleCart();
    document.getElementById('cart-drawer-overlay').onclick = () => this.toggleCart();
  },

  toggleCart() {
    document.getElementById('cart-drawer').classList.toggle('active');
    document.getElementById('cart-drawer-overlay').classList.toggle('active');
  },

  addToCart(product, qty = 1) {
    const existing = this.cart.find(item => item.id === product.id);
    if(existing) existing.qty += qty;
    else this.cart.push({...product, qty});
    this.updateCartUI();
    this.toggleCart();
  },

  removeFromCart(id) { this.cart = this.cart.filter(item => item.id !== id); this.updateCartUI(); },

  updateCartUI() {
    const container = document.getElementById('cart-items');
    const count = document.querySelector('.cart-count');
    const totalDisp = document.getElementById('cart-total-price');
    let total = 0; let itemsCount = 0;
    container.innerHTML = this.cart.map(item => {
      const itemTotal = item.price * item.qty;
      total += itemTotal; itemsCount += item.qty;
      return `<div class="cart-item">
          <img src="${item.img}" alt="${item.name}">
          <div class="cart-item-info">
            <div class="cart-item-title">${item.name} (x${item.qty})</div>
            <div class="cart-item-price">$${itemTotal.toFixed(2)} MXN</div>
            <div class="cart-item-aroma" style="font-size:0.75rem; color:var(--color-accent);">Aroma a elegir vía WhatsApp</div>
            <button class="cart-item-remove" onclick="app.removeFromCart(${item.id})">Quitar</button>
          </div>
        </div>`;
    }).join('');
    if(this.cart.length === 0) container.innerHTML = '<p style="text-align:center; color:#888; margin-top:2rem;">Tu canasta está vacía</p>';
    count.textContent = itemsCount;
    totalDisp.textContent = `$${total.toFixed(2)} MXN`;
    this.syncVoiceflow();
  },

  syncVoiceflow() {
    if (window.voiceflow && window.voiceflow.chat && typeof window.voiceflow.chat.setVariables === 'function') {
      const itemsList = this.cart.map(item => `${item.name} (${item.qty} pzas)`).join(', ');
      const totalAmount = this.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
      
      window.voiceflow.chat.setVariables({
        user_cart: itemsList || "Vacío",
        cart_total_value: totalAmount.toFixed(2),
        last_action: "Carrito Actualizado"
      });
      console.log("IA Sincronizada: ", itemsList);
    }
  },

  setupEasterEgg() {
    const scene = document.getElementById('interactive-scene');
    if(!scene) return;
    const glow = document.querySelector('.cursor-glow');
    scene.addEventListener('mousemove', (e) => {
      const rect = scene.getBoundingClientRect();
      glow.style.setProperty('--mouse-x', (e.clientX - rect.left) + 'px');
      glow.style.setProperty('--mouse-y', (e.clientY - rect.top) + 'px');
    });
    const trigger = document.querySelector('.secret-candle-trigger');
    trigger.addEventListener('click', () => { trigger.style.boxShadow = '0 0 100px 50px rgba(255, 200, 100, 0.8)'; setTimeout(() => this.navigate('regalos'), 800); });
  },

  renderCoupons() {
     document.getElementById('share-prompt').style.display = 'block';
     document.getElementById('unlocked-reward').style.display = 'none';
  },

  shareAndUnlock(platform) {
    const siteUrl = 'https://velasmexicoccc.com';
    const url = encodeURIComponent(siteUrl);
    const text = encodeURIComponent('¡Descubre las increíbles velas artesanales de Velas México Chema Corazón de Cera!');
    let shareUrl = '';
    switch(platform) {
      case 'twitter': shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}`; break;
      case 'facebook': shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`; break;
      case 'instagram': alert('¡Casi listo! Comparte el link https://velasmexicoccc.com en tus historias para desbloquear tu regalo.'); break;
      case 'tiktok': alert('¡Casi listo! Comparte el video de nuestras velas con el link https://velasmexicoccc.com para desbloquear tu regalo.'); break;
    }
    if(shareUrl) window.open(shareUrl, '_blank', 'width=600,height=400');
    document.getElementById('share-prompt').style.display = 'none';
    const reward = document.getElementById('unlocked-reward');
    reward.style.display = 'block';
    reward.style.opacity = 0;
    let op = 0; const timer = setInterval(() => { if(op >= 1) clearInterval(timer); reward.style.opacity = op; op += 0.1; }, 50);
  },

  setupForm() {
    document.getElementById('contact-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const form = e.target; const btn = form.querySelector('.submit-btn');
      const originalText = btn.textContent; btn.textContent = 'Enviando...'; btn.disabled = true;
      fetch("https://formspree.io/f/xreorpje", { method: "POST", body: new FormData(form), headers: { 'Accept': 'application/json' } })
      .then(response => {
          if(response.ok) { btn.textContent = '¡Enviado!'; btn.style.backgroundColor = '#25D366'; form.reset(); setTimeout(() => { btn.textContent = originalText; btn.style.backgroundColor = ''; btn.disabled = false; }, 4000); }
          else throw new Error('Error');
      }).catch(() => { btn.textContent = 'Error'; setTimeout(() => { btn.textContent = originalText; btn.disabled = false; }, 3000); });
    });
  },

  setupCheckout() {
    const checkoutForm = document.getElementById('checkout-form');
    if(checkoutForm) {
      checkoutForm.onsubmit = (e) => {
        e.preventDefault();
        this.processStripeCheckout();
      };
    }
  },

  openCheckout() {
    const drawer = document.getElementById('cart-drawer');
    if(drawer.classList.contains('active')) {
      this.toggleCart();
    }
    const checkoutModal = document.getElementById('checkout-modal');
    checkoutModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  },

  closeCheckout() {
    document.getElementById('checkout-modal').classList.remove('active');
    document.body.style.overflow = 'auto';
  },

  async processStripeCheckout() {
    const method = document.querySelector('input[name="payment-method"]:checked').value;
    const form = document.getElementById('checkout-form');
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;

    if(!form.checkValidity()) { form.reportValidity(); return; }

    submitBtn.textContent = 'Procesando...';
    submitBtn.disabled = true;

    const fd = new FormData(form);
    let totalAmount = 0;
    this.cart.forEach(item => totalAmount += (item.price * (item.qty || 1)));
    
    fd.append('_subject', `NUEVO PEDIDO (${method.toUpperCase()}) - Velas México`);
    fd.append('Total', `$${totalAmount.toFixed(2)} MXN`);
    
    let orderDetails = this.cart.map(i => `${i.name} (x${i.qty}) - $${(i.price*i.qty).toFixed(2)}`).join('\n');
    fd.append('Articulos', orderDetails);

    try {
      if(method === 'mercado-pago') {
        const payload = {
          items: this.cart.map(i => ({ name: i.name, price: i.price, qty: i.qty })),
          successUrl: window.location.origin + window.location.pathname + "#success",
          cancelUrl: window.location.origin + window.location.pathname + "#catalogo",
          customerEmail: document.getElementById('chk-email').value,
          customerName: document.getElementById('chk-name').value
        };

        // Prepare order data for deferred Formspree submission
        const orderData = {};
        fd.forEach((value, key) => orderData[key] = value);
        localStorage.setItem('pendingOrder', JSON.stringify(orderData));

        const mpRes = await fetch("/api/mercadopago-checkout", {
          method: "POST",
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" }
        });

        const mpData = await mpRes.json();
        if (mpData.url) {
          window.location.href = mpData.url;
          return;
        } else {
          throw new Error("No se pudo crear la preferencia de Mercado Pago");
        }
      } else {
        // Transferencia: NO enviar correo a Formspree (flujo manual solicitado por USER)
        // Construir mensaje de WhatsApp con todos los detalles del pedido
        const waName    = fd.get('nombre') || '';
        const waPhone   = fd.get('telefono') || '';
        const waAddress = `${fd.get('calle')}, ${fd.get('colonia')}, CP ${fd.get('cp')}, ${fd.get('ciudad')}, ${fd.get('estado')}`;
        const waItems   = this.cart.map(i => `• ${i.name} (x${i.qty || 1}) - $${(i.price*(i.qty||1)).toFixed(2)} MXN`).join('\n');
        
        const waMsg = encodeURIComponent(
          `🕯️ *NUEVO PEDIDO - VELAS MÉXICO*\n\n` +
          `*DATOS DEL CLIENTE:*\n` +
          `*Nombre:* ${waName}\n` +
          `*WhatsApp:* ${waPhone}\n\n` +
          `*🛒 ARTÍCULOS:*\n${waItems}\n\n` +
          `*💰 TOTAL A PAGAR: $${totalAmount.toFixed(2)} MXN*\n\n` +
          `*📍 DIRECCIÓN DE ENVÍO:*\n${waAddress}\n\n` +
          `*MÉTODO DE PAGO:* Transferencia / Depósito OXXO\n` +
          `*CLABE:* 728969000095104101\n\n` +
          `Adjunto mi comprobante de pago 📎`
        );
        
        const waBtn = document.getElementById('wa-transfer-btn');
        if (waBtn) waBtn.href = `https://wa.me/525631328337?text=${waMsg}`;

        document.getElementById('checkout-modal').classList.remove('active');
        document.getElementById('transfer-success-modal').classList.add('active');
        this.cart = [];
        this.updateCartUI();
        document.body.style.overflow = 'hidden';
      }
    } catch(err) {
      alert("Hubo un error al procesar tu pedido. Intenta de nuevo.");
      console.error(err);
    } finally {
      submitBtn.textContent = originalBtnText;
      submitBtn.disabled = false;
    }
  }
};
window.addEventListener('load', () => app.init());

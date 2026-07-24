// ============================================
// GREENLINE CLEANING CO. — INTERACTIONS
// ============================================

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Mobile nav ---------- */
  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');
  navToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', isOpen);
  });
  mainNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    mainNav.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  }));

  /* ---------- Scroll reveal ---------- */
  const revealEls = document.querySelectorAll('[data-reveal]');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    revealEls.forEach(el => el.classList.add('is-visible'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(el => io.observe(el));
  }

  /* ---------- Count-up stats ---------- */
  const counters = document.querySelectorAll('[data-count]');
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.count, 10);
      const duration = 1400;
      const start = performance.now();
      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target);
        if (progress < 1) requestAnimationFrame(tick);
      };
      if (prefersReduced) { el.textContent = target; } else { requestAnimationFrame(tick); }
      countIO.unobserve(el);
    });
  }, { threshold: 0.5 });
  counters.forEach(el => countIO.observe(el));

  /* ---------- Drag-to-reveal hero ---------- */
  const frame = document.getElementById('revealFrame');
  const clip = document.getElementById('revealClip');
  const handle = document.getElementById('revealHandle');

  const setReveal = (percent) => {
    const clamped = Math.min(95, Math.max(5, percent));
    clip.style.width = clamped + '%';
    handle.style.left = clamped + '%';
    // Keep the "after" image visually stable across the clip width
    const afterImg = clip.querySelector('.reveal-after');
    afterImg.style.width = (frame.offsetWidth) + 'px';
  };

  let dragging = false;

  const getPercentFromEvent = (clientX) => {
    const rect = frame.getBoundingClientRect();
    return ((clientX - rect.left) / rect.width) * 100;
  };

  const startDrag = () => { dragging = true; };
  const stopDrag = () => { dragging = false; };
  const onMove = (clientX) => {
    if (!dragging) return;
    setReveal(getPercentFromEvent(clientX));
  };

  handle.addEventListener('mousedown', startDrag);
  window.addEventListener('mouseup', stopDrag);
  window.addEventListener('mousemove', (e) => onMove(e.clientX));

  handle.addEventListener('touchstart', startDrag, { passive: true });
  window.addEventListener('touchend', stopDrag);
  window.addEventListener('touchmove', (e) => onMove(e.touches[0].clientX), { passive: true });

  // Also allow clicking/tapping anywhere on the frame to jump the divider
  frame.addEventListener('click', (e) => {
    if (e.target === handle || handle.contains(e.target)) return;
    setReveal(getPercentFromEvent(e.clientX));
  });

  window.addEventListener('resize', () => {
    const currentPercent = parseFloat(clip.style.width) || 55;
    setReveal(currentPercent);
  });
  setReveal(55);

  /* ---------- Quote calculator ---------- */
  const state = {
    property: { value: 'flat', base: 45 },
    rooms: 2,
    frequency: { value: 'onetime', mult: 1 },
    addons: [] // { name, price }
  };

  let currentStep = 1;
  const totalSteps = 3;

  const stepEls = document.querySelectorAll('.quote-step');
  const dotEls = document.querySelectorAll('[data-step-dot]');
  const prevBtn = document.getElementById('quotePrev');
  const nextBtn = document.getElementById('quoteNext');

  function goToStep(n) {
    currentStep = n;
    stepEls.forEach(el => el.classList.toggle('active', parseInt(el.dataset.step, 10) === n));
    dotEls.forEach(d => d.classList.toggle('active', parseInt(d.dataset.stepDot, 10) <= n));
    prevBtn.disabled = n === 1;
    nextBtn.textContent = n === totalSteps ? 'Done' : 'Continue';
  }

  prevBtn.addEventListener('click', () => { if (currentStep > 1) goToStep(currentStep - 1); });
  nextBtn.addEventListener('click', () => {
    if (currentStep < totalSteps) goToStep(currentStep + 1);
    else document.querySelector('.receipt-cta').scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  // Property type selection
  document.querySelectorAll('[data-group="property"] .option-card').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-group="property"] .option-card').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.property = { value: btn.dataset.value, base: parseFloat(btn.dataset.base) };
      updateReceipt();
    });
  });

  // Frequency selection
  document.querySelectorAll('[data-group="frequency"] .option-card').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-group="frequency"] .option-card').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.frequency = { value: btn.dataset.value, mult: parseFloat(btn.dataset.mult) };
      updateReceipt();
    });
  });

  // Rooms stepper
  const stepperValueEl = document.querySelector('[data-stepper-value]');
  document.querySelectorAll('.stepper-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const dir = parseInt(btn.dataset.dir, 10);
      state.rooms = Math.min(8, Math.max(1, state.rooms + dir));
      stepperValueEl.textContent = state.rooms;
      updateReceipt();
    });
  });

  // Add-ons
  document.querySelectorAll('[data-addon]').forEach(input => {
    input.addEventListener('change', () => {
      const row = input.closest('.addon-row');
      const name = row.querySelector('.addon-name').textContent;
      const price = parseFloat(input.dataset.addon);
      if (input.checked) {
        state.addons.push({ name, price });
      } else {
        state.addons = state.addons.filter(a => a.name !== name);
      }
      updateReceipt();
    });
  });

  const receiptTotalEl = document.getElementById('receiptTotal');
  const receiptCaptionEl = document.getElementById('receiptCaption');
  const receiptLinesEl = document.getElementById('receiptLines');

  const propertyLabels = { flat: 'Flat / Apartment', house: 'House', office: 'Office / Commercial' };
  const frequencyLabels = { onetime: 'One-time', fortnightly: 'Fortnightly', weekly: 'Weekly' };

  function updateReceipt() {
    const roomSurcharge = Math.max(0, state.rooms - 1) * 8;
    const baseWithRooms = state.property.base + roomSurcharge;
    const afterFrequency = baseWithRooms * state.frequency.mult;
    const addonsTotal = state.addons.reduce((sum, a) => sum + a.price, 0);
    const total = Math.round(afterFrequency + addonsTotal);

    receiptTotalEl.textContent = total;
    receiptTotalEl.parentElement.classList.remove('bump');
    void receiptTotalEl.parentElement.offsetWidth; // restart animation
    receiptTotalEl.parentElement.classList.add('bump');

    receiptCaptionEl.textContent = `${propertyLabels[state.property.value]} · ${state.rooms} room${state.rooms > 1 ? 's' : ''} · ${frequencyLabels[state.frequency.value]}`;

    let lines = `<li><span>Base rate (${propertyLabels[state.property.value]})</span><span>£${state.property.base}</span></li>`;
    if (roomSurcharge > 0) {
      lines += `<li><span>Extra rooms (${state.rooms - 1})</span><span>£${roomSurcharge}</span></li>`;
    }
    if (state.frequency.mult < 1) {
      const savings = Math.round(baseWithRooms - afterFrequency);
      lines += `<li><span>${frequencyLabels[state.frequency.value]} discount</span><span>−£${savings}</span></li>`;
    }
    state.addons.forEach(a => {
      lines += `<li><span>${a.name}</span><span>£${a.price}</span></li>`;
    });
    receiptLinesEl.innerHTML = lines;
  }

  goToStep(1);
  updateReceipt();

  /* ---------- Header shadow on scroll ---------- */
  const header = document.getElementById('siteHeader');
  window.addEventListener('scroll', () => {
    header.style.boxShadow = window.scrollY > 10 ? '0 2px 16px rgba(27,29,24,0.06)' : 'none';
  });

});

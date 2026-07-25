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

  /* ---------- Drag-to-reveal (works for every instance on the page) ---------- */
  function initReveal(frame) {
    const clip = frame.querySelector('.js-reveal-clip');
    const handle = frame.querySelector('.js-reveal-handle');
    if (!clip || !handle) return;

    const setReveal = (percent) => {
      const clamped = Math.min(95, Math.max(5, percent));
      clip.style.width = clamped + '%';
      handle.style.left = clamped + '%';
      const afterImg = clip.querySelector('.reveal-after');
      afterImg.style.width = frame.offsetWidth + 'px';
    };

    let dragging = false;
    const getPercentFromEvent = (clientX) => {
      const rect = frame.getBoundingClientRect();
      return ((clientX - rect.left) / rect.width) * 100;
    };
    const startDrag = () => { dragging = true; };
    const stopDrag = () => { dragging = false; };
    const onMove = (clientX) => { if (dragging) setReveal(getPercentFromEvent(clientX)); };

    handle.addEventListener('mousedown', startDrag);
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('mousemove', (e) => onMove(e.clientX));
    handle.addEventListener('touchstart', startDrag, { passive: true });
    window.addEventListener('touchend', stopDrag);
    window.addEventListener('touchmove', (e) => onMove(e.touches[0].clientX), { passive: true });

    frame.addEventListener('click', (e) => {
      if (e.target === handle || handle.contains(e.target)) return;
      setReveal(getPercentFromEvent(e.clientX));
    });

    window.addEventListener('resize', () => {
      const currentPercent = parseFloat(clip.style.width) || 50;
      setReveal(currentPercent);
    });

    setReveal(parseFloat(frame.dataset.startAt) || 50);

    // Auto-demo sweep: gives the hero visible motion on load instead of
    // sitting static until someone thinks to drag it. Runs once, then hands
    // control to the visitor. Skipped entirely if they prefer reduced motion.
    if (frame.hasAttribute('data-auto-demo') && !prefersReducedMotion) {
      let demoStart = null;
      const demoDuration = 2600;
      const from = parseFloat(frame.dataset.startAt) || 50;
      const peak = 78;

      const easeInOut = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      function demoTick(now) {
        if (dragging) return; // visitor took over, stop the auto-demo
        if (demoStart === null) demoStart = now;
        const elapsed = now - demoStart;
        const progress = Math.min(elapsed / demoDuration, 1);
        // Sweep out to `peak` and back to `from` in one smooth motion
        const wave = Math.sin(progress * Math.PI);
        const eased = easeInOut(wave);
        setReveal(from + (peak - from) * eased);
        if (progress < 1) {
          requestAnimationFrame(demoTick);
        } else {
          setReveal(from);
        }
      }
      // Small delay so it starts just after the hero has faded in
      setTimeout(() => requestAnimationFrame(demoTick), 700);

      // Stop the demo the instant a visitor interacts
      handle.addEventListener('mousedown', () => { demoStart = -Infinity; });
      handle.addEventListener('touchstart', () => { demoStart = -Infinity; }, { passive: true });
      frame.addEventListener('click', () => { demoStart = -Infinity; });
    }
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('.js-reveal-frame').forEach(initReveal);

  /* ---------- Quote calculator (only runs if the calculator exists on this page) ---------- */
  const prevBtn = document.getElementById('quotePrev');
  const nextBtn = document.getElementById('quoteNext');

  if (prevBtn && nextBtn) {
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

    /* ---------- Send quote to visitor's email ---------- */
    // No backend required: FormSubmit relays this straight to your inbox as an
    // email containing the visitor's address + their quote breakdown, so you
    // can reply with a formal confirmation. First submission after you swap in
    // your real address below will trigger a one-time confirmation email from
    // FormSubmit — click it once and every submission after that goes straight
    // through. Free, no account needed: https://formsubmit.co
    const QUOTE_INBOX = 'YOUR-BUSINESS-EMAIL@example.com';

    const quoteEmailForm = document.getElementById('quoteEmailForm');
    const quoteEmailStatus = document.getElementById('quoteEmailStatus');
    const sendQuoteBtn = document.getElementById('sendQuoteBtn');

    quoteEmailForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('quoteEmail');
      const email = emailInput.value.trim();
      if (!email) return;

      sendQuoteBtn.disabled = true;
      sendQuoteBtn.textContent = 'Sending...';
      quoteEmailStatus.textContent = '';

      const total = receiptTotalEl.textContent;
      const summaryLines = Array.from(receiptLinesEl.querySelectorAll('li'))
        .map(li => li.textContent.trim())
        .join('\n');

      const payload = {
        _subject: `New quote request — £${total}`,
        customer_email: email,
        quote_total: `£${total}`,
        quote_details: receiptCaptionEl.textContent,
        breakdown: summaryLines
      };

      try {
        const res = await fetch(`https://formsubmit.co/ajax/${QUOTE_INBOX}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Network response was not OK');
        quoteEmailStatus.textContent = `Sent! We'll email your quote to ${email} shortly.`;
        emailInput.value = '';
        sendQuoteBtn.textContent = 'Sent ✓';
      } catch (err) {
        // Fallback: open the visitor's own mail client with the quote pre-filled
        const body = encodeURIComponent(`Please send my quote to: ${email}\n\n${receiptCaptionEl.textContent}\nTotal: £${total}\n\n${summaryLines}`);
        window.location.href = `mailto:${QUOTE_INBOX}?subject=Quote Request&body=${body}`;
        quoteEmailStatus.textContent = 'Opening your email app to send this quote...';
        sendQuoteBtn.textContent = 'Send My Quote';
        sendQuoteBtn.disabled = false;
      }
    });
  }

  /* ---------- Header shadow on scroll ---------- */
  const header = document.getElementById('siteHeader');
  window.addEventListener('scroll', () => {
    header.style.boxShadow = window.scrollY > 10 ? '0 2px 16px rgba(27,29,24,0.06)' : 'none';
  });

});

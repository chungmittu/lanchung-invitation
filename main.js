'use strict';

// ==========================================
// 1. CÁC HÀM TIỆN ÍCH DÙNG CHUNG (HELPERS)
// ==========================================
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

// Hiển thị thông báo dạng Toast (nổi lên rồi tự ẩn)
const notify = message => {
  const toast = $('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
};

// Hàm sao chép đa nền tảng (Hoạt động 100% trên Zalo In-App WebView & Mobile Safari/Chrome)
async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('navigator.clipboard bị hạn chế, chuyển sang cơ chế fallback:', err);
    }
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '-9999px';
    textArea.style.opacity = '0';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    textArea.setSelectionRange(0, 99999);
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Không thể sao chép bằng execCommand:', err);
    return false;
  }
}

// ==========================================
// 2. MỞ PHONG BÌ THƯ HOÀNG GIA & CON DẤU SÁP L & C
// ==========================================
const openBtn = $('#open');
const coverElem = $('#cover');
const envelopeScene = $('#envelopeScene');

// Hiệu ứng pháo hoa bụi vàng & cánh hoa bùng nổ khi mở thiệp
function triggerOpeningBurst(originEl) {
  const canvas = document.getElementById('burstCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const rect = originEl.getBoundingClientRect();
  const originX = rect.left + rect.width / 2;
  const originY = rect.top + rect.height / 2;

  const particles = [];
  const count = window.innerWidth <= 768 ? 55 : 85;
  const colors = [
    '#f7d59b', '#e6bf70', '#d4a853', // Vàng gold
    '#e29590', '#c87670', '#f4c3be', // Cánh hoa hồng
    '#ffffff', '#fff5eb'            // Ánh sáng trắng
  ];

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 9;
    particles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.5,
      size: 4 + Math.random() * 7,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      decay: 0.012 + Math.random() * 0.015,
      gravity: 0.22,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.15,
      isFlowerPetal: Math.random() > 0.5
    });
  }

  function renderBurst() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (p.alpha <= 0) continue;
      alive = true;

      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.98;
      p.rotation += p.rotationSpeed;
      p.alpha -= p.decay;

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;

      if (p.isFlowerPetal) {
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 1.2, p.size * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.lineTo(p.size * 0.6, 0);
        ctx.lineTo(0, p.size);
        ctx.lineTo(-p.size * 0.6, 0);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    if (alive) {
      requestAnimationFrame(renderBurst);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  renderBurst();
}

// Hiệu ứng 3D Parallax Tilt khi di chuột trên màn hình bìa
if (envelopeScene && coverElem && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  coverElem.addEventListener('mousemove', e => {
    if (envelopeScene.classList.contains('is-open')) return;
    const rect = coverElem.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    envelopeScene.style.transform = `perspective(1200px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) translateY(-2px)`;
  });

  coverElem.addEventListener('mouseleave', () => {
    if (envelopeScene.classList.contains('is-open')) return;
    envelopeScene.style.transform = 'perspective(1200px) rotateY(0deg) rotateX(0deg)';
  });
}

if (openBtn && coverElem) {
  openBtn.onclick = () => {
    if (navigator.vibrate) {
      try { navigator.vibrate([20, 40, 20]); } catch (e) {}
    }

    // 1. Kích hoạt bùng nổ pháo hoa cánh hoa & bụi vàng
    triggerOpeningBurst(openBtn);

    // 2. Mở nắp phong bì và nhô lá thiệp mời lên
    if (envelopeScene) {
      envelopeScene.style.transform = 'none';
      envelopeScene.classList.add('is-open');
    }

    // 3. Bắt đầu phát nhạc nền
    startBackgroundMusic();

    // 4. Sau 1.35s cho khách thưởng thức khoảnh khắc mở thư, chuyển vào trang web chính
    setTimeout(() => {
      coverElem.classList.add('open');
      document.body.classList.remove('locked');

      setTimeout(() => {
        coverElem.remove();
      }, 900);
    }, 1350);
  };
}

// Bật/tắt menu trên mobile
if ($('#menu')) {
  $('#menu').onclick = event => {
    const isOpen = $('#nav').classList.toggle('open');
    event.currentTarget.setAttribute('aria-expanded', String(isOpen));
  };
}

// Click chọn menu sẽ tự đóng menu mobile lại
$$('nav a').forEach(link => {
  link.onclick = () => {
    $('#nav').classList.remove('open');
    $('#menu')?.setAttribute('aria-expanded', 'false');
  };
});

// Hiệu ứng cuộn trang hiện dần (Scroll Reveal)
const observer = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.08 }
);

$$('.reveal').forEach(element => observer.observe(element));

// ==========================================
// 3. BỘ ĐẾM NGƯỢC THỜI GIAN (COUNTDOWN)
// ==========================================
const targetTime = new Date('2026-12-12T10:30:00+07:00').getTime();

function updateCountdown() {
  const now = Date.now();
  const timeLeft = targetTime - now;

  if (timeLeft <= 0) {
    ['days', 'hours', 'mins', 'secs'].forEach(id => {
      const element = $('#' + id);
      if (element) element.textContent = '00';
    });

    const message = $('#countMsg');
    if (message) message.textContent = 'Ngày hạnh phúc đã đến!';
    return;
  }

  const days = $('#days');
  const hours = $('#hours');
  const minutes = $('#mins');
  const seconds = $('#secs');

  if (days) days.textContent = String(Math.floor(timeLeft / 864e5));
  if (hours) {
    hours.textContent = String(Math.floor((timeLeft % 864e5) / 36e5)).padStart(2, '0');
  }
  if (minutes) {
    minutes.textContent = String(Math.floor((timeLeft % 36e5) / 6e4)).padStart(2, '0');
  }
  if (seconds) {
    seconds.textContent = String(Math.floor((timeLeft % 6e4) / 1e3)).padStart(2, '0');
  }
}

updateCountdown();
setInterval(updateCountdown, 1000);

// ==========================================
// 4. LỊCH THÁNG & TẠO SỰ KIỆN LỊCH (ICS)
// ==========================================
// Render lịch tháng 12/2026 (Ngày 12 được đánh dấu class 'today')
if ($('#cal')) {
  const daysHTML =
    '<span class="muted">30</span>' +
    Array.from(
      { length: 31 },
      (_, i) => `<span class="${i === 11 ? 'today' : ''}">${i + 1}</span>`
    ).join('') +
    '<span class="muted">1</span><span class="muted">2</span><span class="muted">3</span>';
  $('#cal').innerHTML = daysHTML;
}

// Dữ liệu tạo file lịch cá nhân (.ics)
const calendarEvents = {
  bride: [
    'Tiệc nhà gái - Lan & Chung',
    '20261212T033000Z',
    '20261212T053000Z',
    'SeaBay Hạ Long, X232+7MW, Bãi Cháy, Quảng Ninh'
  ],
  groom: [
    'Tiệc nhà trai - Lan & Chung',
    '20261212T100000Z',
    '20261212T120000Z',
    'Số 8, ngõ 3, đường Văn Hoá, Khối 8, Sóc Sơn, Hà Nội'
  ]
};

$$('[data-ics]').forEach(button => {
  button.onclick = () => {
    const ev = calendarEvents[button.dataset.ics];
    if (!ev) return;
    const blobContent =
      `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\n` +
      `DTSTART:${ev[1]}\r\nDTEND:${ev[2]}\r\nSUMMARY:${ev[0]}\r\n` +
      `LOCATION:${ev[3]}\r\nEND:VEVENT\r\nEND:VCALENDAR`;

    const blob = new Blob([blobContent], { type: 'text/calendar;charset=utf-8' });
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = `lan-chung-${button.dataset.ics}.ics`;
    downloadLink.click();
    setTimeout(() => URL.revokeObjectURL(downloadLink.href), 1000);
  };
});

// ==========================================
// 5. CÁC TƯƠNG TÁC TIỆN ÍCH (COPY, RSVP SCROLL, SHARE)
// ==========================================
// Sao chép địa chỉ / số tài khoản với hỗ trợ Zalo WebView
$$('[data-copy]').forEach(button => {
  button.onclick = async () => {
    const textToCopy = button.dataset.copy;
    const success = await copyText(textToCopy);
    if (success) {
      notify(button.dataset.copyMessage || 'Đã sao chép vào bộ nhớ tạm');
    } else {
      notify('Không thể sao chép tự động. Vui lòng thử sao chép thủ công.');
    }
  };
});

// Nút chọn sự kiện ở phần địa điểm để cuộn thẳng xuống form RSVP
$$('[data-select]').forEach(button => {
  button.onclick = () => {
    const eventInput = $('[name=event]');
    if (eventInput) eventInput.value = button.dataset.select;
    $('#rsvp')?.scrollIntoView({ behavior: 'smooth' });
  };
});

// Nút chia sẻ trang thiệp cưới
if ($('#share')) {
  $('#share').onclick = async () => {
    const shareData = {
      title: 'Lan & Chung | 12.12.2026',
      text: 'Lan và Chung trân trọng mời bạn cùng hiện diện trong ngày cưới 12.12.2026.',
      url: location.href
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        if (error.name === 'AbortError') return;
      }
    }

    // Fallback: Tự động sao chép link website để gửi qua Zalo/Facebook
    const success = await copyText(location.href);
    if (success) {
      notify('Đã sao chép liên kết thiệp cưới! Bạn có thể dán và gửi cho bạn bè.');
    } else {
      notify('Hãy sao chép liên kết trên thanh địa chỉ để chia sẻ.');
    }
  };
}

// ==========================================
// 6. ALBUM ẢNH (TOUCH / SWIPE LIGHTBOX PRO)
// ==========================================
const lightbox = $('#lightbox');
const lightImg = $('#lightImg');
const lightCaption = $('#lightCaption');
const lightCounter = $('#lightCounter');
let lightboxTrigger = null;
let currentPhotoIndex = 0;

// Thu thập danh sách ảnh trong Album
const photos = $$('.photo').map((btn, index) => {
  const img = $('img', btn);
  return {
    src: btn.dataset.img || (img ? img.src : ''),
    alt: img ? img.alt : `Khoảnh khắc ngày cưới ${index + 1}`
  };
});

function updateLightboxPhoto(index, animate = false) {
  if (photos.length === 0) return;
  currentPhotoIndex = (index + photos.length) % photos.length;
  const current = photos[currentPhotoIndex];

  if (animate && lightImg) {
    lightImg.style.opacity = '0.35';
    lightImg.style.transform = 'scale(0.97)';
  }

  setTimeout(() => {
    if (lightImg) {
      lightImg.src = current.src;
      lightImg.alt = current.alt;
      lightImg.style.opacity = '1';
      lightImg.style.transform = 'none';
    }
    if (lightCaption) {
      lightCaption.textContent = current.alt;
    }
    if (lightCounter) {
      lightCounter.textContent = `${currentPhotoIndex + 1} / ${photos.length}`;
    }
  }, animate ? 150 : 0);
}

function openLightbox(index, triggerElement) {
  if (!lightbox) return;
  lightboxTrigger = triggerElement;
  updateLightboxPhoto(index, false);
  lightbox.hidden = false;
  document.body.classList.add('lightbox-open');
  $('#close')?.focus();
}

function closeLightbox() {
  if (!lightbox || lightbox.hidden) return;
  lightbox.hidden = true;
  document.body.classList.remove('lightbox-open');
  lightboxTrigger?.focus();
  lightboxTrigger = null;
}

// Gán click cho từng ảnh trong gallery
$$('.photo').forEach((button, index) => {
  button.onclick = () => openLightbox(index, button);
});

// Nút Đóng & Nút Next / Prev
$('#close')?.addEventListener('click', closeLightbox);
$('#lightPrev')?.addEventListener('click', () => updateLightboxPhoto(currentPhotoIndex - 1, true));
$('#lightNext')?.addEventListener('click', () => updateLightboxPhoto(currentPhotoIndex + 1, true));

// Click vùng tối ra ngoài ảnh để đóng
if (lightbox) {
  lightbox.onclick = event => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  };
}

// Phím mũi tên & Escape
document.addEventListener('keydown', event => {
  if (lightbox?.hidden) return;

  if (event.key === 'Escape') {
    closeLightbox();
  } else if (event.key === 'ArrowLeft') {
    updateLightboxPhoto(currentPhotoIndex - 1, true);
  } else if (event.key === 'ArrowRight') {
    updateLightboxPhoto(currentPhotoIndex + 1, true);
  }
});

// Cử chỉ cảm ứng vuốt tay (Swipe Gesture) trên điện thoại
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

if (lightbox) {
  lightbox.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });

  lightbox.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleLightboxSwipe();
  }, { passive: true });
}

function handleLightboxSwipe() {
  const diffX = touchEndX - touchStartX;
  const diffY = touchEndY - touchStartY;

  // Vuốt ngang: chuyển ảnh trước / sau
  if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
    if (diffX < 0) {
      updateLightboxPhoto(currentPhotoIndex + 1, true);
    } else {
      updateLightboxPhoto(currentPhotoIndex - 1, true);
    }
  }
  // Vuốt dọc xuống dưới mạnh: đóng lightbox
  else if (diffY > 90 && Math.abs(diffY) > Math.abs(diffX) * 1.4) {
    closeLightbox();
  }
}

// ==========================================
// 7. HIỆU ỨNG CÁNH HOA RƠI LÃNG MẠN (CANVAS PETALS)
// ==========================================
class FallingPetals {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.petals = [];
    this.animationId = null;
    this.isRunning = false;
    this.maxPetals = window.innerWidth <= 768 ? 16 : 28;

    this.colors = [
      'rgba(240, 195, 190, 0.72)',
      'rgba(222, 182, 180, 0.68)',
      'rgba(247, 215, 210, 0.62)',
      'rgba(255, 235, 230, 0.75)',
      'rgba(216, 138, 128, 0.55)'
    ];

    this.resize = this.resize.bind(this);
    this.animate = this.animate.bind(this);
    this.init();
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.maxPetals = window.innerWidth <= 768 ? 16 : 28;
  }

  createPetal() {
    return {
      x: Math.random() * this.canvas.width,
      y: -20 - Math.random() * 40,
      size: 9 + Math.random() * 8,
      speedX: -0.8 + Math.random() * 1.6,
      speedY: 0.9 + Math.random() * 1.4,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.025,
      oscillationSpeed: 0.015 + Math.random() * 0.02,
      oscillationDistance: 0.8 + Math.random() * 1.8,
      color: this.colors[Math.floor(Math.random() * this.colors.length)],
      angle: Math.random() * Math.PI * 2
    };
  }

  init() {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reducedMotion.matches) return;

    this.resize();
    window.addEventListener('resize', this.resize);

    for (let i = 0; i < this.maxPetals; i++) {
      const petal = this.createPetal();
      petal.y = Math.random() * this.canvas.height;
      this.petals.push(petal);
    }

    this.start();

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.stop();
      } else if (this.isRunning) {
        this.start();
      }
    });
  }

  start() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.isRunning = true;
    this.animate();
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  toggle() {
    if (this.animationId) {
      this.stop();
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      return false;
    } else {
      this.start();
      return true;
    }
  }

  drawPetal(p) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(p.size / 2, -p.size / 2, p.size, -p.size / 4, p.size, p.size / 2);
    ctx.bezierCurveTo(p.size, p.size, p.size / 2, p.size * 1.2, 0, p.size);
    ctx.bezierCurveTo(-p.size / 2, p.size * 1.2, -p.size, p.size, -p.size, p.size / 2);
    ctx.bezierCurveTo(-p.size, -p.size / 4, -p.size / 2, -p.size / 2, 0, 0);

    ctx.fillStyle = p.color;
    ctx.fill();
    ctx.restore();
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = 0; i < this.petals.length; i++) {
      const p = this.petals[i];
      p.angle += p.oscillationSpeed;
      p.x += Math.sin(p.angle) * p.oscillationDistance + p.speedX;
      p.y += p.speedY;
      p.rotation += p.rotationSpeed;

      if (p.y > this.canvas.height + 20 || p.x < -40 || p.x > this.canvas.width + 40) {
        this.petals[i] = this.createPetal();
      }

      this.drawPetal(p);
    }

    this.animationId = requestAnimationFrame(this.animate);
  }
}

const petalsManager = new FallingPetals('petalsCanvas');

const petalsToggle = $('#petalsToggle');
if (petalsToggle) {
  petalsToggle.onclick = () => {
    const active = petalsManager.toggle();
    petalsToggle.classList.toggle('is-paused', !active);
    petalsToggle.setAttribute('aria-pressed', String(active));
    notify(active ? 'Đã bật hiệu ứng cánh hoa rơi' : 'Đã tắt hiệu ứng cánh hoa rơi');
  };
}

// ==========================================
// 8. BACKEND GOOGLE SHEETS: RSVP + LỜI CHÚC
// ==========================================
const CONFIG = window.WEDDING_CONFIG || {};

function createSubmissionId() {
  const random = crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
  return `lc_${Date.now().toString(36)}_${random}`;
}

function jsonp(params, timeout = 10000) {
  return new Promise((resolve, reject) => {
    if (!CONFIG.apiUrl) {
      reject(new Error('Backend Google Sheets chưa được cấu hình'));
      return;
    }

    const callback = `lc_callback_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement('script');
    const timer = setTimeout(
      () => finish(new Error('Hết thời gian chờ phản hồi từ Google Sheets')),
      timeout
    );

    function finish(error, data) {
      clearTimeout(timer);
      delete window[callback];
      if (script.parentNode) script.remove();

      if (error) {
        reject(error);
      } else {
        resolve(data);
      }
    }

    window[callback] = data => finish(null, data);
    script.onerror = () => finish(new Error('Không thể kết nối đến Google Sheets'));
    script.src = `${CONFIG.apiUrl}?${new URLSearchParams({ ...params, callback })}`;
    document.head.appendChild(script);
  });
}

async function submitAndVerify(payload) {
  if (!CONFIG.apiUrl) {
    throw new Error('Backend Google Sheets chưa được cấu hình');
  }

  const id = createSubmissionId();
  await fetch(CONFIG.apiUrl, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ ...payload, id })
  });

  for (let attempt = 0; attempt < 4; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 800 + attempt * 400));
    try {
      const result = await jsonp({ action: 'status', id }, 5000);
      if (result && result.saved) return id;
    } catch (e) {
      // Tiếp tục retry
    }
  }

  return id;
}

async function checkBackend() {
  const state = $('#backendState');
  if (!state) return;

  if (!CONFIG.apiUrl) {
    state.textContent = 'Biểu mẫu chưa sẵn sàng. Bạn vui lòng thử lại sau hoặc nhắn trực tiếp cho Chúng mình nhé.';
    return;
  }

  try {
    const result = await jsonp({ action: 'health' });
    state.textContent = result.ok
      ? 'Biểu mẫu đã sẵn sàng. Cảm ơn bạn đã ghé thăm!'
      : 'Biểu mẫu đang gặp chút trục trặc. Bạn vui lòng thử lại sau hoặc nhắn trực tiếp cho Chúng mình nhé.';
  } catch (error) {
    state.textContent = 'Biểu mẫu đã sẵn sàng. Rất mong được đón tiếp bạn!';
  }
}

function appendWish(wish, label = 'Đã duyệt') {
  const wishList = $('#wishList');
  if (!wishList) return;

  const article = document.createElement('article');
  article.className = 'wish';

  const small = document.createElement('small');
  small.textContent = label;

  const quote = document.createElement('blockquote');
  quote.textContent = wish.wish;

  const author = document.createElement('p');
  author.textContent = wish.name;

  article.append(small, quote, author);
  wishList.prepend(article);
}

async function loadApprovedWishes() {
  if (!CONFIG.apiUrl) return;

  try {
    const result = await jsonp({ action: 'wishes' });
    (result.wishes || []).reverse().forEach(wish => appendWish(wish));
  } catch (error) {
    console.warn('Không tải được danh sách lời chúc từ server:', error);
  }
}

checkBackend();
loadApprovedWishes();

// Gửi form lời chúc
if ($('#wishForm')) {
  $('#wishForm').onsubmit = async event => {
    event.preventDefault();

    const form = event.currentTarget;
    if (!form.reportValidity()) return;

    const data = Object.fromEntries(new FormData(form));
    const status = $('#wishStatus');
    const button = $('button[type="submit"]', form) || $('button', form);

    button.disabled = true;
    if (status) status.textContent = 'Cảm ơn bạn, tụi mình đang gửi lời chúc đến Lan & Chung nhé…';

    try {
      const wish = {
        name: data.guestName.trim(),
        wish: data.wish.trim()
      };

      await submitAndVerify({ type: 'wish', ...wish });
      appendWish(wish, 'Vừa gửi');
      $('#wishList .wish')?.classList.add('is-new');

      if (status) status.textContent = 'Cảm ơn bạn đã gửi lời chúc thật dễ thương! Tụi mình đã nhận được rồi nhé.';
      form.reset();
    } catch (error) {
      console.error('Không gửi được lời chúc:', error);
      if (status) status.textContent = 'Tụi mình chưa nhận được xác nhận gửi thành công. Bạn thử lại sau hoặc nhắn trực tiếp cho Chúng mình nhé.';
    } finally {
      button.disabled = false;
    }
  };
}

// Gửi form RSVP xác nhận tham dự
if ($('#rsvpForm')) {
  $('#rsvpForm').onsubmit = async event => {
    event.preventDefault();

    const form = event.currentTarget;
    if (!form.reportValidity()) return;

    const data = Object.fromEntries(new FormData(form));
    const status = $('#rsvpStatus');
    const button = $('button[type="submit"]', form) || $('button', form);

    button.disabled = true;
    if (status) status.textContent = 'Cảm ơn bạn, tụi mình đang gửi phản hồi đến Lan & Chung nhé…';

    try {
      const id = await submitAndVerify({
        type: 'rsvp',
        name: data.name.trim(),
        guests: data.guests,
        event: data.event,
        attendance: data.attendance,
        phone: data.phone || '',
        message: data.message || ''
      });

      if (status) status.textContent = `Cảm ơn bạn đã phản hồi! Lan & Chung đã nhận được xác nhận của bạn. Mã xác nhận: ${id}`;
      form.reset();
    } catch (error) {
      console.error('Không gửi được xác nhận tham dự:', error);
      if (status) status.textContent = 'Tụi mình chưa nhận được xác nhận gửi thành công. Bạn thử lại sau hoặc nhắn trực tiếp cho Lan & Chung nhé.';
    } finally {
      button.disabled = false;
    }
  };
}

// ==========================================
// 9. TRÌNH PHÁT NHẠC NỀN (AUDIO PLAYER)
// ==========================================
const musicButton = $('#music');
const musicPlayer = $('#musicPlayer');
let globalAudio = null;

function getOrCreateAudio() {
  if (!globalAudio) {
    globalAudio = document.createElement('audio');
    globalAudio.src = 'assets/audio/Hon-Ca-Yeu-Duc-Phuc.mp3';
    globalAudio.loop = true;
    globalAudio.preload = 'auto';
    globalAudio.setAttribute('aria-hidden', 'true');

    globalAudio.addEventListener('play', () => {
      if (musicButton) {
        musicButton.classList.add('is-open');
        musicButton.setAttribute('aria-pressed', 'true');
        musicButton.setAttribute('aria-label', 'Tắt nhạc nền Hơn Cả Yêu');
        const label = $('.music-label', musicButton);
        if (label) label.textContent = 'Tắt nhạc';
      }
    });

    globalAudio.addEventListener('pause', () => {
      if (musicButton) {
        musicButton.classList.remove('is-open');
        musicButton.setAttribute('aria-pressed', 'false');
        musicButton.setAttribute('aria-label', 'Phát nhạc nền Hơn Cả Yêu');
        const label = $('.music-label', musicButton);
        if (label) label.textContent = 'Nghe nhạc';
      }
    });

    if (musicPlayer) musicPlayer.appendChild(globalAudio);
  }
  return globalAudio;
}

function startBackgroundMusic() {
  const player = getOrCreateAudio();
  player.play().catch(error => {
    console.warn('Tự động phát nhạc bị chặn bởi trình duyệt:', error);
  });
}

function stopBackgroundMusic() {
  if (globalAudio) {
    globalAudio.pause();
  }
}

if (musicButton) {
  musicButton.onclick = () => {
    const player = getOrCreateAudio();
    if (player.paused) {
      player.play().catch(err => console.warn('Không thể phát nhạc:', err));
    } else {
      player.pause();
    }
  };
}

// ==========================================
// 10. CÁ NHÂN HÓA THIỆP MỜI (?to=... & ?side=...)
// ==========================================
function applyPersonalization() {
  const urlParams = new URLSearchParams(window.location.search);
  const guestParam = urlParams.get('to') || urlParams.get('guest') || urlParams.get('name');
  const sideParam = (urlParams.get('side') || urlParams.get('event') || '').toLowerCase();

  // 1. Nếu có tên khách mời
  if (guestParam) {
    const guestName = guestParam.trim();

    // Hiển thị trên lá thiệp bìa phong bì
    const guestCardBadge = $('#guestCardBadge');
    const guestCoverName = $('#guestCoverName');
    if (guestCardBadge && guestCoverName) {
      guestCoverName.textContent = guestName;
      guestCardBadge.hidden = false;
    }

    // Hiển thị trong lời mời Hero
    const guestHeroName = $('#guestHeroName');
    if (guestHeroName) {
      guestHeroName.textContent = guestName;
    }

    // Điền sẵn vào Form RSVP
    const rsvpNameInput = $('input[name="name"]');
    if (rsvpNameInput) {
      rsvpNameInput.value = guestName;
    }

    // Điền sẵn vào Form Gửi lời chúc
    const wishNameInput = $('input[name="guestName"]');
    if (wishNameInput) {
      wishNameInput.value = guestName;
    }
  }

  // 2. Nếu có chỉ định buổi tiệc (nhà trai / nhà gái)
  if (sideParam) {
    const eventSelect = $('select[name="event"]');
    if (eventSelect) {
      if (sideParam === 'bride' || sideParam.includes('gai') || sideParam.includes('nha-gai')) {
        eventSelect.value = 'Tiệc nhà gái';
      } else if (sideParam === 'groom' || sideParam.includes('trai') || sideParam.includes('nha-trai')) {
        eventSelect.value = 'Tiệc nhà trai';
      } else if (sideParam === 'both' || sideParam.includes('ca-hai')) {
        eventSelect.value = 'Cả hai buổi tiệc';
      }
    }
  }
}

applyPersonalization();

// ==========================================
// 11. CÔNG CỤ TẠO LINK GỬI KHÁCH (LINK GENERATOR)
// ==========================================
const linkModal = $('#linkModal');
const openLinkModalBtn = $('#openLinkModalBtn');
const closeLinkModalBtn = $('#closeLinkModal');
const genGuestName = $('#genGuestName');
const genGuestSide = $('#genGuestSide');
const genLinkPreview = $('#genLinkPreview');
const btnCopyGenLink = $('#btnCopyGenLink');

function updateGeneratedLink() {
  const base = CONFIG.siteUrl || (window.location.origin + window.location.pathname);
  const nameVal = genGuestName ? genGuestName.value.trim() : '';
  const sideVal = genGuestSide ? genGuestSide.value : '';

  const params = new URLSearchParams();
  if (nameVal) params.set('to', nameVal);
  if (sideVal) params.set('side', sideVal);

  const qs = params.toString();
  const finalUrl = qs ? `${base}?${qs}` : base;

  if (genLinkPreview) {
    genLinkPreview.textContent = finalUrl;
  }
  return finalUrl;
}

if (openLinkModalBtn && linkModal) {
  openLinkModalBtn.onclick = () => {
    linkModal.hidden = false;
    updateGeneratedLink();
    setTimeout(() => genGuestName?.focus(), 100);
  };
}

if (closeLinkModalBtn && linkModal) {
  closeLinkModalBtn.onclick = () => {
    linkModal.hidden = true;
  };

  linkModal.onclick = event => {
    if (event.target === linkModal) {
      linkModal.hidden = true;
    }
  };
}

genGuestName?.addEventListener('input', updateGeneratedLink);
genGuestSide?.addEventListener('change', updateGeneratedLink);

if (btnCopyGenLink) {
  btnCopyGenLink.onclick = async () => {
    const finalUrl = updateGeneratedLink();
    const ok = await copyText(finalUrl);
    if (ok) {
      notify('Đã sao chép link mời! Bạn có thể dán và gửi qua Zalo/Facebook.');
      if (linkModal) linkModal.hidden = true;
    } else {
      notify('Không thể tự sao chép, bạn hãy bôi đen link và copy nhé.');
    }
  };
}

// ==========================================
// 12. XỬ LÝ HỘP QUÀ MỪNG CƯỚI LẮC LƯ (GIFT BOX INTERACTION)
// ==========================================
function spawnGiftSparkles(element) {
  if (!element) return;
  const icons = ['✨', '💖', '🎁', '⭐', '🌸'];
  for (let i = 0; i < 6; i++) {
    const span = document.createElement('span');
    span.className = 'gift-sparkle-float';
    span.textContent = icons[i % icons.length];
    span.style.left = `${15 + Math.random() * 70}%`;
    span.style.top = `35%`;
    span.style.animationDelay = `${i * 70}ms`;
    element.appendChild(span);
    setTimeout(() => span.remove(), 1200);
  }
}

$$('.gift-box-btn').forEach(button => {
  button.onclick = () => {
    if (navigator.vibrate) {
      try { navigator.vibrate([18, 30]); } catch (e) {}
    }
    const card = button.closest('.gift-box-card');
    if (!card) return;

    spawnGiftSparkles(card);

    const content = card.querySelector('.gift-content');
    card.classList.add('is-open');
    if (content) {
      content.hidden = false;
      const copyBtn = content.querySelector('.copy-account');
      if (copyBtn) setTimeout(() => copyBtn.focus(), 350);
    }
    button.setAttribute('aria-expanded', 'true');
  };
});

$$('.gift-close-btn').forEach(btn => {
  btn.onclick = () => {
    const targetId = btn.dataset.closeTarget;
    const card = targetId ? $('#' + targetId) : btn.closest('.gift-box-card');
    if (!card) return;
    const content = card.querySelector('.gift-content');
    const trigger = card.querySelector('.gift-box-btn');
    card.classList.remove('is-open');
    if (content) content.hidden = true;
    if (trigger) {
      trigger.setAttribute('aria-expanded', 'false');
      trigger.focus();
    }
  };
});

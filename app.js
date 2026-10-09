let allMovies = [];
let activeCategory = 'all';

// =========================================================================
// 🎯 โหลดข้อมูลลิงก์นายหน้าจาก affiliates.json เข้าสู่ระบบ
// =========================================================================
let affiliateList = [];

async function loadAffiliates() {
  try {
    const res = await fetch('affiliates.json');
    if (!res.ok) throw new Error('โหลด affiliates.json ไม่สำเร็จ');
    affiliateList = await res.json();
    setupDropdownLinks(); // หยอดลิงก์เข้า Navbar ทันที
  } catch (err) {
    console.warn('⚠️ ใช้ค่าสำรองเนื่องจาก:', err.message);
  }
}

// ฟังก์ชันช่วยค้นหาลิงก์ตาม ID หรือดึง URL สำรอง (Fallback)
function getAffiliateUrl(id, defaultUrl = '#') {
  const item = affiliateList.find(a => a.id === id);
  return item ? (item.url || item.fallbackUrl || defaultUrl) : defaultUrl;
}

async function loadMovieData() {
  const container = document.getElementById('movieList');
  try {
    const response = await fetch('movies.json');
    if (!response.ok) throw new Error('ไม่สามารถโหลด movies.json ได้');
    allMovies = await response.json();
    renderMovies(allMovies);
  } catch (error) {
    if (container) {
      container.innerHTML = `<div class="empty-state">แจ้งเตือน: ${error.message}</div>`;
    }
  }
}

// -------------------------------------------------------------
// 1. หน้า "🔥 หนังใหม่ชนโรง" (ดึงตรงจาก TMDB API + สำรอง 16 เรื่อง)
// -------------------------------------------------------------
const FALLBACK_CINEMA_LIST = [
  {
    "id": "cnm-1",
    "title": "ธี่หยด 2",
    "badge": "🔥 รอบฉายวันนี้",
    "price": "ตั๋วเริ่ม 120 บ.",
    "poster": "https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
    "synopsis": "การกลับมาล้างแค้นของพี่ยักษ์ ดงผีป่าสุดสะพรึงและปมลี้ลับที่ต้องพิสูจน์ในโรง",
    "trailerUrl": "https://www.youtube.com/results?search_query=ธี่หยด+2+ตัวอย่าง",
    "majorUrl": "https://www.majorcineplex.com",
    "sfUrl": "https://www.sfcinemacity.com/movies/now-showing"
  },
  {
    "id": "cnm-2",
    "title": "หลานม่า (How to Make Millions)",
    "badge": "🎬 ฉายทุกโรง",
    "price": "ตั๋วเริ่ม 120 บ.",
    "poster": "https://image.tmdb.org/t/p/w500/9Pf9BTyvFwbZ6T9f0gZ0K4v00vP.jpg",
    "synopsis": "ภาพยนตร์ครอบครัวแห่งปี เรื่องราวความอบอุ่นระหว่างหลานชายและอาม่า",
    "trailerUrl": "https://www.youtube.com/results?search_query=หลานม่า+ตัวอย่าง",
    "majorUrl": "https://www.majorcineplex.com",
    "sfUrl": "https://www.sfcinemacity.com/movies/now-showing"
  },
  {
    "id": "cnm-3",
    "title": "Gladiator II",
    "badge": "⚔️ บู๊ฟอร์มยักษ์",
    "price": "ตั๋วเริ่ม 130 บ.",
    "poster": "https://image.tmdb.org/t/p/w500/2cxhvwyEwRlysAmRH4iodkvo0z5.jpg",
    "synopsis": "สงครามสังเวียนเลือดโคลอสเซียมภาคต่อระดับตำนาน ความมันส์สะเทือนบัลลังก์โรม",
    "trailerUrl": "https://www.youtube.com/results?search_query=Gladiator+2+Trailer",
    "majorUrl": "https://www.majorcineplex.com",
    "sfUrl": "https://www.sfcinemacity.com/movies/now-showing"
  },
  {
    "id": "cnm-4",
    "title": "Moana 2",
    "badge": "🌊 แอนิเมชันฟอร์มยักษ์",
    "price": "ตั๋วเริ่ม 120 บ.",
    "poster": "https://image.tmdb.org/t/p/w500/4YZpsylmjHbqeWzjKpUEF8gcLUV.jpg",
    "synopsis": "การผจญภัยครั้งใหม่ข้ามมหาสมุทรแปซิฟิกของโมอาน่าและมาวอิ",
    "trailerUrl": "https://www.youtube.com/results?search_query=Moana+2+ตัวอย่าง",
    "majorUrl": "https://www.majorcineplex.com",
    "sfUrl": "https://www.sfcinemacity.com/movies/now-showing"
  },
  {
    "id": "cnm-5",
    "title": "Deadpool & Wolverine",
    "badge": "💥 แอ็กชันคอมเมดี้",
    "price": "ตั๋วเริ่ม 130 บ.",
    "poster": "https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
    "synopsis": "การผนึกกำลังสุดป่วนกวนประสาทของสองคู่หูฮีโร่สายโหด บันเทิงทะลุมิติตลอดเรื่อง",
    "trailerUrl": "https://www.youtube.com/results?search_query=Deadpool+Wolverine+ตัวอย่าง",
    "majorUrl": "https://www.majorcineplex.com",
    "sfUrl": "https://www.sfcinemacity.com/movies/now-showing"
  },
  {
    "id": "cnm-6",
    "title": "วิมานหนาม (The Paradise of Thorns)",
    "badge": "🏆 หนังไทยยอดเยี่ยม",
    "price": "ตั๋วเริ่ม 120 บ.",
    "poster": "https://image.tmdb.org/t/p/w500/fU3jSg5H4w1H2K2H1g2G1H2G1H2.jpg",
    "synopsis": "การแย่งชิงสวนทุเรียนและมรดกเลือด ละครชีวิตฟาดฟันสุดเข้มข้น",
    "trailerUrl": "https://www.youtube.com/results?search_query=วิมานหนาม+ตัวอย่าง",
    "majorUrl": "https://www.majorcineplex.com",
    "sfUrl": "https://www.sfcinemacity.com/movies/now-showing"
  }
];

async function renderCinemaHub() {
  const container = document.getElementById('movieList');
  container.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 50px;">
      <p style="color: #f59e0b; font-size: 1.2rem; font-weight: bold;">📡 บรรณาธิการกำลังกวาดโปรแกรมหนังชนโรงสดจาก Major & SF...</p>
      <p style="color: #94a3b8; font-size: 0.85rem; margin-top: 6px;">ดึงภาพโปสเตอร์ทางการและรอบฉายจริงทั่วประเทศ</p>
    </div>
  `;

  let cinemaList = [];
  const tmdbApiKey = "b247b48b334c0cda00246594652c054f";
  const tmdbUrl = `https://api.themoviedb.org/3/movie/now_playing?api_key=${tmdbApiKey}&language=th-TH&region=TH&page=1`;

  try {
    const response = await fetch(tmdbUrl);
    if (!response.ok) throw new Error('เชื่อมต่อ TMDB ไม่สำเร็จ');
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      cinemaList = data.results.slice(0, 20).map((movie, index) => {
        const title = movie.title || 'ไม่มีชื่อภาษาไทย';
        const posterPath = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'logo.png';
        let synopsis = movie.overview ? movie.overview.trim() : 'รอบฉายภาพยนตร์สัปดาห์นี้ เช็ครอบฉายและสิทธิพิเศษตั๋วราคาประหยัด';
        if (synopsis.length > 90) synopsis = synopsis.substring(0, 90) + '...';

        return {
          id: `cnm-${index + 1}`,
          title: title,
          badge: "🔥 ฉายแล้ววันนี้",
          price: "ตั๋วเริ่ม 120 บ.",
          poster: posterPath,
          synopsis: synopsis,
          trailerUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' ตัวอย่าง')}`,
          majorUrl: `https://www.majorcineplex.com/search?q=${encodeURIComponent(title)}`,
          sfUrl: "https://www.sfcinema.com/"
        };
      });
    }
  } catch (err) {
    console.warn('⚠️ ดึง TMDB สดไม่สำเร็จ สลับใช้คลังสำรอง:', err.message);
    cinemaList = FALLBACK_CINEMA_LIST;
  }

  container.innerHTML = '';

  if (!cinemaList || cinemaList.length === 0) {
    container.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #94a3b8;">ไม่พบรอบฉายภาพยนตร์ในขณะนี้</div>`;
    return;
  }

  cinemaList.forEach(movie => {
    let safeSfUrl = movie.sfUrl || 'https://www.sfcinema.com/';
    const safeMajorUrl = movie.majorUrl || 'https://www.majorcineplex.com/movie';
    const safeTrailerUrl = movie.trailerUrl || `https://www.youtube.com/results?search_query=ตัวอย่าง+${encodeURIComponent(movie.title)}`;
    const badgeText = movie.badge || 'ฉายอยู่วันนี้';
    const priceText = movie.price || 'เช็ครอบฉาย';
    const synopsisText = movie.synopsis || 'ตรวจสอบรอบฉายและรายละเอียดได้ที่โรงภาพยนตร์';

    const card = document.createElement('article');
    card.className = 'cinema-card';
    card.innerHTML = `
      <div class="poster-box">
        <img src="${movie.poster || 'logo.png'}" alt="${escapeHtml(movie.title)}" class="poster-img" loading="lazy" onerror="this.src='logo.png'">
        <span class="poster-badge-platform" style="background: #f59e0b; color: #000; font-weight: bold;">${badgeText}</span>
        <span class="poster-badge-time">${priceText}</span>
      </div>

      <div class="cinema-card-body">
        <h3 class="cinema-card-title">${escapeHtml(movie.title)}</h3>
        <p class="cinema-synopsis-mini">${escapeHtml(synopsisText)}</p>

        <div class="capsule-group">
          <!-- แถวที่ 1: ข้อมูลโรงหนัง & ตัวอย่าง -->
          <div class="capsule-row">
            <a href="${safeTrailerUrl}" target="_blank" rel="noopener noreferrer" class="pill-btn pill-trailer">
              ▶ ตัวอย่าง
            </a>
            <a href="${safeMajorUrl}" target="_blank" rel="noopener noreferrer" class="pill-btn pill-major">
              🍿 Major
            </a>
            <a href="${safeSfUrl}" target="_blank" rel="noopener noreferrer" class="pill-btn pill-sf">
              🍿 SF
            </a>
          </div>

          <!-- แถวที่ 2: โปรโมชันตั๋วหนัง (Affiliate) -->
          <div class="capsule-row">
            <a href="${getAffiliateUrl('linkNavShopeeMovie')}" target="_blank" rel="noopener noreferrer sponsored" class="pill-btn pill-shopee">
              🎟️ ตั๋วลด Shopee
            </a>
            <a href="${getAffiliateUrl('linkNavLazadaMovie')}" target="_blank" rel="noopener noreferrer sponsored" class="pill-btn pill-lazada">
              🎟️ ตั๋วลด Lazada
            </a>
          </div>

          <!-- แถวที่ 3: สตรีมมิ่ง & บัตรของขวัญ & Cloud -->
          <div class="capsule-row" style="margin-top: 6px;">
            <a href="${getAffiliateUrl('linkNetflixShopee')}" target="_blank" rel="noopener noreferrer sponsored" class="pill-btn" style="background: #e50914; color: #fff;">
              📺 โค้ดสตรีมมิ่ง
            </a>
            <a href="${getAffiliateUrl('linkLazadaStream')}" target="_blank" rel="noopener noreferrer sponsored" class="dropdown-item">
              💸 โค้ดส่วนลดสตรีมมิ่ง (Lazada)
            </a>
            <a href="${getAffiliateUrl('linkSeagmGift')}" target="_blank" rel="noopener noreferrer sponsored" class="pill-btn" style="background: #4f46e5; color: #fff;">
              🎁 บัตรของขวัญ
            </a>
            <a href="${getAffiliateUrl('linkGeforceNow')}" target="_blank" rel="noopener noreferrer sponsored" class="pill-btn" style="background: #0284c7; color: #fff;">
              ☁️ GeForce NOW
            </a>
          </div>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

// -------------------------------------------------------------
// 2. เรนเดอร์การ์ดค้นหาทั่วไป (YouTube, Bilibili, Netflix, Google Play)
// -------------------------------------------------------------
function renderMovies(list) {
  const container = document.getElementById('movieList');
  container.innerHTML = '';

  if (!list || list.length === 0) {
    container.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #94a3b8;">ไม่พบรายการที่ตรงกับคำค้นหา</div>`;
    return;
  }

  list.forEach((m) => {
    const isFree = (m.categories && m.categories.includes("ดูฟรี")) || 
                   (m.starting_price && m.starting_price.includes("ฟรี"));
    const priceText = isFree ? "ฟรี 0 บ." : (m.starting_price || "เช่า 35 บ.");

    const primarySource = (m.pricing_tiers && m.pricing_tiers.length > 0) 
      ? m.pricing_tiers[0] 
      : (m.sources && m.sources[0]) ? m.sources[0] : null;

    const primaryUrl = primarySource ? primarySource.url : '#';
    const primaryBtnClass = primarySource ? (primarySource.class || 'btn-youtube') : 'btn-youtube';

    let platformName = "YouTube";
    let platformColor = "#dc2626";
    let sourceLabel = "YouTube";

    if ((m.categories && m.categories.includes("Bilibili")) || primaryUrl.includes("bilibili")) {
      platformName = "Bilibili";
      platformColor = "#00aeec";
      sourceLabel = "Bilibili";
    } else if ((m.categories && m.categories.includes("Netflix")) || primaryUrl.includes("netflix")) {
      platformName = "Netflix";
      platformColor = "#E50914";
      sourceLabel = "Netflix";
    } else if ((m.categories && m.categories.includes("Google TV")) || primaryUrl.includes("google")) {
      platformName = "Google Play";
      platformColor = "#2563eb";
      sourceLabel = "Google Play";
    }

    let posterImgUrl = m.poster || "";
    if (!posterImgUrl) {
      if (m.id && String(m.id).startsWith("yt-")) {
        const vid = String(m.id).replace("yt-hub-", "").replace("yt-", "");
        if (vid.length === 11) posterImgUrl = `https://img.youtube.com/vi/${vid}/hqdefault.jpg`;
      } else if (primaryUrl.includes("watch?v=")) {
        const match = primaryUrl.match(/v=([a-zA-Z0-9_-]{11})/);
        if (match) posterImgUrl = `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
      }
    }

    const posterDisplayHtml = posterImgUrl 
      ? `<img src="${posterImgUrl}" alt="${escapeHtml(m.title)}" class="poster-img" loading="lazy" onerror="this.src='logo.png'">`
      : `<div style="display:flex; align-items:center; justify-content:center; height:100%; color:#38bdf8; font-weight:bold;">🎬 LNY RADAR</div>`;

    const qualityText = m.specs?.resolution || m.quality || "HD";
    const timeBadgeText = m.duration || (isFree ? "ดูฟรี" : priceText);

    let adminToolbarHTML = '';
    if (typeof isLocalhost !== 'undefined' && isLocalhost) {
      const safeTitle = (m.title || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
      const safeUrl = (primaryUrl || '').replace(/'/g, "\\'");
      const safePoster = (posterImgUrl || '').replace(/'/g, "\\'");
      const safeDuration = (timeBadgeText || 'เต็มเรื่อง').replace(/'/g, "\\'");
      const safeSource = (sourceLabel || 'YouTube').replace(/'/g, "\\'");

      const allCatText = (Array.isArray(m.categories) ? m.categories.join(' ') : '') + ' ' + (m.title || '');
      let autoDetectedCat = "หนังไทย";
      if (/อนิเมะ|การ์ตูน|anime|one piece|hunter/i.test(allCatText)) {
        autoDetectedCat = "อนิเมะ";
      } else if (/สารคดี|สำรวจโลก|doc/i.test(allCatText)) {
        autoDetectedCat = "สารคดี";
      } else if (/netflix|google|ต่างประเทศ|inter|childe|rambo/i.test(allCatText)) {
        autoDetectedCat = "หนังต่างประเทศ";
      }

      adminToolbarHTML = `
        <div class="admin-card-tools">
          <button type="button" class="btn-tool-archive" 
            onclick="copyForArchive('${safeTitle}', '${autoDetectedCat}', '${qualityText}', '${safeSource}', '${safeUrl}')" 
            title="ตรวจของซ้ำ แล้วก๊อปปี้ไปวางใน archives.json">
            📥 ลง Archive
          </button>
          <button type="button" class="btn-tool-movie" 
            onclick="copyForMovieSlot('${safeTitle}', '${safePoster}', '${safeDuration}', '${safeSource}', '${safeUrl}')" 
            title="ก๊อปปี้ลง movies.json แบบยืดหยุ่นไม่จำกัดสล็อต">
            ⭐ ลง Slot Movie
          </button>
        </div>
      `;
    }

    const card = document.createElement('article');
    card.className = 'movie-card';
    card.innerHTML = `
      <div class="poster-box">
        ${posterDisplayHtml}
        <span class="poster-badge-platform" style="background: ${platformColor};">${platformName}</span>
        <span class="poster-badge-time">${escapeHtml(timeBadgeText)}</span>
      </div>

      <div class="card-info">
        <h3 class="poster-title" title="${escapeHtml(m.title)}">${escapeHtml(m.title)}</h3>
        <div class="poster-source-tag">
          <span>ห้องฉาย ${sourceLabel}</span>
          <span>•</span>
          <span>${qualityText}</span>
        </div>
        <a href="${primaryUrl}" target="_blank" rel="noopener noreferrer" class="btn-play-compact ${primaryBtnClass}">
          ▶ ดูเดี๋ยวนี้
        </a>

        ${adminToolbarHTML}
      </div>
    `;
    container.appendChild(card);
  });
}

function executeSearch() {
  const query = document.getElementById('searchInput').value.trim();
  if (!query) {
    renderMovies(allMovies);
    return;
  }

  const filtered = allMovies.filter(m => {
    const titleMatch = m.title ? m.title.toLowerCase().includes(query.toLowerCase()) : false;
    const synMatch   = m.synopsis ? m.synopsis.toLowerCase().includes(query.toLowerCase()) : false;
    const catMatch   = Array.isArray(m.categories) ? m.categories.some(c => c.toLowerCase().includes(query.toLowerCase())) : false;
    return titleMatch || synMatch || catMatch;
  });

  if (filtered.length > 0) {
    renderMovies(filtered);
  } else {
    triggerLiveRadar(query);
  }
}

// -------------------------------------------------------------
// 3. เรดาร์สแกนสด Real-time ผ่าน Cloudflare Worker
// -------------------------------------------------------------
async function triggerLiveRadar(rawQuery) {
  const container = document.getElementById('movieList');
  if (!container) return;

  container.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 40px;">
      <p style="color: #38bdf8; font-weight: bold; font-size: 1.1rem;">📡 เรดาร์กำลังออกไปเคาะพิกัดสดจาก YouTube...</p>
      <p style="color: #94a3b8; font-size: 0.85rem; margin-top: 4px;">กวาดคลิปพากย์ไทยและคลิปเต็มเรื่อง Real-time</p>
    </div>
  `;

  try {
    const workerUrl = `https://lny-movie-radar.naca-doy2.workers.dev?q=${encodeURIComponent(rawQuery)}`;
    const response = await fetch(workerUrl);
    if (!response.ok) throw new Error('เซิร์ฟเวอร์เรดาร์ไม่ตอบสนอง');
    const liveResults = await response.json();

    if (liveResults && liveResults.length > 0) {
      renderMovies(liveResults);
    } else {
      container.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #94a3b8;">ไม่พบคลิปที่ตรงกับคำค้นหา [${escapeHtml(rawQuery)}]</div>`;
    }
  } catch (err) {
    console.error(err);
    container.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: #f87171; padding: 40px;">ระบบสแกนขัดข้อง: ${err.message}</div>`;
  }
}

// ควบคุมถาดสไลด์สนับสนุน
window.openSupportTray = function() {
  const overlay = document.getElementById('trayOverlay');
  const tray = document.getElementById('supportTray');
  if (overlay) overlay.style.display = 'block';
  if (tray) setTimeout(() => { tray.classList.add('active'); }, 10);
};

window.closeSupportTray = function() {
  const overlay = document.getElementById('trayOverlay');
  const tray = document.getElementById('supportTray');
  if (tray) tray.classList.remove('active');
  if (overlay) setTimeout(() => { overlay.style.display = 'none'; }, 300);
};

window.confirmTransfer = function() {
  const msg = document.getElementById('thankYouMsg');
  if (msg) {
    msg.style.display = 'block';
    setTimeout(() => { closeSupportTray(); msg.style.display = 'none'; }, 3500);
  }
};

window.openBookmarkModal = function() {
  const modal = document.getElementById('bookmarkModal');
  if (modal) modal.style.display = 'flex';
};
window.closeBookmarkModal = function() {
  const modal = document.getElementById('bookmarkModal');
  if (modal) modal.style.display = 'none';
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

document.addEventListener('DOMContentLoaded', () => {
  loadAffiliates();
  loadMovieData();
  setupDropdownLinks();

  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');

  if (searchBtn) searchBtn.addEventListener('click', executeSearch);
  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => { 
      if (e.key === 'Enter') executeSearch(); 
    });
  }

  // ตัวจัดการคลิกหมวดหมู่ชิป
  const categoryChips = document.querySelectorAll('.chip');
  categoryChips.forEach(chip => {
    chip.addEventListener('click', (e) => {
      categoryChips.forEach(c => c.classList.remove('active'));
      const target = e.currentTarget || e.target;
      target.classList.add('active');
      activeCategory = target.getAttribute('data-category');

     if (activeCategory === 'หนังชนโรง') {
        renderCinemaHub();
      } else if (activeCategory === 'all') {
        if (searchInput) searchInput.value = '';
        renderMovies(allMovies); 
      } else {
       // ในส่วนดักคลิกปุ่มหมวดหมู่ (Category Chips Listener)
let targetSearch = "";
if (activeCategory === 'ดูฟรี') {
  targetSearch = "หนังเต็มเรื่อง ดูฟรี";
} else if (activeCategory === 'สารคดี') {
  targetSearch = "สารคดีสำรวจโลก";
} else if (activeCategory === 'หนังไทย 80s-90s' || activeCategory === 'หนังไทย') {
  targetSearch = "อมตะหนังไทยยุค 90";
} else if (activeCategory === 'หนังสงคราม/บู๊' || activeCategory === 'หนังสงคราม') {
  targetSearch = "หนังสงครามพากย์ไทย";
} else if (activeCategory === 'การ์ตูน/อนิเมะ' || activeCategory === 'อนิเมะ') {
  targetSearch = "หนังการ์ตูน";
}

if (targetSearch) {
  if (searchInput) searchInput.value = targetSearch;
  executeSearch();
}
      }
    });
  });
});

// ==========================================
// ระบบลิ้นชักคลังสำรอง (archives.json)
// ==========================================
let archivesData = [];
let currentArchiveCat = 'all';

async function loadArchives() {
  try {
    const response = await fetch('archives.json');
    if (!response.ok) throw new Error('ไม่พบไฟล์ archives.json');
    archivesData = await response.json();
    renderFilteredArchives();
    buildSemanticSeoDirectory(archivesData);
  } catch (error) {
    console.warn('โหลด archives.json ไม่สำเร็จ:', error);
  }
}

function renderFilteredArchives() {
  const searchInput = document.getElementById('archiveSearchInput');
  const keyword = searchInput ? searchInput.value.toLowerCase().trim() : '';

  const filtered = archivesData.filter(item => {
    const matchCategory = (currentArchiveCat === 'all') || 
                          (item.category && item.category.includes(currentArchiveCat));
    const matchKeyword = !keyword || 
                         (item.title && item.title.toLowerCase().includes(keyword)) || 
                         (item.specs && item.specs.toLowerCase().includes(keyword));
    return matchCategory && matchKeyword;
  });

  renderArchiveList(filtered);
}

function setArchiveCategory(category, buttonElement) {
  currentArchiveCat = category;
  const allChips = document.querySelectorAll('.arch-chip');
  allChips.forEach(chip => chip.classList.remove('active'));
  if (buttonElement) buttonElement.classList.add('active');
  renderFilteredArchives();
}

function renderArchiveList(items) {
  const listContainer = document.getElementById('archiveList');
  if (!listContainer) return;
  
  const countBadge = document.getElementById("archiveCountBadge");
  if (countBadge) {
    countBadge.textContent = items.length + " เรื่อง";
  }

  if (items.length === 0) {
    listContainer.innerHTML = '<div style="color: #94a3b8; text-align: center; padding: 30px 10px;">ไม่พบรายการในหมวดนี้</div>';
    return;
  }

  listContainer.innerHTML = items.map(item => `
    <div class="archive-item">
      <div class="archive-info">
        <span class="archive-title">${escapeHtml(item.title)}</span>
        <span class="archive-meta">${escapeHtml(item.category || '')} • ${escapeHtml(item.specs || '')}</span>
      </div>
      <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="archive-btn ${item.source === 'Bilibili' ? 'btn-bilibili' : 'btn-youtube'}">
        ▶ ${escapeHtml(item.source)}
      </a>
    </div>
  `).join('');
}

function toggleArchiveDrawer() {
  const drawer = document.getElementById('archiveDrawer');
  const overlay = document.getElementById('archiveOverlay');
  if (!drawer || !overlay) return;

  drawer.classList.toggle('active');
  overlay.classList.toggle('active');
}

function setupArchiveSearch() {
  const searchInput = document.getElementById('archiveSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', renderFilteredArchives);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  loadArchives();
  setupArchiveSearch();
});

function toggleDrawerWidth() {
  const drawer = document.getElementById('archiveDrawer');
  const resizeBtn = document.getElementById('btnResizeDrawer');
  if (!drawer) return;

  drawer.classList.toggle('wide-mode');
  if (drawer.classList.contains('wide-mode')) {
    if (resizeBtn) resizeBtn.innerHTML = '▶ ย่อ';
  } else {
    if (resizeBtn) resizeBtn.innerHTML = '◀ ขยาย';
  }
}

// ===============================================================
// ระบบดึงข้อมูลและตรวจจับหนังซ้ำสำหรับแอดมิน (เฉพาะ Localhost เท่านั้น)
// ===============================================================
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

function showAdminToast(message, type = 'success') {
  let toast = document.getElementById('adminToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'adminToast';
    document.body.appendChild(toast);
  }
  toast.className = `admin-toast ${type} show`;
  toast.innerHTML = message;
  setTimeout(() => {
    toast.classList.remove('show');
  }, 4000);
}

function checkDuplicateInArchive(newTitle, newUrl) {
  if (!archivesData || archivesData.length === 0) return null;

  const extractYear = (str) => {
    const match = str.match(/(?:25\d{2}|19\d{2}|20\d{2})/);
    return match ? match[0] : null;
  };

  const newYear = extractYear(newTitle);
  const cleanNewTitle = newTitle.replace(/[^\u0E00-\u0E7Fa-zA-Z0-9]/g, '').toLowerCase();

  for (let item of archivesData) {
    if (item.url && newUrl && item.url.trim() === newUrl.trim()) {
      return { isDup: true, reason: 'ลิงก์ URL ตรงกับเรื่องที่มีอยู่แล้ว', existing: item.title };
    }

    const itemYear = extractYear(item.title);
    const cleanItemTitle = item.title.replace(/[^\u0E00-\u0E7Fa-zA-Z0-9]/g, '').toLowerCase();

    if (cleanNewTitle.includes(cleanItemTitle) || cleanItemTitle.includes(cleanNewTitle)) {
      if (newYear && itemYear && newYear !== itemYear) {
        continue; 
      }
      return { isDup: true, reason: `ชื่อซ้ำกับเรื่อง [${item.title}]`, existing: item.title };
    }
  }

  return null;
}

function copyForArchive(title, category, specs, source, url) {
  const dupCheck = checkDuplicateInArchive(title, url);
  if (dupCheck) {
    showAdminToast(`⛔ <b>ตรวจพบหนังซ้ำในกรุ!</b><br>${dupCheck.reason}<br>❌ ระบบล็อกไว้ ไม่ต้องคัดลอกซ้ำ`, 'error');
    return;
  }

  let defaultChoice = "1";
  if (category === "หนังต่างประเทศ") defaultChoice = "2";
  else if (category === "อนิเมะ") defaultChoice = "3";
  else if (category === "สารคดี") defaultChoice = "4";

  const catInput = prompt(
    `เลือกหมวดหมู่สำหรับ Archive:\n` +
    `  [1 หรือ T / ะ] หนังไทย\n` +
    `  [2 หรือ I / ร] หนังต่างประเทศ\n` +
    `  [3 หรือ A / ฟ] อนิเมะ / การ์ตูน\n` +
    `  [4 หรือ D / ก] สารคดีสำรวจโลก\n` +
    `(ระบบตั้งค่าตามการ์ดให้แล้ว เคาะ Enter หรือเปลี่ยนได้ทันที):`, 
    defaultChoice
  );

  if (catInput === null) return;

  const rawInput = catInput.trim().toLowerCase();
  let finalCategory = category || "หนังไทย";

  if (["1", "t", "ะ", "ไทย"].some(k => rawInput.includes(k))) {
    finalCategory = "หนังไทย";
  } else if (["2", "i", "e", "ร", "ำ", "ต่างประเทศ", "จีน", "ฝรั่ง", "inter"].some(k => rawInput.includes(k))) {
    finalCategory = "หนังต่างประเทศ";
  } else if (["3", "a", "c", "ฟ", "แ", "อนิเมะ", "การ์ตูน", "anime"].some(k => rawInput.includes(k))) {
    finalCategory = "อนิเมะ";
  } else if (["4", "d", "ก", "สารคดี", "doc"].some(k => rawInput.includes(k))) {
    finalCategory = "สารคดี";
  } else if (rawInput !== "") {
    finalCategory = catInput.trim();
  }

  const yearMatch = title.match(/(?:25\d{2}|19\d{2}|20\d{2})/);
  const detectedYear = yearMatch ? yearMatch[0] : "";

  const archiveItem = {
    "title": title.trim(),
    "year": detectedYear,
    "category": finalCategory,
    "specs": specs || "HD • พากย์ไทย",
    "source": source || "YouTube",
    "url": url.trim()
  };

  const jsonString = JSON.stringify(archiveItem, null, 2) + ",\n";

  navigator.clipboard.writeText(jsonString).then(() => {
    showAdminToast(`✅ <b>คัดลอกลง Archive สำเร็จ!</b><br>หมวด: [${finalCategory}] • สลับไป Eclipse วางต่อท้ายได้ทันที`, 'success');
  }).catch(err => {
    showAdminToast(`❌ ไม่สามารถคัดลอกได้: ${err}`, 'error');
  });
}

function copyForMovieSlot(title, poster, duration, source, url) {
  const currentCount = allMovies ? allMovies.length : 32;
  const nextSlot = currentCount + 1;

  const slotNumber = prompt(
    `ระบุหมายเลขสล็อตสำหรับ movies.json:\n` +
    `- พิมพ์ 1 ถึง ${currentCount} เพื่อ 'แทนที่การ์ดเดิม'\n` +
    `- หรือพิมพ์ ${nextSlot} (หรือมากกว่า) เพื่อ 'เพิ่มต่อท้ายแบบไม่จำกัด'`, 
    nextSlot
  );
  
  if (!slotNumber) return;

  const cleanId = 'movie-' + Date.now().toString().slice(-4);
  let btnClass = "btn-youtube";
  let platformLabel = `▶ ดูฟรีเต็มเรื่อง (${source || 'YouTube'})`;
  if (source && source.toLowerCase().includes("bilibili")) {
    btnClass = "btn-bilibili";
    platformLabel = "▶ ดูฟรีบน Bilibili";
  }

  const realMovieItem = {
    "id": cleanId,
    "title": title.trim(),
    "starting_price": "ดูฟรี 0 บ.",
    "poster": poster || "logo.png",
    "categories": ["ดูฟรี", source || "YouTube"],
    "specs": {
      "resolution": duration || "1080p Full HD",
      "audio": "🎙️ พากย์ไทย / บรรยายไทย"
    },
    "synopsis": `ภาพยนตร์เรื่อง ${title.trim()} สตรีมมิ่งฟรีถูกลิขสิทธิ์ รับชมความบันเทิงคมชัดระดับมาสเตอร์`,
    "pricing_tiers": [
      {
        "label": platformLabel,
        "price": "ฟรี 0 บ.",
        "class": btnClass,
        "url": url.trim()
      }
    ]
  };

  const jsonString = JSON.stringify(realMovieItem, null, 2) + ",\n";

  navigator.clipboard.writeText(jsonString).then(() => {
    showAdminToast(`⭐ <b>คัดลอก Movie สำเร็จ!</b><br>เปิด movies.json วางต่อท้ายได้ทันที (ระบบยืดหยุ่นไม่จำกัด)`, 'success');
  }).catch(err => {
    showAdminToast(`❌ ไม่สามารถคัดลอกได้: ${err}`, 'error');
  });
}

function toggleDropdown(menuId, event) {
  if (event) event.stopPropagation();
  const targetMenu = document.getElementById(menuId);
  const allMenus = document.querySelectorAll('.dropdown-menu');
  
  allMenus.forEach(menu => {
    if (menu !== targetMenu) menu.classList.remove('show');
  });

  if (targetMenu) {
    targetMenu.classList.toggle('show');
  }
}

window.addEventListener('click', () => {
  document.querySelectorAll('.dropdown-menu').forEach(menu => {
    menu.classList.remove('show');
  });
});

function setupDropdownLinks() {
  if (!affiliateList || affiliateList.length === 0) return;

  affiliateList.forEach(item => {
    const el = document.getElementById(item.id);
    if (el) {
      el.href = item.url || item.fallbackUrl || '#';
      if (item.title) el.title = item.title;
    }
  });
}

// =========================================================================
// 🤖 สร้างสารบัญ Semantic SEO ท้ายเว็บอัตโนมัติจาก archives.json
// =========================================================================
function buildSemanticSeoDirectory(items) {
  const hub = document.getElementById('seoDirectoryHub');
  if (!hub || !items || items.length === 0) return;

  const categories = {
    'หนังไทย': [],
    'หนังต่างประเทศ': [],
    'สารคดี': [],
    'อนิเมะ': []
  };

  items.forEach(item => {
    const cat = item.category || '';
    if (cat.includes('ไทย')) categories['หนังไทย'].push(item);
    else if (cat.includes('ต่างประเทศ')) categories['หนังต่างประเทศ'].push(item);
    else if (cat.includes('สารคดี')) categories['สารคดี'].push(item);
    else if (cat.includes('อนิเมะ') || cat.includes('การ์ตูน')) categories['อนิเมะ'].push(item);
    else categories['หนังต่างประเทศ'].push(item);
  });

  const catMeta = [
    { key: 'หนังไทย', label: '🎬 หนังไทยคลาสสิก & ยุค 90s' },
    { key: 'หนังต่างประเทศ', label: '🌐 ภาพยนตร์ต่างประเทศ & แอ็กชัน' },
    { key: 'สารคดี', label: '🌍 สารคดีสำรวจโลก & ธรรมชาติ' },
    { key: 'อนิเมะ', label: '⚡ การ์ตูน & อนิเมะลิขสิทธิ์แท้' }
  ];

  let gridHtml = '';
  catMeta.forEach(m => {
    const list = categories[m.key];
    if (list && list.length > 0) {
      gridHtml += `
        <article class="seo-category-block">
          <h3>${m.label}</h3>
          <ul>
            ${list.slice(0, 10).map(movie => `
              <li>
                <a href="${movie.url}" target="_blank" rel="noopener">
                  ${escapeHtml(movie.title)}
                </a>
              </li>
            `).join('')}
          </ul>
        </article>
      `;
    }
  });

  hub.innerHTML = `
    <header class="seo-header">
      <h2 id="seo-heading">📂 สารบัญคลังภาพยนตร์ สารคดี และสื่อบันเทิงถูกลิขสิทธิ์</h2>
      <p>ศูนย์รวมพิกัดภาพยนตร์ไทยประวัติศาสตร์ ภาพยนตร์ต่างประเทศ สารคดีสำรวจโลก และอนิเมะลิขสิทธิ์ทางการ</p>
    </header>
    <div class="seo-grid">
      ${gridHtml}
    </div>
  `;
}

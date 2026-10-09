const fs = require('fs');
const path = require('path');

const CACHE_FILE = path.join(__dirname, '../radar-cache.json');
const WORKER_BASE = 'https://lny-movie-radar.naca-doy2.workers.dev/?q=';
const MIN_ITEMS = 60;
const MAX_ITEMS = 100;

// คำค้นหาตรงตามที่เขียนไว้ใน app.js เป๊ะๆ
const CATEGORY_MAP = {
  'ดูฟรี': 'หนังเต็มเรื่อง ดูฟรี',
  'สารคดี': 'สารคดีสำรวจโลก',
  'หนังไทย': 'อมตะหนังไทยยุค 90',
  'หนังสงคราม': 'หนังสงครามพากย์ไทย',
  'อนิเมะ': 'หนังการ์ตูน'
};

// ดึง YouTube Video ID
function extractVideoId(item) {
  if (!item) return null;
  if (item.id && typeof item.id === 'string' && item.id.length === 11) return item.id;
  if (item.videoId) return item.videoId;
  
  const targetUrl = item.url || (item.sources && item.sources[0]?.url) || '';
  const match = targetUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : (item.id || null);
}

// ตรวจสอบลิงก์ oEmbed
async function checkLinkAlive(videoId) {
  if (!videoId) return false;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    clearTimeout(timeoutId);
    return res.status === 200;
  } catch (e) {
    // กรณีเน็ต GitHub หน่วง อนุโลมให้ผ่านเพื่อไม่ให้หนังหลุดหาย
    return true;
  }
}

async function runCuration() {
  let db = { updated_at: new Date().toISOString(), categories: {} };

  if (fs.existsSync(CACHE_FILE)) {
    try {
      db = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    } catch (e) {}
  }

  for (const [catKey, query] of Object.entries(CATEGORY_MAP)) {
    console.log(`\n========================================`);
    console.log(`🔍 กำลังดึงหมวด [${catKey}] ด้วยคำค้น: "${query}"`);

    const currentQueue = (db.categories && db.categories[catKey]) || [];

    // 1. ตรวจลิงก์เดิมในตู้
    const aliveOldItems = [];
    for (const item of currentQueue) {
      const vId = extractVideoId(item);
      if (await checkLinkAlive(vId)) {
        aliveOldItems.push(item);
      }
    }

    // 2. ดึงผ่าน Worker พร้อมส่ง Header แบบเบราว์เซอร์
    let fetchedItems = [];
    try {
      const res = await fetch(`${WORKER_BASE}${encodeURIComponent(query)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json'
        }
      });
      
      if (res.ok) {
        const raw = await res.json();
        fetchedItems = Array.isArray(raw) ? raw : (raw.results || raw.movies || []);
        console.log(`📥 ได้รับของสดจาก Worker: ${fetchedItems.length} เรื่อง`);
      } else {
        console.warn(`Worker ตอบกลับด้วยรหัส: ${res.status}`);
      }
    } catch (err) {
      console.error(`ยิง Worker ล้มเหลว:`, err.message);
    }

    // 3. ปรับโครงสร้างให้อยู่ในฟอร์แมตมาตรฐานของ LNY Movie Radar
    const existingIds = new Set(aliveOldItems.map(m => extractVideoId(m)).filter(Boolean));
    const uniqueNewItems = [];

    for (const item of fetchedItems) {
      const vId = extractVideoId(item);
      if (vId && !existingIds.has(vId)) {
        const fullWatchUrl = item.url || `https://www.youtube.com/watch?v=${vId}`;
        const posterUrl = item.poster || `https://img.youtube.com/vi/${vId}/hqdefault.jpg`;

        // สร้าง Object ให้ตรงตามที่ renderMovies() ใน app.js ใช้อย่างสมบูรณ์
        const formatted = {
          id: `yt-${vId}`,
          title: item.title || 'ภาพยนตร์ YouTube',
          poster: posterUrl,
          duration: item.duration || 'เต็มเรื่อง',
          starting_price: 'ดูฟรี 0 บ.',
          categories: [catKey, 'ดูฟรี', 'YouTube'],
          specs: {
            resolution: item.specs?.resolution || 'HD',
            audio: 'พากย์ไทย'
          },
          sources: [
            {
              label: '▶ ดูฟรีบน YouTube',
              url: fullWatchUrl,
              class: 'btn-youtube'
            }
          ]
        };

        uniqueNewItems.push(formatted);
        existingIds.add(vId);
      }
    }

    console.log(`✨ ของใหม่ที่ผ่านเกณฑ์: ${uniqueNewItems.length} เรื่อง`);

    // 4. ผสานแบบ Min 60 - Max 100
    const mergedList = [...uniqueNewItems, ...aliveOldItems];
    let finalCategoryList = [];

    if (mergedList.length <= MIN_ITEMS) {
      finalCategoryList = mergedList;
    } else {
      const base60 = mergedList.slice(0, MIN_ITEMS);
      const buffer = mergedList.slice(MIN_ITEMS, MAX_ITEMS);
      finalCategoryList = [...base60, ...buffer];
    }

    if (!db.categories) db.categories = {};
    db.categories[catKey] = finalCategoryList;
    console.log(`📊 รวมในตู้ [${catKey}]: ${finalCategoryList.length} เรื่อง`);
  }

  db.updated_at = new Date().toISOString();
  fs.writeFileSync(CACHE_FILE, JSON.stringify(db, null, 2), 'utf8');
  console.log('\n🎉 บันทึกตู้เอกสาร radar-cache.json สำเร็จเรียบร้อย');
}

runCuration();

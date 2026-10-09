const fs = require('fs');
const path = require('path');

const CACHE_FILE = path.join(__dirname, '../radar-cache.json');
const WORKER_BASE = 'https://lny-movie-radar.naca-doy2.workers.dev?q=';
const MIN_ITEMS = 60;
const MAX_ITEMS = 100;

// คีย์เวิร์ดตรงกับ data-category บนหน้าเว็บ
const CATEGORY_MAP = {
  'ดูฟรี': 'หนังเต็มเรื่อง พากย์ไทย',
  'สารคดี': 'สารคดีสำรวจโลก พากย์ไทย',
  'หนังไทย': 'อมตะหนังไทยยุค 90 เต็มเรื่อง',
  'หนังสงคราม': 'หนังสงครามเต็มเรื่อง พากย์ไทย',
  'อนิเมะ': 'หนังการ์ตูนเต็มเรื่อง พากย์ไทย'
};

// ตรวจสอบคลิปตายด้วย YouTube oEmbed
async function checkLinkAlive(videoId) {
  if (!videoId) return false;
  try {
    const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    return res.status === 200;
  } catch (e) {
    return false;
  }
}

async function runCuration() {
  let db = { updated_at: new Date().toISOString(), categories: {} };

  if (fs.existsSync(CACHE_FILE)) {
    try {
      db = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    } catch (e) {
      console.warn('⚠️ อ่านไฟล์เดิมไม่ได้ เริ่มต้นตู้ใหม่');
    }
  }

  for (const [catKey, query] of Object.entries(CATEGORY_MAP)) {
    console.log(`\n========================================`);
    console.log(`🔍 กำลังคัดกรองหมวด: [${catKey}]`);

    const currentQueue = (db.categories && db.categories[catKey]) || [];

    // 1. ตรวจลิงก์ตายของเดิมในตู้
    const aliveOldItems = [];
    for (const item of currentQueue) {
      const vId = item.id || (item.sources && item.sources[0]?.url?.match(/v=([^&]+)/)?.[1]);
      const isAlive = await checkLinkAlive(vId);
      if (isAlive) {
        aliveOldItems.push(item);
      } else {
        console.log(`❌ ลบคลิปตาย: ${item.title || vId}`);
      }
    }

    // 2. ดึงของใหม่ผ่าน Worker
    let fetchedItems = [];
    try {
      const res = await fetch(`${WORKER_BASE}${encodeURIComponent(query)}`);
      if (res.ok) fetchedItems = await res.json();
    } catch (err) {
      console.error(`ยิง Worker หมวด ${catKey} ล้มเหลว:`, err.message);
    }

    // 3. กรองเรื่องใหม่ที่ไม่ซ้ำ
    const existingKeys = new Set(aliveOldItems.map(m => m.id || m.title));
    const uniqueNewItems = [];

    for (const item of fetchedItems) {
      const itemKey = item.id || item.title;
      if (!existingKeys.has(itemKey)) {
        const vId = item.id || (item.sources && item.sources[0]?.url?.match(/v=([^&]+)/)?.[1]);
        const isValid = await checkLinkAlive(vId);
        if (isValid) {
          uniqueNewItems.push(item);
          existingKeys.add(itemKey);
        }
      }
    }

    // 4. กฎ Min-Max Elastic FIFO (ฐาน 60 - เพดาน 100)
    const mergedList = [...uniqueNewItems, ...aliveOldItems];
    let finalCategoryList = [];

    if (mergedList.length <= MIN_ITEMS) {
      finalCategoryList = mergedList;
    } else {
      const base60 = mergedList.slice(0, MIN_ITEMS);
      const bufferTail = mergedList.slice(MIN_ITEMS, MAX_ITEMS);
      finalCategoryList = [...base60, ...bufferTail];
    }

    if (!db.categories) db.categories = {};
    db.categories[catKey] = finalCategoryList;

    console.log(`✅ หมวด [${catKey}] พร้อมใช้งาน: ${finalCategoryList.length} เรื่อง`);
  }

  db.updated_at = new Date().toISOString();
  fs.writeFileSync(CACHE_FILE, JSON.stringify(db, null, 2), 'utf8');
  console.log('\n🎉 อัปเดตตู้เอกสาร radar-cache.json เรียบร้อย');
}

runCuration();

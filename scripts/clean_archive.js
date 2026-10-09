const fs = require('fs');
const path = require('path');
const https = require('https');

// 1. อ่านไฟล์ archives.json
const jsonPath = path.join(__dirname, '../archives.json');
let archives = [];

try {
  const rawData = fs.readFileSync(jsonPath, 'utf8');
  archives = JSON.parse(rawData);
} catch (err) {
  console.error('❌ ไม่พบไฟล์ archives.json:', err.message);
  process.exit(1);
}

// 2. ดึง YouTube Video ID
function extractVideoId(rawUrl) {
  const url = (rawUrl || '').trim();
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : null;
}

// 3. ฟังก์ชันตรวจสอบสถานะคลิปหนัง (ใช้ oEmbed ของ YouTube)
function checkVideoStatus(rawUrl) {
  return new Promise((resolve) => {
    const vId = extractVideoId(rawUrl);

    if (!vId) {
      // กรณีไม่ใช่ลิงก์ YouTube หรือลิงก์ว่างเปล่า
      return resolve({ isDead: true, reason: 'รูปแบบลิงก์ไม่ถูกต้อง' });
    }

    const checkUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${vId}&format=json`;

    const req = https.get(checkUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      // 404 หรือ 401 แปลว่าคลิปโดนลบ / ติด LC / เป็น Private ชัวร์ว่าตาย
      if (res.statusCode === 404 || res.statusCode === 401) {
        return resolve({ isDead: true, reason: `คลิปถูกลบหรือระงับ (HTTP ${res.statusCode})` });
      }
      resolve({ isDead: false });
    });

    req.on('error', () => {
      // กรณีสัญญาณสะดุด ให้ถือว่ายังไม่ตายเพื่อความปลอดภัย ไม่ลบสุ่มสี่สุ่มห้า
      resolve({ isDead: false });
    });

    req.setTimeout(8000, () => {
      req.abort();
      resolve({ isDead: false });
    });
  });
}

// 4. ฟังก์ชันส่งข้อความเข้า LINE (แกนเดิมของคุณ 100%)
function pushLineMessage(textMessage) {
  const channelToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const userId = process.env.LINE_USER_ID;

  if (!channelToken || !userId) {
    console.warn('⚠️ ข้ามส่ง LINE: ไม่มี Secret Keys');
    return Promise.resolve();
  }

  const postData = JSON.stringify({
    to: userId,
    messages: [{ type: 'text', text: textMessage }]
  });

  const options = {
    hostname: 'api.line.me',
    path: '/v2/bot/message/push',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${channelToken}`,
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      console.log(`📡 ส่ง LINE สำเร็จ (Status: ${res.statusCode})`);
      resolve();
    });
    req.on('error', (e) => {
      console.error('❌ ส่ง LINE ล้มเหลว:', e.message);
      resolve();
    });
    req.write(postData);
    req.end();
  });
}

// 5. รันระบบตรวจและคัดลิงก์ตายออกจาก archives.json
async function run() {
  console.log(`🔍 [LNY Archive Cleaner] กำลังตรวจสอบคลัง ${archives.length} เรื่อง...`);

  const aliveList = [];
  const deadList = [];

  for (const item of archives) {
    const title = item.title || 'ไม่ระบุชื่อ';
    const res = await checkVideoStatus(item.url);

    if (res.isDead) {
      deadList.push({ title: title, url: item.url, reason: res.reason });
    } else {
      aliveList.push(item);
    }

    // เว้นระยะเล็กน้อย 60ms ป้องกันการยิงคำขอถี่เกินไป
    await new Promise(r => setTimeout(r, 60));
  }

  // หากพบคลิปตาย ให้บันทึกตัดออกจาก archives.json และแจ้งเตือน LINE
  if (deadList.length > 0) {
    fs.writeFileSync(jsonPath, JSON.stringify(aliveList, null, 2), 'utf8');
    console.log(`🧹 ตัดคลิปตายออกแล้ว: ${deadList.length} เรื่อง (คงเหลือในคลัง: ${aliveList.length} เรื่อง)`);

    let msg = `🚨 [LNY Movie Radar] รายงานตัดคลิปตาย\n` +
              `ตรวจพบคลิปบินในคลัง Archive และตัดออกแล้ว ${deadList.length} เรื่อง:\n\n`;

    deadList.forEach((d, i) => {
      msg += `${i + 1}. ${d.title}\n• สาเหตุ: ${d.reason}\n\n`;
    });

    msg += `📦 คลัง archives.json คงเหลือเรื่องสมบูรณ์: ${aliveList.length} เรื่อง`;
    await pushLineMessage(msg);
  } else {
    console.log(`✨ คลังสมบูรณ์ 100%: ไม่พบคลิปตายจากทั้งหมด ${archives.length} เรื่อง`);
  }
}

run();

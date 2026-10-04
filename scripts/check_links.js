const fs = require('fs');
const path = require('path');
const https = require('https');

// อ่าน affiliates.json ของ Movie Radar (ถอย 1 ชั้นจาก scripts ไปหน้าหลัก)
const jsonPath = path.join(__dirname, '../affiliates.json');
let linkMap = {};

try {
    const rawData = fs.readFileSync(jsonPath, 'utf8');
    linkMap = JSON.parse(rawData);
} catch (err) {
    console.error('❌ ไม่พบไฟล์ affiliates.json:', err.message);
    process.exit(1);
}

function checkUrl(url) {
    return new Promise((resolve) => {
        if (!url || url === '#' || !url.startsWith('http')) {
            return resolve({ status: 0, isDead: true, reason: 'URL ว่างหรือไม่ถูกต้อง' });
        }

        const client = url.startsWith('https') ? https : require('http');
        const req = client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
            const statusCode = res.statusCode;
            const redirectUrl = res.headers.location || '';

            if (statusCode >= 400) {
                return resolve({ status: statusCode, isDead: true, reason: `HTTP ${statusCode}` });
            }

            const lower = redirectUrl.toLowerCase();
            if (lower.includes('campaign_ended') || lower.includes('closed') || lower.includes('expired')) {
                return resolve({ status: statusCode, isDead: true, reason: 'แคมเปญหมดอายุ (Redirected)' });
            }

            resolve({ status: statusCode, isDead: false });
        });

        req.on('error', (e) => resolve({ status: 0, isDead: true, reason: e.message }));
        req.setTimeout(10000, () => {
            req.abort();
            resolve({ status: 408, isDead: true, reason: 'Request Timeout' });
        });
    });
}

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
            console.log(`📡 ส่ง LINE สำเร็จ: ${res.statusCode}`);
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

async function run() {
    const keys = Object.keys(linkMap);
    console.log(`🔍 [LNY Movie Radar] สแกน ${keys.length} รายการ...`);
    const deadItems = [];

    for (const key of keys) {
        const url = linkMap[key];
        const res = await checkUrl(url);
        if (res.isDead) {
            deadItems.push({ title: key, link: url, reason: res.reason });
        }
    }

    if (deadItems.length > 0) {
        let msg = `⚠️ [LNY Movie Radar] พบลิงก์เสีย (${deadItems.length} รายการ)\n\n`;
        deadItems.forEach((d, i) => {
            msg += `${i + 1}. ${d.title}\n• ลิงก์: ${d.link}\n• สาเหตุ: ${d.reason}\n\n`;
        });
        msg += `💡 นำลิงก์ใหม่มาแก้ใน affiliates.json ได้เลยครับ`;
        await pushLineMessage(msg);
    } else {
        const heartbeatMsg = `🟢 [LNY Movie Radar]\n📅 รายงานเช้าวันจันทร์: ${keys.length} รายการ\n✨ ลิงก์สมบูรณ์พร้อมรับเงินครับ!`;
        await pushLineMessage(heartbeatMsg);
    }
}

run();

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// 1. อ่านไฟล์ affiliates.json
const jsonPath = path.join(__dirname, '../affiliates.json');
let affiliates = [];

try {
    const rawData = fs.readFileSync(jsonPath, 'utf8');
    affiliates = JSON.parse(rawData);
} catch (err) {
    console.error('❌ ไม่พบไฟล์ affiliates.json:', err.message);
    process.exit(1);
}

// 2. ฟังก์ชันตรวจสอบ URL
function checkUrl(rawUrl) {
    return new Promise((resolve) => {
        const url = (rawUrl || '').trim();

        // ตรวจสอบค่าว่าง หรือไม่ได้ขึ้นต้นด้วย http
        if (!url || url === '#' || !url.startsWith('http')) {
            return resolve({ status: 0, isDead: true, reason: 'URL ว่าง หรือยังไม่ได้ใส่ลิงก์' });
        }

        try {
            const client = url.startsWith('https') ? https : http;
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
        } catch (err) {
            resolve({ status: 0, isDead: true, reason: 'รูปแบบ URL ไม่ถูกต้อง' });
        }
    });
}

// 3. ฟังก์ชันส่งข้อความเข้า LINE
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

// 4. เริ่มประมวลผล
async function run() {
    console.log(`🔍 [LNY Movie Radar] สแกน ${affiliates.length} รายการ...`);
    const deadItems = [];

    for (const item of affiliates) {
        const title = item.title || item.id || 'ไม่ระบุชื่อ';
        const url = item.url;
        
        const res = await checkUrl(url);
        if (res.isDead) {
            deadItems.push({ title: title, link: url || '(ไม่มี URL)', reason: res.reason });
        }
    }

    if (deadItems.length > 0) {
        let msg = `⚠️ [LNY Movie Radar] พบรายการที่ต้องตรวจสอบ (${deadItems.length}/${affiliates.length} รายการ)\n\n`;
        deadItems.forEach((d, i) => {
            msg += `${i + 1}. ${d.title}\n• ลิงก์: ${d.link}\n• สาเหตุ: ${d.reason}\n\n`;
        });
        msg += `💡 สามารถอัปเดตลิงก์ใหม่ใน affiliates.json ได้เลยครับ`;
        await pushLineMessage(msg);
    } else {
        const heartbeatMsg = `🟢 [LNY Movie Radar]\n📅 ตรวจสอบสถานะ: ปกติ (${affiliates.length} รายการ)\n✨ ทุกลิงก์สมบูรณ์พร้อมรับเงินครับ!`;
        await pushLineMessage(heartbeatMsg);
    }
}

run();

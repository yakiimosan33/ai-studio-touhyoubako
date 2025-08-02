export default async function handler(req, res) {
    // CORS設定
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        // 締切日時 (日本時間 2025年8月24日 23:50)
        const deadline = new Date('2025-08-24T23:50:00+09:00');
        const now = new Date();
        
        const isExpired = now > deadline;
        const timeRemaining = deadline.getTime() - now.getTime();
        
        res.status(200).json({
            deadline: deadline.toISOString(),
            now: now.toISOString(),
            isExpired: isExpired,
            timeRemaining: Math.max(0, timeRemaining)
        });
        
    } catch (error) {
        console.error('締切チェックエラー:', error);
        res.status(500).json({ error: '締切情報の取得中にエラーが発生しました' });
    }
}
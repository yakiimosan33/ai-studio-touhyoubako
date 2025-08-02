const { Client } = require('@notionhq/client');

export default async function handler(req, res) {
    // CORS設定
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({ error: 'ユーザーIDが必要です' });
        }
        
        // 環境変数の確認
        if (!process.env.NOTION_TOKEN || !process.env.NOTION_DATABASE_ID) {
            return res.status(500).json({ error: 'Notion APIの設定が不完全です' });
        }
        
        // Notion API初期化
        const notion = new Client({
            auth: process.env.NOTION_TOKEN,
        });
        
        // 既存の投票をチェック
        const response = await notion.databases.query({
            database_id: process.env.NOTION_DATABASE_ID,
            filter: {
                property: "投票者ID",
                title: {
                    equals: userId
                }
            }
        });
        
        const hasVoted = response.results.length > 0;
        
        res.status(200).json({
            hasVoted: hasVoted,
            voteCount: response.results.length
        });
        
    } catch (error) {
        console.error('投票チェックエラー:', error);
        res.status(500).json({ error: '投票状況の確認中にエラーが発生しました' });
    }
}
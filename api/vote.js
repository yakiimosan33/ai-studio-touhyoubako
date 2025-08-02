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
        const { votes, timestamp } = req.body;
        
        // バリデーション
        if (!votes || !Array.isArray(votes) || votes.length === 0) {
            return res.status(400).json({ error: '投票データが無効です' });
        }
        
        if (votes.length > 2) {
            return res.status(400).json({ error: '投票は2票までです' });
        }
        
        // 環境変数の確認
        if (!process.env.NOTION_TOKEN || !process.env.NOTION_DATABASE_ID) {
            return res.status(500).json({ error: 'Notion APIの設定が不完全です' });
        }
        
        // Notion API初期化
        const notion = new Client({
            auth: process.env.NOTION_TOKEN,
        });
        
        // 投票データを作成
        const voteThemes = votes.map(voteId => {
            switch(voteId) {
                case 1: return "AIショート動画制作チーム";
                case 2: return "Difyでアプリ開発";
                case 3: return "メルマガ制作AIチーム";
                case 4: return "続！バイブコーディング！";
                case 5: return "sunoで収益化！";
                default: return "";
            }
        }).filter(theme => theme !== "");
        
        // Notionデータベースに追加
        const response = await notion.pages.create({
            parent: {
                database_id: process.env.NOTION_DATABASE_ID
            },
            properties: {
                "投票者ID": {
                    title: [{
                        text: {
                            content: `User_${Date.now()}`
                        }
                    }]
                },
                "投票テーマ": {
                    multi_select: voteThemes.map(theme => ({ name: theme }))
                },
                "投票日時": {
                    date: {
                        start: timestamp
                    }
                },
                "投票数": {
                    number: votes.length
                }
            }
        });
        
        res.status(200).json({ success: true, id: response.id });
        
    } catch (error) {
        console.error('投票エラー:', error);
        res.status(500).json({ error: '投票の処理中にエラーが発生しました' });
    }
}
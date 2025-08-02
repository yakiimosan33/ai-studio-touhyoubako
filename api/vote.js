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
        // 締切チェック (日本時間 2025年8月24日 23:50)
        const deadline = new Date('2025-08-24T23:50:00+09:00');
        const now = new Date();
        
        if (now > deadline) {
            return res.status(400).json({ error: '投票は締切りました' });
        }
        
        const { votes, userId, timestamp } = req.body;
        
        // バリデーション
        if (!votes || !Array.isArray(votes) || votes.length === 0) {
            return res.status(400).json({ error: '投票データが無効です' });
        }
        
        if (votes.length > 2) {
            return res.status(400).json({ error: '投票は2票までです' });
        }
        
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
        const existingVotes = await notion.databases.query({
            database_id: process.env.NOTION_DATABASE_ID,
            filter: {
                property: "投票者ID",
                title: {
                    equals: userId
                }
            }
        });
        
        if (existingVotes.results.length > 0) {
            return res.status(400).json({ error: 'すでに投票済みです' });
        }
        
        // 各投票を別々のレコードとして保存
        const promises = votes.map(async (voteId, index) => {
            const voteTheme = (() => {
                switch(voteId) {
                    case 1: return "AIショート動画制作チーム";
                    case 2: return "Difyでアプリ開発";
                    case 3: return "メルマガ制作AIチーム";
                    case 4: return "続！バイブコーディング！";
                    case 5: return "sunoで収益化！";
                    default: return "";
                }
            })();
            
            if (voteTheme === "") return null;
            
            return await notion.pages.create({
                parent: {
                    database_id: process.env.NOTION_DATABASE_ID
                },
                properties: {
                    "投票者ID": {
                        title: [{
                            text: {
                                content: userId
                            }
                        }]
                    },
                    "投票テーマ": {
                        multi_select: [{ name: voteTheme }]
                    },
                    "投票日時": {
                        date: {
                            start: timestamp
                        }
                    },
                    "投票数": {
                        number: 1
                    }
                }
            });
        });
        
        // 全ての投票を並行して処理
        const responses = await Promise.all(promises.filter(p => p !== null));
        
        res.status(200).json({ 
            success: true, 
            count: responses.length,
            ids: responses.map(r => r.id)
        });
        
    } catch (error) {
        console.error('投票エラー:', error);
        res.status(500).json({ error: '投票の処理中にエラーが発生しました' });
    }
}
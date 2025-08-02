const express = require('express');
const cors = require('cors');
const { Client } = require('@notionhq/client');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Notion API初期化
const notion = new Client({
    auth: process.env.NOTION_TOKEN,
});

const databaseId = process.env.NOTION_DATABASE_ID;

// ミドルウェア
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// 投票エンドポイント
app.post('/api/vote', async (req, res) => {
    try {
        const { votes, timestamp } = req.body;
        
        if (!votes || !Array.isArray(votes) || votes.length === 0) {
            return res.status(400).json({ error: '投票データが無効です' });
        }
        
        if (votes.length > 2) {
            return res.status(400).json({ error: '投票は2票までです' });
        }
        
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
                database_id: databaseId
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
        
        res.json({ success: true, id: response.id });
        
    } catch (error) {
        console.error('投票エラー:', error);
        res.status(500).json({ error: '投票の処理中にエラーが発生しました' });
    }
});

// サーバー起動
app.listen(PORT, () => {
    console.log(`サーバーが起動しました: http://localhost:${PORT}`);
});
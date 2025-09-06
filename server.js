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
        const { votes, userId, timestamp } = req.body;
        
        if (!votes || !Array.isArray(votes) || votes.length === 0) {
            return res.status(400).json({ error: '投票データが無効です' });
        }
        
        if (votes.length > 2) {
            return res.status(400).json({ error: '投票は2票までです' });
        }
        
        // データベースIDを確認
        console.log('Database ID:', databaseId);
        
        // 投票データを作成
        const voteThemes = votes.map(voteId => {
            switch(voteId) {
                case 1: return "AI音楽アーティスト制作";
                case 2: return "Difyでアプリ開発";
                case 3: return "タスク管理をAIで効率化";
                case 4: return "バイブコーディングその３";
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
                            content: userId || `User_${Date.now()}`
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
        console.error('エラー詳細:', error.message);
        console.error('送信データ:', { votes, timestamp, voteThemes });
        
        // Notionのエラーメッセージをクライアントに返す
        if (error.message) {
            res.status(500).json({ error: error.message });
        } else {
            res.status(500).json({ error: '投票の処理中にエラーが発生しました' });
        }
    }
});

// 投票結果取得エンドポイント
app.get('/api/results', async (req, res) => {
    try {
        // Notionデータベースから全ての投票データを取得
        const response = await notion.databases.query({
            database_id: databaseId,
        });
        
        // 各テーマの投票数を集計
        const themeCounts = {
            "AI音楽アーティスト制作": 0,
            "Difyでアプリ開発": 0,
            "タスク管理をAIで効率化": 0,
            "バイブコーディングその３": 0
        };
        
        let totalVotes = 0;
        const voters = new Set();
        
        response.results.forEach(page => {
            // 投票者IDを記録
            const voterId = page.properties["投票者ID"]?.title[0]?.text?.content;
            if (voterId) {
                voters.add(voterId);
            }
            
            // 投票テーマを取得
            const voteThemes = page.properties["投票テーマ"]?.multi_select || [];
            
            voteThemes.forEach(theme => {
                if (themeCounts.hasOwnProperty(theme.name)) {
                    themeCounts[theme.name]++;
                    totalVotes++;
                }
            });
        });
        
        // 結果を配列形式に変換
        const results = Object.entries(themeCounts).map(([theme, votes], index) => {
            const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
            return {
                id: index + 1,
                theme: theme,
                votes: votes,
                percentage: percentage
            };
        });
        
        // 投票数順にソート
        results.sort((a, b) => b.votes - a.votes);
        
        res.json({
            success: true,
            results: results,
            totalVotes: totalVotes,
            totalVoters: voters.size
        });
        
    } catch (error) {
        console.error('結果取得エラー:', error);
        res.status(500).json({ 
            success: false, 
            error: '結果の取得に失敗しました' 
        });
    }
});

// 投票締切チェックエンドポイント
app.get('/api/deadline', (req, res) => {
    try {
        // 投票締切日時: 2025年9月24日 23:50 JST
        const deadline = new Date('2025-09-24T23:50:00+09:00');
        const now = new Date();
        
        const timeRemaining = deadline.getTime() - now.getTime();
        const isExpired = timeRemaining <= 0;
        
        res.json({
            isExpired: isExpired,
            timeRemaining: Math.max(0, timeRemaining),
            deadline: deadline.toISOString()
        });
        
    } catch (error) {
        console.error('締切チェックエラー:', error);
        res.status(500).json({ 
            error: '締切チェックに失敗しました' 
        });
    }
});

// 重複投票チェックエンドポイント
app.post('/api/check-vote', async (req, res) => {
    try {
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({ error: 'ユーザーIDが必要です' });
        }
        
        // Notionデータベースから該当ユーザーの投票を検索
        const response = await notion.databases.query({
            database_id: databaseId,
            filter: {
                property: "投票者ID",
                title: {
                    equals: userId
                }
            }
        });
        
        const hasVoted = response.results.length > 0;
        
        res.json({
            hasVoted: hasVoted,
            voteCount: response.results.length
        });
        
    } catch (error) {
        console.error('投票チェックエラー:', error);
        res.status(500).json({ 
            hasVoted: false,
            error: '投票状況の確認に失敗しました' 
        });
    }
});

// サーバー起動
app.listen(PORT, () => {
    console.log(`サーバーが起動しました: http://localhost:${PORT}`);
});
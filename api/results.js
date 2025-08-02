const { Client } = require('@notionhq/client');

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
        // 環境変数の確認
        if (!process.env.NOTION_TOKEN || !process.env.NOTION_DATABASE_ID) {
            return res.status(500).json({ error: 'Notion APIの設定が不完全です' });
        }
        
        // Notion API初期化
        const notion = new Client({
            auth: process.env.NOTION_TOKEN,
        });
        
        // 全ての投票データを取得
        const response = await notion.databases.query({
            database_id: process.env.NOTION_DATABASE_ID,
        });
        
        // 投票結果を集計
        const voteCounts = {};
        const themes = [
            "AIショート動画制作チーム",
            "Difyでアプリ開発", 
            "メルマガ制作AIチーム",
            "続！バイブコーディング！",
            "AI音楽アーティストにチャレンジ！"
        ];
        
        // 初期化
        themes.forEach(theme => {
            voteCounts[theme] = 0;
        });
        
        // 投票を集計
        response.results.forEach(page => {
            const voteThemeProperty = page.properties["投票テーマ"];
            if (voteThemeProperty && voteThemeProperty.multi_select) {
                voteThemeProperty.multi_select.forEach(selection => {
                    if (voteCounts.hasOwnProperty(selection.name)) {
                        voteCounts[selection.name]++;
                    }
                });
            }
        });
        
        // 総投票数を計算
        const totalVotes = Object.values(voteCounts).reduce((sum, count) => sum + count, 0);
        
        // 結果を配列形式で返す
        const results = themes.map((theme, index) => ({
            id: index + 1,
            theme: theme,
            votes: voteCounts[theme],
            percentage: totalVotes > 0 ? Math.round((voteCounts[theme] / totalVotes) * 100) : 0
        }));
        
        res.status(200).json({
            success: true,
            totalVotes: totalVotes,
            totalVoters: Math.ceil(totalVotes / 2), // 1人最大2票なので
            results: results
        });
        
    } catch (error) {
        console.error('集計エラー:', error);
        res.status(500).json({ error: '集計結果の取得中にエラーが発生しました' });
    }
}
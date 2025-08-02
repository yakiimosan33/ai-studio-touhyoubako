let selectedVotes = [];
const maxVotes = 2;
let countdownInterval;

const themes = {
    1: "AIショート動画制作チーム",
    2: "Difyでアプリ開発",
    3: "メルマガ制作AIチーム",
    4: "続！バイブコーディング！",
    5: "sunoで収益化！"
};

function updateUI() {
    const remainingVotes = maxVotes - selectedVotes.length;
    document.getElementById('remaining-votes').textContent = remainingVotes;
    
    // 全ボタンの状態を更新
    document.querySelectorAll('.vote-btn').forEach(btn => {
        const optionId = parseInt(btn.parentElement.dataset.id);
        const isSelected = selectedVotes.includes(optionId);
        
        btn.textContent = isSelected ? '投票済み' : '投票する';
        btn.disabled = isSelected || (remainingVotes === 0 && !isSelected);
        
        // 選択状態のスタイルを更新
        if (isSelected) {
            btn.parentElement.classList.add('selected');
        } else {
            btn.parentElement.classList.remove('selected');
        }
    });
    
    // 投票リストを更新
    const voteList = document.getElementById('vote-list');
    voteList.innerHTML = '';
    selectedVotes.forEach(voteId => {
        const li = document.createElement('li');
        li.textContent = `・${themes[voteId]}`;
        voteList.appendChild(li);
    });
    
    // 送信ボタンの状態を更新
    document.getElementById('submit-btn').disabled = selectedVotes.length === 0;
}

function vote(optionId) {
    const index = selectedVotes.indexOf(optionId);
    
    if (index > -1) {
        // すでに選択されている場合は削除
        selectedVotes.splice(index, 1);
    } else if (selectedVotes.length < maxVotes) {
        // まだ投票枠が残っている場合は追加
        selectedVotes.push(optionId);
    }
    
    updateUI();
}

async function submitVotes() {
    if (selectedVotes.length === 0) {
        alert('投票するテーマを選択してください');
        return;
    }
    
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = '送信中...';
    
    try {
        const response = await fetch('/api/vote', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                votes: selectedVotes,
                timestamp: new Date().toISOString()
            })
        });
        
        if (response.ok) {
            // 投票エリアを非表示
            document.getElementById('voting-area').style.display = 'none';
            // 集計結果を表示
            await showResults();
        } else {
            throw new Error('投票の送信に失敗しました');
        }
    } catch (error) {
        alert('エラーが発生しました: ' + error.message);
        submitBtn.disabled = false;
        submitBtn.textContent = '投票を送信';
    }
}

async function showResults() {
    try {
        const response = await fetch('/api/results');
        const data = await response.json();
        
        if (data.success) {
            // 結果表示エリアを作成
            const resultsHTML = `
                <div class="results-container">
                    <h2>投票結果</h2>
                    <p class="vote-summary">総投票数: ${data.totalVotes}票 / 投票者数: 約${data.totalVoters}人</p>
                    <div class="results-chart">
                        ${data.results.map(result => `
                            <div class="result-item">
                                <div class="result-header">
                                    <span class="result-theme">${result.id}. ${result.theme}</span>
                                    <span class="result-votes">${result.votes}票 (${result.percentage}%)</span>
                                </div>
                                <div class="result-bar">
                                    <div class="result-fill" style="width: ${result.percentage}%"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <p class="thank-you">投票ありがとうございました！</p>
                </div>
            `;
            
            document.getElementById('result-message').innerHTML = resultsHTML;
            document.getElementById('result-message').style.display = 'block';
        } else {
            throw new Error('結果の取得に失敗しました');
        }
    } catch (error) {
        document.getElementById('result-message').innerHTML = `
            <p>投票ありがとうございました！</p>
            <p>結果の表示にエラーが発生しました。</p>
        `;
        document.getElementById('result-message').style.display = 'block';
    }
}

async function checkDeadline() {
    try {
        const response = await fetch('/api/deadline');
        const data = await response.json();
        
        if (data.isExpired) {
            // 投票が締切られた場合
            document.getElementById('voting-area').innerHTML = `
                <div class="expired-message">
                    <h2>投票は締切りました</h2>
                    <p>投票期間: 2024年8月24日 23:50まで</p>
                </div>
            `;
            await showResults();
            return false;
        }
        
        // カウントダウンを更新
        updateCountdown(data.timeRemaining);
        return true;
    } catch (error) {
        console.error('締切チェックエラー:', error);
        return true; // エラー時は投票を継続
    }
}

function updateCountdown(timeRemaining) {
    const countdownElement = document.getElementById('countdown');
    
    if (timeRemaining <= 0) {
        countdownElement.textContent = '投票締切';
        countdownElement.style.color = '#e74c3c';
        return;
    }
    
    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
    
    let countdownText = '';
    if (days > 0) {
        countdownText = `残り ${days}日 ${hours}時間 ${minutes}分`;
    } else if (hours > 0) {
        countdownText = `残り ${hours}時間 ${minutes}分 ${seconds}秒`;
    } else {
        countdownText = `残り ${minutes}分 ${seconds}秒`;
        countdownElement.style.color = '#e74c3c'; // 1時間未満は赤色
    }
    
    countdownElement.textContent = countdownText;
}

function startCountdown() {
    // 初回チェック
    checkDeadline();
    
    // 30秒ごとにチェック
    countdownInterval = setInterval(async () => {
        const isActive = await checkDeadline();
        if (!isActive) {
            clearInterval(countdownInterval);
        }
    }, 30000);
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    updateUI();
    startCountdown();
});
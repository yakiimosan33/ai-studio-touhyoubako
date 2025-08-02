let selectedVotes = [];
const maxVotes = 2;

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
            // 結果メッセージを表示
            document.getElementById('result-message').style.display = 'block';
        } else {
            throw new Error('投票の送信に失敗しました');
        }
    } catch (error) {
        alert('エラーが発生しました: ' + error.message);
        submitBtn.disabled = false;
        submitBtn.textContent = '投票を送信';
    }
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    updateUI();
});
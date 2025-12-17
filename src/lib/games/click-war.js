// ===== УЛУЧШЕННАЯ CLICK WAR ИГРА =====

class ClickWar {
    constructor() {
        this.isPlaying = false;
        this.clickCount = 0;
        this.startTime = 0;
        this.gameDuration = 30000; // 30 секунд
        this.timeLeft = this.gameDuration;
        
        // Налаштування складності
        this.difficulties = {
            easy: {
                name: 'Легко',
                duration: 30000,
                clickMultiplier: 1,
                decayRate: 0.95,
                bonusThreshold: 50
            },
            medium: {
                name: 'Середньо',
                duration: 30000,
                clickMultiplier: 1.2,
                decayRate: 0.9,
                bonusThreshold: 40
            },
            hard: {
                name: 'Важко',
                duration: 25000,
                clickMultiplier: 1.5,
                decayRate: 0.85,
                bonusThreshold: 30
            },
            extreme: {
                name: 'Екстремально',
                duration: 20000,
                clickMultiplier: 2,
                decayRate: 0.8,
                bonusThreshold: 25
            }
        };
        
        this.currentDifficulty = 'medium';
        
        // Таблиця лідерів
        this.leaderboard = this.loadLeaderboard();
        this.maxLeaderboardEntries = 10;
        
        // Статистика
        this.stats = {
            totalGames: 0,
            totalClicks: 0,
            bestScore: 0,
            averageScore: 0,
            totalTime: 0
        };
        
        this.loadStats();
        
        // Анімації та ефекти
        this.effects = [];
        this.comboMultiplier = 1;
        this.lastClickTime = 0;
        this.comboWindow = 500; // 500ms для комбо
        
        // Звукові ефекти
        this.soundEnabled = true;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateDisplay();
        this.updateLeaderboard();
    }
    
    setupEventListeners() {
        const clickArea = document.querySelector('.click-area');
        if (clickArea) {
            clickArea.addEventListener('click', (e) => this.handleClick(e));
        }
        
        // Підтримка touch подій для мобільних
        const touchArea = document.querySelector('.click-area');
        if (touchArea) {
            touchArea.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.handleClick(e);
            });
        }
    }
    
    handleClick(event) {
        if (!this.isPlaying) return;
        
        event.preventDefault();
        
        // Перевіряємо комбо
        const now = Date.now();
        if (now - this.lastClickTime <= this.comboWindow) {
            this.comboMultiplier = Math.min(this.comboMultiplier + 0.1, 3);
        } else {
            this.comboMultiplier = 1;
        }
        this.lastClickTime = now;
        
        // Додаємо клік з множником
        const difficulty = this.difficulties[this.currentDifficulty];
        const clicksToAdd = Math.floor(difficulty.clickMultiplier * this.comboMultiplier);
        this.clickCount += clicksToAdd;
        
        // Створюємо візуальний ефект
        this.createClickEffect(event);
        
        // Відтворюємо звук
        if (this.soundEnabled) {
            this.playClickSound();
        }
        
        // Оновлюємо відображення
        this.updateClickDisplay();
        
        // Перевіряємо бонуси
        this.checkBonuses();
    }
    
    createClickEffect(event) {
        const clickArea = document.querySelector('.click-area');
        const rect = clickArea.getBoundingClientRect();
        
        const effect = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
            size: 20,
            opacity: 1,
            text: `+${Math.floor(this.difficulties[this.currentDifficulty].clickMultiplier * this.comboMultiplier)}`,
            color: this.getComboColor(),
            created: Date.now()
        };
        
        this.effects.push(effect);
        
        // Видаляємо ефект через 1 секунду
        setTimeout(() => {
            const index = this.effects.indexOf(effect);
            if (index > -1) {
                this.effects.splice(index, 1);
            }
        }, 1000);
    }
    
    getComboColor() {
        if (this.comboMultiplier >= 2.5) return '#e74c3c'; // Червоний для високого комбо
        if (this.comboMultiplier >= 2) return '#f39c12'; // Помаранчевий
        if (this.comboMultiplier >= 1.5) return '#f1c40f'; // Жовтий
        return '#3498db'; // Блакитний
    }
    
    playClickSound() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Звук залежить від комбо
        const frequency = 200 + (this.comboMultiplier - 1) * 100;
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    }
    
    checkBonuses() {
        const difficulty = this.difficulties[this.currentDifficulty];
        const threshold = difficulty.bonusThreshold;
        
        if (this.clickCount % threshold === 0) {
            this.showBonusEffect();
        }
    }
    
    showBonusEffect() {
        const clickArea = document.querySelector('.click-area');
        const rect = clickArea.getBoundingClientRect();
        
        // Створюємо бонусний ефект
        const bonus = {
            x: rect.width / 2,
            y: rect.height / 2,
            text: '🎉 БОНУС!',
            size: 40,
            opacity: 1,
            created: Date.now(),
            type: 'bonus'
        };
        
        this.effects.push(bonus);
        
        // Додаємо бонусні очки
        const bonusPoints = Math.floor(this.clickCount * 0.1);
        this.clickCount += bonusPoints;
        
        // Показуємо повідомлення
        this.showBonusMessage(bonusPoints);
        
        // Видаляємо через 2 секунди
        setTimeout(() => {
            const index = this.effects.indexOf(bonus);
            if (index > -1) {
                this.effects.splice(index, 1);
            }
        }, 2000);
    }
    
    showBonusMessage(points) {
        const message = document.createElement('div');
        message.className = 'bonus-message';
        message.textContent = `+${points} бонусних очок!`;
        message.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(45deg, #f39c12, #e67e22);
            color: white;
            padding: 15px 25px;
            border-radius: 25px;
            font-size: 1.2rem;
            font-weight: bold;
            animation: bonusPop 2s ease-out forwards;
            z-index: 100;
            box-shadow: 0 8px 20px rgba(243, 156, 18, 0.4);
        `;
        
        document.querySelector('.click-area').appendChild(message);
        
        setTimeout(() => {
            message.remove();
        }, 2000);
    }
    
    startGame() {
        this.isPlaying = true;
        this.clickCount = 0;
        this.startTime = Date.now();
        this.comboMultiplier = 1;
        this.timeLeft = this.difficulties[this.currentDifficulty].duration;
        this.effects = [];
        
        // Оновлюємо UI
        this.updateDisplay();
        this.updateClickDisplay();
        
        // Запускаємо таймер
        this.gameInterval = setInterval(() => {
            this.updateTimer();
        }, 100);
        
        // Анімація початку гри
        this.animateGameStart();
    }
    
    stopGame() {
        this.isPlaying = false;
        clearInterval(this.gameInterval);
        
        // Зберігаємо результат
        this.saveScore();
        this.updateStats();
        
        // Показуємо результати
        this.showResults();
        
        // Оновлюємо таблицю лідерів
        this.updateLeaderboard();
    }
    
    updateTimer() {
        const elapsed = Date.now() - this.startTime;
        this.timeLeft = Math.max(0, this.difficulties[this.currentDifficulty].duration - elapsed);
        
        this.updateDisplay();
        
        if (this.timeLeft <= 0) {
            this.stopGame();
        }
    }
    
    updateDisplay() {
        const timerEl = document.getElementById('timer');
        if (timerEl) {
            const seconds = Math.ceil(this.timeLeft / 1000);
            timerEl.textContent = seconds;
            
            // Змінюємо колір таймера
            if (seconds <= 5) {
                timerEl.style.color = '#e74c3c';
                timerEl.style.animation = 'pulse 0.5s infinite';
            } else if (seconds <= 10) {
                timerEl.style.color = '#f39c12';
                timerEl.style.animation = 'pulse 1s infinite';
            } else {
                timerEl.style.color = 'white';
                timerEl.style.animation = 'none';
            }
        }
        
        // Оновлюємо множник комбо
        this.updateComboDisplay();
    }
    
    updateClickDisplay() {
        const clickCountEl = document.getElementById('clickCount');
        if (clickCountEl) {
            clickCountEl.textContent = this.clickCount.toLocaleString();
            
            // Анімація оновлення
            clickCountEl.style.transform = 'scale(1.1)';
            setTimeout(() => {
                clickCountEl.style.transform = 'scale(1)';
            }, 100);
        }
    }
    
    updateComboDisplay() {
        let comboDisplay = document.getElementById('comboDisplay');
        if (!comboDisplay && this.comboMultiplier > 1) {
            comboDisplay = document.createElement('div');
            comboDisplay.id = 'comboDisplay';
            comboDisplay.style.cssText = `
                position: absolute;
                top: 20px;
                right: 20px;
                background: rgba(231, 76, 60, 0.9);
                color: white;
                padding: 10px 15px;
                border-radius: 20px;
                font-weight: bold;
                animation: comboPulse 0.5s infinite;
                z-index: 50;
            `;
            document.querySelector('.click-area').appendChild(comboDisplay);
        }
        
        if (comboDisplay) {
            if (this.comboMultiplier > 1) {
                comboDisplay.textContent = `x${this.comboMultiplier.toFixed(1)} COMBO!`;
                comboDisplay.style.display = 'block';
            } else {
                comboDisplay.style.display = 'none';
            }
        }
    }
    
    animateGameStart() {
        const clickArea = document.querySelector('.click-area');
        clickArea.style.animation = 'gameStart 0.5s ease-out';
        setTimeout(() => {
            clickArea.style.animation = '';
        }, 500);
    }
    
    showResults() {
        const resultModal = document.createElement('div');
        resultModal.className = 'results-modal';
        resultModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(10px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            animation: fadeIn 0.5s ease-out;
        `;
        
        const resultsContent = document.createElement('div');
        resultsContent.style.cssText = `
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            border: 1px solid rgba(255, 255, 255, 0.2);
            max-width: 500px;
            width: 90%;
            animation: slideInUp 0.5s ease-out;
        `;
        
        const finalScore = this.clickCount;
        const isNewRecord = finalScore > this.stats.bestScore;
        
        resultsContent.innerHTML = `
            <div style="font-size: 4rem; margin-bottom: 20px;">
                ${isNewRecord ? '🏆' : '🎯'}
            </div>
            <h2 style="margin-bottom: 20px; color: white;">
                ${isNewRecord ? 'Новий рекорд!' : 'Гру завершено!'}
            </h2>
            <div style="font-size: 3rem; font-weight: bold; color: #3498db; margin-bottom: 20px;">
                ${finalScore.toLocaleString()} кліків
            </div>
            <div style="margin-bottom: 30px; color: white; opacity: 0.8;">
                <div>Складність: ${this.difficulties[this.currentDifficulty].name}</div>
                <div>Максимальне комбо: x${this.comboMultiplier.toFixed(1)}</div>
                <div>Середня швидкість: ${Math.round(finalScore / (this.difficulties[this.currentDifficulty].duration / 1000))} кліків/сек</div>
            </div>
            <button onclick="this.parentElement.parentElement.remove(); window.clickWar.startGame();" 
                    style="
                        padding: 12px 24px;
                        background: linear-gradient(45deg, #3498db, #2980b9);
                        border: none;
                        border-radius: 25px;
                        color: white;
                        font-size: 1.1rem;
                        font-weight: bold;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        margin-right: 10px;
                    ">
                Грати знову
            </button>
            <button onclick="this.parentElement.parentElement.remove();" 
                    style="
                        padding: 12px 24px;
                        background: rgba(255, 255, 255, 0.2);
                        border: none;
                        border-radius: 25px;
                        color: white;
                        font-size: 1.1rem;
                        cursor: pointer;
                        transition: all 0.3s ease;
                    ">
                Закрити
            </button>
        `;
        
        resultModal.appendChild(resultsContent);
        document.body.appendChild(resultModal);
        
        // Відтворюємо звук завершення
        if (this.soundEnabled) {
            this.playEndSound(isNewRecord);
        }
    }
    
    playEndSound(isNewRecord) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        if (isNewRecord) {
            // Торжественный звук для нового рекорда
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    
                    oscillator.frequency.setValueAtTime(440 + i * 100, audioContext.currentTime);
                    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                    
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.5);
                }, i * 200);
            }
        } else {
            // Обычный звук завершения
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(330, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        }
    }
    
    saveScore() {
        const score = {
            score: this.clickCount,
            difficulty: this.currentDifficulty,
            date: new Date().toISOString(),
            comboMultiplier: this.comboMultiplier
        };
        
        this.leaderboard.push(score);
        this.leaderboard.sort((a, b) => b.score - a.score);
        this.leaderboard = this.leaderboard.slice(0, this.maxLeaderboardEntries);
        
        localStorage.setItem('click-war-leaderboard', JSON.stringify(this.leaderboard));
    }
    
    loadLeaderboard() {
        const saved = localStorage.getItem('click-war-leaderboard');
        return saved ? JSON.parse(saved) : [];
    }
    
    updateLeaderboard() {
        const leaderboardEl = document.getElementById('leaderboard');
        if (!leaderboardEl) return;
        
        if (this.leaderboard.length === 0) {
            leaderboardEl.innerHTML = '<div style="text-align: center; opacity: 0.6;">Поки що немає результатів</div>';
            return;
        }
        
        leaderboardEl.innerHTML = this.leaderboard.map((entry, index) => `
            <div class="leaderboard-entry ${index === 0 ? 'first-place' : ''}">
                <span class="rank">#${index + 1}</span>
                <span class="score">${entry.score.toLocaleString()}</span>
                <span class="difficulty">${this.difficulties[entry.difficulty].name}</span>
            </div>
        `).join('');
    }
    
    updateStats() {
        this.stats.totalGames++;
        this.stats.totalClicks += this.clickCount;
        this.stats.totalTime += this.difficulties[this.currentDifficulty].duration;
        
        if (this.clickCount > this.stats.bestScore) {
            this.stats.bestScore = this.clickCount;
        }
        
        this.stats.averageScore = Math.round(this.stats.totalClicks / this.stats.totalGames);
        
        localStorage.setItem('click-war-stats', JSON.stringify(this.stats));
    }
    
    loadStats() {
        const saved = localStorage.getItem('click-war-stats');
        if (saved) {
            this.stats = { ...this.stats, ...JSON.parse(saved) };
        }
    }
    
    setDifficulty(difficulty) {
        this.currentDifficulty = difficulty;
        this.timeLeft = this.difficulties[difficulty].duration;
        this.updateDisplay();
    }
    
    clearLeaderboard() {
        this.leaderboard = [];
        localStorage.removeItem('click-war-leaderboard');
        this.updateLeaderboard();
    }
    
    renderEffects() {
        const clickArea = document.querySelector('.click-area');
        if (!clickArea) return;
        
        // Очищаємо старі ефекти
        const oldEffects = clickArea.querySelectorAll('.click-effect, .combo-text');
        oldEffects.forEach(effect => effect.remove());
        
        // Рисуємо нові ефекти
        this.effects.forEach(effect => {
            const effectEl = document.createElement('div');
            effectEl.className = 'click-effect';
            effectEl.style.cssText = `
                position: absolute;
                left: ${effect.x}px;
                top: ${effect.y}px;
                color: ${effect.color};
                font-weight: bold;
                font-size: ${effect.size}px;
                pointer-events: none;
                z-index: 10;
                animation: clickEffect 1s ease-out forwards;
            `;
            effectEl.textContent = effect.text;
            
            clickArea.appendChild(effectEl);
        });
    }
    
    gameLoop() {
        this.renderEffects();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Глобальні функції
function startClickWar() {
    if (window.clickWar) {
        window.clickWar.startGame();
    }
}

function stopClickWar() {
    if (window.clickWar) {
        window.clickWar.stopGame();
    }
}

function setClickWarDifficulty(difficulty) {
    if (window.clickWar) {
        window.clickWar.setDifficulty(difficulty);
    }
}

function clearLeaderboard() {
    if (window.clickWar) {
        window.clickWar.clearLeaderboard();
    }
}

function initializeClickWar() {
    window.clickWar = new ClickWar();
    window.clickWar.gameLoop();
}

// CSS стилі для Click War
const clickWarStyles = `
    .click-war-game {
        text-align: center;
        max-width: 600px;
        margin: 0 auto;
    }
    
    .timer {
        font-size: 1.5rem;
        font-weight: bold;
        margin-bottom: 20px;
        padding: 15px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 15px;
        backdrop-filter: blur(10px);
    }
    
    .click-area {
        position: relative;
        width: 400px;
        height: 300px;
        margin: 20px auto;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 20px;
        cursor: pointer;
        overflow: hidden;
        border: 3px solid rgba(255, 255, 255, 0.3);
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .click-area:hover {
        border-color: rgba(255, 255, 255, 0.6);
        transform: translateY(-2px);
        box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
    }
    
    .click-area:active {
        transform: scale(0.98);
    }
    
    .click-counter {
        font-size: 3rem;
        font-weight: bold;
        color: white;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        z-index: 5;
    }
    
    .leaderboard {
        margin-top: 30px;
        padding: 20px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 15px;
        backdrop-filter: blur(10px);
    }
    
    .leaderboard h3 {
        margin-bottom: 15px;
        color: white;
        font-size: 1.3rem;
    }
    
    .leaderboard-entry {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 15px;
        margin: 5px 0;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        color: white;
        transition: all 0.3s ease;
    }
    
    .leaderboard-entry:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: translateX(5px);
    }
    
    .leaderboard-entry.first-place {
        background: linear-gradient(45deg, #f1c40f, #f39c12);
        color: #2c3e50;
        font-weight: bold;
        animation: goldenGlow 2s infinite;
    }
    
    .leaderboard-entry .rank {
        font-weight: bold;
        min-width: 40px;
    }
    
    .leaderboard-entry .score {
        font-size: 1.1rem;
        font-weight: bold;
    }
    
    .leaderboard-entry .difficulty {
        font-size: 0.9rem;
        opacity: 0.8;
    }
    
    .game-controls {
        margin-top: 20px;
        display: flex;
        flex-direction: column;
        gap: 15px;
        align-items: center;
    }
    
    .game-controls button {
        padding: 12px 24px;
        background: linear-gradient(45deg, #3498db, #2980b9);
        border: none;
        border-radius: 25px;
        color: white;
        font-size: 1.1rem;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s ease;
        min-width: 150px;
    }
    
    .game-controls button:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(52, 152, 219, 0.4);
    }
    
    .game-controls button:active {
        transform: translateY(0);
    }
    
    .difficulty {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        margin: 15px 0;
    }
    
    .difficulty label {
        font-weight: bold;
        color: white;
    }
    
    .difficulty select {
        padding: 8px 12px;
        border: none;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.2);
        color: white;
        font-size: 1rem;
        min-width: 150px;
    }
    
    .difficulty select option {
        background: #2c3e50;
        color: white;
    }
    
    .stats-summary {
        display: flex;
        justify-content: center;
        gap: 15px;
        margin: 20px 0;
        flex-wrap: wrap;
    }
    
    .stat-item {
        background: rgba(255, 255, 255, 0.1);
        padding: 10px 15px;
        border-radius: 15px;
        text-align: center;
        color: white;
        backdrop-filter: blur(10px);
    }
    
    .stat-value {
        font-size: 1.2rem;
        font-weight: bold;
        color: #3498db;
    }
    
    .stat-label {
        font-size: 0.9rem;
        opacity: 0.8;
    }
    
    .clear-btn {
        background: linear-gradient(45deg, #e74c3c, #c0392b) !important;
        font-size: 0.9rem;
        padding: 8px 16px;
        margin-top: 10px;
    }
    
    .clear-btn:hover {
        box-shadow: 0 8px 20px rgba(231, 76, 60, 0.4) !important;
    }
    
    @keyframes goldenGlow {
        0%, 100% { box-shadow: 0 0 20px rgba(241, 196, 15, 0.5); }
        50% { box-shadow: 0 0 40px rgba(241, 196, 15, 0.8); }
    }
    
    @keyframes clickEffect {
        0% {
            opacity: 1;
            transform: scale(0.5) translateY(0);
        }
        50% {
            opacity: 1;
            transform: scale(1.2) translateY(-20px);
        }
        100% {
            opacity: 0;
            transform: scale(1) translateY(-40px);
        }
    }
    
    @keyframes comboPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
    }
    
    @keyframes gameStart {
        0% { transform: scale(0.9); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes slideInUp {
        from { transform: translateY(50px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
    
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
    }
    
    @keyframes bonusPop {
        0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.5);
        }
        20% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.2);
        }
        80% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
        }
        100% {
            opacity: 0;
            transform: translate(-50%, -80%) scale(0.8);
        }
    }
    
    @media (max-width: 768px) {
        .click-area {
            width: 300px;
            height: 200px;
        }
        
        .click-counter {
            font-size: 2rem;
        }
        
        .stats-summary {
            flex-direction: column;
            align-items: center;
        }
        
        .game-controls {
            width: 100%;
        }
        
        .game-controls button {
            width: 100%;
            max-width: 300px;
        }
    }
`;

function loadClickWar(container) {
    container.innerHTML = `
        <h2>⚔️ Війна кліків</h2>
        
        <div class="game-area">
            <div class="click-war-game">
                <div class="timer">Час: <span id="timer">30</span> сек</div>
                <div class="click-area" onclick="handleClickWarClick(event)">
                    <div class="click-counter">
                        <span id="clickCount">0</span> кліків
                    </div>
                </div>
                
                <div class="leaderboard">
                    <h3>🏆 Таблиця лідерів</h3>
                    <div id="leaderboard"></div>
                    <button onclick="clearLeaderboard()" class="clear-btn">
                        🗑️ Очистити
                    </button>
                </div>
            </div>
        </div>
        
        <div class="game-controls">
            <button onclick="startClickWar()">🚀 Почати бійку</button>
            <button onclick="stopClickWar()">⏹️ Зупинити</button>
            
            <div class="difficulty">
                <label>🎯 Складність:</label>
                <select id="difficultySelect" onchange="setClickWarDifficulty(this.value)">
                    <option value="easy">Легко (30 сек, x1)</option>
                    <option value="medium" selected>Середньо (30 сек, x1.2)</option>
                    <option value="hard">Важко (25 сек, x1.5)</option>
                    <option value="extreme">Екстремально (20 сек, x2)</option>
                </select>
            </div>
            
            <div class="stats-summary">
                <div class="stat-item">
                    <div class="stat-value" id="totalGames">0</div>
                    <div class="stat-label">Ігор зіграно</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" id="bestScore">0</div>
                    <div class="stat-label">Найкращий результат</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" id="averageScore">0</div>
                    <div class="stat-label">Середній результат</div>
                </div>
            </div>
        </div>
    `;
    
    // Додаємо стилі
    const style = document.createElement('style');
    style.textContent = clickWarStyles;
    document.head.appendChild(style);
    
    initializeClickWar();
}

// Глобальна функція для обробки кліків
function handleClickWarClick(event) {
    if (window.clickWar) {
        window.clickWar.handleClick(event);
    }
}
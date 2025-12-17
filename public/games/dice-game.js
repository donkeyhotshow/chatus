// ===== УЛУЧШЕННАЯ DICE ROLLING ИГРА =====

class DiceGame {
    constructor() {
        this.dice = [
            { id: 1, value: 1, rolling: false },
            { id: 2, value: 1, rolling: false },
            { id: 3, value: 1, rolling: false }
        ];
        
        this.diceTypes = {
            4: { name: 'D4 (4-сторонній)', sides: 4, icon: '🔺', color: '#e74c3c' },
            6: { name: 'D6 (6-сторонній)', sides: 6, icon: '⚅', color: '#3498db' },
            8: { name: 'D8 (8-сторонній)', sides: 8, icon: '🔷', color: '#2ecc71' },
            10: { name: 'D10 (10-сторонній)', sides: 10, icon: '💎', color: '#f39c12' },
            12: { name: 'D12 (12-сторонній)', sides: 12, icon: '🟡', color: '#9b59b6' },
            20: { name: 'D20 (20-сторонній)', sides: 20, icon: '🎲', color: '#1abc9c' },
            100: { name: 'D100 (100-сторонній)', sides: 100, icon: '🌟', color: '#e67e22' }
        };
        
        this.currentDiceType = 6;
        
        // Статистика
        this.stats = {
            totalRolls: 0,
            totalSum: 0,
            maxRoll: 0,
            minRoll: Infinity,
            rollsByValue: {},
            rollsByDiceType: {},
            averageRoll: 0,
            lastRolls: []
        };
        
        this.maxHistory = 20;
        
        // Анімації
        this.animationDuration = 1000; // 1 секунда
        this.isRolling = false;
        
        // Звукові ефекти
        this.soundEnabled = true;
        
        this.init();
    }
    
    init() {
        this.loadStats();
        this.setupEventListeners();
        this.updateDisplay();
        this.renderDice();
    }
    
    setupEventListeners() {
        // Обробники для кнопок кидання
        const rollButtons = document.querySelectorAll('.dice-controls button');
        rollButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.target.textContent;
                if (action.includes('кубик')) {
                    const diceNum = parseInt(action.match(/\d+/)[0]);
                    this.rollSpecific(diceNum);
                } else if (action.includes('всі')) {
                    this.rollAll();
                } else if (action.includes('Кинути')) {
                    this.rollDice();
                }
            });
        });
        
        // Обробник для зміни типу кубиків
        const diceTypeSelect = document.getElementById('diceType');
        if (diceTypeSelect) {
            diceTypeSelect.addEventListener('change', (e) => {
                this.currentDiceType = parseInt(e.target.value);
                this.updateDiceType();
                this.saveStats();
            });
        }
    }
    
    updateDiceType() {
        const diceType = this.diceTypes[this.currentDiceType];
        
        // Оновлюємо відображення кубиків
        this.dice.forEach(die => {
            die.element?.setAttribute('data-sides', diceType.sides);
            die.element?.setAttribute('title', `${diceType.name}`);
        });
        
        // Оновлюємо кнопки
        const rollButtons = document.querySelectorAll('.dice-controls button');
        rollButtons.forEach((button, index) => {
            if (button.textContent.includes('кубик')) {
                button.innerHTML = `${diceType.icon} Кубик ${index + 1}`;
            }
        });
    }
    
    renderDice() {
        const diceContainer = document.querySelector('.dice-container');
        if (!diceContainer) return;
        
        diceContainer.innerHTML = this.dice.map((die, index) => `
            <div class="dice" id="dice${die.id}" data-dice-id="${die.id}" data-sides="${this.diceTypes[this.currentDiceType].sides}">
                <div class="dice-value">${die.value}</div>
                <div class="dice-label">Кубик ${index + 1}</div>
            </div>
        `).join('');
        
        // Зберігаємо посилання на елементи
        this.dice.forEach(die => {
            die.element = document.getElementById(`dice${die.id}`);
        });
        
        this.updateDiceType();
    }
    
    rollSpecific(diceNumber) {
        if (this.isRolling) return;
        
        const die = this.dice[diceNumber - 1];
        if (!die) return;
        
        this.rollSingleDie(die);
    }
    
    rollAll() {
        if (this.isRolling) return;
        
        this.isRolling = true;
        
        // Анімуємо всі кубики одночасно
        const promises = this.dice.map(die => this.rollSingleDie(die, true));
        
        Promise.all(promises).then(() => {
            this.isRolling = false;
            this.processRoll();
        });
    }
    
    rollDice() {
        this.rollAll();
    }
    
    rollSingleDie(die, animateAll = false) {
        return new Promise((resolve) => {
            const diceElement = die.element;
            if (!diceElement) {
                resolve();
                return;
            }
            
            // Починаємо анімацію
            die.rolling = true;
            diceElement.classList.add('rolling');
            
            const diceType = this.diceTypes[this.currentDiceType];
            const startTime = Date.now();
            const animationInterval = 100; // Оновлення кожні 100мс
            
            const rollInterval = setInterval(() => {
                // Показуємо випадкові значення під час анімації
                const randomValue = Math.floor(Math.random() * diceType.sides) + 1;
                diceElement.querySelector('.dice-value').textContent = randomValue;
                
                if (Date.now() - startTime >= this.animationDuration) {
                    clearInterval(rollInterval);
                    
                    // Фінальне значення
                    const finalValue = Math.floor(Math.random() * diceType.sides) + 1;
                    die.value = finalValue;
                    die.rolling = false;
                    
                    // Анімація зупинки
                    diceElement.classList.remove('rolling');
                    diceElement.classList.add('rolled');
                    
                    // Видаляємо клас після анімації
                    setTimeout(() => {
                        diceElement.classList.remove('rolled');
                    }, 500);
                    
                    // Відтворюємо звук
                    if (this.soundEnabled) {
                        this.playDiceSound();
                    }
                    
                    resolve();
                }
            }, animationInterval);
        });
    }
    
    playDiceSound() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Випадкова частота для різноманітності
        const frequencies = [220, 247, 262, 294, 330, 349, 392];
        const frequency = frequencies[Math.floor(Math.random() * frequencies.length)];
        
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    }
    
    processRoll() {
        const diceType = this.diceTypes[this.currentDiceType];
        const values = this.dice.map(die => die.value);
        const sum = values.reduce((a, b) => a + b, 0);
        
        // Оновлюємо статистику
        this.updateStats(values, sum);
        
        // Показуємо результат
        this.showRollResult(values, sum);
        
        // Зберігаємо дані
        this.saveStats();
        this.updateDisplay();
    }
    
    updateStats(values, sum) {
        this.stats.totalRolls++;
        this.stats.totalSum += sum;
        
        // Оновлюємо мін/макс
        values.forEach(value => {
            if (value > this.stats.maxRoll) {
                this.stats.maxRoll = value;
            }
            if (value < this.stats.minRoll) {
                this.stats.minRoll = value;
            }
            
            // Статистика по значеннях
            if (!this.stats.rollsByValue[value]) {
                this.stats.rollsByValue[value] = 0;
            }
            this.stats.rollsByValue[value]++;
        });
        
        // Статистика по типах кубиків
        const diceTypeKey = this.currentDiceType;
        if (!this.stats.rollsByDiceType[diceTypeKey]) {
            this.stats.rollsByDiceType[diceTypeKey] = 0;
        }
        this.stats.rollsByDiceType[diceTypeKey]++;
        
        // Середнє значення
        this.stats.averageRoll = this.stats.totalSum / this.stats.totalRolls;
        
        // Історія останніх кидків
        this.stats.lastRolls.unshift({
            values: [...values],
            sum: sum,
            diceType: diceTypeKey,
            timestamp: new Date().toISOString()
        });
        
        if (this.stats.lastRolls.length > this.maxHistory) {
            this.stats.lastRolls = this.stats.lastRolls.slice(0, this.maxHistory);
        }
    }
    
    showRollResult(values, sum) {
        const diceType = this.diceTypes[this.currentDiceType];
        const resultModal = document.createElement('div');
        resultModal.className = 'roll-result-modal';
        resultModal.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 20px;
            border-radius: 15px;
            z-index: 1000;
            animation: slideInRight 0.5s ease-out;
            max-width: 300px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        `;
        
        // Особливі повідомлення
        let specialMessage = '';
        let specialEmoji = '';
        
        if (this.currentDiceType === 6) {
            // Спеціальні комбінації для D6
            const uniqueValues = [...new Set(values)];
            if (uniqueValues.length === 1) {
                specialMessage = 'Всі однакові!';
                specialEmoji = '🎯';
            } else if (sum === 18) {
                specialMessage = 'Максимум!';
                specialEmoji = '🏆';
            } else if (sum === 3) {
                specialMessage = 'Мінімум!';
                specialEmoji = '😅';
            }
        } else if (this.currentDiceType === 20) {
            // Спеціальні для D20
            if (values.includes(20)) {
                specialMessage = 'Критичний успіх!';
                specialEmoji = '🎲';
            } else if (values.includes(1)) {
                specialMessage = 'Критичний провал!';
                specialEmoji = '💀';
            }
        }
        
        resultModal.innerHTML = `
            <div style="text-align: center; margin-bottom: 15px;">
                <div style="font-size: 2rem;">${diceType.icon}</div>
                <div style="font-weight: bold; margin-top: 5px;">${diceType.name}</div>
            </div>
            <div style="margin-bottom: 10px;">
                <strong>Значення:</strong> ${values.join(', ')}
            </div>
            <div style="margin-bottom: 10px; font-size: 1.2rem;">
                <strong>Сума:</strong> ${sum}
            </div>
            ${specialMessage ? `
                <div style="text-align: center; margin: 10px 0; padding: 10px; background: rgba(255, 255, 255, 0.1); border-radius: 10px;">
                    <div style="font-size: 1.5rem;">${specialEmoji}</div>
                    <div style="color: #f39c12; font-weight: bold;">${specialMessage}</div>
                </div>
            ` : ''}
            <div style="text-align: center; margin-top: 15px;">
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="
                            background: rgba(255, 255, 255, 0.2);
                            border: none;
                            color: white;
                            padding: 5px 10px;
                            border-radius: 5px;
                            cursor: pointer;
                        ">
                    ✕
                </button>
            </div>
        `;
        
        document.body.appendChild(resultModal);
        
        // Автоматично прибираємо через 5 секунд
        setTimeout(() => {
            if (resultModal.parentElement) {
                resultModal.remove();
            }
        }, 5000);
    }
    
    updateDisplay() {
        // Оновлюємо статистику
        const totalRollsEl = document.getElementById('totalRolls');
        const averageRollEl = document.getElementById('averageRoll');
        const maxRollEl = document.getElementById('maxRoll');
        const minRollEl = document.getElementById('minRoll');
        
        if (totalRollsEl) totalRollsEl.textContent = this.stats.totalRolls.toLocaleString();
        if (averageRollEl) averageRollEl.textContent = this.stats.averageRoll.toFixed(2);
        if (maxRollEl) maxRollEl.textContent = this.stats.maxRoll;
        if (minRollEl) minRollEl.textContent = this.stats.minRoll === Infinity ? '0' : this.stats.minRoll;
        
        // Оновлюємо історію
        this.updateHistoryDisplay();
        this.updateCharts();
    }
    
    updateHistoryDisplay() {
        const historyContainer = document.querySelector('.roll-history');
        if (!historyContainer) return;
        
        if (this.stats.lastRolls.length === 0) {
            historyContainer.innerHTML = '<div style="text-align: center; opacity: 0.6;">Поки що немає історії</div>';
            return;
        }
        
        historyContainer.innerHTML = this.stats.lastRolls.map((roll, index) => {
            const diceType = this.diceTypes[roll.diceType];
            const time = new Date(roll.timestamp).toLocaleTimeString();
            
            return `
                <div class="history-entry">
                    <span class="history-time">${time}</span>
                    <span class="history-values">${roll.values.join(', ')}</span>
                    <span class="history-sum">${roll.sum}</span>
                    <span class="history-type">${diceType.icon}</span>
                </div>
            `;
        }).join('');
    }
    
    updateCharts() {
        // Простий графік розподілу (якщо є відповідний елемент)
        const chartContainer = document.querySelector('.dice-chart');
        if (!chartContainer) return;
        
        const maxValue = this.currentDiceType;
        const chartData = [];
        
        for (let i = 1; i <= maxValue; i++) {
            chartData.push(this.stats.rollsByValue[i] || 0);
        }
        
        // Створюємо простий ASCII графік
        const maxCount = Math.max(...chartData);
        let chartHTML = '<div class="chart-bars">';
        
        chartData.forEach((count, index) => {
            const height = maxCount > 0 ? Math.round((count / maxCount) * 20) : 0;
            const bar = '█'.repeat(height);
            chartHTML += `
                <div class="chart-bar">
                    <div class="bar-height">${bar}</div>
                    <div class="bar-value">${index + 1}</div>
                    <div class="bar-count">${count}</div>
                </div>
            `;
        });
        
        chartHTML += '</div>';
        chartContainer.innerHTML = chartHTML;
    }
    
    clearStats() {
        if (confirm('Ви впевнені, що хочете очистити всю статистику?')) {
            this.stats = {
                totalRolls: 0,
                totalSum: 0,
                maxRoll: 0,
                minRoll: Infinity,
                rollsByValue: {},
                rollsByDiceType: {},
                averageRoll: 0,
                lastRolls: []
            };
            
            localStorage.removeItem('dice-game-stats');
            this.updateDisplay();
            
            // Показуємо повідомлення
            this.showNotification('Статистику очищено', 'success');
        }
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'success' ? 'rgba(46, 204, 113, 0.9)' : 'rgba(52, 152, 219, 0.9)'};
            color: white;
            padding: 15px 25px;
            border-radius: 25px;
            z-index: 1001;
            animation: slideInDown 0.5s ease-out;
            backdrop-filter: blur(10px);
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutUp 0.5s ease-out';
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }
    
    saveStats() {
        localStorage.setItem('dice-game-stats', JSON.stringify(this.stats));
    }
    
    loadStats() {
        const saved = localStorage.getItem('dice-game-stats');
        if (saved) {
            this.stats = { ...this.stats, ...JSON.parse(saved) };
        }
    }
    
    exportStats() {
        const data = {
            stats: this.stats,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dice-stats-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// Глобальні функції
function rollDice() {
    if (window.diceGame) {
        window.diceGame.rollDice();
    }
}

function rollSpecific(diceNumber) {
    if (window.diceGame) {
        window.diceGame.rollSpecific(diceNumber);
    }
}

function rollAll() {
    if (window.diceGame) {
        window.diceGame.rollAll();
    }
}

function clearStats() {
    if (window.diceGame) {
        window.diceGame.clearStats();
    }
}

function exportStats() {
    if (window.diceGame) {
        window.diceGame.exportStats();
    }
}

function initializeDiceGame() {
    window.diceGame = new DiceGame();
}

// CSS стилі для Dice Game
const diceStyles = `
    .dice-game {
        text-align: center;
        max-width: 800px;
        margin: 0 auto;
    }
    
    .dice-container {
        display: flex;
        justify-content: center;
        gap: 30px;
        margin: 30px 0;
        flex-wrap: wrap;
    }
    
    .dice {
        width: 100px;
        height: 100px;
        background: linear-gradient(145deg, #ffffff, #e6e6e6);
        border-radius: 15px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
        border: 3px solid #ddd;
        transition: all 0.3s ease;
        cursor: pointer;
        position: relative;
        overflow: hidden;
    }
    
    .dice:hover {
        transform: translateY(-5px);
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.2);
    }
    
    .dice.rolling {
        animation: diceRoll 0.1s infinite;
    }
    
    .dice.rolled {
        animation: diceBounce 0.6s ease-out;
    }
    
    .dice-value {
        font-size: 3rem;
        font-weight: bold;
        color: #2c3e50;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .dice-label {
        font-size: 0.9rem;
        color: #7f8c8d;
        margin-top: 5px;
        font-weight: 600;
    }
    
    .dice-controls {
        display: flex;
        justify-content: center;
        gap: 15px;
        margin: 30px 0;
        flex-wrap: wrap;
    }
    
    .dice-controls button {
        padding: 12px 20px;
        background: linear-gradient(45deg, #3498db, #2980b9);
        border: none;
        border-radius: 25px;
        color: white;
        font-size: 1rem;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s ease;
        min-width: 120px;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .dice-controls button:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(52, 152, 219, 0.4);
    }
    
    .dice-controls button:active {
        transform: translateY(0);
    }
    
    .dice-types {
        margin: 20px 0;
        padding: 20px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 15px;
        backdrop-filter: blur(10px);
        text-align: center;
    }
    
    .dice-types label {
        display: block;
        margin-bottom: 10px;
        font-weight: bold;
        color: white;
    }
    
    .dice-types select {
        padding: 10px 15px;
        border: none;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.2);
        color: white;
        font-size: 1rem;
        min-width: 200px;
        cursor: pointer;
    }
    
    .dice-types select option {
        background: #2c3e50;
        color: white;
    }
    
    .statistics {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
        margin: 20px 0;
    }
    
    .stat-item {
        background: rgba(255, 255, 255, 0.1);
        padding: 15px;
        border-radius: 15px;
        backdrop-filter: blur(10px);
        text-align: center;
        border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .stat-item div:first-child {
        font-size: 1.8rem;
        font-weight: bold;
        color: #3498db;
        margin-bottom: 5px;
    }
    
    .stat-item div:last-child {
        color: white;
        opacity: 0.8;
        font-size: 0.9rem;
    }
    
    .roll-history {
        margin: 30px 0;
        max-height: 300px;
        overflow-y: auto;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 15px;
        padding: 15px;
        backdrop-filter: blur(10px);
    }
    
    .history-entry {
        display: grid;
        grid-template-columns: 80px 1fr 60px 40px;
        gap: 10px;
        padding: 8px;
        margin: 5px 0;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        font-size: 0.9rem;
        align-items: center;
    }
    
    .history-time {
        color: #bdc3c7;
        font-family: monospace;
    }
    
    .history-values {
        color: white;
        font-weight: bold;
    }
    
    .history-sum {
        color: #f39c12;
        font-weight: bold;
        text-align: right;
    }
    
    .history-type {
        text-align: center;
        font-size: 1.2rem;
    }
    
    .dice-chart {
        margin: 20px 0;
        padding: 20px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 15px;
        backdrop-filter: blur(10px);
    }
    
    .chart-bars {
        display: flex;
        justify-content: space-around;
        align-items: end;
        height: 150px;
        margin-top: 15px;
    }
    
    .chart-bar {
        display: flex;
        flex-direction: column;
        align-items: center;
        flex: 1;
        max-width: 40px;
    }
    
    .bar-height {
        color: #3498db;
        font-family: monospace;
        font-size: 0.8rem;
        line-height: 1;
        margin-bottom: 5px;
        min-height: 20px;
        display: flex;
        align-items: end;
    }
    
    .bar-value {
        color: white;
        font-size: 0.9rem;
        font-weight: bold;
        margin-bottom: 5px;
    }
    
    .bar-count {
        color: #bdc3c7;
        font-size: 0.8rem;
    }
    
    .game-controls {
        display: flex;
        justify-content: center;
        gap: 15px;
        margin: 20px 0;
        flex-wrap: wrap;
    }
    
    .game-controls button {
        padding: 10px 20px;
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        border-radius: 20px;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 0.9rem;
    }
    
    .game-controls button:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: translateY(-1px);
    }
    
    .export-btn {
        background: linear-gradient(45deg, #27ae60, #229954) !important;
    }
    
    .export-btn:hover {
        box-shadow: 0 8px 20px rgba(39, 174, 96, 0.4) !important;
    }
    
    @keyframes diceRoll {
        0% { transform: rotateX(0deg) rotateY(0deg); }
        25% { transform: rotateX(90deg) rotateY(90deg); }
        50% { transform: rotateX(180deg) rotateY(180deg); }
        75% { transform: rotateX(270deg) rotateY(270deg); }
        100% { transform: rotateX(360deg) rotateY(360deg); }
    }
    
    @keyframes diceBounce {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
    }
    
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideInDown {
        from {
            transform: translate(-50%, -100%);
            opacity: 0;
        }
        to {
            transform: translate(-50%, 0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutUp {
        from {
            transform: translate(-50%, 0);
            opacity: 1;
        }
        to {
            transform: translate(-50%, -100%);
            opacity: 0;
        }
    }
    
    @media (max-width: 768px) {
        .dice-container {
            gap: 15px;
        }
        
        .dice {
            width: 80px;
            height: 80px;
        }
        
        .dice-value {
            font-size: 2rem;
        }
        
        .dice-controls {
            flex-direction: column;
            align-items: center;
        }
        
        .dice-controls button {
            width: 200px;
        }
        
        .statistics {
            grid-template-columns: repeat(2, 1fr);
        }
        
        .history-entry {
            grid-template-columns: 60px 1fr 50px 30px;
            font-size: 0.8rem;
        }
        
        .chart-bars {
            gap: 5px;
        }
        
        .chart-bar {
            max-width: 25px;
        }
        
        .bar-height {
            font-size: 0.6rem;
        }
    }
`;

function loadDiceGame(container) {
    container.innerHTML = `
        <h2>🎲 Кидання кубиків</h2>
        
        <div class="game-area">
            <div class="dice-game">
                <div class="dice-container">
                    <div class="dice" id="dice1" data-dice-id="1">
                        <div class="dice-value">1</div>
                        <div class="dice-label">Кубик 1</div>
                    </div>
                    <div class="dice" id="dice2" data-dice-id="2">
                        <div class="dice-value">1</div>
                        <div class="dice-label">Кубик 2</div>
                    </div>
                    <div class="dice" id="dice3" data-dice-id="3">
                        <div class="dice-value">1</div>
                        <div class="dice-label">Кубик 3</div>
                    </div>
                </div>
                
                <div class="dice-controls">
                    <button onclick="rollDice()">🎲 Кинути кубики</button>
                    <button onclick="rollSpecific(1)">⚅ Кубик 1</button>
                    <button onclick="rollSpecific(2)">⚅ Кубик 2</button>
                    <button onclick="rollSpecific(3)">⚅ Кубик 3</button>
                    <button onclick="rollAll()">🎯 Кинути всі</button>
                </div>
            </div>
        </div>
        
        <div class="game-controls">
            <div class="dice-types">
                <label>🎲 Тип кубиків:</label>
                <select id="diceType" onchange="window.diceGame.currentDiceType = parseInt(this.value); window.diceGame.updateDiceType();">
                    <option value="4">D4 (4-сторонній) 🔺</option>
                    <option value="6" selected>D6 (6-сторонній) ⚅</option>
                    <option value="8">D8 (8-сторонній) 🔷</option>
                    <option value="10">D10 (10-сторонній) 💎</option>
                    <option value="12">D12 (12-сторонній) 🟡</option>
                    <option value="20">D20 (20-сторонній) 🎲</option>
                    <option value="100">D100 (100-сторонній) 🌟</option>
                </select>
            </div>
            
            <div class="statistics">
                <div class="stat-item">
                    <div id="totalRolls">0</div>
                    <div>Загальні кидки</div>
                </div>
                <div class="stat-item">
                    <div id="averageRoll">0</div>
                    <div>Середнє значення</div>
                </div>
                <div class="stat-item">
                    <div id="maxRoll">0</div>
                    <div>Найвищий результат</div>
                </div>
                <div class="stat-item">
                    <div id="minRoll">0</div>
                    <div>Найнижчий результат</div>
                </div>
            </div>
            
            <div class="roll-history">
                <h4 style="color: white; margin-bottom: 15px; text-align: center;">📊 Історія кидків</h4>
                <div class="history-entries">
                    <!-- Історія буде додана динамічно -->
                </div>
            </div>
            
            <div class="dice-chart">
                <h4 style="color: white; margin-bottom: 10px; text-align: center;">📈 Розподіл результатів</h4>
                <div class="chart-bars">
                    <!-- Графік буде доданий динамічно -->
                </div>
            </div>
            
            <button onclick="clearStats()" class="clear-btn">
                🗑️ Очистити статистику
            </button>
            <button onclick="exportStats()" class="export-btn">
                📤 Експорт статистики
            </button>
        </div>
    `;
    
    // Додаємо стилі
    const style = document.createElement('style');
    style.textContent = diceStyles;
    document.head.appendChild(style);
    
    initializeDiceGame();
}
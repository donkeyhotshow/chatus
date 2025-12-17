// ===== УЛУЧШЕННАЯ ROCK PAPER SCISSORS ИГРА =====

class RockPaperScissors {
    constructor() {
        this.choices = {
            rock: { name: 'Камінь', beats: 'scissors', emoji: '✊', color: '#e74c3c' },
            paper: { name: 'Папір', beats: 'rock', emoji: '✋', color: '#3498db' },
            scissors: { name: 'Ножиці', beats: 'paper', emoji: '✌️', color: '#2ecc71' }
        };
        
        // Розширені варіанти гри
        this.extendedChoices = {
            rock: { name: 'Камінь', beats: 'scissors', emoji: '✊', color: '#e74c3c' },
            paper: { name: 'Папір', beats: 'rock', emoji: '✋', color: '#3498db' },
            scissors: { name: 'Ножиці', beats: 'paper', emoji: '✌️', color: '#2ecc71' },
            spock: { name: 'Спок', beats: 'scissors', emoji: '🖖', color: '#9b59b6' },
            lizard: { name: 'Ящірка', beats: 'spock', emoji: '🦎', color: '#f39c12'        this.current }
        };
        
Mode = 'classic'; // 'classic', 'extended', 'timed'
        this.rounds = 3;
        this.currentRound = 1;
        this.playerWins = 0;
        this.computerWins = 0;
        this.draws = 0;
        this.gameOver = false;
        
        // Налаштування часу для timed режиму
        this.timedMode = {
            duration: 30000, // 30 секунд
            timeLeft: 30000,
            roundsPlayed: 0,
            interval: null
        };
        
        this.soundEnabled = true;
        this.animations = {
            playerChoice: null,
            computerChoice: null,
            result: null
        };
        
        this.init();
    }
    
    init() {
        this.loadGameData();
        this.setupEventListeners();
        this.updateDisplay();
    }
    
    setupEventListeners() {
        // Додаємо обробники для кнопок вибору
        document.querySelectorAll('.choice').forEach(button => {
            button.addEventListener('click', (e) => {
                const choice = e.target.dataset.choice;
                this.playRound(choice);
            });
        });
        
        // Налаштування звуку
        const soundToggle = document.getElementById('soundToggle');
        if (soundToggle) {
            soundToggle.addEventListener('change', (e) => {
                this.soundEnabled = e.target.checked;
                this.saveGameData();
            });
        }
    }
    
    getCurrentChoices() {
        return this.currentMode === 'extended' ? this.extendedChoices : this.choices;
    }
    
    playRound(playerChoice) {
        if (this.gameOver && this.currentMode !== 'timed') return;
        
        const choices = this.getCurrentChoices();
        const computerChoice = this.getComputerChoice();
        
        // Анімація вибору
        this.animateChoice(playerChoice, computerChoice);
        
        // Відтворення звуку
        if (this.soundEnabled) {
            this.playSound('choice');
        }
        
        setTimeout(() => {
            const result = this.determineWinner(playerChoice, computerChoice);
            this.processResult(result, playerChoice, computerChoice);
        }, 1000);
    }
    
    animateChoice(playerChoice, computerChoice) {
        // Показуємо вибір гравця
        const playerChoiceEl = document.getElementById('playerChoice');
        const computerChoiceEl = document.getElementById('computerChoice');
        
        if (playerChoiceEl) {
            playerChoiceEl.innerHTML = '<div class="thinking">🤔</div>';
        }
        
        if (computerChoiceEl) {
            computerChoiceEl.innerHTML = '<div class="thinking">🤔</div>';
        }
        
        // Анімація "думання" комп'ютера
        setTimeout(() => {
            if (playerChoiceEl) {
                playerChoiceEl.innerHTML = `
                    <div class="choice-display player-choice" style="color: ${this.getCurrentChoices()[playerChoice].color}">
                        ${this.getCurrentChoices()[playerChoice].emoji}
                        <div class="choice-name">${this.getCurrentChoices()[playerChoice].name}</div>
                    </div>
                `;
            }
            
            if (computerChoiceEl) {
                computerChoiceEl.innerHTML = `
                    <div class="choice-display computer-choice" style="color: ${this.getCurrentChoices()[computerChoice].color}">
                        ${this.getCurrentChoices()[computerChoice].emoji}
                        <div class="choice-name">${this.getCurrentChoices()[computerChoice].name}</div>
                    </div>
                `;
            }
        }, 500);
    }
    
    getComputerChoice() {
        const choices = Object.keys(this.getCurrentChoices());
        const difficulty = document.getElementById('difficultySelect')?.value || 'medium';
        
        if (difficulty === 'easy') {
            // Випадковий вибір
            return choices[Math.floor(Math.random() * choices.length)];
        } else if (difficulty === 'medium') {
            // 70% випадковий, 30% адаптивний
            if (Math.random() < 0.3) {
                return this.getAdaptiveChoice();
            }
            return choices[Math.floor(Math.random() * choices.length)];
        } else {
            // Розумний вибір на основі статистики
            return this.getSmartChoice();
        }
    }
    
    getAdaptiveChoice() {
        const choices = this.getCurrentChoices();
        const playerStats = this.getPlayerStats();
        
        // Знаходимо найчастіший вибір гравця
        let mostUsedChoice = 'rock';
        let maxUsage = 0;
        
        for (const [choice, count] of Object.entries(playerStats)) {
            if (count > maxUsage) {
                maxUsage = count;
                mostUsedChoice = choice;
            }
        }
        
        // Обираємо те, що перемагає найчастіший вибір
        const winningChoice = Object.keys(choices).find(key => 
            choices[key].beats === mostUsedChoice
        );
        
        return winningChoice || Object.floor(Math.random().keys(choices)[Math * Object.keys(choices).length)];
    }
    
    getSmartChoice() {
        const choices = this.getCurrentChoices();
        const playerStats = this.getPlayerStats();
        const totalGames = Object.values(playerStats).reduce((sum, count) => sum + count, 0);
        
        if (totalGames < 3) {
            return Object.keys(choices)[Math.floor(Math.random() * Object.keys(choices).length)];
        }
        
        // Аналізуємо патерни гравця
        const recentChoices = this.getRecentChoices(5);
        const pattern = this.analyzePattern(recentChoices);
        
        if (pattern) {
            // Вибираємо те, що перемагає очікуваний наступний вибір
            const expectedChoice = pattern.next;
            const counterChoice = Object.keys(choices).find(key => 
                choices[key].beats === expectedChoice
            );
            
            if (counterChoice && Math.random() < 0.8) {
                return counterChoice;
            }
        }
        
        // Випадковий вибір з вагою
        return this.getWeightedRandomChoice();
    }
    
    getPlayerStats() {
        const saved = localStorage.getItem('rps-player-stats');
        return saved ? JSON.parse(saved) : {};
    }
    
    getRecentChoices(count) {
        const saved = localStorage.getItem('rps-recent-choices');
        return saved ? JSON.parse(saved).slice(-count) : [];
    }
    
    analyzePattern(choices) {
        if (choices.length < 3) return null;
        
        // Простий аналіз послідовності
        const lastTwo = choices.slice(-2);
        const secondLast = lastTwo[0];
        const last = lastTwo[1];
        
        if (secondLast === last) {
            return { type: 'repeat', next: last };
        }
        
        // Пошук циклічного патерну
        if (choices.length >= 4) {
            const cycle = choices.slice(-4);
            if (cycle[0] === cycle[2] && cycle[1] === cycle[3]) {
                return { type: 'cycle', next: cycle[1] };
            }
        }
        
        return null;
    }
    
    getWeightedRandomChoice() {
        const choices = this.getCurrentChoices();
        const playerStats = this.getPlayerStats();
        
        // Створюємо масив з вагами (менш використовувані мають більшу вагу)
        const weightedChoices = [];
        
        for (const choice of Object.keys(choices)) {
            const usage = playerStats[choice] || 0;
            const weight = Math.max(1, 5 - usage); // Максимальна вага 5
            for (let i = 0; i < weight; i++) {
                weightedChoices.push(choice);
            }
        }
        
        return weightedChoices[Math.floor(Math.random() * weightedChoices.length)];
    }
    
    determineWinner(playerChoice, computerChoice) {
        const choices = this.getCurrentChoices();
        
        // Зберігаємо статистику
        this.saveChoice(playerChoice);
        
        if (playerChoice === computerChoice) {
            return 'draw';
        }
        
        if (choices[playerChoice].beats === computerChoice) {
            return 'player';
        }
        
        return 'computer';
    }
    
    processResult(result, playerChoice, computerChoice) {
        const resultEl = document.getElementById('gameResult');
        
        if (result === 'player') {
            this.playerWins++;
            if (resultEl) {
                resultEl.innerHTML = `
                    <div class="result-display win">
                        <div class="result-icon">🎉</div>
                        <div class="result-text">Ви перемогли!</div>
                        <div class="result-details">
                            ${this.getCurrentChoices()[playerChoice].name} перемагає ${this.getCurrentChoices()[computerChoice].name}
                        </div>
                    </div>
                `;
            }
            if (this.soundEnabled) this.playSound('win');
        } else if (result === 'computer') {
            this.computerWins++;
            if (resultEl) {
                resultEl.innerHTML = `
                    <div class="result-display lose">
                        <div class="result-icon">😢</div>
                        <div class="result-text">Комп'ютер переміг!</div>
                        <div class="result-details">
                            ${this.getCurrentChoices()[computerChoice].name} перемагає ${this.getCurrentChoices()[playerChoice].name}
                        </div>
                    </div>
                `;
            }
            if (this.soundEnabled) this.playSound('lose');
        } else {
            this.draws++;
            if (resultEl) {
                resultEl.innerHTML = `
                    <div class="result-display draw">
                        <div class="result-icon">🤝</div>
                        <div class="result-text">Нічия!</div>
                        <div class="result-details">Обидва обрали однакове</div>
                    </div>
                `;
            }
            if (this.soundEnabled) this.playSound('draw');
        }
        
        // Анімація результату
        this.animateResult(result);
        
        // Оновлюємо рахунок
        this.updateScore();
        
        // Перевіряємо чи завершена гра
        if (this.currentMode !== 'timed') {
            this.currentRound++;
            
            if (this.currentRound > this.rounds) {
                this.endGame();
            }
        } else {
            // Timed режим
            this.timedMode.roundsPlayed++;
            this.updateTimerDisplay();
        }
        
        this.saveGameData();
    }
    
    animateResult(result) {
        const resultEl = document.getElementById('gameResult');
        if (resultEl) {
            resultEl.style.animation = 'none';
            setTimeout(() => {
                resultEl.style.animation = 'slideInUp 0.5s ease-out';
            }, 10);
        }
    }
    
    updateScore() {
        const playerWinsEl = document.getElementById('playerWins');
        const computerWinsEl = document.getElementById('computerWins');
        
        if (playerWinsEl) playerWinsEl.textContent = this.playerWins;
        if (computerWinsEl) computerWinsEl.textContent = this.computerWins;
    }
    
    updateDisplay() {
        this.updateScore();
        this.updateTimerDisplay();
        
        // Оновлюємо налаштування
        const roundsSelect = document.getElementById('roundsSelect');
        if (roundsSelect) {
            roundsSelect.value = this.rounds;
        }
        
        const soundToggle = document.getElementById('soundToggle');
        if (soundToggle) {
            soundToggle.checked = this.soundEnabled;
        }
    }
    
    updateTimerDisplay() {
        const timerEl = document.getElementById('timer');
        if (timerEl && this.currentMode === 'timed') {
            const seconds = Math.ceil(this.timedMode.timeLeft / 1000);
            timerEl.textContent = seconds;
            
            if (seconds <= 10) {
                timerEl.style.color = '#e74c3c';
                timerEl.style.animation = 'pulse 1s infinite';
            } else {
                timerEl.style.color = 'white';
                timerEl.style.animation = 'none';
            }
        }
    }
    
    endGame() {
        this.gameOver = true;
        const resultEl = document.getElementById('gameResult');
        
        let finalMessage = '';
        let finalIcon = '';
        
        if (this.playerWins > this.computerWins) {
            finalMessage = `Вітаємо! Ви виграли ${this.playerWins} з ${this.rounds} ігор!`;
            finalIcon = '🏆';
        } else if (this.computerWins > this.playerWins) {
            finalMessage = `Комп'ютер виграв ${this.computerWins} з ${this.rounds} ігор. Спробуйте ще!`;
            finalIcon = '🤖';
        } else {
            finalMessage = 'Відмінна гра! Нічия в загальному рахунку.';
            finalIcon = '🤝';
        }
        
        if (resultEl) {
            resultEl.innerHTML = `
                <div class="final-result">
                    <div class="final-icon">${finalIcon}</div>
                    <div class="final-message">${finalMessage}</div>
                    <button onclick="window.rockPaperScissors.startNewGame()" class="play-again-btn">
                        Грати знову
                    </button>
                </div>
            `;
        }
    }
    
    startTimedGame() {
        this.currentMode = 'timed';
        this.resetGame();
        this.timedMode.timeLeft = this.timedMode.duration;
        this.timedMode.roundsPlayed = 0;
        
        const timerEl = document.getElementById('timer');
        if (timerEl) {
            timerEl.parentElement.style.display = 'block';
        }
        
        this.timedMode.interval = setInterval(() => {
            this.timedMode.timeLeft -= 1000;
            this.updateTimerDisplay();
            
            if (this.timedMode.timeLeft <= 0) {
                this.endTimedGame();
            }
        }, 1000);
    }
    
    endTimedGame() {
        clearInterval(this.timedMode.interval);
        this.gameOver = true;
        
        const resultEl = document.getElementById('gameResult');
        const totalGames = this.playerWins + this.computerWins + this.draws;
        
        if (resultEl) {
            resultEl.innerHTML = `
                <div class="final-result">
                    <div class="final-icon">⏰</div>
                    <div class="final-message">
                        Час вийшов! За ${this.timedMode.roundsPlayed} ігор ви перемогли ${this.playerWins} разів!
                    </div>
                    <div class="timed-stats">
                        <div>Перемоги: ${this.playerWins}</div>
                        <div>Поразки: ${this.computerWins}</div>
                        <div>Нічиї: ${this.draws}</div>
                    </div>
                    <button onclick="window.rockPaperScissors.startNewGame()" class="play-again-btn">
                        Грати знову
                    </button>
                </div>
            `;
        }
    }
    
    setMode(mode) {
        this.currentMode = mode;
        this.resetGame();
        
        // Показуємо/ховаємо відповідні елементи UI
        const roundsGroup = document.querySelector('.rounds');
        const timerDisplay = document.querySelector('.timer-display');
        const difficultyGroup = document.querySelector('.difficulty');
        
        if (roundsGroup) roundsGroup.style.display = mode === 'timed' ? 'none' : 'block';
        if (timerDisplay) timerDisplay.style.display = mode === 'timed' ? 'block' : 'none';
        if (difficultyGroup) difficultyGroup.style.display = 'block';
        
        // Оновлюємо кнопки вибору
        this.updateChoiceButtons();
    }
    
    setRounds(rounds) {
        this.rounds = parseInt(rounds);
        this.resetGame();
    }
    
    updateChoiceButtons() {
        const choicesContainer = document.querySelector('.choices');
        if (!choicesContainer) return;
        
        const choices = this.getCurrentChoices();
        const buttons = Object.entries(choices).map(([key, choice]) => `
            <button class="choice" data-choice="${key}">
                ${choice.emoji} ${choice.name}
            </button>
        `).join('');
        
        choicesContainer.innerHTML = buttons;
        
        // Пере-підключаємо обробники подій
        this.setupEventListeners();
    }
    
    resetGame() {
        this.currentRound = 1;
        this.playerWins = 0;
        this.computerWins = 0;
        this.draws = 0;
        this.gameOver = false;
        
        // Очищуємо результати
        const resultEl = document.getElementById('gameResult');
        if (resultEl) resultEl.innerHTML = '';
        
        const playerChoiceEl = document.getElementById('playerChoice');
        const computerChoiceEl = document.getElementById('computerChoice');
        
        if (playerChoiceEl) playerChoiceEl.innerHTML = '';
        if (computerChoiceEl) computerChoiceEl.innerHTML = '';
        
        this.updateScore();
    }
    
    startNewGame() {
        if (this.currentMode === 'timed') {
            this.startTimedGame();
        } else {
            this.resetGame();
        }
    }
    
    saveChoice(choice) {
        // Зберігаємо в localStorage для аналітики
        let recentChoices = this.getRecentChoices(10);
        recentChoices.push(choice);
        
        localStorage.setItem('rps-recent-choices', JSON.stringify(recentChoices.slice(-10)));
        
        // Оновлюємо статистику
        let playerStats = this.getPlayerStats();
        playerStats[choice] = (playerStats[choice] || 0) + 1;
        localStorage.setItem('rps-player-stats', JSON.stringify(playerStats));
    }
    
    saveGameData() {
        const gameData = {
            scores: {
                playerWins: this.playerWins,
                computerWins: this.computerWins,
                draws: this.draws
            },
            settings: {
                mode: this.currentMode,
                rounds: this.rounds,
                soundEnabled: this.soundEnabled
            }
        };
        
        localStorage.setItem('rps-game-data', JSON.stringify(gameData));
    }
    
    loadGameData() {
        const saved = localStorage.getItem('rps-game-data');
        if (saved) {
            const data = JSON.parse(saved);
            if (data.scores) {
                this.playerWins = data.scores.playerWins || 0;
                this.computerWins = data.scores.computerWins || 0;
                this.draws = data.scores.draws || 0;
            }
            if (data.settings) {
                this.currentMode = data.settings.mode || 'classic';
                this.rounds = data.settings.rounds || 3;
                this.soundEnabled = data.settings.soundEnabled !== false;
            }
        }
    }
    
    playSound(type) {
        // Створюємо простий звуковий ефект
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        let frequency = 440;
        let duration = 200;
        
        switch (type) {
            case 'choice':
                frequency = 660;
                duration = 150;
                break;
            case 'win':
                frequency = 880;
                duration = 300;
                break;
            case 'lose':
                frequency = 220;
                duration = 400;
                break;
            case 'draw':
                frequency = 440;
                duration = 200;
                break;
        }
        
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration / 1000);
    }
}

// Глобальні функції
function playRPS(choice) {
    if (window.rockPaperScissors) {
        window.rockPaperScissors.playRound(choice);
    }
}

function resetRPS() {
    if (window.rockPaperScissors) {
        window.rockPaperScissors.resetGame();
    }
}

function setRPSMode(mode) {
    if (window.rockPaperScissors) {
        window.rockPaperScissors.setMode(mode);
    }
}

function setRPSRounds(rounds) {
    if (window.rockPaperScissors) {
        window.rockPaperScissors.setRounds(rounds);
    }
}

function startTimedGame() {
    if (window.rockPaperScissors) {
        window.rockPaperScissors.startTimedGame();
    }
}

function initializeRPS() {
    window.rockPaperScissors = new RockPaperScissors();
}

// CSS стилі для Rock Paper Scissors
const rpsStyles = `
    .rps-game {
        text-align: center;
        max-width: 600px;
        margin: 0 auto;
    }
    
    .choices {
        display: flex;
        justify-content: center;
        gap: 20px;
        margin: 30px 0;
        flex-wrap: wrap;
    }
    
    .choice {
        padding: 15px 25px;
        background: rgba(255, 255, 255, 0.1);
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50px;
        color: white;
        font-size: 1.1rem;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);
        min-width: 120px;
    }
    
    .choice:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: translateY(-3px);
        box-shadow: 0 8px 20px rgba(255, 255, 255, 0.2);
    }
    
    .choice:active {
        transform: translateY(-1px);
        scale: 0.95;
    }
    
    .result-area {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: 30px 0;
        gap: 20px;
        flex-wrap: wrap;
    }
    
    .player-choice, .computer-choice {
        flex: 1;
        min-width: 200px;
        padding: 20px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 15px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .choice-display {
        text-align: center;
        font-size: 3rem;
        margin-bottom: 10px;
        animation: bounceIn 0.6s ease-out;
    }
    
    .choice-name {
        font-size: 1rem;
        font-weight: bold;
        opacity: 0.8;
    }
    
    .vs {
        font-size: 1.5rem;
        font-weight: bold;
        color: #f39c12;
        padding: 10px;
    }
    
    .thinking {
        font-size: 2rem;
        animation: pulse 1s infinite;
    }
    
    .game-result {
        margin: 30px 0;
        min-height: 120px;
    }
    
    .result-display {
        padding: 20px;
        border-radius: 15px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        animation: slideInUp 0.5s ease-out;
    }
    
    .result-display.win {
        background: rgba(46, 204, 113, 0.2);
        border-color: #2ecc71;
    }
    
    .result-display.lose {
        background: rgba(231, 76, 60, 0.2);
        border-color: #e74c3c;
    }
    
    .result-display.draw {
        background: rgba(52, 152, 219, 0.2);
        border-color: #3498db;
    }
    
    .result-icon {
        font-size: 3rem;
        margin-bottom: 10px;
        animation: bounce 0.6s ease-out;
    }
    
    .result-text {
        font-size: 1.5rem;
        font-weight: bold;
        margin-bottom: 10px;
    }
    
    .result-details {
        font-size: 1rem;
        opacity: 0.8;
    }
    
    .final-result {
        text-align: center;
        padding: 30px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 20px;
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .final-icon {
        font-size: 4rem;
        margin-bottom: 20px;
        animation: bounce 1s ease-out;
    }
    
    .final-message {
        font-size: 1.3rem;
        margin-bottom: 20px;
        line-height: 1.4;
    }
    
    .timed-stats {
        display: flex;
        justify-content: center;
        gap: 20px;
        margin: 20px 0;
        flex-wrap: wrap;
    }
    
    .timed-stats div {
        background: rgba(255, 255, 255, 0.2);
        padding: 10px 15px;
        border-radius: 15px;
        font-weight: bold;
    }
    
    .play-again-btn {
        padding: 12px 24px;
        background: linear-gradient(45deg, #3498db, #2980b9);
        border: none;
        border-radius: 25px;
        color: white;
        font-size: 1.1rem;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s ease;
        margin-top: 20px;
    }
    
    .play-again-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(52, 152, 219, 0.4);
    }
    
    .rounds, .timer-display, .difficulty {
        margin: 20px 0;
        padding: 15px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        backdrop-filter: blur(10px);
    }
    
    .rounds label, .difficulty label {
        display: block;
        margin-bottom: 8px;
        font-weight: bold;
    }
    
    .rounds select, .difficulty select {
        padding: 8px 12px;
        border: none;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.2);
        color: white;
        font-size: 1rem;
    }
    
    .rounds select option, .difficulty select option {
        background: #2c3e50;
        color: white;
    }
    
    .timer {
        font-size: 1.5rem;
        font-weight: bold;
        color: #f39c12;
    }
    
    .game-controls {
        display: flex;
        justify-content: center;
        gap: 15px;
        margin-top: 20px;
        flex-wrap: wrap;
    }
    
    .mode-selector {
        display: flex;
        justify-content: center;
        gap: 10px;
        margin-bottom: 20px;
    }
    
    .mode-btn {
        padding: 8px 16px;
        background: rgba(255, 255, 255, 0.2);
        border: 2px solid transparent;
        color: white;
        border-radius: 20px;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 0.9rem;
    }
    
    .mode-btn:hover {
        background: rgba(255, 255, 255, 0.3);
    }
    
    .mode-btn.active {
        border-color: #3498db;
        background: rgba(52, 152, 219, 0.3);
    }
    
    .sound-toggle {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 15px 0;
    }
    
    .sound-toggle input[type="checkbox"] {
        transform: scale(1.2);
    }
    
    @keyframes bounceIn {
        0% { transform: scale(0.3); opacity: 0; }
        50% { transform: scale(1.05); }
        70% { transform: scale(0.9); }
        100% { transform: scale(1); opacity: 1; }
    }
    
    @keyframes slideInUp {
        0% { transform: translateY(50px); opacity: 0; }
        100% { transform: translateY(0); opacity: 1; }
    }
    
    @keyframes bounce {
        0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
        40% { transform: translateY(-10px); }
        60% { transform: translateY(-5px); }
    }
    
    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }
    
    @media (max-width: 768px) {
        .choices {
            flex-direction: column;
            align-items: center;
        }
        
        .choice {
            width: 200px;
        }
        
        .result-area {
            flex-direction: column;
        }
        
        .player-choice, .computer-choice {
            width: 100%;
        }
        
        .timed-stats {
            flex-direction: column;
            align-items: center;
        }
    }
`;

function loadRockPaperScissors(container) {
    container.innerHTML = `
        <h2>✋ Камінь, ножиці, папір</h2>
        
        <div class="mode-selector">
            <button class="mode-btn active" onclick="setRPSMode('classic')">
                🎯 Класична
            </button>
            <button class="mode-btn" onclick="setRPSMode('extended')">
                🖖 Розширена (Spock, Ящірка)
            </button>
            <button class="mode-btn" onclick="setRPSMode('timed')">
                ⏰ На час
            </button>
        </div>
        
        <div class="game-area">
            <div class="rps-game">
                <div class="choices">
                    <!-- Кнопки будуть додані динамічно -->
                </div>
                
                <div class="result-area">
                    <div class="player-choice" id="playerChoice"></div>
                    <div class="vs">VS</div>
                    <div class="computer-choice" id="computerChoice"></div>
                </div>
                
                <div class="game-result" id="gameResult"></div>
            </div>
        </div>
        
        <div class="game-controls">
            <div class="timer-display" style="display: none;">
                <div class="timer">Час: <span id="timer">30</span> сек</div>
                <button onclick="startTimedGame()" style="margin-top: 10px;">Почати гру на час</button>
            </div>
            
            <div class="rounds">
                <label>Кількість раундів: </label>
                <select id="roundsSelect" onchange="setRPSRounds(this.value)">
                    <option value="1">1</option>
                    <option value="3" selected>3</option>
                    <option value="5">5</option>
                    <option value="10">10</option>
                </select>
            </div>
            
            <div class="difficulty">
                <label>Складність ІІ: </label>
                <select id="difficultySelect">
                    <option value="easy">Простий</option>
                    <option value="medium" selected>Середній</option>
                    <option value="hard">Складний</option>
                </select>
            </div>
            
            <div class="sound-toggle">
                <input type="checkbox" id="soundToggle" checked>
                <label for="soundToggle">🔊 Звукові ефекти</label>
            </div>
            
            <div class="score">
                <span>Ваші перемоги: <span id="playerWins">0</span></span>
                <span>Перемоги комп'ютера: <span id="computerWins">0</span></span>
            </div>
            
            <button onclick="resetRPS()" style="margin: 10px;">Нова гра</button>
        </div>
    `;
    
    // Додаємо стилі
    const style = document.createElement('style');
    style.textContent = rpsStyles;
    document.head.appendChild(style);
    
    initializeRPS();
}
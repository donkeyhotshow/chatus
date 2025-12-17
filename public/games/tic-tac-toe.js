// ===== УЛУЧШЕННАЯ TIC TAC TOE ИГРА =====

class TicTacToe {
    constructor() {
        this.board = [
            ['', '', ''],
            ['', '', ''],
            ['', '', '']
        ];
        this.currentPlayer = 'X';
        this.gameOver = false;
        this.winner = null;
        this.moves = 0;
        this.maxMoves = 9;
        
        // Статистика
        this.scores = {
            X: 0,
            O: 0,
            draws: 0
        };
        
        // Настройки игры
        this.gameMode = 'pvp'; // 'pvp', 'ai-easy', 'ai-hard'
        this.difficulty = 'medium'; // 'easy', 'medium', 'hard'
        this.symbols = {
            X: { name: 'Хрестик', icon: '❌', color: '#e74c3c' },
            O: { name: 'Нулик', icon: '⭕', color: '#3498db' }
        };
        
        // Анимации
        this.animations = {
            win: '🎉',
            lose: '😢',
            draw: '🤝',
            thinking: '🤔'
        };
        
        this.init();
    }
    
    init() {
        this.loadScores();
        this.setupEventListeners();
        this.updateDisplay();
    }
    
    setupEventListeners() {
        // Додаємо обробники для клітинок
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const cell = document.querySelector(`[data-row="${i}"][data-col="${j}"]`);
                if (cell) {
                    cell.addEventListener('click', () => this.makeMove(i, j));
                }
            }
        }
    }
    
    makeMove(row, col) {
        if (this.gameOver || this.board[row][col] !== '') {
            return;
        }
        
        // Робимо хід гравця
        this.board[row][col] = this.currentPlayer;
        this.moves++;
        
        // Анімація ходу
        this.animateMove(row, col, this.currentPlayer);
        
        // Перевіряємо перемогу
        if (this.checkWin()) {
            this.gameOver = true;
            this.winner = this.currentPlayer;
            this.updateScores();
            this.showWinAnimation();
            return;
        }
        
        // Перевіряємо нічию
        if (this.moves >= this.maxMoves) {
            this.gameOver = true;
            this.winner = 'draw';
            this.updateScores();
            this.showDrawAnimation();
            return;
        }
        
        // Змінюємо гравця
        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        
        // Якщо гра проти ІІ
        if (this.gameMode !== 'pvp' && this.currentPlayer === 'O') {
            this.makeAIMove();
        }
        
        this.updateDisplay();
    }
    
    animateMove(row, col, player) {
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
            cell.style.transform = 'scale(0.8)';
            cell.style.opacity = '0.5';
            
            setTimeout(() => {
                cell.style.transform = 'scale(1)';
                cell.style.opacity = '1';
            }, 150);
        }
    }
    
    checkWin() {
        // Перевіряємо рядки
        for (let i = 0; i < 3; i++) {
            if (this.board[i][0] && 
                this.board[i][0] === this.board[i][1] && 
                this.board[i][1] === this.board[i][2]) {
                return { player: this.board[i][0], line: 'row', index: i };
            }
        }
        
        // Перевіряємо стовпці
        for (let j = 0; j < 3; j++) {
            if (this.board[0][j] && 
                this.board[0][j] === this.board[1][j] && 
                this.board[1][j] === this.board[2][j]) {
                return { player: this.board[0][j], line: 'col', index: j };
            }
        }
        
        // Перевіряємо діагоналі
        if (this.board[0][0] && 
            this.board[0][0] === this.board[1][1] && 
            this.board[1][1] === this.board[2][2]) {
            return { player: this.board[0][0], line: 'diag', index: 0 };
        }
        
        if (this.board[0][2] && 
            this.board[0][2] === this.board[1][1] && 
            this.board[1][1] === this.board[2][0]) {
            return { player: this.board[0][2], line: 'anti-diag', index: 0 };
        }
        
        return null;
    }
    
    makeAIMove() {
        // Імітуємо "думання" ІІ
        const thinkingTime = this.difficulty === 'easy' ? 500 : 
                           this.difficulty === 'medium' ? 1000 : 1500;
        
        setTimeout(() => {
            let move;
            
            if (this.difficulty === 'easy') {
                move = this.getRandomMove();
            } else if (this.difficulty === 'medium') {
                move = this.getSmartMove();
            } else {
                move = this.getBestMove();
            }
            
            if (move) {
                this.makeMove(move.row, move.col);
            }
        }, thinkingTime);
    }
    
    getRandomMove() {
        const emptyCells = [];
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (this.board[i][j] === '') {
                    emptyCells.push({ row: i, col: j });
                }
            }
        }
        
        return emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }
    
    getSmartMove() {
        // Перевіряємо можливість виграти
        const winMove = this.findWinningMove('O');
        if (winMove) return winMove;
        
        // Блокуємо виграш супротивника
        const blockMove = this.findWinningMove('X');
        if (blockMove) return blockMove;
        
        // Беремо центр якщо доступний
        if (this.board[1][1] === '') return { row: 1, col: 1 };
        
        // Беремо кут
        const corners = [{ row: 0, col: 0 }, { row: 0, col: 2 }, { row: 2, col: 0 }, { row: 2, col: 2 }];
        const availableCorners = corners.filter(corner => this.board[corner.row][corner.col] === '');
        if (availableCorners.length > 0) {
            return availableCorners[Math.floor(Math.random() * availableCorners.length)];
        }
        
        // Беремо будь-яку вільну клітинку
        return this.getRandomMove();
    }
    
    getBestMove() {
        // Мінімакс алгоритм для ідеальної гри
        return this.minimax(this.board, 0, true).position;
    }
    
    findWinningMove(player) {
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (this.board[i][j] === '') {
                    this.board[i][j] = player;
                    if (this.checkWin() && this.checkWin().player === player) {
                        this.board[i][j] = '';
                        return { row: i, col: j };
                    }
                    this.board[i][j] = '';
                }
            }
        }
        return null;
    }
    
    minimax(board, depth, isMaximizing) {
        const win = this.checkWinForMinimax(board);
        
        if (win) {
            if (win === 'O') return { score: 10 - depth };
            if (win === 'X') return { score: depth - 10 };
            return { score: 0 };
        }
        
        const availableMoves = [];
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (board[i][j] === '') {
                    availableMoves.push({ row: i, col: j });
                }
            }
        }
        
        if (availableMoves.length === 0) {
            return { score: 0 };
        }
        
        let bestMove = null;
        
        if (isMaximizing) {
            let bestScore = -Infinity;
            for (let move of availableMoves) {
                board[move.row][move.col] = 'O';
                const result = this.minimax(board, depth + 1, false);
                board[move.row][move.col] = '';
                
                if (result.score > bestScore) {
                    bestScore = result.score;
                    bestMove = move;
                }
            }
            return { score: bestScore, position: bestMove };
        } else {
            let bestScore = Infinity;
            for (let move of availableMoves) {
                board[move.row][move.col] = 'X';
                const result = this.minimax(board, depth + 1, true);
                board[move.row][move.col] = '';
                
                if (result.score < bestScore) {
                    bestScore = result.score;
                    bestMove = move;
                }
            }
            return { score: bestScore, position: bestMove };
        }
    }
    
    checkWinForMinimax(board) {
        // Перевіряємо рядки
        for (let i = 0; i < 3; i++) {
            if (board[i][0] && board[i][0] === board[i][1] && board[i][1] === board[i][2]) {
                return board[i][0];
            }
        }
        
        // Перевіряємо стовпці
        for (let j = 0; j < 3; j++) {
            if (board[0][j] && board[0][j] === board[1][j] && board[1][j] === board[2][j]) {
                return board[0][j];
            }
        }
        
        // Перевіряємо діагоналі
        if (board[0][0] && board[0][0] === board[1][1] && board[1][1] === board[2][2]) {
            return board[0][0];
        }
        
        if (board[0][2] && board[0][2] === board[1][1] && board[1][1] === board[2][0]) {
            return board[0][2];
        }
        
        return null;
    }
    
    updateDisplay() {
        // Оновлюємо клітинки
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const cell = document.querySelector(`[data-row="${i}"][data-col="${j}"]`);
                if (cell) {
                    cell.textContent = this.board[i][j];
                    cell.className = 'cell';
                    
                    if (this.board[i][j] === 'X') {
                        cell.classList.add('x');
                    } else if (this.board[i][j] === 'O') {
                        cell.classList.add('o');
                    }
                }
            }
        }
        
        // Оновлюємо поточного гравця
        const currentPlayerEl = document.getElementById('currentPlayer');
        if (currentPlayerEl) {
            currentPlayerEl.textContent = this.currentPlayer;
            currentPlayerEl.style.color = this.symbols[this.currentPlayer].color;
        }
        
        // Оновлюємо статистику
        this.updateScoreDisplay();
    }
    
    updateScoreDisplay() {
        const scoreX = document.getElementById('scoreX');
        const scoreO = document.getElementById('scoreO');
        const scoreDraw = document.getElementById('scoreDraw');
        
        if (scoreX) scoreX.textContent = this.scores.X;
        if (scoreO) scoreO.textContent = this.scores.O;
        if (scoreDraw) scoreDraw.textContent = this.scores.draws;
    }
    
    showWinAnimation() {
        const resultElement = document.createElement('div');
        resultElement.className = 'win-animation';
        resultElement.innerHTML = `
            <div class="win-content">
                <div class="win-icon">${this.animations.win}</div>
                <div class="win-text">
                    <h3>${this.winner === 'X' ? 'Хрестик' : 'Нулик'} переміг!</h3>
                    <p>Вітаємо з перемогою!</p>
                </div>
                <button onclick="window.ticTacToe.resetGame()" class="play-again-btn">
                    Грати знову
                </button>
            </div>
        `;
        
        document.body.appendChild(resultElement);
        
        // Підсвічуємо виграшну лінію
        setTimeout(() => this.highlightWinLine(), 500);
        
        // Зберігаємо результат
        this.saveScores();
    }
    
    showDrawAnimation() {
        const resultElement = document.createElement('div');
        resultElement.className = 'draw-animation';
        resultElement.innerHTML = `
            <div class="draw-content">
                <div class="draw-icon">${this.animations.draw}</div>
                <div class="draw-text">
                    <h3>Нічия!</h3>
                    <p>Відмінна гра з обох сторін!</p>
                </div>
                <button onclick="window.ticTacToe.resetGame()" class="play-again-btn">
                    Грати знову
                </button>
            </div>
        `;
        
        document.body.appendChild(resultElement);
        this.saveScores();
    }
    
    highlightWinLine() {
        const win = this.checkWin();
        if (!win) return;
        
        // Додаємо клас для анімації виграшної лінії
        if (win.line === 'row') {
            for (let j = 0; j < 3; j++) {
                const cell = document.querySelector(`[data-row="${win.index}"][data-col="${j}"]`);
                if (cell) cell.classList.add('winning-cell');
            }
        } else if (win.line === 'col') {
            for (let i = 0; i < 3; i++) {
                const cell = document.querySelector(`[data-row="${i}"][data-col="${win.index}"]`);
                if (cell) cell.classList.add('winning-cell');
            }
        } else if (win.line === 'diag') {
            for (let i = 0; i < 3; i++) {
                const cell = document.querySelector(`[data-row="${i}"][data-col="${i}"]`);
                if (cell) cell.classList.add('winning-cell');
            }
        } else if (win.line === 'anti-diag') {
            for (let i = 0; i < 3; i++) {
                const cell = document.querySelector(`[data-row="${i}"][data-col="${2 - i}"]`);
                if (cell) cell.classList.add('winning-cell');
            }
        }
    }
    
    updateScores() {
        if (this.winner === 'X') {
            this.scores.X++;
        } else if (this.winner === 'O') {
            this.scores.O++;
        } else {
            this.scores.draws++;
        }
    }
    
    resetGame() {
        this.board = [
            ['', '', ''],
            ['', '', ''],
            ['', '', '']
        ];
        this.currentPlayer = 'X';
        this.gameOver = false;
        this.winner = null;
        this.moves = 0;
        
        // Видаляємо анімації
        const animations = document.querySelectorAll('.win-animation, .draw-animation');
        animations.forEach(anim => anim.remove());
        
        // Видаляємо класи перемоги
        document.querySelectorAll('.winning-cell').forEach(cell => {
            cell.classList.remove('winning-cell');
        });
        
        this.updateDisplay();
    }
    
    setGameMode(mode) {
        this.gameMode = mode;
        this.resetGame();
    }
    
    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        if (this.gameMode !== 'pvp') {
            this.resetGame();
        }
    }
    
    loadScores() {
        const saved = localStorage.getItem('tic-tac-toe-scores');
        if (saved) {
            this.scores = JSON.parse(saved);
        }
    }
    
    saveScores() {
        localStorage.setItem('tic-tac-toe-scores', JSON.stringify(this.scores));
    }
}

// Глобальні функції
function makeMove(row, col) {
    if (window.ticTacToe) {
        window.ticTacToe.makeMove(row, col);
    }
}

function resetGame() {
    if (window.ticTacToe) {
        window.ticTacToe.resetGame();
    }
}

function setGameMode(mode) {
    if (window.ticTacToe) {
        window.ticTacToe.setGameMode(mode);
        updateGameModeUI(mode);
    }
}

function setDifficulty(difficulty) {
    if (window.ticTacToe) {
        window.ticTacToe.setDifficulty(difficulty);
    }
}

function initializeTicTacToe() {
    window.ticTacToe = new TicTacToe();
}

// CSS стилі для Tic Tac Toe
const ticTacToeStyles = `
    .tic-tac-toe-board {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-template-rows: repeat(3, 1fr);
        gap: 4px;
        width: 300px;
        height: 300px;
        margin: 20px auto;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 15px;
        padding: 10px;
        backdrop-filter: blur(10px);
    }
    
    .cell {
        background: rgba(255, 255, 255, 0.2);
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2.5rem;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s ease;
        color: white;
        backdrop-filter: blur(5px);
    }
    
    .cell:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: scale(1.05);
    }
    
    .cell.x {
        color: #e74c3c;
        text-shadow: 0 0 10px rgba(231, 76, 60, 0.5);
    }
    
    .cell.o {
        color: #3498db;
        text-shadow: 0 0 10px rgba(52, 152, 219, 0.5);
    }
    
    .cell.winning-cell {
        background: rgba(46, 204, 113, 0.3);
        border-color: #2ecc71;
        animation: winPulse 1s ease-in-out infinite;
        transform: scale(1.1);
    }
    
    @keyframes winPulse {
        0%, 100% { box-shadow: 0 0 20px rgba(46, 204, 113, 0.5); }
        50% { box-shadow: 0 0 40px rgba(46, 204, 113, 0.8); }
    }
    
    .game-controls {
        text-align: center;
        margin-top: 20px;
    }
    
    .current-player {
        font-size: 1.5rem;
        font-weight: bold;
        margin-bottom: 15px;
        padding: 10px 20px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 25px;
        display: inline-block;
    }
    
    .score {
        display: flex;
        justify-content: center;
        gap: 20px;
        margin: 15px 0;
        flex-wrap: wrap;
    }
    
    .score span {
        background: rgba(255, 255, 255, 0.1);
        padding: 8px 15px;
        border-radius: 20px;
        font-weight: bold;
    }
    
    .game-settings {
        margin: 20px 0;
        padding: 15px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 15px;
    }
    
    .settings-group {
        margin-bottom: 15px;
    }
    
    .settings-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: bold;
    }
    
    .settings-group select {
        padding: 8px 12px;
        border: none;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.2);
        color: white;
        font-size: 1rem;
    }
    
    .settings-group select option {
        background: #2c3e50;
        color: white;
    }
    
    .win-animation, .draw-animation {
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
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    .win-content, .draw-content {
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(20px);
        border-radius: 20px;
        padding: 40px;
        text-align: center;
        border: 1px solid rgba(255, 255, 255, 0.2);
        animation: slideIn 0.5s ease-out;
    }
    
    @keyframes slideIn {
        from { transform: translateY(-50px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
    
    .win-icon, .draw-icon {
        font-size: 4rem;
        margin-bottom: 20px;
        animation: bounce 1s ease-in-out infinite;
    }
    
    @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
    }
    
    .win-text h3, .draw-text h3 {
        font-size: 2rem;
        margin-bottom: 10px;
        color: white;
    }
    
    .win-text p, .draw-text p {
        font-size: 1.2rem;
        opacity: 0.8;
        margin-bottom: 20px;
        color: white;
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
    }
    
    .play-again-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(52, 152, 219, 0.4);
    }
    
    .game-mode-btn {
        padding: 8px 16px;
        margin: 0 5px;
        background: rgba(255, 255, 255, 0.2);
        border: 2px solid transparent;
        color: white;
        border-radius: 20px;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 0.9rem;
    }
    
    .game-mode-btn:hover {
        background: rgba(255, 255, 255, 0.3);
    }
    
    .game-mode-btn.active {
        border-color: #3498db;
        background: rgba(52, 152, 219, 0.3);
    }
    
    @media (max-width: 768px) {
        .tic-tac-toe-board {
            width: 250px;
            height: 250px;
        }
        
        .cell {
            font-size: 2rem;
        }
        
        .score {
            flex-direction: column;
            align-items: center;
        }
    }
`;

function updateGameModeUI(mode) {
    document.querySelectorAll('.game-mode-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
}

function loadTicTacToe(container) {
    container.innerHTML = `
        <h2>🎮 Хрестики-нулики</h2>
        
        <div class="game-settings">
            <div class="settings-group">
                <label>Режим гри:</label>
                <div>
                    <button class="game-mode-btn active" data-mode="pvp" onclick="setGameMode('pvp')">
                        👥 Гравець vs Гравець
                    </button>
                    <button class="game-mode-btn" data-mode="ai-easy" onclick="setGameMode('ai-easy')">
                        🤖 Простий ІІ
                    </button>
                    <button class="game-mode-btn" data-mode="ai-hard" onclick="setGameMode('ai-hard')">
                        🧠 Розумний ІІ
                    </button>
                </div>
            </div>
            
            <div class="settings-group" id="difficultyGroup" style="display: none;">
                <label>Складність ІІ:</label>
                <select onchange="setDifficulty(this.value)">
                    <option value="easy">Простий</option>
                    <option value="medium" selected>Середній</option>
                    <option value="hard">Складний</option>
                </select>
            </div>
        </div>
        
        <div class="game-area">
            <div class="tic-tac-toe-board">
                <div class="cell" data-row="0" data-col="0"></div>
                <div class="cell" data-row="0" data-col="1"></div>
                <div class="cell" data-row="0" data-col="2"></div>
                <div class="cell" data-row="1" data-col="0"></div>
                <div class="cell" data-row="1" data-col="1"></div>
                <div class="cell" data-row="1" data-col="2"></div>
                <div class="cell" data-row="2" data-col="0"></div>
                <div class="cell" data-row="2" data-col="1"></div>
                <div class="cell" data-row="2" data-col="2"></div>
            </div>
        </div>
        
        <div class="game-controls">
            <div class="current-player">Гравець: <span id="currentPlayer">X</span></div>
            <button onclick="resetGame()" style="margin: 10px;">Нова гра</button>
            <div class="score">
                <span>❌ Перемог: <span id="scoreX">0</span></span>
                <span>⭕ Перемог: <span id="scoreO">0</span></span>
                <span>🤝 Нічиїх: <span id="scoreDraw">0</span></span>
            </div>
        </div>
    `;
    
    // Додаємо стилі
    const style = document.createElement('style');
    style.textContent = ticTacToeStyles;
    document.head.appendChild(style);
    
    initializeTicTacToe();
    
    // Показуємо/ховаємо налаштування складності
    const difficultyGroup = document.getElementById('difficultyGroup');
    const originalSetGameMode = setGameMode;
    setGameMode = function(mode) {
        originalSetGameMode(mode);
        difficultyGroup.style.display = (mode === 'pvp') ? 'none' : 'block';
    };
}
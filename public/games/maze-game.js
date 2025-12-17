// ===== УЛУЧШЕННАЯ CO-OP MAZE GAME =====

class MazeGame {
    constructor() {
        this.canvas = document.getElementById('mazeCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameWidth = 800;
        this.gameHeight = 600;
        this.cellSize = 20;
        this.cols = Math.floor(this.gameWidth / this.cellSize);
        this.rows = Math.floor(this.gameHeight / this.cellSize);
        
        // Лабіринт
        this.maze = [];
        this.startPos = { x: 1, y: 1 };
        this.endPos = { x: this.cols - 2, y: this.rows - 2 };
        
        // Гравці
        this.players = [
            {
                id: 1,
                x: this.startPos.x,
                y: this.startPos.y,
                color: '#e74c3c',
                icon: '🔴',
                name: 'Гравець 1',
                keys: { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD' },
                score: 0,
                moves: 0
            },
            {
                id: 2,
                x: this.startPos.x,
                y: this.startPos.y + 1,
                color: '#3498db',
                icon: '🔵',
                name: 'Гравець 2',
                keys: { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' },
                score: 0,
                moves: 0
            }
        ];
        
        // Налаштування гри
        this.gameMode = 'co-op'; // 'co-op', 'race', 'timed'
        this.isPlaying = false;
        this.startTime = 0;
        this.timeLimit = 300000; // 5 хвилин
        this.timeLeft = this.timeLimit;
        
        // Різні типи клітинок
        this.cellTypes = {
            WALL: 1,
            PATH: 0,
            START: 2,
            END: 3,
            POWER_UP: 4,
            TELEPORT: 5,
            TRAP: 6
        };
        
        // Предмети та бонуси
        this.powerUps = [];
        this.teleports = [];
        this.traps = [];
        
        // Статистика
        this.gameStats = {
            totalGames: 0,
            totalWins: 0,
            bestTime: Infinity,
            averageTime: 0,
            totalMoves: 0
        };
        
        this.loadStats();
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.generateMaze();
        this.gameLoop();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }
    
    handleKeyPress(e) {
        if (!this.isPlaying) return;
        
        // Обробляємо рух гравців
        this.players.forEach(player => {
            if (e.code === player.keys.up) {
                this.movePlayer(player, 0, -1);
            } else if (e.code === player.keys.down) {
                this.movePlayer(player, 0, 1);
            } else if (e.code === player.keys.left) {
                this.movePlayer(player, -1, 0);
            } else if (e.code === player.keys.right) {
                this.movePlayer(player, 1, 0);
            }
        });
    }
    
    movePlayer(player, dx, dy) {
        const newX = player.x + dx;
        const newY = player.y + dy;
        
        // Перевіряємо межі
        if (newX < 0 || newX >= this.cols || newY < 0 || newY >= this.rows) {
            return;
        }
        
        // Перевіряємо стіну
        if (this.maze[newY][newX] === this.cellTypes.WALL) {
            return;
        }
        
        // Перевіряємо пастки
        if (this.maze[newY][newX] === this.cellTypes.TRAP) {
            this.triggerTrap(player, newX, newY);
            return;
        }
        
        // Телепортація
        if (this.maze[newY][newX] === this.cellTypes.TELEPORT) {
            this.teleportPlayer(player, newX, newY);
            return;
        }
        
        // Рух
        player.x = newX;
        player.y = newY;
        player.moves++;
        
        // Перевіряємо бонуси
        this.checkPowerUps(player, newX, newY);
        
        // Перевіряємо перемогу
        this.checkWinCondition();
        
        // Оновлюємо відображення
        this.updatePlayerDisplay();
    }
    
    checkPowerUps(player, x, y) {
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            if (powerUp.x === x && powerUp.y === y) {
                this.applyPowerUp(player, powerUp);
                this.powerUps.splice(i, 1);
                break;
            }
        }
    }
    
    applyPowerUp(player, powerUp) {
        switch (powerUp.type) {
            case 'speed':
                player.score += 50;
                this.showNotification(`${player.name} отримав швидкість!`, player.color);
                break;
            case 'points':
                player.score += 100;
                this.showNotification(`${player.name} отримав очки!`, player.color);
                break;
            case 'time':
                this.timeLeft += 30000; // +30 секунд
                this.showNotification(`${player.name} отримав додатковий час!`, '#f39c12');
                break;
        }
    }
    
    triggerTrap(player, x, y) {
        // Переміщуємо гравця назад
        player.x = this.startPos.x;
        player.y = this.startPos.y;
        player.score = Math.max(0, player.score - 25);
        
        this.showNotification(`${player.name} потрапив у пастку!`, '#e74c3c');
    }
    
    teleportPlayer(player, x, y) {
        // Знаходимо парний телепорт
        const teleportIndex = this.teleports.findIndex(t => t.x === x && t.y === y);
        if (teleportIndex !== -1) {
            const pairIndex = teleportIndex % 2 === 0 ? teleportIndex + 1 : teleportIndex - 1;
            if (this.teleports[pairIndex]) {
                const destination = this.teleports[pairIndex];
                player.x = destination.x;
                player.y = destination.y;
                this.showNotification(`${player.name} телепортувався!`, '#9b59b6');
            }
        }
    }
    
    checkWinCondition() {
        const player1AtEnd = this.players[0].x === this.endPos.x && this.players[0].y === this.endPos.y;
        const player2AtEnd = this.players[1].x === this.endPos.x && this.players[1].y === this.endPos.y;
        
        if (this.gameMode === 'co-op') {
            // Обидва гравці повинні дійти до кінця
            if (player1AtEnd && player2AtEnd) {
                this.endGame('co-op-win');
            }
        } else if (this.gameMode === 'race') {
            // Перший хто дійде до кінця
            if (player1AtEnd || player2AtEnd) {
                const winner = player1AtEnd ? this.players[0] : this.players[1];
                this.endGame('race-win', winner);
            }
        }
    }
    
    generateMaze() {
        // Ініціалізуємо лабіринт стінами
        this.maze = Array(this.rows).fill().map(() => Array(this.cols).fill(this.cellTypes.WALL));
        
        // Алгоритм генерації лабіринту (Recursive Backtracking)
        this.generateMazeRecursive(1, 1);
        
        // Встановлюємо стартову та кінцеву позиції
        this.maze[this.startPos.y][this.startPos.x] = this.cellTypes.START;
        this.maze[this.endPos.y][this.endPos.x] = this.cellTypes.END;
        
        // Додаємо спеціальні елементи
        this.addSpecialElements();
    }
    
    generateMazeRecursive(x, y) {
        this.maze[y][x] = this.cellTypes.PATH;
        
        const directions = [
            [0, -2], [2, 0], [0, 2], [-2, 0]
        ];
        
        // Перемішуємо напрямки для випадковості
        this.shuffleArray(directions);
        
        for (let [dx, dy] of directions) {
            const newX = x + dx;
            const newY = y + dy;
            
            if (newX > 0 && newX < this.cols - 1 && 
                newY > 0 && newY < this.rows - 1 && 
                this.maze[newY][newX] === this.cellTypes.WALL) {
                
                // Видаляємо стіну між клітинками
                this.maze[y + dy/2][x + dx/2] = this.cellTypes.PATH;
                
                // Рекурсивно генеруємо далі
                this.generateMazeRecursive(newX, newY);
            }
        }
    }
    
    addSpecialElements() {
        const emptyCells = [];
        
        // Знаходимо всі порожні клітинки
        for (let y = 1; y < this.rows - 1; y++) {
            for (let x = 1; x < this.cols - 1; x++) {
                if (this.maze[y][x] === this.cellTypes.PATH && 
                    !(x === this.startPos.x && y === this.startPos.y) &&
                    !(x === this.endPos.x && y === this.endPos.y)) {
                    emptyCells.push({ x, y });
                }
            }
        }
        
        this.shuffleArray(emptyCells);
        
        // Додаємо бонуси (10% клітинок)
        const powerUpCount = Math.floor(emptyCells.length * 0.1);
        for (let i = 0; i < powerUpCount && i < emptyCells.length; i++) {
            const cell = emptyCells[i];
            const powerUpTypes = ['speed', 'points', 'time'];
            const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
            
            this.powerUps.push({
                x: cell.x,
                y: cell.y,
                type: type,
                icon: this.getPowerUpIcon(type)
            });
            
            this.maze[cell.y][cell.x] = this.cellTypes.POWER_UP;
        }
        
        // Додаємо телепорти (парами)
        const teleportCount = Math.min(4, Math.floor(emptyCells.length * 0.02));
        for (let i = 0; i < teleportCount * 2 && i + powerUpCount < emptyCells.length; i += 2) {
            const cell1 = emptyCells[powerUpCount + i];
            const cell2 = emptyCells[powerUpCount + i + 1];
            
            this.teleports.push({ x: cell1.x, y: cell1.y });
            this.teleports.push({ x: cell2.x, y: cell2.y });
            
            this.maze[cell1.y][cell1.x] = this.cellTypes.TELEPORT;
            this.maze[cell2.y][cell2.x] = this.cellTypes.TELEPORT;
        }
        
        // Додаємо пастки (5% клітинок)
        const trapCount = Math.floor(emptyCells.length * 0.05);
        for (let i = 0; i < trapCount && i + powerUpCount + teleportCount * 2 < emptyCells.length; i++) {
            const cell = emptyCells[powerUpCount + teleportCount * 2 + i];
            this.maze[cell.y][cell.x] = this.cellTypes.TRAP;
        }
    }
    
    getPowerUpIcon(type) {
        switch (type) {
            case 'speed': return '⚡';
            case 'points': return '💎';
            case 'time': return '⏰';
            default: return '⭐';
        }
    }
    
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.gameWidth, this.gameHeight);
        
        // Малюємо лабіринт
        this.drawMaze();
        
        // Малюємо гравців
        this.drawPlayers();
        
        // Малюємо спеціальні елементи
        this.drawSpecialElements();
    }
    
    drawMaze() {
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                const cellType = this.maze[y][x];
                const pixelX = x * this.cellSize;
                const pixelY = y * this.cellSize;
                
                // Колір клітинки
                switch (cellType) {
                    case this.cellTypes.WALL:
                        this.ctx.fillStyle = '#2c3e50';
                        break;
                    case this.cellTypes.PATH:
                        this.ctx.fillStyle = '#ecf0f1';
                        break;
                    case this.cellTypes.START:
                        this.ctx.fillStyle = '#27ae60';
                        break;
                    case this.cellTypes.END:
                        this.ctx.fillStyle = '#f39c12';
                        break;
                    default:
                        this.ctx.fillStyle = '#ecf0f1';
                }
                
                this.ctx.fillRect(pixelX, pixelY, this.cellSize, this.cellSize);
                
                // Границі клітинок
                this.ctx.strokeStyle = '#bdc3c7';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(pixelX, pixelY, this.cellSize, this.cellSize);
            }
        }
    }
    
    drawPlayers() {
        this.players.forEach(player => {
            const pixelX = player.x * this.cellSize;
            const pixelY = player.y * this.cellSize;
            
            // Малюємо гравця
            this.ctx.fillStyle = player.color;
            this.ctx.fillRect(pixelX + 2, pixelY + 2, this.cellSize - 4, this.cellSize - 4);
            
            // Малюємо іконку гравця
            this.ctx.font = '16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = 'white';
            this.ctx.fillText(
                player.icon,
                pixelX + this.cellSize / 2,
                pixelY + this.cellSize / 2 + 6
            );
        });
    }
    
    drawSpecialElements() {
        // Малюємо бонуси
        this.powerUps.forEach(powerUp => {
            const pixelX = powerUp.x * this.cellSize;
            const pixelY = powerUp.y * this.cellSize;
            
            this.ctx.font = '16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                powerUp.icon,
                pixelX + this.cellSize / 2,
                pixelY + this.cellSize / 2 + 6
            );
        });
        
        // Малюємо телепорти
        this.teleports.forEach(teleport => {
            const pixelX = teleport.x * this.cellSize;
            const pixelY = teleport.y * this.cellSize;
            
            this.ctx.fillStyle = 'rgba(155, 89, 182, 0.3)';
            this.ctx.fillRect(pixelX + 2, pixelY + 2, this.cellSize - 4, this.cellSize - 4);
            
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = '#9b59b6';
            this.ctx.fillText(
                '🌀',
                pixelX + this.cellSize / 2,
                pixelY + this.cellSize / 2 + 4
            );
        });
        
        // Малюємо пастки
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.maze[y][x] === this.cellTypes.TRAP) {
                    const pixelX = x * this.cellSize;
                    const pixelY = y * this.cellSize;
                    
                    this.ctx.fillStyle = 'rgba(231, 76, 60, 0.2)';
                    this.ctx.fillRect(pixelX + 2, pixelY + 2, this.cellSize - 4, this.cellSize - 4);
                    
                    this.ctx.font = '10px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillStyle = '#e74c3c';
                    this.ctx.fillText(
                        '⚠️',
                        pixelX + this.cellSize / 2,
                        pixelY + this.cellSize / 2 + 3
                    );
                }
            }
        }
    }
    
    gameLoop() {
        this.draw();
        
        if (this.isPlaying) {
            this.updateTimer();
        }
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    updateTimer() {
        const elapsed = Date.now() - this.startTime;
        this.timeLeft = Math.max(0, this.timeLimit - elapsed);
        
        this.updateTimerDisplay();
        
        if (this.timeLeft <= 0) {
            this.endGame('timeout');
        }
    }
    
    updateTimerDisplay() {
        const timerEl = document.getElementById('timer');
        if (timerEl) {
            const minutes = Math.floor(this.timeLeft / 60000);
            const seconds = Math.floor((this.timeLeft % 60000) / 1000);
            timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            if (this.timeLeft <= 30000) {
                timerEl.style.color = '#e74c3c';
            } else if (this.timeLeft <= 60000) {
                timerEl.style.color = '#f39c12';
            } else {
                timerEl.style.color = 'white';
            }
        }
    }
    
    updatePlayerDisplay() {
        const player1PosEl = document.getElementById('player1Pos');
        const player2PosEl = document.getElementById('player2Pos');
        
        if (player1PosEl) {
            player1PosEl.textContent = `${this.players[0].x}, ${this.players[0].y} (${this.players[0].moves} кроків)`;
        }
        
        if (player2PosEl) {
            player2PosEl.textContent = `${this.players[1].x}, ${this.players[1].y} (${this.players[1].moves} кроків)`;
        }
    }
    
    startGame() {
        this.isPlaying = true;
        this.startTime = Date.now();
        this.timeLeft = this.timeLimit;
        
        // Скидаємо позиції гравців
        this.players[0].x = this.startPos.x;
        this.players[0].y = this.startPos.y;
        this.players[0].moves = 0;
        this.players[0].score = 0;
        
        this.players[1].x = this.startPos.x;
        this.players[1].y = this.startPos.y + 1;
        this.players[1].moves = 0;
        this.players[1].score = 0;
        
        this.updatePlayerDisplay();
        this.updateTimerDisplay();
        
        this.showNotification('Гра розпочато!', '#27ae60');
    }
    
    endGame(reason, winner = null) {
        this.isPlaying = false;
        
        const gameTime = this.timeLimit - this.timeLeft;
        const totalMoves = this.players[0].moves + this.players[1].moves;
        
        this.updateStats(reason, gameTime, totalMoves);
        
        let message = '';
        let icon = '';
        
        switch (reason) {
            case 'co-op-win':
                message = 'Вітаємо! Обидва гравці дійшли до мети!';
                icon = '🏆';
                this.gameStats.totalWins++;
                break;
            case 'race-win':
                message = `${winner.name} переміг у гонці!`;
                icon = '🥇';
                this.gameStats.totalWins++;
                break;
            case 'timeout':
                message = 'Час вийшов! Гра завершена.';
                icon = '⏰';
                break;
        }
        
        this.showGameResults(message, icon, gameTime, totalMoves);
        this.saveStats();
    }
    
    showGameResults(message, icon, gameTime, totalMoves) {
        const resultsModal = document.createElement('div');
        resultsModal.className = 'maze-results-modal';
        resultsModal.style.cssText = `
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
        
        const minutes = Math.floor(gameTime / 60000);
        const seconds = Math.floor((gameTime % 60000) / 1000);
        
        resultsContent.innerHTML = `
            <div style="font-size: 4rem; margin-bottom: 20px;">${icon}</div>
            <h2 style="margin-bottom: 20px; color: white;">${message}</h2>
            
            <div style="margin-bottom: 30px; color: white; opacity: 0.8;">
                <div style="margin-bottom: 10px;">
                    <strong>Час гри:</strong> ${minutes}:${seconds.toString().padStart(2, '0')}
                </div>
                <div style="margin-bottom: 10px;">
                    <strong>Загальні кроки:</strong> ${totalMoves}
                </div>
                <div style="margin-bottom: 15px;">
                    <strong>Результати гравців:</strong>
                </div>
                ${this.players.map(player => `
                    <div style="display: flex; justify-content: space-between; margin: 5px 0; padding: 10px; background: rgba(255, 255, 255, 0.1); border-radius: 10px;">
                        <span>${player.icon} ${player.name}</span>
                        <span>${player.moves} кроків, ${player.score} очок</span>
                    </div>
                `).join('')}
            </div>
            
            <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                <button onclick="this.parentElement.parentElement.parentElement.remove(); window.mazeGame.startGame();" 
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
                        ">
                    Грати знову
                </button>
                <button onclick="this.parentElement.parentElement.parentElement.remove()" 
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
                <button onclick="window.mazeGame.generateNewMaze(); this.parentElement.parentElement.parentElement.remove();" 
                        style="
                            padding: 12px 24px;
                            background: linear-gradient(45deg, #27ae60, #229954);
                            border: none;
                            border-radius: 25px;
                            color: white;
                            font-size: 1.1rem;
                            cursor: pointer;
                            transition: all 0.3s ease;
                        ">
                    Новий лабіринт
                </button>
            </div>
        `;
        
        resultsModal.appendChild(resultsContent);
        document.body.appendChild(resultsModal);
    }
    
    generateNewMaze() {
        this.generateMaze();
        this.powerUps = [];
        this.teleports = [];
        this.traps = [];
        
        // Перегенеруємо спеціальні елементи
        this.addSpecialElements();
        
        this.showNotification('Новий лабіринт створено!', '#9b59b6');
    }
    
    showNotification(message, color = '#3498db') {
        const notification = document.createElement('div');
        notification.className = 'maze-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${color};
            color: white;
            padding: 15px 25px;
            border-radius: 25px;
            z-index: 1001;
            animation: slideInDown 0.5s ease-out;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
            font-weight: bold;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutUp 0.5s ease-out';
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }
    
    updateStats(reason, gameTime, totalMoves) {
        this.gameStats.totalGames++;
        this.gameStats.totalMoves += totalMoves;
        
        if (reason === 'co-op-win' || reason === 'race-win') {
            if (gameTime < this.gameStats.bestTime) {
                this.gameStats.bestTime = gameTime;
            }
        }
        
        this.gameStats.averageTime = (this.gameStats.totalTime + gameTime) / this.gameStats.totalGames;
    }
    
    saveStats() {
        localStorage.setItem('maze-game-stats', JSON.stringify(this.gameStats));
    }
    
    loadStats() {
        const saved = localStorage.getItem('maze-game-stats');
        if (saved) {
            this.gameStats = { ...this.gameStats, ...JSON.parse(saved) };
        }
    }
}

// Глобальні функції
function startMaze() {
    if (window.mazeGame) {
        window.mazeGame.startGame();
    }
}

function generateNewMaze() {
    if (window.mazeGame) {
        window.mazeGame.generateNewMaze();
    }
}

function initializeMazeGame() {
    window.mazeGame = new MazeGame();
}

// CSS стилі для Maze Game
const mazeStyles = `
    .maze-game {
        text-align: center;
        max-width: 900px;
        margin: 0 auto;
    }
    
    .maze-canvas-container {
        position: relative;
        display: inline-block;
        margin: 20px 0;
        border: 3px solid rgba(255, 255, 255, 0.3);
        border-radius: 15px;
        overflow: hidden;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
    }
    
    #mazeCanvas {
        display: block;
        cursor: crosshair;
    }
    
    .maze-controls {
        margin: 20px 0;
        display: flex;
        justify-content: center;
        gap: 15px;
        flex-wrap: wrap;
    }
    
    .maze-controls button {
        padding: 12px 24px;
        background: linear-gradient(45deg, #3498db, #2980b9);
        border: none;
        border-radius: 25px;
        color: white;
        font-size: 1.1rem;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s ease;
        min-width: 140px;
    }
    
    .maze-controls button:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(52, 152, 219, 0.4);
    }
    
    .maze-controls button:active {
        transform: translateY(0);
    }
    
    .player-info {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 15px;
        margin: 20px 0;
    }
    
    .player-card {
        background: rgba(255, 255, 255, 0.1);
        padding: 15px;
        border-radius: 15px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        text-align: center;
    }
    
    .player-card h4 {
        margin-bottom: 10px;
        color: white;
        font-size: 1.1rem;
    }
    
    .player-stats {
        display: flex;
        justify-content: space-between;
        font-size: 0.9rem;
        color: rgba(255, 255, 255, 0.8);
    }
    
    .timer {
        font-size: 1.5rem;
        font-weight: bold;
        margin: 20px 0;
        padding: 15px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 15px;
        backdrop-filter: blur(10px);
        color: white;
    }
    
    .controls-info {
        margin: 20px 0;
        padding: 20px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 15px;
        backdrop-filter: blur(10px);
        color: white;
        text-align: left;
    }
    
    .controls-info h4 {
        margin-bottom: 15px;
        text-align: center;
        color: #3498db;
    }
    
    .control-group {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-bottom: 15px;
    }
    
    .control-item {
        background: rgba(255, 255, 255, 0.1);
        padding: 10px;
        border-radius: 10px;
    }
    
    .control-item strong {
        color: #3498db;
        display: block;
        margin-bottom: 5px;
    }
    
    .game-modes {
        margin: 20px 0;
        padding: 20px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 15px;
        backdrop-filter: blur(10px);
        text-align: center;
    }
    
    .mode-selector {
        display: flex;
        justify-content: center;
        gap: 15px;
        flex-wrap: wrap;
        margin-top: 15px;
    }
    
    .mode-btn {
        padding: 10px 20px;
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
    
    .game-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 15px;
        margin: 20px 0;
    }
    
    .stat-card {
        background: rgba(255, 255, 255, 0.1);
        padding: 15px;
        border-radius: 15px;
        backdrop-filter: blur(10px);
        text-align: center;
        border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .stat-value {
        font-size: 1.5rem;
        font-weight: bold;
        color: #3498db;
        margin-bottom: 5px;
    }
    
    .stat-label {
        color: white;
        opacity: 0.8;
        font-size: 0.9rem;
    }
    
    .maze-results-modal {
        animation: fadeIn 0.5s ease-out;
    }
    
    .maze-notification {
        animation: slideInDown 0.5s ease-out;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes slideInUp {
        from {
            transform: translateY(50px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
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
        #mazeCanvas {
            width: 100%;
            max-width: 600px;
            height: auto;
        }
        
        .maze-controls {
            flex-direction: column;
            align-items: center;
        }
        
        .maze-controls button {
            width: 200px;
        }
        
        .control-group {
            grid-template-columns: 1fr;
        }
        
        .mode-selector {
            flex-direction: column;
            align-items: center;
        }
        
        .mode-btn {
            width: 200px;
        }
        
        .player-info {
            grid-template-columns: 1fr;
        }
        
        .game-stats {
            grid-template-columns: repeat(2, 1fr);
        }
    }
`;

function loadMazeGame(container) {
    container.innerHTML = `
        <h2>🧩 Спільний лабіринт</h2>
        
        <div class="game-area">
            <div class="maze-game">
                <div class="timer">
                    ⏰ Час: <span id="timer">5:00</span>
                </div>
                
                <div class="maze-canvas-container">
                    <canvas id="mazeCanvas" width="800" height="600"></canvas>
                </div>
                
                <div class="maze-controls">
                    <button onclick="startMaze()">🚀 Почати гру</button>
                    <button onclick="generateNewMaze()">🔄 Новий лабіринт</button>
                </div>
                
                <div class="player-info">
                    <div class="player-card">
                        <h4>🔴 Гравець 1 (WASD)</h4>
                        <div class="player-stats">
                            <span>Позиція:</span>
                            <span id="player1Pos">0, 0</span>
                        </div>
                    </div>
                    <div class="player-card">
                        <h4>🔵 Гравець 2 (Стрілки)</h4>
                        <div class="player-stats">
                            <span>Позиція:</span>
                            <span id="player2Pos">0, 0</span>
                        </div>
                    </div>
                </div>
                
                <div class="controls-info">
                    <h4>🎮 Керування</h4>
                    <div class="control-group">
                        <div class="control-item">
                            <strong>🔴 Гравець 1:</strong>
                            W - вгору<br>
                            A - вліво<br>
                            S - вниз<br>
                            D - вправо
                        </div>
                        <div class="control-item">
                            <strong>🔵 Гравець 2:</strong>
                            ↑ - вгору<br>
                            ← - вліво<br>
                            ↓ - вниз<br>
                            → - вправо
                        </div>
                    </div>
                </div>
                
                <div class="game-modes">
                    <h4>🎯 Режими гри</h4>
                    <div class="mode-selector">
                        <button class="mode-btn active" onclick="setMazeMode('co-op')">
                            🤝 Кооперативний
                        </button>
                        <button class="mode-btn" onclick="setMazeMode('race')">
                            🏁 Гонка
                        </button>
                        <button class="mode-btn" onclick="setMazeMode('timed')">
                            ⏰ На час
                        </button>
                    </div>
                </div>
                
                <div class="game-stats">
                    <div class="stat-card">
                        <div class="stat-value" id="totalGames">0</div>
                        <div class="stat-label">Ігор зіграно</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="totalWins">0</div>
                        <div class="stat-label">Перемог</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="bestTime">--</div>
                        <div class="stat-label">Найкращий час</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="averageMoves">0</div>
                        <div class="stat-label">Середні кроки</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Додаємо стилі
    const style = document.createElement('style');
    style.textContent = mazeStyles;
    document.head.appendChild(style);
    
    initializeMazeGame();
}

// Функція для зміни режиму гри
function setMazeMode(mode) {
    if (window.mazeGame) {
        window.mazeGame.gameMode = mode;
        
        // Оновлюємо UI
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        window.mazeGame.showNotification(`Режим змінено на: ${mode}`, '#9b59b6');
    }
}
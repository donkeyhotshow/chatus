// ===== УЛУЧШЕННАЯ TOWER DEFENSE ИГРА =====

class TowerDefense {
    constructor() {
        this.canvas = document.getElementById('towerDefenseCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameWidth = 800;
        this.gameHeight = 600;
        this.path = [
            { x: 0, y: 300 },
            { x: 200, y: 300 },
            { x: 200, y: 150 },
            { x: 400, y: 150 },
            { x: 400, y: 450 },
            { x: 600, y: 450 },
            { x: 600, y: 250 },
            { x: 800, y: 250 }
        ];
        
        this.towers = [];
        this.enemies = [];
        this.bullets = [];
        this.money = 100;
        this.lives = 20;
        this.wave = 1;
        this.enemiesInWave = 0;
        this.enemiesSpawned = 0;
        this.gameRunning = false;
        this.selectedTowerType = 'basic';
        
        this.towerTypes = {
            basic: {
                name: 'Базова вежа',
                cost: 50,
                damage: 20,
                range: 100,
                fireRate: 1000,
                color: '#3498db'
            },
            sniper: {
                name: 'Снайперська вежа',
                cost: 80,
                damage: 40,
                range: 150,
                fireRate: 2000,
                color: '#e74c3c'
            },
            rapid: {
                name: 'Швидкісна вежа',
                cost: 70,
                damage: 15,
                range: 80,
                fireRate: 300,
                color: '#f39c12'
            }
        };
        
        this.enemyTypes = {
            normal: {
                health: 50,
                speed: 2,
                reward: 10,
                color: '#2ecc71'
            },
            fast: {
                health: 30,
                speed: 4,
                reward: 15,
                color: '#3498db'
            },
            tank: {
                health: 100,
                speed: 1,
                reward: 25,
                color: '#9b59b6'
            }
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.drawGrid();
        this.gameLoop();
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    }
    
    handleCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Перевіряємо чи можна поставити вежу
        if (this.canPlaceTower(x, y)) {
            this.placeTower(x, y);
        }
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Показуємо підсвічування для розміщення веж
        this.hoverX = x;
        this.hoverY = y;
    }
    
    canPlaceTower(x, y) {
        // Перевіряємо чи не на шляху
        for (let i = 0; i < this.path.length - 1; i++) {
            const start = this.path[i];
            const end = this.path[i + 1];
            const distance = this.pointToLineDistance(x, y, start.x, start.y, end.x, end.y);
            if (distance < 30) return false;
        }
        
        // Перевіряємо чи не зайнято іншою вежею
        for (let tower of this.towers) {
            const distance = Math.sqrt((x - tower.x) ** 2 + (y - tower.y) ** 2);
            if (distance < 40) return false;
        }
        
        return true;
    }
    
    pointToLineDistance(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        
        if (lenSq === 0) return Math.sqrt(A * A + B * B);
        
        let param = dot / lenSq;
        
        let xx, yy;
        
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }
        
        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    placeTower(x, y) {
        const towerType = this.towerTypes[this.selectedTowerType];
        if (this.money >= towerType.cost) {
            this.towers.push({
                x: x,
                y: y,
                type: this.selectedTowerType,
                ...towerType,
                lastFire: 0,
                target: null
            });
            this.money -= towerType.cost;
            this.updateStats();
        }
    }
    
    spawnEnemy() {
        const enemyTypes = ['normal', 'fast', 'tank'];
        let type = 'normal';
        
        // Ускладнюємо з кожною хвилею
        const rand = Math.random();
        if (this.wave > 3 && rand < 0.3) type = 'fast';
        if (this.wave > 5 && rand < 0.2) type = 'tank';
        
        const enemyType = this.enemyTypes[type];
        
        this.enemies.push({
            x: this.path[0].x,
            y: this.path[0].y,
            health: enemyType.health + (this.wave - 1) * 10,
            maxHealth: enemyType.health + (this.wave - 1) * 10,
            speed: enemyType.speed,
            reward: enemyType.reward,
            type: type,
            color: enemyType.color,
            pathIndex: 0
        });
        
        this.enemiesSpawned++;
    }
    
    updateEnemies() {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            const nextPathPoint = this.path[enemy.pathIndex + 1];
            
            if (!nextPathPoint) {
                // Ворог дійшов до кінця
                this.lives--;
                this.enemies.splice(i, 1);
                this.updateStats();
                
                if (this.lives <= 0) {
                    this.gameOver();
                    return;
                }
                continue;
            }
            
            // Рух до наступної точки
            const dx = nextPathPoint.x - enemy.x;
            const dy = nextPathPoint.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < enemy.speed) {
                enemy.pathIndex++;
            } else {
                enemy.x += (dx / distance) * enemy.speed;
                enemy.y += (dy / distance) * enemy.speed;
            }
        }
    }
    
    updateTowers() {
        const currentTime = Date.now();
        
        for (let tower of this.towers) {
            // Знаходимо найближчу ціль
            let nearestEnemy = null;
            let nearestDistance = Infinity;
            
            for (let enemy of this.enemies) {
                const distance = Math.sqrt(
                    (tower.x - enemy.x) ** 2 + (tower.y - enemy.y) ** 2
                );
                
                if (distance <= tower.range && distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestEnemy = enemy;
                }
            }
            
            // Стріляємо якщо можна
            if (nearestEnemy && currentTime - tower.lastFire >= tower.fireRate) {
                this.fireBullet(tower, nearestEnemy);
                tower.lastFire = currentTime;
            }
        }
    }
    
    fireBullet(tower, target) {
        const dx = target.x - tower.x;
        const dy = target.y - tower.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        this.bullets.push({
            x: tower.x,
            y: tower.y,
            target: target,
            speed: 5,
            damage: tower.damage,
            color: tower.color,
            vx: (dx / distance) * 5,
            vy: (dy / distance) * 5
        });
    }
    
    updateBullets() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            // Рух кулі
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;
            
            // Перевіряємо зіткнення
            if (bullet.target && !this.enemies.includes(bullet.target)) {
                bullet.target = null; // Ціль знищена
            }
            
            if (bullet.target) {
                const distance = Math.sqrt(
                    (bullet.x - bullet.target.x) ** 2 + 
                    (bullet.y - bullet.target.y) ** 2
                );
                
                if (distance < 15) {
                    // Попадання!
                    bullet.target.health -= bullet.damage;
                    
                    if (bullet.target.health <= 0) {
                        const enemyIndex = this.enemies.indexOf(bullet.target);
                        if (enemyIndex > -1) {
                            this.money += bullet.target.reward;
                            this.enemies.splice(enemyIndex, 1);
                            this.updateStats();
                        }
                    }
                    
                    this.bullets.splice(i, 1);
                }
            }
            
            // Видаляємо кулі що вийшли за межі
            if (bullet.x < 0 || bullet.x > this.gameWidth || 
                bullet.y < 0 || bullet.y > this.gameHeight) {
                this.bullets.splice(i, 1);
            }
        }
    }
    
    spawnWave() {
        const enemiesToSpawn = 5 + this.wave * 2;
        
        const spawnInterval = setInterval(() => {
            if (this.enemiesSpawned < enemiesToSpawn && this.gameRunning) {
                this.spawnEnemy();
            } else {
                clearInterval(spawnInterval);
                
                // Чекаємо поки всі вороги будуть знищені
                setTimeout(() => {
                    if (this.enemies.length === 0 && this.gameRunning) {
                        this.wave++;
                        this.enemiesSpawned = 0;
                        this.spawnWave();
                    }
                }, 2000);
            }
        }, 1000 - Math.min(this.wave * 50, 500));
    }
    
    draw() {
        // Очищення canvas
        this.ctx.clearRect(0, 0, this.gameWidth, this.gameHeight);
        
        // Малюємо сітку
        this.drawGrid();
        
        // Малюємо шлях
        this.drawPath();
        
        // Малюємо вежі
        for (let tower of this.towers) {
            this.drawTower(tower);
        }
        
        // Малюємо ворогів
        for (let enemy of this.enemies) {
            this.drawEnemy(enemy);
        }
        
        // Малюємо кулі
        for (let bullet of this.bullets) {
            this.drawBullet(bullet);
        }
        
        // Малюємо підсвічування для розміщення
        if (this.hoverX !== undefined && this.hoverY !== undefined) {
            this.drawHoverIndicator();
        }
    }
    
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x <= this.gameWidth; x += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.gameHeight);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= this.gameHeight; y += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.gameWidth, y);
            this.ctx.stroke();
        }
    }
    
    drawPath() {
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 40;
        this.ctx.lineCap = 'round';
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.path[0].x, this.path[0].y);
        
        for (let i = 1; i < this.path.length; i++) {
            this.ctx.lineTo(this.path[i].x, this.path[i].y);
        }
        
        this.ctx.stroke();
    }
    
    drawTower(tower) {
        this.ctx.fillStyle = tower.color;
        this.ctx.fillRect(tower.x - 15, tower.y - 15, 30, 30);
        
        // Діапазон атаки
        this.ctx.strokeStyle = tower.color;
        this.ctx.lineWidth = 1;
        this.ctx.globalAlpha = 0.2;
        this.ctx.beginPath();
        this.ctx.arc(tower.x, tower.y, tower.range, 0, 2 * Math.PI);
        this.ctx.stroke();
        this.ctx.globalAlpha = 1;
    }
    
    drawEnemy(enemy) {
        this.ctx.fillStyle = enemy.color;
        this.ctx.fillRect(enemy.x - 10, enemy.y - 10, 20, 20);
        
        // Шкала здоров'я
        const healthBarWidth = 20;
        const healthBarHeight = 4;
        const healthPercent = enemy.health / enemy.maxHealth;
        
        this.ctx.fillStyle = 'red';
        this.ctx.fillRect(enemy.x - healthBarWidth/2, enemy.y - 20, healthBarWidth, healthBarHeight);
        
        this.ctx.fillStyle = 'green';
        this.ctx.fillRect(enemy.x - healthBarWidth/2, enemy.y - 20, healthBarWidth * healthPercent, healthBarHeight);
    }
    
    drawBullet(bullet) {
        this.ctx.fillStyle = bullet.color;
        this.ctx.beginPath();
        this.ctx.arc(bullet.x, bullet.y, 3, 0, 2 * Math.PI);
        this.ctx.fill();
    }
    
    drawHoverIndicator() {
        const canPlace = this.canPlaceTower(this.hoverX, this.hoverY);
        const towerType = this.towerTypes[this.selectedTowerType];
        
        this.ctx.fillStyle = canPlace ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 0, 0, 0.3)';
        this.ctx.fillRect(this.hoverX - 15, this.hoverY - 15, 30, 30);
        
        // Діапазон
        this.ctx.strokeStyle = canPlace ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(this.hoverX, this.hoverY, towerType.range, 0, 2 * Math.PI);
        this.ctx.stroke();
    }
    
    updateStats() {
        document.getElementById('money').textContent = this.money;
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('wave').textContent = this.wave;
    }
    
    gameLoop() {
        if (this.gameRunning) {
            this.updateEnemies();
            this.updateTowers();
            this.updateBullets();
        }
        
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    startGame() {
        this.gameRunning = true;
        this.money = 100;
        this.lives = 20;
        this.wave = 1;
        this.enemiesSpawned = 0;
        this.towers = [];
        this.enemies = [];
        this.bullets = [];
        this.spawnWave();
        this.updateStats();
    }
    
    pauseGame() {
        this.gameRunning = !this.gameRunning;
    }
    
    gameOver() {
        this.gameRunning = false;
        alert(`Гру завершено! Досягнута хвиля: ${this.wave}`);
    }
    
    setTowerType(type) {
        this.selectedTowerType = type;
    }
}

// Глобальні функції для кнопок
function startTowerDefense() {
    if (window.towerDefense) {
        window.towerDefense.startGame();
    }
}

function pauseTowerDefense() {
    if (window.towerDefense) {
        window.towerDefense.pauseGame();
    }
}

function initializeTowerDefense() {
    window.towerDefense = new TowerDefense();
}

// Додаємо UI для вибору типів веж
const towerSelectionHTML = `
    <div class="tower-selection">
        <h3>Вибір веж:</h3>
        <button onclick="selectTower('basic')" class="tower-btn" data-type="basic">
            Базова вежа (50$)
        </button>
        <button onclick="selectTower('sniper')" class="tower-btn" data-type="sniper">
            Снайперська вежа (80$)
        </button>
        <button onclick="selectTower('rapid')" class="tower-btn" data-type="rapid">
            Швидкісна вежа (70$)
        </button>
    </div>
`;

function selectTower(type) {
    if (window.towerDefense) {
        window.towerDefense.setTowerType(type);
        
        // Підсвічування обраної вежі
        document.querySelectorAll('.tower-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        document.querySelector(`[data-type="${type}"]`).classList.add('selected');
    }
}

// Додаємо CSS стилі для UI
const towerDefenseStyles = `
    .tower-selection {
        margin-top: 20px;
        padding: 15px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 10px;
    }
    
    .tower-selection h3 {
        margin-bottom: 10px;
        color: white;
    }
    
    .tower-btn {
        display: block;
        width: 100%;
        margin: 5px 0;
        padding: 10px;
        background: rgba(255, 255, 255, 0.2);
        border: 2px solid transparent;
        color: white;
        border-radius: 5px;
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .tower-btn:hover {
        background: rgba(255, 255, 255, 0.3);
    }
    
    .tower-btn.selected {
        border-color: #3498db;
        background: rgba(52, 152, 219, 0.3);
    }
    
    .game-controls {
        margin-top: 15px;
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        align-items: center;
    }
    
    .game-controls button {
        padding: 8px 16px;
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        border-radius: 5px;
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .game-controls button:hover {
        background: rgba(255, 255, 255, 0.3);
    }
    
    .stats {
        display: flex;
        gap: 20px;
        font-weight: bold;
    }
`;

// Додаємо стилі в документ
const style = document.createElement('style');
style.textContent = towerDefenseStyles;
document.head.appendChild(style);

// Модифікуємо HTML для Tower Defense
function loadTowerDefense(container) {
    container.innerHTML = `
        <h2>🏰 Захист вежі</h2>
        <div class="game-area">
            <canvas id="towerDefenseCanvas" width="800" height="600"></canvas>
        </div>
        <div class="game-controls">
            <button onclick="startTowerDefense()">Почати гру</button>
            <button onclick="pauseTowerDefense()">Пауза</button>
            <div class="stats">
                <span>Гроші: <span id="money">100</span></span>
                <span>Життя: <span id="lives">20</span></span>
                <span>Хвиля: <span id="wave">1</span></span>
            </div>
        </div>
        ${towerSelectionHTML}
    `;
    initializeTowerDefense();
}
// ===== ИНТЕГРИРОВАННАЯ ИГРОВАЯ СИСТЕМА =====

// Глобальна система управління іграми
class GameLobby {
    constructor() {
        this.currentGame = null;
        this.games = {
            'tower-defense': {
                name: 'Захист вежі',
                icon: '🏰',
                description: 'Захищайте базу разом з друзями від хвиль ворогів',
                category: 'Strategy',
                file: 'tower-defense.js',
                difficulty: 'Medium',
                players: 'Co-op',
                estimatedTime: '10-15 хв'
            },
            'physics-sandbox': {
                name: 'Фізична пісочниця',
                icon: '🧊',
                description: 'Будувати, руйнувати та взаємодіяти з об\'єктами в реальному часі',
                category: 'Simulation',
                file: 'physics-sandbox.js',
                difficulty: 'Easy',
                players: 'Solo/Co-op',
                estimatedTime: '5-30 хв'
            },
            'maze-game': {
                name: 'Спільний лабіринт',
                icon: '🧩',
                description: 'Знайдіть вихід разом з командою через складний лабіринт',
                category: 'Puzzle',
                file: 'maze-game.js',
                difficulty: 'Medium',
                players: 'Co-op',
                estimatedTime: '5-10 хв'
            },
            'tic-tac-toe': {
                name: 'Хрестики-нулики',
                icon: '🎮',
                description: 'Класична головоломка для двох гравців з ІІ різної складності',
                category: 'Strategy',
                file: 'tic-tac-toe.js',
                difficulty: 'Easy',
                players: 'PvP/AI',
                estimatedTime: '2-5 хв'
            },
            'rock-paper-scissors': {
                name: 'Камінь, ножиці, папір',
                icon: '✋',
                description: 'Гра на удачу з різними варіантами та режимами',
                category: 'Luck',
                file: 'rock-paper-scissors.js',
                difficulty: 'Easy',
                players: 'PvP/AI',
                estimatedTime: '1-10 хв'
            },
            'click-war': {
                name: 'Війна кліків',
                icon: '⚔️',
                description: 'Превзойдіть опонента за кількістю кліків за обмежений час',
                category: 'Action',
                file: 'click-war.js',
                difficulty: 'Medium',
                players: 'Solo',
                estimatedTime: '1-2 хв'
            },
            'dice-game': {
                name: 'Кидання кубиків',
                icon: '🎲',
                description: 'Різноманітні ігри з кубиками та детальною статистикою',
                category: 'Luck',
                file: 'dice-game.js',
                difficulty: 'Easy',
                players: 'Solo',
                estimatedTime: '1-15 хв'
            }
        };
        
        this.currentTab = 'games';
        this.favorites = this.loadFavorites();
        this.recentGames = this.loadRecentGames();
        this.gameStats = this.loadGameStats();
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateDisplay();
        this.loadGameFiles();
    }
    
    setupEventListeners() {
        // Перемикання вкладок
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('toggle-btn')) {
                const tab = e.target.getAttribute('data-tab');
                this.switchTab(tab);
            }
        });
        
        // Відкриття гри
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('game-card') || e.target.closest('.game-card')) {
                const gameCard = e.target.classList.contains('game-card') ? e.target : e.target.closest('.game-card');
                const gameId = gameCard.getAttribute('data-game');
                this.openGame(gameId);
            }
        });
        
        // Закриття модального вікна
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal') || e.target.classList.contains('close-btn')) {
                this.closeGame();
            }
        });
        
        // Escape для закриття
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeGame();
            }
        });
        
        // Збереження в обране
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('favorite-btn')) {
                e.stopPropagation();
                const gameId = e.target.closest('.game-card').getAttribute('data-game');
                this.toggleFavorite(gameId);
            }
        });
    }
    
    async loadGameFiles() {
        // Динамічно завантажуємо файли ігор
        const gameFiles = [
            'tower-defense.js',
            'physics-sandbox.js', 
            'maze-game.js',
            'tic-tac-toe.js',
            'rock-paper-scissors.js',
            'click-war.js',
            'dice-game.js'
        ];
        
        for (const file of gameFiles) {
            try {
                await this.loadScript(file);
                console.log(`Loaded: ${file}`);
            } catch (error) {
                console.warn(`Failed to load ${file}:`, error);
            }
        }
    }
    
    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    switchTab(tab) {
        this.currentTab = tab;
        
        // Оновлюємо активну вкладку
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        
        // Показуємо/ховаємо контент
        document.querySelectorAll('.tab-content').forEach(content => {
            content.style.display = 'none';
        });
        document.querySelector(`.${tab}-content`).style.display = 'block';
        
        this.updateDisplay();
    }
    
    openGame(gameId) {
        const game = this.games[gameId];
        if (!game) return;
        
        // Додаємо до недавніх ігор
        this.addToRecentGames(gameId);
        
        // Відкриваємо модальне вікно
        const modal = document.getElementById('gameModal');
        const container = document.getElementById('gameContainer');
        
        modal.classList.add('active');
        container.innerHTML = '<div class="loading">Завантаження гри...</div>';
        
        // Викликаємо функцію завантаження гри
        setTimeout(() => {
            this.loadGameContent(gameId, container);
        }, 500);
        
        // Оновлюємо статистику
        this.updateGameStats(gameId);
    }
    
    closeGame() {
        const modal = document.getElementById('gameModal');
        modal.classList.remove('active');
        
        // Очищаємо контейнер
        const container = document.getElementById('gameContainer');
        container.innerHTML = '';
        
        this.currentGame = null;
    }
    
    loadGameContent(gameId, container) {
        // Викликаємо відповідну функцію завантаження гри
        switch (gameId) {
            case 'tower-defense':
                loadTowerDefense(container);
                break;
            case 'physics-sandbox':
                loadPhysicsSandbox(container);
                break;
            case 'maze-game':
                loadMazeGame(container);
                break;
            case 'tic-tac-toe':
                loadTicTacToe(container);
                break;
            case 'rock-paper-scissors':
                loadRockPaperScissors(container);
                break;
            case 'click-war':
                loadClickWar(container);
                break;
            case 'dice-game':
                loadDiceGame(container);
                break;
            default:
                container.innerHTML = '<div class="error">Гру не знайдено</div>';
        }
        
        this.currentGame = gameId;
    }
    
    toggleFavorite(gameId) {
        const index = this.favorites.indexOf(gameId);
        if (index > -1) {
            this.favorites.splice(index, 1);
        } else {
            this.favorites.push(gameId);
        }
        
        this.saveFavorites();
        this.updateDisplay();
    }
    
    addToRecentGames(gameId) {
        // Видаляємо, якщо вже є
        const index = this.recentGames.indexOf(gameId);
        if (index > -1) {
            this.recentGames.splice(index, 1);
        }
        
        // Додаємо на початок
        this.recentGames.unshift(gameId);
        
        // Обмежуємо до 5 ігор
        if (this.recentGames.length > 5) {
            this.recentGames = this.recentGames.slice(0, 5);
        }
        
        this.saveRecentGames();
    }
    
    updateGameStats(gameId) {
        if (!this.gameStats[gameId]) {
            this.gameStats[gameId] = {
                plays: 0,
                totalTime: 0,
                lastPlayed: null,
                bestScore: 0
            };
        }
        
        this.gameStats[gameId].plays++;
        this.gameStats[gameId].lastPlayed = new Date().toISOString();
        
        this.saveGameStats();
        this.updateDisplay();
    }
    
    updateDisplay() {
        this.renderGamesGrid();
        this.renderFavorites();
        this.renderRecentGames();
        this.renderStatistics();
    }
    
    renderGamesGrid() {
        const gamesGrid = document.querySelector('.games-grid');
        if (!gamesGrid) return;
        
        const gameCards = Object.entries(this.games).map(([id, game]) => {
            const isFavorite = this.favorites.includes(id);
            const stats = this.gameStats[id];
            
            return `
                <div class="game-card" data-game="${id}">
                    <button class="favorite-btn ${isFavorite ? 'active' : ''}" title="Додати до обраного">
                        ${isFavorite ? '⭐' : '☆'}
                    </button>
                    <div class="game-icon">${game.icon}</div>
                    <div class="game-title">${game.name}</div>
                    <div class="game-description">${game.description}</div>
                    <div class="game-meta">
                        <span class="game-category">${game.category}</span>
                        <span class="game-difficulty">${game.difficulty}</span>
                    </div>
                    <div class="game-stats">
                        <span class="players">👥 ${game.players}</span>
                        <span class="time">⏱️ ${game.estimatedTime}</span>
                    </div>
                    ${stats ? `
                        <div class="game-progress">
                            <span>Іграно: ${stats.plays} разів</span>
                            ${stats.lastPlayed ? `<span>Остання: ${this.formatDate(stats.lastPlayed)}</span>` : ''}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
        
        gamesGrid.innerHTML = gameCards;
    }
    
    renderFavorites() {
        const favoritesContainer = document.querySelector('.favorites-content .games-grid');
        if (!favoritesContainer) return;
        
        if (this.favorites.length === 0) {
            favoritesContainer.innerHTML = '<div class="empty-state">У вас поки що немає обраних ігор. Додайте їх, натиснувши на ⭐</div>';
            return;
        }
        
        const favoriteCards = this.favorites.map(gameId => {
            const game = this.games[gameId];
            return this.createGameCardHTML(gameId, game, true);
        }).join('');
        
        favoritesContainer.innerHTML = favoriteCards;
    }
    
    renderRecentGames() {
        const recentContainer = document.querySelector('.recent-content .games-grid');
        if (!recentContainer) return;
        
        if (this.recentGames.length === 0) {
            recentContainer.innerHTML = '<div class="empty-state">Ви ще не грали в жодну гру</div>';
            return;
        }
        
        const recentCards = this.recentGames.map(gameId => {
            const game = this.games[gameId];
            const stats = this.gameStats[gameId];
            return this.createGameCardHTML(gameId, game, false, stats);
        }).join('');
        
        recentContainer.innerHTML = recentCards;
    }
    
    renderStatistics() {
        const statsContainer = document.querySelector('.statistics-content');
        if (!statsContainer) return;
        
        const totalPlays = Object.values(this.gameStats).reduce((sum, stats) => sum + stats.plays, 0);
        const totalGamesPlayed = Object.keys(this.gameStats).length;
        const favoriteGame = this.getFavoriteGame();
        
        statsContainer.innerHTML = `
            <div class="stats-overview">
                <div class="stat-card">
                    <div class="stat-value">${totalPlays}</div>
                    <div class="stat-label">Загальні ігри</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${totalGamesPlayed}</div>
                    <div class="stat-label">Різних ігор</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${this.favorites.length}</div>
                    <div class="stat-label">Обраних ігор</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${favoriteGame ? this.games[favoriteGame].icon : '🎮'}</div>
                    <div class="stat-label">Улюблена гра</div>
                </div>
            </div>
            
            <div class="detailed-stats">
                <h3>Детальна статистика</h3>
                <div class="stats-list">
                    ${this.renderDetailedStats()}
                </div>
            </div>
            
            <div class="achievements">
                <h3>Досягнення</h3>
                <div class="achievements-list">
                    ${this.renderAchievements()}
                </div>
            </div>
        `;
    }
    
    renderDetailedStats() {
        return Object.entries(this.gameStats).map(([gameId, stats]) => {
            const game = this.games[gameId];
            return `
                <div class="stat-item">
                    <div class="stat-game">
                        <span class="game-icon">${game.icon}</span>
                        <span class="game-name">${game.name}</span>
                    </div>
                    <div class="stat-details">
                        <span>Іграно: ${stats.plays} разів</span>
                        <span>Час: ${this.formatTime(stats.totalTime)}</span>
                        <span>Остання: ${stats.lastPlayed ? this.formatDate(stats.lastPlayed) : 'Ніколи'}</span>
                        ${stats.bestScore ? `<span>Рекорд: ${stats.bestScore}</span>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }
    
    renderAchievements() {
        const achievements = [];
        
        // Перевіряємо досягнення
        const totalPlays = Object.values(this.gameStats).reduce((sum, stats) => sum + stats.plays, 0);
        if (totalPlays >= 10) achievements.push({ icon: '🎯', name: 'Перші кроки', desc: 'Зіграйте 10 ігор' });
        if (totalPlays >= 50) achievements.push({ icon: '🏆', name: 'Активний гравець', desc: 'Зіграйте 50 ігор' });
        if (totalPlays >= 100) achievements.push({ icon: '👑', name: 'Майстер ігор', desc: 'Зіграйте 100 ігор' });
        
        if (Object.keys(this.gameStats).length >= 5) {
            achievements.push({ icon: '🎮', name: 'Дослідник', desc: 'Спробуйте всі ігри' });
        }
        
        if (this.favorites.length >= 3) {
            achievements.push({ icon: '⭐', name: 'Колекціонер', desc: 'Додайте 3 гри в обране' });
        }
        
        if (achievements.length === 0) {
            return '<div class="empty-state">Досягнення з\'являться після гри</div>';
        }
        
        return achievements.map(achievement => `
            <div class="achievement-item">
                <span class="achievement-icon">${achievement.icon}</span>
                <div class="achievement-info">
                    <div class="achievement-name">${achievement.name}</div>
                    <div class="achievement-desc">${achievement.desc}</div>
                </div>
            </div>
        `).join('');
    }
    
    createGameCardHTML(gameId, game, showFavorite = false, stats = null) {
        const isFavorite = this.favorites.includes(gameId);
        
        return `
            <div class="game-card" data-game="${gameId}">
                ${showFavorite ? `
                    <button class="favorite-btn ${isFavorite ? 'active' : ''}" title="Додати до обраного">
                        ${isFavorite ? '⭐' : '☆'}
                    </button>
                ` : ''}
                <div class="game-icon">${game.icon}</div>
                <div class="game-title">${game.name}</div>
                <div class="game-description">${game.description}</div>
                <div class="game-meta">
                    <span class="game-category">${game.category}</span>
                    <span class="game-difficulty">${game.difficulty}</span>
                </div>
                <div class="game-stats">
                    <span class="players">👥 ${game.players}</span>
                    <span class="time">⏱️ ${game.estimatedTime}</span>
                </div>
                ${stats ? `
                    <div class="game-progress">
                        <span>Іграно: ${stats.plays} разів</span>
                        ${stats.lastPlayed ? `<span>Остання: ${this.formatDate(stats.lastPlayed)}</span>` : ''}
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    getFavoriteGame() {
        if (this.favorites.length === 0) return null;
        
        // Повертаємо улюблену гру з найбільшою кількістю ігор
        let favorite = this.favorites[0];
        let maxPlays = 0;
        
        for (const gameId of this.favorites) {
            const stats = this.gameStats[gameId];
            if (stats && stats.plays > maxPlays) {
                maxPlays = stats.plays;
                favorite = gameId;
            }
        }
        
        return favorite;
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return 'Сьогодні';
        if (diffDays === 2) return 'Вчора';
        if (diffDays <= 7) return `${diffDays - 1} дн. тому`;
        if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} тиж. тому`;
        return date.toLocaleDateString('uk-UA');
    }
    
    formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) return `${hours}г ${minutes % 60}хв`;
        if (minutes > 0) return `${minutes}хв ${seconds % 60}с`;
        return `${seconds}с`;
    }
    
    // Локальне сховище
    loadFavorites() {
        const saved = localStorage.getItem('game-lobby-favorites');
        return saved ? JSON.parse(saved) : [];
    }
    
    saveFavorites() {
        localStorage.setItem('game-lobby-favorites', JSON.stringify(this.favorites));
    }
    
    loadRecentGames() {
        const saved = localStorage.getItem('game-lobby-recent');
        return saved ? JSON.parse(saved) : [];
    }
    
    saveRecentGames() {
        localStorage.setItem('game-lobby-recent', JSON.stringify(this.recentGames));
    }
    
    loadGameStats() {
        const saved = localStorage.getItem('game-lobby-stats');
        return saved ? JSON.parse(saved) : {};
    }
    
    saveGameStats() {
        localStorage.setItem('game-lobby-stats', JSON.stringify(this.gameStats));
    }
    
    // Експорт/імпорт даних
    exportData() {
        const data = {
            favorites: this.favorites,
            recentGames: this.recentGames,
            gameStats: this.gameStats,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `game-lobby-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    importData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.favorites) this.favorites = data.favorites;
                if (data.recentGames) this.recentGames = data.recentGames;
                if (data.gameStats) this.gameStats = data.gameStats;
                
                this.saveFavorites();
                this.saveRecentGames();
                this.saveGameStats();
                
                this.updateDisplay();
                this.showNotification('Дані успішно імпортовані!', 'success');
            } catch (error) {
                this.showNotification('Помилка при імпорті даних', 'error');
            }
        };
        reader.readAsText(file);
    }
    
    clearAllData() {
        if (confirm('Ви впевнені, що хочете видалити всі дані? Цю дію неможливо відмінити.')) {
            this.favorites = [];
            this.recentGames = [];
            this.gameStats = {};
            
            localStorage.removeItem('game-lobby-favorites');
            localStorage.removeItem('game-lobby-recent');
            localStorage.removeItem('game-lobby-stats');
            
            this.updateDisplay();
            this.showNotification('Всі дані очищено', 'success');
        }
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `lobby-notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? 'rgba(46, 204, 113, 0.9)' : 
                        type === 'error' ? 'rgba(231, 76, 60, 0.9)' : 
                        'rgba(52, 152, 219, 0.9)'};
            color: white;
            padding: 15px 25px;
            border-radius: 25px;
            z-index: 1001;
            animation: slideInRight 0.5s ease-out;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
            font-weight: bold;
            max-width: 300px;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.5s ease-out';
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }
}

// Додаткові CSS стилі для інтегрованої системи
const integratedStyles = `
    .game-card {
        position: relative;
        overflow: visible;
    }
    
    .favorite-btn {
        position: absolute;
        top: 10px;
        right: 10px;
        background: rgba(255, 255, 255, 0.2);
        border: none;
        border-radius: 50%;
        width: 35px;
        height: 35px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 1.2rem;
        z-index: 10;
    }
    
    .favorite-btn:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: scale(1.1);
    }
    
    .favorite-btn.active {
        background: linear-gradient(45deg, #f1c40f, #f39c12);
        color: white;
        animation: favoritePulse 2s infinite;
    }
    
    .game-meta {
        display: flex;
        justify-content: space-between;
        margin: 10px 0;
        font-size: 0.8rem;
    }
    
    .game-category {
        background: rgba(52, 152, 219, 0.3);
        padding: 3px 8px;
        border-radius: 10px;
        color: #3498db;
        font-weight: bold;
    }
    
    .game-difficulty {
        background: rgba(46, 204, 113, 0.3);
        padding: 3px 8px;
        border-radius: 10px;
        color: #27ae60;
        font-weight: bold;
    }
    
    .game-progress {
        margin-top: 10px;
        font-size: 0.75rem;
        opacity: 0.7;
        display: flex;
        flex-direction: column;
        gap: 2px;
    }
    
    .empty-state {
        text-align: center;
        padding: 40px;
        color: rgba(255, 255, 255, 0.6);
        font-style: italic;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 15px;
        margin: 20px;
    }
    
    .tab-content {
        display: none;
    }
    
    .tab-content.active {
        display: block;
    }
    
    .stats-overview {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        margin: 30px 0;
    }
    
    .stat-card {
        background: rgba(255, 255, 255, 0.1);
        padding: 20px;
        border-radius: 15px;
        text-align: center;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .stat-value {
        font-size: 2.5rem;
        font-weight: bold;
        color: #3498db;
        margin-bottom: 10px;
    }
    
    .stat-label {
        color: white;
        opacity: 0.8;
        font-size: 0.9rem;
    }
    
    .detailed-stats, .achievements {
        margin: 30px 0;
        padding: 20px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 15px;
        backdrop-filter: blur(10px);
    }
    
    .detailed-stats h3, .achievements h3 {
        color: white;
        margin-bottom: 20px;
        text-align: center;
    }
    
    .stat-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px;
        margin: 10px 0;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .stat-game {
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: bold;
    }
    
    .game-icon {
        font-size: 1.5rem;
    }
    
    .game-name {
        color: white;
    }
    
    .stat-details {
        display: flex;
        gap: 15px;
        font-size: 0.85rem;
        color: rgba(255, 255, 255, 0.7);
    }
    
    .achievements-list {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 15px;
    }
    
    .achievement-item {
        display: flex;
        align-items: center;
        gap: 15px;
        padding: 15px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .achievement-icon {
        font-size: 2rem;
    }
    
    .achievement-info {
        flex: 1;
    }
    
    .achievement-name {
        font-weight: bold;
        color: white;
        margin-bottom: 5px;
    }
    
    .achievement-desc {
        font-size: 0.85rem;
        color: rgba(255, 255, 255, 0.7);
    }
    
    .lobby-notification {
        animation: slideInRight 0.5s ease-out;
    }
    
    @keyframes favoritePulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
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
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    @media (max-width: 768px) {
        .stats-overview {
            grid-template-columns: repeat(2, 1fr);
        }
        
        .achievements-list {
            grid-template-columns: 1fr;
        }
        
        .stat-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
        }
        
        .stat-details {
            flex-wrap: wrap;
        }
        
        .favorite-btn {
            width: 30px;
            height: 30px;
            font-size: 1rem;
        }
    }
`;

// Ініціалізація системи
document.addEventListener('DOMContentLoaded', () => {
    // Додаємо стилі
    const style = document.createElement('style');
    style.textContent = integratedStyles;
    document.head.appendChild(style);
    
    // Створюємо глобальний екземпляр
    window.gameLobby = new GameLobby();
    
    // Додаємо кнопки експорту/імпорту
    addDataManagementButtons();
});

// Функції для управління даними
function addDataManagementButtons() {
    const header = document.querySelector('.header');
    if (header) {
        const managementDiv = document.createElement('div');
        managementDiv.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            display: flex;
            gap: 10px;
        `;
        
        managementDiv.innerHTML = `
            <button onclick="window.gameLobby.exportData()" style="
                padding: 8px 12px;
                background: rgba(255, 255, 255, 0.2);
                border: none;
                border-radius: 20px;
                color: white;
                font-size: 0.8rem;
                cursor: pointer;
                transition: all 0.3s ease;
            " title="Експорт даних">
                📤
            </button>
            <input type="file" id="importFile" accept=".json" style="display: none;" onchange="handleFileImport(event)">
            <button onclick="document.getElementById('importFile').click()" style="
                padding: 8px 12px;
                background: rgba(255, 255, 255, 0.2);
                border: none;
                border-radius: 20px;
                color: white;
                font-size: 0.8rem;
                cursor: pointer;
                transition: all 0.3s ease;
            " title="Імпорт даних">
                📥
            </button>
            <button onclick="window.gameLobby.clearAllData()" style="
                padding: 8px 12px;
                background: rgba(231, 76, 60, 0.3);
                border: none;
                border-radius: 20px;
                color: white;
                font-size: 0.8rem;
                cursor: pointer;
                transition: all 0.3s ease;
            " title="Очистити всі дані">
                🗑️
            </button>
        `;
        
        header.style.position = 'relative';
        header.appendChild(managementDiv);
    }
}

function handleFileImport(event) {
    const file = event.target.files[0];
    if (file && window.gameLobby) {
        window.gameLobby.importData(file);
    }
    // Очищуємо input
    event.target.value = '';
}
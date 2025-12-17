// ===== УЛУЧШЕННАЯ PHYSICS SANDBOX ИГРА =====

class PhysicsSandbox {
    constructor() {
        this.canvas = document.getElementById('physicsCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameWidth = 800;
        this.gameHeight = 600;
        
        this.objects = [];
        this.gravity = 0.5;
        this.friction = 0.8;
        this.bounce = 0.7;
        this.selectedTool = 'none';
        this.isDragging = false;
        this.dragObject = null;
        this.mouseX = 0;
        this.mouseY = 0;
        
        this.toolTypes = {
            box: {
                name: 'Куб',
                create: (x, y) => this.createBox(x, y),
                icon: '📦'
            },
            circle: {
                name: 'Коло',
                create: (x, y) => this.createCircle(x, y),
                icon: '⚪'
            },
            triangle: {
                name: 'Трикутник',
                create: (x, y) => this.createTriangle(x, y),
                icon: '🔺'
            },
            spring: {
                name: 'Пружина',
                create: (x, y) => this.createSpring(x, y),
                icon: '🌀'
            },
            wind: {
                name: 'Вітер',
                create: (x, y) => this.createWind(x, y),
                icon: '💨'
            }
        };
        
        this.objectCount = 0;
        this.maxObjects = 50;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.gameLoop();
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('contextmenu', (e) => this.handleRightClick(e));
    }
    
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;
        
        if (e.button === 0) { // Ліва кнопка миші
            if (this.selectedTool === 'none') {
                this.startDragging();
            } else {
                this.createObjectAt(this.mouseX, this.mouseY);
            }
        }
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;
        
        if (this.isDragging && this.dragObject) {
            this.dragObject.x = this.mouseX;
            this.dragObject.y = this.mouseY;
            this.dragObject.vx = 0;
            this.dragObject.vy = 0;
        }
    }
    
    handleMouseUp(e) {
        if (this.isDragging) {
            this.isDragging = false;
            this.dragObject = null;
        }
    }
    
    handleRightClick(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Видаляємо об'єкт при правому кліці
        this.removeObjectAt(x, y);
    }
    
    startDragging() {
        const obj = this.getObjectAt(this.mouseX, this.mouseY);
        if (obj) {
            this.isDragging = true;
            this.dragObject = obj;
        }
    }
    
    getObjectAt(x, y) {
        for (let i = this.objects.length - 1; i >= 0; i--) {
            const obj = this.objects[i];
            if (this.isPointInObject(x, y, obj)) {
                return obj;
            }
        }
        return null;
    }
    
    isPointInObject(x, y, obj) {
        if (obj.type === 'box') {
            return x >= obj.x - obj.width/2 && x <= obj.x + obj.width/2 &&
                   y >= obj.y - obj.height/2 && y <= obj.y + obj.height/2;
        } else if (obj.type === 'circle') {
            const distance = Math.sqrt((x - obj.x) ** 2 + (y - obj.y) ** 2);
            return distance <= obj.radius;
        } else if (obj.type === 'triangle') {
            return this.isPointInTriangle(x, y, obj.points);
        }
        return false;
    }
    
    isPointInTriangle(px, py, points) {
        const [p1, p2, p3] = points;
        
        const area = Math.abs(
            (p1.x*(p2.y-p3.y) + p2.x*(p3.y-p1.y) + p3.x*(p1.y-p2.y)) / 2
        );
        
        const area1 = Math.abs(
            (px*(p2.y-p3.y) + p2.x*(p3.y-py) + p3.x*(py-p2.y)) / 2
        );
        
        const area2 = Math.abs(
            (p1.x*(py-p3.y) + px*(p3.y-p1.y) + p3.x*(p1.y-py)) / 2
        );
        
        const area3 = Math.abs(
            (p1.x*(p2.y-py) + p2.x*(py-p1.y) + px*(p1.y-p2.y)) / 2
        );
        
        return Math.abs(area - (area1 + area2 + area3)) < 0.1;
    }
    
    removeObjectAt(x, y) {
        for (let i = this.objects.length - 1; i >= 0; i--) {
            if (this.isPointInObject(x, y, this.objects[i])) {
                this.objects.splice(i, 1);
                this.objectCount--;
                break;
            }
        }
    }
    
    createObjectAt(x, y) {
        if (this.objectCount >= this.maxObjects) {
            alert('Досягнуто максимальну кількість об\'єктів!');
            return;
        }
        
        const tool = this.toolTypes[this.selectedTool];
        if (tool) {
            tool.create(x, y);
            this.objectCount++;
        }
    }
    
    createBox(x, y) {
        const size = 30 + Math.random() * 20;
        this.objects.push({
            type: 'box',
            x: x,
            y: y,
            width: size,
            height: size,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            mass: size * size / 100,
            color: this.getRandomColor(),
            elasticity: 0.7
        });
    }
    
    createCircle(x, y) {
        const radius = 15 + Math.random() * 15;
        this.objects.push({
            type: 'circle',
            x: x,
            y: y,
            radius: radius,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            mass: radius * radius / 50,
            color: this.getRandomColor(),
            elasticity: 0.8
        });
    }
    
    createTriangle(x, y) {
        const size = 25 + Math.random() * 15;
        const angle = Math.random() * Math.PI * 2;
        
        const points = [
            { x: x, y: y - size },
            { x: x - size * 0.866, y: y + size * 0.5 },
            { x: x + size * 0.866, y: y + size * 0.5 }
        ];
        
        // Обертаємо точки
        for (let point of points) {
            const dx = point.x - x;
            const dy = point.y - y;
            point.x = x + dx * Math.cos(angle) - dy * Math.sin(angle);
            point.y = y + dx * Math.sin(angle) + dy * Math.cos(angle);
        }
        
        this.objects.push({
            type: 'triangle',
            x: x,
            y: y,
            points: points,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            rotation: angle,
            angularVelocity: (Math.random() - 0.5) * 0.1,
            mass: size * size / 200,
            color: this.getRandomColor(),
            elasticity: 0.6
        });
    }
    
    createSpring(x, y) {
        this.objects.push({
            type: 'spring',
            x: x,
            y: y,
            length: 50 + Math.random() * 50,
            strength: 0.1 + Math.random() * 0.05,
            color: '#ff6b6b',
            connectedObjects: []
        });
    }
    
    createWind(x, y) {
        this.objects.push({
            type: 'wind',
            x: x,
            y: y,
            width: 100,
            height: 200,
            forceX: (Math.random() - 0.5) * 0.5,
            forceY: (Math.random() - 0.5) * 0.2,
            color: 'rgba(135, 206, 235, 0.3)'
        });
    }
    
    getRandomColor() {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd', '#98d8c8'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    updateObjects() {
        for (let obj of this.objects) {
            if (obj.type === 'wind') continue; // Вітер не рухається
            
            // Применяем гравитацию
            if (!this.isDragging || this.dragObject !== obj) {
                obj.vy += this.gravity;
            }
            
            // Обновляем позицию
            obj.x += obj.vx;
            obj.y += obj.vy;
            
            // Применяем трение
            obj.vx *= this.friction;
            obj.vy *= this.friction;
            
            // Столкновения с границами
            this.handleBoundaryCollision(obj);
            
            // Вращение для треугольников
            if (obj.type === 'triangle') {
                obj.rotation += obj.angularVelocity;
                this.updateTrianglePoints(obj);
            }
        }
        
        // Обрабатываем столкновения между объектами
        this.handleObjectCollisions();
        
        // Применяем силу ветра
        this.applyWindForces();
    }
    
    updateTrianglePoints(obj) {
        const centerX = obj.x;
        const centerY = obj.y;
        const size = 25; // Приблизительный размер
        
        const basePoints = [
            { x: 0, y: -size },
            { x: -size * 0.866, y: size * 0.5 },
            { x: size * 0.866, y: size * 0.5 }
        ];
        
        obj.points = basePoints.map(point => {
            const dx = point.x;
            const dy = point.y;
            return {
                x: centerX + dx * Math.cos(obj.rotation) - dy * Math.sin(obj.rotation),
                y: centerY + dx * Math.sin(obj.rotation) + dy * Math.cos(obj.rotation)
            };
        });
    }
    
    handleBoundaryCollision(obj) {
        const margin = 5;
        
        if (obj.type === 'box') {
            if (obj.x - obj.width/2 < margin) {
                obj.x = obj.width/2 + margin;
                obj.vx = Math.abs(obj.vx) * obj.elasticity;
            }
            if (obj.x + obj.width/2 > this.gameWidth - margin) {
                obj.x = this.gameWidth - obj.width/2 - margin;
                obj.vx = -Math.abs(obj.vx) * obj.elasticity;
            }
            if (obj.y - obj.height/2 < margin) {
                obj.y = obj.height/2 + margin;
                obj.vy = Math.abs(obj.vy) * obj.elasticity;
            }
            if (obj.y + obj.height/2 > this.gameHeight - margin) {
                obj.y = this.gameHeight - obj.height/2 - margin;
                obj.vy = -Math.abs(obj.vy) * obj.elasticity;
            }
        } else if (obj.type === 'circle') {
            if (obj.x - obj.radius < margin) {
                obj.x = obj.radius + margin;
                obj.vx = Math.abs(obj.vx) * obj.elasticity;
            }
            if (obj.x + obj.radius > this.gameWidth - margin) {
                obj.x = this.gameWidth - obj.radius - margin;
                obj.vx = -Math.abs(obj.vx) * obj.elasticity;
            }
            if (obj.y - obj.radius < margin) {
                obj.y = obj.radius + margin;
                obj.vy = Math.abs(obj.vy) * obj.elasticity;
            }
            if (obj.y + obj.radius > this.gameHeight - margin) {
                obj.y = this.gameHeight - obj.radius - margin;
                obj.vy = -Math.abs(obj.vy) * obj.elasticity;
            }
        }
    }
    
    handleObjectCollisions() {
        for (let i = 0; i < this.objects.length; i++) {
            for (let j = i + 1; j < this.objects.length; j++) {
                const obj1 = this.objects[i];
                const obj2 = this.objects[j];
                
                if (obj1.type === 'wind' || obj2.type === 'wind') continue;
                if (obj1.type === 'spring' || obj2.type === 'spring') continue;
                
                if (this.checkCollision(obj1, obj2)) {
                    this.resolveCollision(obj1, obj2);
                }
            }
        }
    }
    
    checkCollision(obj1, obj2) {
        if (obj1.type === 'circle' && obj2.type === 'circle') {
            const distance = Math.sqrt((obj1.x - obj2.x) ** 2 + (obj1.y - obj2.y) ** 2);
            return distance < obj1.radius + obj2.radius;
        } else if (obj1.type === 'circle' && obj2.type === 'box') {
            return this.circleBoxCollision(obj1, obj2);
        } else if (obj1.type === 'box' && obj2.type === 'circle') {
            return this.circleBoxCollision(obj2, obj1);
        }
        return false;
    }
    
    circleBoxCollision(circle, box) {
        const closestX = Math.max(box.x - box.width/2, Math.min(circle.x, box.x + box.width/2));
        const closestY = Math.max(box.y - box.height/2, Math.min(circle.y, box.y + box.height/2));
        
        const distance = Math.sqrt((circle.x - closestX) ** 2 + (circle.y - closestY) ** 2);
        return distance < circle.radius;
    }
    
    resolveCollision(obj1, obj2) {
        const dx = obj2.x - obj1.x;
        const dy = obj2.y - obj1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance === 0) return;
        
        // Нормализованный вектор столкновения
        const nx = dx / distance;
        const ny = dy / distance;
        
        // Относительная скорость
        const dvx = obj2.vx - obj1.vx;
        const dvy = obj2.vy - obj1.vy;
        
        // Скорость вдоль нормали
        const dvn = dvx * nx + dvy * ny;
        
        // Не реагируем, если объекты расходятся
        if (dvn > 0) return;
        
        // Коэффициент упругости
        const restitution = Math.min(obj1.elasticity || 0.7, obj2.elasticity || 0.7);
        
        // Импульс столкновения
        const j = -(1 + restitution) * dvn / (1/obj1.mass + 1/obj2.mass);
        
        // Применяем импульс
        obj1.vx -= (j * nx) / obj1.mass;
        obj1.vy -= (j * ny) / obj1.mass;
        obj2.vx += (j * nx) / obj2.mass;
        obj2.vy += (j * ny) / obj2.mass;
        
        // Разделяем объекты
        const overlap = (obj1.radius + obj2.radius - distance) / 2;
        obj1.x -= overlap * nx;
        obj1.y -= overlap * ny;
        obj2.x += overlap * nx;
        obj2.y += overlap * ny;
    }
    
    applyWindForces() {
        for (let wind of this.objects) {
            if (wind.type === 'wind') {
                for (let obj of this.objects) {
                    if (obj.type === 'wind') continue;
                    
                    // Проверяем, находится ли объект в области ветра
                    if (obj.x > wind.x - wind.width/2 && obj.x < wind.x + wind.width/2 &&
                        obj.y > wind.y - wind.height/2 && obj.y < wind.y + wind.height/2) {
                        
                        obj.vx += wind.forceX;
                        obj.vy += wind.forceY;
                    }
                }
            }
        }
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.gameWidth, this.gameHeight);
        
        // Рисуем фон
        this.drawBackground();
        
        // Рисуем объекты
        for (let obj of this.objects) {
            this.drawObject(obj);
        }
        
        // Рисуем курсор для текущего инструмента
        this.drawCursor();
    }
    
    drawBackground() {
        // Градиентный фон
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.gameHeight);
        gradient.addColorStop(0, '#1e3c72');
        gradient.addColorStop(1, '#2a5298');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);
        
        // Сетка
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
    
    drawObject(obj) {
        this.ctx.fillStyle = obj.color;
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;
        
        if (obj.type === 'box') {
            this.ctx.fillRect(obj.x - obj.width/2, obj.y - obj.height/2, obj.width, obj.height);
            this.ctx.strokeRect(obj.x - obj.width/2, obj.y - obj.height/2, obj.width, obj.height);
        } else if (obj.type === 'circle') {
            this.ctx.beginPath();
            this.ctx.arc(obj.x, obj.y, obj.radius, 0, 2 * Math.PI);
            this.ctx.fill();
            this.ctx.stroke();
        } else if (obj.type === 'triangle') {
            this.ctx.beginPath();
            this.ctx.moveTo(obj.points[0].x, obj.points[0].y);
            this.ctx.lineTo(obj.points[1].x, obj.points[1].y);
            this.ctx.lineTo(obj.points[2].x, obj.points[2].y);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();
        } else if (obj.type === 'spring') {
            this.drawSpring(obj);
        } else if (obj.type === 'wind') {
            this.drawWind(obj);
        }
    }
    
    drawSpring(spring) {
        // Рисуем спираль пружины
        this.ctx.strokeStyle = spring.color;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        
        const coils = 8;
        const radius = 8;
        for (let i = 0; i <= coils * 10; i++) {
            const t = (i / (coils * 10)) * Math.PI * 2 * coils;
            const x = spring.x + radius * Math.cos(t);
            const y = spring.y + (t / (Math.PI * 2 * coils)) * spring.length - spring.length/2;
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        this.ctx.stroke();
        
        // Концы пружины
        this.ctx.fillStyle = spring.color;
        this.ctx.beginPath();
        this.ctx.arc(spring.x, spring.y - spring.length/2, 6, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(spring.x, spring.y + spring.length/2, 6, 0, 2 * Math.PI);
        this.ctx.fill();
    }
    
    drawWind(wind) {
        // Прозрачная область ветра
        this.ctx.fillStyle = wind.color;
        this.ctx.fillRect(wind.x - wind.width/2, wind.y - wind.height/2, wind.width, wind.height);
        
        // Стрелки ветра
        this.ctx.strokeStyle = '#87ceeb';
        this.ctx.lineWidth = 2;
        
        const arrowSpacing = 30;
        for (let y = wind.y - wind.height/2; y < wind.y + wind.height/2; y += arrowSpacing) {
            for (let x = wind.x - wind.width/2; x < wind.x + wind.width/2; x += arrowSpacing * 2) {
                this.drawArrow(x, y, wind.forceX * 10, wind.forceY * 10);
            }
        }
    }
    
    drawArrow(x, y, dx, dy) {
        const length = Math.sqrt(dx * dx + dy * dy);
        if (length === 0) return;
        
        const nx = dx / length;
        const ny = dy / length;
        
        // Основная линия
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x + nx * 20, y + ny * 20);
        this.ctx.stroke();
        
        // Наконечник стрелы
        this.ctx.beginPath();
        const arrowSize = 5;
        this.ctx.moveTo(x + nx * 20, y + ny * 20);
        this.ctx.lineTo(x + nx * 20 - ny * arrowSize, y + ny * 20 + nx * arrowSize);
        this.ctx.lineTo(x + nx * 20 + ny * arrowSize, y + ny * 20 - nx * arrowSize);
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    drawCursor() {
        if (this.mouseX === undefined || this.mouseY === undefined) return;
        
        if (this.selectedTool !== 'none') {
            const tool = this.toolTypes[this.selectedTool];
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            
            if (this.selectedTool === 'circle') {
                this.ctx.beginPath();
                this.ctx.arc(this.mouseX, this.mouseY, 20, 0, 2 * Math.PI);
                this.ctx.stroke();
            } else if (this.selectedTool === 'box') {
                this.ctx.strokeRect(this.mouseX - 25, this.mouseY - 25, 50, 50);
            }
            
            this.ctx.setLineDash([]);
        }
    }
    
    gameLoop() {
        this.updateObjects();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    setTool(tool) {
        this.selectedTool = tool;
    }
    
    clearObjects() {
        this.objects = [];
        this.objectCount = 0;
    }
    
    getObjectCount() {
        return this.objectCount;
    }
    
    getMaxObjects() {
        return this.maxObjects;
    }
}

// Глобальні функції
function createObject(type) {
    if (window.physicsSandbox) {
        window.physicsSandbox.setTool(type);
    }
}

function clearObjects() {
    if (window.physicsSandbox) {
        window.physicsSandbox.clearObjects();
    }
}

function initializePhysicsSandbox() {
    window.physicsSandbox = new PhysicsSandbox();
}

// HTML та CSS для Physics Sandbox
const physicsStyles = `
    .physics-controls {
        margin-top: 20px;
        padding: 15px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 10px;
    }
    
    .tool-selection {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 10px;
        margin-bottom: 15px;
    }
    
    .tool-btn {
        padding: 10px;
        background: rgba(255, 255, 255, 0.2);
        border: 2px solid transparent;
        color: white;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
        text-align: center;
    }
    
    .tool-btn:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: translateY(-2px);
    }
    
    .tool-btn.selected {
        border-color: #4ecdc4;
        background: rgba(78, 205, 196, 0.3);
        box-shadow: 0 4px 12px rgba(78, 205, 196, 0.3);
    }
    
    .physics-stats {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;
    }
    
    .physics-stats span {
        background: rgba(255, 255, 255, 0.2);
        padding: 5px 10px;
        border-radius: 15px;
        font-size: 0.9rem;
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
`;

function loadPhysicsSandbox(container) {
    const toolButtons = Object.entries(window.physicsSandbox?.toolTypes || {}).map(([key, tool]) => 
        `<button onclick="selectPhysicsTool('${key}')" class="tool-btn" data-tool="${key}">
            ${tool.icon} ${tool.name}
        </button>`
    ).join('');
    
    container.innerHTML = `
        <h2>🧊 Фізична пісочниця</h2>
        <div class="game-area">
            <canvas id="physicsCanvas" width="800" height="600"></canvas>
        </div>
        <div class="game-controls">
            <div class="physics-controls">
                <h4>Інструменти:</h4>
                <div class="tool-selection">
                    ${toolButtons}
                    <button onclick="selectPhysicsTool('none')" class="tool-btn" data-tool="none">
                        🖱️ Переміщення
                    </button>
                </div>
                <div class="physics-stats">
                    <span>Об'єктів: <span id="objCount">0</span>/<span id="maxObjCount">50</span></span>
                    <button onclick="clearObjects()">Очистити</button>
                </div>
            </div>
        </div>
    `;
    
    initializePhysicsSandbox();
    
    // Додаємо стилі
    const style = document.createElement('style');
    style.textContent = physicsStyles;
    document.head.appendChild(style);
}

function selectPhysicsTool(tool) {
    if (window.physicsSandbox) {
        window.physicsSandbox.setTool(tool);
        
        // Оновлюємо UI
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        document.querySelector(`[data-tool="${tool}"]`).classList.add('selected');
    }
}

// Оновлення статистики в реальному часі
setInterval(() => {
    if (window.physicsSandbox) {
        const count = window.physicsSandbox.getObjectCount();
        const max = window.physicsSandbox.getMaxObjects();
        const countEl = document.getElementById('objCount');
        const maxEl = document.getElementById('maxObjCount');
        if (countEl) countEl.textContent = count;
        if (maxEl) maxEl.textContent = max;
    }
}, 1000);
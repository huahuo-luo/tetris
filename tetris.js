        // 游戏常量
        const COLS = 10;
        const ROWS = 20;
        const BLOCK_SIZE = 25;
        
        // 七种方块形状（每种有4种旋转状态）
        const SHAPES = {
            I: [
                [[0, -1], [0, 0], [0, 1], [0, 2]],
                [[-1, 0], [0, 0], [1, 0], [2, 0]],
                [[0, -1], [0, 0], [0, 1], [0, 2]],
                [[-1, 0], [0, 0], [1, 0], [2, 0]]
            ],
            J: [
                [[-1, -1], [0, -1], [0, 0], [0, 1]],
                [[-1, 1], [-1, 0], [0, 0], [1, 0]],
                [[1, -1], [0, -1], [0, 0], [0, 1]],
                [[-1, 0], [0, 0], [1, 0], [1, -1]]
            ],
            L: [
                [[1, -1], [0, -1], [0, 0], [0, 1]],
                [[-1, 0], [0, 0], [1, 0], [-1, -1]],
                [[0, -1], [0, 0], [0, 1], [-1, 1]],
                [[-1, 0], [0, 0], [1, 0], [1, 1]]
            ],
            O: [
                [[0, 0], [1, 0], [0, 1], [1, 1]],
                [[0, 0], [1, 0], [0, 1], [1, 1]],
                [[0, 0], [1, 0], [0, 1], [1, 1]],
                [[0, 0], [1, 0], [0, 1], [1, 1]]
            ],
            S: [
                [[0, 0], [1, 0], [-1, 1], [0, 1]],
                [[0, -1], [0, 0], [1, 0], [1, 1]],
                [[0, 0], [1, 0], [-1, 1], [0, 1]],
                [[0, -1], [0, 0], [1, 0], [1, 1]]
            ],
            T: [
                [[0, 0], [-1, 0], [1, 0], [0, 1]],
                [[0, 0], [0, -1], [0, 1], [1, 0]],
                [[0, 0], [-1, 0], [1, 0], [0, -1]],
                [[0, 0], [0, -1], [0, 1], [-1, 0]]
            ],
            Z: [
                [[0, 0], [-1, 0], [0, 1], [1, 1]],
                [[0, 0], [0, -1], [1, 0], [1, 1]],
                [[0, 0], [-1, 0], [0, 1], [1, 1]],
                [[0, 0], [0, -1], [1, 0], [1, 1]]
            ]
        };
        
        // 游戏状态
        let grid = createEmptyGrid();
        let currentPiece = null;
        let nextPiece = null;
        let score = 0;
        let level = 1;
        let gameOver = false;
        let isPaused = false;
        let gameLoopId = null;
        let lastDropTime = 0;
        
        // DOM元素
        const gameBoard = document.getElementById('game-board');
        const nextPieceDisplay = document.getElementById('next-piece');
        const scoreDisplay = document.getElementById('score');
        const levelDisplay = document.getElementById('level');
        const startBtn = document.getElementById('start-btn');
        const pauseBtn = document.getElementById('pause-btn');
        const gameOverDisplay = document.getElementById('game-over');
        
        // 初始化游戏板
        function initGameBoard() {
            gameBoard.innerHTML = '';
            for (let y = 0; y < ROWS; y++) {
                for (let x = 0; x < COLS; x++) {
                    const cell = document.createElement('div');
                    cell.className = 'cell';
                    cell.id = `cell-${x}-${y}`;
                    gameBoard.appendChild(cell);
                }
            }
        }
        
        // 初始化下一个方块预览
        function initNextPieceDisplay() {
            nextPieceDisplay.innerHTML = '';
            for (let y = 0; y < 4; y++) {
                for (let x = 0; x < 4; x++) {
                    const cell = document.createElement('div');
                    cell.className = 'next-cell';
                    cell.id = `next-cell-${x}-${y}`;
                    nextPieceDisplay.appendChild(cell);
                }
            }
        }
        
        // 创建空网格
        function createEmptyGrid() {
            return Array(ROWS).fill().map(() => Array(COLS).fill(0));
        }
        
        // 生成随机方块
        function getRandomPiece() {
            const shapes = Object.keys(SHAPES);
            return shapes[Math.floor(Math.random() * shapes.length)];
        }
        
        // 生成新方块
        function spawnNewPiece() {
            if (nextPiece) {
                currentPiece = {
                    shape: nextPiece,
                    rotation: 0,
                    x: Math.floor(COLS / 2) - 1,
                    y: 0
                };
                nextPiece = getRandomPiece();
                updateNextPieceDisplay();
            } else {
                currentPiece = {
                    shape: getRandomPiece(),
                    rotation: 0,
                    x: Math.floor(COLS / 2) - 1,
                    y: 0
                };
                nextPiece = getRandomPiece();
                updateNextPieceDisplay();
            }
            
            // 检查游戏是否结束
            if (isCollision(getCurrentShape(), currentPiece.x, currentPiece.y)) {
                gameOver = true;
                gameOverDisplay.style.display = 'block';
                cancelAnimationFrame(gameLoopId);
            }
        }
        
        // 获取当前方块的形状坐标
        function getCurrentShape() {
            return SHAPES[currentPiece.shape][currentPiece.rotation];
        }
        
        // 碰撞检测
        function isCollision(shape, x, y) {
            return shape.some(([dx, dy]) => {
                const nx = x + dx;
                const ny = y + dy;
                return (
                    nx < 0 || nx >= COLS || ny >= ROWS ||
                    (ny >= 0 && grid[ny][nx])
                );
            });
        }
        
        // 移动方块
        function movePiece(dx, dy) {
            if (gameOver || isPaused) return false;
            
            if (!isCollision(getCurrentShape(), currentPiece.x + dx, currentPiece.y + dy)) {
                currentPiece.x += dx;
                currentPiece.y += dy;
                draw();
                return true;
            } else if (dy === 1) { // 触底
                lockPiece();
                clearLines();
                spawnNewPiece();
                draw();
                return false;
            }
            return false;
        }
        
        // 旋转方块
        function rotatePiece() {
            if (gameOver || isPaused) return;
            
            const newRotation = (currentPiece.rotation + 1) % SHAPES[currentPiece.shape].length;
            const newShape = SHAPES[currentPiece.shape][newRotation];
            
            // 尝试旋转，如果碰撞则尝试"踢墙"（左右移动一格再旋转）
            if (!isCollision(newShape, currentPiece.x, currentPiece.y)) {
                currentPiece.rotation = newRotation;
            } else {
                // 左踢
                if (!isCollision(newShape, currentPiece.x - 1, currentPiece.y)) {
                    currentPiece.rotation = newRotation;
                    currentPiece.x -= 1;
                } 
                // 右踢
                else if (!isCollision(newShape, currentPiece.x + 1, currentPiece.y)) {
                    currentPiece.rotation = newRotation;
                    currentPiece.x += 1;
                }
            }
            draw();
        }
        
        // 固定方块到网格
        function lockPiece() {
            getCurrentShape().forEach(([dx, dy]) => {
                const nx = currentPiece.x + dx;
                const ny = currentPiece.y + dy;
                if (ny >= 0) {
                    grid[ny][nx] = 1;
                }
            });
        }
        
        // 消除满行
        function clearLines() {
            const newGrid = grid.filter(row => !row.every(cell => cell === 1));
            const linesCleared = ROWS - newGrid.length;
            
            if (linesCleared > 0) {
                // 计算得分
                score += linesCleared * 100 * level;
                scoreDisplay.textContent = score;
                
                // 升级逻辑（每消10行升一级）
                const newLevel = Math.floor(score / 1000) + 1;
                if (newLevel > level) {
                    level = newLevel;
                    levelDisplay.textContent = level;
                }
                
                // 补全被消除的行
                for (let i = 0; i < linesCleared; i++) {
                    newGrid.unshift(Array(COLS).fill(0));
                }
                
                grid = newGrid;
            }
        }
        
        // 绘制游戏板
        function draw() {
            // 清空游戏板
            for (let y = 0; y < ROWS; y++) {
                for (let x = 0; x < COLS; x++) {
                    const cell = document.getElementById(`cell-${x}-${y}`);
                    cell.className = 'cell';
                }
            }
            
            // 绘制已固定的方块
            for (let y = 0; y < ROWS; y++) {
                for (let x = 0; x < COLS; x++) {
                    if (grid[y][x]) {
                        const cell = document.getElementById(`cell-${x}-${y}`);
                        cell.classList.add('filled');
                    }
                }
            }
            
            // 绘制当前方块
            if (currentPiece) {
                getCurrentShape().forEach(([dx, dy]) => {
                    const nx = currentPiece.x + dx;
                    const ny = currentPiece.y + dy;
                    if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS) {
                        const cell = document.getElementById(`cell-${nx}-${ny}`);
                        cell.classList.add('filled');
                    }
                });
            }
        }
        
        // 更新下一个方块预览
        function updateNextPieceDisplay() {
            // 清空预览
            for (let y = 0; y < 4; y++) {
                for (let x = 0; x < 4; x++) {
                    const cell = document.getElementById(`next-cell-${x}-${y}`);
                    cell.className = 'next-cell';
                }
            }
            
            // 绘制下一个方块
            if (nextPiece) {
                const shape = SHAPES[nextPiece][0];
                shape.forEach(([dx, dy]) => {
                    const x = 1 + dx;
                    const y = 1 + dy;
                    if (x >= 0 && x < 4 && y >= 0 && y < 4) {
                        const cell = document.getElementById(`next-cell-${x}-${y}`);
                        cell.classList.add('filled');
                    }
                });
            }
        }
        
        // 游戏主循环
        function gameLoop(timestamp) {
            if (gameOver || isPaused) {
                lastDropTime = timestamp;
                gameLoopId = requestAnimationFrame(gameLoop);
                return;
            }
            
            // 根据等级调整下落速度
            const dropInterval = 1000 - (level - 1) * 100;
            
            if (timestamp - lastDropTime > dropInterval) {
                movePiece(0, 1);
                lastDropTime = timestamp;
            }
            
            gameLoopId = requestAnimationFrame(gameLoop);
        }
        
        // 开始游戏
        function startGame() {
            console.log("开始游戏！");

            grid = createEmptyGrid();
            score = 0;
            level = 1;
            gameOver = false;
            isPaused = false;
            
            scoreDisplay.textContent = score;
            levelDisplay.textContent = level;
            gameOverDisplay.style.display = 'none';
            
            spawnNewPiece();
            updateNextPieceDisplay();
            draw();
            
            if (gameLoopId) {
                cancelAnimationFrame(gameLoopId);
            }
            lastDropTime = 0;
            gameLoopId = requestAnimationFrame(gameLoop);
        }
        
        // 暂停/继续游戏
        function pauseGame() {
            isPaused = !isPaused;
            pauseBtn.textContent = isPaused ? '继续' : '暂停';
        }
        
        // 键盘控制
        function handleKeyDown(e) {
            if (gameOver) return;
            
            switch (e.key) {
                case 'ArrowLeft':
                    movePiece(-1, 0);
                    break;
                case 'ArrowRight':
                    movePiece(1, 0);
                    break;
                case 'ArrowDown':
                    movePiece(0, 1);
                    break;
                case 'ArrowUp':
                    rotatePiece();
                    break;
                case ' ':
                    // 硬降（直接落到底部）
                    while (movePiece(0, 1)) {}
                    break;
                case 'p':
                    pauseGame();
                    break;
            }
        }
        
        // 初始化游戏
        function init() {
            initGameBoard();
            initNextPieceDisplay();
            
            startBtn.addEventListener('click', startGame);
            pauseBtn.addEventListener('click', pauseGame);
            window.addEventListener('keydown', handleKeyDown);
        }
        
        // 启动游戏
        init();
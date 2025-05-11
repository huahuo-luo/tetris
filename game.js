// 游戏状态变量
let board = []; // 游戏板二维数组
let currentPiece = null; // 当前下落方块
let nextPiece = null; // 下一个方块
let score = 0; // 分数
let level = 1; // 等级
let gameInterval = null; // 游戏循环
let isPaused = false; // 暂停状态
let isGameOver = false; // 游戏结束标志

// 方块形状定义
const SHAPES = [
    [[1, 1, 1, 1]], // I
    [[1, 1], [1, 1]], // O
    [[1, 1, 1], [0, 1, 0]], // T
    [[1, 1, 1], [1, 0, 0]], // L
    [[1, 1, 1], [0, 0, 1]], // J
    [[0, 1, 1], [1, 1, 0]], // S
    [[1, 1, 0], [0, 1, 1]]  // Z
];

// 初始化游戏板
function initBoard() {
    board = Array(20).fill().map(() => Array(10).fill(0));
    renderBoard();
}

// 渲染游戏板到DOM
function renderBoard() {
    const gameBoard = document.getElementById('game-board');
    gameBoard.innerHTML = '';

    for (let y = 0; y < 20; y++) {
        for (let x = 0; x < 10; x++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            if (board[y][x] || (currentPiece && isPieceAt(currentPiece, x, y))) {
                cell.classList.add('filled');
            }
            gameBoard.appendChild(cell);
        }
    }
}

// 检查方块是否在指定位置
function isPieceAt(piece, x, y) {
    for (let py = 0; py < piece.shape.length; py++) {
        for (let px = 0; px < piece.shape[py].length; px++) {
            if (piece.shape[py][px] &&
                piece.x + px === x &&
                piece.y + py === y) {
                return true;
            }
        }
    }
    return false;
}

// 创建随机方块
function createRandomPiece() {
    const randomIndex = Math.floor(Math.random() * SHAPES.length);
    return {
        shape: SHAPES[randomIndex],
        x: Math.floor(5 - SHAPES[randomIndex][0].length / 2), // 居中放置
        y: 0 // 从顶部开始
    };
}

// 渲染下一个方块预览
function renderNextPiece() {
    const nextPieceElement = document.getElementById('next-piece');
    nextPieceElement.innerHTML = '';

    if (!nextPiece) return;

    for (let y = 0; y < nextPiece.shape.length; y++) {
        for (let x = 0; x < nextPiece.shape[y].length; x++) {
            const cell = document.createElement('div');
            cell.className = 'next-cell';
            if (nextPiece.shape[y][x]) {
                cell.classList.add('filled');
            }
            nextPieceElement.appendChild(cell);
        }
    }
}

// 渲染下一个方块预览
function renderNextPiece() {
    const nextPieceElement = document.getElementById('next-piece');
    nextPieceElement.innerHTML = '';

    if (!nextPiece) return;

    for (let y = 0; y < nextPiece.shape.length; y++) {
        for (let x = 0; x < nextPiece.shape[y].length; x++) {
            const cell = document.createElement('div');
            cell.className = 'next-cell';
            if (nextPiece.shape[y][x]) {
                cell.classList.add('filled');
            }
            nextPieceElement.appendChild(cell);
        }
    }
}

// 生成新方块
function spawnNewPiece() {
    currentPiece = nextPiece || createRandomPiece();
    nextPiece = createRandomPiece();
    renderNextPiece();

    // 检查游戏是否结束
    if (checkCollision(currentPiece)) {
        gameOver();
    }
}

// 检查碰撞
function checkCollision(piece) {
    for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
            if (piece.shape[y][x]) {
                const boardX = piece.x + x;
                const boardY = piece.y + y;

                // 检查是否超出边界或与已有方块重叠
                if (boardX < 0 ||
                    boardX >= 10 ||
                    boardY >= 20 ||
                    (boardY >= 0 && board[boardY][boardX])) {
                    return true;
                }
            }
        }
    }
    return false;
}

// 移动方块
function movePiece(direction) {
    if (isPaused || isGameOver) return;

    const newPiece = { ...currentPiece };

    switch (direction) {
        case 'left':
            newPiece.x--;
            break;
        case 'right':
            newPiece.x++;
            break;
        case 'down':
            newPiece.y++;
            break;
    }

    // 检查移动是否有效
    if (!checkCollision(newPiece)) {
        currentPiece = newPiece;
        renderBoard();
        return true; // 移动成功
    }

    // 如果是向下移动且碰到障碍物，固定方块
    if (direction === 'down') {
        lockPiece();
    }

    return false; // 移动失败
}

// 旋转方块
function rotatePiece() {
    if (isPaused || isGameOver) return;

    const newPiece = { ...currentPiece };
    // 转置矩阵并反转每一行得到旋转后的形状
    newPiece.shape = newPiece.shape[0].map((_, i) =>
        newPiece.shape.map(row => row[i]).reverse()
    );

    // 检查旋转后是否有效
    if (!checkCollision(newPiece)) {
        currentPiece = newPiece;
        renderBoard();
    }
}

// 固定当前方块到游戏板
function lockPiece() {
    for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
            if (currentPiece.shape[y][x]) {
                const boardY = currentPiece.y + y;
                const boardX = currentPiece.x + x;
                if (boardY >= 0) { // 确保不超出顶部
                    board[boardY][boardX] = 1;
                }
            }
        }
    }

    // 检查是否有完整的行可以消除
    clearLines();
    // 生成新方块
    spawnNewPiece();
    renderBoard();
}

// 键盘事件监听
function setupControls() {
    document.addEventListener('keydown', (e) => {
        switch (e.key) {
            case 'ArrowLeft':
                movePiece('left');
                break;
            case 'ArrowRight':
                movePiece('right');
                break;
            case 'ArrowDown':
                movePiece('down');
                break;
            case 'ArrowUp':
                rotatePiece();
                break;
            case ' ':
                hardDrop();
                break;
            case 'p': // P键暂停/继续
            case 'P': // 大写P键
            case 'Escape': // Esc键
                pauseGame();
                break;
        }
    });
}

// 初始化控制
setupControls();

// 消除完整的行
function clearLines() {
    let linesCleared = 0;

    for (let y = 19; y >= 0; y--) {
        // 检查当前行是否已填满
        if (board[y].every(cell => cell === 1)) {
            // 移除该行
            board.splice(y, 1);
            // 在顶部添加新行
            board.unshift(Array(10).fill(0));
            linesCleared++;
            y++; // 重新检查当前行(因为下移了一行)
        }
    }

    // 更新分数
    if (linesCleared > 0) {
        updateScore(linesCleared);
    }
}

// 更新分数和等级
function updateScore(lines) {
    // 分数计算规则：消除的行数越多，得分越高
    const linePoints = [0, 40, 100, 300, 1200]; // 0,1,2,3,4行的分数
    score += linePoints[lines] * level;

    // 每1000分升一级
    const newLevel = Math.floor(score / 1000) + 1;
    if (newLevel > level) {
        level = newLevel;
        document.getElementById('level').textContent = level;
    }

    document.getElementById('score').textContent = score;
}

// 硬降(快速下落)
function hardDrop() {
    if (isPaused || isGameOver) return;

    // 一直向下移动直到不能移动为止
    while (movePiece('down')) {
        // 空循环，直到不能移动
    }
}

// 游戏主循环
function gameLoop() {
    if (isPaused || isGameOver) return;

    // 自动下落
    const moved = movePiece('down');

    // 如果方块已经到底，则生成新方块
    if (!moved) {
        // 已经在lockPiece中处理
    }

    // 根据等级调整下落速度
    const speed = Math.max(1000 - (level - 1) * 100, 100); // 最低100ms
    clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, speed);
}

// 开始游戏
function startGame() {
    if (gameInterval) clearInterval(gameInterval);

    // 重置游戏状态
    score = 0;
    level = 1;
    isGameOver = false;
    isPaused = false;
    document.getElementById('score').textContent = '0';
    document.getElementById('level').textContent = '1';
    document.getElementById('game-over').style.display = 'none';

    // 初始化游戏板
    initBoard();
    // 生成第一个方块
    spawnNewPiece();
    // 开始游戏循环
    gameLoop();
}

// 暂停游戏
function pauseGame() {
    isPaused = !isPaused;
    const pauseBtn = document.getElementById('pause-btn');
    pauseBtn.textContent = isPaused ? '继续' : '暂停';

    if (!isPaused && !isGameOver) {
        gameLoop(); // 继续游戏时重启游戏循环
    }
}

// 游戏结束
function gameOver() {
    isGameOver = true;
    clearInterval(gameInterval);
    document.getElementById('game-over').style.display = 'block';
}

// 绑定按钮事件
document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('pause-btn').addEventListener('click', pauseGame);

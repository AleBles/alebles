// Self-playing Snake for the hero. Colours come from the --snake-* custom
// properties in styles.css so the palette lives in one place.
(function () {
    const canvas = document.getElementById('snakeCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const css = getComputedStyle(document.documentElement);
    const token = (name, fallback) => css.getPropertyValue(name).trim() || fallback;
    const C = {
        bg: token('--snake-bg', '#0f0d24'),
        grid: token('--snake-grid', 'rgba(157, 107, 255, 0.16)'),
        body: token('--snake-body', '#3df5ff'),
        head: token('--snake-head', '#d6fcff'),
        food: token('--snake-food', '#ff4fd8'),
        score: token('--snake-score', '#ffb347'),
    };

    const gridSize = 10;
    const tileCount = canvas.width / gridSize;

    let snake = [
        { x: 7, y: 7 },
        { x: 6, y: 7 },
        { x: 5, y: 7 },
    ];

    let dx = 1;
    let dy = 0;
    let food = { x: 12, y: 12 };
    let score = 0;
    let gameSpeed = 150;
    let timer = null;

    function cell(x, y) {
        ctx.fillRect(x * gridSize + 1, y * gridSize + 1, gridSize - 2, gridSize - 2);
    }

    function drawGame() {
        ctx.shadowBlur = 0;
        ctx.fillStyle = C.bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Subtle grid
        ctx.strokeStyle = C.grid;
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= tileCount; i++) {
            ctx.beginPath();
            ctx.moveTo(i * gridSize, 0);
            ctx.lineTo(i * gridSize, canvas.height);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, i * gridSize);
            ctx.lineTo(canvas.width, i * gridSize);
            ctx.stroke();
        }

        // Score, top right
        ctx.fillStyle = C.score;
        ctx.font = 'bold 8px ui-monospace, Menlo, monospace';
        ctx.textAlign = 'right';
        ctx.fillText(score.toString().padStart(3, '0'), canvas.width - 3, 8);

        // Food with magenta glow
        ctx.shadowColor = C.food;
        ctx.shadowBlur = 8;
        ctx.fillStyle = C.food;
        cell(food.x, food.y);

        // Snake with cyan glow, brighter head
        ctx.shadowColor = C.body;
        snake.forEach((segment, index) => {
            ctx.fillStyle = index === 0 ? C.head : C.body;
            cell(segment.x, segment.y);
        });
        ctx.shadowBlur = 0;
    }

    function updateGame() {
        const head = { x: snake[0].x + dx, y: snake[0].y + dy };

        // Wrap around the walls
        if (head.x < 0) head.x = tileCount - 1;
        if (head.x >= tileCount) head.x = 0;
        if (head.y < 0) head.y = tileCount - 1;
        if (head.y >= tileCount) head.y = 0;

        // Self collision restarts the game
        for (const segment of snake) {
            if (head.x === segment.x && head.y === segment.y) {
                resetGame();
                return;
            }
        }

        snake.unshift(head);

        if (head.x === food.x && head.y === food.y) {
            score += 10;
            placeFood();
            gameSpeed = Math.max(80, gameSpeed - 2);
        } else {
            snake.pop();
        }

        const nextMove = getNextMove();
        dx = nextMove.dx;
        dy = nextMove.dy;
    }

    function getNextMove() {
        const head = snake[0];
        const moves = [];

        // Candidate moves toward the food
        if (food.x > head.x && dx !== -1) moves.push({ dx: 1, dy: 0, dist: Math.abs(food.x - head.x - 1) + Math.abs(food.y - head.y) });
        if (food.x < head.x && dx !== 1) moves.push({ dx: -1, dy: 0, dist: Math.abs(food.x - head.x + 1) + Math.abs(food.y - head.y) });
        if (food.y > head.y && dy !== -1) moves.push({ dx: 0, dy: 1, dist: Math.abs(food.x - head.x) + Math.abs(food.y - head.y - 1) });
        if (food.y < head.y && dy !== 1) moves.push({ dx: 0, dy: -1, dist: Math.abs(food.x - head.x) + Math.abs(food.y - head.y + 1) });

        const isSafe = (move) => {
            const newHead = {
                x: (head.x + move.dx + tileCount) % tileCount,
                y: (head.y + move.dy + tileCount) % tileCount,
            };
            return !snake.some((segment, i) => i > 0 && segment.x === newHead.x && segment.y === newHead.y);
        };

        const safeMoves = moves.filter(isSafe);
        if (safeMoves.length > 0) {
            safeMoves.sort((a, b) => a.dist - b.dist);
            return safeMoves[0];
        }

        // No safe move toward the food, take any safe non-reversing move
        const allMoves = [
            { dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
        ].filter((move) => !(move.dx === -dx && move.dy === -dy));

        for (const move of allMoves) {
            if (isSafe(move)) return move;
        }

        return { dx, dy };
    }

    function placeFood() {
        do {
            food.x = Math.floor(Math.random() * tileCount);
            food.y = Math.floor(Math.random() * tileCount);
        } while (snake.some((segment) => segment.x === food.x && segment.y === food.y));
    }

    function resetGame() {
        snake = [
            { x: 7, y: 7 },
            { x: 6, y: 7 },
            { x: 5, y: 7 },
        ];
        dx = 1;
        dy = 0;
        score = 0;
        gameSpeed = 150;
        placeFood();
    }

    function gameLoop() {
        updateGame();
        drawGame();
        timer = setTimeout(gameLoop, gameSpeed);
    }

    function start() {
        if (timer === null) gameLoop();
    }

    function stop() {
        clearTimeout(timer);
        timer = null;
    }

    placeFood();

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        // One static frame, no loop.
        drawGame();
        return;
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) stop();
        else start();
    });

    start();
})();

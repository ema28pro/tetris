class Tetris {
    constructor() {
        this.BOARD_WIDTH = 10;
        this.BOARD_HEIGHT = 20;
        this.CELL_CONTENT = '  ';

        this.board = [];
        this.currentPiece = null;
        this.nextPieces = [];
        this.holdPiece = null;
        this.canHold = true;
        this.currentX = 0;
        this.currentY = 0;
        this.ghostY = 0;

        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.dropTime = 1000;
        this.lastDropTime = 0;

        this.gameRunning = false;
        this.isPaused = false;
        this.advancedMode = false;
        this.showGhostPieces = true;
        this.nextPiecesCount = 1;

        this.pieceBag = [];
        this.bagIndex = 0;

        this.gameBoard = document.getElementById('game-board');
        this.nextPiecesContainer = document.getElementById('next-pieces-container');
        this.holdPieceDisplay = document.getElementById('hold-piece');
        this.holdContainer = document.getElementById('hold-container');
        this.scoreDisplay = document.getElementById('score');
        this.linesDisplay = document.getElementById('lines');
        this.levelDisplay = document.getElementById('level');
        this.statusDisplay = document.getElementById('game-status');

        this.nextCountSlider = document.getElementById('next-pieces-count');
        this.nextCountDisplay = document.getElementById('next-count-display');
        this.advancedModeCheckbox = document.getElementById('advanced-mode');
        this.ghostPiecesCheckbox = document.getElementById('ghost-pieces');

        this.pieces = {
            I: {
                shape: [
                    [1, 1, 1, 1]
                ],
                color: 'cyan'
            },
            O: {
                shape: [
                    [1, 1],
                    [1, 1]
                ],
                color: 'yellow'
            },
            T: {
                shape: [
                    [0, 1, 0],
                    [1, 1, 1]
                ],
                color: 'purple'
            },
            S: {
                shape: [
                    [0, 1, 1],
                    [1, 1, 0]
                ],
                color: 'green'
            },
            Z: {
                shape: [
                    [1, 1, 0],
                    [0, 1, 1]
                ],
                color: 'red'
            },
            J: {
                shape: [
                    [1, 0, 0],
                    [1, 1, 1]
                ],
                color: 'blue'
            },
            L: {
                shape: [
                    [0, 0, 1],
                    [1, 1, 1]
                ],
                color: 'orange'
            }
        };

        this.init();
    }

    init() {
        this.createBoard();
        this.bindEvents();
        this.bindUIEvents();
        this.updateDisplay();
        this.createPieceBag();
    }

    createBoard() {
        this.gameBoard.innerHTML = '';
        this.board = [];

        for (let y = 0; y < this.BOARD_HEIGHT; y++) {
            this.board[y] = [];
            for (let x = 0; x < this.BOARD_WIDTH; x++) {
                this.board[y][x] = 0;
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.x = x;
                cell.dataset.y = y;
                this.gameBoard.appendChild(cell);
            }
        }

        this.createNextPiecesDisplay();
        this.createHoldPieceDisplay();
    }

    createNextPiecesDisplay() {
        this.nextPiecesContainer.innerHTML = '';

        for (let i = 0; i < this.nextPiecesCount; i++) {
            const pieceContainer = document.createElement('div');
            pieceContainer.className = 'next-piece-item';
            pieceContainer.id = `next-piece-${i}`;

            // Crear contenedor para la pieza visual
            const piecePreview = document.createElement('div');
            piecePreview.className = 'next-piece-preview';
            pieceContainer.appendChild(piecePreview);

            this.nextPiecesContainer.appendChild(pieceContainer);
        }
    } createHoldPieceDisplay() {
        if (!this.holdPieceDisplay) return;

        this.holdPieceDisplay.innerHTML = '';
        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 4; x++) {
                const cell = document.createElement('div');
                cell.className = 'hold-cell';
                cell.dataset.x = x;
                cell.dataset.y = y;
                this.holdPieceDisplay.appendChild(cell);
            }
        }
    }

    bindUIEvents() {
        this.nextCountSlider.addEventListener('input', (e) => {
            this.nextPiecesCount = parseInt(e.target.value);
            this.nextCountDisplay.textContent = this.nextPiecesCount;
            this.createNextPiecesDisplay();
            if (this.gameRunning) {
                this.fillNextPiecesQueue();
                this.updateNextPiecesDisplay();
            }
        });

        this.advancedModeCheckbox.addEventListener('change', (e) => {
            this.advancedMode = e.target.checked;
            this.holdContainer.style.display = this.advancedMode ? 'block' : 'none';
            if (!this.advancedMode) {
                this.holdPiece = null;
                this.canHold = true;
            }
        });

        this.ghostPiecesCheckbox.addEventListener('change', (e) => {
            this.showGhostPieces = e.target.checked;
        });
    }

    createPieceBag() {
        const pieceTypes = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
        this.pieceBag = [...pieceTypes];
        this.shuffleArray(this.pieceBag);
        this.bagIndex = 0;
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    getNextPieceFromBag() {
        if (this.advancedMode) {
            if (this.bagIndex >= this.pieceBag.length) {
                this.createPieceBag();
            }
            const pieceType = this.pieceBag[this.bagIndex];
            this.bagIndex++;
            return this.createPiece(pieceType);
        } else {
            return this.createRandomPiece();
        }
    }

    createPiece(pieceType) {
        return {
            type: pieceType,
            shape: JSON.parse(JSON.stringify(this.pieces[pieceType].shape)),
            color: this.pieces[pieceType].color
        };
    }

    holdCurrentPiece() {
        if (!this.canHold || !this.currentPiece) return;

        const tempPiece = this.currentPiece;

        if (this.holdPiece) {
            this.currentPiece = this.holdPiece;
            this.currentX = Math.floor((this.BOARD_WIDTH - this.currentPiece.shape[0].length) / 2);
            this.currentY = 0;
        } else {
            // Tomar la siguiente pieza de la cola
            if (this.nextPieces.length > 0) {
                this.currentPiece = this.nextPieces.shift();
                this.fillNextPiecesQueue();
                this.updateNextPiecesDisplay();
            } else {
                this.currentPiece = this.getNextPieceFromBag();
            }
            this.currentX = Math.floor((this.BOARD_WIDTH - this.currentPiece.shape[0].length) / 2);
            this.currentY = 0;
        }

        this.holdPiece = tempPiece;
        this.canHold = false;
        this.updateHoldPieceDisplay();

        if (!this.canPlacePiece(this.currentX, this.currentY)) {
            this.gameOver();
        }
    }

    fillNextPiecesQueue() {
        while (this.nextPieces.length < this.nextPiecesCount) {
            this.nextPieces.push(this.getNextPieceFromBag());
        }

        // Ajustar si se cambió el número de piezas siguientes
        if (this.nextPieces.length > this.nextPiecesCount) {
            this.nextPieces.splice(this.nextPiecesCount);
        }
    }

    calculateGhostPosition() {
        if (!this.currentPiece || !this.showGhostPieces) return -1;

        let ghostY = this.currentY;
        while (this.canPlacePiece(this.currentX, ghostY + 1)) {
            ghostY++;
        }
        return ghostY;
    }

    bindEvents() {
        document.addEventListener('keydown', (e) => {
            if (!this.gameRunning && e.key.toLowerCase() === 'r') {
                this.startGame();
                return;
            }

            if (!this.gameRunning) return;

            switch (e.key) {
                case 'ArrowLeft':
                    this.movePiece(-1, 0);
                    break;
                case 'ArrowRight':
                    this.movePiece(1, 0);
                    break;
                case 'ArrowDown':
                    this.movePiece(0, 1);
                    break;
                case 'ArrowUp':
                    this.rotatePiece();
                    break;
                case ' ':
                    this.dropPiece();
                    break;
                case 'c':
                case 'C':
                    if (this.advancedMode) {
                        this.holdCurrentPiece();
                    }
                    break;
                case 'p':
                case 'P':
                    this.togglePause();
                    break;
                case 'r':
                case 'R':
                    this.restartGame();
                    break;
            }
            e.preventDefault();
        });
    }

    startGame() {
        this.gameRunning = true;
        this.isPaused = false;
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.dropTime = 1000;
        this.holdPiece = null;
        this.canHold = true;
        this.nextPieces = [];

        this.createBoard();
        this.createPieceBag();
        this.fillNextPiecesQueue();
        this.spawnNewPiece();
        this.updateDisplay();
        this.gameLoop();
    }

    restartGame() {
        this.gameRunning = false;
        this.isPaused = false;
        this.startGame();
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        this.updateDisplay();
    }

    createRandomPiece() {
        const pieces = Object.keys(this.pieces);
        const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
        return {
            type: randomPiece,
            shape: JSON.parse(JSON.stringify(this.pieces[randomPiece].shape)),
            color: this.pieces[randomPiece].color
        };
    }

    spawnNewPiece() {
        if (this.nextPieces.length > 0) {
            this.currentPiece = this.nextPieces.shift();
            this.fillNextPiecesQueue();
        } else {
            this.currentPiece = this.getNextPieceFromBag();
        }

        this.currentX = Math.floor((this.BOARD_WIDTH - this.currentPiece.shape[0].length) / 2);
        this.currentY = 0;
        this.canHold = true;

        if (!this.canPlacePiece(this.currentX, this.currentY)) {
            this.gameOver();
            return;
        }

        this.updateNextPiecesDisplay();
    }

    canPlacePiece(x, y, shape = null) {
        const pieceShape = shape || this.currentPiece.shape;

        for (let py = 0; py < pieceShape.length; py++) {
            for (let px = 0; px < pieceShape[py].length; px++) {
                if (pieceShape[py][px]) {
                    const newX = x + px;
                    const newY = y + py;

                    if (newX < 0 || newX >= this.BOARD_WIDTH ||
                        newY >= this.BOARD_HEIGHT ||
                        (newY >= 0 && this.board[newY][newX])) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    movePiece(dx, dy) {
        if (this.isPaused || !this.currentPiece) return;

        if (this.canPlacePiece(this.currentX + dx, this.currentY + dy)) {
            this.currentX += dx;
            this.currentY += dy;
            this.render();
        } else if (dy > 0) {
            // La pieza ha tocado el suelo o otra pieza
            this.placePiece();
        }
    }

    rotatePiece() {
        if (this.isPaused || !this.currentPiece) return;

        const rotatedShape = this.rotateMatrix(this.currentPiece.shape);

        if (this.canPlacePiece(this.currentX, this.currentY, rotatedShape)) {
            this.currentPiece.shape = rotatedShape;
            this.render();
        }
    }

    rotateMatrix(matrix) {
        const rows = matrix.length;
        const cols = matrix[0].length;
        const rotated = [];

        for (let i = 0; i < cols; i++) {
            rotated[i] = [];
            for (let j = 0; j < rows; j++) {
                rotated[i][j] = matrix[rows - 1 - j][i];
            }
        }

        return rotated;
    }

    dropPiece() {
        if (this.isPaused || !this.currentPiece) return;

        while (this.canPlacePiece(this.currentX, this.currentY + 1)) {
            this.currentY++;
        }
        this.placePiece();
    }

    placePiece() {
        for (let py = 0; py < this.currentPiece.shape.length; py++) {
            for (let px = 0; px < this.currentPiece.shape[py].length; px++) {
                if (this.currentPiece.shape[py][px]) {
                    const x = this.currentX + px;
                    const y = this.currentY + py;
                    if (y >= 0) {
                        this.board[y][x] = 1;
                    }
                }
            }
        }

        this.clearLines();
        this.spawnNewPiece();
        this.render();
    }

    clearLines() {
        let linesCleared = 0;

        for (let y = this.BOARD_HEIGHT - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell === 1)) {
                this.board.splice(y, 1);
                this.board.unshift(new Array(this.BOARD_WIDTH).fill(0));
                linesCleared++;
                y++; // Verificar la misma línea otra vez
            }
        }

        if (linesCleared > 0) {
            this.lines += linesCleared;
            this.score += this.calculateScore(linesCleared);
            this.level = Math.floor(this.lines / 10) + 1;
            this.dropTime = Math.max(50, 1000 - (this.level - 1) * 50);
        }
    }

    calculateScore(linesCleared) {
        const baseScore = [0, 100, 300, 500, 800];
        return baseScore[linesCleared] * this.level;
    }

    gameLoop() {
        if (!this.gameRunning) return;

        const currentTime = Date.now();

        if (!this.isPaused && currentTime - this.lastDropTime > this.dropTime) {
            this.movePiece(0, 1);
            this.lastDropTime = currentTime;
        }

        this.render();
        this.updateDisplay();

        requestAnimationFrame(() => this.gameLoop());
    }

    render() {
        // Limpiar el tablero visual
        const cells = this.gameBoard.querySelectorAll('.cell');
        cells.forEach(cell => {
            const x = parseInt(cell.dataset.x);
            const y = parseInt(cell.dataset.y);

            cell.className = 'cell';
            cell.textContent = '';

            if (this.board[y][x]) {
                cell.className = 'cell filled';
                cell.textContent = this.CELL_CONTENT;
            }
        });

        // Renderizar pieza fantasma
        if (this.currentPiece && !this.isPaused && this.showGhostPieces) {
            const ghostY = this.calculateGhostPosition();
            if (ghostY !== this.currentY && ghostY >= 0) {
                for (let py = 0; py < this.currentPiece.shape.length; py++) {
                    for (let px = 0; px < this.currentPiece.shape[py].length; px++) {
                        if (this.currentPiece.shape[py][px]) {
                            const x = this.currentX + px;
                            const y = ghostY + py;

                            if (y >= 0 && y < this.BOARD_HEIGHT && x >= 0 && x < this.BOARD_WIDTH) {
                                const cell = this.gameBoard.querySelector(`[data-x="${x}"][data-y="${y}"]`);
                                if (cell && !this.board[y][x]) {
                                    cell.className = 'cell ghost';
                                    cell.textContent = this.CELL_CONTENT;
                                }
                            }
                        }
                    }
                }
            }
        }

        // Renderizar pieza actual
        if (this.currentPiece && !this.isPaused) {
            for (let py = 0; py < this.currentPiece.shape.length; py++) {
                for (let px = 0; px < this.currentPiece.shape[py].length; px++) {
                    if (this.currentPiece.shape[py][px]) {
                        const x = this.currentX + px;
                        const y = this.currentY + py;

                        if (y >= 0 && y < this.BOARD_HEIGHT && x >= 0 && x < this.BOARD_WIDTH) {
                            const cell = this.gameBoard.querySelector(`[data-x="${x}"][data-y="${y}"]`);
                            if (cell) {
                                cell.className = 'cell active';
                                cell.textContent = this.CELL_CONTENT;
                            }
                        }
                    }
                }
            }
        }
    }

    updateNextPiecesDisplay() {
        // Limpiar contenido previo
        this.nextPiecesContainer.innerHTML = '';

        // Mostrar todas las piezas siguientes en el mismo espacio
        for (let i = 0; i < this.nextPiecesCount && i < this.nextPieces.length; i++) {
            const piece = this.nextPieces[i];

            // Crear grupo para cada pieza
            const pieceGroup = document.createElement('div');
            pieceGroup.className = 'next-piece-group';

            // Crear la representación visual de la pieza
            for (let py = 0; py < piece.shape.length; py++) {
                const row = document.createElement('div');
                row.className = 'next-piece-row';

                for (let px = 0; px < piece.shape[py].length; px++) {
                    if (piece.shape[py][px]) {
                        const block = document.createElement('div');
                        block.className = 'next-piece-block';
                        row.appendChild(block);
                    } else {
                        // Espacio vacío para mantener la forma
                        const emptySpace = document.createElement('div');
                        emptySpace.style.width = i === 0 ? '12px' : '8px';
                        emptySpace.style.height = i === 0 ? '12px' : '8px';
                        emptySpace.style.margin = i === 0 ? '1px' : '0px';
                        row.appendChild(emptySpace);
                    }
                }

                pieceGroup.appendChild(row);
            }

            this.nextPiecesContainer.appendChild(pieceGroup);
        }
    } updateHoldPieceDisplay() {
        if (!this.holdPieceDisplay) return;

        const holdCells = this.holdPieceDisplay.querySelectorAll('.hold-cell');
        holdCells.forEach(cell => {
            cell.className = 'hold-cell';
            cell.textContent = '';
        });

        if (this.holdPiece) {
            for (let py = 0; py < this.holdPiece.shape.length; py++) {
                for (let px = 0; px < this.holdPiece.shape[py].length; px++) {
                    if (this.holdPiece.shape[py][px]) {
                        const cell = this.holdPieceDisplay.querySelector(`[data-x="${px}"][data-y="${py}"]`);
                        if (cell) {
                            cell.className = 'hold-cell filled';
                            cell.textContent = ' ';
                        }
                    }
                }
            }
        }
    }

    updateDisplay() {
        this.scoreDisplay.textContent = this.score.toString().padStart(6, '0');
        this.linesDisplay.textContent = this.lines.toString().padStart(3, '0');
        this.levelDisplay.textContent = this.level.toString().padStart(2, '0');

        if (!this.gameRunning) {
            this.statusDisplay.textContent = "PRESIONA 'R' PARA INICIAR";
            this.statusDisplay.className = 'status-message';
        } else if (this.isPaused) {
            this.statusDisplay.textContent = "JUEGO PAUSADO - PRESIONA 'P'";
            this.statusDisplay.className = 'status-message paused';
        } else {
            this.statusDisplay.textContent = "JUGANDO...";
            this.statusDisplay.className = 'status-message playing';
        }
    }

    gameOver() {
        this.gameRunning = false;
        this.statusDisplay.textContent = "GAME OVER - PRESIONA 'R' PARA REINICIAR";
        this.statusDisplay.className = 'status-message game-over';
    }
}

// Inicializar el juego cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    const game = new Tetris();
});
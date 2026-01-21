class SeaBattle {
    constructor() {
        this.boardSize = 10;
        this.ships = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1];
        this.playerBoard = this.createEmptyBoard();
        this.computerBoard = this.createEmptyBoard();
        this.playerShips = [];
        this.computerShips = [];
        this.currentShip = null;
        this.isHorizontal = true;
        this.gameStarted = false;
        this.playerTurn = true;
        this.shots = { player: 0, computer: 0 };
        this.hits = { player: 0, computer: 0 };
        
        this.init();
    }

    init() {
        this.createBoards();
        this.setupEventListeners();
        this.updateShipSelection();
        this.updateGameInfo();
        this.generateComputerShips();
        this.logMessage('Игра началась! Расставьте ваши корабли.', 'info');
    }

    createEmptyBoard() {
        return Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(0));
    }

    createBoards() {
        const playerBoard = document.getElementById('player-board');
        const computerBoard = document.getElementById('computer-board');
        
        playerBoard.innerHTML = '';
        computerBoard.innerHTML = '';

        for (let y = 0; y < this.boardSize; y++) {
            for (let x = 0; x < this.boardSize; x++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.x = x;
                cell.dataset.y = y;
                
                // Player board events
                const playerCell = cell.cloneNode(true);
                playerCell.addEventListener('click', () => this.handlePlayerBoardClick(x, y));
                playerCell.addEventListener('mouseover', () => this.handlePlayerBoardHover(x, y));
                playerBoard.appendChild(playerCell);

                // Computer board events
                const computerCell = cell.cloneNode(true);
                computerCell.addEventListener('click', () => this.handleComputerBoardClick(x, y));
                computerBoard.appendChild(computerCell);
            }
        }
        
        this.updateBoardDisplay();
    }

    updateBoardDisplay() {
        const playerCells = document.querySelectorAll('#player-board .cell');
        const computerCells = document.querySelectorAll('#computer-board .cell');

        // Update player board
        for (let y = 0; y < this.boardSize; y++) {
            for (let x = 0; x < this.boardSize; x++) {
                const cell = playerCells[y * this.boardSize + x];
                cell.className = 'cell';
                
                if (this.playerBoard[y][x] === 1) {
                    cell.classList.add('ship');
                } else if (this.playerBoard[y][x] === 2) {
                    cell.classList.add('hit');
                } else if (this.playerBoard[y][x] === 3) {
                    cell.classList.add('miss');
                }
            }
        }

        // Update computer board (hide ships)
        for (let y = 0; y < this.boardSize; y++) {
            for (let x = 0; x < this.boardSize; x++) {
                const cell = computerCells[y * this.boardSize + x];
                cell.className = 'cell';
                
                if (this.computerBoard[y][x] === 2) {
                    cell.classList.add('hit');
                } else if (this.computerBoard[y][x] === 3) {
                    cell.classList.add('miss');
                }
            }
        }
    }

    handlePlayerBoardClick(x, y) {
        if (this.gameStarted) return;
        
        if (this.currentShip && this.canPlaceShip(x, y, this.currentShip, this.isHorizontal)) {
            this.placeShip(x, y, this.currentShip, this.isHorizontal, true);
            this.updateShipSelection();
            this.updateBoardDisplay();
            
            if (this.playerShips.length === this.ships.length) {
                document.getElementById('start-btn').disabled = false;
                this.logMessage('Все корабли расставлены! Нажмите "Начать игру"', 'info');
            }
}
    }

    handlePlayerBoardHover(x, y) {
        if (this.gameStarted || !this.currentShip) return;
        
        const cells = document.querySelectorAll('#player-board .cell');
        cells.forEach(cell => cell.classList.remove('preview'));
        
        if (this.canPlaceShip(x, y, this.currentShip, this.isHorizontal)) {
            const positions = this.getShipPositions(x, y, this.currentShip, this.isHorizontal);
            positions.forEach(([posX, posY]) => {
                const cell = document.querySelector(`#player-board .cell[data-x="${posX}"][data-y="${posY}"]`);
                if (cell) cell.classList.add('preview');
            });
        }
    }

    handleComputerBoardClick(x, y) {
        if (!this.gameStarted  !this.playerTurn  this.computerBoard[y][x] > 1) return;

        this.shots.player++;
        document.getElementById('player-shots').textContent = this.shots.player;
        
        if (this.computerBoard[y][x] === 1) {
            this.computerBoard[y][x] = 2;
            this.hits.player++;
            this.logMessage(`Вы попали в корабль противника! (${x}, ${y})`, 'player');
            
            if (this.isShipSunk(x, y, false)) {
                this.logMessage('Вы потопили корабль противника!', 'player');
            }
            
            if (this.checkWin(true)) {
                return;
            }
        } else {
            this.computerBoard[y][x] = 3;
            this.logMessage(`Вы промахнулись. (${x}, ${y})`, 'player');
            this.playerTurn = false;
            this.updateGameInfo();
            setTimeout(() => this.computerMove(), 1000);
        }
        
        this.updateBoardDisplay();
        this.updateHits();
    }

    computerMove() {
        if (!this.gameStarted || this.playerTurn) return;

        this.shots.computer++;
        document.getElementById('computer-shots').textContent = this.shots.computer;
        
        // Простой ИИ: сначала ищет раненые клетки
        let x, y;
        const hitCells = this.findAdjacentHitCells();
        
        if (hitCells.length > 0) {
            [x, y] = hitCells[0];
        } else {
            do {
                x = Math.floor(Math.random() * this.boardSize);
                y = Math.floor(Math.random() * this.boardSize);
            } while (this.playerBoard[y][x] > 1);
        }

        if (this.playerBoard[y][x] === 1) {
            this.playerBoard[y][x] = 2;
            this.hits.computer++;
            this.logMessage(`Противник попал в ваш корабль! (${x}, ${y})`, 'computer');
            
            if (this.isShipSunk(x, y, true)) {
                this.logMessage('Противник потопил ваш корабль!', 'computer');
            }
            
            if (this.checkWin(false)) {
                return;
            }
            
            // Компьютер продолжает ход при попадании
            setTimeout(() => this.computerMove(), 1500);
        } else {
            this.playerBoard[y][x] = 3;
            this.logMessage(`Противник промахнулся. (${x}, ${y})`, 'computer');
            this.playerTurn = true;
        }
        
        this.updateBoardDisplay();
        this.updateGameInfo();
        this.updateHits();
    }

    findAdjacentHitCells() {
        const cells = [];
        for (let y = 0; y < this.boardSize; y++) {
            for (let x = 0; x < this.boardSize; x++) {
                if (this.playerBoard[y][x] === 2) {
                    // Проверяем соседние клетки
                    const neighbors = [
                        [x-1, y], [x+1, y], [x, y-1], [x, y+1]
                    ];
                    
                    for (const [nx, ny] of neighbors) {
                        if (nx >= 0 && nx < this.boardSize && ny >= 0 && ny < this.boardSize) {
                            if (this.playerBoard[ny][nx] < 2) {
                                cells.push([nx, ny]);
                            }
                        }
                    }
                }
            }
        }
        return cells;
    }
canPlaceShip(x, y, size, horizontal) {
        const positions = this.getShipPositions(x, y, size, horizontal);
        
        for (const [posX, posY] of positions) {
            if (posX < 0  posX >= this.boardSize  posY < 0 || posY >= this.boardSize) {
                return false;
            }
            
            // Проверка на соприкосновение с другими кораблями
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const checkX = posX + dx;
                    const checkY = posY + dy;
                    
                    if (checkX >= 0 && checkX < this.boardSize && 
                        checkY >= 0 && checkY < this.boardSize) {
                        if (this.playerBoard[checkY][checkX] === 1) {
                            return false;
                        }
                    }
                }
            }
        }
        
        return true;
    }

    placeShip(x, y, size, horizontal, isPlayer = false) {
        const positions = this.getShipPositions(x, y, size, horizontal);
        const ship = [];
        
        for (const [posX, posY] of positions) {
            if (isPlayer) {
                this.playerBoard[posY][posX] = 1;
            } else {
                this.computerBoard[posY][posX] = 1;
            }
            ship.push([posX, posY]);
        }
        
        if (isPlayer) {
            this.playerShips.push({ positions: ship, hits: Array(size).fill(false) });
        } else {
            this.computerShips.push({ positions: ship, hits: Array(size).fill(false) });
        }
    }

    getShipPositions(x, y, size, horizontal) {
        const positions = [];
        for (let i = 0; i < size; i++) {
            positions.push(horizontal ? [x + i, y] : [x, y + i]);
        }
        return positions;
    }

    isShipSunk(x, y, isPlayer) {
        const ships = isPlayer ? this.playerShips : this.computerShips;
        const board = isPlayer ? this.playerBoard : this.computerBoard;
        
        for (const ship of ships) {
            for (let i = 0; i < ship.positions.length; i++) {
                const [shipX, shipY] = ship.positions[i];
                if (shipX === x && shipY === y) {
                    ship.hits[i] = true;
                    
                    if (ship.hits.every(hit => hit)) {
                        return true;
                    }
                    return false;
                }
            }
        }
        return false;
    }

    checkWin(isPlayer) {
        const ships = isPlayer ? this.computerShips : this.playerShips;
        const allSunk = ships.every(ship => ship.hits.every(hit => hit));
        
        if (allSunk) {
            this.gameStarted = false;
            const winner = isPlayer ? 'Игрок' : 'Компьютер';
            this.logMessage(`${winner} победил! Игра окончена.`, 'info');
            document.getElementById('status').textContent = Победил: ${winner};
            return true;
        }
        return false;
    }

    generateComputerShips() {
        for (const size of this.ships) {
            let placed = false;
            while (!placed) {
                const x = Math.floor(Math.random() * this.boardSize);
                const y = Math.floor(Math.random() * this.boardSize);
                const horizontal = Math.random() < 0.5;
                
                if (this.canPlaceShip(x, y, size, horizontal)) {
                    this.placeShip(x, y, size, horizontal, false);
                    placed = true;
                }
            }
        }
    }

    updateShipSelection() {
        const placedShips = this.playerShips.length;
        const shipsToPlace = this.ships.slice(placedShips);
        
        document.querySelectorAll('.ship-item').forEach(item => {
            const size = parseInt(item.dataset.size);
            const count = shipsToPlace.filter(s => s === size).length;
            item.textContent = ${size}-палубный (${count} шт);
            
            if (count === 0) {
                item.style.
display = 'none';
            } else {
                item.style.display = 'block';
                item.classList.remove('selected');
            }
        });
        
        // Выбираем первый доступный корабль
        if (shipsToPlace.length > 0 && !this.currentShip) {
            this.currentShip = shipsToPlace[0];
            document.querySelector(`.ship-item[data-size="${this.currentShip}"]`)?.classList.add('selected');
        }
    }

    updateGameInfo() {
        document.getElementById('turn').textContent = this.playerTurn ? 'Игрок' : 'Компьютер';
        document.getElementById('turn').style.color = this.playerTurn ? '#26d0ce' : '#ff6b6b';
        
        if (!this.gameStarted) {
            document.getElementById('status').textContent = 'Расставьте корабли';
        } else {
            document.getElementById('status').textContent = this.playerTurn ? 'Ваш ход' : 'Ход противника';
        }
    }

    updateHits() {
        document.getElementById('hits').textContent = this.hits.player;
    }

    logMessage(message, type) {
        const log = document.getElementById('log');
        const entry = document.createElement('div');
        entry.className = log-entry log-${type};
        entry.textContent = [${new Date().toLocaleTimeString()}] ${message};
        log.appendChild(entry);
        log.scrollTop = log.scrollHeight;
    }

    setupEventListeners() {
        // Выбор корабля
        document.querySelectorAll('.ship-item').forEach(item => {
            item.addEventListener('click', () => {
                const size = parseInt(item.dataset.size);
                if (this.ships.slice(this.playerShips.length).includes(size)) {
                    document.querySelectorAll('.ship-item').forEach(i => i.classList.remove('selected'));
                    item.classList.add('selected');
                    this.currentShip = size;
                }
            });
        });

        // Поворот корабля
        document.getElementById('rotate-btn').addEventListener('click', () => {
            this.isHorizontal = !this.isHorizontal;
            this.logMessage(`Корабль повёрнут: ${this.isHorizontal ? 'горизонтально' : 'вертикально'}`, 'info');
        });

        // Случайная расстановка
        document.getElementById('random-btn').addEventListener('click', () => {
            this.resetGame();
            this.generateComputerShips();
            
            // Случайная расстановка для игрока
            for (const size of this.ships) {
                let placed = false;
                while (!placed) {
                    const x = Math.floor(Math.random() * this.boardSize);
                    const y = Math.floor(Math.random() * this.boardSize);
                    const horizontal = Math.random() < 0.5;
                    
                    if (this.canPlaceShip(x, y, size, horizontal)) {
                        this.placeShip(x, y, size, horizontal, true);
                        placed = true;
                    }
                }
            }
            
            this.updateBoardDisplay();
            this.updateShipSelection();
            document.getElementById('start-btn').disabled = false;
            this.logMessage('Корабли расставлены случайным образом!', 'info');
        });

        // Начать игру
        document.getElementById('start-btn').addEventListener('click', () => {
            if (this.playerShips.length === this.ships.length) {
                this.gameStarted = true;
                this.playerTurn = true;
                document.getElementById('start-btn').disabled = true;
                document.getElementById('rotate-btn').disabled = true;
                document.querySelectorAll('.ship-item').forEach(item => item.style.display = 'none');
                this.logMessage('Игра началась! Ваш ход.', 'info');
                this.updateGameInfo();
            }
        });

        // Новая игра
        document.getElementById('new-game-btn').addEventListener('click', () => {
            this.resetGame();
            this.
logMessage('Новая игра началась! Расставьте ваши корабли.', 'info');
        });

        // Правила
        const modal = document.getElementById('instructions-modal');
        const btn = document.getElementById('instructions-btn');
        const span = document.getElementsByClassName('close')[0];

        btn.onclick = () => modal.style.display = 'block';
        span.onclick = () => modal.style.display = 'none';
        window.onclick = (event) => {
            if (event.target == modal) modal.style.display = 'none';
        };
    }

    resetGame() {
        this.playerBoard = this.createEmptyBoard();
        this.computerBoard = this.createEmptyBoard();
        this.playerShips = [];
        this.computerShips = [];
        this.currentShip = null;
        this.isHorizontal = true;
        this.gameStarted = false;
        this.playerTurn = true;
        this.shots = { player: 0, computer: 0 };
        this.hits = { player: 0, computer: 0 };
        
        this.createBoards();
        this.updateShipSelection();
        this.updateGameInfo();
        this.updateHits();
        
        document.getElementById('player-shots').textContent = '0';
        document.getElementById('computer-shots').textContent = '0';
        document.getElementById('start-btn').disabled = true;
        document.getElementById('rotate-btn').disabled = false;
        
        const log = document.getElementById('log');
        log.innerHTML = '';
    }
}

// Инициализация игры при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    const game = new SeaBattle();
    window.seaBattle = game; // Для отладки в консоли
});

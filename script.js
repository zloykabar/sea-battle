// Убедитесь что DOM полностью загружен
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM загружен, начинаем игру...');
    
    const game = new SeaBattle();
    window.game = game;
});

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
        this.selectedShipElement = null;
        
        // Имена игроков
        this.playerName = "Капитан";
        this.computerName = "Компьютер";
        
        this.init();
    }

    createEmptyBoard() {
        return Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(0));
    }

    init() {
        try {
            this.createBoards();
            this.setupEventListeners();
            this.updateShipSelection();
            this.updateGameInfo();
            this.generateComputerShips();
            this.logMessage(`Добро пожаловать, ${this.playerName}! Расставьте ваши корабли.`, 'info');
            
            // Обновляем имена в интерфейсе
            this.updatePlayerNames();
            
            setTimeout(() => {
                const firstShip = document.querySelector('.ship-item');
                if (firstShip) {
                    firstShip.click();
                }
            }, 100);
        } catch (error) {
            console.error('Ошибка при инициализации:', error);
            this.logMessage('Ошибка загрузки игры. Перезагрузите страницу.', 'info');
        }
    }

    // Обновляем отображение имен
    updatePlayerNames() {
        document.querySelector('.player-section h2').innerHTML = 
            `<i class="fas fa-user"></i> ${this.playerName}`;
        document.querySelector('.computer-section h2').innerHTML = 
            `<i class="fas fa-robot"></i> ${this.computerName}`;
    }

    createBoards() {
        const playerBoard = document.getElementById('player-board');
        const computerBoard = document.getElementById('computer-board');
        
        playerBoard.innerHTML = '';
        computerBoard.innerHTML = '';

        for (let y = 0; y < this.boardSize; y++) {
            for (let x = 0; x < this.boardSize; x++) {
                const playerCell = document.createElement('div');
                playerCell.className = 'cell';
                playerCell.dataset.x = x;
                playerCell.dataset.y = y;
                playerCell.addEventListener('click', () => this.handlePlayerBoardClick(x, y));
                playerCell.addEventListener('mouseover', () => this.handlePlayerBoardHover(x, y));
                playerBoard.appendChild(playerCell);

                const computerCell = document.createElement('div');
                computerCell.className = 'cell';
                computerCell.dataset.x = x;
                computerCell.dataset.y = y;
                computerCell.addEventListener('click', () => this.handleComputerBoardClick(x, y));
                computerBoard.appendChild(computerCell);
            }
        }
        this.updateBoardDisplay();
    }

    canPlaceShip(startX, startY, size, horizontal, isPlayer = true) {
        for (let i = 0; i < size; i++) {
            const x = horizontal ? startX + i : startX;
            const y = horizontal ? startY : startY + i;
            
            if (x < 0 || x >= this.boardSize || y < 0 || y >= this.boardSize) {
                return false;
            }
            
            const board = isPlayer ? this.playerBoard : this.computerBoard;
            
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const checkX = x + dx;
                    const checkY = y + dy;
                    
                    if (checkX >= 0 && checkX < this.boardSize && 
                        checkY >= 0 && checkY < this.boardSize) {
                        if (board[checkY][checkX] === 1) {
                            return false;
                        }
                    }
                }
            }
        }
        return true;
    }

    handlePlayerBoardClick(x, y) {
        if (this.gameStarted) return;
        
        if (this.currentShip && this.canPlaceShip(x, y, this.currentShip, this.isHorizontal, true)) {
            this.placeShip(x, y, this.currentShip, this.isHorizontal, true);
            this.updateShipSelection();
            this.updateBoardDisplay();
            
            document.querySelectorAll('#player-board .cell.preview').forEach(cell => {
                cell.classList.remove('preview');
                cell.style.backgroundColor = '';
            });
            
            if (this.playerShips.length === this.ships.length) {
                document.getElementById('start-btn').disabled = false;
                this.logMessage('Все корабли расставлены! Нажмите "Начать игру"', 'info');
            }
        } else if (this.currentShip) {
            this.logMessage('Нельзя ставить корабли впритык!', 'info');
        }
    }

    handlePlayerBoardHover(x, y) {
        if (this.gameStarted || !this.currentShip) return;
        
        document.querySelectorAll('#player-board .cell.preview').forEach(cell => {
            cell.classList.remove('preview');
            cell.style.backgroundColor = '';
        });
        
        if (this.canPlaceShip(x, y, this.currentShip, this.isHorizontal, true)) {
            const positions = this.getShipPositions(x, y, this.currentShip, this.isHorizontal);
            positions.forEach(([posX, posY]) => {
                const cell = document.querySelector(`#player-board .cell[data-x="${posX}"][data-y="${posY}"]`);
                if (cell) {
                    cell.classList.add('preview');
                    cell.style.backgroundColor = '#666';
                }
            });
        }
    }

    handleComputerBoardClick(x, y) {
        if (!this.gameStarted || !this.playerTurn || this.computerBoard[y][x] > 1) return;

        this.shots.player++;
        document.getElementById('player-shots').textContent = this.shots.player;
        
        if (this.computerBoard[y][x] === 1) {
            this.computerBoard[y][x] = 2;
            this.hits.player++;
            this.logMessage(`${this.playerName} попал в корабль ${this.computerName.toLowerCase()}! (${x + 1}, ${y + 1})`, 'player');
            
            const shipSunk = this.isShipSunk(x, y, false);
            if (shipSunk) {
                this.logMessage(`${this.playerName} потопил корабль ${this.computerName.toLowerCase()}!`, 'player');
            }
            
            if (this.checkWin(true)) {
                return;
            }
        } else {
            this.computerBoard[y][x] = 3;
            this.logMessage(`${this.playerName} промахнулся. (${x + 1}, ${y + 1})`, 'player');
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
            this.logMessage(`${this.computerName} попал в корабль ${this.playerName.toLowerCase()}! (${x + 1}, ${y + 1})`, 'computer');
            
            const shipSunk = this.isShipSunk(x, y, true);
            if (shipSunk) {
                this.logMessage(`${this.computerName} потопил корабль ${this.playerName.toLowerCase()}!`, 'computer');
            }
            
            if (this.checkWin(false)) {
                return;
            }
            
            setTimeout(() => this.computerMove(), 1500);
        } else {
            this.playerBoard[y][x] = 3;
            this.logMessage(`${this.computerName} промахнулся. (${x + 1}, ${y + 1})`, 'computer');
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
                    const neighbors = [[x-1, y], [x+1, y], [x, y-1], [x, y+1]];
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

    placeShip(startX, startY, size, horizontal, isPlayer) {
        const positions = [];
        const hits = [];
        
        for (let i = 0; i < size; i++) {
            const x = horizontal ? startX + i : startX;
            const y = horizontal ? startY : startY + i;
            
            if (isPlayer) {
                this.playerBoard[y][x] = 1;
            } else {
                this.computerBoard[y][x] = 1;
            }
            
            positions.push([x, y]);
            hits.push(false);
        }
        
        const ship = {
            positions: positions,
            hits: hits,
            size: size,
            sunk: false
        };
        
        if (isPlayer) {
            this.playerShips.push(ship);
        } else {
            this.computerShips.push(ship);
        }
    }

    getShipPositions(startX, startY, size, horizontal) {
        const positions = [];
        for (let i = 0; i < size; i++) {
            positions.push(horizontal ? [startX + i, startY] : [startX, startY + i]);
        }
        return positions;
    }

    isShipSunk(x, y, isPlayer) {
        const ships = isPlayer ? this.playerShips : this.computerShips;
        const board = isPlayer ? this.playerBoard : this.computerBoard;
        
        for (const ship of ships) {
            let cellIndex = -1;
            for (let i = 0; i < ship.positions.length; i++) {
                const [shipX, shipY] = ship.positions[i];
                if (shipX === x && shipY === y) {
                    cellIndex = i;
                    break;
                }
            }
            
            if (cellIndex !== -1) {
                ship.hits[cellIndex] = true;
                
                const allHit = ship.hits.every(hit => hit === true);
                
                if (allHit && !ship.sunk) {
                    ship.sunk = true;
                    this.markAroundSunkShip(ship, isPlayer);
                    return true;
                }
                return false;
            }
        }
        return false;
    }

    markAroundSunkShip(ship, isPlayer) {
        const board = isPlayer ? this.playerBoard : this.computerBoard;
        
        for (const [shipX, shipY] of ship.positions) {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const x = shipX + dx;
                    const y = shipY + dy;
                    
                    if (x >= 0 && x < this.boardSize && y >= 0 && y < this.boardSize) {
                        if (board[y][x] === 0) {
                            board[y][x] = 3;
                        }
                    }
                }
            }
        }
        
        this.updateBoardDisplay();
    }

    checkWin(isPlayer) {
        const ships = isPlayer ? this.computerShips : this.playerShips;
        
        const allSunk = ships.every(ship => {
            return ship.hits.every(hit => hit === true);
        });
        
        if (allSunk) {
            this.gameStarted = false;
            const winner = isPlayer ? this.playerName : this.computerName;
            const loser = isPlayer ? this.computerName : this.playerName;
            
            // Показываем окно с результатом
            this.showGameResult(isPlayer, winner, loser);
            
            // Показываем все корабли компьютера при победе игрока
            if (isPlayer) {
                this.revealComputerShips();
            }
            
            this.logMessage(`🎉 ${winner} победил! 🎉`, 'info');
            this.logMessage('Игра окончена. Нажмите "Новая игра".', 'info');
            
            document.getElementById('status').textContent = `Победил: ${winner}`;
            document.getElementById('start-btn').disabled = true;
            
            return true;
        }
        return false;
    }

    // НОВЫЙ метод: Показывает окно с результатом игры
    showGameResult(isPlayerWon, winner, loser) {
        const modal = document.getElementById('game-result-modal');
        const resultTitle = document.getElementById('result-title');
        const resultMessage = document.getElementById('result-message');
        
        if (!modal || !resultTitle || !resultMessage) return;
        
        // Обновляем статистику
        document.getElementById('result-player-shots').textContent = this.shots.player;
        document.getElementById('result-computer-shots').textContent = this.shots.computer;
        document.getElementById('result-player-hits').textContent = this.hits.player;
        document.getElementById('result-computer-hits').textContent = this.hits.computer;
        
        // Устанавливаем заголовок и сообщение
        if (isPlayerWon) {
            resultTitle.innerHTML = '<i class="fas fa-trophy"></i> Победа!';
            resultMessage.innerHTML = `
                <h3>🎉 Поздравляем, ${winner}!</h3>
                <p>Вы одержали победу над ${loser}!</p>
                <p><i class="fas fa-star"></i> Вы потопили все корабли противника!</p>
            `;
            resultMessage.className = 'win-message victory-animation';
        } else {
            resultTitle.innerHTML = '<i class="fas fa-skull-crossbones"></i> Поражение';
            resultMessage.innerHTML = `
                <h3>😔 ${winner} победил!</h3>
                <p>${loser}, ваши корабли потоплены...</p>
                <p><i class="fas fa-ship"></i> Попробуйте сыграть еще раз!</p>
            `;
            resultMessage.className = 'lose-message defeat-animation';
        }
        
        // Показываем модальное окно
        modal.style.display = 'block';
        
        // Добавляем обработчики для кнопок в окне результата
        this.setupResultModalListeners();
    }

    // НОВЫЙ метод: Настройка обработчиков для окна результата
    setupResultModalListeners() {
        const modal = document.getElementById('game-result-modal');
        const playAgainBtn = document.getElementById('play-again-btn');
        const closeBtn = document.getElementById('close-result-btn');
        
        if (playAgainBtn) {
            playAgainBtn.addEventListener('click', () => {
                modal.style.display = 'none';
                this.resetGame();
            });
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }
        
        // Закрытие по клику вне окна
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    revealComputerShips() {
        const computerCells = document.querySelectorAll('#computer-board .cell');
        for (let y = 0; y < this.boardSize; y++) {
            for (let x = 0; x < this.boardSize; x++) {
                if (this.computerBoard[y][x] === 1) {
                    const cellIndex = y * this.boardSize + x;
                    const cell = computerCells[cellIndex];
                    if (cell) {
                        cell.classList.add('ship');
                    }
                }
            }
        }
    }

    generateComputerShips() {
        console.log('Генерация кораблей компьютера...');
        
        this.computerShips = [];
        for (let y = 0; y < this.boardSize; y++) {
            for (let x = 0; x < this.boardSize; x++) {
                this.computerBoard[y][x] = 0;
            }
        }
        
        for (const size of this.ships) {
            let placed = false;
            let attempts = 0;
            const maxAttempts = 100;
            
            while (!placed && attempts < maxAttempts) {
                const x = Math.floor(Math.random() * this.boardSize);
                const y = Math.floor(Math.random() * this.boardSize);
                const horizontal = Math.random() < 0.5;
                
                if (this.canPlaceShip(x, y, size, horizontal, false)) {
                    this.placeShip(x, y, size, horizontal, false);
                    placed = true;
                }
                attempts++;
            }
            
            if (!placed) {
                console.error(`Не удалось разместить корабль размером ${size}`);
            }
        }
        console.log('Корабли компьютера расставлены');
    }

    updateShipSelection() {
        const placedShips = this.playerShips.length;
        const shipsToPlace = this.ships.slice(placedShips);
        
        document.querySelectorAll('.ship-item').forEach(item => {
            const size = parseInt(item.dataset.size);
            const count = shipsToPlace.filter(s => s === size).length;
            if (count > 0) {
                item.textContent = `${size}-палубный (${count} шт)`;
                item.style.display = 'block';
                item.classList.remove('selected');
            } else {
                item.style.display = 'none';
            }
        });
        
        if (shipsToPlace.length > 0) {
            this.currentShip = shipsToPlace[0];
            const firstAvailable = document.querySelector(`.ship-item[data-size="${this.currentShip}"]`);
            if (firstAvailable) {
                firstAvailable.classList.add('selected');
                this.selectedShipElement = firstAvailable;
            }
        } else {
            this.currentShip = null;
        }
    }

    updateBoardDisplay() {
        const playerCells = document.querySelectorAll('#player-board .cell');
        const computerCells = document.querySelectorAll('#computer-board .cell');
        
        for (let y = 0; y < this.boardSize; y++) {
            for (let x = 0; x < this.boardSize; x++) {
                const cellIndex = y * this.boardSize + x;
                const playerCell = playerCells[cellIndex];
                const computerCell = computerCells[cellIndex];
                
                if (playerCell) {
                    playerCell.className = 'cell';
                    playerCell.style.backgroundColor = '';
                    
                    if (this.playerBoard[y][x] === 1) {
                        playerCell.classList.add('ship');
                    } else if (this.playerBoard[y][x] === 2) {
                        playerCell.classList.add('hit');
                    } else if (this.playerBoard[y][x] === 3) {
                        playerCell.classList.add('miss');
                    }
                }
                
                if (computerCell) {
                    computerCell.className = 'cell';
                    computerCell.style.backgroundColor = '';
                    
                    if (this.computerBoard[y][x] === 2) {
                        computerCell.classList.add('hit');
                    } else if (this.computerBoard[y][x] === 3) {
                        computerCell.classList.add('miss');
                    }
                }
            }
        }
    }

    updateGameInfo() {
        const turnElement = document.getElementById('turn');
        const statusElement = document.getElementById('status');
        
        if (turnElement) {
            turnElement.textContent = this.playerTurn ? this.playerName : this.computerName;
            turnElement.style.color = this.playerTurn ? '#26d0ce' : '#ff6b6b';
        }
        
        if (statusElement) {
            if (!this.gameStarted) {
                statusElement.textContent = 'Расставьте корабли';
            } else {
                statusElement.textContent = this.playerTurn ? 
                    `Ход: ${this.playerName}` : 
                    `Ход: ${this.computerName}`;
            }
        }
    }

    updateHits() {
        const hitsElement = document.getElementById('hits');
        if (hitsElement) {
            hitsElement.textContent = this.hits.player;
        }
    }

    logMessage(message, type) {
        const log = document.getElementById('log');
        if (!log) {
            console.log(`[${type}] ${message}`);
            return;
        }
        
        const entry = document.createElement('div');
        entry.className = `log-entry log-${type}`;
        entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        log.appendChild(entry);
        
        log.scrollTop = log.scrollHeight;
    }

    setupEventListeners() {
        document.querySelectorAll('.ship-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const size = parseInt(e.target.dataset.size);
                const shipsToPlace = this.ships.slice(this.playerShips.length);
                
                if (shipsToPlace.includes(size)) {
                    if (this.selectedShipElement) {
                        this.selectedShipElement.classList.remove('selected');
                    }
                    
                    e.target.classList.add('selected');
                    this.selectedShipElement = e.target;
                    this.currentShip = size;
                    
                    this.logMessage(`Выбран ${size}-палубный корабль`, 'info');
                }
            });
        });

        const rotateBtn = document.getElementById('rotate-btn');
        if (rotateBtn) {
            rotateBtn.addEventListener('click', () => {
                this.isHorizontal = !this.isHorizontal;
                this.logMessage(`Корабль повёрнут: ${this.isHorizontal ? 'горизонтально' : 'вертикально'}`, 'info');
                
                document.querySelectorAll('#player-board .cell.preview').forEach(cell => {
                    cell.classList.remove('preview');
                    cell.style.backgroundColor = '';
                });
            });
        }

        const randomBtn = document.getElementById('random-btn');
        if (randomBtn) {
            randomBtn.addEventListener('click', () => {
                this.resetGame();
                
                for (const size of this.ships) {
                    let placed = false;
                    let attempts = 0;
                    
                    while (!placed && attempts < 100) {
                        const x = Math.floor(Math.random() * this.boardSize);
                        const y = Math.floor(Math.random() * this.boardSize);
                        const horizontal = Math.random() < 0.5;
                        
                        if (this.canPlaceShip(x, y, size, horizontal, true)) {
                            this.placeShip(x, y, size, horizontal, true);
                            placed = true;
                        }
                        attempts++;
                    }
                }
                
                this.updateBoardDisplay();
                this.updateShipSelection();
                document.getElementById('start-btn').disabled = false;
                this.logMessage('Корабли расставлены случайным образом!', 'info');
            });
        }

        const startBtn = document.getElementById('start-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                if (this.playerShips.length === this.ships.length) {
                    this.gameStarted = true;
                    this.playerTurn = true;
                    startBtn.disabled = true;
                    document.getElementById('rotate-btn').disabled = true;
                    this.logMessage(`Игра началась! Первый ход за ${this.playerName}.`, 'info');
                    this.updateGameInfo();
                    
                    document.querySelector('.ships-to-place').style.display = 'none';
                }
            });
        }

        const newGameBtn = document.getElementById('new-game-btn');
        if (newGameBtn) {
            newGameBtn.addEventListener('click', () => {
                this.resetGame();
            });
        }

        const instructionsBtn = document.getElementById('instructions-btn');
        const modal = document.getElementById('instructions-modal');
        const closeBtn = document.querySelector('.close');
        
        if (instructionsBtn && modal && closeBtn) {
            instructionsBtn.addEventListener('click', () => {
                modal.style.display = 'block';
            });
            
            closeBtn.addEventListener('click', () => {
                modal.style.display = 'none';
            });
            
            window.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }
        
        // Инициализируем обработчики для окна результата
        this.setupResultModalListeners();
    }

    resetGame() {
        // Скрываем окно результата, если оно открыто
        const resultModal = document.getElementById('game-result-modal');
        if (resultModal) {
            resultModal.style.display = 'none';
        }
        
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
        this.selectedShipElement = null;
        
        this.createBoards();
        this.updateShipSelection();
        this.updateGameInfo();
        this.updateHits();
        
        document.getElementById('player-shots').textContent = '0';
        document.getElementById('computer-shots').textContent = '0';
        
        document.getElementById('start-btn').disabled = true;
        document.getElementById('rotate-btn').disabled = false;
        
        document.querySelector('.ships-to-place').style.display = 'block';
        
        const log = document.getElementById('log');
        if (log) log.innerHTML = '';
        
        this.generateComputerShips();
        
        this.logMessage(`Новая игра началась! Расставьте ваши корабли, ${this.playerName}.`, 'info');
        
        setTimeout(() => {
            const firstShip = document.querySelector('.ship-item');
            if (firstShip) {
                firstShip.click();
            }
        }, 100);
    }
}

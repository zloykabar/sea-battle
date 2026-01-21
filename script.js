document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM загружен, начинаем игру...');
    
    const game = new SeaBattle();
    window.game = game; // Для отладки
});

class SeaBattle {
    constructor() {
        console.log('Создаём игру Морской бой...');
        
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

    createEmptyBoard() {
        return Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(0));
    }

    init() {
        console.log('Инициализация игры...');
        
        try {
            this.createBoards();
            this.setupEventListeners();
            this.updateShipSelection();
            this.updateGameInfo();
            this.generateComputerShips();
            this.logMessage('Игра готова! Расставьте ваши корабли.', 'info');
            
            // Выбираем первый корабль по умолчанию
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

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
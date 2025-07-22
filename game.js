class Connect5Game {
    constructor() {
        this.loadSettings();
        
        this.board = [];
        this.currentPlayer = 1;
        this.gameOver = false;
        this.boardElement = document.getElementById('game-board');
        this.playerIndicators = document.getElementById('player-indicators');
        this.winnerMessageElement = document.getElementById('winner-message');
        this.resetButton = document.getElementById('reset-button');
        this.titleElement = document.getElementById('game-title');
        
        this.playerNames = ['Red', 'Blue', 'Green', 'Orange'];
        
        this.init();
    }
    
    loadSettings() {
        const savedSettings = this.getCookie('connect5Settings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            this.rows = settings.rows || 7;
            this.cols = settings.cols || 9;
            this.players = settings.players || 4;
            this.winLength = settings.winLength || 4;
            
            document.getElementById('rows-slider').value = this.rows;
            document.getElementById('rows-value').textContent = this.rows;
            document.getElementById('cols-slider').value = this.cols;
            document.getElementById('cols-value').textContent = this.cols;
            document.getElementById('players-slider').value = this.players;
            document.getElementById('players-value').textContent = this.players;
            document.getElementById('winlength-slider').value = this.winLength;
            document.getElementById('winlength-value').textContent = this.winLength;
        } else {
            this.rows = 7;
            this.cols = 9;
            this.players = 4;
            this.winLength = 4;
        }
    }
    
    saveSettings() {
        const settings = {
            rows: this.rows,
            cols: this.cols,
            players: this.players,
            winLength: this.winLength
        };
        this.setCookie('connect5Settings', JSON.stringify(settings), 365);
    }
    
    setCookie(name, value, days) {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
    }
    
    getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }
    
    init() {
        this.createBoard();
        this.render();
        this.resetButton.addEventListener('click', () => this.reset());
        this.updateBoardCSS();
        this.updateTitle();
        this.setupSettingsPanel();
        this.updatePlayerIndicators();
    }
    
    setupSettingsPanel() {
        const settingsPanel = document.querySelector('.settings-panel');
        const settingsHeader = document.querySelector('.settings-header');
        
        settingsHeader.addEventListener('click', (e) => {
            e.stopPropagation();
            settingsPanel.classList.toggle('collapsed');
        });
        
        document.addEventListener('click', (e) => {
            if (!settingsPanel.contains(e.target)) {
                settingsPanel.classList.add('collapsed');
            }
        });
        
        settingsPanel.addEventListener('click', (e) => {
            if (settingsPanel.classList.contains('collapsed') && e.target === settingsPanel) {
                settingsPanel.classList.remove('collapsed');
            }
        });
    }
    
    updateBoardCSS() {
        this.boardElement.style.setProperty('--cols', this.cols);
        this.boardElement.style.setProperty('--rows', this.rows);
    }
    
    updateTitle() {
        this.titleElement.textContent = `Connect ${this.winLength} x ${this.players}`;
    }
    
    updateSettings(rows, cols, players, winLength) {
        const oldRows = this.rows;
        const oldCols = this.cols;
        const oldPlayers = this.players;
        
        this.rows = rows;
        this.cols = cols;
        this.players = players;
        this.winLength = winLength;
        
        this.saveSettings();
        this.updateTitle();
        this.updateBoardCSS();
        this.updatePlayerIndicators();
        
        // Preserve board state
        const newBoard = [];
        for (let row = 0; row < this.rows; row++) {
            newBoard[row] = [];
            for (let col = 0; col < this.cols; col++) {
                if (row < oldRows && col < oldCols && this.board[row] && this.board[row][col]) {
                    // If reducing players, convert pieces to valid player numbers
                    let piece = this.board[row][col];
                    if (piece > this.players) {
                        piece = ((piece - 1) % this.players) + 1;
                    }
                    newBoard[row][col] = piece;
                } else {
                    newBoard[row][col] = 0;
                }
            }
        }
        this.board = newBoard;
        
        // Adjust current player if needed
        if (this.currentPlayer > this.players) {
            this.currentPlayer = ((this.currentPlayer - 1) % this.players) + 1;
        }
        
        this.render();
    }
    
    updatePlayerIndicators() {
        const boxes = this.playerIndicators.querySelectorAll('.player-box');
        boxes.forEach((box, index) => {
            if (index < this.players) {
                box.style.display = 'flex';
            } else {
                box.style.display = 'none';
            }
        });
    }
    
    createBoard() {
        this.board = [];
        for (let row = 0; row < this.rows; row++) {
            this.board[row] = [];
            for (let col = 0; col < this.cols; col++) {
                this.board[row][col] = 0;
            }
        }
    }
    
    render() {
        this.boardElement.innerHTML = '';
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                if (this.board[row][col] !== 0) {
                    cell.classList.add('filled');
                    const piece = document.createElement('div');
                    piece.className = `piece player-${this.board[row][col]}`;
                    cell.appendChild(piece);
                }
                
                cell.addEventListener('click', () => this.handleCellClick(col));
                this.boardElement.appendChild(cell);
            }
        }
        
        this.updateCurrentPlayerDisplay();
    }
    
    updateSingleCell(row, col) {
        const cellIndex = row * this.cols + col;
        const cells = this.boardElement.children;
        const cell = cells[cellIndex];
        
        cell.classList.add('filled');
        const piece = document.createElement('div');
        piece.className = `piece player-${this.board[row][col]}`;
        cell.appendChild(piece);
    }
    
    handleCellClick(col) {
        if (this.gameOver) return;
        if (col >= this.cols) return;
        
        const row = this.getLowestEmptyRow(col);
        if (row === -1) return;
        
        this.board[row][col] = this.currentPlayer;
        this.updateSingleCell(row, col);
        
        if (this.checkWin(row, col)) {
            this.gameOver = true;
            this.showWinner();
        } else if (this.checkDraw()) {
            this.gameOver = true;
            this.showDraw();
        } else {
            this.currentPlayer = (this.currentPlayer % this.players) + 1;
            this.updateCurrentPlayerDisplay();
        }
    }
    
    getLowestEmptyRow(col) {
        for (let row = this.rows - 1; row >= 0; row--) {
            if (this.board[row][col] === 0) {
                return row;
            }
        }
        return -1;
    }
    
    checkWin(row, col) {
        const player = this.board[row][col];
        
        const directions = [
            [[0, 1], [0, -1]],
            [[1, 0], [-1, 0]],
            [[1, 1], [-1, -1]],
            [[1, -1], [-1, 1]]
        ];
        
        for (const direction of directions) {
            let count = 1;
            
            for (const [dr, dc] of direction) {
                let r = row + dr;
                let c = col + dc;
                
                while (r >= 0 && r < this.rows && c >= 0 && c < this.cols && this.board[r][c] === player) {
                    count++;
                    r += dr;
                    c += dc;
                }
            }
            
            if (count >= this.winLength) {
                return true;
            }
        }
        
        return false;
    }
    
    checkDraw() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.board[row][col] === 0) {
                    return false;
                }
            }
        }
        return true;
    }
    
    updateCurrentPlayerDisplay() {
        if (this.currentPlayer > this.players) {
            this.currentPlayer = 1;
        }
        
        const boxes = this.playerIndicators.querySelectorAll('.player-box');
        boxes.forEach((box) => {
            box.classList.remove('active');
        });
        
        const activeBox = this.playerIndicators.querySelector(`.player-box[data-player="${this.currentPlayer}"]`);
        if (activeBox) {
            activeBox.classList.add('active');
        }
    }
    
    showWinner() {
        this.winnerMessageElement.textContent = `Player ${this.currentPlayer} (${this.playerNames[this.currentPlayer - 1]}) wins!`;
        this.winnerMessageElement.className = `winner-message player-${this.currentPlayer}`;
    }
    
    showDraw() {
        this.winnerMessageElement.textContent = "It's a draw!";
        this.winnerMessageElement.className = 'winner-message draw';
    }
    
    reset() {
        this.gameOver = false;
        this.currentPlayer = 1;
        this.createBoard();
        this.render();
        this.winnerMessageElement.className = 'winner-message hidden';
    }
}

const game = new Connect5Game();

function updateSlider(type, value) {
    const valueElement = document.getElementById(`${type}-value`);
    valueElement.textContent = value;
    
    const values = {
        rows: parseInt(document.getElementById('rows-slider').value),
        cols: parseInt(document.getElementById('cols-slider').value),
        players: parseInt(document.getElementById('players-slider').value),
        winlength: parseInt(document.getElementById('winlength-slider').value)
    };
    
    game.updateSettings(values.rows, values.cols, values.players, values.winlength);
}

function updateSetting(type, delta) {
    const slider = document.getElementById(`${type}-slider`);
    const newValue = parseInt(slider.value) + delta;
    
    if (newValue >= parseInt(slider.min) && newValue <= parseInt(slider.max)) {
        slider.value = newValue;
        updateSlider(type, newValue);
    }
}
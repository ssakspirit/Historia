// 역사적 사건 데이터 (년도 순으로 정렬됨)
const historicalEvents = [
    { event: "고조선 건국", year: -2333, era: "ancient" },
    { event: "신라 건국", year: -57, era: "ancient" },
    { event: "고구려 건국", year: -37, era: "ancient" },
    { event: "백제 건국", year: -18, era: "ancient" },
    { event: "고구려 광개토대왕 즉위", year: 391, era: "ancient" },
    { event: "백제 근초고왕 즉위", year: 346, era: "ancient" },
    { event: "신라 진흥왕 즉위", year: 540, era: "ancient" },
    { event: "고구려 연개소문 집권", year: 642, era: "ancient" },
    { event: "백제 멸망", year: 660, era: "ancient" },
    { event: "고구려 멸망", year: 668, era: "ancient" },
    { event: "신라 삼국통일", year: 676, era: "ancient" },
    { event: "고려 건국", year: 918, era: "medieval" },
    { event: "몽골 침입", year: 1231, era: "medieval" },
    { event: "조선 건국", year: 1392, era: "medieval" },
    { event: "한글 창제", year: 1446, era: "medieval" },
    { event: "임진왜란 발발", year: 1592, era: "medieval" },
    { event: "정유재란", year: 1597, era: "medieval" },
    { event: "인조반정", year: 1623, era: "medieval" },
    { event: "정조 즉위", year: 1776, era: "medieval" },
    { event: "일제강점기 시작", year: 1910, era: "modern" },
    { event: "3.1운동", year: 1919, era: "modern" },
    { event: "광복", year: 1945, era: "modern" },
    { event: "대한민국 정부 수립", year: 1948, era: "modern" },
    { event: "한국전쟁 발발", year: 1950, era: "modern" },
    { event: "4.19 혁명", year: 1960, era: "contemporary" },
    { event: "5.16 군사정변", year: 1961, era: "contemporary" },
    { event: "서울올림픽", year: 1988, era: "contemporary" },
    { event: "IMF 외환위기", year: 1997, era: "contemporary" },
    { event: "월드컵 공동개최", year: 2002, era: "contemporary" }
];

class HistoriaGame {
    constructor() {
        this.gameArea = document.getElementById('gameArea');
        this.scoreElement = document.getElementById('score');
        this.levelElement = document.getElementById('level');
        this.gameOverElement = document.getElementById('gameOver');
        this.finalScoreElement = document.getElementById('finalScore');
        this.menuScreen = document.getElementById('menuScreen');
        this.stackedTilesElement = document.getElementById('stackedTiles');
        
        this.gameState = 'ready'; // ready, playing, paused, gameOver
        this.score = 0;
        this.level = 1;
        this.fallingColumn = [];
        this.stackedTiles = [];
        this.gameSpeed = 60; // 60fps base
        this.fallSpeed = 1; // pixels per frame (더 천천히)
        this.spawnTimer = 0;
        this.spawnInterval = 300; // frames (더 긴 간격)
        this.selectedTile = null;
        this.columnPosition = 80; // start position from top
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.showMenu();
    }
    
    showMenu() {
        this.menuScreen.style.display = 'flex';
        this.gameState = 'ready';
    }
    
    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('tile')) {
                this.handleTileClick(e.target, e);
            }
        });
    }
    
    getRandomEvents(count) {
        const shuffled = [...historicalEvents].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, count);
        // 랜덤하게 섞어서 순서를 틀리게 만들기
        return selected.sort(() => Math.random() - 0.5);
    }
    
    createFallingColumn() {
        const tileCount = Math.floor(Math.random() * 3) + 2; // 2-4개 타일
        const events = this.getRandomEvents(tileCount);
        const column = [];
        
        for (let i = 0; i < tileCount; i++) {
            const tile = this.createTile(events[i], i);
            column.push(tile);
        }
        
        // 정답 순서 저장 (년도 순)
        column.correctOrder = [...events].sort((a, b) => a.year - b.year);
        
        return column;
    }
    
    createTile(eventData, index) {
        const tile = document.createElement('div');
        tile.className = `tile ${eventData.era}`;
        tile.style.top = (this.columnPosition + index * 37) + 'px';
        tile.textContent = eventData.event;
        tile.dataset.event = eventData.event;
        tile.dataset.year = eventData.year;
        tile.dataset.era = eventData.era;
        tile.dataset.index = index;
        
        const yearDisplay = document.createElement('div');
        yearDisplay.className = 'year-display';
        yearDisplay.textContent = eventData.year > 0 ? `${eventData.year}년` : `기원전 ${Math.abs(eventData.year)}년`;
        yearDisplay.style.left = '50%';
        yearDisplay.style.top = '-25px';
        yearDisplay.style.transform = 'translateX(-50%)';
        tile.appendChild(yearDisplay);
        
        document.querySelector('.game-board').appendChild(tile);
        return tile;
    }
    
    handleTileClick(tile, event) {
        if (this.gameState !== 'playing') return;
        if (!this.fallingColumn.includes(tile)) return;
        
        const index = parseInt(tile.dataset.index);
        const rect = tile.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const tileWidth = rect.width;
        const isRightSide = clickX > tileWidth / 2;
        
        if (isRightSide) {
            // 오른쪽 클릭: 위로 이동
            this.moveTileUp(index);
        } else {
            // 왼쪽 클릭: 아래로 이동
            this.moveTileDown(index);
        }
    }
    
    moveTileUp(index) {
        if (index > 0) {
            // 위 타일과 교환 (맨 위가 아닐 때만)
            const temp = this.fallingColumn[index - 1];
            this.fallingColumn[index - 1] = this.fallingColumn[index];
            this.fallingColumn[index] = temp;
            this.updateColumnPositions();
        }
    }
    
    moveTileDown(index) {
        if (index < this.fallingColumn.length - 1) {
            // 아래 타일과 교환 (맨 아래가 아닐 때만)
            const temp = this.fallingColumn[index];
            this.fallingColumn[index] = this.fallingColumn[index + 1];
            this.fallingColumn[index + 1] = temp;
            this.updateColumnPositions();
        }
    }
    
    updateColumnPositions() {
        this.fallingColumn.forEach((tile, index) => {
            const newTop = this.columnPosition + index * 37;
            tile.style.top = newTop + 'px';
            tile.dataset.index = index;
            
            // z-index를 설정하여 겹침 방지
            tile.style.zIndex = 100 + index;
        });
    }
    
    checkColumnOrder() {
        const currentOrder = this.fallingColumn.map(tile => ({
            event: tile.dataset.event,
            year: parseInt(tile.dataset.year)
        }));
        
        // 위에서 아래로: 최신 → 오래된 것 (년도가 큰 것 → 작은 것)
        for (let i = 0; i < currentOrder.length - 1; i++) {
            if (currentOrder[i].year < currentOrder[i + 1].year) {
                return false;
            }
        }
        return true;
    }
    
    handleColumnAtBottom() {
        const isCorrect = this.checkColumnOrder();
        
        if (isCorrect) {
            // 정답인 경우: 년도 표시 후 타일 제거
            this.fallingColumn.forEach((tile, index) => {
                tile.classList.add('correct');
                const yearDisplay = tile.querySelector('.year-display');
                yearDisplay.classList.add('show');
                
                // 년도를 1.5초 보여준 후 타일 제거
                setTimeout(() => {
                    yearDisplay.classList.remove('show');
                    if (tile.parentNode) {
                        tile.parentNode.removeChild(tile);
                    }
                }, 1500);
            });
            
            this.score += this.fallingColumn.length * 10 * this.level;
            this.updateScore();
            
            // 레벨업 체크 (속도를 더 천천히 증가)
            if (this.score > 0 && Math.floor(this.score / 150) + 1 > this.level) {
                this.level++;
                this.fallSpeed += 0.3; // 속도 증가를 더 완만하게
                this.spawnInterval = Math.max(200, this.spawnInterval - 15);
                this.updateLevel();
            }
        } else {
            // 오답인 경우: 스택에 추가
            this.fallingColumn.forEach(tile => {
                tile.classList.add('incorrect');
                const yearDisplay = tile.querySelector('.year-display');
                yearDisplay.classList.add('show');
                
                // 스택된 타일로 변환
                const stackedTile = document.createElement('div');
                stackedTile.className = `stacked-tile ${tile.dataset.era}`;
                stackedTile.textContent = tile.textContent;
                stackedTile.style.bottom = (this.stackedTiles.length * 37) + 'px';
                
                this.stackedTilesElement.appendChild(stackedTile);
                this.stackedTiles.push(tile.dataset);
                
                setTimeout(() => {
                    if (tile.parentNode) {
                        tile.parentNode.removeChild(tile);
                    }
                }, 2000);
            });
            
            // 게임 오버 체크
            if (this.stackedTiles.length >= 15) {
                this.gameOver();
                return;
            }
        }
        
        // 새로운 컬럼 생성
        this.fallingColumn = [];
        this.columnPosition = 80;
        this.spawnTimer = 0;
    }
    
    updateScore() {
        this.scoreElement.textContent = this.score;
    }
    
    updateLevel() {
        this.levelElement.textContent = this.level;
    }
    
    checkGameOver() {
        return this.stackedTiles.length >= 15 || 
               (this.fallingColumn.length > 0 && this.columnPosition <= 0);
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        this.finalScoreElement.textContent = this.score;
        this.gameOverElement.style.display = 'flex';
    }
    
    gameLoop() {
        if (this.gameState !== 'playing') {
            requestAnimationFrame(() => this.gameLoop());
            return;
        }
        
        // 새로운 컬럼 생성
        if (this.fallingColumn.length === 0) {
            this.spawnTimer++;
            if (this.spawnTimer >= this.spawnInterval) {
                this.fallingColumn = this.createFallingColumn();
                this.spawnTimer = 0;
            }
        }
        
        // 컬럼 이동
        if (this.fallingColumn.length > 0) {
            this.columnPosition += this.fallSpeed;
            this.updateColumnPositions();
            
            // 바닥 도달 체크
            const maxPosition = 560 - (this.fallingColumn.length * 37) - (this.stackedTiles.length * 37);
            if (this.columnPosition >= maxPosition) {
                this.handleColumnAtBottom();
            }
        }
        
        // 게임 오버 체크
        if (this.checkGameOver()) {
            this.gameOver();
            return;
        }
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    start() {
        this.gameState = 'playing';
        this.score = 0;
        this.level = 1;
        this.fallingColumn = [];
        this.stackedTiles = [];
        this.columnPosition = 80;
        this.fallSpeed = 1; // 초기 속도를 더 천천히
        this.spawnTimer = 0;
        this.spawnInterval = 300; // 초기 스폰 간격을 더 길게
        
        // UI 초기화
        this.menuScreen.style.display = 'none';
        this.gameOverElement.style.display = 'none';
        this.stackedTilesElement.innerHTML = '';
        
        // 기존 타일들 제거
        const tiles = document.querySelectorAll('.tile');
        tiles.forEach(tile => tile.remove());
        
        this.updateScore();
        this.updateLevel();
        this.gameLoop();
    }
    
    pause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.showMenu();
        }
    }
}

// 전역 게임 인스턴스
let game;

function startGame() {
    if (game) {
        game.start();
    }
}

function pauseGame() {
    if (game) {
        game.pause();
    }
}

function restartGame() {
    if (game) {
        game.start();
    }
}

// 게임 초기화
window.addEventListener('load', () => {
    game = new HistoriaGame();
});
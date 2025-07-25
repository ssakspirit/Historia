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
        this.pauseScreen = document.getElementById('pauseScreen');
        
        this.gameState = 'ready'; // ready, playing, paused, gameOver
        this.score = 0;
        this.level = 1;
        this.fallingColumn = [];
        this.stackedTiles = [];
        this.gameSpeed = 60; // 60fps base
        this.fallSpeed = 0.5; // pixels per frame (더 천천히 - 절반 속도)
        this.spawnTimer = 0;
        this.spawnInterval = 120; // frames (더 짧은 간격 - 2초)
        this.selectedTile = null;
        this.columnPosition = -50; // 모바일에 맞춘 시작 위치
        
        // 모바일 감지
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                       (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
        
        // 게임 루프 관리
        this.gameLoopRunning = false;
        this.animationFrameId = null;
        
        // Web Audio API 초기화
        this.audioContext = null;
        this.initAudio();
        
        // 파티클 시스템
        this.particles = [];
        
        // 최고 점수 관리
        this.highScore = this.loadHighScore();
        
        console.log('Historia Game initialized - Mobile:', this.isMobile);
        this.init();
    }
    
    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Audio not supported');
        }
    }
    
    playSound(type) {
        if (!this.audioContext) return;
        
        // AudioContext가 suspended 상태면 resume
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        switch(type) {
            case 'move': // 타일 이동
                oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
                oscillator.start();
                oscillator.stop(this.audioContext.currentTime + 0.1);
                break;
                
            case 'correct': // 정답
                oscillator.frequency.setValueAtTime(523, this.audioContext.currentTime); // C5
                oscillator.frequency.setValueAtTime(659, this.audioContext.currentTime + 0.1); // E5
                oscillator.frequency.setValueAtTime(784, this.audioContext.currentTime + 0.2); // G5
                gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
                oscillator.start();
                oscillator.stop(this.audioContext.currentTime + 0.4);
                break;
                
            case 'incorrect': // 오답
                oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
                oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime + 0.15);
                gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                oscillator.start();
                oscillator.stop(this.audioContext.currentTime + 0.3);
                break;
                
            case 'drop': // 타일 드롭
                oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.2);
                gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
                oscillator.start();
                oscillator.stop(this.audioContext.currentTime + 0.2);
                break;
                
            case 'disappear': // 타일 사라질 때
                // 마법같은 반짝이는 소리
                const osc1 = this.audioContext.createOscillator();
                const osc2 = this.audioContext.createOscillator();
                const gain1 = this.audioContext.createGain();
                const gain2 = this.audioContext.createGain();
                
                osc1.connect(gain1);
                osc2.connect(gain2);
                gain1.connect(this.audioContext.destination);
                gain2.connect(this.audioContext.destination);
                
                // 첫 번째 음 (높은 음)
                osc1.frequency.setValueAtTime(800, this.audioContext.currentTime);
                osc1.frequency.exponentialRampToValueAtTime(1600, this.audioContext.currentTime + 0.3);
                gain1.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                gain1.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                
                // 두 번째 음 (화음)
                osc2.frequency.setValueAtTime(1200, this.audioContext.currentTime + 0.1);
                osc2.frequency.exponentialRampToValueAtTime(2000, this.audioContext.currentTime + 0.4);
                gain2.gain.setValueAtTime(0.08, this.audioContext.currentTime + 0.1);
                gain2.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
                
                osc1.start();
                osc2.start(this.audioContext.currentTime + 0.1);
                osc1.stop(this.audioContext.currentTime + 0.3);
                osc2.stop(this.audioContext.currentTime + 0.4);
                break;
                
            case 'gameover': // 게임 오버
                oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 1);
                gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1);
                oscillator.start();
                oscillator.stop(this.audioContext.currentTime + 1);
                break;
        }
    }
    
    createParticle(x, y, type) {
        const colors = {
            'move': ['#FFD700', '#FFA500', '#FF6347'],
            'correct': ['#00FF00', '#32CD32', '#90EE90'],
            'incorrect': ['#FF0000', '#FF4500', '#FF6B6B'],
            'stack': ['#808080', '#A9A9A9', '#C0C0C0'],
            'disappear': ['#FFD700', '#FFF700', '#FFFF00', '#00FFFF', '#FF69B4', '#FF1493', '#00FF00', '#ADFF2F']
        };
        
        const particleColors = colors[type] || colors['move'];
        const particleCount = type === 'disappear' ? 20 : 8; // 사라질 때 더 많은 파티클
        
        for (let i = 0; i < particleCount; i++) {
            const particle = {
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * (type === 'disappear' ? 10 : 6),
                vy: (Math.random() - 0.5) * (type === 'disappear' ? 10 : 6) - 2,
                life: type === 'disappear' ? 60 : 30, // 사라질 때 더 오래 지속
                maxLife: type === 'disappear' ? 60 : 30,
                color: particleColors[Math.floor(Math.random() * particleColors.length)],
                size: Math.random() * (type === 'disappear' ? 6 : 4) + 2,
                sparkle: type === 'disappear' // 반짝임 효과
            };
            this.particles.push(particle);
        }
    }
    
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.2; // 중력
            particle.life--;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    renderParticles() {
        const gameBoard = document.querySelector('.game-board');
        const existingParticles = gameBoard.querySelectorAll('.particle');
        existingParticles.forEach(p => p.remove());
        
        this.particles.forEach(particle => {
            const particleElement = document.createElement('div');
            particleElement.className = 'particle';
            particleElement.style.position = 'absolute';
            particleElement.style.left = particle.x + 'px';
            particleElement.style.top = particle.y + 'px';
            particleElement.style.width = particle.size + 'px';
            particleElement.style.height = particle.size + 'px';
            particleElement.style.backgroundColor = particle.color;
            particleElement.style.borderRadius = '50%';
            particleElement.style.pointerEvents = 'none';
            particleElement.style.opacity = particle.life / particle.maxLife;
            particleElement.style.zIndex = '1000';
            
            // 반짝임 효과 (사라지는 파티클용)
            if (particle.sparkle) {
                particleElement.style.boxShadow = `0 0 ${particle.size}px ${particle.color}`;
                particleElement.style.animation = 'sparkle 0.5s infinite alternate';
            }
            
            gameBoard.appendChild(particleElement);
        });
    }
    
    init() {
        this.setupEventListeners();
        this.setupStartButton();
        this.updateHighScoreDisplay();
        this.showMenu();
    }
    
    setupStartButton() {
        const startButton = document.getElementById('startButton');
        if (startButton) {
            // Remove any existing event listeners
            startButton.replaceWith(startButton.cloneNode(true));
            const newStartButton = document.getElementById('startButton');
            
            // Add click event for desktop
            newStartButton.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Start button clicked');
                this.start();
            });
            
            // Add touch event for mobile
            newStartButton.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Start button touched');
                this.start();
            });
            
            console.log('Start button event listeners added');
        } else {
            console.error('Start button not found');
        }
    }
    
    loadHighScore() {
        const saved = localStorage.getItem('historia-high-score');
        return saved ? parseInt(saved) : 0;
    }
    
    saveHighScore() {
        localStorage.setItem('historia-high-score', this.highScore.toString());
    }
    
    updateHighScoreDisplay() {
        const highScoreElement = document.getElementById('highScore');
        if (highScoreElement) {
            highScoreElement.textContent = this.highScore.toLocaleString();
        }
    }
    
    showMenu() {
        this.menuScreen.style.display = 'flex';
        this.gameState = 'ready';
    }
    
    setupEventListeners() {
        // 터치 이벤트 변수
        let touchStartTime = 0;
        let touchMoved = false;
        
        // 터치 시작
        document.addEventListener('touchstart', (e) => {
            touchStartTime = Date.now();
            touchMoved = false;
        }, { passive: true });
        
        // 터치 이동
        document.addEventListener('touchmove', (e) => {
            touchMoved = true;
        }, { passive: true });
        
        // 터치 종료 (탭)
        document.addEventListener('touchend', (e) => {
            e.preventDefault(); // 300ms 지연 방지
            
            // 이동하지 않았고 빠른 탭인 경우만 처리
            if (!touchMoved && (Date.now() - touchStartTime) < 300) {
                const touch = e.changedTouches[0];
                const element = document.elementFromPoint(touch.clientX, touch.clientY);
                
                if (element && element.classList.contains('tile')) {
                    this.handleTileTouch(element, touch);
                } else if (this.gameState === 'playing' && this.fallingColumn.length > 0) {
                    // 게임 보드 영역 내에서만 빠른 드롭 실행
                    const gameBoard = document.querySelector('.game-board');
                    const gameBoardRect = gameBoard.getBoundingClientRect();
                    const touchX = touch.clientX;
                    const touchY = touch.clientY;
                    
                    // 터치가 게임 보드 내부에 있는지 확인
                    if (touchX >= gameBoardRect.left && touchX <= gameBoardRect.right &&
                        touchY >= gameBoardRect.top && touchY <= gameBoardRect.bottom) {
                        this.dropTilesFast();
                    }
                }
            }
        });
        
        // 마우스 클릭 (데스크톱용)
        document.addEventListener('click', (e) => {
            // 터치 이벤트가 있는 경우 마우스 이벤트 무시
            if (e.detail === 0 || e.isTrusted === false) return;
            
            if (e.target.classList.contains('tile')) {
                this.handleTileClick(e.target, e);
            } else if (this.gameState === 'playing' && this.fallingColumn.length > 0) {
                // 게임 보드 영역 내에서만 빠른 드롭 실행
                const gameBoard = document.querySelector('.game-board');
                const gameBoardRect = gameBoard.getBoundingClientRect();
                const clickX = e.clientX;
                const clickY = e.clientY;
                
                // 클릭이 게임 보드 내부에 있는지 확인
                if (clickX >= gameBoardRect.left && clickX <= gameBoardRect.right &&
                    clickY >= gameBoardRect.top && clickY <= gameBoardRect.bottom) {
                    this.dropTilesFast();
                }
            }
        });
    }
    
    getRandomEvents(count) {
        const shuffled = [...historicalEvents].sort(() => 0.5 - Math.random());
        let selected = shuffled.slice(0, count);
        
        // 75% 확률로 특별 타일 생성
        if (Math.random() < 0.75 && selected.length > 0) {
            const randomIndex = Math.floor(Math.random() * selected.length);
            const specialType = Math.random() < 0.5 ? 'golden' : 'time';
            selected[randomIndex] = {
                ...selected[randomIndex],
                special: specialType
            };
        }
        
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
    
    getRandomColor() {
        const colors = [
            'linear-gradient(45deg, #FF6B6B, #FF8E8E)',
            'linear-gradient(45deg, #4ECDC4, #7FDDDA)',
            'linear-gradient(45deg, #45B7D1, #6BC5E8)',
            'linear-gradient(45deg, #96CEB4, #B8E6C1)',
            'linear-gradient(45deg, #FFEAA7, #FFF2CC)',
            'linear-gradient(45deg, #DDA0DD, #E6B3E6)',
            'linear-gradient(45deg, #F0A500, #F5B800)',
            'linear-gradient(45deg, #FF7675, #FF9999)',
            'linear-gradient(45deg, #74B9FF, #A8D5FF)',
            'linear-gradient(45deg, #55A3FF, #82C7FF)'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    createTile(eventData, index) {
        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.style.top = this.columnPosition + 'px';
        tile.style.left = (50 + index * 82) + 'px'; // 임시 위치, updateColumnPositions에서 중앙 정렬
        
        // 특별 타일 처리
        if (eventData.special) {
            if (eventData.special === 'golden') {
                tile.style.background = 'linear-gradient(45deg, #FFD700, #FFA500)';
                tile.style.border = '3px solid #FFFF00';
                tile.style.boxShadow = '0 0 15px #FFD700';
                tile.dataset.special = 'golden';
                tile.innerHTML = `<div style="font-size: 12px;">⭐ ${eventData.event}</div>`;
            } else if (eventData.special === 'time') {
                tile.style.background = 'linear-gradient(45deg, #9C27B0, #E91E63)';
                tile.style.border = '3px solid #FF69B4';
                tile.style.boxShadow = '0 0 15px #9C27B0';
                tile.dataset.special = 'time';
                tile.innerHTML = `<div style="font-size: 12px;">⏰ ${eventData.event}</div>`;
            }
        } else {
            // 일반 타일: 랜덤 색상 적용 (시대별 색상 숨김)
            tile.style.background = this.getRandomColor();
            tile.textContent = eventData.event;
        }
        
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
            // 오른쪽 클릭: 오른쪽으로 이동
            this.moveTileRight(index);
        } else {
            // 왼쪽 클릭: 왼쪽으로 이동
            this.moveTileLeft(index);
        }
    }
    
    handleTileTouch(tile, touch) {
        if (this.gameState !== 'playing') return;
        if (!this.fallingColumn.includes(tile)) return;
        
        const index = parseInt(tile.dataset.index);
        const rect = tile.getBoundingClientRect();
        const touchX = touch.clientX - rect.left;
        const tileWidth = rect.width;
        const isRightSide = touchX > tileWidth / 2;
        
        if (isRightSide) {
            // 오른쪽 터치: 오른쪽으로 이동
            this.moveTileRight(index);
        } else {
            // 왼쪽 터치: 왼쪽으로 이동
            this.moveTileLeft(index);
        }
    }
    
    moveTileLeft(index) {
        if (index > 0) {
            // 왼쪽 타일과 교환 (맨 왼쪽이 아닐 때만)
            const temp = this.fallingColumn[index - 1];
            this.fallingColumn[index - 1] = this.fallingColumn[index];
            this.fallingColumn[index] = temp;
            this.updateColumnPositions();
            this.playSound('move');
        }
    }
    
    moveTileRight(index) {
        if (index < this.fallingColumn.length - 1) {
            // 오른쪽 타일과 교환 (맨 오른쪽이 아닐 때만)
            const temp = this.fallingColumn[index];
            this.fallingColumn[index] = this.fallingColumn[index + 1];
            this.fallingColumn[index + 1] = temp;
            this.updateColumnPositions();
            this.playSound('move');
        }
    }
    
    updateColumnPositions() {
        const totalTiles = this.fallingColumn.length;
        const boardWidth = 340;
        const tileWidth = 80;
        const tileSpacing = 82; // 간격을 줄여서 오른쪽 여백 확보
        const totalWidth = totalTiles * tileWidth + (totalTiles - 1) * (tileSpacing - tileWidth);
        const startX = (boardWidth - totalWidth) / 2;
        
        this.fallingColumn.forEach((tile, index) => {
            tile.style.top = this.columnPosition + 'px';
            tile.style.left = (startX + index * tileSpacing) + 'px';
            tile.dataset.index = index;
            
            // z-index를 설정하여 겹침 방지
            tile.style.zIndex = 100 + index;
        });
    }
    
    dropTilesFast() {
        if (this.fallingColumn.length === 0) return;
        
        // 현재 떨어지는 타일들을 빠르게 바닥까지 떨어뜨리기
        const tileHeight = 50;
        let bottomPosition = 500 - tileHeight; // 기본 바닥 위치
        
        // 기존에 남아있는 타일들과의 충돌 체크
        const existingTiles = document.querySelectorAll('.tile[style*="pointer-events: none"]');
        let minCollisionY = bottomPosition;
        
        existingTiles.forEach(existingTile => {
            const existingTop = parseInt(existingTile.style.top);
            const existingLeft = parseInt(existingTile.style.left);
            const existingRight = existingLeft + 80;
            
            // 현재 떨어지는 타일들과 x축에서 겹치는지 확인
            this.fallingColumn.forEach(fallingTile => {
                const fallingLeft = parseInt(fallingTile.style.left);
                const fallingRight = fallingLeft + 80;
                
                // x축에서 겹치면 충돌 가능
                if (!(fallingRight <= existingLeft || fallingLeft >= existingRight)) {
                    const collisionY = existingTop - tileHeight;
                    minCollisionY = Math.min(minCollisionY, collisionY);
                }
            });
        });
        
        // 타일을 충돌 위치로 즉시 이동
        this.columnPosition = minCollisionY;
        this.updateColumnPositions();
        
        // 빠른 드롭 시 파티클 효과
        this.fallingColumn.forEach(tile => {
            const tileLeft = parseInt(tile.style.left);
            const tileTop = parseInt(tile.style.top);
            this.createParticle(
                tileLeft + 55, // 타일 중앙 x
                tileTop + 30,  // 타일 중앙 y
                'stack'
            );
        });
        
        // 드롭 사운드 재생
        this.playSound('drop');
        
        // 바로 바닥 처리
        this.handleColumnAtBottom();
    }
    
    checkColumnOrder() {
        const currentOrder = this.fallingColumn.map(tile => ({
            event: tile.dataset.event,
            year: parseInt(tile.dataset.year)
        }));
        
        // 왼쪽에서 오른쪽으로: 과거 → 미래 (년도가 작은 것 → 큰 것)
        for (let i = 0; i < currentOrder.length - 1; i++) {
            if (currentOrder[i].year > currentOrder[i + 1].year) {
                return false;
            }
        }
        return true;
    }
    
    handleColumnAtBottom() {
        const isCorrect = this.checkColumnOrder();
        
        if (isCorrect) {
            // 정답 사운드 재생
            this.playSound('correct');
            
            // 특별 타일 효과 처리
            const specialTiles = this.fallingColumn.filter(tile => tile.dataset.special);
            
            // 정답인 경우: 년도 표시 후 타일 제거
            this.fallingColumn.forEach((tile, index) => {
                tile.classList.add('correct');
                const yearDisplay = tile.querySelector('.year-display');
                yearDisplay.classList.add('show');
                
                // 정답 파티클 효과
                const tileRect = tile.getBoundingClientRect();
                const gameBoard = document.querySelector('.game-board');
                const boardRect = gameBoard.getBoundingClientRect();
                
                this.createParticle(
                    tileRect.left - boardRect.left + tileRect.width / 2,
                    tileRect.top - boardRect.top + tileRect.height / 2,
                    'correct'
                );
                
                // 년도를 1초 보여준 후 사라지는 효과와 함께 타일 제거
                setTimeout(() => {
                    yearDisplay.classList.remove('show');
                    
                    // 사라지는 파티클 효과와 사운드
                    const tileRect = tile.getBoundingClientRect();
                    const gameBoard = document.querySelector('.game-board');
                    const boardRect = gameBoard.getBoundingClientRect();
                    
                    this.createParticle(
                        tileRect.left - boardRect.left + tileRect.width / 2,
                        tileRect.top - boardRect.top + tileRect.height / 2,
                        'disappear'
                    );
                    
                    this.playSound('disappear');
                    
                    // 타일 페이드아웃 효과
                    tile.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                    tile.style.opacity = '0';
                    tile.style.transform = 'scale(1.2)';
                    
                    setTimeout(() => {
                        if (tile.parentNode) {
                            tile.parentNode.removeChild(tile);
                        }
                    }, 300);
                }, 1000);
            });
            
            // 특별 타일 효과 처리 (1.5초 후 실행)
            if (specialTiles.length > 0) {
                setTimeout(() => {
                    this.handleSpecialTileEffects(specialTiles);
                }, 1500);
            }
            
            this.score += this.fallingColumn.length * 10 * this.level;
            this.updateScore();
            
            // 레벨업 체크 (속도를 점진적으로 증가)
            if (this.score > 0 && Math.floor(this.score / 150) + 1 > this.level) {
                this.level++;
                // 낙하 속도를 점진적으로 증가 (최대 0.9까지)
                this.fallSpeed = Math.min(0.9, 0.5 + (this.level - 1) * 0.05);
                this.updateLevel();
            }
        } else {
            // 오답 사운드 재생
            this.playSound('incorrect');
            
            // 오답인 경우: 타일을 현재 위치에 그대로 남김
            this.fallingColumn.forEach(tile => {
                tile.classList.add('incorrect');
                const yearDisplay = tile.querySelector('.year-display');
                yearDisplay.classList.add('show');
                
                // 오답 파티클 효과
                const tileRect = tile.getBoundingClientRect();
                const gameBoard = document.querySelector('.game-board');
                const boardRect = gameBoard.getBoundingClientRect();
                
                this.createParticle(
                    tileRect.left - boardRect.left + tileRect.width / 2,
                    tileRect.top - boardRect.top + tileRect.height / 2,
                    'incorrect'
                );
                
                // 타일에 사건명(위)과 연도(아래) 표시하고 원래 시대별 색상으로 변경
                const year = parseInt(tile.dataset.year);
                const yearText = year > 0 ? `${year}년` : `기원전 ${Math.abs(year)}년`;
                tile.innerHTML = `
                    <div style="font-size: 13px; font-weight: bold; line-height: 1.0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;">${tile.dataset.event}</div>
                    <div style="font-size: 11px; opacity: 0.9; margin-top: 1px; white-space: nowrap;">${yearText}</div>
                `;
                tile.style.flexDirection = 'column';
                tile.style.justifyContent = 'center';
                tile.style.alignItems = 'center';
                
                // 오답일 때 원래 시대별 색상으로 변경
                tile.className = `tile ${tile.dataset.era}`;
                tile.style.background = ''; // 인라인 랜덤 색상 제거
                
                // 타일을 클릭할 수 없게 만들기
                tile.style.opacity = '0.7';
                tile.style.cursor = 'default';
                tile.style.pointerEvents = 'none';
                
                // 스택된 타일 목록에 추가 (게임오버 판정용)
                this.stackedTiles.push(tile.dataset);
                
                // yearDisplay 숨기기 (2초 후)
                setTimeout(() => {
                    if (yearDisplay) {
                        yearDisplay.classList.remove('show');
                    }
                    tile.classList.remove('incorrect');
                }, 2000);
            });
            
            // 게임 오버 체크는 메인 루프에서만 수행
        }
        
        // 새로운 컬럼 생성
        this.fallingColumn = [];
        this.columnPosition = -50;
        this.spawnTimer = 0;
    }
    
    handleSpecialTileEffects(specialTiles) {
        specialTiles.forEach(specialTile => {
            const tileLeft = parseInt(specialTile.style.left);
            const tileTop = parseInt(specialTile.style.top);
            
            if (specialTile.dataset.special === 'golden') {
                // 황금 타일: 바로 아래 타일 제거
                this.removeStackedTilesBelow(tileLeft, tileTop);
            } else if (specialTile.dataset.special === 'time') {
                // 시간 타일: 같은 시대 타일들 모두 제거
                this.removeSameEraTiles(specialTile.dataset.era);
            }
        });
    }
    
    removeStackedTilesBelow(tileX, tileY) {
        const gameBoard = document.querySelector('.game-board');
        const stackedTiles = gameBoard.querySelectorAll('.tile[style*="pointer-events: none"]');
        
        // 황금 타일 바로 아래 줄의 Y 좌표 찾기
        const targetY = tileY + 50; // 타일 높이만큼 아래
        
        // 바로 아래 줄에 있는 모든 타일들 찾기
        const tilesToRemove = [];
        stackedTiles.forEach(tile => {
            const stackedTop = parseInt(tile.style.top);
            // 바로 아래 줄(±10px 오차 허용)에 있는 모든 타일
            if (Math.abs(stackedTop - targetY) <= 10) {
                tilesToRemove.push(tile);
            }
        });
        
        // 찾은 타일들을 모두 제거
        tilesToRemove.forEach(tile => {
            const stackedLeft = parseInt(tile.style.left);
            const stackedTop = parseInt(tile.style.top);
            
            // 특별한 제거 파티클 효과
            this.createParticle(
                stackedLeft + 55,
                stackedTop + 30,
                'disappear'
            );
            
            // 타일 제거 애니메이션
            tile.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            tile.style.opacity = '0';
            tile.style.transform = 'scale(0.5) rotate(360deg)';
            
            setTimeout(() => {
                if (tile.parentNode) {
                    tile.parentNode.removeChild(tile);
                    // 스택된 타일 목록에서도 제거
                    this.stackedTiles = this.stackedTiles.filter(t => 
                        t.event !== tile.dataset.event || t.year !== tile.dataset.year
                    );
                }
            }, 500);
        });
        
        if (tilesToRemove.length > 0) {
            this.playSound('disappear');
            
            // 0.6초 후 중력 효과 적용 (타일 제거 애니메이션 완료 후)
            setTimeout(() => {
                this.applyGravity();
            }, 600);
        }
    }
    
    removeSameEraTiles(era) {
        const gameBoard = document.querySelector('.game-board');
        const stackedTiles = gameBoard.querySelectorAll('.tile[style*="pointer-events: none"]');
        
        stackedTiles.forEach(tile => {
            if (tile.dataset.era === era) {
                // 특별한 제거 파티클 효과
                const tileLeft = parseInt(tile.style.left);
                const tileTop = parseInt(tile.style.top);
                
                this.createParticle(
                    tileLeft + 55,
                    tileTop + 30,
                    'disappear'
                );
                
                // 타일 제거 애니메이션
                tile.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                tile.style.opacity = '0';
                tile.style.transform = 'scale(0.5) rotate(-360deg)';
                
                setTimeout(() => {
                    if (tile.parentNode) {
                        tile.parentNode.removeChild(tile);
                        // 스택된 타일 목록에서도 제거
                        this.stackedTiles = this.stackedTiles.filter(t => 
                            t.event !== tile.dataset.event || t.year !== tile.dataset.year
                        );
                    }
                }, 500);
            }
        });
        
        this.playSound('disappear');
        
        // 0.6초 후 중력 효과 적용 (타일 제거 애니메이션 완료 후)
        setTimeout(() => {
            this.applyGravity();
        }, 600);
    }
    
    applyGravity() {
        const gameBoard = document.querySelector('.game-board');
        const stackedTiles = Array.from(gameBoard.querySelectorAll('.tile[style*="pointer-events: none"]'));
        
        if (stackedTiles.length === 0) return;
        
        // Y 좌표별로 타일들을 그룹화
        const tilesByY = {};
        stackedTiles.forEach(tile => {
            const y = parseInt(tile.style.top);
            if (!tilesByY[y]) {
                tilesByY[y] = [];
            }
            tilesByY[y].push(tile);
        });
        
        // Y 좌표를 내림차순으로 정렬 (아래부터 처리)
        const sortedY = Object.keys(tilesByY).map(y => parseInt(y)).sort((a, b) => b - a);
        
        // 각 줄이 빈 줄인지 확인하고 중력 적용
        const gameHeight = 500;
        const tileHeight = 50;
        let dropDistance = 0;
        
        for (let y = gameHeight - tileHeight; y >= 0; y -= tileHeight) {
            const tilesAtY = tilesByY[y] || [];
            
            if (tilesAtY.length === 0) {
                // 빈 줄 발견
                dropDistance += tileHeight;
            } else if (dropDistance > 0) {
                // 위에 있는 타일들을 아래로 이동
                tilesAtY.forEach(tile => {
                    const currentY = parseInt(tile.style.top);
                    const newY = currentY + dropDistance;
                    
                    // 부드러운 이동 애니메이션
                    tile.style.transition = 'top 0.3s ease';
                    tile.style.top = newY + 'px';
                    
                    // 이동 파티클 효과
                    const tileLeft = parseInt(tile.style.left);
                    this.createParticle(
                        tileLeft + 55,
                        currentY + 30,
                        'move'
                    );
                });
            }
        }
        
        // 중력 효과가 적용된 경우 사운드 재생
        if (dropDistance > 0) {
            this.playSound('drop');
        }
    }
    
    updateScore() {
        this.scoreElement.textContent = this.score;
    }
    
    updateLevel() {
        this.levelElement.textContent = this.level;
    }
    
    checkGameOver() {
        // 쌓인 타일이 게임 화면 최상단(0px)에 실제로 닿았을 때만 게임 오버
        const existingTiles = document.querySelectorAll('.tile[style*="pointer-events: none"]');
        const topTile = Array.from(existingTiles).find(tile => {
            const top = parseInt(tile.style.top);
            return top <= 0; // 게임 보드 최상단(0px)에 타일이 닿으면 게임 오버
        });
        
        return topTile !== undefined;
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        this.playSound('gameover');
        
        // 게임 루프 중단
        this.gameLoopRunning = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // 최고 점수 업데이트
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.saveHighScore();
            this.updateHighScoreDisplay();
        }
        
        this.finalScoreElement.textContent = this.score;
        this.gameOverElement.style.display = 'flex';
    }
    
    gameLoop() {
        if (this.gameState !== 'playing') {
            if (this.gameLoopRunning) {
                this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
            }
            return;
        }
        
        // 새로운 컬럼 생성
        if (this.fallingColumn.length === 0) {
            this.spawnTimer++;
            if (this.spawnTimer >= this.spawnInterval) {
                // 새 타일이 생성될 위치에 기존 타일이 있는지 체크
                const existingTiles = document.querySelectorAll('.tile[style*="pointer-events: none"]');
                const blockingTile = Array.from(existingTiles).find(tile => {
                    const top = parseInt(tile.style.top);
                    return top <= -50; // 생성 위치(-70px) 근처에 타일이 있으면
                });
                
                if (blockingTile) {
                    this.gameOver();
                    return;
                }
                
                this.fallingColumn = this.createFallingColumn();
                this.spawnTimer = 0;
            }
        }
        
        // 컬럼 이동
        if (this.fallingColumn.length > 0) {
            this.columnPosition += this.fallSpeed;
            this.updateColumnPositions();
            
            // 바닥 또는 기존 타일에 도달 체크
            const tileHeight = 50;
            let bottomPosition = 500 - tileHeight; // 기본 바닥 위치
            
            // 기존에 남아있는 타일들과의 충돌 체크
            const existingTiles = document.querySelectorAll('.tile[style*="pointer-events: none"]');
            let minCollisionY = bottomPosition;
            
            existingTiles.forEach(existingTile => {
                const existingTop = parseInt(existingTile.style.top);
                const existingLeft = parseInt(existingTile.style.left);
                const existingRight = existingLeft + 80;
                
                // 현재 떨어지는 타일들과 x축에서 겹치는지 확인
                this.fallingColumn.forEach(fallingTile => {
                    const fallingLeft = parseInt(fallingTile.style.left);
                    const fallingRight = fallingLeft + 80;
                    
                    // x축에서 겹치면 충돌 가능
                    if (!(fallingRight <= existingLeft || fallingLeft >= existingRight)) {
                        const collisionY = existingTop - tileHeight;
                        minCollisionY = Math.min(minCollisionY, collisionY);
                    }
                });
            });
            
            if (this.columnPosition >= minCollisionY) {
                // 타일이 바닥에 떨어질 때 파티클 효과
                this.fallingColumn.forEach(tile => {
                    const tileLeft = parseInt(tile.style.left);
                    const tileTop = parseInt(tile.style.top);
                    this.createParticle(
                        tileLeft + 40, // 타일 중앙 x
                        tileTop + 25,  // 타일 중앙 y
                        'stack'
                    );
                });
                
                this.handleColumnAtBottom();
            }
        }
        
        // 파티클 업데이트 및 렌더링
        this.updateParticles();
        this.renderParticles();
        
        // 게임 오버 체크
        if (this.checkGameOver()) {
            this.gameOver();
            return;
        }
        
        if (this.gameLoopRunning) {
            this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
        }
    }
    
    start() {
        this.gameState = 'playing';
        this.score = 0;
        this.level = 1;
        this.fallingColumn = [];
        this.stackedTiles = [];
        this.columnPosition = -50;
        this.fallSpeed = 0.5; // 초기 속도를 더 천천히 (절반 속도)
        this.spawnTimer = 0;
        this.spawnInterval = 120; // 초기 스폰 간격을 더 짧게 (2초)
        
        // UI 초기화
        this.menuScreen.style.display = 'none';
        this.gameOverElement.style.display = 'none';
        this.stackedTilesElement.innerHTML = '';
        
        // 기존 타일들 제거 (게임 보드 내의 모든 타일)
        const gameBoard = document.querySelector('.game-board');
        const tiles = gameBoard.querySelectorAll('.tile');
        tiles.forEach(tile => tile.remove());
        
        // 파티클 초기화
        this.particles = [];
        const particles = gameBoard.querySelectorAll('.particle');
        particles.forEach(particle => particle.remove());
        
        this.updateScore();
        this.updateLevel();
        
        // 게임 루프 시작 (기존 루프가 있다면 중단)
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        this.gameLoopRunning = true;
        this.gameLoop();
    }
    
    pause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.pauseScreen.style.display = 'flex';
        }
    }
    
    resume() {
        if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.pauseScreen.style.display = 'none';
            
            // 잠시 후에 이벤트 처리를 재개하여 즉시 클릭 방지
            setTimeout(() => {
                // 게임 상태만 복원하고 추가 처리 없음
            }, 100);
        }
    }
    
    quitToMenu() {
        this.gameState = 'ready';
        this.pauseScreen.style.display = 'none';
        
        // 게임 루프 중단
        this.gameLoopRunning = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // 게임 상태 완전 초기화
        this.score = 0;
        this.level = 1;
        this.fallSpeed = 0.5; // 초기 속도로 리셋
        this.spawnTimer = 0;
        this.spawnInterval = 120; // 초기 스폰 간격으로 리셋
        this.fallingColumn = [];
        this.stackedTiles = [];
        
        // 게임 보드 초기화
        const gameBoard = document.querySelector('.game-board');
        const tiles = gameBoard.querySelectorAll('.tile');
        tiles.forEach(tile => tile.remove());
        
        // 파티클 초기화
        this.particles = [];
        const particles = gameBoard.querySelectorAll('.particle');
        particles.forEach(particle => particle.remove());
        
        // UI 업데이트
        this.updateScore();
        this.updateLevel();
        
        this.showMenu();
    }
}

// 전역 게임 인스턴스
let game;

function startGame() {
    console.log('Global startGame called, game instance:', game);
    if (game) {
        console.log('Starting game...');
        game.start();
    } else {
        console.log('Game not initialized yet, waiting...');
        // If game isn't initialized yet, wait a bit and try again
        setTimeout(() => {
            if (game) {
                console.log('Starting game after delay...');
                game.start();
            } else {
                console.error('Game failed to initialize');
                // Try initializing the game now
                try {
                    game = new HistoriaGame();
                    game.start();
                } catch (error) {
                    console.error('Failed to create game instance:', error);
                }
            }
        }, 100);
    }
}

function pauseGame() {
    if (game) {
        game.pause();
    }
}

function resumeGame() {
    if (game) {
        game.resume();
    }
}

function quitToMenu() {
    if (game) {
        game.quitToMenu();
    }
}

function restartGame() {
    if (game) {
        game.start();
    }
}

// 게임 초기화
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing game...');
    game = new HistoriaGame();
    console.log('Game initialized:', game);
});

// Fallback initialization if DOMContentLoaded already fired
if (document.readyState === 'loading') {
    // DOMContentLoaded hasn't fired yet
} else {
    // DOMContentLoaded has already fired
    console.log('DOM already loaded, initializing game immediately...');
    game = new HistoriaGame();
    console.log('Game initialized:', game);
}
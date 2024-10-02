const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

let player, objects, score, timer, gameInterval, objectInterval;
let gameRunning = false;
let highestScore = 0;
let powerActive = false;
let touchStartX = 0;
const touchThreshold = 2;
let characterType = 'square'; 
let powerCount = 0;
const loadingScreen = document.getElementById('loadingScreen');

const bgMusic = new Audio('assets/audios/bg-music.mp3');
const toySounds = [
    new Audio('assets/audios/toy-1.mp3'),
    new Audio('assets/audios/toy-2.mp3'),
    new Audio('assets/audios/toy-3.mp3')
];
const powerSound = new Audio('assets/audios/power.mp3');

document.getElementById('babaButton').addEventListener('click', () => selectCharacter('square'));
document.getElementById('anneButton').addEventListener('click', () => selectCharacter('triangle'));
document.getElementById('startButton').addEventListener('click', startGame);
document.getElementById('replayButton').addEventListener('click', startGame);
    document.getElementById('ui').style.display = 'flex';

const fallingImages = {
    normal_diaper: new Image(),
    molfix_diaper: new Image(),
    toy: new Image(),
    power: new Image()
};

// düşen nesnelerin kaynaklarını ayarlayın
fallingImages.normal_diaper.src = 'assets/images/normal-diaper.png';
fallingImages.molfix_diaper.src = 'assets/images/molfix-diaper.png';
fallingImages.toy.src = 'assets/images/toy.png';
fallingImages.power.src = 'assets/images/power.png';

fallingImages.normal_diaper.onload = fallingImages.molfix_diaper.onload = fallingImages.toy.onload = fallingImages.power.onload = function() {
    console.log('Images loaded');
};

const playerImages = {
    square: new Image(),
    triangle: new Image()
};

// oyuncu görsellerinin kaynaklarını ayarlayın
playerImages.square.src = 'assets/images/dad.png';
playerImages.triangle.src = 'assets/images/mom.png';

playerImages.triangle.onload = playerImages.square.onload = function() {
    console.log('Player images loaded');
};

class Player {
    constructor(type) {
        this.x = canvas.width / 2 - 25; // yeni genişlik için ayarlandı
        this.y = canvas.height - 100; // yeni yükseklik için ayarlandı
        this.speed = 10;
        this.type = type;

        // oyuncu görselinin boyutlarını ayarla
        this.width = 120;
        this.height = this.width * (playerImages[type].height / playerImages[type].width); // resim oranına göre yükseklik hesapla
    }

    draw() {
        if (this.type === 'square') {
            ctx.drawImage(playerImages.square, this.x, this.y, this.width, this.height);
        } else if (this.type === 'triangle') {
            ctx.drawImage(playerImages.triangle, this.x, this.y, this.width, this.height);
        }
    }

    move(direction) {
        if (direction === 'left' && this.x > 0) this.x -= this.speed;
        if (direction === 'right' && this.x < canvas.width - this.width) this.x += this.speed;
    }
}

function randomType() {
    const rand = Math.random();
    if (powerCount < 6 && rand < 0.05) { // %5 olasılıkla power, en fazla 3 kere
        powerCount++;
        return 'power';
    } else if (rand < 0.15) { // %10 olasılıkla toy
        return 'toy';
    } else if (rand < 0.45) { // %30 olasılıkla molfix_diaper
        return 'molfix_diaper';
    } else { // %55 olasılıkla normal_diaper
        return 'normal_diaper';
    }
}

class FallingObject {
    constructor() {
        this.x = Math.random() * (canvas.width - 60);
        this.y = 0;
        this.speed = 2 + Math.random() * 3;
        this.type = randomType();

        // Görselin boyutlarını ayarla
        if (this.type === 'normal_diaper') {
            this.width = fallingImages.normal_diaper.width;
            this.height = fallingImages.normal_diaper.height;
        } else if (this.type === 'molfix_diaper') {
            this.width = fallingImages.molfix_diaper.width;
            this.height = fallingImages.molfix_diaper.height;
        } else if (this.type === 'toy') {
            this.width = fallingImages.toy.width;
            this.height = fallingImages.toy.height;
        } else if (this.type === 'power') {
            this.width = fallingImages.power.width;
            this.height = fallingImages.power.height;
        }
    }

    draw() {
        if (this.type === 'normal_diaper') {
            ctx.drawImage(fallingImages.normal_diaper, this.x, this.y);
        } else if (this.type === 'molfix_diaper') {
            ctx.save();
            ctx.shadowBlur = 5;
            ctx.shadowColor = 'yellow';
            ctx.globalCompositeOperation = 'ligtten';
            ctx.drawImage(fallingImages.molfix_diaper, this.x, this.y);
            ctx.restore();
        } else if (this.type === 'toy') {
            ctx.drawImage(fallingImages.toy, this.x, this.y);
        } else if (this.type === 'power') {
            ctx.save();
            ctx.shadowBlur = 20;
            ctx.shadowColor = 'white';
            ctx.globalCompositeOperation = 'ligtten';
            ctx.drawImage(fallingImages.power, this.x, this.y);
            ctx.restore();
        }
    }

    update() {
        this.y += this.speed;
    }
}

function selectCharacter(type) {
    characterType = type;
    document.getElementById('babaButton').style.display = 'none';
    document.getElementById('anneButton').style.display = 'none';
    // document.getElementById('selectYourPlayer').style.display = 'none';
    document.getElementById('header').style.display = 'none';
    document.getElementById('startButton').style.display = 'block';
}

function startGame() {
    player = new Player(characterType);
    objects = [];
    score = 0;
    timer = 60;
    gameRunning = true;
    document.getElementById('startButton').style.display = 'none';
    document.getElementById('replayButton').style.display = 'none';
    document.getElementById('score').innerText = `Score: ${score}`;
    document.getElementById('timer').innerText = `Time: ${timer}`;
    document.getElementById('score').style.display = 'block';
    document.getElementById('timer').style.display = 'block';
    gameInterval = setInterval(gameLoop, 1000 / 60);
    objectInterval = setInterval(spawnObject, 1000);
    setTimeout(endGame, 60000);
    startTimer();
    bgMusic.play();
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    player.draw();
    objects.forEach(obj => {
        obj.update();
        obj.draw();
        if (obj.y > canvas.height) {
            objects.splice(objects.indexOf(obj), 1);
        }
        if (obj.y + obj.height > player.y && obj.x < player.x + player.width && obj.x + obj.width > player.x) {
            if (obj.type === 'normal_diaper') score += 10;
            else if (obj.type === 'molfix_diaper') score += 30;
            else if (obj.type === 'toy') playRandomToySound();
            else if (obj.type === 'power') {
                activatePower();
                powerSound.play();
            }
            objects.splice(objects.indexOf(obj), 1);
            document.getElementById('score').innerText = `Score: ${score}`;
        }
    });
}

function spawnObject() {
    const types = ['normal_diaper', 'molfix_diaper', 'toy', 'power'];
    const type = types[Math.floor(Math.random() * types.length)];
    objects.push(new FallingObject(type));
}

function startTimer() {
    const timerInterval = setInterval(() => {
        if (!gameRunning) {
            clearInterval(timerInterval);
            return;
        }
        timer--;
        document.getElementById('timer').innerText = `Time: ${timer}`;
        if (timer === 30) {
            document.body.style.backgroundColor = 'lightblue';
            increaseGameSpeed();
            increaseMusicSpeed();
        }
        if (timer <= 0) {
            clearInterval(timerInterval);
            endGame();
        }
    }, 1000);
}

function endGame() {
    clearInterval(gameInterval);
    clearInterval(objectInterval);
    gameRunning = false;
    if (score > highestScore) {
        highestScore = score;
        localStorage.setItem('highScore', highestScore);
        document.getElementById('highScore').innerText = `High Score: ${highestScore}`;
    }
    document.getElementById('finalScore').innerText = `Your score: ${score}`;
    document.getElementById('finalHighScore').innerText = `Highest score: ${highestScore}`;
    document.getElementById('endGameScreen').style.display = 'flex';
    document.getElementById('score').style.display = 'none';
    document.getElementById('timer').style.display = 'none';
    bgMusic.pause();
    bgMusic.currentTime = 0;
    bgMusic.playbackRate = 1.0; 
    resetObjectSpeeds()
}

document.getElementById('endGameReplayButton').addEventListener('click', () => {
    document.getElementById('endGameScreen').style.display = 'none';
    startGame();
});

function playRandomToySound() {
    const randomIndex = Math.floor(Math.random() * toySounds.length);
    toySounds[randomIndex].play();
}

function activatePower() {
    powerActive = true;
    player.speed *= 2;
    player.color = getRandomColor();
    setTimeout(() => {
        player.speed /= 2;
        player.color = 'blue';
        powerActive = false;
    }, 5000);
}

function getRandomColor() {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return `rgb(${r},${g},${b})`;
}

function increaseGameSpeed() {
    clearInterval(objectInterval);
    objectInterval = setInterval(spawnObject, 500);
}

function increaseMusicSpeed() {
    bgMusic.playbackRate = 1.5;
}

window.addEventListener('keydown', (e) => {
    if (!gameRunning) return;
    if (e.key === 'ArrowLeft') player.move('left');
    if (e.key === 'ArrowRight') player.move('right');
});

window.addEventListener('touchstart', (e) => {
    if (!gameRunning) return;
    touchStartX = e.touches[0].clientX;
});

window.addEventListener('touchmove', (e) => {
    if (!gameRunning) return;
    const touchEndX = e.touches[0].clientX;
    const touchDiff = touchEndX - touchStartX;

    if (Math.abs(touchDiff) > touchThreshold) {
        if (touchDiff > 0) {
            player.move('right');
        } else if (touchDiff < 0) {
            player.move('left');
        }
        touchStartX = touchEndX; // Yeni başlangıç noktasını güncelle
    }
});

window.addEventListener('touchend', (e) => {
    if (!gameRunning) return;
    touchStartX = 0; // Dokunma bittiğinde başlangıç noktasını sıfırla
});

// assetslerin yüklenmesini bekle
function checkAllAssetsLoaded() {
    const assets = [
        fallingImages.normal_diaper,
        fallingImages.molfix_diaper,
        fallingImages.toy,
        fallingImages.power,
        playerImages.square,
        playerImages.triangle,
        bgMusic,
        ...toySounds,
        powerSound
    ];

    const assetPromises = assets.map(asset => {
        return new Promise((resolve, reject) => {
            if (asset instanceof HTMLImageElement) {
                if (asset.complete) {
                    resolve();
                } else {
                    asset.onload = resolve;
                    asset.onerror = reject;
                }
            } else if (asset instanceof HTMLAudioElement) {
                if (asset.readyState >= 3) { // HAVE_FUTURE_DATA
                    resolve();
                } else {
                    asset.addEventListener('loadeddata', resolve, { once: true });
                    asset.onerror = reject;
                }
            }
        });
    });

    Promise.all(assetPromises)
        .then(hideLoadingScreen)
        .catch(error => {
            console.error('Asset loading failed:', error);
        });
}

function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.style.display = 'none';
    }
    document.getElementById('ui').style.display = 'flex';
}

checkAllAssetsLoaded();

function loadHighScore() {
    const savedHighScore = localStorage.getItem('highScore');
    if (savedHighScore !== null) {
        highestScore = parseInt(savedHighScore, 10);
        document.getElementById('highScore').innerText = `High Score: ${highestScore}`;
    }
}

// yüksek skoru yükle
window.onload = loadHighScore;
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
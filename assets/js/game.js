const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

let player, objects, score, timer, gameInterval, objectInterval;
let gameRunning = false;
let highestScore = 0;
let powerActive = false;
let touchStartX = 0;
const touchThreshold = 2;

const bgMusic = new Audio('assets/audios/bg-music.mp3');
const toySounds = [
    new Audio('assets/audios/toy-1.mp3'),
    new Audio('assets/audios/toy-2.mp3'),
    new Audio('assets/audios/toy-3.mp3')
];
const powerSound = new Audio('assets/audios/power.mp3');

let characterType = 'square'; 

document.getElementById('babaButton').addEventListener('click', () => selectCharacter('square'));
document.getElementById('anneButton').addEventListener('click', () => selectCharacter('triangle'));
document.getElementById('startButton').addEventListener('click', startGame);
document.getElementById('replayButton').addEventListener('click', startGame);

class Player {
    constructor(type) {
        this.x = canvas.width / 2;
        this.y = canvas.height - 50;
        this.width = 50;
        this.height = 50;
        this.speed = 5;
        this.color = 'blue';
        this.type = type;
    }

    draw() {
        ctx.fillStyle = this.color;
        if (this.type === 'square') {
            ctx.fillRect(this.x, this.y, this.width, this.height);
        } else if (this.type === 'triangle') {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + this.width / 2, this.y - this.height);
            ctx.lineTo(this.x + this.width, this.y);
            ctx.closePath();
            ctx.fill();
        }
    }

    move(direction) {
        if (direction === 'left' && this.x > 0) this.x -= this.speed;
        if (direction === 'right' && this.x < canvas.width - this.width) this.x += this.speed;
    }
}

class FallingObject {
    constructor(type) {
        this.x = Math.random() * (canvas.width - 30);
        this.y = 0;
        this.width = 30;
        this.height = 30;
        this.speed = 2 + Math.random() * 3;
        this.type = type;
    }

    draw() {
        if (this.type === 'diaper') {
            ctx.fillStyle = 'green';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        } else if (this.type === 'toy') {
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        } else if (this.type === 'laugh') {
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'power') {
            ctx.fillStyle = 'yellow';
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
            ctx.fill();
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
            if (obj.type === 'diaper') score += 10;
            else if (obj.type === 'toy') score += 30;
            else if (obj.type === 'laugh') playRandomToySound();
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
    const types = ['diaper', 'toy', 'laugh', 'power'];
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
        localStorage.setItem('highScore', highestScore); // Save high score to local storage
        document.getElementById('highScore').innerText = `High Score: ${highestScore}`; // Update high score display
    }
    document.getElementById('replayButton').style.display = 'block';
    alert(`Game Over! Your score is ${score}. Highest score: ${highestScore}`);
}

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

// Wait for all audio assets to load before hiding the loading screen
const audioAssets = [bgMusic, ...toySounds, powerSound];
let loadedAssets = 0;

audioAssets.forEach(audio => {
    audio.addEventListener('canplaythrough', () => {
        loadedAssets++;
        if (loadedAssets === audioAssets.length) {
            document.getElementById('loadingScreen').style.display = 'none';
            document.getElementById('ui').style.display = 'flex';
            loadHighScore(); 
        }
    }, { once: true });
});

function loadHighScore() {
    const savedHighScore = localStorage.getItem('highScore');
    if (savedHighScore !== null) {
        highestScore = parseInt(savedHighScore, 10);
        document.getElementById('highScore').innerText = `High Score: ${highestScore}`;
    }
}

// Load high score on page load
window.onload = loadHighScore;
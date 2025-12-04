const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const paddleHeight = 15;
const paddleWidth = 120;
let paddleX = (canvas.width - paddleWidth) / 2;

let rightPressed = false;
let leftPressed = false;

const ballRadius = 8;
let x = canvas.width / 2;
let y = canvas.height - 50;
let dx = 4;
let dy = -4;
const speedIncreaseFactor = 1.1;
const maxSpeed = 16;

const brickRowCount = 5;
const brickColumnCount = 10;
const brickWidth = 70;
const brickHeight = 20;
const brickPadding = 10;
const brickOffsetTop = 50;
const brickOffsetLeft = 35;

let score = 0;
let lives = 3;
let isRunning = true;

const bricks = [];
for (let c = 0; c < brickColumnCount; c++) {
  bricks[c] = [];
  for (let r = 0; r < brickRowCount; r++) {
    bricks[c][r] = { x: 0, y: 0, status: 1 };
  }
}

function keyDownHandler(e) {
  if (e.key === 'Right' || e.key === 'ArrowRight') {
    rightPressed = true;
  } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
    leftPressed = true;
  } else if (e.code === 'Space') {
    if (!isRunning) restartGame();
  }
}

function keyUpHandler(e) {
  if (e.key === 'Right' || e.key === 'ArrowRight') {
    rightPressed = false;
  } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
    leftPressed = false;
  }
}

document.addEventListener('keydown', keyDownHandler, false);
document.addEventListener('keyup', keyUpHandler, false);

function collisionDetection() {
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      const b = bricks[c][r];
      if (b.status === 1) {
        if (x > b.x && x < b.x + brickWidth && y > b.y && y < b.y + brickHeight) {
          dy = -dy;
          b.status = 0;
          score++;
          if (score === brickRowCount * brickColumnCount) {
            isRunning = false;
            showMessage('YOU WIN! 스페이스바로 다시 시작');
          }
        }
      }
    }
  }
}

function drawBall() {
  ctx.beginPath();
  ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
  ctx.fillStyle = '#ffdd55';
  ctx.fill();
  ctx.closePath();
}

function drawPaddle() {
  ctx.beginPath();
  ctx.rect(paddleX, canvas.height - paddleHeight - 10, paddleWidth, paddleHeight);
  ctx.fillStyle = '#33aaff';
  ctx.fill();
  ctx.closePath();
}

function drawBricks() {
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      if (bricks[c][r].status === 1) {
        const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
        const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
        bricks[c][r].x = brickX;
        bricks[c][r].y = brickY;

        ctx.beginPath();
        ctx.rect(brickX, brickY, brickWidth, brickHeight);
        ctx.fillStyle = '#66dd66';
        ctx.fill();
        ctx.closePath();
      }
    }
  }
}

function drawScore() {
  ctx.font = '16px Arial';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('Score: ' + score, 16, 24);
}

function drawLives() {
  ctx.font = '16px Arial';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('Lives: ' + lives, canvas.width - 90, 24);
}

function showMessage(text) {
  ctx.font = '28px Arial';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  ctx.textAlign = 'start';
}

function restartGame() {
  // reset ball
  x = canvas.width / 2;
  y = canvas.height - 50;
  dx = 4;
  dy = -4;
  // reset bricks
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      bricks[c][r].status = 1;
    }
  }
  score = 0;
  lives = 3;
  isRunning = true;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBricks();
  drawBall();
  drawPaddle();
  drawScore();
  drawLives();
  collisionDetection();

  if (!isRunning) {
    requestAnimationFrame(draw);
    return;
  }

  if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
    dx = -dx;
    dx *= speedIncreaseFactor;
    dy *= speedIncreaseFactor;
    dx = Math.max(Math.min(dx, maxSpeed), -maxSpeed);
    dy = Math.max(Math.min(dy, maxSpeed), -maxSpeed);
  }
  if (y + dy < ballRadius) {
    dy = -dy;
    dx *= speedIncreaseFactor;
    dy *= speedIncreaseFactor;
    dx = Math.max(Math.min(dx, maxSpeed), -maxSpeed);
    dy = Math.max(Math.min(dy, maxSpeed), -maxSpeed);
  } else if (y + dy > canvas.height - ballRadius - 10) {
    // paddle collision
    if (x > paddleX && x < paddleX + paddleWidth) {
      // change angle based on where it hits the paddle
      const hitPos = (x - (paddleX + paddleWidth / 2)) / (paddleWidth / 2);
      dx = 5 * hitPos;
      dy = -Math.abs(dy);
    } else if (y + dy > canvas.height - ballRadius) {
      // miss
      lives--;
      if (!lives) {
        isRunning = false;
        showMessage('GAME OVER 스페이스바로 다시 시작');
      } else {
        x = canvas.width / 2;
        y = canvas.height - 50;
        dx = 4;
        dy = -4;
        paddleX = (canvas.width - paddleWidth) / 2;
      }
    }
  }

  if (rightPressed && paddleX < canvas.width - paddleWidth) {
    paddleX += 7;
  } else if (leftPressed && paddleX > 0) {
    paddleX -= 7;
  }

  x += dx;
  y += dy;

  requestAnimationFrame(draw);
}

draw();

'use strict';

const MINE = '<img src="img/mine.png">';
const START = '😃';
const LOOSE = '🤯';
const WIN = '😎';
const LIVE = '💙';
const MARK = '🚩';
const HINT = '💡';
const SAFE = '🔓';

var gBoard;
var gIsFirstClick;
var gIsHintClick;
var gUndoBoard;
var gIsManual;
var gUserBoard;
var gMinesUserCount;
var gTimerInterval;
var gTimer;
var gAllMinesContain;
var gShownCellsCount;
var gElSmiley = document.querySelector('.smiley');
var gElTimer = document.querySelector('.timer span');
var gLevel = {
  level: 'Beginner',
  size: 4,
  mines: 2,
  bestTime: +localStorage.getItem('Beginner'),
};
var gGame = {
  isOn: false,
  shownCount: 0,
  markedCount: 0,
  secsPassed: 0,
  lives: 3,
  hints: 3,
  safeClick: 3,
};

function initGame() {
  gGame = {
    isOn: true,
    shownCount: 0,
    markedCount: 0,
    secsPassed: 0,
    lives: 3,
    hints: 3,
    safeClick: 3,
  };
  gIsFirstClick = true;
  gElSmiley.innerHTML = START;
  gIsHintClick = false;
  gUndoBoard = [];
  gAllMinesContain = [];
  gIsManual = false;
  gUserBoard = false;
  gMinesUserCount = 0;
  gShownCellsCount = 0;
  gTimer = 0;
  gElTimer.innerText = '0.000';
  var elBtn = document.querySelector('.btn-manually');
  elBtn.innerText = 'Manual board';
  gBoard = buildBoard();
  console.table(gBoard);
  renderBoard();
  livesLeft();
  hintsLeft();
  safeClickLeft();
  bestTimeShown();
}

function buildBoard() {
  var board = createBoard();
  for (var i = 0; i < board.length; i++) {
    for (var j = 0; j < board[i].length; j++) {
      var cell = {
        minesAroundCount: 0,
        isShown: false,
        isMine: false,
        isMarked: false,
      };
      board[i][j] = cell;
    }
  }
  return board;
}

function renderBoard() {
  var strHTML = '';
  for (var i = 0; i < gBoard.length; i++) {
    strHTML += '<tr>\n';
    for (var j = 0; j < gBoard[0].length; j++) {
      var currCell = gBoard[i][j];

      var cellClass = getClassName({ i: i, j: j });
      if (gIsManual || currCell.isShown) cellClass += ' revealed';
      else cellClass += ' unrevealed';
      strHTML += `\t<td class="cell ${cellClass}" oncontextmenu="cellMarked(this,${i},${j})" onclick="cellClicked(this,${i},${j})">\n`;
      if (currCell.isShown) {
        if (currCell.isMine) strHTML += MINE;
        if (!currCell.isMine)
          strHTML +=
            currCell.minesAroundCount === 0 ? '' : currCell.minesAroundCount;
      }
      if (currCell.isMarked) strHTML += MARK;
      strHTML += '\t</td>\n';
    }
    strHTML += '</tr>\n';
  }
  var elBoard = document.querySelector('.board');
  elBoard.innerHTML = strHTML;
}

function setMinesNegsCount(currI, currJ) {
  var minesCount = 0;
  for (var i = currI - 1; i <= currI + 1; i++) {
    if (i < 0 || i > gBoard.length - 1) continue;
    for (var j = currJ - 1; j <= currJ + 1; j++) {
      if (j < 0 || j > gBoard[0].length - 1) continue;
      // if (i === currI && j === currJ) continue;
      var cell = gBoard[i][j];
      if (cell.isMine) minesCount++;
    }
  }
  return minesCount;
}

function cellClicked(elCell, currI, currJ) {
  if (!gGame.isOn) return;
  if (!gIsFirstClick) saveUndoBoard();
  if (gIsFirstClick) startTimer();
  if (gBoard[currI][currJ].isMarked) return;
  if (gBoard[currI][currJ].isShown) return;
  if (gBoard[currI][currJ].isMine && !gIsHintClick && gLevel.mines !== 2) {
    gGame.lives--;
    livesLeft();
  }
  if (gIsFirstClick) {
    if (gIsManual) {
      if (gLevel.mines) gBoard[currI][currJ].isMine = true;
      elCell.innerHTML = MINE;
      gMinesUserCount++;
      gLevel.mines = gMinesUserCount;
      return;
    } else if (!gUserBoard) {
      addMines(currI, currJ);
    }
    gIsFirstClick = false;
    for (var i = 0; i < gBoard.length; i++) {
      for (var j = 0; j < gBoard[i].length; j++) {
        gBoard[i][j].minesAroundCount = setMinesNegsCount(i, j);
      }
    }
  }
  if (gIsHintClick && gGame.hints >= 0) {
    showHintNegs(currI, currJ, false);
    setTimeout(function () {
      showHintNegs(currI, currJ, true);
    }, 1000);
    gIsHintClick = false;
    return;
  }
  if (gBoard[currI][currJ].minesAroundCount === 0) {
    var shownCells = expandShown(gBoard, currI, currJ);
    gShownCellsCount = 0;
    gGame.shownCount += shownCells;
  } else {
    gGame.shownCount++;
  }
  gBoard[currI][currJ].isShown = true;
  renderBoard();
  checkGameOver(currI, currJ);
}

function cellMarked(elCell, i, j) {
  if (gIsFirstClick) return;
  if (!gGame.isOn) return;
  saveUndoBoard();
  if (gBoard[i][j].isShown) return;
  if (!gBoard[i][j].isMarked) {
    gGame.markedCount++;
    gBoard[i][j].isMarked = true;
    elCell.innerHTML = MARK;
  } else if (gBoard[i][j].isMarked) {
    gGame.markedCount--;
    gBoard[i][j].isMarked = false;
    elCell.innerHTML = '';
  }
  checkGameOver(i, j);
}

function checkGameOver(currI, currJ) {
  var revealedMinesCount = 0;
  if (
    gGame.lives === 0 ||
    (gLevel.size === 4 &&
      gBoard[currI][currJ].isMine &&
      gBoard[currI][currJ].isShown)
  ) {
    gGame.isOn = false;
    gElSmiley.innerHTML = LOOSE;
    openAllMines(currI, currJ);
  } else if (gBoard[currI][currJ].isMine && gBoard[currI][currJ].isShown) {
    revealedMinesCount++;
  }
  if (gGame.shownCount >= gLevel.size * gLevel.size - gLevel.mines) {
    if (gLevel.mines - revealedMinesCount === gGame.markedCount) {
      gElSmiley.innerHTML = WIN;
      gGame.isOn = false;
    }
  }
  if (gElSmiley.innerHTML !== START) {
    clearInterval(gTimerInterval);
    gTimerInterval = null;
    if (!gLevel.bestTime || gGame.secsPassed <= gLevel.bestTime)
      bestScore(gGame.secsPassed, gLevel.level);
    return;
  }
}

function expandShown(board, currI, currJ) {
  for (var i = currI - 1; i <= currI + 1; i++) {
    if (i < 0 || i > board.length - 1) continue;
    for (var j = currJ - 1; j <= currJ + 1; j++) {
      if (j < 0 || j > board[0].length - 1) continue;
      var cell = board[i][j];
      if (!cell.isShown && !cell.isMarked) {
        gShownCellsCount++;
        cell.isShown = true;
        if (board[i][j].minesAroundCount === 0) {
          expandShown(board, i, j);
        }
      }
    }
  }
  return gShownCellsCount;
}

function addMines(firstI, firstJ) {
  gAllMinesContain = [];
  var emptyCells = getEmptyCells(firstI, firstJ);
  for (var i = 0; i < gLevel.mines; i++) {
    var idx = getRandomInt(0, emptyCells.length);
    var emptyCell = emptyCells[idx];
    gAllMinesContain.push(emptyCell);
    emptyCells.splice(idx, 1);
    gBoard[emptyCell.i][emptyCell.j].isMine = true;
  }
  console.log(gAllMinesContain);
}

function getEmptyCells(firstI, firstJ) {
  var emptyCells = [];
  for (var i = 0; i < gBoard.length; i++) {
    var row = gBoard[i];
    for (var j = 0; j < row.length; j++) {
      if (i === firstI && j === firstJ) continue;
      emptyCells.push({ i: i, j: j });
    }
  }
  for (var i = firstI - 1; i <= firstI + 1; i++) {
    if (i < 0 || i > gBoard.length - 1) continue;
    for (var j = firstJ - 1; j <= firstJ + 1; j++) {
      if (j < 0 || j > gBoard[0].length - 1) continue;
      if (i === firstI && j === firstJ) continue;
      for (var k = 0; k < emptyCells.length; k++) {
        var emptyCell = emptyCells[k];
        if (i === emptyCell.i && j === emptyCell.j) {
          emptyCells.splice(k, 1);
        }
      }
    }
  }
  return emptyCells;
}

function boardLevel(level) {
  if (level === 'Beginner') {
    console.log(level);
    gLevel.level = level;
    gLevel.size = 4;
    gLevel.mines = 2;
    gLevel.bestTime = localStorage.getItem('Beginner');
  } else if (level === 'Medium') {
    gLevel.level = level;
    gLevel.size = 8;
    gLevel.mines = 12;
    gLevel.bestTime = localStorage.getItem('Medium');
  } else if (level === 'Expert') {
    gLevel.level = level;
    gLevel.size = 12;
    gLevel.mines = 30;
    gLevel.bestTime = localStorage.getItem('Expert');
  }
  clearInterval(gTimerInterval);
  gTimerInterval = null;
  initGame();
}

function livesLeft() {
  var elLives = document.querySelector('.lives');
  if (gGame.lives === 3) {
    elLives.innerHTML = LIVE + LIVE + LIVE;
  } else if (gGame.lives === 2) {
    elLives.innerHTML = LIVE + LIVE;
  } else if (gGame.lives === 1) {
    elLives.innerHTML = LIVE;
  } else {
    elLives.innerHTML = '';
  }
  return;
}

function hintsLeft() {
  var elHints = document.querySelector('.hints');
  if (gGame.hints === 3) {
    elHints.innerText = `${HINT}\n ${HINT}\n ${HINT}`;
  } else if (gGame.hints === 2) {
    elHints.innerText = `${HINT}\n ${HINT}`;
  } else if (gGame.hints === 1) {
    elHints.innerText = `${HINT}`;
  } else {
    elHints.innerText = '';
  }
}

function getHint() {
  if (gIsFirstClick) return;
  if (!gIsHintClick) {
    gIsHintClick = true;
    gGame.hints--;
    hintsLeft();
  }
}

function showHintNegs(currI, currJ, isHide) {
  for (var i = currI - 1; i <= currI + 1; i++) {
    if (i < 0 || i > gBoard.length - 1) continue;
    for (var j = currJ - 1; j <= currJ + 1; j++) {
      if (j < 0 || j > gBoard[0].length - 1) continue;
      // if (gBoard[i][j].isShown) continue;
      var elCell = document.querySelector(`.cell-${i}-${j}`);
      if (!elCell.classList.contains('revealed') && !gBoard[i][j].isMarked) {
        gBoard[i][j].isShown = !isHide ? true : false;
        if (isHide) {
          elCell.classList.toggle('unrevealed');
        } else {
          elCell.classList.toggle('unrevealed');
        }
        if (gBoard[i][j].isShown) {
          if (gBoard[i][j].isMine) {
            elCell.innerHTML = MINE;
          }
          if (!gBoard[i][j].isMine)
            elCell.innerHTML =
              gBoard[i][j].minesAroundCount === 0
                ? ''
                : gBoard[i][j].minesAroundCount;
        } else {
          elCell.innerHTML = ' ';
        }
      }
    }
  }
}

function safeClickLeft() {
  var elSafeClick = document.querySelector('.safeClick');
  if (gGame.safeClick === 3) {
    elSafeClick.innerText = `${SAFE}\n ${SAFE}\n ${SAFE}`;
  } else if (gGame.safeClick === 2) {
    elSafeClick.innerText = `${SAFE}\n ${SAFE}`;
  } else if (gGame.safeClick === 1) {
    elSafeClick.innerText = `${SAFE}`;
  } else {
    elSafeClick.innerHTML = '';
  }
}

function getSafeClick() {
  if (gIsFirstClick) return;
  if (!gGame.isOn) return;
  if (!gGame.safeClick) return;
  var safeCell = getSafeCell();
  console.log(safeCell);
  gBoard[safeCell.i][safeCell.j].isShown = true;
  var cellClass = getClassName(safeCell);
  var elCell = document.querySelector(`.${cellClass}`);
  elCell.classList.remove('unrevealed');
  elCell.classList.add('revealed');
  elCell.innerHTML =
    gBoard[safeCell.i][safeCell.j].minesAroundCount === 0
      ? ''
      : gBoard[safeCell.i][safeCell.j].minesAroundCount;
  setTimeout(function () {
    gBoard[safeCell.i][safeCell.j].isShown = false;
    elCell.innerHTML = '';
    elCell.classList.remove('revealed');
    elCell.classList.add('unrevealed');
  }, 1000);
  gGame.safeClick--;
  safeClickLeft();
}

function getSafeCell() {
  var safeCells = getSafeCells();
  var idx = getRandomInt(0, safeCells.length);
  var safeCell = safeCells[idx];
  return safeCell;
}

function getSafeCells() {
  var safeCells = [];
  for (var i = 0; i < gBoard.length; i++) {
    for (var j = 0; j < gBoard[i].length; j++) {
      if (
        gBoard[i][j].minesAroundCount >= 0 &&
        !gBoard[i][j].isShown &&
        !gBoard[i][j].isMine
      ) {
        safeCells.push({ i: i, j: j });
      }
    }
  }
  return safeCells;
}

function getUndo() {
  if (!gGame.isOn) return;
  if (gUndoBoard.length === 0) {
    alert('you dont have more undo');
    return;
  }
  var prevBoard = gUndoBoard.pop();
  gBoard = prevBoard.board;
  gGame.lives = prevBoard.lives;
  gGame.shownCount = prevBoard.shownCount;
  gGame.markedCount = prevBoard.markedCount;
  gIsFirstClick = prevBoard.firstClick;
  renderNewBoard();
}

function copyBoard(board) {
  var newBoard = [];
  for (var i = 0; i < board.length; i++) {
    var row = [];
    for (var j = 0; j < board[i].length; j++) {
      var newCell = Object.assign({}, board[i][j]);
      row.push(newCell);
    }
    newBoard.push(row);
  }
  return newBoard;
}

function saveUndoBoard() {
  gUndoBoard.push({
    board: copyBoard(gBoard),
    lives: gGame.lives,
    shownCount: gGame.shownCount,
    markedCount: gGame.markedCount,
  });
}

function renderNewBoard() {
  livesLeft();
  renderBoard();
}

function manuallyPosMines(elBtn) {
  if (!gIsFirstClick) return;
  if (!gIsManual) {
    gIsManual = true;
    gUserBoard = true;
    elBtn.innerText = 'Ready?';
    elBtn.style.backgroundColor = `#ff4141`;
  } else {
    gIsManual = false;
    elBtn.innerText = `Let's Go`;
    elBtn.style.backgroundColor = `#30d838`;
  }
  renderBoard();
}

function bestTimeShown() {
  var elBeginnerSpan = document.querySelector('.Beginner span');
  var elMediumSpan = document.querySelector('.Medium span');
  var elExpertSpan = document.querySelector('.Expert span');
  elBeginnerSpan.innerHTML = localStorage.getItem('Beginner')
    ? localStorage.getItem('Beginner')
    : 0;
  elMediumSpan.innerHTML = localStorage.getItem('Medium')
    ? localStorage.getItem('Medium')
    : 0;
  elExpertSpan.innerHTML = localStorage.getItem('Expert')
    ? localStorage.getItem('Expert')
    : 0;
}

function bestScore(secsPassed, level) {
  var time =
    gElSmiley.innerHTML === WIN ? secsPassed : localStorage.getItem(`${level}`);
  localStorage.setItem(`${level}`, `${+time}`);
  var elSpan = document.querySelector(`.${level} span`);
  elSpan.innerHTML = localStorage.getItem(`${level}`);
}

function startTimer() {
  if (gIsManual) return;
  gTimerInterval = setInterval(function () {
    gTimer += 0.01;
    gElTimer.innerText = gTimer.toFixed(3);
    gGame.secsPassed = gTimer.toFixed(3);
  }, 10);
}

function openAllMines(currI, currJ) {
  var className = getClassName({ i: currI, j: currJ });
  var elCell = document.querySelector(`.${className}`);
  elCell.classList.add('touchMine');
  for (var i = 0; i < gAllMinesContain.length; i++) {
    var cellMine = gAllMinesContain[i];
    var className = getClassName({ i: cellMine.i, j: cellMine.j });
    if (gBoard[cellMine.i][cellMine.j].isShown !== true) {
      gBoard[cellMine.i][cellMine.j].isShown = true;
      var elCell = document.querySelector(`.${className}`);
      elCell.classList.remove('unrevealed');
      elCell.classList.add('revealed');
      elCell.innerHTML = MINE;
    }
  }
}

function openModal() {
  var elModal = document.querySelector('.modal');
  elModal.classList.remove('hidden');
  var elOverLay = document.querySelector('.overlay');
  elOverLay.classList.remove('hidden');
}

function closeModal(elBtn) {
  elBtn.classList.add('hidden');
  var elOverLay = document.querySelector('.overlay');
  elOverLay.classList.add('hidden');
}

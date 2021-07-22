'use strict';

//canceled contextmenu event pop on html
window.addEventListener('contextmenu', e => e.preventDefault());

function createBoard() {
  var board = [];
  for (var i = 0; i < gLevel.size; i++) {
    var row = [];
    for (var j = 0; j < gLevel.size; j++) {
      row.push('');
    }
    board.push(row);
  }
  return board;
}

function getClassName(location) {
  var cellClass = 'cell-' + location.i + '-' + location.j;
  return cellClass;
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}

function renderCell(location, value) {
  var cellSelector = '.' + getClassName(location);
  var elCell = document.querySelector(cellSelector);
  elCell.innerHTML = value;
}

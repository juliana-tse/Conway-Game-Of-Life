const ws = new WebSocket("ws://localhost:3030");
var clientColor;

ws.onmessage = function incoming(message) {
  var json = JSON.parse(message.data);
  if (json.type == "color") {
    window.clientColor = json.value;
    alert(
      "Please select the cells within 5 secs (the board will be frozen for cells selection)"
    );
  } else if (json.type == "cellColors") updateGrid(json.value);
  else if (json.type == "patternCells") {
    updateGrid(json.value);
    ws.send(JSON.stringify({ type: "next", color: window.clientColor }));
  } else console.log("Unrecognized message from server");
};

const blinker = () =>
  ws.send(
    JSON.stringify({
      type: "pattern",
      pattern: "blinker",
      color: window.clientColor
    })
  );
const block = () =>
  ws.send(
    JSON.stringify({
      type: "pattern",
      pattern: "block",
      color: window.clientColor
    })
  );
const glider = () =>
  ws.send(
    JSON.stringify({
      type: "pattern",
      pattern: "glider",
      color: window.clientColor
    })
  );

const updateGrid = cellColors => {
  var x = document.body.getElementsByClassName("grid");
  for (r = 0; r < 20; ++r) {
    for (c = 0; c < 20; ++c) {
      x[0].rows[r].cells[c].style.backgroundColor = cellColors[r * 20 + c];
    }
  }
};

var onClickTimeout;

const clickableGrid = (rows, cols, callback) => {
  var i = 0;
  var grid = document.createElement("table");
  grid.className = "grid";
  for (var r = 0; r < rows; ++r) {
    var tr = grid.appendChild(document.createElement("tr"));
    for (var c = 0; c < cols; ++c) {
      var cell = tr.appendChild(document.createElement("td"));
      var i = r * 20 + c;
      cell.addEventListener(
        "click",
        (function(el, i) {
          return function() {
            callback(el, i);
          };
        })(cell, i),
        false
      );
    }
  }
  return grid;
};

var grid = clickableGrid(20, 20, function(el, i) {
  clearTimeout(onClickTimeout);
  el.style.backgroundColor = window.clientColor;
  ws.send(
    JSON.stringify({ type: "click", cellIndex: i, color: window.clientColor })
  );
  setTimeout(
    () => ws.send(JSON.stringify({ type: "next", color: window.clientColor })),
    5000
  );
});

document.getElementById("grid-div").appendChild(grid);

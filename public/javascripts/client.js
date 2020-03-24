const ws = new WebSocket("ws://localhost:3030");
var clientColor;
ws.onmessage = function incoming(message) {
  var json = JSON.parse(message.data);
  if (json.type == "color") {
    // console.log(json);
    window.clientColor = json.value;
  } else if (json.type == "cellColors") updateGrid(json.value);
  else console.log("Unrecognized message from server");
  // console.log("message");
  console.log(json.value);
};

function updateGrid(cellColors) {
  var x = document.body.getElementsByClassName("grid");
  for (r = 0; r < 20; ++r) {
    for (c = 0; c < 20; ++c) {
      x[0].rows[r].cells[c].style.backgroundColor = cellColors[r * 20 + c - 1];
    }
  }
}

var grid = clickableGrid(20, 20, function(el, row, col, i) {
  // console.log("You clicked on element:", el);
  // console.log("You clicked on row:", row);
  // console.log("You clicked on col:", col);
  // console.log("You clicked on item #:", i);
  el.style.backgroundColor = window.clientColor;
  ws.send(i);
});

document.body.appendChild(grid);

function clickableGrid(rows, cols, callback) {
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
        (function(el, r, c, i) {
          return function() {
            callback(el, r, c, i);
          };
        })(cell, r, c, i),
        false
      );
    }
  }
  return grid;
}

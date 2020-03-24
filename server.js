const express = require("express");
const WebSocket = require("ws");

const PORT = process.env.PORT || 3030;
const INDEX = "/public/index.html";
const app = express();

const server = app
  .use(express.static("public"))
  .get("/", (req, res) => res.sendFile(INDEX, { root: __dirname }))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const wss = new WebSocket.Server({ server });

wss.getUniqueID = function() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + "-" + s4();
};

var gameTimeout;
var messageRecv = false;
// use array of cell colors
// initialize all cell colors as white
const cellColors = Array.apply(null, Array(400)).map(_ => "#FFFFFF");
wss.on("connection", ws => {
  console.log("Client connected");
  // when new user has chosen the cells
  ws.id = wss.getUniqueID();
  ws.color = generateRandomColor();
  wss.clients.forEach(function each(client) {
    console.log("Client.ID: " + client.id);
    console.log("Client.Color: " + client.color);
  });
  ws.send(JSON.stringify({ type: "color", value: ws.color }));
  ws.send(JSON.stringify({ type: "cellColors", value: cellColors }));
  ws.on("message", function(message) {
    clearTimeout(gameTimeout);
    const cellNumber = message;
    cellColors[cellNumber - 1] = ws.color;
    ws.send(JSON.stringify({ type: "cellColors", value: cellColors }));
    messageRecv = true;
    console.log("messageRecv: ", messageRecv);
    gameTimeout = setTimeout(() => {
      nextGeneration(ws.color);
      console.log("server send cellColors waiting for next onclick");
      ws.send(JSON.stringify({ type: "cellColors", value: cellColors }));
    }, 1000);
  });
  console.log("messageRecvAfter: ", messageRecv);
  //   console.log("no more onclicks");
  if (messageRecv) {
    console.log("messageRecv is true");
    setInterval(() => {
      nextGeneration(ws.color);
      console.log("server send cellColors after no onclick");
      ws.send(JSON.stringify({ type: "cellColors", value: cellColors }));
    }, 1000);
  }
  // remove client info when it is disconnected
  ws.on("close", () => console.log("Client disconnected"));
});

// generate random color
function generateRandomColor() {
  var color =
    "#" + (0x1000000 + Math.random() * 0xffffff).toString(16).substr(1, 6);
  return color;
}

function isAlive(cellNumber) {
  return cellColors[cellNumber - 1] !== "#FFFFFF";
}

function neighbours(row, col) {
  // out of boundary condition
  var count = 0;
  // left upper
  if (isAlive(cellColors[(row - 1) * 20 + col - 1])) count += 1;
  // upper
  if (isAlive(cellColors[(row - 1) * 20 + col])) count += 1;
  // right upper
  if (isAlive(cellColors[(row - 1) * 20 + col + 1])) count += 1;
  // left
  if (isAlive(cellColors[row * 20 + (col - 1)])) count += 1;
  // right
  if (isAlive(cellColors[row * 20 + col + 1])) count += 1;
  // left lower
  if (isAlive(cellColors[(row + 1) * 20 + col - 1])) count += 1;
  // lower
  if (isAlive(cellColors[(row + 1) * 20 + col])) count += 1;
  // right lower
  if (isAlive(cellColors[(row + 1) * 20 + col + 1])) count += 1;
  //   console.log(count);
  return count;
}

// generate next generation
function nextGeneration(color) {
  for (r = 0; r < 20; ++r) {
    for (c = 0; c < 20; ++c) {
      const cellIndex = r * 20 + c;
      if (!isAlive(cellIndex) && neighbours(r, c) == 3) {
        console.log("case 1");
        cellColors[cellIndex - 1] = color;
      } else if (
        isAlive(cellIndex) &&
        (neighbours(r, c) < 2 || neighbours(r, c) > 3)
      ) {
        console.log("case 2");
        cellColors[cellIndex - 1] = "#FFFFFF";
      }
    }
  }
}

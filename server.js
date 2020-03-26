const express = require("express");
const WebSocket = require("ws");
const _ = require("lodash");

const PORT = process.env.PORT || 3030;
const INDEX = "/public/index.html";
const app = express();
const white = "rgb(255,255,255)";

const server = app
  .use(express.static("public"))
  .get("/", (req, res) => res.sendFile(INDEX, { root: __dirname }))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const wss = new WebSocket.Server({ server });

wss.getUniqueID = () => {
  const s4 = () => {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  };
  return s4() + s4() + "-" + s4();
};

// initialize all cell colors as white
const cellColors = Array.apply(null, Array(400)).map(_ => white);
var gameHasStarted = false;
wss.on("connection", ws => {
  console.log("Client connected");
  // when new user has chosen the cells
  ws.id = wss.getUniqueID();
  ws.color = generateRandomColor();
  wss.clients.forEach(client => {
    console.log("Client.ID: " + client.id);
    console.log("Client.Color: " + client.color);
  });
  ws.send(
    JSON.stringify({
      type: "color",
      value: ws.color,
      gameStarted: gameHasStarted
    })
  );
  ws.send(JSON.stringify({ type: "cellColors", value: cellColors }));
  ws.on("message", message => {
    var jsonMsg = JSON.parse(message);
    switch (jsonMsg.type) {
      case "next":
        // inform all clients that the game has started
        wss.clients.forEach(client =>
          client.send(JSON.stringify({ type: "started" }))
        );
        gameHasStarted = true;
        setInterval(() => {
          nextGeneration();
          produceNextGrid();
          wss.clients.forEach(client =>
            client.send(
              JSON.stringify({ type: "cellColors", value: cellColors })
            )
          );
        }, 1000);
        break;
      case "pattern":
        var emptyCellIndex = cellColors.findIndex(color => color === white);
        switch (jsonMsg.pattern) {
          case "blinker":
            blinker(jsonMsg.color, emptyCellIndex);
            break;
          case "block":
            block(jsonMsg.color, emptyCellIndex);
            break;
          case "glider":
            glider(jsonMsg.color, emptyCellIndex);
            break;
        }
      default:
        cellColors[jsonMsg.cellIndex] = jsonMsg.color;
        wss.clients.forEach(client =>
          client.send(JSON.stringify({ type: "cellColors", value: cellColors }))
        );
    }
  });
  ws.on("close", () => console.log("Client disconnected"));
});

// blinker
const blinker = (color, emptyCellIndex) => {
  // modify emptyCellIndex to make it valid as a cell in blinker
  if (emptyCellIndex % 20 === 0) emptyCellIndex++;
  if (emptyCellIndex % 20 === 19) emptyCellIndex--;
  cellColors[emptyCellIndex] = color;
  const secondCellIndex =
    emptyCellIndex - 20 >= 0 ? emptyCellIndex - 20 : emptyCellIndex + 40;
  cellColors[secondCellIndex] = color;
  const thirdCellIndex =
    emptyCellIndex + 20 <= 399 ? emptyCellIndex + 20 : emptyCellIndex - 40;
  cellColors[thirdCellIndex] = color;
};

// block
const block = (color, emptyCellIndex) => {
  // determine the direction of expansion of block
  const negateC = emptyCellIndex % 20 < 19 ? 1 : -1;
  const negateR = emptyCellIndex - 20 < 0 ? 1 : -1;
  for (r = 0; r < 2; r++) {
    for (c = 0; c < 2; c++) {
      cellColors[emptyCellIndex + negateR * r * 20 + c * negateC] = color;
    }
  }
};

// glider
const glider = (color, emptyCellIndex) => {
  // modify emptyCellIndex to make it valid as (1,1) cell in glider
  if (emptyCellIndex % 20 > 17) {
    emptyCellIndex -= 2;
  }
  if (emptyCellIndex + 40 > 399) {
    emptyCellIndex -= 40;
  }
  // 1,1
  cellColors[emptyCellIndex] = color;
  // 2,2
  cellColors[emptyCellIndex + 21] = color;
  // 3,2
  cellColors[emptyCellIndex + 41] = color;
  // 1,3
  cellColors[emptyCellIndex + 2] = color;
  // 2,3
  cellColors[emptyCellIndex + 22] = color;
};

// generate random color
function generateRandomColor() {
  var randomRGB = [];
  for (i = 0; i < 3; i++) {
    randomRGB.push(Math.floor(Math.random() * 256));
  }
  const color = `rgb(${randomRGB.join(",")})`;
  return color;
}

const isAlive = cellNumber => cellColors[cellNumber] !== white;

// calculate color average
const colorAverage = colors => {
  return (
    "rgb(" +
    _.zip
      .apply(
        null,
        colors.map(rgb => rgb.match(/\d+/g).map(d => parseInt(d)))
      )
      .map(d => ~~(d.reduce((acc, curr) => acc + curr, 0) / 3))
      .join(",") +
    ")"
  );
};

// get number of neighbours and average color
const neighbours = (row, col) => {
  var count = 0;
  var neighbourColorList = [];
  // left upper
  if (isAlive((row - 1) * 20 + col - 1) && row > 0 && col > 0) {
    count++;
    neighbourColorList.push(cellColors[(row - 1) * 20 + col - 1]);
  }
  // upper
  if (isAlive((row - 1) * 20 + col) && row > 0) {
    count++;
    neighbourColorList.push(cellColors[(row - 1) * 20 + col]);
  }
  // right upper
  if (isAlive((row - 1) * 20 + col + 1) && row > 0 && col < 19) {
    count++;
    neighbourColorList.push(cellColors[(row - 1) * 20 + col + 1]);
  }
  // left
  if (isAlive(row * 20 + (col - 1)) && col > 0) {
    count++;
    neighbourColorList.push(cellColors[row * 20 + (col - 1)]);
  }
  // right
  if (isAlive(row * 20 + col + 1) && col < 19) {
    count++;
    neighbourColorList.push(cellColors[row * 20 + col + 1]);
  }
  // left lower
  if (isAlive((row + 1) * 20 + col - 1) && row < 19 && col > 0) {
    count++;
    neighbourColorList.push(cellColors[(row + 1) * 20 + col - 1]);
  }
  // lower
  if (isAlive((row + 1) * 20 + col) && row < 19) {
    count++;
    neighbourColorList.push(cellColors[(row + 1) * 20 + col]);
  }
  // right lower
  if (isAlive((row + 1) * 20 + col + 1) && row < 19 && col < 19) {
    count++;
    neighbourColorList.push(cellColors[(row + 1) * 20 + col + 1]);
  }
  // find average of colors
  const averageColor = count === 3 ? colorAverage(neighbourColorList) : "";
  return { count, averageColor };
};

var cellsToBeModified = [];
// generate next generation
const nextGeneration = () => {
  for (r = 0; r < 20; ++r) {
    for (c = 0; c < 20; ++c) {
      const cellIndex = r * 20 + c;
      const { count, averageColor } = neighbours(r, c);
      if (!isAlive(cellIndex) && count === 3) {
        cellsToBeModified.push({
          cellIndex: cellIndex,
          color: averageColor
        });
      } else if (isAlive(cellIndex) && (count < 2 || count > 3))
        cellsToBeModified.push({
          cellIndex: cellIndex,
          color: white
        });
    }
  }
};

const produceNextGrid = () => {
  cellsToBeModified.forEach(cellObject =>
    cellColors.splice(cellObject.cellIndex, 1, cellObject.color)
  );
  cellsToBeModified = [];
};

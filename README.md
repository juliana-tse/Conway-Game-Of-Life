# Conway's Game Of Life

### Description

This project implements a web version of a multiplayer game that simulates the [Conway's Game Of Life](https://en.wikipedia.org/wiki/Conway's_Game_of_Life).

### Rules

1.  A player could only join the game when the game has not started, otherwise he/she could only wait until the game is finished.
2.  Each player is assigned a random color when they joined the game.
3.  The player could choose the cells on the grid or any predefined patterns shown in the toolbar.
4.  The game will be started when any of the online players clicked 'Start'.
5.  If any dead cell has 3 neighbours, the color of the cell in the next generation will be the average color of its neighbour cells, by calculating the average of r, g and b values of the colors that are in rgb format.
6.  The next generation of the cells depend on the following 4 simple rules:
    - Any live cell with fewer than two live neighbors dies, as if caused by under-population.
    - Any live cell with two or three live neighbors lives on to the next generation.
    - Any live cell with more than three live neighbors dies, as if by overcrowding.
    - Any dead cell with exactly three live neighbors becomes a live cell, as if by reproduction.

### Deploy and Run the game

#### Local Environment

1.  Run `npm install` to install the necessary dependencies from `package.json`.
2.  Run `npm start`.

#### Hosted Application in Heroku

This game is hosted in Heroku as https://glacial-wave-31247.herokuapp.com/.

### Reasons behind technical choices

- WebSocket is used in this game for establishing TCP connection between server and client as it can maintain continuous connection between client and server, and can send messages between client and server easily at any time.
- Client functions are included in `client.js` with handling of incoming TCP messages from server.
- In order to identify the incoming messages, `type` is used with other parameters to form an object, and the function that will the client will be directed to will be determined by the `type` value.
- The grid of cells is implemented using Javascript instead of explicitly implementing it in HTML for precise codes and better function handling.

### More features to be added if time allows

- Restart button for restarting the game.
- More predefined pattern options.
- Better handling when client is disconnected.
- Test for more modern browsers.

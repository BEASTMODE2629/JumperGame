const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const port = process.env.PORT || 1337;
//const garageServer = require('garageServer.io');

let players = {};
let coins = {};
let coinID = 0;

server.listen(port, () => console.log('Example app listening on port ' + port + '!'));
app.use(express.static('game/build')); //server static content from game (so you can go to the site and load the game)

io.on('connection', (socket) => {
  console.log("connection from " + socket.id);
  socket.on('updatePlayer', (data) => {
    //update player information
    if(players[socket.id] === undefined)
      players[socket.id] = { x:data.x, y:data.y, lastUpdate: Date.now(), score: 0};
    else{
      players[socket.id].x = data.x;
      players[socket.id].y = data.y;
      players[socket.id].lastUpdate = Date.now();
    }
    if(players[socket.id].score === undefined)
      players[socket.id].score = 0;
    checkCoinCollision(players[socket.id]);
  });
  socket.on('disconnect', () => {
    delete players[socket.id];
  });
});

//heartbeet
setInterval(()=>{
  let gameData = {};
  //removeInactivePlayers();
  updateCoins();
  gameData.players = players;
  gameData.coins = coins;
  console.log(gameData);
  io.sockets.emit('updateAllPlayers', gameData);
}, 100);

function removeInactivePlayers()
{
  for(let key of Object.keys(players))
  {
    let currPlayer = players[key];
    if(Date.now() - currPlayer.lastUpdate > 1000 * 10)
    {
      delete players[key];
    }
  }
}

function updateCoins()
{
  let randInt = Math.floor(Math.random() * 100);
  if(Object.keys(coins).length === 0 || randInt === 0 && Object.keys(coins).length < 3)
  {
    let randX = Math.floor(Math.random() * 900) + 50;
    coins[coinID++] = {x: randX, y: -100};
  }
  for(let k in coins)
  {
    coins[k].y += 10; //fall down at constant speed
    if(coins[k].y > 600)
      delete coins[k];
  }
}

function checkCoinCollision(player)
{
  let removeKey;
  for(let k of Object.keys(coins))
  {
    let c = coins[k];
    if(Math.abs(player.x - c.x) < 85 && (Math.abs(player.y - c.y) < 50 || player.y - 70 - c.y < 50)) //50px from center
    {
      player.score += 100;
      delete coins[k];
      break;
    }
  }
}

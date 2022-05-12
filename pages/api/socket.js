

//Utility/World building functions
const clamp = (n, lo, hi) => n < lo ? lo : n > hi ? hi : n;
const getRandomBetween = (min, max) => {
  return Math.floor(Math.random() * (max-min) + min);
}

//Takes in the MAPENTITIES division corresponding to the room that called the function
const buildGameWorld = (roomENTITIES) => {
    createManyPlatforms(roomENTITIES, 1000, 0, map.height);
    createFloorPlatforms(roomENTITIES);
}

const createManyPlatforms = (arr, num, start, end) => {
  let prevBox = null;
  let i = 0;
  let fakeBox = {x: 0, y:start}
  for (i = 0; i < num; i++)
  {
    (!prevBox) ? prevBox = createRandomPlatform(fakeBox, 0, 1) : prevBox = (createRandomPlatform(prevBox, 0, 1))
    if (prevBox.y > end)
    {
      break;
    }
    arr.push(prevBox);
  }
}

const createRandomPlatform = (prevBox, limits, type) => {
  if (type === 1) 
  {
    let randlocale = {
      y: getRandomBetween(prevBox.y + 100, prevBox.y + 200),
      x: getRandomBetween(0, canvas.width)
    };
    return new Box(randlocale.x, randlocale.y, canvas.width/10, "red", map);
  }
}

const createFloorPlatforms = (arr) => {
  let prevBox = {x: 0, y: canvas.height-800, xsize: canvas.width/10};
  let curr_x = 0;
  while (curr_x < canvas.width+80)
  {
    prevBox = new Box(curr_x, map.height-canvas.width/10, canvas.width/10, "red", map);
    arr.push(prevBox);
    curr_x = prevBox.x + prevBox.xsize;
  }
}

const Voxel = function (x, y, angle, size, color, map, canvas, id) {
    this.id =id;
    this.x = x;
    this.y = y;
    this.canvas = canvas;
    this.maxy = this.y + canvas.height/2 + this.size/2;
    this.miny = y;
    this.viewportY = 0
    this.viewportY = clamp(canvas.height / 3.8 - this.y, canvas.height/2 -(this.miny -10), canvas.height / 2-this.y);
    this.vx = 0;
    this.vy = 0;
    this.ax = 0;
    this.ay = 0.1*10;
    this.rv = 0;
    this.angle = angle;
    this.accelerationAmount = 10*0.05;
    this.decelerationAmount = 1*0.02;
    this.friction = 0.85;
    this.rotationSpd = 0.01;
    this.size = size;
    this.radius = size;
    this.color = color;
    this.map = map;
    this.score = 0;
    this.stepcollisionzone =  {
      left: this.x,
      right: this.x + this.size,
      top: this.y + this.size/2,
      bottom: this.y + this.size
    };
    this.moves =  {
        left: false,
        right: false,
    }
  };

  Voxel.prototype = {
    acceleratex: function (direction) {
      this.ax += this.accelerationAmount * direction;
    },
    bounce: function (multiplier) {
      if (this.vy > 0)
      {
        this.vy = 2.5*multiplier*-10.8;
      }
    },
    move: function () {
      this.vx += this.ax;
      this.vy += this.ay;
      (this.x - this.size/2 < 0) ? this.x = 0 + this.size/2
      : (this.x + this.size/2 > this.map.width) ? this.x = this.map.width-this.size/2 
      : this.x += this.vx
      // Account for weird viewportY thing
      this.y + canvas.height/2.8 < this.miny ? this.miny = this.y + canvas.height/2.8
      : this.miny = this.miny;
      //Actually adding velocity now
      this.y += this.vy;
      //Modifying Maxy for dying purposes
      this.maxy = this.miny + canvas.height/2
      this.ax *= this.friction;
      this.vx *= this.friction;
      //Updating the collision zone for the voxel bouncing on blocks/platforms
      this.stepcollisionzone =  {
        left: this.x,
        right: this.x + this.size,
        top: this.y,
        bottom: this.y + this.size
      };
      this.viewportY = clamp(canvas.height / 3.8 - this.y, canvas.height/2 -(this.miny -10), canvas.height / 2-this.y);
    },
    /**
     * Allows the voxel to step over the box, increasing its velocity based on the box's multiplier
     * @param {class Box} box 
     */
    step: function (box) {
      let boxcollision = box.collisionzone;
      let voxelcollision = this.stepcollisionzone;
      //If the hitboxes collide && the voxel is falling,
      if (voxelcollision.left < boxcollision.right && voxelcollision.right > boxcollision.left && voxelcollision.top < boxcollision.top && boxcollision.bottom < voxelcollision.bottom && this.vy > 0)
      { 
        this.bounce(box.multiplier);
      }
    },
    //Handles the drawing of the voxel, based on context, viewport X and Y
    draw: function (ctx, viewportX, viewportY) {
      ctx.save();
      ctx.translate(this.x + viewportX, this.y + viewportY);;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.stroke();
      ctx.fillStyle = this.color;
      ctx.fillRect(
        this.size / -2, 
        this.size / -2, 
        this.size, 
        this.size
      );
      ctx.strokeRect(
        this.size / -2, 
        this.size / -2, 
        this.size, 
        this.size
      );
      ctx.restore();
    },
    updateScore: function() {
        this.score += Math.rount(Math.ceil(-voxel.vy)/10);
    },
    //Handles what should occur when input is received
    processKeys: function() {
        let moves = this.moves;
        if (moves.left)
            this.acceleratex(-1);
        else if (moves.right)
            this.acceleratex(1);
    },
    updateViewport: function() {
        this.viewportY = clamp(canvas.height / 3.8 - this.y, canvas.height/2 -(this.miny -10), canvas.height / 2-this.y);
    },
  };


  const Box = function (x, y, size, color, map) {
    this.x = x;
    this.y = y;
    this.xsize = canvas.width/10;
    this.ysize = canvas.width/10/2;
    //Handles generating an item for the box/platform
    var itemType = this.getRandImageType();
    this.multiplier = itemType.multiplier;
    (itemType.typeString) ? this.item = new Item(this.x-25, this.y-50, 50, itemType.image,map, itemType.typeString, this.multiplier) : this.item = null
    this.itemType = itemType.typeString;
    this.collisionzone = {
      right: this.x+ this.xsize,
      left: this.x,
      top: this.y,
      bottom: this.y + this.ysize/4,
    };
  }

  Box.prototype = {
    draw: function (ctx, viewportX, viewportY) {
      ctx.save();
      ctx.translate(this.x + viewportX, this.y + viewportY);;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.stroke();
      ctx.fillStyle = this.color;
      ctx.fillRect(
        this.xsize / -2, 
        this.ysize / -2, 
        this.xsize, 
        this.ysize
      );
      ctx.strokeRect(
        this.xsize / -2, 
        this.ysize / -2, 
        this.xsize, 
        this.ysize
      );
      ctx.restore();
      if (this.item)
        this.item.draw(ctx, viewportX, viewportY);
    },
    getRandImageType: function () {
        let rand = getRandomBetween(1, 100);
        if (rand < 5)
          return {image: "rocket",
                  typeString: "rocket",
                  multiplier: 2.5};
        else if (rand < 10)
          return {image: "spring",
                  typeString: "spring",
                  multiplier: 1.5};
        else
          return {image: "null",
                  typeString: null,
                  multiplier: 1};
    },
  }

const Item = function (x, y, size, image, map, type,multiplier) {
    this.x = x;
    this.y = y;
    this.xsize = size;
    this.ysize = size;
    this.image = image;
    this.type = type;
    this.multiplier = multiplier;
    this.collisionzone = {
      right: this.x+ this.xsize,
      left: this.x,
      top: this.y,
      bottom: this.y + this.ysize,
    };
};

Item.prototype = {
    draw: function (ctx, viewportX, viewportY) {
    ctx.save();
    console.log(this.type);
    ctx.translate(this.x + viewportX, this.y + viewportY);
    //Commenting out draw image to figure out images later
    //ctx.drawImage(this.image,0,0,this.xsize, this.ysize);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.stroke();
      ctx.fillStyle = this.color;
      ctx.fillRect(
        this.xsize / -2, 
        this.ysize / -2, 
        this.xsize, 
        this.ysize
      );
      ctx.strokeRect(
        this.xsize / -2, 
        this.ysize / -2, 
        this.xsize, 
        this.ysize
      );
    ctx.restore();
  },

  specialFunction: function(voxel) {
    console.log("Does nothing right now!");
  }
}
/**
 * 
 * 
 * Ignore everything above here its all complete basically
 * 
 * 
 */
//General format of what the server loop should look like
const mainLoop = () => {
    //  User Interaction
    userInputs();
    //  Calculate Physics
    calcPhysics();
    //  Game Logic
    gameLogic();
    //  render or send render info to player
    if (client) renderLoop();
    if (server) sendRender();
    requestAnimationFrame(mainLoop);
}

const userInputs = (roomName) => {
  let roomPLAYERS = PLAYERS[roomName];
  for (let id in roomPLAYERS)
  {
    roomPLAYERS[id].processKeys();
  }
}

const calcPhysics = (roomName) => {
  let roomPLAYERS = PLAYERS[roomName];
  for (let id in roomPLAYERS)
  {
    
    roomPLAYERS[id].move();
    roomPLAYERS[id].updateViewport();
  }
}
//Checks if the given player has lost
const checkLoseCondition = (player) => {
  if (player.y > player.miny + canvas.height/2.0 + player.size)
  {
      
      //stopGame(ref)
      //setLostGame(true);
      gameOver = true;
      //server_loop ? clearInterval(server_loop) : server_loop = 1;
  }
}
const checkWinCondition = (player) => {
  if (player.y + player.size <= -20)
  {
      player.vy = -30.8;
      player.viewportY = clamp(player.canvas.height / 3.8 - player.y, player.canvas.height/3.8-player.y, 1000 );
      console.log("Voxel of id ", player.id, " Won!");
  }
}
const limitedGameLogic = (roomName) => {
  let roomPLAYERS = PLAYERS[roomName];
  //for each player in the room
  for (let id in roomPLAYERS)
  {
    let voxel = roomPLAYERS[id];
    if (voxel.y + voxel.size > voxel.miny + canvas.height/2.0)
      voxel.bounce(1);
  }
}
const gameLogic = (roomName) => {
    let roomPLAYERS = PLAYERS[roomName];
    //for each player in the room, do the following
    for (let id in roomPLAYERS)
    {
      let voxel = roomPLAYERS[id];
      MAPENTITIES[roomName].forEach((box) => {
          voxel.step(box);
      });

      checkLoseCondition(voxel);
      checkWinCondition(voxel);
      //Do this if the game is over
      if (gameOver)
      {
         io.emit("gameOver", {winner: voxel.id, message: "hopefully this works"});
      }
    }
}

const renderLoop = (roomName) => {
    //Nothing because im not a client!
}

const sendRender = (roomName) => {
    for (let id in PLAYERS[roomName])
    {
      let body = PLAYERS[roomName][id];
      voxelPos[roomName][body.id] = {
        x: body.x,
        y: body.y,
        id: body.id,
        viewportY: body.viewportY
      }
            // emit all of these to all users
            //io.emit('positionUpdate', voxelPos);
    };
    io.to(roomName).emit('renderUpdate',{voxelPos: voxelPos[roomName]});
}
const toPositions = (roomName) => {
  let blockItemPositions = [];
  //This is going to be a sizeable payload, so it should only be delivered once per player in a room
  //Type 1 denotes blocks
  //Type 2 denotes items
  MAPENTITIES[roomName].forEach((box, index) => {
    //If the entity is not a Voxel
    blockItemPositions[index] = {
      x: box.x,
      y: box.y,
      item: box.itemType
    }
  })
  return blockItemPositions;
}


// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import {Server} from 'socket.io'
const express = require('express')
let io;
let voxelPos = {};
let gameOver = false;
let canvas = {
    height: 800,
    width: 600,
  }
let map = {
    height: canvas.height * 20, 
    width: canvas.width
  };

  //PlAYERS and MAPENTITIES now each take in [RoomID], and each stores an object/array of players/blocks
let PLAYERS = {};
let MAPENTITIES = {};
let ROOMPROPS = {};
let server_loop; //Stores the global server loop

  const serverLoop = () => {
    //Server loop runs UNIVERSALLY, BUT each step handles the different rooms
    //  User Interaction
    (Object.keys(ROOMPROPS)).forEach(roomName =>{
      if (ROOMPROPS[roomName].renderLoop != 0)
      userInputs(roomName);
      //  Calculate Physics
      if (ROOMPROPS[roomName].renderLoop != 0)
        calcPhysics(roomName);
      //  Game Logic
      if (ROOMPROPS[roomName].renderLoop == "Limited")
        limitedGameLogic(roomName);
      else if (ROOMPROPS[roomName].renderLoop != 0)
        gameLogic(roomName);
      //  render or send render info to player
      if (ROOMPROPS[roomName].renderLoop != 0)
      {
        sendRender(roomName);
      }
    })
  }

let connected = (socket) => {
  console.log("Player with id: \'", socket.id, "\' connected to server!");
  let stateUpdate = {
    gameState: "Choosing",
    playerState: -1
  }
  socket.to(socket.id).emit('updateState', stateUpdate);

  socket.on("create-room", (roomName) => {
    if (io.sockets.adapter.rooms.has(roomName))
    {
      //The room exists, cant create it
      io.to(socket.id).emit("invalidLobby", "name is taken");
    }
    else
    {
      socket.join(roomName);
      //Establishing room properties that establish whether a render cycle is necessary, mapsize, if its joinable
      ROOMPROPS[roomName] = {
        id: roomName,
        players: 1,
        joinable: 0,
        mapsize: canvas.height*10,
        creator: socket.id,
        renderLoop: 0,
        playing: 0,
        roomName: roomName
      }
      //Establishing that the room exists, just no players.
      PLAYERS[roomName] = {};
      MAPENTITIES[roomName] = [];
      voxelPos[roomName] = {};
      //Add the creator to the players in the room
      io.to(roomName).emit("created-room", ROOMPROPS);
    }
  })
  socket.on("join-room", (roomName) => {
    if (io.sockets.adapter.rooms.has(roomName))
    {
      //The room exists, continue
      if (ROOMPROPS[roomName].joinable)
      {
        socket.join(roomName);
        //Updating Room properties
        ROOMPROPS[roomName].players = ROOMPROPS[roomName].players + 1;
        PLAYERS[roomName][socket.id] = new Voxel (
          canvas.width / 2, 
          map.height-canvas.height / 2, 
          0, 
          canvas.width / 12, 
          "white", 
          map, 
          canvas, 
          socket.id
          );
  
        voxelPos[roomName][socket.id] =  {
          x: canvas.width/2, 
          y: map.height - canvas.height/2, 
          id: socket.id, 
          viewportY: PLAYERS[roomName][socket.id].viewportY
        };

        //Sending the already existing level data to new user
        io.to(socket.id).emit('builtGame', {
          roomprops: ROOMPROPS[roomName],
          blocksPos: toPositions(roomName),
          voxelPos: voxelPos[roomName]
        })
      }
      else //The room cannot be joined because they are not in lobby
      {
        io.to(socket.id).emit("invalidRoom", "Room cannot be joined yet");
      }
    }
    else
    {
      //The room doesn't exist, do not continue
      io.to(socket.id).emit("invalidRoom", "Room does not exist");
    }
  })

  socket.on("build-game", roomName => {
      //Create all platform
      if (MAPENTITIES[roomName].length == 0)
        buildGameWorld(MAPENTITIES[roomName]);
      PLAYERS[roomName][socket.id] = new Voxel (
        canvas.width / 2, 
        map.height-canvas.height / 2, 
        0, 
        canvas.width / 12, 
        "white", 
        map, 
        canvas, 
        socket.id
        );

      voxelPos[roomName][socket.id] =  {
        x: canvas.width/2, 
        y: map.height - canvas.height/2, 
        id: socket.id, 
        viewportY: PLAYERS[roomName][socket.id].viewportY
      };
      ROOMPROPS[roomName].joinable = 1;
      console.log("Emitting level data to room")
      io.to(socket.id).emit('builtGame', {
        roomprops: ROOMPROPS[roomName],
        blocksPos: toPositions(roomName),
        voxelPos: voxelPos[roomName]
      });

  })
  socket.on("receivedInitialData", roomName => {
    ROOMPROPS[roomName].renderLoop = "Limited";
  })
  /**if (Object.keys(voxelPos).length === 0) {
    console.log("Lobby created");
    if (ENTITIES.length == 0 )
      buildGameWorld();
    let newPlayer = new Voxel(canvas.width / 2, map.height-canvas.height / 2, 0, canvas.width / 12 | 0, "pink", map, canvas, socket.id)
    ENTITIES.push(newPlayer);
    
    PLAYERS.push(newPlayer);
    voxelPos[socket.id] = {x: canvas.width/2, y :map.height - canvas.width/2, id: socket.id, viewportY: newPlayer.viewportY};
    io.emit("initialSetup", {blocksPos: toPositions(), players: voxelPos});
  }
  else {
    console.log("Current number of players:", (PLAYERS.length + 1));
    let newPlayer = new Voxel(canvas.width / 2, map.height-canvas.height / 2, 0, canvas.width / 12 | 0, "pink", map, canvas, socket.id)
    ENTITIES.push(newPlayer);
    PLAYERS.push(newPlayer);
    voxelPos[socket.id] = {x: canvas.width/2, y :map.height - canvas.width/2};
    io.to(socket.id).emit("initialSetup", {blocksPos: toPositions(), players: voxelPos})
  }*/
  socket.on('disconnect', function() {
    /**MODIFY tHIS, THIS IS HELLA INEFFICIENT */
      ENTITIES.forEach((voxel, index) => {
        if (voxel.id == socket.id)
          ENTITIES.splice(index,1);
      })
      PLAYERS.forEach((voxel, index) => {
        if (voxel.id == socket.id)
          PLAYERS.splice(index,1);
          
      })
      delete voxelPos[socket.id];
      if (Object.keys(voxelPos).length === 0)
        clearInterval(server_loop);
      io.emit('positionUpdate', voxelPos);
  })
  socket.on('userCommands', data => {
    let roomPLAYERS = PLAYERS[data.roomName]
      for (let id in roomPLAYERS)
      {
        if (id == socket.id)
        {
          roomPLAYERS[id].moves.left = data.left;
          roomPLAYERS[id].moves.right = data.right;
        }
      }
    })
}

const SocketHandler = (req, res) => {
  //Handles creation and connection of the server
  
  if (!res.socket.server.io) {
    console.log("*First use, so starting server");
    io = new Server(res.socket.server);
    res.socket.server.io = io;
  }
  else {
    io = res.socket.server.io;
  }

  //let selfID = "id of the emitting client";
  
  io.on('connection', (socket) => {
    connected(socket);
  });
  if (!server_loop)
    server_loop = setInterval(serverLoop, 1000/120);
  //120 frames per second's worth of info being delivered to client
  res.end();
  
}

export default SocketHandler;



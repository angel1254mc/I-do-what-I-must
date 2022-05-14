
import React from 'react';
import Results from './Results';
import io from 'socket.io-client'
import { useEffect } from 'react';

// /https://stackoverflow.com/questions/57512366/how-to-use-socket-io-with-next-js-api-routes
let ctx;
let canvas;
let map;
let myVoxel;
let blocks = [];
const voxelList = {};
let justPressed = false;
let socket;
let socketCreated = false;
let ID;
let ROOMPROPS;
let gameStateOuter = "Choosing";
let playerStateOuter = "Inactive";
let finalResults; //This will be populated when the game ends, and depopulated when the user goes to the main menu



const SimpleVoxel = function(x, y, size, id, viewportY) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.size = size;
    this.viewportY = viewportY;
    this.color = "pink";
}
SimpleVoxel.prototype = {
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
    }
};
const SimpleBlock = function(x, y, size, item) {
    this.x = x;
    this.y = y;
    this.size = canvas.width/10;
    this.xsize = this.size;
    this.ysize = this.size/2;
    this.item = new SimpleItem(x + size/2 - canvas.width/24, this.y + canvas.width/12, canvas.width/12);
}
SimpleBlock.prototype = {
    draw: function (ctx, viewportX, viewportY) {
      ctx.save();
      ctx.translate(this.x + viewportX, this.y + viewportY);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.stroke();
      ctx.fillStyle = "white";
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
}
const SimpleItem = function (x, y, item) {
    this.x = x;
    this.y = x;
    this.size = canvas.width/12;
    this.itemType = item; 
}
SimpleItem.prototype = {
    draw: function (ctx, viewportX, viewportY) {
    ctx.save();
    ctx.translate(this.x + viewportX, this.y + viewportY);
    //Commenting out draw image to figure out images later
    //ctx.drawImage(this.image,0,0,this.xsize, this.ysize);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.stroke();
      ctx.fillStyle = "white";
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
}
const buildCanvas = () => {
    let prevCanvas = document.getElementsByTagName("canvas")[0];
    if (prevCanvas)
        prevCanvas.remove();
    canvas = document.createElement("canvas");
    (document.getElementById("canvas-holder-game")).appendChild(canvas);
    ctx = canvas.getContext("2d");
    canvas.height = 800;
    canvas.width = 600;
    map = {
      height: canvas.height * 20, 
      width: canvas.width
    };
}
const renderLoop = () => {
    if (!myVoxel)
    return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    
    const tileSize = canvas.width / 5;
    
    for (let x = 0; x < map.width; x += tileSize) {
        for (let y = -50; y < map.height; y += tileSize) {
          const xx = x + 0;
          const yy = y + myVoxel.viewportY;
    
          // simple culling
          if (xx > canvas.width || yy > canvas.height || 
              xx < -tileSize || yy < -tileSize) { 
            continue;
          }
          
          const light = (~~(x / tileSize + y / tileSize) & 1) * 5 + 50;
          ctx.fillStyle = `hsla(${360 - (x + y) / 10}, 50%, ${light}%, 0.7)`;
          ctx.fillRect(xx, yy, tileSize + 1, tileSize + 1);
          if (y < 0)
          {
            ctx.fillStyle = "white"
            ctx.fillRect(xx,yy, tileSize + 1, tileSize +1);
          }
        }
    }
    if (ROOMPROPS.renderLoop != "Limited")
    {
        blocks.forEach((block) => {
            block.draw(ctx, 0, (myVoxel.viewportY ? myVoxel.viewportY : map.height -canvas.height));
        })
    }
    for (let id in voxelList)
    {
        voxelList[id].draw(ctx, 0, myVoxel.viewportY);
    }
}
let MultiplayerCanvas = ({gameOn ,gameOnHandler, lostGame, setLostGame, restartGame, gameType, wonGame, setWonGame, startTimer, gameScore, setGameScore}) => {

     //denotes the socket that connects the client to the server
    let justPressed; // has to do with sending user input
    let keys_object = {left: false, right: true}; //Denotes which arrow keys have been pressed

    let [socketConnected, setSocketConnected] = React.useState(false); //used to remember when the socket is connected
    let [playerState, setPlayerState] = React.useState("Inactive"); /**
     * Used to determine the state at the client level
     * For instance, just because the client is dead doesn't mean the game is over
     */
    let [playerName, setPlayerName] = React.useState("Default");
    let [roomName, setRoomName] = React.useState("");
    let [gameState, setGameState] = React.useState("Choosing");
    /** Denotes the state of the game at the global state.
     *  Handled by both the client and the server.
     *  1. Creating = For creating a lobby. Socket connects to server but does nothing
     *  - Creating a lobby involves specifying a lobby ID
     *  - Socket emits a "createLobby" command 
     *  - Server checks whether lobby with lobby ID exists, creates it and emits a confirmation/denial message
     *  - If lobby creation fails, a message/modal thing appears telling the player to choose a different ID
     *  - If lobby creation succeeds, player is redirected to a waiting room in displaying Lobby ID
     *  2. Waiting = For waiting for players to join your lobby
     *  - Players can bounce around on this lobby, and wait for others to join
     *  - Start Game button at the tob and a player counter 
     *  - Most of the heavyweight player data (color. icon, name) should be sent at this stage as players join
     *  - Level should have been built as well upon lobby creation
     *  3. Playing = Denotes that the game has begun
     *  - Players cannot join at this stage
     *  - Try to implement a countdown timer handled by the server, emitted to the client
     *  - When players die, they are simply deleted by the server and info emitted to the client once
     *  - Clients then delete the dead player from the info that was emitted.
     *  - If the dead player's id matches one's own ID, change player state to dead, show UI
     *  - When three players win or all players die, the server changes the GAME state to Finished
     *  4. Finished = Denotes that a game has been finalized, shows top 3 players on clientside.
     *  - Top 3 players are sent to the clients in the rooms, gameState on client end is updated.
     *  - Clients handle rendering the winners, the winning screen is handled completely by the client.
     *  - Clients have the option to restart the game on the same or new level
     *  - Clients have the option to disconnect from the lobby and get sent back to the main menu
     *  - Game state either cycles back to creating, waiting, or playing
     */

    let handleJoinGame = (e) => {
        e.preventDefault();
        socket.emit("join-room", {roomName: roomName, playerName: playerName });
        gameStateOuter = "Waiting";
    }
    let handleCreateGame = (e) => {
        e.preventDefault();
        socket.emit("create-room", {roomName: roomName, playerName: playerName});
        gameStateOuter = "Creating"
    }
    let handleBuildGame = (e) => {
        e.preventDefault();
        socket.emit("build-game", roomName);
        gameStateOuter = "Waiting";
    }
    let handleStartGame = (e) => {
        e.preventDefault();
        socket.emit("start-game", roomName);
        gameStateOuter = "Playing";
    }
//Event listeners for the arrow keys
function userInput(obj){
    window.addEventListener('keydown', function(e) {
        if(e.key === "ArrowLeft"){
            if(obj.left === false){
                justPressed = true;
            }
            obj.left = true;
        }
        if(e.key === "ArrowRight"){
            if(obj.right === false){
                justPressed = true;
            }
            obj.right = true;
        }
        if (justPressed === true){
            emitUserCommands(obj);
            justPressed = false;
        }
    });
    
    window.addEventListener('keyup', function(e){
        if(e.key === "ArrowLeft"){
            obj.left = false;
        }
        if(e.key === "ArrowRight"){
            obj.right = false;
        }
        emitUserCommands(obj);
    });    
}

function emitUserCommands(obj){
    let userCommands = {
        roomName: ROOMPROPS ? ROOMPROPS.roomName : "empty as of now",
        left: obj.left,
        right: obj.right,
    }
    //userCommands should only emit if the render loop is actually happening
    if (gameStateOuter == "Waiting" || gameStateOuter == "Playing")
        socket.emit('userCommands', userCommands);
}

useEffect(( )=> {
    //Literally put the canvas on html
    buildCanvas();
    //Initializing socket and listeners
    socketInitializer();
    //establish event listeners
    userInput(keys_object);
    return function socketUnsub() {
        let listeners = ['host-started', 'invalidLobby', 'created-room', 'builtGame', 'renderUpdate', 'playerStateUpdate', "gameOver"]
        socket.removeAllListeners();
    }
}, [])

const socketInitializer = async () => {
    if (!socket)
    fetch('/api/socket').finally(() => {
        socketCreated = true;
        socket = io();
        socket.on('connect', () => {
            ID = socket.id;
            setGameState("Choosing");
        })

        socket.on('host-started', () => {
            ROOMPROPS.renderLoop = "Visible";
            setGameState("Playing");
        })
        socket.on('invalidLobby', (message)=> {
            console.log("Invalid Lobby: ", message );
        })
        socket.on('created-room', roomprops => {
            ROOMPROPS = roomprops;
            setGameState("Creating");
        })
        socket.on('builtGame', data => {
            ROOMPROPS = data.roomprops;
            console.log(ROOMPROPS);
            let playerExists = {}
            let blocksPos = data.blocksPos;
            blocksPos.forEach((box) => {
                blocks.push(new SimpleBlock(box.x, box.y, canvas.width/10, box.item));
            })
            console.log(blocksPos);
            console.log(data);
            let voxelPos = data.voxelPos;
            console.log(voxelPos);
            for (let id in voxelPos)
            {
                let voxel = voxelPos[id];
                if (!voxelList[id])
                {
                    voxelList[id] = new SimpleVoxel(voxel.x, voxel.y, canvas.width/12, voxel.id, voxel.viewportY);
                    //Check if this voxel is ourselves, if so, set it myVoxel equal to it
                    if (id == ID)
                        myVoxel = voxelList[id];
                }
                else
                {
                    voxelList[id].x = voxel.x;
                    voxelList[id].y = voxel.y;
                    voxelList[id].viewportY = voxel.viewportY;
                }
                playerExists[id] = true;
            }
            //For all the ids that were acknowledged to exist in the previous loop, take out those that exist in the client but not in server
            for (let id in voxelList)
            {
                if (!playerExists[id])
                    delete voxelList[id];
            }
            ROOMPROPS.renderLoop = "Limited"
            socket.emit("receivedInitialData", ROOMPROPS.roomName);
            setGameState("Waiting");
        })

        socket.on('renderUpdate', data => {
            console.log(gameState);
            let playerExists = {}
            let voxelPos = data.voxelPos;
            for (let id in voxelPos)
            {
                let voxel = voxelPos[id];
                if (!voxelList[id])
                {
                    voxelList[id] = new SimpleVoxel(voxel.x, voxel.y, canvas.width/12, voxel.id, voxel.viewportY);
                    //Check if this voxel is ourselves, if so, set it myVoxel equal to it
                    if (id == ID)
                        myVoxel = voxelList[id];
                }
                else
                {
                    voxelList[id].x = voxel.x;
                    voxelList[id].y = voxel.y;
                    voxelList[id].viewportY = voxel.viewportY;
                }
                playerExists[id] = true;
            }
            //For all the ids that were acknowledged to exist in the previous loop, take out those that exist in the client but not in server
            for (let id in voxelList)
            {
                if (!playerExists[id])
                    delete voxelList[id];
            }
            renderLoop();
        });
        socket.on('playerStateUpdate', PLAYERENDDATA => {
            if (gameStateOuter == "Playing")
            {
                if (PLAYERENDDATA.id == myVoxel.id)
                {
                    delete voxelList[ID]; 
                    //Get the first random
                    myVoxel = voxelList[Object.keys(voxelList)[1]]
                }
                if (PLAYERENDDATA.outcome == "won")
                {
                    setPlayerState("Won");
                    playerStateOuter = "Won";
                }
                else if (PLAYERENDDATA.outcome == "lost")
                {
                    setPlayerState("Lost");
                    playerStateOuter = "Lost";
                }
            }
        });
        socket.on("gameOver" , FINALDATASERVER => {
            //Final Data Server is supposed to be a collection of all the players in the lovvy and their final placements
            //Here, the game should have stopped rendering, a react component will come through and display all the players and their results!
            //In order to do this, we need to update the state of the game, 
            //Also, save the game-end data object locally in the component, in order to display it later
            finalResults = FINALDATASERVER;
            setGameState("Finished");
            setPlayerState("Inactive");
            //Then display the stuff, which should be handled by
        });
        /** 
        socket.on('positionUpdateGame', players => {
            let playerExists = {};
            for (let id in players)
            {
                let voxel = players[id];
                if (!voxels[id])
                    voxels[id] = new SimpleVoxel(voxel.x, voxel.y, canvas.width/12, voxel.id, voxel.viewportY);
                else
                {
                    voxels[id].x = voxel.x;
                    voxels[id].y = voxel.y;
                    voxels[id].viewportY = voxel.viewportY;
                }
                if (id == ID)
                {
                    myVoxel = voxels[id];
                    myVoxel.color = "blue";
                }
                if (id)
                    playerExists[id] = true;
            }
            for (let id in voxels)
            {
                if(!playerExists[id]) {
                    delete voxels[id];
                }
            }
            renderLoop();
        })
        socket.on('initialSetupGame', data => {
            let blocksPos = data.blocksPos;
            let blockInfo;
            for (let id in blocksPos)
            {
                blockInfo = blocksPos[id];
                blocks.push(new SimpleBlock(blockInfo.x, blockInfo.y, canvas.width/10, blockInfo.item));
            }
        })
        socket.on('gameOver', data => {
            console.log("The winner's id is :", data.winner);
            console.log(data.message);
            //Player is now dead, cue the buttons and UI stuff
            setPlayerState("Dead");
        })
        */
        return null;
    })
}

return (
    
    <div className = "w-[400px] h-[800px]">
        {gameState == "Choosing" ? <div className = "absolute w-full h-full flex flex-col items-center m-1">
          <div className = "relative text-center leader-lg text-5xl mt-[100px] text-white font-extrabold bg-main-leader">Multiplayer Options</div>
          <div className = "flex flex-col justify-center relative leader2-lg text-2xl mt-[20px] w-1/2 h-[80px] items-center text-white ">
            <form className="flex flex-row justify-around align-center">
                <div className="text-xl">Display Name: </div>
                <input className = "w-2/3  bg-transparent border-2 rounded-md border-black bg-slate-800 text-white" type="text" value={playerName} onChange={(e) => {setPlayerName(e.target.value)}}/>
            </form>
          </div>
          <div className = "flex flex-col justify-center relative leader2-lg text-2xl mt-[20px] w-1/2 h-[80px] items-center text-white border-2 border-white rounded-3xl bg-main-button ">
            <form className="flex flex-row justify-center align-center">
                <button className="h-[40px] w-1/2 mr-[10px]" type="submit" onClick={(e) => {handleJoinGame(e)}}>Join Game</button>
                <input className = "w-1/3  bg-transparent border-2 rounded-md border-black text-white" type="text" value={roomName} onChange={(e) => {setRoomName(e.target.value)}}/>
            </form>
          </div>
          <div className = "flex flex-col justify-center relative leader2-lg text-2xl mt-[20px] w-1/2 h-[80px] items-center text-white border-2 border-white rounded-3xl bg-main-button ">
            <form className="flex flex-row justify-center align-center">
                <button className="h-[40px] w-1/2 mr-[10px]" type="submit" onClick={(e) => {handleCreateGame(e)}}>Create Game</button>
                <input className= "w-1/3 bg-transparent border-2 rounded-md border-black text-white" type="text" value={roomName} onChange={(e) => {setRoomName(e.target.value)}}/>
            </form>
          </div>
          <div className = "flex justify-center relative leader2-lg text-3xl mt-[150px] w-1/2 h-[80px] items-center text-white border-2 border-white rounded-3xl bg-main-button "><button className="h-full w-1/2" onClick={() => {}}>Back to Menu</button></div>
        </div> : <div></div>}
        {gameState == "Creating" ? <div className = "absolute w-full h-full flex flex-col items-center m-1">
          <div className = "relative text-center leader-lg text-6xl mt-[100px] text-white font-extrabold bg-main-leader">Options Coming Soon!</div>
          <div className = "flex justify-center relative leader2-lg text-3xl mt-[150px] w-1/2 h-[80px] items-center text-white border-2 border-white rounded-3xl bg-main-button ">
            <button className="h-full w-1/2" onClick={(e) => {handleBuildGame(e)}}>Create Game</button>
          </div>
          <div className = "flex justify-center relative leader2-lg text-3xl mt-[150px] w-1/2 h-[80px] items-center text-white border-2 border-white rounded-3xl bg-main-button "><button className="h-full w-1/2" onClick={() => {console.log("Return to main menu")}}>Back to Menu</button></div>
        </div> : <div></div>}
        {gameState == "Waiting" ? <div className = "absolute w-full h-full flex flex-col items-center m-1">
          <div className = "flex justify-center relative leader2-lg text-3xl mt-[50px] w-1/2 h-[80px] items-center text-white border-2 border-white rounded-3xl bg-main-button ">
            <button className="h-full w-1/2" onClick={(e) => {handleStartGame(e)}}>Start Game</button>
          </div>
        </div> : <div></div>}
        {
            playerState == "Won" && gameState == "Playing" ? 
            <div className = "absolute w-full h-full flex flex-col items-center m-1">
              <div className = "flex justify-center relative leader2-lg text-3xl mt-[50px] w-1/2 h-[80px] items-center text-white border-2 border-white rounded-3xl bg-main-button ">
                <button className="h-full w-1/2" onClick={(e) => {}}>You Won!</button>
              </div>
            </div>
            : playerState == "Lost" && gameState == "Playing" ?
            <div className = "absolute w-full h-full flex flex-col items-center m-1">
                <div className = "flex justify-center relative leader2-lg text-3xl mt-[50px] w-1/2 h-[80px] items-center text-white border-2 border-white rounded-3xl bg-main-button ">
                    <button className="h-full w-1/2" onClick={(e) => {}}>You Lost!</button>
                </div>
            </div>
            : 
            <div></div>
        }
        { gameState == "Finished" ? <Results finalResults = {finalResults}></Results> : <div></div> }
      <div id= "canvas-holder-game">
      </div>
    </div>
  )
}
export default MultiplayerCanvas
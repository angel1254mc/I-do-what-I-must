
import React from 'react';
import io from 'socket.io-client'
import { useEffect } from 'react';

// /https://stackoverflow.com/questions/57512366/how-to-use-socket-io-with-next-js-api-routes
let ctx;
let canvas;
let map;
let myVoxel;
let blocks = [];
const playerExists = {};
const voxels = {};
const SimpleVoxel = function(x, y, size, id, viewportY) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.viewportY = viewportY;
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
    this.size = size;
    this.item = new SimpleItem(x + size/2 - canvas.width/24, this.y + canvas.width/12, canvas.width/12);
}
SimpleBlock.prototype = {
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
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    blocks.forEach((block) => {
        block.draw(ctx, 0, myVoxel.viewportY);
    })
    for (let id in voxels)
    {
        voxels[id].draw(ctx, 0, myVoxel.viewportY);
    }
}
let MultiplayerCanvas = ({gameOn ,gameOnHandler, lostGame, setLostGame, restartGame, gameType, wonGame, setWonGame, startTimer, gameScore, setGameScore}) => {
let ID;
let animationRef;

useEffect(( )=> {

    buildCanvas();

    fetch('/api/socket').finally(() => {
        const socket = io();

        socket.on('connect', () => {
            ID = socket.id;
        })
        socket.on('positionUpdate', players => {
            for (let id in players)
            {
                if (!voxels[id])
                    voxels[id] = new SimpleVoxel(voxel.x, voxel.y, voxel.id, voxel.viewportY);
                if (id == ID)
                    myVoxel = voxels[id];
                if (id == ID)
                playerExists[id] = true;
            }
            for (let id in voxels)
            {
                if(!playerExists[id]) {
                    voxels[id].remove();
                    delete voxels[id];
                }
            }
        })
        socket.on('initialSetup', data => {
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
        })
        animationRef = requestAnimationFrame(renderLoop);
    })
}, [])



return (
    <div className = "w-[400px] h-[800px]">
      <div id= "canvas-holder-game">
      </div>
    </div>
  )
}
export default MultiplayerCanvas
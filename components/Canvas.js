import { app, database } from '../firebaseConfig';
import Document from 'next/document';
import {Voxel, Box, buildGameWorld, startGame} from '../pages/api/game'
import React from 'react';
import { isReactNative } from '@firebase/util';


let Canvas = ({gameOn ,gameOnHandler, lostGame, setLostGame, restartGame, gameType, wonGame, setWonGame}) => {
    //Game Functionality holders, later passed to game API
let canvas = 1;
let map = 1;
let ctx = 1;
let ref;
const scaleMap = () => {

}
const buildGameWorld = () => {
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

 //Utility functions for creating boxes/platforms or Handling the end of the game state
  
  
  
 const getRandomBetween = (min, max) => {
    return Math.floor(Math.random() * (max-min) + min);
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
  const createRandomPlatform = (prevBox, limits, type) => {
    if (type === 1) 
    {
      (!prevBox) ? prevBox = {x: 0, y: 0} : "nice";
      let randlocale = {
        y: getRandomBetween(prevBox.y + 100, prevBox.y + 400),
        x: getRandomBetween(0, canvas.width)
      };
      return new Box(randlocale.x, randlocale.y, canvas.width/10, "red", map);
    }
  }
  const createManyPlatforms = (arr, num) => {
    let prevBox = null;
    let i = 0;
    for (i = 0; i < num; i++)
    {
      (!prevBox) ? prevBox = createRandomPlatform(prevBox, 0, 1) : prevBox = (createRandomPlatform(prevBox, 0, 1))
      arr.push(prevBox)
    }
  }
  
  const clamp = (n, lo, hi) => n < lo ? lo : n > hi ? hi : n;


const Voxel = function (x, y, angle, size, color, map) {
    this.x = x;
    this.y = y;
    this.maxy = this.y + canvas.height/2 + this.size/2;
    this.miny = y;
    this.vx = 0;
    this.vy = 0;
    this.ax = 0;
    this.ay = 0;
    this.rv = 0;
    this.angle = angle;
    this.accelerationAmount = 0.05;
    this.decelerationAmount = 0.02;
    this.friction = 0.9;
    this.rotationSpd = 0.01;
    this.size = size;
    this.radius = size;
    this.color = color;
    this.map = map;
    this.stepcollisionzone =  {
      left: this.x,
      right: this.x + this.size,
      top: this.y + this.size/2,
      bottom: this.y + this.size
    };
  };
  Voxel.prototype = {
    accelerate: function (direction) {
      this.ax += this.accelerationAmount * direction;
    },
    bounce: function () {
      if (this.vy > 0)
      {
        this.vy = -30.8;
      }
    },
    move: function () {
      this.angle += this.rv;
      this.vx += this.ax;
      this.vy += this.ay;
      (this.x - this.size/2 < 0) ? this.x = 0 + this.size/2
      : (this.x + this.size/2 > this.map.width) ? this.x = this.map.width-this.size/2 
      : this.x += this.vx
      this.y + canvas.height/2.8 < this.miny ? this.miny = this.y + canvas.height/2.8
      : this.miny = this.miny;
      this.y += this.vy;
      this.maxy = this.miny + canvas.height/2
      this.ax *= this.friction;
      this.ay = 0.1;
      this.vx *= this.friction;
      this.rv *= this.friction;
      this.stepcollisionzone =  {
        left: this.x,
        right: this.x + this.size,
        top: this.y,
        bottom: this.y + this.size
      };
    },
    step: function (box) {
      let boxcollision = box.collisionzone;
      let voxelcollision = this.stepcollisionzone;
      if (voxelcollision.left < boxcollision.right && voxelcollision.right > boxcollision.left && voxelcollision.top < boxcollision.top && boxcollision.bottom < voxelcollision.bottom)
      { 
        this.bounce();
      }
    },
    
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
  const Box = function (x, y, size, color, map) {
    this.x = x;
    this.y = y;
    this.xsize = size;
    this.ysize = size/2;
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
    },
  }


  let stopGame = (frameRef) => {
    cancelAnimationFrame(frameRef);
    console.log("Game ended!")
    return "YEA";
  }
  const startGame = () => {
    const voxel = new Voxel(
      canvas.width / 2, 
      map.height-canvas.height / 2, 
      0,
      canvas.width / 12 | 0, 
      "pink",
      map
    );
    const boxes = new Array();
    createManyPlatforms(boxes, 100);
    createFloorPlatforms(boxes);
    
    const keyCodesToActions = {
      37: () => voxel.accelerate(-1),
      39: () => voxel.accelerate(1),
    };
    const validKeyCodes = new Set(
      Object.keys(keyCodesToActions).map(e => +e)
    );
    const keysPressed = new Set();
    document.addEventListener("keydown", e => {
      if (validKeyCodes.has(e.keyCode)) {
        e.preventDefault();
        keysPressed.add(e.keyCode);
      }
    });
    document.addEventListener("keyup", e => {
      if (validKeyCodes.has(e.keyCode)) {
        e.preventDefault();
        keysPressed.delete(e.keyCode);
      }
    });
    
    (function update() {
     ref = requestAnimationFrame(update);
    
      keysPressed.forEach(k => {
        if (k in keyCodesToActions) {
          keyCodesToActions[k]();
        }
      });
      //Checks if game is lost
      if (voxel.y > voxel.miny + canvas.height/2.0 + voxel.size)
      {
        
        stopGame(ref)
        setLostGame(true);
      }
      //Conditionals that implement game type functionality
    
    
      boxes.forEach((box) => {
        voxel.step(box);
      });
    
      voxel.move();

    
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      const viewportX = 0
      let viewportY = clamp(canvas.height / 3.8 - voxel.y, canvas.height/2 -(voxel.miny -10), canvas.height / 2-voxel.y);
      if (gameType === "Race")
      {
        if (voxel.y + voxel.size <= -20)
        {
          voxel.vy = -30.8;
          console.log("Program recognizes game won");
          viewportY = clamp(canvas.height / 3.8 - voxel.y, canvas.height/3.8-voxel.y, 1000 );
          if (voxel.y + voxel.size <= -1020)
          {
            stopGame(ref);
            setWonGame(true);
          }
        }
      }
      else if (gameType === "Infinite");
      {

      }
      /* draw everything offset by viewportX/Y */
      const tileSize = canvas.width / 5;
    
      for (let x = 0; x < map.width; x += tileSize) {
        for (let y = -50; y < map.height; y += tileSize) {
          const xx = x + viewportX;
          const yy = y + viewportY;
    
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
    
      boxes.forEach((box) => {box.draw(ctx, viewportX, viewportY);})
      voxel.draw(ctx, viewportX, viewportY);
      ctx.restore();
    })();
  };

  React.useEffect(() => {
    if (gameOn == 1)
    {
      buildGameWorld();
      startGame();
      setLostGame(false);
    }
    },[restartGame])
  React.useEffect(() => {
    console.log("Has the player lost the game?: ", lostGame);
  },[lostGame])
  
  /**
   * (this.x - this.size < 0) ? this.x = 0 + this.size
      : (this.x + this.size > this.map.width) ? this.x = this.map.width-this.size 
      : this.x += this.vx * Math.cos(this.angle)
      console.log(this.x);
      console.log(this.size);
      this.y += this.vy * Math.sin(this.angle);
      this.map.height - this.y > this.maxy ? this.maxy = this.y
      : this.y = this.y;
   */




    return (
      <div>
        <div id= "canvas-holder-game">
        </div>
      </div>
    )
  }
export default Canvas
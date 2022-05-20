import { app, database } from '../firebaseConfig';
import React from 'react';
import { isReactNative } from '@firebase/util';
import {Howl, Howler} from 'howler';

let Canvas = ({gameOn ,gameOnHandler, lostGame, setLostGame, restartGame, gameType, wonGame, setWonGame, startTimer, gameScore, setGameScore}) => {
    //Game Functionality holders, later passed to game API
let canvas = 1;
let map = 1;
let ctx = 1;
let ref;
let interval;
let spring;
let rocket; 
const sounds = {
  bounce: new Howl({
    src: ['/bouncemp3.mp3'],
  })
}

const getRandImageType = () => {
  let rand = getRandomBetween(1, 100);
  if (rand < 5)
    return {image: rocket,
            typeString: "rocket",
            multiplier: 2.5};
  else if (rand < 20)
    return {image: spring,
            typeString: "spring",
            multiplier: 1.5};
  else
    return {image: null,
            typeString: null,
            multiplier: 1};
}
const updateScore = (voxel) => {
    
    voxel.score += Math.round(Math.ceil(-voxel.vy)/10 );
    if (voxel.score > gameScore + 20)
      setGameScore(voxel.score);
}
const scaleMap = (voxel, boxes) => {
    voxel.y = voxel.y  + map.height/2-600;
    voxel.miny =  voxel.miny + map.height/2-600;
    voxel.stepcollisionzone = {
      left: voxel.x,
      right: voxel.x + voxel.size,
      top: voxel.y + voxel.size/2,
      bottom: voxel.y + voxel.size
    }
    createManyPlatforms(boxes, 300, -map.height/2 -200, 0);
    boxes.map((box, index) => {
      box.y = box.y + map.height/2-600;
      if (box.item)
        box.item.y = box.item.y + map.height/2-600;
      box.collisionzone = {
        left: box.x,
        right: box.x + box.xsize,
        top: box.y,
        bottom: box.y + box.ysize/4
      }
      if (box.y > voxel.height-200 || box.y < 0)
      {
        boxes.splice(index, 1);
      }
      
    });
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
      let randlocale = {
        y: getRandomBetween(prevBox.y + 100, prevBox.y + 200),
        x: getRandomBetween(0, canvas.width)
      };
      return new Box(randlocale.x, randlocale.y, canvas.width/10, "red", map);
    }
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
  
  const clamp = (n, lo, hi) => n < lo ? lo : n > hi ? hi : n;

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
    ctx.drawImage(this.image,0,0,this.xsize, this.ysize);
    ctx.restore();
  },

  specialFunction: function(voxel) {
    console.log("Does nothing right now!");
  }
}


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
    this.score = 0;
    this.stepcollisionzone =  {
      left: this.x,
      right: this.x + this.size,
      top: this.y + this.size/2,
      bottom: this.y + this.size
    };
  };
  Voxel.prototype = {
    accelerate: function (direction) {
      this.ax += 2.5*this.accelerationAmount * direction;
    },
    bounce: function (multiplier) {
      if (this.vy > 0)
      {
        this.vy = multiplier*-2*10.8;
        sounds.bounce.play();
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
      this.ay = 4*0.1;
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
      if (voxelcollision.left < boxcollision.right && voxelcollision.right > boxcollision.left && voxelcollision.top < boxcollision.top && boxcollision.bottom < voxelcollision.bottom && this.vy > 0)
      { 
        this.bounce(box.multiplier);
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
    var itemType = getRandImageType();
    this.multiplier = itemType.multiplier;
    (itemType.typeString) ? this.item = new Item(this.x-25, this.y-50, 50, itemType.image,map, itemType.typeString, this.multiplier) : this.item = null
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
    createManyPlatforms(boxes, 200, 0, map.height);
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
        interval ? clearInterval(interval) : interval = 1;
      }
      //Conditionals that implement game type functionality
      if (gameType == "Infinite")
      {
        updateScore(voxel);
        if (voxel.y < map.height/2)
        {
          scaleMap(voxel, boxes);
        }
      }
    
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
            clearInterval(interval);
          }
        }
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
    
    spring = document.getElementById("spring");
    rocket = document.getElementById("rocket");
    if (gameOn == 1)
    {
      setGameScore(0);
      buildGameWorld();
      startGame();
      setLostGame(false);
    }
    },[restartGame])
  React.useEffect(() => {
    spring = document.getElementById("spring");
    rocket = document.getElementById("rocket");
    if (gameType == "Race")
    {
      interval = setInterval(() => {
        setGameScore(gameScore => gameScore + 1)
      }, 1000);
  
      return () => clearInterval(interval);
    }
  },[]);


    return (
      <div className = "w-[400px] h-[800px]">
        <div id= "canvas-holder-game">
        </div>
      </div>
    )
  }
export default Canvas
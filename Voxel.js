





let viewportX = 0;
let viewportY = 0;
let map;
let ENTITIES = [];
let PLAYERS = [];
let server_loop;
let MAPENTITIES =[];
//Utility/World building functions
const clamp = (n, lo, hi) => n < lo ? lo : n > hi ? hi : n;
const buildGameWorld = () => {
    createManyPlatforms(ENTITIES, 1000, 0, map.height);
    createFloorPlatforms(ENTITIES);
    ENTITIES.forEach((box) => {
        //We are only sending the mapentities
        MAPENTITIES.push(box);
    })
}
const Voxel = function (x, y, angle, size, color, map, canvas) {
    this.x = x;
    this.y = y;
    this.canvas = canvas;
    this.maxy = this.y + canvas.height/2 + this.size/2;
    this.miny = y;
    this.viewportY = 0
    this.updateViewport();
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
    this.move =  {
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
        this.vy = multiplier*-10.8;
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
      this.ay = 0.1;
      this.vx *= this.friction;
      //Updating the collision zone for the voxel bouncing on blocks/platforms
      this.stepcollisionzone =  {
        left: this.x,
        right: this.x + this.size,
        top: this.y,
        bottom: this.y + this.size
      };
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
        let move = this.move;
        if (move.left)
            this.acceleratex(-1);
        else if (move.right)
            this.acceleratex(1);
        move.left = false;
        move.right = false;
    },
    updateViewport: function() {
        this.viewportY = clamp(canvas.height / 3.8 - voxel.y, canvas.height/2 -(voxel.miny -10), canvas.height / 2-voxel.y);
    },
  };


  const Box = function (x, y, size, color, map) {
    this.x = x;
    this.y = y;
    this.xsize = size;
    this.ysize = size/2;
    //Handles generating an item for the box/platform
    var itemType = this.getRandImageType();
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

const userInputs = () => {
    ENTITIES.forEach((body) => {
        if (body instanceof Voxel)
            body.processKeys();
    });
}

const calcPhysics = () => {
    ENTITIES.forEach((body) => {
        if (body instanceof Voxel)
        {
            body.move();
            body.updateViewport();
        }
    });
}

const gameLogic = () => {
    ENTITIES.forEach((voxel) => {
        if (voxel instanceof Voxel)
        ENTITIES.forEach((box) => {
            if (box instanceof Box)
                voxel.step(box);
        })
    })
    if (voxel.y > voxel.miny + canvas.height/2.0 + voxel.size)
    {
        
        //stopGame(ref)
        //setLostGame(true);
        server_loop ? clearInterval(server_loop) : server_loop = 1;
    }
    if (voxel.y + voxel.size <= -20)
    {
        voxel.vy = -30.8;
        voxel.viewportY = clamp(voxel.canvas.height / 3.8 - voxel.y, voxel.canvas.height/3.8-voxel.y, 1000 );
        console.log("Voxel of id ", voxel.id, " Won!");
    }
}

const renderLoop =() => {
    let viewportY = ENTITIES.voxel.viewportY;
    MAPENTITIES.forEach((body) =>
    {
        body.draw(ctx, 0, viewportY);
    });
    PLAYERS.forEach((voxel) => {
        voxel.draw(ctx, 0, viewPortY)
    });
}

const sendRender = () => {
    ENTITIES.forEach((body) =>
    {
        if (body instanceof Voxel)
        {
            voxelPos[id].x = body.x;
            voxelPos[id].y = body.y
            // emit all of these to all users
            //io.emit('positionUpdate', voxelPos);
        }
    });
}
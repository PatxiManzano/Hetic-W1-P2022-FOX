var player;

Entity = function(type, id, x, y, width, height, img) {
  var self = {
    type: type,
    id: id,
    x: x,
    y: y,
    width: width,
    height: height,
    img: img
  };
  self.update = function() {
    self.updatePosition();
    self.draw();
  };
  self.draw = function() {
    ctx.save();
    var x = self.x;
    var y = self.y;

    x -= self.width;
    y -= self.height;

    ctx.drawImage(
      self.img,
      0,
      0,
      self.img.width,
      self.img.height,
      x,
      y,
      self.width,
      self.height
    );

    ctx.restore();
  };
  self.getDistance = function(entity2) {
    //return distance (number)
    var vx = self.x - entity2.x;
    var vy = self.y - entity2.y;
    return Math.sqrt(vx * vx + vy * vy);
  };

  self.testCollision = function(entity2) {
    //return if colliding (true/false)
    var rect1 = {
      x: self.x - self.width / 2,
      y: self.y - self.height / 2,
      width: self.width,
      height: self.height
    };
    var rect2 = {
      x: entity2.x - entity2.width / 2,
      y: entity2.y - entity2.height / 2,
      width: entity2.width,
      height: entity2.height
    };
    return testCollisionRectRect(rect1, rect2);
  };
  self.updatePosition = function() {};

  return self;
};

Player = function() {
  var self = Actor("player", "myId", 393, 0, 50, 70, Img.player, 10, 1);

  var super_update = self.update;
  self.update = function() {
    super_update();
    if (
      self.pressingRight ||
      self.pressingLeft ||
      self.pressingDown ||
      self.pressingUp
    )
      self.spriteAnimCounter += 0.2;
    if (self.pressingMouseLeft) self.performAttack();
    if (self.pressingMouseRight) self.performSpecialAttack();
  };

  self.updatePosition = function() {
    self.updatePosition = function() {
      console.log(self);

      if (self.pressingRight && self.x < 525) self.x += 10;
      if (self.pressingLeft && self.x > 254) self.x -= 10;
      if (self.pressingDown) self.y += 10;
      if (self.pressingUp) self.y -= 10;
    };
  };
  self.onDeath = function() {
    var timeSurvived = Date.now() - timeWhenGameStarted;
    console.log("You lost! You survived for " + timeSurvived + " ms.");
    startNewGame();
  };
  self.pressingDown = false;
  self.pressingUp = false;
  self.pressingLeft = false;
  self.pressingRight = false;

  self.pressingMouseLeft = false;
  self.pressingMouseRight = false;

  return self;
};

Actor = function(type, id, x, y, width, height, img, hp, atkSpd) {
  var self = Entity(type, id, x, y, width, height, img);

  self.hp = hp;
  self.hpMax = hp;
  self.atkSpd = atkSpd;
  self.attackCounter = 0;
  self.aimAngle = 0;

  self.spriteAnimCounter = 0;

  self.draw = function() {
    ctx.save();
    var x = self.x;
    var y = self.y;

    x -= self.width / 2;
    y -= self.height / 2;

    var frameWidth = self.img.width / 3;
    var frameHeight = self.img.height / 4;

    var aimAngle = self.aimAngle;
    if (aimAngle < 0) aimAngle = 360 + aimAngle;

    var directionMod = 3; //draw right
    if (aimAngle >= 45 && aimAngle < 135)
      //down
      directionMod = 2;
    else if (aimAngle >= 135 && aimAngle < 225)
      //left
      directionMod = 1;
    else if (aimAngle >= 225 && aimAngle < 315)
      //up
      directionMod = 0;

    var walkingMod = Math.floor(self.spriteAnimCounter) % 3; //1,2

    ctx.drawImage(
      self.img,
      walkingMod * frameWidth,
      directionMod * frameHeight,
      frameWidth,
      frameHeight,
      x,
      y,
      self.width,
      self.height
    );

    ctx.restore();
  };

  var super_update = self.update;
  self.update = function() {
    super_update();
    self.attackCounter += self.atkSpd;
    if (self.hp <= 0) self.onDeath();
  };
  self.onDeath = function() {};

  self.performAttack = function() {
    if (self.attackCounter > 25) {
      //every 1 sec
      self.attackCounter = 0;
      Bullet.generate(self);
    }
  };

  self.performSpecialAttack = function() {
    if (self.attackCounter > 50) {
      //every 1 sec
      self.attackCounter = 0;
      /*
			for(var i = 0 ; i < 360; i++){
				Bullet.generate(self,i);
			}
			*/
      Bullet.generate(self, self.aimAngle - 5);
      Bullet.generate(self, self.aimAngle);
      Bullet.generate(self, self.aimAngle + 5);
    }
  };

  return self;
};

//#####

Enemy = function(id, x, y, width, height, img, hp, atkSpd) {
  var self = Actor("enemy", id, x, y, width, height, img, hp, atkSpd);
  Enemy.list[id] = self;

  self.toRemove = false;

  var super_update = self.update;
  self.update = function() {
    super_update();
    self.spriteAnimCounter += 0.2;
    self.updateAim();
    self.performAttack();
  };
  self.updateAim = function() {
    var diffX = player.x - self.x;
    var diffY = player.y - self.y;

    self.aimAngle = (Math.atan2(diffY, diffX) / Math.PI) * 180;
  };
  var super_draw = self.draw;
  self.draw = function() {
    super_draw();
    var x = self.x;
    var y = self.y;

    ctx.save();
    ctx.fillStyle = "red";
    var width = (100 * self.hp) / self.hpMax;
    if (width < 0) width = 0;
    ctx.fillRect(x - 50, y - 30, width, 10);

    ctx.strokeStyle = "black";
    ctx.strokeRect(x - 50, y - 30, 100, 10);

    ctx.restore();
  };

  self.onDeath = function() {
    self.toRemove = true;
  };

  self.updatePosition = function() {
    var diffX = player.x - self.x;
    var diffY = player.y - self.y;

    if (diffX > 0) self.x += 3;
    else self.x -= 3;

    if (diffY > 0) self.y += 3;
    else self.y -= 3;
  };
};

Enemy.list = {};

Enemy.update = function() {
  if (frameCount % 100 === 0)
    //every 4 sec
    Enemy.randomlyGenerate();
  for (var key in Enemy.list) {
    Enemy.list[key].update();
  }
  for (var key in Enemy.list) {
    if (Enemy.list[key].toRemove) delete Enemy.list[key];
  }
};

Enemy.randomlyGenerate = function() {
  //Math.random() returns a number between 0 and 1
  var x = Math.random() * Maps.current.width;
  var y = Math.random() * Maps.current.height;
  var height = 64;
  var width = 64;
  var id = Math.random();
  if (Math.random() < 0.5) Enemy(id, x, y, width, height, Img.bat, 2, 1);
  else Enemy(id, x, y, width, height, Img.DemonSprite, 1, 3);
};

//#####
Upgrade = function(id, x, y, width, height, category, img) {
  var self = Entity("upgrade", id, x, y, width, height, img);

  self.category = category;
  Upgrade.list[id] = self;
};

Upgrade.list = {};

Upgrade.update = function() {
  if (frameCount % 75 === 0)
    //every 3 sec
    Upgrade.randomlyGenerate();
  for (var key in Upgrade.list) {
    Upgrade.list[key].update();
    var isColliding = player.testCollision(Upgrade.list[key]);
    if (isColliding) {
      if (Upgrade.list[key].category === "score") score += 1000;
      if (Upgrade.list[key].category === "atkSpd") player.atkSpd += 3;
      delete Upgrade.list[key];
    }
  }
};

Upgrade.randomlyGenerate = function() {
  //Math.random() returns a number between 0 and 1
  var x = Math.random() * Maps.current.width;
  var y = Math.random() * Maps.current.height;
  var height = 32;
  var width = 32;
  var id = Math.random();

  if (Math.random() < 0.5) {
    var category = "score";
    var img = Img.upgrade1;
  } else {
    var category = "atkSpd";
    var img = Img.upgrade2;
  }

  Upgrade(id, x, y, width, height, category, img);
};

//#####
Bullet = function(id, x, y, spdX, spdY, width, height, combatType) {
  var self = Entity("bullet", id, x, y, width, height, Img.bullet);

  self.timer = 0;
  self.combatType = combatType;
  self.spdX = spdX;
  self.spdY = spdY;

  self.updatePosition = function() {
    self.x += self.spdX;
    self.y += self.spdY;

    if (self.x < 0 || self.x > Maps.current.width) {
      self.spdX = -self.spdX;
    }
    if (self.y < 0 || self.y > Maps.current.height) {
      self.spdY = -self.spdY;
    }
  };

  Bullet.list[id] = self;
};

Bullet.list = {};

Bullet.update = function() {
  for (var key in Bullet.list) {
    var b = Bullet.list[key];
    b.update();

    var toRemove = false;
    b.timer++;
    if (b.timer > 75) {
      toRemove = true;
    }

    if (b.combatType === "player") {
      //bullet was shot by player
      for (var key2 in Enemy.list) {
        if (b.testCollision(Enemy.list[key2])) {
          toRemove = true;
          Enemy.list[key2].hp -= 1;
        }
      }
    } else if (b.combatType === "enemy") {
      if (b.testCollision(player)) {
        toRemove = true;
        player.hp -= 1;
      }
    }

    if (toRemove) {
      delete Bullet.list[key];
    }
  }
};

Bullet.generate = function(actor, aimOverwrite) {
  //Math.random() returns a number between 0 and 1
  var x = actor.x;
  var y = actor.y;
  var height = 24;
  var width = 24;
  var id = Math.random();

  var angle;
  if (aimOverwrite !== undefined) angle = aimOverwrite;
  else angle = actor.aimAngle;

  var spdX = Math.cos((angle / 180) * Math.PI) * 5;
  var spdY = Math.sin((angle / 180) * Math.PI) * 5;
  Bullet(id, x, y, spdX, spdY, width, height, actor.type);
};

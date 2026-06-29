const canvas = document.getElementById("game"); //canvas element form html
const ctx = canvas.getContext("2d"); //drawing tools 
//canvas width and height variables 
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

ctx.imageSmoothingEnabled = false;

const inventoryMenu = document.getElementById("inventoryMenu")
const maxEnemies = 150;
const maxParticles = 500;
const maxBullets = 100;
let gameState = "menu"

//------------------------------------images
const playerLeft = new Image()
const heartImage = new Image()
const playerRight = new Image()
const playerMoveLeft = new Image()
const playerMoveRight = new Image()
const enemyHit = new Image()
const invButtonImage = new Image()

const mushroomImages = [
    new Image(),
    new Image()
]
const enemyImages = [
    new Image(),
    new Image(),
    new Image(),
    new Image(),
    new Image(),
    new Image(),
    new Image(),
    new Image()
]

const weaponImages = [
    new Image(),
    new Image(),
    new Image(),
    new Image()
]

const expImage = new Image()
const grassImage = new Image()

playerLeft.src = "images/left.png"
playerMoveLeft.src = "images/left-walk.png"
playerRight.src = "images/right.png"
playerMoveRight.src = "images/right-walk.png"
invButtonImage.src = "images/inventory.png"

enemyImages[0].src = "images/green-slime.png"
enemyImages[1].src = "images/teal-slime.png"
enemyImages[2].src = "images/blue_slime.png"
enemyImages[3].src = "images/green-king.png"
enemyImages[4].src = "images/teal-king.png"
enemyImages[5].src = "images/blue-king.png"
enemyImages[6].src = "images/hit_enemy.png"
enemyImages[7].src = "images/damage_king.png"

weaponImages[0].src = "images/pistol.png"
weaponImages[1].src = "images/smg.png"
weaponImages[2].src = "images/shotgun.png"
weaponImages[3].src = "images/minigun.png"

mushroomImages[0].src = "images/mushroom.png"
mushroomImages[1].src = "images/mushroom2.png"

heartImage.src = "images/heart.png"
expImage.src = "images/exp2.png"
grassImage.src = "images/grass.png"

//--------------------------------Sounds
const buttonSound = new Audio("sounds/buttonpress.mp3");
const deathSound = new Audio("sounds/death.mp3");
const enemyDeathSound = new Audio("sounds/enemy_kill.mp3");
const levelUpSound = new Audio("sounds/level-up.mp3");
const shotSound = new Audio("sounds/pistol.mp3");
const shotgunSound = new Audio("sounds/shotgun.mp3");

shotSound.volume = 0.3;

const inventoryButton = document.getElementById("inventoryButton");
inventoryButton.innerHTML = `
    <img src="${invButtonImage.src}" alt="Inventory"><span>Inventory</span>`;

let buttonHover = false;
canvas.addEventListener("mousemove", (e) => {
    if (gameState !== "menu") return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const buttonX = canvas.width / 2 - 150;
    const buttonY = canvas.height / 2 + 150;


    buttonHover =
        mouseX> buttonX &&
        mouseX < buttonX + 300 &&
        mouseY > buttonY &&
        mouseY < buttonY + 80;
});

canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (gameState === "menu") {
        const buttonX = canvas.width / 2 - 150;
        const buttonY = canvas.height / 2 + 150;
        const buttonW = 300;
        const buttonH = 80;

        if (
            mouseX> buttonX &&
            mouseX < buttonX + buttonW &&
            mouseY > buttonY &&
            mouseY < buttonY + buttonH
        ) {
            buttonSound.currentTime = 0;
            buttonSound.play();
            gameState = "playing"
        }
    }
})


window.addEventListener("resize", resize);
resize();

let gameOver = false;

let inventoryOpen = false;
let damageFlash = 0;
let score = 0;
let difficulty = 1;
let spawnTimer = 0;
let spawnDelay = 2000;

let walkFrame = false;
setInterval(() => {
    walkFrame = !walkFrame;
}, 150);

//tracks which keys are currently pressed 
const keys = {};

const enemies = []; //enemy array

const bullets = []; //bullet array (on screen)

const gems = []; //enemy drops array

const mushrooms = [];

const muzzleFlashes = [];

const particles = [];

//player object 
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 100,
    speed: 5,
    hp: 5,
    maxHp: 5,
    xp: 0,
    xpNeeded: 10,
    level: 1,
    direction: "right",
    moving: false,
}

const weapons = [
    {
        name: "pistol", 
        damage: 10, 
        cooldown: 500, 
        bulletSpeed: 8, 
        bulletSize: 8,
        projectiles: 1, 
        owned: true,   
        icon: weaponImages[0],
        sound: shotSound
    },
    {
        name: "SMG",    
        damage: 5,  
        cooldown: 300, 
        bulletSpeed: 10, 
        bulletSize: 6, 
        projectiles: 1, 
        owned: false,  
        icon: weaponImages[1],
        sound: shotSound
    },
    {
        name: "shotgun",
        damage: 8,  
        cooldown: 800, 
        bulletSpeed: 7,  
        bulletSize: 7, 
        projectiles: 5, 
        owned: false,  
        icon: weaponImages[2],
        sound: shotgunSound
    },
    {
        name: "minigun", 
        damage: 10, 
        cooldown: 250, 
        bulletSpeed: 15, 
        bulletSize: 5, 
        projectiles: 1, 
        owned: false,   
        icon: weaponImages[3],
        sound: shotSound
    }
]

const enemyTypes = [
    {name: "green slime", 
        hp:20,
        speed:2,
        damage:1,
        size:100,
        hitbox:20,
        sprite:enemyImages[0],
        hitsprite:enemyImages[6],
        xp:3,
        rarity:0.399,
        spriteOffsetY:-20
    },
    {name: "teal slimes", 
        hp:30,
        speed:1.5,
        damage:1,
        size:150,
        hitbox:25,
        sprite:enemyImages[1],
        hitsprite:enemyImages[6],
        xp:5,
        rarity:0.25,
        spriteOffsetY:-25
    },
    {name: "blue slime",
        hp:10,
        speed:3,
        damage:1, 
        size:120,
        hitbox:22,
        sprite:enemyImages[2],
        hitsprite:enemyImages[6],
        xp:5, 
        rarity:0.2,
        spriteOffsetY:-22
    },
    {name: "Green King",
        hp:100, 
        speed:1,
        damage:2, 
        size:200, 
        hitbox:40,
        sprite:enemyImages[3],
        hitsprite:enemyImages[7],
        xp:50,
        rarity:0.05,
        spriteOffsetY:-30
    },
    {name: "Teal King",
        hp:150, 
        speed:0.5,
        damage:2,
        size:300,
        hitbox:60,
        sprite:enemyImages[4],
        hitsprite:enemyImages[7],
        xp:50, 
        rarity:0.05,
        spriteOffsetY:-50
    },
    {name: "Blue King", 
        hp:50,
        speed:2,
        damage:2,
        size:240,
        hitbox:50,
        sprite:enemyImages[5],
        hitsprite:enemyImages[7],
        xp:50, 
        rarity:0.05,
        spriteOffsetY:-40
    },
    {name: "Big Boss",
        hp:1000,
        speed: 0.1,
        damage:2,
        size: 1200,
        hitbox: 300,
        sprite:enemyImages[0],
        hitsprite:enemyImages[6],
        xp:500,
        rarity:0.001,
        spriteOffsetY:-200
    }
]

for (let i=0; i<100; i++) {
    mushrooms.push({
        x:Math.random() * 10000-5000,
        y:Math.random() * 10000 - 5000,
        size: Math.floor(Math.random() * 20) + 200,
        rotation: Math.random() * Math.PI * 2,
        image: mushroomImages[Math.floor(Math.random() * mushroomImages.length)]
    });
}

inventoryButton.addEventListener("click", () => {
    inventoryOpen = !inventoryOpen;
    if (inventoryOpen) {
        inventoryMenu.style.display = "block";
        shotSound.pause();
        shotSound.currentTime=0;
        shotgunSound.pause();
        shotgunSound.currentTime=0;
    }
    else {
        inventoryMenu.style.display = "none";
    }
})

let equippedWeapon =weapons[0];
let lastShot = 0;

const camera = {
    x: player.x - canvas.width/2,
    y: player.y - canvas.height/2
}

//checks when a key is pressed 
document.addEventListener("keydown", (e) => {
    keys[e.key.toLowerCase()] = true; //changes the key pressed = true
})

//checks when key is released
document.addEventListener("keyup", (e) => {
    keys[e.key.toLowerCase()] = false; //changes the key release = false
})



function spawnEnemy () { //creates a single new enemie
    const side = Math.floor(Math.random() * 4); //chosing a random side of the screen
    let x;
    let y;

    //topp edge spawn
    if (side ==0) {
        x=camera.x + Math.random() * canvas.width;
        y = camera.y - 50;
    }

    //rdght edge spawn
    if (side == 1) {
        x= camera.x + canvas.width + 30;
        y = camera.y+Math.random() * canvas.height;
    }

    //bottom edge spawn
    if (side == 2) {
        x= camera.x+Math.random() * canvas.width;
        y = camera.y + canvas.height + 30
    }

    //left edge spawn
    if (side == 3) {
        x = camera.x-30;
        y = camera.y+Math.random() * canvas.height;
    }

    const type = chooseEnemyType();
    enemies.push({
        x:x,
        y:y,
        name:type.name,
        size:type.size,
        hitbox:type.hitbox,

        speed:type.speed,
        hp:Math.floor(type.hp * (1+player.level*0.02)),
        maxHp:Math.floor(type.hp *(1+player.level*0.02)),
        damage:type.damage,
        xp:type.xp,
        flashTime:0,
        lastHit:0,
        sprite:type.sprite,
        hitsprite:type.hitsprite,
        spriteOffsetY:type.spriteOffsetY,
        animOffset: Math.random() * Math.PI * 2
    });
}

function shootNearestEnemy() {
    if (enemies.length ==0) { // doesnt shoot if there are no enemies 
        return;
    }
    let nearestEnemy = enemies[0]; //assume first enemy is closest 
    let nearestDistance = Math.hypot(
        player.x - nearestEnemy.x,
        player.y - nearestEnemy.y
    );

    for (const enemy of enemies) {

        const distance = Math.hypot(
            player.x - enemy.x,
            player.y - enemy.y
        );

        if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestEnemy = enemy;

        }
    }

    const dx = nearestEnemy.x - player.x;
    const dy = nearestEnemy.y - player.y;
    const distance = Math.hypot(dx, dy);

    const sound = equippedWeapon.sound.cloneNode();
    sound.volume = equippedWeapon.sound.volume;
    sound.play();
    for (let i = 0; i < equippedWeapon.projectiles; i++) {
        const spread = (i - (equippedWeapon.projectiles - 1) / 2) * 0.1;
        const angle = Math.atan2(dy,dx) + spread;
        if (bullets.length < maxBullets) {
            bullets.push({
                x: player.x,
                y: player.y,
                vx: Math.cos(angle) * equippedWeapon.bulletSpeed,
                vy: Math.sin(angle) * equippedWeapon.bulletSpeed,

                size: equippedWeapon.bulletSize,
                damage: equippedWeapon.damage,

                trail: []

            })
        }

        muzzleFlashes.push({
            x:player.x,
            y:player.y,
            angle:angle,
            life:8,
            size:24
        })
    }



}
function chooseEnemyType() {
    const roll = Math.random();
    let total = 0;
    for (const enemy of enemyTypes) {
        total += enemy.rarity;
        if (roll < total) {
            return enemy;
        }
    }
    return enemyTypes[0];
}
//updates game logic every frame
function update() {
    if (inventoryOpen) return;
    camera.x = player.x - canvas.width / 2;
    camera.y = player.y - canvas.height / 2;
    player.moving = false;
    let moveX = 0;
    let moveY = 0;

    if (keys["w"]) {
        moveY--;
        player.moving = true;
    }

    if (keys["s"]) {
        moveY++;
        player.moving = true;
    }

    if (keys["a"]) {
        moveX--;
        player.direction = "left";
    }

    if (keys["d"]) {
        moveX++;
        player.direction = "right";
    }
    const length = Math.hypot(moveX, moveY);
    if (length > 0) {
        moveX /= length;
        moveY /= length;

        player.x += moveX * player.speed;
        player.y += moveY * player.speed;
        player.moving = true;
    }


    //loop through every enemy
    for (const enemy of enemies) {
        if (enemy.flashTime > 0) {
            enemy.flashTime--;
        }
        const dx = player.x - enemy.x; // adj 
        const dy = player.y - enemy.y; // op

        const dist = Math.hypot(dx, dy) // hyp distance 

        if (dist > 0) { // enemy moves towards player 
            enemy.x += (dx / dist) * enemy.speed;
            enemy.y += (dy / dist) * enemy.speed;
        }
        //player enemy collisions
        const collisionDistance = player.size / 2 + enemy.hitbox / 2;
        if (dist < collisionDistance) {
            const now = Date.now();

            if (now - enemy.lastHit > 1000) {
                player.hp -= enemy.damage;
                damageFlash = 10;
                enemy.lastHit = now;
            }
        }
    }

    spawnTimer += 16;
    if (spawnTimer >= spawnDelay) {
        if (enemies.length < maxEnemies) {
            spawnEnemy();   
        }
        spawnTimer=0;
    }

    const now = Date.now();

    if (now - lastShot > equippedWeapon.cooldown) {
        shootNearestEnemy();
        lastShot = now;
    }
    for (let i = bullets.length - 1; i>=0; i--) {
        const bullet = bullets[i]
        bullet.trail.push({
            x: bullet.x,
            y:bullet.y
        });
        if (bullet.trail.length > 6) {
            bullet.trail.shift();
        }
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;

        if (
            bullet.x < camera.x - 100 || 
            bullet.x > camera.x + canvas.width + 100 || 
            bullet.y < camera.y - 100 || 
            bullet.y > camera.y + canvas.height + 100
        ) {
            bullets.splice(i, 1);
        }
    }

    if (player.hp <= 0) {
        deathSound.play();
        gameOver = true;
    }

    for (let b = bullets.length -1; b >= 0; b--) {
        const bullet = bullets[b];
        for (let e = enemies.length - 1; e >= 0; e--) {
            const enemy = enemies[e];
            const distance = Math.hypot(
                bullet.x - enemy.x,
                bullet.y-enemy.y
            );
            const hitDistance = bullet.size / 2 + enemy.hitbox / 2;
            if (distance < hitDistance) {
                enemy.hp -= bullet.damage;
                enemy.flashTime = 6;
                bullets.splice(b,1);
                const orbSize = Math.floor(Math.random() * 31) + 20;
                if (enemy.hp <= 0) {

                    for (let i = 0; i < 12; i++) {
                        if (particles.length < maxParticles)
                            particles.push({
                                x:enemy.x,
                                y:enemy.y,
                                vx:(Math.random()-0.5) * 8,
                                vy:(Math.random()-0.5) * 8,
                                size: Math.random() * 6 + 4,
                                life: 25
                            });
                    }

                    const sound = enemyDeathSound.cloneNode();
                    sound.play();
                    gems.push({
                        x:enemy.x,
                        y: enemy.y,
                        size: orbSize,
                        value: enemy.xp,
                        bobOffset: Math.random() * Math.PI * 2,
                        rotation: 0,
                        pulse: Math.random() * Math.PI * 2,
                        vx:0,
                        vy:0
                    });
                    enemies.splice(e,1);
                    score++;

                }
                break;
            }
        }
    }

    for (let i = gems.length - 1; i >=0; i--) {
        const gem = gems[i];
        if (!gem) continue;
        const dx = player.x - gem.x;
        const dy = player.y - gem.y;
        const distance = Math.hypot(dx,dy);

        gem.bobOffset += 0.08;
        gem.rotation += 0.05;
        gem.pulse += 0.1;

        if (distance < 300) {
            const pullStrength = 0.35;
            gem.vx += (dx/distance) * pullStrength;
            gem.vy += (dy/distance) * pullStrength;
        }

        gem.x += gem.vx
        gem.y += gem.vy
        gem.vx *= 0.9
        gem.vy *= 0.9
        const collisionDistance = player.size / 2 + gem.size / 2;
        if (distance < collisionDistance) {
            player.xp += gem.value;
            gems.splice(i,1)
        }
    }


    for (let i=muzzleFlashes.length - 1; i >=0; i--) {
        muzzleFlashes[i].life--;
        if (muzzleFlashes[i].life <= 0) {
            muzzleFlashes.splice(i,1);
        }
    }
    if (player.xp >= player.xpNeeded) {
        levelUpSound.currentTime=0;
        levelUpSound.play();
        player.xp -= player.xpNeeded;
        player.level++;
        difficulty += 0.08;
        player.xpNeeded = Math.floor(player.xpNeeded * 1.2)

        spawnDelay = Math.max(250,spawnDelay-20);
        if (player.level===5) {
            weapons[1].owned = true;
            updateInventory();
        }
        if(player.level===10) {
            weapons[2].owned = true;
            updateInventory();
        }
        if(player.level===15) {
            weapons[3].owned=true;
            updateInventory();
        }
        
    }
    if (damageFlash > 0) {
        damageFlash--;
    }

    for (let i = particles.length - 1; i >=0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.92;
        p.vy *= 0.92;
        p.life--;
        if (p.life <= 0) {
            particles.splice(i,1);
        }
    }
}

//draws everything everyframe
function draw() {

    let shakeX = 0;
    let shakeY = 0;
    if (damageFlash > 0) {
        shakeX = (Math.random() - 0.5) * 8;
        shakeY = (Math.random() - 0.5) * 8;
    }
    ctx.save();
    ctx.translate(shakeX,shakeY);

    ctx.clearRect(0,0, canvas.width, canvas.height); //clear previous 

    const TILE_SIZE = 216
    const startX = Math.floor(camera.x / TILE_SIZE) * TILE_SIZE;
    const startY = Math.floor(camera.y /TILE_SIZE) * TILE_SIZE;
    for (let x=startX; x < camera.x + canvas.width; x += TILE_SIZE) {
        for (let y=startY; y <camera.y + canvas.height; y += TILE_SIZE) {
            ctx.drawImage(grassImage,x -camera.x,y-camera.y,TILE_SIZE,TILE_SIZE)
        }
    }

    for (const mushroom of mushrooms) {
        ctx.save();
        ctx.translate(mushroom.x - camera.x, mushroom.y -camera.y);
        ctx.drawImage(
            mushroom.image,
            -mushroom.size / 2,
            - mushroom.size/2,
            mushroom.size, mushroom.size
        );
        ctx.restore();
    }

    let aimAngle = 0;
    if (enemies.length > 0) {
        let nearestEnemy = enemies[0];
        let nearestDistance = Math.hypot(
            player.x - nearestEnemy.x,
            player.y - nearestEnemy.y
        );

        for (const enemy of enemies) {
            const distance = Math.hypot(
                player.x - enemy.x,
                player.y - enemy.y,
            );
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestEnemy = enemy;
            }
        }
        aimAngle = Math.atan2(
            nearestEnemy.y - player.y,
            nearestEnemy.x - player.x,
        )
    }


    let currentPlayerImage;
    if (player.direction == "left") {
        if (player.moving) {
            currentPlayerImage = walkFrame
            ? playerMoveLeft
            : playerLeft;
        } else {
            currentPlayerImage = playerLeft;
        }
    }
    else {
        if (player.moving) {
            currentPlayerImage = walkFrame
            ? playerMoveRight
            : playerRight;
        } else {
            currentPlayerImage = playerRight;
        }
    }

    for (const flash of muzzleFlashes) {
        ctx.save();
        ctx.translate(
            flash.x - camera.x,
            flash.y - camera.y
        );
        ctx.rotate(flash.angle);
        const size = flash.life * 4;
        ctx.fillStyle = "yellow"
        ctx.beginPath();
        ctx.moveTo(size, 0)
        ctx.lineTo(0, -size/2);
        ctx.lineTo(0,size/2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(
        canvas.width/2-16,
        canvas.height / 2 + 25,
        20,8,0,0,Math.PI*2
    );
    ctx.fill();
    ctx.drawImage(currentPlayerImage,canvas.width/2-64,canvas.height/2-64,96,96);

    ctx.save();
    ctx.translate(
        canvas.width/2, canvas.height/2
    );
    ctx.rotate(aimAngle)
    ctx.drawImage(
        equippedWeapon.icon,
        -45,-35,75,75
    );
    ctx.restore();

    
    for (const enemy of enemies) {
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.beginPath();
        ctx.ellipse(
            enemy.x - camera.x,
            enemy.y -camera.y + enemy.hitbox * 0.28,
            enemy.hitbox * 0.7,
            enemy.hitbox * 0.25,0,0,Math.PI*2
        );
        ctx.fill();
        const bounce = Math.sin(Date.now() * 0.01 + enemy.animOffset) * 5;
        const image = enemy.flashTime > 0
            ? enemy.hitsprite
            : enemy.sprite;
        ctx.drawImage( //drawing the enemies 
            image,
            enemy.x - enemy.size /2 -camera.x,
            enemy.y - enemy.size /2-camera.y + bounce + enemy.spriteOffsetY,
            enemy.size,
            enemy.size
        )

        ctx.fillStyle = "green"
        ctx.fillRect(
            enemy.x - 15 - camera.x,
            enemy.y - 20 - camera.y + bounce + enemy.spriteOffsetY,
            (enemy.hp/enemy.maxHp) * 30,4
        )
    }

    for (const p of particles) {
        ctx.globalAlpha = p.life/25;
        ctx.fillStyle = "#ffcf40"
        ctx.beginPath();
        ctx.arc(p.x-camera.x,p.y-camera.y,p.size,0,Math.PI*2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }    

    for (let i = 0; i < player.hp; i++) {
        ctx.drawImage (
            heartImage,
            20 + i * 40, //x pox
            20, // y pos
            32, // width
            32 // height
        )
    }

    for (const bullet of bullets) {
        for (let i=0; i < bullet.trail.length; i++) {
            const point = bullet.trail[i];
            const alpha = i / bullet.trail.length;
            ctx.beginPath();
            ctx.fillStyle = `rgba(255,230,100,${alpha * 0.4})`;
            ctx.arc(
                point.x - camera.x,
                point.y - camera.y,
                bullet.size * alpha,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }

        const x = bullet.x - camera.x;
        const y = bullet.y - camera.y;

        ctx.shadowColor = "#ffd84d";
        ctx.shadowBlur = 25;

        ctx.beginPath();
        ctx.fillStyle = "rgba(255,220,80,0.15)";
        ctx.arc(x,y,bullet.size * 2.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = "rgba(255,230,120,0.25)";
        ctx.arc(x,y,bullet.size*1.5,0,Math.PI*2)
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = "#fff9c4"
        ctx.arc(x,y,bullet.size,0,Math.PI*2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = "white"
        ctx.arc(x,y,bullet.size,0,Math.PI * 2);
        ctx.fill();
    }

    for (const gem of gems) {
        const floatY = Math.sin(gem.bobOffset) *8
        const scale = 1 + Math.sin(gem.pulse) * 0.1
        ctx.save();
        ctx.translate(gem.x - camera.x, gem.y-camera.y + floatY);
        ctx.rotate(gem.rotation);
        ctx.drawImage(
            expImage,
            -gem.size/2*scale,
            -gem.size/2*scale,
            gem.size*scale,
            gem.size*scale
        );
        ctx.restore();
    }

    ctx.fillStyle = "white";
    ctx.font = "30px 'font'";
    ctx.fillText("score: " + score, 70, 80)

    const x = 230;
    const y = 25;
    const width = 300;
    const height = 20;

    ctx.fillStyle = "#1b0d31";
    ctx.fillRect(x,y,width,height);
    ctx.fillStyle = "#8c3cff";
    ctx.fillRect(x,y,(player.xp / player.xpNeeded) * width, height)
    ctx.lineWidth = 3;
    ctx.strokeStyle ="white";
    ctx.strokeRect(x,y,width,height);
    ctx.font ="20px 'font'";
    ctx.fillText(`Level ${player.level}`,350,85)

    ctx.restore();
    if (damageFlash > 0) {
        ctx.fillStyle = `rgba(255,0,0,${damageFlash/20})`;
        ctx.fillRect(0,0,canvas.width, canvas.height);
    }
}
function drawStartScreen() {
    ctx.clearRect(0,0,canvas.width,canvas.height);

    ctx.fillStyle ="#1f1136";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    ctx.fillStyle = "white";
    ctx.font = "120px 'font'";
    ctx.textAlign = "center";

    ctx.fillText("Vrotato", canvas.width/2, canvas.height/2);
 
    const buttonX = canvas.width / 2 - 150;
    const buttonY = canvas.height / 2 + 150;

    ctx.fillStyle = "#20041b9a"
    ctx.fillRect(buttonX + 12,buttonY+18,300,80);

    if (buttonHover) {
        ctx.shadowColor = "#ff00ff"
        ctx.shadowBlur = 25;
    }

    ctx.fillStyle = buttonHover ? "#8b00ff": "#5b00b8";
    ctx.fillRect(buttonX,buttonY,300,80);

    ctx.shadowBlur = 0;

    ctx.strokeStyle = "#7d6490";
    ctx.lineWidth = 4;
    ctx.strokeRect(buttonX,buttonY,300,80);

    ctx.font = "50px 'font'";
    ctx.textAlign = "center"
    ctx.fillStyle = "black";
    ctx.fillText("START", canvas.width / 2 + 5, buttonY + 55 + 5)

    ctx.fillStyle = "white";
    ctx.font = "50px 'font'";
    ctx.fillText("START", canvas.width/2,buttonY+55);

    ctx.fillStyle = "rgba(0,0,0,0.15)"
    for(let y = 0; y < canvas.height; y += 4){
        ctx.fillRect(0,y,canvas.width,2);
    }

}
//game loop
function gameloop() {
    if (gameState === "menu") {
        drawStartScreen();
        requestAnimationFrame(gameloop);
        return;
    }

    if (gameOver) {
        ctx.fillStyle = "white";
        ctx.font = "90px 'font'";
        ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2);
        return;
    }

    update();
    draw();
    requestAnimationFrame(gameloop); //loops the game
}

function updateInventory() {
    inventoryMenu.innerHTML = "";
    for (const weapon of weapons) {
        if (!weapon.owned) continue;
        const button = document.createElement("button");
        button.innerHTML = `
        <img src="${weapon.icon.src}" width = "80">
        <h3>${weapon.name}</h3>
        Damage: ${weapon.damage}<br>
        Fire Rate: ${weapon.cooldown}ms<br>
        Projectiles: ${weapon.projectiles}<br>
        `;

        button.onclick = () => {
            buttonSound.currentTime=0;
            buttonSound.play();
            equippedWeapon = weapon;
            console.log("equipped",weapon.name);
        };
        inventoryMenu.appendChild(button)
    }
}

updateInventory();
gameloop();
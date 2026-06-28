const canvas = document.getElementById("game"); //canvas element form html
const ctx = canvas.getContext("2d"); //drawing tools 
ctx.imageSmoothingEnabled = false;

const inventoryMenu = document.getElementById("inventoryMenu")

//images

const playerLeft = new Image()
const heartImage = new Image()
const playerRight = new Image()
const playerMoveLeft = new Image()
const playerMoveRight = new Image()
const enemyHit = new Image()

const enemyImages = [
    new Image(),
    new Image(),
    new Image(),
]

const weaponImages = [
    new Image(),
    new Image(),
    new Image(),
]

const expImage = new Image()
const grassImage = new Image()

playerLeft.src = "images/left.png"
playerMoveLeft.src = "images/left-walk.png"
playerRight.src = "images/right.png"
playerMoveRight.src = "images/right-walk.png"

enemyImages[0].src = "images/green-slime.png"
enemyImages[1].src = "images/teal-slime.png"
enemyImages[2].src = "images/blue_slime.png"
enemyHit.src = "images/hit_enemy.png"

weaponImages[0].src = "images/pistol.png"
weaponImages[1].src = "images/smg.png"
weaponImages[2].src = "images/shotgun.png"

heartImage.src = "images/heart.png"
expImage.src = "images/exp2.png"
grassImage.src = "images/grass.png"

//canvas width and height variables 
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

let gameOver = false;
let inventoryOpen = false;
let damageFlash = 0;
let score = 0;

let walkFrame = false;
setInterval(() => {
    walkFrame = !walkFrame;
}, 150);

//tracks which keys are currently pressed 
const keys = {};

const enemies = []; //enemy array

const bullets = []; //bullet array (on screen)

const gems = []; //enemy drops array

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
    {name: "pistol", damage: 10, cooldown: 500, bulletSpeed: 8,  bulletSize: 8, projectiles: 1, owned: true,   icon: weaponImages[0]},
    {name: "SMG",    damage: 3,  cooldown: 100, bulletSpeed: 10, bulletSize: 6, projectiles: 1, owned: false,  icon: weaponImages[1]},
    {name: "shotgun",damage: 8,  cooldown: 800, bulletSpeed: 7,  bulletSize: 7, projectiles: 5, owned: false,  icon: weaponImages[2]},
]

const inventoryButton = document.getElementById("inventoryButton");
inventoryButton.addEventListener("click", () => {
    inventoryOpen = !inventoryOpen;
    if (inventoryOpen) {
        inventoryMenu.style.display = "block";
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

    enemies.push({
        x:x,
        y:y,
        size: 100,
        hitbox: 20,
        speed:2,
        flashTime:0,
        lastHit: 0,
        hp: 20,
        sprite: enemyImages[Math.floor(Math.random()*3)],
        hitsprite: enemyHit
    })
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

    for (let i = 0; i < equippedWeapon.projectiles; i++) {
        const spread = (i - (equippedWeapon.projectiles - 1) / 2) * 0.1;
        const angle = Math.atan2(dy,dx) + spread;
        bullets.push({
            x: player.x,
            y: player.y,
            vx: Math.cos(angle) * equippedWeapon.bulletSpeed,
            vy: Math.sin(angle) * equippedWeapon.bulletSpeed,

            size: equippedWeapon.bulletSize,
            damage: equippedWeapon.damage

        })
    }


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
                player.hp -= 1;
                damageFlash = 10;
                enemy.lastHit = now;
            }
        }
    }

    const now = Date.now();

    if (now - lastShot > equippedWeapon.cooldown) {
        shootNearestEnemy();
        lastShot = now;
    }

    for (const bullet of bullets) {
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
    }

    if (player.hp <= 0) {
        gameOver = true;
    }

    for (let b = bullets.length -1; b >= 0; b--) {
        const bullet = bullets[b];
        for (let e = enemies.length - 1; e >= 0; e--) {
            const enemy = enemies[e];
            const dx = bullet.x - enemy.x;
            const dy = bullet.y - enemy.y;

            const distance = Math.hypot(dx, dy);
            const hitDistance = bullet.size / 2 + enemy.hitbox / 2;

            if (distance < hitDistance) {
                enemy.hp -= bullet.damage;
                enemy.flashTime = 6;
                bullets.splice(b,1);
                const orbSize = Math.floor(Math.random() * 31) + 20;
                if (enemy.hp <= 0) {
                    gems.push({
                        x:enemy.x,
                        y: enemy.y,
                        size: orbSize,
                        value: (Math.floor(orbSize / 10)),
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
            const pullStrength = 0.15;
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

    if (player.xp >= player.xpNeeded) {
        player.xp -= player.xpNeeded;
        player.level++;
        player.xpNeeded = Math.floor(player.xpNeeded * 1.5)
        
    }
    if (damageFlash > 0) {
        damageFlash--;
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

    const TILE_SIZE = 96
    const startX = Math.floor(camera.x / TILE_SIZE) * TILE_SIZE;
    const startY = Math.floor(camera.y /TILE_SIZE) * TILE_SIZE;
    for (let x=startX; x < camera.x + canvas.width; x += TILE_SIZE) {
        for (let y=startY; y <camera.y + canvas.height; y += TILE_SIZE) {
            ctx.drawImage(grassImage,x -camera.x,y-camera.y,TILE_SIZE,TILE_SIZE)
        }
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
        const image = enemy.flashTime > 0
            ? enemy.hitsprite
            : enemy.sprite;
        ctx.drawImage( //drawing the enemies 
            image,
            enemy.x - enemy.size /2 -camera.x,
            enemy.y - enemy.size /2-camera.y,
            enemy.size,
            enemy.size
        )

        ctx.fillStyle = "green"
        ctx.fillRect(
            enemy.x - 15 - camera.x,
            enemy.y - 20 - camera.y,
            (enemy.hp/20) * 30,4
        )
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
        ctx.fillStyle = "yellow"

        ctx.fillRect(
            bullet.x - bullet.size / 2 - camera.x,
            bullet.y - bullet.size / 2 - camera.y,
            bullet.size,
            bullet.size
        )
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
    ctx.fillText("score: " + score, 20, 80)

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

//game loop
function gameloop() {
    if (gameOver) {
        ctx.fillStyle = "white";
        ctx.font = "60px 'font'";
        ctx.fillText("Game Over", canvas.width / 2 - 170, canvas.height / 2);
        return;
    }

    update();
    draw();
    requestAnimationFrame(gameloop); //loops the game
}

for (const weapon of weapons) {
    const button = document.createElement("button");
    button.innerHTML = `
    <img src="${weapon.icon.src}" width = "80">
    <h3>${weapon.name}</h3>
    Damage: ${weapon.damage}<br>
    Fire Rate: ${weapon.cooldown}ms<br>
    Projectiles: ${weapon.projectiles}<br>
    `;

    button.onclick = () => {
        equippedWeapon = weapon;
        console.log("equipped",weapon.name);
    };
    inventoryMenu.appendChild(button)
}

setInterval(spawnEnemy, 1000) // spawn one enemy every second 
gameloop();
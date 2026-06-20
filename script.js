const canvas = document.getElementById("game"); //canvas element form html
const ctx = canvas.getContext("2d"); //drawing tools 
const heartImage = new Image()
const inventoryMenu = document.getElementById("inventoryMenu")

//images
heartImage.src = "images/heart.png"


//canvas width and height variables 
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let gameOver = false;
let inventoryOpen = false;

let score = 0;

//tracks which keys are currently pressed 
const keys = {};

const enemies = []; //enemy array

const bullets = []; //bullet array (on screen)

const gems = []; //enemy drops array

//player object 
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 25,
    speed: 5,
    hp: 5,
    maxHp: 5,
    xp: 0,
    xpNeeded: 10,
    level: 1,
}

const weapons = [
    {name: "pistol", damage: 10, cooldown: 500, bulletSpeed: 8,  bulletSize: 8, projectiles: 1, owned: true,   icon: null},
    {name: "SMG",    damage: 2,  cooldown: 100, bulletSpeed: 10, bulletSize: 6, projectiles: 1, owned: false,  icon: null},
    {name: "shotgun",damage: 8,  cooldown: 800, bulletSpeed: 7,  bulletSize: 7, projectiles: 5, owned: false,  icon: null},
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
        x=Math.random() * canvas.width;
        y = -30;
    }

    //rdght edge spawn
    if (side == 1) {
        x= canvas.width + 30;
        y =Math.random() * canvas.height;
    }

    //bottom edge spawn
    if (side == 2) {
        x=Math.random() * canvas.width;
        y = canvas.height + 30
    }

    //left edge spawn
    if (side == 3) {
        x = -30;
        y = Math.random() * canvas.height;
    }

    enemies.push({
        x:x,
        y:y,
        size:20,
        speed:2,
        lastHit: 0,
        hp: 20,
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

    bullets.push({
        x: player.x,
        y: player.y,
        vx: (dx / distance) * equippedWeapon.bulletSpeed,
        vy: (dy/distance) * equippedWeapon.bulletSpeed,

        size: equippedWeapon.bulletSize,
        damage: equippedWeapon.damage
    })
}

//updates game logic every frame
function update() {
    if (keys["w"]) player.y -= player.speed;
    if (keys["s"]) player.y += player.speed;
    if (keys["a"]) player.x -= player.speed;
    if (keys["d"]) player.x += player.speed;

    //loop through every enemy
    for (const enemy of enemies) {
        const dx = player.x - enemy.x; // adj 
        const dy = player.y - enemy.y; // op

        const dist = Math.hypot(dx, dy) // hyp distance 

        if (dist > 0) { // enemy moves towards player 
            enemy.x += (dx / dist) * enemy.speed;
            enemy.y += (dy / dist) * enemy.speed;
        }
        //player enemy collisions
        const collisionDistance = player.size / 2 + enemy.size / 2;
        if (dist < collisionDistance) {
            const now = Date.now();

            if (now - enemy.lastHit > 1000) {
                player.hp -= 1;
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
            const hitDistance = bullet.size / 2 + enemy.size / 2;

            if (distance < hitDistance) {
                enemy.hp -= bullet.damage;
                bullets.splice(b,1);
                if (enemy.hp <= 0) {
                    gems.push({
                        x:enemy.x,
                        y: enemy.y,
                        value: 1,
                        size: 10,
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
        const collectionDistance = player.size / 2* gem.size / 2

        if (distance < collectionDistance) {
            player.xp += gem.value;
            gems.splice(i,1)
        }
    }

    if (player.xp >= player.xpNeeded) {
        player.xp -= player.xpNeeded;
        player.level++;
        player.xpNeeded = Math.floor(player.xpNeeded * 1.5)
        
    }

}

//draws everything everyframe
function draw() {
    ctx.clearRect(0,0, canvas.width, canvas.height); //clear previous 

    ctx.fillStyle = "blue"; // drawing colour
    ctx.fillRect( //drawing the player 
        player.x - player.size / 2,
        player.y - player.size / 2,
        player.size,
        player.size
    )

    for (const enemy of enemies) {
        ctx.fillStyle ="red"; // colour
        ctx.fillRect( //drawing the enemies 
            enemy.x - enemy.size /2,
            enemy.y - enemy.size /2,
            enemy.size,
            enemy.size
        )

        ctx.fillStyle = "green"
        ctx.fillRect(
            enemy.x - 15,
            enemy.y - 20,
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
            bullet.x - bullet.size / 2,
            bullet.y - bullet.size / 2,
            bullet.size,
            bullet.size
        )
    }

    for (const gem of gems) {
        ctx.fillStyle = "lime";
        ctx.fillRect(
            gem.x - gem.size/2,
            gem.y - gem.size/2,
            gem.size,
            gem.size
        )
    }

    ctx.fillStyle = "white";
    ctx.font = "30px Arial";
    ctx.fillText("score: " + score, 20, 80)

    ctx.fillStyle = "grey";
    ctx.fillRect(20, canvas.height - 30, 300, 20);

    ctx.fillStyle = "lime";
    ctx.fillRect(20, canvas.height - 30, (player.xp/player.xpNeeded) * 300, 20);

    ctx.fillStyle ="white";
    ctx.font ="20px Arial";
    ctx.fillText(`Level ${player.level}`,20,canvas.height - 40)

}

//game loop
function gameloop() {
    if (gameOver) {
        ctx.fillStyle = "white";
        ctx.font = "60px Arial";
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
    <img src="${weapon.icon}" width = "40">
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
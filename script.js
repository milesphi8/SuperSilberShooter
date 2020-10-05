
document.addEventListener('DOMContentLoaded', () => {

    //Key press constants mapping
    const SPACE_KEY = 32; //shooting key.
    const UP_KEY = 87; //double press jump key
    const RIGHT_KEY = 68; //change direction key 
    const DOWN_KEY = 83; //change direction key
    const LEFT_KEY = 65; //Change dir key

    //Game constants
    const TICK_SPEED = 30;
    const SHOOTING_DELAY = 300;
    const FRAMES = 60;

    const GROUND_WIDTH = 100;
    const SPIKE_HEIGHT = 30;
    const SPIKE_HEALTH = -1;

    const MOVE_SCORE = 1;
    const KILL_SCORE = 5;

    const PLAYER_SPEED = 10;
    const ENEMY_SPEED = 10;
    const PROJECTILE_SPEED = 40;

    //Constant arrays for terain generation
    const PIT = 20;
    const LOW = 100;
    const MEDIUM = 200;
    const HIGH = 300;
    groundHeights = [PIT, LOW, MEDIUM, HIGH];

    const FLAT = 0;
    const BIGHILLUP = 1;
    const FLATBIGHILL = 2;
    const SMALLHILL = 3;
    const SPIKES = 4;
    const BIGHILLDOWN = 5;
    terrainTypes = [FLAT, BIGHILLUP, FLATBIGHILL, SMALLHILL, SPIKES, BIGHILLDOWN];
    
    //Character variables
    var direction = 1  //Tracks the direction of the character and any new projectiles ( 1 = right, -1 = left)
    var isMoving = 0 //Tracks if the player is moving or not (0 if still, 10 if moving)
    var jumpCount = 0 //Tracks if the player is jumping (0 if not jumping, >0 if jumping)
    var playerHealth = 3; //Tracks player health
    var score = 0; //Tracks player score

    //Game objects;
    var character = new Object();
    var groundArr = [];
    var enemyArr = [];
    var projArr = [[], []];

    //Variables for tracking timeouts
    var movingTimeout = -1; //Tracks if the character can move yet
    var shootingTimeout = -1; //Tracks if the character can shoot yet
    var dmgCooldown = false; //Tracks if there has been damage 

    //Variables for use in generating enemies
    var enemyCounter = 0;
    var minEnemies = 4;
    var enemyHealth = 2;

    //Variables for use in generating terrain
    currentTerrainCounter = 0;
    currentTerrainType = FLAT;

    


    initialize();

    function initialize() {
        //Set up intervals for how often to update the game.
        setInterval(updateProj, TICK_SPEED);
        setInterval(updateEnemies, TICK_SPEED);
        setInterval(checkPlayerCollision, TICK_SPEED);
        setInterval(checkBulletEnemyCollision, TICK_SPEED);

        //Initialize character
        character.element = "character";
        character.x = 0;
        character.y = 0
        character.width = 30;
        character.height = 50;
        character.AbsoluteX = 0;
        character.AbsoluteLeft = 0;
        character.acceleration = 0;
        updateCharacter();

        //Set up the character to flicker when damaged.
        setInterval(() => {
            if(dmgCooldown)
                $('.character').fadeTo(100, 0.3, function() { $(this).fadeTo(100, 1.0); });
            else{$('.character').stop().fadeTo(0, 1.0)}
        }, 200);

        //Initialize player health display
        document.getElementById('playerHealth').innerHTML = playerHealth;

        //Create inital ground
        createGround(0, 0, GROUND_WIDTH, LOW);
        updateGroundArr();

        //First call of gravity to calibrate character to ground level.
        gravity();

        //Initialize first 2 enemies
        if (groundArr[groundArrayIndex2(500)].height == PIT) {
            createEnemy(enemyHealth, 700, 700, groundArr[groundArrayIndex2(700)].height, 60, 50, 1);
        } else {
            createEnemy(enemyHealth, 500, 500, groundArr[groundArrayIndex2(500)].height, 60, 50, 1);
        }
        if (groundArr[groundArrayIndex2(800)].height == PIT) {
            createEnemy(enemyHealth, 1000, 1000, groundArr[groundArrayIndex2(1000)].height, 60, 50, 1);
        } else {
            createEnemy(enemyHealth, 800, 800, groundArr[groundArrayIndex2(800)].height, 60, 50, 1);
        }

        //Start key listener for keydown
        $(document).keydown(function (e) {
            switch (e.which) {
                case LEFT_KEY:  //left key (A)
                    isMoving = 10;
                    if (movingTimeout === -1) {
                        moveLeft();
                    }
                    break;
                case UP_KEY:  //up key (W)
                    if (character.y <= Math.max(groundArr[groundArrayIndex(character)].height, groundArr[groundArrayIndex2(character.AbsoluteX + character.width - 1)].height)) {
                        jump();
                    }
                    break;
                case RIGHT_KEY:  //right key (D)
                    isMoving = 10;
                    if (movingTimeout === -1) {
                        moveRight();
                    }
                    break;
                case SPACE_KEY:
                    if (shootingTimeout === -1) {
                        shoot();
                    }
                    break;
                default: return;
            }
        });
        //Start key listener for key up.
        $(document).keyup(function (e) {
            switch (e.which) {
                case LEFT_KEY:  //left key
                    clearTimeout(movingTimeout);
                    movingTimeout = -1;
                    isMoving = 0;
                    break;
                case RIGHT_KEY:  //right key
                    clearTimeout(movingTimeout);
                    movingTimeout = -1;
                    isMoving = 0;
                    break;
                case SPACE_KEY:
                    clearTimeout(shootingTimeout);
                    shootingTimeout = -1;
                    break;
                default: return;
            }
        });
    }
    function gravity() {
        let maxGroundHeight = Math.max(groundArr[groundArrayIndex(character)].height, groundArr[groundArrayIndex2(character.AbsoluteX + character.width - 1)].height);
        if (character.y > maxGroundHeight && jumpCount == 0) {
            character.y -= (8 + character.acceleration);
            character.acceleration += .25;
        }
        else if (jumpCount == 0) {
            character.y = maxGroundHeight;
            character.acceleration = 0;
        }
        $(".character").css(({ bottom: character.y + 'px' }))
        setTimeout(gravity, 1000 / FRAMES);
    }
    function createEnemy(health, AbsoluteX, x, y, width, height, dir) {
        var enemy = new Object();
        enemy.element = "enemy" + enemyCounter;
        enemyCounter++;
        enemy.health = health;
        enemy.AbsoluteX = AbsoluteX;
        enemy.x = groundArr[groundArrayIndex2(AbsoluteX)].x + (AbsoluteX - groundArr[groundArrayIndex2(AbsoluteX)].AbsoluteX);
        enemy.y = y;
        enemy.height = height;
        enemy.width = width;
        enemy.dir = dir;
        $("ul.enemyList").append('<li><div class=enemy id=' + enemy.element + '></div></li>')
        $('#' + enemy.element).css(({ bottom: y + 'px', left: enemy.x + 'px', width: width + 'px', height: height + 'px' }));
        enemyArr.push(enemy)
        return enemy;
    }
    function createProjectile(x, y) {
        var proj = new Object();
        proj.element = "proj" + Math.floor(Math.random() * 100000);
        proj.x = x;
        proj.y = y;
        proj.dir = direction;
        $("ul.projList").append('<li><div class=proj id=' + proj.element + '></div></li>')
        $('#' + proj.element).css(({ bottom: y + 'px', left: x + 'px' }));
        if (direction == -1) {
            $('#' + proj.element).css(({ transform: "scaleX(-1)" }));
        }
        projArr.push(proj);
        if (projArr.length > 10) {
            $("#" + projArr.shift().element).parent().remove()
        }
        return proj;
    }

    function createGround(x, y, width, height) {
        var ground = new Object();
        ground.element = "ground" + Math.floor(Math.random() * 100000);
        ground.x = x;
        ground.y = y;
        ground.AbsoluteX = x;
        ground.height = height;
        ground.width = width;
        $("ul.groundList").append('<li><div class=ground id=' + ground.element + '></div></li>')
        $('#' + ground.element).css(({ bottom: y, left: x, width: width + 'px', height: height + 'px' }));
        groundArr.push(ground)
        return ground;
    }

    function createGroundAuto(width) {
        var ground = new Object();
        ground.element = "ground" + Math.floor(Math.random() * 100000);
        ground.x = groundArr[groundArr.length - 1].x + GROUND_WIDTH;
        ground.AbsoluteX = groundArr[groundArr.length - 1].AbsoluteX + 100;
        ground.y = 0;
        ground.width = width;
        switch (currentTerrainType) {
            case FLAT:
                if (currentTerrainCounter < 3) {
                    currentTerrainCounter++;
                    ground.height = LOW;
                } else {
                    currentTerrainType = terrainTypes[Math.floor(Math.random() * (terrainTypes.length - 1))];
                    currentTerrainCounter = 1;
                    switch (currentTerrainType) {
                        case FLAT:
                            ground.height = LOW;
                            break;
                        case BIGHILLUP:
                            ground.height = MEDIUM;
                            break;
                        case FLATBIGHILL:
                            ground.height = HIGH;
                            break;
                        case SMALLHILL:
                            ground.height = MEDIUM;
                            break;
                        case SPIKES:
                            ground.height = PIT;
                            break;
                        default:
                            console.log("SOMETHING IS WRONG");
                    }
                }
                break;
            case BIGHILLUP:
                if (currentTerrainCounter < 3) {
                    goUp = Math.floor(Math.random() * 2);
                    if (goUp == 1) {
                        ground.height = HIGH;
                        currentTerrainCounter = 1;
                        currentTerrainType = BIGHILLDOWN;
                    } else {
                        ground.height = MEDIUM;
                        currentTerrainCounter++;
                    }
                } else {
                    ground.height = HIGH;
                    currentTerrainCounter = 1;
                    currentTerrainType = BIGHILLDOWN;
                }
                break;
            case BIGHILLDOWN:
                if (groundArr[groundArr.length - 1].height == HIGH) {
                    if (currentTerrainCounter < 3) {
                        ground.height = HIGH;
                        currentTerrainCounter++;
                    } else if (currentTerrainCounter < 5) {
                        goDown = Math.floor(Math.random() * 2);
                        if (goDown == 1) {
                            ground.height = MEDIUM;
                            currentTerrainCounter = 1;
                        } else {
                            ground.height = HIGH;
                            currentTerrainCounter++;
                        }
                    } else {
                        ground.height = MEDIUM;
                        currentTerrainCounter = 1;
                    }
                } else {
                    if (currentTerrainCounter < 3) {
                        goDown = Math.floor(Math.random() * 2);
                        if (goDown == 1) {
                            ground.height = LOW;
                            currentTerrainCounter = 1;
                            currentTerrainType = FLAT;
                        } else {
                            ground.height = MEDIUM;
                            currentTerrainCounter++;
                        }
                    } else {
                        ground.height = LOW;
                        currentTerrainCounter = 1;
                        currentTerrainType = FLAT;
                    }
                }
                break;
            case FLATBIGHILL:
                if (currentTerrainCounter < 3) {
                    ground.height = HIGH;
                    currentTerrainCounter++;
                } else if (currentTerrainCounter < 5) {
                    goDown = Math.floor(Math.random() * 2);
                    if (goDown == 1) {
                        ground.height = LOW;
                        currentTerrainCounter = 1;
                        currentTerrainType = FLAT;
                    } else {
                        ground.height = HIGH;
                        currentTerrainCounter++;
                    }
                } else {
                    ground.height = LOW;
                    currentTerrainCounter = 1;
                    currentTerrainType = FLAT;
                }
                break;
            case SMALLHILL:
                if (currentTerrainCounter < 3) {
                    ground.height = MEDIUM;
                    currentTerrainCounter++;
                } else if (currentTerrainCounter < 5) {
                    goDown = Math.floor(Math.random() * 2);
                    if (goDown == 1) {
                        ground.height = LOW;
                        currentTerrainCounter = 1;
                        currentTerrainType = FLAT;
                    } else {
                        ground.height = MEDIUM;
                        currentTerrainCounter++;
                    }
                } else {
                    ground.height = LOW;
                    currentTerrainCounter = 1;
                    currentTerrainType = FLAT;
                }
                break;
            case SPIKES:
                let spikeName = createEnemy(SPIKE_HEALTH, ground.AbsoluteX - GROUND_WIDTH - 20, 0, PIT, GROUND_WIDTH + 40, SPIKE_HEIGHT, 0).element;
                $('#'+spikeName).addClass("spike");
                if (currentTerrainCounter < 2) {
                    goUp = Math.floor(Math.random() * 2);
                    if (goUp == 1) {
                        ground.height = LOW;
                        currentTerrainCounter = 1;
                        currentTerrainType = FLAT;
                    } else {
                        ground.height = PIT;
                        currentTerrainCounter++;
                    }
                } else {
                    ground.height = LOW;
                    currentTerrainCounter = 1;
                    currentTerrainType = FLAT;
                }
                break;

        }
        $("ul.groundList").append('<li><div class=ground id=' + ground.element + '></div></li>')
        $('#' + ground.element).css(({ bottom: ground.y, left: ground.x, width: width + 'px', height: ground.height + 'px' }));
        groundArr.push(ground)
        return ground;
    }

    function updatePlayerHealth(change) {
        playerHealth += change;
        document.getElementById('playerHealth').innerHTML = playerHealth;
        dmgCooldown = true;
        
        setTimeout(() => {
            dmgCooldown = false;
            $('.character').stop().fadeTo(0, 1.0)
        }, 2000);
    }

    function updateScore(increase) {
        score += increase;
        document.getElementById('score').innerHTML = score;
    }

    function updateCharacter() {
        $('#' + character.element).css('left', character.x + 'px');
    }
    function updateGround() {
        groundArr.forEach(e => {
            $('#' + e.element).css('left', e.x + 'px');
        });
    }

    function updateGroundArr() {
        if (groundArr[0].AbsoluteX + groundArr[0].width < character.AbsoluteLeft) {
            $("#" + groundArr.shift().element).parent().remove()
        }
        while (groundArr.length < 25) {
            createGroundAuto(GROUND_WIDTH);
        }
    }

    function updateEnemies() {
        enemyArr.forEach(e => {
            if (e.AbsoluteX + e.width <= (character.AbsoluteLeft) || e.health == 0) { //Removes Enemies if further than absolute left
                if (e.health == 0) {
                    updateScore(KILL_SCORE);
                }
                $("#" + e.element).parent().remove();
                enemyArr = enemyArr.filter(item => item.element !== e.element)
            }
            nextEnemyLocation = e.AbsoluteX + (ENEMY_SPEED * e.dir);
            if (e.dir == 1) {
                nextEnemyLocation += e.width - 1;
            }
            nextGroundIndex = groundArrayIndex2(nextEnemyLocation);
            nextGroundHeight = 0;
            if (nextGroundIndex > -1 && nextGroundIndex < 25) {
                nextGroundHeight = (groundArr[nextGroundIndex].height);
            }
            if (nextGroundIndex < 25 && e.y == nextGroundHeight) { //CHANGE TO == AFTER GENERATION 
                e.AbsoluteX += ENEMY_SPEED * e.dir; //Handles Movement of enemies
                e.x += ENEMY_SPEED * e.dir;
            }
            else {
                e.dir = e.dir * -1;
            }

            $('#' + e.element).css('left', e.x + 'px');
        });
        if (enemyArr.length < minEnemies && groundArr[groundArr.length - 1].height != 20) {
            createEnemy(enemyHealth, groundArr[groundArr.length - 1].AbsoluteX, 0, groundArr[groundArr.length - 1].height, 60, 50, 1);
        }
    }

    function updateProj() {
        projArr.forEach(e => {
            if (e.dir == -1) { //If moving to the left
                nextBulletLocation = e.x + (2 * PROJECTILE_SPEED * e.dir);  // future bullet location
            }
            else { //If moving right
                nextBulletLocation = e.x + (e.dir - PROJECTILE_SPEED);  // future bullet location
            }
            nextGroundIndex = groundArr.findIndex((element) => element.x > nextBulletLocation)  // find index of ground at that future bullet index
            nextGroundHeight = 0

            if (nextGroundIndex > -1) {
                nextGroundHeight = (groundArr[nextGroundIndex].height);
            }

            if (e.y > nextGroundHeight) {  // if bullet height is greater than the ground heihgt

                e.x += (PROJECTILE_SPEED + isMoving) * e.dir;
                $('#' + e.element).css('left', e.x + 'px');
                if (e.x > groundArr[groundArr.length - 1].x + GROUND_WIDTH || e.x <= character.AbsoluteLeft - e.width) {
                    $("#" + e.element).parent().remove();
                    projArr = projArr.filter(item => item.element !== e.element)
                }
            } else {
                $("#" + e.element).parent().remove();
                projArr = projArr.filter(item => item.element !== e.element)
            }
        });
    }

    function groundArrayIndex2(xPos) {
        dif = xPos - groundArr[0].AbsoluteX;
        index = Math.floor(dif / GROUND_WIDTH);
        return index;
    }

    function checkPlayerCollision(){ //Check if player touches an enemy
        enemyArr.forEach(e => {
            if((((character.x > e.x && character.x < e.x + e.width) || (character.x + character.width > e.x && character.x + character.width < e.x + e.width)) && (character.y < e.y + e.height && character.y >= e.y)) && dmgCooldown == false){
                updatePlayerHealth(-1);
            }
        });
    }
    function checkBulletEnemyCollision(){
        projArr.forEach(e => {
            var hasCollided = false;
            enemyArr.forEach(f => {
                if ((((e.x + e.width >= f.x && e.x + e.width <= f.x + f.width) ||  (e.x > f.x && e.x < f.x + f.width)) && ((e.y >= f.y && e.y <= f.y + f.height) || (e.y + e.height >= f.y && e.y + e.height <= f.y + f.height ))) && hasCollided == false){
                    f.health = f.health - 1;
                    hasCollided = true;
                    $("#" + e.element).parent().remove();
                    projArr = projArr.filter(item => item.element !== e.element)
                }
            })
        })
    }

    function groundArrayIndex(character) {
        dif = character.AbsoluteX - groundArr[0].AbsoluteX;
        index = Math.floor(dif / GROUND_WIDTH);
        return index;
    }

    //Character jump motion
    function jump() {
        let maxGroundHeight = Math.max(groundArr[groundArrayIndex(character)].height, groundArr[groundArrayIndex2(character.AbsoluteX + character.width - 1)].height);
        character.y += 12 - character.acceleration;
        jumpCount++;
        character.acceleration += .25
        $(".character").css(({ bottom: character.y + 'px' }))
        if (jumpCount < 200 && character.y >= maxGroundHeight) {
            jumpingTimeout = setTimeout(jump, 500 / FRAMES);
        }
        else {
            jumpCount = 0;
            character.y = maxGroundHeight;
            character.acceleration = 0;
        }
    }

    //Right movement
    function moveRight() {

        direction = 1
        $("#character").css(({ transform: "scaleX(1)" }));

        if (character.y >= groundArr[groundArrayIndex2(character.AbsoluteX + character.width - 10 + PLAYER_SPEED)].height) {
            if (character.AbsoluteX < character.AbsoluteLeft + 400) {
                character.x += PLAYER_SPEED;
            } else {

                groundArr.forEach(e => {
                    e.x -= PLAYER_SPEED;
                });
                // $('div.ground').css('left', (parseInt($('div.ground').css('left')) - 20) + 'px');
                enemyArr.forEach(e => {
                    e.x -= PLAYER_SPEED;
                });
                projArr.forEach(e => {
                    e.x -= PLAYER_SPEED;
                });
            }
            character.AbsoluteX += PLAYER_SPEED;
            if (character.AbsoluteX == character.AbsoluteLeft + 400 + 20 * PLAYER_SPEED) {
                character.AbsoluteLeft += PLAYER_SPEED;
                updateScore(MOVE_SCORE);
                if (Math.floor(character.AbsoluteLeft/2000) > Math.floor((character.AbsoluteLeft - PLAYER_SPEED)/2000)) {
                    minEnemies++;
                }
                if (Math.floor(character.AbsoluteLeft/10000) > Math.floor((character.AbsoluteLeft - PLAYER_SPEED)/10000) && enemyHealth < 5) {
                    enemyHealth++;
                }
            }
        }
        movingTimeout = setTimeout(moveRight, 1000 / FRAMES);
        updateCharacter();
        updateGround();
        updateGroundArr();
    }


    //Left movement
    function moveLeft() {
        direction = -1
        $("#character").css(({ transform: "scaleX(-1)" }));
        if (character.AbsoluteX > character.AbsoluteLeft) {
            if (character.y >= groundArr[groundArrayIndex2(character.AbsoluteX - PLAYER_SPEED)].height) {
                if (character.AbsoluteX <= character.AbsoluteLeft + 400) {
                    character.AbsoluteX -= PLAYER_SPEED;
                    character.x -= PLAYER_SPEED;
                } else {
                    character.AbsoluteX -= PLAYER_SPEED;
                    groundArr.forEach(e => {
                        e.x += PLAYER_SPEED;
                    });
                    enemyArr.forEach(e => {
                        e.x += PLAYER_SPEED;
                    });
                    projArr.forEach(e => {
                        e.x += PLAYER_SPEED
                    });
                }
            }
        }
        movingTimeout = setTimeout(moveLeft, 1000 / FRAMES);

        updateCharacter();
        updateGround();
        updateGroundArr();
    }

    //Shooting Functionality
    function shoot() {
        let laserID
        let currLaserID = 0;
        createProjectile(character.x + character.width / 3, character.y + 20);
        shootingTimeout = setTimeout(shoot, SHOOTING_DELAY);
    }
});

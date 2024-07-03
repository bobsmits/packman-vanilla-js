const initPackMan = (tileSize, paths) => {
    const radius = tileSize * 0.8;
    const endOfField = paths[0].length * tileSize;

    let wantedDirection;
    let diedAnimationTimer = 0;

    const move = () => {
        const row = packMan.tile[0]
        const col = packMan.tile[1]

        const startX = packMan.x
        const startY = packMan.y

        const centerX = (col * tileSize) + (tileSize / 2)
        const centerY = (row * tileSize) + (tileSize / 2)

        let passesTileCenter = false

        switch (packMan.direction) {
            case 'up':
                packMan.y = packMan.y - moveMentSpeed()

                if (!paths[row - 1] || paths[row - 1][col] === 1) {
                    if (packMan.y < centerY) {
                        packMan.y = centerY
                    }
                }
                passesTileCenter = Tools.passesPoint(centerY, startY, packMan.y)
                break;
            case 'down':
                packMan.y = packMan.y + moveMentSpeed()

                if (!paths[row + 1] || paths[row + 1][col] === 1) {
                    if (packMan.y > centerY) {
                        packMan.y = centerY
                    }
                }
                passesTileCenter = Tools.passesPoint(centerY, startY, packMan.y)
                break;
            case 'left':
                packMan.x = packMan.x - moveMentSpeed()

                if (paths[row][col - 1] === 1) {
                    if (packMan.x < centerX) {
                        packMan.x = centerX
                    }
                } else if (packMan.x < 0) {
                    // Move to the other side of the tunnel
                    packMan.x = endOfField;
                }

                passesTileCenter = Tools.passesPoint(centerX, startX, packMan.x)
                break;
            case 'right':
                packMan.x = packMan.x + moveMentSpeed()

                if (paths[row][col + 1] === 1) {
                    if (packMan.x > centerX) {
                        packMan.x = centerX
                    }
                } else if (packMan.x > endOfField) {
                    // Move to the other side of the tunnel
                    if (packMan.x > endOfField) packMan.x = 0;
                }
                passesTileCenter = Tools.passesPoint(centerX, startX, packMan.x)
        }

        packMan.tile = [Math.floor(packMan.y / tileSize), Math.floor(packMan.x / tileSize)]

        // You can always change to the oposide direction
        if (wantedDirection === Tools.oposideDirection(packMan.direction)) {
            packMan.direction = wantedDirection
        } else if (passesTileCenter) {
            updateDirection();
        }
    }

    const moveMentSpeed = () => {
        if (packMan.engergized) {
            return MOVEMENT_SPEEDS_MOD.PACKMAN_ENGERGIZED * BASE_MOVEMENT_SPEED
        }
        return MOVEMENT_SPEEDS_MOD.PACKMAN * BASE_MOVEMENT_SPEED
    }

    const updateDirection = () => {
        const row = packMan.tile[0]
        const col = packMan.tile[1]

        let newDirection = packMan.direction;

        if (wantedDirection === 'down') {
            // Check if we can move down
            if (paths[row + 1] && paths[row + 1][col] === 0) {
                newDirection = 'down'
            }
        } else if (wantedDirection === 'up') {
            // Check if we can move up
            if (paths[row - 1] && paths[row - 1][col] === 0) {
                newDirection = 'up'
            }
        }
        else if (wantedDirection === 'left') {
            // Check if we can move left
            if (paths[row][col - 1] === 0) {
                newDirection = 'left'
            }
        }
        else if (wantedDirection === 'right') {
            // Check if we can move right
            if (paths[row][col + 1] === 0) {
                newDirection = 'right'
            }
        }

        if (newDirection !== packMan.direction) {
            packMan.direction = newDirection
            packMan.x = (col * tileSize) + (tileSize / 2); // centerX
            packMan.y = (row * tileSize) + (tileSize / 2); // centerY
        }
    }

    const draw = (ctx) => {
        ctx.beginPath();
        ctx.arc(packMan.x, packMan.y, radius, 0, Math.PI * 2, true);
        ctx.fillStyle = '#fdff00'
        ctx.fill();
    }

    const handKeyDown = (event) => {
        switch (event.key) {
            case 'w':
                wantedDirection = 'up'
                break;
            case 's':
                wantedDirection = 'down'
                break;
            case 'a':
                wantedDirection = 'left'
                break;
            case 'd':
                wantedDirection = 'right'
        }
    }

    const animateDead = (ctx, animationDoneCallback) => {
        diedAnimationTimer++;

        const duration = 3 * FPS;
        if (diedAnimationTimer > duration) {
            animationDoneCallback();
            return;
        }
        const progress = Math.round((diedAnimationTimer / duration) * 100) / 100

        const opacity = 1 - progress
        ctx.beginPath();
        ctx.arc(packMan.x, packMan.y, (1 - progress) * radius, 0, Math.PI * 2, true);
        ctx.fillStyle = `rgba(253, 255, 0, ${opacity})`
        ctx.fill();
    }

    document.addEventListener('keydown', handKeyDown);

    const packMan = {
        x: 13 * tileSize + tileSize,
        y: 23 * tileSize + tileSize / 2,
        direction: 'right',
        speed: 0.8,
        tile: [23, 13],
        draw: draw,
        move: move,
        animateDead: animateDead,
        died: false,
        engergized: false,
    }

    return packMan
}
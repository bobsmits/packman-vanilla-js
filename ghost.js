INKY_OUT_OF_JAIL_PALLETS = 30;
CLYDE_OUT_OF_JAIL_PALLETS = 94;
PINKY_OUT_OF_JAIL_PALLETS = 1;

const initGhosts = (tileSize, paths, packMan, game) => {
    const ghostRadius = tileSize * 0.8;
    const fieldCenterX = 14 * tileSize;
    const endOfFieldX = paths[0].length * tileSize;

    // Red Blinky
    // chase target tile: pacman
    // Jail: starts on the playing field
    const blinky = {
        name: 'blinky',
        scatterTarget: [-2, 25], // Top right
        x: 14 * tileSize,
        y: 11 * tileSize + tileSize / 2,
        tile: [11, 14],
        allowedOutOfJail: true,
        inJail: false,
        mode: GHOST_MODES.SCATTER,
        direction: 'right',
        color: '#d03e19',
        chaseTarget: () => {
            return packMan.tile
        }
    }

    // Blue Inky
    // Chase target tile: vector from Blinky to 2 tiles ahead of pacman then doubled
    // Jail: goes out of the ghost house when pacman has 30 dots
    const inky = {
        name: 'inky',
        scatterTarget: [31, 27], // bottom right
        x: 11 * tileSize + tileSize,
        y: 14 * tileSize + tileSize / 2,
        tile: [14, 11],
        allowedOutOfJail: false,
        inJail: true,
        mode: GHOST_MODES.SCATTER,
        direction: 'up',
        color: '#46bfee',
        chaseTarget: () => {
            const packManTile = Tools.tileAhead(packMan.tile, 2, packMan.direction);
            // Double the vector between pinky and two tiles ahead of packman
            const row = blinky.tile[0] + (packManTile[0] - blinky.tile[0]) * 2
            const col = blinky.tile[1] + (packManTile[1] - blinky.tile[1]) * 2
            return [row, col]
        }
    }

    // Pink Pinky
    // Chase target tile: 4 tiles straight ahead of packman
    // Starts in jail directly out 
    const pinky = {
        name: 'pinky',
        scatterTarget: [-2, 2], // Top left
        x: fieldCenterX,
        y: 14 * tileSize + tileSize / 2,
        tile: [14, 13],
        inJail: true,
        allowedOutOfJail: false,
        mode: GHOST_MODES.SCATTER,
        direction: 'down',
        color: '#ea82e5',
        chaseTarget: () => {
            return Tools.tileAhead(packMan.tile, 4, packMan.direction);
        }
    }

    // Organge Clyde
    // Chase target tiel: when 8 tile or more (vector) away from packman same behaviour as Blinky. 
    //                    Otherwise its scatter target.
    // Jail: Over a third of the dots must be eaten
    const clyde = {
        name: 'clyde',
        scatterTarget: [31, 0], // Bottom left
        x: 15 * tileSize + tileSize,
        y: 14 * tileSize + tileSize / 2,
        tile: [14, 15], // jail
        inJail: true,
        allowedOutOfJail: false,
        mode: GHOST_MODES.SCATTER,
        direction: 'up',
        color: '#db851c',
        chaseTarget: () => {
            const distance = Tools.vectorDist(packMan.tile, clyde.tile)

            // When further than 7.5 tiles away from packman chase packman
            if (distance >= 7.5) return packMan.tile;

            // Otherwise go to the scatter target
            return clyde.scatterTarget
        }
    }

    const updatePalletDrivenBehaviour = (dotsEaten) => {
        const dotsLeft = TOTAL_PALLETS - dotsEaten

        if (dotsLeft <= 10) {
            blinky.speedMod = 0.85;
        }

        if (dotsLeft <= 20) {
            blinky.mode = GHOST_MODES.FENZY,
                blinky.speedMod = 0.8;
        }

        if (dotsEaten > PINKY_OUT_OF_JAIL_PALLETS) {
            pinky.allowedOutOfJail = true;
        }

        if (dotsEaten > CLYDE_OUT_OF_JAIL_PALLETS) {
            clyde.allowedOutOfJail = true;
        }

        if (dotsEaten > INKY_OUT_OF_JAIL_PALLETS) {
            inky.allowedOutOfJail = true;
        }
    }

    const ghosts = [blinky, inky, pinky, clyde];

    const move = () => {
        for (let i = 0; i < ghosts.length; i++) {
            const ghost = ghosts[i]
            const tile = ghost.tile;

            const startX = ghost.x
            const startY = ghost.y

            const centerX = (tile[1] * tileSize) + (tileSize / 2)
            const centerY = (tile[0] * tileSize) + (tileSize / 2)

            let passesTileCenter = false;

            switch (ghost.direction) {
                case 'up':
                    ghost.y = ghost.y - moveMentSpeed(ghost)
                    passesTileCenter = Tools.passesPoint(centerY, startY, ghost.y)
                    break;
                case 'down':
                    ghost.y = ghost.y + moveMentSpeed(ghost)
                    passesTileCenter = Tools.passesPoint(centerY, startY, ghost.y)
                    break;
                case 'left':
                    ghost.x = ghost.x - moveMentSpeed(ghost)
                    passesTileCenter = Tools.passesPoint(centerX, startX, ghost.x)

                    // Move to the other side of the tunnel
                    if (ghost.x < 0) ghost.x = endOfFieldX;
                    break;
                case 'right':
                    ghost.x = ghost.x + moveMentSpeed(ghost)
                    passesTileCenter = Tools.passesPoint(centerX, startX, ghost.x)

                    // Move to the other side of the tunnel
                    if (ghost.x > endOfFieldX) ghost.x = 0;
            }

            // Update the ghosts current tile
            ghost.tile = [Math.floor(ghost.y / tileSize), Math.floor(ghost.x / tileSize)]

            if (ghost.inJail) {
                moveWithinJail(ghost);
                continue;
            } else if (shouldEnterJail(ghost, startX)) {
                enterJail(ghost)
                continue;
            }

            // When passing the center change the direction if needed
            if (passesTileCenter &&
                ghost.currentTileDirection &&
                ghost.currentTileDirection !== ghost.direction) {

                ghost.direction = ghost.currentTileDirection;

                if (ghost.direction === 'up' || ghost.direction === 'down') {
                    ghost.x = centerX;
                } else {
                    ghost.y = centerY;
                }
            }

            // Entering a new tile
            if (tile[0] !== ghost.tile[0] || tile[1] !== ghost.tile[1]) {
                // Update where to go when hitting the current tile center
                ghost.currentTileDirection = ghost.nextTileDirection || ghost.direction;

                // Deside where to go when on the next tile center
                const nextTile = Tools.tileAhead(ghost.tile, 1, ghost.currentTileDirection);
                ghost.nextTileDirection = desideDirection(ghost, nextTile, ghost.currentTileDirection);
            }
        }
    }

    const moveMentSpeed = (ghost) => {
        // Check if the ghost is in the tunnle
        if (ghost.tile[0] === 14 && (ghost.tile[1] < 6 || ghost.tile[1] > 21)) {
            return MOVEMENT_SPEEDS_MOD.GHOST_TUNNLE * BASE_MOVEMENT_SPEED
        }
        if (ghost.frightened) {
            return MOVEMENT_SPEEDS_MOD.GHOST_FRIGHTENED * BASE_MOVEMENT_SPEED
        }
        if (ghost.movingToJail) {
            return MOVEMENT_SPEEDS_MOD.GHOST_MOVING_TO_JAIL * BASE_MOVEMENT_SPEED
        }
        if (ghost.speedMod) {
            return ghost.speedMod * BASE_MOVEMENT_SPEED
        }
        return MOVEMENT_SPEEDS_MOD.GHOST * BASE_MOVEMENT_SPEED
    }

    // Make a disition where to go on a given tile
    const desideDirection = (ghost, tile, movingDirection) => {
        const possibleDirections = getPossibleDirections(tile, movingDirection, ghost.frightened);

        // When frightened move in a random direction
        if (ghost.frightened) {
            return possibleDirections[Math.floor(Math.random() * possibleDirections.length)][2]
        }

        let direction;
        let shortestDistance;

        ghost.target = desideTargetTile(ghost);

        // Check witch option is diagonally closer to its target tile
        for (let i = 0; i < possibleDirections.length; i++) {
            const distance = Tools.vectorDist(possibleDirections[i], ghost.target)

            if (!shortestDistance || shortestDistance > distance) {
                direction = possibleDirections[i];
                shortestDistance = distance;
            }
        }

        return direction && direction[2]
    }

    checkForHitWithPackman = () => {
        for (let i = 0; i < ghosts.length; i++) {
            const ghost = ghosts[i]

            if (ghost.tile[0] === packMan.tile[0] && ghost.tile[1] === packMan.tile[1]) {
                if (ghost.frightened) {
                    ghost.frightened = false;
                    ghost.movingToJail = true;
                } else if (!ghost.movingToJail) {
                    return true;
                }
            }
        }
    }

    getPossibleDirections = (fromTile, currentDirection, frightened) => {
        const row = fromTile[0]
        const col = fromTile[1]

        const possibleDirections = []
        if (paths[row - 1] && paths[row - 1][col] !== 1 && currentDirection !== 'down') {
            if (frightened || ((row !== 11 && row !== 23) || (col !== 12 && col !== 15))) {
                possibleDirections.push([row - 1, col, 'up'])
            }
        }

        if (paths[row][col - 1] !== 1 && currentDirection !== 'right') {
            possibleDirections.push([row, col - 1, 'left'])
        }

        if (paths[row + 1] && paths[row + 1][col] !== 1 && currentDirection !== 'up') {
            possibleDirections.push([row + 1, col, 'down'])
        }

        if (paths[row][col + 1] !== 1 && currentDirection !== 'left') {
            possibleDirections.push([row, col + 1, 'right'])
        }

        return possibleDirections;
    }

    const desideTargetTile = (ghost) => {
        if (ghost.movingToJail) return [11, 13];
        if (ghost.mode === GHOST_MODES.SCATTER) return ghost.scatterTarget;
        return ghost.chaseTarget();
    }

    const enterJail = (ghost) => {
        ghost.direction = 'down';
        ghost.inJail = true;
        ghost.x = fieldCenterX;
    }

    const shouldEnterJail = (ghost, startX) => {
        return ghost.movingToJail &&
            ghost.tile[0] === 11 && // On the row where to to enter jail
            Tools.passesPoint(fieldCenterX, startX, ghost.x)
    }

    const moveOutOfJail = (ghost) => {
        if (
            (ghost.direction === 'left' && ghost.x < fieldCenterX) ||
            (ghost.direction === 'right' && ghost.x > fieldCenterX) ||
            ghost.x === fieldCenterX
        ) {
            // Turn upwards when passing the center line
            ghost.direction = 'up';
            ghost.x = fieldCenterX;
            ghost.inJail = false;
            ghost.currentTileDirection = null;
            ghost.nextTileDirection = null;
            ghost.movingToJail = false;
        } else {
            ghost.direction = ghost.x > fieldCenterX ? 'left' : 'right' // Move to the center line
        }
    }

    // Make the ghost bounce up and down within the the Jail
    const moveWithinJail = (ghost) => {
        const minY = (13 * tileSize) + (ghostRadius - tileSize / 2);
        const maxY = (16 * tileSize) - (ghostRadius - tileSize / 2);
        
        if (ghost.allowedOutOfJail &&
            (!ghost.movingToJail || ghost.direction === 'up') // When going into the Jail hit the bottom first
        ) {
            moveOutOfJail(ghost)
        } else if (ghost.y < minY) {
            // Only limit the y on the inital up down movement
            if (!ghost.movingToJail) ghost.y = minY;
            ghost.direction = 'down';
        } else if (ghost.y > maxY) {
            ghost.y = maxY;
            ghost.direction = 'up';
        }
    }

    const draw = (ctx) => {
        for (let i = 0; i < ghosts.length; i++) {
            if (ghosts[i].movingToJail) {
                ctx.beginPath();
                ctx.arc(ghosts[i].x, ghosts[i].y, ghostRadius / 2, 0, Math.PI * 2, true);
                ctx.fillStyle = 'white';
                ctx.fill();
                continue;
            }

            ctx.beginPath();
            ctx.arc(ghosts[i].x, ghosts[i].y, ghostRadius, 0, Math.PI * 2, true);
            ctx.fillStyle = ghosts[i].color
            if (ghosts[i].frightened) {
                ctx.fillStyle = 'blue';
                if (game.energizedTimer % 30 > 15) {
                    ctx.fillStyle = 'white';
                }
            }

            ctx.fill();
        }
    }

    const updateMode = (mode) => {
        for (let i = 0; i < ghosts.length; i++) {
            if (mode === GHOST_MODES.FRIGHTENED) {
                if (!ghosts[i].movingToJail) {
                    ghosts[i].frightened = true;
                }
            } else {
                ghosts[i].frightened = false;
                if (ghosts[i].mode !== GHOST_MODES.FENZY) {
                    ghosts[i].mode = mode
                }
            }
        }
    }

    return {
        updateMode: updateMode,
        updatePalletDrivenBehaviour: updatePalletDrivenBehaviour,
        checkForHitWithPackman: checkForHitWithPackman,
        draw: draw,
        move: move,
        ghosts: ghosts,
    }
}
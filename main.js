const FPS = 30;
const SCALE = 2;
const PADDING = 0;
const ENERGIZER_TIME = 6 * FPS // 6 seconds
const TOTAL_PALLETS = 242;
const BASE_MOVEMENT_SPEED = 4;
const BOARD_SQUARES_WITH = 28;

const GET_READY_TIME = 2 * FPS // 2 seconds

const MOVEMENT_SPEEDS_MOD = {
    GHOST: 0.75,
    GHOST_FRIGHTENED: 0.5,
    GHOST_MOVING_TO_JAIL: 1,
    GHOST_TUNNLE: 0.4,
    PACKMAN: 0.8,
    PACKMAN_ENGERGIZED: 0.9,
}

const CONSUMABLES = {
    ENERGIZER: 3,
    PALLET: 8
}

const GHOST_MODES = {
    FRIGHTENED: 1,
    SCATTER: 2,
    CHASE: 3,
    FENZY: 4,
}

let highliteTile;

const startNewGame = () => {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext("2d");

    // Get the size of the canvas
    const rect = canvas.getBoundingClientRect();

    // Set the "actual" size of the canvas
    canvas.width = rect.width * SCALE
    canvas.height = rect.height * SCALE

    // Set the scale so we can always use the same pixel count
    ctx.scale(SCALE, SCALE)
    ctx.translate(PADDING, PADDING) // Add padding so we can see the targetf tiles outside of the grit

    const level = newLevel();
    const tileSize = (rect.height - PADDING * 2) / level.length;

    const game = {
        points: 0,
        lives: 4,
        dotsEaten: 0,
        ticks: 0,
        ghostModeTimer: 0,
        energizedTimer: 0,
        mode: GHOST_MODES.SCATTER,
    }

    const board = initBoard(level, tileSize, game);

    let getReadeTimer = 0;
    let stopMainLoop = false;
    let packMan;
    let ghosts;


    highliteTile = (tile, color) => {
        const row = tile[0]
        const col = tile[1]

        ctx.beginPath()
        ctx.strokeStyle = color
        ctx.moveTo(col * tileSize, row * tileSize) // Move to center up
        ctx.lineTo(col * tileSize + tileSize, row * tileSize)
        ctx.lineTo(col * tileSize + tileSize, row * tileSize + tileSize)
        ctx.lineTo(col * tileSize, row * tileSize + tileSize)
        ctx.closePath();
        ctx.stroke();
    }

    const mainLoop = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        board.draw(ctx);

        if (getReadeTimer < GET_READY_TIME) {
            drawGetReady();
            return;
        }

        if (packMan.died) {
            packMan.animateDead(ctx, newRound);
            return;
        }

        updateTimers();
        updateModeBasedOnTime();
        
        packMan.move();
        ghosts.move();

        packMan.draw(ctx);
        ghosts.draw(ctx);

        if (ghosts.checkForHitWithPackman())
            packManDied();
        else
            consumeTile(packMan.tile);
    }
    
    const newRound = () => {
        packMan = initPackMan(tileSize, board.paths);
        ghosts = initGhosts(tileSize, board.paths, packMan, game);

        game.ghostModeTimer = 0;
        game.energizedTimer = 0;
        game.ticks = 0;
        game.mode = GHOST_MODES.SCATTER;

        getReadeTimer = 0;
    }
    
    newRound();
    setInterval(() => stopMainLoop ? null : mainLoop(), Math.ceil(1000 / FPS))

    const drawGetReady = () => {
        getReadeTimer++
        ctx.font = `bold ${tileSize * 1.2}px Courier`;
        ctx.fillStyle = '#fdff00';
        ctx.textAlign = 'center'
        ctx.letterSpacing = '1.1pt';
        const centerX = 14 * tileSize;
        ctx.fillText("READY!", centerX, tileSize * 17.85);

        if(getReadeTimer > FPS) {
            packMan.draw(ctx);
            ghosts.draw(ctx);
        }
    }

    const packManDied = () => {
        packMan.died = true;
        game.lives--
    }

    const updateModeBasedOnTime = () => {
        changeMode(currentModeBasesOnTime())
    }

    const currentModeBasesOnTime = () => {
        const elapsedSeconds = game.ghostModeTimer / FPS
        if (game.mode === GHOST_MODES.FRIGHTENED && game.energizedTimer < ENERGIZER_TIME) return GHOST_MODES.FRIGHTENED;

        if (elapsedSeconds < 7) return  GHOST_MODES.SCATTER;   // 7 seconds scatter
        if (elapsedSeconds < 27) return GHOST_MODES.CHASE;     // 20 seconds chase
        if (elapsedSeconds < 34) return GHOST_MODES.SCATTER    // 7 seconds scatter
        if (elapsedSeconds < 54) return GHOST_MODES.CHASE      // 20 seconds chase
        if (elapsedSeconds < 59) return GHOST_MODES.SCATTER    // 5 seconds scatter
        if (elapsedSeconds < 79) return GHOST_MODES.CHASE      // 20 seconds scatter
        if (elapsedSeconds < 84) return GHOST_MODES.CHASE      // 5 seconds scatter
        return GHOST_MODES.CHASE;
    }

    const updateTimers = () => {
        game.ticks++;
        if (game.mode === GHOST_MODES.FRIGHTENED) {
            game.energizedTimer++
        } else {
            game.ghostModeTimer++
        }
    }

    changeMode = (newMode) => {
        if (newMode === game.mode) return;
        if (newMode === GHOST_MODES.FRIGHTENED) {
            game.energizedTimer = 0;
            packMan.engergized = true;
        } else {
            packMan.engergized = false;
        }

        game.mode = newMode;
        ghosts.updateMode(game.mode)
    }

    const consumeTile = (tile) => {
        const contents = board.consume(tile);

        if (contents === CONSUMABLES.PALLET) {
            game.points = game.points + 10
            game.dotsEaten++
            ghosts.updatePalletDrivenBehaviour(game.dotsEaten)
        } else if (contents === CONSUMABLES.ENERGIZER) {
            changeMode(GHOST_MODES.FRIGHTENED)
        }
    }

    // Debug helpers
    document.addEventListener('keydown', (event) => {
        if (event.key === '.') mainLoop();
        if (event.key === 'p') stopMainLoop = true;

        if (event.key === 'j') {
            for (let i = 0; i < ghosts.length; i++) {
                ghosts[i].straitToJail = true
            }
        }
    });
}



document.addEventListener("DOMContentLoaded", startNewGame)
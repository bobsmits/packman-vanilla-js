const initBoard = (level, tileSize, game) => {

    // Multidimentional array same with 0 for the 
    // tiles thare are traversable and 1 for the walls
    const paths = []
    const energizersBlinkTime = 1.3 * FPS;

    const populatePaths = () => {
        for (let i = 0; i < level.length; i++) {
            paths[i] = []
            for (let j = 0; j < level[i].length; j++) {
                paths[i][j] = level[i][j] > 2 ? 0 : 1
            }
        }
    }

    const drawGrid = (ctx) => {
        for (let i = 0; i < level.length; i++) {
            for (let j = 0; j < level[i].length; j++) {
                const row = tile[0]
                const col = tile[1]

                ctx.beginPath()
                ctx.strokeStyle = 'darkGreen'
                ctx.moveTo(col * tileSize, row * tileSize)
                ctx.lineTo(col * tileSize + tileSize, row * tileSize)
                ctx.lineTo(col * tileSize + tileSize, row * tileSize + tileSize)
                ctx.lineTo(col * tileSize, row * tileSize + tileSize)
                ctx.closePath();
                ctx.stroke();
            }
        }
    }

    const drawConsumables = (ctx) => {
        for (let i = 0; i < level.length; i++) {
            for (let j = 0; j < level[i].length; j++) {
                if (level[i][j] !== 8 && level[i][j] !== 3) continue;
                let radius = tileSize / 7;

                if (level[i][j] === CONSUMABLES.ENERGIZER) {
                    if (game.ticks % energizersBlinkTime > (energizersBlinkTime / 2)) continue;
                    radius = radius * 2.5
                }

                ctx.beginPath();
                ctx.fillStyle = "#db851c";
                ctx.arc(
                    j * tileSize + tileSize / 2,
                    i * tileSize + tileSize / 2,
                    radius, 0, 2 * Math.PI);
                ctx.fill();
            }
        }
    }

    const consume = (tile) => {
        const contents = level[tile[0]][tile[1]]
        // Pallet or engergizer
        if (contents === CONSUMABLES.ENERGIZER || contents === CONSUMABLES.PALLET) {
            level[tile[0]][tile[1]] = null
            return contents
        }
    }

    const draw = (ctx) => {
        ctx.strokeStyle = '#46bfee'
        ctx.beginPath();

        for (let i = 0; i < paths.length; i++) {
            for (let j = 0; j < paths[i].length; j++) {
                if (paths[i][j] !== 1) continue;

                const squareAbove = paths[i - 1] && paths[i - 1][j]
                const squareAboveRight = paths[i - 1] && paths[i - 1][j + 1]
                const squareAboveLeft = paths[i - 1] && paths[i - 1][j - 1]

                const squareBelow = paths[i + 1] && paths[i + 1][j]

                const squareBelowRight = paths[i + 1] && paths[i + 1][j + 1]
                const squareBelowLeft = paths[i + 1] && paths[i + 1][j - 1]

                const squareLeft = paths[i][j - 1]
                const squareRight = paths[i][j + 1]

                // Top left
                const x = (j * tileSize)
                const y = (i * tileSize)

                const centerX = x + (tileSize / 2)
                const centerY = y + (tileSize / 2)

                const cornerRadius = (tileSize / 2)

                // top left corner
                if (squareBelow && squareRight && !squareAbove && !squareLeft) {
                    ctx.moveTo(centerX, y + tileSize) // move to center bottom
                    ctx.arcTo(centerX, centerY, x + tileSize, centerY, cornerRadius);
                    continue;
                }

                // top right corner
                if (squareBelow && squareLeft && !squareAbove && !squareRight) {
                    ctx.moveTo(centerX, y + tileSize) // move to center bottom
                    ctx.arcTo(centerX, centerY, x, centerY, cornerRadius);
                    continue;
                }

                // bottom left corner
                if (i === level.length - 1 && j === level[i].length - 1) {
                    ctx.moveTo(centerX, y) // move to center top
                    ctx.arcTo(centerX, centerY, x, centerY, cornerRadius);
                    continue
                }

                // bottom right corner
                if (squareAbove && squareLeft && !squareBelow && !squareRight) {
                    ctx.moveTo(centerX, y) // move to center top
                    ctx.arcTo(centerX, centerY, x, centerY, cornerRadius);
                    continue;
                }

                // bottom left corner
                if (squareAbove && squareRight && !squareBelow && !squareLeft) {
                    ctx.moveTo(centerX, y) // move to center top
                    ctx.arcTo(centerX, centerY, x + tileSize, centerY, cornerRadius);
                    continue;
                }

                // If there is a tile to the right draw from the center to the right
                if (squareRight && (!squareAbove || !squareBelow || !squareBelowRight || !squareAboveRight)) {
                    // move to center
                    ctx.moveTo(centerX, centerY)
                    ctx.lineTo(x + tileSize, centerY); // line to right
                }

                // If there is a tile to the right draw fromt he center to the left 
                if (squareLeft && (!squareAbove || !squareBelow || !squareAboveLeft || !squareBelowLeft)) {
                    // move to center
                    ctx.moveTo(centerX, centerY)
                    ctx.lineTo(x, centerY)
                }

                // If there is a tile to the top draw from the center to the top
                if (squareAbove && (!squareRight || !squareLeft || !squareAboveRight || !squareAboveLeft)) {
                    // move to center
                    ctx.moveTo(centerX, centerY)
                    ctx.lineTo(centerX, i * tileSize)
                }

                // If there is a tile to the right draw fromt he center to the left 
                if (squareBelow && (!squareRight || !squareLeft || !squareBelowRight || !squareBelowLeft)) {
                    // move to center
                    ctx.moveTo(centerX, centerY)
                    ctx.lineTo(centerX, y + tileSize)
                }
            }
        }

        ctx.stroke();
        drawConsumables(ctx);
    }

    populatePaths();

    return {
        paths: paths,
        drawGrid: drawGrid,
        consume: consume,
        draw: draw,
    }
}
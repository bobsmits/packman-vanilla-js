const Tools = {
    tileAhead: (tile, tilesAhead, direction) => {
        switch (direction) {
            case 'up':
                return [tile[0] - tilesAhead, tile[1]]
            case 'down':
                return [tile[0] + tilesAhead, tile[1]]
            case 'left':
                // Tile at the otherside of the tunnle
                if (tile[1] === 0) 
                    return [tile[0], BOARD_SQUARES_WITH - 1];

                return [tile[0], tile[1] - tilesAhead]
            case 'right':
                // Tile at the otherside of the tunnle
                if (tile[1] === BOARD_SQUARES_WITH - 1) 
                    return [tile[0], 0];

                return [tile[0], tile[1] + tilesAhead]
        }
    },

    oposideDirection: (direction) => {
        if (direction === 'right') return 'left';
        if (direction === 'left') return 'right';
        if (direction === 'up') return 'down';
        if (direction === 'down') return 'up';
    },

    vectorDist: (tileA, tileB) => {
        const rowDist = Math.abs(tileA[0] - tileB[0])
        const colDist = Math.abs(tileA[1] - tileB[1])

        return Math.sqrt(rowDist * rowDist + colDist * colDist)
    },

    passesPoint: (point, a, b) => {
        return (a >= point && b <= point) ||
            (b >= point && a <= point)
    }
}
importScripts('chess.js');


function takeMove() {
    return (Math.random() > 0.7);
}

const chess = new Chess();


onmessage = function (e) {
    chess.load(e.data);

    while (!chess.game_over()) {
        const moves = chess.moves();
        let move = moves[Math.floor(Math.random() * moves.length)];
        for (let m of moves) {
            const goodMove = m.includes('x') || m.includes('+') || m.includes('=Q');
            if (goodMove && takeMove()) {
                move = m;
                break;
            }
            if (m.includes('#')) {
                move = m;
                break;
            }
        }
        chess.move(move);
    }
    const player = chess.turn();
    let result;
    if (chess.in_checkmate()) {
        result = (player === 'w') ? 'b' : 'w';
    }
    if (chess.in_stalemate() || chess.in_draw()) {
        result = 'draw';
    }
    postMessage(result);
}

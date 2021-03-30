import { Game } from 'treeSearch';
import Chess from 'chess.js'

onmessage = function (e) {
    const chess = new Chess(e.data);
    chess.reset();

    while (!chess.game_over()) {
        const moves = chess.moves();
        const move = moves[Math.floor(Math.random() * moves.length)];
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

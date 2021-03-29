import Chess from 'chess.js'

const initialBoard = '7k/6pp/8/8/8/8/6PP/7K w - - 0 1';

class Node {
    constructor(fen) {
        this.fen = fen;
        this.board = new Chess(fen);
        this.moves = this.board.moves();
        this.childNodes = {};
        this.simCount = 0;
        this.wins = 0;
        this.player = this.board.turn();
    }

    expandChild = (move) => {
        const newBoard = new Chess(this.fen);
        newBoard.move(move);
        const newChild = new Node(newBoard.fen());
        this.childNodes[move] = newChild;
        return newChild;
    }
    
}

async function playout(node){
    /* Returns winner, either 'b', 'w', or 'draw' */
    const chess = new Chess(node.board.fen());
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
    return result;
}


function getBestUtc(pntNode) {
    let bestScore = -1;
    let bestMove = pntNode.moves[0];
    let score, exploit, explore;
    for (let move of pntNode.moves) {
        // for explanation, see link
        // https://en.wikipedia.org/wiki/Monte_Carlo_tree_search
        let w, n, N, c;
        N = pntNode.simCount;
        c = 2**(1/2);
        if (pntNode.childNodes[move]) {
            w = pntNode.childNodes[move].wins;
            n = pntNode.childNodes[move].simCount;
        } else {
            return move;
        }
        exploit = (w/n);
        explore = c * (Math.sqrt(Math.log(N)/n));
        score = exploit + explore;
        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }
    return bestMove;
}


function traverse(pntNode, path) {
    if (!path) {
        path = [];
    }
    path.unshift(pntNode);

    if (pntNode.board.game_over()) {
        return path;
    }

    const move = getBestUtc(pntNode);
    if (!pntNode.childNodes[move]) {
        const newChild = pntNode.expandChild(move);
        path.unshift(newChild);
        return path;
    } else {
        return traverse(pntNode.childNodes[move], path);
    }
}


function backprop(path, result) {
    for (let node of path) {
        node.wins += (node.player === result) ? 1 : 0;
        node.simCount += 1;
    }
}


class Game {
    rootNode = new Node(initialBoard);
    started = false;

    buildTree = async () => {
        this.started = true;
        let count = 0;
        while (true) {
            if (!this.rootNode) {
                continue;
            }
            const path = traverse(this.rootNode);
            const leaf = path[0];
            const winResult = await playout(leaf);
            backprop(path, winResult);
            console.log('count:', count);
            count += 1;
        }
    }

    makeBestMove = () => {
        console.log(this.rootNode.childNodes);
        let bestMove = this.rootNode.moves[0];
        let mostVisits = -1;
        let childNode;
        for (let move of this.rootNode.moves) {
            childNode = this.rootNode.childNodes[move];
            if (!childNode) {
                continue;
            }
            if (mostVisits < childNode.simCount) {
                mostVisits = childNode.simCount;
                bestMove = move;
            }
        }
        if (!this.rootNode.childNodes[bestMove]) 
            return
        this.rootNode = this.rootNode.childNodes[bestMove];
    }

    makeMove = () => {
        
    }
}

export { Game }

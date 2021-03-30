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
    workerAvailable = true;
    currentGamePath;
    rolloutCount = 0;

    constructor() {
        this.worker = new Worker('./worker.js');
        this.worker.onmessage = (e) => {
            let winResult = e.data;
            backprop(this.currentGamePath, winResult);
            this.workerAvailable = true;
            this.rolloutCount += 1;
            console.log(this.rolloutCount);
        }
    }

    playout = (node) => {
        this.workerAvailable = false;
        this.worker.postMessage(node.board);
    }

    buildTree = async () => {
        this.started = true;
        while (true) {
            if (!this.rootNode) {
                continue;
            }
            if (this.workerAvailable) {
                const path = traverse(this.rootNode);
                const leaf = path[0];
                this.playout(leaf);
            }
            await new Promise(r => setTimeout(r, 1));
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
                console.log('no child');
                continue;
            }
            if (mostVisits < childNode.simCount) {
                mostVisits = childNode.simCount;
                bestMove = move;
            }
        }
        if (!this.rootNode.childNodes[bestMove])  {
            console.log('no node as best move');
            return
        }
        console.log('making move');
        this.rootNode = this.rootNode.childNodes[bestMove];
    }

    makeMove = () => {
        
    }
}

export { Game }

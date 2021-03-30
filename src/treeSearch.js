import Chess from 'chess.js'

const initialBoard = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

class Node {
    constructor(fen) {
        this.fen = fen;
        this.board = new Chess(fen);
        this.moves = this.board.moves();
        this.childNodes = {};
        this.simCount = 0;
        this.wWins = 0;
        this.bWins = 0;
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


function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function getBestUtc(pntNode) {
    let bestScore = -1;
    let bestMove = pntNode.moves[0];
    let score, exploit, explore;
    for (let move of shuffle(pntNode.moves)) {
        // for explanation, see link
        // https://en.wikipedia.org/wiki/Monte_Carlo_tree_search
        let w, n, N, c;
        N = pntNode.simCount;
        c = 2**(1/2);
        const child = pntNode.childNodes[move];
        if (child) {
            w = (pntNode.player === 'w') ? child.wWins : child.bWins;
            n = child.simCount;
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
        const wIncr = ('w' === result) ? 1 : 0;
        const bIncr = ('b' === result) ? 1 : 0;
        node.wWins += wIncr;
        node.bWins += bIncr;
        node.simCount += 1;
    }
}


class Game {
    rootNode = new Node(initialBoard);
    started = false;
    workerCount = 20;
    workersAvailable = 20;
    currentGamePath;
    rolloutCount = 0;

    constructor() {
        this.workers = [];
        for (let i=0; i<this.workerCount; i++) {
            const worker = new Worker('./worker.js');
            worker.onmessage = (e) => {
                let winResult = e.data;
                backprop(this.currentGamePath, winResult);
                this.workersAvailable += 1;
                this.rolloutCount += 1;
                if (this.rolloutCount % 100 === 0) {
                    console.log(this.rolloutCount);
                }
            }
            this.workers.push(worker);
        }
    }

    playout = (node) => {
        this.workersAvailable = 0;
        this.workers.forEach(w => w.postMessage(node.fen));
    }

    buildTree = async () => {
        this.started = true;
        while (true) {
            if (!this.rootNode) {
                continue;
            }
            if (this.workersAvailable === this.workerCount) {
                this.currentGamePath = traverse(this.rootNode);
                const leaf = this.currentGamePath[0];
                this.playout(leaf);
            }
            await new Promise(r => setTimeout(r, 1));
        }
    }

    makeBestMove = () => {
        console.log(this.rootNode.childNodes);
        let bestMove = this.rootNode.moves[0];
        let bestScore = -1;
        let childNode;
        for (let move of this.rootNode.moves) {
            childNode = this.rootNode.childNodes[move];
            if (!childNode) {
                continue;
            }
            let score;
            if (this.rootNode.player === 'w') {
                score = childNode.wWins / childNode.simCount;
            } else {
                score = childNode.bWins / childNode.simCount;
            }
            if (bestScore < score) {
                bestScore = score;
                bestMove = move;
            }
        }
        if (!this.rootNode.childNodes[bestMove])  {
            return
        }
        this.rootNode = this.rootNode.childNodes[bestMove];
    }

    makeMove = () => {
        
    }
}

export { Game }

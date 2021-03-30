import logo from './logo.svg';
import './App.css';
import { Game } from './treeSearch';
import Chessboard from 'chessboardjsx';
import { useState, useEffect } from 'react';


function App() {
    const [game, setGame] = useState(new Game());
    const [fen, setFen] = useState(game.rootNode.fen);
    function makeMove() {
        game.makeBestMove();
        setFen(game.rootNode.fen);
    }
    useEffect(() => {
        game.buildTree();
        setInterval(makeMove , 5000);
    }, []);



    return <Chessboard position={game.rootNode.fen}/>;
}

export default App;

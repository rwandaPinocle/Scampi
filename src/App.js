import logo from './logo.svg';
import './App.css';
import { Game } from './treeSearch';
import Chessboard from 'chessboardjsx';
import { useState, useEffect } from 'react';


function App() {
    const [game, setGame] = useState(new Game());
    function makeMove() {
        game.makeBestMove();
    }
    useEffect(() => {
        game.buildTree();
        setInterval(makeMove , 10000);
    }, []);



    return <Chessboard position={game.rootNode.fen}/>;
}

export default App;

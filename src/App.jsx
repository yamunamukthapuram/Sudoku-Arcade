import React, { useState, useEffect } from 'react';
import './styles.css';

const SIZE = 8;
const MAX_HINTS = 3;

function generatePuzzle(preFilled = 32) {
  const grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  const solution = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));

  for (let r = 0; r < SIZE; r++) {
    const nums = [...Array(SIZE).keys()].map(n => n + 1);
    for (let c = 0; c < SIZE; c++) {
      const index = Math.floor(Math.random() * nums.length);
      const val = nums.splice(index, 1)[0];
      solution[r][c] = val;
    }
  }

  let count = 0;
  while (count < preFilled) {
    const r = Math.floor(Math.random() * SIZE);
    const c = Math.floor(Math.random() * SIZE);
    if (grid[r][c] === 0) {
      grid[r][c] = solution[r][c];
      count++;
    }
  }

  return { grid, solution };
}

export default function App() {
  const saved = JSON.parse(localStorage.getItem('sudoku')) || null;
  const [difficulty, setDifficulty] = useState('Medium');
  const [original, setOriginal] = useState(saved ? saved.original : generatePuzzle(32).grid);
  const [solution, setSolution] = useState(saved ? saved.solution : generatePuzzle(32).solution);
  const [grid, setGrid] = useState(saved ? saved.grid : JSON.parse(JSON.stringify(original)));
  const [selected, setSelected] = useState([0, 0]);
  const [time, setTime] = useState(saved ? saved.time : 0);
  const [running, setRunning] = useState(false);
  const [dark, setDark] = useState(false);
  const [showSolutionFlag, setShowSolutionFlag] = useState(false);
  const [mistakesCount, setMistakesCount] = useState(null);
  const [history, setHistory] = useState([]);
  const [hintsLeft, setHintsLeft] = useState(MAX_HINTS);
  const [hintCell, setHintCell] = useState(null);

  useEffect(() => {
    let timer;
    if (running) timer = setInterval(() => setTime(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, [running]);

  useEffect(() => {
    localStorage.setItem('sudoku', JSON.stringify({ original, solution, grid, time }));
  }, [grid, time, original, solution]);

  const handleCellChange = (r, c, value) => {
    if (original[r][c] !== 0) return;
    if (isNaN(value) || value < 1 || value > SIZE) return;
    const newGrid = grid.map(row => [...row]);
    newGrid[r][c] = parseInt(value);
    setHistory([...history, grid.map(row => [...row])]);
    setGrid(newGrid);
    setHintCell(null);
  };

  const restartPuzzle = () => {
    const preFilled = difficulty === 'Easy' ? 40 : difficulty === 'Medium' ? 32 : 24;
    const { grid: newGrid, solution: newSol } = generatePuzzle(preFilled);
    setOriginal(newGrid);
    setSolution(newSol);
    setGrid(JSON.parse(JSON.stringify(newGrid)));
    setSelected([0, 0]);
    setTime(0);
    setRunning(false);
    setShowSolutionFlag(false);
    setMistakesCount(null);
    setHistory([]);
    setHintsLeft(MAX_HINTS);
    setHintCell(null);
  };

  const showSolution = () => {
    setGrid(solution.map(r => [...r]));
    setShowSolutionFlag(true);
    setHintCell(null);
  };

  const checkMistakes = () => {
    let mistakes = 0;
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (grid[r][c] !== 0 && grid[r][c] !== solution[r][c]) mistakes++;
      }
    }
    setMistakesCount(mistakes);
    setShowSolutionFlag(false);
    setHintCell(null);
  };

  const undoMove = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setGrid(prev);
    setHistory(history.slice(0, -1));
    setHintCell(null);
  };

  const giveHint = () => {
    const [r, c] = selected;
    if (hintsLeft <= 0) return;
    if (original[r][c] !== 0 || grid[r][c] === solution[r][c]) return;

    const newGrid = grid.map(row => [...row]);
    newGrid[r][c] = solution[r][c];
    setGrid(newGrid);
    setHintsLeft(h => h - 1);
    setHintCell([r, c]);
  };

  const getCellClass = (r, c) => {
    if (original[r][c] !== 0) return 'original';
    if (hintCell && hintCell[0] === r && hintCell[1] === c) return 'hinted';
    if (showSolutionFlag) return grid[r][c] === solution[r][c] ? 'correct' : 'wrong';
    return 'editable';
  };

  const handleNumberPad = (num) => {
    const [r, c] = selected;
    handleCellChange(r, c, num);
  };

  return (
    <div className={dark ? 'app dark' : 'app'}>
      <header>
        <h1>Sudoku Challenge – 8×8</h1>
        <button className="theme-toggle" onClick={() => setDark(d => !d)}>
          {dark ? 'Light Mode' : 'Dark Mode'}
        </button>
      </header>

      <div className='controls'>
        <select value={difficulty} onChange={e => setDifficulty(e.target.value)}>
          <option>Easy</option>
          <option>Medium</option>
          <option>Hard</option>
        </select>
        <button onClick={() => setRunning(true)}>Start</button>
        <button onClick={() => setRunning(false)}>Pause</button>
        <button onClick={restartPuzzle}>Restart</button>
        <button onClick={undoMove}>Undo</button>
        <button onClick={showSolution}>Show Solution</button>
        <button onClick={checkMistakes}>Check Mistakes</button>
        <button onClick={giveHint}>Hint ({hintsLeft})</button>
        <span>Time: {Math.floor(time / 60)}:{time % 60 < 10 ? '0' + (time % 60) : time % 60}</span>
        {mistakesCount !== null && <span>Mistakes: {mistakesCount}</span>}
      </div>

      <div className='grid'>
        {Array.from({ length: SIZE }).map((_, r) =>
          Array.from({ length: SIZE }).map((_, c) => (
            <input
              key={`${r}-${c}`}
              className={`cell ${getCellClass(r, c)} ${selected[0] === r || selected[1] === c ? 'highlight' : ''}`}
              type='number'
              min='1'
              max={SIZE}
              value={grid[r][c] === 0 ? '' : grid[r][c]}
              placeholder={original[r][c] !== 0 ? original[r][c] : ''}
              onFocus={() => setSelected([r, c])}
              onChange={e => handleCellChange(r, c, e.target.value)}
            />
          ))
        )}
      </div>

      <div className="number-pad">
        {Array.from({ length: SIZE }).map((_, i) => (
          <button key={i} onClick={() => handleNumberPad(i + 1)}>{i + 1}</button>
        ))}
      </div>
    </div>
  );
}

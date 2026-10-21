// Board rules are independent of React, input devices and vocabulary quizzes.
export const BOARD_SIZE = 8;
export const BLOCK_SHAPES = [
  [[0,0],[0,1]], [[0,0],[1,0]], [[0,0],[0,1],[0,2]], [[0,0],[1,0],[2,0]],
  [[0,0],[0,1],[1,0],[1,1]], [[0,0],[1,0],[2,0],[2,1]],
  [[0,0],[0,1],[0,2],[1,1]], [[0,0],[1,0],[1,1]],
  [[0,0],[0,1],[1,1]], [[0,0],[0,1],[0,2],[0,3]],
  [[0,0],[1,0],[2,0],[3,0]], [[0,1],[0,2],[1,0],[1,1]],
];
export const emptyBoard = () => Array(BOARD_SIZE * BOARD_SIZE).fill(0);
export function canPlace(board, piece, row, column) {
  return Boolean(piece && Number.isInteger(row) && Number.isInteger(column) && piece.cells.every(([r,c]) => {
    const y=row+r, x=column+c;
    return y>=0 && x>=0 && y<BOARD_SIZE && x<BOARD_SIZE && !board[y*BOARD_SIZE+x];
  }));
}
export function hasMove(board, pieces) {
  return pieces.some(piece => piece && board.some((_,index) => canPlace(board,piece,Math.floor(index/BOARD_SIZE),index%BOARD_SIZE)));
}
export function makeTray(board, random = Math.random) {
  const fitting=BLOCK_SHAPES.filter(cells=>hasMove(board,[{cells}]));
  const pool=fitting.length?fitting:BLOCK_SHAPES;
  return Array.from({length:3},(_,index)=>({id:index,cells:pool[Math.floor(random()*pool.length)],color:1+Math.floor(random()*5)}));
}
export function placeBlock(board, piece, row, column) {
  if(!canPlace(board,piece,row,column))return null;
  const placed=[...board];
  piece.cells.forEach(([r,c])=>{placed[(row+r)*BOARD_SIZE+column+c]=piece.color;});
  const rows=[],columns=[];
  for(let n=0;n<BOARD_SIZE;n++) {
    if(placed.slice(n*BOARD_SIZE,(n+1)*BOARD_SIZE).every(Boolean))rows.push(n);
    if(Array.from({length:BOARD_SIZE},(_,r)=>placed[r*BOARD_SIZE+n]).every(Boolean))columns.push(n);
  }
  const cleared=placed.map((_,i)=>rows.includes(Math.floor(i/BOARD_SIZE))||columns.includes(i%BOARD_SIZE)?i:-1).filter(i=>i>=0);
  const next=[...placed];cleared.forEach(i=>{next[i]=0;});
  const lines=rows.length+columns.length;
  return {board:next,placed,cleared,lines,score:piece.cells.length*10+lines*100+Math.max(0,lines-1)*50};
}

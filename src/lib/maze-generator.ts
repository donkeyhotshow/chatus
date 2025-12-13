
export function generateMaze(width: number, height: number): number[][] {
  // Ensure width and height are odd
  const w = width % 2 === 0 ? width - 1 : width;
  const h = height % 2 === 0 ? height - 1 : height;

  // Initialize maze with walls
  const maze: number[][] = Array.from({ length: h }, () => Array(w).fill(1));

  function carve(cx: number, cy: number) {
    if (cy < 0 || cy >= h || cx < 0 || cx >= w) {
        return; // Boundary check
    }
    maze[cy][cx] = 0; // Carve a path

    const directions = [
      { x: 0, y: -2 }, // North
      { x: 2, y: 0 },  // East
      { x: 0, y: 2 },  // South
      { x: -2, y: 0 }, // West
    ];

    // Shuffle directions
    for (let i = directions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [directions[i], directions[j]] = [directions[j], directions[i]];
    }

    for (const dir of directions) {
      const nx = cx + dir.x;
      const ny = cy + dir.y;

      if (ny >= 0 && ny < h && nx >= 0 && nx < w && maze[ny][nx] === 1) {
        // Carve wall between
        maze[cy + dir.y / 2][cx + dir.x / 2] = 0;
        carve(nx, ny);
      }
    }
  }

  // Start carving from a random odd position
  const startX = Math.floor(Math.random() * (w / 2)) * 2 + 1;
  const startY = Math.floor(Math.random() * (h / 2)) * 2 + 1;
  carve(startX, startY);

  // Create entrance and exit
  maze[0][1] = 0; // Start
  maze[h - 1][w - 2] = 0; // Finish

  return maze;
}

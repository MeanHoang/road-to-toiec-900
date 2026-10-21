// Pixel-space motion; React never needs to render on animation frames.
export function createBubbles(width, height, count, random = Math.random) {
  if (!count || width <= 0 || height <= 0) return [];
  const singleRow = width > height * 3 && count > 2;
  const diameter = Math.max(64, Math.min(width < 360 ? 118 : width < 600 ? 142 : 190, singleRow ? (width - count * 8) / count : (width - 20) / 2, singleRow ? height - 16 : (height - 20) / 2));
  const quadrants = [[0,0],[1,1],[1,0],[0,1]];
  const bodies = [];
  for (let i = 0; i < count; i++) {
    const [column, row] = singleRow ? [i, 0] : quadrants[i % quadrants.length];
    const cellWidth = width / (singleRow ? count : 2), cellHeight = height / (singleRow ? 1 : 2);
    const x = column * cellWidth + 4 + random() * Math.max(0, cellWidth - diameter - 8);
    const y = row * cellHeight + 4 + random() * Math.max(0, cellHeight - diameter - 8);
    const angle = random() * Math.PI * 2;
    const speed = (width < 600 ? 27 : 55) + random() * (width < 600 ? 14 : 35);
    bodies.push({ x, y, size: diameter, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed });
  }
  return bodies;
}

export function advanceBubbles(bodies, width, height, elapsed, frozen = new Set()) {
  const dt = Math.max(0, Math.min(elapsed, 0.035));
  bodies.forEach((body, i) => {
    if (frozen.has(i)) return;
    body.x += body.vx * dt; body.y += body.vy * dt;
    const maxX = Math.max(0, width - body.size), maxY = Math.max(0, height - body.size);
    if (body.x < 0) { body.x = 0; body.vx = Math.abs(body.vx); }
    if (body.x > maxX) { body.x = maxX; body.vx = -Math.abs(body.vx); }
    if (body.y < 0) { body.y = 0; body.vy = Math.abs(body.vy); }
    if (body.y > maxY) { body.y = maxY; body.vy = -Math.abs(body.vy); }
  });
  // Bounce against one another instead of allowing answers to cover each other.
  for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
    const a = bodies[i], b = bodies[j];
    const dx = b.x - a.x, dy = b.y - a.y, distance = Math.hypot(dx, dy);
    const minimum = (a.size + b.size) / 2 + 4;
    if (distance >= minimum) continue;
    const nx = distance ? dx / distance : 1, ny = distance ? dy / distance : 0;
    const overlap = minimum - distance;
    const aFixed = frozen.has(i), bFixed = frozen.has(j);
    if (aFixed && bFixed) continue;
    if (!aFixed) { a.x -= nx * overlap / (bFixed ? 1 : 2); a.y -= ny * overlap / (bFixed ? 1 : 2); }
    if (!bFixed) { b.x += nx * overlap / (aFixed ? 1 : 2); b.y += ny * overlap / (aFixed ? 1 : 2); }
    const closing = ((aFixed ? 0 : a.vx) - (bFixed ? 0 : b.vx)) * nx + ((aFixed ? 0 : a.vy) - (bFixed ? 0 : b.vy)) * ny;
    if (closing > 0) {
      if (!aFixed) { a.vx -= closing * nx * (bFixed ? 2 : 1); a.vy -= closing * ny * (bFixed ? 2 : 1); }
      if (!bFixed) { b.vx += closing * nx * (aFixed ? 2 : 1); b.vy += closing * ny * (aFixed ? 2 : 1); }
    }
  }
  bodies.forEach(body => {
    body.x = Math.max(0, Math.min(width - body.size, body.x));
    body.y = Math.max(0, Math.min(height - body.size, body.y));
  });
}

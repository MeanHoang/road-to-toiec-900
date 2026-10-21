export const PALETTE_COOKIE = 'toeic900-palette';
export const PALETTES = [
  { id: 'green', label: 'Leaf green', color: '#24754d', tint: '#eaf3ed' },
  { id: 'blue', label: 'Ocean blue', color: '#2866ad', tint: '#eaf1fb' },
  { id: 'violet', label: 'Soft violet', color: '#7250ac', tint: '#f1ecf9' },
  { id: 'rose', label: 'Warm rose', color: '#ad4568', tint: '#faedf1' },
  { id: 'amber', label: 'Golden amber', color: '#8a5712', tint: '#faf1df' },
];
export const paletteOf = (value) => PALETTES.some((palette) => palette.id === value) ? value : 'green';

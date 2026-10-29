// design.js: the Soul Sleeve tokens. DESIGN.md is the human-readable copy; change both together.
window.DESIGN = {
  palette: { ink: '#121212', chalk: '#F2F3F5', signal: '#FF3B2F', blush: '#F7B2BD', pine: '#1E4D3B' },
  // field color -> [type color, accent color]. Every pair is 4.5:1 or more (WCAG), measured 2026-10-29.
  type: { chalk: ['ink', 'pine'], ink: ['chalk', 'signal'], signal: ['ink', 'ink'], blush: ['ink', 'pine'], pine: ['chalk', 'blush'] },
  safe: { x: 96, y: 64 },
  weight: { min: 620, max: 900, fnMin: 300, fnMax: 650 },
  stretches: ['extra-condensed', 'condensed', 'semi-condensed', 'normal', 'semi-expanded'],
  lead: 0.03,      // a word starts its entrance this many seconds before its sung onset
  entrance: 0.14,  // expo-out entrance length, seconds
};

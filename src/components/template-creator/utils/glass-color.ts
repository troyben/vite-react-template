// ---------------------------------------------------------------------------
// Glass color helper (matches MiniSketchPreview)
// ---------------------------------------------------------------------------

export function getGlassColor(
  glassType: string,
  frameColor: string,
  customTint?: string,
): string {
  switch (glassType) {
    case 'clear':
      return frameColor === '#C0C0C0'
        ? 'rgba(200,210,255,0.3)'
        : 'rgba(200,200,255,0.3)';
    case 'frosted':
      return 'rgba(255,255,255,0.8)';
    case 'custom-tint':
      return `${customTint || '#AEEEEE'}80`;
    default:
      return 'rgba(200,200,255,0.3)';
  }
}

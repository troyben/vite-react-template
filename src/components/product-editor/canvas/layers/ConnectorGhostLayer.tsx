// ---------------------------------------------------------------------------
// ConnectorGhostLayer: renders the connector tool's hover ghost -- a corner
// post plus a dashed leg outline -- from the geometry computed by
// `utils/connector-tool.ts`. Shared by the flat path (ShapeCanvas) and the
// chain path (ChainCanvas) so the two can't drift on how the ghost looks.
// ---------------------------------------------------------------------------

import React from 'react';
import type { ConnectorGhost } from '../utils/connector-tool';

export function renderConnectorGhost(ghost: ConnectorGhost): React.ReactNode {
  return (
    <g key="connector-ghost" opacity={0.4}>
      <rect x={ghost.post.x} y={ghost.post.y} width={ghost.post.width} height={ghost.post.height} fill="#7c3aed" />
      <polygon
        points={ghost.legPoints}
        fill="#7c3aed" fillOpacity={0.15} stroke="#7c3aed" strokeWidth={1.5} strokeDasharray="5 3"
      />
    </g>
  );
}

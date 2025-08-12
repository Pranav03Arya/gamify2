import React, { useRef, useState } from "react";
import DecisionTree from "../components/DecisionTree";

export default function TreePage() {
  const [selected, setSelected] = useState(null);
  const treeRef = useRef(null);

  return (
    <div className="tree-v3 page-bg">
      <header className="tree-v3-head ProseMax">
        <h2>Explore</h2>
        <div className={`chip ${selected ? "" : "muted"}`}>
          {selected ? selected.name : "No node selected"}
        </div>
      </header>

      <div className="tree-v3-stage">
        <DecisionTree
          ref={treeRef}
          onSelect={(n) => setSelected(n)}
          wrapWidth={220}
          minRowGap={24}
          zoomExtent={[0.7, 2.0]}
          animationMs={520}
        />
      </div>
    </div>
  );
}

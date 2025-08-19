import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import * as d3 from "d3";
import { financingTree } from "../data/financingTree.ts";
import { useSession } from "../state/sessionStore.ts";

export default forwardRef(function DecisionTree(
  {
    onSelect,
    wrapWidth = 210,
    minRowGap = 24,
    zoomExtent = [0.7, 2.0],
    animationMs = 520,
  },
  ref
) {
  const MARGIN = { top: 56, right: 260, bottom: 56, left: 260 };
  const hostRef = useRef(null);
  const svgRef = useRef(null);
  const gRef = useRef(null);
  const [dims, setDims] = useState({ w: 1200, h: 720 });
  const [selectedId, setSelectedId] = useState(null);
  const { setSelected } = useSession();

  const rootH = useMemo(() => {
    const h = d3.hierarchy(financingTree, (d) => d.children);
    h.x0 = 0;
    h.y0 = 0;
    return h;
  }, []);

  // Collapse everything except root
  useEffect(() => {
    rootH.descendants().forEach((d) => {
      if (d.depth > 0 && d.children) {
        d._children = d.children;
        d.children = null;
      }
    });
  }, [rootH]);

  useEffect(() => {
    const el = hostRef.current;
    const ro = new ResizeObserver((e) => {
      for (const r of e) {
        const { width, height } = r.contentRect;
        setDims({ w: width, h: Math.max(620, height) });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const zoom = useRef(
    d3.zoom().scaleExtent(zoomExtent).on("zoom", (ev) => {
      d3.select(gRef.current).attr("transform", ev.transform);
    })
  );

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    if (svg.select("g.scene").empty()) {
      const g = svg.append("g").attr("class", "scene");
      gRef.current = g.node();
    }
    svg.call(zoom.current, d3.zoomIdentity);
  }, []);

  useImperativeHandle(ref, () => ({
    expandPath: (ids) => {
      const map = new Map();
      rootH.descendants().forEach((n) => map.set(n.data.id, n));
      ids.forEach((id) => {
        const n = map.get(id);
        if (n && n._children) {
          n.children = n._children;
          n._children = null;
        }
      });
      render(rootH);
      centerOn(rootH);
    },
    focusNode: (id) => centerOn(id),
  }));

  useEffect(() => {
    d3.select(svgRef.current).attr("width", dims.w).attr("height", dims.h);
    render(rootH);
    centerOn(rootH, 680);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dims]);

  // Collapse all branches except the clicked path
  function collapseAllExcept(keepNode) {
    const keepIds = new Set(keepNode.ancestors().map(a => a.data.id));
    rootH.descendants().forEach((n) => {
      if (!keepIds.has(n.data.id) && n.children) {
        n._children = n.children;
        n.children = null;
      }
    });
  }

  function centerOn(idOrNode, dur = animationMs) {
    const svg = d3.select(svgRef.current);
    let node = idOrNode;
    if (typeof idOrNode === "string") {
      node = rootH.descendants().find((n) => n.data.id === idOrNode);
    }
    if (!node) return;

    const k = d3.zoomTransform(svg.node()).k;
    const target = {
      x: (node.xAdj ?? node.x) + MARGIN.top,
      y: node.y + MARGIN.left,
    };
    const tx = dims.w / 2 - target.y * k;
    const ty = dims.h / 2 - target.x * k;

    svg
      .transition()
      .duration(dur)
      .call(
        zoom.current.transform,
        d3.zoomIdentity.translate(tx, ty).scale(k)
      );
  }

  function render(source) {
    const g = d3.select(gRef.current);

    const W = dims.w - MARGIN.left - MARGIN.right;
    const H = dims.h - MARGIN.top - MARGIN.bottom;

    const tree = d3
      .tree()
      .size([H, W])
      .separation((a, b) => (a.parent === b.parent ? 1.4 : 2.0));

    const root = tree(rootH);
    resolveCollisions(root.descendants(), minRowGap);

    const nodes = root.descendants();
    const links = root.links();

    const selectedNode = nodes.find((n) => n.data.id === selectedId);
    const pathIds = new Set(
      selectedNode ? selectedNode.ancestors().map((n) => n.data.id) : []
    );

    // LINKS
    const linkSel = g
      .selectAll("path.tlink")
      .data(links, (d) => d.target.data.id);

    const linkEnter = linkSel
      .enter()
      .append("path")
      .attr("class", "tlink")
      .attr("fill", "none")
      .attr("stroke-width", 2)
      .attr("stroke", (d) => linkColor(d))
      .attr("opacity", 0.75)
      .attr("d", () => elbow({ source, target: source }))
      .call(strokeDrawIn);

    linkEnter.merge(linkSel)
      .transition()
      .duration(animationMs)
      .attr("stroke", (d) => linkColor(d))
      .attr("opacity", (d) =>
        selectedId ? (pathIds.has(d.target.data.id) ? 0.95 : 0.25) : 0.8
      )
      .attr("d", (d) => elbow(d));

    linkSel.exit()
      .transition()
      .duration(animationMs)
      .attr("d", () => elbow({ source, target: source }))
      .remove();

    // NODES
    const nodeSel = g.selectAll("g.tnode").data(nodes, (d) => d.data.id);

    const nodeEnter = nodeSel
      .enter()
      .append("g")
      .attr("class", "tnode")
      .attr("id", (d) => `node-${d.data.id}`)
      .attr("transform", () => `translate(${source.y0 || 0},${source.x0 || 0})`)
      .on("click", (_, d) => {
        collapseAllExcept(d); // close other branches
        // toggle this one
        if (d._children) {
          d.children = d._children;
          d._children = null;
        } else if (d.children) {
          d._children = d.children;
          d.children = null;
        }

        setSelectedId(d.data.id);

        const path = [];
        let cur = d;
        while (cur) {
          path.unshift(cur.data.id);
          cur = cur.parent;
        }
        setSelected({ nodeId: d.data.id, pathIds: path });

        onSelect && onSelect(d.data);
        render(d);
        centerOn(d);
      });

    nodeEnter
      .append("circle")
      .attr("class", "halo")
      .attr("r", 0)
      .attr("fill", "none")
      .attr("stroke", "var(--accent)")
      .attr("stroke-width", 3)
      .attr("opacity", 0)
      .transition()
      .duration(animationMs)
      .attr("r", 16);

    nodeEnter
      .append("circle")
      .attr("class", "core")
      .attr("r", 0)
      .attr("fill", (d) => nodeFill(d))
      .attr("stroke", (d) => nodeStroke(d))
      .attr("stroke-width", 1.5)
      .transition()
      .duration(animationMs)
      .attr("r", 9);

    nodeEnter.each(function (d) {
      const gN = d3.select(this);
      const isParentSide = d.children || d._children;
      const x = isParentSide ? -22 : 22;
      const anchor = isParentSide ? "end" : "start";
      const t = gN
        .append("text")
        .attr("class", "nlabel")
        .attr("dy", "0.35em")
        .attr("x", x)
        .attr("y", 0)
        .attr("text-anchor", anchor)
        .attr("opacity", 0)
        .text(d.data.name);
      wrapText(t, wrapWidth);
      t.transition().duration(animationMs).attr("opacity", 1);
    });

    const nodeUpd = nodeEnter.merge(nodeSel);
    nodeUpd
      .transition()
      .duration(animationMs)
      .attr("transform", (d) => `translate(${d.y},${d.xAdj ?? d.x})`);

    nodeUpd.select("circle.core")
      .transition()
      .duration(animationMs)
      .attr("fill", (d) => nodeFill(d))
      .attr("stroke", (d) => nodeStroke(d))
      .attr("opacity", (d) =>
        selectedId ? (pathIds.has(d.data.id) ? 1 : 0.4) : 1
      );

    nodeSel.exit()
      .transition()
      .duration(animationMs)
      .attr("transform", () => `translate(${source.y},${source.x})`)
      .style("opacity", 0)
      .remove();

    nodes.forEach((d) => {
      d.x0 = d.xAdj ?? d.x;
      d.y0 = d.y;
    });
  }

  // Color & shape helpers
  function isDebt(d) {
    let p = d;
    while (p) {
      if (p.data.id === "debt") return true;
      p = p.parent;
    }
    return false;
  }
  function nodeFill(d) {
    if (d.depth === 0) return "var(--root)";
    if (d.data.outcome) return "var(--outcome)";
    return isDebt(d) ? "var(--debt)" : "var(--equity)";
  }
  function nodeStroke(d) {
    if (d.data.outcome) return "var(--outcome-stroke)";
    return isDebt(d) ? "var(--debt-stroke)" : "var(--equity-stroke)";
  }
  function linkColor(l) {
    const t = l.target;
    if (t.data.outcome) return "var(--outcome-link)";
    return isDebt(t) ? "var(--debt-link)" : "var(--equity-link)";
  }

  // Geometry helpers
  function elbow(l) {
    const sx = l.source.xAdj ?? l.source.x;
    const sy = l.source.y;
    const tx = l.target.xAdj ?? l.target.x;
    const ty = l.target.y;
    const mx = (sy + ty) / 2;
    return `M${sy},${sx}C${mx},${sx} ${mx},${tx} ${ty},${tx}`;
  }
  function strokeDrawIn(sel) {
    sel.each(function () {
      const path = d3.select(this);
      const len = this.getTotalLength ? this.getTotalLength() : 300;
      path
        .attr("stroke-dasharray", `${len} ${len}`)
        .attr("stroke-dashoffset", len)
        .transition()
        .duration(animationMs + 200)
        .ease(d3.easeCubicOut)
        .attr("stroke-dashoffset", 0);
    });
  }
  function wrapText(textSel, width) {
    textSel.each(function () {
      const text = d3.select(this);
      const words = text.text().split(/\s+/).reverse();
      let line = [];
      let lineNumber = 0;
      const lineHeight = 1.2;
      const y = text.attr("y") || 0;
      const dy = parseFloat(text.attr("dy")) || 0;
      let tspan = text.text(null).append("tspan")
        .attr("x", text.attr("x"))
        .attr("y", y)
        .attr("dy", dy + "em");
      let w;
      while ((w = words.pop())) {
        line.push(w);
        tspan.text(line.join(" "));
        if (tspan.node().getComputedTextLength() > width) {
          line.pop();
          tspan.text(line.join(" "));
          line = [w];
          tspan = text.append("tspan")
            .attr("x", text.attr("x"))
            .attr("y", y)
            .attr("dy", ++lineNumber * lineHeight + dy + "em")
            .text(w);
        }
      }
    });
  }
  function resolveCollisions(nodes, minGapPx) {
    const byDepth = d3.group(nodes, (d) => d.depth);
    byDepth.forEach((arr) => {
      arr.sort((a, b) => a.x - b.x);
      arr.forEach((n) => { if (n.labelY == null) n.labelY = n.x; });
      for (let i = 1; i < arr.length; i++) {
        const prev = arr[i - 1];
        const cur = arr[i];
        const diff = cur.labelY - prev.labelY;
        if (diff < minGapPx) cur.labelY += minGapPx - diff;
      }
      const low = arr[0].labelY;
      const high = arr[arr.length - 1].labelY;
      const bandMid = (low + high) / 2;
      const avg = arr.reduce((s, n) => s + n.labelY, 0) / arr.length;
      const delta = avg - bandMid;
      arr.forEach((n) => (n.labelY -= delta));
      arr.forEach((n) => (n.xAdj = n.labelY));
    });
  }

  return (
    <div ref={hostRef} className="tree-v3-wrap">
      <svg ref={svgRef} />
    </div>
  );
});

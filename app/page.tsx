"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Point = { x: number; y: number; t: number };
type MotionStyle = {
  name: string;
  note: string;
  color: string;
  smoothing: number;
  overshoot: number;
  bounce: number;
};

const STYLES: MotionStyle[] = [
  {
    name: "Curious",
    note: "Pause, inspect, then commit",
    color: "#f4b942",
    smoothing: 0.32,
    overshoot: 0.1,
    bounce: 0.18,
  },
  {
    name: "Brave",
    note: "Direct, fast, decisive",
    color: "#ff6846",
    smoothing: 0.18,
    overshoot: 0.18,
    bounce: 0.08,
  },
  {
    name: "Tender",
    note: "Soft acceleration, long settle",
    color: "#ee8fb5",
    smoothing: 0.48,
    overshoot: 0.05,
    bounce: 0.28,
  },
  {
    name: "Chaotic",
    note: "Elastic, irregular, alive",
    color: "#69d9c8",
    smoothing: 0.12,
    overshoot: 0.26,
    bounce: 0.34,
  },
];

const SAMPLE_PATHS: Point[][] = [
  [
    { x: 0.13, y: 0.67, t: 0 },
    { x: 0.19, y: 0.55, t: 70 },
    { x: 0.26, y: 0.48, t: 140 },
    { x: 0.35, y: 0.52, t: 220 },
    { x: 0.45, y: 0.36, t: 320 },
    { x: 0.55, y: 0.29, t: 410 },
    { x: 0.65, y: 0.43, t: 510 },
    { x: 0.74, y: 0.34, t: 610 },
    { x: 0.84, y: 0.2, t: 710 },
  ],
  [
    { x: 0.16, y: 0.52, t: 0 },
    { x: 0.24, y: 0.35, t: 90 },
    { x: 0.35, y: 0.27, t: 180 },
    { x: 0.48, y: 0.34, t: 280 },
    { x: 0.55, y: 0.56, t: 390 },
    { x: 0.65, y: 0.68, t: 500 },
    { x: 0.76, y: 0.55, t: 610 },
    { x: 0.84, y: 0.39, t: 720 },
  ],
  [
    { x: 0.17, y: 0.62, t: 0 },
    { x: 0.23, y: 0.35, t: 80 },
    { x: 0.34, y: 0.22, t: 160 },
    { x: 0.47, y: 0.39, t: 250 },
    { x: 0.36, y: 0.57, t: 350 },
    { x: 0.53, y: 0.68, t: 460 },
    { x: 0.67, y: 0.5, t: 570 },
    { x: 0.79, y: 0.31, t: 690 },
  ],
];

function smoothPath(points: Point[], factor: number) {
  if (points.length < 2) return points;
  const result: Point[] = [{ ...points[0] }];
  for (let i = 1; i < points.length; i += 1) {
    const previous = result[i - 1];
    result.push({
      x: previous.x + (points[i].x - previous.x) * (1 - factor),
      y: previous.y + (points[i].y - previous.y) * (1 - factor),
      t: points[i].t,
    });
  }
  return result;
}

function stylizePath(points: Point[], style: MotionStyle, exaggeration: number) {
  if (points.length < 2) return points;
  const cleaned = smoothPath(points, style.smoothing);
  const start = cleaned[0];
  const next = cleaned[Math.min(2, cleaned.length - 1)];
  const end = cleaned[cleaned.length - 1];
  const beforeEnd = cleaned[Math.max(0, cleaned.length - 3)];
  const anticipation = {
    x: start.x - (next.x - start.x) * (0.08 + style.overshoot * exaggeration),
    y: start.y - (next.y - start.y) * (0.08 + style.overshoot * exaggeration),
    t: -120,
  };
  const overshoot = {
    x: end.x + (end.x - beforeEnd.x) * style.overshoot * exaggeration,
    y: end.y + (end.y - beforeEnd.y) * style.overshoot * exaggeration,
    t: end.t + 110,
  };
  const settle = {
    x: end.x - (end.x - beforeEnd.x) * style.bounce * 0.12 * exaggeration,
    y: end.y - (end.y - beforeEnd.y) * style.bounce * 0.12 * exaggeration,
    t: end.t + 230,
  };
  return [anticipation, start, ...cleaned.slice(1), overshoot, settle, end];
}

function getPointAt(path: Point[], progress: number) {
  if (path.length === 0) return { x: 0.5, y: 0.5, angle: 0 };
  if (path.length === 1) return { ...path[0], angle: 0 };
  const position = Math.min(0.9999, Math.max(0, progress)) * (path.length - 1);
  const index = Math.floor(position);
  const local = position - index;
  const a = path[index];
  const b = path[Math.min(index + 1, path.length - 1)];
  return {
    x: a.x + (b.x - a.x) * local,
    y: a.y + (b.y - a.y) * local,
    angle: Math.atan2(b.y - a.y, b.x - a.x),
  };
}

function pathMetrics(points: Point[]) {
  if (points.length < 2) {
    return { samples: points.length, distance: 0, entropy: 0, curvature: 0 };
  }
  let distance = 0;
  let curvature = 0;
  const bins = new Array(8).fill(0);
  let previousAngle = 0;
  points.slice(1).forEach((point, index) => {
    const before = points[index];
    const dx = point.x - before.x;
    const dy = point.y - before.y;
    distance += Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    const normalized = (angle + Math.PI * 2) % (Math.PI * 2);
    bins[Math.min(7, Math.floor((normalized / (Math.PI * 2)) * 8))] += 1;
    if (index > 0) {
      let delta = Math.abs(angle - previousAngle);
      if (delta > Math.PI) delta = Math.PI * 2 - delta;
      curvature += delta;
    }
    previousAngle = angle;
  });
  const total = points.length - 1;
  const entropy = bins.reduce((sum, count) => {
    if (!count) return sum;
    const p = count / total;
    return sum - p * Math.log2(p);
  }, 0);
  return {
    samples: points.length,
    distance: Math.round(distance * 1000),
    entropy: Math.min(100, Math.round((entropy / 3) * 100)),
    curvature: Math.min(100, Math.round((curvature / Math.PI / 3) * 100)),
  };
}

function drawPath(
  context: CanvasRenderingContext2D,
  path: Point[],
  width: number,
  height: number,
  color: string,
  lineWidth: number,
  dashed = false,
) {
  if (path.length < 2) return;
  context.beginPath();
  context.moveTo(path[0].x * width, path[0].y * height);
  for (let i = 1; i < path.length; i += 1) {
    context.lineTo(path[i].x * width, path[i].y * height);
  }
  context.strokeStyle = color;
  context.lineWidth = lineWidth;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.setLineDash(dashed ? [3, 9] : []);
  context.stroke();
  context.setLineDash([]);
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const startTimeRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const [rawPath, setRawPath] = useState<Point[]>(SAMPLE_PATHS[0]);
  const [styleIndex, setStyleIndex] = useState(0);
  const [exaggeration, setExaggeration] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [sampleIndex, setSampleIndex] = useState(0);

  const style = STYLES[styleIndex];
  const cleanedPath = useMemo(
    () => smoothPath(rawPath, style.smoothing),
    [rawPath, style.smoothing],
  );
  const styledPath = useMemo(
    () => stylizePath(rawPath, style, exaggeration),
    [rawPath, style, exaggeration],
  );
  const metrics = useMemo(() => pathMetrics(rawPath), [rawPath]);

  const render = useCallback(
    (progress = 1) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      if (
        canvas.width !== Math.round(rect.width * pixelRatio) ||
        canvas.height !== Math.round(rect.height * pixelRatio)
      ) {
        canvas.width = Math.round(rect.width * pixelRatio);
        canvas.height = Math.round(rect.height * pixelRatio);
      }
      const context = canvas.getContext("2d");
      if (!context) return;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      const width = rect.width;
      const height = rect.height;
      context.clearRect(0, 0, width, height);

      const glow = context.createRadialGradient(
        width * 0.55,
        height * 0.45,
        20,
        width * 0.55,
        height * 0.45,
        width * 0.68,
      );
      glow.addColorStop(0, "rgba(104, 217, 200, 0.07)");
      glow.addColorStop(1, "rgba(104, 217, 200, 0)");
      context.fillStyle = glow;
      context.fillRect(0, 0, width, height);

      drawPath(context, rawPath, width, height, "rgba(240,245,242,.34)", 1.5, true);
      drawPath(context, cleanedPath, width, height, "rgba(105,217,200,.42)", 2);
      drawPath(context, styledPath, width, height, `${style.color}aa`, 3.5);

      const actor = getPointAt(styledPath, progress);
      const x = actor.x * width;
      const y = actor.y * height;
      const speedPulse = playing ? 1 + Math.sin(progress * Math.PI * 10) * 0.06 : 1;
      const radius = Math.max(18, Math.min(30, width * 0.035)) * speedPulse;

      context.save();
      context.translate(x, y);
      context.rotate(actor.angle * 0.16);
      context.shadowColor = style.color;
      context.shadowBlur = 30;
      context.fillStyle = style.color;
      context.beginPath();
      context.arc(0, 0, radius, 0, Math.PI * 2);
      context.fill();
      context.shadowBlur = 0;
      context.strokeStyle = "#152b2d";
      context.lineWidth = 2.5;
      context.stroke();
      context.fillStyle = "#152b2d";
      context.beginPath();
      context.arc(-radius * 0.24, -radius * 0.1, 2.2, 0, Math.PI * 2);
      context.arc(radius * 0.24, -radius * 0.1, 2.2, 0, Math.PI * 2);
      context.fill();
      context.beginPath();
      context.arc(0, radius * 0.1, radius * 0.22, 0.1, Math.PI - 0.1);
      context.stroke();
      context.beginPath();
      context.moveTo(-radius * 0.35, radius * 0.86);
      context.lineTo(-radius * 0.45, radius * 1.25);
      context.moveTo(radius * 0.35, radius * 0.86);
      context.lineTo(radius * 0.45, radius * 1.25);
      context.stroke();
      context.restore();
    },
    [cleanedPath, playing, rawPath, style, styledPath],
  );

  useEffect(() => {
    render(1);
    const handleResize = () => render(1);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [render]);

  const play = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    setPlaying(true);
    const started = performance.now();
    const duration = Math.max(1050, styledPath.length * 115);
    const tick = (now: number) => {
      const elapsed = (now - started) / duration;
      const progress = Math.min(1, 1 - Math.pow(1 - Math.min(elapsed, 1), 2.4));
      render(progress);
      if (elapsed < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        frameRef.current = null;
        setPlaying(false);
      }
    };
    frameRef.current = requestAnimationFrame(tick);
  }, [render, styledPath.length]);

  useEffect(
    () => () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    },
    [],
  );

  const pointFromEvent = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.min(0.96, Math.max(0.04, (event.clientX - rect.left) / rect.width)),
      y: Math.min(0.92, Math.max(0.08, (event.clientY - rect.top) / rect.height)),
      t: performance.now() - startTimeRef.current,
    };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    startTimeRef.current = performance.now();
    setRawPath([{ ...pointFromEvent(event), t: 0 }]);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const point = pointFromEvent(event);
    setRawPath((current) => {
      const last = current[current.length - 1];
      if (last && Math.hypot(point.x - last.x, point.y - last.y) < 0.008) {
        return current;
      }
      return [...current, point].slice(-220);
    });
  };

  const handlePointerUp = () => {
    drawingRef.current = false;
    window.setTimeout(play, 80);
  };

  const loadSample = () => {
    const next = (sampleIndex + 1) % SAMPLE_PATHS.length;
    setSampleIndex(next);
    setRawPath(SAMPLE_PATHS[next]);
    window.setTimeout(play, 40);
  };

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Motionprint home">
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span>MOTIONPRINT</span>
          <em>LAB 01</em>
        </a>
        <nav aria-label="Main navigation">
          <a href="#experiment">Experiment</a>
          <a href="#method">Method</a>
          <a href="#notes">Notes</a>
        </nav>
        <a
          className="repo-link"
          href="https://github.com/jacobegarcia/motionprint-lab"
          target="_blank"
          rel="noreferrer"
        >
          View source <span aria-hidden="true">↗</span>
        </a>
      </header>

      <section className="hero" id="top">
        <div className="eyebrow">
          Human gesture → animation language
          <span>Independent research prototype</span>
        </div>
        <h1>
          What if a character
          <br />
          moved like <i>you?</i>
        </h1>
        <div className="hero-bottom">
          <p>
            Motionprint transforms the rhythm, hesitation, curvature, and
            imperfection in a human gesture into an expressive animation
            performance.
          </p>
          <a href="#experiment" className="primary-action">
            Run the experiment
            <span aria-hidden="true">↓</span>
          </a>
        </div>
        <div className="hero-orbit" aria-hidden="true">
          <span className="orbit-dot dot-one" />
          <span className="orbit-dot dot-two" />
          <span className="orbit-dot dot-three" />
          <span className="orbit-label">raw intent</span>
          <span className="orbit-label label-two">stylized motion</span>
        </div>
      </section>

      <section className="experiment-section" id="experiment">
        <div className="section-heading">
          <span>01 / LIVE EXPERIMENT</span>
          <h2>Draw a gesture. Give it a point of view.</h2>
          <p>
            Use a mouse, pen, or finger. The performer inherits your path, then
            adds animation principles without erasing the human signal.
          </p>
        </div>

        <div className="lab-shell">
          <div className="lab-toolbar">
            <div className="status">
              <span className="status-light" />
              MOTION STAGE / READY
            </div>
            <div className="legend" aria-label="Path legend">
              <span><i className="raw-line" /> Raw</span>
              <span><i className="clean-line" /> Cleaned</span>
              <span><i className="style-line" style={{ background: style.color }} /> Styled</span>
            </div>
          </div>

          <div className="stage-wrap">
            <canvas
              ref={canvasRef}
              className="motion-stage"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              role="application"
              tabIndex={0}
              aria-label="Interactive motion stage. Draw a gesture with your pointer."
            />
            <div className="stage-instruction" aria-hidden="true">
              PRESS + DRAG TO DRAW A NEW PERFORMANCE
            </div>
            <div className="stage-index" aria-hidden="true">MP–{String(styleIndex + 1).padStart(2, "0")}</div>
          </div>

          <div className="controls">
            <div className="control-group style-picker">
              <span className="control-label">Point of view</span>
              <div className="style-options">
                {STYLES.map((item, index) => (
                  <button
                    key={item.name}
                    type="button"
                    className={index === styleIndex ? "active" : ""}
                    onClick={() => setStyleIndex(index)}
                    aria-pressed={index === styleIndex}
                  >
                    <span style={{ background: item.color }} />
                    {item.name}
                  </button>
                ))}
              </div>
              <p>{style.note}</p>
            </div>

            <label className="control-group range-control">
              <span className="control-label">
                Exaggeration <strong>{exaggeration.toFixed(1)}×</strong>
              </span>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={exaggeration}
                onChange={(event) => setExaggeration(Number(event.target.value))}
              />
              <span className="range-labels"><i>Natural</i><i>Graphic</i></span>
            </label>

            <div className="play-controls">
              <button type="button" className="secondary-button" onClick={loadSample}>
                New sample
              </button>
              <button type="button" className="play-button" onClick={play} disabled={playing}>
                <span aria-hidden="true">{playing ? "•••" : "▶"}</span>
                {playing ? "Performing" : "Replay motion"}
              </button>
            </div>
          </div>
        </div>

        <div className="metrics-strip" aria-label="Gesture analysis">
          <div>
            <span>Input samples</span>
            <strong>{metrics.samples}</strong>
            <em>points</em>
          </div>
          <div>
            <span>Travel</span>
            <strong>{metrics.distance}</strong>
            <em>normalized px</em>
          </div>
          <div>
            <span>Gesture entropy</span>
            <strong>{metrics.entropy}</strong>
            <em>/ 100</em>
          </div>
          <div>
            <span>Curvature</span>
            <strong>{metrics.curvature}</strong>
            <em>/ 100</em>
          </div>
        </div>
      </section>

      <section className="method-section" id="method">
        <div className="method-intro">
          <span>02 / METHOD</span>
          <h2>Preserve intent.<br />Design the response.</h2>
          <p>
            The pipeline is deliberately legible: every transformation can be
            inspected, tuned, and challenged by an animator.
          </p>
        </div>
        <div className="pipeline">
          {[
            ["01", "Capture", "Pointer position and timing become a compact motion signature."],
            ["02", "Clean", "Adaptive smoothing removes device noise while retaining hesitation."],
            ["03", "Stylize", "Anticipation, overshoot, and settle are applied as reversible layers."],
            ["04", "Perform", "A character interprets the path through a chosen emotional lens."],
          ].map(([number, title, text], index) => (
            <article key={title}>
              <div className="pipeline-top">
                <span>{number}</span>
                <i style={{ background: STYLES[index].color }} />
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="notes-section" id="notes">
        <div className="notes-card hypothesis-card">
          <span className="card-label">WORKING HYPOTHESIS</span>
          <blockquote>
            Imperfection is not noise to remove. It is authorship to preserve.
          </blockquote>
          <p>
            Two people can draw the same arc and communicate different intent.
            Motionprint asks whether those subtle signatures can become useful,
            animator-controllable performance cues.
          </p>
        </div>
        <div className="notes-card observations-card">
          <span className="card-label">DESIGN PRINCIPLES</span>
          <ul>
            <li><strong>Artist in the loop</strong><span>Every result remains editable and explainable.</span></li>
            <li><strong>Layer, don’t replace</strong><span>Raw, cleaned, and styled paths stay visible together.</span></li>
            <li><strong>Expression over realism</strong><span>The goal is readable intent, not physical simulation.</span></li>
          </ul>
        </div>
        <div className="notes-card origin-card">
          <span className="card-label">ORIGIN</span>
          <h3>From proof-of-human to proof-of-feeling.</h3>
          <p>
            Inspired by Humanico, an earlier experiment using rhythm, timing
            error, cursor entropy, and hand tremor as organic human signals.
            Motionprint asks a more playful question: can those same signals
            help a digital character feel authored?
          </p>
          <a href="https://jacobegarcia.github.io/humanico/" target="_blank" rel="noreferrer">
            See the original experiment <span aria-hidden="true">↗</span>
          </a>
        </div>
      </section>

      <section className="next-section">
        <span>03 / NEXT QUESTIONS</span>
        <h2>A prototype is an invitation to ask better questions.</h2>
        <div className="questions-grid">
          <p>How should the system separate meaningful hesitation from hardware jitter?</p>
          <p>Can a library of motion signatures help animators explore performance faster?</p>
          <p>What controls keep stylization expressive without making it unpredictable?</p>
        </div>
      </section>

      <footer>
        <div>
          <span className="footer-mark">MOTIONPRINT</span>
          <p>An independent interactive research prototype by Jacob E. Garcia.</p>
        </div>
        <div className="footer-links">
          <a href="https://github.com/jacobegarcia/motionprint-lab" target="_blank" rel="noreferrer">GitHub ↗</a>
          <a href="https://www.linkedin.com/in/jacob-emmanuel-garcia-26587a265" target="_blank" rel="noreferrer">LinkedIn ↗</a>
        </div>
        <p className="disclaimer">Built as a portfolio experiment. Not affiliated with Pixar or The Walt Disney Company.</p>
      </footer>
    </main>
  );
}

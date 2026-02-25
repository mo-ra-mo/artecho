"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const ORBITS = [
  { rx: 100, ry: 100, speed: 1.0, phase: 0, width: 1.0, color: "rgba(90,150,200,0.22)", glow: "rgba(180,210,235,0.06)", dash: null },
  { rx: 150, ry: 150, speed: -0.7, phase: 1.2, width: 1.4, color: "rgba(110,140,195,0.20)", glow: "rgba(210,185,170,0.05)", dash: "6 4" },
  { rx: 210, ry: 210, speed: 0.5, phase: 2.5, width: 1.8, color: "rgba(130,165,210,0.17)", glow: "rgba(170,200,220,0.05)", dash: null },
  { rx: 275, ry: 275, speed: -0.35, phase: 3.8, width: 1.2, color: "rgba(95,135,185,0.19)", glow: "rgba(220,195,175,0.04)", dash: "10 6" },
  { rx: 350, ry: 350, speed: 0.25, phase: 5.0, width: 2.0, color: "rgba(120,155,205,0.14)", glow: "rgba(175,205,225,0.04)", dash: null },
  { rx: 430, ry: 430, speed: -0.18, phase: 0.7, width: 1.6, color: "rgba(105,145,200,0.11)", glow: "rgba(215,190,180,0.03)", dash: "4 8" },
];

const PLANETS = [
  { orbit: 0, angle: 0, r: 4.5, color: "rgba(80,140,185,0.40)" },
  { orbit: 0, angle: Math.PI, r: 3, color: "rgba(100,160,205,0.35)" },
  { orbit: 0, angle: 2.4, r: 2, color: "rgba(90,150,195,0.30)" },
  { orbit: 1, angle: 0.8, r: 6, color: "rgba(85,130,180,0.38)" },
  { orbit: 1, angle: 3.6, r: 2.5, color: "rgba(115,150,195,0.32)" },
  { orbit: 1, angle: 5.2, r: 3.5, color: "rgba(95,140,185,0.28)" },
  { orbit: 2, angle: 1.5, r: 4, color: "rgba(95,145,200,0.35)" },
  { orbit: 2, angle: 4.2, r: 7, color: "rgba(80,125,175,0.30)" },
  { orbit: 2, angle: 0.2, r: 2.5, color: "rgba(110,155,200,0.26)" },
  { orbit: 3, angle: 0.3, r: 5, color: "rgba(105,155,205,0.33)" },
  { orbit: 3, angle: 3.5, r: 3, color: "rgba(90,140,190,0.28)" },
  { orbit: 3, angle: 5.8, r: 2, color: "rgba(100,148,195,0.24)" },
  { orbit: 4, angle: 1.0, r: 3.5, color: "rgba(100,150,200,0.25)" },
  { orbit: 4, angle: 4.8, r: 6.5, color: "rgba(85,135,185,0.22)" },
  { orbit: 4, angle: 2.8, r: 2.5, color: "rgba(105,155,205,0.20)" },
  { orbit: 5, angle: 2.2, r: 4, color: "rgba(110,160,210,0.20)" },
  { orbit: 5, angle: 5.5, r: 2.5, color: "rgba(95,145,195,0.18)" },
  { orbit: 5, angle: 0.6, r: 3, color: "rgba(100,150,200,0.16)" },
  { orbit: 5, angle: 3.9, r: 2, color: "rgba(88,138,188,0.14)" },
];

export function DrawingRobot() {
  const [currentSection, setCurrentSection] = useState(1);
  const [totalSections, setTotalSections] = useState(1);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined"
      ? window.matchMedia("(max-width: 1024px)").matches
      : false,
  );
  const [viewportHeight, setViewportHeight] = useState(
    typeof window !== "undefined" ? window.innerHeight || 800 : 800,
  );
  const sectionsRef = useRef([]);

  const handleScroll = useCallback(() => {
    const sections = sectionsRef.current;
    if (sections.length === 0) return;

    const viewportMid = window.innerHeight / 2;
    let active = 1;
    for (let i = 0; i < sections.length; i++) {
      const rect = sections[i].getBoundingClientRect();
      if (rect.top <= viewportMid) active = i + 1;
    }
    setCurrentSection(active);

    const scrollTop = window.scrollY;
    const docHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    setScrollProgress(docHeight > 0 ? scrollTop / docHeight : 0);
  }, []);

  useEffect(() => {
    const findSections = () => {
      const main = document.querySelector("main");
      if (!main) return;
      const s = Array.from(main.querySelectorAll("section"));
      sectionsRef.current = s;
      setTotalSections(Math.max(1, s.length));
    };

    findSections();
    const timer = setTimeout(findSections, 500);

    window.addEventListener("scroll", handleScroll, { passive: true });
    queueMicrotask(handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timer);
    };
  }, [handleScroll]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1024px)");
    const onMediaChange = (e) => setIsMobile(e.matches);
    const onOrientationChange = () => setViewportHeight(window.innerHeight || 800);

    setIsMobile(media.matches);
    setViewportHeight(window.innerHeight || 800);

    if (media.addEventListener) {
      media.addEventListener("change", onMediaChange);
    } else {
      media.addListener(onMediaChange);
    }
    window.addEventListener("orientationchange", onOrientationChange);

    return () => {
      if (media.removeEventListener) {
        media.removeEventListener("change", onMediaChange);
      } else {
        media.removeListener(onMediaChange);
      }
      window.removeEventListener("orientationchange", onOrientationChange);
    };
  }, []);

  const display = String(currentSection).padStart(2, "0");
  const total = String(totalSections).padStart(2, "0");

  const t = scrollProgress * Math.PI * 6;

  const SIZE = isMobile
    ? Math.max(620, Math.round(viewportHeight * 1.08))
    : 880;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const orbitScale = SIZE / 880;
  const scaledOrbits = ORBITS.map((orb) => ({
    ...orb,
    rx: orb.rx * orbitScale,
    ry: orb.ry * orbitScale,
  }));

  return (
    <div
      className="fixed z-1 pointer-events-none"
      style={
        isMobile
          ? {
              top: "50svh",
              transform: "translateY(-50%)",
              left: Math.round(-SIZE * 0.42),
            }
          : { top: "50%", transform: "translateY(-50%)", left: -375 }
      }
    >
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        {/* Soft blur behind orbits */}
        <div
          className="absolute rounded-full"
          style={{
            width: SIZE * (isMobile ? 0.9 : 0.85),
            height: SIZE * (isMobile ? 0.9 : 0.85),
            left: CX - (SIZE * (isMobile ? 0.9 : 0.85)) / 2,
            top: CY - (SIZE * (isMobile ? 0.9 : 0.85)) / 2,
            background: "radial-gradient(circle, rgba(241,245,249,0.95) 0%, rgba(241,245,249,0.85) 40%, rgba(241,245,249,0.5) 65%, transparent 80%)",
          }}
        />
        {/* Orbital SVG */}
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="absolute inset-0"
        >
          <defs>
            {scaledOrbits.map((orb, i) => (
              <filter key={`blur-${i}`} id={`orbitBlur${i}`}>
                <feGaussianBlur stdDeviation={12 + i * 4} />
              </filter>
            ))}
          </defs>

          {/* Glow layers behind each orbit */}
          {scaledOrbits.map((orb, i) => {
            const warp = 0.3 * Math.sin(t * 0.15 + i * 1.1);
            const currentRx = orb.rx * (1 + warp * 0.6);
            const currentRy = orb.ry * (1 - warp * 0.45);
            const rotation = warp * 28;

            return (
              <ellipse
                key={`glow-${i}`}
                cx={CX}
                cy={CY}
                rx={currentRx * 0.95}
                ry={currentRy * 0.95}
                fill={orb.glow}
                stroke="none"
                filter={`url(#orbitBlur${i})`}
                transform={`rotate(${rotation} ${CX} ${CY})`}
              />
            );
          })}

          {/* Filled bands between middle orbits */}
          {[[1, 2], [2, 3], [3, 4]].map(([inner, outer], idx) => {
            const fills = [
              "rgba(190,215,235,0.045)",
              "rgba(175,205,225,0.035)",
              "rgba(195,210,230,0.025)",
            ];
            const orbOuter = scaledOrbits[outer];
            const scaledInner = scaledOrbits[inner];
            const wI = 0.3 * Math.sin(t * 0.15 + inner * 1.1);
            const wO = 0.3 * Math.sin(t * 0.15 + outer * 1.1);
            const rI = scaledInner.rx * (1 + wI * 0.6);
            const rO = orbOuter.rx * (1 + wO * 0.6);
            const ryI = scaledInner.ry * (1 - wI * 0.45);
            const ryO = orbOuter.ry * (1 - wO * 0.45);
            const rot = ((wI + wO) / 2) * 28;

            return (
              <g key={`band-${idx}`} transform={`rotate(${rot} ${CX} ${CY})`}>
                <ellipse cx={CX} cy={CY} rx={rO} ry={ryO} fill={fills[idx]} />
                <ellipse cx={CX} cy={CY} rx={rI} ry={ryI} fill="rgba(241,245,249,1)" />
              </g>
            );
          })}

          {/* Orbit lines */}
          {scaledOrbits.map((orb, i) => {
            const warp = 0.3 * Math.sin(t * 0.15 + i * 1.1);
            const currentRx = orb.rx * (1 + warp * 0.6);
            const currentRy = orb.ry * (1 - warp * 0.45);
            const rotation = warp * 28;

            return (
              <ellipse
                key={`orbit-${i}`}
                cx={CX}
                cy={CY}
                rx={currentRx}
                ry={currentRy}
                fill="none"
                stroke={orb.color}
                strokeWidth={orb.width}
                strokeDasharray={orb.dash || "none"}
                transform={`rotate(${rotation} ${CX} ${CY})`}
              />
            );
          })}

          {PLANETS.map((p, i) => {
            const orb = scaledOrbits[p.orbit];
            const warp = 0.3 * Math.sin(t * 0.15 + p.orbit * 1.1);
            const currentRx = orb.rx * (1 + warp * 0.6);
            const currentRy = orb.ry * (1 - warp * 0.45);
            const rotation = (warp * 28 * Math.PI) / 180;

            const angle = p.angle + t * orb.speed * 0.12 + orb.phase;
            const localX = currentRx * Math.cos(angle);
            const localY = currentRy * Math.sin(angle);

            const px =
              CX + localX * Math.cos(rotation) - localY * Math.sin(rotation);
            const py =
              CY + localX * Math.sin(rotation) + localY * Math.cos(rotation);

            const sizeWobble = 1 + 0.25 * Math.sin(t * 0.2 + i * 1.7);
            return (
              <circle
                key={`planet-${i}`}
                cx={px}
                cy={py}
                r={p.r * sizeWobble}
                fill={p.color}
              />
            );
          })}
        </svg>

        {/* Center planet */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="relative rounded-full overflow-hidden border border-sky-100/70 shadow-[0_0_35px_rgba(56,189,248,0.35)]"
            style={{
              width: isMobile ? 66 : 112,
              height: isMobile ? 66 : 112,
              background:
                "radial-gradient(circle at 32% 28%, rgba(216,230,244,0.95) 0%, rgba(143,170,197,0.85) 38%, rgba(92,123,154,0.78) 68%, rgba(58,84,112,0.72) 100%)",
            }}
          >
            <div
              className="absolute rounded-full bg-slate-300/70"
              style={{ width: "42%", height: "28%", left: "13%", top: "27%", transform: "rotate(-16deg)" }}
            />
            <div
              className="absolute rounded-full bg-slate-200/65"
              style={{ width: "34%", height: "22%", right: "14%", top: "40%", transform: "rotate(12deg)" }}
            />
            <div
              className="absolute rounded-full bg-slate-300/65"
              style={{ width: "24%", height: "18%", left: "39%", bottom: "18%", transform: "rotate(-8deg)" }}
            />
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  "radial-gradient(circle at 70% 24%, rgba(255,255,255,0.28), transparent 34%), radial-gradient(circle at 20% 80%, rgba(255,255,255,0.16), transparent 40%)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function Logo({ size = "default" }: { size?: "default" | "lg" }) {
  const s = size === "lg" ? 1.3 : 1;
  const w = Math.round(46 * s);
  const h = Math.round(38 * s);

  return (
    <div className="flex items-center gap-3 leading-none select-none">
      {/* ── Camera Icon ── */}
      <svg
        width={w}
        height={h}
        viewBox="0 0 46 38"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Camera body */}
        <rect
          x="0" y="9" width="46" height="29" rx="5"
          style={{ fill: "var(--foreground)" }}
        />
        {/* Viewfinder bump top-center */}
        <rect
          x="14" y="1" width="14" height="10" rx="3.5"
          style={{ fill: "var(--foreground)" }}
        />
        {/* Hot shoe top-right */}
        <rect
          x="31" y="3" width="10" height="7" rx="2"
          style={{ fill: "var(--foreground)" }}
        />
        {/* Small status light top-left */}
        <circle
          cx="5" cy="14" r="1.8"
          style={{ fill: "var(--background)" }}
          opacity="0.4"
        />

        {/* Lens outer contrast ring — uses background to punch through */}
        <circle
          cx="23" cy="23" r="12"
          style={{ fill: "var(--background)" }}
        />
        {/* Thin outer lens border */}
        <circle
          cx="23" cy="23" r="12"
          fill="none"
          style={{ stroke: "var(--foreground)" }}
          strokeWidth="0.6"
          opacity="0.25"
        />
        {/* Lens inner body */}
        <circle
          cx="23" cy="23" r="10"
          style={{ fill: "var(--foreground)" }}
        />

        {/* Aperture blades — 6 blades using background color */}
        {[0, 60, 120, 180, 240, 300].map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const cx = 23, cy = 23;
          const inner = 2.5, outer = 7.5, spread = 0.66;
          const x0 = (cx + inner * Math.cos(rad)).toFixed(2);
          const y0 = (cy + inner * Math.sin(rad)).toFixed(2);
          const x1 = (cx + outer * Math.cos(rad - spread)).toFixed(2);
          const y1 = (cy + outer * Math.sin(rad - spread)).toFixed(2);
          const x2 = (cx + outer * Math.cos(rad + spread)).toFixed(2);
          const y2 = (cy + outer * Math.sin(rad + spread)).toFixed(2);
          return (
            <path
              key={deg}
              d={`M${x0},${y0} L${x1},${y1} A${outer},${outer} 0 0 1 ${x2},${y2} Z`}
              style={{ fill: "var(--background)" }}
              opacity="0.35"
            />
          );
        })}

        {/* Center lens glint */}
        <circle
          cx="23" cy="23" r="2.2"
          style={{ fill: "var(--background)" }}
          opacity="0.45"
        />
      </svg>

      {/* ── Text block ── */}
      <div className="flex flex-col justify-center leading-none">
        {/* TANN — serif, spaced */}
        <span
          style={{
            fontFamily: '"Georgia", "Times New Roman", serif',
            fontSize: size === "lg" ? 24 : 17,
            letterSpacing: "0.22em",
            fontWeight: 400,
            lineHeight: 1,
            color: "var(--foreground)",
          }}
        >
          TANN
        </span>

        {/* — MEDIA — */}
        <span
          style={{
            fontFamily: '"Georgia", "Times New Roman", serif',
            fontSize: size === "lg" ? 7.5 : 6,
            letterSpacing: "0.3em",
            fontWeight: 400,
            lineHeight: 1,
            marginTop: 4,
            display: "flex",
            alignItems: "center",
            gap: 4,
            color: "var(--foreground)",
            opacity: 0.6,
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: size === "lg" ? 14 : 10,
              height: 0.8,
              background: "var(--foreground)",
            }}
          />
          MEDIA
          <span
            style={{
              display: "inline-block",
              width: size === "lg" ? 14 : 10,
              height: 0.8,
              background: "var(--foreground)",
            }}
          />
        </span>
      </div>
    </div>
  );
}
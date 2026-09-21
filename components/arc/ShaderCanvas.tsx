"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Full-bleed animated WebGL background for the Claude Architects hero.
 *
 * Hand-written GLSL (no three.js / no extra deps) so the landing page stays
 * light. The fragment shader layers:
 *   1. a domain-warped fbm "aurora" in violet → cyan,
 *   2. topographic contour banding derived from the same noise field,
 *   3. a perspective blueprint grid receding to the horizon,
 *   4. a twinkling starfield,
 *   5. a glow that tracks the pointer (drifts on its own when idle),
 *   6. vignette, grain and a filmic tone curve.
 *
 * Degrades gracefully: if WebGL is unavailable the CSS gradient painted behind
 * the canvas is what you see. Honours prefers-reduced-motion (renders a single
 * static frame) and pauses when scrolled out of view or the tab is hidden.
 */

const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;

uniform vec2  u_res;
uniform float u_time;
uniform vec2  u_mouse;
uniform float u_pointer;
uniform float u_light;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = m * p;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 p  = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;
  vec2 mp = (u_mouse - 0.5 * u_res) / u_res.y;

  float t = u_time * 0.055;

  vec3 violet = vec3(0.486, 0.361, 1.000);
  vec3 cyan   = vec3(0.133, 0.827, 0.933);
  vec3 pink   = vec3(0.956, 0.247, 0.494);

  // --- shared field: domain-warped fbm ------------------------------------
  vec2 q = vec2(
    fbm(p * 1.35 + vec2(0.0, t)),
    fbm(p * 1.35 + vec2(5.2, 1.3) - t)
  );
  vec2 r = vec2(
    fbm(p * 1.75 + 3.0 * q + vec2(1.7, 9.2) + t * 1.4),
    fbm(p * 1.75 + 3.0 * q + vec2(8.3, 2.8) - t * 1.1)
  );
  float f = fbm(p * 1.55 + 2.6 * r);

  float aur = smoothstep(0.34, 1.02, f + 0.25 * r.x);
  aur *= smoothstep(-0.80, 0.55, p.y);

  // topographic contour lines
  float cont = sin((f + length(r) * 0.45) * 32.0 - u_time * 0.3);
  cont = smoothstep(0.90, 1.0, abs(cont));

  // perspective grid
  float grid = 0.0;
  float gy = -p.y - 0.07;
  if (gy > 0.0) {
    float z = 1.0 / (gy + 0.0015);
    vec2 g = vec2(p.x * z * 0.42, z * 0.42 + u_time * 0.22);
    float w = clamp(z * 0.010, 0.012, 0.85);
    float lx = 1.0 - smoothstep(0.0, w, abs(fract(g.x + 0.5) - 0.5));
    float ly = 1.0 - smoothstep(0.0, w, abs(fract(g.y + 0.5) - 0.5));
    grid = max(lx, ly * 0.85) * exp(-z * 0.075) * smoothstep(0.0, 0.10, gy);
  }

  float md   = length(p - mp);
  float glow = exp(-md * md * 6.5);
  float core = exp(-md * md * 42.0);
  float band = exp(-pow((p.y - sin(u_time * 0.2) * 0.75) * 5.5, 2.0));
  float vig  = smoothstep(1.40, 0.22, length(p * vec2(0.82, 1.0)));
  float grain = hash21(gl_FragCoord.xy + fract(u_time)) - 0.5;

  vec3 col;

  if (u_light > 0.5) {
    // --- light variant: the same motion, tinting a pale ground ------------
    // Tints read much harder on a pale ground than glows do on black, so
    // every amplitude here is a fraction of its dark-variant counterpart.
    vec3 base = vec3(0.925, 0.937, 0.976);
    col = base;
    col = mix(col, violet, aur * 0.150);
    col = mix(col, cyan, clamp(r.y * 1.3, 0.0, 1.0) * aur * 0.111);
    col = mix(col, pink, smoothstep(0.80, 1.0, f) * 0.052);
    col -= cont * 0.017 * smoothstep(-0.65, 0.5, p.y);
    col -= grid * 0.059;
    col = mix(col, mix(violet, cyan, 0.5), glow * 0.072 * u_pointer);
    col = mix(col, cyan, core * 0.059 * u_pointer);
    col = mix(col, cyan, band * 0.013);
    // lift the edges instead of darkening them
    col = mix(base * 1.005, col, 0.55 + 0.45 * vig);
    col += grain * 0.009;
  } else {
    // --- dark variant -----------------------------------------------------
    col = vec3(0.019, 0.023, 0.043);
    vec3 aurCol = mix(violet, cyan, clamp(r.y * 1.4 + 0.22, 0.0, 1.0));
    aurCol = mix(aurCol, pink, smoothstep(0.72, 1.0, f) * 0.55);
    col += aurCol * aur * 0.62;
    col += mix(cyan, violet, 0.5) * cont * 0.11 * smoothstep(-0.65, 0.5, p.y);
    col += mix(cyan, violet, 0.32) * grid * 0.45;

    vec2 sp = p * 5.5;
    float h = hash21(floor(sp));
    if (h > 0.905) {
      float d = length(fract(sp) - 0.5);
      float tw = 0.5 + 0.5 * sin(u_time * 1.5 + h * 63.0);
      col += vec3(0.72, 0.80, 1.0) * smoothstep(0.09, 0.0, d) * (0.22 + 0.55 * tw);
    }

    col += mix(cyan, violet, 0.5) * glow * 0.30 * u_pointer;
    col += mix(violet, pink, 0.4) * core * 0.22 * u_pointer;
    col += cyan * band * 0.045;
    col *= 0.32 + 0.68 * vig;
    col += grain * 0.035;
    col = col / (col + vec3(0.80));
    col = pow(max(col, 0.0), vec3(0.88));
  }

  gl_FragColor = vec4(col, 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

export default function ShaderCanvas({
  className = "",
  variant = "dark",
}: {
  className?: string;
  /** "light" tints a pale ground instead of glowing on near-black. */
  variant?: "dark" | "light";
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  // Bumped when the GPU hands the context back, to re-run setup from scratch.
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "high-performance",
    }) as WebGLRenderingContext | null;
    // A lost context paints the canvas white, so hide it and let the CSS
    // gradient underneath stand in until (and unless) it comes back.
    if (!gl || gl.isContextLost()) {
      canvas.style.opacity = "0";
      return;
    }
    canvas.style.opacity = "1";

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;

    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    // Fullscreen triangle.
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    const loc = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "u_res");
    const uTime = gl.getUniformLocation(prog, "u_time");
    const uMouse = gl.getUniformLocation(prog, "u_mouse");
    const uPointer = gl.getUniformLocation(prog, "u_pointer");
    const uLight = gl.getUniformLocation(prog, "u_light");
    const lightMode = variant === "light" ? 1 : 0;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // Render at a slightly lower internal resolution on very large displays —
    // the effect is soft, so nobody can tell, and it keeps fill-rate sane.
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const scale = window.innerWidth > 1600 ? 0.7 : 0.85;
    const px = dpr * scale;

    let w = 0;
    let h = 0;
    function resize() {
      if (!canvas) return;
      const nw = Math.max(1, Math.round(canvas.clientWidth * px));
      const nh = Math.max(1, Math.round(canvas.clientHeight * px));
      if (nw === w && nh === h) return;
      w = nw;
      h = nh;
      canvas.width = w;
      canvas.height = h;
      gl!.viewport(0, 0, w, h);
    }
    resize();

    // Pointer, smoothed. With no pointer we drift along a slow Lissajous so
    // the scene never feels frozen on touch devices.
    let targetX = w * 0.5;
    let targetY = h * 0.62;
    let curX = targetX;
    let curY = targetY;
    let influence = 0;
    let targetInfluence = 0.45;
    let hasPointer = false;

    function onPointerMove(e: PointerEvent) {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const inside =
        e.clientY >= rect.top - 120 && e.clientY <= rect.bottom + 120;
      hasPointer = true;
      targetInfluence = inside ? 1 : 0.35;
      targetX = (e.clientX - rect.left) * px;
      targetY = (rect.bottom - e.clientY) * px; // GL origin is bottom-left
    }
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    let visible = true;
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { rootMargin: "120px" },
    );
    io.observe(canvas);

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    function onVisibility() {
      visible = !document.hidden;
    }
    document.addEventListener("visibilitychange", onVisibility);

    let raf = 0;
    const start = performance.now();

    function draw(now: number) {
      raf = requestAnimationFrame(draw);
      if (!visible) return;
      resize();

      const t = (now - start) / 1000;

      if (!hasPointer) {
        targetX = w * (0.5 + 0.28 * Math.sin(t * 0.21));
        targetY = h * (0.55 + 0.2 * Math.cos(t * 0.17));
      }
      curX += (targetX - curX) * 0.05;
      curY += (targetY - curY) * 0.05;
      influence += (targetInfluence - influence) * 0.04;

      gl!.uniform2f(uRes, w, h);
      gl!.uniform1f(uTime, t);
      gl!.uniform2f(uMouse, curX, curY);
      gl!.uniform1f(uPointer, influence);
      gl!.uniform1f(uLight, lightMode);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);
    }

    if (reduced) {
      // One representative static frame.
      gl.uniform2f(uRes, w, h);
      gl.uniform1f(uTime, 8.0);
      gl.uniform2f(uMouse, w * 0.5, h * 0.6);
      gl.uniform1f(uPointer, 0.4);
      gl.uniform1f(uLight, lightMode);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    } else {
      raf = requestAnimationFrame(draw);
    }

    // preventDefault() is what makes the context eligible for restoration.
    function onLost(e: Event) {
      e.preventDefault();
      cancelAnimationFrame(raf);
      if (canvas) canvas.style.opacity = "0";
    }
    function onRestored() {
      setGeneration((g) => g + 1);
    }
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      io.disconnect();
      ro.disconnect();
      // Release GPU objects so a re-run doesn't leak them.
      if (!gl.isContextLost()) {
        gl.deleteProgram(prog);
        gl.deleteShader(vs);
        gl.deleteShader(fs);
        gl.deleteBuffer(buf);
      }
      // Deliberately NOT calling loseContext() here: getContext() returns the
      // same context object for a given canvas, so killing it on cleanup would
      // leave a permanently dead context if the effect re-runs on the same
      // element (React Strict Mode does exactly that).
    };
  }, [generation, variant]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={`block h-full w-full transition-opacity duration-500 ${className}`}
    />
  );
}

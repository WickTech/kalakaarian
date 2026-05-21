// Pure-CSS 3D wireframe globe — spins on the Y axis. Decorative only.
// Meridians = full-size rings rotated around Y; parallels = rings laid flat
// (rotateX 90°) and pushed up/down with a cos(lat) scale to taper at poles.

const MERIDIANS = Array.from({ length: 9 }, (_, i) => i * 20); // degrees
const PARALLELS = [-60, -30, 0, 30, 60]; // latitude in degrees

export function Globe() {
  return (
    <div className="globe-scene" aria-hidden="true">
      <div className="globe">
        <div className="globe-core" />
        {MERIDIANS.map((deg) => (
          <div
            key={`m${deg}`}
            className="globe-ring globe-meridian"
            style={{ transform: `rotateY(${deg}deg)` }}
          />
        ))}
        {PARALLELS.map((lat) => {
          const rad = (lat * Math.PI) / 180;
          return (
            <div
              key={`p${lat}`}
              className="globe-ring globe-parallel"
              style={{
                transform: `rotateX(90deg) translateZ(${lat * 1.75}px) scale(${Math.cos(rad)})`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

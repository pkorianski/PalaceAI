import React from "react";
import Svg, {
  Rect,
  Path,
  Circle,
  Ellipse,
  Defs,
  LinearGradient,
  Stop,
  G,
  Line,
} from "react-native-svg";
import type { Rival, Venue } from "@/lib/tour/content";

export function RivalPortrait({
  rival,
  size = 88,
}: {
  rival: Rival;
  size?: number;
}) {
  const i = rival.look;
  const skin = ["#D8A175", "#BA7E60", "#E2BCA0", "#8E5747"][i % 4];
  const hair = ["#30282A", "#272326", "#B86B40", "#D3C3A1"][
    Math.floor(i / 4) % 4
  ];
  const jacket = ["#344D44", "#63406B", "#235F71", "#675330"][
    Math.floor(i / 4) % 4
  ];
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      accessibilityLabel={`${rival.name}, ${rival.title}`}
    >
      <Defs>
        <LinearGradient id={`p-${i}`} x2="0" y2="1">
          <Stop stopColor={jacket} />
          <Stop offset="1" stopColor="#111C21" />
        </LinearGradient>
      </Defs>
      <Rect width="120" height="120" rx="28" fill={`url(#p-${i})`} />
      <Circle cx="62" cy="48" r="43" fill="#FFFFFF" opacity="0.04" />
      <Path d="M5 120 Q10 89 43 84 L77 84 Q109 88 116 120" fill={jacket} />
      <Path d="M43 83 L60 108 L78 83 L70 78 L49 78Z" fill="#F2DFC1" />
      <Path d="M53 96 L60 103 L66 96 L63 120 L57 120Z" fill="#D6A550" />
      <Rect x="48" y="66" width="24" height="24" rx="8" fill={skin} />
      <Ellipse cx="60" cy="51" rx="25" ry="31" fill={skin} />
      <Path
        d={
          i % 2
            ? "M35 53 Q23 11 60 12 Q100 9 87 66 L80 42 Q65 39 55 26 Q46 48 35 53"
            : "M35 45 Q28 11 64 13 Q90 14 87 43 L78 32 Q57 38 44 29 L39 47Z"
        }
        fill={hair}
      />
      {i % 4 === 0 && (
        <G>
          <Path d="M28 29 L90 29 L81 14 L46 11Z" fill="#172B29" />
          <Rect x="24" y="28" width="72" height="6" rx="3" fill="#E4BA73" />
        </G>
      )}
      <Path
        d="M43 48 L52 47 M68 47 L77 48"
        stroke={hair}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <Circle cx="49" cy="54" r="2" fill="#29262B" />
      <Circle cx="72" cy="54" r="2" fill="#29262B" />
      {i % 4 === 1 && (
        <G stroke="#E4C47B" fill="none" strokeWidth="2">
          <Circle cx="48" cy="53" r="10" />
          <Circle cx="73" cy="53" r="10" />
          <Path d="M58 53 L63 53" />
        </G>
      )}
      <Path
        d="M60 54 L56 65 L62 66"
        stroke="#754F46"
        strokeWidth="1.5"
        fill="none"
        opacity=".5"
      />
      <Path
        d={i % 2 ? "M51 73 Q60 78 69 72" : "M51 73 Q61 75 70 70"}
        stroke="#6B4140"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      {rival.champion && (
        <Path d="M44 12 L47 2 L60 10 L73 2 L77 13Z" fill="#F5D77C" />
      )}
      <Path
        d="M26 120 L39 88 L51 119 M94 120 L81 88 L69 119"
        fill="#081515"
        opacity=".25"
      />
    </Svg>
  );
}

export function VenueScene({
  venue,
  height = 190,
}: {
  venue: Venue;
  height?: number;
}) {
  const idx = ["quarter", "velvet", "harbor", "crown"].indexOf(venue.id);
  return (
    <Svg
      width="100%"
      height={height}
      viewBox="0 0 400 210"
      preserveAspectRatio="xMidYMid slice"
      accessibilityLabel={`Illustration of ${venue.name}`}
    >
      <Defs>
        <LinearGradient id={`sky-${idx}`} x2="0" y2="1">
          <Stop stopColor={venue.night} />
          <Stop offset="1" stopColor="#0D1E24" />
        </LinearGradient>
        <LinearGradient id={`light-${idx}`} x2="0" y2="1">
          <Stop stopColor={venue.accent} stopOpacity=".26" />
          <Stop offset="1" stopColor={venue.accent} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Rect width="400" height="210" fill={`url(#sky-${idx})`} />
      <Circle cx="300" cy="45" r="35" fill={venue.accent} opacity=".09" />
      <Circle cx="300" cy="45" r="22" fill={venue.accent} opacity=".4" />
      {[30, 80, 150, 225, 350, 380].map((x, n) => (
        <Circle
          key={x}
          cx={x}
          cy={20 + (n % 3) * 15}
          r="1.2"
          fill="#FFF0C8"
          opacity=".7"
        />
      ))}
      <Path
        d="M0 135 L0 93 L25 93 L25 67 L55 67 L55 104 L87 104 L87 53 L112 53 L112 93 L139 93 L139 115 L174 115 L174 80 L210 80 L210 115 L251 115 L251 67 L280 67 L280 100 L320 100 L320 76 L347 76 L347 110 L380 110 L380 67 L400 67 L400 210 L0 210Z"
        fill="#081C22"
        opacity=".7"
      />
      {idx === 0 ? (
        <G>
          <Path d="M30 184 L30 90 L81 58 L132 90 L132 185Z" fill="#79594A" />
          <Path d="M21 91 L81 51 L141 91Z" fill="#C0895B" />
          <Rect x="155" y="76" width="131" height="110" rx="4" fill="#476155" />
          <Path d="M146 79 L218 45 L295 79Z" fill="#71967C" />
          <Path d="M146 128 L295 128 L286 116 L155 116Z" fill="#E2B370" />
          <Rect x="194" y="126" width="49" height="60" rx="24" fill="#142E2A" />
          <Path d="M0 38 Q170 96 400 32" stroke="#A28C62" fill="none" />
          {[30, 85, 140, 195, 250, 305, 360].map((x, i) => (
            <Circle
              key={x}
              cx={x}
              cy={47 + Math.sin((i / 6) * Math.PI) * 19}
              r="3.5"
              fill="#FFE4A4"
            />
          ))}
        </G>
      ) : idx === 1 ? (
        <G>
          <Rect x="40" y="55" width="110" height="132" fill="#513651" />
          <Rect x="162" y="35" width="157" height="152" rx="7" fill="#3D344F" />
          <Rect
            x="175"
            y="57"
            width="130"
            height="37"
            rx="4"
            fill="#171F30"
            stroke={venue.accent}
            strokeWidth="2"
          />
          <Path
            d="M188 77 L204 64 L216 78 L226 64 L240 78 L252 64 L264 78 L279 64 L291 77"
            stroke={venue.accent}
            strokeWidth="3"
            fill="none"
          />
          <Path
            d="M210 187 L210 133 Q240 102 272 133 L272 187Z"
            fill="#D68AD6"
            opacity=".6"
          />
          <Path
            d="M210 187 L184 210 L302 210 L272 187Z"
            fill={`url(#light-${idx})`}
          />
          <Line
            x1="55"
            y1="60"
            x2="55"
            y2="178"
            stroke="#F1A2CB"
            strokeWidth="3"
          />
        </G>
      ) : idx === 2 ? (
        <G>
          <Rect x="60" y="79" width="213" height="94" fill="#345E6A" />
          <Path d="M47 82 L165 35 L287 82Z" fill="#52818A" />
          <Rect x="150" y="108" width="41" height="65" fill="#0C2935" />
          <Rect x="304" y="94" width="11" height="90" fill="#5E7274" />
          <Path d="M285 134 L340 134 L323 146 L300 146Z" fill="#D6C18F" />
          <Path d="M314 83 L314 130 L339 130Z" fill="#F2E7C7" />
          <Rect y="174" width="400" height="36" fill="#143746" />
          {[183, 195, 203].map((y) => (
            <Path
              key={y}
              d={`M0 ${y} Q100 ${y - 6} 200 ${y} T400 ${y}`}
              stroke={venue.accent}
              opacity=".25"
              fill="none"
            />
          ))}
        </G>
      ) : (
        <G>
          <Path
            d="M73 187 L73 91 L107 91 L107 50 L131 50 L131 91 L165 91 L165 64 L200 24 L234 64 L234 91 L270 91 L270 50 L294 50 L294 91 L329 91 L329 187Z"
            fill="#6C634B"
          />
          <Path
            d="M98 51 L119 22 L140 51 M261 51 L282 22 L304 51 M156 66 L200 17 L244 66"
            fill="#B09B62"
          />
          <Path
            d="M174 187 L174 125 Q200 92 225 125 L225 187Z"
            fill="#E9CC7A"
          />
          <Path
            d="M175 187 L149 210 L250 210 L225 187Z"
            fill={`url(#light-${idx})`}
          />
          <Path d="M200 18 L200 1 L225 6 L200 12" fill={venue.accent} />
        </G>
      )}
      {[64, 102, 170, 265].map((x, i) => (
        <G key={x}>
          <Rect
            x={x}
            y={103 + (i % 2) * 8}
            width="11"
            height="21"
            rx="4"
            fill={venue.accent}
            opacity=".65"
          />
          <Rect
            x={x + 1}
            y={104 + (i % 2) * 8}
            width="4"
            height="18"
            fill="#FFF5C9"
            opacity=".3"
          />
        </G>
      ))}
      <Path d="M0 205 Q140 168 400 202 L400 210 L0 210Z" fill="#0A1B1D" />
    </Svg>
  );
}

export function TrophyArt({
  color = "#F5D77C",
  size = 100,
  dim = false,
}: {
  color?: string;
  size?: number;
  dim?: boolean;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 100 110"
      opacity={dim ? 0.25 : 1}
      accessibilityLabel="Trophy"
    >
      <Circle cx="50" cy="45" r="42" fill={color} opacity=".07" />
      <Path
        d="M27 22 L13 22 L13 41 Q13 58 37 59 M73 22 L87 22 L87 41 Q87 58 63 59"
        stroke={color}
        strokeWidth="6"
        fill="none"
      />
      <Path d="M27 17 L73 17 L70 46 Q68 64 50 69 Q32 64 30 46Z" fill={color} />
      <Path
        d="M33 21 L42 21 L43 53 Q37 49 36 39Z"
        fill="#FFF9D9"
        opacity=".5"
      />
      <Path
        d="M46 65 L54 65 L56 83 L68 87 L68 94 L32 94 L32 87 L44 83Z"
        fill={color}
      />
      <Rect x="28" y="94" width="44" height="9" rx="3" fill="#A07D43" />
      <Path
        d="M50 29 L53 36 L61 37 L55 43 L57 51 L50 47 L43 51 L45 43 L39 37 L47 36Z"
        fill="#79552D"
        opacity=".5"
      />
    </Svg>
  );
}

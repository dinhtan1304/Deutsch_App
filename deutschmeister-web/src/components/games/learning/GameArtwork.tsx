import type { LearningGameType } from "@/lib/api/learningGames";
import { cn } from "@/lib/utils";

// Small vector scenes follow theme colors and stay sharp on mobile and dark mode.
export function GameArtwork({
  gameType,
  className = "",
}: {
  gameType: LearningGameType;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 240 156"
      aria-hidden="true"
      className={cn("mx-auto h-32 w-48", className)}
      fill="none"
    >
      <ellipse
        cx="120"
        cy="137"
        rx="86"
        ry="9"
        fill="currentColor"
        opacity=".08"
      />
      <circle cx="120" cy="74" r="64" fill="currentColor" opacity=".05" />
      <g
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {gameType === "sentence-builder" && (
          <>
            <path
              d="M47 53h44v28H47zM101 53h43v28h-43zM154 53h42v28h-42z"
              fill="var(--theme-bg-card)"
            />
            <path d="M60 67h18m34 0h22m31 0h18M66 105h108M164 97l10 8-10 8" />
            <path d="m48 34 5 6 10-13m122 12 4 6 9-13" />
          </>
        )}
        {gameType === "collocations" && (
          <>
            <rect
              x="38"
              y="46"
              width="72"
              height="55"
              rx="12"
              fill="var(--theme-bg-card)"
            />
            <rect
              x="130"
              y="66"
              width="72"
              height="55"
              rx="12"
              fill="var(--theme-bg-card)"
            />
            <path d="M52 64h38m-38 16h26m78 4h31m-43 17h42M110 75h21m-7-7 7 7-7 7" />
            <circle cx="177" cy="39" r="12" fill="currentColor" opacity=".12" />
            <path d="m172 39 4 4 7-8" />
          </>
        )}
        {gameType === "grammar-detective" && (
          <>
            <rect
              x="53"
              y="31"
              width="93"
              height="98"
              rx="10"
              fill="var(--theme-bg-card)"
            />
            <path d="M69 51h49M69 68h37M69 87h24M69 109h39" />
            <circle cx="146" cy="81" r="28" fill="var(--theme-bg-card)" />
            <path d="m166 102 27 27m-59-48 9 8 16-17" />
          </>
        )}
        {gameType === "plural" && (
          <>
            <rect
              x="40"
              y="50"
              width="38"
              height="74"
              rx="6"
              fill="var(--theme-bg-card)"
            />
            <path d="M49 61h20M49 108h20M91 87h21m-7-7 7 7-7 7" />
            {[126, 145, 164].map((x) => (
              <rect
                key={x}
                x={x}
                y={x === 145 ? 40 : 50}
                width="31"
                height="74"
                rx="6"
                fill="var(--theme-bg-card)"
              />
            ))}
            <path d="M174 23v14m-7-7h14" />
          </>
        )}
        {gameType === "word-family" && (
          <>
            <path d="M120 125V77m0 3L66 54m54 26 54-26M120 82v-41" />
            <rect
              x="91"
              y="109"
              width="58"
              height="25"
              rx="8"
              fill="var(--theme-bg-card)"
            />
            <rect
              x="35"
              y="31"
              width="59"
              height="31"
              rx="10"
              fill="var(--theme-bg-card)"
            />
            <rect
              x="92"
              y="17"
              width="57"
              height="31"
              rx="10"
              fill="var(--theme-bg-card)"
            />
            <rect
              x="145"
              y="31"
              width="59"
              height="31"
              rx="10"
              fill="var(--theme-bg-card)"
            />
            <path d="M47 46h35m20-14h36m19 14h35m-89 76h34" />
          </>
        )}
        {gameType === "dialogue" && (
          <>
            <path
              d="M48 30h81v48H86L67 93V78H48z"
              fill="var(--theme-bg-card)"
            />
            <path
              d="M145 49h50v38h-13l-2 12-14-12h-21z"
              fill="var(--theme-bg-card)"
            />
            <path d="M62 45h50M62 60h33M153 62h32M153 74h23M92 105h45v20H92zM137 108h9v12h-9M87 132h60" />
          </>
        )}
      </g>
      <g fill="currentColor" opacity=".3">
        <circle cx="29" cy="104" r="3" />
        <circle cx="213" cy="40" r="4" />
        <circle cx="202" cy="116" r="2" />
      </g>
    </svg>
  );
}

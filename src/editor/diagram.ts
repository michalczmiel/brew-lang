import {
  type Duration,
  type RecipeAST,
  calculateRatioFromAST,
} from "../core/semantics.js";

export interface DiagramOptions {
  width?: number;
  height?: number;
  padding?: number;
}

function formatDuration(duration: Duration): string {
  const minutes = duration.minutes.toString().padStart(1, "0");
  const seconds = duration.seconds.toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function addDuration(base: Duration, toAdd: Duration): Duration {
  const totalSeconds =
    base.minutes * 60 + base.seconds + toAdd.minutes * 60 + toAdd.seconds;
  return { minutes: Math.floor(totalSeconds / 60), seconds: totalSeconds % 60 };
}

const icons = {
  water: `<path d="M12 3c0 0-3.5 3.5-3.5 6.5c0 1.93 1.57 3.5 3.5 3.5s3.5-1.57 3.5-3.5c0-3-3.5-6.5-3.5-6.5z" fill="none" stroke="currentColor" stroke-width="1.2"/>`,
  coffee: `<circle cx="12" cy="12" r="2.5" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="12" cy="12" r="0.8" fill="currentColor"/>`,
  swirl: `<path d="M12 7c1.5 0 2.5 2 2.5 5s-1 5-2.5 5m0-10c-1.5 0-2.5 2-2.5 5s1 5 2.5 5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>`,
  stir: `<circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="1.5,2"/><path d="M12 8v8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>`,
  thermometer: `<rect x="10.5" y="4" width="3" height="11" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="12" cy="17.5" r="2.5" fill="currentColor"/><line x1="12" y1="7" x2="12" y2="15" stroke="white" stroke-width="1"/>`,
  brewer: `<path d="M7 4h10v2.5c0 3.5-1.5 6.5-3.5 7.5h-3c-2-1-3.5-4-3.5-7.5V4z" fill="none" stroke="currentColor" stroke-width="1.2"/><line x1="6" y1="4" x2="18" y2="4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><path d="M9 14v3.5h6V14" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>`,
  timer: `<circle cx="12" cy="12.5" r="6" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M12 8.5v4l1.5 1.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><line x1="10.5" y1="3" x2="13.5" y2="3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>`,
} as const;

export function generateSVGDiagram(
  ast: RecipeAST,
  options: DiagramOptions = {},
): string {
  const { width = 600, padding = 40 } = options;

  const contentWidth = width - padding * 2;
  const stepHeight = 90;
  const headerHeight = 80;

  const totalSteps = ast.steps.length;
  const commentsHeight = ast.comments ? ast.comments.length * 24 + 30 : 0;
  const contentHeight =
    headerHeight + totalSteps * stepHeight + 50 + commentsHeight;
  const height = contentHeight + padding * 2;

  let svg = `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: white;">`;

  svg += `<defs>
    <style>
      .title-text { font-size: 13px; fill: #999; letter-spacing: 0.5px; }
      .header-text { font-size: 15px; fill: #000; font-weight: 500; }
      .step-number { font-size: 22px; font-weight: 600; fill: #000; }
      .time-text { font-size: 14px; fill: #666; }
      .instruction-text { font-size: 13px; fill: #000; }
      .comment-text { font-size: 12px; fill: #999; font-style: italic; }
      .icon { color: #000; }
      .divider { stroke: #e5e5e5; stroke-width: 1; }
      .timeline { stroke: #e5e5e5; stroke-width: 2; }
    </style>
  </defs>`;

  let y = padding;

  if (ast.comments?.length) {
    svg += `<g transform="translate(${padding}, ${y})">`;
    ast.comments.forEach((comment, index) => {
      svg += `<text x="0" y="${18 + index * 24}" class="comment-text">${comment.text}</text>`;
    });
    svg += `</g>`;
    y += ast.comments.length * 24 + 25;
    svg += `<line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" class="divider"/>`;
    y += 30;
  }

  if (ast.brewer || ast.dose || ast.temperature) {
    svg += `<g transform="translate(${padding}, ${y})">`;

    const headerItems = [
      ast.brewer && { icon: "brewer", text: ast.brewer },
      ast.dose && { icon: "coffee", text: `${ast.dose}g` },
      ast.temperature && {
        icon: "thermometer",
        text:
          typeof ast.temperature === "number"
            ? `${ast.temperature}°C`
            : `${ast.temperature.min}-${ast.temperature.max}°C`,
      },
    ].filter(Boolean);

    let xOffset = 0;
    headerItems.forEach((item) => {
      if (item) {
        svg += `<g transform="translate(${xOffset}, 0)">
          <g class="icon" transform="translate(0, -2)">${icons[item.icon as keyof typeof icons]}</g>
          <text x="32" y="16" class="header-text">${item.text}</text>
        </g>`;
        xOffset += 120;
      }
    });

    svg += `</g>`;

    y += 35;
    svg += `<line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" class="divider"/>`;
    y += 25;
  }

  let currentTime: Duration = { minutes: 0, seconds: 0 };

  const totalDuration = ast.steps.reduce(
    (sum, step) => addDuration(sum, step.time),
    { minutes: 0, seconds: 0 },
  );

  const ratio = calculateRatioFromAST(ast);

  if (ratio || totalDuration.minutes > 0 || totalDuration.seconds > 0) {
    svg += `<g transform="translate(${padding}, ${y})">`;

    let xOffset = 0;

    if (totalDuration.minutes > 0 || totalDuration.seconds > 0) {
      svg += `<g transform="translate(${xOffset}, 0)">`;
      svg += `<g class="icon" transform="translate(0, -2)">${icons.timer}</g>`;
      svg += `<text x="32" y="16" class="header-text">${formatDuration(totalDuration)}</text>`;
      svg += `</g>`;
      xOffset += 110;
    }

    if (ratio.ratio && ratio.water) {
      svg += `<g transform="translate(${xOffset}, 0)">
          <text x="0" y="16" class="header-text">${ratio.ratio}</text>
        </g>`;
      xOffset += 80;
      svg += `<g transform="translate(${xOffset}, 0)">
          <g class="icon" transform="translate(0, -2)">${icons.water}</g>
          <text x="32" y="16" class="header-text">${ratio.water}g</text>
        </g>`;
    }

    svg += `</g>`;
    y += 35;
    svg += `<line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" class="divider"/>`;
    y += 35;
  }

  ast.steps.forEach((step, index) => {
    const stepEndTime = addDuration(currentTime, step.time);

    svg += `<g transform="translate(${padding}, ${y})">`;

    svg += `<circle cx="32" cy="24" r="6" fill="white" stroke="#e5e5e5" stroke-width="2"/>`;
    svg += `<circle cx="32" cy="24" r="3" fill="#000"/>`;

    svg += `<text x="0" y="29" class="step-number" text-anchor="end">${index + 1}</text>`;

    svg += `<text x="52" y="18" class="time-text">${formatDuration(currentTime)}</text>`;
    svg += `<text x="52" y="33" class="time-text" style="fill: #999;">+${formatDuration(step.time)}</text>`;

    const stepComment = step.comments?.[0]?.text;
    if (stepComment) {
      svg += `<text x="130" y="25" class="comment-text">${stepComment}</text>`;
    }

    let instructionX = 52;
    const instructionY = 56;

    step.instructions.forEach((instruction) => {
      svg += `<g transform="translate(${instructionX}, ${instructionY})">`;

      switch (instruction.type) {
        case "pour":
          svg += `<g class="icon" transform="translate(0, -14)">${icons.water}</g>`;
          svg += `<text x="30" y="0" class="instruction-text">${instruction.value}g</text>`;
          instructionX += 85;
          break;
        case "swirl":
          svg += `<g class="icon" transform="translate(0, -14)">${icons.swirl}</g>`;
          svg += `<text x="30" y="0" class="instruction-text">swirl</text>`;
          instructionX += 90;
          break;
        case "stir":
          svg += `<g class="icon" transform="translate(0, -14)">${icons.stir}</g>`;
          svg += `<text x="30" y="0" class="instruction-text">stir</text>`;
          instructionX += 85;
          break;
      }

      svg += `</g>`;
    });

    if (step.temperature) {
      const tempText =
        typeof step.temperature === "number"
          ? `${step.temperature}°C`
          : `${step.temperature.min}-${step.temperature.max}°C`;
      svg += `<g transform="translate(${contentWidth - 70}, 42)">
        <g class="icon" transform="translate(0, -14)">${icons.thermometer}</g>
        <text x="30" y="0" class="instruction-text">${tempText}</text>
      </g>`;
    }

    svg += `</g>`;

    if (index < totalSteps - 1) {
      svg += `<line x1="${padding + 32}" y1="${y + 30}" x2="${padding + 32}" y2="${y + stepHeight}" class="timeline"/>`;
    }

    currentTime = stepEndTime;
    y += stepHeight;
  });

  svg += `</svg>`;

  return svg;
}

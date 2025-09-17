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

function formatTimeRange(start: Duration, end: Duration): string {
  return `${formatDuration(start)} - ${formatDuration(end)}`;
}

function addDuration(base: Duration, toAdd: Duration): Duration {
  const totalSeconds =
    base.minutes * 60 + base.seconds + toAdd.minutes * 60 + toAdd.seconds;
  return { minutes: Math.floor(totalSeconds / 60), seconds: totalSeconds % 60 };
}

const icons = {
  water: `<path d="M12 2.5s-4 4.5-4 8c0 2.21 1.79 4 4 4s4-1.79 4-4c0-3.5-4-8-4-8z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
  coffee: `<circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>`,
  swirl: `<path d="M12 6c0 0 3 2 3 6s-3 6-3 6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M12 6c0 0 -3 2 -3 6s3 6 3 6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
  stir: `<circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2,2"/><path d="M12 7 L12 17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
  thermometer: `<rect x="10" y="4" width="4" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="18" r="3" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="18" r="1.5" fill="currentColor"/><line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" stroke-width="1.5"/>`,
  brewer: `<path d="M8 4h8v3c0 4-2 7-4 7s-4-3-4-7V4z" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M6 4h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M10 14v4h4v-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
  timer: `<circle cx="12" cy="13" r="7" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 9v4l2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 2h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
} as const;

export function generateSVGDiagram(
  ast: RecipeAST,
  options: DiagramOptions = {},
): string {
  const { width = 600, padding = 20 } = options;

  const contentWidth = width - padding * 2;
  const stepHeight = 80;
  const headerHeight = 120;

  const totalSteps = ast.steps.length;
  const commentsHeight = ast.comments ? ast.comments.length * 20 + 40 : 0;
  const contentHeight =
    headerHeight + totalSteps * stepHeight + 40 + commentsHeight;
  const height = contentHeight + padding * 2;

  let svg = `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="font-family: system-ui, -apple-system, sans-serif; background: white;">`;

  svg += `<defs>
    <style>
      .header-text { font-size: 14px; fill: #666; }
      .step-number { font-size: 16px; font-weight: 600; fill: #333; }
      .time-text { font-size: 13px; fill: #666; }
      .instruction-text { font-size: 12px; fill: #444; }
      .icon { color: #333; }
      .divider { stroke: #e0e0e0; stroke-width: 1; stroke-dasharray: 3,3; }
    </style>
  </defs>`;

  let y = padding;

  if (ast.comments?.length) {
    svg += `<g transform="translate(${padding}, ${y})">`;
    ast.comments.forEach((comment, index) => {
      svg += `<text x="0" y="${15 + index * 20}" class="header-text" style="fill: #666;">${comment.text}</text>`;
    });
    svg += `</g>`;
    y += ast.comments.length * 20 + 20;
    svg += `<line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" class="divider"/>`;
    y += 20;
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
          <g class="icon">${icons[item.icon as keyof typeof icons]}</g>
          <text x="30" y="15" class="header-text">${item.text}</text>
        </g>`;
        xOffset += 100;
      }
    });

    svg += `</g>`;

    y += 40;
    svg += `<line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" class="divider"/>`;
    y += 40;
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
      svg += `<g class="icon">${icons.timer}</g>`;
      svg += `<text x="30" y="15" class="header-text" style="font-weight: 600;">${formatDuration(totalDuration)}</text>`;
      svg += `</g>`;
      xOffset += 150;
    }

    if (ratio.ratio && ratio.water) {
      svg += `<g transform="translate(${xOffset}, 0)">
          <text x="0" y="15" class="header-text" style="font-weight: 600;">${ratio.ratio}</text>
        </g>`;
      xOffset += 120;
      svg += `<g transform="translate(${xOffset}, 0)">
          <g class="icon">${icons.water}</g>
          <text x="30" y="15" class="header-text" style="font-weight: 600;">${ratio.water}g</text>
        </g>`;
    }

    svg += `</g>`;
    y += 40;
    svg += `<line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" class="divider"/>`;
    y += 40;
  }

  ast.steps.forEach((step, index) => {
    const stepEndTime = addDuration(currentTime, step.time);
    const timeRange = formatTimeRange(currentTime, stepEndTime);

    svg += `<g transform="translate(${padding}, ${y})">`;

    svg += `<text x="0" y="20" class="step-number">${index + 1}.</text>`;

    svg += `<g class="icon" transform="translate(30, 4)">${icons.timer}</g>`;
    svg += `<text x="60" y="20" class="time-text">${timeRange}</text>`;

    const stepComment = step.comments?.[0]?.text;
    if (stepComment) {
      svg += `<text x="200" y="20" class="time-text" style="font-style: italic; fill: #888;">${stepComment}</text>`;
    }

    let instructionX = 30;
    const instructionY = 45;

    step.instructions.forEach((instruction) => {
      svg += `<g transform="translate(${instructionX}, ${instructionY})">`;

      switch (instruction.type) {
        case "pour":
          svg += `<g class="icon" transform="translate(0, -12)">${icons.water}</g>`;
          svg += `<text x="30" y="0" class="instruction-text">${instruction.value}g</text>`;
          instructionX += 80;
          break;
        case "swirl":
          svg += `<g class="icon" transform="translate(0, -12)">${icons.swirl}</g>`;
          svg += `<text x="30" y="0" class="instruction-text">swirl</text>`;
          instructionX += 40;
          break;
        case "stir":
          svg += `<g class="icon" transform="translate(0, -12)">${icons.stir}</g>`;
          svg += `<text x="30" y="0" class="instruction-text">stir</text>`;
          instructionX += 40;
          break;
      }

      svg += `</g>`;
    });

    if (step.temperature) {
      const tempText =
        typeof step.temperature === "number"
          ? `${step.temperature}°C`
          : `${step.temperature.min}-${step.temperature.max}°C`;
      svg += `<g transform="translate(${contentWidth - 100}, 30)">
        <g class="icon" transform="translate(0, -12)">${icons.thermometer}</g>
        <text x="30" y="0" class="instruction-text">${tempText}</text>
      </g>`;
    }

    svg += `</g>`;

    currentTime = stepEndTime;
    y += stepHeight;

    if (index < totalSteps - 1) {
      svg += `<line x1="${padding + 30}" y1="${y - 20}" x2="${width - padding}" y2="${y - 20}" class="divider"/>`;
    }
  });

  svg += `</svg>`;

  return svg;
}

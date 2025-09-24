import type { RecipeAST, StepAST } from "../core/semantics.js";

import "./timer.css";

interface TimerStep {
  startTime: number; // seconds from recipe start
  endTime?: number; // seconds from recipe start (for ranges)
  step: StepAST;
  isRange: boolean;
}

interface TimerState {
  isRunning: boolean;
  startTimestamp: number | null;
  pausedDuration: number;
  currentStepIndex: number;
}

export class BrewTimer {
  #ast: RecipeAST;
  #steps: TimerStep[];
  #state: TimerState;
  #intervalId: number | null = null;
  #onUpdateCallbacks: Array<() => void> = [];

  constructor(ast: RecipeAST) {
    this.#ast = ast;
    this.#steps = this.#processSteps(ast.steps);
    this.#state = {
      isRunning: false,
      startTimestamp: null,
      pausedDuration: 0,
      currentStepIndex: 0,
    };
  }

  #processSteps(steps: StepAST[]): TimerStep[] {
    return steps
      .map((step): TimerStep => {
        const startTime = step.time.minutes * 60 + step.time.seconds;
        const endTime = step.endTime
          ? step.endTime.minutes * 60 + step.endTime.seconds
          : undefined;

        return {
          startTime,
          ...(endTime !== undefined && { endTime }),
          step,
          isRange: !!step.endTime,
        };
      })
      .sort((a, b) => a.startTime - b.startTime);
  }

  #formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }

  start(): void {
    if (this.#state.isRunning) return;

    this.#state.isRunning = true;
    this.#state.startTimestamp = Date.now() - this.#state.pausedDuration * 1000;

    this.#intervalId = window.setInterval(() => {
      const totalDuration =
        this.#steps.length > 0
          ? Math.max(...this.#steps.map((s) => s.endTime || s.startTime))
          : 0;

      if (this.#getElapsedSeconds() >= totalDuration) {
        this.pause();
        return;
      }

      this.#updateCurrentStep();
      this.#notifyUpdate();
    }, 100);

    this.#notifyUpdate();
  }

  pause(): void {
    if (!this.#state.isRunning) return;

    this.#state.isRunning = false;
    this.#state.pausedDuration = this.#getElapsedSeconds();

    if (this.#intervalId !== null) {
      clearInterval(this.#intervalId);
      this.#intervalId = null;
    }

    this.#notifyUpdate();
  }

  reset(): void {
    this.#state.isRunning = false;
    this.#state.startTimestamp = null;
    this.#state.pausedDuration = 0;
    this.#state.currentStepIndex = 0;

    if (this.#intervalId !== null) {
      clearInterval(this.#intervalId);
      this.#intervalId = null;
    }

    this.#notifyUpdate();
  }

  #updateCurrentStep(): void {
    const elapsed = this.#getElapsedSeconds();

    // Find the current step based on elapsed time
    for (let i = this.#steps.length - 1; i >= 0; i--) {
      const step = this.#steps[i];
      if (step && elapsed >= step.startTime) {
        this.#state.currentStepIndex = i;
        break;
      }
    }
  }

  #getElapsedSeconds(): number {
    if (!this.#state.startTimestamp) return 0;
    return (Date.now() - this.#state.startTimestamp) / 1000;
  }

  onUpdate(callback: () => void): void {
    this.#onUpdateCallbacks.push(callback);
  }

  #notifyUpdate(): void {
    this.#onUpdateCallbacks.forEach((callback) => {
      callback();
    });
  }

  getSteps(): TimerStep[] {
    return this.#steps;
  }

  getState() {
    const elapsed = this.#getElapsedSeconds();
    const currentStep = this.#steps[this.#state.currentStepIndex];
    const totalDuration =
      this.#steps.length > 0
        ? Math.max(...this.#steps.map((s) => s.endTime || s.startTime))
        : 0;

    const cappedElapsed = Math.min(elapsed, totalDuration);

    return {
      isRunning: this.#state.isRunning,
      elapsedSeconds: cappedElapsed,
      elapsedFormatted: this.#formatTime(cappedElapsed),
      totalSeconds: totalDuration,
      totalFormatted: this.#formatTime(totalDuration),
      currentStepIndex: this.#state.currentStepIndex,
      totalSteps: this.#steps.length,
      currentStep,
      recipe: this.#ast,
    };
  }
}

export function createTimerInterface(
  container: HTMLElement,
  ast: RecipeAST,
): BrewTimer {
  const timer = new BrewTimer(ast);

  // Clear container
  container.innerHTML = "";

  // Create timer UI
  const timerHTML = `
    <div class="timer-interface">

      <div class="timer-display">
        <div class="time-display">
          <span class="elapsed-time">0:00</span>
          <span class="time-separator">/</span>
          <span class="total-time">0:00</span>
        </div>
      </div>

      <div class="all-steps">
        <!-- Steps will be populated dynamically with details/summary elements -->
      </div>

      <div class="timer-controls">
        <button class="control-btn play-pause-btn" title="Play/Pause">▶</button>
        <button class="control-btn reset-btn" title="Reset">⏹</button>
      </div>
    </div>
  `;

  container.innerHTML = timerHTML;

  // Get references to UI elements
  const elapsedTimeEl = container.querySelector(".elapsed-time") as HTMLElement;
  const totalTimeEl = container.querySelector(".total-time") as HTMLElement;
  const allStepsEl = container.querySelector(".all-steps") as HTMLElement;
  const playPauseBtn = container.querySelector(
    ".play-pause-btn",
  ) as HTMLButtonElement;
  const resetBtn = container.querySelector(".reset-btn") as HTMLButtonElement;

  // Track previous step for auto-opening
  let previousStepIndex = -1;

  // Update UI function
  function updateUI(): void {
    const state = timer.getState();

    elapsedTimeEl.textContent = state.elapsedFormatted;
    totalTimeEl.textContent = state.totalFormatted;

    // Update all steps with details/summary elements
    const existingSteps = allStepsEl.children.length;

    // Create step elements if not already created
    if (existingSteps === 0) {
      timer.getSteps().forEach((_timerStep, index) => {
        const stepEl = document.createElement("details");
        stepEl.className = "step-details";
        stepEl.dataset.stepIndex = index.toString();
        stepEl.open = index === 0;

        const summaryEl = document.createElement("summary");
        summaryEl.className = "step-summary";

        const instructionsEl = document.createElement("div");
        instructionsEl.className = "step-instructions";

        stepEl.appendChild(summaryEl);
        stepEl.appendChild(instructionsEl);
        allStepsEl.appendChild(stepEl);
      });
    }

    // Update each step's content and open state
    Array.from(allStepsEl.children).forEach((stepEl, index) => {
      const detailsEl = stepEl as HTMLDetailsElement;
      const summaryEl = detailsEl.querySelector(".step-summary") as HTMLElement;
      const instructionsEl = detailsEl.querySelector(
        ".step-instructions",
      ) as HTMLElement;
      const timerStep = timer.getSteps()[index];

      if (timerStep) {
        // Format step time
        const startTime =
          Math.floor(timerStep.startTime / 60) +
          ":" +
          (timerStep.startTime % 60).toString().padStart(2, "0");
        const endTime = timerStep.endTime
          ? Math.floor(timerStep.endTime / 60) +
            ":" +
            (timerStep.endTime % 60).toString().padStart(2, "0")
          : null;
        const timeRange = endTime ? `${startTime} - ${endTime}` : startTime;

        summaryEl.textContent = `${index + 1}. ${timeRange}`;

        // Build instructions
        const instructions = timerStep.step.instructions.map((inst) => {
          switch (inst.type) {
            case "pour":
              return `Pour ${inst.value}g`;
            case "swirl":
              return "Swirl";
            case "stir":
              return "Stir";
            default:
              return inst.type;
          }
        });

        if (timerStep.step.temperature) {
          const temp =
            typeof timerStep.step.temperature === "number"
              ? `${timerStep.step.temperature}°C`
              : `${timerStep.step.temperature.min}-${timerStep.step.temperature.max}°C`;
          instructions.unshift(`Temperature: ${temp}`);
        }

        timerStep.step.comments.forEach((comment) => {
          instructions.unshift(comment.text);
        });

        instructionsEl.innerHTML = instructions
          .map((inst) => `<div class="instruction">${inst}</div>`)
          .join("");

        // Add active class to highlight the current step
        if (index === state.currentStepIndex) {
          detailsEl.classList.add("active");
          // Auto-open the new step if it changed
          if (previousStepIndex !== state.currentStepIndex && state.isRunning) {
            detailsEl.open = true;
          }
        } else {
          detailsEl.classList.remove("active");
        }
      }
    });

    // Update previous step index for next comparison
    previousStepIndex = state.currentStepIndex;

    // Update play/pause button
    playPauseBtn.textContent = state.isRunning ? "⏸" : "▶";
    playPauseBtn.title = state.isRunning ? "Pause" : "Play";
  }

  // Event listeners
  playPauseBtn.addEventListener("click", () => {
    const state = timer.getState();
    if (state.isRunning) {
      timer.pause();
    } else {
      timer.start();
    }
  });

  resetBtn.addEventListener("click", () => timer.reset());

  // Register update callback
  timer.onUpdate(updateUI);

  // Initial UI update
  updateUI();

  return timer;
}

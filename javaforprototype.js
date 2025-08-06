let splits = ["BOB", "WF", "CCM", "BiDTW", "SSL", "LLL", "HMC", "DDD", "BiFS", "BitS"];

let startTime = 0;
let elapsed = 0;
let timerInterval = null;
let running = false;

let currentRun = [];
let currentSplitIndex = 0;
let allRuns = [];
let personalBests = {};

const timeDisplay = document.getElementById("time");
const startStopBtn = document.getElementById("startStopBtn");
const saveSplitBtn = document.getElementById("saveSplitBtn");
const endRunBtn = document.getElementById("endRunBtn");
const exportBtn = document.getElementById("exportBtn");
const clearDataBtn = document.getElementById("clearDataBtn");

const currentRunList = document.getElementById("currentRunList");
const pbList = document.getElementById("pbList");
const bestRunDisplay = document.getElementById("bestRunDisplay");

const modifySplitsBtn = document.getElementById("modifySplitsBtn");
const splitModal = document.getElementById("splitModal");
const splitEditList = document.getElementById("splitEditList");
const addNewSplitBtn = document.getElementById("addNewSplitBtn");
const clearAllSplitsBtn = document.getElementById("clearAllSplitsBtn");
const closeModalBtn = document.getElementById("closeModalBtn");

const savedData = localStorage.getItem("speedrunData");
if (savedData) {
  const parsed = JSON.parse(savedData);
  allRuns = parsed.allRuns || [];
  personalBests = parsed.personalBests || {};
  updatePBDisplay();
  updateBestRunDisplay();
}

function formatTime(ms) {
  const totalMilliseconds = Math.floor(ms);
  const milliseconds = totalMilliseconds % 1000;
  const totalSeconds = Math.floor(totalMilliseconds / 1000);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);
  return (
    `${String(hours).padStart(2, '0')}:` +
    `${String(minutes).padStart(2, '0')}:` +
    `${String(seconds).padStart(2, '0')}:` +
    `${String(milliseconds).padStart(3, '0')}`
  );
}

function updateTime() {
  const now = performance.now();
  const elapsed = now - startTime;
  timeDisplay.textContent = formatTime(elapsed);
}

function updatePBDisplay() {
  pbList.innerHTML = '';
  for (const [label, pb] of Object.entries(personalBests)) {
    const li = document.createElement("li");
    li.textContent = `${label}: ${formatTime(pb.duration)} (Run ${pb.runIndex + 1})`;
    pbList.appendChild(li);
  }
}

function updateCurrentRunDisplay() {
  currentRunList.innerHTML = '';
  currentRun.forEach((split, index) => {
    const li = document.createElement("li");
    li.textContent = `${split.label}: ${formatTime(split.duration)}`;

    const pb = personalBests[split.label];
    if (pb && pb.duration === split.duration && pb.runIndex === allRuns.length) {
      li.classList.add("Purple");
    } else if (pb && pb.duration < split.duration) {
      li.classList.add("Red");
    }

    currentRunList.appendChild(li);
  });
}

function updateBestRunDisplay() {
  if (allRuns.length === 0) {
    bestRunDisplay.textContent = "No runs yet.";
    return;
  }

  let bestTime = Infinity;
  let bestIndex = -1;

  allRuns.forEach((run, index) => {
    const total = run.reduce((sum, s) => sum + s.duration, 0);
    if (total < bestTime) {
      bestTime = total;
      bestIndex = index;
    }
  });

  bestRunDisplay.innerHTML = `Run ${bestIndex + 1} – <span class="best-run">${formatTime(bestTime)}</span>`;
}

function saveToLocalStorage() {
  const data = {
    allRuns,
    personalBests
  };
  localStorage.setItem("speedrunData", JSON.stringify(data));
}

startStopBtn.addEventListener("click", () => {
  if (!running) {
    startTime = performance.now();
    elapsed = 0;
    currentRun = [];
    currentSplitIndex = 0;
    timerInterval = setInterval(updateTime, 10);
    startStopBtn.textContent = "Stop/Reset";
    running = true;
    updateCurrentRunDisplay();
  } else {
    clearInterval(timerInterval);
    startStopBtn.textContent = "Start";
    running = false;
  }
});

saveSplitBtn.addEventListener("click", () => {
  if (!running || currentSplitIndex >= splits.length) return;

  const now = performance.now();
  const timeSinceStart = now - startTime;
  const label = splits[currentSplitIndex];
  const prevTime = currentSplitIndex === 0 ? 0 : currentRun[currentSplitIndex - 1].time;
  const duration = Math.round(timeSinceStart - prevTime);

  const split = {
    label,
    time: Math.round(timeSinceStart),
    duration
  };

  currentRun.push(split);

  if (!personalBests[label] || duration < personalBests[label].duration) {
    personalBests[label] = {
      duration: duration,
      runIndex: allRuns.length
    };
  }

  currentSplitIndex++;
  updateCurrentRunDisplay();
  updatePBDisplay();

  if (currentSplitIndex === splits.length) {
    clearInterval(timerInterval);
    startStopBtn.textContent = "Start";
    running = false;
  }
});

document.addEventListener("keydown", (event) => {
  if (event.code === "Space" && !event.repeat) {
    event.preventDefault();
    if (running) {
      saveSplitBtn.click();
    }
  }
});

endRunBtn.addEventListener("click", () => {
  if (currentRun.length > 0) {
    allRuns.push(currentRun);
    saveToLocalStorage();
    updateBestRunDisplay();
    currentRun = [];
    currentSplitIndex = 0;
    updateCurrentRunDisplay();
  }
});

exportBtn.addEventListener("click", () => {
  const data = {
    allRuns,
    personalBests
  };
  const dataStr = JSON.stringify(data, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "runs_and_pbs.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

clearDataBtn.addEventListener("click", () => {
  if (confirm("Are you sure you want to clear all saved runs and PBs?")) {
    localStorage.removeItem("speedrunData");
    allRuns = [];
    personalBests = {};
    currentRun = [];
    currentSplitIndex = 0;
    updatePBDisplay();
    updateBestRunDisplay();
    updateCurrentRunDisplay();
    alert("All runs cleared");
  }
});

// 🔧 MODIFIED: Modal for editing splits
function openSplitModal() {
  renderSplitEditList();
  splitModal.style.display = "block";
}

function closeSplitModal() {
  splitModal.style.display = "none";
}

function renderSplitEditList() {
  splitEditList.innerHTML = '';
  splits.forEach((splitName, index) => {
    const li = document.createElement("li");

    const input = document.createElement("input");
    input.type = "text";
    input.value = splitName;
    input.addEventListener("change", () => {
      if (input.value.trim() !== "") {
        splits[index] = input.value.trim();
        updateCurrentRunDisplay();
        updatePBDisplay();
      }
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "X";
    deleteBtn.title = "Delete split";
    deleteBtn.addEventListener("click", () => {
      if (confirm(`Delete split "${splitName}"?`)) {
        splits.splice(index, 1);
        renderSplitEditList();
        updateCurrentRunDisplay();
        updatePBDisplay();
      }
    });

    li.appendChild(input);
    li.appendChild(deleteBtn);
    splitEditList.appendChild(li);
  });
}

modifySplitsBtn.addEventListener("click", openSplitModal);
closeModalBtn.addEventListener("click", closeSplitModal);
window.addEventListener("click", (event) => {
  if (event.target === splitModal) {
    closeSplitModal();
  }
});

addNewSplitBtn.addEventListener("click", () => {
  const newSplit = prompt("Enter name for new split:");
  if (newSplit && newSplit.trim() !== "") {
    splits.push(newSplit.trim());
    renderSplitEditList();
  }
});

clearAllSplitsBtn.addEventListener("click", () => {
  if (confirm("Clear ALL splits? This cannot be undone.")) {
    splits = [];
    renderSplitEditList();
    updateCurrentRunDisplay();
    updatePBDisplay();
  }
});

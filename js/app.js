import { WORDS_DATA } from "./data/words.js";
import { StorageService } from "./services/storage.js";
import { AudioService } from "./services/audio.js";
import { QuizModule } from "./modules/quiz.js";
import { WordSearchModule } from "./modules/wordsearch.js";
import { MemoryModule } from "./modules/memory.js";
import { ScrambleModule } from "./modules/scramble.js";
import { TimeAttackModule } from "./modules/timeattack.js";
import { AchievementsModule } from "./modules/achievements.js";

document.addEventListener("DOMContentLoaded", () => {
  const audioService = new AudioService();
  const initialStats = StorageService.load();

  const scoreText = document.getElementById("scoreText");
  const streakText = document.getElementById("streakText");
  const headerStreakText = document.getElementById("headerStreakText");
  const bestStreakText = document.getElementById("bestStreakText");
  const vocabCount = document.getElementById("vocabCount");
  const btnResetStats = document.getElementById("btnResetStats");
  const currentSectionTitle = document.getElementById("currentSectionTitle");

  if (vocabCount) vocabCount.textContent = `${WORDS_DATA.length} 📚`;

  const achievements = new AchievementsModule(StorageService, audioService);

  function handleStatsUpdate(stats) {
    if (scoreText) scoreText.textContent = stats.score;
    if (streakText) streakText.textContent = `${stats.streak} 🔥`;
    if (headerStreakText) headerStreakText.textContent = `${stats.streak} 🔥`;
    if (bestStreakText) bestStreakText.textContent = `${stats.bestStreak} 🏆`;

    if (stats.score >= 1) achievements.triggerUnlock("first_step");
    if (stats.streak >= 10) achievements.triggerUnlock("streak_10");
    if (stats.score >= 100) achievements.triggerUnlock("centurion");

    const currentHour = new Date().getHours();
    if (currentHour >= 20 || currentHour < 5) {
      achievements.triggerUnlock("night_owl");
    }
  }

  handleStatsUpdate(initialStats);

  if (btnResetStats) {
    btnResetStats.addEventListener("click", () => {
      if (confirm("¿Deseas reiniciar tus estadísticas y medallas en francés?")) {
        const freshStats = StorageService.reset();
        handleStatsUpdate(freshStats);
        location.reload();
      }
    });
  }

  const quiz = new QuizModule(WORDS_DATA, StorageService, audioService, handleStatsUpdate);
  const wordSearch = new WordSearchModule(WORDS_DATA, audioService);
  const memory = new MemoryModule(WORDS_DATA, audioService);
  const scramble = new ScrambleModule(WORDS_DATA, audioService);
  const timeAttack = new TimeAttackModule(WORDS_DATA, StorageService, audioService);

  // Hooks de logros
  const originalEndGame = timeAttack._endGame.bind(timeAttack);
  timeAttack._endGame = function () {
    originalEndGame();
    if (this.score >= 10) achievements.triggerUnlock("speed_ninja");
  };

  const originalDisableCards = memory._disableCards.bind(memory);
  memory._disableCards = function () {
    originalDisableCards();
    if (this.matchedPairs === 6 && this.moves <= 8) {
      achievements.triggerUnlock("memory_master");
    }
  };

  const originalCheckWord = scramble._checkWord.bind(scramble);
  scramble._checkWord = function () {
    originalCheckWord();
    if (this.streak >= 5) achievements.triggerUnlock("scramble_master");
  };

  const originalHandleCellClick = wordSearch._handleCellClick.bind(wordSearch);
  wordSearch._handleCellClick = function (cell) {
    originalHandleCellClick(cell);
    if (this.foundWords.length === this.activeWords.length && this.activeWords.length > 0) {
      achievements.triggerUnlock("wordsearch_master");
    }
  };

  const views = {
    quiz: { title: "Cuestionario", section: document.getElementById("quizSection"), onOpen: null },
    wordsearch: { title: "Sopa de Letras", section: document.getElementById("wsSection"), onOpen: () => wordSearch.generate() },
    memory: { title: "Parejas de Memoria", section: document.getElementById("memorySection"), onOpen: () => memory.startNewGame() },
    scramble: { title: "Anagrama", section: document.getElementById("scrambleSection"), onOpen: () => scramble.nextWord() },
    timeattack: { title: "Contrarreloj (60s)", section: document.getElementById("timeAttackSection"), onOpen: () => timeAttack.resetToLobby() },
    achievements: { title: "Medallas y Logros", section: document.getElementById("achievementsSection"), onOpen: () => achievements.render() }
  };

  const sideDrawer = document.getElementById("sideDrawer");
  const drawerBackdrop = document.getElementById("drawerBackdrop");
  const btnOpenDrawer = document.getElementById("btnOpenDrawer");
  const btnCloseDrawer = document.getElementById("btnCloseDrawer");
  const drawerItems = document.querySelectorAll(".drawer-item");

  function openDrawer() {
    if (!sideDrawer || !drawerBackdrop) return;
    sideDrawer.classList.add("open");
    drawerBackdrop.classList.add("active");
    sideDrawer.setAttribute("aria-hidden", "false");
  }

  function closeDrawer() {
    if (!sideDrawer || !drawerBackdrop) return;
    sideDrawer.classList.remove("open");
    drawerBackdrop.classList.remove("active");
    sideDrawer.setAttribute("aria-hidden", "true");
  }

  if (btnOpenDrawer) btnOpenDrawer.addEventListener("click", openDrawer);
  if (btnCloseDrawer) btnCloseDrawer.addEventListener("click", closeDrawer);
  if (drawerBackdrop) drawerBackdrop.addEventListener("click", closeDrawer);

  function selectView(targetKey) {
    const view = views[targetKey];
    if (!view || !view.section) return;

    Object.values(views).forEach(v => {
      if (v.section) v.section.style.display = "none";
    });
    view.section.style.display = "block";

    if (currentSectionTitle) currentSectionTitle.textContent = view.title;

    drawerItems.forEach(item => {
      item.classList.toggle("active", item.dataset.target === targetKey);
    });

    closeDrawer();

    if (view.onOpen) view.onOpen();
  }

  drawerItems.forEach(item => {
    item.addEventListener("click", () => selectView(item.dataset.target));
  });

  quiz.nextQuestion();

  // Modal Alfabeto y Acentos Franceses
  const alphabetData = [
    { l: "A", p: "[a]" },   { l: "B", p: "[be]" },  { l: "C", p: "[se]" },  { l: "D", p: "[de]" },  { l: "E", p: "[ə]" },
    { l: "F", p: "[εf]" },  { l: "G", p: "[ʒe]" },  { l: "H", p: "[aʃ]" },  { l: "I", p: "[i]" },   { l: "J", p: "[ʒi]" },
    { l: "K", p: "[ka]" },  { l: "L", p: "[εl]" },  { l: "M", p: "[εm]" },  { l: "N", p: "[εn]" },  { l: "O", p: "[o]" },
    { l: "P", p: "[pe]" },  { l: "Q", p: "[ky]" },  { l: "R", p: "[εʁ]" },  { l: "S", p: "[εs]" },  { l: "T", p: "[te]" },
    { l: "U", p: "[y]" },   { l: "V", p: "[ve]" },  { l: "W", p: "[dubləve]" }, { l: "X", p: "[iks]" }, { l: "Y", p: "[igʁεk]" },
    { l: "Z", p: "[zεd]" }, { l: "É", p: "[e] aigu" }, { l: "È", p: "[ε] grave" }, { l: "Ê", p: "[ε] circonflexe" }, { l: "Ç", p: "[se] cédille" }
  ];

  const alphabetGrid = document.getElementById("alphabetGrid");
  const alphabetModal = document.getElementById("alphabetModal");
  const alphabetBackdrop = document.getElementById("alphabetModalBackdrop");
  const btnOpenAlphabet = document.getElementById("btnOpenAlphabetModal");
  const btnCloseAlphabet = document.getElementById("btnCloseAlphabetModal");

  if (alphabetGrid) {
    alphabetData.forEach(item => {
      const card = document.createElement("div");
      card.className = "letter-card";
      card.innerHTML = `<span class="letter-char">${item.l}</span><span class="letter-phonetic">${item.p}</span>`;
      card.addEventListener("click", () => audioService.speakFrench(item.l));
      alphabetGrid.appendChild(card);
    });
  }

  function openModal() {
    if (!alphabetModal || !alphabetBackdrop) return;
    alphabetModal.classList.add("show");
    alphabetBackdrop.classList.add("show");
  }

  function closeModal() {
    if (!alphabetModal || !alphabetBackdrop) return;
    alphabetModal.classList.remove("show");
    alphabetBackdrop.classList.remove("show");
  }

  if (btnOpenAlphabet) btnOpenAlphabet.addEventListener("click", openModal);
  if (btnCloseAlphabet) btnCloseAlphabet.addEventListener("click", closeModal);
  if (alphabetBackdrop) alphabetBackdrop.addEventListener("click", closeModal);

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(err => {
      console.warn("Service worker registration failed:", err);
    });
  }
});
                                                     

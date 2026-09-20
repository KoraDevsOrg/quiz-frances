export class ScrambleModule {
  constructor(words, audioService) {
    this.words = words;
    this.audio = audioService;

    this.currentWord = null;
    this.letters = [];
    this.slottedChips = [];
    this.streak = 0;

    this.meaningEl = document.getElementById("scrambleTargetMeaning");
    this.badgeEl = document.getElementById("scrambleCategoryBadge");
    this.slotsContainer = document.getElementById("scrambleSlots");
    this.poolContainer = document.getElementById("scramblePool");
    this.feedbackEl = document.getElementById("scrambleFeedback");
    this.btnClear = document.getElementById("btnScrambleClear");
    this.btnNext = document.getElementById("btnScrambleNext");
    this.streakEl = document.getElementById("scrambleStreakText");

    this._bindEvents();
  }

  _bindEvents() {
    this.btnClear.addEventListener("click", () => this._resetSlots());
    this.btnNext.addEventListener("click", () => this.nextWord());
  }

  nextWord() {
    this._resetUI();

    // Palabras de 3 a 6 caracteres (sin artículos para ordenarlas letra por letra)
    const candidates = this.words
      .map(w => ({ ...w, pureWord: w.word.replace(/^(l'|le |la |les )/i, "") }))
      .filter(w => w.pureWord.length >= 3 && w.pureWord.length <= 6 && !w.pureWord.includes(" "));

    this.currentWord = candidates[Math.floor(Math.random() * candidates.length)];

    this.meaningEl.textContent = this.currentWord.meaning;
    this.badgeEl.textContent = this.currentWord.cat;

    const chars = this.currentWord.pureWord.toUpperCase().split("");
    this.letters = chars.map((char, idx) => ({ id: `char-${idx}`, char }));

    let scrambled = [...this.letters].sort(() => Math.random() - 0.5);
    if (scrambled.map(l => l.char).join("") === this.currentWord.pureWord.toUpperCase()) {
      scrambled.reverse();
    }

    scrambled.forEach(item => {
      const chip = document.createElement("button");
      chip.className = "scramble-chip";
      chip.textContent = item.char;
      chip.dataset.id = item.id;
      chip.addEventListener("click", () => this._handlePoolChipClick(item, chip));
      this.poolContainer.appendChild(chip);
    });
  }

  _handlePoolChipClick(item, chipEl) {
    if (chipEl.classList.contains("disabled")) return;

    chipEl.classList.add("disabled");
    this.slottedChips.push({ item, originalChipEl: chipEl });

    const slotChip = document.createElement("button");
    slotChip.className = "scramble-chip in-slot";
    slotChip.textContent = item.char;
    slotChip.addEventListener("click", () => this._handleSlotChipClick(item, slotChip, chipEl));

    this.slotsContainer.appendChild(slotChip);

    if (this.slottedChips.length === this.letters.length) {
      this._checkWord();
    }
  }

  _handleSlotChipClick(item, slotChipEl, originalChipEl) {
    slotChipEl.remove();
    originalChipEl.classList.remove("disabled");
    this.slottedChips = this.slottedChips.filter(e => e.item.id !== item.id);
    this.slotsContainer.className = "scramble-slots";
    this.feedbackEl.style.display = "none";
  }

  _checkWord() {
    const formed = this.slottedChips.map(c => c.item.char).join("");
    const isCorrect = formed === this.currentWord.pureWord.toUpperCase();

    if (isCorrect) {
      this.slotsContainer.className = "scramble-slots correct";
      this.audio.playFeedback(true);
      this.audio.speakFrench(this.currentWord.word);

      this.streak++;
      this.streakEl.textContent = `${this.streak} 🔥`;

      this.feedbackEl.innerHTML = `✅ C'est exact ! <b>${this.currentWord.word}</b> ${this.currentWord.phonetic}`;
      this.feedbackEl.style.display = "block";

      this.btnClear.style.display = "none";
      this.btnNext.style.display = "block";
    } else {
      this.slotsContainer.className = "scramble-slots wrong";
      this.audio.playFeedback(false);
      this.streak = 0;
      this.streakEl.textContent = `0 🔥`;

      this.feedbackEl.innerHTML = `❌ Pas tout à fait. Toca una letra para moverla o usa Effacer.`;
      this.feedbackEl.style.display = "block";
    }
  }

  _resetSlots() {
    this.slotsContainer.innerHTML = "";
    this.slottedChips = [];
    this.slotsContainer.className = "scramble-slots";
    this.feedbackEl.style.display = "none";

    this.poolContainer.querySelectorAll(".scramble-chip").forEach(c => c.classList.remove("disabled"));
  }

  _resetUI() {
    this.slotsContainer.innerHTML = "";
    this.poolContainer.innerHTML = "";
    this.slottedChips = [];
    this.slotsContainer.className = "scramble-slots";
    this.feedbackEl.style.display = "none";
    this.btnClear.style.display = "block";
    this.btnNext.style.display = "none";
  }
}

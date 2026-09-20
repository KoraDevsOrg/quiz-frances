export class QuizModule {
  constructor(words, storageService, audioService, onStatsUpdate) {
    this.allWords = words;
    this.filteredWords = [...words];
    this.storage = storageService;
    this.audio = audioService;
    this.onStatsUpdate = onStatsUpdate;

    this.currentQ = null;
    this.answered = false;
    this.isReviewMode = false;

    this.showPhonetic = localStorage.getItem("kora_fr_show_phonetic") !== "false";
    this.quizMode = localStorage.getItem("kora_fr_quiz_mode") || "fr-es";

    this.questionTitleContainer = document.getElementById("questionTitleContainer");
    this.phoneticStatus = document.getElementById("phoneticStatus");
    this.btnTogglePhonetic = document.getElementById("btnTogglePhonetic");
    this.categorySelect = document.getElementById("categorySelect");
    this.modeSelect = document.getElementById("modeSelect");
    this.btnReviewMistakes = document.getElementById("btnReviewMistakes");
    this.mistakesCount = document.getElementById("mistakesCount");
    this.reviewBanner = document.getElementById("reviewBanner");

    this.optionsContainer = document.getElementById("optionsContainer");
    this.expBox = document.getElementById("explanationBox");
    this.expStatus = document.getElementById("expStatus");
    this.expBody = document.getElementById("expBody");
    this.nextBtn = document.getElementById("nextBtn");
    this.audioBtn = document.getElementById("btnPlayAudio");

    this.modeSelect.value = this.quizMode;
    this._updatePhoneticUI();
    this._updateMistakesCountUI();
    this._bindEvents();
  }

  _bindEvents() {
    this.nextBtn.addEventListener("click", () => this.nextQuestion());
    this.audioBtn.addEventListener("click", () => {
      if (this.currentQ) this.audio.speakFrench(this.currentQ.targetWord.word);
    });

    this.btnTogglePhonetic.addEventListener("click", () => {
      this.showPhonetic = !this.showPhonetic;
      localStorage.setItem("kora_fr_show_phonetic", this.showPhonetic);
      this._updatePhoneticUI();
      if (this.currentQ && this.currentQ.direction === "es-fr" && !this.answered) {
        this._renderCurrentOptions();
      }
    });

    this.categorySelect.addEventListener("change", (e) => {
      const selected = e.target.value;
      this.filteredWords = selected === "all"
        ? [...this.allWords]
        : this.allWords.filter(w => w.cat === selected);
      
      if (this.isReviewMode) this._exitReviewMode();
      this.nextQuestion();
    });

    this.modeSelect.addEventListener("change", (e) => {
      this.quizMode = e.target.value;
      localStorage.setItem("kora_fr_quiz_mode", this.quizMode);
      this.nextQuestion();
    });

    this.btnReviewMistakes.addEventListener("click", () => {
      const mistakes = this.storage.getMistakes();
      if (mistakes.length === 0 && !this.isReviewMode) {
        alert("🎉 ¡Excelente! No tienes palabras pendientes de repaso.");
        return;
      }
      this.isReviewMode = !this.isReviewMode;
      if (this.isReviewMode) {
        this._enterReviewMode();
      } else {
        this._exitReviewMode();
      }
      this.nextQuestion();
    });

    window.addEventListener("keydown", (e) => {
      if (document.getElementById("quizSection").style.display === "none") return;
      if (["1", "2", "3", "4"].includes(e.key) && !this.answered) {
        const index = parseInt(e.key, 10) - 1;
        const buttons = this.optionsContainer.querySelectorAll(".option-btn");
        if (buttons[index]) buttons[index].click();
      } else if ((e.key === "Enter" || e.key === " ") && this.answered) {
        e.preventDefault();
        this.nextQuestion();
      }
    });
  }

  _enterReviewMode() {
    this.isReviewMode = true;
    this.btnReviewMistakes.classList.add("active");
    this.reviewBanner.style.display = "block";
    this.categorySelect.disabled = true;
  }

  _exitReviewMode() {
    this.isReviewMode = false;
    this.btnReviewMistakes.classList.remove("active");
    this.reviewBanner.style.display = "none";
    this.categorySelect.disabled = false;
  }

  _updatePhoneticUI() {
    this.phoneticStatus.textContent = this.showPhonetic ? "ON" : "OFF";
    this.btnTogglePhonetic.classList.toggle("off", !this.showPhonetic);
  }

  _updateMistakesCountUI() {
    const count = this.storage.getMistakes().length;
    this.mistakesCount.textContent = count;
    this.btnReviewMistakes.disabled = count === 0 && !this.isReviewMode;
  }

  nextQuestion() {
    this.answered = false;
    this.expBox.style.display = "none";
    this.nextBtn.style.display = "none";
    this.optionsContainer.innerHTML = "";

    let pool = [];
    if (this.isReviewMode) {
      const mistakeWords = this.storage.getMistakes();
      if (mistakeWords.length === 0) {
        alert("🌟 ¡Completado! Has corregido todos tus errores.");
        this._exitReviewMode();
        pool = this.filteredWords.length > 0 ? this.filteredWords : this.allWords;
      } else {
        pool = this.allWords.filter(w => mistakeWords.includes(w.word));
      }
    } else {
      pool = this.filteredWords.length > 0 ? this.filteredWords : this.allWords;
    }

    const target = pool[Math.floor(Math.random() * pool.length)];

    let direction = this.quizMode;
    if (direction === "mixed") {
      direction = Math.random() > 0.5 ? "fr-es" : "es-fr";
    }

    const sameCat = this.allWords.filter(w => w.cat === target.cat && w.word !== target.word);
    const otherCat = this.allWords.filter(w => w.cat !== target.cat && w.word !== target.word);
    const candidatePool = [
      ...sameCat.sort(() => Math.random() - 0.5),
      ...otherCat.sort(() => Math.random() - 0.5)
    ];

    const distractors = [];
    for (const w of candidatePool) {
      if (!distractors.some(d => d.word === w.word)) {
        distractors.push(w);
      }
      if (distractors.length >= 3) break;
    }

    const rawOptions = [...distractors, target].sort(() => Math.random() - 0.5);

    this.currentQ = {
      direction,
      targetWord: target,
      rawOptions
    };

    if (direction === "fr-es") {
      const phoneticHtml = this.showPhonetic ? ` <span style="font-size:0.9rem; color:var(--text-muted); font-weight:normal;">${target.phonetic}</span>` : "";
      this.questionTitleContainer.innerHTML = `¿Qué significa <span class="fr-highlight">${target.word}</span>${phoneticHtml}?`;
      this.audioBtn.style.display = "inline-flex";
    } else {
      this.questionTitleContainer.innerHTML = `¿Cómo se dice <span class="fr-highlight">${target.meaning}</span> en francés?`;
      this.audioBtn.style.display = "none";
    }

    this._renderCurrentOptions();
    this._updateMistakesCountUI();
  }

  _renderCurrentOptions() {
    this.optionsContainer.innerHTML = "";
    const { direction, rawOptions } = this.currentQ;

    rawOptions.forEach((item, idx) => {
      let displayText = "";
      let matchValue = "";

      if (direction === "fr-es") {
        displayText = item.meaning;
        matchValue = item.meaning;
      } else {
        const phoneticPart = this.showPhonetic ? ` (${item.phonetic})` : "";
        displayText = `${item.word}${phoneticPart}`;
        matchValue = item.word;
      }

      const btn = document.createElement("button");
      btn.className = "option-btn";
      btn.textContent = `${idx + 1}. ${displayText}`;
      btn.dataset.match = matchValue;
      btn.onclick = () => this._handleSelection(matchValue, btn);
      this.optionsContainer.appendChild(btn);
    });
  }

  _handleSelection(selectedMatch, btnEl) {
    if (this.answered) return;
    this.answered = true;

    const { direction, targetWord } = this.currentQ;
    const correctMatch = direction === "fr-es" ? targetWord.meaning : targetWord.word;
    const isCorrect = selectedMatch === correctMatch;

    const allBtns = this.optionsContainer.querySelectorAll(".option-btn");
    allBtns.forEach(b => {
      b.disabled = true;
      if (b.dataset.match === correctMatch) {
        b.classList.add("correct");
      }
    });

    this.audio.playFeedback(isCorrect);
    this.audioBtn.style.display = "inline-flex";

    const stats = this.storage.load();
    stats.total++;

    if (isCorrect) {
      stats.score++;
      stats.streak++;
      if (stats.streak > stats.bestStreak) stats.bestStreak = stats.streak;
      btnEl.classList.add("correct");
      this.expStatus.innerHTML = "✅ C'est correct ! (¡Correcto!)";
      this.expStatus.style.color = "#4ade80";
      this.expBox.className = "explanation-box correct-exp";

      if (this.isReviewMode) {
        this.storage.removeMistake(targetWord.word);
      }
    } else {
      stats.streak = 0;
      btnEl.classList.add("wrong");
      this.expStatus.innerHTML = "❌ Incorrect (Incorrecto)";
      this.expStatus.style.color = "#f87171";
      this.expBox.className = "explanation-box wrong-exp";

      this.storage.addMistake(targetWord.word);
    }

    this.storage.save(stats);
    this.onStatsUpdate(stats);
    this._updateMistakesCountUI();

    const notePart = targetWord.note ? `<br>💡 Note: <i>${targetWord.note}</i>` : "";
    this.expBody.innerHTML = `<b>${targetWord.word}</b> ${targetWord.phonetic} = <i>${targetWord.meaning}</i>.${notePart}`;

    this.expBox.style.display = "block";
    this.nextBtn.style.display = "block";
  }
  }

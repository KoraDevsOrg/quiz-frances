export class MemoryModule {
  constructor(words, audioService) {
    this.words = words;
    this.audio = audioService;

    this.gridEl = document.getElementById("memoryGrid");
    this.movesEl = document.getElementById("memoryMovesCount");
    this.btnReset = document.getElementById("btnResetMemory");

    this.firstCard = null;
    this.secondCard = null;
    this.lockBoard = false;
    this.moves = 0;
    this.matchedPairs = 0;

    this.btnReset.addEventListener("click", () => this.startNewGame());
  }

  startNewGame() {
    this.gridEl.innerHTML = "";
    this.firstCard = null;
    this.secondCard = null;
    this.lockBoard = false;
    this.moves = 0;
    this.matchedPairs = 0;
    this.movesEl.textContent = "0";

    const selected = [...this.words].sort(() => Math.random() - 0.5).slice(0, 6);
    const deck = [];

    selected.forEach((word, index) => {
      deck.push({
        id: `pair-${index}`,
        type: "fr",
        word: word,
        displayHtml: `<div class="mem-fr">${word.word}</div><div class="mem-phonetic">${word.phonetic}</div>`
      });

      deck.push({
        id: `pair-${index}`,
        type: "meaning",
        word: word,
        displayHtml: `<div>${word.meaning}</div>`
      });
    });

    deck.sort(() => Math.random() - 0.5);

    deck.forEach(cardData => {
      const cardEl = document.createElement("div");
      cardEl.className = "mem-card";
      cardEl.dataset.pairId = cardData.id;

      cardEl.innerHTML = `
        <div class="mem-card-inner">
          <div class="mem-card-front">🥐</div>
          <div class="mem-card-back">${cardData.displayHtml}</div>
        </div>
      `;

      cardEl.addEventListener("click", () => this._handleCardFlip(cardEl, cardData));
      this.gridEl.appendChild(cardEl);
    });
  }

  _handleCardFlip(cardEl, cardData) {
    if (this.lockBoard || cardEl === this.firstCard) return;
    if (cardEl.classList.contains("matched") || cardEl.classList.contains("flipped")) return;

    cardEl.classList.add("flipped");

    if (cardData.type === "fr") {
      this.audio.speakFrench(cardData.word.word);
    }

    if (!this.firstCard) {
      this.firstCard = cardEl;
      return;
    }

    this.secondCard = cardEl;
    this.moves++;
    this.movesEl.textContent = this.moves;
    this._checkForMatch();
  }

  _checkForMatch() {
    const isMatch = this.firstCard.dataset.pairId === this.secondCard.dataset.pairId;
    if (isMatch) {
      this._disableCards();
    } else {
      this._unflipCards();
    }
  }

  _disableCards() {
    this.lockBoard = true;
    this.audio.playFeedback(true);

    setTimeout(() => {
      this.firstCard.classList.add("matched");
      this.secondCard.classList.add("matched");
      this.matchedPairs++;
      this._resetTurn();

      if (this.matchedPairs === 6) {
        setTimeout(() => {
          alert(`🎉 Très bien ! Has completado el tablero en ${this.moves} intentos.`);
        }, 300);
      }
    }, 400);
  }

  _unflipCards() {
    this.lockBoard = true;
    setTimeout(() => {
      this.audio.playFeedback(false);
      this.firstCard.classList.remove("flipped");
      this.secondCard.classList.remove("flipped");
      this._resetTurn();
    }, 900);
  }

  _resetTurn() {
    this.firstCard = null;
    this.secondCard = null;
    this.lockBoard = false;
  }
}

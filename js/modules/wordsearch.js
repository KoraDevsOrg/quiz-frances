export class WordSearchModule {
  constructor(words, audioService) {
    this.words = words;
    this.audio = audioService;
    this.size = 6;
    this.fillers = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "L", "M", "N", "O", "P", "R", "S", "T", "U", "V"];

    this.currentSelection = [];
    this.foundWords = [];
    this.activeWords = [];

    this.gridEl = document.getElementById("wsGrid");
    this.targetsEl = document.getElementById("wsTargets");
    this.btnReset = document.getElementById("btnResetWS");

    this.btnReset.addEventListener("click", () => this.generate());
  }

  // Limpia artículos ("le ", "la ", "l'") para la cuadrícula
  _cleanWord(str) {
    return str.replace(/^(l'|le |la |les )/i, "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // sin acentos en la sopa para legibilidad
      .toUpperCase();
  }

  generate() {
    this.gridEl.innerHTML = "";
    this.targetsEl.innerHTML = "";
    this.currentSelection = [];
    this.foundWords = [];

    const pool = this.words
      .map(w => ({ ...w, gridWord: this._cleanWord(w.word) }))
      .filter(w => w.gridWord.length >= 3 && w.gridWord.length <= 5);

    this.activeWords = [...pool].sort(() => Math.random() - 0.5).slice(0, 4);

    this.activeWords.forEach(w => {
      const tag = document.createElement("div");
      tag.className = "target-tag";
      tag.id = `ws-${w.gridWord}`;
      tag.innerHTML = `<b>${w.word}</b> (${w.meaning.split('/')[1] || w.meaning})`;
      this.targetsEl.appendChild(tag);
    });

    const board = Array(this.size).fill(null).map(() => Array(this.size).fill(""));

    this.activeWords.forEach(item => {
      const word = item.gridWord;
      let placed = false;
      let attempts = 0;

      while (!placed && attempts < 50) {
        attempts++;
        const isVertical = Math.random() > 0.5;
        const maxRow = isVertical ? this.size - word.length : this.size - 1;
        const maxCol = isVertical ? this.size - 1 : this.size - word.length;

        const row = Math.floor(Math.random() * (maxRow + 1));
        const col = Math.floor(Math.random() * (maxCol + 1));

        let canPlace = true;
        for (let i = 0; i < word.length; i++) {
          const r = isVertical ? row + i : row;
          const c = isVertical ? col : col + i;
          if (board[r][c] !== "" && board[r][c] !== word[i]) {
            canPlace = false;
            break;
          }
        }

        if (canPlace) {
          for (let i = 0; i < word.length; i++) {
            const r = isVertical ? row + i : row;
            const c = isVertical ? col : col + i;
            board[r][c] = word[i];
          }
          placed = true;
        }
      }
    });

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (!board[r][c]) {
          board[r][c] = this.fillers[Math.floor(Math.random() * this.fillers.length)];
        }
      }
    }

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.textContent = board[r][c];
        cell.onclick = () => this._handleCellClick(cell);
        this.gridEl.appendChild(cell);
      }
    }
  }

  _handleCellClick(cell) {
    if (cell.classList.contains("found")) return;

    if (cell.classList.contains("selected")) {
      cell.classList.remove("selected");
      this.currentSelection = this.currentSelection.filter(c => c !== cell);
    } else {
      cell.classList.add("selected");
      this.currentSelection.push(cell);
    }

    const formed = this.currentSelection.map(c => c.textContent).join("");
    const matched = this.activeWords.find(w => w.gridWord === formed);

    if (matched && !this.foundWords.includes(matched.gridWord)) {
      this.foundWords.push(matched.gridWord);
      this.audio.playFeedback(true);
      this.audio.speakFrench(matched.word);

      this.currentSelection.forEach(c => {
        c.classList.remove("selected");
        c.classList.add("found");
      });

      const tag = document.getElementById(`ws-${matched.gridWord}`);
      if (tag) tag.classList.add("done");

      this.currentSelection = [];

      if (this.foundWords.length === this.activeWords.length) {
        setTimeout(() => alert("🎉 Félicitations ! Has completado la sopa de letras."), 200);
      }
    }
  }
}

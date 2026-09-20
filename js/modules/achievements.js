export class AchievementsModule {
  constructor(storageService, audioService) {
    this.storage = storageService;
    this.audio = audioService;

    this.badges = [
      { id: "first_step", title: "Premiers Pas", desc: "Acierta tu primera palabra en francés.", icon: "🥉" },
      { id: "streak_10", title: "En Flammes", desc: "Consigue una racha de 10 aciertos seguidos.", icon: "🔥" },
      { id: "centurion", title: "Centurion", desc: "Acumula 100 respuestas correctas en total.", icon: "🏆" },
      { id: "speed_ninja", title: "Vitesse Éclair", desc: "Consigue 10 o más puntos en el Contrarreloj.", icon: "⚡" },
      { id: "memory_master", title: "Mémoire Vive", desc: "Resuelve el juego de memoria en 8 intentos o menos.", icon: "🧠" },
      { id: "scramble_master", title: "Maître des Mots", desc: "Racha de 5 palabras seguidas en Anagrama.", icon: "🧩" },
      { id: "wordsearch_master", title: "Explorateur", desc: "Completa una sopa de letras en francés.", icon: "🔍" },
      { id: "night_owl", title: "Oiseau de Nuit", desc: "Practica francés de noche (después de las 8:00 PM).", icon: "🦉" }
    ];

    this.gridContainer = document.getElementById("achievementsGrid");
    this.toastEl = document.getElementById("achievementToast");
    this.toastIcon = document.getElementById("toastIcon");
    this.toastTitle = document.getElementById("toastTitle");
  }

  triggerUnlock(id) {
    const isNew = this.storage.unlockAchievement(id);
    if (isNew) {
      const badge = this.badges.find(b => b.id === id);
      if (badge) {
        this._showToast(badge);
        this.audio.playFeedback(true);
      }
    }
  }

  _showToast(badge) {
    if (!this.toastEl) return;
    this.toastIcon.textContent = badge.icon;
    this.toastTitle.textContent = badge.title;

    this.toastEl.classList.add("show");
    setTimeout(() => {
      this.toastEl.classList.remove("show");
    }, 3800);
  }

  render() {
    if (!this.gridContainer) return;
    this.gridContainer.innerHTML = "";

    const unlockedIds = this.storage.getUnlockedAchievements();
    const unlockedCountEl = document.getElementById("unlockedBadgesCount");
    if (unlockedCountEl) {
      unlockedCountEl.textContent = `${unlockedIds.length} / ${this.badges.length}`;
    }

    this.badges.forEach(badge => {
      const isUnlocked = unlockedIds.includes(badge.id);
      const card = document.createElement("div");
      card.className = `badge-card ${isUnlocked ? "unlocked" : "locked"}`;

      card.innerHTML = `
        <div class="badge-icon">${badge.icon}</div>
        <div class="badge-info">
          <h4>${badge.title}</h4>
          <p>${badge.desc}</p>
          <span class="badge-status-tag">${isUnlocked ? "✅ Débloqué" : "🔒 Bloqué"}</span>
        </div>
      `;

      this.gridContainer.appendChild(card);
    });
  }
}

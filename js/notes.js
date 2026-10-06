// Job notes, saved on-device only (localStorage). No network calls.
const NOTES_KEY = "ysf_notes_v1";
const THEME_KEY = "ysf_theme_v1";

const Store = {
  _read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  },
  _write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) { /* storage full or unavailable — fail silently */ }
  },

  getNotes() { return this._read(NOTES_KEY, []); },
  saveNote(note) {
    const notes = this.getNotes();
    notes.unshift(note);
    this._write(NOTES_KEY, notes);
  },
  deleteNote(id) {
    const notes = this.getNotes().filter((n) => n.id !== id);
    this._write(NOTES_KEY, notes);
  },

  getTheme() { return this._read(THEME_KEY, "auto"); },
  setTheme(t) { this._write(THEME_KEY, t); },
};

function makeNoteId() {
  return "n_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
}

function formatNoteForExport(note) {
  const d = new Date(note.ts);
  const job = note.job ? `[${note.job}] ` : "";
  return `${d.toLocaleString()} — ${job}${note.text}`;
}

// Preload for the Mining Assistant window — a tiny API so the page can hide itself,
// pick/clear a custom alert-tone WAV (native file dialog), and let the main process show
// the window for the auto-pop-up behaviour.
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("miningApi", {
  hide: () => ipcRenderer.send("mining:hide"),
  show: () => ipcRenderer.send("mining:show"),
  pickTone: () => ipcRenderer.invoke("mining:pick-tone"), // -> true if a WAV was chosen
  clearTone: () => ipcRenderer.invoke("mining:clear-tone"),
});

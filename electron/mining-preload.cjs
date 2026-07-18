// Preload for the Mining Assistant window — exposes a tiny API so the page can hide
// itself (the ✕ button) without destroying the window (state + timers stay alive).
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("miningApi", {
  hide: () => ipcRenderer.send("mining:hide"),
});

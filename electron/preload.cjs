// Bridges the overlay page to the shell so it can become click-through ONLY while
// you're hovering it. The page reports hover enter/leave; main flips mouse capture.
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("overlayApi", {
  hover: (on) => ipcRenderer.send("overlay:hover", !!on),
});

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // This allows React to show the Windows-style alert box
  showMessageBox: (options) => ipcRenderer.invoke("show-message-box", options),
  
  // You can add a 'getOfflineStatus' here later if you want
});
const { contextBridge, ipcRenderer } = require("electron")
 
console.log('preload.js :>> ');

// Expose API to React app
contextBridge.exposeInMainWorld('electronAPI', {
    test: 'MSL desktop app',
    ping: ()=> ipcRenderer.invoke('ping'),
    sendData: (channel, data) => ipcRenderer.send(channel, data),
    receiveData: (channel, callback) => ipcRenderer.on(channel, (event, ...args) => callback(...args)),
  });
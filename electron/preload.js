const { contextBridge, ipcRenderer } = require("electron")
 
console.log('preload.js :>> ');

// Expose API to React app
contextBridge.exposeInMainWorld('electronAPI', {
    test: 'MSL desktop app',
    ping: ()=> ipcRenderer.invoke('ping'),
    sendData: (channel, data) => ipcRenderer.send(channel, data),
    receiveData: (channel, callback) => ipcRenderer.on(channel, (event, ...args) => callback(...args)),
  });


  window.addEventListener('error',(event)=>{
    alert('Something went wrong, Check Internet or restart app'+ error)
    event.preventDefault()
  })

  window.addEventListener('unhandledrejection',(event)=>{
    alert('Unexpected error, Check Internet or restart app')
    event.preventDefault()
  })
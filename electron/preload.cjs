const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('loopyDesktop', {
  platform: process.platform,
  notifications: {
    list: () => ipcRenderer.invoke('loopy:notifications:list'),
    schedule: (input) => ipcRenderer.invoke('loopy:notifications:schedule', input),
    cancel: (id) => ipcRenderer.invoke('loopy:notifications:cancel', id),
    cancelAll: () => ipcRenderer.invoke('loopy:notifications:cancel-all'),
    onClick: (listener) => {
      const handler = (_event, reminderId) => listener(reminderId);
      ipcRenderer.on('loopy:notification-clicked', handler);
      return () => ipcRenderer.removeListener('loopy:notification-clicked', handler);
    },
  },
});

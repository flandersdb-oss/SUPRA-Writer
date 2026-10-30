/* Minimal, typed, isolated bridge to the local Windows file system (MIT). */
'use strict';
const {contextBridge,ipcRenderer} = require('electron');
contextBridge.exposeInMainWorld('SUPRADesktop',Object.freeze({
 openDocument:()=>ipcRenderer.invoke('document:open'),
 saveDocument:({fileName,bytes,saveAs=false})=>ipcRenderer.invoke('document:save',{fileName,bytes,saveAs}),
 exportPdf:()=>ipcRenderer.invoke('document:pdf'),
 resetDocument:()=>ipcRenderer.invoke('document:reset'),
 catalogStatus:()=>ipcRenderer.invoke('catalog:status'),
 catalogChoose:()=>ipcRenderer.invoke('catalog:choose'),
 catalogScan:()=>ipcRenderer.invoke('catalog:scan'),
 catalogForget:()=>ipcRenderer.invoke('catalog:forget'),
 catalogOpen:(id)=>ipcRenderer.invoke('catalog:open',id),
 catalogAdapterSource:(provider)=>ipcRenderer.invoke('catalog:adapter-source',provider),
 onCommand:(callback)=>{if(typeof callback==='function')ipcRenderer.on('desktop:command',(_event,name)=>callback(name));},
 onFileOpen:(callback)=>{if(typeof callback==='function')ipcRenderer.on('desktop:open-file',(_event,item)=>callback(item));}
}));

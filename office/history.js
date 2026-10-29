/* SUPRA Office — local-only bounded Undo and Redo history (MIT). */
(()=>{'use strict';
const clone=value=>JSON.parse(JSON.stringify(value));
window.SUPRAHistory=Object.freeze({create:(limit=40)=>{
 const undo=[],redo=[];
 return Object.freeze({
  record(state){undo.push(clone(state));if(undo.length>limit)undo.shift();redo.length=0;},
  undo(state){if(!undo.length)return null;redo.push(clone(state));return undo.pop();},
  redo(state){if(!redo.length)return null;undo.push(clone(state));if(undo.length>limit)undo.shift();return redo.pop();},
  canUndo(){return undo.length>0;},canRedo(){return redo.length>0;},
  counts(){return {undo:undo.length,redo:redo.length};}
 });
}});
})();

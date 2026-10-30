/* SUPRA Writer read-only document catalog — local directories only (MIT). */
'use strict';
const fs=require('node:fs/promises');
const path=require('node:path');
const READABLE=new Set(['.docx','.html','.htm','.txt','.md','.markdown']);
const OPTIONAL=new Set(['.odt','.fodt','.rtf','.doc','.docm','.pages','.wpd','.abw','.wps','.tex','.epub','.pdf','.sxw','.ott','.xml','.rst','.org','.asciidoc']);
const MAX_ITEMS=5000,MAX_DEPTH=8,MAX_ROOTS=10,MAX_OPEN_BYTES=25*1024*1024;
const MAX_VISITED_DIRS=2500,MAX_SEEN_ENTRIES=40000,MAX_SCAN_MS=12000;
const SKIP_DIRS=new Set(['node_modules','appdata','program files','program files (x86)','programdata','system volume information','$recycle.bin','windows']);
const PANDOC_FORMATS=new Set(['.tex','.epub','.rst','.org','.asciidoc']);
const LIBREOFFICE_FORMATS=new Set(['.odt','.fodt','.rtf','.doc','.wpd','.abw','.wps','.sxw','.ott']);
function adapterFor(extension){
 if(PANDOC_FORMATS.has(extension))return 'pandoc';
 if(LIBREOFFICE_FORMATS.has(extension))return 'libreoffice';
 return null;
}
function classify(name){
 const ext=path.extname(name).toLowerCase();
 return {extension:ext,kind:READABLE.has(ext)?'readable':OPTIONAL.has(ext)?'converter-needed':null};
}
function inside(root,candidate){const rel=path.relative(root,candidate);return rel===''||(!rel.startsWith('..'+path.sep)&&rel!=='..'&&!path.isAbsolute(rel));}
async function scanRoots(paths,options={}){
 if(!Array.isArray(paths)||paths.length>MAX_ROOTS)throw Error('Choose at most ten folders');
 const maxItems=Math.min(MAX_ITEMS,Math.max(1,Number(options.maxItems)||MAX_ITEMS));
 const maxDepth=Math.min(MAX_DEPTH,Math.max(0,Number.isInteger(options.maxDepth)?options.maxDepth:MAX_DEPTH));
 const results=[],seen=new Set();let examined=0,skipped=0,truncated=false,visitedDirs=0,seenEntries=0;
 const deadline=Date.now()+MAX_SCAN_MS;
 for(const input of paths){
  if(typeof input!=='string'||!path.isAbsolute(input))continue;
  let root;try{root=await fs.realpath(input);if(!(await fs.stat(root)).isDirectory())continue;}catch{skipped++;continue;}
  // Each configured root is explicitly selected by the user; do not traverse outside it.
  const stack=[{dir:root,depth:0}];
  while(stack.length){
   if(Date.now()>deadline||visitedDirs>=MAX_VISITED_DIRS){truncated=true;break;}
   visitedDirs++;
   const {dir,depth}=stack.pop();let entries;
   try{entries=await fs.readdir(dir,{withFileTypes:true});}catch{skipped++;continue;}
   for(const e of entries){
    if(++seenEntries>MAX_SEEN_ENTRIES||Date.now()>deadline){truncated=true;break;}
    if(e.name.startsWith('.')||e.isSymbolicLink()||(e.isDirectory()&&SKIP_DIRS.has(e.name.toLowerCase())))continue;
    const full=path.join(dir,e.name);
    if(!inside(root,full))continue;
    if(e.isDirectory()){
     if(depth<maxDepth)stack.push({dir:full,depth:depth+1});
     continue;
    }
    if(!e.isFile())continue;
    examined++;
    const type=classify(e.name);
    if(!type.kind||seen.has(full))continue;
    let stat;try{stat=await fs.lstat(full);}catch{skipped++;continue;}
    if(!stat.isFile()||stat.isSymbolicLink())continue;
    const item={
     id:String(results.length+1),name:e.name,
     folder:path.basename(root),relative:path.relative(root,full),
     extension:type.extension,kind:type.kind,adapter:adapterFor(type.extension),
     canOpen:type.kind==='readable'&&stat.size<=MAX_OPEN_BYTES,
     bytes:stat.size,modified:stat.mtimeMs
    };
    results.push({item,path:full,root});
    seen.add(full);
    if(results.length>=maxItems){truncated=true;break;}
   }
   if(truncated)break;
  }
  if(truncated)break;
 }
 return {items:results,examined,skipped,truncated,visitedDirs,seenEntries,maxItems,maxDepth};
}
async function verifyIndexedFile(entry){
 if(!entry?.path||!entry.root)throw Error('Unknown indexed file');
 const realRoot=await fs.realpath(entry.root),real=await fs.realpath(entry.path);
 if(!inside(realRoot,real))throw Error('Indexed document moved outside the approved folder');
 const stat=await fs.lstat(entry.path);
 if(!stat.isFile()||stat.isSymbolicLink()||stat.size>MAX_OPEN_BYTES)throw Error('Document unavailable or exceeds 25 MB');
 if(!READABLE.has(path.extname(real).toLowerCase()))throw Error('A converter is required for this file type');
 return real;
}
module.exports={READABLE,OPTIONAL,MAX_ITEMS,MAX_DEPTH,MAX_ROOTS,MAX_OPEN_BYTES,classify,adapterFor,scanRoots,verifyIndexedFile,inside};

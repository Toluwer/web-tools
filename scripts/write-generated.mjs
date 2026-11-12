import fs from 'node:fs';
import {fileURLToPath} from 'node:url';

// Publish complete files even when a Windows reader briefly holds the old output.
export function writeGenerated(target,content){
  const path=target instanceof URL?fileURLToPath(target):target;
  const temporary=path+'.'+process.pid+'.tmp';
  try{
    fs.writeFileSync(temporary,content);
    for(let attempt=0;;attempt++){
      try{fs.renameSync(temporary,path);break;}
      catch(error){if(attempt>=8||!['EPERM','EACCES','EBUSY','UNKNOWN'].includes(error.code))throw error;Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,100);}
    }
  }finally{if(fs.existsSync(temporary))fs.unlinkSync(temporary);}
}

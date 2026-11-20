import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {createHash} from 'node:crypto';
import {existsSync,mkdirSync,readFileSync,readdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {configureToolEnvironment} from './tool-environment.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
process.chdir(root);configureToolEnvironment(root);
const args=process.argv.slice(2),lan=args.includes('--lan');
if(args.includes('--help')){
  console.log('Local game: node scripts/local-start.mjs [--port 5176] [--lan] [--build-only]');process.exit(0);
}
const value=args.includes('--port')?args[args.indexOf('--port')+1]:'5176';
const port=Number(value);
if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Choose a port from 1024 to 65535.');
const [major,minor]=process.versions.node.split('.').map(Number);
if(major<22||(major===22&&minor<13))throw Error('Node.js 22.13 or newer is required.');
if(!existsSync('node_modules/vinext/dist/cli.js'))throw Error('Dependencies are missing. Install Node.js, then run npm ci in this folder.');
mkdirSync('.local-runtime',{recursive:true});mkdirSync('data',{recursive:true});

function inputHash(){
  const hash=createHash('sha256').update(root).update(process.version);
  function visit(relative){
    if(!existsSync(relative))return;
    const entries=readdirSync(relative,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name));
    for(const entry of entries){
      const name=path.join(relative,entry.name);
      if(entry.isDirectory())visit(name);
      else if(entry.isFile()){hash.update(name);hash.update(readFileSync(name));}
    }
  }
  for(const dir of ['app','components','hooks','lib','public','worker','scripts','drizzle'])visit(dir);
  for(const file of ['package.json','package-lock.json','vite.config.ts','next.config.ts','tsconfig.json','postcss.config.mjs']){
    if(existsSync(file)){hash.update(file);hash.update(readFileSync(file));}
  }
  return hash.digest('hex');
}
function run(argv){
  return new Promise((resolve,reject)=>{
    const child=spawn(process.execPath,argv,{cwd:root,stdio:'inherit',env:{...process.env,CI:'true'}});
    child.once('error',reject);
    child.once('exit',(code,signal)=>code===0?resolve():reject(Error(`Local command stopped (${signal||code}).`)));
  });
}
async function ensurePort(){
  await new Promise((resolve,reject)=>{
    const server=createServer();server.once('error',()=>reject(Error(`Port ${port} is already in use. Try: node scripts/local-start.mjs --port ${port+1}`)));
    server.listen(port,lan?'0.0.0.0':'127.0.0.1',()=>server.close(resolve));
  });
}
try{
  if(!args.includes('--build-only'))await ensurePort();
  const hash=inputHash();
  let built={};try{built=JSON.parse(readFileSync('.local-runtime/build.json','utf8'));}catch{}
  if(!existsSync('dist/server/wrangler.json')||built.hash!==hash){
    console.log('\nPreparing the local game (first launch or changed files)...\n');
    await run(['scripts/run-framework.mjs','build']);
    writeFileSync('.local-runtime/build.json',JSON.stringify({hash}));
  }
  console.log('\nPreparing the database on this computer...\n');
  await run(['--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','d1','migrations','apply','DB','--local','--config','dist/server/wrangler.json','--persist-to','data']);
  if(args.includes('--build-only')){console.log('\nLocal build and database are ready.');process.exit(0);}
  console.log(`\nOpen http://127.0.0.1:${port}\nKeep this window open. Press Ctrl+C to stop.\n`);
  if(lan)console.log('LAN mode: friends on the same network can use this computer\'s LAN IP. Microphones on other devices require trusted HTTPS.');
  await run(['--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','dev','--config','dist/server/wrangler.json','--local','--persist-to','data','--ip',lan?'0.0.0.0':'127.0.0.1','--inspector-port','0','--port',String(port)]);
}catch(error){console.error('\n'+error.message);process.exitCode=1;}

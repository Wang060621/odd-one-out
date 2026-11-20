import vinext from 'vinext';
import { defineConfig } from 'vite';
import path from 'node:path';
import { configureToolEnvironment } from './scripts/tool-environment.mjs';

export default defineConfig(async()=>{
  configureToolEnvironment(process.cwd());
  const {cloudflare}=await import('@cloudflare/vite-plugin');
  return {
    server:{host:'127.0.0.1',port:5176,strictPort:true},
    plugins:[vinext(),cloudflare({
      viteEnvironment:{name:'rsc',childEnvironments:['ssr']},
      inspectorPort:false,
      config:{name:'odd-one-out-six-local',main:'./worker/index.ts',compatibility_date:'2026-05-15',compatibility_flags:['nodejs_compat'],
        d1_databases:[{binding:'DB',database_name:'odd-one-out-six-local-db',database_id:'00000000-0000-4000-8000-000000000000',migrations_dir:path.resolve('drizzle')}],
      },
    })],
  };
});

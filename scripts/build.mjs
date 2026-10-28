import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { compile, preprocess } from 'svelte/compiler';
import { mdsvex } from 'mdsvex';
const root = path.resolve(new URL('..', import.meta.url).pathname);
const src = path.join(root,'src');
const route = 'decisions/0002-split-4471-by-cause';
const walk = dir => fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
const sources = walk(src);
const plugin = generate => ({name:'kb-svelte',setup(b){
 b.onResolve({filter:/^#lib\//},args=>{
  const p=path.join(src,'lib',args.path.slice(5));
  return {path:fs.existsSync(p)?p: p+'.ts'};
 });
 b.onLoad({filter:/\.(svelte|svx|ts)$/},async args=>{
  let code=fs.readFileSync(args.path,'utf8');
  code=code.replace(/import\.meta\.glob(?:<[^;]+?>)?\(('[^']*'|"[^"]*")[^;]*?\)/g,(match,quoted)=>{
   const glob=quoted.slice(1,-1);
   const files=sources.filter(f=>glob.includes('tenants')?f.includes('/data/tenants/')&&f.endsWith('.json'):f.includes('/routes/kb/')&&!f.endsWith('/kb/+page.svx')&&f.endsWith('+page.svx'));
   return '{'+files.map(f=>`${JSON.stringify('/'+path.relative(root,f))}: ${glob.includes('tenants')?JSON.stringify(JSON.parse(fs.readFileSync(f))):`{metadata:${JSON.stringify(frontmatter(fs.readFileSync(f,'utf8')))}}`}`).join(',')+'}';
  });
  if(args.path.endsWith('.ts')) return {contents:code,loader:'ts'};
  if(args.path.endsWith('.svx')) code=(await preprocess(code,mdsvex({extensions:['.svx'],layout:{runbook:path.join(src,'lib/layouts/runbook.svelte')}}),{filename:args.path})).code;
  return {contents:compile(code,{filename:args.path,generate,css:'injected',dev:false}).js.code,loader:'js'};
 });
}});
function frontmatter(text){
 const block=text.match(/^---\n([\s\S]*?)\n---/)[1];
 return Object.fromEntries(block.split('\n').map(line=>{const i=line.indexOf(':');return [line.slice(0,i),line.slice(i+1).trim().replace(/^(['"])(.*)\1$/,'$2')]}));
}
fs.mkdirSync(path.join(root,'.build'),{recursive:true});
const app=path.join(src,'routes/kb',route,'+page.svx');
await build({stdin:{contents:`import {render} from 'svelte/server'; import App from ${JSON.stringify(app)}; export default () => render(App);`,resolveDir:root},bundle:true,platform:'node',format:'esm',outfile:path.join(root,'.build/server.mjs'),plugins:[plugin('server')],conditions:['node']});
const rendered=(await import(pathToFileURL(path.join(root,'.build/server.mjs')).href+'?t='+Date.now())).default();
await build({stdin:{contents:`import {hydrate} from 'svelte'; import App from ${JSON.stringify(app)}; hydrate(App,{target:document.getElementById('app')});`,resolveDir:root},bundle:true,platform:'browser',format:'esm',outfile:path.join(root,'rendered-client.js'),plugins:[plugin('client')],conditions:['browser'],minify:true});
const html=`<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${rendered.head}</head><body><div id="app">${rendered.body}</div><script type="module" src="./rendered-client.js"></script></body></html>\n`;
fs.writeFileSync(path.join(root,'rendered.html'),html);
console.log('Built rendered.html from '+path.relative(root,app));

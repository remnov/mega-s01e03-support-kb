import fs from 'node:fs';
import { uniqueById, groupByCause, causeOf, sameCause } from '../src/lib/kb/causes.ts';
import { DEDUPE_CASES } from '../src/lib/kb/dedupe-cases.ts';
const root = new URL('../src/lib/data/', import.meta.url);
const read = name => JSON.parse(fs.readFileSync(new URL(name, root), 'utf8'));
const raw = read('reports-4471.json');
const reports = uniqueById(raw).filter(r => r.mergedInto === 4471);
const tenants = new Map(fs.readdirSync(new URL('tenants/', root)).map(file => {
 const t = read('tenants/' + file); return [t.handle,t];
}));
const tenantOf = r => tenants.get(r.tenant);
const groups = groupByCause(reports, tenantOf);
const weeks = new Map();
const monday = iso => { const d=new Date(iso.slice(0,10)); d.setUTCDate(d.getUTCDate() - (d.getUTCDay()+6)%7); return d.toISOString().slice(0,10); };
for(const r of reports) {
 for (const [field,iso] of [['received',r.receivedAt],['merged',r.mergedAt]]) {
  if(!iso) continue;
  const key=monday(iso); const row=weeks.get(key)??{week:key,received:0,merged:0}; row[field]++; weeks.set(key,row);
 }
}
const results = {
 source:'kb-export-267efc5e.zip; exported 2026-10-04', rawRows:raw.length, uniqueReports:reports.length, duplicateRows:raw.length-uniqueById(raw).length,
 groups:groups.map(g=>({...g,reports:g.reports.map(r=>r.id)})),
 deskNotes:read('desk-notes.json').oneDayMove.map(id=>{const r=reports.find(r=>r.id===id); return {id,cause:causeOf(r,tenantOf(r)),body:r.body}}),
 cases:DEDUPE_CASES.map(c=>({...c,sameCause:sameCause(c.a,tenantOf(c.a),c.b,tenantOf(c.b))})),
 weeks:[...weeks.values()].sort((a,b)=>a.week.localeCompare(b.week))
};
fs.writeFileSync(new URL('../analysis.json',import.meta.url),JSON.stringify(results,null,2)+'\n');
console.log(JSON.stringify({...results,groups:results.groups.map(({reports,...g})=>({...g,count:reports.length}))},null,2));

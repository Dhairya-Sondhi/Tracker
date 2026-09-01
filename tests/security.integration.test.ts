import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root=process.cwd();
const schema=fs.readFileSync(path.join(root,"database","supabase","001_vlocity.sql"),"utf8");

test("Supabase schema preserves authentication and isolation invariants",()=>{
 assert.match(schema,/references auth\.users\(id\) on delete cascade/i);
 assert.match(schema,/create trigger on_auth_user_created/i);
 assert.match(schema,/alter table public\.tracker_entries enable row level security/i);
 assert.match(schema,/create policy entries_owner/i);
 assert.match(schema,/perform id from public\.users where role='ADMIN' and is_active[\s\S]*for update/i);
 assert.match(schema,/raise exception 'LAST_ADMIN'/i);
 assert.match(schema,/revoke all on function public\.update_managed_user[\s\S]*from public,anon,authenticated/i);
});

test("runtime source has no legacy MySQL or custom-token dependencies",()=>{
 const files=[...walk(path.join(root,"app")),...walk(path.join(root,"lib"))].filter(file=>/\.(ts|tsx)$/.test(file));
 for(const file of files){const source=fs.readFileSync(file,"utf8");assert.doesNotMatch(source,/from ["']mysql2|@\/lib\/db|bcryptjs|from ["']jose/,path.relative(root,file))}
});

function walk(directory:string):string[]{return fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(path.join(directory,entry.name)):[path.join(directory,entry.name)])}

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const files=execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
const forbidden=/(^|\/)(\.env(?:\..*)?|config\.env|connections\.json|server|data-private|backups|exports|\.evidence)(\/|$)|\.(?:sqlite3?|db)(?:-.*)?$|\.(?:ofx|csv|xlsx?|pdf)$|\.private\.json$/i;
for(const file of files){
 assert.ok(!forbidden.test(file),'Unexpected tracked path: '+file);
 if(!file.startsWith('src/')||! /\.(?:ts|tsx|js|css)$/.test(file))continue;
 const source=readFileSync(file,'utf8');
 assert.ok(!/(?:ghp_|github_pat_|sk_live_)[A-Za-z0-9_]{12,}|PLUGGY_CLIENT_(?:ID|SECRET)|C:\\Users\\|\b(?:localStorage|sessionStorage|indexedDB)\b|\bfetch\s*\(|\bXMLHttpRequest\b/.test(source),'Unexpected sensitive or network marker: '+file);
}
console.log('Tracked paths and frontend source passed demo privacy guard.');

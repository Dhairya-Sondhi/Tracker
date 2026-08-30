import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";
import { databaseOptions } from "./db-config.mjs";

const connection=await mysql.createConnection(databaseOptions({migration:true}));
try{const directory=path.join(process.cwd(),"database","migrations"),files=fs.readdirSync(directory).filter(name=>/^\d+_(?!initial).*\.sql$/.test(name)).sort(),[rows]=await connection.query("SELECT name,checksum,applied_at FROM schema_migrations ORDER BY name"),applied=new Map(rows.map(row=>[row.name,row]));let pending=0;for(const file of files){const digest=crypto.createHash("sha256").update(fs.readFileSync(path.join(directory,file),"utf8")).digest("hex"),row=applied.get(file);if(!row){pending++;process.stdout.write(`PENDING ${file}\n`)}else if(row.checksum!==digest){process.stdout.write(`MISMATCH ${file}\n`);process.exitCode=1}else process.stdout.write(`APPLIED ${file}\n`)}if(!process.exitCode)process.stdout.write(`Migration status verified · applied=${rows.length} · pending=${pending}\n`)}finally{await connection.end()}

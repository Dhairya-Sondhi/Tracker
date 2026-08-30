import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";
import { databaseOptions } from "./db-config.mjs";

const lockName="form_schema_migrations";
const checksum=content=>crypto.createHash("sha256").update(content).digest("hex");

async function main(){
 const connection=await mysql.createConnection(databaseOptions({migration:true,multipleStatements:true}));
 try{
  await connection.query("CREATE TABLE IF NOT EXISTS schema_migrations (name VARCHAR(255) PRIMARY KEY, checksum CHAR(64) NULL, applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP)");
  const [columns]=await connection.query("SELECT column_name FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='schema_migrations' AND column_name='checksum'");
  if(!columns.length)await connection.query("ALTER TABLE schema_migrations ADD COLUMN checksum CHAR(64) NULL AFTER name");
  const [[lock]]=await connection.query("SELECT GET_LOCK(?,30) acquired",[lockName]);
  if(Number(lock.acquired)!==1)throw new Error("Another migration process is already running.");
  try{
   const directory=path.join(process.cwd(),"database","migrations"),files=fs.readdirSync(directory).filter(name=>/^\d+_(?!initial).*\.sql$/.test(name)).sort();
   const [appliedRows]=await connection.query("SELECT name,checksum FROM schema_migrations");
   const applied=new Map(appliedRows.map(row=>[row.name,row.checksum]));
   for(const file of files){const content=fs.readFileSync(path.join(directory,file),"utf8"),digest=checksum(content),stored=applied.get(file);if(stored){if(stored!==digest)throw new Error(`Applied migration checksum mismatch: ${file}`);continue}if(applied.has(file)){await connection.execute("UPDATE schema_migrations SET checksum=? WHERE name=? AND checksum IS NULL",[digest,file]);process.stdout.write(`Recorded checksum ${file}\n`);continue}await connection.query(content);await connection.execute("INSERT INTO schema_migrations (name,checksum) VALUES (?,?)",[file,digest]);process.stdout.write(`Applied ${file}\n`)}
  }finally{await connection.query("SELECT RELEASE_LOCK(?)",[lockName])}
 }finally{await connection.end()}
}
main().catch(error=>{console.error(error instanceof Error?error.message:"Database migration failed.");process.exit(1)});

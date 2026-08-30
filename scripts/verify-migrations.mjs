import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";
import { databaseOptions } from "./db-config.mjs";

const suffix=`${Date.now()}_${Math.random().toString(16).slice(2,10)}`,database=`form_migration_verify_${suffix}`;
if(!/^form_migration_verify_[a-z0-9_]+$/.test(database))throw new Error("Unsafe disposable database name.");
const options=databaseOptions({migration:true,multipleStatements:true}),connection=await mysql.createConnection({...options,database:undefined});
try{await connection.query(`CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);await connection.changeUser({database});const directory=path.join(process.cwd(),"database","migrations"),files=fs.readdirSync(directory).filter(name=>/^\d+_(?!initial).*\.sql$/.test(name)).sort();for(const file of files)await connection.query(fs.readFileSync(path.join(directory,file),"utf8"));const [rows]=await connection.query("SELECT COUNT(*) count FROM information_schema.tables WHERE table_schema=?",[database]);if(Number(rows[0].count)!==9)throw new Error(`Fresh migration schema is incomplete: expected 9 tables, found ${rows[0].count}.`);process.stdout.write(`Fresh migration verification passed · migrations=${files.length} · tables=${rows[0].count}\n`)}finally{await connection.changeUser({database:options.database});await connection.query(`DROP DATABASE IF EXISTS \`${database}\``);await connection.end()}

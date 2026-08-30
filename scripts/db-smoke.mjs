import mysql from "mysql2/promise";
import { databaseOptions } from "./db-config.mjs";

const connection=await mysql.createConnection(databaseOptions());
try{await connection.query("SELECT 1 AS connected");const [tables]=await connection.query("SELECT COUNT(*) count FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name IN ('users','trackers','tracker_entries','admin_audit_logs','user_settings')");if(Number(tables[0].count)!==5)throw new Error("Required application tables are missing.");await connection.beginTransaction();try{await connection.execute("INSERT INTO admin_audit_logs (action,metadata) VALUES (?,?)",["DB_SMOKE_TEST",JSON.stringify({rolledBack:true})]);await connection.rollback()}catch(error){await connection.rollback();throw error}process.stdout.write("Database smoke test passed · connection=ok · schema=ok · transactional-write=ok\n")}finally{await connection.end()}

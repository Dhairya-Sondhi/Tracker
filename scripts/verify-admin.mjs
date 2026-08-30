import mysql from "mysql2/promise";
import { databaseOptions } from "./db-config.mjs";

const options=databaseOptions(),connection=await mysql.createConnection(options);
const [tables]=await connection.query("SELECT table_name FROM information_schema.tables WHERE table_schema=? AND table_name IN ('users','trackers','tracker_entries','admin_audit_logs','password_reset_tokens','weekly_plan_items','user_top_focus','user_settings','schema_migrations')",[options.database]);
const [overview]=await connection.query("SELECT COUNT(*) total, SUM(is_active = TRUE) active, SUM(role = 'ADMIN') admins, SUM(DATE(created_at) = CURRENT_DATE) new_today, SUM(last_login_at >= NOW() - INTERVAL 7 DAY) signed_in_week FROM users");
const [tracking]=await connection.query("SELECT (SELECT COUNT(*) FROM trackers) trackers, (SELECT COUNT(*) FROM tracker_entries) entries");
const required=new Set(["users","trackers","tracker_entries","admin_audit_logs","password_reset_tokens","weekly_plan_items","user_top_focus","user_settings","schema_migrations"]);for(const row of tables)required.delete(row.TABLE_NAME??row.table_name);
if(required.size)throw new Error(`Missing admin tables: ${[...required].join(", ")}`);
const stats=overview[0];
process.stdout.write(`Admin schema verified · users=${stats.total} · active=${Number(stats.active)} · admins=${Number(stats.admins)} · trackers=${tracking[0].trackers} · entries=${tracking[0].entries}\n`);
await connection.end();

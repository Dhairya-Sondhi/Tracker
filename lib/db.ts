import mysql,{type Pool} from "mysql2/promise";
import { getDatabaseEnv, getDatabaseRuntimeOptions } from "@/lib/env";

const globalForDb=globalThis as typeof globalThis&{mysqlPool?:Pool};
export function getDb():Pool{
 if(globalForDb.mysqlPool)return globalForDb.mysqlPool;
 const env=getDatabaseEnv(),runtime=getDatabaseRuntimeOptions(),ssl=runtime.sslMode==="disable"?undefined:{ca:runtime.sslCa,rejectUnauthorized:runtime.sslMode==="verify_identity",minVersion:"TLSv1.2" as const};
 globalForDb.mysqlPool=mysql.createPool({host:env.DB_HOST,port:Number(env.DB_PORT),user:env.DB_USER,password:env.DB_PASSWORD,database:env.DB_NAME,waitForConnections:true,connectionLimit:runtime.connectionLimit,maxIdle:runtime.connectionLimit,idleTimeout:60000,queueLimit:0,connectTimeout:runtime.connectTimeout,enableKeepAlive:true,keepAliveInitialDelay:0,charset:"utf8mb4",ssl});
 return globalForDb.mysqlPool;
}

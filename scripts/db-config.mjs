import fs from "node:fs";
import path from "node:path";

const required=["DB_HOST","DB_PORT","DB_USER","DB_PASSWORD","DB_NAME"];

export function loadEnvironment(){
 const filePath=path.join(process.cwd(),".env.local");
 const fromFile=fs.existsSync(filePath)?Object.fromEntries(fs.readFileSync(filePath,"utf8").split(/\r?\n/).filter(line=>line&&!line.trimStart().startsWith("#")&&line.includes("=")).map(line=>{const index=line.indexOf("=");return [line.slice(0,index).trim(),line.slice(index+1).trim()]})):{};
 return {...fromFile,...Object.fromEntries(Object.entries(process.env).filter(([,value])=>value!==undefined))};
}

function positiveInteger(value,fallback,label){const parsed=Number(value||fallback);if(!Number.isInteger(parsed)||parsed<1)throw new Error(`${label} must be a positive integer.`);return parsed}
function sslOptions(env){const mode=(env.DB_SSL_MODE||"disable").toLowerCase();if(mode==="disable")return undefined;if(mode!=="require"&&mode!=="verify_identity")throw new Error("DB_SSL_MODE must be disable, require, or verify_identity.");const encoded=env.DB_SSL_CA_BASE64?.trim();if(mode==="verify_identity"&&!encoded)throw new Error("DB_SSL_CA_BASE64 is required when DB_SSL_MODE=verify_identity.");return {ca:encoded?Buffer.from(encoded,"base64").toString("utf8"):undefined,rejectUnauthorized:mode==="verify_identity",minVersion:"TLSv1.2"}}

export function databaseOptions({migration=false,multipleStatements=false}={}){const env=loadEnvironment(),missing=required.filter(key=>!env[key]?.trim());if(missing.length)throw new Error(`Missing database environment variables: ${missing.join(", ")}`);const port=positiveInteger(env.DB_PORT,3306,"DB_PORT");if(port>65535)throw new Error("DB_PORT must be no greater than 65535.");return {host:env.DB_HOST.trim(),port,user:(migration&&env.DB_MIGRATION_USER?env.DB_MIGRATION_USER:env.DB_USER).trim(),password:migration&&env.DB_MIGRATION_PASSWORD?env.DB_MIGRATION_PASSWORD:env.DB_PASSWORD,database:env.DB_NAME.trim(),charset:"utf8mb4",connectTimeout:positiveInteger(env.DB_CONNECT_TIMEOUT_MS,5000,"DB_CONNECT_TIMEOUT_MS"),enableKeepAlive:true,keepAliveInitialDelay:0,multipleStatements,ssl:sslOptions(env)}}

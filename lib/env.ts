const placeholderPrefixes=["PUT_MY_","PUT_A_LONG_"];
const databaseKeys=["DB_HOST","DB_PORT","DB_USER","DB_PASSWORD","DB_NAME"] as const;
const authKeys=["AUTH_SECRET"] as const;
const supabaseKeys=["SUPABASE_URL","SUPABASE_SECRET_KEY"] as const;
type DatabaseKey=(typeof databaseKeys)[number];
type AuthKey=(typeof authKeys)[number];
type SupabaseKey=(typeof supabaseKeys)[number];
export type DatabaseEnv=Record<DatabaseKey,string>;
export type AuthEnv=Record<AuthKey,string>;
export type SupabaseEnv=Record<SupabaseKey,string>;
export type DatabaseRuntimeOptions={connectionLimit:number;connectTimeout:number;sslMode:"disable"|"require"|"verify_identity";sslCa?:string};

function readRequired<const T extends readonly string[]>(keys:T):Record<T[number],string>{
 const missing=keys.filter(key=>!process.env[key]?.trim()||placeholderPrefixes.some(prefix=>process.env[key]!.startsWith(prefix)));
 if(missing.length)throw new Error(`Missing or placeholder server environment variables: ${missing.join(", ")}`);
 return Object.fromEntries(keys.map(key=>[key,process.env[key]!.trim()])) as Record<T[number],string>;
}

let databaseCache:DatabaseEnv|undefined;
export function getDatabaseEnv():DatabaseEnv{
 if(databaseCache)return databaseCache;
 const env=readRequired(databaseKeys);
 const port=Number(env.DB_PORT);
 if(!Number.isInteger(port)||port<1||port>65535)throw new Error("DB_PORT must be a valid TCP port.");
 databaseCache=env;
 return env;
}

let databaseOptionsCache:DatabaseRuntimeOptions|undefined;
export function getDatabaseRuntimeOptions():DatabaseRuntimeOptions{
 if(databaseOptionsCache)return databaseOptionsCache;
 const connectionLimit=Number(process.env.DB_CONNECTION_LIMIT||10),connectTimeout=Number(process.env.DB_CONNECT_TIMEOUT_MS||5000),sslMode=(process.env.DB_SSL_MODE||"disable").toLowerCase();
 if(!Number.isInteger(connectionLimit)||connectionLimit<1||connectionLimit>100)throw new Error("DB_CONNECTION_LIMIT must be between 1 and 100.");
 if(!Number.isInteger(connectTimeout)||connectTimeout<1000||connectTimeout>60000)throw new Error("DB_CONNECT_TIMEOUT_MS must be between 1000 and 60000.");
 if(sslMode!=="disable"&&sslMode!=="require"&&sslMode!=="verify_identity")throw new Error("DB_SSL_MODE must be disable, require, or verify_identity.");
 const encoded=process.env.DB_SSL_CA_BASE64?.trim(),sslCa=encoded?Buffer.from(encoded,"base64").toString("utf8"):undefined;
 if(sslMode==="verify_identity"&&!sslCa)throw new Error("DB_SSL_CA_BASE64 is required when DB_SSL_MODE=verify_identity.");
 databaseOptionsCache={connectionLimit,connectTimeout,sslMode,sslCa};return databaseOptionsCache;
}

let authCache:AuthEnv|undefined;
export function getAuthEnv():AuthEnv{
 if(authCache)return authCache;
 const env=readRequired(authKeys);
 if(env.AUTH_SECRET.length<32)throw new Error("AUTH_SECRET must be at least 32 characters.");
 authCache=env;
 return env;
}

let supabaseCache:SupabaseEnv|undefined;
export function getSupabaseEnv():SupabaseEnv{
 if(supabaseCache)return supabaseCache;
 const env=readRequired(supabaseKeys);
 let url:URL;
 try{url=new URL(env.SUPABASE_URL)}catch{throw new Error("SUPABASE_URL must be a valid URL.")}
 if(url.protocol!=="https:"||url.username||url.password||url.search||url.hash)throw new Error("SUPABASE_URL must be an HTTPS origin without credentials, query, or fragment.");
 if(env.SUPABASE_SECRET_KEY.startsWith("sb_publishable_"))throw new Error("SUPABASE_SECRET_KEY must be a server secret key, not a publishable key.");
 if(env.SUPABASE_SECRET_KEY.length<20||env.SUPABASE_SECRET_KEY.startsWith("replace-with-"))throw new Error("SUPABASE_SECRET_KEY is missing or still a placeholder.");
 supabaseCache={SUPABASE_URL:url.origin,SUPABASE_SECRET_KEY:env.SUPABASE_SECRET_KEY};
 return supabaseCache;
}

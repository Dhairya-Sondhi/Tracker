import { loadEnvironment } from "./db-config.mjs";

const env=loadEnvironment(),errors=[];
const required=["DB_HOST","DB_PORT","DB_NAME","DB_USER","DB_PASSWORD","DB_MIGRATION_USER","DB_MIGRATION_PASSWORD","DB_SSL_CA_BASE64","AUTH_SECRET","APP_URL","RESEND_API_KEY","AUTH_FROM_EMAIL","SUPABASE_URL","SUPABASE_SECRET_KEY"];
for(const key of required)if(!env[key]?.trim())errors.push(`${key} is required.`);
if(["127.0.0.1","localhost","::1"].includes((env.DB_HOST||"").toLowerCase()))errors.push("DB_HOST must be a remote production host.");
if((env.DB_SSL_MODE||"").toLowerCase()!=="verify_identity")errors.push("DB_SSL_MODE must be verify_identity.");
if(env.DB_USER&&env.DB_MIGRATION_USER&&env.DB_USER===env.DB_MIGRATION_USER)errors.push("Runtime and migration database users must be different.");
if(env.DB_PASSWORD&&env.DB_MIGRATION_PASSWORD&&env.DB_PASSWORD===env.DB_MIGRATION_PASSWORD)errors.push("Runtime and migration database passwords must be different.");
if((env.AUTH_SECRET||"").length<64)errors.push("AUTH_SECRET must contain at least 64 characters.");
try{const url=new URL(env.APP_URL);if(url.protocol!=="https:"||url.username||url.password||url.pathname!=="/"||url.search||url.hash)throw new Error()}catch{errors.push("APP_URL must be a canonical HTTPS origin without credentials, path, query, or fragment.")}
try{const url=new URL(env.SUPABASE_URL);if(url.protocol!=="https:"||url.username||url.password||url.search||url.hash)throw new Error()}catch{errors.push("SUPABASE_URL must be an HTTPS origin without credentials, query, or fragment.")}
if((env.SUPABASE_SECRET_KEY||"").startsWith("sb_publishable_"))errors.push("SUPABASE_SECRET_KEY must not contain a publishable key.");
if((env.SUPABASE_SECRET_KEY||"").startsWith("replace-with-"))errors.push("SUPABASE_SECRET_KEY must not contain a placeholder.");
if(errors.length){for(const error of errors)process.stderr.write(`PRODUCTION_ENV_ERROR ${error}\n`);process.exit(1)}
process.stdout.write("Production environment contract verified without displaying secret values.\n");

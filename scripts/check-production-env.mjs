import { loadEnvironment } from "./env-file.mjs";

const env=loadEnvironment(),errors=[];
const required=["APP_URL","SUPABASE_URL","SUPABASE_PUBLISHABLE_KEY","SUPABASE_SECRET_KEY","RESEND_API_KEY","EMAIL_FROM","CRON_SECRET"];
for(const key of required)if(!env[key]?.trim()||/^(replace-with-|PUT_MY_)/.test(env[key]))errors.push(`${key} is required and cannot be a placeholder.`);
try{const url=new URL(env.APP_URL);if(url.protocol!=="https:"||url.username||url.password||url.pathname!=="/"||url.search||url.hash)throw new Error()}catch{errors.push("APP_URL must be a canonical HTTPS origin without credentials, path, query, or fragment.")}
try{const url=new URL(env.SUPABASE_URL);if(url.protocol!=="https:"||url.username||url.password||url.search||url.hash)throw new Error()}catch{errors.push("SUPABASE_URL must be an HTTPS origin without credentials, query, or fragment.")}
if((env.SUPABASE_SECRET_KEY||"").startsWith("sb_publishable_"))errors.push("SUPABASE_SECRET_KEY must be a server secret key.");
if((env.SUPABASE_PUBLISHABLE_KEY||"").startsWith("sb_secret_"))errors.push("SUPABASE_PUBLISHABLE_KEY must be a publishable key.");
if((env.CRON_SECRET||"").trim().length<16)errors.push("CRON_SECRET must contain at least 16 characters.");
if(!/^.+<[^<>\s]+@[^<>\s]+>$|^[^<>\s]+@[^<>\s]+$/.test((env.EMAIL_FROM||"").trim()))errors.push("EMAIL_FROM must be an email address, optionally with a sender name.");
if(errors.length){for(const error of errors)process.stderr.write(`PRODUCTION_ENV_ERROR ${error}\n`);process.exit(1)}
process.stdout.write("Production Supabase environment contract verified without displaying secret values.\n");

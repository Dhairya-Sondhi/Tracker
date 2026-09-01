const placeholderPrefixes=["PUT_MY_","PUT_A_LONG_","replace-with-"];
const supabaseAdminKeys=["SUPABASE_URL","SUPABASE_SECRET_KEY"] as const;
const supabasePublicKeys=["SUPABASE_URL","SUPABASE_PUBLISHABLE_KEY"] as const;

function readRequired<const T extends readonly string[]>(keys:T):Record<T[number],string>{
 const missing=keys.filter(key=>!process.env[key]?.trim()||placeholderPrefixes.some(prefix=>process.env[key]!.startsWith(prefix)));
 if(missing.length)throw new Error(`Missing or placeholder server environment variables: ${missing.join(", ")}`);
 return Object.fromEntries(keys.map(key=>[key,process.env[key]!.trim()])) as Record<T[number],string>;
}

function validateUrl(value:string){let url:URL;try{url=new URL(value)}catch{throw new Error("SUPABASE_URL must be a valid URL.")}if(url.protocol!=="https:"||url.username||url.password||url.search||url.hash)throw new Error("SUPABASE_URL must be an HTTPS origin without credentials, query, or fragment.");return url.origin}

let adminCache:Record<(typeof supabaseAdminKeys)[number],string>|undefined;
export function getSupabaseEnv(){
 if(adminCache)return adminCache;
 const env=readRequired(supabaseAdminKeys);
 if(env.SUPABASE_SECRET_KEY.startsWith("sb_publishable_"))throw new Error("SUPABASE_SECRET_KEY must be a server secret key.");
 adminCache={...env,SUPABASE_URL:validateUrl(env.SUPABASE_URL)};return adminCache;
}

let publicCache:Record<(typeof supabasePublicKeys)[number],string>|undefined;
export function getSupabasePublicEnv(){
 if(publicCache)return publicCache;
 const env=readRequired(supabasePublicKeys);
 if(env.SUPABASE_PUBLISHABLE_KEY.startsWith("sb_secret_"))throw new Error("SUPABASE_PUBLISHABLE_KEY must be a publishable key.");
 publicCache={...env,SUPABASE_URL:validateUrl(env.SUPABASE_URL)};return publicCache;
}

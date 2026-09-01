import { createServerClient } from "@supabase/ssr";
import { NextRequest,NextResponse } from "next/server";
import { getSupabasePublicEnv } from "@/lib/env";

const protectedPaths=["/today","/dashboard","/settings","/admin"];
const unsafeMethods=new Set(["POST","PUT","PATCH","DELETE"]);

function contentSecurityPolicy(nonce:string){
 const development=process.env.NODE_ENV==="development";
 return ["default-src 'self'",`script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${development?" 'unsafe-eval'":""}`,"style-src 'self' 'unsafe-inline'","img-src 'self' data: blob:","font-src 'self' data:",`connect-src 'self'${development?" ws: wss:":""}`,"object-src 'none'","base-uri 'self'","form-action 'self'","frame-ancestors 'none'","upgrade-insecure-requests"].join("; ");
}

function allowedMutationOrigin(request:NextRequest){
 const value=request.headers.get("origin");if(!value)return false;
 try{const origin=new URL(value).origin;if(origin===request.nextUrl.origin)return true;const configured=process.env.APP_URL?.trim();return Boolean(configured&&origin===new URL(configured).origin)}catch{return false}
}

function finish(response:NextResponse,requestId:string,csp?:string){response.headers.set("X-Request-ID",requestId);if(csp)response.headers.set("Content-Security-Policy",csp);return response}
function transferCookies(from:NextResponse,to:NextResponse){for(const cookie of from.cookies.getAll())to.cookies.set(cookie);return to}

export async function proxy(request:NextRequest){
 const requestId=crypto.randomUUID(),isApi=request.nextUrl.pathname.startsWith("/api/");
 if(isApi&&unsafeMethods.has(request.method)&&!allowedMutationOrigin(request))return finish(NextResponse.json({message:"Invalid request origin.",requestId},{status:403}),requestId);

 const requestHeaders=new Headers(request.headers);requestHeaders.set("x-request-id",requestId);
 let csp:string|undefined;if(!isApi){const nonce=Buffer.from(crypto.randomUUID()).toString("base64");csp=contentSecurityPolicy(nonce);requestHeaders.set("x-nonce",nonce);requestHeaders.set("Content-Security-Policy",csp)}
 const response=NextResponse.next({request:{headers:requestHeaders}});
 const protectedPath=protectedPaths.some(path=>request.nextUrl.pathname===path||request.nextUrl.pathname.startsWith(`${path}/`));
 if(protectedPath){
  try{
   const env=getSupabasePublicEnv();
   const supabase=createServerClient(env.SUPABASE_URL,env.SUPABASE_PUBLISHABLE_KEY,{cookies:{getAll:()=>request.cookies.getAll(),setAll(values){for(const {name,value} of values)request.cookies.set(name,value);for(const {name,value,options} of values)response.cookies.set(name,value,options)}}});
   const {data,error}=await supabase.auth.getClaims();
   if(error||!data?.claims){const redirect=new URL("/signin",request.url);redirect.searchParams.set("next",request.nextUrl.pathname);return finish(transferCookies(response,NextResponse.redirect(redirect)),requestId,csp)}
  }catch{const redirect=new URL("/signin",request.url);redirect.searchParams.set("next",request.nextUrl.pathname);return finish(NextResponse.redirect(redirect),requestId,csp)}
 }
 return finish(response,requestId,csp);
}
export const config={matcher:["/((?!_next/|favicon.ico|sitemap.xml|robots.txt).*)"]};

import { NextRequest,NextResponse } from "next/server";
import { jwtVerify } from "jose/jwt/verify";

const SESSION_COOKIE="form_session";
const protectedPaths=["/today","/dashboard","/settings","/admin"];
const unsafeMethods=new Set(["POST","PUT","PATCH","DELETE"]);

function contentSecurityPolicy(nonce:string){
 const development=process.env.NODE_ENV==="development";
 return [
  "default-src 'self'",
  `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${development?" 'unsafe-eval'":""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self'${development?" ws: wss:":""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
 ].join("; ");
}

function allowedMutationOrigin(request:NextRequest){
 const value=request.headers.get("origin");
 if(!value)return false;
 try{
  const origin=new URL(value).origin;
  if(origin===request.nextUrl.origin)return true;
  const configured=process.env.APP_URL?.trim();
  return Boolean(configured&&origin===new URL(configured).origin);
 }catch{return false}
}

function finish(response:NextResponse,requestId:string,csp?:string){
 response.headers.set("X-Request-ID",requestId);
 if(csp)response.headers.set("Content-Security-Policy",csp);
 return response;
}

export async function proxy(request:NextRequest){
 const requestId=crypto.randomUUID();
 const isApi=request.nextUrl.pathname.startsWith("/api/");
 if(isApi&&unsafeMethods.has(request.method)&&!allowedMutationOrigin(request)){
  return finish(NextResponse.json({message:"Invalid request origin.",requestId},{status:403}),requestId);
 }

 const requestHeaders=new Headers(request.headers);
 requestHeaders.set("x-request-id",requestId);
 let csp:string|undefined;
 if(!isApi){
  const nonce=Buffer.from(crypto.randomUUID()).toString("base64");
  csp=contentSecurityPolicy(nonce);
  requestHeaders.set("x-nonce",nonce);
  requestHeaders.set("Content-Security-Policy",csp);
 }

 const protectedPath=protectedPaths.some(path=>request.nextUrl.pathname===path||request.nextUrl.pathname.startsWith(`${path}/`));
 if(protectedPath){
  const token=request.cookies.get(SESSION_COOKIE)?.value;
  let role:unknown=null,sessionVersion:unknown=null;
  if(token&&process.env.AUTH_SECRET&&!process.env.AUTH_SECRET.startsWith("PUT_")){
   try{
    const {payload}=await jwtVerify(token,new TextEncoder().encode(process.env.AUTH_SECRET),{algorithms:["HS256"]});
    role=payload.role;sessionVersion=payload.sessionVersion;
   }catch{role=null}
  }
  if((role!=="ADMIN"&&role!=="USER")||!Number.isSafeInteger(Number(sessionVersion))){
   const url=new URL("/signin",request.url);url.searchParams.set("next",request.nextUrl.pathname);
   const response=NextResponse.redirect(url);response.cookies.delete(SESSION_COOKIE);
   return finish(response,requestId,csp);
  }
  if(request.nextUrl.pathname.startsWith("/admin")&&role!=="ADMIN")return finish(NextResponse.redirect(new URL("/today",request.url)),requestId,csp);
 }

 return finish(NextResponse.next({request:{headers:requestHeaders}}),requestId,csp);
}

export const config={matcher:["/((?!_next/|favicon.ico|sitemap.xml|robots.txt).*)"]};

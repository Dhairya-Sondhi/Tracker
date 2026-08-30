import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { proxy } from "../proxy";

test("proxy rejects cross-origin API mutations",async()=>{
 const response=await proxy(new NextRequest("http://localhost:3000/api/settings",{method:"PATCH",headers:{origin:"https://attacker.example"}}));
 assert.equal(response.status,403);
 assert.match(response.headers.get("x-request-id")??"",/^[0-9a-f-]{36}$/);
 assert.equal((await response.json()).message,"Invalid request origin.");
});

test("proxy accepts same-origin API mutations",async()=>{
 const response=await proxy(new NextRequest("http://localhost:3000/api/settings",{method:"PATCH",headers:{origin:"http://localhost:3000"}}));
 assert.equal(response.status,200);
 assert.match(response.headers.get("x-request-id")??"",/^[0-9a-f-]{36}$/);
});

test("proxy adds a strict nonce-based CSP to pages",async()=>{
 const response=await proxy(new NextRequest("http://localhost:3000/signin"));
 const csp=response.headers.get("content-security-policy")??"";
 assert.match(csp,/script-src 'self' 'nonce-[^']+' 'strict-dynamic'/);
 assert.doesNotMatch(csp,/script-src[^;]*'unsafe-inline'/);
});

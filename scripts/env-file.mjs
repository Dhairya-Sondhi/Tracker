import fs from "node:fs";
import path from "node:path";

export function loadEnvironment(){
 const filePath=path.join(process.cwd(),".env.local");
 const fromFile=fs.existsSync(filePath)?Object.fromEntries(fs.readFileSync(filePath,"utf8").split(/\r?\n/).filter(line=>line&&!line.trimStart().startsWith("#")&&line.includes("=")).map(line=>{const index=line.indexOf("=");return [line.slice(0,index).trim(),line.slice(index+1).trim()]})):{};
 return {...fromFile,...Object.fromEntries(Object.entries(process.env).filter(([,value])=>value!==undefined))};
}

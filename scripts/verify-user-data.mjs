import mysql from "mysql2/promise";
import { SignJWT } from "jose/jwt/sign";
import { databaseOptions, loadEnvironment } from "./db-config.mjs";

const env=loadEnvironment(),connection=await mysql.createConnection(databaseOptions());
const [users]=await connection.query("SELECT id,role,session_version FROM users WHERE is_active=TRUE ORDER BY id LIMIT 1");
if(!users.length)throw new Error("No active user is available for the read-only verification.");
const user=users[0],token=await new SignJWT({role:user.role,sessionVersion:Number(user.session_version)}).setProtectedHeader({alg:"HS256"}).setSubject(String(user.id)).setIssuedAt().setExpirationTime("5m").sign(new TextEncoder().encode(env.AUTH_SECRET));
const headers={Cookie:`form_session=${token}`};
const [analyticsResponse,monthPlanResponse,focusResponse]=await Promise.all([fetch("http://127.0.0.1:3000/api/analytics?days=30",{headers,redirect:"manual"}),fetch("http://127.0.0.1:3000/api/plan?range=month",{headers,redirect:"manual"}),fetch("http://127.0.0.1:3000/api/focus",{headers,redirect:"manual"})]);
if(!analyticsResponse.ok||!monthPlanResponse.ok||!focusResponse.ok){const details=await Promise.all([analyticsResponse.text(),monthPlanResponse.text(),focusResponse.text()]);await connection.end();throw new Error(`User data APIs failed: analytics=${analyticsResponse.status} ${details[0].slice(0,160)}, plan=${monthPlanResponse.status} ${details[1].slice(0,160)}, focus=${focusResponse.status} ${details[2].slice(0,160)}`)}
const analytics=await analyticsResponse.json(),plan=await monthPlanResponse.json(),focus=await focusResponse.json();
if(!Number.isFinite(analytics.score)||!Array.isArray(analytics.trend)||analytics.trend.length!==30)throw new Error("Analytics response is not derived correctly.");
if(plan.range!=="month"||!Array.isArray(plan.items))throw new Error("Monthly plan response is invalid.");
if(!(focus.trackerId===null||Number.isSafeInteger(focus.trackerId)))throw new Error("Top focus response is invalid.");
process.stdout.write(`User data verified · score=${analytics.score}% · trend=${analytics.trend.length} days · month plan items=${plan.items.length}\n`);
await connection.end();

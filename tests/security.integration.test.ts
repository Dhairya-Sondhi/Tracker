import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import mysql from "mysql2/promise";
import type { RowDataPacket } from "mysql2";
// @ts-expect-error The deployment helper is intentionally plain ESM and has no declaration output.
import { databaseOptions } from "../scripts/db-config.mjs";

test("critical authentication, isolation, and administrator invariants", async (t) => {
  const adminOptions=databaseOptions({migration:true,multipleStatements:true});
  const disposable=`form_security_test_${Date.now()}_${randomBytes(4).toString("hex")}`;
  assert.match(disposable,/^form_security_test_[a-z0-9_]+$/);
  const admin=await mysql.createConnection(adminOptions);

  try{
    await admin.query(`CREATE DATABASE \`${disposable}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await admin.changeUser({database:disposable});
    const migrations=fs.readdirSync(path.join(process.cwd(),"database","migrations")).filter(name=>/^\d+_(?!initial).*\.sql$/.test(name)).sort();
    for(const migration of migrations)await admin.query(fs.readFileSync(path.join(process.cwd(),"database","migrations",migration),"utf8"));

    process.env.DB_HOST=String(adminOptions.host);
    process.env.DB_PORT=String(adminOptions.port);
    process.env.DB_NAME=disposable;
    process.env.DB_USER=adminOptions.user;
    process.env.DB_PASSWORD=String(adminOptions.password);
    process.env.DB_SSL_MODE=adminOptions.ssl?"require":"disable";
    process.env.DB_CONNECTION_LIMIT="5";
    process.env.DB_CONNECT_TIMEOUT_MS="5000";
    process.env.AUTH_SECRET=randomBytes(64).toString("hex");

    const users=await import("../lib/auth/users");
    const trackers=await import("../lib/trackers");
    const resets=await import("../lib/auth/password-reset");
    const limits=await import("../lib/auth/rate-limit");
    const {getDb}=await import("../lib/db");

    const suffix=randomBytes(6).toString("hex");
    const password="Correct horse battery staple 123!";
    const first=await users.createUser({displayName:"Security One",email:`security-one-${suffix}@example.test`,password});
    const second=await users.createUser({displayName:"Security Two",email:`security-two-${suffix}@example.test`,password});

    await t.test("signup is complete and duplicate-safe",async()=>{
      const [trackerRows]=await getDb().query<RowDataPacket[]>("SELECT id FROM trackers WHERE user_id=?",[first.id]);
      const [auditRows]=await getDb().query<RowDataPacket[]>("SELECT id FROM admin_audit_logs WHERE target_user_id=? AND action='USER_SIGNED_UP'",[first.id]);
      assert.equal(trackerRows.length,8);
      assert.equal(auditRows.length,1);
      await assert.rejects(()=>users.createUser({displayName:"Duplicate",email:first.email,password}),users.DuplicateEmailError);
    });

    await t.test("credentials reject invalid passwords and accept the valid password",async()=>{
      await assert.rejects(()=>users.authenticateUser(first.email,"definitely-wrong"),users.InvalidCredentialsError);
      assert.equal((await users.authenticateUser(first.email,password)).id,first.id);
    });

    await t.test("disabled accounts cannot authenticate",async()=>{
      await getDb().execute("UPDATE users SET is_active=FALSE WHERE id=?",[second.id]);
      await assert.rejects(()=>users.authenticateUser(second.email,password),users.DisabledAccountError);
      await getDb().execute("UPDATE users SET is_active=TRUE WHERE id=?",[second.id]);
    });

    await t.test("one user cannot write another user's tracker",async()=>{
      const [rows]=await getDb().query<(RowDataPacket&{id:number})[]>("SELECT id FROM trackers WHERE user_id=? ORDER BY id LIMIT 1",[first.id]);
      await assert.rejects(()=>trackers.saveTrackerEntry(second.id,Number(rows[0].id),{status:"complete",value:1}),/TRACKER_NOT_FOUND/);
    });

    await t.test("password reset is single-use and invalidates the old password",async()=>{
      const token=randomBytes(32).toString("base64url"),tokenHash=createHash("sha256").update(token).digest();
      await getDb().execute("INSERT INTO password_reset_tokens (user_id,token_hash,expires_at) VALUES (?,?,NOW()+INTERVAL 30 MINUTE)",[first.id,tokenHash]);
      const replacement="Replacement password 456!";
      assert.equal(await resets.resetPassword(token,replacement),true);
      assert.equal(await resets.resetPassword(token,replacement),false);
      await assert.rejects(()=>users.authenticateUser(first.email,password),users.InvalidCredentialsError);
      assert.equal((await users.authenticateUser(first.email,replacement)).id,first.id);
    });

    await t.test("expired password reset tokens are rejected",async()=>{
      const token=randomBytes(32).toString("base64url"),tokenHash=createHash("sha256").update(token).digest();
      await getDb().execute("INSERT INTO password_reset_tokens (user_id,token_hash,expires_at) VALUES (?,?,NOW()-INTERVAL 1 MINUTE)",[second.id,tokenHash]);
      assert.equal(await resets.resetPassword(token,"Replacement password 789!"),false);
    });

    await t.test("rate limits block attempts beyond the configured threshold",async()=>{
      const rule={scope:`security-test-${suffix}`,subject:"same-client",limit:2,windowSeconds:60,blockSeconds:60};
      await limits.consumeRateLimit(rule);
      await limits.consumeRateLimit(rule);
      await assert.rejects(()=>limits.consumeRateLimit(rule),limits.RateLimitExceededError);
    });

    await t.test("concurrent access changes cannot remove every administrator",async()=>{
      await getDb().execute("UPDATE users SET role='ADMIN',is_active=TRUE WHERE id IN (?,?)",[first.id,second.id]);
      await Promise.allSettled([
        import("../lib/admin/users").then(module=>module.updateManagedUser({actorId:first.id,targetId:second.id,role:"USER"})),
        import("../lib/admin/users").then(module=>module.updateManagedUser({actorId:second.id,targetId:first.id,role:"USER"})),
      ]);
      const [rows]=await getDb().query<(RowDataPacket&{count:number})[]>("SELECT COUNT(*) count FROM users WHERE role='ADMIN' AND is_active=TRUE");
      assert.equal(Number(rows[0].count),1);
    });

    await getDb().end();
  }finally{
    await admin.changeUser({database:adminOptions.database});
    await admin.query(`DROP DATABASE IF EXISTS \`${disposable}\``);
    await admin.end();
  }
});

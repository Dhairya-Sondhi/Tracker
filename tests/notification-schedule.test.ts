import assert from "node:assert/strict";
import test from "node:test";
import { dueKinds,localScheduleState } from "../lib/notification-schedule";

test("notification schedule respects the user's timezone and delivery time",()=>{
 const before=localScheduleState(new Date("2026-09-05T14:29:00Z"),"Asia/Kolkata");
 const after=localScheduleState(new Date("2026-09-05T14:30:00Z"),"Asia/Kolkata");
 const settings={email_digest:"DAILY" as const,weekly_review_reminder:false,daily_reminder_time:"20:00",week_start_day:1};
 assert.deepEqual(dueKinds(settings,before),[]);
 assert.deepEqual(dueKinds(settings,after),["DAILY_PROGRESS"]);
});

test("weekly review is due the day before the configured week start",()=>{
 const sunday={date:"2026-09-06",weekday:0,minutes:20*60};
 assert.deepEqual(dueKinds({email_digest:"OFF",weekly_review_reminder:true,daily_reminder_time:"20:00",week_start_day:1},sunday),["WEEKLY_REVIEW"]);
 assert.deepEqual(dueKinds({email_digest:"WEEKLY",weekly_review_reminder:false,daily_reminder_time:"20:00",week_start_day:0},sunday),["WEEKLY_PROGRESS"]);
});

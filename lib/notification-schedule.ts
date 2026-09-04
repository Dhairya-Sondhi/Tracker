export type NotificationKind="DAILY_PROGRESS"|"WEEKLY_PROGRESS"|"WEEKLY_REVIEW";
export type NotificationPreferences={email_digest:"OFF"|"DAILY"|"WEEKLY";weekly_review_reminder:boolean;daily_reminder_time:string|null;week_start_day?:number};

export function localScheduleState(now:Date,timeZone:string){
 const parts=new Intl.DateTimeFormat("en-US",{timeZone,year:"numeric",month:"2-digit",day:"2-digit",weekday:"short",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(now);
 const value=(type:Intl.DateTimeFormatPartTypes)=>parts.find(part=>part.type===type)?.value||"";
 const weekdayIndex=({Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6} as Record<string,number>)[value("weekday")];
 if(weekdayIndex===undefined)throw new RangeError(`Unable to resolve weekday for ${timeZone}.`);
 return {date:`${value("year")}-${value("month")}-${value("day")}`,weekday:weekdayIndex,minutes:Number(value("hour"))*60+Number(value("minute"))};
}

export function dueKinds(settings:NotificationPreferences,state:ReturnType<typeof localScheduleState>){
 const scheduled=(settings.daily_reminder_time||"20:00").slice(0,5).split(":").map(Number),scheduledMinutes=scheduled[0]*60+scheduled[1];
 if(state.minutes<scheduledMinutes)return [] as NotificationKind[];
 const weekStart=settings.week_start_day===0?0:1,kinds:NotificationKind[]=[];
 if(settings.email_digest==="DAILY")kinds.push("DAILY_PROGRESS");
 if(settings.email_digest==="WEEKLY"&&state.weekday===weekStart)kinds.push("WEEKLY_PROGRESS");
 if(settings.weekly_review_reminder&&state.weekday===(weekStart+6)%7)kinds.push("WEEKLY_REVIEW");
 return kinds;
}

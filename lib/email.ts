import "server-only";

type EmailMessage={to:string;subject:string;html:string;text:string;idempotencyKey:string};

export class EmailConfigurationError extends Error{constructor(){super("EMAIL_NOT_CONFIGURED")}}
export class EmailDeliveryError extends Error{constructor(public readonly status:number,public readonly detail:string){super("EMAIL_DELIVERY_FAILED")}}

function emailEnvironment(){
 const apiKey=process.env.RESEND_API_KEY?.trim(),from=process.env.EMAIL_FROM?.trim();
 if(!apiKey||!from)throw new EmailConfigurationError();
 return {apiKey,from};
}

export function isEmailConfigured(){return Boolean(process.env.RESEND_API_KEY?.trim()&&process.env.EMAIL_FROM?.trim())}

export async function sendEmail(message:EmailMessage){
 const {apiKey,from}=emailEnvironment();
 const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${apiKey}`,"Content-Type":"application/json","Idempotency-Key":message.idempotencyKey},body:JSON.stringify({from,to:[message.to],subject:message.subject,html:message.html,text:message.text}),signal:AbortSignal.timeout(12000)});
 const body=await response.json().catch(()=>({})) as {id?:string;message?:string};
 if(!response.ok||!body.id)throw new EmailDeliveryError(response.status,body.message||`Email provider returned HTTP ${response.status}.`);
 return body.id;
}

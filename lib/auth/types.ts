export type UserRole="ADMIN"|"USER";
export type SafeUser={id:number;email:string;displayName:string|null;role:UserRole;isActive:boolean;sessionVersion:number;createdAt:Date};

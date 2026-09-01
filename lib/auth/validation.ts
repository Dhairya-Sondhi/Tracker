import { z } from "zod";

export const normalizeEmailInput=(value:string)=>value.trim().toLowerCase().replace(/\\+@/g,"@");
export const emailSchema=z.preprocess(value=>typeof value==="string"?normalizeEmailInput(value):value,z.string().email());
export const signInSchema=z.object({email:emailSchema,password:z.string().min(1)});
export const signUpSchema=z.object({displayName:z.string().trim().min(1).max(100),email:emailSchema,password:z.string().min(8).max(128)});

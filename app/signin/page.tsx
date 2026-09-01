import { AuthForm } from "@/components/auth/auth-form";
export default async function SignIn({searchParams}:{searchParams:Promise<{message?:string}>}){const {message}=await searchParams;return <AuthForm mode="signin" notice={message==="check-email"?"Check your email to confirm your account, then sign in.":undefined}/>}

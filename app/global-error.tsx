"use client";

export default function GlobalError({reset}:{error:Error&{digest?:string};reset:()=>void}){
 return <html lang="en"><body className="grid min-h-dvh place-items-center bg-[#09090d] px-6 text-[#f7f5fb]"><main className="max-w-md text-center"><p className="text-xs font-bold uppercase tracking-widest text-[#b7a4ff]">Something went wrong</p><h1 className="mt-4 text-3xl font-semibold tracking-tight">This page could not be loaded.</h1><p className="mt-3 text-sm leading-6 text-white/60">Your saved data is safe. Retry the request, or return after checking your connection.</p><button onClick={reset} className="mt-7 min-h-12 rounded-xl bg-white px-6 text-sm font-bold text-black focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Try again</button></main></body></html>;
}

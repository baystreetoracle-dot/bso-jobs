"use client";

import { ArrowRight, Bell, Check, X } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { track } from "@vercel/analytics";

export const CAREER_PATHS = ["Investment Banking", "Other"] as const;
export const ALERT_SENIORITIES = ["Intern / Co-op", "Analyst", "Associate", "Other"] as const;
export const ALERT_LOCATIONS = ["Toronto", "Calgary", "Montreal", "Vancouver", "Other"] as const;

export type AlertPreferences = {
  careerPaths: string[];
  seniorities: string[];
  locations: string[];
};
export type AlertSource = "delayed-modal" | "jobs-inline" | "job-page" | "contextual-page";
export type AlertStep = "email" | "preferences" | "success";

export type JobAlertController = {
  open: boolean;
  step: AlertStep;
  email: string;
  preferences: AlertPreferences;
  pending: boolean;
  error: string | null;
  source: AlertSource;
  contextualTitle: string;
  setEmail: (value: string) => void;
  setPreferences: (value: AlertPreferences) => void;
  close: () => void;
  submitEmail: (event: FormEvent<HTMLFormElement>) => void;
  savePreferences: () => void;
  skipPreferences: () => void;
};

const toggle = (values:string[], value:string) => values.includes(value) ? values.filter(item=>item!==value) : [...values,value];

function PreferenceGroup({legend,options,values,onChange}:{legend:string;options:readonly string[];values:string[];onChange:(values:string[])=>void}) {
  return <fieldset className="alert-preference-group"><legend>{legend}</legend><div>{options.map(option=><label key={option} className={values.includes(option)?"selected":""}><input type="checkbox" checked={values.includes(option)} onChange={()=>onChange(toggle(values,option))}/><span>{values.includes(option)&&<Check size={14}/>} {option}</span></label>)}</div></fieldset>;
}

export function JobAlertModal({controller}:{controller:JobAlertController}) {
  const panelRef=useRef<HTMLDivElement>(null);
  const emailRef=useRef<HTMLInputElement>(null);
  const previousFocus=useRef<HTMLElement|null>(null);
  const {close,open,step}=controller;

  useEffect(()=>{
    if(!open)return;
    previousFocus.current=document.activeElement as HTMLElement;
    const panel=panelRef.current;
    const priorOverflow=document.body.style.overflow;
    document.body.style.overflow="hidden";
    const focusTimer=window.setTimeout(()=>{
      if(step==="email")emailRef.current?.focus();
      else panel?.querySelector<HTMLElement>("button,input")?.focus();
    },20);
    const onKeyDown=(event:KeyboardEvent)=>{
      if(event.key==="Escape"){event.preventDefault();close();return;}
      if(event.key!=="Tab"||!panel)return;
      const focusable=Array.from(panel.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),[href],select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'));
      if(!focusable.length)return;
      const first=focusable[0],last=focusable[focusable.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    };
    document.addEventListener("keydown",onKeyDown);
    return()=>{window.clearTimeout(focusTimer);document.removeEventListener("keydown",onKeyDown);document.body.style.overflow=priorOverflow;previousFocus.current?.focus();};
  },[close,open,step]);

  if(!controller.open)return null;
  return <div className="job-alert-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)controller.close();}}>
    <div ref={panelRef} className="job-alert-modal" role="dialog" aria-modal="true" aria-labelledby="job-alert-title" aria-describedby="job-alert-description">
      <button className="job-alert-close" type="button" onClick={controller.close} aria-label="Close job alerts"><X size={19}/></button>
      {controller.step==="email"&&<div className="job-alert-step">
        <span className="job-alert-icon"><Bell size={20}/></span>
        <p className="eyebrow">BSO job alerts</p>
        <h2 id="job-alert-title">{controller.contextualTitle}</h2>
        <p id="job-alert-description">Get new Canadian finance opportunities sent directly to your inbox.</p>
        <form onSubmit={controller.submitEmail}>
          <label htmlFor="job-alert-email">Email address</label>
          <input ref={emailRef} id="job-alert-email" type="email" value={controller.email} onChange={event=>controller.setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required/>
          <input className="alert-honeypot" name="website" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true"/>
          {controller.error&&<p className="job-alert-error" role="alert">{controller.error}</p>}
          <button className="job-alert-primary" type="submit" disabled={controller.pending}>{controller.pending?"Saving…":<>Get job alerts <ArrowRight size={16}/></>}</button>
        </form>
        <small>No spam. Just relevant opportunities.</small>
        <button className="job-alert-secondary" type="button" onClick={controller.close}>Maybe later</button>
      </div>}
      {controller.step==="preferences"&&<div className="job-alert-step">
        <p className="eyebrow">One quick step</p>
        <h2 id="job-alert-title">What are you looking for?</h2>
        <p id="job-alert-description">Choose what you&apos;d like to hear about.</p>
        <PreferenceGroup legend="Career path" options={CAREER_PATHS} values={controller.preferences.careerPaths} onChange={careerPaths=>controller.setPreferences({...controller.preferences,careerPaths})}/>
        <PreferenceGroup legend="Seniority" options={ALERT_SENIORITIES} values={controller.preferences.seniorities} onChange={seniorities=>controller.setPreferences({...controller.preferences,seniorities})}/>
        <PreferenceGroup legend="Location" options={ALERT_LOCATIONS} values={controller.preferences.locations} onChange={locations=>controller.setPreferences({...controller.preferences,locations})}/>
        {controller.error&&<p className="job-alert-error" role="alert">{controller.error}</p>}
        <button className="job-alert-primary" type="button" onClick={controller.savePreferences} disabled={controller.pending}>{controller.pending?"Saving…":"Save preferences"}</button>
        <button className="job-alert-secondary" type="button" onClick={controller.skipPreferences} disabled={controller.pending}>Skip for now</button>
      </div>}
      {controller.step==="success"&&<div className="job-alert-step job-alert-success" aria-live="polite">
        <span className="job-alert-icon"><Check size={21}/></span>
        <p className="eyebrow">Alert created</p>
        <h2 id="job-alert-title">You&apos;re on the list.</h2>
        <p id="job-alert-description">We&apos;ll let you know when relevant opportunities come up.</p>
        <button className="job-alert-primary" type="button" onClick={controller.close}>Continue browsing</button>
      </div>}
    </div>
  </div>;
}

export function JobAlertInline({onSubmit,submitted}:{onSubmit:(email:string)=>Promise<void>;submitted:boolean}) {
  const [email,setEmail]=useState("");
  const [pending,setPending]=useState(false);
  const [error,setError]=useState<string|null>(null);

  if(submitted)return <aside className="job-alert-inline job-alert-inline-success" role="status" aria-live="polite"><span className="job-alert-success-icon"><Check size={20}/></span><div><p className="eyebrow">Alert created</p><h3>You&apos;re all set — welcome to BSO.</h3><p>Your job alert is saved. We&apos;ll send relevant opportunities to your inbox.</p></div></aside>;

  return <aside className="job-alert-inline" aria-labelledby="inline-alert-title"><div><p className="eyebrow">Job alerts</p><h3 id="inline-alert-title">Looking for something specific?</h3><p>Get notified when new opportunities match what you&apos;re looking for.</p></div><form onSubmit={async event=>{event.preventDefault();setPending(true);setError(null);try{await onSubmit(email);setEmail("");}catch(error){setError(error instanceof Error?error.message:"Unable to save your alert right now. Please try again.");}finally{setPending(false);}}}><label htmlFor="inline-alert-email">Email address</label><div><input id="inline-alert-email" type="email" value={email} onChange={event=>setEmail(event.target.value)} placeholder="Your email address" autoComplete="email" required/><button type="submit" disabled={pending}>{pending?"Saving…":<>Create alert <ArrowRight size={15}/></>}</button></div>{error&&<p role="alert">{error}</p>}</form></aside>;
}

export function JobAlertJobPageCta({careerPath,onClick}:{careerPath:string;onClick:()=>void}) {
  const description=careerPath==="Investment Banking"?"Get notified when new Investment Banking opportunities are added.":"Get notified when similar Canadian finance opportunities are added.";
  return <aside className="job-alert-job-cta"><div><p className="eyebrow">Looking for similar roles?</p><p>{description}</p></div><button type="button" onClick={onClick}>Create job alert <ArrowRight size={15}/></button></aside>;
}

export function trackJobAlert(name:"job_alert_modal_viewed"|"job_alert_modal_dismissed"|"job_alert_email_submitted"|"job_alert_preferences_saved"|"job_alert_preferences_skipped"|"job_alert_inline_started"|"job_alert_job_page_started",source:AlertSource){
  track(name,{source});
}

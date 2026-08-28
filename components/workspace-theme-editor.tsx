"use client";

import { useState } from "react";
import { Check, Palette } from "lucide-react";
import { saveWorkspaceTheme } from "@/app/dashboard/[workspaceId]/actions";

const presets = [
  { name: "Rose gold", start: "#d79a9a", end: "#b76e79" },
  { name: "Monochrome", start: "#ffffff", end: "#8b8b93" },
  { name: "Ocean", start: "#63d7ff", end: "#5668ff" },
  { name: "Violet", start: "#d0adff", end: "#815cff" },
  { name: "Ember", start: "#ffbd73", end: "#ff6b83" },
];

export function WorkspaceThemeEditor({ publicId, mode: initialMode = "gradient", start: initialStart = "#d79a9a", end: initialEnd = "#b76e79", disabled }: { publicId: string; mode?: "solid" | "gradient"; start?: string; end?: string; disabled: boolean }) {
  const [mode, setMode] = useState<"solid" | "gradient">(initialMode);
  const [start, setStart] = useState(initialStart);
  const [end, setEnd] = useState(initialEnd);
  const preview = mode === "solid" ? start : `linear-gradient(120deg, ${start}, ${end})`;

  function applyPreset(next: typeof presets[number]) { setMode("gradient"); setStart(next.start); setEnd(next.end); }

  return <form action={saveWorkspaceTheme} className="space-y-5">
    <input type="hidden" name="public_id" value={publicId} />
    <input type="hidden" name="theme_mode" value={mode} />
    <input type="hidden" name="theme_color_start" value={start} />
    <input type="hidden" name="theme_color_end" value={end} />

    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/25">
      <div className="h-2" style={{ background: preview }} />
      <div className="p-5"><p className="text-xs font-bold uppercase tracking-[.15em] text-white/35">Live preview</p><div className="mt-4 flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-xl text-black" style={{ background: preview }}><Palette className="size-5" /></span><div><p className="text-base font-bold">Your workspace theme</p><p className="mt-1 text-xs text-white/42">Applied to accents and decorative highlights.</p></div></div></div>
    </div>

    <fieldset disabled={disabled}><legend className="text-sm font-bold">Style</legend><div className="mt-2 grid grid-cols-2 gap-2">{(["solid","gradient"] as const).map(value=><button key={value} type="button" onClick={()=>setMode(value)} className={`min-h-11 rounded-xl border text-sm font-semibold capitalize transition ${mode===value?"border-white/30 bg-white/10 text-white":"border-white/8 bg-black/20 text-white/45 hover:text-white"}`}>{value}</button>)}</div></fieldset>

    <div><p className="text-sm font-bold">Quick palettes</p><div className="mt-3 grid gap-2 sm:grid-cols-5">{presets.map(preset=><button key={preset.name} type="button" disabled={disabled} onClick={()=>applyPreset(preset)} className="group rounded-xl border border-white/8 bg-black/20 p-2 text-left transition hover:border-white/20 disabled:opacity-40"><span className="block h-8 rounded-lg" style={{background:`linear-gradient(120deg,${preset.start},${preset.end})`}}/><span className="mt-2 block truncate text-[11px] font-semibold text-white/55 group-hover:text-white">{preset.name}</span></button>)}</div></div>

    <div className={`grid gap-3 ${mode==="gradient"?"sm:grid-cols-2":""}`}>
      <ColorPicker label={mode==="gradient"?"Start color":"Accent color"} value={start} onChange={setStart} disabled={disabled}/>
      {mode==="gradient"?<ColorPicker label="End color" value={end} onChange={setEnd} disabled={disabled}/>:null}
    </div>
    <button disabled={disabled} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-bold text-black disabled:opacity-40"><Check className="size-4"/>Save appearance</button>
  </form>;
}

function ColorPicker({ label, value, onChange, disabled }: { label: string; value: string; onChange: (value: string)=>void; disabled: boolean }) { return <label className="block"><span className="text-sm font-bold">{label}</span><span className="mt-2 flex min-h-12 items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-3"><input type="color" value={value} onChange={event=>onChange(event.target.value)} disabled={disabled} className="size-8 cursor-pointer rounded border-0 bg-transparent p-0"/><code className="text-sm uppercase text-white/65">{value}</code></span></label>; }

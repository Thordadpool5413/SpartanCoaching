export type MeasureStatus='reported'|'censored'|'suppressed'|'missing'|'invalid';
export type MeasureQualifier='less_than'|'greater_than'|null;
export type MeasureValue={value:number|null;status:MeasureStatus;qualifier:MeasureQualifier;raw:string};
const text=(v:unknown)=>String(v??'').trim();
export function measureValue(v:unknown):MeasureValue{const raw=text(v),lower=raw.toLowerCase();if(!raw)return{value:null,status:'missing',qualifier:null,raw};if(['na','n/a','not available','not applicable','--'].includes(lower)||/^\*+$/.test(raw)||/suppressed|not report|too few|insufficient|denominator.*less than/i.test(raw))return{value:null,status:'suppressed',qualifier:null,raw};const censored=raw.match(/^\s*([<>])\s*\$?\s*([-+]?\d*\.?\d+)\s*%?\s*$/);if(censored){const n=Number(censored[2]);return Number.isFinite(n)?{value:n,status:'censored',qualifier:censored[1]==='<'?'less_than':'greater_than',raw}:{value:null,status:'invalid',qualifier:null,raw};}const n=Number(raw.replace(/[$,%*,]/g,''));return Number.isFinite(n)?{value:n,status:'reported',qualifier:null,raw}:{value:null,status:'invalid',qualifier:null,raw};}
export const numericValue=(v:unknown)=>measureValue(v).value;
export const exactNumericValue=(v:unknown)=>{const m=measureValue(v);return m.status==='reported'?m.value:null;};
export const numberOrZero=(v:unknown)=>numericValue(v)??0;
export const isUnavailable=(v:unknown)=>{const s=measureValue(v).status;return s==='missing'||s==='suppressed'||s==='invalid';};

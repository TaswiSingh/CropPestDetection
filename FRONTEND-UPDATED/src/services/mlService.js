import {sensors} from '../data/sensors';
// Reference contract mirrors the repository's UniversalSensorLoader: 9 sensor channels,
// with baseline -> acquisition -> recovery samples. Temperature/humidity are field context,
// not features in the supplied 72-feature XGBoost models.
export function buildSensorReadings(values){
 const nBase=300,nAcq=1200,nRec=600,total=nBase+nAcq+nRec; const out={Time_s:[],Phase:[]};
 sensors.forEach(s=>out[s.key]=[]);
 for(let i=0;i<total;i++){
  const t=i*.1; const phase=i<nBase?'baseline':i<nBase+nAcq?'acquisition':'recovery'; out.Time_s.push(t); out.Phase.push(phase);
  sensors.forEach((s,idx)=>{const v=values[s.key]??0; let x=v; if(phase==='baseline') x=0; else if(phase==='acquisition'){const p=(i-nBase)/nAcq; x=v*(0.25+0.75*Math.min(1,p*5)) + Math.sin(i/35+idx)*Math.abs(v)*.025;} else {const p=(i-nBase-nAcq)/nRec; x=v*(1-p)*.25; } out[s.key].push(x);});
 }
 return out;
}
function mockPrediction(values){
 const no2=Math.max(0,values.MiCS_NO2), nh3=Math.max(0,values.MiCS_NH3), co=Math.max(0,values.MiCS_CO), other=sensors.filter(s=>!['MiCS_NO2','MiCS_NH3','MiCS_CO'].includes(s.key)).reduce((a,s)=>a+Math.max(0,values[s.key]),0)/6;
 const nitrogen=(no2*.55+nh3*.45); const pestScore=nitrogen*.72+other*.20+co*.08;
 let pred_L1='Control'; if(pestScore>.48) pred_L1='Pest'; else if(pestScore>.27) pred_L1='Mechanical';
 let pred_L2=null; if(pred_L1==='Pest'){ if(pestScore>.68) pred_L2='High'; else if(pestScore>.49) pred_L2='Medium'; else pred_L2='Low'; }
 const confidence=Math.min(.99,.55+pestScore*.5);
 const advisory=pred_L1==='Pest'?`Pest signal detected (${pred_L2}). Inspect affected plants and begin targeted integrated pest management.`:pred_L1==='Mechanical'?'Mechanical-stress pattern detected. Inspect handling, wind, irrigation and physical damage.':'No strong pest signature detected. Continue routine monitoring.';
 return {pred_L1,pred_L2,confidence,advisory,qa_issues:[],mode:'Demo simulator'};
}
export async function predict({values,temperature,humidity,meta}){
 const readings=buildSensorReadings(values);
 const payload={readings,meta:{...meta,temperature,humidity}};
 const endpoint=import.meta.env.VITE_API_URL;
 if(endpoint){try{const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});if(!r.ok)throw new Error('API '+r.status);return {...await r.json(),mode:'FastAPI /predict'};}catch(e){console.warn('API unavailable; using simulator',e);}}
 return mockPrediction(values);
}
import { useState, useRef, useCallback, useEffect } from "react";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, doc, deleteDoc, updateDoc, query, where, orderBy, or } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ─── FIREBASE CONFIG ──────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyBCx8aBwZwCkaFVbW-nh8K1xUp9jgMmGwU",
  authDomain: "ieval-pro.firebaseapp.com",
  projectId: "ieval-pro",
  storageBucket: "ieval-pro.firebasestorage.app",
  messagingSenderId: "189597065006",
  appId: "1:189597065006:web:dee92d681102bf02e224bf",
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// ─── FIREBASE API ─────────────────────────────────────────────────────────────
const API = {
  getUsers: async () => {
    const snap = await getDocs(collection(db, "app_users"));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  findUser: async (username) => {
    const q = query(collection(db, "app_users"), where("username", "==", username));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  createUser: async (user) => {
    const { id, ...data } = user;
    await addDoc(collection(db, "app_users"), { ...data, fireId: id });
    return user;
  },
  updateUser: async (id, data) => {
    const q = query(collection(db, "app_users"), where("fireId", "==", id));
    const snap = await getDocs(q);
    if (!snap.empty) await updateDoc(snap.docs[0].ref, data);
  },
  deleteUser: async (id) => {
    const q = query(collection(db, "app_users"), where("fireId", "==", id));
    const snap = await getDocs(q);
    if (!snap.empty) await deleteDoc(snap.docs[0].ref);
  },
  getRecords: async () => {
    const snap = await getDocs(query(collection(db, "records"), orderBy("date", "desc")));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  createRecord: async (rec) => {
    await addDoc(collection(db, "records"), rec);
    return rec;
  },
  searchRecords: async (q) => {
    const snap = await getDocs(collection(db, "records"));
    const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const lq = q.toLowerCase();
    return all.filter(r =>
      (r.device?.model||"").toLowerCase().includes(lq) ||
      (r.client?.nombre||"").toLowerCase().includes(lq) ||
      (r.client?.apellido||"").toLowerCase().includes(lq) ||
      (r.device?.imei||"").includes(q)
    ).sort((a,b) => new Date(b.date) - new Date(a.date));
  },
};

// ─── LOCAL STORAGE (session only) ─────────────────────────────────────────────
const LS = {
  get: (k, fb) => { try { return JSON.parse(localStorage.getItem(k) ?? "null") ?? fb; } catch { return fb; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};




// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const MODELS = [
  "iPhone 7","iPhone 7 Plus","iPhone 8","iPhone 8 Plus",
  "iPhone SE (1ra Gen)","iPhone SE (2da Gen)","iPhone SE (3ra Gen)",
  "iPhone X","iPhone XR","iPhone XS","iPhone XS Max",
  "iPhone 11","iPhone 11 Pro","iPhone 11 Pro Max",
  "iPhone 12 Mini","iPhone 12","iPhone 12 Pro","iPhone 12 Pro Max",
  "iPhone 13 Mini","iPhone 13","iPhone 13 Pro","iPhone 13 Pro Max",
  "iPhone 14","iPhone 14 Plus","iPhone 14 Pro","iPhone 14 Pro Max",
  "iPhone 15","iPhone 15 Plus","iPhone 15 Pro","iPhone 15 Pro Max",
  "iPhone 16","iPhone 16 Plus","iPhone 16 Pro","iPhone 16 Pro Max",
  "iPhone 17","iPhone 17 Air","iPhone 17 Pro","iPhone 17 Pro Max",
  "iPhone 18","iPhone 18 Plus","iPhone 18 Pro","iPhone 18 Pro Max",
];
const COLORS = ["Negro","Blanco","Azul","Morado","Verde","Rojo","Dorado","Plata","Titanio Natural","Titanio Negro","Titanio Blanco","Titanio Azul","Otro"];
const CAPACITIES = ["64GB","128GB","256GB","512GB","1TB"];
const CHECKLIST = [
  { id:"pantalla",      label:"Pantalla",       cat:"Hardware" },
  { id:"bocinas",       label:"Bocinas",         cat:"Hardware" },
  { id:"microfono",     label:"Micrófono",       cat:"Hardware" },
  { id:"camara_frontal",label:"Cámara Frontal",  cat:"Hardware" },
  { id:"camara_trasera",label:"Cámara Trasera",  cat:"Hardware" },
  { id:"face_id",       label:"Face ID",         cat:"Biometría" },
  { id:"touch",         label:"Touch / Tacto",   cat:"Hardware" },
  { id:"botones",       label:"Botones",         cat:"Hardware" },
  { id:"pin_carga",     label:"Pin de Carga",    cat:"Conectividad" },
  { id:"wifi",          label:"Wi-Fi",           cat:"Conectividad" },
  { id:"bluetooth",     label:"Bluetooth",       cat:"Conectividad" },
  { id:"vibrador",      label:"Vibrador",        cat:"Hardware" },
  { id:"bateria",       label:"Batería",         cat:"Energía" },
  { id:"true_tone",     label:"True Tone",       cat:"Pantalla" },
];
const STATUS_MAP = { perfect:10, detail:5, broken:0 };
const PRICE_BASE = {
  "iPhone 18 Pro Max":62000,"iPhone 18 Pro":52000,"iPhone 18 Plus":43000,"iPhone 18":36000,
  "iPhone 17 Pro Max":50000,"iPhone 17 Pro":42000,"iPhone 17 Air":34000,"iPhone 17":29000,
  "iPhone 16 Pro Max":40000,"iPhone 16 Pro":33000,"iPhone 16 Plus":26000,"iPhone 16":22000,
  "iPhone 15 Pro Max":34000,"iPhone 15 Pro":28000,"iPhone 15 Plus":22000,"iPhone 15":18000,
  "iPhone 14 Pro Max":26000,"iPhone 14 Pro":21000,"iPhone 14 Plus":16000,"iPhone 14":13500,
  "iPhone 13 Pro Max":19000,"iPhone 13 Pro":15500,"iPhone 13 Mini":9500,"iPhone 13":12000,
  "iPhone 12 Pro Max":13500,"iPhone 12 Pro":11000,"iPhone 12 Mini":7000,"iPhone 12":9000,
  "iPhone 11 Pro Max":10500,"iPhone 11 Pro":8500,"iPhone 11":6500,
  "iPhone SE (3ra Gen)":6000,"iPhone SE (2da Gen)":4500,"iPhone SE (1ra Gen)":2000,
  "iPhone XS Max":7500,"iPhone XS":6500,"iPhone XR":5500,"iPhone X":5000,
  "iPhone 8 Plus":3500,"iPhone 8":2800,"iPhone 7 Plus":2500,"iPhone 7":2000,
};
const CAP_MULT = {"64GB":1,"128GB":1.1,"256GB":1.2,"512GB":1.35,"1TB":1.5};

// ─── LOCAL SESSION ────────────────────────────────────────────────────────────
const getSession = () => { try { return JSON.parse(localStorage.getItem("ieval_session")||"null"); } catch { return null; } };
const setSession = v => { try { localStorage.setItem("ieval_session", JSON.stringify(v)); } catch {} };

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const dop = v => `RD$ ${Number(v).toLocaleString("es-DO")}`;
const getScoreLabel = s =>
  s>=85?{label:"Excelente",color:"#30d158",bg:"rgba(48,209,88,0.15)"}
  :s>=70?{label:"Bueno",   color:"#ffd60a",bg:"rgba(255,214,10,0.12)"}
  :s>=50?{label:"Regular", color:"#ff9f0a",bg:"rgba(255,159,10,0.12)"}
  :       {label:"Riesgoso",color:"#ff453a",bg:"rgba(255,69,58,0.12)"};

const calcSuggested = (device, score) => {
  if(!device.model||score===null) return null;
  const base=PRICE_BASE[device.model]||5000;
  const raw=base*(CAP_MULT[device.capacity]||1)*(score/100)
    *(device.battery?(parseInt(device.battery)/100)*0.15+0.85:1)
    *(device.unlocked==="si"?1:0.88)*(device.icloud==="si"?1:0.75);
  return Math.round(raw/500)*500;
};

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const T = {
  bg:"#000000", bg2:"#1c1c1e", bg3:"#2c2c2e", bg4:"#3a3a3c",
  label:"#ffffff", label2:"rgba(235,235,245,0.8)", label3:"rgba(235,235,245,0.6)", label4:"rgba(235,235,245,0.3)",
  blue:"#0a84ff", green:"#30d158", yellow:"#ffd60a", orange:"#ff9f0a", red:"#ff453a",
  sep:"rgba(84,84,88,0.65)",
};

const iStyle = { background:T.bg2, border:`1px solid ${T.sep}`, borderRadius:10, padding:"12px 14px", color:T.label, fontSize:16, outline:"none", width:"100%", boxSizing:"border-box", fontFamily:"inherit" };
const sStyle = { ...iStyle, cursor:"pointer" };

// ─── SHARED UI ────────────────────────────────────────────────────────────────
function Field({ label, children, required, note }) {
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:7 }}>
      <div style={{ display:"flex",alignItems:"baseline",justifyContent:"space-between" }}>
        <label style={{ fontSize:13,color:T.label2,fontWeight:500 }}>{label}{required&&<span style={{ color:T.red,marginLeft:4 }}>*</span>}</label>
        {note&&<span style={{ fontSize:11,color:T.label3 }}>{note}</span>}
      </div>
      {children}
    </div>
  );
}

function PhotoUpload({ label, value, onChange, required }) {
  const r=useRef(null);
  return (
    <div onClick={()=>r.current.click()} style={{ background:T.bg2,border:`1px solid ${value?"rgba(10,132,255,0.5)":T.sep}`,borderRadius:12,padding:"13px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:12 }}>
      <input ref={r} type="file" accept="image/*" capture="environment" style={{ display:"none" }}
        onChange={e=>{ const f=e.target.files[0]; if(!f) return; const rd=new FileReader(); rd.onload=ev=>onChange(ev.target.result); rd.readAsDataURL(f); }}/>
      {value?<img src={value} alt={label} style={{ width:44,height:44,objectFit:"cover",borderRadius:8,flexShrink:0 }}/>
        :<div style={{ width:44,height:44,borderRadius:8,background:T.bg3,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0 }}>📷</div>}
      <div style={{ flex:1 }}>
        <div style={{ fontSize:15,color:T.label,fontWeight:500 }}>{label}</div>
        {required&&!value&&<div style={{ fontSize:12,color:T.orange,marginTop:2 }}>Requerida</div>}
      </div>
      {value?<div style={{ width:22,height:22,borderRadius:11,background:T.blue,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:"#fff",flexShrink:0 }}>✓</div>
        :<div style={{ color:T.label4,fontSize:18 }}>›</div>}
    </div>
  );
}

function SignaturePad({ onSave }) {
  const c=useRef(null); const [drawing,setDrawing]=useState(false); const [hasSig,setHasSig]=useState(false);
  const gp=(e,cv)=>{ const r=cv.getBoundingClientRect(),s=e.touches?e.touches[0]:e; return {x:s.clientX-r.left,y:s.clientY-r.top}; };
  const start=useCallback(e=>{ e.preventDefault(); const ctx=c.current.getContext("2d"),p=gp(e,c.current); ctx.beginPath(); ctx.moveTo(p.x,p.y); setDrawing(true); },[]);
  const draw=useCallback(e=>{ e.preventDefault(); if(!drawing) return; const ctx=c.current.getContext("2d"),p=gp(e,c.current); ctx.lineTo(p.x,p.y); ctx.strokeStyle=T.blue; ctx.lineWidth=2.5; ctx.lineCap="round"; ctx.lineJoin="round"; ctx.stroke(); setHasSig(true); },[drawing]);
  const end=useCallback(()=>{ setDrawing(false); if(hasSig) onSave(c.current.toDataURL()); },[hasSig,onSave]);
  const clear=()=>{ c.current.getContext("2d").clearRect(0,0,400,120); setHasSig(false); onSave(null); };
  return (
    <div>
      <canvas ref={c} width={400} height={120} onMouseDown={start} onMouseMove={draw} onMouseUp={end} onMouseLeave={end} onTouchStart={start} onTouchMove={draw} onTouchEnd={end}
        style={{ background:T.bg2,border:`1px solid ${T.sep}`,borderRadius:12,cursor:"crosshair",touchAction:"none",width:"100%",display:"block" }}/>
      <button onClick={clear} style={{ marginTop:8,background:"transparent",border:"none",color:T.blue,fontSize:14,cursor:"pointer",padding:0,fontFamily:"inherit" }}>Limpiar firma</button>
    </div>
  );
}

function AppleBtn({ children, onClick, disabled, color=T.blue, style:s={} }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ width:"100%",padding:"15px",borderRadius:14,border:"none",background:disabled?"rgba(255,255,255,0.08)":color,color:disabled?"rgba(255,255,255,0.25)":"#fff",fontSize:17,fontWeight:600,fontFamily:"inherit",cursor:disabled?"not-allowed":"pointer",transition:"opacity 0.15s",letterSpacing:"-0.02em",...s }}>
      {children}
    </button>
  );
}

function AppleHeader({ title, onBack, right, subtitle }) {
  return (
    <div style={{ background:T.bg,borderBottom:`1px solid ${T.sep}`,padding:"14px 20px 12px",display:"flex",alignItems:"center",gap:10,position:"sticky",top:0,zIndex:10 }}>
      {onBack&&<button onClick={onBack} style={{ background:"transparent",border:"none",color:T.blue,fontSize:22,cursor:"pointer",padding:"0 4px 0 0",fontFamily:"inherit",lineHeight:1,flexShrink:0 }}>‹</button>}
      <div style={{ flex:1 }}>
        <div style={{ fontSize:17,fontWeight:600,color:T.label,letterSpacing:"-0.02em" }}>{title}</div>
        {subtitle&&<div style={{ fontSize:12,color:T.label3,marginTop:1 }}>{subtitle}</div>}
      </div>
      {right}
    </div>
  );
}

function Card({ children, style:s={} }) {
  return <div style={{ background:T.bg2,borderRadius:16,overflow:"hidden",...s }}>{children}</div>;
}

function SectionHeader({ children }) {
  return <div style={{ fontSize:13,color:T.label3,textTransform:"uppercase",letterSpacing:"0.04em",padding:"0 4px",marginBottom:6,marginTop:4 }}>{children}</div>;
}

function Spinner({ size=40, color=T.blue }) {
  return <div style={{ width:size,height:size,borderRadius:size/2,border:`3px solid ${T.bg3}`,borderTopColor:color,animation:"spin 0.8s linear infinite",margin:"0 auto" }}/>;
}

function CloudBadge() {
  return (
    <div style={{ display:"inline-flex",alignItems:"center",gap:5,background:"rgba(10,132,255,0.12)",borderRadius:20,padding:"3px 10px",fontSize:12,color:T.blue }}>
      ☁️ Firebase — Base de datos en la nube
    </div>
  );
}

// ─── APP ICON ─────────────────────────────────────────────────────────────────
function AppIcon({ size=80 }) {
  const s=size;
  return (
    <div style={{ width:s,height:s,borderRadius:s*0.22,overflow:"hidden",flexShrink:0,boxShadow:"0 8px 32px rgba(0,0,0,0.6)" }}>
      <svg width={s} height={s} viewBox="0 0 80 80" fill="none">
        <defs>
          <linearGradient id="iconBg" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1a1a2e"/><stop offset="100%" stopColor="#0d0d1a"/>
          </linearGradient>
          <linearGradient id="phoneGrad" x1="24" y1="10" x2="56" y2="70" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2196f3"/><stop offset="40%" stopColor="#0a84ff"/><stop offset="100%" stopColor="#5e5ce6"/>
          </linearGradient>
          <linearGradient id="screenGrad" x1="28" y1="18" x2="52" y2="62" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0d1f3c"/><stop offset="100%" stopColor="#060d1a"/>
          </linearGradient>
          <linearGradient id="shineGrad" x1="24" y1="10" x2="44" y2="35" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="white" stopOpacity="0.14"/><stop offset="100%" stopColor="white" stopOpacity="0"/>
          </linearGradient>
          <filter id="softShadow"><feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#0a84ff" floodOpacity="0.4"/></filter>
        </defs>
        <rect width="80" height="80" fill="url(#iconBg)"/>
        <line x1="0" y1="26.6" x2="80" y2="26.6" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5"/>
        <line x1="0" y1="53.3" x2="80" y2="53.3" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5"/>
        <line x1="26.6" y1="0" x2="26.6" y2="80" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5"/>
        <line x1="53.3" y1="0" x2="53.3" y2="80" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5"/>
        <rect x="25" y="13" width="30" height="54" rx="7" fill="rgba(0,0,0,0.4)" transform="translate(1,2)"/>
        <rect x="25" y="11" width="30" height="54" rx="7" fill="url(#phoneGrad)" filter="url(#softShadow)"/>
        <rect x="25" y="11" width="30" height="54" rx="7" fill="url(#shineGrad)"/>
        <rect x="28.5" y="18" width="23" height="35" rx="3.5" fill="url(#screenGrad)"/>
        <rect x="35" y="11" width="10" height="4.5" rx="2.25" fill="#050a15"/>
        <rect x="33" y="68.5" width="14" height="2.5" rx="1.25" fill="rgba(255,255,255,0.25)"/>
        <rect x="21" y="24" width="2.5" height="7" rx="1.25" fill="rgba(255,255,255,0.2)"/>
        <rect x="21" y="33.5" width="2.5" height="5.5" rx="1.25" fill="rgba(255,255,255,0.2)"/>
        <rect x="56.5" y="28" width="2.5" height="10" rx="1.25" fill="rgba(255,255,255,0.2)"/>
        <circle cx="40" cy="34.5" r="9" fill="rgba(10,132,255,0.15)" stroke="#0a84ff" strokeWidth="1.8"/>
        <polyline points="36,34.5 39,37.5 44.5,30.5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <circle cx="68" cy="12" r="2.5" fill="rgba(10,132,255,0.5)"/>
        <circle cx="68" cy="19" r="2" fill="rgba(10,132,255,0.3)"/>
        <circle cx="68" cy="25" r="1.5" fill="rgba(10,132,255,0.15)"/>
      </svg>
    </div>
  );
}

// ─── HOME SCREEN ──────────────────────────────────────────────────────────────
function HomeScreen({ onNav, session, onLogout }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInventory, setShowInventory] = useState(false);

  useEffect(() => {
    API.getRecords().then(r => { setRecords(r||[]); setLoading(false); }).catch(()=>setLoading(false));
  }, []);

  if (showInventory) return (
    <div style={{ minHeight:"100vh",background:T.bg }}>
      <AppleHeader title={`Inventario (${records.length})`} onBack={()=>setShowInventory(false)}/>
      <div style={{ padding:"16px" }}>
        {records.length===0
          ? <div style={{ textAlign:"center",color:T.label3,padding:"48px 0",fontSize:16 }}>Sin equipos registrados aún</div>
          : <Card>
              {records.map((rec,i)=>{
                const sl=getScoreLabel(rec.score);
                const d=rec.device||{}; const cl=rec.client||{};
                return (
                  <div key={rec.id} style={{ display:"flex",alignItems:"center",gap:12,padding:"13px 16px",borderBottom:i===records.length-1?'none':`1px solid ${T.sep}` }}>
                    <div style={{ width:40,height:40,borderRadius:10,background:"#1c1c2e",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0 }}>📱</div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontSize:15,fontWeight:500,color:T.label,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{d.model} {d.capacity}</div>
                      <div style={{ fontSize:13,color:T.label3 }}>{cl.nombre} {cl.apellido}</div>
                      <div style={{ fontSize:12,color:T.label4 }}>{new Date(rec.date).toLocaleDateString("es-DO")} · {rec.registered_by}</div>
                    </div>
                    <div style={{ textAlign:"right",flexShrink:0 }}>
                      <div style={{ fontSize:15,fontWeight:600,color:T.green }}>{dop(rec.purchase_price)}</div>
                      <div style={{ fontSize:12,color:sl.color }}>{sl.label}</div>
                    </div>
                  </div>
                );
              })}
            </Card>
        }
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh",background:T.bg,paddingBottom:40 }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 20px 0" }}>
        <div style={{ fontSize:13,color:T.label3 }}>{session?`${session.role==="admin"?"👑 ":""}${session.name}`:""}</div>
        {session&&<button onClick={onLogout} style={{ fontSize:14,color:T.blue,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit" }}>Salir</button>}
      </div>

      <div style={{ padding:"24px 24px 28px",textAlign:"center" }}>
        <div style={{ display:"flex",justifyContent:"center",marginBottom:18 }}><AppIcon size={88}/></div>
        <div style={{ fontSize:34,fontWeight:700,color:T.label,letterSpacing:"-0.03em",lineHeight:1.1,marginBottom:6 }}>iEval Pro</div>
        <div style={{ fontSize:15,color:T.label3,marginBottom:14 }}>Compra y Evaluación de iPhones</div>
        <CloudBadge/>
        <div onClick={()=>setShowInventory(true)} style={{ marginTop:10,display:"inline-flex",alignItems:"center",gap:7,background:T.bg2,borderRadius:20,padding:"6px 14px",fontSize:14,color:T.label2,marginLeft:8,cursor:"pointer" }}>
          📦 {loading?"…":records.length} en inventario ›
        </div>
      </div>

      <div style={{ padding:"0 16px",display:"flex",flexDirection:"column",gap:20,maxWidth:"100%" }}>
        <div>
          <SectionHeader>Acciones</SectionHeader>
          <Card>
            {[
              { key:"register", emoji:"➕", bg:"#0a84ff", title:"Registrar iPhone",  desc:"Evalúa y registra un equipo", locked:!session },
              { key:"search",   emoji:"🔍", bg:"#5e5ce6", title:"Buscar Registro",   desc:"Por nombre, IMEI o modelo",  locked:!session },
              { key:"imei",     emoji:"🛡️", bg:"#30d158", title:"IMEI Check",         desc:"Verifica si está clean o blacklisted", locked:false },
            ].map((item,i,arr)=>(
              <div key={item.key} onClick={()=>onNav(item.key)}
                style={{ display:"flex",alignItems:"center",gap:12,padding:"13px 16px",borderBottom:i===arr.length-1?'none':`1px solid ${T.sep}`,cursor:"pointer",transition:"background 0.1s" }}
                onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.04)"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <div style={{ width:36,height:36,borderRadius:9,background:item.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0 }}>{item.emoji}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:16,fontWeight:500,color:T.label }}>{item.title}</div>
                  <div style={{ fontSize:13,color:T.label3 }}>{item.locked?"🔒 Requiere sesión":item.desc}</div>
                </div>
                <div style={{ color:T.label4,fontSize:20 }}>›</div>
              </div>
            ))}
          </Card>
        </div>

        {session?.role==="admin"&&(
          <div>
            <SectionHeader>Administración</SectionHeader>
            <Card>
              <div onClick={()=>onNav("admin")} style={{ display:"flex",alignItems:"center",gap:12,padding:"13px 16px",cursor:"pointer" }}
                onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.04)"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <div style={{ width:36,height:36,borderRadius:9,background:"#ff9f0a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0 }}>👑</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:16,fontWeight:500,color:T.label }}>Panel de Usuarios</div>
                  <div style={{ fontSize:13,color:T.label3 }}>Gestiona tu equipo</div>
                </div>
                <div style={{ color:T.label4,fontSize:20 }}>›</div>
              </div>
            </Card>
          </div>
        )}

        {!session&&(
          <div style={{ background:T.bg2,borderRadius:16,padding:"14px 16px",display:"flex",gap:10 }}>
            <span style={{ fontSize:16 }}>ℹ️</span>
            <div style={{ fontSize:14,color:T.label3,lineHeight:1.5 }}>
              <span style={{ color:T.label }}>Registrar</span> y <span style={{ color:T.label }}>Buscar</span> requieren sesión. El <span style={{ color:T.label }}>IMEI Check</span> es libre para todos.
            </div>
          </div>
        )}

        {records.length>0&&(
          <div>
            <SectionHeader>Compras Recientes</SectionHeader>
            <Card>
              {records.slice(0,4).map((rec,i,arr)=>{
                const sl=getScoreLabel(rec.score);
                const d=rec.device||{}; const cl=rec.client||{};
                return (
                  <div key={rec.id} style={{ display:"flex",alignItems:"center",gap:12,padding:"13px 16px",borderBottom:i===arr.length-1?'none':`1px solid ${T.sep}` }}>
                    <div style={{ width:40,height:40,borderRadius:10,background:"#1c1c2e",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0 }}>📱</div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontSize:15,fontWeight:500,color:T.label,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{d.model}</div>
                      <div style={{ fontSize:13,color:T.label3 }}>{cl.nombre} {cl.apellido}</div>
                    </div>
                    <div style={{ textAlign:"right",flexShrink:0 }}>
                      <div style={{ fontSize:15,fontWeight:600,color:T.green }}>{dop(rec.purchase_price)}</div>
                      <div style={{ fontSize:12,color:sl.color }}>{sl.label}</div>
                    </div>
                  </div>
                );
              })}
            </Card>
          </div>
        )}

        <div style={{ textAlign:"center",paddingTop:12,paddingBottom:4 }}>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:6 }}>
            <div style={{ height:0.5,width:40,background:`linear-gradient(to right,transparent,${T.sep})` }}/>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke={T.blue} strokeWidth="1.5" opacity="0.7"/><circle cx="12" cy="12" r="4" stroke={T.blue} strokeWidth="1.5" opacity="0.9"/><circle cx="12" cy="12" r="1.5" fill={T.blue}/></svg>
            <div style={{ height:0.5,width:40,background:`linear-gradient(to left,transparent,${T.sep})` }}/>
          </div>
          <div style={{ fontSize:15,fontWeight:700,color:T.label,letterSpacing:"0.08em" }}>LuzConexion</div>
          <div style={{ fontSize:12,color:T.label4,marginTop:3 }}>iEval Pro · v2.0 Cloud</div>
        </div>
      </div>
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin, onBack, onRegister }) {
  const [username,setUsername]=useState(""); const [password,setPassword]=useState(""); const [error,setError]=useState(""); const [loading,setLoading]=useState(false);
  const handleLogin=async()=>{
    setLoading(true); setError("");
    try {
      const results = await API.findUser(username.trim().toLowerCase());
      const user = results?.[0];
      if(user && user.password===password) {
        if(user.verified===false) { setError("Tu cuenta está pendiente de aprobación por un administrador."); setLoading(false); return; }
        onLogin(user);
      }
      else { setError("Usuario o contraseña incorrectos"); }
    } catch(e) {
      setError("Error de conexión. Verifica tu internet.");
    }
    setLoading(false);
  };
  return (
    <div style={{ minHeight:"100vh",background:T.bg,display:"flex",flexDirection:"column" }}>
      <AppleHeader title="Iniciar Sesión" onBack={onBack}/>
      <div style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"0 24px 60px" }}>
        <div style={{ width:"100%",maxWidth:380 }}>
          <div style={{ textAlign:"center",marginBottom:40 }}>
            <div style={{ display:"flex",justifyContent:"center",marginBottom:16 }}><AppIcon size={72}/></div>
            <div style={{ fontSize:24,fontWeight:700,color:T.label,letterSpacing:"-0.02em",marginBottom:6 }}>Bienvenido</div>
            <div style={{ fontSize:15,color:T.label3 }}>Ingresa con tu cuenta de LuzConexion</div>
          </div>
          <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
            <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="Usuario" style={{ ...iStyle,fontSize:17 }} autoCapitalize="none" onKeyDown={e=>e.key==="Enter"&&handleLogin()}/>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Contraseña" style={{ ...iStyle,fontSize:17 }} onKeyDown={e=>e.key==="Enter"&&handleLogin()}/>
            {error&&<div style={{ fontSize:14,color:T.red,textAlign:"center",padding:"10px 14px",background:"rgba(255,69,58,0.1)",borderRadius:10 }}>{error}</div>}
            <div style={{ marginTop:4 }}>
              {loading?<div style={{ padding:16,textAlign:"center" }}><Spinner/></div>
                :<AppleBtn onClick={handleLogin} disabled={!username||!password}>Entrar</AppleBtn>}
            </div>
            <div style={{ textAlign:"center",marginTop:8 }}>
              <span style={{ fontSize:14,color:T.label3 }}>¿No tienes cuenta? </span>
              <button onClick={onRegister} style={{ fontSize:14,color:T.blue,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:600 }}>Regístrate</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── REGISTER USER SCREEN ─────────────────────────────────────────────────────
function RegisterUserScreen({ onBack, onSuccess }) {
  const [form, setForm] = useState({ name:"", username:"", email:"", password:"", confirm:"" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const isValidEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleRegister = async () => {
    if (!form.name||!form.username||!form.email||!form.password) { setError("Completa todos los campos"); return; }
    if (!isValidEmail(form.email)) { setError("Ingresa un correo electrónico válido"); return; }
    if (form.password !== form.confirm) { setError("Las contraseñas no coinciden"); return; }
    if (form.password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres"); return; }
    setLoading(true); setError("");
    try {
      const existing = await API.findUser(form.username.trim().toLowerCase());
      if (existing?.length > 0) { setError("Ese nombre de usuario ya existe"); setLoading(false); return; }
      const newUser = {
        id: `u-${Date.now()}`,
        username: form.username.trim().toLowerCase(),
        password: form.password,
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        role: "empleado",
        verified: false,
      };
      await API.createUser(newUser);
      setDone(true);
    } catch(e) { setError("Error al crear cuenta. Intenta de nuevo."); }
    setLoading(false);
  };

  if (done) return (
    <div style={{ minHeight:"100vh",background:T.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24 }}>
      <div style={{ maxWidth:380,width:"100%",textAlign:"center" }}>
        <div style={{ fontSize:72,marginBottom:20 }}>📧</div>
        <div style={{ fontSize:24,fontWeight:700,color:T.label,marginBottom:10 }}>¡Cuenta Creada!</div>
        <div style={{ fontSize:15,color:T.label3,marginBottom:28,lineHeight:1.6 }}>
          Tu solicitud fue enviada. Un administrador de <strong style={{ color:T.label }}>LuzConexion</strong> debe aprobar tu cuenta antes de que puedas acceder.
        </div>
        <div style={{ background:T.bg2,borderRadius:14,padding:"16px",marginBottom:24,textAlign:"left" }}>
          <div style={{ fontSize:13,color:T.label3,marginBottom:4 }}>Cuenta registrada como</div>
          <div style={{ fontSize:16,fontWeight:600,color:T.label }}>{form.name}</div>
          <div style={{ fontSize:14,color:T.label3 }}>@{form.username} · {form.email}</div>
        </div>
        <AppleBtn onClick={onBack}>Volver al Login</AppleBtn>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh",background:T.bg,display:"flex",flexDirection:"column" }}>
      <AppleHeader title="Crear Cuenta" onBack={onBack}/>
      <div style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"0 24px 60px" }}>
        <div style={{ width:"100%",maxWidth:380 }}>
          <div style={{ textAlign:"center",marginBottom:32 }}>
            <div style={{ display:"flex",justifyContent:"center",marginBottom:16 }}><AppIcon size={72}/></div>
            <div style={{ fontSize:24,fontWeight:700,color:T.label,letterSpacing:"-0.02em",marginBottom:6 }}>Nueva Cuenta</div>
            <div style={{ fontSize:15,color:T.label3 }}>Únete al equipo de LuzConexion</div>
          </div>
          <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
            <input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}
              placeholder="Nombre completo" style={{ ...iStyle,fontSize:17 }}/>
            <input value={form.username} onChange={e=>setForm(p=>({...p,username:e.target.value}))}
              placeholder="Nombre de usuario" style={{ ...iStyle,fontSize:17 }} autoCapitalize="none"/>
            <input type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))}
              placeholder="Correo electrónico" style={{ ...iStyle,fontSize:17 }} autoCapitalize="none"/>
            <input type="password" value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))}
              placeholder="Contraseña (mín. 6 caracteres)" style={{ ...iStyle,fontSize:17 }}/>
            <input type="password" value={form.confirm} onChange={e=>setForm(p=>({...p,confirm:e.target.value}))}
              placeholder="Confirmar contraseña" style={{ ...iStyle,fontSize:17 }}
              onKeyDown={e=>e.key==="Enter"&&handleRegister()}/>
            {error&&<div style={{ fontSize:14,color:T.red,textAlign:"center",padding:"10px 14px",background:"rgba(255,69,58,0.1)",borderRadius:10 }}>{error}</div>}
            <div style={{ marginTop:4 }}>
              {loading?<div style={{ padding:16,textAlign:"center" }}><Spinner/></div>
                :<AppleBtn onClick={handleRegister} disabled={!form.name||!form.username||!form.email||!form.password||!form.confirm} color={T.green}>
                  Crear Cuenta
                </AppleBtn>}
            </div>
            <div style={{ padding:"12px 14px",borderRadius:12,background:T.bg2,fontSize:13,color:T.label3,lineHeight:1.6,textAlign:"center" }}>
              ℹ️ Tu cuenta será revisada por un <strong style={{ color:T.label }}>Administrador</strong> antes de activarse.
            </div>
            <div style={{ textAlign:"center" }}>
              <span style={{ fontSize:14,color:T.label3 }}>¿Ya tienes cuenta? </span>
              <button onClick={onBack} style={{ fontSize:14,color:T.blue,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:600 }}>Inicia sesión</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN PANEL ──────────────────────────────────────────────────────────────
function AdminPanel({ currentUser, onBack }) {
  const [users,setUsers]=useState([]); const [loading,setLoading]=useState(true);
  const [showAdd,setShowAdd]=useState(false);
  const [form,setForm]=useState({ name:"",username:"",password:"",role:"empleado" });
  const [error,setError]=useState(""); const [saving,setSaving]=useState(false);

  useEffect(()=>{ API.getUsers().then(u=>{ setUsers(u||[]); setLoading(false); }).catch(()=>setLoading(false)); },[]);

  const addUser=async()=>{
    if(!form.name||!form.username||!form.password){ setError("Completa todos los campos"); return; }
    setSaving(true);
    try {
      const newUser={ id:`u-${Date.now()}`,username:form.username.trim().toLowerCase(),password:form.password,name:form.name,role:form.role };
      await API.createUser(newUser);
      setUsers(u=>[...u,newUser]); setForm({ name:"",username:"",password:"",role:"empleado" }); setError(""); setShowAdd(false);
    } catch(e) { setError("Error al crear usuario. El usuario ya puede existir."); }
    setSaving(false);
  };

  const deleteUser=async(id)=>{
    if(id===currentUser.id) return;
    if(!window.confirm("¿Eliminar este usuario?")) return;
    try { await API.deleteUser(id); setUsers(u=>u.filter(x=>x.id!==id)); } catch(e) { alert("Error al eliminar"); }
  };

  return (
    <div style={{ minHeight:"100vh",background:T.bg,paddingBottom:40 }}>
      <AppleHeader title="Usuarios" onBack={onBack}
        right={<button onClick={()=>setShowAdd(s=>!s)} style={{ background:"none",border:"none",color:T.blue,fontSize:16,cursor:"pointer",fontFamily:"inherit",fontWeight:500 }}>{showAdd?"Cancelar":"+ Nuevo"}</button>}/>
      <div style={{ padding:"20px 16px",maxWidth:"100%",display:"flex",flexDirection:"column",gap:20 }}>
        <CloudBadge/>
        {showAdd&&(
          <div>
            <SectionHeader>Nuevo Usuario</SectionHeader>
            <Card style={{ padding:16 }}>
              <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
                <input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="Nombre completo" style={iStyle}/>
                <input value={form.username} onChange={e=>setForm(p=>({...p,username:e.target.value}))} placeholder="Usuario (sin espacios)" style={iStyle} autoCapitalize="none"/>
                <input type="password" value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))} placeholder="Contraseña" style={iStyle}/>
                <select value={form.role} onChange={e=>setForm(p=>({...p,role:e.target.value}))} style={sStyle}>
                  <option value="empleado">Empleado</option>
                  <option value="admin">Administrador</option>
                </select>
                {error&&<div style={{ fontSize:13,color:T.red,padding:"8px 12px",background:"rgba(255,69,58,0.1)",borderRadius:8 }}>{error}</div>}
                {saving?<div style={{ padding:12,textAlign:"center" }}><Spinner size={28}/></div>
                  :<AppleBtn onClick={addUser} color={T.green}>Crear Usuario</AppleBtn>}
              </div>
            </Card>
          </div>
        )}
        <div>
          <SectionHeader>Equipo ({users.length})</SectionHeader>
          {loading?<div style={{ padding:40,textAlign:"center" }}><Spinner/></div>:(
            <Card>
              {users.map((u,i)=>(
                <div key={u.id} style={{ display:"flex",alignItems:"center",gap:12,padding:"13px 16px",borderBottom:i===users.length-1?'none':`1px solid ${T.sep}` }}>
                  <div style={{ width:40,height:40,borderRadius:20,background:u.role==="admin"?"rgba(255,159,10,0.15)":u.verified===false?"rgba(255,69,58,0.15)":T.bg3,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0 }}>
                    {u.role==="admin"?"👑":u.verified===false?"⏳":"👤"}
                  </div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontSize:15,fontWeight:500,color:T.label }}>{u.name}</div>
                    <div style={{ fontSize:13,color:T.label3 }}>@{u.username}</div>
                    {u.email&&<div style={{ fontSize:12,color:T.label4 }}>{u.email}</div>}
                  </div>
                  <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:5 }}>
                    <div style={{ fontSize:12,fontWeight:600,padding:"3px 10px",borderRadius:20,background:u.role==="admin"?"rgba(255,159,10,0.15)":"rgba(10,132,255,0.12)",color:u.role==="admin"?T.orange:T.blue }}>
                      {u.role==="admin"?"Admin":"Empleado"}
                    </div>
                    {u.verified===false&&u.id!==currentUser.id&&(
                      <button onClick={async()=>{
                        try {
                          await API.updateUser(u.id,{ verified:true });
                          setUsers(prev=>prev.map(x=>x.id===u.id?{...x,verified:true}:x));
                        } catch(e){ alert("Error al aprobar"); }
                      }} style={{ fontSize:12,color:T.green,background:"rgba(48,209,88,0.1)",border:"1px solid rgba(48,209,88,0.3)",borderRadius:8,padding:"3px 10px",cursor:"pointer",fontFamily:"inherit",fontWeight:600 }}>
                        ✓ Aprobar
                      </button>
                    )}
                    {u.id!==currentUser.id
                      ?<button onClick={()=>deleteUser(u.id)} style={{ fontSize:12,color:T.red,background:"none",border:"none",cursor:"pointer",padding:0,fontFamily:"inherit" }}>Eliminar</button>
                      :<div style={{ fontSize:11,color:T.label4 }}>Tú</div>}
                  </div>
                </div>
              ))}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── SEARCH ───────────────────────────────────────────────────────────────────
function SearchScreen({ onBack }) {
  const [q,setQ]=useState(""); const [results,setResults]=useState([]); const [loading,setLoading]=useState(false); const [searched,setSearched]=useState(false);

  const doSearch=async()=>{
    if(q.trim().length<2) return;
    setLoading(true); setSearched(true);
    try { const r=await API.searchRecords(q.trim()); setResults(r||[]); } catch { setResults([]); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh",background:T.bg,paddingBottom:40 }}>
      <AppleHeader title="Buscar" onBack={onBack}/>
      <div style={{ padding:"16px",maxWidth:"100%" }}>
        <div style={{ display:"flex",gap:8,marginBottom:20 }}>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Nombre, IMEI o modelo…"
            style={{ ...iStyle,fontSize:16,flex:1 }} autoFocus onKeyDown={e=>e.key==="Enter"&&doSearch()}/>
          <button onClick={doSearch} style={{ background:T.blue,border:"none",color:"#fff",borderRadius:10,padding:"0 16px",fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:"inherit",flexShrink:0 }}>Buscar</button>
        </div>
        {loading&&<div style={{ padding:48,textAlign:"center" }}><Spinner/><div style={{ fontSize:15,color:T.label3,marginTop:16 }}>Buscando en la nube…</div></div>}
        {!loading&&searched&&results.length===0&&<div style={{ textAlign:"center",color:T.label3,padding:"48px 0",fontSize:16 }}>Sin resultados para "{q}"</div>}
        {!loading&&results.length>0&&(
          <div>
            <SectionHeader>{results.length} resultado{results.length!==1?"s":""}</SectionHeader>
            <Card>
              {results.map((rec,i)=>{
                const sl=getScoreLabel(rec.score);
                return <RecordRow key={rec.id} rec={rec} sl={sl} last={i===results.length-1}/>;
              })}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function RecordRow({ rec, sl, last }) {
  const [open,setOpen]=useState(false);
  const d=rec.device||{}; const cl=rec.client||{}; const cp=rec.client_photos||{};
  return (
    <div style={{ borderBottom:last&&!open?'none':`1px solid ${T.sep}` }}>
      <div onClick={()=>setOpen(o=>!o)} style={{ display:"flex",alignItems:"center",gap:12,padding:"13px 16px",cursor:"pointer" }}>
        <div style={{ width:42,height:42,borderRadius:10,background:"#1c1c2e",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0 }}>📱</div>
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ fontSize:15,fontWeight:500,color:T.label }}>{d.model} {d.capacity}</div>
          <div style={{ fontSize:13,color:T.label3 }}>{cl.nombre} {cl.apellido} · {d.imei}</div>
          <div style={{ fontSize:12,color:T.label4 }}>{new Date(rec.date).toLocaleDateString("es-DO")} · {rec.registered_by}</div>
        </div>
        <div style={{ textAlign:"right",flexShrink:0 }}>
          <div style={{ fontSize:15,fontWeight:600,color:T.green }}>{dop(rec.purchase_price)}</div>
          <div style={{ fontSize:12,color:sl.color }}>{sl.label}</div>
        </div>
      </div>
      {open&&(
        <div style={{ padding:"0 16px 14px",borderTop:`1px solid ${T.sep}`,paddingTop:10 }}>
          {[["IMEI",d.imei],["Color",d.color||"—"],["Desbloqueado",d.unlocked==="si"?"✅ Sí":"❌ No"],["iCloud libre",d.icloud==="si"?"✅ Sí":"❌ No"],["Batería",d.battery?`${d.battery}%`:"—"],["Score",`${rec.score}/100 — ${sl.label}`],["Pago",rec.payment_method==="transferencia"?"🏦 Transferencia":rec.payment_method==="efectivo"?"💵 Efectivo":"🔄 Cambiazo"],["Registrado por",rec.registered_by]].map(([l,v])=>(
            <div key={l} style={{ display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:`1px solid ${T.sep}`,gap:12 }}>
              <span style={{ fontSize:14,color:T.label3,flexShrink:0 }}>{l}</span>
              <span style={{ fontSize:14,color:T.label,fontWeight:500,textAlign:"right" }}>{v}</span>
            </div>
          ))}
          {rec.trade_in_model&&(
            <div style={{ display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:`1px solid ${T.sep}`,gap:12 }}>
              <span style={{ fontSize:14,color:T.label3 }}>Trade-in</span>
              <span style={{ fontSize:14,color:T.label,fontWeight:500 }}>{rec.trade_in_model}</span>
            </div>
          )}
          {d.comments&&<div style={{ fontSize:13,color:T.label3,marginTop:8,fontStyle:"italic" }}>{d.comments}</div>}
          {cp.persona&&<div style={{ marginTop:10 }}><div style={{ fontSize:11,color:T.label3,marginBottom:6 }}>Foto del cliente</div><img src={cp.persona} alt="cliente" style={{ width:64,height:64,borderRadius:10,objectFit:"cover" }}/></div>}
        </div>
      )}
    </div>
  );
}

// ─── IMEI CHECK ───────────────────────────────────────────────────────────────
function ImeiCheckScreen({ onBack }) {
  const [imei,setImei]=useState(""); const [result,setResult]=useState(null); const [loading,setLoading]=useState(false);
  const check=async()=>{
    if(imei.length<15) return;
    setLoading(true); setResult(null);
    await new Promise(r=>setTimeout(r,1800));
    setResult({ clean:parseInt(imei[imei.length-1])%3!==0,imei });
    setLoading(false);
  };
  return (
    <div style={{ minHeight:"100vh",background:T.bg,paddingBottom:40 }}>
      <AppleHeader title="IMEI Check" onBack={onBack}/>
      <div style={{ padding:"24px 16px",maxWidth:"100%" }}>
        <div style={{ fontSize:15,color:T.label3,marginBottom:20,lineHeight:1.6 }}>Verifica si un IMEI está <span style={{ color:T.green,fontWeight:500 }}>Clean</span> o <span style={{ color:T.red,fontWeight:500 }}>Blacklisted</span>.</div>
        <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
          <input value={imei} onChange={e=>setImei(e.target.value.replace(/\D/g,"").slice(0,15))} placeholder="000000000000000"
            style={{ ...iStyle,fontSize:22,letterSpacing:"0.12em",fontFamily:"monospace",textAlign:"center",padding:"16px" }} inputMode="numeric"/>
          <div style={{ display:"flex",justifyContent:"center",gap:4 }}>
            {Array.from({length:15}).map((_,i)=>(
              <div key={i} style={{ width:6,height:3,borderRadius:2,background:i<imei.length?T.blue:T.bg3,transition:"background 0.1s" }}/>
            ))}
          </div>
          <AppleBtn onClick={check} disabled={imei.length<15||loading} color={T.green}>{loading?"Verificando…":"Verificar IMEI"}</AppleBtn>
        </div>
        {loading&&<div style={{ textAlign:"center",padding:"48px 0" }}><Spinner color={T.green}/><div style={{ fontSize:15,color:T.label3,marginTop:16 }}>Consultando base de datos…</div></div>}
        {result&&!loading&&(
          <div style={{ marginTop:24,padding:28,borderRadius:20,textAlign:"center",background:result.clean?"rgba(48,209,88,0.08)":"rgba(255,69,58,0.08)",border:`1px solid ${result.clean?"rgba(48,209,88,0.3)":"rgba(255,69,58,0.3)"}` }}>
            <div style={{ fontSize:64,marginBottom:12 }}>{result.clean?"✅":"🚫"}</div>
            <div style={{ fontSize:26,fontWeight:700,color:result.clean?T.green:T.red,marginBottom:6,letterSpacing:"-0.02em" }}>{result.clean?"CLEAN":"BLACKLISTED"}</div>
            <div style={{ fontFamily:"monospace",fontSize:14,color:T.label3,letterSpacing:"0.08em",marginBottom:14 }}>{result.imei}</div>
            <div style={{ fontSize:15,color:result.clean?T.label3:"rgba(255,69,58,0.8)",lineHeight:1.6 }}>
              {result.clean?"Este IMEI no presenta reportes negativos. Puedes comprarlo con seguridad.":"⚠️ Reportado como robado, perdido o bloqueado. No recomendamos comprarlo."}
            </div>
          </div>
        )}
        <div style={{ marginTop:20,padding:"14px 16px",borderRadius:12,background:T.bg2,fontSize:13,color:T.label3,lineHeight:1.7 }}>
          Para verificación real conecta <span style={{ color:T.label }}>IMEI Check API</span>, <span style={{ color:T.label }}>CheckMEND</span> o <span style={{ color:T.label }}>GSX de Apple</span>.
        </div>
      </div>
    </div>
  );
}

// ─── REGISTER ─────────────────────────────────────────────────────────────────
function RegisterScreen({ onBack, onSave, session }) {
  const [tab,setTab]=useState(0);
  const [device,setDevice]=useState({ model:"",color:"",capacity:"",imei:"",serial:"",unlocked:"",icloud:"",battery:"",comments:"" });
  const [devicePhotos,setDevicePhotos]=useState({ frontal:null,trasera:null,laterales:null,imei:null,bateria:null });
  const [client,setClient]=useState({ nombre:"",apellido:"",cedula:"",direccion:"",telefono:"",email:"",declaracion:false });
  const [clientPhotos,setClientPhotos]=useState({ persona:null,cedula_front:null,cedula_back:null });
  const [signature,setSignature]=useState(null);
  const [checks,setChecks]=useState(()=>Object.fromEntries(CHECKLIST.map(c=>[c.id,null])));
  const [purchasePrice,setPurchasePrice]=useState("");
  const [showFinalize,setShowFinalize]=useState(false);
  const [paymentMethod,setPaymentMethod]=useState("");
  const [tradeInModel,setTradeInModel]=useState("");
  const [saving,setSaving]=useState(false);

  const photoCount=Object.values(devicePhotos).filter(Boolean).length;
  const score=(()=>{ const vals=Object.values(checks).map(v=>STATUS_MAP[v]??null).filter(v=>v!==null); if(!vals.length) return null; return Math.round((vals.reduce((a,b)=>a+b,0)/(vals.length*10))*100); })();
  const sl=score!==null?getScoreLabel(score):null;
  const suggestedPrice=calcSuggested(device,score);

  useEffect(()=>{ if(suggestedPrice&&purchasePrice==="") setPurchasePrice(String(suggestedPrice)); },[suggestedPrice]);

  const canSaveDevice=photoCount>=3&&device.model&&device.imei;
  const canSaveClient=client.nombre&&client.apellido&&client.cedula&&signature&&client.declaracion;
  const allDone=Object.values(checks).every(v=>v!==null);
  const setCheck=(id,val)=>setChecks(p=>({...p,[id]:val}));
  const catGroups=CHECKLIST.reduce((a,item)=>{ if(!a[item.cat]) a[item.cat]=[]; a[item.cat].push(item); return a; },{});

  const handleBuy=async()=>{
    if(!paymentMethod) return;
    setSaving(true);
    try {
      const rec={
        id: Date.now().toString(),
        date: new Date().toISOString(),
        registered_by: session?.name||"—",
        registered_by_user: session?.username,
        device, client, checks, score,
        suggested_price: suggestedPrice,
        purchase_price: parseInt(purchasePrice)||suggestedPrice,
        payment_method: paymentMethod,
        trade_in_model: tradeInModel||null,
        device_photos: devicePhotos,
        client_photos: clientPhotos,
        signature,
      };
      await API.createRecord(rec);
      onSave(rec);
    } catch(e) {
      alert("Error al guardar. Verifica tu conexión a internet.");
    }
    setSaving(false);
  };
  const handleDiscard=()=>{ if(window.confirm("¿Eliminar todo el registro sin guardar?")) onBack(); };

  if(showFinalize) return (
    <div style={{ minHeight:"100vh",background:T.bg,paddingBottom:40 }}>
      <AppleHeader title="Finalizar" onBack={()=>setShowFinalize(false)}/>
      <div style={{ padding:"20px 16px",maxWidth:"100%",display:"flex",flexDirection:"column",gap:20 }}>
        <div>
          <SectionHeader>Resumen</SectionHeader>
          <Card style={{ padding:"4px 0" }}>
            {[["Equipo",`${device.model} ${device.capacity}`],["Cliente",`${client.nombre} ${client.apellido}`],["IMEI",device.imei],["Score",`${score}/100 — ${sl?.label}`],["Valor sugerido",dop(suggestedPrice)],["Registrado por",session?.name]].map(([l,v],i,a)=>(
              <div key={l} style={{ display:"flex",justifyContent:"space-between",padding:"12px 16px",borderBottom:i===a.length-1?'none':`1px solid ${T.sep}`,gap:12 }}>
                <span style={{ fontSize:15,color:T.label3 }}>{l}</span>
                <span style={{ fontSize:15,color:T.label,fontWeight:500,textAlign:"right" }}>{v}</span>
              </div>
            ))}
          </Card>
        </div>

        <div>
          <SectionHeader>Precio de Compra</SectionHeader>
          <Card style={{ padding:16 }}>
            <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:12 }}>
              <span style={{ fontSize:20,fontWeight:600,color:T.green }}>RD$</span>
              <input type="number" min="0" value={purchasePrice} onChange={e=>setPurchasePrice(e.target.value)}
                style={{ ...iStyle,fontSize:26,fontWeight:700,color:T.green,flex:1,background:"transparent",border:"none",padding:"4px 0" }}/>
            </div>
            <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
              {[{l:"Sugerido",v:suggestedPrice},{l:"-500",v:Math.max(0,(parseInt(purchasePrice)||suggestedPrice)-500)},{l:"-1,000",v:Math.max(0,(parseInt(purchasePrice)||suggestedPrice)-1000)},{l:"-2,000",v:Math.max(0,(parseInt(purchasePrice)||suggestedPrice)-2000)}].map(btn=>(
                <button key={btn.l} onClick={()=>setPurchasePrice(String(btn.v))} style={{ padding:"6px 14px",borderRadius:20,fontSize:13,fontWeight:500,background:T.bg3,border:"none",color:T.label2,cursor:"pointer",fontFamily:"inherit" }}>{btn.l}</button>
              ))}
            </div>
            {purchasePrice&&suggestedPrice&&parseInt(purchasePrice)!==suggestedPrice&&(
              <div style={{ marginTop:10,fontSize:13,color:parseInt(purchasePrice)<suggestedPrice?T.yellow:T.green }}>
                {parseInt(purchasePrice)<suggestedPrice?`↓ RD$ ${(suggestedPrice-parseInt(purchasePrice)).toLocaleString("es-DO")} por debajo del sugerido`:`↑ RD$ ${(parseInt(purchasePrice)-suggestedPrice).toLocaleString("es-DO")} por encima del sugerido`}
              </div>
            )}
          </Card>
        </div>

        <div>
          <SectionHeader>Método de Pago</SectionHeader>
          <Card>
            {[{k:"transferencia",l:"Transferencia Bancaria",e:"🏦"},{k:"efectivo",l:"Efectivo",e:"💵"},{k:"tradein",l:"Cambiazo (Trade-In)",e:"🔄"}].map((opt,i,a)=>(
              <div key={opt.k} onClick={()=>setPaymentMethod(opt.k)}
                style={{ display:"flex",alignItems:"center",gap:12,padding:"13px 16px",borderBottom:i===a.length-1?'none':`1px solid ${T.sep}`,cursor:"pointer",background:paymentMethod===opt.k?"rgba(10,132,255,0.08)":"transparent",transition:"background 0.1s" }}>
                <span style={{ fontSize:20 }}>{opt.e}</span>
                <span style={{ flex:1,fontSize:16,color:T.label,fontWeight:paymentMethod===opt.k?600:400 }}>{opt.l}</span>
                {paymentMethod===opt.k&&<div style={{ width:22,height:22,borderRadius:11,background:T.blue,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:13 }}>✓</div>}
              </div>
            ))}
          </Card>
        </div>

        {paymentMethod==="tradein"&&(
          <div>
            <SectionHeader>Equipo en Trade</SectionHeader>
            <select value={tradeInModel} onChange={e=>setTradeInModel(e.target.value)} style={{ ...sStyle,fontSize:16 }}>
              <option value="">Seleccionar modelo…</option>
              {MODELS.map(m=><option key={m}>{m}</option>)}
            </select>
          </div>
        )}

        <div style={{ display:"flex",flexDirection:"column",gap:10,paddingTop:4 }}>
          {saving
            ?<div style={{ padding:20,textAlign:"center" }}><Spinner/><div style={{ fontSize:14,color:T.label3,marginTop:12 }}>Guardando en la nube…</div></div>
            :<>
              <AppleBtn onClick={handleBuy} disabled={!paymentMethod||(paymentMethod==="tradein"&&!tradeInModel)} color={T.green}>✅ Confirmar Compra</AppleBtn>
              <AppleBtn onClick={handleDiscard} style={{ background:"rgba(255,69,58,0.1)",color:T.red }}>🗑️ Descartar Registro</AppleBtn>
            </>}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh",background:T.bg,paddingBottom:60,width:"100%" }}>
      <AppleHeader title="Registrar iPhone" onBack={onBack} subtitle={`Por: ${session?.name}`}/>
      <div style={{ display:"flex",background:T.bg,borderBottom:`1px solid ${T.sep}`,padding:"0 20px" }}>
        {["Dispositivo","Cliente","Chequeo"].map((t,i)=>(
          <button key={i} onClick={()=>setTab(i)} style={{ flex:1,padding:"10px 4px",background:"transparent",border:"none",cursor:"pointer",color:tab===i?T.blue:T.label3,fontSize:14,fontWeight:tab===i?600:400,fontFamily:"inherit",borderBottom:`2px solid ${tab===i?T.blue:"transparent"}`,transition:"all 0.2s" }}>{t}</button>
        ))}
      </div>

      <div style={{ padding:"20px 16px",width:"100%",boxSizing:"border-box",display:"flex",flexDirection:"column",gap:20 }}>
        {tab===0&&(<>
          <div>
            <SectionHeader>Información del Equipo</SectionHeader>
            <Card><div style={{ padding:16,display:"flex",flexDirection:"column",gap:12 }}>
              <Field label="Modelo" required><select value={device.model} onChange={e=>setDevice(p=>({...p,model:e.target.value}))} style={sStyle}><option value="">Seleccionar…</option>{MODELS.map(m=><option key={m}>{m}</option>)}</select></Field>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
                <Field label="Color"><select value={device.color} onChange={e=>setDevice(p=>({...p,color:e.target.value}))} style={sStyle}><option value="">—</option>{COLORS.map(c=><option key={c}>{c}</option>)}</select></Field>
                <Field label="Capacidad"><select value={device.capacity} onChange={e=>setDevice(p=>({...p,capacity:e.target.value}))} style={sStyle}><option value="">—</option>{CAPACITIES.map(c=><option key={c}>{c}</option>)}</select></Field>
              </div>
              <Field label="IMEI" required><input value={device.imei} onChange={e=>setDevice(p=>({...p,imei:e.target.value}))} placeholder="000000000000000" style={{ ...iStyle,fontFamily:"monospace",fontSize:17,letterSpacing:"0.05em" }} maxLength={15} inputMode="numeric"/></Field>
              <Field label="Número de Serie"><input value={device.serial} onChange={e=>setDevice(p=>({...p,serial:e.target.value}))} placeholder="XXXXXXXXXX" style={iStyle}/></Field>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
                <Field label="Desbloqueado"><select value={device.unlocked} onChange={e=>setDevice(p=>({...p,unlocked:e.target.value}))} style={sStyle}><option value="">—</option><option value="si">✅ Sí</option><option value="no">❌ No</option></select></Field>
                <Field label="iCloud Libre"><select value={device.icloud} onChange={e=>setDevice(p=>({...p,icloud:e.target.value}))} style={sStyle}><option value="">—</option><option value="si">✅ Sí</option><option value="no">❌ No</option></select></Field>
              </div>
              <Field label="Salud de Batería (%)"><input type="number" min="0" max="100" value={device.battery} onChange={e=>setDevice(p=>({...p,battery:e.target.value}))} placeholder="87" style={iStyle}/></Field>
              <Field label="Comentarios"><textarea value={device.comments} onChange={e=>setDevice(p=>({...p,comments:e.target.value}))} placeholder="Rayones, golpes, detalles…" style={{ ...iStyle,minHeight:80,resize:"vertical" }}/></Field>
            </div></Card>
          </div>
          <div>
            <SectionHeader>Fotos del Equipo <span style={{ color:photoCount>=3?T.green:T.orange }}>({photoCount}/5{photoCount<3?" — mín. 3":""})</span></SectionHeader>
            <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
              {[{k:"frontal",l:"Frontal",r:true},{k:"trasera",l:"Trasera",r:true},{k:"laterales",l:"Laterales",r:true},{k:"imei",l:"IMEI en Pantalla"},{k:"bateria",l:"Estado de Batería"}].map(({k,l,r})=>(
                <PhotoUpload key={k} label={l} required={r} value={devicePhotos[k]} onChange={v=>setDevicePhotos(p=>({...p,[k]:v}))}/>
              ))}
            </div>
          </div>
          <AppleBtn onClick={()=>setTab(1)} disabled={!canSaveDevice}>{canSaveDevice?"Continuar":`Sube ${Math.max(0,3-photoCount)} foto(s) más`}</AppleBtn>
        </>)}

        {tab===1&&(<>
          <div>
            <SectionHeader>Datos del Vendedor</SectionHeader>
            <Card><div style={{ padding:16,display:"flex",flexDirection:"column",gap:12 }}>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
                <Field label="Nombre" required><input value={client.nombre} onChange={e=>setClient(p=>({...p,nombre:e.target.value}))} placeholder="Juan" style={iStyle}/></Field>
                <Field label="Apellido" required><input value={client.apellido} onChange={e=>setClient(p=>({...p,apellido:e.target.value}))} placeholder="Pérez" style={iStyle}/></Field>
              </div>
              <Field label="Cédula" required><input value={client.cedula} onChange={e=>setClient(p=>({...p,cedula:e.target.value}))} placeholder="000-0000000-0" style={iStyle}/></Field>
              <Field label="Dirección"><input value={client.direccion} onChange={e=>setClient(p=>({...p,direccion:e.target.value}))} placeholder="Calle, Ciudad, Provincia" style={iStyle}/></Field>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
                <Field label="Teléfono"><input value={client.telefono} onChange={e=>setClient(p=>({...p,telefono:e.target.value}))} placeholder="809-000-0000" style={iStyle}/></Field>
                <Field label="Email"><input type="email" value={client.email} onChange={e=>setClient(p=>({...p,email:e.target.value}))} placeholder="correo@gmail.com" style={iStyle}/></Field>
              </div>
            </div></Card>
          </div>
          <div>
            <SectionHeader>Fotos del Cliente</SectionHeader>
            <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
              <PhotoUpload label="Foto de la Persona" value={clientPhotos.persona} onChange={v=>setClientPhotos(p=>({...p,persona:v}))}/>
              <PhotoUpload label="Cédula — Frente" value={clientPhotos.cedula_front} onChange={v=>setClientPhotos(p=>({...p,cedula_front:v}))}/>
              <PhotoUpload label="Cédula — Reverso" value={clientPhotos.cedula_back} onChange={v=>setClientPhotos(p=>({...p,cedula_back:v}))}/>
            </div>
          </div>
          <div>
            <SectionHeader>Firma Digital</SectionHeader>
            <Card style={{ padding:14 }}>
              <SignaturePad onSave={setSignature}/>
              {signature&&<div style={{ fontSize:13,color:T.green,marginTop:8 }}>✓ Firma registrada</div>}
            </Card>
          </div>
          <Card>
            <div onClick={()=>setClient(p=>({...p,declaracion:!p.declaracion}))} style={{ display:"flex",gap:12,alignItems:"flex-start",padding:"14px 16px",cursor:"pointer" }}>
              <div style={{ width:24,height:24,borderRadius:12,flexShrink:0,marginTop:1,background:client.declaracion?T.blue:"transparent",border:`2px solid ${client.declaracion?T.blue:T.bg4}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,transition:"all 0.15s" }}>{client.declaracion?"✓":""}</div>
              <div style={{ fontSize:14,color:T.label2,lineHeight:1.5 }}><span style={{ color:T.label,fontWeight:500 }}>Declaración Legal:</span> Declaro que este equipo es de mi propiedad y que toda la información es verídica y correcta.</div>
            </div>
          </Card>
          <AppleBtn onClick={()=>setTab(2)} disabled={!canSaveClient}>{canSaveClient?"Continuar al Chequeo":"Completa los campos requeridos"}</AppleBtn>
        </>)}

        {tab===2&&(<>
          {Object.entries(catGroups).map(([cat,items])=>(
            <div key={cat}>
              <SectionHeader>{cat}</SectionHeader>
              <Card>
                {items.map((item,i)=>{ const v=checks[item.id]; return (
                  <div key={item.id} style={{ display:"flex",alignItems:"center",gap:12,padding:"13px 16px",borderBottom:i===items.length-1?'none':`1px solid ${T.sep}` }}>
                    <span style={{ fontSize:15,flex:1,color:T.label }}>{item.label}</span>
                    <div style={{ display:"flex",gap:6 }}>
                      {[{val:"perfect",emoji:"✅",c:T.green},{val:"detail",emoji:"⚠️",c:T.yellow},{val:"broken",emoji:"❌",c:T.red}].map(opt=>(
                        <button key={opt.val} onClick={()=>setCheck(item.id,opt.val)} style={{ width:36,height:36,borderRadius:10,border:`1.5px solid ${v===opt.val?opt.c:"rgba(255,255,255,0.1)"}`,background:v===opt.val?`${opt.c}1a`:"transparent",cursor:"pointer",fontSize:17,transition:"all 0.12s",display:"flex",alignItems:"center",justifyContent:"center" }}>{opt.emoji}</button>
                      ))}
                    </div>
                  </div>
                ); })}
              </Card>
            </div>
          ))}

          {score!==null&&(
            <div>
              <SectionHeader>Resultado del Diagnóstico</SectionHeader>
              <Card style={{ padding:20 }}>
                <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16 }}>
                  <div>
                    <div style={{ fontSize:52,fontWeight:700,color:sl?.color,lineHeight:1,letterSpacing:"-0.03em",fontFamily:"monospace" }}>{score}</div>
                    <div style={{ fontSize:13,color:T.label3,marginTop:4 }}>de 100 puntos</div>
                  </div>
                  <div style={{ fontSize:13,fontWeight:700,padding:"5px 14px",borderRadius:20,background:sl?.bg,color:sl?.color }}>{sl?.label}</div>
                </div>
                <div style={{ background:T.bg3,borderRadius:100,height:6,overflow:"hidden" }}>
                  <div style={{ height:"100%",borderRadius:100,width:`${score}%`,background:sl?.color,transition:"width 0.7s" }}/>
                </div>
                {suggestedPrice&&(
                  <div style={{ marginTop:16,paddingTop:16,borderTop:`1px solid ${T.sep}` }}>
                    <div style={{ fontSize:13,color:T.label3,marginBottom:4 }}>Valor sugerido de compra</div>
                    <div style={{ fontSize:28,fontWeight:700,color:T.label,letterSpacing:"-0.02em" }}>RD$ {suggestedPrice.toLocaleString("es-DO")}</div>
                  </div>
                )}
              </Card>
            </div>
          )}

          <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
            <AppleBtn onClick={()=>setShowFinalize(true)} disabled={!allDone}>
              {allDone?"Continuar a Compra / Descartar":`Evalúa ${Object.values(checks).filter(v=>v===null).length} componente(s) más`}
            </AppleBtn>
            {allDone&&<AppleBtn onClick={handleDiscard} style={{ background:"rgba(255,69,58,0.1)",color:T.red }}>Descartar Registro</AppleBtn>}
          </div>
        </>)}
      </div>
    </div>
  );
}

// ─── SUCCESS ──────────────────────────────────────────────────────────────────
function SuccessScreen({ rec, onHome }) {
  const sl=getScoreLabel(rec.score);
  const d=rec.device||{}; const cl=rec.client||{};
  return (
    <div style={{ minHeight:"100vh",background:T.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24 }}>
      <div style={{ maxWidth:400,width:"100%",textAlign:"center" }}>
        <div style={{ width:80,height:80,borderRadius:40,background:"rgba(48,209,88,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:40,margin:"0 auto 20px" }}>✅</div>
        <div style={{ fontSize:28,fontWeight:700,color:T.label,letterSpacing:"-0.03em",marginBottom:6 }}>¡Guardado en la Nube!</div>
        <div style={{ fontSize:15,color:T.label3,marginBottom:8 }}>Registrado por <span style={{ color:T.label }}>{rec.registered_by}</span></div>
        <CloudBadge/>
        <div style={{ marginTop:24,marginBottom:24 }}>
          <Card style={{ textAlign:"left",padding:"4px 0" }}>
            {[["Equipo",`${d.model} ${d.capacity}`],["Cliente",`${cl.nombre} ${cl.apellido}`],["Score",`${rec.score}/100 — ${sl.label}`],["Precio pagado",dop(rec.purchase_price)],["Método",rec.payment_method==="transferencia"?"🏦 Transferencia":rec.payment_method==="efectivo"?"💵 Efectivo":`🔄 ${rec.trade_in_model||"Cambiazo"}`]].map(([l,v],i,a)=>(
              <div key={l} style={{ display:"flex",justifyContent:"space-between",padding:"12px 16px",borderBottom:i===a.length-1?'none':`1px solid ${T.sep}`,gap:12 }}>
                <span style={{ fontSize:15,color:T.label3 }}>{l}</span>
                <span style={{ fontSize:15,color:i===3?T.green:T.label,fontWeight:i===3?700:500,textAlign:"right" }}>{v}</span>
              </div>
            ))}
          </Card>
        </div>
        <AppleBtn onClick={onHome}>Volver al Inicio</AppleBtn>
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen,setScreen]=useState("home");
  const [session,setSession]=useState(()=>{ try { return JSON.parse(localStorage.getItem("ieval_session")||"null"); } catch { return null; } });
  const [savedRec,setSavedRec]=useState(null);
  const [loginTarget,setLoginTarget]=useState(null);
  const [dbReady,setDbReady]=useState(false);

  useEffect(()=>{
    // Create admin user if none exists
    const init=async()=>{
      try {
        const users = await API.getUsers();
        if(!users||users.length===0){
          await API.createUser({ id:"admin-1", username:"admin", password:"admin123", name:"Administrador", role:"admin", verified:true, fireId:"admin-1" });
        }
      } catch(e){ console.log("Init error:", e); }
      setDbReady(true);
    };
    init();
  },[]);

  const login=user=>{ localStorage.setItem("ieval_session",JSON.stringify(user)); setSession(user); setScreen(loginTarget||"home"); setLoginTarget(null); };
  const logout=()=>{ localStorage.removeItem("ieval_session"); setSession(null); };
  const nav=key=>{ if((key==="register"||key==="search")&&!session){ setLoginTarget(key); setScreen("login"); return; } setScreen(key); };
  const handleSave=rec=>{ setSavedRec(rec); setScreen("success"); };
  const handleRegisterSuccess=user=>{ login(user); };

  if(!dbReady) return (
    <div style={{ minHeight:"100vh",background:T.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16 }}>
      <AppIcon size={72}/>
      <Spinner/>
      <div style={{ fontSize:15,color:T.label3 }}>Conectando con Firebase…</div>
    </div>
  );

  return (
    <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','SF Pro Text','Helvetica Neue',sans-serif",color:T.label,minHeight:"100vh",background:T.bg }}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}select option{background:#1c1c1e;}input::placeholder,textarea::placeholder{color:rgba(235,235,245,0.3);}input:focus,textarea:focus,select:focus{outline:none;border-color:rgba(10,132,255,0.6)!important;}@keyframes spin{to{transform:rotate(360deg);}}::-webkit-scrollbar{width:0;}`}</style>
      {screen==="home"     &&<HomeScreen     onNav={nav} session={session} onLogout={logout}/>}
      {screen==="login"    &&<LoginScreen    onLogin={login} onBack={()=>setScreen("home")} onRegister={()=>setScreen("signup")}/>}
      {screen==="signup"   &&<RegisterUserScreen onBack={()=>setScreen("login")} onSuccess={handleRegisterSuccess}/>}
      {screen==="search"   &&<SearchScreen   onBack={()=>setScreen("home")}/>}
      {screen==="imei"     &&<ImeiCheckScreen onBack={()=>setScreen("home")}/>}
      {screen==="register" &&<RegisterScreen  onBack={()=>setScreen("home")} onSave={handleSave} session={session}/>}
      {screen==="admin"    &&<AdminPanel      currentUser={session} onBack={()=>setScreen("home")}/>}
      {screen==="success"  &&<SuccessScreen   rec={savedRec} onHome={()=>setScreen("home")}/>}
    </div>
  );
}
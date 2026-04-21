import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ScatterChart, Scatter, ZAxis } from "recharts";

const closedDeals = [
  ...Array(6).fill({ tier:"Diamond", segment:"Enterprise", outcome:"Won", source:"BDR Outbound", value: 112500 }),
  ...Array(22).fill({ tier:"Diamond", segment:"Enterprise", outcome:"Lost", source:"Mixed", value: 0 }),
  ...Array(3).fill({ tier:"Diamond", segment:"Mid-Market", outcome:"Won", source:"BDR Outbound", value: 59333 }),
  ...Array(6).fill({ tier:"Diamond", segment:"Mid-Market", outcome:"Lost", source:"Mixed", value: 0 }),
  ...Array(2).fill({ tier:"Platinum", segment:"Enterprise", outcome:"Won", source:"BDR Outbound", value: 62500 }),
  ...Array(14).fill({ tier:"Platinum", segment:"Enterprise", outcome:"Lost", source:"Mixed", value: 0 }),
  ...Array(2).fill({ tier:"Platinum", segment:"Mid-Market", outcome:"Won", source:"BDR Outbound", value: 51500 }),
  ...Array(10).fill({ tier:"Platinum", segment:"Mid-Market", outcome:"Lost", source:"Mixed", value: 0 }),
  ...Array(4).fill({ tier:"Non-Target", segment:"Enterprise", outcome:"Won", source:"Inbound", value: 81750 }),
  ...Array(17).fill({ tier:"Non-Target", segment:"Enterprise", outcome:"Lost", source:"Mixed", value: 0 }),
  ...Array(8).fill({ tier:"Non-Target", segment:"Mid-Market", outcome:"Won", source:"Inbound", value: 46750 }),
  ...Array(22).fill({ tier:"Non-Target", segment:"Mid-Market", outcome:"Lost", source:"Mixed", value: 0 }),
];

const sourceClosedDeals = [
  { source:"BDR Outbound", tier:"Target", segment:"Enterprise", won:7, total:18 },
  { source:"BDR Outbound", tier:"Target", segment:"Mid-Market", won:3, total:9 },
  { source:"SD Outbound", tier:"Target", segment:"Enterprise", won:0, total:9 },
  { source:"SD Outbound", tier:"Target", segment:"Mid-Market", won:0, total:4 },
  { source:"Inbound", tier:"Target", segment:"Enterprise", won:0, total:6 },
  { source:"Inbound", tier:"Target", segment:"Mid-Market", won:0, total:5 },
  { source:"Event", tier:"Target", segment:"Enterprise", won:1, total:6 },
  { source:"Event", tier:"Target", segment:"Mid-Market", won:1, total:4 },
  { source:"Referral", tier:"Target", segment:"Enterprise", won:1, total:3 },
  { source:"Referral", tier:"Target", segment:"Mid-Market", won:0, total:1 },
  { source:"Inbound", tier:"Non-Target", segment:"Enterprise", won:2, total:6 },
  { source:"Inbound", tier:"Non-Target", segment:"Mid-Market", won:6, total:14 },
  { source:"BDR Outbound", tier:"Non-Target", segment:"Enterprise", won:0, total:4 },
  { source:"BDR Outbound", tier:"Non-Target", segment:"Mid-Market", won:1, total:7 },
  { source:"Event", tier:"Non-Target", segment:"Enterprise", won:0, total:5 },
  { source:"Event", tier:"Non-Target", segment:"Mid-Market", won:1, total:8 },
  { source:"Referral", tier:"Non-Target", segment:"Enterprise", won:1, total:2 },
  { source:"Referral", tier:"Non-Target", segment:"Mid-Market", won:1, total:4 },
  { source:"SD Outbound", tier:"Non-Target", segment:"Enterprise", won:0, total:1 },
];

const stageConversionRaw = [
  { stage:"S0→S1", tier:"Diamond", segment:"Enterprise", rate:91 },
  { stage:"S0→S1", tier:"Diamond", segment:"Mid-Market", rate:91 },
  { stage:"S0→S1", tier:"Platinum", segment:"Enterprise", rate:84 },
  { stage:"S0→S1", tier:"Platinum", segment:"Mid-Market", rate:84 },
  { stage:"S0→S1", tier:"Non-Target", segment:"Enterprise", rate:87 },
  { stage:"S0→S1", tier:"Non-Target", segment:"Mid-Market", rate:87 },
  { stage:"S1→S2+", tier:"Diamond", segment:"Enterprise", rate:37 },
  { stage:"S1→S2+", tier:"Diamond", segment:"Mid-Market", rate:37 },
  { stage:"S1→S2+", tier:"Platinum", segment:"Enterprise", rate:34 },
  { stage:"S1→S2+", tier:"Platinum", segment:"Mid-Market", rate:34 },
  { stage:"S1→S2+", tier:"Non-Target", segment:"Enterprise", rate:45 },
  { stage:"S1→S2+", tier:"Non-Target", segment:"Mid-Market", rate:45 },
];

const repDataRaw = [
  { rep:"Rachel Kim", won:3, closed:4, wr:75, stalled:0, openPipeline:445000 },
  { rep:"Tyler Brooks", won:2, closed:6, wr:33, stalled:9, openPipeline:1208000 },
  { rep:"Sarah Chen", won:2, closed:6, wr:33, stalled:1, openPipeline:565000 },
  { rep:"James Park", won:1, closed:3, wr:33, stalled:6, openPipeline:1270000 },
  { rep:"Elena Rodriguez", won:1, closed:4, wr:25, stalled:1, openPipeline:451000 },
  { rep:"Carlos Mendez", won:1, closed:5, wr:20, stalled:4, openPipeline:751000 },
  { rep:"David Foster", won:1, closed:9, wr:11, stalled:0, openPipeline:849000 },
  { rep:"Natasha Orlov", won:1, closed:10, wr:10, stalled:2, openPipeline:552000 },
  { rep:"Ryan Mitchell", won:1, closed:10, wr:10, stalled:8, openPipeline:1015000 },
  { rep:"Marcus Williams", won:0, closed:8, wr:0, stalled:3, openPipeline:529000 },
];

const benchmarks = { Enterprise: { winRate:18, asp:85000, ev:15300, cycle:62 }, "Mid-Market": { winRate:22, asp:48000, ev:10560, cycle:45 }, s0s1:68, s1s2:55, s2cw:40, mqlOpp:30 };


const tierProbs = {
  Diamond: { "0-Discovery": 0.164, "1-Qualified": 0.180, "2-Proposal": 0.486, "3-Negotiation": 0.669, "4-Contract Sent": 0.912 },
  Platinum: { "0-Discovery": 0.081, "1-Qualified": 0.097, "2-Proposal": 0.286, "3-Negotiation": 0.393, "4-Contract Sent": 0.536 },
  "Non-Target": { "0-Discovery": 0.183, "1-Qualified": 0.210, "2-Proposal": 0.471, "3-Negotiation": 0.647, "4-Contract Sent": 0.882 },
};
const benchProbs = { "0-Discovery": 0.150, "1-Qualified": 0.220, "2-Proposal": 0.400, "3-Negotiation": 0.550, "4-Contract Sent": 0.750 };

const pipelineByTierStage = [
  { tier:"Diamond", stage:"0-Discovery", deals:9, raw:729000, prob:0.164, weighted:119387 },
  { tier:"Diamond", stage:"1-Qualified", deals:30, raw:2544000, prob:0.180, weighted:457382 },
  { tier:"Diamond", stage:"2-Proposal", deals:2, raw:208000, prob:0.486, weighted:101189 },
  { tier:"Diamond", stage:"3-Negotiation", deals:7, raw:520000, prob:0.669, weighted:347838 },
  { tier:"Diamond", stage:"4-Contract Sent", deals:16, raw:1346000, prob:0.912, weighted:1227770 },
  { tier:"Platinum", stage:"0-Discovery", deals:11, raw:704000, prob:0.081, weighted:57041 },
  { tier:"Platinum", stage:"1-Qualified", deals:13, raw:735000, prob:0.097, weighted:71250 },
  { tier:"Platinum", stage:"2-Proposal", deals:2, raw:109000, prob:0.286, weighted:31143 },
  { tier:"Platinum", stage:"3-Negotiation", deals:7, raw:416000, prob:0.393, weighted:163429 },
  { tier:"Platinum", stage:"4-Contract Sent", deals:6, raw:324000, prob:0.536, weighted:173571 },
  { tier:"Non-Target", stage:"0-Discovery", deals:20, raw:962000, prob:0.183, weighted:175721 },
  { tier:"Non-Target", stage:"1-Qualified", deals:34, raw:1866000, prob:0.210, weighted:392492 },
  { tier:"Non-Target", stage:"2-Proposal", deals:17, raw:817000, prob:0.471, weighted:384471 },
  { tier:"Non-Target", stage:"3-Negotiation", deals:16, raw:755000, prob:0.647, weighted:488529 },
  { tier:"Non-Target", stage:"4-Contract Sent", deals:14, raw:669000, prob:0.882, weighted:590294 },
];

const pipelineSummary = [
  { tier:"Diamond", raw:5347000, weighted:2253566, pctOfRaw:42, benchWeighted:2047438, delta:206127 },
  { tier:"Platinum", raw:2288000, weighted:496433, pctOfRaw:22, benchWeighted:782418, delta:-285985 },
  { tier:"Non-Target", raw:5069000, weighted:2031507, pctOfRaw:40, benchWeighted:1798235, delta:233272 },
];

const funnelDetail = {
  engagedNoOpp: [
    { label:"Diamond accounts", value:"12", detail:"Highest-priority targets with zero pipeline" },
    { label:"Platinum accounts", value:"13", detail:"Marketing investment with no conversion" },
    { label:"Enterprise segment", value:"20 of 25", detail:"80% are high-value Enterprise accounts" },
    { label:"ABM campaign sourced", value:"22 of 25", detail:"Direct ABM spend, not organic discovery" },
    { label:"Avg marketing touches", value:"16", detail:"Significant investment per account" },
    { label:"Avg intent score", value:"59", detail:"Active buying signals present" },
    { label:"Accounts with MQL date", value:"25 of 25", detail:"100% met qualification criteria" },
  ],
  stallByStage: [
    { stage:"1-Qualified", count:19, pct:56 },
    { stage:"0-Discovery", count:8, pct:24 },
    { stage:"4-Contract Sent", count:5, pct:15 },
    { stage:"3-Negotiation", count:2, pct:6 },
  ],
  stallByRep: [
    { rep:"Tyler Brooks", count:9 },{ rep:"Ryan Mitchell", count:8 },{ rep:"James Park", count:6 },
    { rep:"Carlos Mendez", count:4 },{ rep:"Marcus Williams", count:3 },{ rep:"Natasha Orlov", count:2 },
    { rep:"Elena Rodriguez", count:1 },{ rep:"Sarah Chen", count:1 },
  ],
};

const C = { diamond:"#2980b9", platinum:"#8e44ad", nonTarget:"#7f8c8d", green:"#27ae60", red:"#c0392b", amber:"#e67e22", bg:"#0c1017", card:"#151b28", cardAlt:"#1a2235", border:"#232d42", text:"#e2e5ea", muted:"#8892a4", accent:"#4fc3f7", header:"#0e1320" };
const fmt = n => n >= 1000 ? `$${(n/1000).toFixed(0)}K` : `$${n.toLocaleString()}`;
const fmtFull = n => `$${n.toLocaleString()}`;
const tierColor = t => t === "Diamond" ? C.diamond : t === "Platinum" ? C.platinum : C.nonTarget;

const Card = ({ children, style }) => (<div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:20, ...style }}>{children}</div>);
const Metric = ({ label, value, sub, color, compact }) => (
  <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:compact?"10px 14px":"14px 18px", borderTop:`3px solid ${color||C.accent}` }}>
    <div style={{ fontSize:10, color:C.muted, textTransform:"uppercase", letterSpacing:"0.6px", fontWeight:700, marginBottom:4 }}>{label}</div>
    <div style={{ fontSize:compact?20:26, fontWeight:800, color:color||C.text, lineHeight:1.1 }}>{value}</div>
    {sub && <div style={{ fontSize:11, color:C.muted, marginTop:4 }}>{sub}</div>}
  </div>
);
const Callout = ({ icon, text, color, title }) => (
  <div style={{ background:`${color||C.accent}0a`, border:`1px solid ${color||C.accent}28`, borderLeft:`3px solid ${color||C.accent}`, borderRadius:"0 8px 8px 0", padding:"12px 16px" }}>
    {title && <div style={{ fontSize:12, fontWeight:700, color:color||C.accent, marginBottom:4, display:"flex", alignItems:"center", gap:6 }}>{icon&&<span>{icon}</span>}{title}</div>}
    <div style={{ fontSize:13, color:C.text, lineHeight:1.6 }}>{text}</div>
  </div>
);
const Section = ({ title, sub, children }) => (<div style={{ marginBottom:8 }}><h3 style={{ margin:"0 0 2px", fontSize:15, fontWeight:700, color:C.text }}>{title}</h3>{sub&&<p style={{ margin:"0 0 12px", fontSize:12, color:C.muted }}>{sub}</p>}{children}</div>);
const TierDot = ({ tier }) => (<span style={{ display:"inline-flex", alignItems:"center", gap:5 }}><span style={{ width:8, height:8, borderRadius:"50%", background:tierColor(tier), display:"inline-block" }}/><span>{tier}</span></span>);
const TT = ({ active, payload }) => { if (!active||!payload?.length) return null; return (<div style={{ background:"#1a2030", border:`1px solid ${C.border}`, borderRadius:8, padding:"8px 12px", fontSize:12, maxWidth:220 }}>{payload.map((p,i)=>(<div key={i} style={{ color:p.color||C.text, display:"flex", justifyContent:"space-between", gap:12 }}><span style={{ color:C.muted }}>{p.name}</span><span style={{ fontWeight:600 }}>{typeof p.value==="number"&&p.value>100?fmtFull(p.value):p.value+(typeof p.value==="number"&&p.value<=100?"%":"")}</span></div>))}</div>); };

const tabs = [
  { id:"overview", label:"Overview", icon:"📊" },
  { id:"targeting", label:"Targeting", icon:"🎯" },
  { id:"pipeline", label:"Pipeline Value", icon:"💰" },
  { id:"source", label:"Source Channel", icon:"📡" },
  { id:"funnel", label:"Funnel Leakage", icon:"🔗" },
  { id:"reps", label:"Rep Performance", icon:"👥" },
  { id:"recs", label:"Recommendations", icon:"✅" },
];

export default function Dashboard() {
  const [tab, setTab] = useState("overview");
  const [seg, setSeg] = useState("All");
  const isFiltered = seg !== "All";

  const winRateTable = useMemo(() => {
    const tiers = ["Diamond","Platinum","Non-Target"];
    const segs = seg === "All" ? ["Enterprise","Mid-Market"] : [seg];
    return tiers.flatMap(tier => segs.map(s => {
      const b = benchmarks[s]; const rows = closedDeals.filter(d => d.tier===tier && d.segment===s);
      const won = rows.filter(r => r.outcome==="Won"); const wr = rows.length>0?(won.length/rows.length*100):0;
      const asp = won.length>0?won.reduce((a,r)=>a+r.value,0)/won.length:0; const ev = (wr/100)*asp;
      return { tier, segment:s, wr:+wr.toFixed(1), wrBench:b.winRate, asp:Math.round(asp), aspBench:b.asp, ev:Math.round(ev), evBench:b.ev, won:won.length, lost:rows.length-won.length, n:rows.length };
    }));
  }, [seg]);

  const sourceTable = useMemo(() => {
    const segs = seg==="All"?["Enterprise","Mid-Market"]:[seg];
    const sources = ["BDR Outbound","SD Outbound","Inbound","Event","Referral"];
    return ["Target","Non-Target"].map(tierGroup => {
      const rows = sources.map(src => {
        const matches = sourceClosedDeals.filter(d => d.source===src && d.tier===tierGroup && segs.includes(d.segment));
        const won = matches.reduce((a,m)=>a+m.won,0); const total = matches.reduce((a,m)=>a+m.total,0);
        return { source:src, won, total, wr:total>0?Math.round(won/total*100):null };
      }).filter(r => r.total>0);
      return { tierGroup, rows };
    });
  }, [seg]);

  const stageData = useMemo(() => {
    const segs = seg==="All"?["Enterprise","Mid-Market"]:[seg];
    return ["S0→S1","S1→S2+"].map(stage => {
      const obj = { stage, benchmark: stage==="S0→S1"?benchmarks.s0s1:benchmarks.s1s2 };
      ["Diamond","Platinum","Non-Target"].forEach(tier => {
        const m = stageConversionRaw.filter(r => r.stage===stage && r.tier===tier && segs.includes(r.segment));
        obj[tier] = m.length>0?Math.round(m.reduce((a,r)=>a+r.rate,0)/m.length):0;
      });
      return obj;
    });
  }, [seg]);

  const evChartData = useMemo(() => winRateTable.map(d => ({ label:`${d.tier.substring(0,3)} ${d.segment.substring(0,3)}`, ev:d.ev, benchEV:d.evBench, tier:d.tier })), [winRateTable]);

  const diamondEnt = winRateTable.find(d => d.tier==="Diamond"&&d.segment==="Enterprise");
  const platEnt = winRateTable.find(d => d.tier==="Platinum"&&d.segment==="Enterprise");
  const diamondEV = diamondEnt?diamondEnt.ev:winRateTable.filter(d=>d.tier==="Diamond").reduce((a,d)=>a+d.ev,0)/Math.max(winRateTable.filter(d=>d.tier==="Diamond").length,1);
  const platEV = platEnt?platEnt.ev:winRateTable.filter(d=>d.tier==="Platinum").reduce((a,d)=>a+d.ev,0)/Math.max(winRateTable.filter(d=>d.tier==="Platinum").length,1);

  return (
    <div style={{ fontFamily:"'IBM Plex Sans',-apple-system,BlinkMacSystemFont,sans-serif", background:C.bg, color:C.text, minHeight:"100vh" }}>
      <div style={{ background:C.header, borderBottom:`1px solid ${C.border}`, padding:"16px 24px 0" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:8, marginBottom:12 }}>
          <div>
            <h1 style={{ margin:0, fontSize:20, fontWeight:800, letterSpacing:"-0.5px" }}>ABM Strategy Assessment <span style={{ fontSize:13, color:C.muted, fontWeight:400 }}>Interactive Companion</span></h1>
            <p style={{ margin:"3px 0 0", fontSize:12, color:C.muted }}>Camalytics Q1/Q2 2026 &middot; Prepared by Bradley Hartnett &middot; Companion to written memo</p>
          </div>
          <div style={{ display:"flex", gap:4, alignItems:"center" }}>
            <span style={{ fontSize:10, color:C.muted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.5px", marginRight:4 }}>Segment</span>
            {["All","Enterprise","Mid-Market"].map(s => (
              <button key={s} onClick={()=>setSeg(s)} style={{ padding:"5px 12px", borderRadius:6, fontSize:12, fontWeight:600, cursor:"pointer", border:`1px solid ${seg===s?C.accent:C.border}`, background:seg===s?`${C.accent}18`:"transparent", color:seg===s?C.accent:C.muted, transition:"all 0.15s ease" }}>{s}</button>
            ))}
          </div>
        </div>
        <div style={{ display:"flex", gap:0, overflowX:"auto", marginBottom:-1 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)} style={{ padding:"9px 16px", border:"none", cursor:"pointer", whiteSpace:"nowrap", borderBottom:tab===t.id?`2px solid ${C.accent}`:"2px solid transparent", background:"transparent", color:tab===t.id?C.accent:C.muted, fontSize:12, fontWeight:600, display:"flex", alignItems:"center", gap:5, transition:"all 0.15s ease" }}><span style={{ fontSize:13 }}>{t.icon}</span>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding:"20px 24px", maxWidth:1120 }}>
        {tab === "overview" && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {isFiltered && <div style={{ fontSize:12, color:C.accent, fontWeight:600 }}>Showing {seg} segment only</div>}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))", gap:10 }}>
              <Metric label="Diamond EV/Opp" value={fmtFull(Math.round(diamondEV))} sub={`${Math.round((diamondEV/(diamondEnt?diamondEnt.evBench:15300)-1)*100)}% vs. benchmark`} color={C.green} />
              <Metric label="Platinum EV/Opp" value={fmtFull(Math.round(platEV))} sub={`${Math.round((platEV/(platEnt?platEnt.evBench:15300)-1)*100)}% vs. benchmark`} color={C.red} />
              <Metric label="Stranded MQLs" value="25 accts" sub="~$1.75M unrealized pipeline" color={C.amber} />
              <Metric label="MQL→Opp Rate" value="22%" sub="vs. 30% pre-ABM benchmark" color={C.red} />
              <Metric label="SD Out → Target WR" value="0%" sub="0/13 closed deals" color={C.red} />
            </div>
            <Callout color={C.green} icon="💎" title="FINDING: Diamond ABM is delivering" text="Diamond accounts produce a 58% expected value premium over pre-ABM benchmarks, driven by both higher win rates (+3.4pp Enterprise) and 32% larger deal sizes. Diamond Enterprise EV/opp of $24.1K is the strongest cohort in the dataset." />
            <Callout color={C.red} icon="⚠️" title="FINDING: Platinum is destroying value" text="Platinum Enterprise EV/opp ($7.8K) is half the pre-ABM benchmark and half what non-targeted accounts produce organically. ABM investment in Platinum is generating negative ROI relative to doing nothing." />
            <Callout color={C.amber} icon="🔗" title="FINDING: Marketing-to-sales handoff is broken" text="25 target accounts have MQL dates, ABM campaign engagement, and avg 16 touches with zero pipeline. SD Outbound has closed 0/13 target deals. MQL-to-opp conversion is 22% vs. 30% benchmark. These are execution failures, not strategy failures." />
            <Section title="Expected Value per Opportunity by Cohort" sub="EV = Win Rate × ASP. The single best composite measure of ABM targeting quality.">
              <Card>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={evChartData} barCategoryGap="18%">
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                    <XAxis dataKey="label" tick={{ fill:C.muted, fontSize:11 }} />
                    <YAxis tick={{ fill:C.muted, fontSize:11 }} tickFormatter={v=>`$${(v/1000).toFixed(0)}K`} />
                    <Tooltip content={<TT />} />
                    <Legend wrapperStyle={{ fontSize:11 }} />
                    <Bar dataKey="ev" name="Current EV" radius={[4,4,0,0]}>{evChartData.map((d,i)=><Cell key={i} fill={tierColor(d.tier)} />)}</Bar>
                    <Bar dataKey="benchEV" name="Pre-ABM Benchmark" fill="#4a5568" radius={[4,4,0,0]} opacity={0.4} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Section>
            <div style={{ fontSize:11, color:C.muted, fontStyle:"italic", textAlign:"center" }}>Small closed-deal samples (n=2–8 per cell). Directional, not statistically conclusive. Segment-controlled to avoid mix bias.</div>
          </div>
        )}

        {tab === "targeting" && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <Section title="Win Rate, ASP, and Expected Value by Cohort" sub={`Segment-controlled. Diamond is 69% Enterprise; Non-Target is 67% Mid-Market.${isFiltered?` Showing ${seg} only.`:""}`}>
              <Card style={{ overflow:"auto", padding:0 }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                  <thead><tr style={{ borderBottom:`2px solid ${C.border}` }}>{["Cohort","Segment","Won","Lost","Win Rate","Bench.","ASP","Bench.","EV/Opp","Bench. EV"].map(h=>(<th key={h} style={{ padding:"10px 10px", textAlign:"left", color:C.muted, fontWeight:700, fontSize:10, textTransform:"uppercase", letterSpacing:"0.5px" }}>{h}</th>))}</tr></thead>
                  <tbody>{winRateTable.map((d,i)=>(<tr key={i} style={{ borderBottom:`1px solid ${C.border}18`, background:d.tier==="Non-Target"?`${C.nonTarget}08`:"transparent" }}><td style={{ padding:"8px 10px" }}><TierDot tier={d.tier} /></td><td style={{ padding:"8px 10px", color:C.muted, fontSize:12 }}>{d.segment}</td><td style={{ padding:"8px 10px", color:C.green, fontWeight:600 }}>{d.won}</td><td style={{ padding:"8px 10px", color:C.red }}>{d.lost}</td><td style={{ padding:"8px 10px", fontWeight:700, color:d.wr>=d.wrBench?C.green:C.red }}>{d.wr}%</td><td style={{ padding:"8px 10px", color:C.muted }}>{d.wrBench}%</td><td style={{ padding:"8px 10px", fontWeight:600, color:d.asp>=d.aspBench?C.green:C.red }}>{d.asp>0?fmt(d.asp):"—"}</td><td style={{ padding:"8px 10px", color:C.muted }}>{fmt(d.aspBench)}</td><td style={{ padding:"8px 10px", fontWeight:800, color:d.ev>=d.evBench?C.green:C.red }}>{d.ev>0?fmtFull(d.ev):"—"}</td><td style={{ padding:"8px 10px", color:C.muted }}>{fmtFull(d.evBench)}</td></tr>))}</tbody>
                </table>
              </Card>
            </Section>
            <Section title="Stage Conversion vs. Pre-ABM Benchmark" sub="S0→S1 is strong. The breakdown is mid-funnel: S1→S2+ trails the 55% benchmark across all cohorts.">
              <Card>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={stageData} barCategoryGap="22%">
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                    <XAxis dataKey="stage" tick={{ fill:C.muted, fontSize:12 }} />
                    <YAxis domain={[0,100]} tick={{ fill:C.muted, fontSize:11 }} tickFormatter={v=>`${v}%`} />
                    <Tooltip content={<TT />} /><Legend wrapperStyle={{ fontSize:11 }} />
                    <Bar dataKey="Diamond" fill={C.diamond} radius={[3,3,0,0]} />
                    <Bar dataKey="Platinum" fill={C.platinum} radius={[3,3,0,0]} />
                    <Bar dataKey="Non-Target" fill={C.nonTarget} radius={[3,3,0,0]} />
                    <Bar dataKey="benchmark" name="Benchmark" fill={C.amber} opacity={0.35} radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Section>
            <Callout color={C.amber} icon="⏱️" title="Sales Cycle Elongation" text="Diamond Enterprise won deals averaged 103 days vs. the 62-day pre-ABM benchmark (66% longer). Platinum Enterprise averaged 106 days. While larger deals naturally take longer, this degree of elongation warrants investigation into whether deal qualification standards, buyer committee dynamics, or sales process has changed alongside the ABM shift." />
          </div>
        )}


        {tab === "pipeline" && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <Callout color={C.accent} icon="📐" title="Methodology"
              text="Close probabilities are calculated using observed stage-to-stage conversion rates and win rates from the current dataset, applied by tier. This produces tier-adjusted forecasts that reflect actual ABM performance rather than generic benchmarks. A naive forecast using benchmark-only probabilities would overvalue Platinum pipeline by $286K and undervalue Diamond by $206K." />
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))", gap:10 }}>
              <Metric label="Total Raw Pipeline" value="$12.7M" sub="204 open deals" color={C.accent} />
              <Metric label="Probability-Weighted" value="$4.78M" sub="38% of raw (tier-adjusted)" color={C.amber} />
              <Metric label="Platinum Overvaluation" value="$286K" sub="Using benchmark vs. actual rates" color={C.red} />
            </div>

            <Section title="Probability-Weighted Pipeline by Tier" sub="Tier-specific close probabilities vs. generic benchmark probabilities. The delta reveals forecasting risk.">
              <Card style={{ overflow:"auto", padding:0 }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                  <thead><tr style={{ borderBottom:`2px solid ${C.border}` }}>
                    {["Tier","Raw Pipeline","Close Prob (Avg)","Tier-Weighted","Benchmark-Weighted","Delta","% of Raw"].map(h=>(
                      <th key={h} style={{ padding:"10px 12px", textAlign:"left", color:C.muted, fontWeight:700, fontSize:10, textTransform:"uppercase", letterSpacing:"0.5px" }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {pipelineSummary.map((d,i)=>(
                      <tr key={i} style={{ borderBottom:`1px solid ${C.border}15` }}>
                        <td style={{ padding:"8px 12px" }}><TierDot tier={d.tier} /></td>
                        <td style={{ padding:"8px 12px", fontWeight:600 }}>{fmtFull(d.raw)}</td>
                        <td style={{ padding:"8px 12px", color:C.muted }}>{d.pctOfRaw}%</td>
                        <td style={{ padding:"8px 12px", fontWeight:700, color:d.tier==="Platinum"?C.red:C.green }}>{fmtFull(d.weighted)}</td>
                        <td style={{ padding:"8px 12px", color:C.muted }}>{fmtFull(d.benchWeighted)}</td>
                        <td style={{ padding:"8px 12px", fontWeight:700, color:d.delta>=0?C.green:C.red }}>{d.delta>=0?"+":""}${(d.delta/1000).toFixed(0)}K</td>
                        <td style={{ padding:"8px 12px", color:d.pctOfRaw<30?C.red:C.text }}>{d.pctOfRaw}%</td>
                      </tr>
                    ))}
                    <tr style={{ borderTop:`2px solid ${C.border}`, background:`${C.accent}08` }}>
                      <td style={{ padding:"8px 12px", fontWeight:700 }}>Total</td>
                      <td style={{ padding:"8px 12px", fontWeight:700 }}>$12,704,000</td>
                      <td style={{ padding:"8px 12px", color:C.muted }}>38%</td>
                      <td style={{ padding:"8px 12px", fontWeight:700 }}>$4,781,507</td>
                      <td style={{ padding:"8px 12px", color:C.muted }}>$4,628,092</td>
                      <td style={{ padding:"8px 12px", fontWeight:700, color:C.green }}>+$153K</td>
                      <td style={{ padding:"8px 12px" }}>38%</td>
                    </tr>
                  </tbody>
                </table>
              </Card>
            </Section>

            <Section title="Stage-Level Close Probabilities by Tier" sub="Observed conversion rates applied to each stage. Platinum's probability collapses at every stage.">
              <Card>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={(() => {
                    const stages = ["0-Discovery","1-Qualified","2-Proposal","3-Negotiation","4-Contract Sent"];
                    return stages.map(s => ({
                      stage: s.replace(/^\d-/, ""),
                      Diamond: Math.round(tierProbs.Diamond[s]*100),
                      Platinum: Math.round(tierProbs.Platinum[s]*100),
                      "Non-Target": Math.round(tierProbs["Non-Target"][s]*100),
                      Benchmark: Math.round(benchProbs[s]*100),
                    }));
                  })()} barCategoryGap="18%">
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                    <XAxis dataKey="stage" tick={{ fill:C.muted, fontSize:10 }} />
                    <YAxis domain={[0,100]} tick={{ fill:C.muted, fontSize:11 }} tickFormatter={v=>`${v}%`} />
                    <Tooltip content={<TT />} />
                    <Legend wrapperStyle={{ fontSize:11 }} />
                    <Bar dataKey="Diamond" fill={C.diamond} radius={[3,3,0,0]} />
                    <Bar dataKey="Platinum" fill={C.platinum} radius={[3,3,0,0]} />
                    <Bar dataKey="Non-Target" fill={C.nonTarget} radius={[3,3,0,0]} />
                    <Bar dataKey="Benchmark" fill={C.amber} opacity={0.35} radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Section>

            <Section title="Pipeline Detail by Tier × Stage" sub="Raw value, close probability, and weighted value for every tier-stage combination.">
              <Card style={{ overflow:"auto", padding:0 }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                  <thead><tr style={{ borderBottom:`2px solid ${C.border}` }}>
                    {["Tier","Stage","Deals","Raw Value","Close Prob","Weighted Value"].map(h=>(
                      <th key={h} style={{ padding:"8px 10px", textAlign:"left", color:C.muted, fontWeight:700, fontSize:10, textTransform:"uppercase" }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {pipelineByTierStage.map((d,i)=>(
                      <tr key={i} style={{ borderBottom:`1px solid ${C.border}10`, background:d.tier==="Platinum"?`${C.platinum}05`:"transparent" }}>
                        <td style={{ padding:"6px 10px" }}><TierDot tier={d.tier} /></td>
                        <td style={{ padding:"6px 10px", color:C.muted, fontSize:11 }}>{d.stage}</td>
                        <td style={{ padding:"6px 10px", color:C.text }}>{d.deals}</td>
                        <td style={{ padding:"6px 10px", color:C.muted }}>{fmtFull(d.raw)}</td>
                        <td style={{ padding:"6px 10px", fontWeight:600, color:d.prob>=0.5?C.green:d.prob>=0.2?C.amber:C.red }}>{(d.prob*100).toFixed(1)}%</td>
                        <td style={{ padding:"6px 10px", fontWeight:600 }}>{fmtFull(d.weighted)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </Section>

            <Callout color={C.red} icon="⚠️" title="Forecasting Risk: Platinum Pipeline"
              text="Platinum's $2.29M in raw pipeline converts to just $496K at observed probabilities (22% of raw). A Contract Sent deal in Platinum has only a 54% close probability vs. 91% for Diamond. If the forecast treats all tiers equally, it is overweighting Platinum by $286K. This directly impacts quarterly commit accuracy." />
          </div>
        )}

        {tab === "source" && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(170px, 1fr))", gap:10 }}>
              {(()=>{ const tgtBDR=sourceTable[0]?.rows.find(r=>r.source==="BDR Outbound"); const tgtSD=sourceTable[0]?.rows.find(r=>r.source==="SD Outbound"); const ntInb=sourceTable[1]?.rows.find(r=>r.source==="Inbound"); return <><Metric label="BDR → Target" value={tgtBDR?`${tgtBDR.wr}%`:"—"} sub={tgtBDR?`${tgtBDR.won}/${tgtBDR.total} closed`:""} color={C.green} compact /><Metric label="SD Out → Target" value={tgtSD?`${tgtSD.wr}%`:"—"} sub={tgtSD?`${tgtSD.won}/${tgtSD.total} closed`:""} color={C.red} compact /><Metric label="Non-Tgt Inbound" value={ntInb?`${ntInb.wr}%`:"—"} sub={ntInb?`${ntInb.won}/${ntInb.total} closed`:""} color={C.green} compact /><Metric label="SD Out Open Pipeline" value="27 deals" sub="At risk if 0% pattern holds" color={C.amber} compact /></>; })()}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              {sourceTable.map(({ tierGroup, rows })=>(<Card key={tierGroup}><h4 style={{ margin:"0 0 10px", fontSize:13, fontWeight:700, color:C.muted }}>{tierGroup} Accounts{isFiltered?` (${seg})`:""}</h4><ResponsiveContainer width="100%" height={200}><BarChart data={rows} layout="vertical" barCategoryGap="18%"><CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} /><XAxis type="number" domain={[0,50]} tick={{ fill:C.muted, fontSize:11 }} tickFormatter={v=>`${v}%`} /><YAxis type="category" dataKey="source" tick={{ fill:C.muted, fontSize:11 }} width={95} /><Tooltip content={<TT />} /><Bar dataKey="wr" name="Win Rate" radius={[0,4,4,0]}>{rows.map((d,i)=><Cell key={i} fill={d.wr===0?C.red:d.wr>=30?C.green:C.amber} />)}</Bar></BarChart></ResponsiveContainer></Card>))}
            </div>
            <Callout color={C.red} icon="🚨" title="MEMO FINDING: SD Outbound 0% Win Rate on Target Accounts" text="SD Outbound has closed 0 of 13 target-account deals while BDR Outbound closes at 37% on the same accounts. This is not variance. SD-sourced deals likely lack the qualification rigor that BDR process enforces, or SD reps are pursuing off-profile accounts within the target list." />
            <Callout color={C.green} icon="💡" title="MEMO FINDING: Non-Target Inbound at 40% WR" text="Non-Target Inbound accounts close at 40% (8/20), nearly double the Mid-Market benchmark. These accounts are self-selecting with high buying intent. Recommendation: profile these 8 wins for firmographic and behavioral patterns to inform ABM list expansion." />
          </div>
        )}

        {tab === "funnel" && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(190px, 1fr))", gap:10 }}>
              <Metric label="Engaged, No Pipeline" value="25 accts" sub="12 Diamond · 13 Platinum" color={C.amber} />
              <Metric label="Est. Stranded Value" value="~$1.75M" sub="Conservative $70K avg deal" color={C.red} />
              <Metric label="MQL→Opp Rate" value="22%" sub="vs. 30% benchmark (-8pp)" color={C.red} />
              <Metric label="Stalled Target Deals" value="34 of 103" sub="33% of open target pipeline" color={C.amber} />
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              <Card>
                <Section title="Engaged but No Opportunity" sub="All 25 accounts have MQLs, campaigns, and meaningful touches.">
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    {funnelDetail.engagedNoOpp.map((item,i)=>(<div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"5px 0", borderBottom:`1px solid ${C.border}15` }}><div><div style={{ fontSize:12, color:C.text }}>{item.label}</div><div style={{ fontSize:10, color:C.muted }}>{item.detail}</div></div><span style={{ fontSize:16, fontWeight:800, color:C.amber, whiteSpace:"nowrap" }}>{item.value}</span></div>))}
                  </div>
                </Section>
              </Card>
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <Card>
                  <Section title="MQL Conversion" sub="Target account MQLs converting to pipeline">
                    <div style={{ marginBottom:10 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}><span style={{ fontSize:11, color:C.muted }}>Current: 22%</span><span style={{ fontSize:11, color:C.amber }}>Benchmark: 30%</span></div>
                      <div style={{ height:12, background:"#232d42", borderRadius:6, overflow:"hidden", position:"relative" }}><div style={{ width:"22%", height:"100%", background:C.red, borderRadius:6 }} /><div style={{ position:"absolute", left:"30%", top:0, width:2, height:"100%", background:C.amber }} /></div>
                      <div style={{ fontSize:10, color:C.muted, marginTop:4 }}>7 of 32 target MQLs converted to opportunity</div>
                    </div>
                  </Section>
                </Card>
                <Card>
                  <Section title="Stall Concentration by Stage" sub="56% of stalls are at Stage 1 (Qualified)">
                    {funnelDetail.stallByStage.map((s,i)=>(<div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}><span style={{ fontSize:11, color:C.muted, width:95, flexShrink:0 }}>{s.stage}</span><div style={{ flex:1, height:7, background:"#232d42", borderRadius:4, overflow:"hidden" }}><div style={{ width:`${s.pct}%`, height:"100%", background:C.amber, borderRadius:4 }} /></div><span style={{ fontSize:11, color:C.text, width:24, textAlign:"right", fontWeight:600 }}>{s.count}</span></div>))}
                  </Section>
                </Card>
                <Card>
                  <Section title="Stall Concentration by Rep" sub="Brooks + Mitchell = 50% of all stalls">
                    {funnelDetail.stallByRep.slice(0,5).map((r,i)=>(<div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}><span style={{ fontSize:11, color:i<2?C.red:C.muted, width:110, flexShrink:0, fontWeight:i<2?700:400 }}>{r.rep}</span><div style={{ flex:1, height:7, background:"#232d42", borderRadius:4, overflow:"hidden" }}><div style={{ width:`${(r.count/9)*100}%`, height:"100%", background:i<2?C.red:C.amber, borderRadius:4 }} /></div><span style={{ fontSize:11, color:C.text, width:18, textAlign:"right", fontWeight:600 }}>{r.count}</span></div>))}
                  </Section>
                </Card>
              </div>
            </div>
            <Callout color={C.amber} icon="📋" title="MEMO FINDING: Handoff is the #1 Operational Gap" text="Marketing is generating demand (25 MQLed, campaign-engaged target accounts). Sales is not converting it. This is the single most actionable finding. Institute a 48-hour SLA on target-account MQL follow-up and run a weekly handoff review between marketing and sales leadership." />
          </div>
        )}

        {tab === "reps" && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <Section title="Rep Performance on Target Accounts" sub="Win rate vs. stalled deals. Bubble size = open pipeline value. Ideal position: high WR (right), low stalls (bottom).">
              <Card>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart margin={{ left:20, right:20, top:10, bottom:20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                    <XAxis dataKey="wr" name="Win Rate %" tick={{ fill:C.muted, fontSize:11 }} tickFormatter={v=>`${v}%`} label={{ value:"Win Rate %", position:"insideBottom", offset:-10, fill:C.muted, fontSize:11 }} />
                    <YAxis dataKey="stalled" name="Stalled Deals" tick={{ fill:C.muted, fontSize:11 }} label={{ value:"Stalled Deals", angle:-90, position:"insideLeft", offset:-5, fill:C.muted, fontSize:11 }} />
                    <ZAxis dataKey="openPipeline" range={[50,250]} name="Pipeline $" />
                    <Tooltip content={({ active, payload })=>{ if(!active||!payload?.length) return null; const d=payload[0].payload; return (<div style={{ background:"#1a2030", border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 14px", fontSize:12 }}><div style={{ fontWeight:700, color:C.text, marginBottom:4 }}>{d.rep}</div><div style={{ color:C.muted }}>Win Rate: <span style={{ color:d.wr>=25?C.green:d.wr===0?C.red:C.amber, fontWeight:600 }}>{d.wr}% ({d.won}/{d.closed})</span></div><div style={{ color:C.muted }}>Stalled: <span style={{ color:d.stalled>=6?C.red:C.text, fontWeight:600 }}>{d.stalled} deals</span></div><div style={{ color:C.muted }}>Open Pipeline: <span style={{ fontWeight:600 }}>{fmtFull(d.openPipeline)}</span></div></div>); }} />
                    <Scatter data={repDataRaw}>{repDataRaw.map((d,i)=>(<Cell key={i} fill={d.wr>=25?C.green:d.wr===0?C.red:d.stalled>=6?C.amber:C.accent} fillOpacity={0.85} />))}</Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
                <div style={{ display:"flex", gap:14, justifyContent:"center", marginTop:6 }}>{[{c:C.green,l:"WR ≥25%"},{c:C.amber,l:"High stalls (6+)"},{c:C.red,l:"0% WR"},{c:C.accent,l:"Other"}].map(({c,l})=>(<span key={l} style={{ display:"flex", gap:4, alignItems:"center", fontSize:10, color:C.muted }}><span style={{ width:7, height:7, borderRadius:"50%", background:c }} />{l}</span>))}</div>
              </Card>
            </Section>
            <Card style={{ overflow:"auto", padding:0 }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                <thead><tr style={{ borderBottom:`2px solid ${C.border}` }}>{["Rep","Won / Closed","Win Rate","Stalled Deals","Open Pipeline","Risk"].map(h=>(<th key={h} style={{ padding:"10px 12px", textAlign:"left", color:C.muted, fontWeight:700, fontSize:10, textTransform:"uppercase", letterSpacing:"0.5px" }}>{h}</th>))}</tr></thead>
                <tbody>{repDataRaw.map((d,i)=>{ const risk=d.wr===0?"Critical":d.stalled>=6?"High":d.wr<20&&d.stalled>=2?"Moderate":"Low"; const rc=risk==="Critical"?C.red:risk==="High"?C.amber:risk==="Moderate"?"#f39c12":C.green; return (<tr key={i} style={{ borderBottom:`1px solid ${C.border}15` }}><td style={{ padding:"8px 12px", fontWeight:600 }}>{d.rep}</td><td style={{ padding:"8px 12px", color:C.muted }}>{d.won} / {d.closed}</td><td style={{ padding:"8px 12px", fontWeight:700, color:d.wr>=25?C.green:d.wr===0?C.red:C.amber }}>{d.wr}%</td><td style={{ padding:"8px 12px", fontWeight:d.stalled>=6?700:400, color:d.stalled>=6?C.red:C.text }}>{d.stalled}</td><td style={{ padding:"8px 12px", color:C.muted }}>{fmtFull(d.openPipeline)}</td><td style={{ padding:"8px 12px" }}><span style={{ padding:"2px 8px", borderRadius:4, fontSize:10, fontWeight:700, background:`${rc}18`, color:rc, border:`1px solid ${rc}33` }}>{risk}</span></td></tr>); })}</tbody>
              </table>
            </Card>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              <Callout color={C.green} icon="⭐" title="Model Rep: Rachel Kim" text="75% win rate (3/4) on target accounts with zero stalled deals and clean pipeline. Study her qualification criteria, engagement cadence, and deal approach as a model for the team." />
              <Callout color={C.red} icon="🚨" title="Intervention Needed" text="Tyler Brooks (9 stalled, 33% WR), Ryan Mitchell (8 stalled, 10% WR), and Marcus Williams (0% WR, 0/8) collectively carry $2.75M in open pipeline that needs immediate review." />
            </div>
          </div>
        )}

        {tab === "recs" && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <Section title="Strategic Recommendations" sub="Five actions for the CRO based on the data. Ordered by expected impact.">
              {[
                { num:"1", title:"Rebuild Platinum selection criteria or sunset the tier", detail:"Platinum Enterprise EV/opp ($7.8K) is half of what non-targeted accounts produce. Either raise the qualification bar (firmer ICP fit, higher intent thresholds) or reallocate those ABM dollars toward expanding the Diamond list with accounts that match the Diamond profile.", impact:"High", color:C.red, finding:"Platinum EV = 0.50x benchmark" },
                { num:"2", title:"Institute a 48-hour SLA on target-account MQL follow-up", detail:"The 25 engaged-but-no-opportunity target accounts should be immediately assigned and contacted. Implement a weekly handoff review between marketing and sales leadership to track MQL-to-opportunity conversion by rep.", impact:"High", color:C.amber, finding:"25 stranded accounts, 22% MQL→Opp rate" },
                { num:"3", title:"Audit SD Outbound process on target accounts", detail:"0/13 closed is not variance. Require SD-sourced target deals to pass the same qualification criteria as BDR-sourced deals before entering pipeline. BDR closes at 37% on the same target accounts.", impact:"High", color:C.red, finding:"SD Outbound = 0% WR vs. BDR = 37%" },
                { num:"4", title:"Targeted rep coaching on stalled pipeline", detail:"Tyler Brooks and Ryan Mitchell carry 50% of all stalled target deals. Implement 30-day stage disposition deadlines: advance, disqualify, or return to marketing for re-nurture.", impact:"Medium", color:C.amber, finding:"Brooks (9) + Mitchell (8) = 17 of 34 stalls" },
                { num:"5", title:"Mine Non-Target Inbound wins for ABM list expansion", detail:"Profile the 8 Non-Target Inbound wins (40% WR) for firmographic and behavioral patterns that should be added to Diamond targeting criteria. These accounts are self-selecting with high intent.", impact:"Medium", color:C.green, finding:"Non-Target Inbound = 40% WR (8/20)" },
              ].map((rec,i)=>(<Card key={i} style={{ borderLeft:`3px solid ${rec.color}`, borderRadius:"0 10px 10px 0" }}><div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8, flexWrap:"wrap", gap:8 }}><div style={{ display:"flex", alignItems:"center", gap:10 }}><span style={{ width:28, height:28, borderRadius:"50%", background:`${rec.color}22`, color:rec.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:800, border:`1px solid ${rec.color}44` }}>{rec.num}</span><h4 style={{ margin:0, fontSize:14, fontWeight:700, color:C.text }}>{rec.title}</h4></div><span style={{ padding:"2px 8px", borderRadius:4, fontSize:10, fontWeight:700, background:`${rec.color}18`, color:rec.color, border:`1px solid ${rec.color}33` }}>{rec.impact} Impact</span></div><p style={{ margin:"0 0 8px", fontSize:13, color:C.text, lineHeight:1.6, paddingLeft:38 }}>{rec.detail}</p><div style={{ paddingLeft:38, fontSize:11, color:C.muted }}><span style={{ fontWeight:600 }}>Supporting data:</span> {rec.finding}</div></Card>))}
            </Section>
            <Section title="Key Ongoing Metrics" sub="Three metrics to monitor ABM health on an ongoing basis.">
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))", gap:12 }}>
                {[
                  { metric:"ABM Expected Value Premium", formula:"Target EV/opp ÷ Non-Target EV/opp", frequency:"Quarterly, segment-controlled", current:"Diamond = 1.55x (strong) · Platinum = 0.50x (failing)", why:"Combines win rate and deal size into one efficiency metric. Isolates ABM’s incremental value from segment mix." },
                  { metric:"Target MQL-to-Opportunity Rate", formula:"Target MQLs with pipeline ÷ Total target MQLs", frequency:"Weekly, by rep", current:"22% vs. 30% benchmark", why:"Leading indicator of handoff health. Surfaces breakdowns before they impact quarterly pipeline." },
                  { metric:"Stalled Deal Ratio by Rep", formula:"Deals >21 days in stage ÷ Total open deals, per rep", frequency:"Biweekly", current:"33% overall; Brooks 53%, Mitchell 62%", why:"Creates rep-level accountability for pipeline hygiene without waiting for lost-deal postmortems." },
                ].map((m,i)=>(<Card key={i} style={{ borderTop:`3px solid ${C.accent}` }}><h4 style={{ margin:"0 0 6px", fontSize:13, fontWeight:700, color:C.accent }}>{m.metric}</h4><div style={{ fontSize:11, color:C.muted, marginBottom:4 }}><span style={{ fontWeight:600 }}>Formula:</span> {m.formula}</div><div style={{ fontSize:11, color:C.muted, marginBottom:4 }}><span style={{ fontWeight:600 }}>Frequency:</span> {m.frequency}</div><div style={{ fontSize:11, color:C.amber, marginBottom:6 }}><span style={{ fontWeight:600 }}>Current:</span> {m.current}</div><div style={{ fontSize:11, color:C.text, lineHeight:1.5, borderTop:`1px solid ${C.border}`, paddingTop:6 }}>{m.why}</div></Card>))}
              </div>
            </Section>
            <Section title="Data Gaps & Proposed Next Steps" sub="Four gaps that would move this from directional findings to decision-grade conclusions.">
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                {[
                  { gap:"ABM spend by tier and account", build:"Cost-per-qualified-opportunity and cost-per-closed-won by tier. Would pressure-test the Platinum reallocation recommendation and size the Diamond expansion opportunity." },
                  { gap:"Full stage timestamps", build:"Stage-by-stage velocity waterfall to pinpoint exactly where deals stall. True sales cycle duration for open pipeline to improve forecast accuracy." },
                  { gap:"Closed Lost reason codes", build:"Root-cause diagnosis for Platinum’s 35.8% loss rate. Competitive losses = targeting fix. Pricing = packaging fix. Timing = nurture fix." },
                  { gap:"Multi-touch campaign attribution", build:"ABM campaign sequence analysis. Which plays (LinkedIn → webinar → BDR) produce pipeline vs. single-touch exposure." },
                ].map((d,i)=>(<Card key={i}><h4 style={{ margin:"0 0 6px", fontSize:13, fontWeight:700, color:C.text }}>{d.gap}</h4><div style={{ fontSize:12, color:C.muted, lineHeight:1.5 }}><span style={{ fontWeight:600, color:C.accent }}>What I'd build:</span> {d.build}</div></Card>))}
              </div>
            </Section>
            <Callout color={C.accent} icon="📊" title="30-Day Deliverable" text="If hired, my first deliverable would be a weekly ABM Health Scorecard integrating these three metrics with pipeline coverage ratios and rep-level accountability views, built to surface problems before they hit the quarterly number." />
          </div>
        )}

        <div style={{ marginTop:28, padding:"12px 0", borderTop:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between" }}>
          <span style={{ fontSize:10, color:C.muted }}>Data: Camalytics Q1/Q2 2026 pipeline, account activity, and historical benchmarks. Companion to written memo.</span>
          <span style={{ fontSize:10, color:C.muted }}>Bradley Hartnett · Senior Sales Revenue Analyst Case Study</span>
        </div>
      </div>
    </div>
  );
}

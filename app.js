const SOURCE=window.DASHBOARD_DATA;
let DATA=JSON.parse(JSON.stringify(SOURCE));
let selectedRow=null;
let mapRoot=null,mapSeries=null,mapHeatLegend=null;

const $=id=>document.getElementById(id);
const N=v=>{const n=Number(v);return Number.isFinite(n)?n:0};
const sum=(rows,key)=>rows.reduce((a,r)=>a+N(r[key]),0);
const weighted=(rows,key,weight="Total Population")=>{let a=0,b=0;rows.forEach(r=>{const w=N(r[weight]);if(w>0){a+=N(r[key])*w;b+=w}});return b?a/b:0};
const avg=(rows,key)=>rows.length?rows.reduce((a,r)=>a+N(r[key]),0)/rows.length:0;
const fmt0=v=>new Intl.NumberFormat("en-IN",{maximumFractionDigits:0}).format(N(v));
const fmt1=v=>new Intl.NumberFormat("en-IN",{maximumFractionDigits:1}).format(N(v));
const pct=v=>`${(N(v)*100).toFixed(1)}%`;
const rupee=v=>`₹${fmt0(v)}`;
const crore=v=>`₹${fmt1(v)} Cr`;
const short=v=>{const n=N(v),a=Math.abs(n);if(a>=1e9)return`${(n/1e9).toFixed(2)}B`;if(a>=1e6)return`${(n/1e6).toFixed(2)}M`;if(a>=1e3)return`${(n/1e3).toFixed(1)}K`;return fmt0(n)};
const group=(rows,key)=>rows.reduce((m,r)=>{const k=r[key]||"Unknown";(m[k]??=[]).push(r);return m},{});
const groupSum=(rows,by,key)=>Object.entries(group(rows,by)).map(([name,rs])=>({name,value:sum(rs,key),rows:rs}));
const groupWeighted=(rows,by,key)=>Object.entries(group(rows,by)).map(([name,rs])=>({name,value:weighted(rs,key),rows:rs}));
const top=(a,n=10)=>[...a].sort((x,y)=>y.value-x.value).slice(0,n);

const C={sky:"#50c8ff",green:"#4de2a6",violet:"#ad82ff",gold:"#f6cb67",orange:"#ff9f68",cyan:"#5ee1dc",muted:"#8da6bb",grid:"rgba(185,215,238,.10)"};
const conf={displayModeBar:false,responsive:true};
const base={paper_bgcolor:"rgba(0,0,0,0)",plot_bgcolor:"rgba(0,0,0,0)",font:{family:"Inter",color:"#9bb2c2",size:9},margin:{l:45,r:15,t:12,b:42},
xaxis:{gridcolor:C.grid,zeroline:false,tickfont:{size:8,color:"#7893a7"}},yaxis:{gridcolor:C.grid,zeroline:false,tickfont:{size:8,color:"#7893a7"}},legend:{orientation:"h",y:-.18,font:{size:8,color:"#91a9bb"}},hoverlabel:{bgcolor:"#10283b",font:{color:"white",size:10}}};
function plot(id,traces,layout={}){
  const el=$(id); if(!el) return;
  if(typeof Plotly==="undefined"){ el.innerHTML='<div class="map-loading">Chart library could not load. Refresh the page.</div>'; return; }
  try{ Plotly.react(id,traces,{...base,...layout},conf); }catch(err){ console.error("Chart error",id,err); }
}
function set(id,val){if($(id))$(id).textContent=val}
function rowsNow(){const rg=$("regionFilter").value,st=$("stateFilter").value,di=$("districtFilter").value;return DATA.districts.filter(r=>(rg==="ALL"||r.Region===rg)&&(st==="ALL"||r.State===st)&&(di==="ALL"||r.District===di))}
function stateScope(){const rg=$("regionFilter").value,st=$("stateFilter").value,di=$("districtFilter").value;if(di!=="ALL"){const d=DATA.districts.find(r=>r.District===di&&(st==="ALL"||r.State===st));return d?DATA.states.filter(r=>r.State===d.State):[]}if(st!=="ALL")return DATA.states.filter(r=>r.State===st);if(rg!=="ALL"){const names=new Set(DATA.districts.filter(r=>r.Region===rg).map(r=>r.State));return DATA.states.filter(r=>names.has(r.State))}return DATA.states}
function scopeName(){const a=[];if($("regionFilter").value!=="ALL")a.push($("regionFilter").value);if($("stateFilter").value!=="ALL")a.push($("stateFilter").value);if($("districtFilter").value!=="ALL")a.push($("districtFilter").value);return a.length?a.join(" • "):"All India"}
function populate(){const regs=[...new Set(DATA.districts.map(r=>r.Region).filter(Boolean))].sort(),sts=[...new Set(DATA.districts.map(r=>r.State).filter(Boolean))].sort();$("regionFilter").innerHTML='<option value="ALL">All India</option>'+regs.map(x=>`<option>${x}</option>`).join("");$("stateFilter").innerHTML='<option value="ALL">All States / UTs</option>'+sts.map(x=>`<option>${x}</option>`).join("");districtOptions()}
function districtOptions(){const rg=$("regionFilter").value,st=$("stateFilter").value,old=$("districtFilter").value;const ds=[...new Set(DATA.districts.filter(r=>(rg==="ALL"||r.Region===rg)&&(st==="ALL"||r.State===st)).map(r=>r.District).filter(Boolean))].sort();$("districtFilter").innerHTML='<option value="ALL">All Districts</option>'+ds.map(x=>`<option>${x}</option>`).join("");if(ds.includes(old))$("districtFilter").value=old}

const STATE_CODES={
"Maharashtra":"IN-MH","Tamil Nadu":"IN-TN","Delhi":"IN-DL","Karnataka":"IN-KA","Gujarat":"IN-GJ","Uttar Pradesh":"IN-UP","Haryana":"IN-HR","Madhya Pradesh":"IN-MP","Telangana":"IN-TS","West Bengal":"IN-WB","Andhra Pradesh":"IN-AP","Kerala":"IN-KL","Bihar":"IN-BR","Rajasthan":"IN-RJ","Odisha":"IN-OD","Punjab":"IN-PB","Assam":"IN-AS","Chhattisgarh":"IN-CT","Jharkhand":"IN-JH","Uttarakhand":"IN-UK","Jammu and Kashmir":"IN-JK","Himachal Pradesh":"IN-HP","Goa":"IN-GA","Manipur":"IN-MN","Sikkim":"IN-SK","Nagaland":"IN-NL","Meghalaya":"IN-ML","Mizoram":"IN-MZ","Tripura":"IN-TR","Andaman and Nicobar Islands":"IN-AN","Puducherry":"IN-PY","Dadra and Nagar Haveli and Daman and Diu":"IN-DH","Arunachal Pradesh":"IN-AR","Ladakh":"IN-LA","Chandigarh":"IN-CH","Lakshadweep":"IN-LD"
};
function stateDensities(rows){
  return Object.entries(group(rows,"State")).map(([name,rs])=>{
    const pop=sum(rs,"Total Population");
    const area=rs.reduce((a,r)=>{const d=N(r["Population Density (per sq km)"]);return a+(d>0?N(r["Total Population"])/d:0)},0);
    return {name,value:area>0?pop/area:0,pop};
  }).filter(x=>x.value>0)
}

function initMap(){
  const mapEl=$("densityMap");
  if(!mapEl) return;
  if(!(window.am5&&window.am5map&&window.am5geodata_india2020Low&&window.am5themes_Animated)) throw new Error("India map library unavailable");
  if(mapRoot){ try{mapRoot.dispose()}catch(e){} mapRoot=null;mapSeries=null; }
  mapRoot=am5.Root.new("densityMap");
  mapRoot.setThemes([am5themes_Animated.new(mapRoot)]);
  const chart=mapRoot.container.children.push(am5map.MapChart.new(mapRoot,{panX:"none",panY:"none",wheelX:"none",wheelY:"none",projection:am5map.geoMercator(),paddingTop:8,paddingRight:8,paddingBottom:28,paddingLeft:8}));
  mapSeries=chart.series.push(am5map.MapPolygonSeries.new(mapRoot,{geoJSON:am5geodata_india2020Low,valueField:"value",calculateAggregates:true}));
  mapSeries.mapPolygons.template.setAll({tooltipText:"{name}\n{value.formatNumber('#,###')} people per sq. km",interactive:true,stroke:am5.color(0x07111d),strokeWidth:1});
  mapSeries.set("heatRules",[{target:mapSeries.mapPolygons.template,dataField:"value",min:am5.color(0x17324a),max:am5.color(0x50c8ff),key:"fill"}]);
  mapSeries.mapPolygons.template.states.create("hover",{fill:am5.color(0xf6cb67)});
  mapHeatLegend=chart.children.push(am5.HeatLegend.new(mapRoot,{orientation:"horizontal",startColor:am5.color(0x17324a),endColor:am5.color(0x50c8ff),startText:"Lower density",endText:"Higher density",x:am5.percent(50),centerX:am5.percent(50),y:am5.percent(98),centerY:am5.percent(100),width:am5.percent(72)}));
  mapHeatLegend.startLabel.setAll({fontSize:10,fill:am5.color(0x91a9bb)});mapHeatLegend.endLabel.setAll({fontSize:10,fill:am5.color(0x91a9bb)});
  mapSeries.events.on("datavalidated",()=>{mapHeatLegend.set("startValue",mapSeries.getPrivate("valueLow"));mapHeatLegend.set("endValue",mapSeries.getPrivate("valueHigh"))});
}
function updateMap(rows){
  if(!mapSeries)return;
  const d=stateDensities(rows).map(x=>({id:STATE_CODES[x.name],value:x.value,state:x.name,population:x.pop})).filter(x=>x.id);
  mapSeries.data.setAll(d)
}
function renderMapFallback(rows){
  const el=$("densityMap"); if(!el)return;
  el.innerHTML='<div id="mapFallbackPlot" class="map-fallback-ranking"></div>';
  const vals=stateDensities(rows).sort((a,b)=>b.value-a.value).slice(0,12).reverse();
  plot("mapFallbackPlot",[{type:"bar",orientation:"h",y:vals.map(x=>x.name),x:vals.map(x=>x.value),marker:{color:vals.map(x=>x.value),colorscale:[[0,"#17324a"],[1,"#50c8ff"]],showscale:false},hovertemplate:"%{y}<br>%{x:,.0f} people / sq km<extra></extra>"}],{margin:{l:115,r:10,t:10,b:35},xaxis:{...base.xaxis,title:"People per sq. km"}});
}
function renderSummary(rows){
  const pop=sum(rows,"Total Population"),liter=weighted(rows,"Literacy Rate"),emp=weighted(rows,"Employment Rate");
  const dens=stateDensities(rows).sort((a,b)=>b.value-a.value)[0];
  const stateCount=new Set(rows.map(r=>r.State)).size;
  const where=scopeName();
  let s=`${where} covers about ${short(pop)} people across ${fmt0(rows.length)} district records`;
  if(stateCount>1)s+=` and ${fmt0(stateCount)} states/UTs`;
  s+=`. Estimated literacy is ${pct(liter)} and employment is ${pct(emp)}.`;
  if(dens)s+=` The most densely populated state in this view is ${dens.name} at about ${fmt0(dens.value)} people per sq. km.`;
  set("summarySentence",s)
}
function renderOverview(rows){
  const pop=sum(rows,"Total Population");set("oPopulation",short(pop));set("oDistricts",fmt0(rows.length));set("oGDP",crore(sum(rows,"District GDP (Est. ₹ Cr)")));set("oLiteracy",pct(weighted(rows,"Literacy Rate")));set("oEmployment",pct(weighted(rows,"Employment Rate")));set("oUrban",pct(pop?sum(rows,"Urban Population (Estimated)")/pop:0));
  const sp=top(groupSum(rows,"State","Total Population"),10).reverse();plot("topPopulation",[{type:"bar",orientation:"h",y:sp.map(x=>x.name),x:sp.map(x=>x.value),marker:{color:C.sky},hovertemplate:"%{y}<br>%{x:,.0f} people<extra></extra>"}],{margin:{l:105,r:10,t:8,b:35},xaxis:{...base.xaxis,tickformat:".2s"}});
  const states=Object.entries(group(rows,"State")).map(([name,rs])=>({name,pop:sum(rs,"Total Population"),gdp:sum(rs,"District GDP (Est. ₹ Cr)")}));plot("gdpVsPopulation",[{type:"scatter",mode:"markers",x:states.map(x=>x.pop),y:states.map(x=>x.gdp),text:states.map(x=>x.name),marker:{size:10,color:C.violet,opacity:.78},hovertemplate:"%{text}<br>Population %{x:,.0f}<br>GDP ₹%{y:,.1f} Cr<extra></extra>"}],{xaxis:{...base.xaxis,title:"Population",tickformat:".2s"},yaxis:{...base.yaxis,title:"GDP ₹ Cr",tickformat:".2s"}});
  const rg=groupSum(rows,"Region","Total Population").sort((a,b)=>b.value-a.value);plot("regionShare",[{type:"pie",labels:rg.map(x=>x.name),values:rg.map(x=>x.value),hole:.62,marker:{colors:[C.sky,C.violet,C.green,C.gold,C.orange,C.cyan]},textinfo:"percent",hovertemplate:"%{label}<br>%{value:,.0f}<extra></extra>"}],{margin:{l:10,r:10,t:3,b:25},legend:{...base.legend,y:-.13}});
  const dd=top(rows.map(r=>({name:`${r.District}, ${r.State}`,value:N(r["Population Density (per sq km)"])})),10).reverse();plot("topDensityDistricts",[{type:"bar",orientation:"h",y:dd.map(x=>x.name),x:dd.map(x=>x.value),marker:{color:C.gold}}],{margin:{l:135,r:10,t:8,b:35}});
  updateMap(rows)
}
function renderWelfare(rows){
  set("wPoverty",pct(weighted(rows,"Poverty Rate")));set("wLife",`${fmt1(weighted(rows,"Life Expectancy"))} yrs`);set("wHospitals",fmt0(sum(rows,"Hospitals")));set("wEducation",fmt0(sum(rows,"Number of Educational Institutions")));set("wInternet",pct(weighted(rows,"Internet Penetration")));set("wSmartphone",pct(weighted(rows,"Smartphone Penetration")));
  plot("povertyDevelopment",[{type:"scatter",mode:"markers",x:rows.map(r=>N(r["Poverty Rate"])*100),y:rows.map(r=>N(r["Development Index"])),text:rows.map(r=>`${r.District}, ${r.State}`),marker:{size:7,color:rows.map(r=>N(r["Prosperity Score"])),colorscale:"Viridis",showscale:true,colorbar:{thickness:8,title:"Prosperity"}},hovertemplate:"%{text}<br>Poverty %{x:.1f}%<br>Development %{y:.2f}<extra></extra>"}],{xaxis:{...base.xaxis,title:"Poverty %"},yaxis:{...base.yaxis,title:"Development Index"}});
  const ds=Object.entries(group(rows,"State")).map(([name,rs])=>({name,i:weighted(rs,"Internet Penetration")*100,s:weighted(rs,"Smartphone Penetration")*100})).sort((a,b)=>b.s-a.s).slice(0,8).reverse();plot("digitalAccess",[{type:"bar",orientation:"h",name:"Internet",y:ds.map(x=>x.name),x:ds.map(x=>x.i),marker:{color:C.sky}},{type:"bar",orientation:"h",name:"Smartphone",y:ds.map(x=>x.name),x:ds.map(x=>x.s),marker:{color:C.green}}],{barmode:"group",margin:{l:105,r:10,t:8,b:35},xaxis:{...base.xaxis,ticksuffix:"%"}});
  const hp=Object.entries(group(rows,"State")).map(([name,rs])=>({name,p:sum(rs,"Total Population"),h:sum(rs,"Hospitals")}));plot("hospitalPopulation",[{type:"scatter",mode:"markers",x:hp.map(x=>x.p),y:hp.map(x=>x.h),text:hp.map(x=>x.name),marker:{size:10,color:C.green,opacity:.75},hovertemplate:"%{text}<br>Population %{x:,.0f}<br>Hospitals %{y:,.0f}<extra></extra>"}],{xaxis:{...base.xaxis,title:"Population",tickformat:".2s"},yaxis:{...base.yaxis,title:"Hospitals"}});
  const wb=Object.entries(group(rows,"Region")).map(([name,rs])=>({name,p:avg(rs,"Prosperity Score"),h:avg(rs,"Happiness Score")}));plot("wellbeing",[{type:"bar",name:"Prosperity",x:wb.map(x=>x.name),y:wb.map(x=>x.p),marker:{color:C.violet}},{type:"bar",name:"Happiness",x:wb.map(x=>x.name),y:wb.map(x=>x.h),marker:{color:C.green}}],{barmode:"group",margin:{l:40,r:10,t:8,b:55}});
  const pr=groupWeighted(rows,"Region","Poverty Rate").sort((a,b)=>b.value-a.value);plot("povertyRegion",[{type:"bar",x:pr.map(x=>x.name),y:pr.map(x=>x.value*100),marker:{color:C.orange}}],{yaxis:{...base.yaxis,ticksuffix:"%"},margin:{l:40,r:10,t:8,b:55}})
}
function renderEconomy(rows){
  set("eGDP",crore(sum(rows,"District GDP (Est. ₹ Cr)")));set("ePCI",rupee(weighted(rows,"Per Capita Income (₹)")));set("eHHIncome",rupee(weighted(rows,"Household Income (₹)")));set("eTotalIncome",`₹${short(sum(rows,"Total Income (₹)"))}`);set("eMillionaires",fmt0(sum(rows,"Estimated Number of Millionaires")));set("eNetWorth",`$${fmt1(sum(rows,"Estimated Net Worth (USD Bn)"))}B`);
  const g=top(groupSum(rows,"State","District GDP (Est. ₹ Cr)"),10).reverse();plot("stateGDP",[{type:"bar",orientation:"h",y:g.map(x=>x.name),x:g.map(x=>x.value),marker:{color:C.violet}}],{margin:{l:105,r:10,t:8,b:35},xaxis:{...base.xaxis,tickformat:".2s"}});
  const pi=top(groupWeighted(rows,"State","Per Capita Income (₹)"),10).reverse();plot("statePCI",[{type:"bar",orientation:"h",y:pi.map(x=>x.name),x:pi.map(x=>x.value),marker:{color:C.gold}}],{margin:{l:105,r:10,t:8,b:35},xaxis:{...base.xaxis,tickprefix:"₹",tickformat:".2s"}});
  const ind=groupSum(rows,"Major Industry","District GDP (Est. ₹ Cr)").sort((a,b)=>b.value-a.value).slice(0,15);plot("industryMix",[{type:"treemap",labels:ind.map(x=>x.name),parents:ind.map(()=>""),values:ind.map(x=>x.value),marker:{colors:ind.map((_,i)=>[C.violet,C.sky,C.green,C.gold,C.orange,C.cyan][i%6])},textinfo:"label+value",hovertemplate:"%{label}<br>₹%{value:,.1f} Cr<extra></extra>"}],{margin:{l:5,r:5,t:5,b:5}});
  const gi=[["Male","Male Income Contribution (₹)"],["Female","Female Income Contribution (₹)"],["Non-Binary","Non Binary Income Contribution (₹)"]].map(([name,key])=>({name,value:sum(rows,key)}));plot("genderIncome",[{type:"pie",labels:gi.map(x=>x.name),values:gi.map(x=>x.value),hole:.62,marker:{colors:[C.sky,C.violet,C.gold]},textinfo:"percent"}],{margin:{l:10,r:10,t:3,b:25},legend:{...base.legend,y:-.13}});
  plot("incomeProsperity",[{type:"scatter",mode:"markers",x:rows.map(r=>N(r["Per Capita Income (₹)"])),y:rows.map(r=>N(r["Prosperity Score"])),text:rows.map(r=>`${r.District}, ${r.State}`),marker:{size:7,color:C.violet,opacity:.7},hovertemplate:"%{text}<br>Income ₹%{x:,.0f}<br>Prosperity %{y:.1f}<extra></extra>"}],{xaxis:{...base.xaxis,title:"Income per person ₹",tickformat:".2s"},yaxis:{...base.yaxis,title:"Prosperity score"}})
}
function renderPeople(rows){
  const pop=sum(rows,"Total Population"),male=sum(rows,"Male Population"),female=sum(rows,"Female Population"),nb=sum(rows,"Non Binary Population"),rural=sum(rows,"Rural Population (Estimated)"),youth=sum(rows,"Age 0-9")+sum(rows,"Age 10-19"),senior=sum(rows,"Age 60+");
  set("pMale",short(male));set("pFemale",short(female));set("pNB",short(nb));set("pRural",pct(pop?rural/pop:0));set("pYouth",pct(pop?youth/pop:0));set("pSenior",pct(pop?senior/pop:0));
  const ages=["Age 0-9","Age 10-19","Age 20-29","Age 30-39","Age 40-49","Age 50-59","Age 60+"];plot("ageGroups",[{type:"bar",x:ages.map(x=>x.replace("Age ","")),y:ages.map(x=>sum(rows,x)),marker:{color:[C.sky,C.sky,C.violet,C.violet,C.green,C.gold,C.orange]}}],{yaxis:{...base.yaxis,tickformat:".2s"}});
  plot("genderMix",[{type:"pie",labels:["Male","Female","Non-Binary"],values:[male,female,nb],hole:.64,marker:{colors:[C.sky,C.violet,C.gold]},textinfo:"percent"}],{margin:{l:10,r:10,t:3,b:25},legend:{...base.legend,y:-.13}});
  plot("ruralUrban",[{type:"pie",labels:["Rural","Urban"],values:[rural,sum(rows,"Urban Population (Estimated)")],hole:.64,marker:{colors:[C.green,C.sky]},textinfo:"percent"}],{margin:{l:10,r:10,t:3,b:25},legend:{...base.legend,y:-.13}});
  const rel=[["Hindu","Hindu Population (Estimated)"],["Muslim","Muslim Population (Estimated)"],["Christian","Christian Population (Estimated)"],["Sikh","Sikh Population (Estimated)"],["Buddhist","Buddhist Population (Estimated)"],["Jain","Jain Population (Estimated)"],["Other","Other / Not Stated Religion (Estimated)"]].map(([name,key])=>({name,value:sum(rows,key)})).filter(x=>x.value>0);plot("religionMix",[{type:"pie",labels:rel.map(x=>x.name),values:rel.map(x=>x.value),hole:.45,marker:{colors:[C.gold,C.green,C.violet,C.sky,C.orange,C.cyan,"#71899c"]},textinfo:"percent"}],{margin:{l:10,r:10,t:3,b:25},legend:{...base.legend,y:-.2}});
  plot("socialGroups",[{type:"pie",labels:["Scheduled Caste","Scheduled Tribe","Other"],values:[sum(rows,"Scheduled Caste Population (Estimated)"),sum(rows,"Scheduled Tribe Population (Estimated)"),sum(rows,"Non-SC/ST Population (Estimated)")],hole:.6,marker:{colors:[C.orange,C.green,C.sky]},textinfo:"percent"}],{margin:{l:10,r:10,t:3,b:25},legend:{...base.legend,y:-.13}});
  const d=top(rows.map(r=>({name:`${r.District}, ${r.State}`,value:N(r["Population Density (per sq km)"])})),15).reverse();plot("densityRanking",[{type:"bar",orientation:"h",y:d.map(x=>x.name),x:d.map(x=>x.value),marker:{color:C.gold}}],{margin:{l:150,r:10,t:8,b:35}})
}
function renderTax(rows){
  const sr=stateScope();let income=sum(sr,"Income Tax Collection (Est. ₹ Cr)"),gst=sum(sr,"GST Collection (Est. ₹ Cr)"),other=sum(sr,"Other Taxes Collection (Est. ₹ Cr)"),total=sum(sr,"Total Tax Collection (Est. ₹ Cr)");
  const gdp=sum(sr,"Total State GDP (₹ Cr)"),pop=sum(sr,"Total Population"),tg=gdp?total/gdp:0,tpc=pop?(total*1e7)/pop:0;
  set("tTotal",crore(total));set("tIncome",crore(income));set("tGST",crore(gst));set("tOther",crore(other));set("tTaxGDP",pct(tg));set("tTaxPC",rupee(tpc));
  const tt=top(sr.map(r=>({name:r.State,value:N(r["Total Tax Collection (Est. ₹ Cr)"])})),12).reverse();plot("topTaxStates",[{type:"bar",orientation:"h",y:tt.map(x=>x.name),x:tt.map(x=>x.value),marker:{color:C.orange}}],{margin:{l:110,r:10,t:8,b:35},xaxis:{...base.xaxis,tickformat:".2s"}});
  plot("taxMix",[{type:"pie",labels:["Income Tax","GST","Other Taxes"],values:[income,gst,other],hole:.62,marker:{colors:[C.sky,C.orange,C.gold]},textinfo:"percent"}],{margin:{l:10,r:10,t:3,b:25},legend:{...base.legend,y:-.13}});
  plot("taxEfficiency",[{type:"scatter",mode:"markers",x:sr.map(r=>N(r["Tax-to-GDP Ratio (Estimated)"])*100),y:sr.map(r=>N(r["Tax Per Capita (Est. ₹)"])),text:sr.map(r=>r.State),marker:{size:10,color:C.orange,opacity:.78},hovertemplate:"%{text}<br>Tax/GDP %{x:.1f}%<br>Tax/person ₹%{y:,.0f}<extra></extra>"}],{xaxis:{...base.xaxis,title:"Tax-to-GDP %"},yaxis:{...base.yaxis,title:"Tax per person ₹"}});
  plot("genderTax",[{type:"pie",labels:["Male","Female","Non-Binary"],values:[sum(sr,"Male Total Tax (Modelled ₹ Cr)"),sum(sr,"Female Total Tax (Modelled ₹ Cr)"),sum(sr,"Non-Binary Total Tax (Modelled ₹ Cr)")],hole:.62,marker:{colors:[C.sky,C.violet,C.gold]},textinfo:"percent"}],{margin:{l:10,r:10,t:3,b:25},legend:{...base.legend,y:-.13}});
  const pc=top(sr.map(r=>({name:r.State,value:N(r["Tax Per Capita (Est. ₹)"])})),10).reverse();plot("taxPCStates",[{type:"bar",orientation:"h",y:pc.map(x=>x.name),x:pc.map(x=>x.value),marker:{color:C.gold}}],{margin:{l:105,r:10,t:8,b:35},xaxis:{...base.xaxis,tickprefix:"₹",tickformat:".2s"}})
}
function renderExplore(rows){
  const r=selectedRow&&rows.includes(selectedRow)?selectedRow:null,scope=r?[r]:rows;set("xDistrict",r?r.District:(rows.length===1?rows[0].District:"All"));set("xState",r?r.State:scopeName());set("xPopulation",short(sum(scope,"Total Population")));set("xGDP",crore(sum(scope,"District GDP (Est. ₹ Cr)")));set("xPCI",rupee(weighted(scope,"Per Capita Income (₹)")));set("xLiteracy",pct(weighted(scope,"Literacy Rate")));set("xPoverty",pct(weighted(scope,"Poverty Rate")));
  const m=[["Literacy",weighted(scope,"Literacy Rate")*100,weighted(rows,"Literacy Rate")*100],["Employment",weighted(scope,"Employment Rate")*100,weighted(rows,"Employment Rate")*100],["Internet",weighted(scope,"Internet Penetration")*100,weighted(rows,"Internet Penetration")*100],["Smartphone",weighted(scope,"Smartphone Penetration")*100,weighted(rows,"Smartphone Penetration")*100],["Prosperity",avg(scope,"Prosperity Score"),avg(rows,"Prosperity Score")],["Happiness",avg(scope,"Happiness Score")*10,avg(rows,"Happiness Score")*10]];
  plot("districtRadar",[{type:"scatterpolar",r:m.map(x=>x[1]),theta:m.map(x=>x[0]),fill:"toself",name:r?r.District:"Current view",line:{color:C.cyan},fillcolor:"rgba(94,225,220,.15)"},{type:"scatterpolar",r:m.map(x=>x[2]),theta:m.map(x=>x[0]),fill:"toself",name:"Filtered average",line:{color:C.violet},fillcolor:"rgba(173,130,255,.08)"}],{margin:{l:30,r:30,t:15,b:30},polar:{bgcolor:"rgba(0,0,0,0)",radialaxis:{gridcolor:C.grid,tickfont:{size:7,color:"#68849a"}},angularaxis:{gridcolor:C.grid,tickfont:{size:8,color:"#a8bdcc"}}},legend:{...base.legend,y:-.08}});
  const ind=groupSum(rows,"Major Industry","Total Population").sort((a,b)=>b.value-a.value).slice(0,10);plot("explorerIndustry",[{type:"bar",orientation:"h",y:ind.map(x=>x.name).reverse(),x:ind.map(x=>x.value).reverse(),marker:{color:C.cyan}}],{margin:{l:115,r:10,t:8,b:35},xaxis:{...base.xaxis,tickformat:".2s"}});
  table(rows)
}
function table(rows){const q=$("districtSearch").value.trim().toLowerCase(),show=rows.filter(r=>!q||[r.State,r.District,r.Region,r["Major Industry"]].join(" ").toLowerCase().includes(q)).slice(0,300);set("tableCount",`${fmt0(show.length)} rows${rows.length>300?" shown":""}`);$("districtTable").querySelector("tbody").innerHTML=show.map(r=>`<tr data-key="${r.State}|||${r.District}" class="${selectedRow===r?"selected":""}"><td>${r.State}</td><td>${r.District}</td><td>${r.Region}</td><td>${fmt0(r["Total Population"])}</td><td>${fmt1(r["District GDP (Est. ₹ Cr)"])}</td><td>${pct(r["Literacy Rate"])}</td><td>${pct(r["Employment Rate"])}</td><td>${pct(r["Poverty Rate"])}</td><td>${fmt0(r["Per Capita Income (₹)"])}</td><td>${r["Major Industry"]||"—"}</td></tr>`).join("");$("districtTable").querySelectorAll("tbody tr").forEach(tr=>tr.onclick=()=>{const [s,d]=tr.dataset.key.split("|||");selectedRow=DATA.districts.find(r=>r.State===s&&r.District===d)||null;renderExplore(rowsNow())})}
function renderAll(){const rows=rowsNow();renderSummary(rows);renderOverview(rows);renderWelfare(rows);renderEconomy(rows);renderPeople(rows);renderTax(rows);renderExplore(rows)}
function switchPage(name){document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".nav-item").forEach(x=>x.classList.toggle("active",x.dataset.page===name));const p=$(`page-${name}`);p.classList.add("active");document.documentElement.style.setProperty("--accent",getComputedStyle(p).getPropertyValue("--accent"));set("pageTitle",p.dataset.title);set("pageSubtitle",p.dataset.subtitle);try{history.replaceState(null,"",`#${name}`)}catch(e){};setTimeout(()=>window.dispatchEvent(new Event("resize")),20)}
function toast(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove("show"),3200)}

function loadScript(url, timeoutMs=7000){
  return new Promise((resolve,reject)=>{
    const existing=[...document.scripts].find(x=>x.src===url); if(existing){resolve();return;}
    const sc=document.createElement("script"); sc.src=url; sc.async=true;
    const timer=setTimeout(()=>{sc.remove();reject(new Error("Timed out loading "+url))},timeoutMs);
    sc.onload=()=>{clearTimeout(timer);resolve()}; sc.onerror=()=>{clearTimeout(timer);sc.remove();reject(new Error("Could not load "+url))};
    document.head.appendChild(sc);
  });
}
async function ensureSheetJS(){
  if(window.XLSX)return true;
  const urls=["https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js","https://unpkg.com/xlsx@0.18.5/dist/xlsx.full.min.js"];
  for(const url of urls){try{await loadScript(url,7000);if(window.XLSX)return true}catch(e){}}
  return false;
}
async function connectExcel(file){
  try{
    if(!(await ensureSheetJS())) throw new Error("Excel reader could not load. The dashboard itself still works; please check internet and try Connect Excel again.");
    const buf=await file.arrayBuffer(),book=XLSX.read(buf,{type:"array"});
    if(!book.Sheets["District Wise"]||!book.Sheets["State Wise"])throw new Error('Excel must contain "District Wise" and "State Wise" sheets.');
    DATA={...DATA,districts:XLSX.utils.sheet_to_json(book.Sheets["District Wise"],{defval:"",raw:true}),states:XLSX.utils.sheet_to_json(book.Sheets["State Wise"],{defval:"",raw:true})};
    populate();selectedRow=null;renderAll();if(mapSeries)updateMap(rowsNow());toast(`Connected ${DATA.districts.length} district rows from ${file.name}`)
  }catch(e){toast(e.message||"Could not read this Excel file.")}
}
function loadIndiaMapAsync(){
  const mapEl=$("densityMap"); if(!mapEl)return;
  mapEl.innerHTML='<div class="map-loading">Loading the India population-density heat map…<br><small>The rest of the dashboard is already ready.</small></div>';
  const scripts=[
    "https://cdn.amcharts.com/lib/5/index.js",
    "https://cdn.amcharts.com/lib/5/map.js",
    "https://cdn.amcharts.com/lib/5/themes/Animated.js",
    "https://cdn.amcharts.com/lib/5/geodata/india2020Low.js"
  ];
  (async()=>{
    try{
      for(const u of scripts) await loadScript(u,6500);
      mapEl.innerHTML="";
      initMap(); updateMap(rowsNow());
    }catch(e){
      console.warn("India map service unavailable; using local density ranking fallback.",e);
      renderMapFallback(rowsNow());
    }
  })();
}
function safeRenderAll(){
  try{renderAll();document.body.classList.add("data-ready");}
  catch(e){console.error("Dashboard render error",e);toast("Dashboard loaded, but one visual had an error. Refresh once if needed.")}
}

document.querySelectorAll(".nav-item").forEach(b=>b.onclick=()=>switchPage(b.dataset.page));
$("regionFilter").onchange=()=>{districtOptions();selectedRow=null;safeRenderAll();if(mapSeries)updateMap(rowsNow())};
$("stateFilter").onchange=()=>{districtOptions();selectedRow=null;safeRenderAll();if(mapSeries)updateMap(rowsNow())};
$("districtFilter").onchange=()=>{selectedRow=null;safeRenderAll();if(mapSeries)updateMap(rowsNow())};
$("resetFilters").onclick=()=>{$("regionFilter").value="ALL";$("stateFilter").value="ALL";districtOptions();$("districtFilter").value="ALL";selectedRow=null;safeRenderAll();if(mapSeries)updateMap(rowsNow())};
$("districtSearch").oninput=()=>table(rowsNow());
$("excelInput").onchange=e=>{const f=e.target.files?.[0];if(f)connectExcel(f);e.target.value=""};
$("fullscreenBtn").onclick=async()=>{try{document.fullscreenElement?await document.exitFullscreen():await document.documentElement.requestFullscreen()}catch(e){}};

// Critical startup: local data and local Plotly render immediately.
populate();
safeRenderAll();
const initial=(location.hash||"#overview").slice(1);
switchPage(["overview","welfare","economy","people","tax","explore"].includes(initial)?initial:"overview");
// Map is optional and loads after everything else. It can never blank the dashboard.
setTimeout(loadIndiaMapAsync,120);

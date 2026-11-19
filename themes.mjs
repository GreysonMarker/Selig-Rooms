// Authored room identities; furniture stays outside the central escape cross.
export const THEMES = [
 ['entry','Off-center table'],['cafeteria','Lunch period / no students'],['math','Arithmetic without answers'],['playground','Indoor recess'],['science','Chemistry / empty samples'],['computer','Offline testing'],['library','The repeated shelf'],['music','Silent ensemble'],['art','Portraits of nobody'],['biology','Specimen classroom'],['cafeteria','The serving line'],['geography','Geography / missing places'],['playground','Recess after dark'],['theater','Audience of chairs'],['homeec','Home economics'],['detention','Permanent detention'],['physics','The pendulum lesson'],['gym','Small gymnasium'],['reading','Reading circle'],['workshop','Unfinished projects'],['math','Facing the wrong board'],['science','Lab partners absent'],['computer','The examination room'],['art','Blank exhibition'],['music','Piano practice'],['library','Returned books'],['playground','No outdoor access'],['cafeteria','Breakfast for nobody'],['biology','The growing room'],['geography','Maps with no exits'],['homeec','Four identical kitchens'],['theater','Rehearsal room'],['gym','Equipment inspection'],['reading','Story time has ended'],['detention','The last class'],['workshop','Assembly without instructions']
];
export function themeFurniture(r,box,solid,S){
 const cx=(r.x+r.w/2)*S,cz=(r.z+r.h/2)*S;
 const b=(m,x,y,z,w,h,d)=>solid(m,cx+x,y,cz+z,w,h,d);
 const v=(m,x,y,z,w,h,d)=>box(m,cx+x,y,cz+z,w,h,d,.72);
 const table=(x,z,w=1.45,d=.75,y=.77)=>{b('wood',x,y,z,w,.09,d);for(const a of [-1,1])for(const c of [-1,1])v('metal',x+a*(w/2-.09),y/2,z+c*(d/2-.09),.055,y,.055)};
 const chair=(x,z,reverse=false)=>{b('seat',x,.45,z,.47,.1,.47);v('seat',x,.73,z+(reverse?-.22:.22),.47,.55,.06);for(const a of [-.18,.18])for(const c of [-.18,.18])v('metal',x+a,.22,z+c,.04,.44,.04)};
 const desk=(x,z,reverse=false)=>{table(x,z,1.15,.65);chair(x,z+(reverse?-.73:.73),reverse);v('paper',x+.22,.827,z,.32,.015,.23)};
 const rug=(x,z,w=2.8,d=2.8)=>v('teal',x,.015,z,w,.02,d);
 const cabinet=(x,z)=>{b('wood',x,.75,z,2.5,1.5,.48);for(const dx of [-.62,.62]){v('trim',x+dx,1,z+.25,1.13,.025,.02);v('metal',x+dx,.72,z+.29,.16,.04,.04)}};
 const shelf=(x,z)=>{b('wood',x,1.05,z,2.5,2.1,.5);for(const y of [.42,.94,1.46]){v('black',x,y+.18,z+.26,2.3,.4,.018);for(let i=0;i<11;i++)v(['paper','teal','rust','seat'][i%4],x-1.02+i*.2,y+.2,z+.29,.12,.22+(i%3)*.07,.12)}};
 const bench=(x,z)=>{table(x,z,2.45,1.1,.93);v('black',x,.99,z,2.5,.035,1.15)};
 const board=(x,z)=>{v('wood',x,1.72,z,2.9,1.2,.09);v('chalk',x,1.72,z+.055,2.74,1.04,.025);for(let i=0;i<4;i++)v('paper',x-.72+i*.43,1.78+(i%2)*.14,z+.073,.22,.022,.012)};
 if(r.id===0){table(.72,-.47,2,1);return}
 const kind=r.theme;r.theme=kind;
 // Signs/boards face into each room. No furniture occupies doorway approaches.
 board(-3.75,-6.25);
 // Small architectural contradictions make the familiar room purpose feel wrong.
 if(r.id%5===0){v('trim',-3.8,1.25,6.23,1.3,2.5,.09);v('wall',-3.8,1.23,6.16,1.12,2.35,.04);v('metal',-3.38,1.1,6.11,.12,.04,.05)}
 if(r.id%5===1){for(let j=0;j<3;j++){v('wood',-5.95,2.35, -4.8+j*.8,.55,.08,.55);v('seat',-6.18,2.62,-4.8+j*.8,.06,.48,.55)}}
 if(r.id%5===2){for(let j=0;j<4;j++)v('paper',-4.9+j*.7,1.45,6.24,.45,.6,.025)}
 if(r.id%5===3){v('black',-3.8,2.62,6.22,.55,.55,.07);v('paper',-3.8,2.62,6.17,.46,.46,.025);v('black',-3.8,2.72,6.15,.018,.18,.01);v('black',-3.71,2.62,6.15,.18,.018,.01)}
 if(r.id%5===4){v('wood',-6.13,1.15,-3.8,.08,2.2,1.3);v('metal',-5.77,1.9,-4.32,.7,.05,.05);v('metal',-5.77,.4,-3.28,.7,.05,.05)}
 const spots=[[-3.9,-3.8],[3.9,-3.8],[-3.9,3.8],[3.9,3.8]];
 spots.forEach(([x,z],i)=>{
 switch(kind){
 case 'cafeteria':
  if(i===3){b('metal',x,.55,z,2.6,1.1,.9);v('paper',x,1.14,z,2.7,.06,1);for(let j=-1;j<=1;j++){v('metal',x+j*.75,1.2,z,.5,.06,.48);v('black',x+j*.75,1.24,z,.39,.012,.36)}v('metal',x,1.8,z+.25,2.65,.05,.5);for(const a of [-1.15,1.15])v('metal',x+a,1.45,z+.25,.04,.7,.04)}
  else{table(x,z,2.4,1.15);for(const a of [-.8,0,.8]){chair(x+a,z+.94);if(i!==1)chair(x+a,z-.94,true)}for(const a of [-.65,.65])v('paper',x+a,.83,z,.42,.025,.28)}break;
 case 'math':case 'detention':
  for(const a of [-.69,.69])desk(x+a,z,i===1||kind==='detention');if(i===3){table(x,z+1.45,2.5,.5);v('paper',x+.8,.86,z+1.45,.4,.1,.28)}break;
 case 'computer':
  table(x,z,2.55,.85);for(const a of [-.72,.72]){v('metal',x+a,.99,z,.06,.42,.06);v('black',x+a,1.25,z,.65,.43,.08);v('dead',x+a,1.25,z+.05,.56,.34,.015);v('trim',x+a,.835,z+.25,.52,.04,.17);chair(x+a,z+.95)}b('black',x+1.05,.3,z,.22,.6,.5);break;
 case 'science':case 'biology':
  bench(x,z);for(const a of [-.85,0,.85]){v('metal',x+a,1.14,z,.18,.3,.18);v(kind==='biology'?'teal':'paper',x+a,1.16,z,.13,.2,.13);chair(x+a,z+.95)}v('metal',x-.7,1.24,z-.28,.04,.48,.04);v('metal',x-.56,1.46,z-.28,.3,.04,.04);if(i===2)cabinet(x,z-1.55);break;
 case 'art':
  for(const a of [-.75,.75]){b('wood',x+a,.8,z,.075,1.6,.65);v('wood',x+a,1.42,z,.96,1.15,.07);v('paper',x+a,1.42,z+.05,.84,1.02,.025);v('wood',x+a,.92,z+.1,1,.06,.2)}table(x,z+1.25,2.5,.55);for(let j=0;j<5;j++)v(['rust','teal','ochre'][j%3],x-1+j*.4,.9,z+1.25,.12,.18,.12);break;
 case 'library':shelf(x,z-.65);shelf(x,z+.7);if(i===3){table(x,z+1.45,2,.55)}break;
 case 'reading':rug(x,z);for(const a of [-.85,.85]){b('seat',x+a,.2,z,.7,.4,.7);v('paper',x+a,.415,z,.27,.025,.2)}if(i%2===0)shelf(x,z-1.25);else{chair(x,z-1,true);table(x,z+1.1,1.2,.65,.4)}break;
 case 'music':
  if(i%2===0){b('black',x,.68,z,2.4,1.3,.65);v('paper',x,.85,z+.49,2.3,.06,.34);for(let j=0;j<15;j++)v('black',x-1.02+j*.145,.89,z+.41,.055,.045,.18);table(x,z+1.13,1.1,.45,.45)}else{for(const a of [-.7,.7]){chair(x+a,z+.7);b('metal',x+a,.6,z,.055,1.2,.055);v('black',x+a,1.25,z,.6,.42,.07);v('paper',x+a,1.25,z+.045,.4,.3,.02)}}break;
 case 'geography':desk(x-.7,z);desk(x+.7,z);v('metal',x,1.07,z,.06,.5,.06);v('teal',x,1.35,z,.48,.48,.48);for(let j=0;j<3;j++)v('ochre',x+.245,1.21+j*.1,z,.016,.04,.3-j*.06);break;
 case 'homeec':
  b('paper',x,.45,z,2.6,.9,.9);v('metal',x,.93,z,2.65,.06,.95);for(const a of [-.85,-.35])for(const c of [-.2,.2])v('black',x+a,.97,z+c,.29,.025,.29);v('black',x-.6,.48,z+.46,1,.5,.025);v('metal',x+.7,1.12,z-.2,.04,.35,.04);v('black',x+.7,.97,z,.55,.02,.5);table(x,z+1.4,2.5,.6);break;
 case 'physics':bench(x,z);for(const a of [-.8,.8])v('metal',x+a,1.55,z,.045,1.05,.045);v('metal',x,2.06,z,1.65,.045,.045);for(let j=-2;j<=2;j++){v('metal',x+j*.24,1.72,z,.016,.65,.016);v('ochre',x+j*.24,1.37,z,.15,.15,.15)}chair(x,z+1.1);break;
 case 'workshop':bench(x,z);for(const a of [-.75,.75]){v('metal',x+a,1.07,z,.42,.15,.3);v('wood',x+a,1.25,z,.06,.4,.06);v('metal',x+a,1.45,z,.32,.1,.13)}cabinet(x,z-1.45);chair(x,z+1);break;
 case 'theater':if(i<2){b('wood',x,.2,z,2.8,.4,2.7);for(const a of [-1.25,1.25])b('rust',x+a,1.5,z-1.15,.22,2.8,.2);v('rust',x,2.78,z-1.15,2.7,.25,.2);chair(x,z,true)}else for(const a of [-.7,.7])for(const c of [-.7,.7])chair(x+a,z+c,i===2);break;
 case 'gym':
  if(i%2===0){for(let j=0;j<3;j++)b('wood',x,.22+j*.2,z-.85+j*.6,2.6,.15,.55);v('paper',x,2.25,z-1.25,1.5,.85,.09);v('rust',x,1.93,z-.94,.55,.06,.5)}else{rug(x,z);for(let j=0;j<5;j++)v('metal',x-1+j*.5,1.3,z-1.1,.05,2.6,.05);for(let j=0;j<7;j++)v('wood',x, .25+j*.33,z-1.1,2.6,.045,.08);b('seat',x,.25,z+.6,2.5,.5,.75)}break;
 case 'playground':
  rug(x,z);
  if(i===0){for(const a of [-1.1,1.1])b('ochre',x+a,1.25,z,.09,2.5,.12);v('rust',x,2.5,z,2.4,.12,.15);for(const a of [-.42,.42])v('metal',x+a,1.55,z,.025,1.8,.025);b('seat',x,.64,z,.96,.09,.4)}
  if(i===1){for(const a of [-1,1])for(const c of [-1,1])b('teal',x+a,1.1,z+c,.08,2.2,.08);for(let j=0;j<5;j++){v('ochre',x, .35+j*.4,z-1,2,.06,.06);v('ochre',x,2.2,z-1+j*.5,2,.06,.06)}}
  if(i===2){b('teal',x,.65,z-.7,1.5,1.3,1);for(let j=0;j<6;j++)b('ochre',x,.62-j*.095,z-.05+j*.25,1.2,.1,.28);for(let j=0;j<4;j++)v('metal',x-.85,.22+j*.3,z-.9,.3,.045,.6)}
  if(i===3){b('wood',x,.15,z,2.8,.3,2.4);v('ochre',x,.31,z,2.5,.025,2.1);for(let j=0;j<5;j++)v(['teal','rust','paper'][j%3],x-.85+j*.4,.46,z+(j%2)*.45,.25,.3,.25)}break;
 }
 });
}

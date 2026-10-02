const fs=require('fs');
const path=require('path');
const index=path.join(__dirname,'public','index.html');
let html=fs.readFileSync(index,'utf8');
let changed=false;
const fixes=[
  [';}\\nconst extraDeepI18n={',';}\nconst extraDeepI18n={'],
  ['};\\nconst extraDeepI18n={','};\nconst extraDeepI18n={']
];
for(const [broken,fixed] of fixes){
  if(html.includes(broken)){
    html=html.split(broken).join(fixed);
    changed=true;
  }
}
if(changed){
  fs.writeFileSync(index,html);
  console.log('AETHER i18n runtime syntax normalized');
}
require('./server.js');

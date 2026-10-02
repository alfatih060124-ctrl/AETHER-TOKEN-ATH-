const fs=require('fs');
const path=require('path');
const index=path.join(__dirname,'public','index.html');
let html=fs.readFileSync(index,'utf8');
const broken='};\\nconst extraDeepI18n={';
if(html.includes(broken)){
  html=html.replace(broken,'};\nconst extraDeepI18n={');
  fs.writeFileSync(index,html);
  console.log('AETHER i18n runtime syntax normalized');
}
require('./server.js');

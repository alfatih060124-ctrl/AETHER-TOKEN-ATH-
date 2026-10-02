const fs=require('fs');
const path=require('path');
const index=path.join(__dirname,'public','index.html');
let html=fs.readFileSync(index,'utf8');
const app='<script src="/app.js"></script>';
const block='<script src="/i18n-runtime.js"></script>\n  <script src="/i18n.js"></script>\n  <script src="/app.js"></script>';
html=html.replace(/\s*<script src="\/i18n-runtime\.js"><\/script>\s*/g,'\n  ').replace(/\s*<script src="\/i18n\.js"><\/script>\s*/g,'\n  ');
if(html.includes(app)){
  html=html.replace(app,block);
  fs.writeFileSync(index,html);
  console.log('AETHER Mining centralized multilingual runtime enabled');
}
require('./server.js');

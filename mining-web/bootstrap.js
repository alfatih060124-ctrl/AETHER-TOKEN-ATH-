const fs=require('fs');
const path=require('path');
const index=path.join(__dirname,'public','index.html');
let html=fs.readFileSync(index,'utf8');
if(!html.includes('/i18n.js')){
  html=html.replace('<script src="/app.js"></script>','<script src="/app.js"></script>\n  <script src="/i18n.js"></script>');
  fs.writeFileSync(index,html);
  console.log('AETHER Mining multilingual runtime enabled');
}
require('./server.js');

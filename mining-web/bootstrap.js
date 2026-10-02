const fs=require('fs');
const path=require('path');
const index=path.join(__dirname,'public','index.html');
let html=fs.readFileSync(index,'utf8');
const app='<script src="/app.js"></script>';
const rev=process.env.FRONTEND_REV||'i18n-final-20261002';
const q=`?v=${encodeURIComponent(rev)}`;
const block=`<script src="/i18n-runtime.js${q}"></script>\n  <script src="/i18n.js${q}"></script>\n  <script src="/i18n-static-complete.js${q}"></script>\n  <script src="/i18n-bridge.js${q}"></script>\n  <script src="/i18n-icons.js${q}"></script>\n  <script src="/app.js${q}"></script>`;
html=html.replace(/\s*<script src="\/i18n-runtime\.js(?:\?[^\"]*)?"><\/script>\s*/g,'\n  ')
  .replace(/\s*<script src="\/i18n\.js(?:\?[^\"]*)?"><\/script>\s*/g,'\n  ')
  .replace(/\s*<script src="\/i18n-static-complete\.js(?:\?[^\"]*)?"><\/script>\s*/g,'\n  ')
  .replace(/\s*<script src="\/i18n-bridge\.js(?:\?[^\"]*)?"><\/script>\s*/g,'\n  ')
  .replace(/\s*<script src="\/i18n-icons\.js(?:\?[^\"]*)?"><\/script>\s*/g,'\n  ')
  .replace(/\s*<script src="\/app\.js(?:\?[^\"]*)?"><\/script>\s*/g,'\n  ');
const anchor='</body>';
if(html.includes(anchor)){
  html=html.replace(anchor,`  ${block}\n${anchor}`);
  fs.writeFileSync(index,html);
  console.log(`AETHER Mining multilingual runtime enabled; rev=${rev}`);
}
require('./server.js');

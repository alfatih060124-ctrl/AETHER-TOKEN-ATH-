"use strict";
const fs=require("fs"),path=require("path"),vm=require("vm"),assert=require("assert/strict");
const root=path.join(__dirname,"public");
const html=fs.readFileSync(path.join(root,"staking-member.html"),"utf8");
const source=fs.readFileSync(path.join(root,"staking-member-registration-i18n.js"),"utf8");
const window={};
vm.runInNewContext(source,{window},{timeout:1000});
const translations=window.ATH_STAKING_MEMBER_REG_I18N;
const languages=["id","en","zh","es","ar","ru","ko","ja","vi","pt"];
const keys=Object.keys(translations.en);
const selectors=[...html.matchAll(/\bdata-reg(?:-placeholder|-title|-aria)?="([^"]+)"/g)].map(x=>x[1]);
assert.equal(languages.length,10);
assert.ok(keys.length>=20,"Registration messages must be localized");
for(const key of selectors)assert.ok(keys.includes(key),"Missing registration label: "+key);
for(const language of languages){
 assert.ok(translations[language],"Missing language: "+language);
 assert.deepEqual(Object.keys(translations[language]).sort(),keys.slice().sort(),"Missing/extra translation keys for "+language);
 for(const key of keys)assert.ok(typeof translations[language][key]==="string" && translations[language][key].trim(),"Empty "+language+" translation: "+key);
}
const inline=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(x=>x[1].trim()).filter(Boolean);
assert.equal(inline.length,1,"Unexpected inline script count");
new vm.Script(inline[0],{filename:"staking-member.html:inline"});
// The production portal must not retain the obsolete browser-local registration demo.
assert.doesNotMatch(html,/id="test-registration-form"|browser-local-only|ath-staking-local-test-account/);
assert.match(html,/id="account-profile"/);
assert.match(html,/id="profile-wallet"/);
assert.match(html,/id="profile-sponsor"/);
assert.match(html,/id="member-referral"/);
assert.match(html,/data-reg-aria="languageLabel"/);
assert.match(html,/\/staking-member-registration-i18n\.js/);
assert.match(html,/\/api\/member\/session/);
assert.match(html,/\/api\/member\/logout/);
assert.match(html,/member\.funded===false/);
assert.match(html,/localStorage\.setItem\('aether-staking-member-lang',lang\.value\)/);
const server=fs.readFileSync(path.join(__dirname,"server.js"),"utf8");
const proxy=fs.readFileSync(path.join(__dirname,"staking-member-proxy.cjs"),"utf8");
const picker=fs.readFileSync(path.join(root,"public-site.js"),"utf8");
assert.match(server,/if \(normalized === "\/staking-member\.html"\) return null/);
assert.match(server,/proxy\.forward\(req,"\/api\/member\/session"\)/);
assert.match(server,/result\.status!==200/);
assert.match(proxy,/STAKING_MEMBER_API_ENABLED!=="true"/);
assert.match(picker,/\/api\/member\/challenge/);
assert.match(picker,/personal_sign/);
assert.match(picker,/\/api\/member\/verify/);
new vm.Script(picker,{filename:"public-site.js"});
const start=picker.indexOf("  function unsupportedMessageSigning(");
const end=picker.indexOf("  async function connect(p)",start);
assert.ok(start>=0&&end>start,"Missing explicit signing capability guard");
const classify=vm.runInNewContext(picker.slice(start,end)+";unsupportedMessageSigning;",{});
for(const [error,expected] of [
 [{code:4200,message:"Unsupported method"},true],
 [{code:-32601},true],
 [{message:"DApp signing disabled"},true],
 [{code:4001,message:"User rejected personal_sign"},false],
 [{code:4100,message:"Unauthorized"},false],
 [{message:"signature denied"},false],
 [{message:"network error"},false]
])assert.equal(classify(error),expected,"Unexpected signing fallback classification");
assert.match(picker,/createSignMessageLink/);
assert.match(picker,/takeRequest\(p\.get\("aether_request_id"\)\)/);
assert.match(picker,/await completeLogin\(d\.address,d\.nonce,sig\)/);
new vm.Script(proxy,{filename:"staking-member-proxy.cjs"});
console.log("Staking Member QC passed: "+languages.length+" translation dictionaries, "+keys.length+" complete keys, authenticated portal source guards and JS syntax.");

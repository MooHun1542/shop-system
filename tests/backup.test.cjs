// Run with: node --test tests/backup.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
function setup(script) {
  const elements = {};
  for (const id of ['importFile','importConfirm','importCancel','importModal','importSummary','recoverImport']) {
    elements[id] = {id, files:[], value:'', hidden:true, classList:{add(){},remove(){}}, listeners:{}, addEventListener(type,fn){this.listeners[type]=fn;}};
  }
  const store = new Map([['shop-system-v1',JSON.stringify({products:[{id:'old',name:'Old',category:'A',price:5}],sales:[]})]]);
  const storage = {getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
  const alerts = []; let reloads=0;
  class Reader {readAsText(file){this.result=file.text;this.onload();}}
  const context = {document:{getElementById:id=>elements[id]},localStorage:storage,FileReader:Reader,alert:s=>alerts.push(s),confirm:()=>true,location:{reload(){reloads++;}},Set,Number,JSON};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',script),'utf8'),context,{filename:script});
  return {elements,storage,alerts,get reloads(){return reloads;}};
}
const product={id:'p1',name:'Rice',category:'Food',price:20};
const good={products:[product],sales:[{total:20,items:[{name:'Rice',price:20,qty:1}]}]};
function choose(env,data){env.elements.importFile.files=[{size:100,text:typeof data==='string'?data:JSON.stringify(data)}];env.elements.importFile.listeners.change({stopImmediatePropagation(){}});}
test('valid backup imports and saves recovery snapshot',()=>{
  const e=setup('safe-import.js');const original=e.storage.getItem('shop-system-v1');
  choose(e,good);e.elements.importConfirm.onclick();
  assert.equal(e.storage.getItem('shop-pre-import-recovery'),original);
  assert.deepEqual(JSON.parse(e.storage.getItem('shop-system-v1')),good);assert.equal(e.reloads,1);
});
test('invalid JSON cannot replace existing data',()=>{
  const e=setup('safe-import.js');const original=e.storage.getItem('shop-system-v1');
  choose(e,'{bad');e.elements.importConfirm.onclick();
  assert.equal(e.storage.getItem('shop-system-v1'),original);assert.equal(e.reloads,0);
});
test('duplicate product IDs rejected',()=>{
  const e=setup('safe-import.js');choose(e,{products:[product,product],sales:[]});
  e.elements.importConfirm.onclick();assert.equal(e.reloads,0);
});
test('nonnumeric price rejected',()=>{
  const e=setup('safe-import.js');choose(e,{products:[{...product,price:'20'}],sales:[]});
  e.elements.importConfirm.onclick();assert.equal(e.reloads,0);
});
test('negative sales totals rejected',()=>{
  const e=setup('safe-import.js');choose(e,{products:[product],sales:[{total:-1,items:[]}]});
  e.elements.importConfirm.onclick();assert.equal(e.reloads,0);
});
test('cancel prevents import',()=>{
  const e=setup('safe-import.js');choose(e,good);e.elements.importCancel.listeners.click();
  e.elements.importConfirm.onclick();assert.equal(e.reloads,0);
});
test('recovery restores previous state',()=>{
  const e=setup('recover-import.js');const old=JSON.stringify({products:[product],sales:[]});
  e.storage.setItem('shop-pre-import-recovery',old);
  // refresh occurs on load, so reinitialize with seeded storage for a click test
  e.elements.recoverImport.listeners.click();
  assert.equal(e.storage.getItem('shop-system-v1'),old);
  assert.equal(e.storage.getItem('shop-pre-import-recovery'),null);
  assert.equal(e.reloads,1);
});

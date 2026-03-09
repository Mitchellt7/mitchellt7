const key = 'budget_entries';
const entries = JSON.parse(localStorage.getItem(key) || '[]');

const money = (n) => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n);

function save(){ localStorage.setItem(key, JSON.stringify(entries)); render(); }
function totals(){
  const income = entries.filter(e=>e.type==='income').reduce((a,b)=>a+b.amount,0);
  const expenses = entries.filter(e=>e.type==='expense').reduce((a,b)=>a+b.amount,0);
  return {income,expenses,balance:income-expenses};
}

function render(){
  const t = totals();
  document.getElementById('income').textContent = money(t.income);
  document.getElementById('expenses').textContent = money(t.expenses);
  document.getElementById('balance').textContent = money(t.balance);

  const list = document.getElementById('list'); list.innerHTML='';
  entries.slice().reverse().forEach((e,i)=>{
    const li=document.createElement('li');
    li.innerHTML=`<span>${e.title} (${e.category})</span><span>${e.type==='income'?'+':'-'}${money(e.amount)} <button data-i="${entries.length-1-i}">x</button></span>`;
    list.appendChild(li);
  });
  list.querySelectorAll('button').forEach(b=>b.onclick=()=>{entries.splice(Number(b.dataset.i),1); save();});

  const by = {};
  entries.filter(e=>e.type==='expense').forEach(e=>{by[e.category]=(by[e.category]||0)+e.amount});
  const ul = document.getElementById('by-category'); ul.innerHTML='';
  Object.entries(by).sort((a,b)=>b[1]-a[1]).forEach(([c,a])=>{
    const li=document.createElement('li'); li.innerHTML=`<span>${c}</span><span>${money(a)}</span>`; ul.appendChild(li);
  });
}

document.getElementById('tx-form').addEventListener('submit',(e)=>{
  e.preventDefault();
  const title=document.getElementById('title').value.trim();
  const amount=Number(document.getElementById('amount').value);
  const type=document.getElementById('type').value;
  const category=document.getElementById('category').value.trim()||'Other';
  if(!title || !(amount>0)) return;
  entries.push({title,amount,type,category,date:new Date().toISOString()});
  e.target.reset(); document.getElementById('type').value='expense'; document.getElementById('category').value='Other';
  save();
});

render();

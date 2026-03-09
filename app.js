const key = 'budget_entries';
const entries = JSON.parse(localStorage.getItem(key) || '[]');

const money = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

function save() {
  localStorage.setItem(key, JSON.stringify(entries));
  render();
}

function totals() {
  const income = entries.filter((e) => e.type === 'income').reduce((a, b) => a + b.amount, 0);
  const expenses = entries.filter((e) => e.type === 'expense').reduce((a, b) => a + b.amount, 0);
  return { income, expenses, balance: income - expenses };
}

function getRunningBalance(indexInclusive) {
  return entries.slice(0, indexInclusive + 1).reduce((acc, item) => {
    const delta = item.type === 'income' ? item.amount : -item.amount;
    return acc + delta;
  }, 0);
}

function render() {
  const t = totals();
  document.getElementById('income').textContent = money(t.income);
  document.getElementById('expenses').textContent = money(t.expenses);
  document.getElementById('balance').textContent = money(t.balance);

  const list = document.getElementById('list');
  list.innerHTML = '';

  entries
    .slice()
    .reverse()
    .forEach((e, i) => {
      const originalIndex = entries.length - 1 - i;
      const running = getRunningBalance(originalIndex);

      const li = document.createElement('li');
      li.className = 'tx-row';
      li.innerHTML = `
        <div>
          <strong>${e.title}</strong>
          <div class="meta">${e.category}</div>
        </div>
        <div class="amount-wrap">
          <span class="amount ${e.type === 'income' ? 'amount-income' : 'amount-expense'}">
            ${e.type === 'income' ? '+' : '-'}${money(e.amount)}
          </span>
          <span class="running">Balance: ${money(running)}</span>
        </div>
        <button class="delete-btn" data-i="${originalIndex}" aria-label="Delete transaction">×</button>
      `;
      list.appendChild(li);
    });

  list.querySelectorAll('.delete-btn').forEach((b) => {
    b.onclick = () => {
      entries.splice(Number(b.dataset.i), 1);
      save();
    };
  });

  const by = {};
  entries
    .filter((e) => e.type === 'expense')
    .forEach((e) => {
      by[e.category] = (by[e.category] || 0) + e.amount;
    });

  const ul = document.getElementById('by-category');
  ul.innerHTML = '';
  Object.entries(by)
    .sort((a, b) => b[1] - a[1])
    .forEach(([c, a]) => {
      const li = document.createElement('li');
      li.innerHTML = `<span>${c}</span><span>${money(a)}</span>`;
      ul.appendChild(li);
    });
}

const typeInput = document.getElementById('type');
const incomeBtn = document.getElementById('income-btn');
const expenseBtn = document.getElementById('expense-btn');

function setType(type) {
  typeInput.value = type;
  incomeBtn.classList.toggle('active', type === 'income');
  expenseBtn.classList.toggle('active', type === 'expense');
}

incomeBtn.addEventListener('click', () => setType('income'));
expenseBtn.addEventListener('click', () => setType('expense'));

document.getElementById('tx-form').addEventListener('submit', (e) => {
  e.preventDefault();

  const title = document.getElementById('title').value.trim();
  const amount = Number(document.getElementById('amount').value);
  const type = typeInput.value;
  const category = document.getElementById('category').value.trim() || 'Other';

  if (!title || !(amount > 0)) return;

  entries.push({ title, amount, type, category, date: new Date().toISOString() });

  e.target.reset();
  document.getElementById('category').value = 'Other';
  setType('expense');
  save();
});

render();

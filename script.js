const incomeForm = document.getElementById('income-form');
const expenseForm = document.getElementById('expense-form');
const savingsForm = document.getElementById('savings-form');

const incomeList = document.getElementById('income-list');
const expenseList = document.getElementById('expense-list');
const itemTemplate = document.getElementById('item-template');

const totalIncomeEl = document.getElementById('total-income');
const totalBillsEl = document.getElementById('total-bills');
const totalOtherExpensesEl = document.getElementById('total-other-expenses');
const leftAfterBillsEl = document.getElementById('left-after-bills');
const savingsDisplayEl = document.getElementById('savings-display');
const leftAfterSavingsEl = document.getElementById('left-after-savings');

const state = {
  incomes: [],
  expenses: [],
  savingsGoal: 0,
};

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

function renderList(listElement, items, type) {
  listElement.innerHTML = '';

  if (!items.length) {
    const empty = document.createElement('li');
    empty.textContent = `No ${type} added yet.`;
    listElement.appendChild(empty);
    return;
  }

  items.forEach((item) => {
    const fragment = itemTemplate.content.cloneNode(true);
    fragment.querySelector('.item-name').textContent = item.name;

    const detail =
      type === 'expenses'
        ? `${formatCurrency(item.amount)} • ${item.isBill ? 'Bill' : 'Expense'}`
        : `${formatCurrency(item.amount)} per week`;
    fragment.querySelector('.item-meta').textContent = detail;

    const removeButton = fragment.querySelector('.delete-btn');
    removeButton.addEventListener('click', () => {
      if (type === 'expenses') {
        state.expenses = state.expenses.filter((entry) => entry.id !== item.id);
      } else {
        state.incomes = state.incomes.filter((entry) => entry.id !== item.id);
      }
      render();
    });

    listElement.appendChild(fragment);
  });
}

function renderSummary() {
  const totalIncome = state.incomes.reduce((sum, item) => sum + item.amount, 0);
  const totalBills = state.expenses.filter((item) => item.isBill).reduce((sum, item) => sum + item.amount, 0);
  const totalOtherExpenses = state.expenses
    .filter((item) => !item.isBill)
    .reduce((sum, item) => sum + item.amount, 0);

  const leftAfterBills = totalIncome - totalBills;
  const leftAfterSavings = leftAfterBills - state.savingsGoal - totalOtherExpenses;

  totalIncomeEl.textContent = formatCurrency(totalIncome);
  totalBillsEl.textContent = formatCurrency(totalBills);
  totalOtherExpensesEl.textContent = formatCurrency(totalOtherExpenses);
  leftAfterBillsEl.textContent = formatCurrency(leftAfterBills);
  savingsDisplayEl.textContent = formatCurrency(state.savingsGoal);
  leftAfterSavingsEl.textContent = formatCurrency(leftAfterSavings);

  leftAfterSavingsEl.style.color = leftAfterSavings < 0 ? '#dc2626' : '#047857';
}

function render() {
  renderList(incomeList, state.incomes, 'income sources');
  renderList(expenseList, state.expenses, 'expenses');
  renderSummary();
}

incomeForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(incomeForm);
  const name = formData.get('name').toString().trim();
  const amount = Number(formData.get('amount'));

  if (!name || amount < 0) return;

  state.incomes.push({ id: crypto.randomUUID(), name, amount });
  incomeForm.reset();
  render();
});

expenseForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(expenseForm);
  const name = formData.get('name').toString().trim();
  const amount = Number(formData.get('amount'));
  const isBill = formData.get('isBill') === 'on';

  if (!name || amount < 0) return;

  state.expenses.push({ id: crypto.randomUUID(), name, amount, isBill });
  expenseForm.reset();
  render();
});

savingsForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(savingsForm);
  const savingsGoal = Number(formData.get('savingsGoal'));

  if (savingsGoal < 0) return;

  state.savingsGoal = savingsGoal;
  render();
});

render();

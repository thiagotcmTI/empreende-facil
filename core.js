/* Regras de negócio independentes da interface. Valores monetários em centavos. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.EF = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const statuses = ['Pendente', 'Em andamento', 'Concluído', 'Cancelado'];
  const types = ['Produto', 'Serviço'];
  const MAX_AMOUNT = 100000000000;
  function empty() { return { version: 1, products: [], orders: [], entries: [] }; }
  function money(value) {
    const s = String(value).trim();
    if (!/^\d+(?:[.,]\d{1,2})?$/.test(s)) throw new Error('Informe um valor válido, com até duas casas decimais.');
    const [whole, fraction = ''] = s.replace(',', '.').split('.');
    const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
    if (!Number.isSafeInteger(cents) || cents < 0 || cents > MAX_AMOUNT) throw new Error('O valor informado está fora do limite permitido.');
    return cents;
  }
  function validDate(s) {
    if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s) || s < '1900-01-01' || s > '9999-12-31') return false;
    const d = new Date(s + 'T12:00:00Z');
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
  }
  function text(value, name, max = 150, required = true) {
    const s = typeof value === 'string' ? value.trim() : '';
    if ((required && !s) || s.length > max) throw new Error(`${name}: preencha com até ${max} caracteres.`);
    return s;
  }
  function cents(n) { return Number.isSafeInteger(n) && n >= 0 && n <= MAX_AMOUNT; }
  function orderTotal(order) {
    const n = order.unitPrice * order.quantity;
    if (!Number.isSafeInteger(order.quantity) || order.quantity < 1 || order.quantity > 100000 || !cents(order.unitPrice) || !cents(n)) throw new Error('Confira a quantidade e o valor do pedido.');
    return n;
  }
  function summary(state, month) {
    let income = 0, expense = 0;
    state.entries.filter(e => e.date.slice(0, 7) === month).forEach(e => { if (e.type === 'Entrada') income += e.amount; else expense += e.amount; });
    return { income, expense, balance: income - expense, open: state.orders.filter(o => o.status === 'Pendente' || o.status === 'Em andamento').length };
  }
  function validateState(s) {
    if (!s || s.version !== 1 || !['products','orders','entries'].every(k => Array.isArray(s[k]) && s[k].length <= 10000)) throw new Error('Esta cópia não tem um formato válido do Empreende Fácil.');
    const result = empty(), ids = new Set();
    function id(value) { const v = text(value,'Identificador',100); if (ids.has(v)) throw new Error('A cópia contém identificadores repetidos.'); ids.add(v); return v; }
    for (const p of s.products) {
      if (!p || !types.includes(p.type) || !cents(p.price)) throw new Error('Item inválido na cópia.');
      result.products.push({ id:id(p.id), name:text(p.name,'Nome'), type:p.type, price:p.price, description:text(p.description,'Descrição',600,false) });
    }
    for (const o of s.orders) {
      if (!o || !statuses.includes(o.status) || !validDate(o.due) || !validDate(o.created)) throw new Error('Pedido inválido na cópia.');
      orderTotal(o);
      result.orders.push({ id:id(o.id), productId:text(o.productId,'Item',100), productName:text(o.productName,'Nome do item'), customer:text(o.customer,'Cliente'), unitPrice:o.unitPrice, quantity:o.quantity, due:o.due, status:o.status, created:o.created, notes:text(o.notes,'Observações',600,false) });
    }
    for (const e of s.entries) {
      if (!e || !['Entrada','Saída'].includes(e.type) || !validDate(e.date) || !cents(e.amount) || e.amount === 0) throw new Error('Movimentação inválida na cópia.');
      result.entries.push({ id:id(e.id), type:e.type, amount:e.amount, description:text(e.description,'Descrição'), category:text(e.category,'Categoria',60), date:e.date });
    }
    return result;
  }
  function csv(entries) {
    const safe = x => '"' + String(x).replace(/^[\s]*[=+@\-]/, m => "'"+m).replace(/"/g,'""') + '"';
    return '\ufeff' + [['Data','Tipo','Descrição','Categoria','Valor (R$)'], ...entries.map(e => [e.date,e.type,e.description,e.category,(e.amount/100).toFixed(2).replace('.',',')])].map(row => row.map(safe).join(';')).join('\r\n');
  }
  return { empty, money, validDate, text, orderTotal, summary, validateState, csv, statuses, types };
});

(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const KEY = 'empreende-facil:v1';
  const brl = n => new Intl.NumberFormat('pt-BR', {style:'currency',currency:'BRL'}).format(n/100);
  const escape = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  const dateLabel = s => s.split('-').reverse().join('/');
  const id = () => crypto.randomUUID();
  let state = EF.empty(), editing = null, deleteAction = null, toastTimer;
  let storageProblem = false;
  try { const raw = localStorage.getItem(KEY); if (raw) state = EF.validateState(JSON.parse(raw)); }
  catch { storageProblem = true; }
  function toast(message) { $('toast').textContent = message; $('toast').classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>$('toast').classList.remove('show'),5000); }
  function persist(next) {
    if (storageProblem) { toast('Os dados salvos não puderam ser lidos. Exporte a cópia original ou importe uma cópia válida antes de salvar.'); return false; }
    try { localStorage.setItem(KEY,JSON.stringify(next)); state=next; render(); return true; }
    catch { toast('Não foi possível salvar. Verifique o espaço e a permissão do navegador ou exporte uma cópia dos dados.'); return false; }
  }
  function empty(title, description, action = '', label = '') {
    return `<div class="empty"><div class="empty-icon" aria-hidden="true">▤</div><h3>${title}</h3><p>${description}</p>${action ? `<button class="text-link" style="background:none" data-action="${action}">${label} <span aria-hidden="true">↗</span></button>`:''}</div>`;
  }
  const statusClass = s => ({'Pendente':'pending','Em andamento':'progress','Concluído':'','Cancelado':'cancelled'}[s]);
  const statusPill = s => `<span class="pill ${statusClass(s)}">${escape(s)}</span>`;
  function stat(title,value,note,icon,cls='') { return `<article class="stat ${cls}"><div class="stat-top"><span>${title}</span><span class="stat-icon" aria-hidden="true">${icon}</span></div><div class="stat-value">${value}</div><div class="stat-note">${note}</div></article>`; }
  function renderStats(target,month,includeOrders) {
    const s = EF.summary(state,month);
    $(target).innerHTML=stat('Entradas',brl(s.income),'Recebimentos registrados','↙')+stat('Saídas',brl(s.expense),'Pagamentos registrados','↗','warm')+stat('Saldo de caixa',brl(s.balance),'Entradas menos saídas','≈','balance')+(includeOrders?stat('Pedidos em aberto',s.open,'Todos os meses · pendentes e em andamento','▤'):'');
  }
  function orderTable(orders,compact=false) {
    return `<div class="table-wrap"><table><thead><tr><th>Cliente / item</th>${compact?'':'<th>Entrega</th>'}<th>Total</th><th>Situação</th>${compact?'':'<th>Ações</th>'}</tr></thead><tbody>${orders.map(o=>`<tr><td><strong>${escape(o.customer)}</strong><small>${escape(o.productName)} · ${o.quantity} un.</small></td>${compact?'':`<td class="${o.due<today()&&['Pendente','Em andamento'].includes(o.status)?'overdue':''}">${dateLabel(o.due)}${o.due<today()&&['Pendente','Em andamento'].includes(o.status)?'<small>Prazo vencido</small>':''}</td>`}<td class="money">${brl(EF.orderTotal(o))}</td><td>${statusPill(o.status)}</td>${compact?'':`<td><div class="row-actions"><button data-edit-order="${escape(o.id)}" aria-label="Editar pedido de ${escape(o.customer)}">Editar</button><button data-delete-order="${escape(o.id)}" aria-label="Excluir pedido de ${escape(o.customer)}">Excluir</button></div></td>`}</tr>`).join('')}</tbody></table></div>`;
  }
  function render() {
    renderStats('stats',$('dashboard-month').value,true);
    renderStats('finance-stats',$('finance-month').value,false);
    $('order-count').textContent=EF.summary(state,'').open;
    const recent=[...state.orders].reverse().slice(0,4);
    $('recent-orders').innerHTML=recent.length?orderTable(recent,true):empty('Seu próximo pedido começa aqui','Quando você registrar um pedido, ele aparece aqui.<br>Que tal dar o primeiro passo?','new-order','Criar meu primeiro pedido');
    const pq=$('product-search').value.toLocaleLowerCase('pt-BR').trim(), pt=$('product-filter').value;
    const products=state.products.filter(p=>(pt==='all'||p.type===pt)&&(p.name+' '+p.description).toLocaleLowerCase('pt-BR').includes(pq));
    $('catalog-list').innerHTML=products.length?products.map(p=>`<article class="product-card"><div class="card-top"><span class="item-icon" aria-hidden="true">${p.type==='Produto'?'▦':'✳'}</span><span class="pill">${p.type}</span></div><h2>${escape(p.name)}</h2><p>${escape(p.description)||'Seu item está pronto para entrar em um pedido.'}</p><div class="price">${brl(p.price)}</div><div class="card-actions"><button class="secondary" data-edit-product="${escape(p.id)}" aria-label="Editar ${escape(p.name)}">Editar item</button><button class="secondary" data-delete-product="${escape(p.id)}" aria-label="Excluir ${escape(p.name)}">Excluir</button></div></article>`).join(''):empty(state.products.length?'Nenhum item encontrado':'O que você faz merece um lugar aqui',state.products.length?'Experimente outro nome ou altere o filtro.':'Cadastre seus produtos e serviços para começar a organizar os pedidos.',state.products.length?'':'new-product','Adicionar meu primeiro item');
    const oq=$('order-search').value.toLocaleLowerCase('pt-BR').trim(), os=$('order-filter').value;
    const orders=[...state.orders].reverse().filter(o=>(os==='all'||o.status===os)&&(o.customer+' '+o.productName).toLocaleLowerCase('pt-BR').includes(oq));
    $('orders-list').innerHTML=orders.length?orderTable(orders):empty(state.orders.length?'Nenhum pedido encontrado':'Tudo pronto para o primeiro pedido',state.orders.length?'Tente outra busca ou situação.':'Cadastre um item e registre para quem você vai vender.','new-order','Novo pedido');
    const entries=monthEntries();
    $('entries-list').innerHTML=entries.length?`<div class="table-wrap"><table><thead><tr><th>Data</th><th>Descrição</th><th>Tipo</th><th>Valor</th><th>Ações</th></tr></thead><tbody>${entries.map(e=>`<tr><td>${dateLabel(e.date)}</td><td><strong>${escape(e.description)}</strong><small>${escape(e.category)}</small></td><td><span class="pill ${e.type==='Saída'?'pending':''}">${e.type}</span></td><td class="money ${e.type==='Entrada'?'in':'out'}">${e.type==='Entrada'?'+':'−'} ${brl(e.amount)}</td><td><div class="row-actions"><button data-edit-entry="${escape(e.id)}" aria-label="Editar ${escape(e.description)}">Editar</button><button data-delete-entry="${escape(e.id)}" aria-label="Excluir ${escape(e.description)}">Excluir</button></div></td></tr>`).join('')}</tbody></table></div>`:empty('Cada registro faz diferença','Nenhuma movimentação neste mês. Registre o que entrou ou saiu do seu negócio.','new-entry','Registrar movimentação');
    $('export-csv').disabled=!entries.length;
  }
  function monthEntries() { return [...state.entries].filter(e=>e.date.slice(0,7)===$('finance-month').value).sort((a,b)=>b.date.localeCompare(a.date)); }
  const titles={inicio:'Visão geral',catalogo:'Produtos e serviços',pedidos:'Pedidos',financeiro:'Entradas e saídas',guia:'Aprenda a usar'};
  function route() {
    const hash=location.hash.slice(1), view=Object.hasOwn(titles,hash)?hash:'inicio';
    document.querySelectorAll('.view').forEach(s=>s.hidden=s.id!==`view-${view}`);
    document.querySelectorAll('nav a').forEach(a=>{ const active=a.dataset.view===view; a.classList.toggle('active',active); if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current'); });
    $('breadcrumb-page').textContent=titles[view]; document.title=`${titles[view]} · Empreende Fácil`;
  }
  const field=(label,input,hint='')=>`<label class="field">${label}${input}${hint?`<small>${hint}</small>`:''}</label>`;
  const input=(name,value='',type='text',more='')=>`<input name="${name}" type="${type}" value="${escape(value)}" ${more}>`;
  const options=(values,selected)=>values.map(s=>`<option value="${escape(s)}"${s===selected?' selected':''}>${escape(s)}</option>`).join('');
  function openEditor(type,record=null) {
    editing={type,record}; $('form-error').textContent='';
    const isEdit=!!record;
    $('dialog-title').textContent=(isEdit?'Editar ':'Novo ')+({product:'item',order:'pedido',entry:'registro'}[type]);
    $('save-button').textContent=isEdit?'Salvar alterações':'Salvar';
    let html='';
    if(type==='product') {
      const p=record||{type:'Produto',price:0};
      html=field('Nome do item',input('name',p.name,'text','required maxlength="150" placeholder="Ex.: Bolo caseiro ou Manutenção"'))+`<div class="field-row">${field('Tipo',`<select name="type">${options(EF.types,p.type)}</select>`)}${field('Preço (R$)',input('price',isEdit?(p.price/100).toFixed(2):'','text','required inputmode="decimal" maxlength="15" placeholder="0,00"'))}</div>`+field('Descrição (opcional)',`<textarea name="description" maxlength="600" placeholder="Detalhes sobre o que você oferece">${escape(p.description||'')}</textarea>`);
    } else if(type==='order') {
      if(!state.products.length&&!isEdit) { toast('Primeiro, cadastre um produto ou serviço.'); location.hash='catalogo'; openEditor('product'); return; }
      const o=record||{productId:state.products[0]?.id,quantity:1,status:'Pendente',due:today()};
      const products=[...state.products];
      if(isEdit&&!products.some(p=>p.id===o.productId))products.push({id:o.productId,name:o.productName+' (fora do catálogo)',price:o.unitPrice});
      html=field('Cliente',input('customer',o.customer,'text','required maxlength="150" placeholder="Nome do cliente"'),'Use somente o nome necessário para identificar o pedido.')+field('Produto ou serviço',`<select name="productId" required>${products.map(p=>`<option value="${escape(p.id)}"${p.id===o.productId?' selected':''}>${escape(p.name)}</option>`).join('')}</select>`)+`<div class="field-row">${field('Quantidade',input('quantity',o.quantity,'number','required min="1" max="100000" step="1"'))}${field('Valor unitário (R$)',input('unitPrice',((isEdit?o.unitPrice:products.find(p=>p.id===o.productId)?.price||0)/100).toFixed(2),'text','required inputmode="decimal" maxlength="15"'))}</div><div class="field-row">${field('Entrega',input('due',o.due,'date','required min="1900-01-01" max="9999-12-31"'))}${field('Situação',`<select name="status">${options(EF.statuses,o.status)}</select>`)}</div>`+field('Observações (opcional)',`<textarea name="notes" maxlength="600" placeholder="Detalhes do combinado">${escape(o.notes||'')}</textarea>`)+`<div class="order-total"><span>Total do pedido</span><strong id="order-total"></strong></div><p class="subtle" style="margin-top:12px">O recebimento deve ser registrado separadamente em Entradas e saídas.</p>`;
    } else {
      const e=record||{type:'Entrada',date:today(),category:'Vendas'};
      html=`<div class="field-row">${field('Tipo',`<select name="type">${options(['Entrada','Saída'],e.type)}</select>`)}${field('Valor (R$)',input('amount',isEdit?(e.amount/100).toFixed(2):'','text','required inputmode="decimal" maxlength="15" placeholder="0,00"'))}</div>`+field('Descrição',input('description',e.description,'text','required maxlength="150" placeholder="Ex.: Pagamento do pedido ou Compra de material"'))+`<div class="field-row">${field('Categoria',`<select name="category">${options(['Vendas','Serviços','Materiais','Transporte','Divulgação','Outros'],e.category)}</select>`)}${field('Data',input('date',e.date,'date','required min="1900-01-01" max="9999-12-31"'))}</div>`;
    }
    $('form-fields').innerHTML=html;
    if(type==='order')updateOrderTotal();
    if(!$('editor').open)$('editor').showModal();
    $('editor-form').querySelector('input,select')?.focus();
  }
  function updateOrderTotal(){try{const f=$('editor-form');$('order-total').textContent=brl(EF.orderTotal({unitPrice:EF.money(f.elements.unitPrice.value),quantity:Number(f.elements.quantity.value)}));}catch{$('order-total').textContent='Confira os valores';}}
  $('editor-form').addEventListener('input',()=>{if(editing?.type==='order')updateOrderTotal();});
  $('editor-form').addEventListener('change',event=>{
    if(editing?.type==='order'&&event.target.name==='productId') { const p=state.products.find(p=>p.id===event.target.value); if(p)$('editor-form').elements.unitPrice.value=(p.price/100).toFixed(2); updateOrderTotal(); }
  });
  $('editor-form').addEventListener('submit',event=>{
    event.preventDefault();
    try {
      const f=new FormData(event.currentTarget),get=n=>f.get(n), next=structuredClone(state), old=editing.record;
      let collection,record;
      if(editing.type==='product') {
        const type=get('type'); if(!EF.types.includes(type))throw new Error('Escolha um tipo válido.');
        collection='products';record={id:old?.id||id(),name:EF.text(get('name'),'Nome'),type,price:EF.money(get('price')),description:EF.text(get('description'),'Descrição',600,false)};
      } else if(editing.type==='order') {
        const product=state.products.find(p=>p.id===get('productId'));
        if(!product&&old?.productId!==get('productId'))throw new Error('Escolha um item do catálogo.');
        if(!EF.validDate(get('due'))||!EF.statuses.includes(get('status')))throw new Error('Confira a data e a situação.');
        collection='orders';record={id:old?.id||id(),customer:EF.text(get('customer'),'Cliente'),productId:get('productId'),productName:product?.name||old.productName,quantity:Number(get('quantity')),unitPrice:EF.money(get('unitPrice')),due:get('due'),status:get('status'),created:old?.created||today(),notes:EF.text(get('notes'),'Observações',600,false)}; EF.orderTotal(record);
      } else {
        const amount=EF.money(get('amount')); if(amount<=0)throw new Error('A movimentação precisa ter um valor maior que zero.');
        if(!EF.validDate(get('date'))||!['Entrada','Saída'].includes(get('type')))throw new Error('Confira a data e o tipo.');
        collection='entries';record={id:old?.id||id(),description:EF.text(get('description'),'Descrição'),category:EF.text(get('category'),'Categoria',60),type:get('type'),amount,date:get('date')};
      }
      if(next[collection].length>=10000&&!old)throw new Error('Limite de 10 mil registros atingido. Exporte uma cópia dos dados.');
      if(old)next[collection]=next[collection].map(r=>r.id===old.id?record:r);else next[collection].push(record);
      if(persist(next)){$('editor').close();toast(old?'Alterações salvas.':'Registro salvo. Um passo a mais na organização!');}
    }catch(error){$('form-error').textContent=error.message;}
  });
  $('close-dialog').onclick=$('cancel-dialog').onclick=()=>$('editor').close();
  function confirmDelete(collection,record){
    $('confirm-title').textContent='Excluir este registro?';
    $('confirm-description').textContent=collection==='products'?'O item sairá do catálogo. Os pedidos já registrados serão preservados. Você pode exportar uma cópia antes de excluir.':'O registro será removido dos seus dados. Você pode exportar uma cópia antes de excluir.';
    deleteAction=()=>{const next=structuredClone(state);next[collection]=next[collection].filter(r=>r.id!==record.id);if(persist(next)){toast('Registro excluído.');$('confirm-dialog').close();}};
    $('delete-record').textContent='Excluir registro';$('confirm-dialog').showModal();$('keep-record').focus();
  }
  $('keep-record').onclick=()=>$('confirm-dialog').close();$('delete-record').onclick=()=>deleteAction?.();
  document.addEventListener('click',event=>{
    const action=event.target.closest('[data-action]')?.dataset.action;
    if(action==='new-product')openEditor('product');if(action==='new-order')openEditor('order');if(action==='new-entry')openEditor('entry');
    for(const [entity,collection] of [['product','products'],['order','orders'],['entry','entries']]) {
      const editId=event.target.closest(`[data-edit-${entity}]`)?.getAttribute(`data-edit-${entity}`);
      const deleteId=event.target.closest(`[data-delete-${entity}]`)?.getAttribute(`data-delete-${entity}`);
      if(editId){const r=state[collection].find(r=>r.id===editId);if(r)openEditor(entity,r);}
      if(deleteId){const r=state[collection].find(r=>r.id===deleteId);if(r)confirmDelete(collection,r);}
    }
  });
  ['product-search','order-search'].forEach(i=>$(i).addEventListener('input',render));
  ['product-filter','order-filter','dashboard-month','finance-month'].forEach(i=>$(i).addEventListener('change',()=>{if(!$(i).value&&i.endsWith('month'))$(i).value=today().slice(0,7);render();}));
  function download(content,name,mime){const url=URL.createObjectURL(new Blob([content],{type:mime}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  $('backup').onclick=()=>{try{download(storageProblem?localStorage.getItem(KEY):JSON.stringify(state,null,2),`empreende-facil-${today()}.json`,'application/json');toast('Cópia exportada. Guarde o arquivo em um lugar seguro.');}catch{toast('Não foi possível exportar os dados deste navegador.');}};
  $('export-csv').onclick=()=>download(EF.csv(monthEntries()),`movimentacoes-${$('finance-month').value}.csv`,'text/csv;charset=utf-8');
  $('restore').onclick=()=>$('restore-file').click();
  $('restore-file').addEventListener('change',async event=>{
    const file=event.target.files[0];if(!file)return;
    try {
      if(file.size>10*1024*1024)throw new Error('A cópia deve ter no máximo 10 MB.');
      const imported=EF.validateState(JSON.parse(await file.text()));
      $('confirm-title').textContent='Restaurar esta cópia?';
      $('confirm-description').textContent=`A cópia contém ${imported.products.length} itens, ${imported.orders.length} pedidos e ${imported.entries.length} movimentações. Ela substituirá os dados atuais deste navegador. Exporte seus registros antes, se quiser preservá-los.`;
      $('delete-record').textContent='Restaurar cópia';
      deleteAction=()=>{const wasProblem=storageProblem;storageProblem=false;if(persist(imported)){$('confirm-dialog').close();toast('Cópia restaurada com sucesso.');}else storageProblem=wasProblem;};
      $('confirm-dialog').showModal();$('keep-record').focus();
    }catch(error){toast(error instanceof SyntaxError?'Não foi possível ler este arquivo JSON.':error.message);}finally{event.target.value='';}
  });
  // Evita sobrescrever silenciosamente dados salvos em outra aba.
  window.addEventListener('storage',event=>{if(event.key===KEY){try{state=event.newValue?EF.validateState(JSON.parse(event.newValue)):EF.empty();storageProblem=false;$('editor').close();$('confirm-dialog').close();render();toast('Dados atualizados por outra aba.');}catch{storageProblem=true;toast('Não foi possível ler os dados atualizados em outra aba.');}}});
  $('dashboard-month').value=$('finance-month').value=today().slice(0,7);
  window.addEventListener('hashchange',route);route();render();
  if(storageProblem)toast('Os dados salvos não puderam ser lidos. Acesse o guia para exportar a cópia original ou restaurar uma cópia válida.');
})();

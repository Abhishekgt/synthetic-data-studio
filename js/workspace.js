// workspace.js - handles upload, metadata explorer, relationships, generation and preview
// This is a prototype implementation: creates mock metadata, allows editing, and produces synthetic preview data
document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const dropArea = document.getElementById('dropArea');
  const fileInput = document.getElementById('fileInput');
  const fileList = document.getElementById('fileList');
  const metaTableBody = document.querySelector('#metaTable tbody');
  const enrichTbody = document.querySelector('#enrichTable tbody');
  const keyMapTable = document.querySelector('#keyMapTable tbody');
  const relationSvg = document.getElementById('relationSvg');
  const previewTable = document.getElementById('previewTable');
  const previewTbody = previewTable.querySelector('tbody');
  const previewThead = previewTable.querySelector('thead');
  const rowsPerPageSel = document.getElementById('rowsPerPage');
  const schemaMatchEl = document.getElementById('schemaMatch');
  const relIntegrityEl = document.getElementById('relIntegrity');
  const dupKeysEl = document.getElementById('dupKeys');

  // Mock dataset templates (SAP-like)
  const templates = {
    'Customer Master': ['KUNNR','NAME1','LAND1','ERDAT'],
    'Sales Order': ['VBELN','KUNNR','ERDAT','NETWR'],
    'Vendor': ['LIFNR','NAME1','LAND1','ERDAT'],
    'Material': ['MATNR','MAKTX','MATKL']
  };

  // In-memory project model
  const model = {
    datasets: {}, // name -> {columns: [{name,type,meaning,generator,mapping,rule,nullPct,dupPct}] , rows: []}
    keyMap: [], // {original,synthetic, dataset, count}
    relations: [] // [{from:{dataset,field}, to:{dataset,field}}]
  };

  // Setup drag/drop
  ['dragenter','dragover'].forEach(evt=>dropArea.addEventListener(evt, e=>{e.preventDefault();dropArea.classList.add('dragover')}))
  ['dragleave','drop'].forEach(evt=>dropArea.addEventListener(evt, e=>{e.preventDefault();dropArea.classList.remove('dragover')}))
  dropArea.addEventListener('drop', e=>{
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  });
  dropArea.addEventListener('click', ()=> fileInput.click());
  fileInput.addEventListener('change', ()=> handleFiles(Array.from(fileInput.files)));

  function handleFiles(files){
    files.forEach(f=>{
      // simple heuristic: match template by name
      const name = f.name.replace(/\.[^/.]+$/, '');
      let matched = Object.keys(templates).find(t => name.toLowerCase().includes(t.toLowerCase().split(' ')[0]));
      if(!matched) matched = Object.keys(templates)[Math.floor(Math.random()*Object.keys(templates).length)];
      addDataset(matched);
      const item = document.createElement('div');
      item.className = 'file-item muted';
      item.textContent = `${f.name} — mapped to ${matched}`;
      fileList.appendChild(item);
      toast('Imported ' + f.name);
    });
  }

  // Add dataset to model and render metadata
  function addDataset(name){
    const cols = templates[name].map(c => ({
      name: c,
      type: 'string',
      meaning: guessMeaning(c),
      generator: guessGenerator(c),
      mapping: c,
      rule: '',
      nullPct: 0,
      dupPct: 0
    }));
    model.datasets[name] = {columns: cols, rows: []};
    renderMetaTable();
    renderEnrichment();
    renderKeyMap();
    renderRelations();
  }

  // Guessers for UX
  function guessMeaning(col){
    const map = {KUNNR:'Customer Number',VBELN:'Sales Order Number',MATNR:'Material Number',LAND1:'Country',ERDAT:'Created Date',NAME1:'Name'};
    return map[col] || 'Field';
  }
  function guessGenerator(col){
    if(/KUNNR|LIFNR|MATNR|VBELN/.test(col)) return 'Custom SAP ID';
    if(/NAME|MAKTX/.test(col)) return 'Name';
    if(/LAND1/.test(col)) return 'Country';
    if(/ERDAT/.test(col)) return 'Date';
    return 'String';
  }

  // Render metadata explorer
  function renderMetaTable(filter=''){
    metaTableBody.innerHTML = '';
    Object.entries(model.datasets).forEach(([dname, ds])=>{
      ds.columns.forEach((col, idx)=>{
        if(filter && !(col.name.toLowerCase().includes(filter) || col.meaning.toLowerCase().includes(filter))) return;
        const tr = document.createElement('tr');
        tr.dataset.dataset = dname;
        tr.innerHTML = `<td contenteditable class="field-name">${col.name}</td>
          <td><input class="small-input" value="${col.type}" /></td>
          <td contenteditable class="meaning">${col.meaning}</td>
          <td>
            <select class="generator">
              <option ${col.generator==='Custom SAP ID'?'selected':''}>Custom SAP ID</option>
              <option ${col.generator==='Name'?'selected':''}>Name</option>
              <option ${col.generator==='Country'?'selected':''}>Country</option>
              <option ${col.generator==='Date'?'selected':''}>Date</option>
              <option ${col.generator==='Integer'?'selected':''}>Integer</option>
              <option ${col.generator==='GUID'?'selected':''}>GUID</option>
            </select>
          </td>
          <td contenteditable class="mapping">${col.mapping}</td>
          <td contenteditable class="rule">${col.rule}</td>
          <td><input class="small-input nullpct" type="number" min="0" max="100" value="${col.nullPct}" /></td>
          <td><input class="small-input duppct" type="number" min="0" max="100" value="${col.dupPct}" /></td>
          <td><input class="preview-val" readonly value="${previewSample(col)}" /></td>`;
        metaTableBody.appendChild(tr);
      });
    });
    attachMetaEvents();
  }

  // small preview sample
  function previewSample(col){
    if(col.generator==='Custom SAP ID') return col.name + '_0001';
    if(col.generator==='Date') return '2026-01-01';
    if(col.generator==='Country') return 'DE';
    if(col.generator

// dashboard.js - populates dashboard mocks, handles recent projects and activity

document.addEventListener('DOMContentLoaded', () => {
  // Mock projects
  const projects = [
    {name:'Customer 360 — Migration', created:'2026-03-04', modified:'2026-07-28', status:'Active'},
    {name:'Vendor Consolidation', created:'2025-11-20', modified:'2026-07-10', status:'Staging'},
    {name:'Sales Orders Archive', created:'2026-02-12', modified:'2026-07-20', status:'Completed'},
  ];

  const tbody = document.querySelector('#projectsTable tbody');
  projects.forEach(p=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${p.name}</td><td>${p.created}</td><td>${p.modified}</td><td>${p.status}</td>
      <td><button class="btn" data-open="${p.name}">Open</button></td>`;
    tbody.appendChild(tr);
  });

  document.querySelectorAll('#projectsTable button[data-open]').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      const name = btn.getAttribute('data-open');
      toast('Opening ' + name);
      // open workspace (in prod, would open project)
      setTimeout(()=> location.href = 'workspace.html', 500);
    });
  });

  // Activity
  const act = [
    'Key mapping updated for Customer.KUNNR',
    'Uploaded 3 datasets for Vendor Migration',
    'Auto-detect relationships ran successfully',
    'Generated preview for Sales Orders'
  ];
  const actList = document.getElementById('recentActivity');
  act.forEach(a=>{
    const li = document.createElement('li');
    li.textContent = a;
    actList.appendChild(li);
  });

  // Recent runs (small)
  const runs = document.getElementById('recentRuns');
  runs.innerHTML = `<div class="muted">Latest run: Customer 360 — 10k rows</div><div class="muted">Last export: 2026-07-29 09:12</div>`;

  // Search projects
  const search = document.getElementById('projectSearch');
  if(search){
    search.addEventListener('input', debounce((e)=>{
      const q = e.target.value.toLowerCase();
      Array.from(tbody.children).forEach(tr=>{
        tr.style.display = (tr.cells[0].textContent.toLowerCase().includes(q)) ? '' : 'none';
      });
    }, 200));
  }
});
/* Exact saved archive. Geometry and values are read from the local data bundle. */
(() => {
  const root = document.querySelector('[data-willow-explorer]');
  const data = window.WILLOW_ARCHIVE;
  if (!root || !data) return;
  const NS = 'http://www.w3.org/2000/svg';
  const make = (tag, attrs = {}, text) => {
    const el = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    if (text !== undefined) el.textContent = text;
    return el;
  };
  const chart = root.querySelector('#archive-chart');
  const drawing = root.querySelector('#archive-path');
  const number = root.querySelector('#archive-number');
  const range = root.querySelector('#archive-range');
  const rodSelect = root.querySelector('#archive-rod');
  const meshToggle = root.querySelector('#show-mesh');
  const endsToggle = root.querySelector('#show-ends');
  const title = root.querySelector('#selected-plan-title');
  const detail = root.querySelector('#rod-detail');
  const status = root.querySelector('#archive-status');
  const rankedRoot = root.querySelector('#ranked-plans');
  const weightInputs = [...root.querySelectorAll('[data-ranking-weight]')];
  const rankingStatus = root.querySelector('#ranking-status');
  let currentRanking = [];
  const normalizedLosses = data.plans.map(plan => plan.values.map((value, axis) => {
    const [lo, hi] = data.ranges[axis];
    return hi === lo ? 0 : (axis < 2 ? hi - value : value - lo) / (hi - lo);
  }));
  function syncRanking() {
    rankedRoot.querySelectorAll('[data-ranked-plan]').forEach(button =>
      button.setAttribute('aria-pressed', String(Number(button.dataset.rankedPlan) === selected + 1)));
  }
  function updateRanking(chooseBest = true) {
    const weights = weightInputs.map(input => Number(input.value));
    weights.forEach((value, i) => {root.querySelector('#weight-output-' + i).textContent = value.toFixed(2);});
    const total = weights.reduce((a, b) => a + b, 0);
    rankedRoot.replaceChildren();
    if (total <= 0) {
      currentRanking = [];
      rankingStatus.textContent = 'Set at least one coefficient above zero to rank plans.';
      return;
    }
    currentRanking = normalizedLosses.map((losses, index) => ({index,
      score: losses.reduce((sum, loss, axis) => sum + (weights[axis] / total) * loss * loss, 0)
    })).sort((a, b) => a.score - b.score || a.index - b.index).slice(0, 5);
    currentRanking.forEach((item, rank) => {
      const plan = data.plans[item.index];
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'ranked-plan';
      button.dataset.rankedPlan = String(item.index + 1);
      button.dataset.rankingScore = String(item.score);
      button.setAttribute('aria-label', `Rank ${rank + 1}, archive ${item.index + 1}, weighted loss ${item.score.toFixed(4)}`);
      const text = [`${String(rank + 1).padStart(2, '0')} / #${String(item.index + 1).padStart(3, '0')}`,
        ...plan.values.map((value, axis) => axis === 3 ? String(value) : value.toFixed(3)), item.score.toFixed(4)];
      text.forEach(value => {const span = document.createElement('span');span.textContent = value;button.append(span);});
      button.addEventListener('click', () => select(item.index));
      rankedRoot.append(button);
    });
    rankingStatus.textContent = 'Lower loss is better. Equal coefficients select archive #206.';
    if (chooseBest) select(currentRanking[0].index);
    else syncRanking();
  }
  const labels = ['T maximum', 'A maximum', 'B minimum', 'k minimum', 'Portfolio selection'];
  const axisLabels = ['Benefit T ↑', 'Alignment A ↑', 'Bending B ↓', 'Rod count k ↓'];
  const xs = [65, 275, 485, 695], top = 63, bottom = 282;
  let selected = data.selected;
  const fmt = (value, axis) => axis === 3 ? String(value) : value.toFixed(3);
  const points = data.plans.map(plan => plan.values.map((v, j) => {
    const [lo, hi] = data.ranges[j];
    const loss = hi === lo ? 0 : (j < 2 ? hi - v : v - lo) / (hi - lo);
    return [xs[j], top + loss * (bottom - top)];
  }));
  const asPath = pts => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(3)},${p[1].toFixed(3)}`).join(' ');
  // Archive background first, then reference plans, selected plan, and axis labels.
  const archiveGroup = make('g', {'class': 'archive-lines'});
  points.forEach(pts => archiveGroup.append(make('path', {d: asPath(pts)})));
  chart.append(archiveGroup);
  const representativeGroup = make('g', {'class': 'archive-reference-lines'});
  data.representatives.forEach((index, j) => representativeGroup.append(make('path', {d: asPath(points[index]), 'stroke-dasharray': ['','6 4','2 3','8 3 2 3',''][j]})));
  chart.append(representativeGroup);
  const hoverLine = make('path', {'class': 'archive-hover-line', visibility: 'hidden'});
  const selectedLine = make('path', {'class': 'archive-selected-line'});
  chart.append(hoverLine, selectedLine);
  const selectedDots = make('g', {'class': 'archive-selected-dots'});
  chart.append(selectedDots);
  for (let j = 0; j < 4; j++) {
    const x = xs[j], [lo, hi] = data.ranges[j];
    chart.append(make('line', {x1:x, x2:x, y1:top, y2:bottom, 'class':'archive-axis'}));
    for (const fraction of [.25, .5, .75]) {
      const y = top + fraction * (bottom - top);
      chart.append(make('line', {x1:x-3, x2:x+3, y1:y, y2:y, 'class':'archive-axis'}));
    }
    chart.append(make('text', {x, y:19, 'text-anchor':'middle', 'class':'archive-axis-label'}, axisLabels[j]));
    chart.append(make('text', {x, y:45, 'text-anchor':'middle', 'class':'archive-axis-value'}, fmt(j<2 ? hi : lo,j)));
    chart.append(make('text', {x, y:305, 'text-anchor':'middle', 'class':'archive-axis-value'}, fmt(j<2 ? lo : hi,j)));
  }
  const tooltip = make('text', {x:380, y:329, 'text-anchor':'middle', 'class':'archive-chart-hint'}, 'Click a line to inspect its path set');
  chart.append(tooltip);
  const bounds = data.vertices.reduce((b,v) => [Math.min(b[0],v[0]),Math.min(b[1],v[1]),Math.max(b[2],v[0]),Math.max(b[3],v[1])],[Infinity,Infinity,-Infinity,-Infinity]);
  const project = (width, height, pad=15) => {
    const dx=bounds[2]-bounds[0],dy=bounds[3]-bounds[1];
    const scale=Math.min((width-2*pad)/dx,(height-2*pad)/dy);
    const ox=(width-dx*scale)/2,oy=(height-dy*scale)/2;
    return index => {
      const v=data.vertices[index];
      return [ox+(v[0]-bounds[0])*scale, height-oy-(v[1]-bounds[1])*scale];
    };
  };
  const drawRods = (target, plan, width, height, selectedRod=-1, ends=false) => {
    const pt = project(width,height);
    plan.rods.forEach((rod,j) => {
      const active=selectedRod<0 || selectedRod===j;
      const line=make('path',{d:asPath(rod.map(pt)),fill:'none',stroke:j%2===0?'#222':'#777','stroke-width':selectedRod===j?2.8:1.25,'stroke-linecap':'round','stroke-linejoin':'round',opacity:active?1:.15,'data-rod':j});
      if (target===drawing) {
        line.append(make('title',{},`Rod ${j+1} · ${rod.length} nodes · geometric length ${plan.lengths[j].toFixed(2)}`));
        line.addEventListener('click',()=>{rodSelect.value=String(j);renderDrawing();});
      }
      target.append(line);
      if (ends && active) [rod[0],rod[rod.length-1]].forEach(n=>{const [cx,cy]=pt(n);target.append(make('circle',{cx,cy,r:2.8,fill:'#fff',stroke:'#111','stroke-width':1}));});
    });
  };
  const miniButtons=[];
  data.representatives.forEach((index,j) => {
    const plan=data.plans[index];
    const button=document.createElement('button');button.type='button';button.dataset.representative=String(index);button.setAttribute('aria-pressed',String(index===selected));
    const label=document.createElement('span');label.className='representative-title';label.textContent=labels[j];button.append(label);
    const id=document.createElement('span');id.className='representative-id';id.textContent=`Archive #${String(index+1).padStart(3,'0')}`;button.append(id);
    const svg=make('svg',{viewBox:'0 0 250 110','aria-hidden':'true'});drawRods(svg,plan,250,110);button.append(svg);
    const values=document.createElement('span');values.className='representative-values';values.textContent=`T ${fmt(plan.values[0],0)} / A ${fmt(plan.values[1],1)}\nB ${fmt(plan.values[2],2)} / k ${plan.values[3]}`;button.append(values);
    button.addEventListener('click',()=>select(index));
    root.querySelector('.archive-representatives').append(button);miniButtons.push(button);
  });
  function renderDrawing() {
    const plan=data.plans[selected],rodIndex=Number(rodSelect.value);
    drawing.replaceChildren();
    if (meshToggle.checked) {
      const pt=project(660,310);
      const mesh=make('g',{'class':'archive-mesh'});
      data.edges.forEach(([a,b])=>mesh.append(make('path',{d:asPath([pt(a),pt(b)])})));drawing.append(mesh);
    }
    drawRods(drawing,plan,660,310,rodIndex,endsToggle.checked);
    drawing.setAttribute('aria-label',`Archive plan ${selected+1}, ${plan.rods.length} finite rods${rodIndex>=0?`, rod ${rodIndex+1} highlighted`:''}`);
    detail.textContent=rodIndex<0 ? `${plan.rods.length} finite rods · maximum internal turn ${plan.maxTurn.toFixed(1)}° · geometric path model` : `Rod ${rodIndex+1} · ${plan.rods[rodIndex].length} nodes · geometric length ${plan.lengths[rodIndex].toFixed(2)} model units`;
  }
  function select(index) {
    selected=Math.max(0,Math.min(data.plans.length-1,Math.round(index)));
    const plan=data.plans[selected];
    number.value=range.value=String(selected+1);title.textContent=`Archive #${String(selected+1).padStart(3,'0')}`;
    selectedLine.setAttribute('d',asPath(points[selected]));selectedDots.replaceChildren();
    points[selected].forEach(([cx,cy])=>selectedDots.append(make('circle',{cx,cy,r:3.2})));
    root.querySelectorAll('[data-objective]').forEach((el,j)=>el.textContent=fmt(plan.values[j],j));
    rodSelect.replaceChildren(new Option('All rods','-1'));
    plan.rods.forEach((rod,j)=>rodSelect.add(new Option(`Rod ${j+1}` ,String(j))));
    miniButtons.forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.representative)===selected)));
    const rep=data.representatives.indexOf(selected);
    status.textContent=`Archive #${String(selected+1).padStart(3,'0')}${rep>=0?' · '+labels[rep].toLowerCase():''} · feasible in the saved computational model.`;
    root.dataset.selectedPlan=String(selected+1);renderDrawing();syncRanking();
  }
  const fromNumber=()=>{const v=number.valueAsNumber;if(Number.isFinite(v))select(v-1);else number.value=String(selected+1);};
  number.addEventListener('change',fromNumber);
  number.addEventListener('keydown',event=>{if(event.key==='Enter'){fromNumber();number.blur();}});
  range.addEventListener('input',()=>select(Number(range.value)-1));
  root.querySelector('[data-plan-prev]').addEventListener('click',()=>select(selected-1));
  root.querySelector('[data-plan-next]').addEventListener('click',()=>select(selected+1));
  [rodSelect,meshToggle,endsToggle].forEach(el=>el.addEventListener('change',renderDrawing));
  function nearest(event) {
    const p=chart.createSVGPoint();p.x=event.clientX;p.y=event.clientY;
    const matrix=chart.getScreenCTM();if(!matrix)return null;
    const q=p.matrixTransform(matrix.inverse());
    if(q.x<xs[0]-20 || q.x>xs[3]+20 || q.y<top-10 || q.y>bottom+10)return null;
    let best=Infinity,index=0;
    points.forEach((pts,i)=>{
      for(let j=0;j<3;j++){
        const [ax,ay]=pts[j],[bx,by]=pts[j+1];const dx=bx-ax,dy=by-ay;
        const t=Math.max(0,Math.min(1,((q.x-ax)*dx+(q.y-ay)*dy)/(dx*dx+dy*dy)));
        const d=(q.x-ax-t*dx)**2+(q.y-ay-t*dy)**2;
        if(d<best){best=d;index=i;}
      }
    });
    return best<=400?index:null;
  }
  chart.addEventListener('pointermove',event=>{
    const index=nearest(event);
    hoverLine.setAttribute('visibility',index===null?'hidden':'visible');
    if(index!==null){hoverLine.setAttribute('d',asPath(points[index]));tooltip.textContent=`Archive #${String(index+1).padStart(3,'0')} · click to select`;}
  });
  chart.addEventListener('pointerleave',()=>{hoverLine.setAttribute('visibility','hidden');tooltip.textContent='Click a line to inspect its path set';});
  chart.addEventListener('click',event=>{const index=nearest(event);if(index!==null)select(index);});
  chart.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();select(event.key==='Home'?0:event.key==='End'?598:selected+(event.key==='ArrowRight'?1:-1));
  });
  weightInputs.forEach(input => input.addEventListener('input', () => updateRanking()));
  root.querySelector('[data-reset-weights]').addEventListener('click', () => {
    weightInputs.forEach(input => {input.value = '0.25';});
    updateRanking();
  });
  updateRanking(false);
  select(selected);
})();

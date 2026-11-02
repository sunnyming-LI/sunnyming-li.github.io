(() => {
  const menuButton = document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  if (menuButton && mobileNav) {
    menuButton.addEventListener('click', () => {
      const expanded = menuButton.getAttribute('aria-expanded') === 'true';
      menuButton.setAttribute('aria-expanded', String(!expanded));
      menuButton.textContent = expanded ? 'Menu' : 'Close';
      mobileNav.hidden = expanded;
    });
    mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
      mobileNav.hidden = true;
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.textContent = 'Menu';
    }));
  }

  const filterButtons = document.querySelectorAll('[data-filter]');
  const projectRows = document.querySelectorAll('[data-categories]');
  filterButtons.forEach(button => button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    filterButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    let count = 0;
    projectRows.forEach(row => {
      const show = filter === 'all' || row.dataset.categories.split(' ').includes(filter);
      row.hidden = !show;
      if (show) count++;
    });
    const status = document.querySelector('.filter-count');
    if (status) status.textContent = `${String(count).padStart(2, '0')} projects`;
    const liveStatus = document.querySelector('#filter-status');
    if (liveStatus) liveStatus.textContent = `${count} projects shown: ${button.textContent.trim()}`;
  }));

  const morphologyButtons = document.querySelectorAll('[data-morphology]');
  const morphologyNames = ['Irregular triangles', 'Equilateral triangles', 'Quadrilateral grid', 'Arched bench', 'Chaise longue', 'Chair'];
  const metrics = [
    ['0.809','0.901','4.631','19'], ['0.838','0.894','16.778','7'],
    ['0.658','0.928','29.197','9'], ['0.828','0.932','15.449','9'],
    ['0.777','0.837','29.262','11'], ['0.423','0.869','20.358','13']
  ];
  morphologyButtons.forEach(button => button.addEventListener('click', () => {
    const index = Number(button.dataset.morphology) - 1;
    morphologyButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    const image = document.querySelector('#morphology-image');
    image.src = `../assets/images/willow-morphology-${index + 1}.webp`;
    image.alt = `${morphologyNames[index]}: computational willow path study`;
    document.querySelector('#morphology-label').textContent = morphologyNames[index];
    document.querySelectorAll('[data-metric]').forEach((item, i) => item.textContent = metrics[index][i]);
  }));

  const video = document.querySelector('#weaving-video');
  document.querySelectorAll('[data-video]').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('[data-video]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    video.pause();
    video.src = `../assets/video/${button.dataset.video}.mp4`;
    video.poster = `../assets/images/video-${button.dataset.video}.webp`;
    video.load();
    document.querySelector('#video-caption').textContent = `${button.textContent.trim()} · Simple-pattern demonstration`;
  }));

  const dialog = document.querySelector('#image-dialog');
  if (dialog) {
    const target = dialog.querySelector('img');
    const caption = dialog.querySelector('#image-caption');
    const body = dialog.querySelector('.lightbox-body');
    const zoom = dialog.querySelector('[data-dialog-zoom]');
    let opener = null;
    document.querySelectorAll('[data-zoom]').forEach(button => button.addEventListener('click', () => {
      opener = button;
      target.src = button.dataset.zoom;
      target.alt = button.querySelector('img')?.alt || '';
      caption.textContent = button.dataset.caption || target.alt;
      body.classList.remove('is-zoomed');
      zoom.textContent = 'Zoom in';
      zoom.setAttribute('aria-pressed', 'false');
      dialog.showModal();
    }));
    dialog.querySelector('[data-dialog-close]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
    zoom.addEventListener('click', () => {
      const active = body.classList.toggle('is-zoomed');
      zoom.textContent = active ? 'Fit to screen' : 'Zoom in';
      zoom.setAttribute('aria-pressed', String(active));
    });
    dialog.addEventListener('close', () => { if (opener) opener.focus(); });
  }
})();

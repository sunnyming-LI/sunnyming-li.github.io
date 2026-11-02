/* Four small loops play only while their demonstration is in view. */
(() => {
  const section = document.querySelector('.v7-demonstrations');
  if (!section) return;
  const videos = [...section.querySelectorAll('video')];
  const button = section.querySelector('[data-loop-toggle]');
  let enabled = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  const visible = new Set();
  const update = () => {
    button.textContent = enabled ? 'Pause loops' : 'Play loops';
    button.setAttribute('aria-pressed', String(enabled));
    videos.forEach(video => {
      if (enabled && visible.has(video)) video.play().catch(() => {});
      else video.pause();
    });
  };
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) visible.add(entry.target);
      else visible.delete(entry.target);
    });
    update();
  }, {threshold: .1});
  videos.forEach(video => observer.observe(video));
  button.addEventListener('click', () => {enabled = !enabled; update();});
  update();
})();

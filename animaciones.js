
(() => {
  const style = document.createElement('style');
  style.textContent = `
    .reveal { opacity: 0; transform: translateY(24px); transition: opacity .8s cubic-bezier(.16,1,.3,1), transform .8s cubic-bezier(.16,1,.3,1); }
    .reveal.in { opacity: 1; transform: translateY(0); }
    .hero h1, .hero .lede, .hero-meta { opacity: 0; transform: translateY(20px); }
    .hero.ready h1 { transition: all .9s .1s cubic-bezier(.16,1,.3,1); opacity:1; transform:none; }
    .hero.ready .lede { transition: all .9s .25s cubic-bezier(.16,1,.3,1); opacity:1; transform:none; }
    .hero.ready .hero-meta { transition: all .9s .4s cubic-bezier(.16,1,.3,1); opacity:1; transform:none; }
    .tick { transform-origin: bottom; transform: scaleY(.2); transition: transform .6s cubic-bezier(.34,1.56,.64,1); }
    .hero.ready .tick { transform: scaleY(1); }
    .theory-card { transition-delay: var(--d,0s); }
    .steps::before { transform: scaleY(0); transform-origin: top; transition: transform 1.2s .3s ease; }
    .steps.in::before { transform: scaleY(1); }
    .step { transition-delay: var(--d,0s); }
    .result { transform: scale(.9); transition: transform .5s cubic-bezier(.34,1.56,.64,1); }
    .result.pop { transform: scale(1); }
    .conclusion { position: relative; overflow: hidden; }
    .conclusion::after { content:''; position:absolute; inset:0; background: radial-gradient(600px at var(--mx,50%) var(--my,50%), rgba(143,217,199,.18), transparent 60%); opacity:0; transition: opacity .4s; pointer-events:none; }
    .conclusion:hover::after { opacity:1; }
    .subnav a.active { border-color: var(--teal-deep) !important; color: var(--ink) !important; background: #fff; }
    #progress { position: fixed; top:0; left:0; height:2px; width:0; background: var(--teal-deep); z-index: 9999; transition: width .1s linear; }
    @media (prefers-reduced-motion: reduce) { .reveal, .hero h1, .hero .lede, .hero-meta, .tick, .steps::before, .step, .result { transition: none !important; transform: none !important; opacity:1 !important; } }
  `;
  document.head.appendChild(style);

  // 2. Barra de progreso superior
  const progress = document.createElement('div');
  progress.id = 'progress';
  document.body.appendChild(progress);
  window.addEventListener('scroll', () => {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (window.scrollY / h * 100) + '%';
  }, { passive: true });

  // 3. Hero entrance + ticks wave
  const hero = document.querySelector('.hero');
  document.querySelectorAll('.tick').forEach((t,i) => t.style.transitionDelay = `${i*40}ms`);
  window.addEventListener('load', () => {
    setTimeout(() => hero.classList.add('ready'), 80);
  });

  // 4. Reveal con IntersectionObserver
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if(e.isIntersecting){
        e.target.classList.add('in');
        e.target.querySelectorAll('.result').forEach((r,j) => {
          setTimeout(()=> r.classList.add('pop'), 300 + j*90);
        });
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });

  // Aplicamos clases
  document.querySelectorAll('.theory-card, .ex-header, .statement, .step, .conclusion, footer').forEach((el,i) => {
    el.classList.add('reveal');
    el.style.setProperty('--d', `${(i%4)*70}ms`);
    io.observe(el);
  });
  document.querySelectorAll('.steps').forEach(s => io.observe(s));

  // 5. Teoría - efecto 3D sutil al mover mouse
  document.querySelectorAll('.theory-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5;
      const y = (e.clientY - r.top) / r.height - .5;
      card.style.transform = `perspective(600px) rotateY(${x*6}deg) rotateX(${-y*6}deg) translateY(-2px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  // 6. Subnav activo según scroll
  const sections = [...document.querySelectorAll('.ex-section, #teoria')];
  const links = [...document.querySelectorAll('.subnav a')];
  const navIo = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        links.forEach(a => a.classList.toggle('active', a.hash === `#${entry.target.id}`));
      }
    });
  }, { rootMargin: '-50% 0px -45% 0px' });
  sections.forEach(s => navIo.observe(s));

  // 7. Animación de números en los .result
  const animateNumber = (el) => {
    const text = el.textContent;
    const match = text.match(/([\d.]+)\s*(cm²|cm|%|m\/s²|m\/s³|s⁻²)?/);
    if(!match || el.dataset.counted) return;
    const final = parseFloat(match[1]);
    if(isNaN(final) || final === 0) return;
    let cur = 0;
    const dur = 900;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1-p, 3);
      cur = final * eased;
      el.innerHTML = el.innerHTML.replace(match[0], `${cur.toFixed(match[1].includes('.') ? 4 : 0).replace(/\.?0+$/,'')} ${match[2]||''}`.trim());
      if(p < 1) requestAnimationFrame(tick);
      else { el.dataset.counted = '1'; }
    };
    requestAnimationFrame(tick);
  };
  const numIo = new IntersectionObserver(ents => {
    ents.forEach(en => { if(en.isIntersecting){ animateNumber(en.target); numIo.unobserve(en.target); }});
  }, { threshold: 0.8 });
  document.querySelectorAll('.result').forEach(r => numIo.observe(r));

  // 8. Conclusiones siguen el mouse (luz)
  document.querySelectorAll('.conclusion').forEach(c => {
    c.addEventListener('mousemove', e => {
      const r = c.getBoundingClientRect();
      c.style.setProperty('--mx', `${e.clientX - r.left}px`);
      c.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  // 9. MathJax fade-in elegante
  if(window.MathJax){
    const orig = MathJax.typesetPromise;
    MathJax.startup = MathJax.startup || {};
    document.querySelectorAll('.math').forEach(m => {
      m.style.opacity = '0';
      m.style.transition = 'opacity .5s ease';
    });
    window.addEventListener('load', () => {
      MathJax.typesetPromise().then(() => {
        document.querySelectorAll('.math').forEach((m,i) => setTimeout(()=> m.style.opacity='1', i*80));
      });
    });
  }

  // 10. Parallax sutil del fondo cuadriculado
  let lastY = 0;
  window.addEventListener('scroll', () => {
    const dy = window.scrollY * 0.15;
    if(Math.abs(dy - lastY) > 2){
      document.body.style.backgroundPosition = `0 ${dy}px, 0 ${dy}px, 0 0`;
      lastY = dy;
    }
  }, { passive: true });

})();

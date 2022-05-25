// Convenience function to create HTML elements
function El(spec, parentElement) {
  // Shared references across the entire tree
  const refs = {};
  return el(spec, parentElement, refs);
}

function el(spec, parentElement, refs) {
  const obj = {
    $refs: refs
  };

  let pa = document.createElement(spec.tag || 'div');
  let children = spec.children || [];
  delete spec.tag;
  delete spec.children;

  let events = spec.on || {};
  Object.keys(events).forEach((event) => {
    pa.addEventListener(event, (ev) => {
      return events[event](obj, ev);
    });
  });
  delete spec.on;

  let style = spec.style || {};
  Object.keys(style).forEach((k) => {
    pa.style[k] = style[k];
  });
  delete spec.style;

  let dataset = spec.dataset || {};
  Object.keys(dataset).forEach((k) => {
    pa.dataset[k] = dataset[k];
  });
  delete spec.dataset;

  obj.$state = spec.state || {};
  delete spec.state;

  let ref = spec.ref;
  if (ref) {
    refs[ref] = pa;
    delete spec.ref;
  }

  Object.keys(spec).forEach((k) => {
    pa[k] = spec[k];
  });

  children.forEach((ch) => {
    if (ch instanceof HTMLElement) {
      pa.appendChild(ch);
    } else {
      el(ch, pa, refs);
    }
  });

  if (parentElement) {
    parentElement.appendChild(pa);
  }

  obj.$el = pa;

  return obj;
}

export default El

export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  const { className, text, dataset, attrs, style } = props;

  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = String(text);
  if (dataset) for (const [k, v] of Object.entries(dataset)) node.dataset[k] = v;
  if (attrs) for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (style) Object.assign(node.style, style);

  for (const child of children) {
    if (child === null || child === undefined) continue;
    node.append(child);
  }
  return node;
}

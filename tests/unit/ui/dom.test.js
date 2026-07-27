import { describe, it, expect } from 'vitest';
import { el } from '../../../src/ui/dom.js';

describe('el', () => {
  it('creates an element with the given tag', () => {
    expect(el('section').tagName).toBe('SECTION');
  });

  it('applies className, text, dataset, and attrs', () => {
    const node = el('div', {
      className: 'cell',
      text: 'A1',
      dataset: { index: '0', state: '' },
      attrs: { 'aria-label': 'A1 · boş' },
    });
    expect(node.className).toBe('cell');
    expect(node.textContent).toBe('A1');
    expect(node.dataset.index).toBe('0');
    expect(node.dataset.state).toBe('');
    expect(node.getAttribute('aria-label')).toBe('A1 · boş');
  });

  it('appends element and string children and skips nullish ones', () => {
    const node = el('p', {}, el('span'), null, 'text', undefined);
    expect(node.childNodes).toHaveLength(2);
    expect(node.firstChild.tagName).toBe('SPAN');
    expect(node.textContent).toBe('text');
  });

  it('accepts numeric text', () => {
    expect(el('b', { text: 0 }).textContent).toBe('0');
  });
});

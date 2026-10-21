'use client';

import { Children, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/** Menu riêng, đặt theo ô chọn để không bị cắt bởi thẻ hoặc tràn mép màn hình. */
export function Select({ children, className = '', value, onChange, disabled, name, ...props }) {
  const options = Children.toArray(children).map((option) => ({ value: String(option.props.value), label: option.props.children, disabled: option.props.disabled }));
  const selected = Math.max(0, options.findIndex((option) => option.value === String(value)));
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(selected);
  const [position, setPosition] = useState({});
  const trigger = useRef(null);
  const menu = useRef(null);
  const id = useId();

  const choose = (index) => {
    if (!options[index] || options[index].disabled) return;
    const next = options[index].value;
    onChange?.({ target: { value: next, name }, currentTarget: { value: next, name } });
    setOpen(false);
    trigger.current?.focus();
  };

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = trigger.current.getBoundingClientRect();
      const below = window.innerHeight - rect.bottom - 12;
      const above = rect.top - 12;
      const upwards = below < Math.min(options.length * 44 + 12, 220) && above > below;
      const longestLabel = Math.max(...options.map((option) => Children.toArray(option.label).join('').length));
      const width = Math.min(Math.max(rect.width, longestLabel > 12 ? 192 : 144), window.innerWidth - 24);
      const left = rect.left + width > window.innerWidth - 12 ? rect.right - width : rect.left;
      setPosition({ left: Math.max(12, Math.min(left, window.innerWidth - width - 12)), width, maxHeight: Math.min(280, Math.max(88, upwards ? above : below)), ...(upwards ? { bottom: window.innerHeight - rect.top + 6 } : { top: rect.bottom + 6 }) });
    };
    const outside = (event) => {
      if (!trigger.current?.contains(event.target) && !menu.current?.contains(event.target)) setOpen(false);
    };
    place();
    document.addEventListener('pointerdown', outside);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      document.removeEventListener('pointerdown', outside);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, options.length]);

  useEffect(() => {
    if (!open || !menu.current) return;
    const list = menu.current;
    const item = list.querySelector(`[id="${id}-${active}"]`);
    if (!item) return;
    if (item.offsetTop < list.scrollTop) list.scrollTop = item.offsetTop;
    else if (item.offsetTop + item.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = item.offsetTop + item.offsetHeight - list.clientHeight;
  }, [open, active, id]);

  const onKeyDown = (event) => {
    if (!options.length) return;
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setOpen(false); return; }
    if (event.key === 'Tab') { setOpen(false); return; }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (open) choose(active);
      else { setActive(selected); setOpen(true); }
      return;
    }
    let next;
    if (event.key === 'ArrowDown') next = open ? active + 1 : selected;
    if (event.key === 'ArrowUp') next = open ? active - 1 : selected;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = options.length - 1;
    if (next != null) {
      event.preventDefault();
      const direction = next < active ? -1 : 1;
      next = (next + options.length) % options.length;
      for (let i = 0; i < options.length && options[next].disabled; i++) next = (next + direction + options.length) % options.length;
      setActive(next); setOpen(true);
    }
  };

  return <span className={`select-field ${className}`}>
    {name && <input type="hidden" name={name} value={value} />}
    <button {...props} ref={trigger} type="button" role="combobox" className={`select-trigger ${open ? 'is-open' : ''}`} disabled={disabled || !options.length} aria-haspopup="listbox" aria-controls={open ? id : undefined} aria-expanded={open} aria-activedescendant={open ? `${id}-${active}` : undefined} onKeyDown={onKeyDown} onClick={() => { setActive(selected); setOpen(!open); }}>
      <span>{options[selected]?.label}</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
    </button>
    {open && createPortal(<div ref={menu} id={id} role="listbox" aria-label={props['aria-label']} className="select-popover" style={position} onMouseDown={(event) => event.preventDefault()}>
      {options.map((option, index) => <div key={option.value} id={`${id}-${index}`} role="option" aria-selected={index === selected} aria-disabled={option.disabled || undefined} className={`select-option ${index === active ? 'is-active' : ''}`} onPointerMove={() => !option.disabled && setActive(index)} onClick={() => choose(index)}>
        <span>{option.label}</span>{index === selected && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>}
      </div>)}
    </div>, document.body)}
  </span>;
}

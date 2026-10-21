'use client';

import { useRef, useState } from 'react';
import { Icon } from '@/shared/ui/atoms/Icon';
import { useTranslation } from '@/features/language/LanguageProvider';
import { PALETTES, PALETTE_COOKIE } from './palettes';

export function AppearanceSettings({ initialPalette }) {
  const t = useTranslation();
  const dialog = useRef(null);
  const [selected, setSelected] = useState(initialPalette);

  function choose(id) {
    setSelected(id);
    document.documentElement.dataset.palette = id;
    document.cookie = `${PALETTE_COOKIE}=${id};path=/;max-age=31536000;SameSite=Lax`;
  }

  return <>
    <button type="button" className="icon-btn appearance-trigger" aria-label={t('Appearance settings')} aria-haspopup="dialog" onClick={() => dialog.current.showModal()}><Icon name="settings" /></button>
    <dialog ref={dialog} className="appearance-dialog" aria-labelledby="appearance-title" aria-describedby="appearance-description" onClick={(event) => {
      if (event.target !== event.currentTarget) return;
      const box = event.currentTarget.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.current.close();
    }}>
      <div className="appearance-heading"><h2 id="appearance-title">{t('Appearance settings')}</h2><button type="button" className="icon-btn" aria-label={t('Close')} onClick={() => dialog.current.close()}><Icon name="close" /></button></div>
      <p id="appearance-description">{t('Choose your colors. Changes are saved on this device.')}</p>
      <fieldset className="palette-options"><legend>{t('Color palette')}</legend>
        {PALETTES.map((palette) => <label key={palette.id} className={`palette-choice ${selected === palette.id ? 'is-selected' : ''}`} style={{ '--palette-color': palette.color, '--palette-tint': palette.tint }}>
          <input type="radio" name="color-palette" value={palette.id} checked={selected === palette.id} onChange={() => choose(palette.id)} />
          <span className="palette-preview" aria-hidden="true"><span /><span /><span /></span>
          <span className="palette-name">{t(palette.label)}</span><span className="palette-check" aria-hidden="true">{selected === palette.id ? '✓' : ''}</span>
        </label>)}
      </fieldset>
    </dialog>
  </>;
}

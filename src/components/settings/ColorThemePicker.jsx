import React from 'react';
import { Typography } from '@mui/material';
import { COLOR_THEMES } from '../../constants/colorThemes';
import { useTheme } from '../../contexts/ThemeContext';

const ColorThemePicker = ({ t }) => {
  const { colorTheme, setColorTheme } = useTheme();

  return (
    <div className="flex flex-col gap-2">
      <Typography variant="body1" sx={{ color: 'var(--text-primary)', fontWeight: 600 }}>
        {t('color theme')}
      </Typography>
      <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 0.5 }}>
        {t('color theme description')}
      </Typography>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('color theme')}>
        {COLOR_THEMES.map(({ id, swatch }) => {
          const selected = colorTheme === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={t(`color theme ${id}`)}
              title={t(`color theme ${id}`)}
              onClick={() => setColorTheme(id)}
              className="color-theme-swatch"
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                border: selected
                  ? '3px solid var(--text-primary)'
                  : '2px solid var(--border-secondary)',
                backgroundColor: swatch,
                cursor: 'pointer',
                padding: 0,
                outline: selected ? '2px solid var(--border-primary)' : 'none',
                outlineOffset: 2,
                boxShadow: selected ? '0 0 0 2px var(--bg-secondary)' : 'none',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default ColorThemePicker;

import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useContext } from 'react';
import { AppContext } from '../../store/app-context';
import { useTheme } from '../../contexts/ThemeContext';
import FormatButton from '../common/FormatButton';

const ThemeToggle = () => {
  const { translate: t } = useContext(AppContext);
  const { isDark, toggleTheme } = useTheme();

  return (
    <FormatButton 
      onClick={toggleTheme} 
      title={isDark ? t('switch to light mode') : t('switch to dark mode')}
      className="theme-toggle-button"
    >
      {isDark ? (
        <SunIcon className="w-5 h-5" />
      ) : (
        <MoonIcon className="w-5 h-5" />
      )}
    </FormatButton>
  );
};

export default ThemeToggle;

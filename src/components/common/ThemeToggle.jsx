import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../../contexts/ThemeContext';
import FormatButton from '../common/FormatButton';

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <FormatButton 
      onClick={toggleTheme} 
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
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

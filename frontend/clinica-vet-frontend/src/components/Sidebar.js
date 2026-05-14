import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../ThemeContext';
import { useSelectedAnimal } from '../SelectedAnimalContext';

const links = [
  { to: '/', label: 'Dashboard', icon: '🏠' },
  { to: '/tutores', label: 'Tutores', icon: '👤' },
  { to: '/pacientes', label: 'Pacientes', icon: '🐾' },
];

export default function Sidebar() {
  const { pathname } = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const { selectedAnimalColor } = useSelectedAnimal();
  const sidebarStyle = selectedAnimalColor ? { backgroundColor: selectedAnimalColor } : undefined;

  return (
    <aside
      className={`w-56 shadow-md flex flex-col transition-colors ${selectedAnimalColor ? 'text-white' : 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100'}`}
      style={sidebarStyle}
    >
      <div className={`p-5 border-b ${selectedAnimalColor ? 'border-white/20' : 'dark:border-gray-700'}`}>
        <h1 className={`text-xl font-bold ${selectedAnimalColor ? 'text-white' : 'text-blue-600'}`}>🐾 ANA-vet</h1>
        <p className={`text-xs ${selectedAnimalColor ? 'text-white/80' : 'text-gray-400'}`}>Sistema Veterinario</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {links.map(l => {
          const isActive = pathname === l.to;
          const activeClass = selectedAnimalColor
            ? 'bg-white/15 text-white font-semibold shadow'
            : 'bg-blue-50 dark:bg-blue-900 text-blue-600 font-semibold';
          const normalClass = selectedAnimalColor
            ? 'text-white/80 hover:bg-white/10'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800';

          return (
            <Link key={l.to} to={l.to}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${isActive ? activeClass : normalClass}`}>
              <span>{l.icon}</span>{l.label}
            </Link>
          );
        })}
      </nav>
      <div className={`p-4 border-t ${selectedAnimalColor ? 'border-white/20' : 'dark:border-gray-700'}`}>
        <button onClick={toggleTheme}
          className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm transition ${selectedAnimalColor ? 'bg-white/15 text-white hover:bg-white/20' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
          {isDark ? '☀️ Modo claro' : '🌙 Modo oscuro'}
        </button>
      </div>
    </aside>
  );
}
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../ThemeContext';

const links = [
  { to: '/', label: 'Dashboard', icon: '🏠' },
  { to: '/tutores', label: 'Tutores', icon: '👤' },
  { to: '/pacientes', label: 'Pacientes', icon: '🐾' },
];

export default function Sidebar() {
  const { pathname } = useLocation();
  const { isDark, toggleTheme } = useTheme();

  return (
    <aside className="w-56 bg-white dark:bg-gray-900 shadow-md flex flex-col">
      <div className="p-5 border-b dark:border-gray-700">
        <h1 className="text-xl font-bold text-blue-600">🐾 VetApp</h1>
        <p className="text-xs text-gray-400">Sistema Veterinario</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {links.map(l => (
          <Link key={l.to} to={l.to}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition
              ${pathname === l.to
                ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 font-semibold'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
            <span>{l.icon}</span>{l.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t dark:border-gray-700">
        <button onClick={toggleTheme}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition">
          {isDark ? '☀️ Modo claro' : '🌙 Modo oscuro'}
        </button>
      </div>
    </aside>
  );
}
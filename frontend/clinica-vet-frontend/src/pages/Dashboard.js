export default function Dashboard() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Bienvenido</h2>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Tutores', color: 'bg-blue-500', icon: '👤' },
          { label: 'Pacientes', color: 'bg-green-500', icon: '🐾' },
          { label: 'Consultas', color: 'bg-purple-500', icon: '📋' },
        ].map(c => (
          <div key={c.label} className={`${c.color} text-white rounded-xl p-6 shadow`}>
            <div className="text-3xl mb-2">{c.icon}</div>
            <div className="text-lg font-semibold">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
interface Tab {
  label: string;
  icon: string;
}

interface TabNavigationProps {
  tabs: Tab[];
  activeTab: number;
  setActiveTab: (index: number) => void;
}

export function TabNavigation({ tabs, activeTab, setActiveTab }: TabNavigationProps) {
  return (
    <nav className="flex gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 w-fit">
      {tabs.map((tab, index) => (
        <button
          key={index}
          onClick={() => setActiveTab(index)}
          className={`relative px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
            activeTab === index
              ? 'text-white'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {activeTab === index && (
            <span 
              className="absolute inset-0 bg-primary-500 rounded-lg shadow-md"
              style={{ 
                animation: 'fadeIn 0.2s ease-out'
              }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <span>{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label.replace(tab.icon + ' ', '')}</span>
          </span>
        </button>
      ))}
    </nav>
  );
}

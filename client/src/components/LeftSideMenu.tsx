import React from 'react';
import { useLocation, Link } from 'wouter';
import { 
  Phone, 
  Music, 
  Radio, 
  Mic, 
  BarChart, 
  Settings, 
  Calendar, 
  BarChart3, 
  Headphones,
  Network,
  ServerCrash,
  Sliders,
  Users,
  MessageSquare,
  Globe,
  Broadcast
} from 'lucide-react';

// Categories and features for the left side menu
const menuCategories = [
  {
    name: 'Communication',
    icon: <Phone className="w-5 h-5" />,
    items: [
      { name: 'Phone System', path: '/phone', icon: <Phone className="w-4 h-4" /> },
      { name: 'Chat', path: '/chat', icon: <MessageSquare className="w-4 h-4" /> },
      { name: 'User Management', path: '/users', icon: <Users className="w-4 h-4" /> }
    ]
  },
  {
    name: 'Studio',
    icon: <Mic className="w-5 h-5" />,
    items: [
      { name: 'Playout', path: '/playout', icon: <Music className="w-4 h-4" /> },
      { name: 'Library', path: '/library', icon: <Headphones className="w-4 h-4" /> },
      { name: 'Schedule', path: '/schedule', icon: <Calendar className="w-4 h-4" /> }
    ]
  },
  {
    name: 'Radio',
    icon: <Radio className="w-5 h-5" />,
    items: [
      { name: 'Automation', path: '/radio-automation', icon: <Radio className="w-4 h-4" /> },
      { name: 'Traffic', path: '/traffic', icon: <BarChart className="w-4 h-4" /> },
      { name: 'Internet Radio', path: '/internet-radio', icon: <Network className="w-4 h-4" /> },
      { name: 'Streaming', path: '/streaming', icon: <Broadcast className="w-4 h-4" /> },
      { name: 'AI DJ', path: '/ai-dj', icon: <Music className="w-4 h-4" /> }
    ]
  },
  {
    name: 'Engineering',
    icon: <ServerCrash className="w-5 h-5" />,
    items: [
      { name: 'Transmitters', path: '/transmitters', icon: <ServerCrash className="w-4 h-4" /> },
      { name: 'Audio Logger', path: '/logger', icon: <BarChart3 className="w-4 h-4" /> },
      { name: 'Audio Processing', path: '/audio-processor', icon: <Sliders className="w-4 h-4" /> },
      { name: 'System Settings', path: '/settings', icon: <Settings className="w-4 h-4" /> }
    ]
  }
];

export const LeftSideMenu: React.FC = () => {
  const [location] = useLocation();
  const [expandedCategory, setExpandedCategory] = React.useState<string | null>(null);

  // Open the category for the current page by default
  React.useEffect(() => {
    menuCategories.forEach(category => {
      if (category.items.some(item => location.startsWith(item.path))) {
        setExpandedCategory(category.name);
      }
    });
  }, [location]);

  return (
    <div className="h-full w-64 bg-gray-900 border-r border-gray-800 overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center">
          <Radio className="h-6 w-6 text-blue-500 mr-2" />
          <h2 className="text-lg font-semibold text-gray-100">QCaller Studio</h2>
        </div>
      </div>
      <div className="px-3">
        {menuCategories.map((category) => (
          <div key={category.name} className="mb-4">
            <button
              onClick={() => setExpandedCategory(expandedCategory === category.name ? null : category.name)}
              className="flex items-center w-full justify-between px-3 py-2 text-sm rounded-md font-medium text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              <div className="flex items-center">
                {category.icon}
                <span className="ml-2">{category.name}</span>
              </div>
              <svg
                className={`w-4 h-4 transform ${expandedCategory === category.name ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            {expandedCategory === category.name && (
              <div className="mt-1 ml-4 pl-2 border-l border-gray-700">
                {category.items.map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                  >
                    <a className={`flex items-center px-3 py-2 text-sm rounded-md font-medium ${
                      location.startsWith(item.path)
                        ? 'bg-blue-900/30 text-blue-400'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`}>
                      {item.icon}
                      <span className="ml-2">{item.name}</span>
                    </a>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeftSideMenu;
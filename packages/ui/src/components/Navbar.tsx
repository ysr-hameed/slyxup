interface NavItem {
  label: string;
  href: string;
}

interface NavbarProps {
  brand: string;
  items: NavItem[];
  user?: { name: string; email: string } | null;
  onLogout?: () => void;
}

export function Navbar({ brand, items, user, onLogout }: NavbarProps) {
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <span className="text-xl font-bold text-gray-900">{brand}</span>
            <div className="ml-10 flex items-center space-x-4">
              {items.map((item) => (
                <a key={item.href} href={item.href}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                  {item.label}
                </a>
              ))}
            </div>
          </div>
          {user && (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user.name || user.email}</span>
              {onLogout && (
                <button onClick={onLogout} className="text-sm text-gray-500 hover:text-gray-700">
                  Logout
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

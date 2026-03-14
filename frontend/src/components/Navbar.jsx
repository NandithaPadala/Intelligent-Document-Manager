import { NavLink } from 'react-router-dom';
import { Upload, Search, FileText, Bell } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
    const navItems = [
        { path: '/upload', icon: <Upload size={20} />, label: 'Upload' },
        { path: '/search', icon: <Search size={20} />, label: 'Search' },
        { path: '/documents', icon: <FileText size={20} />, label: 'View Docs' },
        { path: '/notifications', icon: <Bell size={20} />, label: 'Notifications' },
    ];

    return (
        <nav className="navbar glass-panel">
            <div className="navbar-brand">
                <div className="brand-icon">
                    <FileText size={28} color="white" />
                </div>
                <h2>IntelliDoc</h2>
            </div>

            <ul className="nav-list">
                {navItems.map((item) => (
                    <li key={item.path} className="nav-item">
                        <NavLink
                            to={item.path}
                            className={({ isActive }) =>
                                `nav-link ${isActive ? 'active' : ''}`
                            }
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-label">{item.label}</span>
                        </NavLink>
                    </li>
                ))}
            </ul>
        </nav>
    );
};

export default Navbar;

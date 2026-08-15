import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Boxes, Store, Users, User, LogOut } from "lucide-react";
import { useAuth } from "../auth/AuthContext";

export default function Layout({ children }: { children: ReactNode }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const linkClass = ({ isActive }: { isActive: boolean }) => `app-nav-link${isActive ? " active" : ""}`;

  return (
    <>
      <nav className="app-nav">
        <NavLink to="/store" className="app-nav-brand">
          <Boxes size={20} />
          SkillForge
        </NavLink>
        <div className="app-nav-links">
          <NavLink to="/store" className={linkClass}>
            <Store size={16} />
            Store
          </NavLink>
          <NavLink to="/teams" className={linkClass}>
            <Users size={16} />
            Équipes
          </NavLink>
          <NavLink to="/profile" className={linkClass}>
            <User size={16} />
            Profil
          </NavLink>
        </div>
        <button type="button" className="app-nav-logout" onClick={handleLogout}>
          <LogOut size={16} />
          Déconnexion
        </button>
      </nav>
      <main className="app-main">{children}</main>
    </>
  );
}

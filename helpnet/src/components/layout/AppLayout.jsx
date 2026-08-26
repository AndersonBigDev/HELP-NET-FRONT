import { LayoutGrid, LifeBuoy, LogOut, Ticket, Users } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

const linkClass = ({ isActive }) =>
  `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? "bg-accent-soft text-accent" : "text-text-muted hover:bg-surface-2 hover:text-text"
  }`;

// RNF01: menu lateral fixo. Esta é a fundação/placeholder do Módulo 1 —
// o Módulo 2 substitui o conteúdo de navegação da fila/dashboard aqui
// mantendo a mesma casca (largura, cabeçalho, área de usuário).
export function AppLayout() {
  const { user, logout } = useAuth();
  const isAtendimento = user?.perfil === "ATENDENTE" || user?.perfil === "ADMIN";

  return (
    <div className="flex min-h-svh bg-canvas">
      <aside className="flex w-64 shrink-0 flex-col border-r border-border-soft bg-surface px-3 py-4">
        <div className="mb-6 flex items-center gap-2 px-2">
          <LifeBuoy className="text-accent" size={22} />
          <span className="text-base font-semibold text-text">HelpNet</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {!isAtendimento && (
            <NavLink to="/meus-chamados" className={linkClass}>
              <Ticket size={18} />
              Meus Chamados
            </NavLink>
          )}
          {isAtendimento && (
            <NavLink to="/atendimento" className={linkClass}>
              <LayoutGrid size={18} />
              Atendimento
            </NavLink>
          )}
          {isAtendimento && (
            <NavLink to="/usuarios" className={linkClass}>
              <Users size={18} />
              Usuários
            </NavLink>
          )}
        </nav>

        <div className="border-t border-border-soft pt-3">
          <div className="mb-2 px-2">
            <p className="truncate text-sm font-medium text-text">{user?.nome}</p>
            <p className="truncate text-xs text-text-faint">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-surface-2 hover:text-danger cursor-pointer"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}

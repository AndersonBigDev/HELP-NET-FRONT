import { BarChart3, HardDrive, Inbox, LifeBuoy, LogOut, Ticket, Users } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { SeletorTema } from "../ui/SeletorTema";

const linkClass = ({ isActive }) =>
  `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? "bg-accent-soft text-accent" : "text-text-muted hover:bg-surface-2 hover:text-text"
  }`;

function SecaoNav({ titulo }) {
  return (
    <p className="mt-4 mb-1 px-3 text-[11px] font-semibold tracking-wider text-text-faint uppercase first:mt-0">
      {titulo}
    </p>
  );
}

// RNF01: menu lateral fixo, presente em todas as telas pós-login.
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

        <nav className="flex flex-1 flex-col gap-0.5">
          {!isAtendimento && (
            <>
              <NavLink to="/meus-chamados" className={linkClass}>
                <Ticket size={18} />
                Meus Chamados
              </NavLink>
              {/* GET /equipamentos é liberado para o perfil USUARIO, recortado pelo
                  setor dele — a tela entra como consulta, sem ações de gestão. */}
              <NavLink to="/equipamentos" className={linkClass}>
                <HardDrive size={18} />
                Equipamentos
              </NavLink>
            </>
          )}

          {isAtendimento && (
            <>
              <SecaoNav titulo="Atendimento" />
              {/* `end` para o link não continuar ativo dentro do detalhe do chamado. */}
              <NavLink to="/atendimento" end className={linkClass}>
                <Inbox size={18} />
                Filas de Atendimento
              </NavLink>
              <NavLink to="/atendimento/dashboard" className={linkClass}>
                <BarChart3 size={18} />
                Dashboard
              </NavLink>

              <SecaoNav titulo="Administração" />
              <NavLink to="/usuarios" className={linkClass}>
                <Users size={18} />
                Usuários
              </NavLink>
              <NavLink to="/equipamentos" className={linkClass}>
                <HardDrive size={18} />
                Equipamentos
              </NavLink>
              <NavLink to="/meus-chamados" className={linkClass}>
                <Ticket size={18} />
                Meus Chamados
              </NavLink>
            </>
          )}
        </nav>

        <div className="flex flex-col gap-3 border-t border-border-soft pt-3">
          <SeletorTema />

          <div className="border-t border-border-soft pt-3">
            <div className="mb-2 px-2">
              <p className="truncate text-sm font-medium text-text">{user?.nome}</p>
              <p className="truncate text-xs text-text-faint">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-surface-2 hover:text-danger"
            >
              <LogOut size={18} />
              Sair
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}

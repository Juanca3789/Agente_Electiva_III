import { Navigate, Route, Routes } from "react-router-dom";
import { NavTab } from "./components/NavButton";
import Dashboard from "./pages/Dashboard";
import Candidates from "./pages/Candidates";
import CandidateDetail from "./pages/CandidateDetail";
import Jobs from "./pages/Jobs";
import JobDetail from "./pages/JobDetail";

export default function App() {
  return (
    <div className="layout">
      <header className="header">
        <div>
          <h1>OferIA</h1>
          <p className="tagline">CV ↔ ofertas con JEV</p>
        </div>
        <nav className="header-nav">
          <NavTab to="/" end>
            Inicio
          </NavTab>
          <NavTab to="/candidatos">Candidatos</NavTab>
          <NavTab to="/ofertas">Ofertas</NavTab>
        </nav>
      </header>
      <main className="main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/candidatos" element={<Candidates />} />
          <Route path="/candidatos/:id" element={<CandidateDetail />} />
          <Route path="/ofertas" element={<Jobs />} />
          <Route path="/ofertas/:id" element={<JobDetail />} />
          <Route path="/candidates/*" element={<Navigate to="/candidatos" replace />} />
          <Route path="/jobs/*" element={<Navigate to="/ofertas" replace />} />
        </Routes>
      </main>
    </div>
  );
}

import { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
} from "firebase/firestore";

// Os dados agora vivem no Firestore (coleções "users" e "pacientes").

// ─── Styles — Paleta clínica médica (azul/branco) ────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', sans-serif; background: #F0F4FA; color: #1C2B3A; }

  /* ── Layout raiz ── */
  .app { min-height: 100vh; display: flex; flex-direction: column; }
  .app-shell { display: flex; flex: 1; min-height: 0; }

  /* ── Sidebar fixa ── */
  .sidebar {
    width: 240px; flex-shrink: 0;
    background: #1B4F8A;
    display: flex; flex-direction: column;
    position: fixed; top: 0; left: 0; bottom: 0;
    z-index: 200;
    box-shadow: 2px 0 12px rgba(27,79,138,0.18);
  }
  .sidebar-brand {
    padding: 28px 24px 20px;
    border-bottom: 1px solid rgba(255,255,255,0.1);
  }
  .sidebar-brand-name {
    font-size: 17px; font-weight: 700; color: #fff; letter-spacing: -0.3px;
  }
  .sidebar-brand-sub {
    font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 3px; font-weight: 400;
  }
  .sidebar-user {
    padding: 16px 24px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }
  .sidebar-user-name { font-size: 13px; font-weight: 600; color: #fff; }
  .sidebar-user-role {
    font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 2px;
    display: flex; align-items: center; gap: 5px;
  }
  .sidebar-role-dot {
    width: 6px; height: 6px; border-radius: 50%; background: #5BAAFF; flex-shrink: 0;
  }
  .sidebar-nav { flex: 1; padding: 16px 12px; display: flex; flex-direction: column; gap: 2px; }
  .sidebar-item {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 14px; border-radius: 8px;
    cursor: pointer; font-size: 14px; font-weight: 500;
    color: rgba(255,255,255,0.65);
    transition: background 0.15s, color 0.15s;
    border: none; background: none;
    font-family: 'Inter', sans-serif; width: 100%; text-align: left;
  }
  .sidebar-item:hover { background: rgba(255,255,255,0.1); color: #fff; }
  .sidebar-item.active { background: rgba(255,255,255,0.15); color: #fff; font-weight: 600; }
  .sidebar-item-icon { font-size: 16px; opacity: 0.9; width: 20px; text-align: center; }
  .sidebar-footer { padding: 16px 12px; border-top: 1px solid rgba(255,255,255,0.08); }
  .btn-logout {
    width: 100%; background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.15); color: rgba(255,255,255,0.7);
    border-radius: 8px; padding: 10px 14px; font-size: 13px;
    cursor: pointer; font-family: 'Inter', sans-serif; text-align: left;
    transition: background 0.15s;
  }
  .btn-logout:hover { background: rgba(255,255,255,0.14); color: #fff; }

  /* ── Área de conteúdo principal ── */
  .main-area { margin-left: 240px; flex: 1; display: flex; flex-direction: column; min-height: 100vh; }
  .topbar {
    background: #fff; border-bottom: 1px solid #DDE4EE;
    padding: 0 32px; height: 56px;
    display: flex; align-items: center; justify-content: space-between;
    position: sticky; top: 0; z-index: 100;
  }
  .topbar-title { font-size: 15px; font-weight: 600; color: #1B4F8A; }
  .topbar-badge {
    background: #EBF2FF; color: #1B4F8A;
    border-radius: 20px; padding: 4px 12px;
    font-size: 12px; font-weight: 600;
  }
  .main-content { flex: 1; padding: 32px; overflow-y: auto; }

  /* ── Tela de Login ── */
  .login-wrap {
    min-height: 100vh; display: flex;
    background: linear-gradient(135deg, #1B4F8A 0%, #2E6DB4 100%);
  }
  .login-left {
    flex: 1; display: flex; align-items: center; justify-content: center;
    padding: 60px; display: none;
  }
  .login-right {
    width: 100%; max-width: 480px;
    background: #fff; display: flex; align-items: center; justify-content: center;
    padding: 48px 40px; margin: auto;
    border-radius: 16px; box-shadow: 0 8px 48px rgba(0,0,0,0.18);
  }
  .login-inner { width: 100%; }
  .login-icon {
    width: 56px; height: 56px;
    background: #1B4F8A; color: #fff;
    border-radius: 12px; display: flex; align-items: center; justify-content: center;
    font-size: 22px; font-weight: 700; margin: 0 auto 20px;
  }
  .login-title { font-size: 22px; font-weight: 700; color: #1B4F8A; text-align: center; margin-bottom: 6px; }
  .login-sub { font-size: 13px; color: #6B7B8E; text-align: center; margin-bottom: 28px; line-height: 1.5; }

  /* ── Formulários ── */
  .field-group { margin-bottom: 16px; }
  .field-label { display: block; font-size: 13px; font-weight: 600; color: #3A4A5C; margin-bottom: 6px; }
  .field-input {
    width: 100%; border: 1.5px solid #DDE4EE; border-radius: 8px;
    padding: 10px 14px; font-size: 14px;
    font-family: 'Inter', sans-serif; color: #1C2B3A;
    background: #F8FAFF; outline: none; transition: border-color 0.15s;
  }
  .field-input:focus { border-color: #1B4F8A; background: #fff; }
  .field-textarea {
    width: 100%; border: 1.5px solid #DDE4EE; border-radius: 8px;
    padding: 10px 14px; font-size: 14px;
    font-family: 'Inter', sans-serif; color: #1C2B3A;
    background: #F8FAFF; outline: none; resize: vertical;
    min-height: 80px; line-height: 1.55;
  }
  .field-textarea:focus { border-color: #1B4F8A; background: #fff; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }

  /* ── Botões ── */
  .btn-primary {
    background: #1B4F8A; color: #fff; border: none;
    border-radius: 8px; padding: 12px 28px;
    font-size: 14px; font-weight: 600;
    font-family: 'Inter', sans-serif; cursor: pointer;
    width: 100%; transition: background 0.2s;
  }
  .btn-primary:hover { background: #163f6e; }
  .btn-secondary {
    background: #fff; color: #1B4F8A;
    border: 1.5px solid #C0D4F0; border-radius: 8px;
    padding: 10px 20px; font-size: 14px; font-weight: 600;
    font-family: 'Inter', sans-serif; cursor: pointer; transition: all 0.2s;
  }
  .btn-secondary:hover { background: #EBF2FF; }
  .btn-danger {
    background: #FEF0EF; color: #D04848;
    border: 1.5px solid #D04848; border-radius: 8px;
    padding: 10px 20px; font-size: 14px; font-weight: 600;
    font-family: 'Inter', sans-serif; cursor: pointer;
  }
  .link-btn {
    background: none; border: none; color: #1B4F8A;
    font-size: 14px; font-weight: 600; cursor: pointer;
    font-family: 'Inter', sans-serif; text-decoration: underline;
  }
  .back-btn {
    display: flex; align-items: center; gap: 6px;
    font-size: 14px; color: #1B4F8A; font-weight: 600;
    cursor: pointer; margin-bottom: 20px;
    background: none; border: none; font-family: 'Inter', sans-serif;
  }

  /* ── Feedback ── */
  .login-error { background: #FEF0EF; color: #D04848; border-radius: 8px; padding: 10px 14px; font-size: 13px; margin-bottom: 14px; text-align: center; }
  .login-success { background: #EBF2FF; color: #1B4F8A; border-radius: 8px; padding: 10px 14px; font-size: 13px; margin-bottom: 14px; text-align: center; font-weight: 600; }
  .success-msg { background: #EBF2FF; color: #1B4F8A; border-radius: 8px; padding: 10px 14px; font-size: 13px; font-weight: 600; margin-bottom: 16px; }

  /* ── Abas de papel (Login) ── */
  .role-tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 24px; }
  .role-tab {
    padding: 11px; border: 1.5px solid #DDE4EE; border-radius: 8px;
    cursor: pointer; text-align: center; transition: all 0.15s;
    background: #F8FAFF; font-size: 13px; font-weight: 600;
    color: #6B7B8E; font-family: 'Inter', sans-serif;
  }
  .role-tab.active { border-color: #1B4F8A; background: #EBF2FF; color: #1B4F8A; }
  .divider { display: flex; align-items: center; gap: 12px; margin: 18px 0; }
  .divider-line { flex: 1; height: 1px; background: #DDE4EE; }
  .divider-text { font-size: 12px; color: #9AAABF; }

  /* ── Cards e layout de conteúdo ── */
  .page-title { font-size: 22px; font-weight: 700; color: #1B4F8A; margin-bottom: 24px; }
  .card { background: #fff; border-radius: 12px; padding: 24px; border: 1px solid #DDE4EE; margin-bottom: 20px; }
  .card-title { font-size: 15px; font-weight: 700; color: #1B4F8A; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
  .stat-card { background: #fff; border-radius: 12px; padding: 20px; border: 1px solid #DDE4EE; }
  .stat-value { font-size: 26px; font-weight: 700; color: #1B4F8A; }
  .stat-label { font-size: 13px; color: #6B7B8E; margin-top: 4px; }
  .stat-accent { display: inline-block; width: 32px; height: 3px; background: #1B4F8A; border-radius: 2px; margin-bottom: 10px; }

  /* ── Consultas ── */
  .consulta-item { display: flex; align-items: center; gap: 14px; padding: 14px; border: 1px solid #DDE4EE; border-radius: 10px; margin-bottom: 10px; }
  .consulta-data { background: #EBF2FF; border-radius: 8px; padding: 8px 12px; text-align: center; min-width: 58px; }
  .consulta-dia { font-size: 20px; font-weight: 700; color: #1B4F8A; line-height: 1; }
  .consulta-mes { font-size: 11px; color: #2E6DB4; font-weight: 600; }
  .consulta-info { flex: 1; }
  .consulta-tipo { font-size: 14px; font-weight: 600; color: #1C2B3A; }
  .consulta-hora { font-size: 13px; color: #6B7B8E; }

  /* ── Badges ── */
  .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
  .badge-blue { background: #EBF2FF; color: #1B4F8A; }
  .badge-green { background: #E6F7EE; color: #1A7A45; }
  .badge-rose { background: #FEF0EF; color: #D04848; }

  /* ── Plano alimentar ── */
  .refeicao-card { border: 1px solid #DDE4EE; border-left: 3px solid #1B4F8A; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
  .refeicao-nome { font-size: 14px; font-weight: 700; color: #1B4F8A; margin-bottom: 10px; }
  .refeicao-item { display: flex; align-items: center; gap: 8px; font-size: 14px; color: #3A4A5C; margin-bottom: 6px; }
  .refeicao-dot { width: 5px; height: 5px; border-radius: 50%; background: #2E6DB4; flex-shrink: 0; }
  .obs-box { background: #EBF2FF; border-radius: 8px; padding: 14px; font-size: 13px; color: #1B4F8A; line-height: 1.6; }

  /* ── Gráfico de peso ── */
  .peso-chart { display: flex; align-items: flex-end; gap: 8px; height: 100px; padding: 0 4px; }
  .peso-bar-wrap { display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 1; }
  .peso-bar { width: 100%; border-radius: 4px 4px 0 0; background: linear-gradient(180deg, #5BAAFF, #1B4F8A); min-height: 4px; }
  .peso-label { font-size: 10px; color: #9AAABF; }
  .peso-val { font-size: 11px; font-weight: 600; color: #1B4F8A; }

  /* ── Receitas ── */
  .receita-card { border: 1px solid #DDE4EE; border-radius: 10px; padding: 18px; margin-bottom: 12px; }
  .receita-titulo { font-size: 15px; font-weight: 700; color: #1C2B3A; margin-bottom: 4px; }
  .receita-tempo { font-size: 12px; color: #9AAABF; margin-bottom: 12px; }
  .receita-section { font-size: 11px; font-weight: 700; color: #1B4F8A; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 6px; margin-top: 10px; }

  /* ── Pacientes ── */
  .paciente-row { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border: 1px solid #DDE4EE; border-radius: 10px; margin-bottom: 10px; cursor: pointer; transition: all 0.15s; }
  .paciente-row:hover { border-color: #1B4F8A; background: #F8FAFF; }
  .paciente-avatar { width: 40px; height: 40px; border-radius: 50%; background: #EBF2FF; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 700; color: #1B4F8A; flex-shrink: 0; }
  .paciente-nome { font-size: 14px; font-weight: 600; color: #1C2B3A; }
  .paciente-info { font-size: 13px; color: #6B7B8E; }

  /* ── Agenda ── */
  .agenda-form { display: grid; grid-template-columns: 1fr 1fr 1fr auto; gap: 12px; align-items: end; margin-bottom: 20px; }
  .section-divider { font-size: 11px; font-weight: 700; color: #1B4F8A; text-transform: uppercase; letter-spacing: 0.6px; margin: 20px 0 12px; padding-bottom: 8px; border-bottom: 1px solid #DDE4EE; }

  /* ── Responsive ── */
  @media (max-width: 768px) {
    .sidebar { width: 64px; }
    .sidebar-brand, .sidebar-user, .sidebar-brand-sub { display: none; }
    .sidebar-item span { display: none; }
    .sidebar-item { justify-content: center; padding: 12px; }
    .main-area { margin-left: 64px; }
    .main-content { padding: 20px 16px; }
    .grid-2, .grid-3 { grid-template-columns: 1fr; }
    .agenda-form { grid-template-columns: 1fr 1fr; }
  }
`;

// ─── Weight chart ─────────────────────────────────────────────────────────────
function PesoChart({ dados }) {
  if (!dados?.length) return <p style={{ color: "#6B7B8E", fontSize: 14 }}>Nenhum dado de peso registrado.</p>;
  const max = Math.max(...dados.map(d => d.valor));
  const min = Math.min(...dados.map(d => d.valor));
  const range = max - min || 1;
  return (
    <div className="peso-chart">
      {dados.map((d, i) => {
        const h = ((d.valor - min) / range) * 70 + 20;
        return (
          <div className="peso-bar-wrap" key={i}>
            <div className="peso-val">{d.valor}</div>
            <div className="peso-bar" style={{ height: h }} />
            <div className="peso-label">{d.data}</div>
          </div>
        );
      })}
    </div>
  );
}

const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
function mesLabel(dataStr) { return MESES[parseInt(dataStr.split("/")[1]) - 1] || ""; }

// ─── LOGIN / CADASTRO ─────────────────────────────────────────────────────────
function Login({ onLogin, users, onCadastro }) {
  const [tela, setTela] = useState("login"); // login | cadastro-paciente | cadastro-nutri
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  // Cadastro paciente
  const [cpNome, setCpNome] = useState("");
  const [cpEmail, setCpEmail] = useState("");
  const [cpTelefone, setCpTelefone] = useState("");
  const [cpSenha, setCpSenha] = useState("");
  const [cpSenha2, setCpSenha2] = useState("");

  // Cadastro nutricionista
  const [cnNome, setCnNome] = useState("");
  const [cnEmail, setCnEmail] = useState("");
  const [cnCrn, setCnCrn] = useState("");
  const [cnTelefone, setCnTelefone] = useState("");
  const [cnSenha, setCnSenha] = useState("");
  const [cnSenha2, setCnSenha2] = useState("");
  const [cnEspecialidade, setCnEspecialidade] = useState("");

  const [sucesso, setSucesso] = useState("");

  const handleLogin = () => {
    const user = users.find(u => u.email === email && u.senha === senha);
    if (user) { setErro(""); onLogin(user); }
    else setErro("E-mail ou senha incorretos.");
  };

  const handleCadastroPaciente = () => {
    if (!cpNome || !cpEmail || !cpSenha) { setErro("Preencha todos os campos obrigatórios."); return; }
    if (cpSenha !== cpSenha2) { setErro("As senhas não coincidem."); return; }
    if (users.find(u => u.email === cpEmail)) { setErro("E-mail já cadastrado."); return; }
    onCadastro({ nome: cpNome, email: cpEmail, telefone: cpTelefone, senha: cpSenha, role: "paciente" });
    setSucesso("Cadastro realizado! Faça login para acessar.");
    setTela("login");
    setEmail("");
    setSenha("");
    setErro("");
  };

  const handleCadastroNutri = () => {
    if (!cnNome || !cnEmail || !cnCrn || !cnSenha) { setErro("Preencha todos os campos obrigatórios."); return; }
    if (cnSenha !== cnSenha2) { setErro("As senhas não coincidem."); return; }
    if (users.find(u => u.email === cnEmail)) { setErro("E-mail já cadastrado."); return; }
    onCadastro({ nome: cnNome, email: cnEmail, crn: cnCrn, telefone: cnTelefone, especialidade: cnEspecialidade, senha: cnSenha, role: "nutricionista" });
    setSucesso("Cadastro realizado! Faça login para acessar.");
    setTela("login");
    setEmail("");
    setSenha("");
    setErro("");
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-icon">N</div>
        <h1 className="login-title">Portal Nutricional</h1>

        {tela === "login" && (
          <>
            <p className="login-sub">
              Plataforma profissional de acompanhamento nutricional
            </p>
            {sucesso && <div className="login-success">✅ {sucesso}</div>}
            {erro && <div className="login-error">{erro}</div>}
            <div className="field-group">
              <label className="field-label">E-mail</label>
              <input className="field-input" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="field-group">
              <label className="field-label">Senha</label>
              <input className="field-input" type="password" placeholder="••••••••" value={senha} onChange={e => setSenha(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} />
            </div>
            <button className="btn-primary" onClick={handleLogin}>Entrar</button>
            <div className="divider"><div className="divider-line" /><span className="divider-text">Ainda não tem conta?</span><div className="divider-line" /></div>
            <div className="grid-2" style={{ gap: 10 }}>
              <button className="btn-secondary" onClick={() => { setTela("cadastro-paciente"); setErro(""); setSucesso(""); }}>👤 Sou Paciente</button>
              <button className="btn-secondary" onClick={() => { setTela("cadastro-nutri"); setErro(""); setSucesso(""); }}>🥗 Sou Nutricionista</button>
            </div>
          </>
        )}

        {tela === "cadastro-paciente" && (
          <>
            <p className="login-sub">Cadastro de Paciente</p>
            {erro && <div className="login-error">{erro}</div>}
            <div className="field-group">
              <label className="field-label">Nome completo *</label>
              <input className="field-input" placeholder="Seu nome completo" value={cpNome} onChange={e => setCpNome(e.target.value)} />
            </div>
            <div className="field-group">
              <label className="field-label">E-mail *</label>
              <input className="field-input" type="email" placeholder="seu@email.com" value={cpEmail} onChange={e => setCpEmail(e.target.value)} />
            </div>
            <div className="field-group">
              <label className="field-label">Telefone</label>
              <input className="field-input" type="tel" placeholder="(00) 00000-0000" value={cpTelefone} onChange={e => setCpTelefone(e.target.value)} />
            </div>
            <div className="field-group">
              <label className="field-label">Senha *</label>
              <input className="field-input" type="password" placeholder="Mínimo 6 caracteres" value={cpSenha} onChange={e => setCpSenha(e.target.value)} />
            </div>
            <div className="field-group">
              <label className="field-label">Confirmar senha *</label>
              <input className="field-input" type="password" placeholder="Repita a senha" value={cpSenha2} onChange={e => setCpSenha2(e.target.value)} />
            </div>
            <button className="btn-primary" onClick={handleCadastroPaciente}>Criar conta</button>
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <button className="link-btn" onClick={() => { setTela("login"); setErro(""); }}>← Voltar ao login</button>
            </div>
          </>
        )}

        {tela === "cadastro-nutri" && (
          <>
            <p className="login-sub">Cadastro de Nutricionista</p>
            {erro && <div className="login-error">{erro}</div>}
            <div className="field-group">
              <label className="field-label">Nome completo *</label>
              <input className="field-input" placeholder="Ex: Dra. Ana Paula" value={cnNome} onChange={e => setCnNome(e.target.value)} />
            </div>
            <div className="field-group">
              <label className="field-label">CRN *</label>
              <input className="field-input" placeholder="Ex: CRN-3 12345" value={cnCrn} onChange={e => setCnCrn(e.target.value)} />
            </div>
            <div className="field-group">
              <label className="field-label">Especialidade</label>
              <input className="field-input" placeholder="Ex: Nutrição esportiva" value={cnEspecialidade} onChange={e => setCnEspecialidade(e.target.value)} />
            </div>
            <div className="field-group">
              <label className="field-label">E-mail *</label>
              <input className="field-input" type="email" placeholder="seu@email.com" value={cnEmail} onChange={e => setCnEmail(e.target.value)} />
            </div>
            <div className="field-group">
              <label className="field-label">Telefone</label>
              <input className="field-input" type="tel" placeholder="(00) 00000-0000" value={cnTelefone} onChange={e => setCnTelefone(e.target.value)} />
            </div>
            <div className="field-group">
              <label className="field-label">Senha *</label>
              <input className="field-input" type="password" placeholder="Mínimo 6 caracteres" value={cnSenha} onChange={e => setCnSenha(e.target.value)} />
            </div>
            <div className="field-group">
              <label className="field-label">Confirmar senha *</label>
              <input className="field-input" type="password" placeholder="Repita a senha" value={cnSenha2} onChange={e => setCnSenha2(e.target.value)} />
            </div>
            <button className="btn-primary" onClick={handleCadastroNutri}>Criar conta</button>
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <button className="link-btn" onClick={() => { setTela("login"); setErro(""); }}>← Voltar ao login</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── PACIENTE DASHBOARD ───────────────────────────────────────────────────────
function PacienteDashboard({ user, pacientes, onLogout }) {
  const [aba, setAba] = useState("inicio");
  const pac = pacientes.find(p => p.userId === user.id);
  const ultimoPeso = pac?.peso?.at(-1)?.valor;
  const proximaConsulta = pac?.consultas?.[0];

  const anamneseVazia = { objetivo: "", pesoAtual: "", altura: "", fezDieta: "", possuiDoenca: "", alergias: "", medicamentos: "", atividadeFisica: "" };
  const [anamneseEdit, setAnamneseEdit] = useState(pac?.anamnese ? { ...anamneseVazia, ...pac.anamnese } : anamneseVazia);
  const [anamneseSaved, setAnamneseSaved] = useState(false);

  const salvarAnamnese = async () => {
    if (!pac) return;
    await updateDoc(doc(db, "pacientes", pac.id), { anamnese: anamneseEdit });
    setAnamneseSaved(true);
    setTimeout(() => setAnamneseSaved(false), 3000);
  };

  const menu = [
    { id: "inicio", icon: "🏠", label: "Início" },
    { id: "anamnese", icon: "📋", label: "Anamnese" },
    { id: "plano", icon: "🥗", label: "Meu Plano" },
    { id: "peso", icon: "⚖️", label: "Evolução" },
    { id: "consultas", icon: "📅", label: "Consultas" },
    { id: "receitas", icon: "👩‍🍳", label: "Receitas" },
  ];

  const abaAtual = menu.find(m => m.id === aba)?.label || "Portal Nutricional";
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-name">Portal Nutricional</div>
          <div className="sidebar-brand-sub">Acompanhamento</div>
        </div>
        <div className="sidebar-user">
          <div className="sidebar-user-name">{user.nome.split(" ")[0]}</div>
          <div className="sidebar-user-role"><span className="sidebar-role-dot" />Paciente</div>
        </div>
        <nav className="sidebar-nav">
          {menu.map(m => (
            <button key={m.id} className={`sidebar-item${aba === m.id ? " active" : ""}`} onClick={() => setAba(m.id)}>
              <span className="sidebar-item-icon">{m.icon}</span><span>{m.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="btn-logout" onClick={onLogout}>Sair</button>
        </div>
      </aside>
      <div className="main-area">
        <div className="topbar">
          <span className="topbar-title">{abaAtual}</span>
          <span className="topbar-badge">Paciente</span>
        </div>
        <div className="main-content">
        {aba === "inicio" && (
          <>
            <h1 className="page-title">Olá, {user.nome.split(" ")[0]}! 👋</h1>
            <div className="grid-3">
              <div className="stat-card"><div className="stat-value">{ultimoPeso ? `${ultimoPeso} kg` : "—"}</div><div className="stat-label">⚖️ Peso atual</div></div>
              <div className="stat-card"><div className="stat-value">{pac?.consultas?.length || 0}</div><div className="stat-label">📅 Próximas consultas</div></div>
              <div className="stat-card"><div className="stat-value">{pac?.receitas?.length || 0}</div><div className="stat-label">👩‍🍳 Receitas</div></div>
            </div>
            {proximaConsulta && (
              <div className="card">
                <div className="card-title">📅 Próxima consulta</div>
                <div className="consulta-item">
                  <div className="consulta-data"><div className="consulta-dia">{proximaConsulta.data.split("/")[0]}</div><div className="consulta-mes">{mesLabel(proximaConsulta.data)}</div></div>
                  <div className="consulta-info"><div className="consulta-tipo">{proximaConsulta.tipo}</div><div className="consulta-hora">🕐 {proximaConsulta.hora}</div></div>
                  <span className="badge badge-green">Confirmada</span>
                </div>
              </div>
            )}
            {pac?.planoAlimentar && (
              <div className="card">
                <div className="card-title">🥗 Resumo do plano</div>
                <p style={{ fontSize: 14, color: "#6B7B8E", marginBottom: 8 }}>Objetivo: <strong>{pac.planoAlimentar.objetivo}</strong></p>
                <p style={{ fontSize: 14, color: "#6B7B8E" }}>Calorias: <strong>{pac.planoAlimentar.calorias}</strong></p>
              </div>
            )}
            {!pac && <div className="card"><p style={{ color: "#6B7B8E" }}>Seu cadastro está sendo configurado. Em breve a nutricionista irá adicionar suas informações.</p></div>}
          </>
        )}
        {aba === "anamnese" && (
          <>
            <h1 className="page-title">📋 Anamnese</h1>
            <div className="card">
              {anamneseSaved && <div className="success-msg">✅ Anamnese salva com sucesso!</div>}
              <div className="field-group">
                <label className="field-label">Objetivo</label>
                <input className="field-input" value={anamneseEdit.objetivo} onChange={e => setAnamneseEdit(a => ({ ...a, objetivo: e.target.value }))} placeholder="Ex: Emagrecimento, ganho de massa..." />
              </div>
              <div className="grid-2">
                <div className="field-group">
                  <label className="field-label">Peso atual (kg)</label>
                  <input className="field-input" value={anamneseEdit.pesoAtual} onChange={e => setAnamneseEdit(a => ({ ...a, pesoAtual: e.target.value }))} placeholder="Ex: 70" />
                </div>
                <div className="field-group">
                  <label className="field-label">Altura (cm)</label>
                  <input className="field-input" value={anamneseEdit.altura} onChange={e => setAnamneseEdit(a => ({ ...a, altura: e.target.value }))} placeholder="Ex: 170" />
                </div>
              </div>
              <div className="grid-2">
                <div className="field-group">
                  <label className="field-label">Já fez dieta antes?</label>
                  <select className="field-input" value={anamneseEdit.fezDieta} onChange={e => setAnamneseEdit(a => ({ ...a, fezDieta: e.target.value }))}>
                    <option value="">Selecione</option>
                    <option>Sim</option>
                    <option>Não</option>
                  </select>
                </div>
                <div className="field-group">
                  <label className="field-label">Possui alguma doença?</label>
                  <select className="field-input" value={anamneseEdit.possuiDoenca} onChange={e => setAnamneseEdit(a => ({ ...a, possuiDoenca: e.target.value }))}>
                    <option value="">Selecione</option>
                    <option>Sim</option>
                    <option>Não</option>
                  </select>
                </div>
              </div>
              <div className="field-group">
                <label className="field-label">Possui alergias ou intolerâncias alimentares?</label>
                <textarea className="field-textarea" value={anamneseEdit.alergias} onChange={e => setAnamneseEdit(a => ({ ...a, alergias: e.target.value }))} placeholder="Ex: Intolerância a lactose, alergia a frutos do mar..." />
              </div>
              <div className="field-group">
                <label className="field-label">Faz uso de algum medicamento?</label>
                <textarea className="field-textarea" value={anamneseEdit.medicamentos} onChange={e => setAnamneseEdit(a => ({ ...a, medicamentos: e.target.value }))} placeholder="Ex: Nenhum, ou liste os medicamentos" />
              </div>
              <div className="field-group">
                <label className="field-label">Nível de atividade física</label>
                <select className="field-input" value={anamneseEdit.atividadeFisica} onChange={e => setAnamneseEdit(a => ({ ...a, atividadeFisica: e.target.value }))}>
                  <option value="">Selecione</option>
                  <option>Sedentário</option>
                  <option>Leve (1-2x por semana)</option>
                  <option>Moderado (3-4x por semana)</option>
                  <option>Intenso (5+ por semana)</option>
                </select>
              </div>
              <button className="btn-primary" onClick={salvarAnamnese}>💾 Salvar anamnese</button>
            </div>
          </>
        )}
        {aba === "plano" && (
          <>
            <h1 className="page-title">🥗 Meu Plano Alimentar</h1>
            {pac?.planoAlimentar ? (
              <div className="card">
                <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                  <span className="badge badge-green">Objetivo: {pac.planoAlimentar.objetivo}</span>
                  <span className="badge badge-blue">{pac.planoAlimentar.calorias}</span>
                </div>
                {pac.planoAlimentar.refeicoes.map((r, i) => (
                  <div className="refeicao-card" key={i}>
                    <div className="refeicao-nome">🍽️ {r.nome}</div>
                    {r.itens.map((item, j) => <div className="refeicao-item" key={j}><div className="refeicao-dot" />{item}</div>)}
                  </div>
                ))}
                {pac.planoAlimentar.observacoes && <div className="obs-box">💡 {pac.planoAlimentar.observacoes}</div>}
              </div>
            ) : <div className="card"><p style={{ color: "#6B7B8E" }}>Seu plano alimentar ainda não foi cadastrado.</p></div>}
          </>
        )}
        {aba === "peso" && (
          <>
            <h1 className="page-title">⚖️ Evolução de Peso</h1>
            <div className="card">
              <div className="card-title">Histórico</div>
              <PesoChart dados={pac?.peso || []} />
              {pac?.peso && [...pac.peso].reverse().map((p, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #DDE4EE", fontSize: 14 }}>
                  <span style={{ color: "#6B7B8E" }}>{p.data}</span>
                  <span style={{ fontWeight: 700, color: "#1B4F8A" }}>{p.valor} kg</span>
                </div>
              ))}
            </div>
          </>
        )}
        {aba === "consultas" && (
          <>
            <h1 className="page-title">📅 Minhas Consultas</h1>
            <div className="card">
              {pac?.consultas?.length ? pac.consultas.map((c, i) => (
                <div className="consulta-item" key={i}>
                  <div className="consulta-data"><div className="consulta-dia">{c.data.split("/")[0]}</div><div className="consulta-mes">{mesLabel(c.data)}</div></div>
                  <div className="consulta-info"><div className="consulta-tipo">{c.tipo}</div><div className="consulta-hora">🕐 {c.hora}</div></div>
                  <span className="badge badge-green">Confirmada</span>
                </div>
              )) : <p style={{ color: "#6B7B8E" }}>Nenhuma consulta agendada.</p>}
            </div>
          </>
        )}
        {aba === "receitas" && (
          <>
            <h1 className="page-title">👩‍🍳 Receitas</h1>
            {pac?.receitas?.length ? pac.receitas.map((r, i) => (
              <div className="receita-card" key={i}>
                <div className="receita-titulo">{r.titulo}</div>
                <div className="receita-tempo">⏱️ {r.tempo}</div>
                <div className="receita-section">Ingredientes</div>
                {r.ingredientes.map((ing, j) => <div className="refeicao-item" key={j}><div className="refeicao-dot" />{ing}</div>)}
                <div className="receita-section">Modo de preparo</div>
                <p style={{ fontSize: 14, color: "#3A4A5C", lineHeight: 1.6 }}>{r.preparo}</p>
              </div>
            )) : <div className="card"><p style={{ color: "#6B7B8E" }}>Nenhuma receita disponível ainda.</p></div>}
          </>
        )}
        </div>
      </div>
    </div>
  );
}

// ─── NUTRICIONISTA DASHBOARD ──────────────────────────────────────────────────
function NutricionistaDashboard({ user, pacientes, onLogout }) {
  const [aba, setAba] = useState("inicio");
  const [pacSelecionado, setPacSelecionado] = useState(null);
  const [subAba, setSubAba] = useState("anamnese");
  const [planoEdit, setPlanoEdit] = useState(null);
  const [saved, setSaved] = useState(false);
  const [novaConsulta, setNovaConsulta] = useState({ data: "", hora: "", tipo: "Retorno" });

  const menu = [
    { id: "inicio", icon: "🏠", label: "Início" },
    { id: "pacientes", icon: "👥", label: "Pacientes" },
    { id: "agenda", icon: "📅", label: "Agenda" },
    { id: "perfil", icon: "👤", label: "Meu Perfil" },
  ];

  const abrirPaciente = (pac) => {
    setPacSelecionado(pac);
    setSubAba("anamnese");
    setPlanoEdit(pac.planoAlimentar ? { ...pac.planoAlimentar } : { objetivo: "", calorias: "", refeicoes: [{ nome: "Café da manhã", itens: [""] }], observacoes: "" });
    setSaved(false);
    setAba("paciente-detalhe");
  };

  const salvarPlano = async () => {
    if (!pacSelecionado) return;
    await updateDoc(doc(db, "pacientes", pacSelecionado.id), { planoAlimentar: planoEdit });
    setSaved(true); setTimeout(() => setSaved(false), 3000);
  };

  const adicionarConsulta = async (pacId) => {
    if (!novaConsulta.data || !novaConsulta.hora) return;
    const [ano, mes, dia] = novaConsulta.data.split("-");
    const pacAtual = pacientes.find(p => p.id === pacId);
    if (!pacAtual) return;
    await updateDoc(doc(db, "pacientes", pacId), {
      consultas: [...pacAtual.consultas, { ...novaConsulta, data: `${dia}/${mes}/${ano}` }],
    });
    setNovaConsulta({ data: "", hora: "", tipo: "Retorno" });
  };

  const todasConsultas = pacientes.flatMap(p => p.consultas.map(c => ({ ...c, paciente: p.nome })));

  const abaLabel = aba === "paciente-detalhe" ? "Pacientes" : (menu.find(m => m.id === aba)?.label || "");
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-name">Portal Nutricional</div>
          <div className="sidebar-brand-sub">Gestão Clínica</div>
        </div>
        <div className="sidebar-user">
          <div className="sidebar-user-name">{user.nome.split(" ")[0]}</div>
          <div className="sidebar-user-role"><span className="sidebar-role-dot" />Nutricionista</div>
        </div>
        <nav className="sidebar-nav">
          {menu.map(m => (
            <button key={m.id} className={`sidebar-item${(aba === m.id || (aba === "paciente-detalhe" && m.id === "pacientes")) ? " active" : ""}`}
              onClick={() => { setAba(m.id); setPacSelecionado(null); }}>
              <span className="sidebar-item-icon">{m.icon}</span><span>{m.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="btn-logout" onClick={onLogout}>Sair</button>
        </div>
      </aside>
      <div className="main-area">
        <div className="topbar">
          <span className="topbar-title">{abaLabel}</span>
          <span className="topbar-badge">Nutricionista</span>
        </div>
        <div className="main-content">
        {aba === "inicio" && (
          <>
            <h1 className="page-title">Olá, {user.nome}!</h1>
            <div className="grid-3">
              <div className="stat-card"><div className="stat-value">{pacientes.length}</div><div className="stat-label">👥 Pacientes ativos</div></div>
              <div className="stat-card"><div className="stat-value">{todasConsultas.length}</div><div className="stat-label">📅 Consultas agendadas</div></div>
              <div className="stat-card"><div className="stat-value">{pacientes.filter(p => p.planoAlimentar).length}</div><div className="stat-label">🥗 Planos enviados</div></div>
            </div>
            <div className="card">
              <div className="card-title">👥 Pacientes recentes</div>
              {pacientes.map(p => (
                <div className="paciente-row" key={p.id} onClick={() => abrirPaciente(p)}>
                  <div className="paciente-avatar">{p.nome[0]}</div>
                  <div style={{ flex: 1 }}>
                    <div className="paciente-nome">{p.nome}</div>
                    <div className="paciente-info">Objetivo: {p.anamnese?.objetivo}</div>
                  </div>
                  <span className={`badge ${p.planoAlimentar ? "badge-green" : "badge-rose"}`}>{p.planoAlimentar ? "Plano enviado" : "Sem plano"}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {aba === "pacientes" && !pacSelecionado && (
          <>
            <h1 className="page-title">👥 Pacientes</h1>
            {pacientes.map(p => (
              <div className="paciente-row" key={p.id} onClick={() => abrirPaciente(p)}>
                <div className="paciente-avatar">{p.nome[0]}</div>
                <div style={{ flex: 1 }}>
                  <div className="paciente-nome">{p.nome}</div>
                  <div className="paciente-info">{p.email} · Objetivo: {p.anamnese?.objetivo}</div>
                </div>
                <span className={`badge ${p.planoAlimentar ? "badge-green" : "badge-rose"}`}>{p.planoAlimentar ? "Plano enviado" : "Sem plano"}</span>
              </div>
            ))}
          </>
        )}

        {aba === "paciente-detalhe" && pacSelecionado && (() => {
          const pac = pacientes.find(p => p.id === pacSelecionado.id);
          return (
            <>
              <button className="back-btn" onClick={() => { setAba("pacientes"); setPacSelecionado(null); }}>← Voltar</button>
              <h1 className="page-title">{pac.nome}</h1>
              <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
                {["anamnese", "plano", "peso", "consultas"].map(s => (
                  <button key={s} className={subAba === s ? "btn-primary" : "btn-secondary"}
                    style={{ width: "auto", padding: "8px 18px", fontSize: 13 }} onClick={() => setSubAba(s)}>
                    {{ anamnese: "📋 Anamnese", plano: "🥗 Plano", peso: "⚖️ Evolução", consultas: "📅 Consultas" }[s]}
                  </button>
                ))}
              </div>
              {subAba === "anamnese" && (
                <div className="card">
                  <div className="card-title">📋 Respostas da Anamnese</div>
                  {pac.anamnese ? Object.entries({
                    objetivo: "Objetivo", pesoAtual: "Peso atual (kg)", altura: "Altura (cm)",
                    fezDieta: "Já fez dieta antes", possuiDoenca: "Possui doença",
                    alergias: "Alergias/intolerâncias", medicamentos: "Medicamentos em uso",
                    atividadeFisica: "Atividade física",
                  }).map(([k, label]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #DDE4EE", fontSize: 14, gap: 16 }}>
                      <span style={{ color: "#6B7B8E", flexShrink: 0 }}>{label}</span>
                      <span style={{ fontWeight: 600, textAlign: "right" }}>{pac.anamnese[k] || "—"}</span>
                    </div>
                  )) : <p style={{ color: "#6B7B8E" }}>Anamnese não preenchida.</p>}
                </div>
              )}
              {subAba === "plano" && (
                <div className="card">
                  <div className="card-title">🥗 Plano Alimentar</div>
                  {saved && <div className="success-msg">✅ Plano salvo com sucesso!</div>}
                  <div className="field-group"><label className="field-label">Objetivo</label><input className="field-input" value={planoEdit?.objetivo || ""} onChange={e => setPlanoEdit(p => ({ ...p, objetivo: e.target.value }))} placeholder="Ex: Emagrecimento saudável" /></div>
                  <div className="field-group"><label className="field-label">Calorias/dia</label><input className="field-input" value={planoEdit?.calorias || ""} onChange={e => setPlanoEdit(p => ({ ...p, calorias: e.target.value }))} placeholder="Ex: 1600 kcal/dia" /></div>
                  {planoEdit?.refeicoes?.map((r, i) => (
                    <div key={i} style={{ border: "1.5px solid #DDE4EE", borderRadius: 12, padding: 16, marginBottom: 12 }}>
                      <div className="field-group"><label className="field-label">Nome da refeição</label><input className="field-input" value={r.nome} onChange={e => setPlanoEdit(p => ({ ...p, refeicoes: p.refeicoes.map((rf, j) => j === i ? { ...rf, nome: e.target.value } : rf) }))} /></div>
                      <div className="field-group"><label className="field-label">Itens (um por linha)</label><textarea className="field-textarea" value={r.itens.join("\n")} onChange={e => setPlanoEdit(p => ({ ...p, refeicoes: p.refeicoes.map((rf, j) => j === i ? { ...rf, itens: e.target.value.split("\n") } : rf) }))} /></div>
                    </div>
                  ))}
                  <button className="btn-secondary" style={{ marginBottom: 16 }} onClick={() => setPlanoEdit(p => ({ ...p, refeicoes: [...p.refeicoes, { nome: "", itens: [""] }] }))}>+ Adicionar refeição</button>
                  <div className="field-group"><label className="field-label">Observações</label><textarea className="field-textarea" value={planoEdit?.observacoes || ""} onChange={e => setPlanoEdit(p => ({ ...p, observacoes: e.target.value }))} /></div>
                  <button className="btn-primary" onClick={salvarPlano}>💾 Salvar plano</button>
                </div>
              )}
              {subAba === "peso" && (
                <div className="card"><div className="card-title">⚖️ Evolução de peso</div><PesoChart dados={pac.peso} /></div>
              )}
              {subAba === "consultas" && (
                <div className="card">
                  <div className="card-title">📅 Consultas agendadas</div>
                  <div className="agenda-form">
                    <div className="field-group" style={{ marginBottom: 0 }}><label className="field-label">Data</label><input className="field-input" type="date" value={novaConsulta.data} onChange={e => setNovaConsulta(n => ({ ...n, data: e.target.value }))} /></div>
                    <div className="field-group" style={{ marginBottom: 0 }}><label className="field-label">Hora</label><input className="field-input" type="time" value={novaConsulta.hora} onChange={e => setNovaConsulta(n => ({ ...n, hora: e.target.value }))} /></div>
                    <div className="field-group" style={{ marginBottom: 0 }}><label className="field-label">Tipo</label>
                      <select className="field-input" value={novaConsulta.tipo} onChange={e => setNovaConsulta(n => ({ ...n, tipo: e.target.value }))}>
                        <option>Primeira consulta</option><option>Retorno</option><option>Avaliação</option>
                      </select>
                    </div>
                    <button className="btn-primary" style={{ width: "auto", alignSelf: "flex-end" }} onClick={() => adicionarConsulta(pac.id)}>+ Adicionar</button>
                  </div>
                  {pac.consultas.map((c, i) => (
                    <div className="consulta-item" key={i}>
                      <div className="consulta-data"><div className="consulta-dia">{c.data.split("/")[0]}</div><div className="consulta-mes">{mesLabel(c.data)}</div></div>
                      <div className="consulta-info"><div className="consulta-tipo">{c.tipo}</div><div className="consulta-hora">🕐 {c.hora}</div></div>
                    </div>
                  ))}
                </div>
              )}
            </>
          );
        })()}

        {aba === "agenda" && (
          <>
            <h1 className="page-title">📅 Agenda Geral</h1>
            <div className="card">
              {todasConsultas.length ? todasConsultas.map((c, i) => (
                <div className="consulta-item" key={i}>
                  <div className="consulta-data"><div className="consulta-dia">{c.data.split("/")[0]}</div><div className="consulta-mes">{mesLabel(c.data)}</div></div>
                  <div className="consulta-info"><div className="consulta-tipo">{c.paciente}</div><div className="consulta-hora">🕐 {c.hora} · {c.tipo}</div></div>
                  <span className="badge badge-green">Confirmada</span>
                </div>
              )) : <p style={{ color: "#6B7B8E" }}>Nenhuma consulta agendada.</p>}
            </div>
          </>
        )}

        {aba === "perfil" && (
          <>
            <h1 className="page-title">👤 Meu Perfil</h1>
            <div className="card">
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#EBF2FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700, color: "#1B4F8A" }}>{user.nome[0]}</div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#163f6e" }}>{user.nome}</div>
                  <div style={{ fontSize: 13, color: "#6B7B8E" }}>{user.email}</div>
                  {user.crn && <span className="badge badge-green" style={{ marginTop: 4 }}>{user.crn}</span>}
                </div>
              </div>
              <div className="section-divider">Informações</div>
              {user.telefone && <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #DDE4EE", fontSize: 14 }}><span style={{ color: "#6B7B8E" }}>Telefone</span><span style={{ fontWeight: 600 }}>{user.telefone}</span></div>}
              {user.especialidade && <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #DDE4EE", fontSize: 14 }}><span style={{ color: "#6B7B8E" }}>Especialidade</span><span style={{ fontWeight: 600 }}>{user.especialidade}</span></div>}
              {user.crn && <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontSize: 14 }}><span style={{ color: "#6B7B8E" }}>CRN</span><span style={{ fontWeight: 600 }}>{user.crn}</span></div>}
            </div>
          </>
        )}
        </div>
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setCarregando(false);
    });
    const unsubPacientes = onSnapshot(collection(db, "pacientes"), (snap) => {
      setPacientes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubUsers(); unsubPacientes(); };
  }, []);

  const handleCadastro = async (dados) => {
    const userRef = await addDoc(collection(db, "users"), dados);
    if (dados.role === "paciente") {
      await addDoc(collection(db, "pacientes"), {
        userId: userRef.id, nome: dados.nome, email: dados.email,
        peso: [], consultas: [], planoAlimentar: null, receitas: [], anamnese: null,
      });
    }
  };

  if (carregando) {
    return <div style={{ padding: 40, textAlign: "center", color: "#6B7B8E" }}>Carregando...</div>;
  }

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        {!user && <Login onLogin={setUser} users={users} onCadastro={handleCadastro} />}
        {user?.role === "paciente" && <PacienteDashboard user={user} pacientes={pacientes} onLogout={() => setUser(null)} />}
        {user?.role === "nutricionista" && <NutricionistaDashboard user={user} pacientes={pacientes} onLogout={() => setUser(null)} />}
      </div>
    </>
  );
}

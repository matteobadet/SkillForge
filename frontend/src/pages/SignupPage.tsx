import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { ApiError } from "../api/client";

export default function SignupPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pseudo, setPseudo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(email, password, pseudo);
      navigate("/store");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        const code = (err.body as { error?: string })?.error;
        setError(code === "email_taken" ? "Cet email est déjà utilisé." : "Ce pseudo est déjà pris.");
      } else if (err instanceof ApiError && err.status === 400) {
        setError("Vérifiez les champs (mot de passe : 8 caractères minimum).");
      } else {
        setError("Une erreur est survenue. Réessayez.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Créer un compte</h1>
        <form onSubmit={handleSubmit}>
          <label className="field">
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="field">
            Pseudo
            <input type="text" minLength={3} maxLength={32} value={pseudo} onChange={(e) => setPseudo(e.target.value)} required />
          </label>
          <label className="field">
            Mot de passe
            <input type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          {error && <p className="alert alert-error" role="alert">{error}</p>}
          <button type="submit" className="btn-primary" disabled={submitting}>
            <UserPlus size={16} />
            Créer mon compte
          </button>
        </form>
        <p className="auth-card-footer">
          Déjà un compte ? <Link to="/login">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}

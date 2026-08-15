import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
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
      navigate("/profile");
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
    <form onSubmit={handleSubmit}>
      <h1>Créer un compte</h1>
      <label>
        Email
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </label>
      <label>
        Pseudo
        <input type="text" minLength={3} maxLength={32} value={pseudo} onChange={(e) => setPseudo(e.target.value)} required />
      </label>
      <label>
        Mot de passe
        <input type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
      </label>
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={submitting}>Créer mon compte</button>
      <p>
        Déjà un compte ? <Link to="/login">Se connecter</Link>
      </p>
    </form>
  );
}

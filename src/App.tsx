import { Routes, Route, Navigate } from 'react-router-dom';
import { CreateVideoPage } from './pages/CreateVideoPage';
import { VideoEditorPage } from './pages/VideoEditorPage';
import { LandingPage } from './pages/LandingPage';
import { useVideoStore } from './store/useVideoStore';
import { useAuth } from './contexts/AuthContext';
import { useEffect } from 'react';

function LanguageRedirect({ lang }: { lang: string }) {
  const setUILanguage = useVideoStore((s) => s.setUILanguage);

  useEffect(() => {
    if (lang) {
      localStorage.setItem('preferred_language', lang);
      setUILanguage(lang === 'hindi' ? 'hi' : 'en');
    }
  }, [lang, setUILanguage]);

  return <Navigate to="/" replace />;
}

function App() {
  const project = useVideoStore((state) => state.project);
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/english" element={<LanguageRedirect lang="english" />} />
        <Route path="/hindi" element={<LanguageRedirect lang="hindi" />} />
        <Route path="/videoprompt" element={<CreateVideoPage />} />
        <Route
          path="/scenes"
          element={
            project ? <VideoEditorPage /> : <Navigate to="/videoprompt" replace />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;

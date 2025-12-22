import { Routes, Route, Navigate } from 'react-router-dom';
import { CreateVideoPage } from './pages/CreateVideoPage';
import { VideoEditorPage } from './pages/VideoEditorPage';
import { LandingPage } from './pages/LandingPage';
import { useVideoStore } from './store/useVideoStore';

function App() {
  const project = useVideoStore((state) => state.project);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      <Routes>
        <Route path="/" element={<LandingPage />} />
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

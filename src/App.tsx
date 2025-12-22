import { useState } from 'react';
import { CreateVideoPage } from './pages/CreateVideoPage';
import { VideoEditorPage } from './pages/VideoEditorPage';
import { LandingPage } from './pages/LandingPage';
import { useVideoStore } from './store/useVideoStore';

function App() {
  const project = useVideoStore((state) => state.project);
  const [showLanding, setShowLanding] = useState(true);

  if (showLanding && !project) {
    return <LandingPage onGetStarted={() => setShowLanding(false)} />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      {!project ? (
        <CreateVideoPage />
      ) : (
        <VideoEditorPage />
      )}
    </div>
  );
}

export default App;

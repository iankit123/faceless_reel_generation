import { CreateVideoPage } from './pages/CreateVideoPage';
import { VideoEditorPage } from './pages/VideoEditorPage';
import { useVideoStore } from './store/useVideoStore';

function App() {
  const project = useVideoStore((state) => state.project);

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

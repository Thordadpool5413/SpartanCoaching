import { VideoTemplate } from './components/video/VideoTemplate';

function App() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-black">
      <div className="relative w-full h-full max-w-[100vw] max-h-[100vh] aspect-video bg-spartan-bg overflow-hidden flex-shrink-0" style={{ maxHeight: 'calc(100vw * 9 / 16)' }}>
        <VideoTemplate />
      </div>
    </div>
  );
}

export default App;

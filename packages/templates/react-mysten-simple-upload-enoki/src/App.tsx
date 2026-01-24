import { AppLayout } from './components/layout/app-layout.js';
import { UploadForm } from './components/features/upload-form.js';
import { FilePreview } from './components/features/file-preview.js';
import './index.css';

function App() {
  return (
    <AppLayout>
      <div className="simple-upload-app">
        <h2><span className="text-accent">📤</span> Simple Upload</h2>
        <p className="text-secondary">Upload a file to <span className="text-accent">Walrus</span> and download it by <span className="text-accent">Blob ID</span></p>

        <section className="upload-section">
          <h3>Upload File</h3>
          <UploadForm />
        </section>

        <section className="download-section">
          <h3>Download File</h3>
          <FilePreview />
        </section>
      </div>
    </AppLayout>
  );
}

export default App;

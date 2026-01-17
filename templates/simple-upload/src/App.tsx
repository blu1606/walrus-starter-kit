import { Layout } from '../../react/src/components/Layout.js';
import { UploadForm } from './components/UploadForm.js';
import { FilePreview } from './components/FilePreview.js';
import './styles.css';

function App() {
  return (
    <Layout>
      <div className="simple-upload-app">
        <h2>📤 Simple Upload</h2>
        <p>Upload a file to Walrus and download it by Blob ID</p>

        <section className="upload-section">
          <h3>Upload File</h3>
          <UploadForm />
        </section>

        <section className="download-section">
          <h3>Download File</h3>
          <FilePreview />
        </section>
      </div>
    </Layout>
  );
}

export default App;

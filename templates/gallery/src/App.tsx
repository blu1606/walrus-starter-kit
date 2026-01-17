import { useState } from 'react';
import { Layout } from '../../react/src/components/Layout.js';
import { GalleryGrid } from './components/GalleryGrid.js';
import { UploadModal } from './components/UploadModal.js';
import './styles.css';

function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <Layout>
      <div className="gallery-app">
        <h2>🖼️ File Gallery</h2>
        <UploadModal onSuccess={() => setRefreshKey((k) => k + 1)} />
        <GalleryGrid key={refreshKey} />
      </div>
    </Layout>
  );
}

export default App;

const { useEffect, useMemo, useState } = React;

function extractDriveId(link) {
  const patterns = [/\/file\/d\/([a-zA-Z0-9_-]+)/, /[?&]id=([a-zA-Z0-9_-]+)/, /\/d\/([a-zA-Z0-9_-]+)/];
  for (const pattern of patterns) {
    const match = link.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

function toPreviewUrl(link) {
  const id = extractDriveId(link);
  return id ? `https://drive.google.com/file/d/${id}/preview` : null;
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

function App() {
  const [page, setPage] = useState('welcome');
  const [sections, setSections] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [status, setStatus] = useState({ connected: false, hasMongoUri: false });
  const [error, setError] = useState('');

  const [newSection, setNewSection] = useState('');
  const [newVideo, setNewVideo] = useState({ title: '', url: '', sectionId: '' });
  const [mongoUri, setMongoUri] = useState('');

  const allVideos = useMemo(
    () => sections.flatMap((section) => section.videos.map((video) => ({ ...video, sectionName: section.name }))),
    [sections]
  );

  async function loadStatus() {
    try {
      const data = await fetchJson('/api/health');
      setStatus(data);
    } catch {
      setError('Failed to load server status.');
    }
  }

  async function loadSections(searchValue = '') {
    try {
      const data = await fetchJson(`/api/sections?search=${encodeURIComponent(searchValue)}`);
      setSections(data);
      const firstVideo = data.flatMap((section) => section.videos)[0] || null;
      setSelectedVideo((prev) => prev || firstVideo);
      setNewVideo((prev) => ({ ...prev, sectionId: prev.sectionId || data[0]?._id || '' }));
      setError('');
    } catch (err) {
      setSections([]);
      setSelectedVideo(null);
      setError(err.message);
    }
  }

  useEffect(() => {
    loadStatus();
    loadSections();
  }, []);

  const onSearch = async (event) => {
    event.preventDefault();
    await loadSections(search);
  };

  const onCreateSection = async (event) => {
    event.preventDefault();
    if (!newSection.trim()) return;
    try {
      await fetchJson('/api/sections', {
        method: 'POST',
        body: JSON.stringify({ name: newSection.trim() }),
      });
      setNewSection('');
      await loadSections(search);
    } catch (err) {
      setError(err.message);
    }
  };

  const onCreateVideo = async (event) => {
    event.preventDefault();
    const title = newVideo.title.trim();
    const url = newVideo.url.trim();
    const sectionId = newVideo.sectionId;

    if (!title || !url || !sectionId) {
      setError('Please provide title, section, and Google Drive URL.');
      return;
    }

    if (!toPreviewUrl(url)) {
      setError('Invalid Google Drive URL.');
      return;
    }

    try {
      await fetchJson('/api/videos', {
        method: 'POST',
        body: JSON.stringify({ title, url, sectionId }),
      });
      setNewVideo((prev) => ({ ...prev, title: '', url: '' }));
      await loadSections(search);
    } catch (err) {
      setError(err.message);
    }
  };

  const onSaveMongoUri = async (event) => {
    event.preventDefault();
    if (!mongoUri.trim()) return;
    try {
      await fetchJson('/api/config/mongodb-uri', {
        method: 'POST',
        body: JSON.stringify({ uri: mongoUri.trim() }),
      });
      setMongoUri('');
      await loadStatus();
      await loadSections(search);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="layout">
      <header className="topbar">
        <h1><span>▶</span> PlayTube</h1>
        <nav>
          <button className={page === 'welcome' ? 'active' : ''} onClick={() => setPage('welcome')}>Welcome</button>
          <button className={page === 'explore' ? 'active' : ''} onClick={() => setPage('explore')}>Explore</button>
          <button className={page === 'manage' ? 'active' : ''} onClick={() => setPage('manage')}>Manage</button>
        </nav>
      </header>

      <main className="page">
        {error ? <p className="error">{error}</p> : null}

        {page === 'welcome' && (
          <section>
            <h2>Welcome to your permanent video hub</h2>
            <p className="muted">Each section below is loaded from MongoDB and shared for every user.</p>
            <div className="section-grid">
              {sections.map((section) => (
                <article key={section._id} className="card">
                  <h3>{section.name}</h3>
                  <p className="muted">{section.videos.length} videos</p>
                  <ul>
                    {section.videos.slice(0, 3).map((video) => (
                      <li key={video._id}>{video.title}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        )}

        {page === 'explore' && (
          <section className="explore">
            <form className="search-row" onSubmit={onSearch}>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search videos by title"
              />
              <button type="submit">Search</button>
            </form>
            <div className="explore-grid">
              <aside className="list">
                {allVideos.map((video) => (
                  <article key={video._id} className={`video-item ${selectedVideo?._id === video._id ? 'selected' : ''}`} onClick={() => setSelectedVideo(video)}>
                    <h4>{video.title}</h4>
                    <p>{video.sectionName}</p>
                  </article>
                ))}
              </aside>
              <div className="player-panel">
                {selectedVideo ? (
                  <>
                    <iframe
                      className="player"
                      src={toPreviewUrl(selectedVideo.url)}
                      title={selectedVideo.title}
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                    />
                    <h3>{selectedVideo.title}</h3>
                  </>
                ) : (
                  <p className="muted">No videos found for this search.</p>
                )}
              </div>
            </div>
          </section>
        )}

        {page === 'manage' && (
          <section className="manage">
            <article className="card">
              <h3>MongoDB Connection</h3>
              <p className="muted">You can set your MongoDB URI in a local <code>.env</code> file or use this form at runtime.</p>
              <p className="muted">Connected: <strong>{status.connected ? 'Yes' : 'No'}</strong></p>
              <form onSubmit={onSaveMongoUri} className="stack">
                <input
                  type="text"
                  placeholder="mongodb+srv://..."
                  value={mongoUri}
                  onChange={(e) => setMongoUri(e.target.value)}
                />
                <button type="submit">Save MongoDB URI</button>
              </form>
            </article>

            <article className="card">
              <h3>Create Section</h3>
              <form onSubmit={onCreateSection} className="stack">
                <input
                  type="text"
                  placeholder="Section name"
                  value={newSection}
                  onChange={(e) => setNewSection(e.target.value)}
                />
                <button type="submit">Add Section</button>
              </form>
            </article>

            <article className="card">
              <h3>Add Video</h3>
              <form onSubmit={onCreateVideo} className="stack">
                <input
                  type="text"
                  placeholder="Video title"
                  value={newVideo.title}
                  onChange={(e) => setNewVideo((prev) => ({ ...prev, title: e.target.value }))}
                />
                <input
                  type="url"
                  placeholder="Google Drive URL"
                  value={newVideo.url}
                  onChange={(e) => setNewVideo((prev) => ({ ...prev, url: e.target.value }))}
                />
                <select
                  value={newVideo.sectionId}
                  onChange={(e) => setNewVideo((prev) => ({ ...prev, sectionId: e.target.value }))}
                >
                  <option value="">Select section</option>
                  {sections.map((section) => (
                    <option key={section._id} value={section._id}>{section.name}</option>
                  ))}
                </select>
                <button type="submit">Add Video</button>
              </form>
            </article>
          </section>
        )}
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);

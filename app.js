const { useMemo, useState, useEffect } = React;

const SAMPLE_VIDEOS = [
  {
    id: crypto.randomUUID(),
    title: "Welcome Video",
    url: "https://drive.google.com/file/d/1mGqmx7y4ZX2wO9d5Gk8q_x2K2W8XJQ1M/view?usp=sharing"
  }
];

function extractDriveId(link) {
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)/,
  ];

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

function App() {
  const [videos, setVideos] = useState(() => {
    const saved = localStorage.getItem("playtube-videos");
    if (saved) return JSON.parse(saved);
    return SAMPLE_VIDEOS;
  });

  const [selectedId, setSelectedId] = useState(videos[0]?.id ?? null);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    localStorage.setItem("playtube-videos", JSON.stringify(videos));
  }, [videos]);

  const selectedVideo = useMemo(
    () => videos.find((video) => video.id === selectedId) || null,
    [videos, selectedId]
  );

  const onAddVideo = (event) => {
    event.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedUrl = url.trim();

    if (!trimmedTitle || !trimmedUrl) {
      setError("Please add a title and a Google Drive link.");
      return;
    }

    if (!toPreviewUrl(trimmedUrl)) {
      setError("Invalid Google Drive link. Please use a shareable Drive file URL.");
      return;
    }

    const newVideo = {
      id: crypto.randomUUID(),
      title: trimmedTitle,
      url: trimmedUrl,
    };

    setVideos((prev) => [newVideo, ...prev]);
    setSelectedId(newVideo.id);
    setTitle("");
    setUrl("");
    setError("");
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <h1 className="logo"><span>▶</span> PlayTube</h1>
        <form className="form" onSubmit={onAddVideo}>
          <input
            type="text"
            placeholder="Video title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            type="url"
            placeholder="Google Drive video link"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button type="submit">Add Video</button>
          {error ? <p className="helper">{error}</p> : <p className="helper">Tip: set the Drive file to "Anyone with the link can view".</p>}
        </form>

        <section className="video-list">
          {videos.map((video) => (
            <article
              key={video.id}
              className={`video-card ${video.id === selectedId ? "active" : ""}`}
              onClick={() => setSelectedId(video.id)}
            >
              <h3 className="video-title">{video.title}</h3>
              <p className="video-meta">Google Drive video</p>
            </article>
          ))}
        </section>
      </aside>

      <main className="main">
        {selectedVideo ? (
          <>
            <iframe
              className="player-wrap"
              src={toPreviewUrl(selectedVideo.url)}
              title={selectedVideo.title}
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
            <h2 className="current-title">{selectedVideo.title}</h2>
          </>
        ) : (
          <div className="empty">Add a Google Drive video from the left panel to start watching.</div>
        )}
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

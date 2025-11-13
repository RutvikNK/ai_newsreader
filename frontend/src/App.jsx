import { useState, useEffect } from "react";
import { getNewsStories } from "./api/axios";
import NewsCard from "./components/NewsCard";
import VideoPlayer from "./components/VideoPlayer";
import "./App.css";

const App = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeStoryId, setActiveStoryId] = useState(null);
  const [activeVideoUrl, setActiveVideoUrl] = useState(
    "https://app.heygen.com/embedded-player/dea35a42ff7f4220afdfdd53f5967239"
  );

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const data = await getNewsStories();
        setStories(data);
        // if (data.length > 0) {
        //   setActiveStoryId(data[0].id);
        //   setActiveVideoUrl(data[0].gcs_video_url || null);
        // }
      } catch (err) {
        setError("Failed to load news feed. Check API connection.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  const handlePlay = (story) => {
    setActiveStoryId(story.id);
    setActiveVideoUrl(story.gcs_video_url || null);
  };

  if (loading) return <div className="loading">Loading news...</div>;
  if (error) return <div className="error">{error}</div>;
  if (stories.length === 0)
    return <div className="loading">No news stories available</div>;

  return (
    <div className="dashboard">
      <header className="header">
        <h1>AI Newsreader & Journalist Platform</h1>
        <p>Top 5 stories of the day — click 🔊 Play to listen.</p>
      </header>

      {/* Main Video Player */}
      <div className="video-player-wrapper">
        <VideoPlayer videoUrl={activeVideoUrl} />
      </div>

      <div className="video-thumbnails">
        {stories.map((story) => (
          <NewsCard
            key={story.id}
            story={story}
            isActive={story.id === activeStoryId}
            onPlay={() => handlePlay(story)}
          />
        ))}
      </div>
    </div>
  );
};

export default App;

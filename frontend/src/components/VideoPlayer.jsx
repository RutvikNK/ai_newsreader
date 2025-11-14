const VideoPlayer = ({ videoUrl }) => {
  if (!videoUrl) {
    return (
      <div className="video-placeholder">
        <p>No video available for this story.</p>
      </div>
    );
  }

  return (
    <iframe
      width="448"
      height="252"
      src={videoUrl}
      allow="autoplay; fullscreen"
      allowFullScreen
      title="News Video"
      style={{
        border: "none",
        borderRadius: "16px",
        boxShadow: "0 0 15px rgba(0, 0, 0, 0.3)",
        gap: "16",
      }}
    ></iframe>
  );
};

export default VideoPlayer;

import { useState } from "react";

const NewsCard = ({ story, isActive, onPlay }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleSpeak = () => {
    if (!("speechSynthesis" in window)) {
      alert("Sorry, your browser doesn't support voice playback.");
      return;
    }

    // Stop any existing speech
    window.speechSynthesis.cancel();

    const text = story.abstract || story.summary || story.title;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 1;

    utterance.onstart = () => {
      setIsSpeaking(true);
      onPlay();
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  return (
    <div className={`news-card ${isActive || isSpeaking ? "active" : ""}`}>
      <h2>{story.title}</h2>
      <p>{story.abstract}</p>
      <div className="card-footer">
        <a href={story.url} target="_blank" rel="noopener noreferrer">
          Read full article →
        </a>
        {!isSpeaking ? (
          <button onClick={handleSpeak} className="play-btn">
            🔊 Play
          </button>
        ) : (
          <button onClick={handleStop} className="play-btn playing">
            ⏹️ Stop
          </button>
        )}
      </div>
    </div>
  );
};

export default NewsCard;

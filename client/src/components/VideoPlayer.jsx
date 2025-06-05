import { useRef, useEffect } from "react";

const VideoPlayer = ({
  src,
  poster,
  className = "",
  autoPlay = false,
  controls = true,
  onPlay,
  onPause,
  onEnded,
  onTimeUpdate,
}) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => onPlay && onPlay();
    const handlePause = () => onPause && onPause();
    const handleEnded = () => onEnded && onEnded();
    const handleTimeUpdate = () =>
      onTimeUpdate && onTimeUpdate(video.currentTime, video.duration);

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [onPlay, onPause, onEnded, onTimeUpdate]);

  return (
    <div
      className={`relative overflow-hidden rounded-xl shadow-lg ${className}`}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        controls={controls}
        className="w-full h-full object-cover"
      />
    </div>
  );
};

export default VideoPlayer;

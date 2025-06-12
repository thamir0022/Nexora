import { useState, useRef, useEffect, useCallback } from "react"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  CiPlay1,
  CiPause1,
  CiSettings,
  CiVolumeHigh,
  CiVolumeMute,
  CiSquareChevLeft,
  CiSquareChevRight,
  CiMaximize1,
  CiKeyboard,
  CiRedo,
} from "react-icons/ci"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function VideoPlayer({ src, poster, autoPlay = false, onNext, onPrevious }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [showCenterButton, setShowCenterButton] = useState(false)
  const [showCursor, setShowCursor] = useState(true)
  const [isEnded, setIsEnded] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const speedOptions = [
    { value: 0.25, label: "0.25x" },
    { value: 0.5, label: "0.5x" },
    { value: 0.75, label: "0.75x" },
    { value: 1, label: "1x" },
    { value: 1.25, label: "1.25x" },
    { value: 1.5, label: "1.5x" },
    { value: 2, label: "2x" },
    { value: 4, label: "4x" },
  ]

  const videoRef = useRef(null)
  const containerRef = useRef(null)
  const controlsTimeoutRef = useRef(null)
  const centerButtonTimeoutRef = useRef(null)
  const mouseIdleTimeoutRef = useRef(null)
  const cursorTimeoutRef = useRef(null)

  const shortcuts = [
    { key: "Space", action: "Play/Pause" },
    { key: "M", action: "Mute/Unmute" },
    { key: "F", action: "Fullscreen" },
    { key: "→", action: "Skip 10s forward" },
    { key: "←", action: "Skip 10s backward" },
    { key: "↑", action: "Volume up" },
    { key: "↓", action: "Volume down" },
    { key: ",", action: "Decrease speed" },
    { key: ".", action: "Increase speed" },
    { key: "Ctrl+N", action: "Next video" },
    { key: "Ctrl+P", action: "Previous video" },
    { key: "0-9", action: "Jump to % of video" },
    { key: "Home", action: "Go to beginning" },
    { key: "End", action: "Go to end" },
  ]

  const showCenterButtonTemporarily = useCallback(() => {
    setShowCenterButton(true)

    // Clear existing timeout
    if (centerButtonTimeoutRef.current) {
      clearTimeout(centerButtonTimeoutRef.current)
    }

    // Hide center button after 3 seconds
    centerButtonTimeoutRef.current = setTimeout(() => {
      setShowCenterButton(false)
    }, 3000)
  }, [])

  const handlePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
      setIsPlaying(false)
      setShowCenterButton(false)
      setShowControls(true)
      setShowCursor(true)
      // Clear timeouts when pausing
      if (centerButtonTimeoutRef.current) {
        clearTimeout(centerButtonTimeoutRef.current)
      }
      if (mouseIdleTimeoutRef.current) {
        clearTimeout(mouseIdleTimeoutRef.current)
      }
      if (cursorTimeoutRef.current) {
        clearTimeout(cursorTimeoutRef.current)
      }
    } else {
      video.play()
      setIsPlaying(true)
      setIsEnded(false)
      // Show center button for 3 seconds when playing
      showCenterButtonTemporarily()
    }
  }, [isPlaying, showCenterButtonTemporarily])

  const handleVideoClick = useCallback(
    (e) => {
      // Prevent click if clicking on controls
      if (e.target.closest(".video-controls")) {
        return
      }
      handlePlay()
    },
    [handlePlay],
  )

  const handleNext = useCallback(() => {
    if (onNext) {
      onNext()
      setIsEnded(false)
    }
  }, [onNext])

  const handlePrevious = useCallback(() => {
    if (onPrevious) {
      onPrevious()
      setIsEnded(false)
    }
  }, [onPrevious])

  const handleRewatch = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    video.currentTime = 0
    video.play()
    setIsPlaying(true)
    setIsEnded(false)
    showCenterButtonTemporarily()
  }, [showCenterButtonTemporarily])

  const skipTime = useCallback((seconds) => {
    const video = videoRef.current
    if (!video) return

    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds))
  }, [])

  const changeVolume = useCallback((delta) => {
    const video = videoRef.current
    if (!video) return

    const newVolume = Math.max(0, Math.min(1, video.volume + delta))
    video.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }, [])

  const jumpToPercentage = useCallback((percentage) => {
    const video = videoRef.current
    if (!video) return

    video.currentTime = (percentage / 100) * video.duration
  }, [])

  const handleSpeedChange = (speed) => {
    const video = videoRef.current
    if (!video) return

    video.playbackRate = speed
    setPlaybackSpeed(speed)
  }

  const handleMouseActivity = useCallback(() => {
    setShowControls(true)
    setShowCursor(true)

    // Clear existing timeouts
    if (mouseIdleTimeoutRef.current) {
      clearTimeout(mouseIdleTimeoutRef.current)
    }
    if (cursorTimeoutRef.current) {
      clearTimeout(cursorTimeoutRef.current)
    }

    // Only start hiding timer if video is playing
    if (isPlaying) {
      mouseIdleTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)

      cursorTimeoutRef.current = setTimeout(() => {
        setShowCursor(false)
      }, 3000)
    }
  }, [isPlaying])

  const handleMouseLeave = useCallback(() => {
    // Clear timeouts and hide controls/cursor immediately when mouse leaves during playback
    if (mouseIdleTimeoutRef.current) {
      clearTimeout(mouseIdleTimeoutRef.current)
    }
    if (cursorTimeoutRef.current) {
      clearTimeout(cursorTimeoutRef.current)
    }
    if (isPlaying) {
      setShowControls(false)
      setShowCursor(false)
    }
  }, [isPlaying])

  useEffect(() => {
    if (autoPlay) {
      handlePlay()
    }
  }, [autoPlay, handlePlay])

  // Update mouse idle timeout when playing state changes
  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true)
      setShowCursor(true)
      if (mouseIdleTimeoutRef.current) {
        clearTimeout(mouseIdleTimeoutRef.current)
      }
      if (cursorTimeoutRef.current) {
        clearTimeout(cursorTimeoutRef.current)
      }
    }
  }, [isPlaying])

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime)
      setProgress((video.currentTime / video.duration) * 100)
    }

    const onLoadedMetadata = () => {
      setDuration(video.duration)
    }

    const onEnded = () => {
      setIsPlaying(false)
      setIsEnded(true)
      setShowControls(true)
      setShowCursor(true)
      setShowCenterButton(false)
      // Clear timeouts when video ends
      if (centerButtonTimeoutRef.current) {
        clearTimeout(centerButtonTimeoutRef.current)
      }
      if (mouseIdleTimeoutRef.current) {
        clearTimeout(mouseIdleTimeoutRef.current)
      }
      if (cursorTimeoutRef.current) {
        clearTimeout(cursorTimeoutRef.current)
      }
    }

    const onPlay = () => {
      setIsPlaying(true)
      showCenterButtonTemporarily()
    }

    const onPause = () => {
      setIsPlaying(false)
      setShowControls(true)
      setShowCursor(true)
      setShowCenterButton(false)
      if (centerButtonTimeoutRef.current) {
        clearTimeout(centerButtonTimeoutRef.current)
      }
    }

    video.addEventListener("timeupdate", onTimeUpdate)
    video.addEventListener("loadedmetadata", onLoadedMetadata)
    video.addEventListener("ended", onEnded)
    video.addEventListener("play", onPlay)
    video.addEventListener("pause", onPause)

    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate)
      video.removeEventListener("loadedmetadata", onLoadedMetadata)
      video.removeEventListener("ended", onEnded)
      video.removeEventListener("play", onPlay)
      video.removeEventListener("pause", onPause)
    }
  }, [showCenterButtonTemporarily])

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only handle shortcuts when video player is focused or in fullscreen
      if (!isFullscreen && !containerRef.current?.contains(document.activeElement)) {
        return
      }

      // Prevent default for video player shortcuts
      const videoShortcuts = [
        "Space",
        "KeyM",
        "KeyF",
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "Home",
        "End",
        "Comma",
        "Period",
      ]
      if (videoShortcuts.includes(e.code) || (e.ctrlKey && ["KeyN", "KeyP"].includes(e.code))) {
        e.preventDefault()
      }

      switch (e.code) {
        case "Space":
          handlePlay()
          break
        case "KeyM":
          toggleMute()
          break
        case "KeyF":
          handleFullscreen()
          break
        case "ArrowRight":
          skipTime(10)
          break
        case "ArrowLeft":
          skipTime(-10)
          break
        case "ArrowUp":
          changeVolume(0.1)
          break
        case "ArrowDown":
          changeVolume(-0.1)
          break
        case "Home":
          jumpToPercentage(0)
          break
        case "End":
          jumpToPercentage(100)
          break
        case "Digit0":
        case "Digit1":
        case "Digit2":
        case "Digit3":
        case "Digit4":
        case "Digit5":
        case "Digit6":
        case "Digit7":
        case "Digit8":
        case "Digit9":
          const num = Number.parseInt(e.code.replace("Digit", ""))
          jumpToPercentage(num * 10)
          break
        case "Comma":
          // Decrease speed
          const currentSpeedIndex = speedOptions.findIndex((s) => s.value === playbackSpeed)
          if (currentSpeedIndex > 0) {
            handleSpeedChange(speedOptions[currentSpeedIndex - 1].value)
          }
          break
        case "Period":
          // Increase speed
          const currentSpeedIndexInc = speedOptions.findIndex((s) => s.value === playbackSpeed)
          if (currentSpeedIndexInc < speedOptions.length - 1) {
            handleSpeedChange(speedOptions[currentSpeedIndexInc + 1].value)
          }
          break
      }

      // Ctrl combinations
      if (e.ctrlKey) {
        switch (e.code) {
          case "KeyN":
            handleNext()
            break
          case "KeyP":
            handlePrevious()
            break
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [
    handlePlay,
    handleNext,
    handlePrevious,
    skipTime,
    changeVolume,
    jumpToPercentage,
    playbackSpeed,
    speedOptions,
    isFullscreen,
  ])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
      if (centerButtonTimeoutRef.current) {
        clearTimeout(centerButtonTimeoutRef.current)
      }
      if (mouseIdleTimeoutRef.current) {
        clearTimeout(mouseIdleTimeoutRef.current)
      }
      if (cursorTimeoutRef.current) {
        clearTimeout(cursorTimeoutRef.current)
      }
    }
  }, [])

  const handleProgressChange = (value) => {
    const video = videoRef.current
    if (!video) return

    const newTime = (value[0] / 100) * duration
    video.currentTime = newTime
    setProgress(value[0])
    setCurrentTime(newTime)
  }

  const handleVolumeChange = (value) => {
    const video = videoRef.current
    if (!video) return

    const newVolume = value[0] / 100
    video.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return

    if (isMuted) {
      video.volume = volume
      setIsMuted(false)
    } else {
      video.volume = 0
      setIsMuted(true)
    }
  }

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
  }

  const handleFullscreen = () => {
    const videoContainer = containerRef.current
    if (!videoContainer) return

    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      videoContainer.requestFullscreen()
    }
  }

  return (
    <div
      ref={containerRef}
      className={`video-container relative w-full min-w-[320px] aspect-video bg-black rounded-lg overflow-hidden group ${
        showCursor ? "cursor-pointer" : "cursor-none"
      }`}
      onMouseMove={handleMouseActivity}
      onMouseEnter={handleMouseActivity}
      onMouseLeave={handleMouseLeave}
      onClick={handleVideoClick}
      tabIndex={0}
    >
      <video ref={videoRef} src={src} poster={poster} className="w-full h-full object-cover pointer-events-none" />

      {(showCenterButton || (!isPlaying && !isEnded)) && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div
            className="pointer-events-auto cursor-pointer transition-all duration-300 hover:scale-110"
            onClick={(e) => {
              e.stopPropagation()
              handlePlay()
            }}
          >
            {isPlaying ? (
              <CiPause1 size={isFullscreen ? 80 : 64} className="text-white drop-shadow-lg" />
            ) : (
              <CiPlay1 size={isFullscreen ? 80 : 64} className="text-white drop-shadow-lg" />
            )}
          </div>
        </div>
      )}

      {/* Rewatch button when video ends */}
      {isEnded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <div className="text-center">
            <div className="mb-6">
              <CiRedo
                size={isFullscreen ? 80 : 64}
                className="text-white drop-shadow-lg cursor-pointer mx-auto"
                onClick={handleRewatch}
              />
            </div>
            <div className="flex gap-2 justify-center">
              {onPrevious && (
                <Button
                  onClick={handlePrevious}
                  variant="outline"
                  size={isFullscreen ? "default" : "sm"}
                  className="bg-white/10 hover:bg-white/20 text-white border-white/30"
                >
                  <CiSquareChevLeft size={isFullscreen ? 24 : 16} className="mr-1" />
                  Previous
                </Button>
              )}
              {onNext && (
                <Button
                  onClick={handleNext}
                  variant="outline"
                  size={isFullscreen ? "default" : "sm"}
                  className="bg-white/10 hover:bg-white/20 text-white border-white/30"
                >
                  Next
                  <CiSquareChevRight size={isFullscreen ? 24 : 16} className="ml-1" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {(showControls || !isPlaying) && !isEnded && (
        <div
          className="video-controls absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end transition-opacity duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-2 sm:px-4 pb-1">
            <Slider
              value={[progress]}
              min={0}
              max={100}
              step={0.1}
              onValueChange={handleProgressChange}
              className="cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between px-2 sm:px-4 pb-2 sm:pb-4">
            <div className="flex items-center gap-1 sm:gap-3">
              <Button
                variant="ghost"
                size={isFullscreen ? "default" : "sm"}
                onClick={handlePlay}
                className="text-white hover:bg-white/20 transition-colors p-1 sm:p-2"
              >
                {isPlaying ? <CiPause1 size={isFullscreen ? 24 : 20} /> : <CiPlay1 size={isFullscreen ? 24 : 20} />}
              </Button>

              {onPrevious && (
                <Button
                  variant="ghost"
                  size={isFullscreen ? "default" : "sm"}
                  onClick={handlePrevious}
                  className="text-white hover:bg-white/20 transition-colors p-1 sm:p-2"
                >
                  <CiSquareChevLeft size={isFullscreen ? 24 : 20} />
                </Button>
              )}

              {onNext && (
                <Button
                  variant="ghost"
                  size={isFullscreen ? "default" : "sm"}
                  onClick={handleNext}
                  className="text-white hover:bg-white/20 transition-colors p-1 sm:p-2"
                >
                  <CiSquareChevRight size={isFullscreen ? 24 : 20} />
                </Button>
              )}

              <div className="flex items-center gap-1 sm:gap-2">
                <Button
                  variant="ghost"
                  size={isFullscreen ? "default" : "sm"}
                  onClick={toggleMute}
                  className="text-white hover:bg-white/20 transition-colors p-1 sm:p-2"
                >
                  {isMuted ? (
                    <CiVolumeMute size={isFullscreen ? 24 : 20} />
                  ) : (
                    <CiVolumeHigh size={isFullscreen ? 24 : 20} />
                  )}
                </Button>

                <div className="w-12 sm:w-20 hidden sm:block">
                  <Slider
                    value={[isMuted ? 0 : volume * 100]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={handleVolumeChange}
                    className="cursor-pointer"
                  />
                </div>
              </div>

              <span className="text-white text-xs sm:text-sm font-mono hidden md:block">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size={isFullscreen ? "default" : "sm"}
                    className="text-white hover:bg-white/20 transition-colors p-1 sm:p-2"
                  >
                    <span className="text-xs sm:text-sm font-mono">{playbackSpeed}x</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="bg-black/90 border-white/20 text-white"
                  container={isFullscreen ? document.fullscreenElement : document.body}
                >
                  <div className="p-2 text-sm font-semibold border-b border-white/20 mb-1">Playback Speed</div>
                  {speedOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => handleSpeedChange(option.value)}
                      className={`hover:bg-white/10 ${playbackSpeed === option.value ? "bg-white/20" : ""}`}
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size={isFullscreen ? "default" : "sm"}
                    className="text-white hover:bg-white/20 transition-colors p-1 sm:p-2 hidden sm:flex"
                  >
                    <CiKeyboard size={isFullscreen ? 24 : 20} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-64 bg-black/90 border-white/20 text-white"
                  container={isFullscreen ? document.fullscreenElement : document.body}
                >
                  <ScrollArea className="h-60">
                    <div className="p-2 text-sm font-semibold border-b border-white/20 mb-1">Keyboard Shortcuts</div>
                    {shortcuts.map((shortcut, index) => (
                      <DropdownMenuItem key={index} className="flex justify-between hover:bg-white/10">
                        <span>{shortcut.action}</span>
                        <kbd className="px-2 py-1 text-xs bg-white/20 rounded">{shortcut.key}</kbd>
                      </DropdownMenuItem>
                    ))}
                  </ScrollArea>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                size={isFullscreen ? "default" : "sm"}
                className="text-white hover:bg-white/20 transition-colors p-1 sm:p-2 hidden sm:flex"
              >
                <CiSettings size={isFullscreen ? 24 : 20} />
              </Button>

              <Button
                variant="ghost"
                size={isFullscreen ? "default" : "sm"}
                onClick={handleFullscreen}
                className="text-white hover:bg-white/20 transition-colors p-1 sm:p-2"
              >
                <CiMaximize1 size={isFullscreen ? 24 : 20} />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

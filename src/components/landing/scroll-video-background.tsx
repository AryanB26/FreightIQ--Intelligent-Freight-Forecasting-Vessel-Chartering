"use client";

import { useEffect, useRef, useState } from "react";

interface ScrollVideoBackgroundProps {
  videoSrc?: string;
  className?: string;
}

export function ScrollVideoBackground({
  videoSrc = "/landing-page-video.mp4",
  className = "",
}: ScrollVideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const targetTimeRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Ensure video is paused so user scroll exclusively drives playback
    video.pause();

    const handleLoadedMetadata = () => {
      setIsVideoReady(true);
      video.currentTime = 0;
      updateTargetTime();
    };

    const updateTargetTime = () => {
      if (!video || !video.duration || isNaN(video.duration)) return;
      const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight;
      const winHeight = window.innerHeight;
      const maxScroll = Math.max(docHeight - winHeight, 1);
      const progress = Math.min(Math.max(scrollY / maxScroll, 0), 1);
      targetTimeRef.current = progress * (video.duration - 0.05);
    };

    // Smooth render loop with linear interpolation (lerp)
    const renderLoop = () => {
      if (video && video.duration && !video.seeking) {
        const current = video.currentTime;
        const target = targetTimeRef.current;
        const delta = target - current;

        // Only update if difference is noticeable to maintain performance & prevent micro-jitters
        if (Math.abs(delta) > 0.008) {
          // Lerp factor of 0.14 provides responsive yet fluid, cinematic scrubbing
          video.currentTime = current + delta * 0.14;
        }
      }
      animFrameRef.current = requestAnimationFrame(renderLoop);
    };

    if (video.readyState >= 1) {
      handleLoadedMetadata();
    } else {
      video.addEventListener("loadedmetadata", handleLoadedMetadata);
    }

    window.addEventListener("scroll", updateTargetTime, { passive: true });
    window.addEventListener("resize", updateTargetTime, { passive: true });

    animFrameRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      window.removeEventListener("scroll", updateTargetTime);
      window.removeEventListener("resize", updateTargetTime);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden ${className}`}
    >
      {/* Background Video */}
      <video
        ref={videoRef}
        src={videoSrc}
        playsInline
        muted
        preload="auto"
        className={`w-full h-full object-cover transition-opacity duration-1000 ${isVideoReady ? "opacity-70" : "opacity-0"
          }`}
      />

      {/* Cinematic dark tint overlay to guarantee maximum text and card readability */}
      <div className="absolute inset-0 bg-black/55 backdrop-brightness-[0.8]" />

      {/* Vertical gradient overlay for header and footer depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-transparent to-black/90" />

      {/* Radial vignette for focused center stage */}
      <div
        className="absolute inset-0 opacity-80"
        style={{
          background: "radial-gradient(circle at center, transparent 40%, rgba(0, 0, 0, 0.75) 100%)",
        }}
      />

      {/* Subtle enterprise terminal grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  );
}

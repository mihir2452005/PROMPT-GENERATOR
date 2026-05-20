/**
 * High-performance offscreen HTML5 canvas-based client-side video stitching utility.
 * Stitches two video streams into a single high-definition consolidated 10s video.
 */
export async function mergeVideos(videoUrl1, videoUrl2, onProgress) {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("Stitching videos:", videoUrl1, videoUrl2);
      if (onProgress) onProgress("Initializing video stitcher...");

      // 1. Setup off-screen HTML5 video loaders
      const v1 = document.createElement("video");
      const v2 = document.createElement("video");
      
      // Allow cross-origin requests for video resources
      v1.crossOrigin = "anonymous";
      v2.crossOrigin = "anonymous";
      v1.muted = true;
      v2.muted = true;
      v1.playsInline = true;
      v2.playsInline = true;
      
      v1.src = videoUrl1;
      v2.src = videoUrl2;

      // Wait for both videos to load metadata to get target resolution
      await Promise.all([
        new Promise(res => v1.addEventListener("loadedmetadata", res, { once: true })),
        new Promise(res => v2.addEventListener("loadedmetadata", res, { once: true }))
      ]);

      const width = v1.videoWidth || 1280;
      const height = v1.videoHeight || 720;
      
      console.log(`Target stitching resolution: ${width}x${height}`);

      // 2. Prepare rendering canvas
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      // 3. Setup canvas stream recording
      const stream = canvas.captureStream(30); // 30 FPS high-fidelity capture
      
      // Support standard video MIME types across browsers
      const options = { mimeType: 'video/webm;codecs=vp9,opus' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'video/webm';
      }
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'video/mp4';
      }

      const recorder = new MediaRecorder(stream, options);
      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const mergedBlob = new Blob(chunks, { type: recorder.mimeType });
        const mergedUrl = URL.createObjectURL(mergedBlob);
        console.log("Stitching complete! Consolidated clip URL:", mergedUrl);
        resolve(mergedUrl);
      };

      // Start recording
      recorder.start();

      // Helper function to render video frames sequentially to canvas
      async function recordVideo(videoEl, startProgress, endProgress, progressMessage) {
        return new Promise((res) => {
          videoEl.currentTime = 0;
          
          videoEl.addEventListener("play", () => {
            const drawFrame = () => {
              if (videoEl.paused || videoEl.ended) {
                res();
                return;
              }
              // Draw current frame to off-screen canvas
              ctx.drawImage(videoEl, 0, 0, width, height);
              
              // Report progress dynamically
              if (onProgress && videoEl.duration) {
                const fraction = videoEl.currentTime / videoEl.duration;
                const totalProgress = startProgress + fraction * (endProgress - startProgress);
                onProgress(`${progressMessage} (${Math.round(totalProgress * 100)}%)`);
              }
              
              requestAnimationFrame(drawFrame);
            };
            requestAnimationFrame(drawFrame);
          });

          videoEl.play().catch(err => {
            console.error("Playback start blocked, using frame-by-frame draw fallback", err);
            // Fallback: draw frame by frame manually if auto-play is blocked
            let current = 0;
            const step = 1 / 30;
            const drawFallback = () => {
              if (current >= videoEl.duration) {
                res();
                return;
              }
              videoEl.currentTime = current;
              ctx.drawImage(videoEl, 0, 0, width, height);
              current += step;
              if (onProgress) {
                const fraction = current / videoEl.duration;
                const totalProgress = startProgress + fraction * (endProgress - startProgress);
                onProgress(`${progressMessage} (${Math.min(100, Math.round(totalProgress * 100))}% fallback)`);
              }
              setTimeout(drawFallback, 33);
            };
            drawFallback();
          });
        });
      }

      // 4. Stitch sequentially
      if (onProgress) onProgress("Processing Clip 1 (0%)...");
      await recordVideo(v1, 0, 0.5, "Processing Clip 1");

      if (onProgress) onProgress("Processing Clip 2 (50%)...");
      await recordVideo(v2, 0.5, 1.0, "Processing Clip 2");

      // 5. Complete stitching and save
      if (onProgress) onProgress("Finalizing cinematic compilation...");
      setTimeout(() => {
        recorder.stop();
      }, 500);

    } catch (error) {
      console.error("Video stitching crash:", error);
      reject(error);
    }
  });
}

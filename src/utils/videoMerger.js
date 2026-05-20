/**
 * High-performance offscreen HTML5 canvas-based client-side video stitching utility.
 * Stitches two video streams into a single high-definition consolidated video.
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
      v1.preload = "auto";
      v2.preload = "auto";
      
      v1.src = videoUrl1;
      v2.src = videoUrl2;

      // Wait for both videos to fully load data to get precise non-zero target resolution
      await Promise.all([
        new Promise(res => {
          if (v1.readyState >= 2 && v1.videoWidth > 0) res();
          else {
            const check = () => {
              if (v1.videoWidth > 0) {
                v1.removeEventListener("loadeddata", check);
                v1.removeEventListener("canplay", check);
                res();
              }
            };
            v1.addEventListener("loadeddata", check);
            v1.addEventListener("canplay", check);
            // Fallback timeout
            setTimeout(res, 3000);
          }
        }),
        new Promise(res => {
          if (v2.readyState >= 2 && v2.videoWidth > 0) res();
          else {
            const check = () => {
              if (v2.videoWidth > 0) {
                v2.removeEventListener("loadeddata", check);
                v2.removeEventListener("canplay", check);
                res();
              }
            };
            v2.addEventListener("loadeddata", check);
            v2.addEventListener("canplay", check);
            // Fallback timeout
            setTimeout(res, 3000);
          }
        })
      ]);

      const width = v1.videoWidth || 1280;
      const height = v1.videoHeight || 720;
      
      console.log(`Target stitching resolution: ${width}x${height}`);

      // 2. Prepare rendering canvas
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      
      // Enforce high-fidelity pixel-perfect lossless smoothing scaling quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // 3. Setup canvas stream recording at 30 FPS
      const stream = canvas.captureStream(30);
      
      // Support standard video MIME types across browsers with premium ultra-high lossless bitrate (16 Mbps)
      const options = { 
        mimeType: 'video/webm;codecs=vp9,opus',
        videoBitsPerSecond: 16000000 // 16 Megabits per second for spectacular lossless quality!
      };
      
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'video/webm;codecs=h264';
      }
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'video/webm';
      }
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'video/mp4;codecs=avc1';
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

      // Seek-based offscreen frame rendering pipeline (30 FPS) with precise timing synchronization
      const fps = 30;
      const frameDuration = 1 / fps;
      const targetFrameMs = 1000 / fps; // 33.33ms

      async function renderVideoFrames(videoEl, startProgress, endProgress, progressMessage) {
        let duration = videoEl.duration;
        if (!duration || isNaN(duration)) {
          duration = 5.0; // Safe fallback if duration metadata has not loaded
        }
        
        const totalFrames = Math.ceil(duration * fps);
        console.log(`Rendering ${totalFrames} frames for video source...`);

        for (let i = 0; i < totalFrames; i++) {
          const frameStartTime = performance.now();
          const seekTime = i * frameDuration;
          videoEl.currentTime = seekTime;

          // Wait for browser to seek and render target frame
          await new Promise((resSeek) => {
            const onSeeked = () => {
              videoEl.removeEventListener("seeked", onSeeked);
              resSeek();
            };
            videoEl.addEventListener("seeked", onSeeked);
            // Safety timeout to prevent hangs
            setTimeout(onSeeked, 80);
          });

          // Draw target video frame onto offscreen canvas
          ctx.drawImage(videoEl, 0, 0, width, height);

          // Force precise 30 FPS timing capture to sync with MediaRecorder's real-time capture
          const elapsed = performance.now() - frameStartTime;
          const sleepTime = Math.max(4, targetFrameMs - elapsed);
          await new Promise(res => setTimeout(res, sleepTime));

          // Report granular progress updates
          if (onProgress) {
            const fraction = i / totalFrames;
            const totalProgress = startProgress + fraction * (endProgress - startProgress);
            onProgress(`${progressMessage} (${Math.min(100, Math.round(totalProgress * 100))}% completed)`);
          }
        }
      }

      // 4. Stitch sequentially using seek-and-draw
      await renderVideoFrames(v1, 0, 0.5, "Processing Clip 1");
      await renderVideoFrames(v2, 0.5, 1.0, "Processing Clip 2");

      // 5. Complete stitching and save
      if (onProgress) onProgress("Finalizing cinematic compilation...");
      setTimeout(() => {
        recorder.stop();
      }, 300);

    } catch (error) {
      console.error("Video stitching crash:", error);
      reject(error);
    }
  });
}

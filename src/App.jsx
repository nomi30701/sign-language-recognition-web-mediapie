import "./assets/App.css";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  GestureRecognizer,
  FilesetResolver,
  DrawingUtils,
} from "@mediapipe/tasks-vision";

// set Components
function SettingsPanel({
  cameraSelectorRef,
  cameras,
  gestureRecognizerRef,
  imgSrc,
  camera_stream,
  modelState,
  setModelState,
}) {
  return (
    <div className="container text-lg flex flex-col md:flex-row md:justify-evenly gap-2 md:gap-6">
      <div>
        <label htmlFor="device-selector">delegate:</label>
        <select
          name="device-selector"
          onChange={async (e) => {
            try {
              setModelState((prev) => ({
                ...prev,
                statusMsg: "Switching delegate...",
                statusColor: "orange",
                isLoaded: false,
              }));
              setTimeout(async () => {
                try {
                  await gestureRecognizerRef.current.setOptions({
                    delegate: e.target.value,
                    runningMode: modelState.runningMode,
                    numHands: 2,
                  });

                  setModelState((prev) => ({
                    ...prev,
                    statusMsg: `Delegate switched to ${e.target.value}`,
                    statusColor: "green",
                    isLoaded: true,
                  }));
                } catch (error) {
                  console.error("Switch delegate falid", error);
                  setModelState((prev) => ({
                    ...prev,
                    statusMsg: "Switch delegate falid",
                    statusColor: "red",
                  }));
                }
              }, 50);
            } catch (error) {
              console.error("Switch delegate falid: ", error);
            }
          }}
          disabled={imgSrc || camera_stream}
        >
          <option value="GPU">webGL(GPU)</option>
          <option value="CPU">Wasm(CPU)</option>
        </select>
      </div>
      <div>
        <label htmlFor="camera-selector">Camera:</label>
        <select ref={cameraSelectorRef} disabled={camera_stream}>
          {cameras.map((camera, index) => (
            <option key={index} value={camera.deviceId}>
              {camera.label || `Camera ${index + 1}`}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

// Display Components
function ImageDisplay({
  inputCanvasRef,
  cameraRef,
  imgRef,
  overlayRef,
  imgSrc,
  camera_stream,
  onCameraLoad,
  onImageLoad,
}) {
  return (
    <div className="container bg-stone-700 shadow-lg relative min-h-[320px] flex justify-center items-center">
      <canvas ref={inputCanvasRef} hidden></canvas>
      <video
        className="block w-full max-w-full md:max-w-[720px] max-h-[640px] rounded-lg inset-0 mx-auto"
        ref={cameraRef}
        onLoadedData={onCameraLoad}
        hidden={!camera_stream}
        autoPlay
      />
      <img
        id="img"
        ref={imgRef}
        src={imgSrc}
        onLoad={onImageLoad}
        hidden={camera_stream}
        className="block md:max-w-[720px] max-h-[640px] rounded-lg"
      />
      <canvas ref={overlayRef} className="absolute"></canvas>
    </div>
  );
}

// button Components
function ControlButtons({
  camera_stream,
  cameras,
  imgSrc,
  isModelLoaded,
  openImageRef,
  onOpenImageClick,
  onToggleCamera,
}) {
  return (
    <div id="btn-container" className="container flex justify-around gap-x-4">
      <input
        type="file"
        accept="image/*"
        hidden
        ref={openImageRef}
        onChange={(e) => {
          if (e.target.files[0]) {
            const file = e.target.files[0];
            const imgUrl = URL.createObjectURL(file);
            onOpenImageClick(imgUrl);
            e.target.value = null;
          }
        }}
      />
      <button
        className="btn"
        disabled={camera_stream || !isModelLoaded}
        onClick={() =>
          imgSrc ? onOpenImageClick() : openImageRef.current.click()
        }
      >
        {imgSrc ? "Close Image" : "Open Image"}
      </button>

      <button
        className="btn"
        onClick={onToggleCamera}
        disabled={cameras.length === 0 || imgSrc || !isModelLoaded}
      >
        {camera_stream ? "Close Camera" : "Open Camera"}
      </button>
    </div>
  );
}

// result table Components
function ResultsTable({ results }) {
  if (!results || !results.handedness) {
    return (
      <details className="text-gray-200 group px-2">
        <summary className="my-2 hover:text-gray-400 cursor-pointer transition-colors duration-300">
          Detection Results
        </summary>
        <div className="transition-all duration-300 ease-in-out transform origin-top group-open:animate-details-show">
          <p className="text-center text-gray-400 py-2">
            No hand gestures detected
          </p>
        </div>
      </details>
    );
  }

  return (
    <details className="text-gray-200 group px-2">
      <summary className="my-2 hover:text-gray-400 cursor-pointer transition-colors duration-300">
        Detection Results ({results.handedness.length})
      </summary>
      <div
        className="transition-all duration-300 ease-in-out transform origin-top
                group-open:animate-details-show"
      >
        <table
          className="text-left mx-auto border-collapse table-auto text-sm 
              bg-gray-800 rounded-md overflow-hidden max-w-[320px]"
        >
          <thead className="bg-gray-700">
            <tr>
              <th className="border-b border-gray-600 p-1 md:p-2 text-gray-100">
                #
              </th>
              <th className="border-b border-gray-600 p-1 md:p-2 text-gray-100">
                hand
              </th>
              <th className="border-b border-gray-600 p-1 md:p-2 text-gray-100">
                Gesture
              </th>
              <th className="border-b border-gray-600 p-1 md:p-2 text-gray-100">
                Confidence
              </th>
            </tr>
          </thead>
          <tbody>
            {results.handedness.map((hand, idx) => (
              <tr
                key={idx}
                className="hover:bg-gray-700 transition-colors text-gray-300"
              >
                <td className="border-b border-gray-600 px-2 py-1 text-center">
                  {idx + 1}
                </td>
                <td className="border-b border-gray-600 px-2 py-1">
                  {hand[0]?.categoryName === "Left" ? "Left" : "Right"}
                  <span className="text-xs text-gray-400 ml-1">
                    ({(hand[0]?.score * 100 || 0).toFixed(0)}%)
                  </span>
                </td>
                <td className="border-b border-gray-600 px-2 py-1">
                  {results.gestures?.[idx]?.[0]?.categoryName === "None"
                    ? "None"
                    : results.gestures?.[idx]?.[0]?.categoryName || "Unknown"}
                </td>
                <td className="border-b border-gray-600 px-2 py-1 text-right">
                  {(results.gestures?.[idx]?.[0]?.score * 100 || 0).toFixed(0)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

// model status Components
function ModelStatus({ warnUpTime, inferenceTime, statusMsg, statusColor }) {
  return (
    <div id="model-status-container" className="text-xl md:text-2xl px-2">
      <div
        id="inferenct-time-container"
        className="flex flex-col md:flex-row md:justify-evenly text-lg md:text-xl my-4 md:my-6"
      >
        <p className="mb-2 md:mb-0">
          Warm up time: <span className="text-lime-500">{warnUpTime}ms</span>
        </p>
        <p>
          Inference time:{" "}
          <span className="text-lime-500">{inferenceTime}ms</span>
        </p>
      </div>
      <p
        className={statusColor !== "green" ? "animate-text-loading" : ""}
        style={{ color: statusColor }}
      >
        {statusMsg}
      </p>
    </div>
  );
}

function App() {
  const [modelState, setModelState] = useState({
    isLoaded: false,
    warnUpTime: 0,
    inferenceTime: 0,
    statusMsg: "Model not loaded",
    statusColor: "inherit",
    runningMode: "IMAGE",
  });
  const {
    isLoaded: isModelLoaded,
    warnUpTime,
    inferenceTime,
    statusMsg,
    statusColor,
    runningMode,
  } = modelState;

  // resource reference
  const cameraSelectorRef = useRef(null);
  const gestureRecognizerRef = useRef(null);
  const drawingUtilsRef = useRef(null);

  // content reference
  const imgRef = useRef(null);
  const overlayRef = useRef(null);
  const cameraRef = useRef(null);
  const inputCanvasRef = useRef(null);
  const openImageRef = useRef(null);

  // state
  const [cameras, setCameras] = useState([]);
  const [camera_stream, setCameraStream] = useState(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [handResults, setHandResults] = useState([]);

  // init
  useEffect(() => {
    loadMediaPipeModel();
    getCameras();

    return () => {
      // cleanup
      if (camera_stream) {
        camera_stream.getTracks().forEach((track) => track.stop());
      }

      if (imgSrc && imgSrc.startsWith("blob:")) {
        URL.revokeObjectURL(imgSrc);
      }

      // Close MediaPipe model
      if (gestureRecognizerRef.current) {
        gestureRecognizerRef.current.close();
      }
    };
  }, []);

  const loadMediaPipeModel = async () => {
    // update model state
    setModelState((prev) => ({
      ...prev,
      statusMsg: "Loading MediaPipe model...",
      statusColor: "red",
      isLoaded: false,
      runningMode: "IMAGE",
    }));

    try {
      const start = performance.now();

      // Load the GestureRecognizer model
      const vision = await FilesetResolver.forVisionTasks("./wasm");

      gestureRecognizerRef.current = await GestureRecognizer.createFromOptions(
        vision,
        {
          baseOptions: {
            modelAssetPath: `./models/gesture_recognizer.task`,
            delegate: "GPU",
          },
          runningMode: "IMAGE",
          numHands: 2,
        }
      );

      const end = performance.now();

      // Create drawing utilities
      drawingUtilsRef.current = new DrawingUtils(
        overlayRef.current.getContext("2d")
      );

      setModelState((prev) => ({
        ...prev,
        statusMsg: "MediaPipe model loaded",
        statusColor: "green",
        warnUpTime: (end - start).toFixed(2),
        isLoaded: true,
      }));
    } catch (error) {
      setModelState((prev) => ({
        ...prev,
        statusMsg: "MediaPipe model loading failed",
        statusColor: "red",
        isLoaded: false,
      }));
      console.error(error);
    }
  };

  const getCameras = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(
        (device) => device.kind === "videoinput"
      );
      setCameras(videoDevices);
    } catch (err) {
      console.error("Error getting cameras:", err);
    }
  }, []);

  const handle_OpenImage = useCallback(
    (imgUrl = null) => {
      if (imgUrl) {
        setImgSrc(imgUrl);
      } else if (imgSrc) {
        if (imgSrc.startsWith("blob:")) {
          URL.revokeObjectURL(imgSrc);
        }
        setImgSrc("");
        if (overlayRef.current) {
          overlayRef.current.width = 0;
          overlayRef.current.height = 0;
          overlayRef.current.style.width = `0px`;
          overlayRef.current.style.height = `0px`;
        }
        setHandResults([]);
      }
    },
    [imgSrc]
  );

  const handle_ImageLoad = useCallback(async () => {
    if (!imgRef.current || !overlayRef.current || !gestureRecognizerRef.current)
      return;

    overlayRef.current.width = imgRef.current.width;
    overlayRef.current.height = imgRef.current.height;

    overlayRef.current.style.width = `${imgRef.current.width}px`;
    overlayRef.current.style.height = `${imgRef.current.height}px`;

    try {
      if (runningMode !== "IMAGE") {
        gestureRecognizerRef.current.setOptions({
          runningMode: "IMAGE",
          numHands: 2,
        });
        setModelState((prev) => ({
          ...prev,
          runningMode: "IMAGE",
        }));
      }

      const start = performance.now();

      // Process the image
      const results = gestureRecognizerRef.current.recognize(imgRef.current);

      const end = performance.now();
      const processingTime = (end - start).toFixed(2);

      // Draw results
      if (results.landmarks) {
        for (const landmarks of results.landmarks) {
          drawingUtilsRef.current.drawConnectors(
            landmarks,
            GestureRecognizer.HAND_CONNECTIONS,
            { color: "#00FF00", lineWidth: 3 }
          );
          drawingUtilsRef.current.drawLandmarks(landmarks, {
            color: "#FF0000",
            lineWidth: 1,
          });
        }
      }

      setHandResults(results.gestures.length > 0 ? results : []);
      setModelState((prev) => ({
        ...prev,
        inferenceTime: processingTime,
      }));
    } catch (error) {
      console.error("Image processing error:", error);
    }
  }, [runningMode]);

  const handle_ToggleCamera = useCallback(async () => {
    if (camera_stream) {
      // stop camera
      camera_stream.getTracks().forEach((track) => track.stop());
      cameraRef.current.srcObject = null;
      setCameraStream(null);
      overlayRef.current.width = 0;
      overlayRef.current.height = 0;
      overlayRef.current.style.width = `0px`;
      overlayRef.current.style.height = `0px`;

      setHandResults([]);
    } else if (cameraSelectorRef.current && cameraSelectorRef.current.value) {
      try {
        // Set running mode to VIDEO before starting camera
        if (runningMode !== "VIDEO" && gestureRecognizerRef.current) {
          gestureRecognizerRef.current.setOptions({
            runningMode: "VIDEO",
            numHands: 2,
          });
          setModelState((prev) => ({
            ...prev,
            runningMode: "VIDEO",
          }));
        }

        // open camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: cameraSelectorRef.current.value,
          },
          audio: false,
        });
        setCameraStream(stream);
        cameraRef.current.srcObject = stream;
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    }
  }, [camera_stream, runningMode]);

  const handle_cameraLoad = useCallback(() => {
    if (
      !cameraRef.current ||
      !overlayRef.current ||
      !gestureRecognizerRef.current
    )
      return;

    // set overlay size same as camera size
    overlayRef.current.width = cameraRef.current.videoWidth;
    overlayRef.current.height = cameraRef.current.videoHeight;

    // set css overlay size same as camera size
    const videoRect = cameraRef.current.getBoundingClientRect();
    overlayRef.current.style.width = `${videoRect.width}px`;
    overlayRef.current.style.height = `${videoRect.height}px`;

    // start video frames
    handle_frame_continuous();
  }, []);

  const handle_frame_continuous = useCallback(async () => {
    if (!cameraRef.current?.srcObject || !gestureRecognizerRef.current) return;

    // 30fps
    const now = performance.now();
    if (!window.lastFrameTime || now - window.lastFrameTime > 33) {
      window.lastFrameTime = now;

      try {
        const start = performance.now();

        // Process the current frame
        const results = gestureRecognizerRef.current.recognizeForVideo(
          cameraRef.current,
          now
        );

        const end = performance.now();
        const processingTime = (end - start).toFixed(2);

        // Clear canvas
        const ctx = overlayRef.current.getContext("2d");
        ctx.clearRect(
          0,
          0,
          overlayRef.current.width,
          overlayRef.current.height
        );

        // Draw landmarks
        if (results.landmarks) {
          for (const landmarks of results.landmarks) {
            drawingUtilsRef.current.drawConnectors(
              landmarks,
              GestureRecognizer.HAND_CONNECTIONS,
              { color: "#00FF00", lineWidth: 5 }
            );
            drawingUtilsRef.current.drawLandmarks(landmarks, {
              color: "#FF0000",
              lineWidth: 2,
            });
          }
        }

        // Update results state without causing re-renders on every frame
        const hasResults = results.gestures && results.gestures.length > 0;
        if (
          hasResults &&
          JSON.stringify(results) !== JSON.stringify(handResults)
        ) {
          setHandResults(results);
        } else if (!hasResults && handResults.length > 0) {
          setHandResults([]);
        }

        // Update inference time
        if (processingTime !== inferenceTime) {
          setModelState((prev) => ({
            ...prev,
            inferenceTime: processingTime,
          }));
        }
      } catch (error) {
        console.error("Frame processing error:", error);
      }
    }

    // next frame
    requestAnimationFrame(handle_frame_continuous);
  }, [handResults, inferenceTime]);

  return (
    <>
      <h1 className="my-4 md:my-8 text-3xl md:text-4xl px-2">
        Hand Gesture Recognition with MediaPipe
      </h1>

      <SettingsPanel
        cameraSelectorRef={cameraSelectorRef}
        cameras={cameras}
        gestureRecognizerRef={gestureRecognizerRef}
        imgSrc={imgSrc}
        camera_stream={camera_stream}
        modelState={modelState}
        setModelState={setModelState}
      />

      <ImageDisplay
        inputCanvasRef={inputCanvasRef}
        cameraRef={cameraRef}
        imgRef={imgRef}
        overlayRef={overlayRef}
        imgSrc={imgSrc}
        camera_stream={camera_stream}
        onCameraLoad={handle_cameraLoad}
        onImageLoad={handle_ImageLoad}
      />

      <ControlButtons
        camera_stream={camera_stream}
        cameras={cameras}
        imgSrc={imgSrc}
        isModelLoaded={isModelLoaded}
        openImageRef={openImageRef}
        onOpenImageClick={handle_OpenImage}
        onToggleCamera={handle_ToggleCamera}
      />
      <ResultsTable results={handResults} />

      <ModelStatus
        warnUpTime={warnUpTime}
        inferenceTime={inferenceTime}
        statusMsg={statusMsg}
        statusColor={statusColor}
      />
    </>
  );
}

export default App;

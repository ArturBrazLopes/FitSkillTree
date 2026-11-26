import argparse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import sys
from threading import Lock, Thread

import cv2
import mediapipe as mp
import numpy as np


MODEL = Path(__file__).resolve().parent / "models" / "pose_landmarker_lite.task"
MAX_FRAME_BYTES = 2 * 1024 * 1024


class PoseServer(ThreadingHTTPServer):
    def __init__(self, address, detector):
        super().__init__(address, PoseHandler)
        self.detector = detector
        self.detector_lock = Lock()

    def detect(self, frame):
        height, width = frame.shape[:2]
        if max(width, height) > 640:
            scale = 640 / max(width, height)
            frame = cv2.resize(frame, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)

        with self.detector_lock:
            result = self.detector.detect(image)
        poses = result.pose_landmarks
        world = result.pose_world_landmarks

        return {
            "aspectRatio": width / height,
            "landmarks": [
                {"x": point.x, "y": point.y, "visibility": point.visibility or 0.0}
                for point in (poses[0] if poses else [])
            ],
            "worldLandmarks": [
                {"x": point.x, "y": point.y, "z": point.z}
                for point in (world[0] if world else [])
            ],
        }


class PoseHandler(BaseHTTPRequestHandler):
    def setup(self):
        self.request.settimeout(5)
        super().setup()

    def respond(self, status, body):
        data = json.dumps(body, allow_nan=False).encode("utf-8")
        try:
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
        except (ConnectionError, TimeoutError):
            pass

    def do_GET(self):
        if self.path == "/health":
            self.respond(200, {"status": "ok", "service": "fittechtree-pose"})
        else:
            self.respond(404, {"error": "Endpoint desconhecido."})

    def do_POST(self):
        if self.path != "/pose":
            self.respond(404, {"error": "Endpoint desconhecido."})
            return
        if self.headers.get_content_type() != "image/jpeg":
            self.respond(415, {"error": "Envie um JPEG."})
            return

        try:
            size = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            size = 0
        if not 0 < size <= MAX_FRAME_BYTES:
            self.respond(413 if size > MAX_FRAME_BYTES else 400, {"error": "Tamanho de imagem inválido."})
            return

        try:
            data = self.rfile.read(size)
            frame = cv2.imdecode(np.frombuffer(data, dtype=np.uint8), cv2.IMREAD_COLOR) if data.startswith(b"\xff\xd8") else None
        except (cv2.error, TimeoutError):
            frame = None
        if frame is None:
            self.respond(400, {"error": "JPEG inválido."})
            return

        try:
            self.respond(200, self.server.detect(frame))
        except (RuntimeError, ValueError, cv2.error):
            self.log_error("Falha ao analisar um quadro.")
            self.respond(500, {"error": "Falha ao analisar o quadro."})

    def log_request(self, code="-", size="-"):
        if str(code) != "200":
            super().log_request(code, size)


def main():
    parser = argparse.ArgumentParser(description="Servidor local de pose do FitSkillTree")
    parser.add_argument("--port", default=0, type=int)
    parser.add_argument("--metro", action="store_true")
    args = parser.parse_args()

    options = mp.tasks.vision.PoseLandmarkerOptions(
        base_options=mp.tasks.BaseOptions(model_asset_path=str(MODEL)),
        num_poses=1,
    )
    with mp.tasks.vision.PoseLandmarker.create_from_options(options) as detector:
        with PoseServer(("127.0.0.1", args.port), detector) as server:
            if args.metro:
                def stop_when_metro_exits():
                    sys.stdin.buffer.read(1)
                    server.shutdown()

                Thread(target=stop_when_metro_exits, daemon=True).start()
            print(server.server_port, flush=True)
            try:
                server.serve_forever()
            except KeyboardInterrupt:
                pass


if __name__ == "__main__":
    main()

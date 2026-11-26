const { spawn } = require('node:child_process');
const { existsSync } = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const readline = require('node:readline');

const routes = {
  '/_fittechtree/health': { method: 'GET', target: '/health' },
  '/_fittechtree/pose': { method: 'POST', target: '/pose' },
};
const maxFrameBytes = 2 * 1024 * 1024;

function createPoseMiddleware(root) {
  let backend;
  let activeFrames = 0;

  function getBackend() {
    if (backend) return backend.ready;

    const windows = process.platform === 'win32';
    const virtualPython = path.join(root, '.venv', windows ? 'Scripts' : 'bin', windows ? 'python.exe' : 'python');
    const python = process.env.FITTECHTREE_PYTHON || (existsSync(virtualPython) ? virtualPython : windows ? 'python' : 'python3');
    const child = spawn(python, ['-u', path.join(root, 'server', 'pose_server.py'), '--metro'], {
      cwd: root,
      env: { ...process.env, MPLCONFIGDIR: process.env.MPLCONFIGDIR || path.join(root, '.expo', 'pose-cache') },
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    });

    const stop = () => child.stdin.end();
    child.stdin.on('error', () => {});
    process.once('exit', stop);
    let errors = '';
    child.stderr.on('data', (chunk) => { errors = (errors + chunk.toString()).slice(-2000); });
    const ready = new Promise((resolve, reject) => {
      const output = readline.createInterface({ input: child.stdout });
      const timer = setTimeout(() => {
        stop();
        reject(new Error('O MediaPipe demorou para iniciar.'));
      }, 25000);

      function clearBackend() {
        clearTimeout(timer);
        output.close();
        process.removeListener('exit', stop);
        if (backend?.child === child) backend = undefined;
      }

      child.once('error', (error) => {
        clearBackend();
        reject(error);
      });
      child.once('exit', (code) => {
        clearBackend();
        reject(new Error(errors.trim() || `O servidor de pose encerrou (${code}).`));
      });
      output.on('line', (line) => {
        const port = Number(line);
        if (!Number.isInteger(port) || port < 1 || port > 65535) return;
        clearTimeout(timer);
        output.close();
        resolve(port);
      });
    });
    backend = { ready, child };
    void ready.catch((error) => {
      console.warn(`[FitSkillTree] Falha ao iniciar o MediaPipe. Confira o ambiente Python no README. ${error.message}`);
    });
    return ready;
  }

  return function poseMiddleware(request, response, next) {
    const endpoint = Object.hasOwn(routes, request.url) ? routes[request.url] : undefined;
    if (!endpoint) return next();

    function sendError(status, error) {
      if (response.destroyed || response.writableEnded) return;
      if (response.headersSent) return response.destroy();
      response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      response.end(JSON.stringify({ error }));
    }

    if (request.method !== endpoint.method) return sendError(405, 'Método inválido.');
    const isFrame = endpoint.method === 'POST';
    const length = Number(request.headers['content-length']);
    if (isFrame) {
      if (request.headers['content-type'] !== 'image/jpeg') return sendError(415, 'Envie um JPEG.');
      if (!Number.isInteger(length) || length < 1) return sendError(400, 'Tamanho de imagem inválido.');
      if (length > maxFrameBytes) return sendError(413, 'Imagem grande demais.');
      if (activeFrames >= 2) return sendError(503, 'Detector ocupado.');
      activeFrames += 1;
      response.once('close', () => { activeFrames -= 1; });
    }

    void getBackend().then((port) => {
      if (response.destroyed) return;
      const upstream = http.request({
        hostname: '127.0.0.1', port, method: endpoint.method, path: endpoint.target,
        headers: isFrame ? { 'Content-Type': 'image/jpeg', 'Content-Length': length } : undefined,
      }, (result) => {
        if (response.destroyed) {
          result.destroy();
          return;
        }
        response.writeHead(result.statusCode, {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        });
        result.on('error', () => response.destroy());
        result.pipe(response);
      });
      upstream.setTimeout(5000, () => upstream.destroy());
      upstream.once('error', () => sendError(503, 'Servidor de pose indisponível.'));
      response.once('close', () => upstream.destroy());
      if (isFrame) request.pipe(upstream);
      else upstream.end();
    }).catch(() => sendError(503, 'Servidor de pose indisponível.'));
  };
}

module.exports = { createPoseMiddleware };

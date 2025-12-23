const { spawn } = require('child_process');
const path = require('path');
const logger = require('../utils/logger');

class LspService {
    constructor() {
        this.sessions = new Map(); // socketId -> { process, buffer: Buffer }
    }

    emitDebug(socket, msg) {
        socket.emit('lsp-debug', msg);
    }

    startSession(socket, language) {
        console.log(`[LSP-SERVICE] startSession called for socket ${socket.id} with language ${language}`);
        if (this.sessions.has(socket.id)) {
            this.endSession(socket.id);
        }

        const CONFIG = {
            'javascript': { cmd: 'typescript-language-server', args: ['--stdio'], type: 'npm' },
            'typescript': { cmd: 'typescript-language-server', args: ['--stdio'], type: 'npm' },
            'nodejs': { cmd: 'typescript-language-server', args: ['--stdio'], type: 'npm' },

            'python': { cmd: 'pyright-langserver', args: ['--stdio'], type: 'npm' },
            'python3': { cmd: 'pyright-langserver', args: ['--stdio'], type: 'npm' },

            'bash': { cmd: 'bash-language-server', args: ['start'], type: 'npm' },
            'sh': { cmd: 'bash-language-server', args: ['start'], type: 'npm' },

            'html': { cmd: 'vscode-html-language-server', args: ['--stdio'], type: 'npm' },
            'css': { cmd: 'vscode-css-language-server', args: ['--stdio'], type: 'npm' },
            'json': { cmd: 'vscode-json-language-server', args: ['--stdio'], type: 'npm' },

            // Native/System servers
            'cpp': { cmd: 'clangd', args: [], type: 'system' },
            'c': { cmd: 'clangd', args: [], type: 'system' },
            'go': { cmd: 'gopls', args: [], type: 'system' },
            'rust': { cmd: 'rust-analyzer', args: [], type: 'system' },
            'java': { cmd: 'jdtls', args: [], type: 'system' }
        };

        const config = CONFIG[language];
        if (!config) {
            this.emitDebug(socket, `Unsupported language for LSP: ${language}`);
            return;
        }

        let lspCmd = config.cmd;
        let lspArgs = config.args;

        this.emitDebug(socket, `Configuring LSP for ${language}`);

        if (config.type === 'npm') {
            try {
                // Try direct binary path in node_modules
                const binPath = path.join(process.cwd(), 'node_modules', '.bin', config.cmd);
                this.emitDebug(socket, `Using NPM binary at ${binPath}`);
                lspCmd = binPath;
            } catch (err) {
                this.emitDebug(socket, `Failed to resolve npm binary: ${err.message}`);
                return;
            }
        } else {
            this.emitDebug(socket, `Using System binary: ${lspCmd}`);
        }

        this.emitDebug(socket, `Spawning: ${lspCmd} ${lspArgs.join(' ')}`);

        try {
            const lspProcess = spawn(lspCmd, lspArgs, {
                cwd: process.cwd(),
                env: process.env
            });

            // Init buffer as Buffer
            const session = {
                process: lspProcess,
                buffer: Buffer.alloc(0)
            };
            this.sessions.set(socket.id, session);

            logger.info(`LSP Session started for ${socket.id} (${language})`);
            this.emitDebug(socket, 'Process spawned');

            // Handle LSP Output (JSON-RPC)
            lspProcess.stdout.on('data', (data) => {
                // data is Buffer by default from spawn stdout if encoding not set
                this.handleLspOutput(socket, session, data);
            });

            lspProcess.stderr.on('data', (data) => {
                this.emitDebug(socket, `STDERR: ${data}`);
            });

            lspProcess.on('app-exit', (code) => {
                this.emitDebug(socket, `LSP exited with code ${code}`);
                this.sessions.delete(socket.id);
            });

            lspProcess.on('error', (err) => {
                this.emitDebug(socket, `LSP spawn error: ${err.message}`);
                if (err.code === 'ENOENT') {
                    this.emitDebug(socket, `Binary not found. Please install ${config.cmd}.`);
                }
            });

        } catch (e) {
            this.emitDebug(socket, `Spawn exception: ${e.message}`);
        }
    }

    handleLspOutput(socket, session, chunk) {
        // Ensure chunk is a buffer
        const chunkBuf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        session.buffer = Buffer.concat([session.buffer, chunkBuf]);

        while (true) {
            // Check for the header separator \r\n\r\n
            const separatorIndex = session.buffer.indexOf('\r\n\r\n');

            if (separatorIndex === -1) {
                break; // Not enough data for header
            }

            // Extract valid header section as string (headers are always ASCII)
            const headerSection = session.buffer.subarray(0, separatorIndex).toString('ascii');

            // Parse Content-Length
            const lengthMatch = headerSection.match(/Content-Length: (\d+)/i);
            if (!lengthMatch) {
                // Invalid header. Discard this section and the separator.
                console.error('[LSP-SERVICE] Malformed header:', headerSection);
                session.buffer = session.buffer.subarray(separatorIndex + 4);
                continue;
            }

            const contentLen = parseInt(lengthMatch[1], 10);
            const bodyStart = separatorIndex + 4;

            if (session.buffer.length >= bodyStart + contentLen) {
                // We have the full body
                // Slice in BYTES
                const messageBuf = session.buffer.subarray(bodyStart, bodyStart + contentLen);

                // Remove processed message from buffer
                session.buffer = session.buffer.subarray(bodyStart + contentLen);

                try {
                    const messageStr = messageBuf.toString('utf8');
                    const json = JSON.parse(messageStr);
                    socket.emit('lsp-notification', json);
                } catch (e) {
                    console.error('[LSP-SERVICE] Failed to parse LSP response', e.message);
                }
            } else {
                break; // Wait for more body data
            }
        }
    }

    handleClientMessage(socket, message) {
        const session = this.sessions.get(socket.id);
        if (!session || !session.process) {
            this.emitDebug(socket, 'No session found for input');
            return;
        }

        const str = JSON.stringify(message);
        const request = `Content-Length: ${Buffer.byteLength(str, 'utf8')}\r\n\r\n${str}`;
        session.process.stdin.write(request);
    }

    endSession(socketId) {
        const session = this.sessions.get(socketId);
        if (session) {
            session.process.kill();
            this.sessions.delete(socketId);
            logger.info(`LSP Session ended for ${socketId}`);
        }
    }
}

module.exports = new LspService();

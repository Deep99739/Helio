export class LspAdapter {
    constructor(socket, editor) {
        this.socket = socket;
        this.editor = editor;
        this.isConnected = false;
        this.isInitialized = false;
        this.pendingRequests = [];

        this.setupSocketListeners();
    }

    setupSocketListeners() {
        this.socket.on('lsp-notification', (data) => {
            this.handleLspMessage(data);
        });
        this.socket.on('lsp-debug', (msg) => {
            console.log('[LSP-DEBUG]', msg);
        });
    }

    start(language) {
        if (this.isConnected) return;
        this.socket.emit('lsp-start', { language });
        this.isConnected = true;
        this.sendInitialize();
    }

    sendInitialize() {
        // LSP Initialize Request
        const requestId = Date.now();
        const request = {
            jsonrpc: '2.0',
            id: requestId,
            method: 'initialize',
            params: {
                processId: null, // We are a proxy, so maybe null?
                rootUri: null,
                capabilities: {
                    textDocument: {
                        completion: {
                            completionItem: {
                                snippetSupport: false // CM5 simple hints don't support snippets easily
                            }
                        }
                    }
                },
                trace: 'off'
            }
        };

        const responseHandler = (data) => {
            if (data.id === requestId) {
                this.socket.off('lsp-notification', responseHandler);
                console.log('[LSP] Initialized', data);
                this.isInitialized = true;
                this.sendInitialized();
                // Send open for current content
                this.sendOpen(this.editor.getValue());
            }
        };

        this.socket.on('lsp-notification', responseHandler);
        this.socket.emit('lsp-input', request);
    }

    sendInitialized() {
        const notification = {
            jsonrpc: '2.0',
            method: 'initialized',
            params: {}
        };
        this.socket.emit('lsp-input', notification);
    }

    async getHints(cm, callback, options) {
        if (!this.isInitialized) {
            console.warn('[LSP] Not initialized yet');
            callback({ list: [], from: cm.getCursor(), to: cm.getCursor() });
            return;
        }

        const cursor = cm.getCursor();
        const content = cm.getValue();

        // Ensure changes are synced (we send didChange on every change event, but race conditions?)
        // Assuming Editor `sendChange` handles it.

        const requestId = Date.now();
        const request = {
            jsonrpc: '2.0',
            id: requestId,
            method: 'textDocument/completion',
            params: {
                textDocument: { uri: 'file:///temp.js' },
                position: { line: cursor.line, character: cursor.ch }
            }
        };

        const responseHandler = (data) => {
            if (data.id === requestId) {
                this.socket.off('lsp-notification', responseHandler);
                if (data.result) {
                    const hints = this.mapLspItemsToHints(data.result, cursor);
                    callback(hints);
                } else {
                    callback({ list: [], from: cursor, to: cursor });
                }
            }
        };

        this.socket.on('lsp-notification', responseHandler);
        this.socket.emit('lsp-input', request);

        // 5s Timeout
        setTimeout(() => {
            this.socket.off('lsp-notification', responseHandler);
        }, 5000);
    }

    sendChange(content) {
        if (!this.isInitialized) return;

        const notification = {
            jsonrpc: '2.0',
            method: 'textDocument/didChange',
            params: {
                textDocument: { uri: 'file:///temp.js', version: 1 }, // TODO: Increment version
                contentChanges: [{ text: content }]
            }
        };
        this.socket.emit('lsp-input', notification);
    }

    sendOpen(content) {
        const notification = {
            jsonrpc: '2.0',
            method: 'textDocument/didOpen',
            params: {
                textDocument: { uri: 'file:///temp.js', languageId: 'javascript', version: 1, text: content }
            }
        };
        this.socket.emit('lsp-input', notification);
    }

    handleLspMessage(data) {
        // Can handle diagnostics here later
    }

    mapLspItemsToHints(result, cursor) {
        const items = Array.isArray(result) ? result : result.items;
        if (!items) return { list: [], from: cursor, to: cursor };

        // Calculate `from` (start of current word)
        const token = this.editor.getTokenAt(cursor);

        // Identify the "typed" text to filter against
        // If token is a word/property, use its string.
        let filterText = "";
        let start = cursor;
        let end = cursor;

        if (token.type && token.string.trim().length > 0) {
            filterText = token.string;
            start = { line: cursor.line, ch: token.start };
            end = { line: cursor.line, ch: token.end };
        }

        // Filter items
        const filteredItems = items.filter(item => {
            if (!filterText) return true;
            return item.label.toLowerCase().startsWith(filterText.toLowerCase());
        });

        const mapped = filteredItems.map(item => {
            return {
                text: item.insertText || item.label,
                displayText: item.label + (item.detail ? ` (${item.detail})` : ''),
                render: (elt, data, cur) => {
                    const wrapper = document.createElement('div');
                    wrapper.style.display = 'flex';
                    wrapper.style.justifyContent = 'space-between';

                    const text = document.createElement('span');
                    text.textContent = item.label;
                    text.style.fontWeight = 'bold';

                    const detail = document.createElement('span');
                    detail.textContent = item.detail || '';
                    detail.style.opacity = '0.6';
                    detail.style.fontSize = '0.8em';
                    detail.style.marginLeft = '10px';

                    wrapper.appendChild(text);
                    wrapper.appendChild(detail);
                    elt.appendChild(wrapper);
                }
            };
        });

        return {
            list: mapped,
            from: start,
            to: end
        };
    }
}

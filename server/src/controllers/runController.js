// runController.js
// using curl via child_process to bypass Node network issues

const { spawn } = require('child_process');
const logsController = require('./logsController');

exports.runCode = async (req, res) => {
    const { language, code, input, roomId, username } = req.body;

    if (!code) {
        return res.status(400).json({ error: "Code is required" });
    }

    // ... languageMap ...

    const languageMap = {
        "python3": "python",
        "c": "c",
        "cpp": "cpp",
        "java": "java",
        "nodejs": "javascript",
        "ruby": "ruby",
        "go": "go",
        "scala": "scala",
        "bash": "bash",
        "sql": "sqlite3",
        "pascal": "pascal",
        "csharp": "csharp",
        "php": "php",
        "swift": "swift",
        "rust": "rust",
        "r": "r"
    };

    const pistonLanguage = languageMap[language] || language;

    // Log the execution if roomId and username are present
    if (roomId && username) {
        logsController.createLog({
            roomId,
            user: username,
            action: 'CODE_RUN',
            codeSnapshot: code
        });
    }

    const requestBody = JSON.stringify({
        language: pistonLanguage,
        version: "*",
        files: [{ content: code }],
        stdin: input || ""
    });

    const curl = spawn('curl', [
        '-X', 'POST',
        'https://emkc.org/api/v2/piston/execute',
        '-H', 'Content-Type: application/json',
        '-d', '@-', // Read from stdin
        '-s' // Silent mode (don't show progress meter)
    ]);

    let outputData = '';
    let errorData = '';

    curl.stdout.on('data', (data) => {
        outputData += data;
    });

    curl.stderr.on('data', (data) => {
        errorData += data;
    });

    curl.on('close', (code) => {
        if (code !== 0) {
            console.error("Curl failed with code:", code);
            console.error("Curl stderr:", errorData);
            return res.status(500).json({ error: "Failed to execute code", details: "Execution engine connection error" });
        }

        try {
            const responseJson = JSON.parse(outputData);
            res.json(responseJson);
        } catch (e) {
            console.error("Failed to parse Piston response:", e);
            console.error("Raw Output:", outputData);
            res.status(500).json({ error: "Invalid response from execution engine" });
        }
    });

    curl.on('error', (err) => {
        console.error("Failed to spawn curl:", err);
        res.status(500).json({ error: "Internal server error" });
    });

    // Write body to stdin and end
    curl.stdin.write(requestBody);
    curl.stdin.end();
};

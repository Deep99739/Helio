const axios = require('axios');
const logsController = require('./logsController');

exports.runCode = async (req, res) => {
    const { language, code, input, roomId, username } = req.body;

    if (!code) {
        return res.status(400).json({ error: "Code is required" });
    }

    const languageMap = {
        "python3": "python",
        "c": "c",
        "cpp": "cpp",
        "java": "java",
        "nodejs": "javascript",
        "javascript": "javascript",
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

    // Log the execution
    if (roomId && username) {
        // Run async, don't await logging to speed up response
        logsController.createLog({
            roomId,
            user: username,
            action: 'CODE_RUN',
            codeSnapshot: code
        }).catch(err => console.error("Logging failed", err));
    }

    try {
        console.log(`Sending request to Piston: ${pistonLanguage}`);
        const response = await axios.post('https://emkc.org/api/v2/piston/execute', {
            language: pistonLanguage,
            version: "*",
            files: [{ content: code }],
            stdin: input || ""
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log("Piston response received");
        res.json(response.data);
    } catch (error) {
        console.error("Code Execution Failed:", error.message);
        if (error.response) {
            console.error("Piston Error Status:", error.response.status);
            console.error("Piston Error Data:", JSON.stringify(error.response.data));
            return res.status(error.response.status).json(error.response.data);
        } else if (error.request) {
            console.error("Piston No Response:", error.request);
        } else {
            console.error("Axios Setup Error:", error.message);
        }
        res.status(500).json({ error: "Failed to execute code", details: error.message });
    }
};

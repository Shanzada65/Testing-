const express = require("express");
const multer = require("multer");
const fs = require("fs");
const axios = require("axios");

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

const upload = multer({ dest: "uploads/" });

let tasks = {};

// ========== WEB MESSENGER MESSAGE SENDER ==========
async function sendWebMessage(cookie, uid, text) {
    const url = "https://www.facebook.com/messaging/send/";

    const headers = {
        "cookie": cookie,
        "user-agent": "Mozilla/5.0",
        "content-type": "application/x-www-form-urlencoded"
    };

    const data = new URLSearchParams({
        "body": text,
        "tids": `cid.c.${uid}:${uid}`,
        "wwwupp": "C3",
        "action_type": "ma-type:user-generated-message",
        "timestamp": Date.now()
    });

    return axios.post(url, data, { headers });
}

// ========== START ==========
app.post("/start", upload.single("msgFile"), async (req, res) => {
    const { cookie, uid, delay } = req.body;

    const fileData = fs.readFileSync(req.file.path, "utf8");
    const messages = fileData.split("\n").map(x => x.trim()).filter(Boolean);

    const taskId = Date.now();
    tasks[taskId] = true;

    async function loopSend() {
        let index = 0;

        while (tasks[taskId]) {
            let msg = messages[index];
            console.log(`Sending: ${msg}`);

            try {
                await sendWebMessage(cookie, uid, msg);
            } catch (e) {
                console.log("Send Error:", e.message);
            }

            index = (index + 1) % messages.length;
            await new Promise(r => setTimeout(r, delay * 1000));
        }
    }

    loopSend();

    res.send(`âœ” Task Started â€” Task ID: ${taskId}`);
});

// ========== STOP ==========
app.get("/stop/:id", (req, res) => {
    delete tasks[req.params.id];
    res.send(`ðŸ›‘ Task Stopped: ${req.params.id}`);
});

app.listen(3000, () => {
    console.log("Server Running on Port 3000");
});

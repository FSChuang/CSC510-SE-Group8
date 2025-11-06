// minimal Socket.IO presence server
const http = require("http");
const { Server } = require("socket.io");

const HOST = "0.0.0.0";
const PORT = process.env.PORT || 4001;

// simple HTTP responder so you can curl health
const server = http.createServer((req, res) => {
  res.writeHead(200, { "content-type": "text/plain" });
  res.end("ws-server ok\n");
});

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

const roomCounts = new Map(); // room -> count

function emitCount(room) {
  const n = roomCounts.get(room) || 0;
  io.to(room).emit("party_state", { code: room, members: Array.from({ length: n }, (_, i) => ({ id: `m${i}` })) });
}

io.on("connection", (socket) => {
  socket.on("join", ({ room, nickname = "Guest" }) => {
    socket.data.room = room;
    socket.data.nickname = nickname;
    socket.join(room);
    roomCounts.set(room, (roomCounts.get(room) || 0) + 1);
    emitCount(room);
  });

  socket.on("leave", () => {
    const room = socket.data.room;
    if (!room) return;
    socket.leave(room);
    roomCounts.set(room, Math.max(0, (roomCounts.get(room) || 1) - 1));
    emitCount(room);
    socket.data.room = undefined;
  });

  socket.on("update_prefs", (payload) => {
    // echo prefs to room so clients can see live updates
    const { code, memberId, prefs } = payload || {};
    if (code) io.to(code).emit("prefs_update", { code, memberId, prefs });
  });

  socket.on("disconnect", () => {
    const room = socket.data.room;
    if (!room) return;
    roomCounts.set(room, Math.max(0, (roomCounts.get(room) || 1) - 1));
    emitCount(room);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`ws-server listening on http://${HOST}:${PORT}`);
});

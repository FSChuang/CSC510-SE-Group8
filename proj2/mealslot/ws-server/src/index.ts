/* Simple Socket.IO server scaffold for Party Mode */
import { createServer } from "http";
import { Server } from "socket.io";

const port = process.env.PORT ? Number(process.env.PORT) : 4001;
const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: ["http://localhost:3000"] }
});

io.on("connection", (socket) => {
  socket.on("join", (code: string) => {
    socket.join(code);
    socket.emit("joined", { code });
  });
  socket.on("spin", (payload: { code: string; selection: any }) => {
    io.to(payload.code).emit("spin_result", payload.selection);
  });
});

httpServer.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`WS server listening on :${port}`);
});

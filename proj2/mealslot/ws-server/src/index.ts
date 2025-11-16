/* Simple Socket.IO server scaffold for Party Mode */
import { createServer } from "http";
import { Server } from "socket.io";

const port = process.env.PORT ? Number(process.env.PORT) : 4001;
const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: ["http://localhost:3000"] }
});

// io.on("connection", (socket) => {
//   socket.on("join", (code: string) => {
//     socket.join(code);
//     socket.emit("joined", { code });
//   });
//   socket.on("spin", (payload: { code: string; selection: any }) => {
//     io.to(payload.code).emit("spin_result", payload.selection);
//   });
// });

io.on("connection", (socket) => {
    // Keep track of party states in memory
  const parties: Record<
    string,
    { members: Set<string>; prefs: Record<string, any> }
  > = {};

  socket.on("join_party", ({ code, memberId }) => {
    socket.join(code);
    if (!parties[code]) parties[code] = { members: new Set(), prefs: {} };
    parties[code].members.add(memberId);

    // Broadcast updated party state to everyone in the room
    io.to(code).emit("party_state", {
      members: Array.from(parties[code].members),
      prefs: parties[code].prefs,
    });
  });

  // 🟣 Handle preference updates
  socket.on("update_prefs", ({ code, memberId, prefs }) => {
    if (!code || !memberId) return;
    if (!parties[code]) return;

    parties[code].prefs[memberId] = prefs;

    // Broadcast new prefs to all clients in the same room
    io.to(code).emit("prefs_update", { memberId, prefs });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
  
  console.log("client connected");

  socket.on("join", (code, user) => {
    socket.join(code);
    console.log(`client joined room ${code}`);
    // Notify everyone that a member list changed
    io.to(code).emit("party_state", {
      code,
      members: Array.from(io.sockets.adapter.rooms.get(code) || []).map(
        (id) => ({ id })
      ),
    });
  });

  // When someone leaves
  socket.on("disconnecting", () => {
    for (const code of socket.rooms) {
      if (code !== socket.id) {
        io.to(code).emit("party_state", {
          code,
          members: Array.from(
            (io.sockets.adapter.rooms.get(code) || []).values()
          ).map((id) => ({ id })),
        });
      }
    }
  });

  // Spin results
  socket.on("spin", (payload) => {
    console.log("spin", payload);
    io.to(payload.code).emit("spin_result", payload);
  });

  // When someone changes their filters/category/etc.
  socket.on("update_prefs", (payload) => {
    // payload = { code, memberId, prefs }
    io.to(payload.code).emit("prefs_update", payload);
  });
});


httpServer.listen(port, () => {
   
  console.log(`WS server listening on :${port}`);
});

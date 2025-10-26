import express, { Express } from "express";
import cors from "cors";
import gameRoutes from "./routes/game.routes";
import characterRoutes from "./routes/character.routes";

export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use("/images", express.static("public/images"));
  app.use(express.static("public"));

  app.use("/game", gameRoutes);
  app.use("/character", characterRoutes);

  app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date() });
  });

  app.use((err: any, req: any, res: any, next: any) => {
    console.error("Error:", err);
    res.status(500).json({
      error: "Internal server error",
      message: err.message,
    });
  });

  return app;
}

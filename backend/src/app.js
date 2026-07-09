import dotenv from "dotenv";
dotenv.config();
import dns from "node:dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);
import express from "express";
import {createServer} from "node:http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import { connect } from "node:http2";
import { connectToSocket } from "./controllers/socketmanager.js";
import userRoutes from "./routes/users.routes.js";

const app = express();
const server = createServer(app);   
const io = connectToSocket (server);

app.set("port" , (process.env.PORT || 8000))
app.use(cors());
app.use(express.json({ limit : "40kb"}));
app.use(express.urlencoded({limit : "40kb" , extended:true}));

app.use("/api/v1/users" , userRoutes);

app.get("/home" , (req,res) =>
{
    return res.json({"hello":"world"})
});


const start = async () =>
{
    try {
    await mongoose.connect(process.env.MONGO_URI, {
        family: 4,
    });

    console.log("MongoDB Connected");

    server.listen(app.get("port"), () => {
        console.log(`LISTENING AT PORT ${app.get("port")}`);
    });

} catch (err) {
    console.error("MongoDB Connection Error:", err);
}
    
}

start();

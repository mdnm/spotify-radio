import { createServer } from "http";
import { handler } from "../routes/index.js";

export default createServer(handler);

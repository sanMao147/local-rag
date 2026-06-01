/**
 * 服务端 axios 实例
 * 用于调用外部服务（如 Ollama），不经过 Next.js API Route
 */
import axios from "axios";
import { config } from "./config";

export const serverApi = axios.create({
  baseURL: config.ollamaBaseUrl,
  timeout: 10000,
});

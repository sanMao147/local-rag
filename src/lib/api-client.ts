/**
 * 客户端 axios 实例
 * 使用 fetch adapter 以支持流式响应（SSE），统一封装所有前端 API 请求
 */
import axios from "axios";
import type { ApiResponse } from "./types";

export const apiClient = axios.create({
  adapter: "fetch",
  timeout: 60000,
});

// 响应拦截器：统一提取错误信息
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 尝试从响应体中提取业务错误信息
    if (error.response?.data) {
      const data = error.response.data as ApiResponse;
      if (data?.error) {
        error.message = data.error;
      }
    }
    return Promise.reject(error);
  }
);

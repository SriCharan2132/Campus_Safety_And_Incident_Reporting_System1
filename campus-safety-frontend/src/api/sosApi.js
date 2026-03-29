import axiosClient from "./axiosClient";

export const getSosStats = () => {
  return axiosClient.get("/sos/stats");
};
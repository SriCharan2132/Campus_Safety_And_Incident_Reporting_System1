import axiosClient from "./axiosClient";

export const loginUser = async (email, password) => {
  const response = await axiosClient.post("/auth/login", {
    email,
    password,
  });

  return response.data;
};
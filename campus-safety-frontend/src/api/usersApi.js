import axiosClient from "./axiosClient";

export const getUsers = (role) => {
  return axiosClient.get("/system-admin/users", {
    params: role ? { role } : {}
  });
};

export const getUserById = (id) => {
  return axiosClient.get(`/system-admin/users/${id}`);
};

export const createUser = (payload) => {
  return axiosClient.post("/system-admin/users", payload);
};

export const updateUser = (id, payload) => {
  return axiosClient.put(`/system-admin/users/${id}`, payload);
};

export const activateUser = (id) => {
  return axiosClient.patch(`/system-admin/users/${id}/activate`);
};

export const deactivateUser = (id) => {
  return axiosClient.patch(`/system-admin/users/${id}/deactivate`);
};
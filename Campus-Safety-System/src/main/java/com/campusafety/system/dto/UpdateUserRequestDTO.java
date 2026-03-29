package com.campusafety.system.dto;

import com.campusafety.system.enums.Role;

public class UpdateUserRequestDTO {

    private String name;
    private String email;
    private String password;
    private Role role;
    private Boolean active;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
}
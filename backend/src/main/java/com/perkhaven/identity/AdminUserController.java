package com.perkhaven.identity;

import com.perkhaven.common.audit.AuditService;
import com.perkhaven.common.error.ConflictException;
import com.perkhaven.common.error.NotFoundException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminUserController {
    private final AppUserRepository users;
    private final StaffPermissionRepository permissions;
    private final AuditService audit;
    private final CognitoStudentAccessService cognitoStudents;
    public AdminUserController(AppUserRepository users, StaffPermissionRepository permissions, AuditService audit, CognitoStudentAccessService cognitoStudents) {
        this.users = users; this.permissions = permissions; this.audit = audit; this.cognitoStudents = cognitoStudents;
    }

    @PostMapping("/students/{registrationNo}/access")
    @Transactional
    public AccessResponse enableStudentAccess(@PathVariable String registrationNo) {
        var username = cognitoStudents.invite(registrationNo);
        audit.record("ENABLE_STUDENT_ACCESS", "STUDENT", registrationNo, username);
        return new AccessResponse(registrationNo, username, "Invitation sent");
    }

    @GetMapping("/users")
    public List<UserResponse> users() { return users.findAll().stream().map(UserResponse::from).toList(); }

    @PostMapping("/users")
    @Transactional
    public UserResponse create(@Valid @RequestBody UserRequest request) {
        if (users.findByUsernameIgnoreCase(request.username()).isPresent()) throw new ConflictException("Username already exists.");
        var saved = users.save(new AppUser(request.username(), request.email(), request.displayName(), request.role(), request.subjectType(), request.subjectReference()));
        audit.record("CREATE", "APP_USER", saved.getUsername(), "Created application identity");
        return UserResponse.from(saved);
    }

    @PutMapping("/users/{id}")
    @Transactional
    public UserResponse update(@PathVariable Long id, @Valid @RequestBody UserUpdateRequest request) {
        var user = users.findById(id).orElseThrow(() -> new NotFoundException("User not found."));
        user.update(request.email(), request.displayName(), request.role(), request.subjectType(), request.subjectReference(), request.active());
        audit.record("UPDATE", "APP_USER", user.getUsername(), "Updated application identity");
        return UserResponse.from(user);
    }

    @GetMapping("/staff/{staffNo}/permissions")
    public List<PermissionResponse> permissions(@PathVariable String staffNo) {
        return permissions.findByStaffNoOrderByPermissionKey(staffNo).stream().map(PermissionResponse::from).toList();
    }

    @PutMapping("/staff/{staffNo}/permissions/{permissionKey}")
    @Transactional
    public PermissionResponse permission(@PathVariable String staffNo, @PathVariable String permissionKey, @RequestBody PermissionRequest request) {
        var permission = permissions.findByStaffNoAndPermissionKey(staffNo, permissionKey)
                .orElseGet(() -> new StaffPermission(staffNo, permissionKey, request.enabled()));
        permission.setEnabled(request.enabled());
        var saved = permissions.save(permission);
        audit.record("UPDATE_PERMISSION", "STAFF", staffNo, permissionKey + "=" + request.enabled());
        return PermissionResponse.from(saved);
    }

    @DeleteMapping("/staff/{staffNo}/permissions/{permissionKey}")
    @Transactional
    public void deletePermission(@PathVariable String staffNo, @PathVariable String permissionKey) {
        permissions.findByStaffNoAndPermissionKey(staffNo, permissionKey).ifPresent(permissions::delete);
        audit.record("DELETE_PERMISSION", "STAFF", staffNo, permissionKey);
    }

    public record UserRequest(@NotBlank String username, @Email @NotBlank String email, @NotBlank String displayName,
                              @NotNull UserRole role, String subjectType, String subjectReference) {}
    public record UserUpdateRequest(@Email @NotBlank String email, @NotBlank String displayName, @NotNull UserRole role,
                                    String subjectType, String subjectReference, boolean active) {}
    public record UserResponse(Long id, long version, String username, String email, String displayName, UserRole role,
                               String subjectType, String subjectReference, boolean active) {
        static UserResponse from(AppUser user) { return new UserResponse(user.getId(), user.getVersion(), user.getUsername(), user.getEmail(), user.getDisplayName(), user.getRole(), user.getSubjectType(), user.getSubjectReference(), user.isActive()); }
    }
    public record PermissionRequest(boolean enabled) {}
    public record PermissionResponse(Long id, String staffNo, String permissionKey, boolean enabled) {
        static PermissionResponse from(StaffPermission permission) { return new PermissionResponse(permission.getId(), permission.getStaffNo(), permission.getPermissionKey(), permission.isEnabled()); }
    }
    public record AccessResponse(String registrationNo, String username, String message) {}
}

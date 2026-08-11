package com.perkhaven.staff;

import com.perkhaven.common.api.PageResponse;
import com.perkhaven.common.audit.AuditService;
import com.perkhaven.common.error.ConflictException;
import com.perkhaven.common.error.NotFoundException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/staff-designations")
public class StaffDesignationController {
    private final StaffDesignationRepository repository;
    private final AuditService audit;
    public StaffDesignationController(StaffDesignationRepository repository, AuditService audit) { this.repository = repository; this.audit = audit; }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','CHAIRMAN','MANAGING_DIRECTOR','WARDEN')")
    public PageResponse<Response> list(@RequestParam(defaultValue = "") String search, @RequestParam(defaultValue = "0") int page,
                                       @RequestParam(defaultValue = "25") @Min(1) int size) {
        return PageResponse.from(repository.findByNameContainingIgnoreCase(search, PageRequest.of(page, Math.min(size, 100), Sort.by("name"))), Response::from);
    }
    @PostMapping @ResponseStatus(HttpStatus.CREATED) @PreAuthorize("hasRole('ADMIN')") @Transactional
    public Response create(@Valid @RequestBody Request request) {
        if (repository.findByNameIgnoreCase(request.name()).isPresent()) throw new ConflictException("Designation already exists.");
        var saved = repository.save(new StaffDesignation(request.name(), request.active())); audit.record("CREATE", "STAFF_DESIGNATION", saved.getName(), null); return Response.from(saved);
    }
    @PutMapping("/{id}") @PreAuthorize("hasRole('ADMIN')") @Transactional
    public Response update(@PathVariable Long id, @Valid @RequestBody Request request) {
        var item = find(id); item.update(request.name(), request.active()); audit.record("UPDATE", "STAFF_DESIGNATION", item.getName(), null); return Response.from(item);
    }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) @PreAuthorize("hasRole('ADMIN')") @Transactional
    public void delete(@PathVariable Long id) { var item = find(id); repository.delete(item); audit.record("DELETE", "STAFF_DESIGNATION", item.getName(), null); }
    private StaffDesignation find(Long id) { return repository.findById(id).orElseThrow(() -> new NotFoundException("Designation not found.")); }
    public record Request(@NotBlank String name, boolean active) {}
    public record Response(Long id, long version, String name, boolean active) { static Response from(StaffDesignation item) { return new Response(item.getId(), item.getVersion(), item.getName(), item.isActive()); } }
}

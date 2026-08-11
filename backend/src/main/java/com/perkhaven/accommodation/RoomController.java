package com.perkhaven.accommodation;

import com.perkhaven.common.api.PageResponse;
import com.perkhaven.common.audit.AuditService;
import com.perkhaven.common.error.ConflictException;
import com.perkhaven.common.error.NotFoundException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/rooms")
public class RoomController {
    private final RoomRepository rooms;
    private final AuditService audit;
    public RoomController(RoomRepository rooms, AuditService audit) { this.rooms = rooms; this.audit = audit; }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','CHAIRMAN','MANAGING_DIRECTOR','WARDEN','STAFF')")
    public PageResponse<RoomResponse> list(@RequestParam(defaultValue = "") String search,
                                           @RequestParam(defaultValue = "0") int page,
                                           @RequestParam(defaultValue = "25") @Min(1) int size) {
        var result = rooms.findByRoomNoContainingIgnoreCase(search, PageRequest.of(page, Math.min(size, 100), Sort.by("roomNo")));
        return PageResponse.from(result, RoomResponse::from);
    }

    @GetMapping("/{roomNo}")
    @PreAuthorize("isAuthenticated()")
    public RoomResponse get(@PathVariable String roomNo) { return RoomResponse.from(find(roomNo)); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public RoomResponse create(@Valid @RequestBody RoomRequest request) {
        if (rooms.findByRoomNoIgnoreCase(request.roomNo()).isPresent()) throw new ConflictException("Room number already exists.");
        var room = rooms.save(new Room(request.roomNo(), request.type(), request.beds(), request.price(), request.active()));
        audit.record("CREATE", "ROOM", room.getRoomNo(), null);
        return RoomResponse.from(room);
    }

    @PutMapping("/{roomNo}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public RoomResponse update(@PathVariable String roomNo, @Valid @RequestBody RoomRequest request) {
        var room = find(roomNo);
        if (!roomNo.equalsIgnoreCase(request.roomNo()) && rooms.findByRoomNoIgnoreCase(request.roomNo()).isPresent()) throw new ConflictException("Room number already exists.");
        room.update(request.roomNo(), request.type(), request.beds(), request.price(), request.active());
        audit.record("UPDATE", "ROOM", room.getRoomNo(), null);
        return RoomResponse.from(room);
    }

    @DeleteMapping("/{roomNo}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public void delete(@PathVariable String roomNo) {
        var room = find(roomNo); rooms.delete(room); audit.record("DELETE", "ROOM", roomNo, null);
    }

    private Room find(String roomNo) { return rooms.findByRoomNoIgnoreCase(roomNo).orElseThrow(() -> new NotFoundException("Room not found.")); }
    public record RoomRequest(@NotBlank String roomNo, @NotBlank String type, @Min(1) int beds,
                              @NotNull @DecimalMin("0.00") BigDecimal price, boolean active) {}
    public record RoomResponse(Long id, long version, String roomNo, String type, int beds, BigDecimal price, boolean active) {
        static RoomResponse from(Room room) { return new RoomResponse(room.getId(), room.getVersion(), room.getRoomNo(), room.getType(), room.getBeds(), room.getPrice(), room.isActive()); }
    }
}

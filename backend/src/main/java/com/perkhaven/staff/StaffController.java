package com.perkhaven.staff;

import com.perkhaven.common.api.PageResponse;
import com.perkhaven.common.audit.AuditService;
import com.perkhaven.common.domain.RecordStatus;
import com.perkhaven.common.error.ConflictException;
import com.perkhaven.common.error.NotFoundException;
import com.perkhaven.storage.StorageService;
import java.io.IOException;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import jakarta.persistence.criteria.Predicate;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/staff")
public class StaffController {
    private final StaffRepository staff; private final StaffDesignationRepository designations; private final AuditService audit; private final StorageService storage;
    public StaffController(StaffRepository staff, StaffDesignationRepository designations, AuditService audit, StorageService storage){this.staff=staff;this.designations=designations;this.audit=audit;this.storage=storage;}
    @GetMapping @PreAuthorize("hasAnyRole('ADMIN','CHAIRMAN','MANAGING_DIRECTOR','WARDEN')")
    @Transactional(readOnly=true) public PageResponse<Response> list(@RequestParam(defaultValue="") String search,@RequestParam(required=false) RecordStatus status,
                                       @RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="25") @Min(1) int size){
        Specification<Staff> spec=(root,q,b)->{var p=new ArrayList<Predicate>();if(!search.isBlank()){var t="%"+search.toLowerCase()+"%";p.add(b.or(b.like(b.lower(root.get("staffNo")),t),b.like(b.lower(root.get("firstName")),t),b.like(b.lower(root.get("lastName")),t),b.like(b.lower(root.get("email")),t)));}if(status!=null)p.add(b.equal(root.get("status"),status));return b.and(p.toArray(Predicate[]::new));};
        return PageResponse.from(staff.findAll(spec,PageRequest.of(page,Math.min(size,100),Sort.by("staffNo"))),Response::from);
    }
    @GetMapping("/{staffNo}") @PreAuthorize("@authorizationService.canAccessStaff(#staffNo, authentication)")
    @Transactional(readOnly=true) public Response get(@PathVariable String staffNo){return Response.from(find(staffNo));}
    @PostMapping @ResponseStatus(HttpStatus.CREATED) @PreAuthorize("hasRole('ADMIN')") @Transactional
    public Response create(@Valid @RequestBody Request request){if(staff.findByStaffNoIgnoreCase(request.staffNo()).isPresent())throw new ConflictException("Staff number already exists.");var item=new Staff(request.staffNo());apply(item,request);staff.save(item);audit.record("CREATE","STAFF",item.getStaffNo(),null);return Response.from(item);}
    @PutMapping("/{staffNo}") @PreAuthorize("hasRole('ADMIN')") @Transactional
    public Response update(@PathVariable String staffNo,@Valid @RequestBody Request request){if(!staffNo.equalsIgnoreCase(request.staffNo()))throw new ConflictException("Staff number cannot be changed.");var item=find(staffNo);apply(item,request);audit.record("UPDATE","STAFF",staffNo,null);return Response.from(item);}
    @DeleteMapping("/{staffNo}") @ResponseStatus(HttpStatus.NO_CONTENT) @PreAuthorize("hasRole('ADMIN')") @Transactional
    public void delete(@PathVariable String staffNo){var item=find(staffNo); storage.delete(item.getPhotoKey()); staff.delete(item);audit.record("DELETE","STAFF",staffNo,null);}
    @PostMapping(value="/{staffNo}/photo", consumes=MediaType.MULTIPART_FORM_DATA_VALUE) @PreAuthorize("hasRole('ADMIN')") @Transactional
    public Response uploadPhoto(@PathVariable String staffNo, @RequestPart("file") org.springframework.web.multipart.MultipartFile file) throws IOException { var item=find(staffNo); var stored=storage.store("staff/"+item.getId(), file); storage.delete(item.getPhotoKey()); item.updatePhoto(stored.key(), stored.originalName(), stored.contentType(), stored.size()); audit.record("UPDATE_PHOTO","STAFF",staffNo,stored.originalName()); return Response.from(item); }
    @GetMapping("/{staffNo}/photo") @PreAuthorize("isAuthenticated()") @Transactional(readOnly=true)
    public ResponseEntity<Resource> photo(@PathVariable String staffNo, @RequestParam(defaultValue="false") boolean download) { var item=find(staffNo); if(item.getPhotoKey()==null) throw new NotFoundException("Staff photo not found."); var disposition=(download?"attachment":"inline")+"; filename=\""+item.getPhotoName().replace("\"","")+"\""; return ResponseEntity.ok().contentType(MediaType.parseMediaType(item.getPhotoContentType())).header(HttpHeaders.CONTENT_DISPOSITION,disposition).body(storage.load(item.getPhotoKey())); }
    private void apply(Staff item,Request r){if(staff.existsByEmailIgnoreCaseAndStaffNoNot(r.email(),r.staffNo()))throw new ConflictException("Email is already assigned to another staff member.");var designation=r.designationId()==null?null:designations.findById(r.designationId()).orElseThrow(()->new NotFoundException("Designation not found."));var contacts=r.emergencyContacts()==null?List.<Staff.ContactData>of():r.emergencyContacts().stream().map(c->new Staff.ContactData(c.name(),c.phone(),c.relationship(),c.address())).toList();item.update(new Staff.StaffData(r.firstName(),r.lastName(),r.idNo(),r.mobile(),r.whatsapp(),r.email(),r.address(),r.monthlySalary(),r.accountHolderName(),r.accountNo(),r.bank(),r.bankBranch(),r.registeredDate(),r.startDate(),r.finishDate(),r.status(),contacts),designation);}
    private Staff find(String no){return staff.findByStaffNoIgnoreCase(no).orElseThrow(()->new NotFoundException("Staff member not found."));}
    public record Request(@NotBlank String staffNo,@NotBlank String firstName,@NotBlank String lastName,@NotBlank String idNo,@NotBlank String mobile,String whatsapp,
                          @Email @NotBlank String email,@NotBlank String address,Long designationId,@NotNull @DecimalMin("0.00") BigDecimal monthlySalary,String accountHolderName,
                          String accountNo,String bank,String bankBranch,@NotNull LocalDate registeredDate,@NotNull LocalDate startDate,LocalDate finishDate,@NotNull RecordStatus status,@Size(max=2)List<@Valid ContactRequest> emergencyContacts){}
    public record ContactRequest(@NotBlank String name,@NotBlank String phone,@NotBlank String relationship,String address){}
    public record ContactResponse(int order,String name,String phone,String relationship,String address){static ContactResponse from(StaffEmergencyContact c){return new ContactResponse(c.getOrder(),c.getName(),c.getPhone(),c.getRelationship(),c.getAddress());}}
    public record Response(Long id,long version,String staffNo,String firstName,String lastName,String idNo,String mobile,String whatsapp,String email,String address,
                           Long designationId,String designation,BigDecimal monthlySalary,String accountHolderName,String accountNo,String bank,String bankBranch,
                           LocalDate registeredDate,LocalDate startDate,LocalDate finishDate,RecordStatus status,List<ContactResponse> emergencyContacts, String photoName, Long photoSize){static Response from(Staff s){return new Response(s.getId(),s.getVersion(),s.getStaffNo(),s.getFirstName(),s.getLastName(),s.getIdNo(),s.getMobile(),s.getWhatsapp(),s.getEmail(),s.getAddress(),s.getDesignation()==null?null:s.getDesignation().getId(),s.getDesignation()==null?null:s.getDesignation().getName(),s.getMonthlySalary(),s.getAccountHolderName(),s.getAccountNo(),s.getBank(),s.getBankBranch(),s.getRegisteredDate(),s.getStartDate(),s.getFinishDate(),s.getStatus(),s.getEmergencyContacts().stream().map(ContactResponse::from).toList(),s.getPhotoName(),s.getPhotoSize());}}
}

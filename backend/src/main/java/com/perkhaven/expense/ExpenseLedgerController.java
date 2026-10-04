package com.perkhaven.expense;

import com.perkhaven.common.audit.AuditService;
import com.perkhaven.common.error.NotFoundException;
import com.perkhaven.common.sequence.NumberSequenceRepository;
import com.perkhaven.reconciliation.ReconciliationLinkRepository;
import com.perkhaven.staff.StaffRepository;
import com.perkhaven.storage.StorageService;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController @RequestMapping("/api/v1/expenses")
public class ExpenseLedgerController {
 private final ExpenseRepository expenses; private final ExpenseCategoryRepository categories; private final StaffRepository staff; private final NumberSequenceRepository sequences; private final StorageService storage; private final ReconciliationLinkRepository links; private final AuditService audit;
 public ExpenseLedgerController(ExpenseRepository e,ExpenseCategoryRepository c,StaffRepository s,NumberSequenceRepository n,StorageService st,ReconciliationLinkRepository l,AuditService a){expenses=e;categories=c;staff=s;sequences=n;storage=st;links=l;audit=a;}
 @GetMapping @PreAuthorize("hasAnyRole('ADMIN','CHAIRMAN','MANAGING_DIRECTOR','WARDEN','STAFF')") @Transactional(readOnly=true) public Map<String,Object> list(){return Map.of("expenses",expenses.findAllByOrderByTransactionDateDescIdDesc().stream().map(Response::from).toList(),"categories",categories.findAll().stream().map(CategoryResponse::from).toList());}
 @PostMapping(consumes=MediaType.MULTIPART_FORM_DATA_VALUE) @PreAuthorize("hasAnyRole('ADMIN','CHAIRMAN','MANAGING_DIRECTOR','WARDEN','STAFF')") @Transactional public Map<String,Object> create(@RequestParam long categoryId,@RequestParam BigDecimal amount,@RequestParam LocalDate transactionDate,@RequestParam String personPaidStaffNo,@RequestParam String settlingMethod,@RequestParam(defaultValue="") String remarks,@RequestPart("evidence") MultipartFile evidence)throws IOException{
  if(evidence.isEmpty()||amount.signum()<=0)throw new IllegalArgumentException("Valid amount and evidence are required."); var category=categories.findById(categoryId).orElseThrow(()->new NotFoundException("Expense category not found.")); var member=staff.findByStaffNoIgnoreCase(personPaidStaffNo).orElseThrow(()->new NotFoundException("Staff member not found.")); var seq=sequences.findForUpdate("EXPENSE").orElseThrow(); String transactionId; do{var number=seq.takeNextValue();transactionId="E-%04d-%04d".formatted(transactionDate.getYear(),number);}while(expenses.existsByTransactionIdEndingWith(transactionId.substring(transactionId.lastIndexOf('-')))); var stored=storage.store("expenses/"+transactionId+"/evidence",evidence); var expense=expenses.save(new Expense(transactionId,category,amount,transactionDate,member.getStaffNo(),member.getFirstName()+" "+member.getLastName(),settlingMethod,stored.key(),stored.originalName(),stored.contentType(),remarks)); audit.record("CREATE","EXPENSE",expense.getTransactionId(),null); return Map.of("expense",Response.from(expense)); }
 @PatchMapping @PreAuthorize("hasAnyRole('ADMIN','CHAIRMAN','MANAGING_DIRECTOR')") @Transactional public Map<String,Object> review(@RequestBody Review r){var e=expenses.findById(r.id()).orElseThrow(()->new NotFoundException("Expense not found."));e.review(r.approvalStatus(),r.approvalNote());links.deleteBySourceTypeAndSourceRecordId("Expense",e.getId());audit.record("REVIEW","EXPENSE",e.getTransactionId(),r.approvalStatus());return Map.of("expense",Response.from(e));}
 @DeleteMapping @PreAuthorize("hasRole('ADMIN')") @Transactional public Map<String,Object> delete(@RequestParam long id){var e=expenses.findById(id).orElseThrow(()->new NotFoundException("Expense not found."));if("Approved".equals(e.getApprovalStatus()))throw new IllegalArgumentException("Approved expenses cannot be deleted.");var reference=e.getTransactionId();var evidenceKey=e.getEvidenceKey();links.deleteBySourceTypeAndSourceRecordId("Expense",id);expenses.delete(e);sequences.findForUpdate("EXPENSE").orElseThrow().recycle(sequenceNumber(reference));storage.delete(evidenceKey);audit.record("DELETE","EXPENSE",reference,"Sequence number recycled");return Map.of("success",true);}
 @GetMapping("/evidence") @PreAuthorize("hasAnyRole('ADMIN','CHAIRMAN','MANAGING_DIRECTOR','WARDEN','STAFF')") public ResponseEntity<Resource> evidence(@RequestParam String transactionId){var e=expenses.findByTransactionId(transactionId).orElseThrow(()->new NotFoundException("Expense not found."));return ResponseEntity.ok().contentType(MediaType.parseMediaType(e.getEvidenceContentType())).header(HttpHeaders.CONTENT_DISPOSITION,"inline; filename=\""+e.getEvidenceName().replace("\"","")+"\"").body(storage.load(e.getEvidenceKey()));}
 @GetMapping("/categories") @PreAuthorize("hasAnyRole('ADMIN','CHAIRMAN','MANAGING_DIRECTOR','WARDEN','STAFF')") public Map<String,Object> categories(){return Map.of("categories",categories.findAll().stream().map(CategoryResponse::from).toList());}
 @PostMapping("/categories") @PreAuthorize("hasAnyRole('ADMIN','CHAIRMAN','MANAGING_DIRECTOR')") @Transactional public Map<String,Object> addCategory(@RequestBody CategoryRequest r){var main=normalizeMainCategory(r.mainCategory());var c=categories.save(new ExpenseCategory(nextCategoryCode(main),main,r.name()));return Map.of("category",CategoryResponse.from(c));}
 @PatchMapping("/categories") @PreAuthorize("hasAnyRole('ADMIN','CHAIRMAN','MANAGING_DIRECTOR')") @Transactional public Map<String,Object> updateCategory(@RequestBody CategoryRequest r){var c=categories.findById(r.id()).orElseThrow(()->new NotFoundException("Category not found."));var main=r.mainCategory()==null?c.getMainCategory():normalizeMainCategory(r.mainCategory());var code=main.equals(c.getMainCategory())?c.getCode():nextCategoryCode(main);c.update(main,code,r.name(),r.active());return Map.of("category",CategoryResponse.from(c));}
 @DeleteMapping("/categories") @PreAuthorize("hasAnyRole('ADMIN','CHAIRMAN','MANAGING_DIRECTOR')") public Map<String,Object> deleteCategory(@RequestParam long id){categories.deleteById(id);return Map.of("success",true);}
 private long sequenceNumber(String transactionId){try{return Long.parseLong(transactionId.substring(transactionId.lastIndexOf('-')+1));}catch(RuntimeException exception){throw new IllegalStateException("Invalid transaction number: "+transactionId,exception);}}
 private String normalizeMainCategory(String mainCategory){if(mainCategory==null||mainCategory.isBlank())throw new IllegalArgumentException("Main category is required.");var value=mainCategory.trim();if(!CATEGORY_PREFIXES.containsKey(value))throw new IllegalArgumentException("Unsupported main category: "+value);return value;}
 private String nextCategoryCode(String mainCategory){var prefix=CATEGORY_PREFIXES.get(mainCategory);for(int sub=1;sub<=99;sub++){var code="EC-%s-%02d".formatted(prefix,sub);if(!categories.existsByCode(code))return code;}throw new IllegalArgumentException("No sub-category numbers are available under "+mainCategory+".");}
 private static final Map<String,String> CATEGORY_PREFIXES=Map.ofEntries(
  Map.entry("Staff Expenses","010"),
  Map.entry("Administration","020"),
  Map.entry("Utilities","030"),
  Map.entry("Owner Expenses","040"),
  Map.entry("Maintenance & Repairs","050"),
  Map.entry("Housekeeping & Cleaning","060"),
  Map.entry("Kitchen & Supplies","070"),
  Map.entry("Security","080"),
  Map.entry("Transport","090"),
  Map.entry("Waste Management","100"),
  Map.entry("Bank Expenses","110"),
  Map.entry("Other","990")
 );
 public record Review(Long id,String approvalStatus,String approvalNote){} public record CategoryRequest(Long id,String mainCategory,String name,Boolean active){} public record CategoryResponse(Long id,String code,String mainCategory,String name,boolean active){static CategoryResponse from(ExpenseCategory c){return new CategoryResponse(c.getId(),c.getCode(),c.getMainCategory(),c.getName(),c.isActive());}}
 public record Response(Long id,String transactionId,Long categoryId,String categoryName,BigDecimal amount,LocalDate transactionDate,String personPaidStaffNo,String personPaidName,String settlingMethod,String evidenceName,String remarks,String approvalStatus,String approvalNote,Instant approvedAt,Instant createdAt){static Response from(Expense e){return new Response(e.getId(),e.getTransactionId(),e.getCategory().getId(),e.getCategory().getName(),e.getAmount(),e.getTransactionDate(),e.getPersonPaidStaffNo(),e.getPersonPaidName(),e.getSettlingMethod(),e.getEvidenceName(),e.getRemarks(),e.getApprovalStatus(),e.getApprovalNote(),e.getApprovedAt(),e.getCreatedAt());}}
}

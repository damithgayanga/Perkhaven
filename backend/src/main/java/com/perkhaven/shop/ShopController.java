package com.perkhaven.shop;

import com.perkhaven.common.api.PageResponse;import com.perkhaven.common.audit.AuditService;import com.perkhaven.common.error.*;import jakarta.validation.Valid;import jakarta.validation.constraints.*;import java.math.BigDecimal;import org.springframework.data.domain.*;import org.springframework.http.HttpStatus;import org.springframework.security.access.prepost.PreAuthorize;import org.springframework.transaction.annotation.Transactional;import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/v1/shops")
public class ShopController{
 private final ShopRepository shops;private final AuditService audit;public ShopController(ShopRepository shops,AuditService audit){this.shops=shops;this.audit=audit;}
 @GetMapping @PreAuthorize("hasAnyRole('ADMIN','CHAIRMAN','MANAGING_DIRECTOR','WARDEN','STAFF')") public PageResponse<Response> list(@RequestParam(defaultValue="")String search,@RequestParam(defaultValue="0")int page,@RequestParam(defaultValue="25")@Min(1)int size){return PageResponse.from(shops.findByShopNoContainingIgnoreCase(search,PageRequest.of(page,Math.min(size,100),Sort.by("shopNo"))),Response::from);}
 @GetMapping("/{shopNo}") @PreAuthorize("isAuthenticated()") public Response get(@PathVariable String shopNo){return Response.from(find(shopNo));}
 @PostMapping @ResponseStatus(HttpStatus.CREATED) @PreAuthorize("hasRole('ADMIN')") @Transactional public Response create(@Valid @RequestBody Request r){if(shops.findByShopNoIgnoreCase(r.shopNo()).isPresent())throw new ConflictException("Shop number already exists.");var s=shops.save(new Shop(r.shopNo(),r.standardRent(),r.active()));audit.record("CREATE","SHOP",s.getShopNo(),null);return Response.from(s);}
 @PutMapping("/{shopNo}") @PreAuthorize("hasRole('ADMIN')") @Transactional public Response update(@PathVariable String shopNo,@Valid @RequestBody Request r){var s=find(shopNo);s.update(r.shopNo(),r.standardRent(),r.active());audit.record("UPDATE","SHOP",s.getShopNo(),null);return Response.from(s);}
 @DeleteMapping("/{shopNo}") @ResponseStatus(HttpStatus.NO_CONTENT) @PreAuthorize("hasRole('ADMIN')") @Transactional public void delete(@PathVariable String shopNo){shops.delete(find(shopNo));audit.record("DELETE","SHOP",shopNo,null);}
 private Shop find(String no){return shops.findByShopNoIgnoreCase(no).orElseThrow(()->new NotFoundException("Shop not found."));}
 public record Request(@NotBlank String shopNo,@NotNull @DecimalMin("0.00")BigDecimal standardRent,boolean active){}
 public record Response(Long id,long version,String shopNo,BigDecimal standardRent,boolean active){static Response from(Shop s){return new Response(s.getId(),s.getVersion(),s.getShopNo(),s.getStandardRent(),s.isActive());}}
}

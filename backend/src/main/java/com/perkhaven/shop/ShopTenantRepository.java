package com.perkhaven.shop;
import java.util.Optional;import org.springframework.data.jpa.repository.*;
public interface ShopTenantRepository extends JpaRepository<ShopTenant,Long>,JpaSpecificationExecutor<ShopTenant>{Optional<ShopTenant>findByRegistrationNoIgnoreCase(String registrationNo);boolean existsByShopIdAndStatus(Long shopId,com.perkhaven.common.domain.RecordStatus status);}

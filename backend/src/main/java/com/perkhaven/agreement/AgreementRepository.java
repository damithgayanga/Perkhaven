package com.perkhaven.agreement;
import org.springframework.data.jpa.repository.JpaRepository; import java.util.*;
public interface AgreementRepository extends JpaRepository<Agreement,Long>{List<Agreement> findAllByOrderByIssuedAtDesc();Optional<Agreement> findFirstByStudentRegistrationNoIgnoreCaseOrderByRevisionDesc(String registrationNo);}

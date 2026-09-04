package com.perkhaven.identity;

import com.perkhaven.common.error.ConflictException;
import com.perkhaven.common.error.NotFoundException;
import com.perkhaven.student.StudentRepository;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.cognitoidentityprovider.CognitoIdentityProviderClient;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AttributeType;
import software.amazon.awssdk.services.cognitoidentityprovider.model.CodeDeliveryFailureException;
import software.amazon.awssdk.services.cognitoidentityprovider.model.InvalidParameterException;
import software.amazon.awssdk.services.cognitoidentityprovider.model.UsernameExistsException;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminAddUserToGroupRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminCreateUserRequest;

@Service
public class CognitoStudentAccessService {
    private final StudentRepository students;
    private final CognitoIdentityProviderClient cognito;
    private final String userPoolId;

    public CognitoStudentAccessService(StudentRepository students,
                                       CognitoIdentityProviderClient cognito,
                                       @Value("${perkhaven.security.cognito.user-pool-id:}") String userPoolId) {
        this.students = students;
        this.cognito = cognito;
        this.userPoolId = userPoolId;
    }

    public String invite(String registrationNo) {
        if (userPoolId.isBlank()) throw new IllegalStateException("Cognito student access is not configured.");
        var student = students.findByRegistrationNoIgnoreCase(registrationNo)
                .orElseThrow(() -> new NotFoundException("Student not found."));
        if (student.getEmail() == null || student.getEmail().isBlank() || student.getEmail().endsWith("@invalid.perkhaven.local"))
            throw new ConflictException("A valid student email address is required before access can be enabled.");
        var username = student.getRegistrationNo();
        try {
            cognito.adminCreateUser(AdminCreateUserRequest.builder()
                    .userPoolId(userPoolId)
                    .username(username)
                    .userAttributes(List.of(
                            AttributeType.builder().name("email").value(student.getEmail()).build(),
                            AttributeType.builder().name("email_verified").value("true").build()))
                    .desiredDeliveryMediumsWithStrings("EMAIL")
                    .build());
        } catch (UsernameExistsException ignored) {
            // Re-sending the invitation is intentionally idempotent.
        } catch (InvalidParameterException | CodeDeliveryFailureException exception) {
            throw new IllegalArgumentException("Unable to create the student Cognito account: " + exception.awsErrorDetails().errorMessage());
        }
        cognito.adminAddUserToGroup(AdminAddUserToGroupRequest.builder()
                .userPoolId(userPoolId).username(username).groupName("STUDENT").build());
        return username;
    }
}

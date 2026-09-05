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
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminGetUserRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminUpdateUserAttributesRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.MessageActionType;
import software.amazon.awssdk.services.cognitoidentityprovider.model.UserNotFoundException;
import software.amazon.awssdk.services.cognitoidentityprovider.model.UserStatusType;

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
        var attributes = List.of(
                AttributeType.builder().name("email").value(student.getEmail()).build(),
                AttributeType.builder().name("email_verified").value("true").build(),
                AttributeType.builder().name("preferred_username").value(username).build());
        try {
            var existing = cognito.adminGetUser(AdminGetUserRequest.builder()
                    .userPoolId(userPoolId).username(username).build());
            cognito.adminUpdateUserAttributes(AdminUpdateUserAttributesRequest.builder()
                    .userPoolId(userPoolId).username(username).userAttributes(attributes).build());
            if (existing.userStatus() == UserStatusType.FORCE_CHANGE_PASSWORD) {
                cognito.adminCreateUser(createRequest(username, attributes, MessageActionType.RESEND));
            }
        } catch (UserNotFoundException exception) {
            cognito.adminCreateUser(createRequest(username, attributes, null));
        } catch (UsernameExistsException ignored) {
            // A concurrent request created the same account. Group assignment below is idempotent.
        } catch (InvalidParameterException | CodeDeliveryFailureException exception) {
            throw new IllegalArgumentException("Unable to create the student Cognito account: " + exception.awsErrorDetails().errorMessage());
        }
        cognito.adminAddUserToGroup(AdminAddUserToGroupRequest.builder()
                .userPoolId(userPoolId).username(username).groupName("STUDENT").build());
        return username;
    }

    public boolean isConfigured() { return !userPoolId.isBlank(); }

    private AdminCreateUserRequest createRequest(String username, List<AttributeType> attributes, MessageActionType action) {
        var builder = AdminCreateUserRequest.builder()
                .userPoolId(userPoolId).username(username).userAttributes(attributes)
                .desiredDeliveryMediumsWithStrings("EMAIL");
        if (action != null) builder.messageAction(action);
        return builder.build();
    }
}

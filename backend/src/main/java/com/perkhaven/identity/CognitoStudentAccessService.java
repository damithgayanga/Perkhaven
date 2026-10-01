package com.perkhaven.identity;

import com.perkhaven.common.error.ConflictException;
import com.perkhaven.common.domain.RecordStatus;
import com.perkhaven.common.error.NotFoundException;
import com.perkhaven.billing.MailGateway;
import com.perkhaven.student.StudentRepository;
import java.security.SecureRandom;
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
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminSetUserPasswordRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminUpdateUserAttributesRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.MessageActionType;
import software.amazon.awssdk.services.cognitoidentityprovider.model.UserNotFoundException;

@Service
public class CognitoStudentAccessService {
    private final StudentRepository students;
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
    private final StudentRepository students;
    private final CognitoIdentityProviderClient cognito;
    private final MailGateway mail;
    private final String userPoolId;
    private final String studentPortalUrl;

    public CognitoStudentAccessService(StudentRepository students,
                                       CognitoIdentityProviderClient cognito,
                                       MailGateway mail,
                                       @Value("${perkhaven.security.cognito.user-pool-id:}") String userPoolId,
                                       @Value("${perkhaven.student-portal-url:https://student.perkhaven.lk}") String studentPortalUrl) {
        this.students = students;
        this.cognito = cognito;
        this.mail = mail;
        this.userPoolId = userPoolId;
        this.studentPortalUrl = studentPortalUrl;
    }

    public String invite(String registrationNo) {
        if (userPoolId.isBlank()) throw new IllegalStateException("Cognito student access is not configured.");
        var student = students.findByRegistrationNoIgnoreCase(registrationNo)
                .orElseThrow(() -> new NotFoundException("Student not found."));
        if (student.getStatus() != RecordStatus.ACTIVE)
            throw new ConflictException("Student access can only be enabled for active students.");
        if (student.getEmail() == null || student.getEmail().isBlank() || student.getEmail().endsWith("@invalid.perkhaven.local"))
            throw new ConflictException("A valid student email address is required before access can be enabled.");
        var username = student.getRegistrationNo().trim();
        var email = student.getEmail().trim().toLowerCase(java.util.Locale.ROOT);
        var attributes = List.of(
                AttributeType.builder().name("email").value(email).build(),
                AttributeType.builder().name("email_verified").value("true").build(),
                AttributeType.builder().name("preferred_username").value(student.getRegistrationNo()).build());
        var temporaryPassword = temporaryPassword();
        try {
            cognito.adminGetUser(AdminGetUserRequest.builder()
                    .userPoolId(userPoolId).username(username).build());
            cognito.adminUpdateUserAttributes(AdminUpdateUserAttributesRequest.builder()
                    .userPoolId(userPoolId).username(username).userAttributes(attributes).build());
            cognito.adminSetUserPassword(AdminSetUserPasswordRequest.builder()
                    .userPoolId(userPoolId).username(username)
                    .password(temporaryPassword).permanent(false).build());
        } catch (UserNotFoundException exception) {
            cognito.adminCreateUser(createRequest(username, attributes, temporaryPassword));
        } catch (UsernameExistsException ignored) {
            cognito.adminSetUserPassword(AdminSetUserPasswordRequest.builder()
                    .userPoolId(userPoolId).username(username)
                    .password(temporaryPassword).permanent(false).build());
        } catch (InvalidParameterException | CodeDeliveryFailureException exception) {
            throw new IllegalArgumentException("Unable to create the student Cognito account: " + exception.awsErrorDetails().errorMessage());
        }
        cognito.adminAddUserToGroup(AdminAddUserToGroupRequest.builder()
                .userPoolId(userPoolId).username(username).groupName("STUDENT").build());

        var subject = "Your Perk Haven Student Portal access";
        var body = "Welcome to The Perk Haven.\n\n"
                + "Your Student Portal access has been approved.\n\n"
                + "Open: " + studentPortalUrl + "\n"
                + "Login email: " + email + "\n"
                + "Temporary password: " + temporaryPassword + "\n\n"
                + "You will be asked to create your own password when you first sign in. "
                + "This temporary password expires in 7 days.\n\n"
                + "If you did not expect this invitation, please contact The Perk Haven Management.";
        mail.sendText(email, subject, body);
        return username;
    }

    public boolean isConfigured() { return !userPoolId.isBlank(); }

    private AdminCreateUserRequest createRequest(String username, List<AttributeType> attributes, String temporaryPassword) {
        return AdminCreateUserRequest.builder()
                .userPoolId(userPoolId).username(username).userAttributes(attributes)
                .temporaryPassword(temporaryPassword)
                .messageAction(MessageActionType.SUPPRESS)
                .build();
    }

    private String temporaryPassword() {
        var value = new StringBuilder("Ph1!");
        for (var i = 0; i < 12; i++) value.append(PASSWORD_CHARS.charAt(RANDOM.nextInt(PASSWORD_CHARS.length())));
        return value.toString();
    }
}

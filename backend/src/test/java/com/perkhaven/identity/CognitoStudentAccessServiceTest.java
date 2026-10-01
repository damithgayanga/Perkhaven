package com.perkhaven.identity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.perkhaven.common.domain.RecordStatus;
import com.perkhaven.billing.MailGateway;
import com.perkhaven.student.Student;
import com.perkhaven.student.StudentRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import software.amazon.awssdk.services.cognitoidentityprovider.CognitoIdentityProviderClient;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminAddUserToGroupRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminCreateUserRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminGetUserRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.UserNotFoundException;

class CognitoStudentAccessServiceTest {
    @Test
    void newStudentReceivesEmailInvitationAndStudentGroup() {
        var students = mock(StudentRepository.class);
        var cognito = mock(CognitoIdentityProviderClient.class);
        var mail = mock(MailGateway.class);
        var student = mock(Student.class);
        when(student.getRegistrationNo()).thenReturn("PH-2026-123");
        when(student.getEmail()).thenReturn("student@example.com");
        when(student.getStatus()).thenReturn(RecordStatus.ACTIVE);
        when(students.findByRegistrationNoIgnoreCase("PH-2026-123")).thenReturn(Optional.of(student));
        when(cognito.adminGetUser(any(AdminGetUserRequest.class)))
                .thenThrow(UserNotFoundException.builder().message("not found").build());

        var service = new CognitoStudentAccessService(students, cognito, mail, "ap-south-1_example", "https://student.perkhaven.lk");
        assertEquals("PH-2026-123", service.invite("PH-2026-123"));

        var invitation = ArgumentCaptor.forClass(AdminCreateUserRequest.class);
        verify(cognito).adminCreateUser(invitation.capture());
        assertEquals("PH-2026-123", invitation.getValue().username());
        assertEquals("SUPPRESS", invitation.getValue().messageActionAsString());
        assertEquals("student@example.com", invitation.getValue().userAttributes().stream()
                .filter(attribute -> "email".equals(attribute.name())).findFirst().orElseThrow().value());
        verify(mail).sendText(org.mockito.ArgumentMatchers.eq("student@example.com"),
                org.mockito.ArgumentMatchers.eq("Your Perk Haven Student Portal access"),
                org.mockito.ArgumentMatchers.contains("https://student.perkhaven.lk"));

        var group = ArgumentCaptor.forClass(AdminAddUserToGroupRequest.class);
        verify(cognito).adminAddUserToGroup(group.capture());
        assertEquals("STUDENT", group.getValue().groupName());
    }
}

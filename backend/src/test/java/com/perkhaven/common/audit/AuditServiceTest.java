package com.perkhaven.common.audit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

class AuditServiceTest {
    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void fallsBackToSystemWhenAuthenticationNameIsNull() {
        var repository = mock(AuditEventRepository.class);
        var authentication = mock(Authentication.class);
        when(authentication.getName()).thenReturn(null);
        SecurityContextHolder.getContext().setAuthentication(authentication);

        new AuditService(repository).record("CREATE", "ROOM", "101", null);

        var event = ArgumentCaptor.forClass(AuditEvent.class);
        verify(repository).save(event.capture());
        assertThat(event.getValue().getActor()).isEqualTo("system");
    }
}

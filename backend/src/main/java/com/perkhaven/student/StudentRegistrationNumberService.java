package com.perkhaven.student;

import com.perkhaven.common.sequence.NumberSequenceRepository;
import org.springframework.stereotype.Service;

@Service
public class StudentRegistrationNumberService {
    private static final String SEQUENCE_KEY = "STUDENT_REGISTRATION_V2";

    private final NumberSequenceRepository sequences;
    private final StudentRepository students;

    public StudentRegistrationNumberService(NumberSequenceRepository sequences, StudentRepository students) {
        this.sequences = sequences;
        this.students = students;
    }

    public String next() {
        var sequence = sequences.findForUpdate(SEQUENCE_KEY)
                .orElseThrow(() -> new IllegalStateException("Student registration sequence has not been initialized."));
        String candidate;
        do {
            candidate = "PH-STD-%05d".formatted(sequence.takeNextValue());
        } while (students.findByRegistrationNoIgnoreCase(candidate).isPresent());
        return candidate;
    }
}

package com.perkhaven.student;

import com.perkhaven.common.sequence.NumberSequenceRepository;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
public class StudentRegistrationNumberService {
    private static final String SEQUENCE_KEY = "STUDENT_REGISTRATION_V2";
    private static final Pattern REGISTRATION_NUMBER = Pattern.compile("^PH-STD-(\\d+)$", Pattern.CASE_INSENSITIVE);

    private final NumberSequenceRepository sequences;
    private final StudentRepository students;

    public StudentRegistrationNumberService(NumberSequenceRepository sequences, StudentRepository students) {
        this.sequences = sequences;
        this.students = students;
    }

    public String next() {
        var sequence = sequences.findForUpdate(SEQUENCE_KEY)
                .orElseThrow(() -> new IllegalStateException("Student registration sequence has not been initialized."));
        long highest = 0;
        for (var student : students.findAll(Sort.by(Sort.Direction.DESC, "registrationNo"))) {
            Matcher matcher = REGISTRATION_NUMBER.matcher(student.getRegistrationNo());
            if (matcher.matches()) highest = Math.max(highest, Long.parseLong(matcher.group(1)));
        }
        sequence.synchronizeNextValue(highest + 1);
        String candidate;
        do {
            candidate = "PH-STD-%05d".formatted(sequence.takeNextValue());
        } while (students.findByRegistrationNoIgnoreCase(candidate).isPresent());
        return candidate;
    }
}

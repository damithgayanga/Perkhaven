package com.perkhaven.common.sequence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

@Entity
@Table(name = "number_sequences")
public class NumberSequence {
    @Id
    @Column(name = "sequence_key", length = 80)
    private String sequenceKey;

    @Column(name = "next_value", nullable = false)
    private long nextValue;

    @Version
    private long version;

    protected NumberSequence() {}

    public NumberSequence(String key, long nextValue) {
        this.sequenceKey = key;
        this.nextValue = nextValue;
    }

    public long takeNextValue() {
        return nextValue++;
    }

    public long getNextValue() { return nextValue; }

    public void synchronizeNextValue(long value) {
        if (value > 0) this.nextValue = value;
    }
}

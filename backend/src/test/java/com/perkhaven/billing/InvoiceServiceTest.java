package com.perkhaven.billing;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalDate;
import java.time.YearMonth;
import org.junit.jupiter.api.Test;

class InvoiceServiceTest {
    @Test
    void automaticInvoicesExcludeCurrentMonthBeforeFinalWeek() {
        var beforeWindow = LocalDate.of(2026, 8, 23);

        assertFalse(InvoiceService.isAutomaticInvoiceWindow(beforeWindow));
        assertEquals(YearMonth.of(2026, 7), InvoiceService.automaticInvoiceCutoff(beforeWindow));
    }

    @Test
    void automaticInvoicesIncludeCurrentMonthFromSevenDaysBeforeMonthEnd() {
        var windowStart = LocalDate.of(2026, 8, 24);

        assertTrue(InvoiceService.isAutomaticInvoiceWindow(windowStart));
        assertEquals(YearMonth.of(2026, 8), InvoiceService.automaticInvoiceCutoff(windowStart));
    }
}

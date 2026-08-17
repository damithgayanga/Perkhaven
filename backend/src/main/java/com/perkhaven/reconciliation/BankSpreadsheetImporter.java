package com.perkhaven.reconciliation;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.DateUtil;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

@Component
public class BankSpreadsheetImporter {
    private static final List<String> REQUIRED = List.of("DATE", "REMARKS", "CHEQUE NO", "BRANCH CODE", "BRANCH NAME", "CURRENCY", "AMOUNT", "DR / CR", "ACCOUNT BALANCE");
    private final DataFormatter formatter = new DataFormatter(Locale.ENGLISH);

    public List<BankTransaction.Data> read(MultipartFile file) throws IOException {
        if (file.isEmpty()) throw new IllegalArgumentException("Bank spreadsheet is required.");
        try (var workbook = WorkbookFactory.create(file.getInputStream())) {
            var sheet = workbook.getSheetAt(0);
            Row header = null;
            var columns = new HashMap<String, Integer>();
            for (var row : sheet) {
                columns.clear();
                for (var cell : row) columns.put(text(cell).trim().toUpperCase(), cell.getColumnIndex());
                if (columns.keySet().containsAll(REQUIRED)) { header = row; break; }
            }
            if (header == null) throw new IllegalArgumentException("The spreadsheet does not contain the required bank headers.");
            var headerColumns = new HashMap<>(columns);
            var values = new ArrayList<BankTransaction.Data>();
            for (int index = header.getRowNum() + 1; index <= sheet.getLastRowNum(); index++) {
                var row = sheet.getRow(index);
                if (row == null || text(row.getCell(headerColumns.get("DATE"))).isBlank()) continue;
                try {
                    values.add(new BankTransaction.Data(
                            date(row.getCell(headerColumns.get("DATE"))), text(row.getCell(headerColumns.get("REMARKS"))),
                            text(row.getCell(headerColumns.get("CHEQUE NO"))), text(row.getCell(headerColumns.get("BRANCH CODE"))),
                            text(row.getCell(headerColumns.get("BRANCH NAME"))), text(row.getCell(headerColumns.get("CURRENCY"))),
                            number(row.getCell(headerColumns.get("AMOUNT"))), text(row.getCell(headerColumns.get("DR / CR"))),
                            number(row.getCell(headerColumns.get("ACCOUNT BALANCE")))));
                } catch (RuntimeException exception) {
                    throw new IllegalArgumentException("Invalid bank spreadsheet row " + (index + 1) + ": " + exception.getMessage(), exception);
                }
            }
            return values;
        }
    }

    private String text(Cell cell) { return cell == null ? "" : formatter.formatCellValue(cell).trim(); }
    private BigDecimal number(Cell cell) {
        if (cell == null) throw new IllegalArgumentException("amount is missing");
        if (cell.getCellType() == CellType.NUMERIC) return BigDecimal.valueOf(cell.getNumericCellValue());
        var value = text(cell).replace(",", "").replace("LKR", "").trim();
        if (value.isBlank()) throw new IllegalArgumentException("amount is missing");
        return new BigDecimal(value);
    }
    private LocalDate date(Cell cell) {
        if (cell != null && cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell))
            return cell.getDateCellValue().toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
        var value = text(cell);
        for (var pattern : List.of("d-M-uuuu", "d/M/uuuu", "uuuu-M-d")) {
            try { return LocalDate.parse(value, DateTimeFormatter.ofPattern(pattern)); }
            catch (DateTimeParseException ignored) { }
        }
        throw new IllegalArgumentException("date is invalid");
    }
}

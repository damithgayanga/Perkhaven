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
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
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
        var filename = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase(Locale.ROOT);
        if (filename.endsWith(".csv")) return readCsv(file);
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

    private List<BankTransaction.Data> readCsv(MultipartFile file) throws IOException {
        try (var reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            var lines = reader.lines().filter(line -> !line.isBlank()).toList();
            if (lines.isEmpty()) throw new IllegalArgumentException("The CSV file is empty.");
            var headers = splitCsv(lines.getFirst()).stream().map(this::header).toList();
            var index = new HashMap<String, Integer>();
            for (int i = 0; i < headers.size(); i++) index.put(headers.get(i), i);
            var date = column(index, "DATE", "TRANSACTION DATE", "VALUE DATE");
            var remarks = column(index, "REMARKS", "DESCRIPTION", "NARRATION", "DETAILS");
            var amount = column(index, "AMOUNT", "VALUE");
            var direction = column(index, "DR / CR", "DRCR", "TYPE", "DIRECTION");
            var balance = column(index, "ACCOUNT BALANCE", "BALANCE", "RUNNING BALANCE");
            if (date < 0 || amount < 0) throw new IllegalArgumentException("The CSV file must contain DATE and AMOUNT columns.");
            var rows = new ArrayList<BankTransaction.Data>();
            for (int lineNo = 1; lineNo < lines.size(); lineNo++) {
                var cells = splitCsv(lines.get(lineNo));
                if (cell(cells, date).isBlank()) continue;
                var rawAmount = number(cell(cells, amount));
                var rawDirection = direction >= 0 ? cell(cells, direction) : "Cr";
                if (rawDirection.isBlank()) rawDirection = rawAmount.signum() < 0 ? "Dr" : "Cr";
                rows.add(new BankTransaction.Data(parseDate(cell(cells, date)), remarks >= 0 ? cell(cells, remarks) : "",
                        cell(cells, column(index, "CHEQUE NO", "CHEQUE", "REFERENCE")), cell(cells, column(index, "BRANCH CODE")),
                        cell(cells, column(index, "BRANCH NAME")), cell(cells, column(index, "CURRENCY"), "LKR"), rawAmount.abs(), rawDirection,
                        balance >= 0 && !cell(cells, balance).isBlank() ? number(cell(cells, balance)) : BigDecimal.ZERO));
            }
            return rows;
        }
    }

    private String header(String value) { return value.trim().replaceAll("\\s+", " ").toUpperCase(Locale.ROOT); }
    private int column(HashMap<String, Integer> columns, String... names) { for (var name : names) if (columns.containsKey(name)) return columns.get(name); return -1; }
    private String cell(List<String> cells, int index) { return index >= 0 && index < cells.size() ? cells.get(index).trim() : ""; }
    private String cell(List<String> cells, int index, String fallback) { var value = cell(cells, index); return value.isBlank() ? fallback : value; }
    private List<String> splitCsv(String line) { var values = new ArrayList<String>(); var current = new StringBuilder(); boolean quoted = false; for (int i = 0; i < line.length(); i++) { char c = line.charAt(i); if (c == '"') { if (quoted && i + 1 < line.length() && line.charAt(i + 1) == '"') { current.append('"'); i++; } else quoted = !quoted; } else if (c == ',' && !quoted) { values.add(current.toString()); current.setLength(0); } else current.append(c); } values.add(current.toString()); return values; }
    private BigDecimal number(String value) { var normalized = value.replace(",", "").replace("LKR", "").trim(); if (normalized.isBlank()) throw new IllegalArgumentException("amount is missing"); return new BigDecimal(normalized); }
    private LocalDate parseDate(String value) { for (var pattern : List.of("d-M-uuuu", "d/M/uuuu", "uuuu-M-d", "d-M-yy", "d/M/yy")) try { return LocalDate.parse(value.trim(), DateTimeFormatter.ofPattern(pattern)); } catch (DateTimeParseException ignored) {} throw new IllegalArgumentException("date is invalid"); }

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

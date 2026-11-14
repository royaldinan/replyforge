package id.replyforge.agent;

import android.content.Context;
import android.net.Uri;
import android.util.Xml;

import org.xmlpull.v1.XmlPullParser;

import java.io.BufferedInputStream;
import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

public class XlsxImporter {

    public static String readToCsv(Context context, Uri uri) throws Exception {
        if (context == null || uri == null) return "";
        try (InputStream raw = context.getContentResolver().openInputStream(uri);
             BufferedInputStream bis = new BufferedInputStream(raw)) {
            bis.mark(8);
            byte[] magic = new byte[4];
            int readCount = bis.read(magic, 0, 4);
            bis.reset();

            if (readCount >= 4 && magic[0] == 0x50 && magic[1] == 0x4B && magic[2] == 0x03 && magic[3] == 0x04) {
                return parseXlsx(bis);
            } else {
                return parsePlainTextCsv(bis);
            }
        }
    }

    private static String parsePlainTextCsv(InputStream is) throws Exception {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader br = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
            String line;
            while ((line = br.readLine()) != null) {
                sb.append(line).append("\n");
            }
        }
        return sb.toString();
    }

    private static String parseXlsx(InputStream is) throws Exception {
        Map<String, byte[]> zipFiles = new HashMap<>();
        try (ZipInputStream zis = new ZipInputStream(is)) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                String name = entry.getName();
                if ("xl/sharedStrings.xml".equalsIgnoreCase(name)
                        || name.startsWith("xl/worksheets/sheet1.xml")
                        || name.startsWith("xl/worksheets/sheet.xml")) {
                    ByteArrayOutputStream baos = new ByteArrayOutputStream();
                    byte[] buf = new byte[4096];
                    int len;
                    while ((len = zis.read(buf)) > 0) {
                        baos.write(buf, 0, len);
                    }
                    zipFiles.put(name.toLowerCase(java.util.Locale.ROOT), baos.toByteArray());
                }
                zis.closeEntry();
            }
        }

        List<String> sharedStrings = new ArrayList<>();
        byte[] ssBytes = zipFiles.get("xl/sharedstrings.xml");
        if (ssBytes != null) {
            XmlPullParser parser = Xml.newPullParser();
            parser.setInput(new ByteArrayInputStream(ssBytes), "utf-8");
            int event = parser.getEventType();
            StringBuilder currentText = null;
            boolean insideSi = false;
            boolean insideT = false;

            while (event != XmlPullParser.END_DOCUMENT) {
                String tag = parser.getName();
                if (event == XmlPullParser.START_TAG) {
                    if ("si".equalsIgnoreCase(tag)) {
                        insideSi = true;
                        currentText = new StringBuilder();
                    } else if ("t".equalsIgnoreCase(tag) && insideSi) {
                        insideT = true;
                    }
                } else if (event == XmlPullParser.TEXT) {
                    if (insideT && currentText != null) {
                        currentText.append(parser.getText());
                    }
                } else if (event == XmlPullParser.END_TAG) {
                    if ("t".equalsIgnoreCase(tag)) {
                        insideT = false;
                    } else if ("si".equalsIgnoreCase(tag)) {
                        insideSi = false;
                        sharedStrings.add(currentText != null ? currentText.toString() : "");
                        currentText = null;
                    }
                }
                event = parser.next();
            }
        }

        byte[] sheetBytes = zipFiles.get("xl/worksheets/sheet1.xml");
        if (sheetBytes == null) {
            for (Map.Entry<String, byte[]> e : zipFiles.entrySet()) {
                if (e.getKey().startsWith("xl/worksheets/")) {
                    sheetBytes = e.getValue();
                    break;
                }
            }
        }
        if (sheetBytes == null) {
            return "";
        }

        XmlPullParser sheetParser = Xml.newPullParser();
        sheetParser.setInput(new ByteArrayInputStream(sheetBytes), "utf-8");
        int event = sheetParser.getEventType();

        StringBuilder csvOut = new StringBuilder();
        List<String> rowCells = new ArrayList<>();
        String cellRef = null;
        String cellType = null;
        StringBuilder cellValue = null;
        boolean insideV = false;

        while (event != XmlPullParser.END_DOCUMENT) {
            String tag = sheetParser.getName();
            if (event == XmlPullParser.START_TAG) {
                if ("row".equalsIgnoreCase(tag)) {
                    rowCells.clear();
                } else if ("c".equalsIgnoreCase(tag)) {
                    cellRef = sheetParser.getAttributeValue(null, "r");
                    cellType = sheetParser.getAttributeValue(null, "t");
                    cellValue = new StringBuilder();
                } else if ("v".equalsIgnoreCase(tag)) {
                    insideV = true;
                }
            } else if (event == XmlPullParser.TEXT) {
                if (insideV && cellValue != null) {
                    cellValue.append(sheetParser.getText());
                }
            } else if (event == XmlPullParser.END_TAG) {
                if ("v".equalsIgnoreCase(tag)) {
                    insideV = false;
                } else if ("c".equalsIgnoreCase(tag)) {
                    int colIdx = colIndexFromRef(cellRef);
                    String val = cellValue != null ? cellValue.toString().trim() : "";
                    if ("s".equalsIgnoreCase(cellType)) {
                        try {
                            int sIdx = Integer.parseInt(val);
                            if (sIdx >= 0 && sIdx < sharedStrings.size()) {
                                val = sharedStrings.get(sIdx);
                            }
                        } catch (Exception ignored) {}
                    }
                    while (rowCells.size() <= colIdx) {
                        rowCells.add("");
                    }
                    if (colIdx >= 0) {
                        rowCells.set(colIdx, val);
                    }
                    cellRef = null;
                    cellType = null;
                    cellValue = null;
                } else if ("row".equalsIgnoreCase(tag)) {
                    if (!rowCells.isEmpty()) {
                        StringBuilder line = new StringBuilder();
                        for (int i = 0; i < rowCells.size(); i++) {
                            if (i > 0) line.append(",");
                            String v = rowCells.get(i);
                            if (v.contains(",") || v.contains("\"") || v.contains("\n")) {
                                line.append("\"").append(v.replace("\"", "\"\"")).append("\"");
                            } else {
                                line.append(v);
                            }
                        }
                        csvOut.append(line).append("\n");
                    }
                }
            }
            event = sheetParser.next();
        }

        return csvOut.toString();
    }

    private static int colIndexFromRef(String ref) {
        if (ref == null || ref.isEmpty()) return -1;
        int col = 0;
        int count = 0;
        for (int i = 0; i < ref.length(); i++) {
            char c = ref.charAt(i);
            if (Character.isLetter(c)) {
                col = col * 26 + (Character.toUpperCase(c) - 'A' + 1);
                count++;
            } else {
                break;
            }
        }
        return count > 0 ? col - 1 : -1;
    }
}

# Agreement HTML template

`agreement-template.html` is a browser-safe copy of the supplied agreement draft. It preserves the contract wording, headings, numbered clauses, footer contact fields, signature section, and appendix page-break markers.

The template uses these escaped placeholders:

| Placeholder | UI value |
| --- | --- |
| `{{studentName}}` | Resident full name |
| `{{studentId}}` | Resident NIC / ID |
| `{{wardenName}}` | Hostel warden name |
| `{{wardenId}}` | Hostel warden NIC / ID |
| `{{startDate}}` | Accommodation start date |
| `{{roomNo}}` | Allocated room/bed |
| `{{monthlyRent}}` | Monthly accommodation fee |
| `{{monthlyRentWords}}` | Monthly fee in words |
| `{{depositAmount}}` | Security deposit |
| `{{depositAmountWords}}` | Deposit in words |
| `{{hostelTelephone}}` | Hostel telephone |
| `{{hostelEmail}}` | Hostel email |

Use `front/lib/agreement-template.ts` to render the template. Values are HTML-escaped, and unknown tokens remain visible so an incomplete agreement cannot silently lose a contract field.

The existing DOCX renderer remains the active PDF path until the backend can render this HTML with a fixed Chromium version and print CSS. That future server-side renderer should become the single source of truth for preview and PDF output.

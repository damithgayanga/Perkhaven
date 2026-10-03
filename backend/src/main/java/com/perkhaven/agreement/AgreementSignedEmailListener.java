package com.perkhaven.agreement;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.perkhaven.billing.MailGateway;
import com.perkhaven.common.audit.AuditService;
import java.util.Locale;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class AgreementSignedEmailListener {
    private static final Logger log = LoggerFactory.getLogger(AgreementSignedEmailListener.class);
    private static final String MANAGEMENT_EMAIL = "management@perkhaven.lk";

    private final AgreementRepository agreements;
    private final ObjectMapper json;
    private final AgreementPdfService pdf;
    private final MailGateway mail;
    private final AuditService audit;

    public AgreementSignedEmailListener(
            AgreementRepository agreements,
            ObjectMapper json,
            AgreementPdfService pdf,
            MailGateway mail,
            AuditService audit) {
        this.agreements = agreements;
        this.json = json;
        this.pdf = pdf;
        this.mail = mail;
        this.audit = audit;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void sendConfirmation(AgreementSignedEvent event) {
        var agreement = agreements.findById(event.agreementId()).orElse(null);
        if (agreement == null) return;

        var student = agreement.getStudent();
        var recipient = student.getEmail();
        if (recipient == null || recipient.isBlank()
                || recipient.toLowerCase(Locale.ROOT).contains("@invalid.")
                || recipient.toLowerCase(Locale.ROOT).endsWith(".invalid")) {
            audit.record("EMAIL_SKIPPED", "AGREEMENT", agreement.getAgreementNo(), "No valid student email address");
            return;
        }

        try {
            var data = json.readTree(agreement.getAgreementDataJson());
            var signedAt = agreement.getSignedAt() == null ? "" : agreement.getSignedAt().toString();
            var signature = new AgreementPdfService.Signature(agreement.getSignedName(), signedAt);
            var attachment = pdf.renderPdf(data, signature);
            var filename = agreement.getAgreementNo() + "-Rev." + String.format("%02d", agreement.getRevision()) + "-Signed.pdf";
            var subject = "Confirmation of Signed Hostel Accommodation Agreement - " + agreement.getAgreementNo();

            var body = """
Dear %s,

This email confirms that you electronically signed your Hostel Accommodation Agreement (%s, Rev.%02d) on %s. A copy of the signed Agreement is attached for your records.

By signing the Agreement, you specifically confirmed that:

1. Minimum stay
I understand the minimum stay is six (6) months. If I leave earlier without written approval, I remain liable for fees and other amounts due under the Agreement, which may be deducted from my Security Deposit.

2. Check-Out notice
I must give at least one (1) calendar month's written Check-Out Notice. My Check-Out Date will be the later of one month after notice or my requested date, and Accommodation Fees remain payable through that date.

3. Hostel Rules
I agree to comply with Appendix 1 and any reasonable rule amendments communicated by Hostel Management. Material or repeated breaches may result in termination, and serious breaches may result in immediate termination in accordance with the Agreement.

4. Inventory / damage
I confirm the Appendix 2 items handed over to me are in good condition, except any defects recorded at handover. I will return them in the same condition, fair wear and tear excepted, and I am responsible for reasonable repair/replacement costs and the applicable administration fee for loss or damage attributable to me.

This email has been copied to The Perk Haven Management at management@perkhaven.lk.

If you believe any information is incorrect, or if you have any question concerning the Agreement or the confirmations above, please contact management@perkhaven.lk promptly.

The electronically signed Agreement and the acknowledgements recorded at the time of signing will be retained as evidence of your acceptance. The Agreement will be treated as binding between the parties in accordance with its terms and applicable law.

Regards,
The Perk Haven Management
management@perkhaven.lk
""".formatted(
                    (student.getFirstName() + " " + student.getLastName()).trim(),
                    agreement.getAgreementNo(),
                    agreement.getRevision(),
                    signedAt);

            var result = mail.sendWithCc(
                    recipient.trim(),
                    MANAGEMENT_EMAIL,
                    subject,
                    body,
                    filename,
                    attachment);

            audit.record("EMAIL_SENT", "AGREEMENT", agreement.getAgreementNo(),
                    "Signed agreement confirmation sent to " + recipient + " · cc " + MANAGEMENT_EMAIL + " · " + result);
        } catch (Exception exception) {
            log.error("Unable to send signed agreement confirmation for {}", agreement.getAgreementNo(), exception);
            audit.record("EMAIL_FAILED", "AGREEMENT", agreement.getAgreementNo(),
                    exception.getMessage() == null ? exception.getClass().getSimpleName() : exception.getMessage());
        }
    }
}

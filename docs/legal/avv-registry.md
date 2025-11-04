# AVV/DPA Registry

## Overview
This registry tracks all Data Processing Agreements (DPAs) and Auftragsverarbeitungsverträge (AVVs) with third-party processors as required by GDPR Article 28.

**Last Updated**: 2025-11-04
**Maintained By**: Legal/Compliance Team
**Review Frequency**: Quarterly
**Next Review Date**: 2026-02-04

## What is an AVV/DPA?

**AVV (Auftragsverarbeitungsvertrag)**: German term for "Order Processing Contract"
**DPA (Data Processing Agreement)**: English equivalent

These agreements are mandatory under GDPR Art. 28 when engaging third-party processors who handle personal data on our behalf.

## Processor Registry

| Processor | Type | Signed Date | Contract Number | File Path | Review Date | Status | Notes |
|-----------|------|-------------|-----------------|-----------|-------------|--------|-------|
| Hetzner Online GmbH | AVV | _[TO BE FILLED]_ | _[TO BE FILLED]_ | `docs/legal/avv-contracts/hetzner-avv-signed.pdf` | _[TO BE FILLED]_ | Pending | Hosting & Infrastructure |
| Stripe, Inc. | DPA | _[TO BE FILLED]_ | N/A | `docs/legal/avv-contracts/stripe-dpa-signed.pdf` | _[TO BE FILLED]_ | Pending | Payment Processing |

### Legend
- **Status Options**: Pending, Active, Under Review, Terminated, Expired
- **Type**: AVV (German), DPA (English), or other equivalent
- **Contract Number**: Reference number provided by processor (if available)
- **Review Date**: When contract should be reviewed next (typically annually)

## Processor Details

### Hetzner Online GmbH

**Role**: Processor (Infrastructure Provider)
**Service**: Dedicated servers, hosting, data center services
**Data Processed**: All data stored on our servers (customer data, bookings, health data, etc.)
**Location**: Germany (Nuremberg, Falkenstein data centers)
**Website**: https://www.hetzner.com

**Key Details**:
- **Certification**: ISO 27001
- **Data Center Locations**: Germany (EU)
- **Sub-Processors**: Network providers, hardware suppliers (list in AVV)
- **Retention**: As per service agreement
- **Termination**: Per hosting contract terms

**Contact**:
- Legal: legal@hetzner.com
- Support: support@hetzner.com
- Phone: +49 (0)9831 505-0

**Related Documents**:
- [ ] AVV Contract: `docs/legal/avv-contracts/hetzner-avv-signed.pdf`
- [ ] Technical & Organizational Measures: Detailed in AVV
- [ ] Sub-Processors List: Included in AVV
- [ ] Checklist: `docs/legal/avv-hetzner-checklist.md`

**Review History**:
- _[TO BE FILLED AFTER FIRST REVIEW]_

---

### Stripe, Inc.

**Role**: Processor (Payment Service Provider)
**Service**: Payment processing, subscription management, fraud detection
**Data Processed**: Payment data, cardholder information, transaction records, customer billing details
**Location**: United States (with EU data residency options)
**Website**: https://www.stripe.com

**Key Details**:
- **Certification**: PCI DSS Level 1, SOC 1, SOC 2, ISO 27001
- **Data Center Locations**: Global (AWS, Google Cloud)
- **Sub-Processors**: AWS, Google Cloud, Sift, payment networks (full list in dashboard)
- **Retention**: 7 years (regulatory requirement)
- **Termination**: Immediate upon account closure + retention period
- **Data Transfers**: Standard Contractual Clauses (SCCs) for EU-US transfers

**Contact**:
- Privacy: privacy@stripe.com
- Legal: legal@stripe.com
- Support: support@stripe.com (or via dashboard)

**Related Documents**:
- [ ] DPA Contract: `docs/legal/avv-contracts/stripe-dpa-signed.pdf`
- [ ] Sub-Processors List: Available in Stripe Dashboard
- [ ] SOC 2 Report: Request from Stripe Dashboard
- [ ] Checklist: `docs/legal/avv-stripe-checklist.md`

**Review History**:
- _[TO BE FILLED AFTER FIRST REVIEW]_

---

## Future Processors (To Be Added)

As we add new third-party services that process personal data, they must be added to this registry.

**Potential Future Processors**:
- Email service provider (e.g., SendGrid, Mailgun)
- Analytics provider (if using Google Analytics, Mixpanel, etc.)
- Customer support platform (e.g., Zendesk, Intercom)
- SMS provider (e.g., Twilio)
- Cloud storage (e.g., S3, if separate from Hetzner)
- Backup service provider
- CDN provider (e.g., CloudFlare)
- Monitoring/logging service (e.g., Sentry, DataDog)

**Action Required**: Before engaging any new service that processes personal data:
1. Assess if they are a "processor" under GDPR
2. Request their DPA/AVV
3. Complete checklist (create if needed)
4. Sign agreement
5. Add to this registry

## Instructions for Updating Registry

### After Signing a New AVV/DPA

1. **Update the table above** with:
   - Signed Date: Date when contract was executed (format: YYYY-MM-DD)
   - Contract Number: Reference number from document (or "N/A" if not provided)
   - File Path: Path to signed PDF (verify file exists)
   - Review Date: Typically `[Signed Date + 1 year]`
   - Status: Change from "Pending" to "Active"
   - Notes: Brief description or any special terms

2. **Update the Processor Details section**:
   - Check off the related documents checklist
   - Add to Review History with date and any findings

3. **Commit to Git**:
   ```bash
   git add docs/legal/avv-registry.md
   git add docs/legal/avv-contracts/[new-file].pdf
   git commit -m "docs: update AVV registry with [Processor Name] agreement"
   git push
   ```

4. **Notify Stakeholders**:
   - Inform legal team
   - Notify compliance officer
   - Update any compliance tracking systems

### During Annual Review

1. **For Each Processor**:
   - Verify contract is still valid (not expired)
   - Check for any processor changes (new sub-processors, location changes)
   - Review if our data processing has changed (new data types, new purposes)
   - Verify contact information is still current
   - Check for updated versions of DPA/AVV
   - Request updated security certifications (SOC 2, ISO, etc.)

2. **Update Review History**:
   ```
   - YYYY-MM-DD: Annual review completed. [Findings: No changes needed / Updated sub-processor list / etc.]
   ```

3. **Update Review Date**:
   - Set next review date to `[Current Date + 1 year]`

4. **Document Changes**:
   - If processor made changes, document in Notes column
   - If we need to update agreement, create task and track

### When Terminating a Processor

1. **Update Status**: Change to "Terminated"
2. **Update Notes**: Add termination date and reason
3. **Data Deletion**:
   - Verify processor deletes/returns all data per agreement
   - Document deletion confirmation in Notes
   - Keep signed agreement for records (7 years minimum)
4. **Archive**: Move to "Terminated Processors" section (see below)

## Terminated Processors

_None yet. When a processor relationship ends, move entry here for records._

| Processor | Type | Signed Date | Terminated Date | Contract Number | File Path | Reason | Data Deletion Confirmed |
|-----------|------|-------------|-----------------|-----------------|-----------|--------|------------------------|
| _Example Processor_ | DPA | 2024-01-15 | 2025-10-01 | EX-123 | `docs/legal/avv-contracts/archive/example-dpa.pdf` | Switched providers | Yes (2025-10-15) |

## Compliance Checklist

### Initial Setup (One-Time)
- [x] Registry created
- [ ] Hetzner AVV signed and documented
- [ ] Stripe DPA signed and documented
- [ ] All current processors identified
- [ ] All contracts stored securely
- [ ] Review schedule established

### Ongoing Compliance (Recurring)
- [ ] Quarterly: Review registry for updates needed
- [ ] Annually: Review each DPA/AVV for changes
- [ ] As Needed: Add new processors before go-live
- [ ] As Needed: Update processor details when notified of changes
- [ ] As Needed: Terminate processors properly with data deletion

### Red Flags (Action Required Immediately)
- [ ] Processor notifies of sub-processor change without our approval
- [ ] Processor suffers data breach affecting our data
- [ ] Processor moves data to new jurisdiction
- [ ] Processor changes terms without notification
- [ ] Processor fails to respond to data subject requests
- [ ] Processor's certifications expire/are revoked

## Data Processing Inventory Summary

For quick reference, summary of what each processor handles:

| Processor | Personal Data | Special Category Data | Retention | Purpose |
|-----------|--------------|----------------------|-----------|---------|
| Hetzner | Names, emails, phone, IPs, booking data | Health data (piercing/tattoo details) | Service lifetime + legal | Hosting & infrastructure |
| Stripe | Names, emails, payment details, billing addresses | None | 7 years (regulatory) | Payment processing |

### Data Categories Legend
- **Personal Data**: Basic identifiers under GDPR Art. 4(1)
- **Special Category Data**: Sensitive data under GDPR Art. 9 (health, biometric, etc.)
- **Retention**: How long processor keeps the data
- **Purpose**: Why processor needs access to the data

## GDPR Art. 28 Compliance References

### Required Elements in DPA/AVV
- [x] Subject matter and duration of processing
- [x] Nature and purpose of processing
- [x] Type of personal data
- [x] Categories of data subjects
- [x] Obligations and rights of controller (us)
- [x] Processor obligations (them)
- [x] Sub-processor authorization
- [x] Security measures (Art. 32)
- [x] Data breach notification
- [x] Data deletion/return upon termination
- [x] Audit rights
- [x] International data transfers (if applicable)

### Verification Checklist
Before signing any DPA/AVV, verify it contains all required elements above.

## Related Documentation

### Internal Documents
- `/docs/legal/gdpr-compliance-plan.md` - Overall GDPR strategy
- `/docs/legal/avv-hetzner-checklist.md` - Hetzner signing guide
- `/docs/legal/avv-stripe-checklist.md` - Stripe signing guide
- `/docs/legal/technical-organizational-measures.md` - Our security measures
- `/docs/legal/privacy-policy.md` - Customer-facing privacy policy
- `/docs/legal/data-processing-inventory.md` - Complete data processing inventory

### External Resources
- GDPR Art. 28: https://gdpr-info.eu/art-28-gdpr/
- EDPB Guidelines on processors: https://edpb.europa.eu/our-work-tools/our-documents/guidelines_en
- German DPA example templates: https://www.datenschutz.de/muster/

## Support Contacts

### Internal
- **Registry Maintainer**: Legal/Compliance Team
- **Questions**: compliance@massava.com
- **Updates**: Submit PR or notify legal team

### External
- **GDPR Consultant**: [If you have one]
- **Legal Counsel**: [Your law firm]
- **Data Protection Officer**: [If appointed]

## Audit Trail

This section tracks significant changes to the registry itself.

| Date | Changed By | Change Description |
|------|-----------|-------------------|
| 2025-11-04 | Claude (AI Assistant) | Initial registry creation |
| _[Future]_ | _[Name]_ | _[Description]_ |

## Notes

### Best Practices
1. **Review annually minimum**: Set calendar reminders
2. **Document everything**: Keep email trails of processor communications
3. **Before go-live**: Always sign DPA before using new service in production
4. **Sub-processors**: Track when processors notify of sub-processor changes
5. **Centralize storage**: Keep all DPAs in `docs/legal/avv-contracts/`
6. **Version control**: Track DPAs in git for audit trail
7. **Backup**: Maintain backup copies outside git (secure cloud storage)

### Common Mistakes to Avoid
- ❌ Using service before signing DPA
- ❌ Not reviewing sub-processor lists
- ❌ Assuming DPA is optional for "small" processors
- ❌ Forgetting to review annually
- ❌ Not documenting data deletion after termination
- ❌ Accepting DPA without reading (especially security terms)

### When in Doubt
If unsure whether a service requires a DPA/AVV:
1. Ask: "Does this service process personal data on our behalf?"
2. If yes: Get DPA before production use
3. If no: Document why it's not a processor relationship
4. If unclear: Consult with legal/compliance team

---

**End of Registry**

**Version**: 1.0
**Last Updated**: 2025-11-04
**Next Full Review**: 2026-11-04

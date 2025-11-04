# Stripe DPA (Data Processing Agreement) Signing Checklist

## Overview
**Purpose**: Accept Stripe's Data Processing Agreement for GDPR Art. 28 compliance
**Estimated Time**: 20-30 minutes
**Difficulty**: Easy
**Prerequisites**: Stripe Dashboard access, authority to accept legal terms

## Prerequisites Checklist

### Required Information
- [ ] Stripe account with active status
- [ ] Company legal name matching Stripe account
- [ ] Authority to accept legal agreements
- [ ] Understanding of Stripe's data processing role

### Required Access
- [ ] Stripe Dashboard credentials
- [ ] Access to https://dashboard.stripe.com
- [ ] Account Owner or Admin role (standard users may not see DPA)

### Understanding Stripe's Role
- [ ] Stripe processes payment data on our behalf
- [ ] Stripe is a "processor" under GDPR
- [ ] We (Massava) are the "controller"
- [ ] Stripe has standard DPA terms (non-negotiable for most merchants)

## Step-by-Step Process

### Step 1: Access Stripe Dashboard
**Estimated Time**: 2 minutes

1. Navigate to https://dashboard.stripe.com
2. Log in with your Stripe credentials
3. Ensure you're viewing the correct account (check top-left account selector)
4. Verify you have Owner or Admin permissions

**Screenshot Description**: Dashboard home page with navigation sidebar on left

**Note**: If you have multiple Stripe accounts, ensure you're in the production account for Massava.

### Step 2: Navigate to Data Processing Agreement
**Estimated Time**: 3 minutes

**Path 1 (Primary)**:
1. Click on "Settings" in the top-right corner (gear icon)
2. In the left sidebar, scroll to "Business settings" section
3. Click on "Data processing"
4. Look for "Data Processing Agreement" or "DPA" section

**Path 2 (Alternative)**:
1. Click on "Settings" (gear icon)
2. Select "Business" or "Business settings"
3. Find "Legal" or "Compliance" section
4. Click on "Data Processing Agreement"

**Direct URL** (may work):
```
https://dashboard.stripe.com/settings/compliance/data-processing-addendum
```

**Screenshot Description**: Settings page with "Data processing" highlighted in sidebar

### Step 3: Review Stripe's Standard DPA
**Estimated Time**: 15 minutes

**Key Sections to Review**:

#### 3.1 Scope of Processing
- [ ] Confirm Stripe processes: cardholder data, transaction data, customer PII
- [ ] Verify processing is limited to payment services
- [ ] Check that processing aligns with our use case

#### 3.2 Stripe's Obligations
- [ ] Verify Stripe commits to GDPR compliance
- [ ] Check confidentiality obligations
- [ ] Review security measures (encryption, access controls)
- [ ] Confirm data breach notification procedures

#### 3.3 Sub-Processors
- [ ] Review Stripe's list of sub-processors
- [ ] Common sub-processors include:
  - AWS (infrastructure)
  - Google Cloud (infrastructure)
  - Sift (fraud detection)
  - Various payment networks (Visa, Mastercard, etc.)
- [ ] Verify you accept sub-processor usage
- [ ] Check if you'll be notified of sub-processor changes

#### 3.4 Data Subject Rights
- [ ] Confirm Stripe will assist with GDPR requests:
  - Right to access
  - Right to rectification
  - Right to erasure
  - Right to data portability
  - Right to object
- [ ] Note process for submitting data subject requests

#### 3.5 Data Transfers
- [ ] Review how Stripe handles international data transfers
- [ ] Verify Standard Contractual Clauses (SCCs) are in place
- [ ] Check if data is transferred outside EU/EEA
- [ ] Confirm adequacy of transfer mechanisms

#### 3.6 Data Retention and Deletion
- [ ] Understand retention periods:
  - Payment data: typically 7 years (regulatory requirements)
  - Customer data: as needed for services + legal obligations
- [ ] Check deletion procedures upon contract termination

#### 3.7 Security Measures
- [ ] Verify Stripe's technical and organizational measures:
  - PCI DSS Level 1 compliance
  - Encryption (in transit and at rest)
  - Access controls
  - Regular security audits
  - SOC 1 and SOC 2 Type II reports
  - ISO 27001 certification

#### 3.8 Audit Rights
- [ ] Review your right to audit Stripe
- [ ] Note: Usually through attestations/certifications rather than on-site audits
- [ ] Check availability of audit reports (SOC 2, etc.)

**Download DPA Document**:
- Look for "Download DPA" or "View full agreement" button
- Save PDF for your records: `stripe-dpa-template.pdf`

### Step 4: Verify Company Information
**Estimated Time**: 2 minutes

Before accepting, verify Stripe has correct company details:

1. Go to Settings → Business settings → Public business information
2. Confirm:
   - [ ] Legal business name is correct
   - [ ] Business address is current
   - [ ] Contact email is monitored
   - [ ] Tax ID/VAT number is accurate (if applicable)

**Why This Matters**: The DPA will be associated with this company information.

### Step 5: Understand Stripe's Standard Terms
**Estimated Time**: 3 minutes

**Important Notes**:

1. **Non-Negotiable**: Stripe's DPA is standard for most merchants
   - Cannot customize terms unless Enterprise account
   - Terms are designed for GDPR compliance

2. **Automatic Updates**:
   - Stripe may update DPA terms
   - You'll be notified of material changes
   - Continued use = acceptance of updates

3. **Multi-Jurisdiction Coverage**:
   - DPA covers GDPR (EU)
   - Also covers CCPA (California), UK GDPR, etc.
   - One agreement for multiple jurisdictions

4. **Integration with Terms of Service**:
   - DPA supplements Stripe's Terms of Service
   - Both documents govern the relationship
   - In case of conflict, DPA takes precedence for data processing

### Step 6: Accept the DPA
**Estimated Time**: 2 minutes

**Acceptance Process**:

1. Locate the "Accept" or "Agree to DPA" button
2. You may see a checkbox: "I have read and agree to the Data Processing Agreement"
3. Check the box
4. Click "Accept DPA" or "Agree"

**What Happens**:
- Acceptance is recorded with timestamp
- Your user account is logged as acceptor
- DPA becomes legally binding immediately
- You'll receive confirmation email

**Screenshot Description**: Acceptance dialog with checkbox and "Accept" button

**Important**: Ensure you have legal authority to accept on behalf of company!

### Step 7: Download Executed DPA
**Estimated Time**: 3 minutes

**After Acceptance**:

1. Look for "Download signed DPA" or "Download executed agreement" link
2. Click to download PDF
3. The PDF should include:
   - Full DPA text
   - Your company information
   - Acceptance date and timestamp
   - Accepted by (your name/email)
   - Stripe signature/attestation

**File Verification**:
- [ ] PDF opens correctly
- [ ] Company name is correct
- [ ] Date is accurate
- [ ] All pages are present (typically 10-20 pages)

**Save File**:
```bash
Location: /Users/roman/Development/massava/docs/legal/avv-contracts/
Filename: stripe-dpa-signed.pdf
Full Path: /Users/roman/Development/massava/docs/legal/avv-contracts/stripe-dpa-signed.pdf
```

**Naming Convention** (if you want to include date):
```
stripe-dpa-signed-YYYY-MM-DD.pdf
Example: stripe-dpa-signed-2025-11-04.pdf
```

### Step 8: Download Supporting Documentation
**Estimated Time**: 5 minutes

**Additional Documents to Collect**:

#### 8.1 Sub-Processors List
- Location: Settings → Data processing → Sub-processors
- Download current list as PDF or CSV
- Save as: `stripe-subprocessors-list-YYYY-MM-DD.pdf`

#### 8.2 Security Certifications
- SOC 2 Type II Report:
  - Location: Settings → Security → Compliance reports
  - Request access if not immediately available
  - Save when received: `stripe-soc2-report-YYYY.pdf`

#### 8.3 Standard Contractual Clauses (SCCs)
- Check if separate SCC document is available
- Usually integrated into main DPA
- Save if available: `stripe-sccs-YYYY.pdf`

**Note**: Some documents may require special request or Enterprise account.

### Step 9: Update AVV Registry
**Estimated Time**: 2 minutes

1. Open `/Users/roman/Development/massava/docs/legal/avv-registry.md`
2. Update the Stripe row with:
   - **Processor**: Stripe, Inc.
   - **Type**: DPA (Data Processing Agreement)
   - **Signed Date**: `[Today's date: YYYY-MM-DD]`
   - **Contract Number**: `N/A` (Stripe doesn't provide contract numbers)
   - **File Path**: `docs/legal/avv-contracts/stripe-dpa-signed.pdf`
   - **Review Date**: `[Today's date + 1 year]`
   - **Status**: `Active`
   - **Notes**: `Standard DPA accepted via Dashboard`
3. Save the registry file
4. Commit to git

### Step 10: Set Up Monitoring
**Estimated Time**: 3 minutes

**Create Reminders**:

1. **Annual Review** (recommended):
   - Calendar event: `[Today's date + 1 year]`
   - Task: "Review Stripe DPA for updates"
   - Notification: 2 weeks before

2. **Sub-Processor Changes**:
   - Check if Stripe offers email notifications
   - Settings → Notifications → Legal/compliance updates
   - Enable notifications for DPA/compliance changes

3. **Security Updates**:
   - Monitor Stripe status page: https://status.stripe.com
   - Subscribe to security advisories
   - Check for updated SOC 2 reports annually

### Step 11: Document Internal Processing Details
**Estimated Time**: 5 minutes

**For Internal Records**, document:

#### Data We Send to Stripe:
```
1. Customer Payment Data:
   - Card numbers (tokenized by Stripe.js)
   - Cardholder names
   - Billing addresses
   - Email addresses
   - Phone numbers (optional)

2. Transaction Data:
   - Payment amounts
   - Currency
   - Transaction timestamps
   - Order descriptions
   - Metadata (booking IDs, customer IDs)

3. Customer Identifiers:
   - Stripe Customer IDs (created by Stripe)
   - Our internal customer IDs (as metadata)

4. Business Data:
   - Payout information
   - Business verification documents
   - Tax information
```

#### Data Stripe Returns to Us:
```
1. Transaction Results:
   - Payment status (success/failed)
   - Payment intents
   - Charge IDs
   - Receipt URLs

2. Customer Objects:
   - Stripe Customer IDs
   - Payment method tokens
   - Subscription status

3. Webhook Events:
   - Payment confirmations
   - Refund notifications
   - Dispute alerts
   - Subscription changes
```

**Save this documentation** in our internal systems for GDPR record-keeping.

### Step 12: Confirmation Steps
**Estimated Time**: 2 minutes

- [ ] DPA accepted in Stripe Dashboard
- [ ] Confirmation email received from Stripe
- [ ] Signed PDF downloaded and saved
- [ ] Sub-processors list downloaded
- [ ] AVV registry updated
- [ ] Git changes committed
- [ ] Calendar reminders set
- [ ] Team members notified (legal, compliance, finance)
- [ ] Internal documentation updated

## Troubleshooting

### Issue: Cannot Find DPA Section
**Solution**:
- Verify you have Owner or Admin role
- Try direct URL: https://dashboard.stripe.com/settings/compliance/data-processing-addendum
- Contact Stripe support via Dashboard chat
- Check if DPA is under different menu (UI may change)

### Issue: DPA Already Accepted (by someone else)
**Solution**:
- Check who accepted and when: Settings → Data processing
- Download currently executed DPA
- Verify acceptor had authority
- If needed, contact Stripe to re-execute
- Document in registry who accepted originally

### Issue: Need Custom DPA Terms
**Solution**:
- Standard accounts cannot negotiate terms
- Contact Stripe sales for Enterprise account
- Enterprise accounts may get custom DPAs
- Note: This is rare and expensive
- Alternative: Accept standard DPA and document internally

### Issue: Download Not Working
**Solution**:
- Try different browser (Chrome recommended)
- Clear browser cache
- Disable browser extensions
- Contact Stripe support with screenshot
- As backup, save page as PDF (not ideal but acceptable)

### Issue: Company Information Incorrect
**Solution**:
- Update in Settings → Business settings first
- May need to verify changes (email/documents)
- After verification, proceed with DPA acceptance
- Cannot change company info after DPA acceptance easily

### Issue: Cannot Accept (Greyed Out)
**Solution**:
- Verify account is fully activated
- Check that you have Owner/Admin permissions
- Ensure no pending verification requirements
- Contact Stripe support if issue persists

## Post-Acceptance Tasks

### Immediate (Same Day)
- [ ] Inform legal team of completion
- [ ] Notify compliance officer
- [ ] Update GDPR compliance tracking
- [ ] File in contract management system

### Within 1 Week
- [ ] Share with finance team (for payment processing context)
- [ ] Update data processing inventory
- [ ] Review if any integration changes needed
- [ ] Document Stripe's role in privacy policy (if not already done)

### Quarterly
- [ ] Check for DPA updates (Stripe will notify)
- [ ] Review sub-processors for changes
- [ ] Verify contact information is current

### Annual Review
- [ ] Re-review DPA terms
- [ ] Check for new security certifications (SOC 2)
- [ ] Verify data processing still aligns with scope
- [ ] Update internal documentation if needed
- [ ] Confirm Stripe's services still meet requirements

## Understanding Data Flows

### Payment Processing Flow:
```
1. Customer enters payment details on Massava frontend
2. Stripe.js tokenizes card (card data never touches our servers)
3. Token sent to Massava backend
4. Massava creates payment via Stripe API (using token)
5. Stripe processes payment with card networks
6. Stripe returns result to Massava
7. Massava confirms booking to customer
```

**Key Point**: Raw card data never reaches Massava servers (PCI DSS scope reduction).

### Data Storage:
- **Massava Stores**: Stripe Customer IDs, payment metadata, transaction references
- **Stripe Stores**: Full payment details, card tokens, transaction history
- **Retention**: Stripe retains per regulatory requirements (typically 7 years)

## Contact Information

### Stripe Support
- **Dashboard Chat**: Available in dashboard (bottom right)
- **Email**: support@stripe.com
- **Phone**: Varies by region (check dashboard)
- **Privacy/DPA Questions**: privacy@stripe.com
- **Legal Questions**: legal@stripe.com

### Stripe Resources
- **Documentation**: https://stripe.com/docs
- **Privacy Center**: https://stripe.com/privacy-center
- **Trust Center**: https://stripe.com/trust-center
- **GDPR Guide**: https://stripe.com/guides/general-data-protection-regulation
- **Status Page**: https://status.stripe.com

### Internal Contacts
- **Legal Questions**: [Your Legal Team]
- **Payment Integration Questions**: [Your Dev Team]
- **Compliance Questions**: [Your Compliance Officer]
- **Finance Questions**: [Your Finance Team]

## References

### Stripe Documentation
- Stripe DPA: https://stripe.com/legal/dpa
- Stripe Privacy Policy: https://stripe.com/privacy
- GDPR on Stripe: https://stripe.com/guides/general-data-protection-regulation
- Sub-Processors: https://stripe.com/service-providers/legal

### GDPR Resources
- GDPR Art. 28: https://gdpr-info.eu/art-28-gdpr/
- GDPR Art. 32 (Security): https://gdpr-info.eu/art-32-gdpr/
- European Data Protection Board: https://edpb.europa.eu

### Related Documents
- `/docs/legal/avv-hetzner-checklist.md` - Hetzner AVV checklist
- `/docs/legal/avv-registry.md` - AVV registry
- `/docs/legal/gdpr-compliance-plan.md` - Overall GDPR compliance
- `/docs/legal/privacy-policy.md` - Our privacy policy

## Appendix: Stripe's Security Features

### PCI DSS Compliance
- **Level**: PCI DSS Level 1 (highest)
- **Scope**: Applies to all Stripe operations
- **Audits**: Annual assessments by QSA
- **Certificate**: Available in Dashboard

### Encryption
- **In Transit**: TLS 1.2+ for all API calls
- **At Rest**: AES-256 for stored data
- **Key Management**: Hardware Security Modules (HSMs)

### Access Controls
- **Authentication**: Multi-factor authentication required
- **Authorization**: Role-based access control
- **Monitoring**: All access logged and monitored
- **Reviews**: Regular access reviews

### Certifications & Audits
- SOC 1 Type II
- SOC 2 Type II
- ISO 27001
- PCI DSS Level 1
- Annual penetration testing

## Version History
- **v1.0** - 2025-11-04 - Initial checklist created
- **Last Review**: 2025-11-04
- **Next Review**: 2026-11-04

---

**Checklist Status**: [ ] Not Started | [ ] In Progress | [ ] Completed
**Accepted Date**: ___________
**Accepted By**: ___________
**Confirmation Email Received**: [ ] Yes [ ] No

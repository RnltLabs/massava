# Hetzner AVV (Auftragsverarbeitungsvertrag) Signing Checklist

## Overview
**Purpose**: Sign Data Processing Agreement with Hetzner Online GmbH for GDPR Art. 28 compliance
**Estimated Time**: 45-60 minutes
**Difficulty**: Moderate
**Prerequisites**: Hetzner Robot account, company information, legal authority to sign

## Prerequisites Checklist

### Required Information
- [ ] Company legal name (Massava [Legal Entity Name])
- [ ] Company registration number
- [ ] Complete company address
- [ ] Contact person name and email
- [ ] Phone number
- [ ] Tax ID / VAT number (if applicable)

### Required Access
- [ ] Hetzner Robot account credentials
- [ ] Access to https://robot.hetzner.com
- [ ] Authority to sign legal contracts on behalf of company

### Technical Information Required
- [ ] List of servers/services used (IPs, server names)
- [ ] Data processing details (see Section 4)

## Step-by-Step Process

### Step 1: Access Hetzner Robot Panel
**Estimated Time**: 2 minutes

1. Navigate to https://robot.hetzner.com
2. Log in with your Hetzner Robot credentials
3. Verify you have access to the main dashboard
4. Note your customer number (displayed in top right)

**Screenshot Description**: Main dashboard with navigation menu on left side

### Step 2: Navigate to AVV Section
**Estimated Time**: 2 minutes

1. From the main dashboard, click on "Server" in the left sidebar
2. Look for "Order Processing Contract" or "Auftragsverarbeitungsvertrag" link
3. Alternative path: Go to Account → Contracts → Order Processing Contract
4. Or directly access: https://robot.hetzner.com/avv

**Note**: The exact menu location may vary. Look for "AVV", "DPA", or "Order Processing Contract"

### Step 3: Review Hetzner's Standard Terms
**Estimated Time**: 15 minutes

1. Read through Hetzner's standard AVV template
2. Key sections to review:
   - Scope of processing
   - Data protection obligations
   - Sub-processors list
   - Technical and organizational measures
   - Support in case of data breaches
3. Download a copy for your records (if available)

**Important**: Hetzner uses a standard template. If you need custom terms, contact their legal department first.

### Step 4: Complete Controller Information
**Estimated Time**: 5 minutes

Fill out the following fields about Massava (the "Controller"):

**Company Details**:
- Company Name: `[Your Legal Entity Name]`
- Street Address: `[Street and Number]`
- Postal Code: `[Postal Code]`
- City: `[City]`
- Country: `Germany` (or your location)
- Registration Number: `[HRB/Commercial Register Number]`

**Contact Person**:
- Name: `[Authorized Representative]`
- Position: `[Title/Role]`
- Email: `[Contact Email]`
- Phone: `[Contact Phone]`
- Alternative Contact (optional): `[Backup Contact]`

**Legal Representatives**:
- Managing Director(s): `[Name(s)]`

### Step 5: Define Processing Details
**Estimated Time**: 10 minutes

#### Nature of Processing
Select/Enter:
```
- Hosting and infrastructure services
- Data storage and database management
- Server operation and maintenance
- Backup services
```

#### Purpose of Processing
Enter:
```
Operation of booking platform for tattoo and piercing studios:
- Customer booking management
- Studio profile hosting
- Payment processing coordination
- Service delivery tracking
```

#### Duration of Processing
Enter:
```
Duration: Ongoing, for the lifetime of the service agreement
Start Date: [Date of first server activation]
Expected End Date: Indefinite (terminable with notice period)
```

### Step 6: Specify Data Categories
**Estimated Time**: 5 minutes

**Categories of Data Processed**:
```
1. Personal Identification Data:
   - Names (customers, studio owners, artists)
   - Email addresses
   - Phone numbers
   - User account credentials (hashed)

2. Booking Information:
   - Appointment dates and times
   - Service details
   - Booking history
   - Cancellation records

3. Health-Related Data (Special Category under GDPR Art. 9):
   - Piercing/tattoo placement information
   - Aftercare instructions
   - Health questionnaire responses
   - Medical contraindication information

4. Business Data:
   - Studio profiles
   - Service offerings
   - Pricing information
   - Availability schedules

5. Technical Data:
   - IP addresses
   - Session data
   - Log files
   - System metadata
```

**Important**: Mark health-related data as "special category" under Art. 9 GDPR

### Step 7: Define Data Subjects
**Estimated Time**: 3 minutes

**Categories of Data Subjects**:
```
1. End Customers:
   - Platform users booking services
   - Age: 18+ (with parental consent for minors)

2. Studio Owners:
   - Business operators using the platform
   - Legal representatives

3. Studio Employees:
   - Artists and piercers
   - Administrative staff

4. Website Visitors:
   - Prospective users
   - Anonymous visitors (via logs)
```

### Step 8: Document Technical & Organizational Measures
**Estimated Time**: 10 minutes

**Our Technical Measures Implemented on Hetzner Infrastructure**:

```
1. Encryption:
   - AES-256-GCM for health data at rest
   - Database encryption (PostgreSQL transparent data encryption)
   - Full disk encryption on servers
   - HTTPS/TLS 1.3 for all data in transit
   - End-to-end encryption for sensitive communications

2. Access Controls:
   - Role-Based Access Control (RBAC)
   - Multi-factor authentication (MFA) for admin access
   - SSH key authentication only (no password access)
   - Principle of least privilege
   - Regular access reviews

3. Network Security:
   - Firewall configuration (UFW/iptables)
   - DDoS protection
   - IP whitelisting for administrative access
   - VPN for infrastructure management
   - Network segmentation

4. Application Security:
   - Input validation and sanitization
   - SQL injection prevention
   - XSS protection
   - CSRF tokens
   - Security headers (HSTS, CSP, etc.)

5. Monitoring & Logging:
   - Centralized logging system
   - Audit trail for all data access
   - Real-time security monitoring
   - Intrusion detection system
   - Automated alerting

6. Backup & Recovery:
   - Automated daily backups
   - Encrypted backup storage
   - Off-site backup replication
   - Tested recovery procedures
   - 30-day backup retention

7. Vulnerability Management:
   - Regular security updates
   - Automated patch management
   - Security scanning
   - Penetration testing (annual)
   - Dependency vulnerability checks
```

**Hetzner's Measures** (reference from their documentation):
```
- ISO 27001 certified data centers
- Physical access controls
- 24/7 monitoring
- Redundant power and network
- Regular security audits
```

### Step 9: Specify Sub-Processors
**Estimated Time**: 3 minutes

**Note**: Hetzner may use sub-processors for specific services (e.g., network providers, hardware suppliers).

1. Review Hetzner's list of sub-processors (usually provided in the AVV)
2. Confirm you accept their sub-processors
3. Request notification of sub-processor changes (checkbox if available)

**Our Additional Processors** (not part of Hetzner AVV, but for reference):
- Stripe (payment processing - separate DPA)
- [Any others used]

### Step 10: Data Breach Notification
**Estimated Time**: 2 minutes

**Confirm Contact Information for Breach Notifications**:
- Primary Contact Email: `security@massava.com` (or your security email)
- Phone: `[Emergency Contact Number]`
- Backup Contact: `[Alternative Contact]`

**Notification Requirements**:
- Hetzner must notify within 24 hours of breach detection
- Notification should include: nature of breach, affected data, mitigation measures

### Step 11: Review and Accept
**Estimated Time**: 5 minutes

1. Review all entered information for accuracy
2. Read the legal terms one final time
3. Ensure you have authority to sign
4. Check the acceptance box
5. Enter your name and position
6. Click "Accept" or "Sign Contract"

**Digital Signature**:
- Some versions may require electronic signature
- Follow the prompts for digital signing
- Use company email for verification

### Step 12: Download and Archive
**Estimated Time**: 3 minutes

1. Download the signed AVV as PDF
2. Verify the PDF contains:
   - All your entered information
   - Hetzner's details
   - Signature/acceptance confirmation
   - Date of signing
   - Contract reference number
3. Save the file to: `/Users/roman/Development/massava/docs/legal/avv-contracts/hetzner-avv-signed.pdf`
4. Create a backup copy in secure location
5. Note the contract reference number

**File Naming Convention**:
```
hetzner-avv-signed-YYYY-MM-DD.pdf
Example: hetzner-avv-signed-2025-11-04.pdf
```

### Step 13: Update AVV Registry
**Estimated Time**: 2 minutes

1. Open `/Users/roman/Development/massava/docs/legal/avv-registry.md`
2. Update the Hetzner row with:
   - Signed Date: `[Today's date]`
   - Contract Number: `[From PDF]`
   - File Path: `docs/legal/avv-contracts/hetzner-avv-signed.pdf`
   - Review Date: `[Today's date + 1 year]`
   - Status: `Active`
3. Commit the changes to git

### Step 14: Confirmation Steps
**Estimated Time**: 2 minutes

- [ ] PDF saved in correct location
- [ ] Registry updated
- [ ] Backup copy created
- [ ] Contract reference number noted
- [ ] Calendar reminder set for annual review
- [ ] Informed relevant team members (legal, DevOps, compliance)

## Troubleshooting

### Issue: Cannot Find AVV Section
**Solution**:
- Try direct URL: https://robot.hetzner.com/avv
- Contact Hetzner support: support@hetzner.com
- Check if account has necessary permissions

### Issue: Need Custom Terms
**Solution**:
- Contact Hetzner legal department: legal@hetzner.com
- Request custom AVV negotiation
- Note: This may take 2-4 weeks

### Issue: Form Won't Submit
**Solution**:
- Check all required fields are filled
- Try different browser (Chrome/Firefox recommended)
- Clear browser cache
- Contact Hetzner support with error message

### Issue: Technical Measures Too Complex
**Solution**:
- You can simplify the description
- Focus on high-level measures
- Reference "industry-standard security practices"
- Attach detailed TOM document separately

### Issue: Don't Have All Company Information
**Solution**:
- Contact company legal/finance department
- Check company registration documents
- Review previous contracts with Hetzner

## Post-Signing Tasks

### Immediate (Same Day)
- [ ] Inform legal team of completion
- [ ] Add to compliance tracking system
- [ ] Update internal documentation

### Within 1 Week
- [ ] Share with DevOps team
- [ ] Review if any infrastructure changes needed
- [ ] Document any processing restrictions

### Annual Review
- [ ] Review AVV terms annually
- [ ] Verify sub-processors haven't changed
- [ ] Update technical measures if enhanced
- [ ] Renew if contract has expiration

## Contact Information

### Hetzner Support
- **Email**: support@hetzner.com
- **Phone**: +49 (0)9831 505-0
- **Legal Department**: legal@hetzner.com
- **Support Hours**: 24/7

### Internal Contacts
- **Legal Questions**: [Your Legal Team]
- **Technical Questions**: [Your DevOps Team]
- **Compliance Questions**: [Your Compliance Officer]

## References

### Documentation
- Hetzner AVV Information: https://www.hetzner.com/legal/privacy-policy
- GDPR Art. 28: https://gdpr-info.eu/art-28-gdpr/
- Internal GDPR Compliance Plan: `/docs/legal/gdpr-compliance-plan.md`

### Related Documents
- `/docs/legal/avv-stripe-checklist.md` - Stripe DPA checklist
- `/docs/legal/avv-registry.md` - AVV registry
- `/docs/legal/technical-organizational-measures.md` - Detailed TOM documentation

## Version History
- **v1.0** - 2025-11-04 - Initial checklist created
- **Last Review**: 2025-11-04
- **Next Review**: 2026-11-04

---

**Checklist Status**: [ ] Not Started | [ ] In Progress | [ ] Completed
**Signed Date**: ___________
**Signed By**: ___________
**Contract Number**: ___________

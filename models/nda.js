const mongoose = require("mongoose");

// Define schema for NDA
const ndaSchema = new mongoose.Schema(
  {
    disclosingPartyName: {
      type: String,
      required: true,
    },
    disclosingPartyAddress: {
      type: String,
      required: true,
    },
    disclosingPartyEmail: {
      type: String,
      required: true,
    },
    disclosingPartySignature: {
      type: String,
      required: true,
    },
    disclosingPartySignedDate: {
      type: Date,
      required: true,
    },

    // 🔁 NEW: Track all users who signed the NDA
    receivingParties: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        address: {
          type: String,
          required: true,
        },
        email: {
          type: String,
          required: true,
        },
        signature: {
          type: String,
          required: true,
        },
        signedDate: {
          type: Date,
          required: true,
        },
      },
    ],

    effectiveDate: {
      type: Date,
      required: true,
    },

    // Reference to the idea this NDA is protecting
    idea: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Idea",
    },

    // NDA full legal text
    agreementText: {
      type: String,
      default: `Hierarchy Co. Mutual Non-Disclosure Agreement (Legally Binding)

Effective Date: [Date of electronic acceptance]

This Mutual Non-Disclosure Agreement (the “Agreement”) is entered into as of the Effective Date by and between:

Disclosing Party: [Full Name or Company Name]
Address: [Address]
Email: [Email]

Receiving Party: [Full Name or Company Name]
Address: [Address]
Email: [Email]

Collectively referred to as the “Parties.” The Parties wish to explore a potential business relationship and, in connection therewith, may disclose to each other certain confidential and proprietary information.

1. Definition of Confidential Information
“Confidential Information” means any non-public information, including but not limited to ideas, business plans, technical data, product designs, user data, marketing strategies, and any other proprietary information shared by one Party (“Disclosing Party”) to the other Party (“Receiving Party”), whether orally, in writing, or electronically.

2. Obligations
Receiving Party agrees to:
- Keep the Confidential Information strictly confidential and not disclose it to any third party without prior written consent.
- Use the Confidential Information solely for evaluating a potential business relationship.
- Take reasonable measures to protect the confidentiality of the information, no less than those used to protect its own confidential information.

3. Exclusions
Obligations shall not apply to information that:
- Is or becomes publicly available without breach of this Agreement;
- Was lawfully in the Receiving Party’s possession before receipt;
- Is rightfully received from a third party without restriction;
- Is independently developed without use of or reference to the Disclosing Party’s Confidential Information.

4. Duration
This Agreement shall remain in effect for 2 years from the Effective Date, or until the Confidential Information no longer qualifies as confidential.

5. No License or Obligation
Nothing in this Agreement shall be construed as granting any license or rights to the Confidential Information, except as expressly set forth herein. This Agreement does not obligate either Party to proceed with any transaction or business relationship.

6. Remedies
Each Party acknowledges that unauthorized disclosure or use of Confidential Information may cause irreparable harm and agrees that the Disclosing Party shall be entitled to seek injunctive relief in addition to any other legal remedies.

7. Governing Law and Jurisdiction
This Agreement shall be governed by and construed in accordance with the laws of the State of [Your State]. The Parties consent to the exclusive jurisdiction of the state and federal courts located in [Your State] for any disputes arising out of this Agreement.

8. Electronic Signature
By typing their name and clicking “Sign & Agree,” each Party agrees to the terms of this Agreement and acknowledges that this electronic signature is legally binding and enforceable.`,
    },
  },
  { timestamps: true } // Adds createdAt and updatedAt
);

module.exports = mongoose.model("Nda", ndaSchema);

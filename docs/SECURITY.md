# Security Documentation

## Overview

This document outlines the security measures implemented in the Chatus application, with a focus on Firebase security rules, data validation, and CI/CD security practices.

---

## Firebase Security Rules

### Firestore Security Rules

The application uses comprehensive Firestore security rules to protect user data and prevent unauthorized access.

#### Room Access Control

- **Read Access**: Users can only read rooms they are participants in, or rooms explicitly marked as public
- **Create Access**: Users can only create rooms with themselves as the initial participant
- **Update Access**: 
  - Users can join rooms (self-add to participants) if the room has less than 2 participants
  - Users can leave rooms by removing themselves from participants
  - Maximum room size is limited to 2 participants (1-on-1 chat)

#### Message Security

- **Read Access**: Only room participants can read messages
- **Create Access**: Only authenticated users who are room participants can create messages
- **Update Access**: 
  - Limited to updating `reactions`, `delivered`, and `seen` fields only
  - Senders cannot modify `delivered` or `seen` fields (prevents spoofing)
  - **DoS Prevention**: Reactions array is limited to 50 items maximum to prevent resource exhaustion attacks
- **Delete Access**: Only the message sender can delete their own messages

#### Canvas Collections

**canvasSheets:**
- Read access for room participants only
- Create requires validation:
  - Must include `createdAt` and `createdBy` fields
  - `createdBy` must match authenticated user ID
  - `createdAt` must be a valid timestamp
- Delete operations are disabled

**canvasPaths:**
- Read access for room participants only
- Create requires validation:
  - Must include `points`, `color`, `width`, `createdBy`, and `createdAt` fields
  - `points` must be a list with maximum 10,000 items (prevents DoS)
  - `color` must be a string
  - `width` must be a number
  - `createdBy` must match authenticated user ID
  - `createdAt` must be a valid timestamp
- Delete access for room participants

#### Games Collection

- Read/write access for room participants only
- Write validation:
  - Must include `type`, `state`, `createdBy`, and `createdAt` fields
  - `type` must be one of: `tictactoe`, `chess`, `checkers`, `connect4`
  - `state` must be a map object
  - `createdBy` must be a string
  - `createdAt` must be a valid timestamp

#### User Profiles

- **Create**: Users can only create their own profile
- **Read**: Users can read public profiles or their own profile
- **Update**: Users can only update their own profile

---

## Validation Logic

### Size Limits

To prevent denial-of-service (DoS) attacks, the following size limits are enforced:

- **Reactions**: Maximum 50 reactions per message
- **Canvas Paths**: Maximum 10,000 points per path
- **Room Participants**: Maximum 2 participants per room

### Required Fields Validation

All collections enforce required fields to ensure data integrity:

- All documents must include `createdBy` and `createdAt` fields
- Creator ID must match the authenticated user
- Timestamps must be valid Firestore timestamp types

### Type Validation

Strong type validation is enforced on all fields:

- String fields must be strings
- Number fields must be numbers
- List fields must be lists
- Map fields must be maps
- Timestamp fields must be timestamps

---

## Testing Security Rules Locally

### Prerequisites

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Install project dependencies:
   ```bash
   npm ci
   ```

### Running the Firebase Emulator

1. Start the Firebase emulator:
   ```bash
   firebase emulators:start
   ```

2. The emulator will start on default ports:
   - Firestore: `localhost:8080`
   - Auth: `localhost:9099`
   - UI: `localhost:4000`

### Testing Rules

1. Access the Emulator UI at `http://localhost:4000`

2. Navigate to the Firestore tab

3. Test various operations:
   - Try reading documents you don't have access to
   - Try creating documents with missing required fields
   - Try creating documents with invalid data types
   - Try exceeding size limits (e.g., reactions > 50)

4. Check the Rules Playground to evaluate rule expressions

### Running Automated Tests

If automated security rule tests exist:

```bash
npm run test:emulator
```

---

## CI/CD Security

### Enabled Workflows

The following CI/CD workflows are enabled to ensure code quality and security:

1. **prepr-checks** (`.github/workflows/prepr-checks.yml`)
   - Runs on all pull requests
   - Validates Node.js version
   - Checks npm installation
   - Validates secrets configuration
   - Runs build process
   - Must pass before merging

2. **firebase-ci** (`.github/workflows/firebase-ci.yml`)
   - Runs when Firebase-related files change
   - Validates security rules
   - Runs unit tests
   - Builds the project

3. **deploy-firebase-vercel** (`.github/workflows/deploy-firebase-vercel.yml`)
   - Runs on main branch pushes
   - Executes prepr-checks (failures block deployment)
   - Deploys Firebase backend (rules, storage, functions)
   - Deploys frontend to Vercel
   - Runs smoke tests

### Security Checks

- All workflows validate that security-critical configurations are correct
- Pre-PR checks ensure code meets quality standards before review
- Deployment workflows ensure rules are tested before deploying to production

---

## Recommended Branch Protection Settings

To maintain code quality and security, configure the following branch protection rules for the `main` branch:

### Required Settings

1. **Require pull request before merging**
   - At least 1 approval required
   - Dismiss stale pull request approvals when new commits are pushed

2. **Require status checks to pass before merging**
   - Require branches to be up to date before merging
   - Required checks:
     - `prepr-checks` workflow
     - `firebase-ci` workflow (when applicable)

3. **Require conversation resolution before merging**
   - All review comments must be resolved

4. **Require linear history**
   - Prevents merge commits
   - Enforces rebase or squash merge

5. **Do not allow bypassing the above settings**
   - Applies to administrators as well

### Optional Settings

- **Require signed commits**: Ensures commit authenticity
- **Include administrators**: Apply rules to admin users too
- **Restrict who can push to matching branches**: Limit to specific users/teams

---

## Security Best Practices

### For Developers

1. **Never commit secrets or API keys** to the repository
   - Use environment variables for sensitive data
   - Add sensitive files to `.gitignore`
   - Use the `check-secrets.sh` script to validate configuration

2. **Test security rules locally** before deploying
   - Use Firebase emulator to test rule changes
   - Write automated tests for critical security rules

3. **Keep dependencies updated**
   - Regularly update npm packages
   - Monitor security advisories
   - Use `npm audit` to check for vulnerabilities

4. **Follow TypeScript strict mode**
   - TypeScript strict mode is enabled to catch type errors early
   - Fix type errors instead of using `any` or `@ts-ignore`

5. **Review Firebase rules changes carefully**
   - Security rules changes can have serious implications
   - Always request peer review for rules modifications
   - Test thoroughly in emulator before deploying

### For Reviewers

1. **Carefully review changes to security-critical files**:
   - `firestore.rules`
   - `storage.rules`
   - `.github/workflows/*`
   - `next.config.js` (security headers, etc.)

2. **Verify that CI checks pass** before approving

3. **Ensure new features include appropriate validation**

4. **Check that error messages don't leak sensitive information**

---

## Incident Response

### If a Security Vulnerability is Discovered

1. **Do not disclose publicly** until a fix is deployed
2. **Notify the maintainers** immediately via private channel
3. **Create a private security advisory** on GitHub
4. **Develop and test a fix** in a private branch
5. **Deploy the fix** as soon as possible
6. **Disclose responsibly** after the fix is deployed

### Reporting Security Issues

To report a security vulnerability:

1. **Do NOT open a public issue**
2. Email the maintainers at: [security contact to be added]
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

---

## Additional Resources

- [Firebase Security Rules Documentation](https://firebase.google.com/docs/rules)
- [Next.js Security Best Practices](https://nextjs.org/docs/advanced-features/security-headers)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)

---

## Changelog

- **2025-12-13**: Initial security documentation created
  - Documented Firebase security rules
  - Added testing instructions
  - Defined branch protection recommendations
  - Outlined security best practices

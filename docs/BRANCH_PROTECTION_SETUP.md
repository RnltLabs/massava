# Branch Protection Setup Guide

This guide shows you how to setup Branch Protection for the `main` branch on GitHub to prevent accidental pushes and ensure code quality.

## Why Branch Protection?

✅ **Prevents accidental pushes** to production
✅ **Requires code review** before merging
✅ **Ensures CI/CD passes** before deployment
✅ **Industry standard** for professional teams

## Strategy

```
main (protected)
  ↑ PR only (with approval)
develop (MVP development)
  ↑ PR
feature/* (individual features)
```

## Setup Steps

### Step 1: Go to Repository Settings

1. Open https://github.com/RnltLabs/massava
2. Click **Settings** (top right)
3. In left sidebar, click **Branches**

### Step 2: Add Branch Protection Rule

1. Click **Add rule** or **Add branch protection rule**
2. In **Branch name pattern**, enter: `main`

### Step 3: Configure Protection Rules

Check the following options:

#### Required Reviews
- ✅ **Require a pull request before merging**
  - ✅ **Require approvals**: Set to `1`
  - ⚠️ Optional: **Dismiss stale pull request approvals when new commits are pushed**

#### Status Checks
- ✅ **Require status checks to pass before merging**
  - Search and select your CI/CD workflow (e.g., "Build and Test")
  - ✅ **Require branches to be up to date before merging**

#### Additional Settings
- ✅ **Require conversation resolution before merging** (optional but recommended)
- ✅ **Include administrators** (recommended for safety)
- ⚠️ **Do not allow bypassing the above settings** (strict mode)

#### Restrictions
- ✅ **Lock branch** (optional - prevents any changes unless unlocked)
- ⚠️ **Do not allow force pushes**
- ⚠️ **Do not allow deletions**

### Step 4: Save Changes

Click **Create** or **Save changes** at the bottom.

## Recommended Configuration

For **Massava**, I recommend:

```
Branch name pattern: main

✅ Require a pull request before merging
  ✅ Require approvals: 1
  ✅ Dismiss stale pull request approvals when new commits are pushed

✅ Require status checks to pass before merging
  ✅ Require branches to be up to date before merging
  ✅ Status checks: "Deploy to Production" or your main CI workflow

✅ Require conversation resolution before merging

✅ Do not allow force pushes
✅ Do not allow deletions

⚠️ Include administrators: Your choice
   - YES = Extra safety, even you need PR
   - NO = You can push directly (emergency use only)
```

## Testing Branch Protection

After setup, try to push directly to `main`:

```bash
git checkout main
echo "test" > test.txt
git add test.txt
git commit -m "test"
git push origin main
```

**Expected result:**
```
remote: error: GH006: Protected branch update failed for refs/heads/main.
```

✅ Protection is working!

## Workflow After Protection

### Creating Features

```bash
# 1. Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/my-feature

# 2. Work on feature
# ... make changes ...

# 3. Commit and push
git add .
git commit -m "feat: My feature"
git push origin feature/my-feature

# 4. Create PR to develop
gh pr create --base develop

# 5. After review and merge to develop, test on staging

# 6. When ready for production: PR develop → main
gh pr create --base main
```

### Merging to Main

```bash
# 1. Ensure develop is tested and stable
git checkout develop
git pull origin develop

# 2. Create PR to main
gh pr create --base main \
  --title "Release: v1.2.0" \
  --body "Release notes..."

# 3. Get approval from team member (or yourself if not required)

# 4. Merge via GitHub UI or CLI
gh pr merge 24 --merge
```

## Emergency: Bypassing Protection

If you need to bypass protection in an emergency:

### Option 1: Temporarily Disable Protection
1. Go to Settings → Branches
2. Edit `main` protection rule
3. Uncheck rules temporarily
4. Push changes
5. **RE-ENABLE PROTECTION IMMEDIATELY**

### Option 2: Admin Override
If "Include administrators" is unchecked, you can push directly as admin.

**⚠️ WARNING:** Only use in true emergencies!

## Deployment Strategy

### Development
```
feature/* → develop → Auto-deploy to dev.massava.app or staging
```

### Production
```
develop → main (via PR with approval) → Auto-deploy to massava.app
```

## Coming Soon Environment Variable

After merging the Coming Soon PR, set this in **production environment**:

### GitHub Secrets
1. Go to Settings → Secrets and variables → Actions
2. Add new secret:
   - Name: `NEXT_PUBLIC_SHOW_COMING_SOON`
   - Value: `true`

### Hetzner Server
SSH into server and add to environment:

```bash
ssh hetzner
# In your docker run command, add:
-e NEXT_PUBLIC_SHOW_COMING_SOON=true
```

Or update `.env` on server:
```bash
echo "NEXT_PUBLIC_SHOW_COMING_SOON=true" >> /path/to/.env
```

## Best Practices

1. ✅ **Never commit directly to main** - always use PRs
2. ✅ **Test on develop/staging first** - catch bugs early
3. ✅ **Review code before merging** - fresh eyes catch mistakes
4. ✅ **Keep PRs small** - easier to review and test
5. ✅ **Write descriptive PR descriptions** - helps reviewers
6. ✅ **Link Linear issues** - track what's being shipped

## FAQ

### Q: Can I still push to develop?
**A:** Yes! Only `main` is protected. You can push to `develop` freely.

### Q: What if CI/CD fails on PR?
**A:** Fix the issues, commit and push. GitHub will re-run checks.

### Q: Can I approve my own PRs?
**A:** Depends on your configuration. If "Require approvals: 1" is set and you're not an admin, you'll need someone else.

### Q: How do I delete old branches?
**A:** After merging:
```bash
git branch -d feature/my-feature        # Local
git push origin --delete feature/my-feature  # Remote
```

Or via GitHub UI after PR merge.

---

## Next Steps

1. ✅ Setup branch protection (follow this guide)
2. ✅ Merge Coming Soon PR to main
3. ✅ Set `NEXT_PUBLIC_SHOW_COMING_SOON=true` in production
4. ✅ Continue MVP development on `develop`
5. ✅ When ready: PR `develop` → `main` for launch

---

**Last Updated:** 2025-10-30
**Maintained By:** RNLT Labs

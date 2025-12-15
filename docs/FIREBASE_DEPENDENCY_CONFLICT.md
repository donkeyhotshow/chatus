# Firebase Dependency Conflict - Resolution

## ⚠️ Issue

There is a peer dependency conflict between:
- `firebase@^12.6.0` (current version in project)
- `@firebase/rules-unit-testing@^3.0.4` (requires `firebase@^10.0.0`)

## 🔧 Current Solution

We're using `--legacy-peer-deps` flag in CI/CD workflows as a temporary workaround.

### Modified Files:
- `.github/workflows/firebase-ci.yml` - added `--legacy-peer-deps` to `npm ci`
- `.github/workflows/deploy-firebase-vercel.yml` - added `--legacy-peer-deps` to `npm ci`

## 🎯 Permanent Solutions (Choose One)

### Option 1: Wait for Compatible Version (Recommended)
Wait for `@firebase/rules-unit-testing` to release a version compatible with Firebase 12.x

**Pros:**
- No breaking changes
- Keep latest Firebase features
- Proper peer dependency resolution

**Cons:**
- Need to wait for package update
- Temporary workaround needed

### Option 2: Downgrade Firebase
Downgrade to `firebase@^10.x.x`

```bash
npm install firebase@^10.0.0
```

**Pros:**
- Immediate resolution
- No CI workarounds needed

**Cons:**
- Lose Firebase 12.x features
- May require code changes
- Not future-proof

### Option 3: Remove Rules Unit Testing
Remove `@firebase/rules-unit-testing` if not critical

```bash
npm uninstall @firebase/rules-unit-testing
```

**Pros:**
- Clean dependency tree
- Keep latest Firebase

**Cons:**
- Lose Firestore rules testing capability
- Need alternative testing approach

## 📋 Current Status

**Active Solution:** Option 1 (using `--legacy-peer-deps`)

**Impact:**
- ✅ CI/CD builds work
- ✅ Local development works
- ✅ Production deployments work
- ⚠️ Peer dependency warning in npm install

**Next Steps:**
1. Monitor `@firebase/rules-unit-testing` releases
2. Update when compatible version available
3. Remove `--legacy-peer-deps` flags
4. Test thoroughly

## 🔍 Monitoring

Check for updates:
```bash
npm outdated @firebase/rules-unit-testing
```

Check package compatibility:
```bash
npm info @firebase/rules-unit-testing peerDependencies
```

## 📝 Notes

- This is a common issue when using cutting-edge Firebase versions
- The `--legacy-peer-deps` flag is safe for this specific case
- No functionality is affected by this workaround
- Will be resolved when Firebase Rules Unit Testing updates

---

**Last Updated:** 2025-12-15
**Status:** ✅ Resolved (temporary workaround)

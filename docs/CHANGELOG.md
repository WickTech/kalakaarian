# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
-

### Changed
-

### Deprecated
-

### Removed
-

### Fixed
-

### Security
-

---

## [1.0.0] - YYYY-MM-DD

### Added
- Initial project setup
- Docker configuration
- User authentication (register/login)
- User roles (brand/influencer)
- Profile management
- Campaign CRUD operations
- Proposal submission system
- Cart functionality
- Basic API documentation

### Changed
-

### Fixed
-

---

## Version History Template

Copy this template for new releases:

```
## [X.Y.Z] - YYYY-MM-DD

### Added
- Feature 1
- Feature 2

### Changed
- Changed behavior of X

### Deprecated
- Deprecated Y (will be removed in v2.0.0)

### Removed
- Removed Z (deprecated in v1.2.0)

### Fixed
- Bug in component X

### Security
- CVE-XXXX-XXXX patch
```

---

## Release Types

- **Major (X.0.0)**: Breaking changes, significant new features
- **Minor (0.X.0)**: New features, backward compatible
- **Patch (0.0.X)**: Bug fixes, backward compatible

---

## Git Tagging

After each release, create a git tag:
```bash
git tag -a v1.0.0 -m "Version 1.0.0 - Initial release"
git push origin v1.0.0
```

---

## Automated Releases

Consider setting up:
- GitHub Actions for CI/CD
- Semantic Release for automated versioning
- CHANGELOG auto-generation from commit messages

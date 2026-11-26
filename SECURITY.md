# Security

The security policy (how to report a vulnerability) is in [.github/SECURITY.md](.github/SECURITY.md).

## Security review guidelines

Review against the "Security — lessons learned" and "Architecture principles" sections of [documentation/CLAUDE.md](documentation/CLAUDE.md): data stays on the device unless the user exports it, secrets (AI keys, backup password hashes) never leave it or appear in the Local API, renderer-supplied paths and filenames are validated in Electron, and destructive operations need an explicit confirmation.

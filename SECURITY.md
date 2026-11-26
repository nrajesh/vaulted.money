# Security

The security policy (how to report a vulnerability) is in [.github/SECURITY.md](.github/SECURITY.md).

## Security review guidelines

Review against the "Security — lessons learned" and "Architecture principles" sections of [documentation/CLAUDE.md](documentation/CLAUDE.md): data stays on the device unless the user exports it, AI keys are stored only on the device and sent only to the AI provider the user chose, when an AI feature is used; AI keys and backup password hashes never appear in exports or in Local API responses (the Local API accepts an AI key when one is set, but never returns it), renderer-supplied paths and filenames are validated in Electron, and destructive operations need an explicit confirmation.

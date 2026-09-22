# DB_FACTS

- Connect mode: Thick mode (OCI client via initOracleClient, libDir=I:\Middleware\Oracle_Home\bin) — required because this account's password verifier is a legacy type Thin mode rejects (NJS-116).
- Banner: Oracle Database 12c Enterprise Edition Release 12.2.0.1.0 - 64bit Production
- NLS_CHARACTERSET: WE8ISO8859P15
- NLS_NCHAR_CHARACTERSET: AL16UTF16
- DB time zone: +00:00
- Tables/views discovered: 277
- Packages/procedures/functions discovered: 106
- See packages/USER_SECURITY.sql for the exact ENCRYPT signature (source text, not guessed).

## Surprises

- Table/view `SVR_PARAMETROS_DOCUMENTO` (named in STRUCTURE.md §4) was NOT FOUND or not accessible to siid_testes.
- Table/view `DOC_PARAMETRO` (named in STRUCTURE.md §4) was NOT FOUND or not accessible to siid_testes.
- Table/view `DOC_PERMISSOES_IMPRESSAO` (named in STRUCTURE.md §4) was NOT FOUND or not accessible to siid_testes.
- Package `PKG_FICHIERS` was NOT FOUND or not accessible to siid_testes.
- Package `PKG_TRANSFERTS` was NOT FOUND or not accessible to siid_testes.
- **USER_SECURITY.ENCRYPT is not a one-way hash.** It's reversible DES encryption (`DBMS_OBFUSCATION_TOOLKIT.DESEncrypt`) using a hardcoded 8-byte key (`'12345678'`), and there's a matching `DECRYPT` function. Signature is also `(p_text VARCHAR2) RETURN RAW`, not `RETURN VARCHAR2` as STRUCTURE.md assumed. Passwords in `CFG_UTILIZADORES` are recoverable, not just comparable — this changes both the security story and how the Node app must call it (see packages/USER_SECURITY.sql).

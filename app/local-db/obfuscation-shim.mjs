// Oracle 23 has no DBMS_OBFUSCATION_TOOLKIT (USER_SECURITY, CRYPT_PKG — also via EXECUTE IMMEDIATE).
// A same-named package in each owner schema wins name resolution; DBMS_CRYPTO CBC with a zero IV
// and no padding gives the same bytes, so TEST's password hashes stay valid locally (verified).
const OBF = (fn, raw) => {
  const T = raw ? 'RAW' : 'VARCHAR2';
  const [i, k, o] = raw ? ['input', 'key', fn.endsWith('Decrypt') ? 'decrypted_data' : 'encrypted_data'] : ['input_string', 'key_string', fn.endsWith('Decrypt') ? 'decrypted_string' : 'encrypted_string'];
  return `PROCEDURE ${fn}(${i} IN ${T}, ${k} IN ${T}, ${o} OUT ${T}${fn.includes('3') ? ', which IN PLS_INTEGER DEFAULT 0' : ''})`;
};
const OBF_FNS = ['DESEncrypt', 'DESDecrypt', 'DES3Encrypt', 'DES3Decrypt'];
export const OBF_SPEC = `PACKAGE DBMS_OBFUSCATION_TOOLKIT AS
  TwoKeyMode CONSTANT PLS_INTEGER := 0; ThreeKeyMode CONSTANT PLS_INTEGER := 1;
  ${OBF_FNS.flatMap((f) => [OBF(f, false), OBF(f, true)]).join(';\n  ')};
  FUNCTION md5(input_string IN VARCHAR2) RETURN VARCHAR2; FUNCTION md5(input IN RAW) RETURN RAW;
END;`;
export const OBF_BODY = `PACKAGE BODY DBMS_OBFUSCATION_TOOLKIT AS
  FUNCTION typ(f VARCHAR2, which PLS_INTEGER) RETURN PLS_INTEGER IS BEGIN
    RETURN CASE WHEN f LIKE 'DES3%' THEN CASE which WHEN 1 THEN DBMS_CRYPTO.ENCRYPT_3DES ELSE DBMS_CRYPTO.ENCRYPT_3DES_2KEY END
      ELSE DBMS_CRYPTO.ENCRYPT_DES END + DBMS_CRYPTO.CHAIN_CBC + DBMS_CRYPTO.PAD_NONE; END;
  FUNCTION klen(f VARCHAR2, which PLS_INTEGER) RETURN PLS_INTEGER IS BEGIN
    RETURN CASE WHEN f LIKE 'DES3%' THEN CASE which WHEN 1 THEN 24 ELSE 16 END ELSE 8 END; END;
  FUNCTION go(f VARCHAR2, d RAW, k RAW, which PLS_INTEGER) RETURN RAW IS
    kk RAW(48) := UTL_RAW.SUBSTR(k, 1, klen(f, which));
  BEGIN RETURN CASE WHEN f LIKE '%Decrypt' THEN DBMS_CRYPTO.DECRYPT(d, typ(f, which), kk) ELSE DBMS_CRYPTO.ENCRYPT(d, typ(f, which), kk) END; END;
  ${OBF_FNS.flatMap((f) => {
    const w = f.includes('3') ? 'which' : '0';
    const out = f.endsWith('Decrypt') ? 'decrypted' : 'encrypted';
    return [
      `${OBF(f, false)} IS BEGIN ${out}_string := UTL_RAW.CAST_TO_VARCHAR2(go('${f}', UTL_RAW.CAST_TO_RAW(input_string), UTL_RAW.CAST_TO_RAW(key_string), ${w})); END`,
      `${OBF(f, true)} IS BEGIN ${out}_data := go('${f}', input, key, ${w}); END`,
    ];
  }).join(';\n  ')};
  FUNCTION md5(input_string IN VARCHAR2) RETURN VARCHAR2 IS BEGIN RETURN UTL_RAW.CAST_TO_VARCHAR2(DBMS_CRYPTO.HASH(UTL_RAW.CAST_TO_RAW(input_string), DBMS_CRYPTO.HASH_MD5)); END;
  FUNCTION md5(input IN RAW) RETURN RAW IS BEGIN RETURN DBMS_CRYPTO.HASH(input, DBMS_CRYPTO.HASH_MD5); END;
END;`;

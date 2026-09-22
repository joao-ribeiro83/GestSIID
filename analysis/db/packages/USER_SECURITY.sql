-- USER_SECURITY (owner: SIID_TESTES)


-- ===== SPEC (PACKAGE) =====

PACKAGE "USER_SECURITY" 
AS
  FUNCTION encrypt (p_text  IN  VARCHAR2) RETURN RAW;
  FUNCTION decrypt (p_raw  IN  RAW) RETURN VARCHAR2;
  PROCEDURE update_user_password (
    p_username       IN   VARCHAR2,
    p_new_password   IN   VARCHAR2);
END user_security;


-- ===== BODY (PACKAGE BODY) =====

PACKAGE BODY user_security AS
  g_key     RAW(32767)  :=UTL_RAW.cast_to_raw('12345678');
  g_pad_chr VARCHAR2(1) := '~';
  
  PROCEDURE padstring (p_text  IN OUT  VARCHAR2);
  
  FUNCTION encrypt (p_text  IN  VARCHAR2) RETURN RAW IS
    l_text       VARCHAR2(32767) := p_text;
    l_encrypted  RAW(32767);
  BEGIN
    padstring(l_text);
    DBMS_OBFUSCATION_TOOLKIT.desencrypt(input         =>uTL_RAW.cast_to_raw(l_text),
                                       key            => g_key,
                                       encrypted_data => l_encrypted);
    RETURN l_encrypted;
  END;
  
  FUNCTION decrypt (p_raw  IN  RAW) RETURN VARCHAR2 IS
    l_decrypted  VARCHAR2(32767);
  BEGIN
    DBMS_OBFUSCATION_TOOLKIT.desdecrypt(input=> p_raw,
                                        key  => g_key,
                                       decrypted_data => l_decrypted);
    RETURN RTrim(UTL_RAW.cast_to_varchar2(l_decrypted), g_pad_chr);
  END;
  
  PROCEDURE padstring (p_text  IN OUT  VARCHAR2)IS
    l_units  NUMBER;
  BEGIN
    IF LENGTH(p_text) MOD 8 > 0 THEN
      l_units := TRUNC(LENGTH(p_text)/8) + 1;
      p_text  := RPAD(p_text, l_units * 8,g_pad_chr);
    END IF;
  END;
  
  PROCEDURE update_user_password (
      p_username       IN   VARCHAR2,
      p_new_password   IN   VARCHAR2
   )
   AS
      v_rowid   ROWID;
   BEGIN
     null;
/*      SELECT     ROWID
            INTO v_rowid
            FROM encryption t
           WHERE t.uname = (p_username)
      FOR UPDATE;
      UPDATE encryption
         SET encryption.password =encrypt(p_new_password)
       WHERE ROWID = v_rowid;*/
   EXCEPTION
      WHEN NO_DATA_FOUND
      THEN
         raise_application_error (-20000,'Invalid username/password.');
   END;
END user_security;


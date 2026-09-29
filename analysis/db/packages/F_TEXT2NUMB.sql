-- F_TEXT2NUMB (owner: SIID_TESTES)


-- ===== FUNCTION =====

FUNCTION F_TEXT2NUMB(P_PARAMETRO IN VARCHAR2) RETURN NUMBER
IS
  nVar NUMBER:=0;
BEGIN
  select COALESCE(TO_NUMBER(REGEXP_SUBSTR(REPLACE(REPLACE(P_PARAMETRO,'.',','),'-,','-0,'), '([+-]?\d+\,\d{0,9})|([+-]?\,\d{0,9})|([+-]?\d+)')), 0)
  into nVar
  from dual;

  RETURN nVar;

EXCEPTION
  WHEN OTHERS THEN
    RETURN null;
END F_TEXT2NUMB;

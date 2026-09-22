-- PKG_DBA_UTIL (owner: SIID_TESTES)


-- ===== SPEC (PACKAGE) =====

PACKAGE PKG_DBA_UTIL
IS

  FUNCTION  CRI_TABLE_STATS RETURN NUMBER;
  PROCEDURE INS_TABLE_ESTATS( P_TABLESPACE IN VARCHAR2
                            , P_OWNER      IN VARCHAR2
                            , P_MES        IN DATE DEFAULT SYSDATE);

END PKG_DBA_UTIL;


-- ===== BODY (PACKAGE BODY) =====

PACKAGE BODY PKG_DBA_UTIL
IS
  FUNCTION CRI_TABLE_STATS RETURN NUMBER IS
  BEGIN
    EXECUTE IMMEDIATE
      'CREATE GLOBAL TEMPORARY TABLE TMP_ESTATISTICA '||
      '( '||
      '  TABLESPACE VARCHAR2(60) '||
      ', OWNER VARCHAR2(60) '||
      ', TABELA VARCHAR2(60) '||
      ', N_LINHAS_REAL NUMBER '||
      ', T_BLOCOS      NUMBER '||
      ', T_BYTES_REAL  NUMBER '||
      ', T_BYTES       NUMBER'||
      ', BYTES_REGISTO NUMBER '||
      ', REGISTOS_MES  NUMBER '||
      ', BYTES_MES     NUMBER '||
      ', BLOCOS_MES    NUMBER '||
      ', EXTENT_IDEAL  NUMBER '||
      ')'||CHR(10);
     RETURN 1;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN -1;
  END;
  PROCEDURE INS_TABLE_ESTATS( P_TABLESPACE IN VARCHAR2
                            , P_OWNER      IN VARCHAR2
                            , P_MES        IN DATE DEFAULT SYSDATE) 
  IS
    CURSOR C_TABELAS IS
      SELECT
        TABLE_NAME TABELA
      FROM
        ALL_TABLES
      WHERE
        OWNER = NVL(P_OWNER,OWNER)
      AND TABLESPACE_NAME = P_TABLESPACE;
    CURSOR C_COLUNAS_TAB(P_TABELA IN VARCHAR2) IS
      SELECT
        COLUMN_NAME COLUNA
      FROM
        ALL_TAB_COLUMNS
      WHERE
          OWNER = NVL(P_OWNER,OWNER)
      AND TABLE_NAME = P_TABELA;
    V_N_LINHAS_REAL NUMBER:=0;
    V_T_BLOCOS      NUMBER:=0;
    V_T_BYTES_REAL  NUMBER:=0;
    V_T_BYTES       NUMBER:=0;
    V_BYTES_REGISTO NUMBER:=0;
    V_REGISTOS_MES  NUMBER:=0;
    V_BYTES_MES     NUMBER:=0;
    V_BLOCOS_MES    NUMBER:=0;
    V_EXTENT_IDEAL  NUMBER:=0;
    CMD_SQL       VARCHAR2(2000);    
    SUM_SQL       VARCHAR2(2000);
  BEGIN
    FOR PAI IN C_TABELAS LOOP
      BEGIN
        CMD_SQL := 'SELECT COUNT(*) FROM '||PAI.TABELA;
        DBMS_OUTPUT.PUT_LINE(CMD_SQL);
        EXECUTE IMMEDIATE
          CMD_SQL INTO V_N_LINHAS_REAL;
        SUM_SQL := '';
        FOR RW IN C_COLUNAS_TAB(PAI.TABELA) LOOP
          IF SUM_SQL = '' THEN
            SUM_SQL:='LENGTHB('||RW.COLUNA||')';
          ELSE
            SUM_SQL:='+LENGTHB('||RW.COLUNA||')';
          END IF;
        END LOOP;
        CMD_SQL:= 'SELECT SUM('||SUM_SQL||') FROM '||PAI.TABELA ;
        DBMS_OUTPUT.PUT_LINE(CMD_SQL);
        EXECUTE IMMEDIATE
          CMD_SQL INTO V_T_BYTES_REAL;
        CMD_SQL:= 'SELECT BYTES, BLOCKS FROM USER_SEGMENTS WHERE SEGMENT_NAME = '''||PAI.TABELA||''' ';
        DBMS_OUTPUT.PUT_LINE(CMD_SQL);
        EXECUTE IMMEDIATE
          CMD_SQL INTO V_T_BYTES, V_T_BLOCOS;
        CMD_SQL:=
         'INSERT INTO '||
         '  TMP_ESTATISTICA '||
         '(  '||
         '  TABLESPACE  '||
         ', OWNER  '||
         ', TABELA  '||
         ', N_LINHAS_REAL  '||
         ', T_BLOCOS       '||
         ', T_BYTES_REAL   '||
         ', T_BYTES        '||
         ', BYTES_REGISTO  '||
         ', REGISTOS_MES   '||
         ', BYTES_MES      '||
         ', BLOCOS_MES     '||
         ', EXTENT_IDEAL   '||
         ') '||
         'VALUES '||
         '( '||
         '  '||P_TABLESPACE||
         ', '||P_OWNER||
         ', '||PAI.TABELA||
         ', '||V_N_LINHAS_REAL||
         ', '||V_T_BLOCOS||
         ', '||V_T_BYTES_REAL||
         ', '||V_T_BYTES||
         ', '||V_BYTES_REGISTO||
         ', '||V_BYTES_MES||
         ', '||V_BLOCOS_MES||
         ', '||V_EXTENT_IDEAL||
         ')';
        DBMS_OUTPUT.PUT_LINE(SUBSTR(CMD_SQL,1,255));
        DBMS_OUTPUT.PUT_LINE(SUBSTR(CMD_SQL,255,255));
--       EXECUTE IMMEDIATE
--         CMD_SQL;
      EXCEPTION
        WHEN OTHERS THEN
          EXECUTE IMMEDIATE
            'INSERT INTO '||
            ' TMP_ESTATISTICA '||
            '(  '||
            '  TABLESPACE '||
            ', OWNER '||
            ', TABELA '||
            ') '||
            'VALUES '||
            '( '||
            '   '||P_TABLESPACE||
            ',  '||P_OWNER||
            ',  '||PAI.TABELA||
            ')';
      END;
    END LOOP;
  END;
END PKG_DBA_UTIL;


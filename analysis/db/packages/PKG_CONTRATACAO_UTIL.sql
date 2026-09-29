-- PKG_CONTRATACAO_UTIL (owner: SIID_TESTES)


-- ===== SPEC (PACKAGE) =====

PACKAGE "PKG_CONTRATACAO_UTIL" AS
--* CONSTANTES PROPRIAS QUESTIONAR INFORMAC?ES SOBRE PACKAGE
--*
--* CRIADO POR  : JOSE VIEGAS
--* DATA CRIACAO: 25-11-2004
--* OBSERVAC?O  : A) ESTA SECC?O DEVE ESTAR NO INICIO DO PACKAGE SEMPRE
--*               B) SEMPRE QUE FOR EFECTUADA ALGUMA ALTERAC?O AO PACKAGE
--*                  DEVEM SER ACTUALIZADAS AS CONSTANTES DO PACKAGE BODY
--*                  "VERSAO", "DATA_VERSAO" & "AUTOR_VERSAO".
--*
INFO_VERSAO          CONSTANT VARCHAR2(100):='VERSAO';
INFO_DATA_VERSAO     CONSTANT VARCHAR2(100):='DATA_VERSAO';
INFO_AUTOR_PACKAGE   CONSTANT VARCHAR2(100):='AUTOR_PACKAGE';
INFO_AUTOR_VERSAO    CONSTANT VARCHAR2(100):='AUTOR_VERSAO';
INFO_DATA_PACKAGE    CONSTANT VARCHAR2(100):='DATA_PACKAGE';
INFO_DATA_INSTALACAO CONSTANT VARCHAR2(100):='DATA_INSTALACAO';
INFO_OWNER           CONSTANT VARCHAR2(100):='OWNER';
/*
-* NOME      : GET_PACKINFO
-* OBJECTIVO : MANTER INFORMAC?O SOBRE VERS?O DO PACKAGE
-* UTILIZACAO: PKG_FORMULAS_COSEC.GET_PACKINFO('VERSAO');
-* AUTOR     : Eng. Jose Viegas
-* DATA      : 25-11-2004
-* VERS?O    : 1.0
-*
-* ULTIMAS ALTERAC?ES
-*
-*   DATA       AUTOR           DESCRIC?O
-*   ========== =============== =================================================
-*
-*/
FUNCTION GET_PACKINFO (P_TIPO_INFO VARCHAR2 DEFAULT 'COMPLETE') RETURN VARCHAR2;
/*
-* NOME      : GET_TARIFACAO_APOLICE
-* OBJECTIVO : RETORNA A INFORMACAO DE TARIFACAO DA APOLICE
-* UTILIZACAO:
-* AUTOR     : BRIGIDA RAMOS
-* DATA      : 08-02-2006
-* VERS?O    : 1.0
-*
-* ULTIMAS ALTERAC?ES
-*
-*   DATA       AUTOR           DESCRIC?O
-*   ========== =============== =================================================
-*
-*/
FUNCTION GET_TARIFACAO_APOLICE    ( PI_CDUNIECO IN NUMBER
                 ,PI_CDRAMO   IN NUMBER
                ,PI_ESTADO   IN VARCHAR2
                ,PI_NMPOLIZA IN NUMBER
                ,PI_CDATRIBU IN NUMBER
                ) RETURN VARCHAR2;
/*
-* NOME      : GET_AGENTE_APOLICE
-* OBJECTIVO : RETORNA O AGENTE DA APOLICE
-* UTILIZACAO:
-* AUTOR     : BRIGIDA RAMOS
-* DATA      : 08-02-2006
-* VERS?O    : 1.0
-*
-* ULTIMAS ALTERAC?ES
-*
-*   DATA       AUTOR           DESCRIC?O
-*   ========== =============== =================================================
-*
-*/
FUNCTION GET_AGENTE_APOLICE    ( PI_CDUNIECO IN NUMBER
                 ,PI_CDRAMO   IN NUMBER
                ,PI_ESTADO   IN VARCHAR2
                ,PI_NMPOLIZA IN NUMBER
                ,PI_VALOR IN VARCHAR2
                ) RETURN VARCHAR2;

/*
-* NOME      : GET_DPR_FALTA_APOLICE
-* OBJECTIVO : RETORNA EM TEXTO OS MESES COM DPRS EM FALTA DA APOLICE
-* UTILIZACAO:
-* AUTOR     : JOSE VIEGAS
-* DATA      : 11-08-2009
-* VERS?O    : 1.0
-*
-* ULTIMAS ALTERAC?ES
-*
-*   DATA       AUTOR           DESCRIC?O
-*   ========== =============== =================================================
-*
-*/
FUNCTION GET_DPR_FALTA_APOLICE ( PIN_CDUNIECO IN INTEGER
                               , PIN_CDRAMO   IN INTEGER
                               , PIN_NMPOLIZA IN INTEGER) RETURN VARCHAR2;
/*
-* NOME      : GET_PRZ_MEDIO_PAG
-* OBJECTIVO : RETORNA O PRAZO MEDIO DE PAGAMENTO DE REBIDOS DE PREMIO CUJA DATA INICIO ESTA INCLUIDA NA VIGENCIA DA APOLICE
-* UTILIZACAO:
-* AUTOR     : JOAO BERNARDINO
-* DATA      : 09-11-2009
-* VERS?O    : 1.0
-*
-* ULTIMAS ALTERAC?ES
-*
-*   DATA       AUTOR           DESCRIC?O
-*   ========== =============== =================================================
-*
-*/
FUNCTION GET_PRZ_MEDIO_PAG ( PI_CDUNIECO   IN INTEGER
                            ,PI_CDRAMO     IN INTEGER
                            ,PI_ESTADO     IN VARCHAR2
                ,PI_NMPOLIZA   IN INTEGER
                ,PI_NMANUIDADE IN INTEGER DEFAULT 999
                    ,PI_DATA_REF   IN DATE DEFAULT SYSDATE
                ) RETURN NUMBER;

FUNCTION GET_PRZ_MEDIO_PAG_REAL ( PI_CDUNIECO   IN INTEGER
            ,PI_CDRAMO     IN INTEGER
            ,PI_ESTADO     IN VARCHAR2
,PI_NMPOLIZA   IN INTEGER
,PI_NMANUIDADE IN INTEGER DEFAULT 999
    ,PI_DATA_REF   IN DATE DEFAULT SYSDATE
) RETURN NUMBER;

/*
-* NOME      : GET_ATRIBUTO_ROLE_APOLICE
-* OBJECTIVO : RETORNA VALOR DO ATRIBUTO VARIAVEL DO ROLE DA APOLICE
-* UTILIZACAO:
-* AUTOR     : JOSE VIEGAS
-* DATA      : 15-01-2010
-* VERS?O    : 1.0
-*
-* ULTIMAS ALTERAC?ES
-*
-*   DATA       AUTOR           DESCRIC?O
-*   ========== =============== =================================================
-*
-*/
FUNCTION GET_ATRIBUTO_ROLE_APOLICE ( PI_CDUNIECO IN NUMBER
                                   , PI_CDRAMO   IN NUMBER
                                   , PI_ESTADO   IN VARCHAR2
                                   , PI_NMPOLIZA IN NUMBER
                                   , PI_NMSITUAC IN NUMBER
                                   , PI_CDROL    IN VARCHAR2
                                   , PI_CDPERSON IN NUMBER
                                   , PI_CDATRIBU IN NUMBER
                                   , PI_DATA_REF IN DATE DEFAULT SYSDATE
                                   ) RETURN VARCHAR2;

FUNCTION GET_DT_REF_RECIBO ( PI_CODPEN IN VARCHAR2
          ) RETURN VARCHAR2;

FUNCTION GET_DT_PLANO_RECIBO ( PI_CDUNIECO IN NUMBER ,
                               PI_NMRECIBO IN NUMBER
          ) RETURN DATE;

FUNCTION GET_RECIBO_PP_DTCOB ( PI_CDUNIECO IN NUMBER ,
                     PI_NMRECIBO IN NUMBER
) RETURN number;

FUNCTION GET_GRUPO_ANALISTA ( PI_CDANARIES IN VARCHAR2) RETURN VARCHAR2;

FUNCTION IS_TOMADOR ( PI_CDPERSON IN VARCHAR2) RETURN VARCHAR2;
FUNCTION IS_TOMADOR_APOLICE_VIGOR ( PI_CDPERSON IN VARCHAR2, PI_TIPORAMO IN VARCHAR2 DEFAULT '%' ) RETURN VARCHAR2;
/*
-* NOME      : GET_INFO_BALANCO
-* OBJECTIVO : RETORNA INFO DEPENDENTENTE DO BALANCO MAIS RECENTE (ISSUE 819)
-* UTILIZACAO:
-* AUTOR     : ALDO TITA
-* DATA      : 07-11-2012
-* VERS?O    : 1.0
-*
-* ULTIMAS ALTERAC?ES
-*
-*   DATA       AUTOR           DESCRIC?O
-*   ========== =============== =================================================
-*
-*/
FUNCTION GET_INFO_BALANCO ( PI_CDPERSON IN VARCHAR2, PI_TIPO IN VARCHAR2) RETURN NUMBER;

PRAGMA RESTRICT_REFERENCES (GET_PACKINFO,WNDS);
PRAGMA RESTRICT_REFERENCES (GET_TARIFACAO_APOLICE,WNDS);
PRAGMA RESTRICT_REFERENCES (GET_AGENTE_APOLICE,WNDS);
PRAGMA RESTRICT_REFERENCES (GET_DPR_FALTA_APOLICE,WNDS);
--PRAGMA RESTRICT_REFERENCES (GET_PRZ_MEDIO_PAG,WNDS);
--PRAGMA RESTRICT_REFERENCES (GET_DT_REF_RECIBO,WNDS);
PRAGMA RESTRICT_REFERENCES (GET_DT_PLANO_RECIBO,WNDS);
PRAGMA RESTRICT_REFERENCES (GET_GRUPO_ANALISTA,WNDS);
PRAGMA RESTRICT_REFERENCES (IS_TOMADOR,WNDS);
PRAGMA RESTRICT_REFERENCES (IS_TOMADOR_APOLICE_VIGOR,WNDS);
PRAGMA RESTRICT_REFERENCES (GET_INFO_BALANCO,WNDS);

END PKG_CONTRATACAO_UTIL;

-- ===== BODY (PACKAGE BODY) =====

PACKAGE BODY "PKG_CONTRATACAO_UTIL" AS
/*
-*
-* ULTIMAS ALTERAC?ES AO PACKAGE
-*
-*   DATA       AUTOR           DESCRIC?O
-*   ========== =============== ===================================================
-*   08-02-2006 JOSE VIEGAS     Acrescentado controlo de vers?es do package
*/
  VERSAO         CONSTANT NUMBER:=003;
  DATA_VERSAO    CONSTANT DATE:= TO_DATE('11-11-2009 12:00','DD-MM-YYYY HH24:MI');
  AUTOR_PACKAGE  CONSTANT VARCHAR2(100):='Eng. Jose Viegas';
  AUTOR_VERSAO   CONSTANT VARCHAR2(100):='JOAO BERNARDINO';
/*
-* NOME      : GET_PACKINFO
-* OBJECTIVO : MANTER INFORMAC?O SOBRE VERS?O DO PACKAGE
-* UTILIZACAO: PKG_FORMULAS_COSEC.GET_PACKINFO('VERSAO');
-* AUTOR     : Eng. Jose Viegas
-* DATA      : 08-02-2006
-* VERS?O    : 1.0
-*
-* ULTIMAS ALTERAC?ES
-*
-*   DATA       AUTOR           DESCRIC?O
-*   ========== =============== =================================================
-*
-*/
  FUNCTION GET_PACKINFO (P_TIPO_INFO VARCHAR2 DEFAULT 'COMPLETE') RETURN VARCHAR2 IS
    AUX VARCHAR2(200);
  BEGIN
    IF P_TIPO_INFO = INFO_VERSAO THEN  /* DEVOLVE VERS?O DO PACKAGE */
      RETURN 'v'||TO_CHAR(VERSAO);
    ELSIF P_TIPO_INFO = INFO_DATA_VERSAO THEN
      RETURN TO_CHAR(DATA_VERSAO,'YYYY-MM-DD HH24:MI');
    ELSIF P_TIPO_INFO = INFO_AUTOR_PACKAGE THEN
      RETURN AUTOR_PACKAGE;
    ELSIF P_TIPO_INFO = INFO_AUTOR_VERSAO THEN
      RETURN AUTOR_VERSAO;
    ELSIF P_TIPO_INFO = INFO_DATA_PACKAGE THEN
      BEGIN
        SELECT
          TO_CHAR(CREATED,'YYYY-MM-DD HH24:MI')
        INTO
          AUX
        FROM
          ALL_OBJECTS
        WHERE
            OBJECT_NAME='PKG_FORMULAS_COSEC'
        AND OBJECT_TYPE='PACKAGE BODY'
        AND OWNER = (SELECT USERNAME FROM USER_USERS);
        RETURN AUX;
      EXCEPTION
        WHEN OTHERS THEN
         RETURN 'PKG_FORMULAS_COSEC v'||VERSAO||'('||TO_CHAR(DATA_VERSAO,'YYMMDDHH24MI')||')';
      END;
    ELSIF P_TIPO_INFO = INFO_DATA_INSTALACAO THEN
      BEGIN
        SELECT
          TO_CHAR(LAST_DDL_TIME,'YYYY-MM-DD HH24:MI')
        INTO
          AUX
        FROM
          ALL_OBJECTS
        WHERE
            OBJECT_NAME='PKG_FORMULAS_COSEC'
        AND OBJECT_TYPE='PACKAGE BODY'
        AND OWNER = (SELECT USERNAME FROM USER_USERS);
        RETURN AUX;
      EXCEPTION
        WHEN OTHERS THEN
         RETURN 'PKG_FORMULAS_COSEC v'||VERSAO||'('||TO_CHAR(DATA_VERSAO,'YYMMDDHH24MI')||')';
      END;
    ELSIF P_TIPO_INFO = INFO_OWNER THEN
      SELECT USERNAME INTO AUX FROM USER_USERS;
      RETURN AUX;
    ELSE
      RETURN 'PKG_FORMULAS_COSEC v'||VERSAO||'('||TO_CHAR(DATA_VERSAO,'YYMMDDHH24MI')||')';
    END IF;
  END GET_PACKINFO;
/*
-* NOME      : GET_DPR_FALTA_APOLICE
-* OBJECTIVO : RETORNA EM TEXTO OS MESES COM DPRS EM FALTA DA APOLICE
-* UTILIZACAO:
-* AUTOR     : JOSE VIEGAS
-* DATA      : 11-08-2009
-* VERS?O    : 1.0
-*
-* ULTIMAS ALTERAC?ES
-*
-*   DATA       AUTOR           DESCRIC?O
-*   ========== =============== =================================================
-*
-*/
FUNCTION GET_DPR_FALTA_APOLICE ( PIN_CDUNIECO IN INTEGER
                               , PIN_CDRAMO   IN INTEGER
                               , PIN_NMPOLIZA IN INTEGER) RETURN VARCHAR2
AS
  DECLS_EM_FALTA VARCHAR2(5000);

  DATA MPOLIZAS.FEEFECTO%TYPE;

  DUMMY NUMBER;

  SEPARADOR_ANO VARCHAR2(8);

  CHR_MES    VARCHAR2(4):=',';
  CHR_ENTER  VARCHAR2(4):=Chr(10);
  CHR_ANO    VARCHAR2(4):=CHR(10);

  PRI_MES_ANO NUMBER;
  PRI_VIGENCIA NUMBER;

  CURSOR VIGENCIAS IS
    SELECT
      APOL.FEEMISIO
    , APOL.FEEFECTO
    , APOL.FEPROREN
    , ATRIB.OTVALOR
    FROM
      MPOLIZAS APOL
    , TVALOPOL ATRIB
    WHERE 1=1
    AND ATRIB.CDATRIBU = 15
    AND ATRIB.CDRAMO   = APOL.CDRAMO
    AND ATRIB.CDUNIECO = APOL.CDUNIECO
    AND ATRIB.NMPOLIZA = APOL.NMPOLIZA
    AND ATRIB.ESTADO   = APOL.ESTADO
    AND ATRIB.NMSUPLEM = (
                           SELECT
                             MAX(X.NMSUPLEM)
                           FROM
                             TVALOPOL X
                           WHERE
                           1=1
                           AND X.CDUNIECO = ATRIB.CDUNIECO
                           AND X.CDRAMO   = ATRIB.CDRAMO
                           AND X.NMPOLIZA = ATRIB.NMPOLIZA
                           AND X.ESTADO   = ATRIB.ESTADO
                           AND X.CDATRIBU = ATRIB.CDATRIBU
                           AND  X.NMSUPLEM  <= TO_CHAR(DECODE(APOL.OTTEMPOT, 'T', APOL.FEVENCIM
                                                                           , APOL.FEPROREN),'J')||'99999999999'
                         )
    AND APOL.NMSUPLEM = (
                           SELECT
                             MAX(X.NMSUPLEM)
                           FROM
                             MPOLIZAS X
                           WHERE
                           1=1
                           AND X.CDUNIECO = APOL.CDUNIECO
                           AND X.CDRAMO   = APOL.CDRAMO
                           AND X.NMPOLIZA = APOL.NMPOLIZA
                           AND X.ESTADO   = APOL.ESTADO
                           AND X.FEEFECTO = APOL.FEEFECTO
                         )
    AND APOL.NMRENOVA >= (
                           SELECT
                             MAX(X.NMRENOVA-1)
                           FROM
                             MPOLIZAS X
                           WHERE
                               X.NMPOLIZA = APOL.NMPOLIZA
                           AND X.ESTADO = APOL.ESTADO
                           AND X.CDRAMO = APOL.CDRAMO
                           AND X.CDUNIECO = APOL.CDUNIECO
                         )
    AND APOL.NMPOLIZA = PIN_NMPOLIZA
    AND APOL.CDRAMO   = PIN_CDRAMO
    AND APOL.CDUNIECO = PIN_CDUNIECO;

BEGIN

  SEPARADOR_ANO := '1500';
  PRI_MES_ANO   := 1;
  PRI_VIGENCIA  := 1;

  FOR RW IN VIGENCIAS LOOP

    IF PRI_VIGENCIA = 0 THEN
      DATA := RW.FEEFECTO;
    ELSE
      DATA := ADD_MONTHS(RW.FEEFECTO, RW.OTVALOR);
      PRI_VIGENCIA := 0;
    END IF;

    WHILE (DATA < RW.FEPROREN) LOOP
    BEGIN

      IF (DATA >= ADD_MONTHS(SYSDATE, -1)) THEN
        RETURN DECLS_EM_FALTA;
      ELSE
      BEGIN

        SELECT
          COUNT(DECVEN.FEPERDEC)
        INTO
          DUMMY
        FROM
          CO_DECVEN DECVEN
        WHERE
        1=1
        AND DECVEN.FEPERDEC = TO_CHAR(DATA, 'MON-RR')
        AND DECVEN.NMORDEN  = 1
        AND DECVEN.nmpoliza = PIN_NMPOLIZA
        AND DECVEN.CDRAMO   = PIN_CDRAMO
        AND DECVEN.cdunieco = PIN_CDUNIECO;

        IF DUMMY=0 THEN
          IF DECLS_EM_FALTA IS NULL THEN
            IF SEPARADOR_ANO != TO_CHAR(DATA, 'RRRR') THEN

              SEPARADOR_ANO := TO_CHAR(DATA, 'RRRR');
              PRI_MES_ANO := 0;

              IF SEPARADOR_ANO = TO_CHAR(ADD_MONTHS(DATA, -1), 'RRRR') THEN

                DECLS_EM_FALTA := CHR_ENTER||SEPARADOR_ANO||CHR_ENTER||TRIM(TO_CHAR(ADD_MONTHS(DATA, -1), 'MONTH'));

              ELSE

                DECLS_EM_FALTA := TRIM(TO_CHAR(ADD_MONTHS(DATA, -12), 'RRRR'))||CHR_MES||TRIM(TO_CHAR(ADD_MONTHS(DATA, -1), 'MONTH'));

              END IF;
            ELSE

              DECLS_EM_FALTA := TRIM(TO_CHAR(ADD_MONTHS(DATA, -1), 'MONTH'));

            END IF;
          ELSE
            IF SEPARADOR_ANO != TO_CHAR(DATA, 'RRRR') THEN

              SEPARADOR_ANO := TO_CHAR(DATA, 'RRRR');
              PRI_MES_ANO := 1;

              IF SEPARADOR_ANO = TO_CHAR(ADD_MONTHS(DATA, -1), 'RRRR') THEN

                DECLS_EM_FALTA := DECLS_EM_FALTA||CHR_ANO||SEPARADOR_ANO||CHR_ENTER||TRIM(TO_CHAR(ADD_MONTHS(DATA, -1), 'MONTH'));

              ELSE

                DECLS_EM_FALTA := DECLS_EM_FALTA||', '||TRIM(TO_CHAR(ADD_MONTHS(DATA, -1), 'MONTH'))||CHR_ANO||SEPARADOR_ANO||CHR_ANO;

              END IF;
            ELSE
              IF PRI_MES_ANO = 1 THEN

                PRI_MES_ANO := 0;
                DECLS_EM_FALTA := DECLS_EM_FALTA||TRIM(TO_CHAR(ADD_MONTHS(DATA, -1), 'MONTH'));

              ELSE

                DECLS_EM_FALTA := DECLS_EM_FALTA||', '||TRIM(TO_CHAR(ADD_MONTHS(DATA, -1), 'MONTH'));

              END IF;
            END IF;
          END IF;
        END IF;
      END;

        DATA := ADD_MONTHS(DATA, RW.OTVALOR);

      END IF;

    END;
    END LOOP;
  END LOOP;

  RETURN DECLS_EM_FALTA;

END;


/*
-* NOME      : GET_TARIFACAO_APOLICE
-* OBJECTIVO : RETORNA A INFORMACAO DE TARIFACAO DA APOLICE
-* UTILIZACAO:
-* AUTOR     : BRIGIDA RAMOS
-* DATA      : 08-02-2006
-* VERS?O    : 1.0
-*
-* ULTIMAS ALTERAC?ES
-*
-*   DATA       AUTOR           DESCRIC?O
-*   ========== =============== =================================================
-*
-*/
FUNCTION GET_TARIFACAO_APOLICE    ( PI_CDUNIECO IN NUMBER
                 ,PI_CDRAMO   IN NUMBER
                ,PI_ESTADO   IN VARCHAR2
                ,PI_NMPOLIZA IN NUMBER
                ,PI_CDATRIBU IN NUMBER
                ) RETURN VARCHAR2 IS
AUX_VALOR TVALOSIT.OTVALOR%TYPE;
BEGIN
SELECT ATRIBUTOSSITUACAO.OTVALOR INTO AUX_VALOR
FROM
  TVALOSIT ATRIBUTOSSITUACAO
,MPOLISIT TARIFICACAOAPOLICE
WHERE
1=1
AND ATRIBUTOSSITUACAO.CDATRIBU=PI_CDATRIBU
AND ATRIBUTOSSITUACAO.NMSUPLEM = (
                                  SELECT MAX(X.NMSUPLEM)
                                 FROM
                                    TVALOSIT X
                                 WHERE
                                    X.CDUNIECO = ATRIBUTOSSITUACAO.CDUNIECO
                                AND X.CDRAMO   = ATRIBUTOSSITUACAO.CDRAMO
                                AND X.ESTADO   = ATRIBUTOSSITUACAO.ESTADO
                                AND X.NMPOLIZA = ATRIBUTOSSITUACAO.NMPOLIZA
                                AND X.NMSITUAC = ATRIBUTOSSITUACAO.NMSITUAC
                               )
AND ATRIBUTOSSITUACAO.CDTIPSIT      = 'TG'
AND ATRIBUTOSSITUACAO.NMSITUAC      = TARIFICACAOAPOLICE.NMSITUAC
AND ATRIBUTOSSITUACAO.NMPOLIZA      = TARIFICACAOAPOLICE.NMPOLIZA
AND ATRIBUTOSSITUACAO.ESTADO        = TARIFICACAOAPOLICE.ESTADO
AND ATRIBUTOSSITUACAO.CDRAMO        = TARIFICACAOAPOLICE.CDRAMO
AND ATRIBUTOSSITUACAO.CDUNIECO      = TARIFICACAOAPOLICE.CDUNIECO
AND TARIFICACAOAPOLICE.STATUS       = 'V'
AND TARIFICACAOAPOLICE.CDTIPSIT     ='TG'
AND TARIFICACAOAPOLICE.NMSUPLEM = (
SELECT
MAX(MPOLISITA.NMSUPLEM)
FROM
MPOLISIT MPOLISITA
WHERE
MPOLISITA.CDUNIECO= TARIFICACAOAPOLICE.CDUNIECO
AND MPOLISITA.CDRAMO= TARIFICACAOAPOLICE.CDRAMO
AND MPOLISITA.ESTADO= TARIFICACAOAPOLICE.ESTADO
AND MPOLISITA.NMPOLIZA= TARIFICACAOAPOLICE.NMPOLIZA
AND MPOLISITA.NMSITUAC= TARIFICACAOAPOLICE.NMSITUAC
)
AND TARIFICACAOAPOLICE.NMPOLIZA     = PI_NMPOLIZA
AND TARIFICACAOAPOLICE.ESTADO       = PI_ESTADO
AND TARIFICACAOAPOLICE.CDRAMO       = PI_CDRAMO
AND TARIFICACAOAPOLICE.CDUNIECO     = PI_CDUNIECO  ;
RETURN AUX_VALOR;
EXCEPTION
  WHEN OTHERS THEN RETURN NULL;
END GET_TARIFACAO_APOLICE;

/*
-* NOME      : GET_AGENTE_APOLICE
-* OBJECTIVO : RETORNA O AGENTE DA APOLICE
-* UTILIZACAO:
-* AUTOR     : BRIGIDA RAMOS
-* DATA      : 08-02-2006
-* VERS?O    : 1.0
-*
-* ULTIMAS ALTERAC?ES
-*
-*   DATA       AUTOR           DESCRIC?O
-*   ========== =============== =================================================
-*
-*/
FUNCTION GET_AGENTE_APOLICE    ( PI_CDUNIECO IN NUMBER
                 ,PI_CDRAMO   IN NUMBER
                ,PI_ESTADO   IN VARCHAR2
                ,PI_NMPOLIZA IN NUMBER
                ,PI_VALOR IN VARCHAR2
                ) RETURN VARCHAR2 IS
AUX_NOME GD_AGENTES_APOLICE_MV.NOME_AGENTE%TYPE;
AUX_CODIGO GD_AGENTES_APOLICE_MV.CDAGENTE%TYPE;
BEGIN
SELECT CDAGENTE,NOME_AGENTE INTO AUX_CODIGO,AUX_NOME
FROM
GD_AGENTES_APOLICE_MV
WHERE
1=1
AND STATUS              = 'V'
AND nmpoliza            = PI_NMPOLIZA
AND estado              = PI_ESTADO
AND cdramo              = PI_CDRAMO
AND cdunieco            = PI_CDUNIECO  ;
IF (PI_VALOR='NOME') THEN
RETURN AUX_NOME;
ELSIF (PI_VALOR='CODIGO') THEN
RETURN AUX_CODIGO;
ELSE
RETURN NULL;
END IF;
EXCEPTION
  WHEN OTHERS THEN RETURN NULL;
END GET_AGENTE_APOLICE;

/*
-* NOME      : GET_PRZ_MEDIO_PAG
-* OBJECTIVO : RETORNA O PRAZO MEDIO DE PAGAMENTO DE REBIDOS DE PREMIO CUJA DATA INICIO ESTA INCLUIDA NA VIGENCIA DA APOLICE
-* UTILIZACAO:
-* AUTOR     : JO?O BERNARDINO
-* DATA      : 09-11-2009
-* VERS?O    : 1.0
-*
-* ULTIMAS ALTERAC?ES
-*
-*   DATA       AUTOR           DESCRIC?O
-*   ========== =============== =================================================
-*
-*/
FUNCTION GET_PRZ_MEDIO_PAG   ( PI_CDUNIECO   IN INTEGER
                              ,PI_CDRAMO     IN INTEGER
                              ,PI_ESTADO     IN VARCHAR2
                  ,PI_NMPOLIZA   IN INTEGER
                  ,PI_NMANUIDADE IN INTEGER DEFAULT 999
                      ,PI_DATA_REF   IN DATE DEFAULT SYSDATE
                 ) RETURN NUMBER IS
 PRAZO_MEDIO_PAG NUMBER;
 AUX_NMANUIDADE NUMBER;

BEGIN

 SELECT
         AVG(
        /*RECIBO DE PREMIO COBRADO*/
        CASE
          WHEN RECIBO.CDESTADO = 3 AND RECIBO.FEESTADO > DECODE(PKG_CONTRATACAO_UTIl.GET_DT_REF_RECIBO(PKG_FORMULAS_COSEC.GET_ATRIBUTO_APOLICE(apolice.cdunieco,apolice.cdramo,apolice.estado, apolice.nmpoliza, 86)), 'FEEMISIO', RECIBO.FEEMISIO,RECIBO.FEEXIGIB) THEN
              CASE
                 --se esteve em plano de pagamento
                  WHEN PKG_CONTRATACAO_UTIl.GET_RECIBO_PP_DTCOB(Recibo.cdunieco, Recibo.nmrecibo) >  0  THEN
                     NVL(TO_NUMBER(PKG_CONTRATACAO_UTIl.GET_DT_PLANO_RECIBO(Recibo.cdunieco, Recibo.nmrecibo) - DECODE(PKG_CONTRATACAO_UTIl.GET_DT_REF_RECIBO(PKG_FORMULAS_COSEC.GET_ATRIBUTO_APOLICE(apolice.cdunieco,apolice.cdramo,apolice.estado, apolice.nmpoliza, 86)), 'FEEMISIO', TRUNC(RECIBO.FEEMISIO),TRUNC(RECIBO.FEEXIGIB))),0)
                  ELSE
                    NVL(TO_NUMBER(TRUNC(RECIBO.FEESTADO) - DECODE(PKG_CONTRATACAO_UTIl.GET_DT_REF_RECIBO(PKG_FORMULAS_COSEC.GET_ATRIBUTO_APOLICE(apolice.cdunieco,apolice.cdramo,apolice.estado, apolice.nmpoliza, 86)), 'FEEMISIO', TRUNC(RECIBO.FEEMISIO),TRUNC(RECIBO.FEEXIGIB))) ,0)
              END
          WHEN RECIBO.CDESTADO = 3 AND RECIBO.FEESTADO < DECODE(PKG_CONTRATACAO_UTIl.GET_DT_REF_RECIBO(PKG_FORMULAS_COSEC.GET_ATRIBUTO_APOLICE(apolice.cdunieco,apolice.cdramo,apolice.estado, apolice.nmpoliza, 86)), 'FEEMISIO', TRUNC(RECIBO.FEEMISIO),TRUNC(RECIBO.FEEXIGIB)) THEN
              0
          ELSE
              /*RECIBO DE PREMIO N?O COBRADO*/
              CASE
                --So devem ser tratados aqueles cuja data de exigibilidade foi ultrapassada
                WHEN SYSDATE >= RECIBO.FEEXIGIB THEN
                    CASE
                        WHEN RECIBO.CDESTADO IN (16,17) THEN
                            NVL(TO_NUMBER(TRUNC(RECIBO.FEESTADO) - DECODE(PKG_CONTRATACAO_UTIl.GET_DT_REF_RECIBO(PKG_FORMULAS_COSEC.GET_ATRIBUTO_APOLICE(apolice.cdunieco,apolice.cdramo,apolice.estado, apolice.nmpoliza, 86)), 'FEEMISIO', TRUNC(RECIBO.FEEMISIO),TRUNC(RECIBO.FEEXIGIB))) ,0)
                        ELSE
                            NVL(TO_NUMBER(TRUNC(SYSDATE) - DECODE(PKG_CONTRATACAO_UTIl.GET_DT_REF_RECIBO(PKG_FORMULAS_COSEC.GET_ATRIBUTO_APOLICE(apolice.cdunieco,apolice.cdramo,apolice.estado, apolice.nmpoliza, 86)), 'FEEMISIO', TRUNC(RECIBO.FEEMISIO),TRUNC(RECIBO.FEEXIGIB))),0)
                    END
                ELSE
                    0
              END
        END)
   INTO PRAZO_MEDIO_PAG
   FROM
       MRECIBO  RECIBO
     , MPOLIZAS APOLICE
     , GD_TIPOS_DOCUMENTO TIPOSDOC
  --   , TVALOPOL ATRIBAPOL
  WHERE 1=1
/* SO RECIBOS PREMIO  */
    AND TiposDoc.ID          = 1
    AND TiposDoc.TIPORECI    = Recibo.TIPORECI
    AND TiposDoc.SINAL_VALOR = SIGN(Recibo.PTIMPORT)
/* CONDIC?ES DO RECIBO  */
   -- AND Recibo.FEINICIO BETWEEN TRUNC(APOLICE.FEEFECTO) AND TRUNC(DECODE(APOLICE.OTTEMPOT,'T',APOLICE.FEVENCIM,APOLICE.FEPROREN))
    AND Recibo.FEINICIO >= TRUNC(APOLICE.FEEFECTO)
    AND Recibo.FEINICIO < TRUNC(DECODE(APOLICE.OTTEMPOT,'T',APOLICE.FEVENCIM,APOLICE.FEPROREN))
    AND Recibo.PTIMPORT > 0
    AND Recibo.CDESTADO NOT IN (2,8)
    AND Recibo.NMPOLIZA  = Apolice.NMPOLIZA
    AND Recibo.ESTADO    = Apolice.ESTADO
    AND Recibo.CDRAMO    = Apolice.CDRAMO
    AND Recibo.CDUNIECO  = Apolice.CDUNIECO
/* APOLICES COM ATRIBUTO VARIAVEL 11 = '13' OU '3' e ATRIBUTO VARIAVEL 'COBRA PENALIDADE' = 'S' */
--    AND 1 = DECODE(AtribApol.CDATRIBU,11,DECODE(AtribApol.OTVALOR,'13',DECODE(Apolice.CDRAMO,100,1,2),'3',DECODE(Apolice.CDRAMO,104,1,105,1,2),2)
--                                  ,nn,DECODE(AtribApol.OTVALOR,'S',1,2)
--                                   ,2)
--    AND AtribApol.NMSUPLEM = (
 /*                              SELECT
                                 MAX(x.NMSUPLEM)
                               FROM
                                 tvalopol x
                               WHERE
                                   x.STATUS   = AtribApol.STATUS
                               AND x.NMSUPLEM <= TO_CHAR(PI_DATA_REF,'J')||'99999999999'
                               AND x.CDUNIECO = AtribApol.CDUNIECO
                               AND x.CDRAMO   = AtribApol.CDRAMO
                               AND x.NMPOLIZA = AtribApol.NMPOLIZA
                               AND x.ESTADO   = AtribApol.ESTADO
                               AND x.CDATRIBU = AtribApol.CDATRIBU)
    AND AtribApol.NMPOLIZA = Apolice.NMPOLIZA
    AND AtribApol.STATUS   = Apolice.STATUS
    AND AtribApol.ESTADO   = Apolice.ESTADO
    AND AtribApol.CDRAMO   = Apolice.CDRAMO
    AND AtribApol.CDUNIECO = Apolice.CDUNIECO
    */
    AND Apolice.NMSUPLEM   = (
                               SELECT
                                 MAX(x.NMSUPLEM)
                               FROM
                                 mpolizas x
                               WHERE
                                   x.STATUS   = Apolice.STATUS
                               AND x.NMRENOVA <= PI_NMANUIDADE - 1
                               AND x.NMSUPLEM <= TO_CHAR(NVL(PI_DATA_REF,SYSDATE),'J')||'99999999999'
                               AND x.NMPOLIZA = Apolice.NMPOLIZA
                               AND x.ESTADO   = Apolice.ESTADO
                               AND x.CDRAMO   = Apolice.CDRAMO
                               AND x.CDUNIECO = Apolice.CDUNIECO
                             )
    AND Apolice.STATUS     = 'V'
    AND Apolice.NMPOLIZA   = PI_NMPOLIZA
    AND Apolice.ESTADO     = PI_ESTADO
    AND Apolice.CDRAMO     = PI_CDRAMO
    AND Apolice.CDUNIECO   = PI_CDUNIECO
    AND NOT EXISTS( SELECT 1
                    FROM co_texrecga cot
                    WHERE cot.cdunieco = RECIBO.cdunieco
                    AND cot.nmrecibo = RECIBO.nmrecibo)
    AND not exists (select 1
                    from mrecibo mrec
                    where 1=1
                    and mrec.cdunieco=RECIBO.cdunieco
                    and mrec.nmrecibo=Recibo.nmrecibo
                    and mrec.cdestado != 3
                    and trunc(sysdate) < trunc(mrec.feexigib));

    PRAZO_MEDIO_PAG := ROUND(PRAZO_MEDIO_PAG);

    RETURN PRAZO_MEDIO_PAG;

EXCEPTION
  WHEN OTHERS THEN RETURN NULL;

END GET_PRZ_MEDIO_PAG;


/*
-* NOME      : GET_PRZ_MEDIO_PAG_REAL
-* OBJECTIVO : RETORNA O PRAZO MEDIO DE PAGAMENTO DE REBIDOS DE PREMIO CUJA DATA INICIO ESTA INCLUIDA NA VIGENCIA DA APOLICE
-* UTILIZACAO:
-* AUTOR     : ALDO TITA
-* DATA      : 16-06-2011
-* VERS?O    : 1.0
-*
-* ULTIMAS ALTERAC?ES
-*
-*   DATA       AUTOR           DESCRIC?O
-*   ========== =============== =================================================
-*
-*/
FUNCTION GET_PRZ_MEDIO_PAG_REAL   ( PI_CDUNIECO   IN INTEGER
                              ,PI_CDRAMO     IN INTEGER
                              ,PI_ESTADO     IN VARCHAR2
                  ,PI_NMPOLIZA   IN INTEGER
                  ,PI_NMANUIDADE IN INTEGER DEFAULT 999
                      ,PI_DATA_REF   IN DATE DEFAULT SYSDATE
                 ) RETURN NUMBER IS
 PRAZO_MEDIO_PAG_REAL NUMBER;
 AUX_NMANUIDADE NUMBER;

BEGIN

 SELECT
         AVG(
        /*RECIBO DE PREMIO COBRADO*/
        CASE
          WHEN RECIBO.CDESTADO = 3 AND RECIBO.FEESTADO > DECODE(PKG_CONTRATACAO_UTIl.GET_DT_REF_RECIBO(PKG_FORMULAS_COSEC.GET_ATRIBUTO_APOLICE(apolice.cdunieco,apolice.cdramo,apolice.estado, apolice.nmpoliza, 86)), 'FEEMISIO', RECIBO.FEEMISIO,RECIBO.FEEXIGIB) THEN
              CASE
                 --se esteve em plano de pagamento
                  WHEN PKG_CONTRATACAO_UTIl.GET_RECIBO_PP_DTCOB(Recibo.cdunieco, Recibo.nmrecibo) >  0  THEN
                     NVL(TO_NUMBER(PKG_CONTRATACAO_UTIl.GET_DT_PLANO_RECIBO(Recibo.cdunieco, Recibo.nmrecibo) - DECODE(PKG_CONTRATACAO_UTIl.GET_DT_REF_RECIBO(PKG_FORMULAS_COSEC.GET_ATRIBUTO_APOLICE(apolice.cdunieco,apolice.cdramo,apolice.estado, apolice.nmpoliza, 86)), 'FEEMISIO', TRUNC(RECIBO.FEEMISIO),TRUNC(RECIBO.FEEXIGIB))),0)
                  ELSE
                    NVL(TO_NUMBER(TRUNC(RECIBO.FEESTADO) - DECODE(PKG_CONTRATACAO_UTIl.GET_DT_REF_RECIBO(PKG_FORMULAS_COSEC.GET_ATRIBUTO_APOLICE(apolice.cdunieco,apolice.cdramo,apolice.estado, apolice.nmpoliza, 86)), 'FEEMISIO', TRUNC(RECIBO.FEEMISIO),TRUNC(RECIBO.FEEXIGIB))) ,0)
              END
          WHEN RECIBO.CDESTADO = 3 AND RECIBO.FEESTADO < DECODE(PKG_CONTRATACAO_UTIl.GET_DT_REF_RECIBO(PKG_FORMULAS_COSEC.GET_ATRIBUTO_APOLICE(apolice.cdunieco,apolice.cdramo,apolice.estado, apolice.nmpoliza, 86)), 'FEEMISIO', TRUNC(RECIBO.FEEMISIO),TRUNC(RECIBO.FEEXIGIB)) THEN
              0
          ELSE
              /*RECIBO DE PREMIO N?O COBRADO*/
              CASE
                --So devem ser tratados aqueles cuja data de exigibilidade foi ultrapassada
                WHEN SYSDATE >= RECIBO.FEEXIGIB THEN
                    CASE
                        WHEN RECIBO.CDESTADO IN (16,17) THEN
                            NVL(TO_NUMBER(TRUNC(RECIBO.FEESTADO) - DECODE(PKG_CONTRATACAO_UTIl.GET_DT_REF_RECIBO(PKG_FORMULAS_COSEC.GET_ATRIBUTO_APOLICE(apolice.cdunieco,apolice.cdramo,apolice.estado, apolice.nmpoliza, 86)), 'FEEMISIO', TRUNC(RECIBO.FEEMISIO),TRUNC(RECIBO.FEEXIGIB))) ,0)
                        ELSE
                            NVL(TO_NUMBER(TRUNC(SYSDATE) - DECODE(PKG_CONTRATACAO_UTIl.GET_DT_REF_RECIBO(PKG_FORMULAS_COSEC.GET_ATRIBUTO_APOLICE(apolice.cdunieco,apolice.cdramo,apolice.estado, apolice.nmpoliza, 86)), 'FEEMISIO', TRUNC(RECIBO.FEEMISIO),TRUNC(RECIBO.FEEXIGIB))),0)
                    END
                ELSE
                    0
              END
        END)
   INTO PRAZO_MEDIO_PAG_REAL
   FROM
       MRECIBO  RECIBO
     , MPOLIZAS APOLICE
     , GD_TIPOS_DOCUMENTO TIPOSDOC
  WHERE 1=1
/* SO RECIBOS PREMIO  */
    AND TiposDoc.ID          = 1
    AND TiposDoc.TIPORECI    = Recibo.TIPORECI
    AND TiposDoc.SINAL_VALOR = SIGN(Recibo.PTIMPORT)
/* CONDIC?ES DO RECIBO  */
       AND Recibo.FEINICIO >= TRUNC(APOLICE.FEEFECTO)
    AND Recibo.FEINICIO < TRUNC(DECODE(APOLICE.OTTEMPOT,'T',APOLICE.FEVENCIM,APOLICE.FEPROREN))
    AND Recibo.PTIMPORT > 0
    AND Recibo.CDESTADO NOT IN (2,8)
    AND Recibo.NMPOLIZA  = Apolice.NMPOLIZA
    AND Recibo.ESTADO    = Apolice.ESTADO
    AND Recibo.CDRAMO    = Apolice.CDRAMO
    AND Recibo.CDUNIECO  = Apolice.CDUNIECO
    AND Apolice.NMSUPLEM   = (
                               SELECT
                                 MAX(x.NMSUPLEM)
                               FROM
                                 mpolizas x
                               WHERE
                                   x.STATUS   = Apolice.STATUS
                               AND x.NMRENOVA <= PI_NMANUIDADE - 1
                               AND x.NMSUPLEM <= TO_CHAR(NVL(PI_DATA_REF,SYSDATE),'J')||'99999999999'
                               AND x.NMPOLIZA = Apolice.NMPOLIZA
                               AND x.ESTADO   = Apolice.ESTADO
                               AND x.CDRAMO   = Apolice.CDRAMO
                               AND x.CDUNIECO = Apolice.CDUNIECO
                             )
    AND Apolice.STATUS     = 'V'
    AND Apolice.NMPOLIZA   = PI_NMPOLIZA
    AND Apolice.ESTADO     = PI_ESTADO
    AND Apolice.CDRAMO     = PI_CDRAMO
    AND Apolice.CDUNIECO   = PI_CDUNIECO
    AND not exists (select 1
                    from mrecibo mrec
                    where 1=1
                    and mrec.cdunieco=RECIBO.cdunieco
                    and mrec.nmrecibo=Recibo.nmrecibo
                    and mrec.cdestado != 3
                    and trunc(sysdate) < trunc(mrec.feexigib));

    PRAZO_MEDIO_PAG_REAL := ROUND(PRAZO_MEDIO_PAG_REAL);

    RETURN PRAZO_MEDIO_PAG_REAL;

EXCEPTION
  WHEN OTHERS THEN RETURN NULL;

END GET_PRZ_MEDIO_PAG_REAL;

FUNCTION GET_DT_REF_RECIBO ( PI_CODPEN IN VARCHAR2)
RETURN VARCHAR2 IS
DATA_REF_RECIBO VARCHAR(30):= null;

BEGIN

  SELECT OTVALOR01
    INTO DATA_REF_RECIBO
    FROM TABLE(PKG_APP_UTIL.LISTA_TABAPOIO('TTABPENP'))
    WHERE OTCLAVE1 = PI_CODPEN;

    RETURN DATA_REF_RECIBO;

EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;

END GET_DT_REF_RECIBO;

FUNCTION GET_DT_PLANO_RECIBO ( PI_CDUNIECO IN NUMBER ,PI_NMRECIBO IN NUMBER    )
RETURN DATE IS
DATA_PLANO_RECIBO DATE;

BEGIN

  SELECT FEMOVIMI
    INTO DATA_PLANO_RECIBO
  FROM ( SELECT *
           FROM TMOVIREC
           WHERE CDUNIECO = PI_CDUNIECO
           AND NMRECIBO = PI_NMRECIBO
           AND CDNEGOCI = '038'
         ORDER BY FEMOVIMI DESC )
  WHERE ROWNUM = 1;

    RETURN DATA_PLANO_RECIBO;

EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;

END GET_DT_PLANO_RECIBO;

FUNCTION GET_RECIBO_PP_DTCOB ( PI_CDUNIECO IN NUMBER , PI_NMRECIBO IN NUMBER    )
RETURN number IS
IS_COBRANCA NUMBER:=0;
BEGIN
    SELECT COUNT(*)
    INTO IS_COBRANCA
    FROM GD_RECIBOS_PP
    WHERE 1=1
      AND CDUNIECO = PI_CDUNIECO
      AND NMRECIBO = PI_NMRECIBO;

    RETURN IS_COBRANCA;

END GET_RECIBO_PP_DTCOB;

/*
-* NOME      : GET_ATRIBUTO_ROLE_APOLICE
-* OBJECTIVO : RETORNA VALOR DO ATRIBUTO VARIAVEL DO ROLE DA APOLICE
-* UTILIZACAO:
-* AUTOR     : JOSE VIEGAS
-* DATA      : 15-01-2010
-* VERS?O    : 1.0
-*
-* ULTIMAS ALTERAC?ES
-*
-*   DATA       AUTOR           DESCRIC?O
-*   ========== =============== =================================================
-*
-*/
FUNCTION GET_ATRIBUTO_ROLE_APOLICE ( PI_CDUNIECO IN NUMBER
                                   , PI_CDRAMO   IN NUMBER
                                   , PI_ESTADO   IN VARCHAR2
                                   , PI_NMPOLIZA IN NUMBER
                                   , PI_NMSITUAC IN NUMBER
                                   , PI_CDROL    IN VARCHAR2
                                   , PI_CDPERSON IN NUMBER
                                   , PI_CDATRIBU IN NUMBER
                                   , PI_DATA_REF IN DATE DEFAULT SYSDATE
                                   ) RETURN VARCHAR2
IS
  L_RET VARCHAR2(500);
BEGIN

  SELECT
    Trim(OTVALOR)
  INTO
    L_RET
  FROM
    CO_TVALOPROL ATTROLE
  WHERE 1=1
  AND ATTROLE.STATUS   = 'V'
  AND ATTROLE.NMSUPLEM = (
                           SELECT MAX(X.NMSUPLEM)
                           FROM CO_TVALOPROL X
                           WHERE 1=1
                           AND X.STATUS    = ATTROLE.STATUS
                           AND X.NMSUPLEM <= TO_CHAR(PI_DATA_REF,'J')||'99999999999'
                           AND X.CDPERSON  = ATTROLE.CDPERSON
                           AND X.CDATRIBU  = ATTROLE.CDATRIBU
                           AND X.CDROL     = ATTROLE.CDROL
                           AND X.NMSITUAC  = ATTROLE.NMSITUAC
                           AND X.NMPOLIZA  = ATTROLE.NMPOLIZA
                           AND X.ESTADO    = ATTROLE.ESTADO
                           AND X.CDRAMO    = ATTROLE.CDRAMO
                           AND X.CDUNIECO  = ATTROLE.CDUNIECO
                         )
  AND ATTROLE.CDPERSON = PI_CDPERSON
  AND ATTROLE.CDATRIBU = PI_CDATRIBU
  AND ATTROLE.CDROL    = PI_CDROL
  AND ATTROLE.NMSITUAC = PI_NMSITUAC
  AND ATTROLE.NMPOLIZA = PI_NMPOLIZA
  AND ATTROLE.ESTADO   = PI_ESTADO
  AND ATTROLE.CDRAMO   = PI_CDRAMO
  AND ATTROLE.CDUNIECO = PI_CDUNIECO;

  RETURN L_RET;

EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END GET_ATRIBUTO_ROLE_APOLICE;

/*
-* NOME      : GET_GRUPO_ANALISTA
-* OBJECTIVO : RETORNA O GRUPO ANALISTA
-* UTILIZACAO:
-* AUTOR     : ALDO TITA
-* DATA      : 15-03-2012
-* VERS?O    : 1.0
-*
-* ULTIMAS ALTERAC?ES
-*
-*   DATA       AUTOR           DESCRIC?O
-*   ========== =============== =================================================
-*
-*/
FUNCTION GET_GRUPO_ANALISTA ( PI_CDANARIES IN VARCHAR2) RETURN VARCHAR2
IS
  L_RET VARCHAR2(500);
BEGIN

  SELECT
    CDGRUPO
  INTO
    L_RET
  FROM
    CO_GRUPAN
  WHERE 1=1
    AND CDANALIS = PI_CDANARIES;

  RETURN L_RET;

EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END GET_GRUPO_ANALISTA;

/*
-* NOME      : IS_TOMADOR
-* OBJECTIVO : RETORNA SE E TOMADOR OU NAO A ENTIDADE
-* UTILIZACAO:
-* AUTOR     : ALDO TITA
-* DATA      : 15-03-2012
-* VERS?O    : 1.0
-*
-* ULTIMAS ALTERAC?ES
-*
-*   DATA       AUTOR           DESCRIC?O
-*   ========== =============== =================================================
-*
-*/
FUNCTION IS_TOMADOR ( PI_CDPERSON IN VARCHAR2) RETURN VARCHAR2
IS
  L_RET VARCHAR2(500);
BEGIN

SELECT
   DECODE(COUNT(*),0,'N','S')
INTO
  L_RET
FROM
   DUAL
WHERE
   EXISTS (   SELECT 1
              FROM MPOLIPER ENTIDADE
              WHERE 1=1
                --AND ENTIDADE.CDRAMO LIKE '1%'
                AND ENTIDADE.CDROL='TO'
                AND ENTIDADE.CDPERSON= PI_CDPERSON
                /*
                AND ENTIDADE.NMSUPLEM = (SELECT MAX(X.NMSUPLEM)
                                FROM MPOLIPER X
                                WHERE 1=1
                                AND x.cdperson= ENTIDADE.cdperson
                                AND X.NMSUPLEM <= TO_CHAR(SYSDATE,'j')||'99999999999'
                               )
                */
                AND PKG_FORMULAS_COSEC.IS_APOLICE_VALIDA(ENTIDADE.cdunieco,ENTIDADE.cdramo,ENTIDADE.estado,ENTIDADE.nmpoliza,sysdate) = 'S'
           );


  RETURN L_RET;

EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END IS_TOMADOR;

/*
-* NOME      : IS_TOMADOR_APOLICE_VIGOR
-* OBJECTIVO : RETORNA SE E TOMADOR APOLICE POR CREDITO OU CAuCAO
-* UTILIZACAO:
-* AUTOR     : ALDO TITA
-* DATA      : 19-06-2012
-* VERS?O    : 1.0
-*
-* ULTIMAS ALTERAC?ES
-*
-*   DATA       AUTOR           DESCRIC?O
-*   ========== =============== =================================================
-*
-*/
FUNCTION IS_TOMADOR_APOLICE_VIGOR ( PI_CDPERSON IN VARCHAR2, PI_TIPORAMO IN VARCHAR2 DEFAULT '%') RETURN VARCHAR2
IS
  L_RET VARCHAR2(500);
BEGIN

SELECT
   DECODE(COUNT(*),0,'N','S')
INTO
  L_RET
FROM
   DUAL
WHERE
   EXISTS (   SELECT 1
              FROM MPOLIPER ENTIDADE
              WHERE 1=1
        AND ENTIDADE.CDUNIECO=1
                AND ENTIDADE.CDRAMO LIKE PI_TIPORAMO
        AND ENTIDADE.ESTADO='M'
                AND ENTIDADE.CDROL='TO'
                AND ENTIDADE.CDPERSON= PI_CDPERSON
                AND PKG_FORMULAS_COSEC.IS_APOLICE_VALIDA(ENTIDADE.cdunieco,ENTIDADE.cdramo,ENTIDADE.estado,ENTIDADE.nmpoliza,sysdate) = 'S'
           );


  RETURN L_RET;

EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END IS_TOMADOR_APOLICE_VIGOR;

/*
-* NOME      : GET_INFO_BALANCO
-* OBJECTIVO : RETORNA INFO DEPENDENTENTE DO BALANCO MAIS RECENTE (ISSUE 819)
-* UTILIZACAO:
-* AUTOR     : ALDO TITA
-* DATA      : 07-11-2012
-* VERS?O    : 1.0
-*
-* ULTIMAS ALTERAC?ES
-*
-*   DATA       AUTOR           DESCRIC?O
-*   ========== =============== =================================================
-*
-*/
FUNCTION GET_INFO_BALANCO ( PI_CDPERSON IN VARCHAR2, PI_TIPO IN VARCHAR2) RETURN NUMBER
IS
  L_RET 	NUMBER;
  TIPOBALAN	VARCHAR2(5);
BEGIN

/* ver se o balanco mais recente e do tipo IS*/
SELECT  CI.TIPOBALAN
INTO 	TIPOBALAN
FROM 	CO_ICCONTROL CI
WHERE 	1=1
  AND CI.CDPERSON=PI_CDPERSON
  AND CI.ANOBAL = ( SELECT MAX (ANOBAL)
					FROM CO_ICCONTROL
					WHERE 1=1
						AND CDPERSON = CI.CDPERSON);

/*Se sim fazer o mesmo - issue 803*/
IF TIPOBALAN ='IS' THEN
	IF PI_TIPO = 'V' THEN /*vendas e servicos*/
		SELECT DEMRES.DR1
		INTO L_RET
		FROM CO_SNC_DEMRE DEMRES
		WHERE 1=1
			AND DEMRES.CDPERSON = PI_CDPERSON
			AND DEMRES.TIPOBALAN='IS'
			AND DEMRES.ANOREF = (SELECT MAX(X.ANOREF)
						  FROM CO_SNC_DEMRE X
						  WHERE 1=1
							AND X.TIPOBALAN = DEMRES.TIPOBALAN
							AND X.CDPERSON = DEMRES.CDPERSON
						) ;
	END IF;
	IF PI_TIPO = 'A' THEN /*ano balanco*/
		SELECT DEMRES.ANOREF
		INTO L_RET
		FROM CO_SNC_DEMRE DEMRES
		WHERE 1=1
			AND DEMRES.CDPERSON = PI_CDPERSON
			AND DEMRES.TIPOBALAN='IS'
			AND DEMRES.ANOREF = (SELECT MAX(X.ANOREF)
						  FROM CO_SNC_DEMRE X
						  WHERE 1=1
							AND X.TIPOBALAN = DEMRES.TIPOBALAN
							AND X.CDPERSON = DEMRES.CDPERSON
						);
	END IF;
END IF;

/* se for do tipo I fazer calculos issue 819*/
IF TIPOBALAN ='I' THEN
	IF PI_TIPO = 'V' THEN /*vendas e servicos*/
		SELECT DEMRES.POVEND + DEMRES.POSERV
		INTO L_RET
		FROM CO_ICDEMRE DEMRES
		WHERE 1=1
			AND DEMRES.CDPERSON = PI_CDPERSON
			AND DEMRES.TIPOBALAN='I'
			AND DEMRES.ANOREF = (SELECT MAX(X.ANOREF)
						  FROM CO_ICDEMRE X
						  WHERE 1=1
							AND X.TIPOBALAN = DEMRES.TIPOBALAN
							AND X.CDPERSON = DEMRES.CDPERSON
						) ;
	END IF;
	IF PI_TIPO = 'A' THEN /*ano balanco*/
		SELECT DEMRES.ANOREF
		INTO L_RET
		FROM CO_ICDEMRE DEMRES
		WHERE 1=1
			AND DEMRES.CDPERSON = PI_CDPERSON
			AND DEMRES.TIPOBALAN='I'
			AND DEMRES.ANOREF = (SELECT MAX(X.ANOREF)
						  FROM CO_ICDEMRE X
						  WHERE 1=1
							AND X.TIPOBALAN = DEMRES.TIPOBALAN
							AND X.CDPERSON = DEMRES.CDPERSON
						) ;
	END IF;
END IF;

RETURN L_RET;

EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END GET_INFO_BALANCO;

END;

-- PKG_REPORTS_COSEC (owner: SIID_TESTES)


-- ===== SPEC (PACKAGE) =====

PACKAGE PKG_REPORTS_COSEC AS

/*  NOME      : FUN_FUN_MOD_PAG
   *  OBJECTIVO : FUNCION PARA SABER SI EL MODO DE PAGO ES VARIABLE O FIXA
   *  UTILIZAC?O: EJEMPLO : SELECT PKG_REPORTS_COSEC.FUN_MOD_PAG(1,100,'E',53,sysdate,aux_otvalor) FROM DUAL
   *  VERS?O    : 1.0
   *  CRIADO POR: xx
   */

/* FUNCION PARA SABER SI EL MODO DE PAGO ES VARIABLE O FIXA */
FUNCTION FUN_MOD_PAG (PI_CDUNIECO IN NUMBER
                   ,PI_CDRAMO IN NUMBER
                   ,PI_ESTADO IN VARCHAR2
                   ,PI_NMPOLIZA IN NUMBER
                   ,PI_FEPARAMETRO IN DATE
                   ,PO_OTVALOR OUT tvalopol.otvalor%type) RETURN NUMBER;

/* *** FUNCION QUE NOS DICE SI EL PERIODO DE VIGENCIA DE LA POLIZA ES DIFERENTE DEL PERIODO DE PAGO * ***/
FUNCTION VIGPOL_PERPAG (PI_CDUNIECO IN NUMBER
                         ,PI_CDRAMO IN NUMBER
                         ,PI_ESTADO IN VARCHAR2
                         ,PI_NMPOLIZA IN NUMBER
                         ,PI_FEPARAMETRO DATE) RETURN NUMBER;

/* *** FUNCION PARA VER EN EL CASO DE PAGAMENTO FIXO SI EL FRACCIONAMIENTO DEL PAGO COINCIDE CON *** */
/* *** EL PERIODO DE PAGO O SI ES TEMPORAL TENEMOS QUE  NO HAY FRACCIONAMIENTO                   *** */
FUNCTION PERP_CERO(PI_CDUNIECO IN NUMBER
                  ,PI_CDRAMO IN NUMBER
                  ,PI_ESTADO IN VARCHAR2
                  ,PI_NMPOLIZA IN NUMBER
                  ,PI_FEPARAMETRO DATE) RETURN NUMBER;

/* *** FUNCION PARA VER EN EL CASO DE PAGAMENTO FIXO SI EL FRACCIONAMIENTO DEL PAGO COINCIDE CON *** */
/* *** EL PERIODO DE PAGO O SI ES TEMPORAL TENEMOS QUE  HAY FRACCIONAMIENTO  y                   *** */
/* *** LA POLIZA TEMPORAL DURA MAS DE UN ANHO                                                    *** */
FUNCTION PERP_DOCE(PI_CDUNIECO IN NUMBER
                  ,PI_CDRAMO IN NUMBER
                  ,PI_ESTADO IN VARCHAR2
                  ,PI_NMPOLIZA IN NUMBER
                  ,PI_FEPARAMETRO DATE) RETURN NUMBER;

/* *** FUNCION PARA CALCULAR LA PERIORICIDAD DE PAGO *** */
FUNCTION PERPAG(PI_CDUNIECO IN NUMBER
                  ,PI_CDRAMO IN NUMBER
                  ,PI_ESTADO IN VARCHAR2
                  ,PI_NMPOLIZA IN NUMBER
                  ,PI_FEPARAMETRO DATE
                  ,PO_CDPERPAG OUT mpolizas.cdperpag%type) RETURN NUMBER;

/* *** FUNCION PARA INDIVIDUAL PREMIOS SUBSEQUENTES *** */
FUNCTION AJUFINVI(PI_CDUNIECO IN NUMBER
                  ,PI_CDRAMO IN NUMBER
                  ,PI_ESTADO IN VARCHAR2
                  ,PI_NMPOLIZA IN NUMBER
                  ,PI_FEPARAMETRO DATE) RETURN NUMBER;

/* *** FUNCION PARA INVESTIMENTO      *** */
FUNCTION INV_PRE(PI_CDUNIECO IN NUMBER
                  ,PI_CDRAMO IN NUMBER
                  ,PI_ESTADO IN VARCHAR2
                  ,PI_NMPOLIZA IN NUMBER
                  ,PI_FEPARAMETRO DATE) RETURN NUMBER;

/****************************/
FUNCTION A(PI_CDUNIECO IN NUMBER
          ,PI_CDRAMO IN NUMBER
          ,PI_ESTADO IN VARCHAR2
          ,PI_NMPOLIZA IN NUMBER
          ,PI_FEPARAMETRO IN DATE) RETURN NUMBER;

/****************************/
FUNCTION A1(PI_CDUNIECO IN NUMBER
          ,PI_CDRAMO IN NUMBER
          ,PI_ESTADO IN VARCHAR2
          ,PI_NMPOLIZA IN NUMBER
          ,PI_FEPARAMETRO IN DATE) RETURN NUMBER;

/****************************/
FUNCTION A2A(PI_CDUNIECO IN NUMBER
          ,PI_CDRAMO IN NUMBER
          ,PI_ESTADO IN VARCHAR2
          ,PI_NMPOLIZA IN NUMBER
          ,PI_FEPARAMETRO IN DATE) RETURN NUMBER;

/****************************/
FUNCTION A2B(PI_CDUNIECO IN NUMBER
            ,PI_CDRAMO IN NUMBER
            ,PI_ESTADO IN VARCHAR2
            ,PI_NMPOLIZA IN NUMBER
            ,PI_FEPARAMETRO IN DATE) RETURN NUMBER;

/****************************/
FUNCTION B(PI_CDUNIECO IN NUMBER
          ,PI_CDRAMO IN NUMBER
          ,PI_ESTADO IN VARCHAR2
          ,PI_NMPOLIZA IN NUMBER
          ,PI_FEPARAMETRO IN DATE) RETURN NUMBER;

/****************************/
FUNCTION C(PI_CDUNIECO IN NUMBER
          ,PI_CDRAMO IN NUMBER
          ,PI_ESTADO IN VARCHAR2
          ,PI_NMPOLIZA IN NUMBER
          ,PI_FEPARAMETRO IN DATE) RETURN NUMBER;

/****************************/
FUNCTION D(PI_CDUNIECO IN NUMBER
          ,PI_CDRAMO IN NUMBER
          ,PI_ESTADO IN VARCHAR2
          ,PI_NMPOLIZA IN NUMBER
          ,PI_FEPARAMETRO IN DATE) RETURN NUMBER;

/****************************/
FUNCTION D1(PI_CDUNIECO IN NUMBER
           ,PI_CDRAMO IN NUMBER
           ,PI_ESTADO IN VARCHAR2
           ,PI_NMPOLIZA IN NUMBER
           ,PI_FEPARAMETRO IN DATE) RETURN NUMBER;

/****************************/
FUNCTION EA(PI_CDUNIECO IN NUMBER
           ,PI_CDRAMO IN NUMBER
           ,PI_ESTADO IN VARCHAR2
           ,PI_NMPOLIZA IN NUMBER
           ,PI_FEPARAMETRO IN DATE) RETURN NUMBER;

/****************************/
FUNCTION EB(PI_CDUNIECO IN NUMBER
           ,PI_CDRAMO IN NUMBER
           ,PI_ESTADO IN VARCHAR2
           ,PI_NMPOLIZA IN NUMBER
           ,PI_FEPARAMETRO IN DATE) RETURN NUMBER;

/****************************/
FUNCTION F(PI_CDUNIECO IN NUMBER
           ,PI_CDRAMO IN NUMBER
           ,PI_ESTADO IN VARCHAR2
           ,PI_NMPOLIZA IN NUMBER
           ,PI_FEPARAMETRO IN DATE) RETURN NUMBER;

/****************************/
FUNCTION G(PI_CDUNIECO IN NUMBER
          ,PI_CDRAMO IN NUMBER
          ,PI_ESTADO IN VARCHAR2
          ,PI_NMPOLIZA IN NUMBER
          ,PI_FEPARAMETRO IN DATE) RETURN NUMBER;

/****************************/
FUNCTION G1(PI_CDUNIECO IN NUMBER
           ,PI_CDRAMO IN NUMBER
           ,PI_ESTADO IN VARCHAR2
           ,PI_NMPOLIZA IN NUMBER
           ,PI_FEPARAMETRO IN DATE) RETURN NUMBER;

/****************************/
FUNCTION H(PI_CDUNIECO IN NUMBER
          ,PI_CDRAMO IN NUMBER
          ,PI_ESTADO IN VARCHAR2
          ,PI_NMPOLIZA IN NUMBER
          ,PI_FEPARAMETRO IN DATE) RETURN NUMBER;

/***************************/
FUNCTION I(PI_CDUNIECO IN NUMBER
          ,PI_CDRAMO IN NUMBER
          ,PI_ESTADO IN VARCHAR2
          ,PI_NMPOLIZA IN NUMBER
          ,PI_FEPARAMETRO DATE) RETURN NUMBER;

/***************************/
FUNCTION J(PI_CDUNIECO IN NUMBER
          ,PI_CDRAMO IN NUMBER
          ,PI_ESTADO IN VARCHAR2
          ,PI_NMPOLIZA IN NUMBER
          ,PI_FEPARAMETRO IN DATE) RETURN NUMBER;

/***************************/
FUNCTION L(PI_CDUNIECO IN NUMBER
          ,PI_CDRAMO IN NUMBER
          ,PI_ESTADO IN VARCHAR2
          ,PI_NMPOLIZA IN NUMBER
          ,PI_FEPARAMETRO IN DATE) RETURN NUMBER;

/****************************/
FUNCTION M(PI_CDUNIECO IN NUMBER
          ,PI_CDRAMO IN NUMBER
          ,PI_ESTADO IN VARCHAR2
          ,PI_NMPOLIZA IN NUMBER
          ,PI_FEPARAMETRO IN DATE) RETURN NUMBER;

/****************************/

 PRAGMA RESTRICT_REFERENCES (FUN_MOD_PAG, WNDS);
 PRAGMA RESTRICT_REFERENCES (VIGPOL_PERPAG, WNDS);
 PRAGMA RESTRICT_REFERENCES (PERP_CERO, WNDS);
 PRAGMA RESTRICT_REFERENCES (PERP_DOCE, WNDS);
 PRAGMA RESTRICT_REFERENCES (PERPAG, WNDS);
 PRAGMA RESTRICT_REFERENCES (AJUFINVI, WNDS);
 PRAGMA RESTRICT_REFERENCES (INV_PRE, WNDS);
 PRAGMA RESTRICT_REFERENCES (A, WNDS);
 PRAGMA RESTRICT_REFERENCES (A1, WNDS);
 PRAGMA RESTRICT_REFERENCES (A2A, WNDS);
 PRAGMA RESTRICT_REFERENCES (A2B, WNDS);
 PRAGMA RESTRICT_REFERENCES (B, WNDS);
 PRAGMA RESTRICT_REFERENCES (C, WNDS);
 PRAGMA RESTRICT_REFERENCES (D, WNDS);
 PRAGMA RESTRICT_REFERENCES (D1, WNDS);
 PRAGMA RESTRICT_REFERENCES (EA, WNDS);
 PRAGMA RESTRICT_REFERENCES (EB, WNDS);
 PRAGMA RESTRICT_REFERENCES (F, WNDS);
 PRAGMA RESTRICT_REFERENCES (G, WNDS);
 PRAGMA RESTRICT_REFERENCES (G1, WNDS);
 PRAGMA RESTRICT_REFERENCES (H, WNDS);
 PRAGMA RESTRICT_REFERENCES (I, WNDS);
 PRAGMA RESTRICT_REFERENCES (J, WNDS);
 PRAGMA RESTRICT_REFERENCES (L, WNDS);
 PRAGMA RESTRICT_REFERENCES (M, WNDS);

END PKG_REPORTS_COSEC;


-- ===== BODY (PACKAGE BODY) =====

PACKAGE BODY PKG_REPORTS_COSEC AS

/*  NOME      : FUN_MOD_PAG
   *  OBJECTIVO : FUNCION PARA SABER SI EL MODO DE PAGO ES VARIABLE O FIXA
   *  UTILIZAC?O: EJEMPLO : SELECT PKG_REPORTS_COSEC.FUN_MOD_PAG(1,100,'E',53,sysdate,aux_otvalor) FROM DUAL
   *  VERS?O    : 1.0
   *  CRIADO POR: JUAN CARLOS SANTOS
   */

/* FUNCION PARA SABER SI EL MODO DE PAGO ES VARIABLE O FIXA */
FUNCTION FUN_MOD_PAG (PI_CDUNIECO IN NUMBER
                   ,PI_CDRAMO IN NUMBER
                   ,PI_ESTADO IN VARCHAR2
                   ,PI_NMPOLIZA IN NUMBER
                   ,PI_FEPARAMETRO IN DATE
                   ,PO_OTVALOR OUT tvalopol.otvalor%type) RETURN NUMBER IS

aux_cdmodpag co_mparapro.cdmodpag%type;

BEGIN

  SELECT
    OTVALOR
  INTO
    PO_OTVALOR
  FROM
    CO_MPARAPRO  PARAM_ATR
  , TVALOPOL     VALOR_ATRIBUTO
  WHERE
      PARAM_ATR.CDRAMO        = VALOR_ATRIBUTO.CDRAMO
  AND VALOR_ATRIBUTO.CDATRIBU = PARAM_ATR.CDMODPAG
  AND VALOR_ATRIBUTO.STATUS   = 'V'
  AND VALOR_ATRIBUTO.NMSUPLEM = (
                                  SELECT
                                    MAX(X.NMSUPLEM)
                                  FROM
                                    TVALOPOL X
                                  WHERE
                                      X.CDATRIBU = VALOR_ATRIBUTO.CDATRIBU
                                  AND X.NMPOLIZA = VALOR_ATRIBUTO.NMPOLIZA
                                  AND X.ESTADO   = VALOR_ATRIBUTO.ESTADO
                                  AND X.CDRAMO   = VALOR_ATRIBUTO.CDRAMO
                                  AND X.CDUNIECO = VALOR_ATRIBUTO.CDUNIECO
                                )
  AND VALOR_ATRIBUTO.NMPOLIZA = PI_NMPOLIZA
  AND VALOR_ATRIBUTO.ESTADO   = PI_ESTADO
  AND VALOR_ATRIBUTO.CDRAMO   = PI_CDRAMO
  AND VALOR_ATRIBUTO.CDUNIECO = PI_CDUNIECO;

   RETURN 0;
EXCEPTION
  WHEN OTHERS THEN
    RETURN -1;
END;

/* *** FUNCION QUE NOS DICE SI EL PERIODO DE VIGENCIA DE LA POLIZA ES DIFERENTE DEL PERIODO DE PAGO * ***/

FUNCTION VIGPOL_PERPAG (PI_CDUNIECO IN NUMBER
                         ,PI_CDRAMO IN NUMBER
                         ,PI_ESTADO IN VARCHAR2
                         ,PI_NMPOLIZA IN NUMBER
                         ,PI_FEPARAMETRO DATE) RETURN NUMBER IS

  aux_feefecto mpolizas.feefecto%type;
  aux_fefinv mpolizas.fevencim%type;
  aux_cdperpag mpolizas.cdperpag%type;

BEGIN
    SELECT FEEFECTO,DECODE(OTTEMPOT,'T',FEVENCIM,'R',FEPROREN),CDPERPAG
     INTO aux_feefecto, aux_fefinv, aux_cdperpag
    FROM MPOLIZAS A
    WHERE
           A.CDUNIECO = PI_CDUNIECO
       AND A.CDRAMO   = PI_CDRAMO
       AND A.ESTADO   = PI_ESTADO
       AND A.NMPOLIZA = PI_NMPOLIZA
       AND A.NMSUPLEM = (SELECT MAX(B.NMSUPLEM)
                         FROM MPOLIZAS B
                         WHERE
                            B.CDUNIECO = A.CDUNIECO
                        AND B.CDRAMO   = A.CDRAMO
                        AND B.ESTADO   = A.ESTADO
                        AND B.NMPOLIZA = A.NMPOLIZA
                        AND B.NMSUPLEM <= (SELECT MAX(S.NMSUPLEM)
                                           FROM MSUPLEME S
                                           WHERE
                                              S.CDUNIECO = B.CDUNIECO
                                          AND S.CDRAMO   = B.CDRAMO
                                          AND S.ESTADO   = B.ESTADO
                                          AND S.NMPOLIZA = B.NMPOLIZA
                                          AND PI_FEPARAMETRO BETWEEN S.FEINIVAL AND S.FEFINVAL));
    IF (abs(MONTHS_BETWEEN(aux_feefecto,aux_fefinv)) <> aux_cdperpag) THEN
      RETURN 0;
    ELSE
      RETURN 1;
    END IF;

END;

/* *** FUNCION PARA VER EN EL CASO DE PAGAMENTO FIXO SI EL FRACCIONAMIENTO DEL PAGO COINCIDE CON *** */
/* *** EL PERIODO DE PAGO O SI ES TEMPORAL TENEMOS QUE  NO HAY FRACCIONAMIENTO                   *** */

FUNCTION PERP_CERO(PI_CDUNIECO IN NUMBER
                  ,PI_CDRAMO IN NUMBER
                  ,PI_ESTADO IN VARCHAR2
                  ,PI_NMPOLIZA IN NUMBER
                  ,PI_FEPARAMETRO DATE) RETURN NUMBER IS

  aux_ottempot mpolizas.ottempot%type;
  aux_feefecto mpolizas.feefecto%type;
  aux_fefinv mpolizas.fevencim%type;
  aux_cdperpag mpolizas.cdperpag%type;

BEGIN
    SELECT OTTEMPOT, FEEFECTO,DECODE(OTTEMPOT,'T',FEVENCIM,'R',FEPROREN),CDPERPAG
     INTO aux_ottempot,aux_feefecto, aux_fefinv, aux_cdperpag
    FROM MPOLIZAS A
    WHERE
           A.CDUNIECO = PI_CDUNIECO
       AND A.CDRAMO   = PI_CDRAMO
       AND A.ESTADO   = PI_ESTADO
       AND A.NMPOLIZA = PI_NMPOLIZA
       AND A.NMSUPLEM = (SELECT MAX(B.NMSUPLEM)
                         FROM MPOLIZAS B
                         WHERE
                            B.CDUNIECO = A.CDUNIECO
                        AND B.CDRAMO   = A.CDRAMO
                        AND B.ESTADO   = A.ESTADO
                        AND B.NMPOLIZA = A.NMPOLIZA
                        AND B.NMSUPLEM <= (SELECT MAX(S.NMSUPLEM)
                                           FROM MSUPLEME S
                                           WHERE
                                              S.CDUNIECO = B.CDUNIECO
                                          AND S.CDRAMO   = B.CDRAMO
                                          AND S.ESTADO   = B.ESTADO
                                          AND S.NMPOLIZA = B.NMPOLIZA
                                          AND PI_FEPARAMETRO BETWEEN S.FEINIVAL AND S.FEFINVAL));
    IF ((aux_ottempot = 'T') and (aux_cdperpag = 0)) THEN
      RETURN 0;
    ELSIF (aux_ottempot = 'R') and (MONTHS_BETWEEN(aux_feefecto,aux_fefinv) = aux_cdperpag) THEN
      RETURN 0;
    ELSE
      RETURN 1;
    END IF;
END;

/* *** FUNCION PARA VER EN EL CASO DE PAGAMENTO FIXO SI EL FRACCIONAMIENTO DEL PAGO COINCIDE CON *** */
/* *** EL PERIODO DE PAGO O SI ES TEMPORAL TENEMOS QUE  HAY FRACCIONAMIENTO  y                   *** */
/* *** LA POLIZA TEMPORAL DURA MAS DE UN ANHO                                                    *** */

FUNCTION PERP_DOCE(PI_CDUNIECO IN NUMBER
                  ,PI_CDRAMO IN NUMBER
                  ,PI_ESTADO IN VARCHAR2
                  ,PI_NMPOLIZA IN NUMBER
                  ,PI_FEPARAMETRO DATE) RETURN NUMBER IS

  aux_ottempot mpolizas.ottempot%type;
  aux_feefecto mpolizas.feefecto%type;
  aux_fefinv mpolizas.fevencim%type;
  aux_cdperpag mpolizas.cdperpag%type;

BEGIN
    SELECT OTTEMPOT, FEEFECTO,DECODE(OTTEMPOT,'T',FEVENCIM,'R',FEPROREN),CDPERPAG
     INTO aux_ottempot,aux_feefecto, aux_fefinv, aux_cdperpag
    FROM MPOLIZAS A
    WHERE
           A.CDUNIECO = PI_CDUNIECO
       AND A.CDRAMO   = PI_CDRAMO
       AND A.ESTADO   = PI_ESTADO
       AND A.NMPOLIZA = PI_NMPOLIZA
       AND A.NMSUPLEM = (SELECT MAX(B.NMSUPLEM)
                         FROM MPOLIZAS B
                         WHERE
                            B.CDUNIECO = A.CDUNIECO
                        AND B.CDRAMO   = A.CDRAMO
                        AND B.ESTADO   = A.ESTADO
                        AND B.NMPOLIZA = A.NMPOLIZA
                        AND B.NMSUPLEM <= (SELECT MAX(S.NMSUPLEM)
                                           FROM MSUPLEME S
                                           WHERE
                                              S.CDUNIECO = B.CDUNIECO
                                          AND S.CDRAMO   = B.CDRAMO
                                          AND S.ESTADO   = B.ESTADO
                                          AND S.NMPOLIZA = B.NMPOLIZA
                                          AND PI_FEPARAMETRO BETWEEN S.FEINIVAL AND S.FEFINVAL));
    IF ((aux_ottempot = 'T') and (aux_cdperpag > 12)) THEN
      RETURN 0;
    ELSIF (aux_ottempot = 'R') and (MONTHS_BETWEEN(aux_feefecto,aux_fefinv) = aux_cdperpag) THEN
      RETURN 0;
    ELSE
      RETURN 1;
    END IF;
END;


/* *** FUNCION PARA CALCULAR LA PERIORICIDAD DE PAGO *** */
FUNCTION PERPAG(PI_CDUNIECO IN NUMBER
                  ,PI_CDRAMO IN NUMBER
                  ,PI_ESTADO IN VARCHAR2
                  ,PI_NMPOLIZA IN NUMBER
                  ,PI_FEPARAMETRO DATE
                  ,PO_CDPERPAG OUT mpolizas.cdperpag%type) RETURN NUMBER IS

BEGIN

  SELECT
    APOLICE.CDPERPAG
  INTO
    po_cdperpag
  FROM
    MPOLIZAS APOLICE
  WHERE
      APOLICE.STATUS   = 'V'
  AND APOLICE.NMSUPLEM = (
                           SELECT
                             MAX(X.NMSUPLEM)
                           FROM
                             MPOLIZAS X
                           WHERE
                               X.NMSUPLEM <= TO_CHAR(PI_FEPARAMETRO,'J')||'99999999999'
                           AND X.NMPOLIZA = APOLICE.NMPOLIZA
                           AND X.ESTADO   = APOLICE.ESTADO
                           AND X.CDRAMO   = APOLICE.CDRAMO
                           AND X.CDUNIECO = APOLICE.CDUNIECO
                         )
  AND APOLICE.NMPOLIZA = PI_NMPOLIZA
  AND APOLICE.ESTADO   = PI_ESTADO
  AND APOLICE.CDRAMO   = PI_CDRAMO
  AND APOLICE.CDUNIECO = PI_CDUNIECO;

   RETURN 0;
EXCEPTION
  WHEN OTHERS THEN
    RETURN -1;
END;

/* *** FUNCION PARA INDIVIDUAL PREMIOS SUBSEQUENTES *** */

FUNCTION AJUFINVI(PI_CDUNIECO IN NUMBER
                  ,PI_CDRAMO IN NUMBER
                  ,PI_ESTADO IN VARCHAR2
                  ,PI_NMPOLIZA IN NUMBER
                  ,PI_FEPARAMETRO DATE) RETURN NUMBER IS

aux_feemisio mrecibo.feemisio%type;
aux_fefinv mpolizas.fevencim%type;

BEGIN
   SELECT FEEMISIO
     INTO aux_feemisio
   FROM MRECIBO A
   WHERE
          A.CDUNIECO = PI_CDUNIECO
      AND A.CDRAMO   = PI_CDRAMO
      AND A.ESTADO   = PI_ESTADO
      AND A.NMPOLIZA = PI_NMPOLIZA
      AND A.NMSUPLEM = (SELECT MAX(B.NMSUPLEM)
                        FROM MRECIBO B
                        WHERE
                               B.CDUNIECO = A.CDUNIECO
                           AND B.CDRAMO   = A.CDRAMO
                           AND B.ESTADO   = A.ESTADO
                           AND B.NMPOLIZA = A.NMPOLIZA
                           AND B.NMSUPLEM <= (SELECT MAX(S.NMSUPLEM)
                                              FROM MSUPLEME S
                                              WHERE
                                                     S.CDUNIECO = B.CDUNIECO
                                                 AND S.CDRAMO   = B.CDRAMO
                                                 AND S.ESTADO   = B.ESTADO
                                                 AND S.NMPOLIZA = B.NMPOLIZA
                                                 AND PI_FEPARAMETRO
                                                     BETWEEN S.FEINIVAL AND S.FEFINVAL));
   SELECT DECODE(OTTEMPOT,'T',FEVENCIM,'R',FEPROREN)
     INTO aux_fefinv
   FROM MPOLIZAS A
   WHERE
          A.CDUNIECO = PI_CDUNIECO
      AND A.CDRAMO   = PI_CDRAMO
      AND A.ESTADO   = PI_ESTADO
      AND A.NMPOLIZA = PI_NMPOLIZA
      AND A.NMSUPLEM = (SELECT MAX(B.NMSUPLEM)
                        FROM MPOLIZAS B
                        WHERE
                               B.CDUNIECO = A.CDUNIECO
                           AND B.CDRAMO   = A.CDRAMO
                           AND B.ESTADO   = A.ESTADO
                           AND B.NMPOLIZA = A.NMPOLIZA
                           AND B.NMSUPLEM <= (SELECT MAX(S.NMSUPLEM)
                                              FROM MSUPLEME S
                                              WHERE
                                                     S.CDUNIECO = B.CDUNIECO
                                                 AND S.CDRAMO   = B.CDRAMO
                                                 AND S.ESTADO   = B.ESTADO
                                                 AND S.NMPOLIZA = B.NMPOLIZA
                                                 AND PI_FEPARAMETRO
                                                     BETWEEN S.FEINIVAL AND S.FEFINVAL));
   IF (aux_feemisio >= aux_fefinv) THEN
      RETURN 0;
   ELSE
      RETURN 1;
   END IF;

END;

/* *** FUNCION PARA INVESTIMENTO      *** */

FUNCTION INV_PRE(PI_CDUNIECO IN NUMBER
                  ,PI_CDRAMO IN NUMBER
                  ,PI_ESTADO IN VARCHAR2
                  ,PI_NMPOLIZA IN NUMBER
                  ,PI_FEPARAMETRO DATE) RETURN NUMBER IS

  aux_ottempot mpolizas.ottempot%type;
  aux_feefecto mpolizas.feefecto%type;
  aux_fefinv mpolizas.fevencim%type;
  aux_cdperpag mpolizas.cdperpag%type;

BEGIN
    SELECT OTTEMPOT, FEEFECTO,DECODE(OTTEMPOT,'T',FEVENCIM,'R',FEPROREN),CDPERPAG
     INTO aux_ottempot,aux_feefecto, aux_fefinv, aux_cdperpag
    FROM MPOLIZAS A
    WHERE
           A.CDUNIECO = PI_CDUNIECO
       AND A.CDRAMO   = PI_CDRAMO
       AND A.ESTADO   = PI_ESTADO
       AND A.NMPOLIZA = PI_NMPOLIZA
       AND A.NMSUPLEM = (SELECT MAX(B.NMSUPLEM)
                         FROM MPOLIZAS B
                         WHERE
                            B.CDUNIECO = A.CDUNIECO
                        AND B.CDRAMO   = A.CDRAMO
                        AND B.ESTADO   = A.ESTADO
                        AND B.NMPOLIZA = A.NMPOLIZA
                        AND B.NMSUPLEM <= (SELECT MAX(S.NMSUPLEM)
                                           FROM MSUPLEME S
                                           WHERE
                                              S.CDUNIECO = B.CDUNIECO
                                          AND S.CDRAMO   = B.CDRAMO
                                          AND S.ESTADO   = B.ESTADO
                                          AND S.NMPOLIZA = B.NMPOLIZA
                                          AND PI_FEPARAMETRO BETWEEN S.FEINIVAL AND S.FEFINVAL));
    IF (aux_ottempot = 'R') and (MONTHS_BETWEEN(aux_feefecto,aux_fefinv) = aux_cdperpag) THEN
      RETURN 0;
    ELSE
      RETURN 1;
    END IF;
END;



/****************************/
FUNCTION A(PI_CDUNIECO IN NUMBER
          ,PI_CDRAMO IN NUMBER
          ,PI_ESTADO IN VARCHAR2
          ,PI_NMPOLIZA IN NUMBER
          ,PI_FEPARAMETRO IN DATE) RETURN NUMBER IS

cond number;
aux_otvalor tvalopol.otvalor%type;

BEGIN
   cond := FUN_MOD_PAG(PI_CDUNIECO,PI_CDRAMO,PI_ESTADO,PI_NMPOLIZA
                  ,PI_FEPARAMETRO,aux_otvalor);

   IF (aux_otvalor = '2') THEN
          RETURN 0;
   ELSE
          RETURN 1;
   END IF;
END;
/****************************/
FUNCTION A1(PI_CDUNIECO IN NUMBER
          ,PI_CDRAMO IN NUMBER
          ,PI_ESTADO IN VARCHAR2
          ,PI_NMPOLIZA IN NUMBER
          ,PI_FEPARAMETRO IN DATE) RETURN NUMBER IS

cond number;
aux_otvalor tvalopol.otvalor%type;

BEGIN
   cond := FUN_MOD_PAG(PI_CDUNIECO,PI_CDRAMO,PI_ESTADO,PI_NMPOLIZA,PI_FEPARAMETRO,aux_otvalor);
   IF (aux_otvalor = '1') THEN
          cond := VIGPOL_PERPAG (PI_CDUNIECO, PI_CDRAMO, PI_ESTADO, PI_NMPOLIZA, PI_FEPARAMETRO);
          RETURN cond;
   ELSE
          RETURN 1;
   END IF;

END;
/****************************/
FUNCTION A2A(PI_CDUNIECO IN NUMBER
          ,PI_CDRAMO IN NUMBER
          ,PI_ESTADO IN VARCHAR2
          ,PI_NMPOLIZA IN NUMBER
          ,PI_FEPARAMETRO IN DATE) RETURN NUMBER IS

cond number;
aux_otvalor tvalopol.otvalor%type;

BEGIN
   cond := FUN_MOD_PAG(PI_CDUNIECO,PI_CDRAMO,PI_ESTADO,PI_NMPOLIZA,PI_FEPARAMETRO,aux_otvalor);
   IF (aux_otvalor = '1') THEN
      cond := PERP_CERO(PI_CDUNIECO,PI_CDRAMO,PI_ESTADO,PI_NMPOLIZA,PI_FEPARAMETRO);
      RETURN cond;
   ELSE
      RETURN 1;
   END IF;
END;
/****************************/
FUNCTION A2B(PI_CDUNIECO IN NUMBER
            ,PI_CDRAMO IN NUMBER
            ,PI_ESTADO IN VARCHAR2
            ,PI_NMPOLIZA IN NUMBER
            ,PI_FEPARAMETRO IN DATE) RETURN NUMBER IS

cond number;
aux_otvalor tvalopol.otvalor%type;

BEGIN
   cond := FUN_MOD_PAG(PI_CDUNIECO,PI_CDRAMO,PI_ESTADO,PI_NMPOLIZA,PI_FEPARAMETRO,aux_otvalor);
   IF (aux_otvalor = '1') THEN
      cond := PERP_DOCE(PI_CDUNIECO,PI_CDRAMO,PI_ESTADO,PI_NMPOLIZA,PI_FEPARAMETRO);
      RETURN cond;
   ELSE
      RETURN 1;
   END IF;
END;
/****************************/
FUNCTION B(PI_CDUNIECO IN NUMBER
          ,PI_CDRAMO IN NUMBER
          ,PI_ESTADO IN VARCHAR2
          ,PI_NMPOLIZA IN NUMBER
          ,PI_FEPARAMETRO IN DATE) RETURN NUMBER IS

cond number;
AUX_CDPERPAG mpolizas.cdperpag%type;
aux_otvalor tvalopol.otvalor%type;

BEGIN
   cond := FUN_MOD_PAG(PI_CDUNIECO,PI_CDRAMO,PI_ESTADO,PI_NMPOLIZA,PI_FEPARAMETRO,aux_otvalor);
   IF (aux_otvalor = '1') THEN
     begin
      cond := PERPAG(PI_CDUNIECO, PI_CDRAMO, PI_ESTADO
                    ,PI_NMPOLIZA, PI_FEPARAMETRO, AUX_CDPERPAG);
      if (AUX_CDPERPAG not in  (0,12)) then
         RETURN 0;
      else RETURN 1;
      end if;
     end;
   ELSE
      RETURN 1;
   END IF;
END;
/****************************/
FUNCTION C(PI_CDUNIECO IN NUMBER
          ,PI_CDRAMO IN NUMBER
          ,PI_ESTADO IN VARCHAR2
          ,PI_NMPOLIZA IN NUMBER
          ,PI_FEPARAMETRO IN DATE) RETURN NUMBER IS
cond number;
aux_otvalor tvalopol.otvalor%type;

BEGIN
   cond := FUN_MOD_PAG(PI_CDUNIECO,PI_CDRAMO,PI_ESTADO,PI_NMPOLIZA,PI_FEPARAMETRO,aux_otvalor);
   IF (aux_otvalor = '2') THEN
      RETURN 0;
   ELSE
      RETURN 1;
   END IF;
END;
/****************************/
FUNCTION D(PI_CDUNIECO IN NUMBER
          ,PI_CDRAMO IN NUMBER
          ,PI_ESTADO IN VARCHAR2
          ,PI_NMPOLIZA IN NUMBER
          ,PI_FEPARAMETRO IN DATE) RETURN NUMBER IS

BEGIN
      RETURN 0;
END;
/****************************/
FUNCTION D1(PI_CDUNIECO IN NUMBER
           ,PI_CDRAMO IN NUMBER
           ,PI_ESTADO IN VARCHAR2
           ,PI_NMPOLIZA IN NUMBER
           ,PI_FEPARAMETRO IN DATE) RETURN NUMBER IS

cond number;

BEGIN
   cond := AJUFINVI(PI_CDUNIECO, PI_CDRAMO, PI_ESTADO, PI_NMPOLIZA, PI_FEPARAMETRO);
   RETURN cond;
END;
/****************************/
FUNCTION EA(PI_CDUNIECO IN NUMBER
           ,PI_CDRAMO IN NUMBER
           ,PI_ESTADO IN VARCHAR2
           ,PI_NMPOLIZA IN NUMBER
           ,PI_FEPARAMETRO IN DATE) RETURN NUMBER IS

cond number;

BEGIN
   cond := PERP_CERO(PI_CDUNIECO,PI_CDRAMO,PI_ESTADO,PI_NMPOLIZA,PI_FEPARAMETRO);
   RETURN cond;
END;
/****************************/
FUNCTION EB(PI_CDUNIECO IN NUMBER
           ,PI_CDRAMO IN NUMBER
           ,PI_ESTADO IN VARCHAR2
           ,PI_NMPOLIZA IN NUMBER
           ,PI_FEPARAMETRO IN DATE) RETURN NUMBER IS

cond number;

BEGIN
   cond := PERP_DOCE(PI_CDUNIECO,PI_CDRAMO,PI_ESTADO,PI_NMPOLIZA,PI_FEPARAMETRO);
   RETURN cond;
END;
/****************************/
FUNCTION F(PI_CDUNIECO IN NUMBER
           ,PI_CDRAMO IN NUMBER
           ,PI_ESTADO IN VARCHAR2
           ,PI_NMPOLIZA IN NUMBER
           ,PI_FEPARAMETRO IN DATE) RETURN NUMBER IS
cond number;
BEGIN
   cond := VIGPOL_PERPAG (PI_CDUNIECO, PI_CDRAMO, PI_ESTADO, PI_NMPOLIZA, PI_FEPARAMETRO);
   RETURN cond;
END;
/****************************/
FUNCTION G(PI_CDUNIECO IN NUMBER
          ,PI_CDRAMO IN NUMBER
          ,PI_ESTADO IN VARCHAR2
          ,PI_NMPOLIZA IN NUMBER
          ,PI_FEPARAMETRO IN DATE) RETURN NUMBER IS
cond number;
aux_cdperpag mpolizas.cdperpag%type;
BEGIN
   cond := PERPAG(PI_CDUNIECO, PI_CDRAMO, PI_ESTADO
                 ,PI_NMPOLIZA, PI_FEPARAMETRO, aux_CdPERPAG);

   if (AUX_CDPERPAG not in (0,12)) then
      RETURN 0;
   else RETURN 1;
   end if;
END;
/****************************/
FUNCTION G1(PI_CDUNIECO IN NUMBER
           ,PI_CDRAMO IN NUMBER
           ,PI_ESTADO IN VARCHAR2
           ,PI_NMPOLIZA IN NUMBER
           ,PI_FEPARAMETRO IN DATE) RETURN NUMBER IS

cond number;

BEGIN
   cond := AJUFINVI(PI_CDUNIECO, PI_CDRAMO, PI_ESTADO, PI_NMPOLIZA, PI_FEPARAMETRO);
   RETURN cond;
END;
/****************************/
FUNCTION H(PI_CDUNIECO IN NUMBER
          ,PI_CDRAMO IN NUMBER
          ,PI_ESTADO IN VARCHAR2
          ,PI_NMPOLIZA IN NUMBER
          ,PI_FEPARAMETRO IN DATE) RETURN NUMBER IS

BEGIN
      RETURN 0;
END;
/***************************/
FUNCTION I(PI_CDUNIECO IN NUMBER
          ,PI_CDRAMO IN NUMBER
          ,PI_ESTADO IN VARCHAR2
          ,PI_NMPOLIZA IN NUMBER
          ,PI_FEPARAMETRO DATE) RETURN NUMBER IS
cond number;
BEGIN
   cond := INV_PRE(PI_CDUNIECO, PI_CDRAMO, PI_ESTADO, PI_NMPOLIZA, PI_FEPARAMETRO);
   RETURN cond;
END;
/***************************/
FUNCTION J(PI_CDUNIECO IN NUMBER
          ,PI_CDRAMO IN NUMBER
          ,PI_ESTADO IN VARCHAR2
          ,PI_NMPOLIZA IN NUMBER
          ,PI_FEPARAMETRO IN DATE) RETURN NUMBER IS

cond number;

BEGIN
   cond := PERP_DOCE(PI_CDUNIECO,PI_CDRAMO,PI_ESTADO,PI_NMPOLIZA,PI_FEPARAMETRO);
   RETURN cond;
END;
/***************************/
FUNCTION L(PI_CDUNIECO IN NUMBER
          ,PI_CDRAMO IN NUMBER
          ,PI_ESTADO IN VARCHAR2
          ,PI_NMPOLIZA IN NUMBER
          ,PI_FEPARAMETRO IN DATE) RETURN NUMBER IS
cond number;
aux_cdperpag mpolizas.cdperpag%type;
BEGIN
   cond := PERPAG(PI_CDUNIECO, PI_CDRAMO, PI_ESTADO
                 ,PI_NMPOLIZA, PI_FEPARAMETRO, aux_CdPERPAG);

   if ((AUX_CDPERPAG <> 0) or (AUX_CDPERPAG <> 12)) then
      RETURN 0;
   else RETURN 1;
   end if;
END;
/****************************/
FUNCTION M(PI_CDUNIECO IN NUMBER
          ,PI_CDRAMO IN NUMBER
          ,PI_ESTADO IN VARCHAR2
          ,PI_NMPOLIZA IN NUMBER
          ,PI_FEPARAMETRO IN DATE) RETURN NUMBER IS

cond number;

BEGIN
   cond := AJUFINVI(PI_CDUNIECO, PI_CDRAMO, PI_ESTADO, PI_NMPOLIZA, PI_FEPARAMETRO);
   RETURN cond;
END;
/****************************/
END;


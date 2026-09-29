-- PKG_ENTIDADES_UTIL (owner: SIID_TESTES)


-- ===== SPEC (PACKAGE) =====

PACKAGE "PKG_ENTIDADES_UTIL" AS
--* CONSTANTES PROPRIAS QUESTIONAR INFORMAC?ES SOBRE PACKAGE
--*
--* CRIADO POR  : BRIGIDA RAMOS
--* DATA CRIACAO: 29-03-2007
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
-* NOME      : GET_VIGENCIA_GRUPO
-* OBJECTIVO : RETORNA AS VIGENCIAS DOS CREDITOS PARA UM GRUPO
-* UTILIZACAO:
-* AUTOR     : BRIGIDA RAMOS
-* DATA      : 29-03-2007
-* VERS?O    : 1.0
-*
-* ULTIMAS ALTERAC?ES
-*
-*   DATA       AUTOR           DESCRIC?O
-*   ========== =============== =================================================
-*
-*/

FUNCTION GET_VIGENCIA_GRUPO    ( PI_GRUPO IN VARCHAR2
		 		,PI_PLAFOND   IN VARCHAR2
				,PI_VIG   IN VARCHAR2
				) RETURN DATE;

/*
-* NOME      : GET_RATING_GRUPO
-* OBJECTIVO : RETORNA O RATING DO GRUPO NUMA DETERMINADA DATA
-* UTILIZACAO:
-* AUTOR     : BRIGIDA RAMOS
-* DATA      : 06-06-2007
-* VERS?O    : 1.0
-*
-* ULTIMAS ALTERAC?ES
-*
-*   DATA       AUTOR           DESCRIC?O
-*   ========== =============== =================================================
-*
-*/

FUNCTION GET_RATING_GRUPO    ( PI_GRUPO IN CO_GRUPENT.CDGRUENT%TYPE
		 	                 , PI_DATA IN DATE
     			             ) RETURN VARCHAR2;

/*
-* NOME      : GET_RATING_ENTIDADE
-* OBJECTIVO : RETORNA O RATING DE UMA ENTIDADE NUMA DETERMINADA DATA
-* UTILIZACAO:
-* AUTOR     : BRIGIDA RAMOS
-* DATA      : 06-06-2007
-* VERS?O    : 1.0
-*
-* ULTIMAS ALTERAC?ES
-*
-*   DATA       AUTOR           DESCRIC?O
-*   ========== =============== =================================================
-*
-*/

FUNCTION GET_RATING_ENTIDADE  ( PI_CDPERSON IN MPERSONA.CDPERSON%TYPE
		 	      ,PI_DATA IN DATE
     			      ) RETURN VARCHAR2;

/*
-* NOME      : GET_CODPOSTAL_PRT
-* OBJECTIVO : RETORNA A DESCRIC?O DO CODIGO POSTAL
-* UTILIZACAO:
-* AUTOR     : JOSE VIEGAS
-* DATA      : 19-01-2010
-* VERS?O    : 1.0
-*
-* ULTIMAS ALTERAC?ES
-*
-*   DATA       AUTOR           DESCRIC?O
-*   ========== =============== =================================================
-*
-*/
FUNCTION GET_CODPOSTAL_PRT ( PI_CDCODIPOS IN VARCHAR2) RETURN VARCHAR2;
/*
-* NOME      : GET_N_LIMIT_GLOBAL
-* OBJECTIVO : RETORNA O Total de registos encontrados em CO_EH_LIMITS_F2 para a entidade
-* UTILIZACAO:
-* AUTOR     : ALDO TITA
-* DATA      : 17-03-2010
-* VERS?O    : 1.0
-*
-* ULTIMAS ALTERAC?ES
-*
-*   DATA       AUTOR           DESCRIC?O
-*   ========== =============== =================================================
-*
-*/
FUNCTION GET_N_LIMIT_GLOBAL ( P_CDPERSON IN NUMBER) RETURN NUMBER;

/*
-* NOME      : GET_N_LIMIT_GLOBAL
-* OBJECTIVO : RETORNA O Total de registos encontrados em CO_LIMEXT para a entidade
-* UTILIZACAO:
-* AUTOR     : ALDO TITA
-* DATA      : 31-03-2011
-* VERS?O    : 1.0
-*
-* ULTIMAS ALTERAC?ES
-*
-*   DATA       AUTOR           DESCRIC?O
-*   ========== =============== =================================================
-*
-*/
FUNCTION GET_N_LIMIT_GLOBAL_DEP ( P_CDIDEPER IN VARCHAR2) RETURN NUMBER;
/*
-* NOME      : GET_EXPOSICAO_GLOBAL
-* OBJECTIVO : RETORNA A Soma de PTLIMIT de CO_EH_LIMITS_F2 para todos os registos encontrados para a entidade.
-* UTILIZACAO:
-* AUTOR     : ALDO TITA
-* DATA      : 17-03-2010
-* VERS?O    : 1.0
-*
-* ULTIMAS ALTERAC?ES
-*
-*   DATA       AUTOR           DESCRIC?O
-*   ========== =============== =================================================
-*
-*/
FUNCTION GET_EXPOSICAO_GLOBAL ( P_CDPERSON IN NUMBER) RETURN NUMBER;

/*
-* NOME      : GET_EXPOSICAO_GLOBAL
-* OBJECTIVO : RETORNA A Soma de IMCONCO e TEMP_INC_M de LIMEXT para todos os registos encontrados para a entidade.
-* UTILIZACAO:
-* AUTOR     : ALDO TITA
-* DATA      : 17-03-2010
-* VERS?O    : 1.0
-*
-* ULTIMAS ALTERAC?ES
-*
-*   DATA       AUTOR           DESCRIC?O
-*   ========== =============== =================================================
-*
-*/
FUNCTION GET_EXPOSICAO_GLOBAL_DEP ( P_CDIDEPER IN VARCHAR2) RETURN NUMBER;

/*
-* NOME      : GET_N_LIMIT_GLOBAL_GRUPO
-* OBJECTIVO : RETORNA O Total de registos encontrados em CO_EH_LIMITS_F2 para a grupo de entidades
-* UTILIZACAO:
-* AUTOR     : ALDO TITA
-* DATA      : 17-03-2010
-* VERS?O    : 1.0
-*
-* ULTIMAS ALTERAC?ES
-*
-*   DATA       AUTOR           DESCRIC?O
-*   ========== =============== =================================================
-*
-*/
FUNCTION GET_N_LIMIT_GLOBAL_GRUPO ( P_CDGRUPO IN VARCHAR2) RETURN NUMBER;
FUNCTION GET_N_LIMIT_GLOBAL_GRUPO_TOM ( P_CDGRUPO IN VARCHAR2) RETURN NUMBER;
FUNCTION GET_N_LIMIT_GLOBAL_GRUPO_POT ( P_CDGRUPO IN VARCHAR2) RETURN NUMBER;

/*
-* NOME      : GET_CDDECISOR_CAUCAO
-* OBJECTIVO : RETORNA O CODIGO DE DECISOR DO PLAFOND DE CAUCAO
-* UTILIZACAO:
-* AUTOR     : JOSE VIEGAS
-* DATA      : 23-06-2010
-* VERS?O    : 1.0
-*
-* ULTIMAS ALTERAC?ES
-*
-*   DATA       AUTOR           DESCRIC?O
-*   ========== =============== =================================================
-*
-*/

FUNCTION GET_EXPOSICAO_GLOBAL_GRUPO (P_CDGRUPO IN VARCHAR2 ) RETURN NUMBER;
FUNCTION GET_EXPOSICAO_GLOBAL_GRUPO_TOM (P_CDGRUPO IN VARCHAR2 ) RETURN NUMBER;
FUNCTION GET_EXPOSICAO_GLOBAL_GRUPO_POT (P_CDGRUPO IN VARCHAR2 ) RETURN NUMBER;
FUNCTION GET_EXPOSICAO_GLOBAL_GRUPO_R (P_CDGRUPO IN VARCHAR2) RETURN NUMBER;
/*
-* NOME      : GET_CDDECISOR_CAUCAO
-* OBJECTIVO : RETORNA O CODIGO DE DECISOR DO PLAFOND DE CAUCAO
-* UTILIZACAO:
-* AUTOR     : JOSE VIEGAS
-* DATA      : 23-06-2010
-* VERS?O    : 1.0
-*
-* ULTIMAS ALTERAC?ES
-*
-*   DATA       AUTOR           DESCRIC?O
-*   ========== =============== =================================================
-*
-*/

FUNCTION GET_CDDECISOR_CAUCAO ( PI_CDPERSON IN CO_PLAFONCA.CDPERSON%TYPE
                              ) RETURN VARCHAR2;

/*
-* NOME      : GET_CDDECISOR_CREDITO
-* OBJECTIVO : RETORNA O CODIGO DE DECISOR DO PLAFOND DE CREDITO
-* UTILIZACAO:
-* AUTOR     : JOSE VIEGAS
-* DATA      : 23-06-2010
-* VERS?O    : 1.0
-*
-* ULTIMAS ALTERAC?ES
-*
-*   DATA       AUTOR           DESCRIC?O
-*   ========== =============== =================================================
-*
-*/

FUNCTION GET_CDDECISOR_CREDITO ( PI_CDPERSON IN CO_PLAFOCRE.CDPERSON%TYPE
                               ) RETURN VARCHAR2;

/*
-* NOME      : GET_DISTRITO_ENTIDADE
-* OBJECTIVO : RETORNA O DISTRITO DA ENTIDADE
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
FUNCTION GET_DISTRITO_ENTIDADE ( PI_CDPERSON IN VARCHAR2) RETURN VARCHAR2;

/*
-* NOME      : GET_PEDIDO_INFO
-* OBJECTIVO : RETORNA O DISTRITO DA ENTIDADE
-* UTILIZACAO:
-* AUTOR     : ALDO TITA
-* DATA      : 18-01-2013
-* VERS?O    : 1.0
-*
-* ULTIMAS ALTERAC?ES
-*
-*   DATA       AUTOR           DESCRIC?O
-*   ========== =============== =================================================
-*
-*/
FUNCTION GET_PEDIDO_INFO ( PI_CDPERSON IN VARCHAR2, PI_COLUMN_NAME IN VARCHAR2) RETURN VARCHAR2;

/*
-* NOME      : GET_PEDIDO_INFO
-* OBJECTIVO : RETORNA O DISTRITO DA ENTIDADE
-* UTILIZACAO:
-* AUTOR     : ALDO TITA
-* DATA      : 18-01-2013
-* VERS?O    : 1.0
-*
-* ULTIMAS ALTERAC?ES
-*
-*   DATA       AUTOR           DESCRIC?O
-*   ========== =============== =================================================
-*
-*/
FUNCTION GET_PEDIDO_INFO_DT ( PI_CDPERSON IN VARCHAR2, PI_COLUMN_NAME IN VARCHAR2) RETURN DATE;

/*
-* NOME      : GET_IBAN_INFO
-* OBJECTIVO : RETORNA O IBAN VÀLIDO DA ENTIDADE
-* UTILIZACAO:
-* AUTOR     : João Ribeiro
-* DATA      : 07-06-2024
-* VERS?O    : 1.0
-*
-* ULTIMAS ALTERAC?ES
-*
-*   DATA       AUTOR           DESCRIC?O
-*   ========== =============== =================================================
-*
-*/
FUNCTION GET_IBAN_INFO ( PI_CDPERSON IN NUMBER) RETURN VARCHAR2;

/*
-* NOME      : GET_IBAN_FORMAT
-* OBJECTIVO : RETORNA O IBAN VÀLIDO FORMATADO DA ENTIDADE
-* UTILIZACAO:
-* AUTOR     : João Ribeiro
-* DATA      : 07-06-2024
-* VERS?O    : 1.0
-*
-* ULTIMAS ALTERAC?ES
-*
-*   DATA       AUTOR           DESCRIC?O
-*   ========== =============== =================================================
-*
-*/
FUNCTION GET_IBAN_FORMAT ( PI_CDPERSON IN NUMBER) RETURN VARCHAR2;

/*
-* NOME      : GET_CDBIC_INFO
-* OBJECTIVO : RETORNA O CDBIC VÀLIDO DA ENTIDADE
-* UTILIZACAO:
-* AUTOR     : João Ribeiro
-* DATA      : 07-06-2024
-* VERS?O    : 1.0
-*
-* ULTIMAS ALTERAC?ES
-*
-*   DATA       AUTOR           DESCRIC?O
-*   ========== =============== =================================================
-*
-*/
FUNCTION GET_CDBIC_INFO ( PI_CDPERSON IN NUMBER) RETURN VARCHAR2;

PRAGMA RESTRICT_REFERENCES (GET_CDDECISOR_CREDITO, WNDS);
PRAGMA RESTRICT_REFERENCES (GET_CDDECISOR_CAUCAO, WNDS);
PRAGMA RESTRICT_REFERENCES (GET_N_LIMIT_GLOBAL,WNDS);
PRAGMA RESTRICT_REFERENCES (GET_EXPOSICAO_GLOBAL,WNDS);
PRAGMA RESTRICT_REFERENCES (GET_N_LIMIT_GLOBAL_GRUPO,WNDS);
PRAGMA RESTRICT_REFERENCES (GET_N_LIMIT_GLOBAL_GRUPO_TOM,WNDS);
PRAGMA RESTRICT_REFERENCES (GET_N_LIMIT_GLOBAL_GRUPO_POT,WNDS);
PRAGMA RESTRICT_REFERENCES (GET_EXPOSICAO_GLOBAL_GRUPO,WNDS);
PRAGMA RESTRICT_REFERENCES (GET_EXPOSICAO_GLOBAL_GRUPO_TOM,WNDS);
PRAGMA RESTRICT_REFERENCES (GET_EXPOSICAO_GLOBAL_GRUPO_POT,WNDS);
PRAGMA RESTRICT_REFERENCES (GET_EXPOSICAO_GLOBAL_GRUPO_R,WNDS);
PRAGMA RESTRICT_REFERENCES (GET_CODPOSTAL_PRT, WNDS);
PRAGMA RESTRICT_REFERENCES (GET_PACKINFO,WNDS);
PRAGMA RESTRICT_REFERENCES (GET_VIGENCIA_GRUPO,WNDS);
PRAGMA RESTRICT_REFERENCES (GET_RATING_GRUPO,WNDS);
PRAGMA RESTRICT_REFERENCES (GET_RATING_ENTIDADE,WNDS);
PRAGMA RESTRICT_REFERENCES (GET_DISTRITO_ENTIDADE,WNDS);
PRAGMA RESTRICT_REFERENCES (GET_IBAN_INFO,WNDS);
PRAGMA RESTRICT_REFERENCES (GET_IBAN_FORMAT,WNDS);
PRAGMA RESTRICT_REFERENCES (GET_CDBIC_INFO,WNDS);

END PKG_ENTIDADES_UTIL;

-- ===== BODY (PACKAGE BODY) =====

PACKAGE BODY "PKG_ENTIDADES_UTIL" AS
/*
-*
-* ULTIMAS ALTERAC?ES AO PACKAGE
-*
-*   DATA       AUTOR           DESCRIC?O
-*   ========== =============== ===================================================
-*   08-02-2006 JOSE VIEGAS     Acrescentado controlo de vers?es do package
-*   29-03-2007 BRIGIDA RAMOS   Inserido GET_VIGENCIA_GRUPO
-*   06-06-2007 BRIGIDA RAMOS   Inserido GET_RATING_GRUPO
-*   06-06-2007 BRIGIDA RAMOS   Inserido GET_RATING_ENTIDADE
-*   19-01-2010 JOSE VIEGAS     INSERIDO GET_CODPOSTAL_PRT
-*   17-03-2010 ALDO TITA       ACRESCENTADO GET_N_LIMIT_GLOBAL/GRUPO GET_EXPOSICAO_GLOBAL/GRUPO
*/

  VERSAO         CONSTANT NUMBER:=011;
  DATA_VERSAO    CONSTANT DATE:= TO_DATE('11-06-2012 18:00','DD-MM-YYYY HH24:MI');
  AUTOR_PACKAGE  CONSTANT VARCHAR2(100):='Eng. Jose Viegas';
  AUTOR_VERSAO   CONSTANT VARCHAR2(100):='JOSE VIEGAS';

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
-* NOME      : GET_VIGENCIA_GRUPO
-* OBJECTIVO : RETORNA AS VIGENCIAS DOS CREDITOS PARA UM GRUPO
-* UTILIZACAO:
-* AUTOR     : BRIGIDA RAMOS
-* DATA      : 29-03-2007
-* VERS?O    : 1.0
-*
-* ULTIMAS ALTERAC?ES
-*
-*   DATA       AUTOR           DESCRIC?O
-*   ========== =============== =================================================
-*
-*/

FUNCTION GET_VIGENCIA_GRUPO    ( PI_GRUPO IN VARCHAR2
		 		,PI_PLAFOND   IN VARCHAR2
				,PI_VIG   IN VARCHAR2
				) RETURN DATE IS

AUX_DT DATE;

BEGIN
	IF PI_PLAFOND='CRE' THEN


	SELECT DECODE (PI_VIG,'FIM',MAX(VIGENCIA.DATAFIN),MIN(VIGENCIA.DATAINI)) INTO AUX_DT
	FROM
	  CO_PLAFOCRE VIGENCIA
	, CO_ENTIREL RELACAO
	WHERE
	VIGENCIA.CDPERSON = RELACAO.CDPERFIL
--	AND SYSDATE BETWEEN VIGENCIA.DATAINI AND VIGENCIA.DATAFIN
	AND RELACAO.SWDOMINA='S'
	AND RELACAO.CDGRUENT = PI_GRUPO;


	ELSE

		SELECT DECODE (PI_VIG,'FIM',MAX(VIGENCIA.DATAFIN),MIN(VIGENCIA.DATAINI) )INTO AUX_DT
		FROM
		  CO_PLAFONCA VIGENCIA
		, CO_ENTIREL RELACAO
		WHERE
		VIGENCIA.CDPERSON = RELACAO.CDPERFIL
--		AND SYSDATE BETWEEN VIGENCIA.DATAINI AND VIGENCIA.DATAFIN
		AND RELACAO.SWDOMINA='S'
		AND RELACAO.CDGRUENT = PI_GRUPO;

         END IF;


RETURN AUX_DT;
EXCEPTION
	WHEN OTHERS THEN
		RETURN NULL;

END GET_VIGENCIA_GRUPO;

/*
-* NOME      : GET_RATING_GRUPO
-* OBJECTIVO : RETORNA O RATING DO GRUPO NUMA DETERMINADA DATA
-* UTILIZACAO:
-* AUTOR     : BRIGIDA RAMOS
-* DATA      : 06-06-2007
-* VERS?O    : 1.0
-*
-* ULTIMAS ALTERAC?ES
-*
-*   DATA       AUTOR           DESCRIC?O
-*   ========== =============== =================================================
-*
-*/

FUNCTION GET_RATING_GRUPO    ( PI_GRUPO IN CO_GRUPENT.CDGRUENT%TYPE
		 	      ,PI_DATA IN DATE
     			      ) RETURN VARCHAR2 IS

AUX_RAT MRATGRUP.CDVALOR%TYPE;
BEGIN

    SELECT
      RG.CDVALOR
    INTO AUX_RAT
    FROM
	  MRATGRUP RG
    WHERE
        1=1
    AND RG.NMORDINA = (
                        SELECT
                          MAX(Y.NMORDINA)
                        FROM
                          MRATGRUP Y
                        WHERE
                            1          = 1
                        AND Y.CDGRUENT = RG.CDGRUENT
			AND Y.FEPROCES <=TRUNC(PI_DATA)
                      )
    AND RG.CDGRUENT = PI_GRUPO ;

    RETURN AUX_RAT;

EXCEPTION
WHEN OTHERS THEN RETURN NULL;


END GET_RATING_GRUPO;

/*
-* NOME      : GET_RATING_ENTIDADE
-* OBJECTIVO : RETORNA O RATING DE UMA ENTIDADE NUMA DETERMINADA DATA
-* UTILIZACAO:
-* AUTOR     : BRIGIDA RAMOS
-* DATA      : 06-06-2007
-* VERS?O    : 1.0
-*
-* ULTIMAS ALTERAC?ES
-*
-*   DATA       AUTOR           DESCRIC?O
-*   ========== =============== =================================================
-*
-*/

FUNCTION GET_RATING_ENTIDADE  ( PI_CDPERSON IN MPERSONA.CDPERSON%TYPE
                              , PI_DATA IN DATE
                              ) RETURN VARCHAR2
IS
  AUX_RAT MPROCMOD.CDVALOR%TYPE;
BEGIN

   SELECT
      Y.CDVALOR
    INTO AUX_RAT
    FROM
      MPROCMOD Y
    WHERE
     1=1
     AND Y.NMORDINA=(SELECT MAX(X.NMORDINA)
	                FROM MPROCMOD X
					WHERE
					X.CDPERSON=Y.CDPERSON
	  				AND X.FEPROCES<=TRUNC(PI_DATA)
					)
	AND Y.CDPERSON = PI_CDPERSON ;

    RETURN AUX_RAT;

EXCEPTION
WHEN OTHERS THEN RETURN NULL;

END GET_RATING_ENTIDADE;

/*
-* NOME      : GET_CODPOSTAL_PRT
-* OBJECTIVO : RETORNA A DESCRIC?O DO CODIGO POSTAL
-* UTILIZACAO:
-* AUTOR     : JOSE VIEGAS
-* DATA      : 19-01-2010
-* VERS?O    : 1.0
-*
-* ULTIMAS ALTERAC?ES
-*
-*   DATA       AUTOR           DESCRIC?O
-*   ========== =============== =================================================
-*
-*/
FUNCTION GET_CODPOSTAL_PRT ( PI_CDCODIPOS IN VARCHAR2) RETURN VARCHAR2
IS
  L_RET VARCHAR2(500);

  L_VALIDA NUMBER;
BEGIN

  L_VALIDA:= PI_CDCODIPOS;

  SELECT
    SUBSTR(CODIGO_POSTAL.CDCODPOS,1,4)||'-'||SUBSTR(CODIGO_POSTAL.CDCODPOS,5,7)||' '||CODIGO_POSTAL.DSCODPOS   CPOSTAL
  INTO
    L_RET
  FROM
    TCODIPOS  CODIGO_POSTAL
  WHERE
      CODIGO_POSTAL.CDPAIS   = 'PRT'
  AND CODIGO_POSTAL.CDCODPOS = PI_CDCODIPOS;

  RETURN L_RET;

EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END GET_CODPOSTAL_PRT;

/*
-* NOME      : GET_N_LIMIT_GLOBAL
-* OBJECTIVO : RETORNA O TOTAL DE REGISTOS ENCONTRADOS EM CO_EH_LIMITS_F2 PARA A ENTIDADE
-* UTILIZACAO:
-* AUTOR     : ALDO TITA
-* DATA      : 17-03-2010
-* VERS?O    : 1.0
-*
-* ULTIMAS ALTERAC?ES
-*
-*   DATA       AUTOR           DESCRIC?O
-*   ========== =============== =================================================
-*
-*/
FUNCTION GET_N_LIMIT_GLOBAL ( P_CDPERSON IN NUMBER) RETURN NUMBER
IS
  L_RET NUMBER;

BEGIN

  SELECT  count(*)
  INTO L_RET
  FROM CO_EH_LIMITS_F2
  WHERE CDPERSON = P_CDPERSON;

  RETURN L_RET;

EXCEPTION
  WHEN OTHERS THEN
    RETURN 0;
END GET_N_LIMIT_GLOBAL;

/*
-* NOME      : GET_N_LIMIT_GLOBAL
-* OBJECTIVO : RETORNA O TOTAL DE REGISTOS ENCONTRADOS EM CO_EH_LIMITS_F2 PARA A ENTIDADE
-* UTILIZACAO:
-* AUTOR     : ALDO TITA
-* DATA      : 17-03-2010
-* VERS?O    : 1.0
-*
-* ULTIMAS ALTERAC?ES
-*
-*   DATA       AUTOR           DESCRIC?O
-*   ========== =============== =================================================
-*
-*/
FUNCTION GET_N_LIMIT_GLOBAL_DEP ( P_CDIDEPER IN VARCHAR2) RETURN NUMBER
IS
  L_RET NUMBER;

BEGIN


  SELECT
     COUNT(*)
  INTO
     L_RET
  FROM
     CO_LIMEXT
  WHERE  1=1
     AND CDIDEPER = P_CDIDEPER
     AND SWESTADO='M'
     AND TO_DATE(FEVIGENC,'YYYY-MM-DD') <= SYSDATE
     AND (
         SYSDATE < NVL(TO_DATE(FEFINVIG,'YYYY-MM-DD'),SYSDATE+1)
        OR
         SYSDATE < NVL(TO_DATE(TEMP_INC_EXPY_D,'YYYY-MM-DD'),SYSDATE+1)
     );


  RETURN L_RET;

EXCEPTION
  WHEN OTHERS THEN
    RETURN 0;
END GET_N_LIMIT_GLOBAL_DEP;

/*
-* NOME      : GET_EXPOSICAO_GLOBAL
-* OBJECTIVO : Soma de PTLIMIT de CO_EH_LIMITS_F2 para todos os registos encontrados para a entidade.
-* UTILIZACAO:
-* AUTOR     : ALDO TITA
-* DATA      : 17-03-2010
-* VERS?O    : 1.0
-*
-* ULTIMAS ALTERAC?ES
-*
-*   DATA       AUTOR           DESCRIC?O
-*   ========== =============== =================================================
-*
-*/
FUNCTION GET_EXPOSICAO_GLOBAL ( P_CDPERSON IN NUMBER) RETURN NUMBER
IS
  L_RET NUMBER;

BEGIN

  SELECT  SUM (nvl(ptlimit * pkg_formulas_cosec.fun_taxa_cambio (cdmoneda, 'EUR'),0))
  INTO L_RET
  FROM CO_EH_LIMITS_F2
  WHERE CDPERSON = P_CDPERSON;

  RETURN L_RET;

EXCEPTION
  WHEN OTHERS THEN
    RETURN 0;
END GET_EXPOSICAO_GLOBAL;

/*
-* NOME      : GET_EXPOSICAO_GLOBAL
-* OBJECTIVO : Soma de PTLIMIT de CO_EH_LIMITS_F2 para todos os registos encontrados para a entidade.
-* UTILIZACAO:
-* AUTOR     : ALDO TITA
-* DATA      : 17-03-2010
-* VERS?O    : 1.0
-*
-* ULTIMAS ALTERAC?ES
-*
-*   DATA       AUTOR           DESCRIC?O
-*   ========== =============== =================================================
-*   11-06-2012 jose viegas     correcc?o da forma de calculo da func?o.
-*/
FUNCTION GET_EXPOSICAO_GLOBAL_DEP ( P_CDIDEPER IN VARCHAR2) RETURN NUMBER
IS
  L_RET NUMBER;

BEGIN

  SELECT
    SUM(VALOR)
  INTO
    L_RET
  FROM
  (
    select
      NVL(SUM(IMPCONCO),0) VALOR
    FROM co_limext
    WHERE  1=1
    AND CDIDEPER = P_CDIDEPER
    AND SWESTADO='M'
    AND NVL(TO_DATE(FEFINVIG,'YYYY-MM-DD'),SYSDATE+1) >= SYSDATE
    UNION ALL
    select
      NVL(SUM(TEMP_INC_M),0) VALOR
    FROM co_limext
    WHERE  1=1
    AND CDIDEPER = P_CDIDEPER
    AND NVL(TO_DATE(temp_inc_expy_d,'YYYY-MM-DD'),SYSDATE+1) >= SYSDATE
    AND TO_DATE(temp_inc_REFER_d,'YYYY-MM-DD') <= SYSDATE
  );

  RETURN L_RET;

EXCEPTION
  WHEN OTHERS THEN
    RETURN 0;
END GET_EXPOSICAO_GLOBAL_DEP;

/*
-* NOME      : GET_N_LIMIT_GLOBAL_GRUPO
-* OBJECTIVO : RETORNA O TOTAL DE REGISTOS ENCONTRADOS EM CO_EH_LIMITS_F2 PARA grupo de ENTIDADE
-* UTILIZACAO:
-* AUTOR     : ALDO TITA
-* DATA      : 17-03-2010
-* VERS?O    : 1.0
-*
-* ULTIMAS ALTERAC?ES
-*
-*   DATA       AUTOR           DESCRIC?O
-*   ========== =============== =================================================
-*
-*/
FUNCTION GET_N_LIMIT_GLOBAL_GRUPO ( P_CDGRUPO IN VARCHAR2) RETURN NUMBER
IS
  L_RET NUMBER;

BEGIN

  /* select Count(*)
    INTO L_RET
    from co_entirel rel_entidade,
         co_eh_limits_f2 risco
    where risco.cdperson = rel_entidade.cdperfil
        AND CDGRUENT = P_CDGRUPO; */

   SELECT
     Count(*)
  INTO
     L_RET
  FROM
     co_entirel rel_entidade,
     CO_LIMEXT exposicao,
     mpersona persona
  WHERE  1=1
     and rel_entidade.CDGRUENT = P_CDGRUPO
     and rel_entidade.cdperfil = persona.cdperson
     and persona.CDIDEPER = exposicao.CDIDEPER
     AND exposicao.SWESTADO='M'
     AND TO_DATE(FEVIGENC,'YYYY-MM-DD') <= SYSDATE
     AND (
         SYSDATE < NVL(TO_DATE(FEFINVIG,'YYYY-MM-DD'),SYSDATE+1)
        OR
         SYSDATE < NVL(TO_DATE(TEMP_INC_EXPY_D,'YYYY-MM-DD'),SYSDATE+1)
     );


  RETURN L_RET;

EXCEPTION
  WHEN OTHERS THEN
    RETURN 0;

END GET_N_LIMIT_GLOBAL_GRUPO;

/*
-* NOME      : GET_N_LIMIT_GLOBAL_GRUPO_TOM
-* OBJECTIVO :
-* UTILIZACAO:
-* AUTOR     : ALDO TITA
-* DATA      : 10-05-2012
-* VERS?O    : 1.0
-*
-* ULTIMAS ALTERAC?ES
-*
-*   DATA       AUTOR           DESCRIC?O
-*   ========== =============== =================================================
-*
-*/
FUNCTION GET_N_LIMIT_GLOBAL_GRUPO_TOM ( P_CDGRUPO IN VARCHAR2) RETURN NUMBER
IS
  L_RET NUMBER;

BEGIN

   SELECT
     Count(*)
  INTO
     L_RET
  FROM
     co_entirel rel_entidade,
     CO_LIMEXT exposicao,
     mpersona persona
  WHERE  1=1
     and rel_entidade.CDGRUENT = P_CDGRUPO
     and rel_entidade.cdperfil = persona.cdperson
     and persona.CDIDEPER = exposicao.CDIDEPER
     AND exposicao.SWESTADO='M'
     and exposicao.contr_state_c != 'DRA'
     AND TO_DATE(FEVIGENC,'YYYY-MM-DD') <= SYSDATE
     AND (
         SYSDATE < NVL(TO_DATE(FEFINVIG,'YYYY-MM-DD'),SYSDATE+1)
        OR
         SYSDATE < NVL(TO_DATE(TEMP_INC_EXPY_D,'YYYY-MM-DD'),SYSDATE+1)
     );


  RETURN L_RET;

EXCEPTION
  WHEN OTHERS THEN
    RETURN 0;

END GET_N_LIMIT_GLOBAL_GRUPO_TOM;

/*
-* NOME      : GET_N_LIMIT_GLOBAL_GRUPO_POT
-* OBJECTIVO :
-* UTILIZACAO:
-* AUTOR     : ALDO TITA
-* DATA      : 10-05-2012
-* VERS?O    : 1.0
-*
-* ULTIMAS ALTERAC?ES
-*
-*   DATA       AUTOR           DESCRIC?O
-*   ========== =============== =================================================
-*
-*/
FUNCTION GET_N_LIMIT_GLOBAL_GRUPO_POT ( P_CDGRUPO IN VARCHAR2) RETURN NUMBER
IS
  L_RET NUMBER;

BEGIN

   SELECT
     Count(*)
  INTO
     L_RET
  FROM
     co_entirel rel_entidade,
     CO_LIMEXT exposicao,
     mpersona persona
  WHERE  1=1
     and rel_entidade.CDGRUENT = P_CDGRUPO
     and rel_entidade.cdperfil = persona.cdperson
     and persona.CDIDEPER = exposicao.CDIDEPER
     AND exposicao.SWESTADO='M'
     and exposicao.contr_state_c ='DRA'
     AND TO_DATE(FEVIGENC,'YYYY-MM-DD') <= SYSDATE
     AND (
         SYSDATE < NVL(TO_DATE(FEFINVIG,'YYYY-MM-DD'),SYSDATE+1)
        OR
         SYSDATE < NVL(TO_DATE(TEMP_INC_EXPY_D,'YYYY-MM-DD'),SYSDATE+1)
     );


  RETURN L_RET;

EXCEPTION
  WHEN OTHERS THEN
    RETURN 0;

END GET_N_LIMIT_GLOBAL_GRUPO_POT;
/*
-* NOME      : GET_EXPOSICAO_GLOBAL_GRUPO
-* OBJECTIVO : Soma de PTLIMIT de CO_EH_LIMITS_F2 para todos os registos encontrados para grupo de entidade.
-* UTILIZACAO:
-* AUTOR     : ALDO TITA
-* DATA      : 17-03-2010
-* VERS?O    : 1.0
-*
-* ULTIMAS ALTERAC?ES
-*
-*   DATA       AUTOR           DESCRIC?O
-*   ========== =============== =================================================
-*   20140220   Mario de Almeida  Acrescentar o rel_entidade.SWDOMINA = 'S' (Incidencia E1852)
-*   20140224	Mario de Almeida  Correc?o da Forma de Calculo da Func?o
-*/
FUNCTION GET_EXPOSICAO_GLOBAL_GRUPO ( P_CDGRUPO IN VARCHAR2) RETURN NUMBER
IS
  L_SUM_IMPCONCO NUMBER;
  L_SUM_TEMPINCM NUMBER;

BEGIN

  SELECT
      SUM (nvl(exposicao.IMPCONCO,0))
  INTO
     L_SUM_IMPCONCO
  FROM
     co_entirel rel_entidade,
     CO_LIMEXT exposicao,
     mpersona persona
  WHERE  1=1
     and rel_entidade.CDGRUENT = P_CDGRUPO
     and rel_entidade.SWDOMINA = 'S'
     and rel_entidade.cdperfil = persona.cdperson
     and persona.CDIDEPER = exposicao.CDIDEPER
     AND exposicao.SWESTADO='M'
     AND TO_DATE(FEVIGENC,'YYYY-MM-DD') <= SYSDATE
     AND SYSDATE < NVL(TO_DATE(FEFINVIG,'YYYY-MM-DD'),SYSDATE+1);

  SELECT
      SUM (nvl(exposicao.TEMP_INC_M,0))
  INTO
     L_SUM_TEMPINCM
  FROM
     co_entirel rel_entidade,
     CO_LIMEXT exposicao,
     mpersona persona
  WHERE  1=1
     and rel_entidade.CDGRUENT = P_CDGRUPO
     and rel_entidade.SWDOMINA = 'S'
     and rel_entidade.cdperfil = persona.cdperson
     and persona.CDIDEPER = exposicao.CDIDEPER
     AND exposicao.SWESTADO='M'
     AND TO_DATE(FEVIGENC,'YYYY-MM-DD') <= SYSDATE
     AND SYSDATE < NVL(TO_DATE(TEMP_INC_EXPY_D,'YYYY-MM-DD'),SYSDATE+1);

   RETURN L_SUM_IMPCONCO + L_SUM_TEMPINCM;

EXCEPTION
  WHEN OTHERS THEN
    RETURN 0;
END GET_EXPOSICAO_GLOBAL_GRUPO;

/*
-* NOME      : GET_EXPOSICAO_GLOBAL_GRUPO_TOM
-* OBJECTIVO :
-* UTILIZACAO:
-* AUTOR     : ALDO TITA
-* DATA      : 10-05-2012
-* VERS?O    : 1.0
-*
-* ULTIMAS ALTERAC?ES
-*
-*   DATA       AUTOR           DESCRIC?O
-*   ========== =============== =================================================
-*   20140220   Mario de Almeida  Acrescentar o rel_entidade.SWDOMINA = 'S' (Incidencia E1852)
-*   20140224	Mario de Almeida  Correc?o da Forma de Calculo da Func?o
-*/
FUNCTION GET_EXPOSICAO_GLOBAL_GRUPO_TOM ( P_CDGRUPO IN VARCHAR2) RETURN NUMBER
IS
  L_SUM_IMPCONCO NUMBER;
  L_SUM_TEMPINCM NUMBER;

BEGIN

  SELECT
      SUM (nvl(exposicao.IMPCONCO,0))
  INTO
     L_SUM_IMPCONCO
  FROM
     co_entirel rel_entidade,
     CO_LIMEXT exposicao,
     mpersona persona
  WHERE  1=1
     and rel_entidade.CDGRUENT = P_CDGRUPO
	 AND rel_entidade.SWDOMINA = 'S'
     and rel_entidade.cdperfil = persona.cdperson
     and persona.CDIDEPER = exposicao.CDIDEPER
     AND exposicao.SWESTADO='M'
     AND exposicao.contr_state_c != 'DRA'
     AND TO_DATE(FEVIGENC,'YYYY-MM-DD') <= SYSDATE
     AND SYSDATE < NVL(TO_DATE(FEFINVIG,'YYYY-MM-DD'),SYSDATE+1);

 SELECT
      SUM (nvl(exposicao.TEMP_INC_M,0))
  INTO
     L_SUM_TEMPINCM
  FROM
     co_entirel rel_entidade,
     CO_LIMEXT exposicao,
     mpersona persona
  WHERE  1=1
     and rel_entidade.CDGRUENT = P_CDGRUPO
	 AND rel_entidade.SWDOMINA = 'S'
     and rel_entidade.cdperfil = persona.cdperson
     and persona.CDIDEPER = exposicao.CDIDEPER
     AND exposicao.SWESTADO='M'
     AND exposicao.contr_state_c != 'DRA'
     AND TO_DATE(FEVIGENC,'YYYY-MM-DD') <= SYSDATE
     AND SYSDATE < NVL(TO_DATE(TEMP_INC_EXPY_D,'YYYY-MM-DD'),SYSDATE+1);

  RETURN L_SUM_IMPCONCO + L_SUM_TEMPINCM;

EXCEPTION
  WHEN OTHERS THEN
    RETURN 0;
END GET_EXPOSICAO_GLOBAL_GRUPO_TOM;

/*
-* NOME      : GET_EXPOSICAO_GLOBAL_GRUPO_POT
-* OBJECTIVO :
-* UTILIZACAO:
-* AUTOR     : ALDO TITA
-* DATA      : 10-05-2012
-* VERS?O    : 1.0
-*
-* ULTIMAS ALTERAC?ES
-*
-*   DATA       AUTOR           DESCRIC?O
-*   ========== =============== =================================================
-*   20140220   Mario de Almeida  Acrescentar o rel_entidade.SWDOMINA = 'S' (Incidencia E1852)
-*   20140224	Mario de Almeida  Correc?o da Forma de Calculo da Func?o
-*/
FUNCTION GET_EXPOSICAO_GLOBAL_GRUPO_POT ( P_CDGRUPO IN VARCHAR2) RETURN NUMBER
IS
   L_SUM_IMPCONCO NUMBER;
  L_SUM_TEMPINCM NUMBER;

BEGIN

  SELECT
      SUM (nvl(exposicao.IMPCONCO,0))
  INTO
     L_SUM_IMPCONCO
  FROM
     co_entirel rel_entidade,
     CO_LIMEXT exposicao,
     mpersona persona
  WHERE  1=1
     and rel_entidade.CDGRUENT = P_CDGRUPO
	 AND rel_entidade.SWDOMINA = 'S'
     and rel_entidade.cdperfil = persona.cdperson
     and persona.CDIDEPER = exposicao.CDIDEPER
     AND exposicao.SWESTADO='M'
     AND exposicao.contr_state_c = 'DRA'
     AND TO_DATE(FEVIGENC,'YYYY-MM-DD') <= SYSDATE
     AND SYSDATE < NVL(TO_DATE(FEFINVIG,'YYYY-MM-DD'),SYSDATE+1);

  SELECT
      SUM (nvl(exposicao.TEMP_INC_M,0))
  INTO
     L_SUM_TEMPINCM
  FROM
     co_entirel rel_entidade,
     CO_LIMEXT exposicao,
     mpersona persona
  WHERE  1=1
     and rel_entidade.CDGRUENT = P_CDGRUPO
	 AND rel_entidade.SWDOMINA = 'S'
     and rel_entidade.cdperfil = persona.cdperson
     and persona.CDIDEPER = exposicao.CDIDEPER
     AND exposicao.SWESTADO='M'
     AND exposicao.contr_state_c = 'DRA'
     AND TO_DATE(FEVIGENC,'YYYY-MM-DD') <= SYSDATE
     AND SYSDATE < NVL(TO_DATE(TEMP_INC_EXPY_D,'YYYY-MM-DD'),SYSDATE+1);


  RETURN L_SUM_IMPCONCO + L_SUM_TEMPINCM;

EXCEPTION
  WHEN OTHERS THEN
    RETURN 0;
END GET_EXPOSICAO_GLOBAL_GRUPO_POT;
/*
-* NOME      : GET_EXPOSICAO_GLOBAL_GRUPO_REAL
-* OBJECTIVO : Soma de IMPCONCO de CO_LIMEXT para todos os registos encontrados para grupo de entidade.
-* UTILIZACAO:
-* AUTOR     : ALDO TITA
-* DATA      : 17-03-2010
-* VERS?O    : 1.0
-*
-* ULTIMAS ALTERAC?ES
-*
-*   DATA       AUTOR           DESCRIC?O
-*   ========== =============== =================================================
-*/
FUNCTION GET_EXPOSICAO_GLOBAL_GRUPO_R ( P_CDGRUPO IN VARCHAR2) RETURN NUMBER
IS
   L_SUM_IMPCONCO NUMBER;
   L_SUM_TEMPINCM NUMBER;

BEGIN

  SELECT
      SUM (nvl(exposicao.IMPCONCO,0)* PKG_FORMULAS_COSEC.FUN_COEFI_REAL(CDPERFIL, CDGRUENT, CDPERPAI))
  INTO
     L_SUM_IMPCONCO
  FROM
     co_entirel rel_entidade,
     CO_LIMEXT exposicao,
     mpersona persona
  WHERE  1=1
     and rel_entidade.CDGRUENT = P_CDGRUPO
     and rel_entidade.cdperfil = persona.cdperson
     and persona.CDIDEPER = exposicao.CDIDEPER
     AND exposicao.SWESTADO='M'
     AND TO_DATE(FEVIGENC,'YYYY-MM-DD') <= SYSDATE
     AND SYSDATE < NVL(TO_DATE(FEFINVIG,'YYYY-MM-DD'),SYSDATE+1);

      SELECT
      SUM (nvl(exposicao.TEMP_INC_M,0)* PKG_FORMULAS_COSEC.FUN_COEFI_REAL(CDPERFIL, CDGRUENT, CDPERPAI))
  INTO
     L_SUM_TEMPINCM
  FROM
     co_entirel rel_entidade,
     CO_LIMEXT exposicao,
     mpersona persona
  WHERE  1=1
     and rel_entidade.CDGRUENT = P_CDGRUPO
     and rel_entidade.cdperfil = persona.cdperson
     and persona.CDIDEPER = exposicao.CDIDEPER
     AND exposicao.SWESTADO='M'
     AND TO_DATE(FEVIGENC,'YYYY-MM-DD') <= SYSDATE
     AND SYSDATE < NVL(TO_DATE(TEMP_INC_EXPY_D,'YYYY-MM-DD'),SYSDATE+1);


  RETURN L_SUM_IMPCONCO + L_SUM_TEMPINCM;

EXCEPTION
  WHEN OTHERS THEN
    RETURN 0;
END GET_EXPOSICAO_GLOBAL_GRUPO_R;

/*
-* NOME      : GET_CDDECISOR_CAUCAO
-* OBJECTIVO : RETORNA O CODIGO DE DECISOR DO PLAFOND DE CAUCAO
-* UTILIZACAO:
-* AUTOR     : JOSE VIEGAS
-* DATA      : 23-06-2010
-* VERS?O    : 1.0
-*
-* ULTIMAS ALTERAC?ES
-*
-*   DATA       AUTOR           DESCRIC?O
-*   ========== =============== =================================================
-*
-*/

FUNCTION GET_CDDECISOR_CAUCAO ( PI_CDPERSON IN CO_PLAFONCA.CDPERSON%TYPE
     			              ) RETURN VARCHAR2
IS
  CRET  CO_PLAFONCA.CDDECISO%TYPE;
BEGIN

  SELECT
    plaf_cau.cddeciso
  INTO
	CRET
  FROM
    co_plafonca plaf_cau
  WHERE
      plaf_cau.cdperson= PI_CDPERSON
  AND plaf_cau.dataini =(
                          SELECT
                            MAX(x.dataini)
                          FROM
                            co_plafonca x
                          WHERE
                            x.cdperson=plaf_cau.cdperson
                        );

  RETURN CRET;

EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END GET_CDDECISOR_CAUCAO;

/*
-* NOME      : GET_CDDECISOR_CREDITO
-* OBJECTIVO : RETORNA O CODIGO DE DECISOR DO PLAFOND DE CREDITO
-* UTILIZACAO:
-* AUTOR     : JOSE VIEGAS
-* DATA      : 23-06-2010
-* VERS?O    : 1.0
-*
-* ULTIMAS ALTERAC?ES
-*
-*   DATA       AUTOR           DESCRIC?O
-*   ========== =============== =================================================
-*
-*/

FUNCTION GET_CDDECISOR_CREDITO ( PI_CDPERSON IN CO_PLAFOCRE.CDPERSON%TYPE
                               ) RETURN VARCHAR2
IS
  CRET CO_PLAFOCRE.CDDECISO%TYPE;
BEGIN

  SELECT
    plaf_cre.cddeciso
  INTO
    CRET
  FROM
    co_plafocre plaf_cre
  WHERE
      plaf_cre.cdperson= PI_CDPERSON
  AND plaf_cre.dataini=(
                         SELECT
                           MAX(x.dataini)
                         FROM
                           co_plafocre x
                         WHERE
                           x.cdperson=plaf_cre.cdperson
                        )
  AND PLAF_CRE.NMPLAFON= (
                           SELECT
                             MAX(X.NMPLAFON)   		/* */
                           FROM
                             CO_PLAFOCRE X     			/* */
                           WHERE                 			/* */
                               X.CDPERSON=PLAF_CRE.CDPERSON 	/* */
                           AND X.DATAINI=PLAF_CRE.DATAINI 	/* */
                         );							    /* */

  RETURN CRET;

EXCEPTION
  WHEN OTHERS THEN
     RETURN NULL;
END GET_CDDECISOR_CREDITO;

/*
-* NOME      : GET_DISTRITO_ENTIDADE
-* OBJECTIVO : RETORNA O DISTRITO DA ENTIDADE
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
FUNCTION GET_DISTRITO_ENTIDADE (PI_CDPERSON IN VARCHAR2) RETURN VARCHAR2
IS
  L_RET VARCHAR2(30);

BEGIN

  SELECT
    DISTRITO.DSPROVIN
  INTO
    L_RET
  FROM
    TPROVIN   DISTRITO
   ,MDOMICIL  MORADA
  WHERE 1=1
    AND DISTRITO.CDPROVIN(+)=MORADA.CDPROVIN
    AND DISTRITO.CDPAIS(+)=MORADA.CDPAIS
    AND MORADA.CDTIPDOM='01'
    AND MORADA.CDPERSON=PI_CDPERSON
    AND MORADA.NMORDDOM=( SELECT MAX(X.NMORDDOM)
                          FROM MDOMICIL X
                          WHERE X.CDTIPDOM=MORADA.CDTIPDOM
                          AND   X.CDPERSON=MORADA.CDPERSON
                        );
  RETURN L_RET;

EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END GET_DISTRITO_ENTIDADE;

FUNCTION GET_PEDIDO_INFO ( PI_CDPERSON IN VARCHAR2, PI_COLUMN_NAME IN VARCHAR2) RETURN VARCHAR2 IS
nvalor VARCHAR2(100);
vsql varchar2(1500);
BEGIN

  vsql:= 'SELECT '||PI_COLUMN_NAME||' FROM CO_PEDIDOS PEDIDO WHERE CDPERSON= '||PI_CDPERSON||' AND FEPEDIDO = (SELECT MAX(MAX_PEDIDO.fepedido) FROM CO_PEDIDOS MAX_PEDIDO WHERE 1=1AND MAX_PEDIDO.CDPERSON= PEDIDO.CDPERSON)';

  EXECUTE IMMEDIATE VSQL INTO NVALOR;

  RETURN NVALOR;

EXCEPTION
  WHEN OTHERS THEN
     RETURN null;

END GET_PEDIDO_INFO;

FUNCTION GET_PEDIDO_INFO_DT ( PI_CDPERSON IN VARCHAR2, PI_COLUMN_NAME IN VARCHAR2) RETURN DATE IS
nvalor DATE;
vsql varchar2(1500);
BEGIN

  vsql:= 'SELECT '||PI_COLUMN_NAME||' FROM CO_PEDIDOS PEDIDO WHERE CDPERSON= '||PI_CDPERSON||' AND FEPEDIDO = (SELECT MAX(MAX_PEDIDO.fepedido) FROM CO_PEDIDOS MAX_PEDIDO WHERE 1=1AND MAX_PEDIDO.CDPERSON= PEDIDO.CDPERSON)';

  EXECUTE IMMEDIATE VSQL INTO NVALOR;

  RETURN NVALOR;

EXCEPTION
  WHEN OTHERS THEN
     RETURN null;

END GET_PEDIDO_INFO_DT;


/*
-* NOME      : GET_IBAN_INFO
-* OBJECTIVO : RETORNA O IBAN VÀLIDO DA ENTIDADE
-* UTILIZACAO:
-* AUTOR     : João Ribeiro
-* DATA      : 07-06-2024
-* VERS?O    : 1.0
-*
-* ULTIMAS ALTERAC?ES
-*
-*   DATA       AUTOR           DESCRIC?O
-*   ========== =============== =================================================
-*
-*/
FUNCTION GET_IBAN_INFO ( PI_CDPERSON IN NUMBER) RETURN VARCHAR2
IS
  IBAN_BENEFICIARIO VARCHAR2(255);

BEGIN

  SELECT Beneficiario.IBAN IBAN_Beneficiario
	INTO IBAN_BENEFICIARIO
	FROM (
		SELECT Beneficiario.IBAN
			,cdperson
			,feemision
			,nmordcta
			,ROW_NUMBER() OVER (
				PARTITION BY cdperson ORDER BY feemision DESC
					,nmordcta DESC
				) posicao
		FROM M_CTABANCO Beneficiario
		WHERE 1 = 1
			AND Beneficiario.CDPERSON = PI_CDPERSON
			AND Beneficiario.SWACTIVA = 'S'
		) Beneficiario
	WHERE 1 = 1
		AND posicao = 1;

  RETURN TRIM(IBAN_BENEFICIARIO);

EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END GET_IBAN_INFO;

/*
-* NOME      : GET_IBAN_FORMAT
-* OBJECTIVO : RETORNA O IBAN VÀLIDO FORMATADO DA ENTIDADE
-* UTILIZACAO:
-* AUTOR     : João Ribeiro
-* DATA      : 07-06-2024
-* VERS?O    : 1.0
-*
-* ULTIMAS ALTERAC?ES
-*
-*   DATA       AUTOR           DESCRIC?O
-*   ========== =============== =================================================
-*
-*/
FUNCTION GET_IBAN_FORMAT ( PI_CDPERSON IN NUMBER) RETURN VARCHAR2
IS
  IBAN_BENEFICIARIO VARCHAR2(255);

BEGIN

  SELECT (substr(Beneficiario.IBAN, 0, 4) || ' ' || substr(Beneficiario.IBAN, 5, 4) || ' ' || substr(Beneficiario.IBAN, 9, 4)
		|| ' ' || substr(Beneficiario.IBAN, 13, 4) || ' ' || substr(Beneficiario.IBAN, 17, 4) || ' ' || substr(Beneficiario.IBAN, 21, 4)
		|| ' ' || substr(Beneficiario.IBAN, 25, 4) || ' ' || substr(Beneficiario.IBAN, 29, 4) || ' ' || substr(Beneficiario.IBAN, 33, 2)) IBAN_Beneficiario
	INTO IBAN_BENEFICIARIO
	FROM (
		SELECT Beneficiario.IBAN
			,cdperson
			,feemision
			,nmordcta
			,ROW_NUMBER() OVER (
				PARTITION BY cdperson ORDER BY feemision DESC
					,nmordcta DESC
				) posicao
		FROM M_CTABANCO Beneficiario
		WHERE 1 = 1
			AND Beneficiario.CDPERSON = PI_CDPERSON
			AND Beneficiario.SWACTIVA = 'S'
		) Beneficiario
	WHERE 1 = 1
		AND posicao = 1;

  RETURN TRIM(IBAN_BENEFICIARIO);

EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END GET_IBAN_FORMAT;

/*
-* NOME      : GET_CDBIC_INFO
-* OBJECTIVO : RETORNA O CDBIC VÀLIDO DA ENTIDADE
-* UTILIZACAO:
-* AUTOR     : João Ribeiro
-* DATA      : 07-06-2024
-* VERS?O    : 1.0
-*
-* ULTIMAS ALTERAC?ES
-*
-*   DATA       AUTOR           DESCRIC?O
-*   ========== =============== =================================================
-*
-*/
FUNCTION GET_CDBIC_INFO ( PI_CDPERSON IN NUMBER) RETURN VARCHAR2
IS
  BIC_BENEFICIARIO VARCHAR2(255);

BEGIN

  SELECT Beneficiario.CDBIC
  INTO BIC_BENEFICIARIO
  FROM (
		SELECT Beneficiario.CDBIC
			,cdperson
			,feemision
			,nmordcta
			,ROW_NUMBER() OVER (
				PARTITION BY cdperson ORDER BY feemision DESC
					,nmordcta DESC
				) posicao
		FROM M_CTABANCO Beneficiario
		WHERE 1 = 1
			AND Beneficiario.CDPERSON = PI_CDPERSON
			AND Beneficiario.SWACTIVA = 'S'
		) Beneficiario
  WHERE 1 = 1
	AND posicao = 1;

  RETURN TRIM(BIC_BENEFICIARIO);

EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END GET_CDBIC_INFO;

END;

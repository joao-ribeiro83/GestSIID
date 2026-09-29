-- PKG_PPNA (owner: SIID_TESTES)


-- ===== SPEC (PACKAGE) =====

PACKAGE Pkg_Ppna
AS
    FUNCTION LOAD_MESES(P_ANOS IN NUMBER DEFAULT 50) RETURN NUMBER;
    FUNCTION LOAD_ANOS RETURN NUMBER;
    FUNCTION LOAD_RECIBOS(P_MES IN DATE DEFAULT NULL) RETURN NUMBER;
    FUNCTION UPDATE_RECIBOS(P_MES IN DATE DEFAULT NULL) RETURN NUMBER;
    FUNCTION CALCULA_PPNA(P_MES IN DATE DEFAULT SYSDATE) RETURN NUMBER;
    FUNCTION UPDT_RECIBOS RETURN NUMBER;
    FUNCTION UPDT_PPNA RETURN NUMBER;
END Pkg_Ppna;


-- ===== BODY (PACKAGE BODY) =====

PACKAGE BODY Pkg_Ppna AS
    FUNCTION UPDT_RECIBOS RETURN NUMBER
    IS
    BEGIN
      UPDATE
        GD_RECIBOS_PPNA RECIBO
      SET
        DT_PRIMEIRAFRAC = (
                            SELECT
                              MIN(MES_FRACCAO)
                            FROM
                              GD_FRACCIONAMENTO_PPNA X
                            WHERE
                                X.CDUNIECO = RECIBO.CDUNIECO
                            AND X.NMRECIBO = RECIBO.NMRECIBO
                          )
      , DT_ULTIMAFRAC   = (
                            SELECT
                              MAX(MES_FRACCAO)
                            FROM
                              GD_FRACCIONAMENTO_PPNA X
                            WHERE
                                X.CDUNIECO = RECIBO.CDUNIECO
                            AND X.NMRECIBO = RECIBO.NMRECIBO
                          )
      WHERE
         DT_PRIMEIRAFRAC IS NULL;
      UPDATE
        GD_RECIBOS_PPNA RECIBO
      SET ESTADOREC_ID = (
                           SELECT
                             CDESTADO
                           FROM
                             MRECIBO X
                           WHERE
                               X.CDUNIECO = RECIBO.CDUNIECO
                           AND X.NMRECIBO = RECIBO.NMRECIBO
                         )
      WHERE
        NOT EXISTS (
                     SELECT
                       1
                     FROM
                       MRECIBO Y
                     WHERE
                         Y.CDESTADO = RECIBO.ESTADOREC_ID
                     AND Y.NMRECIBO = RECIBO.NMRECIBO
                     AND Y.CDUNIECO = RECIBO.CDUNIECO
                   );
      COMMIT;
      RETURN 1;
    EXCEPTION
      WHEN OTHERS THEN
        RETURN -1;
    END UPDT_RECIBOS;

    FUNCTION LOAD_MESES(P_ANOS IN NUMBER DEFAULT 50) RETURN NUMBER
    IS
      dMES_TEMP      DATE := TO_DATE('01-01-1986','DD-MM-RRRR');
      NPROCESSADO    NUMBER:=0;
      NLIMITE        NUMBER;
    BEGIN
      NLIMITE := (15 + P_ANOS)*12;
      DELETE GD_MESES_PPNA;
      FOR I IN 1..NLIMITE LOOP
        INSERT INTO
	  GD_MESES_PPNA
	VALUES
	  (
	    DMES_TEMP
	  , TO_CHAR(DMES_TEMP,'RRRR')
	  , TO_CHAR(DMES_TEMP,'MONTH')
	  , NULL
	  );
	DMES_TEMP:= ADD_MONTHS(DMES_TEMP, 1);
      END LOOP;
      RETURN NPROCESSADO;
    EXCEPTION
      WHEN OTHERS THEN
        ROLLBACK;
        RETURN -1;
    END LOAD_MESES;


    FUNCTION LOAD_ANOS RETURN NUMBER
    IS
    BEGIN
      DELETE GD_ANOS_PPNA;
      INSERT INTO
        GD_ANOS_PPNA
      (
        ANO
      , TIPO
      )
      SELECT DISTINCT
        ANO
      ,'MENSALIDADES'
      FROM
        GD_MESES_PPNA;
      INSERT INTO
        GD_ANOS_PPNA
      (
        ANO
      , TIPO
      )
      SELECT DISTINCT
        ANO
      ,'FRACCIONAMENTO'
      FROM
        GD_MESES_PPNA;
      RETURN 1;
    EXCEPTION
      WHEN OTHERS THEN
        ROLLBACK;
        RETURN -1;
    END LOAD_ANOS;


    FUNCTION LOAD_RECIBOS(P_MES IN DATE DEFAULT NULL) RETURN NUMBER
    IS
      CURSOR curPPNA_REC IS
        SELECT /*+ FIRST_ROWS */
          RECIBO.cdunieco
        , RECIBO.nmrecibo
        , RECIBO.cdramo
        , RECIBO.estado
        , RECIBO.nmpoliza
		, APOLICE.FEEMISIO	  	   				DT_EMISSAO_APOL
        , APOLICE.feefecto  					DT_INI_VIGAPOL
        , DECODE(APOLICE.ottempot,'R', APOLICE.feproren
                                 , APOLICE.fevencim) 		DT_FIM_VIGAPOL
        , APOLICE.cdtipcoa					COSEGURO_ID
        , APOLICE.ottempot					TIPO_APOLICE_ID
        , Pkg_Formulas_Cosec.GET_MERCADO(APOLICE.NMPOLIZA,APOLICE.CDRAMO,APOLICE.CDUNIECO,'M',NVL(P_MES,SYSDATE)) MERCADO_ID
        , APOLICE.cdperpag					PAGAPOL_ID
        , RECIBO.tiporeci
        , RECIBO.nmrecinue
        , TOMADORAPOL.cdperson					TOMADOR_ID
        , RECIBO.cdagrupa
        , AgrupadorRecibo.cdperson				AGRUPADOR_ID
        , AGRUPADORRECIBO.NMORDDOM				DOMAGRUP_ID
        , AgrupadorRecibo.cdbanco
        , AgrupadorRecibo.cdsucurs
        , RECIBO.CDESTADO					ESTADOREC_ID
        , Recibo.feemisio					DT_EMISSAO
        , Recibo.feinicio					DT_INICIO
        , Recibo.fefinal					DT_FINAL
        , DECODE(SIGN(RECIBO.FEINICIO-RECIBO.FEEMISIO), -1, RECIBO.FEEMISIO
                                                      , RECIBO.FEINICIO)	DT_PRODUCAO
        , DECODE(RECIBO.TIPORECI,'0',GREATEST(RECIBO.FEEMISIO,RECIBO.FEINICIO)
                        ,DECODE(TIPO_DOC.ID,'2',NULL
                                            ,'5',NULL
                                            ,'3',GREATEST(RECIBO.FEINICIO,RECIBO.FEEMISIO+30)
                                            ,'4',GREATEST(RECIBO.FEINICIO,RECIBO.FEEMISIO+30)
                                            ,GREATEST(RECIBO.FEINICIO,RECIBO.FEEMISIO+40)))	DT_VENCIMENTO
        , Apolice.cdmoneda
        , Recibo.ptimport					TotalRecibo
        , MONTHS_BETWEEN(Recibo.fefinal,Recibo.feinicio) 	n_MesesRisco
        , 0							N_FRACCOES
        , Pkg_Formulas_Cosec.fun_premio_comercial(recibo.cdunieco, recibo.nmrecibo) 				TotalPremio
		, Pkg_Formulas_Cosec.FUN_AJUSTE(RECIBO.CDUNIECO, RECIBO.NMRECIBO)							AJUSTEPREMIO
        , MAX(DECODE(cdatribu,3, otvalor,CHR(1))) 		Gestor_Comercial
        , MAX(DECODE(cdatribu,4, otvalor,CHR(1))) 		Gestor_Contratual
        , MAX(DECODE(cdatribu,13, otvalor,0)) 			TARIFACAO_ID
        , MAX(DECODE(cdatribu,17, otvalor,0)) 			PRAZOMAX_PAG
        , MAX(DECODE(cdatribu,2, otvalor,CHR(1))) 		DIRECCAO_COMERCIAL
        FROM
          GD_TIPOS_DOCUMENTO TIPO_DOC
        , mpolizas           APOLICE
        , mpoliagr           AGRUPADORRECIBO
        , mpoliper           TOMADORAPOL
        , mrecibo            RECIBO
        , tvalopol           ATRIBUTOSAPOLICE
        WHERE 1=1
        AND DECODE(AtributosApolice.cdatribu,2,'S',3,'S',4,'S',13,'S',17,'S','N')='S'
        AND AtributosApolice.status    = 'V'
        AND AtributosApolice.nmsuplem  = (
                                           SELECT
                                             MAX(nmsuplem)
                                           FROM
                                             tvalopol X
                                           WHERE
                                               1=1
                                           AND X.status   = AtributosApolice.status
                                           AND X.cdatribu = AtributosApolice.cdatribu
                                           AND X.NMSUPLEM <= RECIBO.NMSUPLEM
                                           AND X.nmpoliza = AtributosApolice.nmpoliza
                                           AND X.estado   = AtributosApolice.estado
                                           AND X.cdramo   = AtributosApolice.cdramo
                                           AND X.cdunieco = AtributosApolice.cdunieco
                                         )
        AND AtributosApolice.nmpoliza  = RECIBO.nmpoliza
        AND AtributosApolice.estado    = RECIBO.estado
        AND AtributosApolice.cdramo    = RECIBO.cdramo
        AND AtributosApolice.cdunieco  = RECIBO.cdunieco
        AND TomadorApol.cdrol          = 'TO'
        AND TomadorApol.nmsituac       = 0
        AND TomadorApol.status         = 'V'
        AND TomadorApol.nmpoliza       = RECIBO.nmpoliza
        AND TomadorApol.estado         = RECIBO.estado
        AND TomadorApol.cdramo         = RECIBO.cdramo
        AND TomadorApol.cdunieco       = RECIBO.cdunieco
        AND TomadorApol.nmsuplem       = (
                                           SELECT
                                             MAX(nmsuplem)
                                           FROM
                                             mpoliper X
                                           WHERE
						1=1
                                           AND x.status   = TomadorApol.status
                                           AND x.cdrol    = TomadorApol.cdrol
                                           AND x.nmsituac = TomadorApol.nmsituac
                                           AND X.NMSUPLEM <= RECIBO.NMSUPLEM
                                           AND X.nmpoliza = TomadorApol.nmpoliza
                                           AND X.estado   = TomadorApol.estado
                                           AND X.cdramo   = TomadorApol.cdramo
                                           AND X.cdunieco = TomadorApol.cdunieco
                                         )
        AND AgrupadorRecibo.cdagrupa   = RECIBO.cdagrupa
        AND AgrupadorRecibo.nmsuplem   = (
                                           SELECT
                                             MAX(nmsuplem)
                                           FROM
                                             mpolIAGR X
                                           WHERE
                                           1=1
                                           AND X.status   = 'V'
                                           AND X.CDAGRUPA = AGRUPADORRECIBO.CDAGRUPA
                                           AND X.NMSUPLEM <= RECIBO.NMSUPLEM
                                           AND X.nmpoliza = AgrupadorRecibo.nmpoliza
                                           AND X.estado   = AgrupadorRecibo.estado
                                           AND X.cdramo   = AgrupadorRecibo.cdramo
                                           AND X.cdunieco = AgrupadorRecibo.cdunieco
                                         )
        AND AgrupadorRecibo.nmpoliza   = RECIBO.nmpoliza
        AND AgrupadorRecibo.estado     = RECIBO.estado
        AND AgrupadorRecibo.cdramo     = RECIBO.cdramo
        AND AgrupadorRecibo.cdunieco   = RECIBO.cdunieco
--        AND Apolice.status             = 'V'
        AND Apolice.nmsuplem           = (
                                           SELECT
                                             MAX(nmsuplem)
                                           FROM
                                             mpolizas X
                                           WHERE
                                               1=1
                                           AND X.status   = 'V'
                                           AND X.NMSUPLEM <= RECIBO.NMSUPLEM
                                           AND X.nmpoliza = RECIBO.nmpoliza
                                           AND X.estado   = RECIBO.estado
                                           AND X.cdramo   = RECIBO.cdramo
                                           AND X.cdunieco = RECIBO.cdunieco
                                         )
        AND Apolice.nmpoliza           = RECIBO.nmpoliza
        AND Apolice.estado             = RECIBO.ESTADO
        AND Apolice.cdramo             = RECIBO.cdramo
        AND Apolice.cdunieco           = RECIBO.cdunieco
        AND RECIBO.tiporeci            = TIPO_DOC.tiporeci
        AND TIPO_DOC.SINAL_VALOR       = SIGN(RECIBO.ptimport)
        AND DECODE(TIPO_DOC.ID,1,'S',2,'S','N')= 'S'
        AND TRUNC(RECIBO.FEEMISIO,'MONTH') = TRUNC(NVL(P_MES,RECIBO.FEEMISIO),'MONTH')
        AND RECIBO.CDUNIECO            = 1
        /* and RECIBO.cdestado not in (2,8,12,3) */
        AND NOT EXISTS (
                        SELECT
                          1
                        FROM
                          GD_RECIBOS_PPNA
                        WHERE
                            1=1
                        AND nmrecibo = recibo.nmrecibo
                        AND cdunieco = recibo.cdunieco
                      )
        GROUP BY
          RECIBO.cdunieco
        , RECIBO.nmrecibo
        , RECIBO.cdramo
        , RECIBO.estado
        , RECIBO.nmpoliza
		, APOLICE.FEEMISIO
        , APOLICE.feefecto
        , DECODE(APOLICE.ottempot,'R', APOLICE.feproren
                                 , APOLICE.fevencim)
        , APOLICE.cdtipcoa
        , APOLICE.ottempot
        , APOLICE.cdperpag
        , RECIBO.tiporeci
        , RECIBO.nmrecinue
        , TOMADORAPOL.cdperson
        , RECIBO.cdagrupa
        , AgrupadorRecibo.cdperson
        , AGRUPADORRECIBO.NMORDDOM
        , AgrupadorRecibo.cdbanco
        , AgrupadorRecibo.cdsucurs
        , RECIBO.CDESTADO
        , Recibo.feemisio
        , Recibo.feinicio
        , Recibo.fefinal
        , DECODE(SIGN(RECIBO.FEINICIO-RECIBO.FEEMISIO), -1, RECIBO.FEEMISIO
                                                      , RECIBO.FEINICIO)
        , DECODE(RECIBO.TIPORECI,'0',GREATEST(RECIBO.FEEMISIO,RECIBO.FEINICIO)
                        ,DECODE(TIPO_DOC.ID,'2',NULL
                                            ,'5',NULL
                                            ,'3',GREATEST(RECIBO.FEINICIO,RECIBO.FEEMISIO+30)
                                            ,'4',GREATEST(RECIBO.FEINICIO,RECIBO.FEEMISIO+30)
                                            ,GREATEST(RECIBO.FEINICIO,RECIBO.FEEMISIO+40)))
        , Apolice.cdmoneda
        , Recibo.ptimport
        , MONTHS_BETWEEN(Recibo.fefinal,Recibo.feinicio)
        , Pkg_Formulas_Cosec.GET_MERCADO(APOLICE.NMPOLIZA,APOLICE.CDRAMO,APOLICE.CDUNIECO,'M',NVL(P_MES,SYSDATE));
      nRecibosProc NUMBER:=0;
      v_err_msg VARCHAR2(255);
    BEGIN
      DBMS_OUTPUT.PUT_LINE(TO_CHAR(SYSDATE,'DD-MON-YYYY HH24:MI'));
      FOR RW IN curPPNA_REC LOOP
        IF RW.TOTALPREMIO != 0 OR
		   RW.AJUSTEPREMIO != 0 THEN
        INSERT INTO
          GD_RECIBOS_PPNA
          (
            CDUNIECO
          , NMRECIBO
          , CDRAMO
          , ESTADO
          , NMPOLIZA
          , DT_INI_VIGAPOL
          , DT_FIM_VIGAPOL
          , DIRECCAO_COMERCIAL
          , GESTOR_COMERCIAL
          , GESTOR_CONTRATUAL
          , MERCADO_ID
          , TIPO_APOLICE_ID
          , COSEGURO_ID
          , TARIFACAO_ID
          , PAGAPOL_ID
          , PRAZOMAX_PAG
          , TIPORECI
          , TIPOAVISO_ID
          , NMRECINUE
          , TOMADOR_ID
          , CDAGRUPA
          , AGRUPADOR_ID
          , DOMAGRUP_ID
          , CDBANCO
          , CDSUCURS
          , ESTADOREC_ID
          , DT_EMISSAO
          , DT_INICIO
          , DT_FINAL
          , DT_PRODUCAO
          , DT_VENCIMENTO
          , CDMONEDA
          , TOTALRECIBO
          , TOTALPREMIO
          , N_MESESRISCO
          , N_FRACCOES
		  , DATA_ACTUALIZACAO
          , ACTUALIZADO_POR
          )
        VALUES
          (
            RW.CDUNIECO
          , RW.NMRECIBO
          , RW.CDRAMO
          , RW.ESTADO
          , RW.NMPOLIZA
          , RW.DT_INI_VIGAPOL
          , RW.DT_FIM_VIGAPOL
          , RW.DIRECCAO_COMERCIAL
          , RW.GESTOR_COMERCIAL
          , RW.GESTOR_CONTRATUAL
          , RW.MERCADO_ID
          , RW.TIPO_APOLICE_ID
          , RW.COSEGURO_ID
          , RW.TARIFACAO_ID
          , RW.PAGAPOL_ID
          , DECODE(SUBSTR(RW.CDRAMO,1,1),'2',0,RW.PRAZOMAX_PAG)
          , RW.TIPORECI
          , Pkg_Formulas_Cosec.FUN_TIPOAVISO(RW.CDUNIECO,RW.NMRECIBO)
          , RW.NMRECINUE
          , RW.TOMADOR_ID
          , RW.CDAGRUPA
          , RW.AGRUPADOR_ID
          , RW.DOMAGRUP_ID
          , RW.CDBANCO
          , RW.CDSUCURS
          , RW.ESTADOREC_ID
          , RW.DT_EMISSAO
          , RW.DT_INICIO
          , RW.DT_FINAL
          , RW.DT_PRODUCAO
          , RW.DT_VENCIMENTO
          , RW.CDMONEDA
          , RW.TOTALRECIBO
          , DECODE(RW.TOTALPREMIO,0, RW.AJUSTEPREMIO, RW.TOTALPREMIO)
          , DECODE(RW.N_MESESRISCO,0,1,RW.N_MESESRISCO)
          , RW.N_FRACCOES
		  , SYSDATE
		  , USER
          );
        nRecibosProc := nRecibosProc + 1;
        IF MOD(nRecibosProc,100) = 0 THEN
         COMMIT;
        END IF;
        END IF;
      END LOOP;
      DBMS_OUTPUT.PUT_LINE(TO_CHAR(SYSDATE,'DD-MON-YYYY HH24:MI'));
      COMMIT;
      RETURN NRECIBOSPROC;
    EXCEPTION
      WHEN OTHERS THEN
        ROLLBACK;
        V_ERR_MSG:= 'FALHOU '||SUBSTR(SQLERRM, 1, 245);
        DBMS_OUTPUT.PUT_LINE(V_ERR_MSG);
        RETURN -1;
    END LOAD_RECIBOS;

    FUNCTION UPDATE_RECIBOS(P_MES IN DATE DEFAULT NULL) RETURN NUMBER
    IS
      CURSOR curPPNA_REC IS
        SELECT
          *
		FROM
		  GD_RECIBOS_PPNA;

	  CURSOR curDADOS_REC (AUX_CDUNIECO NUMBER,AUX_NMRECIBO NUMBER) IS
        SELECT * FROM (
        SELECT /*+ FIRST_ROWS */
          RECIBO.cdunieco
        , RECIBO.nmrecibo
        , RECIBO.cdramo
        , RECIBO.estado
        , RECIBO.nmpoliza
        , APOLICE.feefecto  					DT_INI_VIGAPOL
        , DECODE(APOLICE.ottempot,'R', APOLICE.feproren
                                 , APOLICE.fevencim) 		DT_FIM_VIGAPOL
        , APOLICE.cdtipcoa					COSEGURO_ID
        , APOLICE.ottempot					TIPO_APOLICE_ID
        , Pkg_Formulas_Cosec.GET_MERCADO(APOLICE.NMPOLIZA,APOLICE.CDRAMO,APOLICE.CDUNIECO,'M',NVL(P_MES,SYSDATE)) MERCADO_ID
        , APOLICE.cdperpag					PAGAPOL_ID
        , RECIBO.tiporeci
        , RECIBO.nmrecinue
        , TOMADORAPOL.cdperson					TOMADOR_ID
        , RECIBO.cdagrupa
        , AgrupadorRecibo.cdperson				AGRUPADOR_ID
        , AGRUPADORRECIBO.NMORDDOM				DOMAGRUP_ID
        , AgrupadorRecibo.cdbanco
        , AgrupadorRecibo.cdsucurs
        , RECIBO.CDESTADO					ESTADOREC_ID
        , Recibo.feemisio					DT_EMISSAO
        , Recibo.feinicio					DT_INICIO
        , Recibo.fefinal					DT_FINAL
        , DECODE(SIGN(RECIBO.FEINICIO-RECIBO.FEEMISIO), -1, RECIBO.FEEMISIO
                                                      , RECIBO.FEINICIO)	DT_PRODUCAO
        , DECODE(RECIBO.TIPORECI,'0',GREATEST(RECIBO.FEEMISIO,RECIBO.FEINICIO)
                        ,DECODE(TIPO_DOC.ID,'2',NULL
                                            ,'5',NULL
                                            ,'3',GREATEST(RECIBO.FEINICIO,RECIBO.FEEMISIO+30)
                                            ,'4',GREATEST(RECIBO.FEINICIO,RECIBO.FEEMISIO+30)
                                            ,GREATEST(RECIBO.FEINICIO,RECIBO.FEEMISIO+40)))	DT_VENCIMENTO
        , Apolice.cdmoneda
        , Recibo.ptimport					TotalRecibo
        , MONTHS_BETWEEN(Recibo.fefinal,Recibo.feinicio) 	n_MesesRisco
        , 0							N_FRACCOES
        , Pkg_Formulas_Cosec.fun_premio_comercial(recibo.cdunieco, recibo.nmrecibo) 				TotalPremio
		, Pkg_Formulas_Cosec.FUN_AJUSTE(RECIBO.CDUNIECO, RECIBO.NMRECIBO)							AJUSTEPREMIO
		, Pkg_Formulas_Cosec.FUN_TIPOAVISO(RECIBO.CDUNIECO,RECIBO.NMRECIBO)                         TIPOAVISO_ID
        FROM
          GD_TIPOS_DOCUMENTO TIPO_DOC
        , mpolizas           APOLICE
        , mpoliagr           AGRUPADORRECIBO
        , mpoliper           TOMADORAPOL
        , mrecibo            RECIBO
        WHERE 1=1
        AND TomadorApol.cdrol          = 'TO'
        AND TomadorApol.nmsituac       = 0
        AND TomadorApol.status         = 'V'
        AND TomadorApol.nmpoliza       = RECIBO.nmpoliza
        AND TomadorApol.estado         = RECIBO.estado
        AND TomadorApol.cdramo         = RECIBO.cdramo
        AND TomadorApol.cdunieco       = RECIBO.cdunieco
        AND TomadorApol.nmsuplem       = (
                                           SELECT
                                             MAX(nmsuplem)
                                           FROM
                                             mpoliper X
                                           WHERE
						1=1
                                           AND x.status   = TomadorApol.status
                                           AND x.cdrol    = TomadorApol.cdrol
                                           AND x.nmsituac = TomadorApol.nmsituac
                                           AND X.NMSUPLEM <= RECIBO.NMSUPLEM
                                           AND X.nmpoliza = TomadorApol.nmpoliza
                                           AND X.estado   = TomadorApol.estado
                                           AND X.cdramo   = TomadorApol.cdramo
                                           AND X.cdunieco = TomadorApol.cdunieco
                                         )
        AND AgrupadorRecibo.cdagrupa   = RECIBO.cdagrupa
        AND AgrupadorRecibo.nmsuplem   = (
                                           SELECT
                                             MAX(nmsuplem)
                                           FROM
                                             mpolIAGR X
                                           WHERE
                                           1=1
                                           AND X.status   = 'V'
                                           AND X.CDAGRUPA = AGRUPADORRECIBO.CDAGRUPA
                                           AND X.NMSUPLEM <= RECIBO.NMSUPLEM
                                           AND X.nmpoliza = AgrupadorRecibo.nmpoliza
                                           AND X.estado   = AgrupadorRecibo.estado
                                           AND X.cdramo   = AgrupadorRecibo.cdramo
                                           AND X.cdunieco = AgrupadorRecibo.cdunieco
                                         )
        AND AgrupadorRecibo.nmpoliza   = RECIBO.nmpoliza
        AND AgrupadorRecibo.estado     = RECIBO.estado
        AND AgrupadorRecibo.cdramo     = RECIBO.cdramo
        AND AgrupadorRecibo.cdunieco   = RECIBO.cdunieco
        AND Apolice.nmsuplem           = (
                                           SELECT
                                             MAX(nmsuplem)
                                           FROM
                                             mpolizas X
                                           WHERE
                                               1=1
                                           AND X.status   = 'V'
                                           AND X.NMSUPLEM <= RECIBO.NMSUPLEM
                                           AND X.nmpoliza = RECIBO.nmpoliza
                                           AND X.estado   = RECIBO.estado
                                           AND X.cdramo   = RECIBO.cdramo
                                           AND X.cdunieco = RECIBO.cdunieco
                                         )
        AND Apolice.nmpoliza           = RECIBO.nmpoliza
        AND Apolice.estado             = RECIBO.ESTADO
        AND Apolice.cdramo             = RECIBO.cdramo
        AND Apolice.cdunieco           = RECIBO.cdunieco
        AND RECIBO.tiporeci            = TIPO_DOC.tiporeci
        AND TIPO_DOC.SINAL_VALOR       = SIGN(RECIBO.ptimport)
        AND DECODE(TIPO_DOC.ID,1,'S',2,'S','N')= 'S'
        AND TRUNC(RECIBO.FEEMISIO,'MONTH') = TRUNC(NVL(P_MES,RECIBO.FEEMISIO),'MONTH')
        AND RECIBO.CDUNIECO            = AUX_CDUNIECO
		AND RECIBO.NMRECIBO            = AUX_NMRECIBO
		) RECIBO
		WHERE 1=1
		AND NOT EXISTS (
               SELECT
                 1
               FROM
                 GD_RECIBOS_PPNA X
               WHERE
                 1=1
               AND X.NMRECIBO           = RECIBO.NMRECIBO
               AND X.CDUNIECO           = RECIBO.CDUNIECO
               AND X.CDRAMO             = RECIBO.CDRAMO
               AND X.ESTADO             = RECIBO.ESTADO
               AND X.NMPOLIZA           = RECIBO.NMPOLIZA
               AND X.DT_INI_VIGAPOL     = RECIBO.DT_INI_VIGAPOL
               AND X.DT_FIM_VIGAPOL     = RECIBO.DT_FIM_VIGAPOL
               AND X.COSEGURO_ID        = RECIBO.COSEGURO_ID
               AND X.TIPO_APOLICE_ID    = RECIBO.TIPO_APOLICE_ID
               AND X.MERCADO_ID         = RECIBO.MERCADO_ID
               AND X.PAGAPOL_ID         = RECIBO.PAGAPOL_ID
               AND X.TIPORECI           = RECIBO.TIPORECI
               AND X.TIPOAVISO_ID       = RECIBO.TIPOAVISO_ID
               AND X.NMRECINUE          = RECIBO.NMRECINUE
               AND X.TOMADOR_ID         = RECIBO.TOMADOR_ID
               AND X.CDAGRUPA           = RECIBO.CDAGRUPA
               AND X.AGRUPADOR_ID       = RECIBO.AGRUPADOR_ID
               AND X.DOMAGRUP_ID        = RECIBO.DOMAGRUP_ID
               AND X.ESTADOREC_ID       = RECIBO.ESTADOREC_ID
               AND X.DT_EMISSAO         = RECIBO.DT_EMISSAO
               AND X.DT_INICIO          = RECIBO.DT_INICIO
               AND X.DT_FINAL           = RECIBO.DT_FINAL
               AND X.CDMONEDA           = RECIBO.CDMONEDA
               AND X.TOTALRECIBO        = RECIBO.TOTALRECIBO
               AND X.TOTALPREMIO        = RECIBO.TOTALPREMIO
    		   );

	  CURSOR curDADOS_APOL (AUX_CDUNIECO NUMBER,AUX_NMRECIBO NUMBER) IS
        SELECT * FROM (
        SELECT
		  RECIBO.CDUNIECO
		, RECIBO.NMRECIBO
        , MAX(DECODE(cdatribu,3, otvalor,CHR(1))) 		Gestor_Comercial
        , MAX(DECODE(cdatribu,4, otvalor,CHR(1))) 		Gestor_Contratual
        , MAX(DECODE(cdatribu,13, otvalor,0)) 			TARIFACAO_ID
        , MAX(DECODE(cdatribu,17, otvalor,0)) 			PRAZOMAX_PAG
        , MAX(DECODE(cdatribu,2, otvalor,CHR(1))) 		DIRECCAO_COMERCIAL
        FROM
           tvalopol           ATRIBUTOSAPOLICE
		  ,mrecibo            RECIBO
        WHERE 1=1
        AND DECODE(AtributosApolice.cdatribu,2,'S',3,'S',4,'S',13,'S',17,'S','N')='S'
        AND AtributosApolice.status    = 'V'
        AND AtributosApolice.nmsuplem  = (
                                           SELECT
                                             MAX(nmsuplem)
                                           FROM
                                             tvalopol X
                                           WHERE
                                               1=1
                                           AND X.status   = AtributosApolice.status
                                           AND X.cdatribu = AtributosApolice.cdatribu
                                           AND X.NMSUPLEM <= RECIBO.NMSUPLEM
                                           AND X.nmpoliza = AtributosApolice.nmpoliza
                                           AND X.estado   = AtributosApolice.estado
                                           AND X.cdramo   = AtributosApolice.cdramo
                                           AND X.cdunieco = AtributosApolice.cdunieco
                                         )
        AND AtributosApolice.nmpoliza  = RECIBO.nmpoliza
        AND AtributosApolice.estado    = RECIBO.estado
        AND AtributosApolice.cdramo    = RECIBO.cdramo
        AND AtributosApolice.cdunieco  = RECIBO.cdunieco
        AND RECIBO.CDUNIECO            = AUX_CDUNIECO
		AND RECIBO.NMRECIBO            = AUX_NMRECIBO
		GROUP BY
		  RECIBO.CDUNIECO
		, RECIBO.NMRECIBO
		) RECIBO
		WHERE 1=1
		AND NOT EXISTS (
               SELECT
                 1
               FROM
                 GD_RECIBOS_PPNA X
               WHERE
                 1=1
               AND X.NMRECIBO           = RECIBO.NMRECIBO
               AND X.CDUNIECO           = RECIBO.CDUNIECO
               AND X.DIRECCAO_COMERCIAL = RECIBO.DIRECCAO_COMERCIAL
               AND X.GESTOR_COMERCIAL   = RECIBO.GESTOR_COMERCIAL
               AND X.GESTOR_CONTRATUAL  = RECIBO.GESTOR_CONTRATUAL
               AND X.TARIFACAO_ID       = RECIBO.TARIFACAO_ID
               AND X.PRAZOMAX_PAG       = RECIBO.PRAZOMAX_PAG
    		   );

      nRecibosProc NUMBER:=0;
      v_err_msg VARCHAR2(255);
	  nActualizacoes  NUMBER:=0;
    BEGIN
      DBMS_OUTPUT.PUT_LINE(TO_CHAR(SYSDATE,'DD-MON-YYYY HH24:MI'));
	  FOR RW IN curPPNA_REC LOOP
  	    nActualizacoes:=0;
	    FOR RWREC IN curDADOS_REC(RW.CDUNIECO,RW.NMRECIBO) LOOP
		  nActualizacoes:=nActualizacoes+1;
		  UPDATE
            GD_RECIBOS_PPNA RECIBO
          SET
            RECIBO.CDRAMO             = RWREC.CDRAMO
	      , RECIBO.ESTADO             = RWREC.ESTADO
	      , RECIBO.NMPOLIZA           = RWREC.NMPOLIZA
	      , RECIBO.DT_INI_VIGAPOL     = RWREC.DT_INI_VIGAPOL
	      , RECIBO.DT_FIM_VIGAPOL     = RWREC.DT_FIM_VIGAPOL
	      , RECIBO.MERCADO_ID         = RWREC.MERCADO_ID
	      , RECIBO.TIPO_APOLICE_ID    = RWREC.TIPO_APOLICE_ID
	      , RECIBO.COSEGURO_ID        = RWREC.COSEGURO_ID
	      , RECIBO.PAGAPOL_ID         = RWREC.PAGAPOL_ID
	      , RECIBO.TIPORECI           = RWREC.TIPORECI
	      , RECIBO.TIPOAVISO_ID       = RWREC.TIPOAVISO_ID
	      , RECIBO.NMRECINUE          = RWREC.NMRECINUE
	      , RECIBO.TOMADOR_ID         = RWREC.TOMADOR_ID
	      , RECIBO.CDAGRUPA           = RWREC.CDAGRUPA
	      , RECIBO.AGRUPADOR_ID       = RWREC.AGRUPADOR_ID
	      , RECIBO.DOMAGRUP_ID        = RWREC.DOMAGRUP_ID
	      , RECIBO.CDBANCO            = RWREC.CDBANCO
	      , RECIBO.CDSUCURS           = RWREC.CDSUCURS
	      , RECIBO.ESTADOREC_ID       = RWREC.ESTADOREC_ID
	      , RECIBO.DT_EMISSAO         = RWREC.DT_EMISSAO
	      , RECIBO.DT_INICIO          = RWREC.DT_INICIO
	      , RECIBO.DT_FINAL           = RWREC.DT_FINAL
	      , RECIBO.DT_PRODUCAO        = RWREC.DT_PRODUCAO
	      , RECIBO.DT_VENCIMENTO      = RWREC.DT_VENCIMENTO
	      , RECIBO.CDMONEDA           = RWREC.CDMONEDA
	      , RECIBO.TOTALRECIBO        = RWREC.TOTALRECIBO
	      , RECIBO.TOTALPREMIO        = DECODE(RWREC.TOTALPREMIO,0,RWREC.AJUSTEPREMIO,RWREC.TOTALPREMIO)
	      , RECIBO.N_MESESRISCO       = DECODE(RWREC.N_MESESRISCO,0,1,RWREC.N_MESESRISCO)
	      , RECIBO.N_FRACCOES         = RWREC.N_FRACCOES
	      , RECIBO.DATA_ACTUALIZACAO  = SYSDATE
          , RECIBO.ACTUALIZADO_POR    = USER
	      WHERE
	      1=1
  	      AND RECIBO.CDUNIECO=RW.CDUNIECO
     	  AND RECIBO.NMRECIBO=RW.NMRECIBO;
		  DBMS_OUTPUT.PUT_LINE('OUT'||TO_CHAR(RWREC.NMRECIBO));
	    END LOOP;
	    FOR RWREC IN curDADOS_APOL(RW.CDUNIECO,RW.NMRECIBO) LOOP
		  nActualizacoes:=nActualizacoes+1;
		  UPDATE
            GD_RECIBOS_PPNA RECIBO
          SET
            RECIBO.Gestor_Comercial   = RWREC.Gestor_Comercial
	      , RECIBO.Gestor_Contratual  = RWREC.Gestor_Contratual
	      , RECIBO.DIRECCAO_COMERCIAL = RWREC.DIRECCAO_COMERCIAL
	      , RECIBO.TARIFACAO_ID       = RWREC.TARIFACAO_ID
	      , RECIBO.PRAZOMAX_PAG       = RWREC.PRAZOMAX_PAG
	      , RECIBO.DATA_ACTUALIZACAO  = SYSDATE
          , RECIBO.ACTUALIZADO_POR    = USER
	      WHERE
	      1=1
  	      AND RECIBO.CDUNIECO=RW.CDUNIECO
     	  AND RECIBO.NMRECIBO=RW.NMRECIBO;
		  DBMS_OUTPUT.PUT_LINE('OUT'||TO_CHAR(RWREC.NMRECIBO));
	    END LOOP;
        IF nActualizacoes > 0 THEN
          COMMIT;
        END IF;
      END LOOP;
      DBMS_OUTPUT.PUT_LINE(TO_CHAR(SYSDATE,'DD-MON-YYYY HH24:MI'));
      COMMIT;
      RETURN NRECIBOSPROC;
    EXCEPTION
      WHEN OTHERS THEN
        ROLLBACK;
        V_ERR_MSG:= 'FALHOU '||SUBSTR(SQLERRM, 1, 245);
        DBMS_OUTPUT.PUT_LINE(V_ERR_MSG);
        RETURN -1;
    END UPDATE_RECIBOS;

     FUNCTION CALCULA_PPNA(P_MES IN DATE DEFAULT SYSDATE) RETURN NUMBER
    IS
      CURSOR curPPNAS IS
        SELECT
          *
        FROM
          GD_RECIBOS_PPNA rec;
      v_cur_RISCO         NUMBER;
      v_cur_mes_RISCO     DATE;
      v_cur_RISCO_valor   NUMBER;
      v_cur_fraccao       NUMBER;
      v_cur_mes           DATE;
      v_cur_fraccao_valor NUMBER;
      nLinhas             NUMBER:=0;
      nLinhasFRAC         NUMBER:=0;
      v_err_msg VARCHAR2(255);
    BEGIN
      FOR RW IN curPPNAS LOOP
        v_cur_RISCO_valor := 0;
        v_cur_RISCO       := 1;
        v_cur_mes_RISCO   := TRUNC(RW.dt_iniCIO,'MONTH');
        IF TRUNC(RW.N_MESESRISCO) != 0 THEN
          v_cur_RISCO_valor := (RW.TOTALPREMIO-RW.TOTALPREMIO * MOD(RW.N_MESESRISCO,1)/RW.N_MESESRISCO)/TRUNC(RW.N_MESESRISCO);
        END IF;
        WHILE v_cur_RISCO <= CEIL(RW.n_MESESRISCO) LOOP
          IF v_cur_RISCO = CEIL(RW.n_MESESRISCO)    AND
             CEIL(RW.n_MESESRISCO) != RW.n_MESESRISCO THEN
            v_cur_RISCO_valor := (RW.TOTALPREMIO * MOD(RW.N_MESESRISCO,1)/RW.N_MESESRISCO);
          END IF;
          INSERT INTO
            GD_RISCOS_PPNA
          (
            CDUNIECO
          , NMRECIBO
          , MES
          , RISCO
          )
          VALUES
          (
            RW.cdunieco
          , RW.nmrecibo
          , v_cur_mes_RISCO
          , v_cur_RISCO_valor
          );
          v_cur_fraccao_valor := 0;
          v_cur_fraccao       := 1;
          IF RW.CDRAMO LIKE '2%' OR
             RW.TARIFACAO_ID = 3 THEN
            v_cur_mes:= TRUNC(V_CUR_MES_RISCO,'MONTH');
          ELSE
--            v_cur_mes:= ADD_MONTHS(TRUNC(V_CUR_MES_RISCO,'MONTH'), TRUNC(RW.PRAZOMAX_PAG/30));
            v_cur_mes:= ADD_MONTHS(TRUNC(V_CUR_MES_RISCO,'MONTH'), 1);
          END IF;
          IF TRUNC(RW.PRAZOMAX_PAG/30) != 0 THEN
            v_cur_fraccao_valor := (V_CUR_risco_VALOR - V_CUR_risco_VALOR * MOD(RW.PRAZOMAX_PAG/30,1)/(RW.PRAZOMAX_PAG/30))/TRUNC(RW.PRAZOMAX_PAG/30);
          ELSE
            v_cur_fraccao_valor:= V_CUR_RISCO_VALOR;
            INSERT INTO
              GD_FRACCIONAMENTO_PPNA
            (
              CDUNIECO
            , NMRECIBO
            , MES_RISCO
            , MES_FRACCAO
            , FRACCAO
            )
            VALUES
            (
              RW.cdunieco
            , RW.nmrecibo
            , v_cur_mes_RISCO
            , v_cur_mes_RISCO
            , v_cur_fraccao_valor
            );
          END IF;
          WHILE v_cur_fraccao <= CEIL(RW.PRAZOMAX_PAG/30) LOOP
            IF v_cur_fraccao = CEIL(RW.PRAZOMAX_PAG/30)    AND
               CEIL(RW.PRAZOMAX_PAG/30) != (RW.PRAZOMAX_PAG/30) THEN
              v_cur_fraccao_valor := V_CUR_RISCO_VALOR * MOD(RW.PRAZOMAX_PAG/30,1)/(RW.PRAZOMAX_PAG/30);
            END IF;
--            DBMS_OUTPUT.PUT_LINE(RW.PRAZOMAX_PAG);
            INSERT INTO
              GD_FRACCIONAMENTO_PPNA
            (
              CDUNIECO
            , NMRECIBO
            , MES_RISCO
            , MES_FRACCAO
            , FRACCAO
            )
            VALUES
            (
              RW.cdunieco
            , RW.nmrecibo
            , v_cur_mes_RISCO
            , v_cur_mes
            , v_cur_fraccao_valor
            );
            v_cur_fraccao := v_cur_fraccao + 1;
            v_cur_mes := ADD_MONTHS(v_cur_mes, 1);
            nLinhasFRAC := nLinhasFRAC + 1;
          END LOOP;
          v_cur_RISCO     := v_cur_RISCO + 1;
          v_cur_mes_RISCO := ADD_MONTHS(v_cur_mes_RISCO, 1);
          nLinhas := nLinhas + 1;
          IF MOD(nLinhas,100) = 0 THEN
            COMMIT;
          END IF;
        END LOOP;
      END LOOP;
      COMMIT;
      RETURN NLINHAS;
    EXCEPTION
      WHEN OTHERS THEN
        V_ERR_MSG:= 'FALHOU '||SUBSTR(SQLERRM, 1, 245);
        DBMS_OUTPUT.PUT_LINE(V_ERR_MSG);
        ROLLBACK;
        RETURN -1;
    END CALCULA_PPNA;

    FUNCTION UPDT_PPNA RETURN NUMBER
    IS
    BEGIN
      RETURN 1;
    EXCEPTION
      WHEN OTHERS THEN
        ROLLBACK;
        RETURN -1;
    END UPDT_PPNA;
END Pkg_Ppna;


-- PKG_SIID_UTIL (owner: SIID_TESTES)


-- ===== SPEC (PACKAGE) =====

PACKAGE             PKG_SIID_UTIL AS
	--* CONSTANTES PRÓPRIAS QUESTIONAR INFORMAÇÕES SOBRE PACKAGE
	--*
	--* CRIADO POR  : JOSE VIEGAS
	--* DATA CRIACAO: 24-03-2010
	--* OBSERVAÇÃO  : A) ESTA SECÇÃO DEVE ESTAR NO INICIO DO PACKAGE SEMPRE
	--*               B) SEMPRE QUE FOR EFECTUADA ALGUMA ALTERAÇÃO AO PACKAGE
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
	-* OBJECTIVO : MANTER INFORMAÇÃO SOBRE VERSÃO DO PACKAGE
	-* UTILIZACAO: PKG_FORMULAS_COSEC.GET_PACKINFO('VERSAO');
	-* AUTOR     : Eng. José Viegas
	-* DATA      : 25-11-2004
	-* VERSÃO    : 1.0
	-*
	-* ÚLTIMAS ALTERAÇÕES
	-*
	-*   DATA       AUTOR           DESCRIÇÃO
	-*   ========== =============== =================================================
	-*
	-*/
	FUNCTION GET_PACKINFO (P_TIPO_INFO VARCHAR2 DEFAULT 'COMPLETE') RETURN VARCHAR2;
	/*
	-* NOME      : GET_QUEUE_GERACAO
	-* OBJECTIVO : RETORNA A ULTIMA QUEUE DE GERAÇÃO DE UM DOCUMENTO
	-* UTILIZACAO: PKG_SIID_UTIL.GET_QUEUE_GERACAO(DOC_ID);
	-* AUTOR     : JOSE VIEGAS
	-* DATA      : 24-03-2010
	-* VERSÃO    : 1.0
	-*
	-* ÚLTIMAS ALTERAÇÕES
	-*
	-*   DATA       AUTOR           DESCRIÇÃO
	-*   ========== =============== =================================================
	-*
	-*/
	FUNCTION GET_QUEUE_GERACAO (PI_DOC_ID IN NUMBER, PI_ESTADO IN VARCHAR2 DEFAULT 'TERMINADO') RETURN NUMBER;
	/*
	-* NOME      : GET_EXISTS_QUEUE_I
	-* OBJECTIVO : RETORNA A ULTIMA QUEUE DE GERAÇÃO DE UM DOCUMENTO
	-* UTILIZACAO: PKG_SIID_UTIL.GET_EXISTS_QUEUE_I(DOCUMENT_ID);
	-* AUTOR     : Aldo TITA 
	-* DATA      : 25-03-2010
	-* VERSÃO    : 1.0
	-*
	-* ÚLTIMAS ALTERAÇÕES
	-*
	-*   DATA       AUTOR           DESCRIÇÃO
	-*   ========== =============== =================================================
	-*
	-*/
	FUNCTION EXISTS_QUEUE_IMPRESSAO (PI_DOC_ID IN NUMBER) RETURN NUMBER;
	PRAGMA RESTRICT_REFERENCES (GET_PACKINFO,WNDS);
	PRAGMA RESTRICT_REFERENCES (GET_QUEUE_GERACAO,WNDS);
	PRAGMA RESTRICT_REFERENCES (EXISTS_QUEUE_IMPRESSAO,WNDS);

	/*
	-* NOME      : CAN_BE_PRINTED
	-* OBJECTIVO : RETORNA INFORMAÇÃO BASEADO NO NEG??CIO, SE O DOCUMENTO PODE SER IMPRESSO 
	-* UTILIZACAO: PKG_SIID_UTIL.CAN_BE_PRINTED(DOCUMENT_ID) > 0
	-* AUTOR     : JOSE VIEGAS 
	-* DATA      : 19-09-2014
	-* VERSÃO    : 1.0
	-*
	-* ÚLTIMAS ALTERAÇÕES
	-*
	-*   DATA       AUTOR           DESCRIÇÃO
	-*   ========== =============== =================================================
	-*   19-09-2014 JOSE VIEGAS     FUNÇÃO QUE DEVOLVE 1 SE O DOCUMENTO POR REGRAS DE NEGÓCIO PUDER SER IMPRESSO
	-*/
	FUNCTION CAN_BE_PRINTED (PI_DOC_ID IN NUMBER) RETURN NUMBER;

	/*
	-* NOME      : CAN_BE_PRINTED
	-* OBJECTIVO : RETORNA INFORMAÇÃO BASEADO NO NEGÓCIO, SE O DOCUMENTO PODE SER IMPRESSO 
	-* UTILIZACAO: PKG_SIID_UTIL.CAN_BE_PRINTED(MODELO_ID, DATAACTUAL, PARAMETRO04, PARAMETRO05, PARAMETRO06, PARAMETRO07) > 0
	-* AUTOR     : JOSE VIEGAS 
	-* DATA      : 19-09-2014
	-* VERSÃO    : 1.0
	-*
	-* ÚLTIMAS ALTERAÇÕES
	-*
	-*   DATA       AUTOR           DESCRIÇÃO
	-*   ========== =============== =================================================
	-*   19-09-2014 JOSE VIEGAS     FUNÇÃO QUE DEVOLVE 1 SE O DOCUMENTO POR REGRAS DE NEGÓCIO PUDER SER IMPRESSO
	-*/
		FUNCTION CAN_BE_PRINTED (PI_MODELO_ID   IN VARCHAR
							, PI_DATAACTUAL  IN DATE
							, PI_PARAMETRO04 IN VARCHAR
							, PI_PARAMETRO05 IN VARCHAR
							, PI_PARAMETRO06 IN VARCHAR
							, PI_PARAMETRO07 IN VARCHAR) RETURN NUMBER;

	/*
	-* NOME      : CAN_BE_UPLOADED_EDOC
	-* OBJECTIVO : RETORNA INFORMAÇÃO BASEADO NO NEGÓCIO, SE O DOCUMENTO PODE SER ENVIADO PARA O EDOC
	-* UTILIZACAO: PKG_SIID_UTIL.CAN_BE_UPLOADED_EDOC(SPOOL_ID) ? "W" : "I"
	-* AUTOR     : JOÂO RIEBIRO
	-* DATA      : 30-05-2018
	-* VERSÃO    : 1.0
	-*
	-* ÚLTIMAS ALTERAÇÕES
	-*
	-*   DATA       AUTOR           DESCRIÇÃO
	-*   ========== =============== =================================================
	-*/
	FUNCTION CAN_BE_UPLOADED_EDOC (PI_ID IN NUMBER) RETURN NUMBER;

	/*
	-* NOME      : CAN_BE_EXPORTED_XML
	-* OBJECTIVO : RETORNA INFORMAÇÃO BASEADO NO NEGÓCIO, SE O DOCUMENTO PODE SER EXPORTADO E CRIADO O XML A ACOMPANHAR
	-* UTILIZACAO: PKG_SIID_UTIL.CAN_BE_EXPORTED_XML(SPOOL_ID) ? "S" : "N"
	-* AUTOR     : JOÂO RIEBIRO
	-* DATA      : 30-05-2018
	-* VERSÃO    : 1.0
	-*
	-* ÚLTIMAS ALTERAÇÕES
	-*
	-*   DATA       AUTOR           DESCRIÇÃO
	-*   ========== =============== =================================================
	-*/
	FUNCTION CAN_BE_EXPORTED_XML (PI_ID IN NUMBER) RETURN VARCHAR2;

END PKG_SIID_UTIL;

-- ===== BODY (PACKAGE BODY) =====

PACKAGE BODY PKG_SIID_UTIL AS
	/*
	-*
	-* ÚLTIMAS ALTERAÇÕES AO PACKAGE
	-*
	-*   DATA       AUTOR           DESCRIÇÃO
	-*   ========== =============== ===================================================
	-*   08-02-2006 JOSÉ VIEGAS     Acrescentado controlo de versões do package
	*/
	VERSAO         CONSTANT NUMBER:=001;
	DATA_VERSAO    CONSTANT DATE:= TO_DATE('24-03-2010 18:00','DD-MM-YYYY HH24:MI');
	AUTOR_PACKAGE  CONSTANT VARCHAR2(100):='Eng. Jose Viegas';
	AUTOR_VERSAO   CONSTANT VARCHAR2(100):='JOSE VIEGAS';
	/*
	-* NOME      : GET_PACKINFO
	-* OBJECTIVO : MANTER INFORMAÇÃO SOBRE VERSÃO DO PACKAGE
	-* UTILIZACAO: PKG_FORMULAS_COSEC.GET_PACKINFO('VERSAO');
	-* AUTOR     : Eng. Jose Viegas
	-* DATA      : 08-02-2006
	-* VERSÃO    : 1.0
	-*
	-* ÚLTIMAS ALTERAÇÕES
	-*
	-*   DATA       AUTOR           DESCRIÇÃO
	-*   ========== =============== =================================================
	-*
	-*/
	FUNCTION GET_PACKINFO (P_TIPO_INFO VARCHAR2 DEFAULT 'COMPLETE') RETURN VARCHAR2 IS
		AUX VARCHAR2(200);
	BEGIN
		IF P_TIPO_INFO = INFO_VERSAO THEN  /* DEVOLVE VERSÃO DO PACKAGE */
			RETURN 'v'||TO_CHAR(VERSAO);
		ELSIF P_TIPO_INFO = INFO_DATA_VERSAO THEN
			RETURN TO_CHAR(DATA_VERSAO,'YYYY-MM-DD HH24:MI');
		ELSIF P_TIPO_INFO = INFO_AUTOR_PACKAGE THEN
			RETURN AUTOR_PACKAGE;
		ELSIF P_TIPO_INFO = INFO_AUTOR_VERSAO THEN
			RETURN AUTOR_VERSAO;
		ELSIF P_TIPO_INFO = INFO_DATA_PACKAGE THEN
			BEGIN
				SELECT TO_CHAR(CREATED, 'YYYY-MM-DD HH24:MI')
				INTO AUX
				FROM ALL_OBJECTS
				WHERE OBJECT_NAME = 'PKG_FORMULAS_COSEC'
					AND OBJECT_TYPE = 'PACKAGE BODY'
					AND OWNER = (
						SELECT USERNAME
						FROM USER_USERS
						);

				RETURN AUX;
				EXCEPTION
					WHEN OTHERS THEN
						RETURN 'PKG_FORMULAS_COSEC v'||VERSAO||'('||TO_CHAR(DATA_VERSAO,'YYMMDDHH24MI')||')';
			END;
		ELSIF P_TIPO_INFO = INFO_DATA_INSTALACAO THEN
			BEGIN
				SELECT TO_CHAR(LAST_DDL_TIME, 'YYYY-MM-DD HH24:MI')
				INTO AUX
				FROM ALL_OBJECTS
				WHERE OBJECT_NAME = 'PKG_FORMULAS_COSEC'
					AND OBJECT_TYPE = 'PACKAGE BODY'
					AND OWNER = (
						SELECT USERNAME
						FROM USER_USERS
						);

				RETURN AUX;
				EXCEPTION
					WHEN OTHERS THEN
						RETURN 'PKG_FORMULAS_COSEC v'||VERSAO||'('||TO_CHAR(DATA_VERSAO,'YYMMDDHH24MI')||')';
			END;
		ELSIF P_TIPO_INFO = INFO_OWNER THEN
			SELECT USERNAME
			INTO AUX
			FROM USER_USERS;

			RETURN AUX;
		ELSE
			RETURN 'PKG_FORMULAS_COSEC v'||VERSAO||'('||TO_CHAR(DATA_VERSAO,'YYMMDDHH24MI')||')';
		END IF;
	END GET_PACKINFO;

	/*
	-* NOME      : GET_QUEUE_GERACAO
	-* OBJECTIVO : RETORNA A ULTIMA QUEUE DE GERAÇÃO DE UM DOCUMENTO
	-* UTILIZACAO: PKG_SIID_UTIL.GET_QUEUE_GERACAO(DOC_ID);
	-* AUTOR     : JOSE VIEGAS
	-* DATA      : 24-03-2010
	-* VERSÃO    : 1.0
	-*
	-* ÚLTIMAS ALTERAÇÕES
	-*
	-*   DATA       AUTOR           DESCRIÇÃO
	-*   ========== =============== =================================================
	-*
	-*/
	FUNCTION GET_QUEUE_GERACAO (PI_DOC_ID IN NUMBER, PI_ESTADO IN VARCHAR2 DEFAULT 'TERMINADO') RETURN NUMBER
	IS
		L_AUX NUMBER;
	BEGIN
		SELECT MAX(ID)
		INTO L_AUX
		FROM svr_queue x
		WHERE x.documento_id = PI_DOC_ID
			AND x.tipo_queue_rf = 'EXECUCAO'
			AND x.estado = PI_ESTADO;


		RETURN NVL(L_AUX,-1);

		EXCEPTION
			WHEN OTHERS THEN
				RETURN -1;
	END GET_QUEUE_GERACAO;

	/*
	-* NOME      : GET_EXISTS_QUEUE_I
	-* OBJECTIVO : RETORNA A ULTIMA QUEUE DE GERAÇÃO DE UM DOCUMENTO
	-* UTILIZACAO: PKG_SIID_UTIL.GET_EXISTS_QUEUE_I(DOCUMENT_ID);
	-* AUTOR     : Aldo TITA 
	-* DATA      : 25-03-2010
	-* VERSÃO    : 1.0
	-*
	-* ÚLTIMAS ALTERAÇÕES
	-*
	-*   DATA       AUTOR           DESCRIÇÃO
	-*   ========== =============== =================================================
	-*
	-*/
	FUNCTION EXISTS_QUEUE_IMPRESSAO (PI_DOC_ID IN NUMBER) RETURN NUMBER
	IS
		RET NUMBER;
	BEGIN
		SELECT count(*)
		INTO RET
		FROM svr_queue x
		WHERE x.documento_id = PI_DOC_ID
			AND x.tipo_queue_rf = 'IMPRESSAO';


		RETURN RET;
		EXCEPTION
			WHEN OTHERS THEN
				RETURN -1;
	END EXISTS_QUEUE_IMPRESSAO;

	  /*
	-* NOME      : CAN_BE_PRINTED
	-* OBJECTIVO : RETORNA INFORMAÇÃO BASEADO NO NEGÓCIO, SE O DOCUMENTO PODE SER IMPRESSO 
	-* UTILIZACAO: PKG_SIID_UTIL.CAN_BE_PRINTED(DOCUMENT_ID) > 0
	-* AUTOR     : JOSE VIEGAS 
	-* DATA      : 19-09-2014
	-* VERSÃO    : 1.0
	-*
	-* ÚLTIMAS ALTERAÇÕES
	-*
	-*   DATA       AUTOR           DESCRIÇÃO
	-*   ========== =============== =================================================
	-*   19-09-2014 JOSE VIEGAS     FUNÇAO QUE DEVOLVE 1 SE O DOCUMENTO POR REGRAS DE NEGÓCIO PUDER SER IMPRESSO
	-*/
	FUNCTION CAN_BE_PRINTED (PI_DOC_ID IN NUMBER) RETURN NUMBER
	IS
		vPARAM05 svr_documentos.PARAMETRO05%type;
		vPARAM06 svr_documentos.PARAMETRO06%type;
		vPARAM04 svr_documentos.PARAMETRO04%type;
		vPARAM07 svr_documentos.PARAMETRO07%type;
		vMODELO svr_documentos.modelo_id%type;
		vCDUNIECO CO_PROGAR.CDUNIECO%type;
		vCDRAMO CO_PROGAR.CDRAMO%type;
		vNMPOLIZA CO_PROGAR.NMPOLIZA%type;
		vNMGARANT CO_PROGAR.NMGARANT%type;
		vF76 number := 0;
		vAGE number := 0;
	BEGIN
		SELECT modelo_id
			,PARAMETRO05
			,PARAMETRO06
			,PARAMETRO04
			,PARAMETRO07
		INTO vMODELO
			,vPARAM05
			,vPARAM06
			,vPARAM04
			,vPARAM07
		FROM svr_documentos
		WHERE id = PI_DOC_ID;


		if Vmodelo not in ('R3.D25', 'R3.D25R','R3.D28', 'R3.D28R')
			then return 1;
		end if;

		vCDUNIECO := TO_NUMBER(vPARAM05);
		vCDRAMO := TO_NUMBER(vPARAM06);
		vNMPOLIZA := TO_NUMBER(vPARAM04);
		vNMGARANT := TO_NUMBER(vPARAM07);



		SELECT count(*)
		into vAGE
		FROM mpolizas APOLICE
			, (SELECT valor
				FROM svr_variaveis_siid
				WHERE TIPO_VARIAVEL_RF = 'PERIODO_GRACA'
				) a
		WHERE APOLICE.CDUNIECO = vCDUNIECO
			AND APOLICE.CDRAMO = vCDRAMO
			AND APOLICE.nmpoliza = vNMPOLIZA
			AND APOLICE.ESTADO = 'M'
			AND trunc(APOLICE.FEEMISIO) >= trunc(sysdate) - a.valor
		;

		if (vAGE = 0)
			then
				SELECT count(*)
				into vF76
				FROM co_usupolfu F76
					, CO_PROGAR GARANTIA
				WHERE F76.nmpoliza = GARANTIA.nmpoliza
					AND F76.ESTADO = 'M'
					AND F76.CDRAMO = GARANTIA.CDRAMO
					AND F76.CDUNIECO = GARANTIA.CDUNIECO
					AND F76.cdfuncion = '76'
					AND F76.swacceso = 'S'
					AND trunc(F76.FECHACCES) <= trunc(GARANTIA.FEREGISGAR)
					AND GARANTIA.CDUNIECO = vCDUNIECO
					AND GARANTIA.CDRAMO = vCDRAMO
					AND GARANTIA.nmpoliza = vNMPOLIZA
					AND GARANTIA.NMGARANT = vNMGARANT
				;
				if (vF76 = 0)
					then
						return 1;
				else
					return 0;
				end if;
		else
			return 0;
		end if;
	END CAN_BE_PRINTED;

	/*
	-* NOME      : CAN_BE_PRINTED
	-* OBJECTIVO : RETORNA INFORMAÇÃO BASEADO NO NEGÓCIO, SE O DOCUMENTO PODE SER IMPRESSO 
	-* UTILIZACAO: PKG_SIID_UTIL.CAN_BE_PRINTED(MODELO_ID, DATAACTUAL, PARAMETRO04, PARAMETRO05, PARAMETRO06, PARAMETRO07) > 0
	-* AUTOR     : JOSE VIEGAS 
	-* DATA      : 19-09-2014
	-* VERSÃO    : 1.0
	-*
	-* ÚLTIMAS ALTERAÇÕES
	-*
	-*   DATA       AUTOR           DESCRIÇÃO
	-*   ========== =============== =================================================
	-*   19-09-2014 JOSE VIEGAS     FUNÇAO QUE DEVOLVE 1 SE O DOCUMENTO POR REGRAS DE NEGÓCIO PUDER SER IMPRESSO
	-*/
	FUNCTION CAN_BE_PRINTED (PI_MODELO_ID   IN VARCHAR
                        , PI_DATAACTUAL  IN DATE
                        , PI_PARAMETRO04 IN VARCHAR
                        , PI_PARAMETRO05 IN VARCHAR
                        , PI_PARAMETRO06 IN VARCHAR
                        , PI_PARAMETRO07 IN VARCHAR) RETURN NUMBER
	IS
		vAGE number := 0;
		vValor number := 0;
		vFEREGISGAR DATE := null;
		vFECHACCES DATE := null;
		vFEEMISIO DATE := null;
		vFEEFECTO DATE := null;
	BEGIN
		IF PI_MODELO_ID in ('R3.D25', 'R3.D25R','R3.D28', 'R3.D28R') then 

			SELECT trunc(GARANTIA.FEREGISGAR) FEREGISGAR
			INTO vFEREGISGAR
			FROM CO_PROGAR GARANTIA
			WHERE GARANTIA.FENOTIF IS NULL
				AND GARANTIA.NMGARANT = PI_PARAMETRO07
				AND GARANTIA.nmpoliza = PI_PARAMETRO04
				AND GARANTIA.CDRAMO = PI_PARAMETRO06
				AND GARANTIA.CDUNIECO = PI_PARAMETRO05
				AND GARANTIA.swestado not in ('E');

			IF vFEREGISGAR is not null then

				SELECT MIN(FECHACCES)
				INTO vFECHACCES
				from (
					SELECT MIN(trunc(F76.FECHACCES)) FECHACCES
					FROM co_usupolfu F76
					WHERE F76.ESTADO = 'M'
						AND F76.cdfuncion = '76'
						AND F76.swacceso = 'S'
						AND F76.nmpoliza = PI_PARAMETRO04
						AND F76.CDRAMO = PI_PARAMETRO06
						AND F76.CDUNIECO = PI_PARAMETRO05
					group by trunc(F76.FECHACCES));

				IF (vFECHACCES > vFEREGISGAR or vFECHACCES is null) THEN

					SELECT valor
					INTO vValor
					FROM svr_variaveis_siid
					WHERE TIPO_VARIAVEL_RF = 'PERIODO_GRACA';

					SELECT MAX(trunc(APOLICE.FEEMISIO)) FEEMISIO
						, MAX(trunc(APOLICE.FEEFECTO)) FEEFECTO
					INTO vFEEMISIO
						, vFEEFECTO
					FROM mpolizas APOLICE
					WHERE APOLICE.ESTADO = 'M'
						AND APOLICE.nmpoliza = PI_PARAMETRO04
						AND APOLICE.CDRAMO = PI_PARAMETRO06
						AND APOLICE.CDUNIECO = PI_PARAMETRO05
						AND APOLICE.NMSUPLEM = (
							SELECT MAX(NMSUPLEM)
							FROM MPOLIZAS X
							WHERE X.CDUNIECO = APOLICE.CDUNIECO
								AND X.CDRAMO = APOLICE.CDRAMO
								AND X.ESTADO = APOLICE.ESTADO
								AND X.NMPOLIZA = APOLICE.NMPOLIZA
								AND X.NMSUPLEM <= TO_CHAR(PI_DATAACTUAL, 'J') || '99999999999'
							)
					GROUP BY APOLICE.CDUNIECO
						, APOLICE.CDRAMO
						, APOLICE.nmpoliza;

					IF (GREATEST(NVL(vFEEMISIO, NVL(vFEEFECTO, trunc(sysdate))), NVL(vFEEFECTO, NVL(vFEEMISIO, trunc(sysdate)))) <= trunc(sysdate) - vValor ) THEN
						RETURN 1;
					ELSE RETURN 0;
					END IF;
				ELSIF (vFEREGISGAR >= vFECHACCES) THEN
					RETURN 1;
				ELSE RETURN 0;
				END IF;
			ELSE RETURN 0;
			END IF;
	    END IF;

	    RETURN 1;
	END CAN_BE_PRINTED;

	/*
	-* NOME      : CAN_BE_UPLOADED_EDOC
	-* OBJECTIVO : RETORNA INFORMAÇÃO BASEADO NO NEGÓCIO, SE O DOCUMENTO PODE SER IMPRESSO 
	-* UTILIZACAO: PKG_SIID_UTIL.CAN_BE_UPLOADED_EDOC(SPOOL_ID) ? "W" : "I"
	-* AUTOR     : JOÂO RIEBIRO
	-* DATA      : 30-05-2018
	-* VERSÃO    : 1.0
	-*
	-* ÚLTIMAS ALTERAÇÕES
	-*
	-*   DATA       AUTOR           DESCRIÇÃO
	-*   ========== =============== =================================================
	-*/
	FUNCTION CAN_BE_UPLOADED_EDOC (PI_ID   IN NUMBER) RETURN NUMBER
	IS

		vValor number := 0;

	BEGIN

		SELECT /*+ ordered USE_NL(svr_doc edoc)*/
			count(*)
		INTO
			vValor
		FROM (
			SELECT /*+ ordered */
				doc.modelo_id
				,doc.id
				,doc.DATA_PEDIDO
				,CASE report.n_parametro
					WHEN 1
						THEN doc.parametro01
					WHEN 2
						THEN doc.parametro02
					WHEN 3
						THEN doc.parametro03
					WHEN 4
						THEN doc.parametro04
					WHEN 5
						THEN doc.parametro05
					WHEN 6
						THEN doc.parametro06
					WHEN 7
						THEN doc.parametro07
					WHEN 8
						THEN doc.parametro08
					WHEN 9
						THEN doc.parametro09
					WHEN 10
						THEN doc.parametro10
					WHEN 11
						THEN doc.parametro11
					WHEN 12
						THEN doc.parametro12
					WHEN 13
						THEN doc.parametro13
					WHEN 14
						THEN doc.parametro14
					WHEN 15
						THEN doc.parametro15
					WHEN 16
						THEN doc.parametro16
					WHEN 17
						THEN doc.parametro17
					WHEN 18
						THEN doc.parametro18
					WHEN 19
						THEN doc.parametro19
					WHEN 20
						THEN doc.parametro20
					ELSE NULL
					END VALOR_PARAMETRO
			FROM SVR_DOCUMENTOS doc
				,SVR_PARAMETROS_REPORT report
			WHERE 1 = 1
				AND doc.id = PI_ID
				AND report.nome = 'P_CDUNIECO'
				AND doc.report_id = report.report_id
				AND CASE report.n_parametro
					WHEN 1
						THEN doc.parametro01
					WHEN 2
						THEN doc.parametro02
					WHEN 3
						THEN doc.parametro03
					WHEN 4
						THEN doc.parametro04
					WHEN 5
						THEN doc.parametro05
					WHEN 6
						THEN doc.parametro06
					WHEN 7
						THEN doc.parametro07
					WHEN 8
						THEN doc.parametro08
					WHEN 9
						THEN doc.parametro09
					WHEN 10
						THEN doc.parametro10
					WHEN 11
						THEN doc.parametro11
					WHEN 12
						THEN doc.parametro12
					WHEN 13
						THEN doc.parametro13
					WHEN 14
						THEN doc.parametro14
					WHEN 15
						THEN doc.parametro15
					WHEN 16
						THEN doc.parametro16
					WHEN 17
						THEN doc.parametro17
					WHEN 18
						THEN doc.parametro18
					WHEN 19
						THEN doc.parametro19
					WHEN 20
						THEN doc.parametro20
					ELSE NULL
					END IS NOT NULL
			) svr_doc
			,DOC_ATRIBUTOS_EDOC edoc
		WHERE 1 = 1
			AND svr_doc.MODELO_ID = edoc.MODELO_ID
			AND svr_doc.VALOR_PARAMETRO = edoc.CDUNIECO
			AND svr_doc.DATA_PEDIDO BETWEEN edoc.DATA_INICIO
				AND edoc.DATA_FIM
		;

		IF (vValor>0) then
			return 1;
		else
			return 0;
		end if;

		EXCEPTION
			WHEN OTHERS THEN
		RETURN 0;

	END CAN_BE_UPLOADED_EDOC;

	/*
	-* NOME      : CAN_BE_EXPORTED_XML
	-* OBJECTIVO : RETORNA INFORMAÇÃO BASEADO NO NEGÓCIO, SE O DOCUMENTO PODE SER EXPORTADO E CRIADO O XML A ACOMPANHAR
	-* UTILIZACAO: PKG_SIID_UTIL.CAN_BE_EXPORTED_XML(SPOOL_ID) ? "S" : "N"
	-* AUTOR     : JOÂO RIEBIRO
	-* DATA      : 30-05-2018
	-* VERSÃO    : 1.0
	-*
	-* ÚLTIMAS ALTERAÇÕES
	-*
	-*   DATA       AUTOR           DESCRIÇÃO
	-*   ========== =============== =================================================
	-*/
	FUNCTION CAN_BE_EXPORTED_XML (PI_ID IN NUMBER) RETURN VARCHAR2
	IS

		vValor number := 0;

	BEGIN

		SELECT /*+ ordered USE_NL(svr_doc xml)*/
			count(*)
		INTO
			vValor
		FROM (
			SELECT /*+ ordered */
				doc.modelo_id
				,doc.id
				,doc.DATA_PEDIDO
				,CASE report.n_parametro
					WHEN 1
						THEN doc.parametro01
					WHEN 2
						THEN doc.parametro02
					WHEN 3
						THEN doc.parametro03
					WHEN 4
						THEN doc.parametro04
					WHEN 5
						THEN doc.parametro05
					WHEN 6
						THEN doc.parametro06
					WHEN 7
						THEN doc.parametro07
					WHEN 8
						THEN doc.parametro08
					WHEN 9
						THEN doc.parametro09
					WHEN 10
						THEN doc.parametro10
					WHEN 11
						THEN doc.parametro11
					WHEN 12
						THEN doc.parametro12
					WHEN 13
						THEN doc.parametro13
					WHEN 14
						THEN doc.parametro14
					WHEN 15
						THEN doc.parametro15
					WHEN 16
						THEN doc.parametro16
					WHEN 17
						THEN doc.parametro17
					WHEN 18
						THEN doc.parametro18
					WHEN 19
						THEN doc.parametro19
					WHEN 20
						THEN doc.parametro20
					ELSE NULL
					END VALOR_PARAMETRO
			FROM SVR_DOCUMENTOS doc
				,SVR_PARAMETROS_REPORT report
			WHERE 1 = 1
				AND doc.id = PI_ID
				AND report.nome = 'P_CDUNIECO'
				AND doc.report_id = report.report_id
				AND CASE report.n_parametro
					WHEN 1
						THEN doc.parametro01
					WHEN 2
						THEN doc.parametro02
					WHEN 3
						THEN doc.parametro03
					WHEN 4
						THEN doc.parametro04
					WHEN 5
						THEN doc.parametro05
					WHEN 6
						THEN doc.parametro06
					WHEN 7
						THEN doc.parametro07
					WHEN 8
						THEN doc.parametro08
					WHEN 9
						THEN doc.parametro09
					WHEN 10
						THEN doc.parametro10
					WHEN 11
						THEN doc.parametro11
					WHEN 12
						THEN doc.parametro12
					WHEN 13
						THEN doc.parametro13
					WHEN 14
						THEN doc.parametro14
					WHEN 15
						THEN doc.parametro15
					WHEN 16
						THEN doc.parametro16
					WHEN 17
						THEN doc.parametro17
					WHEN 18
						THEN doc.parametro18
					WHEN 19
						THEN doc.parametro19
					WHEN 20
						THEN doc.parametro20
					ELSE NULL
					END IS NOT NULL
			) svr_doc
			,DOC_XML_TEMPLATE xml
		WHERE 1 = 1
			AND svr_doc.MODELO_ID = xml.MODELO_ID
			AND svr_doc.VALOR_PARAMETRO = xml.CDUNIECO
			AND svr_doc.DATA_PEDIDO BETWEEN xml.DATA_INICIO
				AND xml.DATA_FIM
		;

		IF (vValor>0) then
			return 'S';
		else
			return 'N';
		end if;

		EXCEPTION
			WHEN OTHERS THEN
		RETURN 'N';

	END CAN_BE_EXPORTED_XML;

END PKG_SIID_UTIL;

-- PKG_EBOND_API (owner: SIID_TESTES)


-- ===== SPEC (PACKAGE) =====

PACKAGE "PKG_EBOND_API" AS
--* CONSTANTES PROPRIAS QUESTIONAR INFORMACÕES SOBRE PACKAGE
--*
--* CRIADO POR  : João Ribeiro
--* DATA CRIAÇÃO: 11-11-2024
--* OBSERVACÃO  : A) ESTA SECCÃO DEVE ESTAR NO INICIO DO PACKAGE SEMPRE
--*               B) SEMPRE QUE FOR EFECTUADA ALGUMA ALTERACÃO AO PACKAGE
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

-- Declaração do cursor para texto das clausulas do documento R2D41
TYPE T_CURSOR_R2D41 IS REF CURSOR;

--* CONSTANTES PROPRIAS PARA ERROS DO PACKAGE
--*
--* CRIADO POR  : João Ribeiro
--* DATA CRIAÇÃO: 11-11-2024
--* OBSERVACÃO  : 
--*               
--*

ERR_PARAMETROS_OBRIGATORIOS CONSTANT VARCHAR2(6):= 'SID001'; -- FALTAM PARAMETROS OBRIGATÓRIOS
ERR_DECLARACAO_INEXISTENTE  CONSTANT VARCHAR2(6):= 'SID002'; -- TIPO DECLARACAO INEXISTENTE
ERR_VIGENCIA_INEXISTENTE    CONSTANT VARCHAR2(6):= 'SID003'; -- TIPO VIGENCIA INEXISTENTE
ERR_CLAUSULAS_INEXISTENTES  CONSTANT VARCHAR2(6):= 'SID004'; -- NÃO EXISTEM CLAUSULAS PARA OS PARAMETROS INTRODUZIDOS
ERR_CLAUSULA_VAZIA          CONSTANT VARCHAR2(6):= 'SID005'; -- CLAUSULA VAZIA (SEM TEXTO OU TÍTULO)
ERR_REG_JA_EXISTE           CONSTANT VARCHAR2(6):= 'SID006'; -- TENTATIVA DE INSERÇÃO DE REGISTO DUPLICADO (VIOLAÇÃO CHAVE PRIMÁRIA)
ERR_ALINEA_INEXISTENTE      CONSTANT VARCHAR2(6):= 'SID007'; -- ALINEA INEXISTENTE PARA ATUALIZAÇÃO DOS TEMPLATES
ERR_ALINEA_CLAUSULA         CONSTANT VARCHAR2(6):= 'SID008'; -- A ALINEA APRESENTADA NÃO COINCIDE COM O TIPO DE DECLARAÇÃO E TIPO VIGENCIA NOS TEMPLATES
ERR_INSERT_CLAUSULA			    CONSTANT VARCHAR2(6):= 'SID009'; -- ERRO NA INSERÇÃO DA CLAUSULA NA TABELA GD_CLAUSULAS_R2D41
ERR_UPDATE_CLAUSULA			    CONSTANT VARCHAR2(6):= 'SID010'; -- ERRO NA ATUALIZAÇÃO DA CLAUSULA NA TABELA DOC_SECCOES_DOCUMENTO
ERR_TIPO_ALTERACAO			    CONSTANT VARCHAR2(6):= 'SID011'; -- TIPO DE ALTERAÇÃO NÃO DEFINIDO
ERR_EBOND_DOC_ID            CONSTANT VARCHAR2(6):= 'SID012'; -- EBOND_DOC_ID NÃO EXISTE. NÃO EXISTEM CLAUSULAS ASSOCIADAS AO ID EBOND (quando é feito pedido de geração)
ERR_EBOND_DOC_ID_APOLICE    CONSTANT VARCHAR2(6):= 'SID013'; -- O EBOND_DOC_ID NÃO ESTÁ ASSOCIADO À APÓLICE REGISTADA NA TABELA GD_CLAUSULAS_R2D41
ERR_NUM_RECIBO              CONSTANT VARCHAR2(6):= 'SID014'; -- NÃO EXISTE NENHUM RECIBO ASSOCIADO À APÓLICE INDICADA
ERR_EMISSAO_DOC             CONSTANT VARCHAR2(6):= 'SID015'; -- ERRO NA EMISSÃO DO DOCUMENTOS
ERR_CURSOR_VAZIO            CONSTANT VARCHAR2(6):= 'SID016'; -- O CURSOR NÃO CONTEM DADOS
ERR_MODIFICACAO_CLAUSULA    CONSTANT VARCHAR2(6):= 'SID017'; -- CLAUSULA NÃO PODE SER ACUTALIZADA NO MODELO R2D41 DE FORMA AUTOMÁTICA

ERR_OUTROS                  CONSTANT VARCHAR2(6):= 'SID999'; -- OCORRENCIA DE ERRO NÃO ESPECIFICADO

--* CONSTANTES PROPRIAS
--*
--* CRIADO POR  : João Ribeiro
--* DATA CRIAÇÃO: 11-11-2024
--* OBSERVACÃO  : 
--*               
--*

C_ALTERACAO_PROVISORIA CONSTANT VARCHAR2(1) := 'P';
C_ALTERACAO_DEFINITIVA CONSTANT VARCHAR2(1) := 'D';


/*
-* NOME      : GET_PACKINFO
-* OBJECTIVO : MANTER INFORMACÃO SOBRE VERSÃO DO PACKAGE
-* UTILIZACAO: PKG_FORMULAS_COSEC.GET_PACKINFO('VERSAO');
-* AUTOR     : Eng. Jose Viegas
-* DATA      : 25-11-2004
-* VERSÃO    : 1.0
-*
-* ULTIMAS ALTERAÇÕES
-*
-*   DATA       AUTOR           DESCRICÃO
-*   ========== =============== =================================================
-*
-*/
FUNCTION GET_PACKINFO (PI_TIPO_INFO VARCHAR2 DEFAULT 'COMPLETE') RETURN VARCHAR2;

/*
-* NOME      : GET_CLAUSULAS_R2D41
-* OBJECTIVO : Retorna as clausulas do documento R2.D41 associados ao tipo de declaração da apólice e tipo de vigência
-* UTILIZACAO: PKG_EBOND_API.GET_CLAUSULAS_R2D41(
-*           : PI_UE -> numero da unidade económica
-*           : PI_RAMO -> numero do produto da apólice
-*           : PI_APOLICE -> numero da apólice se existir
-*           : PI_TIPO_DECLARACAO -> "numero do tipo de declaração de garantia (TDEGARA)" que identifica as cláusulas
-*           : PI_TIPO_VIGENCIA -> "numero do tipo de vigência da apólice (TIVICAU)" que identifica as cláusulas
-*           : PO_CURSOR_R2D41 -> é o cursor de saida com select dos clausulas do documento R2D41
-*           : PO_ERRCODE -> CÓDIGO DE ERRO, preenchido apenas quando houver erro na execução do PROCEDIMENTO
-*           : )
-* AUTOR     : João Ribeiro
-* DATA      : 11-11-2024
-* VERSÃO    : 1.0
-*
-* ULTIMAS ALTERAÇÕES
-*
-*   DATA       AUTOR           DESCRICÃO
-*   ========== =============== =================================================
-*
-*/

PROCEDURE GET_CLAUSULAS_R2D41 ( PI_UE              IN NUMBER
                              , PI_RAMO            IN NUMBER
                              , PI_APOLICE         IN NUMBER DEFAULT NULL
                              , PI_TIPO_DECLARACAO IN VARCHAR2
															, PI_TIPO_VIGENCIA   IN VARCHAR2
															, PO_CURSOR_R2D41    OUT T_CURSOR_R2D41
															, PO_ERRCODE         OUT VARCHAR2);

/*
-* NOME      : SET_CLAUSULA_R2D41
-* OBJECTIVO : Insere uma clausula vindo do EBOND para a tabela das clausulas do documento R2.D41.
-* UTILIZACAO: PKG_EBOND_API.GET_CLAUSULAS_R2D41( 
-*           : PI_UE -> numero da unidade económica
-*           : PI_RAMO -> numero do produto da apólice
-*           : PI_APOLICE -> numero da apólice (não obrigatório)
-*           : PI_TIPO_DECLARACAO -> numero do tipo de declaração
-*           : PI_TIPO_VIGENCIA -> numero do tipo de vigencia da apólice a tratar
-*           : PI_EBOND_DOC_ID -> identificação da alteração das clausulas do documento
-*           : PI_ALINEA -> numero da alinea da clausula
-*           : PI_N_ORDEM -> numero de ordenação de apresentação da alinea da clausula para as clausulas não permanetes
-*           : PI_TITULO -> numero/referência da alinea da clausula (eg : "1.1", "a)", "3.b"...)
-*           : PI_TEXTO -> texto da cláusula
-*           : PI_TIPO_ALTERACAO_RF -> Deve actualizar a tabela das secções do modelo R2D41? ([P]rovisório/[D]efinitivo)
-*           : PI_USER -> utilizador que registou a clausula
-*           : PO_ERRCODE -> CÓDIGO DE ERRO, preenchido apenas quando houver erro na execução do PROCEDIMENTO
-*           : )
-* AUTOR     : João Ribeiro
-* DATA      : 11-11-2024
-* VERSÃO    : 1.0
-*
-* ULTIMAS ALTERAÇÕES
-*
-*   DATA       AUTOR           DESCRICÃO
-*   ========== =============== =================================================
-*
-*/

PROCEDURE SET_CLAUSULA_R2D41 ( PI_UE                  IN NUMBER
														 , PI_RAMO                IN NUMBER
														 , PI_APOLICE             IN NUMBER DEFAULT NULL
														 , PI_TIPO_DECLARACAO     IN VARCHAR2
														 , PI_TIPO_VIGENCIA       IN VARCHAR2
														 , PI_EBOND_DOC_ID        IN NUMBER
														 , PI_ALINEA              IN NUMBER DEFAULT NULL
														 , PI_N_ORDEM             IN NUMBER
														 , PI_TITULO              IN VARCHAR2
														 , PI_TEXTO               IN VARCHAR2
														 , PI_TIPO_ALTERACAO_RF   IN VARCHAR DEFAULT 'P'
														 , PI_USER                IN VARCHAR2
														 , PO_ERRCODE             OUT VARCHAR2
														 );

/*
-* NOME      : GERA_R2D41
-* OBJECTIVO : Gerar o documento R2.D41 com as clausulas alteradas
-* UTILIZACAO: PKG_EBOND_API.GERA_R2D41( 
-*           : PI_UE -> numero da unidade económica
-*           : PI_RAMO -> numero do produto da apólice
-*           : PI_APOLICE -> numero da apólice
-*           : PI_EBOND_DOC_ID -> identificação da alteração das clausulas do documento
-*           : PI_USER -> utilizador que registou a clausula
-*           : PO_ERRCODE -> CÓDIGO DE ERRO, preenchido apenas quando houver erro na execução do PROCEDIMENTO
-*           : )
-* AUTOR     : João Ribeiro
-* DATA      : 11-11-2024
-* VERSÃO    : 1.0
-*
-* ULTIMAS ALTERAÇÕES
-*
-*   DATA       AUTOR           DESCRICÃO
-*   ========== =============== =================================================
-*
-*/

PROCEDURE GERA_R2D41 ( PI_UE           IN NUMBER
                     , PI_RAMO         IN NUMBER
										 , PI_APOLICE      IN NUMBER
										 , PI_EBOND_DOC_ID IN NUMBER
										 , PI_USER         IN VARCHAR2
										 , PO_ERRCODE      OUT VARCHAR2
										 );

END PKG_EBOND_API;

-- ===== BODY (PACKAGE BODY) =====

PACKAGE BODY "PKG_EBOND_API" AS
/*
-*
-* ULTIMAS ALTERAÇÕES AO PACKAGE
-*
-*   DATA       AUTOR           DESCRICÃO
-*   ========== =============== ===================================================
-*   15-11-2024 João Ribeiro     Criação do Package
*/

  VERSAO         CONSTANT NUMBER:=001;
  DATA_VERSAO    CONSTANT DATE:= TO_DATE('15-11-2024 18:00','DD-MM-YYYY HH24:MI');
  AUTOR_PACKAGE  CONSTANT VARCHAR2(100):='João Ribeiro';
  AUTOR_VERSAO   CONSTANT VARCHAR2(100):='João Ribeiro';

/*
-* NOME      : GET_PACKINFO
-* OBJECTIVO : MANTER INFORMAÇÃO SOBRE VERSÃO DO PACKAGE
-* UTILIZAÇÃO: PKG_FORMULAS_COSEC.GET_PACKINFO('VERSAO');
-* AUTOR     : Eng. Jose Viegas
-* DATA      : 08-02-2006
-* VERSÃO    : 1.0
-*
-* ULTIMAS ALTERAÇÕES
-*
-*   DATA       AUTOR           DESCRICÃO
-*   ========== =============== =================================================
-*
-*/
  FUNCTION GET_PACKINFO (PI_TIPO_INFO VARCHAR2 DEFAULT 'COMPLETE') RETURN VARCHAR2 IS
    AUX VARCHAR2(200);
  BEGIN
    IF PI_TIPO_INFO = INFO_VERSAO THEN  /* DEVOLVE VERS?O DO PACKAGE */
      RETURN 'v'||TO_CHAR(VERSAO);
    ELSIF PI_TIPO_INFO = INFO_DATA_VERSAO THEN
      RETURN TO_CHAR(DATA_VERSAO,'YYYY-MM-DD HH24:MI');
    ELSIF PI_TIPO_INFO = INFO_AUTOR_PACKAGE THEN
      RETURN AUTOR_PACKAGE;
    ELSIF PI_TIPO_INFO = INFO_AUTOR_VERSAO THEN
      RETURN AUTOR_VERSAO;
    ELSIF PI_TIPO_INFO = INFO_DATA_PACKAGE THEN
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
    ELSIF PI_TIPO_INFO = INFO_DATA_INSTALACAO THEN
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
    ELSIF PI_TIPO_INFO = INFO_OWNER THEN
      SELECT USERNAME
			INTO AUX
			FROM USER_USERS;

      RETURN AUX;
    ELSE
      RETURN 'PKG_FORMULAS_COSEC v'||VERSAO||'('||TO_CHAR(DATA_VERSAO,'YYMMDDHH24MI')||')';
    END IF;
  END GET_PACKINFO;


	/*
-* NOME      : CHECK_TIPO_DECLARACAO
-* OBJECTIVO : Função que verifica que o tipo de declaração é válido com o que está parametrizado no gador
-* UTILIZAÇÃO: De utilização interna do PACKAGE
-*           : CHECK_TIPO_DECLARACAO(
-*           : PI_TIPO_DECLARACAO -> numero do tipo de declaração de garantia (TDEGARA)
-*           : );
-* AUTOR     : João Ribeiro
-* DATA      : 15-11-2024
-* VERSÃO    : 1.0
-*
-* ULTIMAS ALTERAÇÕES
-*
-*   DATA       AUTOR           DESCRICÃO
-*   ========== =============== =================================================
-*
-*/

	FUNCTION CHK_TIPO_DECLARACAO ( PI_TIPO_DECLARACAO IN VARCHAR2 ) RETURN BOOLEAN
	IS

	v_count number;

	BEGIN

		SELECT 1
		INTO v_count
		FROM dual
		WHERE EXISTS (
				SELECT 1
				FROM TTAPVAAT LINHAS
					,TTAPTABL TABS
				WHERE LINHAS.NMTABLA = TABS.NMTABLA
					AND TABS.CDTABLA = 'TDEGARA'
					AND LINHAS.otclave1 = PI_TIPO_DECLARACAO
					AND sysdate BETWEEN LINHAS.FEDESDE
						AND NVL(LINHAS.FEHASTA, to_date('31122099', 'ddmmyyyy'))
				)
		;

		RETURN true;

	EXCEPTION
			WHEN OTHERS THEN
				return FALSE;
	end;

/*
-* NOME      : CHECK_TIPO_VIGENCIA
-* OBJECTIVO : Função que verifica que o tipo de vigência da apólice é válido com o que está parametrizado no gador
-* UTILIZAÇÃO: De utilização interna do PACKAGE
-*           : CHECK_TIPO_VIGENCIA(
-*           : PI_TIPO_VIGENCIA -> numero do tipo de vigência da apólice (TIVICAU)
-*           : );
-* AUTOR     : João Ribeiro
-* DATA      : 15-11-2024
-* VERSÃO    : 1.0
-*
-* ULTIMAS ALTERAÇÕES
-*
-*   DATA       AUTOR           DESCRICÃO
-*   ========== =============== =================================================
-*
-*/

	FUNCTION CHK_TIPO_VIGENCIA ( PI_TIPO_VIGENCIA IN VARCHAR2 ) RETURN BOOLEAN 
	IS

	v_count number;

	BEGIN

		SELECT 1
		INTO v_count
		FROM dual
		WHERE EXISTS (
				SELECT 1
				FROM TTAPVAAT LINHAS
					,TTAPTABL TABS
				WHERE LINHAS.NMTABLA = TABS.NMTABLA
					AND TABS.CDTABLA = 'TIVICAU'
					AND LINHAS.otclave1 = PI_TIPO_VIGENCIA
					AND sysdate BETWEEN LINHAS.FEDESDE
						AND NVL(LINHAS.FEHASTA, to_date('31122099', 'ddmmyyyy'))
				)
    ;

		RETURN true;

	EXCEPTION
			WHEN OTHERS THEN
				return FALSE;
	end;

/*
-* NOME      : CHK_CONFIGURACAO_CLAUSULAS
-* OBJECTIVO : Função que verifica se a conjugação dos parametros obtem clausulas nos templates
-* UTILIZAÇÃO: De utilização interna do PACKAGE
-*           : CHK_CONFIGURACAO_CLAUSULAS(
-*           : PI_RAMO -> numero do produto da apólice
-*           : PI_TIPO_DECLARACAO -> "numero do tipo de declaração de garantia (TDEGARA)" que identifica as cláusulas
-*           : PI_TIPO_VIGENCIA -> "numero do tipo de vigência da apólice (TIVICAU)" que identifica as cláusulas
-*           : );
-* AUTOR     : João Ribeiro
-* DATA      : 15-11-2024
-* VERSÃO    : 1.0
-*
-* ULTIMAS ALTERAÇÕES
-*
-*   DATA       AUTOR           DESCRICÃO
-*   ========== =============== =================================================
-*
-*/

	FUNCTION CHK_CONFIGURACAO_CLAUSULAS ( PI_UE IN NUMBER, PI_RAMO IN NUMBER, PI_TIPO_DECLARACAO IN VARCHAR2, PI_TIPO_VIGENCIA IN VARCHAR2 ) RETURN BOOLEAN 
	IS

	v_count number;

	BEGIN

	/*
		A COMBINAÇÃO PI_TIPO_DECLARAÇÃO + PI_TIPO_VIGÊNCIA É VÁLIDA?
	*/
		SELECT 1
		INTO v_count
		FROM dual
		WHERE EXISTS (
				SELECT 1
				FROM DOC_CONDICOES_APR CONDICOES
				WHERE 1 = 1
					AND CONDICOES.ALINEA != 10
					AND CONDICOES.CDUNIECO = PI_UE
					AND CONDICOES.MODELO_ID = 'R2.D41'
					AND CONDICOES.TIPOSEC_ID = 'CLAUS'
					AND CONDICOES.ATRIBUTO8 = PI_TIPO_DECLARACAO
					AND (
						/* OU A COMBINAÇÃO PI_TIPO_DECLARACAO + PI_TIPO_VIGÊNCIA É VÁLIDA */
						CONDICOES.ATRIBUTO7 = PI_TIPO_VIGENCIA
						OR
						/* OU O TIPO DE DECLARACAO NÃO TEM CLAUSULAS CONFIGURADAS POR TIPO DE VIGÊNCIA */
						NOT EXISTS (
							SELECT 1
							FROM DOC_CONDICOES_APR X
							WHERE X.ALINEA != 10
								AND X.MODELO_ID = CONDICOES.MODELO_ID
								AND X.TIPOSEC_ID = CONDICOES.TIPOSEC_ID
								AND X.CDUNIECO = CONDICOES.CDUNIECO
								AND X.CDRAMO = CONDICOES.CDRAMO
								AND X.ATRIBUTO8 = CONDICOES.ATRIBUTO8
								AND X.ATRIBUTO7 IS NOT NULL
								AND sysdate BETWEEN DATA_INICIO
									AND NVL(DATA_FIM, to_date('31122099', 'ddmmyyyy'))
							)
						)
					AND sysdate BETWEEN DATA_INICIO
						AND NVL(DATA_FIM, to_date('31122099', 'ddmmyyyy'))
					);


		RETURN true;

	EXCEPTION
			WHEN OTHERS THEN
				return FALSE;
	end;

/*
-* NOME      : CHECK_ALINEA_DECLARACAO
-* OBJECTIVO : Função que verifica que a alinea a atualizar na doc_seccoes_documento é para o tipo de declaração e tipo de vigencia associado
-* UTILIZAÇÃO: De utilização interna do PACKAGE
-*           : CHECK_ALINEA_DECLARACAO(
-*           : PI_RAMO -> numero do produto da apólice
-*           : PI_TIPO_DECLARACAO -> "numero do tipo de declaração de garantia (TDEGARA)" que identifica as cláusulas
-*           : PI_TIPO_VIGENCIA -> "numero do tipo de vigência da apólice (TIVICAU)" que identifica as cláusulas
-*           : PI_ALINEA -> Ordem de apresentação da Cláusula para o template do documento R2D41 (Cláusula Permanente)
-*           : );
-* AUTOR     : João Ribeiro
-* DATA      : 15-11-2024
-* VERSÃO    : 1.0
-*
-* ULTIMAS ALTERAÇÕES
-*
-*   DATA       AUTOR           DESCRICÃO
-*   ========== =============== =================================================
-*
-*/

	FUNCTION CHK_CONFIGURACAO_ALINEA ( PI_UE IN NUMBER, PI_RAMO IN NUMBER, PI_TIPO_DECLARACAO IN VARCHAR2, PI_TIPO_VIGENCIA IN VARCHAR2, PI_ALINEA IN NUMBER ) RETURN BOOLEAN
	IS

	v_count number;

	BEGIN

		SELECT 1
		INTO v_count
		FROM dual
		WHERE EXISTS (
				SELECT 1
				FROM DOC_CONDICOES_APR CONDICOES
				WHERE 1 = 1
					AND CONDICOES.ALINEA != 10
					AND CONDICOES.CDUNIECO = PI_UE
					AND CONDICOES.MODELO_ID = 'R2.D41'
					AND CONDICOES.TIPOSEC_ID = 'CLAUS'
					AND PI_TIPO_VIGENCIA LIKE NVL(CONDICOES.ATRIBUTO7, '%')
					AND CONDICOES.ATRIBUTO8 = PI_TIPO_DECLARACAO
					AND CONDICOES.ALINEA = PI_ALINEA
					AND PI_RAMO LIKE CONDICOES.CDRAMO
					AND sysdate BETWEEN CONDICOES.DATA_INICIO
						AND NVL(CONDICOES.DATA_FIM, to_date('31122099', 'ddmmyyyy'))
				);

		RETURN true;

	EXCEPTION
			WHEN OTHERS THEN
					RETURN FALSE;

	end;


/*
-* NOME      : CHECK_EBOND_DOC_ID
-* OBJECTIVO : Função que verifica se o EBOND_DOC_ID já se encontra gravado na tabela GD_CLAUSULAS_R2D41
-* UTILIZAÇÃO: De utilização interna do PACKAGE
-*           : CHECK_EBOND_DOC_ID(
-*           : PI_EBOND_DOC_ID -> Número Interno do sistema EBOND para o documento de cláusulas da apólice
-*           : );
-* AUTOR     : João Ribeiro
-* DATA      : 15-11-2024
-* VERSÃO    : 1.0
-*
-* ULTIMAS ALTERAÇÕES
-*
-*   DATA       AUTOR           DESCRICÃO
-*   ========== =============== =================================================
-*
-*/

	FUNCTION CHK_EBOND_DOC_ID ( PI_EBOND_DOC_ID IN NUMBER) RETURN BOOLEAN
	IS

	v_count number;

	BEGIN

		SELECT 1
		INTO v_count
		FROM dual
		WHERE EXISTS (
				SELECT 1
				FROM GD_CLAUSULAS_R2D41
				WHERE 1 = 1
					AND EBOND_DOC_ID = PI_EBOND_DOC_ID
				);

		RETURN true;

	EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;

	end;

/*
-* NOME      : CHECK_EBOND_DOC_ID_APOLICE
-* OBJECTIVO : Função que verifica se o EBOND_DOC_ID já se encontra gravado na tabela GD_CLAUSULAS_R2D41 e se corresponde à apólice gravada
-* UTILIZAÇÃO: De utilização interna do PACKAGE
-*           : CHECK_EBOND_DOC_ID_APOLICE(
-*           : PI_UE -> numero da unidade económica
-*           : PI_RAMO -> numero do produto da apólice
-*           : PI_APOLICE -> numero da apólice
-*           : PI_EBOND_DOC_ID -> identificação da alteração das clausulas do documento
-*           : );
-* AUTOR     : João Ribeiro
-* DATA      : 15-11-2024
-* VERSÃO    : 1.0
-*
-* ULTIMAS ALTERAÇÕES
-*
-*   DATA       AUTOR           DESCRICÃO
-*   ========== =============== =================================================
-*
-*/

	FUNCTION CHK_EBOND_DOC_ID_APOLICE (PI_UE IN NUMBER, PI_RAMO IN NUMBER, PI_APOLICE IN NUMBER, PI_EBOND_DOC_ID IN NUMBER) RETURN BOOLEAN
	IS

	v_count number;

	BEGIN

		SELECT 1
		INTO v_count
		FROM dual
		WHERE EXISTS (
				SELECT 1
				FROM GD_CLAUSULAS_R2D41
				WHERE 1 = 1
					AND UE = PI_UE
					AND RAMO = PI_RAMO
					AND APOLICE = PI_APOLICE
					AND EBOND_DOC_ID = PI_EBOND_DOC_ID
				);

		RETURN true;

	EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;

	end;

/*
-* NOME      : GET_NUM_RECIBO
-* OBJECTIVO : Função que retorna o numero de recibo (nmrecibo) do aviso de prémio mais recente da apólice indicada
-* UTILIZAÇÃO: De utilização interna do PACKAGE
-*           : GET_NUM_RECIBO(
-*           : PI_UE -> numero da unidade económica
-*           : PI_RAMO -> numero do produto da apólice
-*           : PI_APOLICE -> numero da apólice
-*           : );
-* AUTOR     : João Ribeiro
-* DATA      : 15-11-2024
-* VERSÃO    : 1.0
-*
-* ULTIMAS ALTERAÇÕES
-*
-*   DATA       AUTOR           DESCRICÃO
-*   ========== =============== =================================================
-*
-*/

	FUNCTION GET_NUM_RECIBO (PI_UE IN NUMBER, PI_RAMO IN NUMBER, PI_APOLICE IN NUMBER) RETURN NUMBER
	IS

	v_recibo MRECIBO.NMRECIBO%TYPE;

	BEGIN

		BEGIN

			SELECT max(rec.nmrecibo)
			INTO v_recibo
			FROM mrecibo rec
				,co_saftdoc saft
			WHERE 1 = 1
				AND rec.cdunieco = saft.cdunieco
				AND rec.nmrecibo = saft.nmrecibo
				AND saft.cdgrsaft = 'A'
				AND saft.cdserie like 'AVP%/'
				AND rec.cdunieco = PI_UE
				AND rec.cdramo = PI_RAMO
				AND rec.nmpoliza = PI_APOLICE
			ORDER BY rec.nmrecibo DESC;

		EXCEPTION
			WHEN OTHERS THEN
				v_recibo := 0;
		end;


		return v_recibo;

	EXCEPTION
			WHEN OTHERS THEN
				return 0;
	end;

/*
-* NOME      : GET_ERRO_CURSOR
-* OBJECTIVO : Função que retorna um cursor vazio quando existe um erro no processo GET_CLAUSULAS_R2D41
-* UTILIZAÇÃO: De utilização interna do PACKAGE
-*           : GET_ERRO_CURSOR(
-*           : );
-* AUTOR     : João Ribeiro
-* DATA      : 15-11-2024
-* VERSÃO    : 1.0
-*
-* ULTIMAS ALTERAÇÕES
-*
-*   DATA       AUTOR           DESCRICÃO
-*   ========== =============== =================================================
-*
-*/

	FUNCTION GET_ERRO_CURSOR RETURN T_CURSOR_R2D41
	IS

	v_cursor_erro T_CURSOR_R2D41;

	BEGIN

		OPEN v_cursor_erro FOR
				select to_number(null) UE, NULL alinea, NULL titulo, NULL texto from dual where 1 = 0;


		return v_cursor_erro;

	EXCEPTION
			WHEN OTHERS THEN
				return null;
	end;


/*
-* NOME      : GET_CLAUSULAS_R2D41
-* OBJECTIVO : Retorna as clausulas do documento R2.D41 associados ao tipo de declaração da apólice e tipo de vigência
-* UTILIZACAO: PKG_EBOND_API.GET_CLAUSULAS_R2D41(
-*           : PI_UE -> numero da unidade económica
-*           : PI_RAMO -> numero do produto da apólice
-*           : PI_APOLICE -> numero da apólice se existir
-*           : PI_TIPO_DECLARACAO -> "numero do tipo de declaração de garantia (TDEGARA)" que identifica as cláusulas
-*           : PI_TIPO_VIGENCIA -> "numero do tipo de vigência da apólice (TIVICAU)" que identifica as cláusulas
-*           : PO_CURSOR_R2D41 -> é o cursor de saida com select dos clausulas do documento R2D41
-*           : PO_ERRCODE -> CÓDIGO DE ERRO, preenchido apenas quando houver erro na execução do PROCEDIMENTO
-*           : )
-* AUTOR     : João Ribeiro
-* DATA      : 11-11-2024
-* VERSÃO    : 1.0
-*
-* ULTIMAS ALTERAÇÕES
-*
-*   DATA       AUTOR           DESCRICÃO
-*   ========== =============== =================================================
-*
-*/

	PROCEDURE GET_CLAUSULAS_R2D41 ( PI_UE              IN NUMBER
                              , PI_RAMO            IN NUMBER
                              , PI_APOLICE         IN NUMBER DEFAULT NULL
                              , PI_TIPO_DECLARACAO IN VARCHAR2
															, PI_TIPO_VIGENCIA   IN VARCHAR2
															, PO_CURSOR_R2D41    OUT T_CURSOR_R2D41
															, PO_ERRCODE         OUT VARCHAR2)

	IS
    t_apolice varchar2(20) := null;
		v_cursor T_CURSOR_R2D41;
		t_erro varchar2(2000) := null;

	BEGIN

    if PI_APOLICE is not null THEN
      t_apolice := ' - '|| PI_APOLICE;
    end if;

		PKG_LOG_ERRO.WRITE('ERRO_EBOND','CHAMADA AO PKG_EBOND_API.GET_CLAUSULAS_R2D41 '||PI_UE||' - '||PI_RAMO||' - '||PI_TIPO_DECLARACAO||' - '||PI_TIPO_VIGENCIA||t_apolice,'R2.D41 - EBOND');

		if PI_UE is null or PI_RAMO is null or PI_TIPO_DECLARACAO is null or PI_TIPO_VIGENCIA is null THEN
			t_erro := 'Falta de parâmetros de entrada obrigatórios no GET_CLAUSULAS_R2D41';

			if PI_UE is null then
				t_erro := t_erro || ', PI_UE em falta';
			end if;
			if PI_RAMO is null then
				t_erro := t_erro || ', PI_RAMO em falta';
			end if;
			if PI_TIPO_DECLARACAO is null then
				t_erro := t_erro || ', PI_TIPO_DECLARACAO em falta';
			end if;
			if PI_TIPO_VIGENCIA is null then
				t_erro := t_erro || ', PI_TIPO_VIGENCIA em falta';
			end if;

			t_erro := t_erro || '.';

			PKG_LOG_ERRO.WRITE('ERRO_EBOND',t_erro,'R2.D41 - EBOND');
			PO_CURSOR_R2D41 := GET_ERRO_CURSOR;
			PO_ERRCODE := ERR_PARAMETROS_OBRIGATORIOS;
			return;
		end if;

		if NOT CHK_TIPO_DECLARACAO(PI_TIPO_DECLARACAO) THEN
			PKG_LOG_ERRO.WRITE('ERRO_EBOND','Tipo de declaração não parametrizado no GET_CLAUSULAS_R2D41','R2.D41 - EBOND');
			PO_CURSOR_R2D41 := GET_ERRO_CURSOR;
			PO_ERRCODE := ERR_DECLARACAO_INEXISTENTE;
			return;
		end if;

		if NOT CHK_TIPO_VIGENCIA(PI_TIPO_VIGENCIA) THEN
			PKG_LOG_ERRO.WRITE('ERRO_EBOND','Tipo de vigência não parametrizado no GET_CLAUSULAS_R2D41','R2.D41 - EBOND');
			PO_CURSOR_R2D41 := GET_ERRO_CURSOR;
			PO_ERRCODE := ERR_VIGENCIA_INEXISTENTE;
			return;
		end if;

		if NOT CHK_CONFIGURACAO_CLAUSULAS(PI_UE, PI_RAMO, PI_TIPO_DECLARACAO, PI_TIPO_VIGENCIA) THEN
			PKG_LOG_ERRO.WRITE('ERRO_EBOND','Conjugação de parametros não devolve clausulas no GET_CLAUSULAS_R2D41','R2.D41 - EBOND');
			PO_CURSOR_R2D41 := GET_ERRO_CURSOR;
			PO_ERRCODE := ERR_CLAUSULAS_INEXISTENTES;
			return;
		end if;

		BEGIN
      OPEN v_cursor FOR
				SELECT CONDICOES.CDUNIECO UE
					,SECCOES.ALINEA
					,SECCOES.TITULO
					,SECCOES.TEXTO
				FROM DOC_SECCOES_DOCUMENTO SECCOES
					,DOC_CONDICOES_APR CONDICOES
				WHERE
					/**************RELAÇÕES *****************/
					SECCOES.MODELO_ID = 'R2.D41'
					AND SECCOES.TIPOSEC_ID = 'CLAUS'
					AND SECCOES.ALINEA != 10
					AND CONDICOES.CDUNIECO = PI_UE
					AND CONDICOES.MODELO_ID = SECCOES.MODELO_ID
					AND CONDICOES.TIPOSEC_ID = SECCOES.TIPOSEC_ID
					AND CONDICOES.ALINEA = SECCOES.ALINEA
					AND PI_TIPO_VIGENCIA LIKE NVL(CONDICOES.ATRIBUTO7, '%')
					AND PI_TIPO_DECLARACAO LIKE NVL(CONDICOES.ATRIBUTO8, '%')
					AND PI_RAMO LIKE CONDICOES.CDRAMO
					AND sysdate BETWEEN CONDICOES.DATA_INICIO
						AND NVL(CONDICOES.DATA_FIM, to_date('31122099', 'ddmmyyyy'))
				ORDER BY SECCOES.ALINEA;


    EXCEPTION 
			WHEN NO_DATA_FOUND THEN
				PKG_LOG_ERRO.WRITE('ERRO_EBOND','O cursor não obteve valores.','R2.D41 - EBOND');
				PO_CURSOR_R2D41 := GET_ERRO_CURSOR;
				PO_ERRCODE := ERR_CURSOR_VAZIO;
				return;
      WHEN OTHERS THEN
        PKG_LOG_ERRO.WRITE('ERRO_EBOND','Erro na execução do cursor. ' || SQLERRM,'R2.D41 - EBOND');
				PO_CURSOR_R2D41 := GET_ERRO_CURSOR;
				PO_ERRCODE := ERR_OUTROS;
				return;
    END;

		PO_CURSOR_R2D41 := v_cursor;

		PKG_LOG_ERRO.WRITE('ERRO_EBOND','Devolveu com sucesso as clausulas da declaração. '||PI_UE||' - '||PI_RAMO||' - '||PI_TIPO_DECLARACAO||' - '||PI_TIPO_VIGENCIA||t_apolice,'R2.D41 - EBOND');

	EXCEPTION
		WHEN OTHERS THEN
			PKG_LOG_ERRO.WRITE('ERRO_EBOND','Erro na execução do processo - GET_CLAUSULAS_R2D41. ' || SQLERRM,'R2.D41 - EBOND');
			PO_CURSOR_R2D41 := GET_ERRO_CURSOR;
			PO_ERRCODE := ERR_OUTROS;
	END GET_CLAUSULAS_R2D41;    


/*
-* NOME      : SET_CLAUSULA_R2D41
-* OBJECTIVO : Insere uma clausula vindo do EBOND para a tabela das clausulas do documento R2.D41.
-* UTILIZACAO: PKG_EBOND_API.GET_CLAUSULAS_R2D41( 
-*           : PI_UE -> numero da unidade económica
-*           : PI_RAMO -> numero do produto da apólice
-*           : PI_APOLICE -> numero da apólice (não obrigatório)
-*           : PI_TIPO_DECLARACAO -> numero do tipo de declaração
-*           : PI_TIPO_VIGENCIA -> numero do tipo de vigencia da apólice a tratar
-*           : PI_EBOND_DOC_ID -> identificação da alteração das clausulas do documento
-*           : PI_ALINEA -> numero da alinea da clausula
-*           : PI_N_ORDEM -> numero de ordenação de apresentação da alinea da clausula para as clausulas não permanetes
-*           : PI_TITULO -> numero/referência da alinea da clausula (eg : "1.1", "a)", "3.b"...)
-*           : PI_TEXTO -> texto da cláusula
-*           : PI_TIPO_ALTERACAO_RF -> Deve actualizar a tabela das secções do modelo R2D41? ([P]rovisório/[D]efinitivo)
-*           : PI_USER -> utilizador que registou a clausula
-*           : PO_ERRCODE -> CÓDIGO DE ERRO, preenchido apenas quando houver erro na execução do PROCEDIMENTO
-*           : )
-* AUTOR     : João Ribeiro
-* DATA      : 11-11-2024
-* VERSÃO    : 1.0
-*
-* ULTIMAS ALTERAÇÕES
-*
-*   DATA       AUTOR           DESCRICÃO
-*   ========== =============== =================================================
-*
-*/

	PROCEDURE SET_CLAUSULA_R2D41 ( PI_UE                  IN NUMBER
														 , PI_RAMO                IN NUMBER
														 , PI_APOLICE             IN NUMBER DEFAULT NULL
														 , PI_TIPO_DECLARACAO     IN VARCHAR2
														 , PI_TIPO_VIGENCIA       IN VARCHAR2
														 , PI_EBOND_DOC_ID        IN NUMBER
														 , PI_ALINEA              IN NUMBER DEFAULT NULL
														 , PI_N_ORDEM             IN NUMBER
														 , PI_TITULO              IN VARCHAR2
														 , PI_TEXTO               IN VARCHAR2
														 , PI_TIPO_ALTERACAO_RF   IN VARCHAR DEFAULT 'P'
														 , PI_USER                IN VARCHAR2
														 , PO_ERRCODE             OUT VARCHAR2
														 )
	IS
    t_apolice varchar2(20) := null;
		l_msg1 varchar2(2000);
		t_erro varchar2(2000) := null;

		v_rows_updated number;

	BEGIN

    if PI_APOLICE is not null THEN
      t_apolice := ' - '|| PI_APOLICE;
    end if;

		l_msg1 := 'CHAMADA AO PKG_EBOND_API.SET_CLAUSULA_R2D41 '||PI_UE||' - '||PI_RAMO||' - '||PI_TIPO_DECLARACAO||' - '||PI_TIPO_VIGENCIA;
		l_msg1 := l_msg1||' - '||PI_EBOND_DOC_ID||' - '||PI_N_ORDEM||' - '||PI_USER||' - '||PI_TIPO_ALTERACAO_RF;

		PKG_LOG_ERRO.WRITE('ERRO_EBOND',l_msg1,'R2.D41 - EBOND');

		PKG_LOG_ERRO.WRITE('ERRO_EBOND','PKG_EBOND_API.SET_CLAUSULA_R2D41 opcionais: Apólice: '||PI_APOLICE||', Alinea: '||PI_ALINEA,'R2.D41 - EBOND');

		if PI_UE is null or PI_RAMO is null or PI_TIPO_DECLARACAO is null or PI_TIPO_VIGENCIA is null or PI_EBOND_DOC_ID is null or PI_N_ORDEM is null or PI_USER is null THEN
			t_erro := 'Falta de parâmetros de entrada obrigatórios no SET_CLAUSULA_R2D41';

			if PI_UE is null then
				t_erro := t_erro || ', PI_UE em falta';
			end if;
			if PI_RAMO is null then
				t_erro := t_erro || ', PI_RAMO em falta';
			end if;
			if PI_TIPO_DECLARACAO is null then
				t_erro := t_erro || ', PI_TIPO_DECLARACAO em falta';
			end if;
			if PI_TIPO_VIGENCIA is null then
				t_erro := t_erro || ', PI_TIPO_VIGENCIA em falta';
			end if;
			if PI_EBOND_DOC_ID is null then
				t_erro := t_erro || ', PI_EBOND_DOC_ID em falta';
			end if;
			if PI_N_ORDEM is null then
				t_erro := t_erro || ', PI_N_ORDEM em falta';
			end if;
			if PI_USER is null then
				t_erro := t_erro || ', PI_USER em falta';
			end if;

			t_erro := t_erro || '.';

			PKG_LOG_ERRO.WRITE('ERRO_EBOND',t_erro,'R2.D41 - EBOND');
			PO_ERRCODE := ERR_PARAMETROS_OBRIGATORIOS;
			return;
		end if;

		if NOT CHK_TIPO_DECLARACAO(PI_TIPO_DECLARACAO) THEN
			PKG_LOG_ERRO.WRITE('ERRO_EBOND','Tipo de declaração não parametrizado no SET_CLAUSULA_R2D41','R2.D41 - EBOND');
			PO_ERRCODE := ERR_DECLARACAO_INEXISTENTE;
			return;
		end if;

		if NOT CHK_TIPO_VIGENCIA(PI_TIPO_VIGENCIA) THEN
			PKG_LOG_ERRO.WRITE('ERRO_EBOND','Tipo de vigência não parametrizado no SET_CLAUSULA_R2D41','R2.D41 - EBOND');
			PO_ERRCODE := ERR_VIGENCIA_INEXISTENTE;
			return;
		end if;

		if NOT CHK_CONFIGURACAO_CLAUSULAS(PI_UE, PI_RAMO, PI_TIPO_DECLARACAO, PI_TIPO_VIGENCIA) THEN
			PKG_LOG_ERRO.WRITE('ERRO_EBOND','Conjugação de parametros não devolve clausulas no SET_CLAUSULA_R2D41','R2.D41 - EBOND');
			PO_ERRCODE := ERR_CLAUSULAS_INEXISTENTES;
			return;
		end if;

		if PI_TEXTO is null and PI_TITULO is null THEN
			PKG_LOG_ERRO.WRITE('ERRO_EBOND','Tentativa de introdução de uma clausula vazia no SET_CLAUSULA_R2D41','R2.D41 - EBOND');
			PO_ERRCODE := ERR_CLAUSULA_VAZIA;
			return;
		end if;

		if PI_TIPO_ALTERACAO_RF = C_ALTERACAO_DEFINITIVA THEN

			if PI_ALINEA is null then
				PKG_LOG_ERRO.WRITE('ERRO_EBOND','A alinea apresentada não pode ser null para atualização dos templates - SET_CLAUSULA_R2D41','R2.D41 - EBOND');
				PO_ERRCODE := ERR_ALINEA_INEXISTENTE;
				return;
			end if;

			if NOT CHK_CONFIGURACAO_ALINEA (PI_UE, PI_RAMO, PI_TIPO_DECLARACAO, PI_TIPO_VIGENCIA, PI_ALINEA) THEN
				PKG_LOG_ERRO.WRITE('ERRO_EBOND','A alinea apresentada não coincide com o tipo de declaração e tipo vigencia nos templates - SET_CLAUSULA_R2D41','R2.D41 - EBOND');
				PO_ERRCODE := ERR_ALINEA_CLAUSULA;
				return;
			end if;

			BEGIN

				UPDATE DOC_SECCOES_DOCUMENTO SECCOES
				SET SECCOES.TEXTO = PI_TEXTO
				,SECCOES.ACTUALIZADO_POR = PI_USER
				,SECCOES.DATA_ACTUALIZACAO = SYSDATE
				WHERE SECCOES.MODELO_ID = 'R2.D41'
					AND SECCOES.TIPOSEC_ID = 'CLAUS'
					AND SECCOES.ALINEA = PI_ALINEA
			    AND NVL(SECCOES.TITULO,'0') = NVL(PI_TITULO,'0')
					AND EXISTS (
						SELECT 1
						FROM DOC_CONDICOES_APR CONDICOES
						WHERE 1 = 1
							AND CONDICOES.ALINEA != 10
							AND CONDICOES.CDUNIECO = PI_UE
							AND CONDICOES.MODELO_ID = 'R2.D41'
							AND CONDICOES.TIPOSEC_ID = 'CLAUS'
							AND PI_TIPO_VIGENCIA LIKE NVL(CONDICOES.ATRIBUTO7, '%')
							AND CONDICOES.ATRIBUTO8 = PI_TIPO_DECLARACAO
							AND CONDICOES.ALINEA = PI_ALINEA
							AND PI_RAMO LIKE CONDICOES.CDRAMO
							AND sysdate BETWEEN CONDICOES.DATA_INICIO
								AND NVL(CONDICOES.DATA_FIM, to_date('31122099', 'ddmmyyyy'))
						);

				v_rows_updated := SQL%ROWCOUNT;

				IF v_rows_updated > 0 THEN

					BEGIN

					INSERT into GD_CLAUSULAS_R2D41 (
							EBOND_DOC_ID
						, N_ORDEM
						, UE
						, RAMO
						, APOLICE
						, TIPO_DECLARACAO
						, TIPO_VIGENCIA
						, ALINEA
						, TITULO
						, TEXTO
						, TIPO_ALTERACAO_RF
						, CRIADO_POR
						, DATA_CRIACAO
					) VALUES (
							PI_EBOND_DOC_ID
						,	PI_N_ORDEM
						, PI_UE
						, PI_RAMO
						, PI_APOLICE
						, PI_TIPO_DECLARACAO
						, PI_TIPO_VIGENCIA
						, PI_ALINEA
						, PI_TITULO
						, PI_TEXTO
						, PI_TIPO_ALTERACAO_RF
						, PI_USER
						, SYSDATE
					);

					PKG_LOG_ERRO.WRITE('ERRO_EBOND','Registo definitivo gravado na GD_CLAUSULAS_R2D41 - SET_CLAUSULA_R2D41','R2.D41 - EBOND');

				EXCEPTION
					WHEN DUP_VAL_ON_INDEX THEN
						PKG_LOG_ERRO.WRITE('ERRO_EBOND','Tentativa de introdução de uma clausula já presente na tabela GD_CLAUSULAS_R2D41 - SET_CLAUSULA_R2D41','R2.D41 - EBOND');
						PO_ERRCODE := ERR_REG_JA_EXISTE;
						ROLLBACK;
						return;
					WHEN OTHERS THEN
						PKG_LOG_ERRO.WRITE('ERRO_EBOND','Erro de inserção da clausula na tabela GD_CLAUSULAS_R2D41 - SET_CLAUSULA_R2D41 -' || SQLERRM,'R2.D41 - EBOND');
						PO_ERRCODE := ERR_INSERT_CLAUSULA;
						ROLLBACK;
						return;
				END;

				ELSE
					PKG_LOG_ERRO.WRITE('ERRO_EBOND','A alinea apresentada não tem o mesmo titulo. Não pode ser acutalizada no modelo r2d41 de forma automática  - SET_CLAUSULA_R2D41','R2.D41 - EBOND');
					PO_ERRCODE := ERR_MODIFICACAO_CLAUSULA;
					return;
				END IF;

				PKG_LOG_ERRO.WRITE('ERRO_EBOND','Registo atualizado na tabela das secções DOC_SECCOES_DOCUMENTO - SET_CLAUSULA_R2D41','R2.D41 - EBOND');

				COMMIT;

			EXCEPTION
				WHEN OTHERS THEN
					PKG_LOG_ERRO.WRITE('ERRO_EBOND','Erro na atualização da clausula na tabela DOC_SECCOES_DOCUMENTO - SET_CLAUSULA_R2D41 - ' || SQLERRM,'R2.D41 - EBOND');
					PO_ERRCODE := ERR_UPDATE_CLAUSULA;
					ROLLBACK;
					return;
			END;

		ELSIF PI_TIPO_ALTERACAO_RF = C_ALTERACAO_PROVISORIA THEN

			BEGIN

				INSERT into GD_CLAUSULAS_R2D41 (
						EBOND_DOC_ID
					, N_ORDEM
					, UE
					, RAMO
					, APOLICE
					, TIPO_DECLARACAO
					, TIPO_VIGENCIA
					, ALINEA
					, TITULO
					, TEXTO
					, TIPO_ALTERACAO_RF
					, CRIADO_POR
					, DATA_CRIACAO
				) VALUES (
						PI_EBOND_DOC_ID
					,	PI_N_ORDEM
					, PI_UE
					, PI_RAMO
					, PI_APOLICE
					, PI_TIPO_DECLARACAO
					, PI_TIPO_VIGENCIA
					, PI_ALINEA
					, PI_TITULO
					, PI_TEXTO
					, PI_TIPO_ALTERACAO_RF
					, PI_USER
					, SYSDATE
				);

				PKG_LOG_ERRO.WRITE('ERRO_EBOND','Registo provisório gravado na GD_CLAUSULAS_R2D41 - SET_CLAUSULA_R2D41','R2.D41 - EBOND');

			EXCEPTION
				WHEN DUP_VAL_ON_INDEX THEN
					PKG_LOG_ERRO.WRITE('ERRO_EBOND','Tentativa de introdução de uma clausula já presente na tabela GD_CLAUSULAS_R2D41 - SET_CLAUSULA_R2D41','R2.D41 - EBOND');
					PO_ERRCODE := ERR_REG_JA_EXISTE;
					return;
				WHEN OTHERS THEN
					PKG_LOG_ERRO.WRITE('ERRO_EBOND','Erro de inserção da clausula na tabela GD_CLAUSULAS_R2D41 - SET_CLAUSULA_R2D41 -' || SQLERRM,'R2.D41 - EBOND');
					PO_ERRCODE := ERR_INSERT_CLAUSULA;
					return;
			END;

		ELSE
			PKG_LOG_ERRO.WRITE('ERRO_EBOND','Tipo de Alteração não definido - SET_CLAUSULA_R2D41','R2.D41 - EBOND');
			PO_ERRCODE := ERR_TIPO_ALTERACAO;
			return;
		END IF;

	EXCEPTION
	WHEN OTHERS THEN
		PKG_LOG_ERRO.WRITE('ERRO_EBOND','Erro na execução do processo SET_CLAUSULA_R2D41. ' || SQLERRM,'R2.D41 - EBOND');
		PO_ERRCODE := ERR_OUTROS;
	END SET_CLAUSULA_R2D41;    

/*
-* NOME      : GERA_R2D41
-* OBJECTIVO : Gerar o documento R2.D41 com as clausulas alteradas
-* UTILIZACAO: PKG_EBOND_API.GERA_R2D41( 
-*           : PI_UE -> numero da unidade económica
-*           : PI_RAMO -> numero do produto da apólice
-*           : PI_APOLICE -> numero da apólice
-*           : PI_EBOND_DOC_ID -> identificação da alteração das clausulas do documento
-*           : PI_USER -> utilizador que registou a clausula
-*           : PO_ERRCODE -> CÓDIGO DE ERRO, preenchido apenas quando houver erro na execução do PROCEDIMENTO
-*           : )
-* AUTOR     : João Ribeiro
-* DATA      : 11-11-2024
-* VERSÃO    : 1.0
-*
-* ULTIMAS ALTERAÇÕES
-*
-*   DATA       AUTOR           DESCRICÃO
-*   ========== =============== =================================================
-*
-*/

	PROCEDURE GERA_R2D41 ( PI_UE           IN NUMBER
                     , PI_RAMO         IN NUMBER
										 , PI_APOLICE      IN NUMBER
										 , PI_EBOND_DOC_ID IN NUMBER
										 , PI_USER         IN VARCHAR2
										 , PO_ERRCODE      OUT VARCHAR2
										 )
	IS
		ambiente_id SVR_AMBIENTES_IMPRESSAO.ID%TYPE;
		v_num_recibo MRECIBO.NMRECIBO%TYPE;

		t_erro varchar2(2000) := null;

	BEGIN

		PKG_LOG_ERRO.WRITE('ERRO_EBOND','CHAMADA AO PKG_EBOND_API.GERA_R2D41 '||PI_UE||' - '||PI_RAMO||' - '||PI_APOLICE||' - '||PI_EBOND_DOC_ID||' - '||PI_USER,'R2.D41 - EBOND');

		if PI_UE is null or PI_RAMO is null or PI_APOLICE is null or PI_EBOND_DOC_ID is null or PI_USER is null THEN
			t_erro := 'Falta de parâmetros de entrada obrigatórios no GERA_R2D41';

			if PI_UE is null then
				t_erro := t_erro || ', PI_UE em falta';
			end if;
			if PI_RAMO is null then
				t_erro := t_erro || ', PI_RAMO em falta';
			end if;
			if PI_APOLICE is null then
				t_erro := t_erro || ', PI_APOLICE em falta';
			end if;
			if PI_EBOND_DOC_ID is null then
				t_erro := t_erro || ', PI_EBOND_DOC_ID em falta';
			end if;
			if PI_USER is null then
				t_erro := t_erro || ', PI_USER em falta';
			end if;

			t_erro := t_erro || '.';

			PKG_LOG_ERRO.WRITE('ERRO_EBOND',t_erro,'R2.D41 - EBOND');
			PO_ERRCODE := ERR_PARAMETROS_OBRIGATORIOS;
			return;
		end if;

		if NOT CHK_EBOND_DOC_ID(PI_EBOND_DOC_ID) THEN
			PKG_LOG_ERRO.WRITE('ERRO_EBOND','Numero ERR_EBOND_DOC_ID não existe na tabelas das clausulas - GERA_R2D41','R2.D41 - EBOND');
			PO_ERRCODE := ERR_EBOND_DOC_ID;
			return;
		end if;

		if NOT CHK_EBOND_DOC_ID_APOLICE(PI_UE, PI_RAMO, PI_APOLICE, PI_EBOND_DOC_ID) THEN
			PKG_LOG_ERRO.WRITE('ERRO_EBOND','A apólice não está relacionada com o EBOND_DOC_ID - GERA_R2D41','R2.D41 - EBOND');
			PO_ERRCODE := ERR_EBOND_DOC_ID_APOLICE;
			return;
		end if;

		v_num_recibo := GET_NUM_RECIBO(PI_UE, PI_RAMO, PI_APOLICE);

		if v_num_recibo = 0 THEN
			PKG_LOG_ERRO.WRITE('ERRO_EBOND','A apólice não tem nenhum recibo associado à apólice - GERA_R2D41','R2.D41 - EBOND');
			PO_ERRCODE := ERR_NUM_RECIBO;
			return;
		end if;

		BEGIN

			select id
			into ambiente_id
			from SVR_AMBIENTES_IMPRESSAO;

			PKG_DOCUMENTOS_SVR.SET_PARAMETRO_NUMERO('P_CDUNIECO',PI_UE);
			PKG_DOCUMENTOS_SVR.SET_PARAMETRO_NUMERO('P_CDRAMO',PI_RAMO);
			PKG_DOCUMENTOS_SVR.SET_PARAMETRO_NUMERO('P_NMPOLIZA',PI_APOLICE);
			PKG_DOCUMENTOS_SVR.SET_PARAMETRO_NUMERO('P_NMRECIBO',v_num_recibo);
			PKG_DOCUMENTOS_SVR.SET_PARAMETRO_NUMERO('P_EBOND_DOC_ID',PI_EBOND_DOC_ID);			
			PKG_DOCUMENTOS_SVR.SET_PARAMETRO_STRING('P_USUARIO',PI_USER);
			PKG_DOCUMENTOS_SVR.SET_PARAMETRO_DATA('P_DATAACTUAL', SYSDATE);
			PKG_DOCUMENTOS_SVR.SET_PARAMETRO_STRING('_USER',ambiente_id);
			PKG_DOCUMENTOS_SVR.EXECUTA('R2.D41');

			PKG_LOG_ERRO.WRITE('ERRO_EBOND','Documento emitido - GERA_R2D41','R2.D41 - EBOND');

		EXCEPTION
			WHEN OTHERS THEN
				PKG_LOG_ERRO.WRITE('ERRO_EBOND','Erro na emissão do documento - GERA_R2D41 ' || SQLERRM,'R2.D41 - EBOND');
				PO_ERRCODE := ERR_EMISSAO_DOC;
				return;
		END;

	EXCEPTION
		WHEN OTHERS THEN
			PKG_LOG_ERRO.WRITE('ERRO_EBOND','Erro na execução do processo GERA_R2D41. ' || SQLERRM,'R2.D41 - EBOND');
			PO_ERRCODE := ERR_OUTROS;
			return;						
	END GERA_R2D41;

END PKG_EBOND_API;

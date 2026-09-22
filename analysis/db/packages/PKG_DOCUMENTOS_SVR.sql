-- PKG_DOCUMENTOS_SVR (owner: SIID_TESTES)


-- ===== SPEC (PACKAGE) =====

PACKAGE "PKG_DOCUMENTOS_SVR"
AS
--* CONSTANTES PRaPRIAS QUESTIONAR INFORMA??ES SOBRE PACKAGE
--*
--*
   info_versao            CONSTANT VARCHAR2 (100) := 'VERSAO';
   info_data_versao       CONSTANT VARCHAR2 (100) := 'DATA_VERSAO';
   info_autor_package     CONSTANT VARCHAR2 (100) := 'AUTOR_PACKAGE';
   info_autor_versao      CONSTANT VARCHAR2 (100) := 'AUTOR_VERSAO';
   info_data_package      CONSTANT VARCHAR2 (100) := 'DATA_PACKAGE';
   info_data_instalacao   CONSTANT VARCHAR2 (100) := 'DATA_INSTALACAO';
   info_owner             CONSTANT VARCHAR2 (100) := 'OWNER';
   FUNCTION get_packinfo (p_tipo_info VARCHAR2 DEFAULT 'ALL')
      RETURN VARCHAR2;
--*
--* DESCRI?CO : Insere na lista de par?metros um par?metro do tipo CHAR/VARCHAR.
--*
--* PARAMETROS: P_NOMEPAR - nome do par?metro do documento.
--*             P_VAL     - valor a atribuir ao par?metro.
--*
--* NOTA      :
--*
   PROCEDURE set_parametro_string (p_nomepar IN VARCHAR2, p_val IN VARCHAR2);
--*
--* DESCRI?CO : Insere na lista de par?metros um par?metro do tipo DATA.
--*
--* PARAMETROS: P_NOMEPAR - nome do par?metro do documento.
--*             P_VAL     - valor a atribuir ao par?metro.
--*
--* NOTA      :
--*
   PROCEDURE set_parametro_data (p_nomepar IN VARCHAR2, p_val IN DATE);
--*
--* DESCRI?CO : Insere na lista de par?metros um par?metro do tipo num?rico.
--*
--* PARAMETROS: P_NOMEPAR - nome do par?metro do documento.
--*             P_VAL     - valor a atribuir ao par?metro.
--*
--* NOTA      :
--*
   PROCEDURE set_parametro_numero (p_nomepar IN VARCHAR2, p_val IN NUMBER);
--*
--* DESCRI?CO : Envia pedido de execu??o de um documento ao servidor mas n?o o imprime.
--*
--* PARAMETROS: P_NOMEDOC Nome do documento registado no sistema de impress?o de documentos.
--*
--* NOTA      : Ap?s a sua execu??o, limpa a lista de par?metros definida.
--*
   PROCEDURE executa (p_nomedoc IN VARCHAR2);
--*
--* DESCRI?CO : Envia pedido para reexecutar um documento sem o imprimir, ou para o executar se ainda n?o existir.
--*
--* PARAMETROS: P_NOMEDOC Nome do documento registado no sistema de impress?o de documentos.
--*
--* NOTA      : Ap?s a sua execu??o, limpa a lista de par?metros definida.
--*
   PROCEDURE reexecuta (p_nomedoc IN VARCHAR2);
--*
--* DESCRI?CO : Envia pedido de execu??o e posterior impress?o de um documento ao servidor.
--*
--* PARAMETROS: P_NOMEDOC Nome do documento registado no sistema de impress?o de documentos.
--*
--* NOTA      : Ap?s a sua execu??o, limpa a lista de par?metros definida.
--*
   PROCEDURE imprime (p_nomedoc IN VARCHAR2, p_tipo_validacao IN VARCHAR2 DEFAULT 'F'
                       , p_impressora_id IN VARCHAR2 DEFAULT '0');
--*
--* DESCRI?CO : Submete um pedido de impress?o para um documento j  gerado.
--*
--* PARAMETROS: P_DOCID   Identificador do documento na tabela SVR_DOCUMENTOS.
--*
--*             P_USUARIO Utilizador aplicacional que efectua o pedido.
--*
   PROCEDURE imprime (
      p_docid      IN   NUMBER,
      p_usuario    IN   VARCHAR2,
      p_ambiente   IN   VARCHAR2,
      p_tipo_validacao IN VARCHAR2 DEFAULT 'F',
      p_impressora_id  IN VARCHAR2 DEFAULT '0');
--*
--* DESCRI?CO : Envia pedido de reexecu??o e posterior impress?o de um documento ao servidor,
--*             ou execu??o e impress?o no caso do documento ainda n?o existir.
--*
--* PARAMETROS: P_NOMEDOC Nome do documento registado no sistema de impress?o de documentos.
--*
--* NOTA      : Ap?s a sua execu??o, limpa a lista de par?metros definida.
--*
   PROCEDURE reimprime (p_nomedoc IN VARCHAR2, p_tipo_Validacao IN VARCHAR2 DEFAULT 'F'
                        , p_impressora_id IN VARCHAR2 DEFAULT '0');
--*
--* DESCRI?CO : Envia pedido de execu??o e posterior impress?o de um documento ao servidor.
--*
--* PARAMETROS: P_NOMEDOC Nome do documento registado no sistema de impress?o de documentos.
--*
--*             P_ADDRESS Endere?o de E-mail para o qual deve ser enviado
--*
--* NOTA      : Ap?s a sua execu??o, limpa a lista de par?metros definida.
--*
   PROCEDURE email (p_nomedoc IN VARCHAR2, p_address IN VARCHAR2);
--*
--* DESCRI?CO : Submete um pedido de impress?o para um documento j  gerado.
--*
--* PARAMETROS: P_DOCID   Identificador do documento na tabela SVR_DOCUMENTOS.
--*
--*             P_ADDRESS Endere?o de E-mail para o qual deve ser enviado
--*
--*             P_USUARIO Utilizador aplicacional que efectua o pedido.
--*
--*             P_AMBIENTE Ambiente de impress?o
--*
   PROCEDURE email (
      p_docid      IN   NUMBER,
      p_address    IN   VARCHAR2,
      p_usuario    IN   VARCHAR2,
      p_ambiente   IN   VARCHAR2
   );
--*
--* DESCRI?CO : Envia pedido de reexecu??o e posterior envio por e-mail de um documento ao servidor,
--*             ou execu??o e envio no caso do documento ainda n?o existir.
--*
--* PARAMETROS: P_NOMEDOC Nome do documento registado no sistema de impress?o de documentos.
--*
--*             P_ADDRESS Endere?o de E-mail para o qual deve ser enviado
--*
--* NOTA      : Ap?s a sua execu??o, limpa a lista de par?metros definida.
--*
   PROCEDURE reemail (p_nomedoc IN VARCHAR2, p_address IN VARCHAR2);
   
   PROCEDURE ANULADO (p_REFDOC IN VARCHAR2);
   
   PROCEDURE gera_lote (
      p_tipo              IN   NUMBER,
      p_descricao         IN   VARCHAR2,
      p_list_documentos   IN   VARCHAR2
   );
   FUNCTION processa_lote (
      p_tipo              IN   NUMBER,
      p_descricao         IN   VARCHAR2,
      p_list_documentos   IN   VARCHAR2
   )
      RETURN NUMBER;
   PROCEDURE add_to_lote (
      p_documento_id   NUMBER,
      p_lote_id        NUMBER,
      p_ordem_lote     NUMBER DEFAULT NULL
   );
   PROCEDURE imprime_lote (p_lote_id IN NUMBER);
   FUNCTION check_documento ( p_modelo_id   IN   VARCHAR2, p_filter      IN   VARCHAR2 DEFAULT NULL, p_user VARCHAR2 DEFAULT 'COSEC' )
      RETURN NUMBER;
   FUNCTION alter_documento ( p_modelo_id   IN   VARCHAR2, p_id  IN   NUMBER, p_user             VARCHAR2 DEFAULT 'COSEC')
      RETURN NUMBER;
   FUNCTION get_id_execucao
      RETURN NUMBER;
   PROCEDURE "ACTUALIZA_IDOC" (p_ambiente VARCHAR2);
   PROCEDURE "ACTUALIZA_IDOC" (p_modelo_id VARCHAR2, p_ambiente VARCHAR2);
   PROCEDURE "GERA_ID_DOCUMENTO" (p_docid VARCHAR2);

   PROCEDURE "GERA_BACKUP" (
        p_nome_media        VARCHAR2,
        p_tipo_media        VARCHAR2,
        p_destino           VARCHAR2,
        p_observacoes       VARCHAR2,
        p_user              VARCHAR2 DEFAULT 'COSEC');

   PROCEDURE "INSERE_DOCS_BACKUP" (
        p_backup_id         NUMBER,
        p_list_documentos   VARCHAR2,
        p_user              VARCHAR2 DEFAULT 'COSEC');

   PROCEDURE "SET_BACKUP_ONLINE" (
        p_backup_id         NUMBER,
        p_isOnline          VARCHAR2);

   PROCEDURE "ANULAR" (
        P_DOCID         VARCHAR2,
        P_USER          varchar2);
  
   procedure SET_NOTIFICACAO ( P_DOCID in number);
   
    /*
   *  SET_READY_EDOCLINK
   *
   * OBJECTIVO: Enviar ao EDOCLINK a informac?o do documento gerado pelo SIID
   * AUTOR    : Jose Viegas
   * DATA     : 15-12-2014
   *
   * ULTIMAS ALTERAC?ES
   *
   *   DATA       AUTOR           DESCRIC?O
   *   ========== =============== =================================================
   */
   PROCEDURE SET_READY_EDOCLINK ( P_DOCID in number);
   
    /*
   *  CLEAN_EDOCS
   *
   * OBJECTIVO: LIMPAR A INFORMAC?O NO SIID DAS GARANTIAS CARREGADAS NO EDOCLINK
   * AUTOR    : Jose Viegas
   * DATA     : 01-11-2011
   *
   * ULTIMAS ALTERAC?ES
   *
   *   DATA       AUTOR           DESCRIC?O
   *   ========== =============== =================================================
   */
   PROCEDURE CLEAN_EDOCS (P_NORMAL IN NUMBER DEFAULT 2, P_URGENT IN NUMBER DEFAULT 1);

   FUNCTION HASPERMISSAO(P_USER VARCHAR2, P_MODELO VARCHAR2, P_TIPOPERMISSAO NUMBER)
      RETURN VARCHAR2;

   FUNCTION GETDOCDIRECTORY(P_DOCID NUMBER)
      RETURN VARCHAR2;

   FUNCTION GETNOMEBACKUP(P_DOCID NUMBER)
      RETURN VARCHAR2;

END pkg_documentos_svr;

-- ===== BODY (PACKAGE BODY) =====

PACKAGE BODY "PKG_DOCUMENTOS_SVR"
AS

/*
-*
-* ULTIMAS ALTERACÕES AO PACKAGE
-*
-*   DATA       AUTOR           DESCRICÃO
-*   ========== =============== ===================================================
-*   25-11-2004 JOSE VIEGAS     Acrescentado controlo de versões do package
-*   25-11-2004 Jose Viegas	    Correccão dos procedimentos de geracão de lote para
-*                              não incluir no lote Garantias/Titulos de Sessão em
-*                              Branco (com destinatario não preenchido).
-*   25-11-2004 Jose Viegas     Correccão dos procedimentos de lote em termos de
-*                              ordenacão.
-*   01-09-2006 João Viegas     Acrescentada a possibilidade de enviar o documento por mail
-*   02-11-2006 Jose Viegas     Acrescentada a possibilidade de imprimir um documento assoado
-*                              a um determinado lote.
-*   09-12-2009 Alberto Viegas  Adaptacão ao novo modelo de dados (parametros em colunas
-*                              e não em linhas).
-*/


	SLISTAPARAMETER LISTA_PARAMETROS:=LISTA_PARAMETROS();
	PARAMCOUNT NUMBER:=0;
	V_ID_EXEC NUMBER;

	/*
	* INFORMACÃO DE VERSÃO
	*
	* OBJECTIVO: REGISTAR INFORMACÃO SOBRE ACTUALIZACÕES E VERSõES DO PACKAGE
	* AUTOR    : Eng. Jose Viegas
	* DATA     : 25-11-2004
	*
	* ULTIMAS ALTERACÕES
	*
	*   DATA       AUTOR           DESCRICÃO
	*   ========== =============== =================================================
	*/
	VERSAO         CONSTANT NUMBER:=2.5;
	DATA_VERSAO    CONSTANT DATE:= TO_DATE('09-12-2009 13:00','DD-MM-YYYY HH24:MI');
	AUTOR_PACKAGE  CONSTANT VARCHAR2(100):='Eng. João Viegas';
	AUTOR_VERSAO   CONSTANT VARCHAR2(100):='Eng. Jose Viegas';

	FUNCTION GET_PACKINFO (P_TIPO_INFO VARCHAR2 DEFAULT 'ALL') RETURN VARCHAR2 IS
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

	procedure record_error (  p_type         varchar2
							, p_msg          varchar2
							, p_modelo_id    varchar2 default null
							, p_documento_id number   default null
							, p_queue_id     number   default null
							, p_errotipo_id  varchar2 default null) is

	l_msg varchar2(2000);

	begin

		INSERT INTO err_erros_siid (
			id
			,tipo_errosiid
			,modelo_id
			,queue_id
			,data_erro
			,errotipo_id
			,descricao
			,documento_id
			)
		VALUES (
			id_erros_seq.nextval
			,p_type
			,p_modelo_id
			,p_queue_id
			,sysdate
			,p_errotipo_id
			,p_msg
			,p_documento_id
			);


		commit;

	EXCEPTION
		WHEN OTHERS THEN
			l_msg := sqlerrm;
			INSERT INTO err_erros_siid (
				id
				,tipo_errosiid
				,modelo_id
				,queue_id
				,data_erro
				,errotipo_id
				,descricao
				,documento_id
				)
			VALUES (
				id_erros_seq.nextval
				,'ERRO_DOC'
				,p_modelo_id
				,NULL
				,sysdate
				,NULL
				,l_msg
				,NULL
				);

			commit;
	end;

	function EXECUTA_DOCUMENTO (  p_id_doc				varchar2
								, p_val_parametros		lista_parametros )
	return number is

		type dyn_cursor is ref cursor;

		CURSOR PARAMETROS_DOCUMENTO(P_DOCUMENTO_ID IN NUMBER) IS
			SELECT P.NOME
			FROM SVR_DOCUMENTOS D
				,SVR_PARAMETROS_REPORT P
			WHERE P.CHECK_UNIQUE = 'U'
				AND D.REPORT_ID = P.REPORT_ID
				AND D.ID = P_DOCUMENTO_ID
			ORDER BY P.N_PARAMETRO;


		l_id_documento       svr_documentos.id%type;
		l_id_queue           svr_queue.id%type;
		l_id_report          svr_report_siid.id%type;
		l_id_modelo          doc_modelos_documento.id%type;
		l_id_ambiente        svr_documentos.ambiente_id%type;
		l_id_impressora      svr_impressoras.id%type;
		l_allowed_user       number;
		l_username           svr_documentos.parametro01%type;
		l_usuario            svr_documentos.parametro02%type;
		l_dataactual         svr_documentos.parametro03%type;
		l_directoria_base    svr_report_siid.directoria_base%type;
		l_directoria_destino svr_report_siid.directoria_destino%type;
		l_nome_ficheiro      svr_report_siid.nome_ficheiro%type;
		l_nome_output        svr_documentos.nome_output%type;
		l_parametros_list      varchar2(10000);
		l_parametro_nome       varchar2(256);
		l_parametro_valor      varchar2(256);
		l_n_parametros         number;
		l_parametros_validos   number;
		l_parametros_invalidos number;
		l_parametros_falta     number;
		l_n_copias             doc_modelos_documento.n_copias%type;
		l_forma_controlo       doc_modelos_documento.forma_controlo_rf%type;
		l_n_identicos          number;
		p_parametros           lista_parametros;
		parametros             dyn_cursor;
		l_query                varchar2(2000);
		l_error                number := 0;
		l_erro_impressora      number := 1;
		l_N_Parametro_Rep      varchar2(2);
		l_check_unique         varchar2(1);
		l_idoc varchar2(2000);

	begin
		record_error('ERRO_DOC','CHAMADA AO PKG_DOCUMENTOS.EXECUCAO',p_id_doc);

		select id_documento_seq.nextval
		into   l_id_documento
		from   dual;

		begin
			SELECT b.id
				,b.report_id
				,c.directoria_base
				,c.directoria_destino
				,c.nome_ficheiro
				,b.n_copias
				,b.forma_controlo_rf
			INTO l_id_modelo
				,l_id_report
				,l_directoria_base
				,l_directoria_destino
				,l_nome_ficheiro
				,l_n_copias
				,l_forma_controlo
			FROM doc_modelos_documento b
				,svr_report_siid c
			WHERE b.id = upper(p_id_doc)
				AND b.data_inicio <= sysdate
				AND nvl(b.data_fim, sysdate + 1) > sysdate
				AND c.id = b.report_id;

		exception
			when no_data_found then
				record_error('ERRO_DOC','Documento nao esta registado.',p_id_doc,l_id_documento);
				return -1;
			when others then
				record_error('ERRO_DOC',sqlerrm,p_id_doc,l_id_documento);
				return -1;
		end;

		p_parametros:= p_val_parametros;

		if p_parametros is not null then

			record_error('ERRO_DOC','Parametros submetidos.',l_id_modelo,l_id_documento);

			for i in 1..p_parametros.count loop
				record_error('ERRO_DOC',p_parametros(i).nome || ' = ' || p_parametros(i).valor,l_id_modelo,l_id_documento);
			end loop;

		end if;

		if p_parametros is not null then
			l_n_parametros    := 0;
			l_parametros_list := '';

			for i in 1..p_parametros.count loop

				if p_parametros(i).nome = 'P_USUARIO' then
					l_usuario := p_parametros(i).valor;
				elsif p_parametros(i).nome = '_USER' then
					l_username := p_parametros(i).valor;
				elsif p_parametros(i).nome = 'P_DATAACTUAL' then
					l_dataactual := p_parametros(i).valor;
				end if;

				l_n_parametros := l_n_parametros + 1;

				if l_parametros_list is null then
					l_parametros_list := '''' || p_parametros(i).nome || '''';
				else
					l_parametros_list := l_parametros_list || ',''' || p_parametros(i).nome || '''';
				end if;

			end loop;

			if l_n_parametros = 0 then
				record_error('ERRO_DOC','Nao foram submetidos parametros.',l_id_modelo,l_id_documento);
				l_error := -1;
			end if;

			begin
				l_query := 	'select ' 											||
							'	a.nome ' 										||
							'	,b.valor ' 										||
							'from ' 											||
							'	svr_parametros_report a ' 						||
							'	,doc_parametros_omissao b ' 					||
							'where ' 											||
							'	a.report_id = ' || l_id_report || ' ' 			||
							'and ' 												||
							'	a.obrigatorio = ''S'' ' 						||
							'and ' 												||
							'	a.nome not in (' || l_parametros_list || ') '	||
							'and ' 												||
							'	a.n_parametro = b.n_parametro ' 				||
							'and ' 												||
							'	b.modelo_id = ''' || p_id_doc || ''' ' 			||
							'and ' 												||
							'	b.data_inicio <= sysdate ' 						||
							'and ' 												||
							'	nvl(b.data_fim, sysdate+1) > sysdate';

				record_error('ERRO_DOC','PATAMAR NIENTE',l_id_modelo);

				open parametros for l_query;
					loop
						fetch parametros into l_parametro_nome,l_parametro_valor;
						exit when parametros%notfound;

						if l_parametro_valor = '$SYSDATE$' then
							select '''' || to_char(sysdate,'DD-MM-YYYY') || ''''
							into   l_parametro_valor
							from   dual;
						end if;

						p_parametros.extend;
						p_parametros(p_parametros.count) := parametro(upper(l_parametro_nome),l_parametro_valor);
						l_parametros_list := l_parametros_list || ',''' || l_parametro_nome || '''';
					end loop;
				close parametros;

			exception
				when no_data_found then null;
			end;

			record_error('ERRO_DOC','PATAMAR UNO',l_id_modelo);

			l_query:=	'select ' 								||
						'	count(*) ' 							||
						'from ' 								||
						'	svr_parametros_report ' 				||
						'where ' 								||
						'	report_id = ' || l_id_report || ' ' 	||
						'and ' 									||
						'	obrigatorio = ''S'' ' 				||
						'and ' 									||
						'	nome not in (' || l_parametros_list || ')';

			--record_error('ERRO_DOC',l_query,l_id_modelo);

			execute immediate l_query
			into l_parametros_falta;

			record_error('ERRO_DOC','PATAMAR DUE',l_id_modelo);

			if l_parametros_falta > 0 then
				record_error('ERRO_DOC','Faltam parametros obrigatorios.',l_id_modelo,l_id_documento);

				l_query :=	'select ' 								||
							'	nome ' 								||
							'from ' 								||
							'	svr_parametros_report ' 			||
							'where ' 								||
							'	report_id = ' || l_id_report || ' ' ||
							'and ' 									||
							'	obrigatorio = ''S'' ' 				||
							'and ' 									||
							'	nome not in (' || l_parametros_list || ')';

				open parametros for l_query;
					loop
						fetch parametros into l_parametro_nome;
						exit when parametros%notfound;
						record_error('ERRO_DOC','Parametro ' || l_parametro_nome || '.',l_id_modelo,l_id_documento);
					end loop;
				close parametros;

				l_error := -1;

			end if;

			l_query :=	'select ' 								||
						'	count(*) ' 							||
						'from ' 								||
						'	svr_parametros_report ' 			||
						'where ' 								||
						'	report_id = ' || l_id_report || ' '	||
						'and ' 									||
						'	VALIDO = ''S'' ' 					||
						'and ' 									||
						'	nome in (' || l_parametros_list || ')';

			record_error('ERRO_DOC',l_query,l_id_modelo);
			record_error('ERRO_DOC',l_parametros_list,l_id_modelo);

			execute immediate l_query
				into l_parametros_validos;

			if l_n_parametros > l_parametros_validos then
				record_error('ERRO_DOC','Foram submetidos parametros invalidos.',l_id_modelo,l_id_documento);
				--	    l_error := -1;
			end if;

		else
			record_error('ERRO_DOC','Nao foram submetidos parametros.',l_id_modelo,l_id_documento);
			l_error := -1;
		end if;

		SELECT COUNT(*)
		INTO l_allowed_user
		FROM cfg_utilizadores
		WHERE USERNAME = upper(L_USUARIO);


		if l_usuario != 'ADMINISTRADOR' and l_allowed_user =0 then

			SELECT count(*)
			INTO l_allowed_user
			FROM cfg_permissoes_siid a
			WHERE a.modelo_id = l_id_modelo
				AND a.username = l_usuario
				AND a.data_inicio <= sysdate
				AND nvl(a.data_fim, sysdate + 1) > sysdate
				AND a.tipo_permissao_rf = 0;

		else
			l_allowed_user := 1;
		end if;

		if l_allowed_user = 0 then
			record_error('ERRO_DOC',l_usuario || ' Nao tem autorizacao para executar.',l_id_modelo,l_id_documento);
			l_error := -2;
		end if;

		l_id_ambiente := l_username;

		begin

			SELECT a.impressora_id
			INTO l_id_impressora
			FROM doc_impressoes_modelo_usr a
			WHERE a.modelo_id = l_id_modelo
				AND a.cdemplea = l_usuario
				AND a.data_inicio <= sysdate
				AND nvl(a.data_fim, sysdate + 1) > sysdate;

			l_erro_impressora := 0;
		exception
			when no_data_found then
		--	  record_error('ERRO_DOC','O Documento nao tem impressora assignada para o utilizador ' || l_usuario || '.',l_id_modelo);
				l_erro_impressora := 1;
			when others then
				record_error('ERRO_DOC',sqlerrm,p_id_doc,l_id_documento);
				l_erro_impressora := 1;
		end;

		if l_erro_impressora = 1 then

			begin

				SELECT a.impressora_id
				INTO l_id_impressora
				FROM doc_impressoes_user a
				WHERE a.cdemplea = l_usuario
					AND a.data_inicio <= sysdate
					AND nvl(a.data_fim, sysdate + 1) > sysdate;

				l_erro_impressora := 0;
			exception
				when no_data_found then
			--    	    record_error('ERRO_DOC','O Utilizador ' || l_usuario || ' nao tem impressora assignada.',l_id_modelo);
					l_erro_impressora := 1;
				when others then
					record_error('ERRO_DOC',sqlerrm,p_id_doc,l_id_documento);
					l_erro_impressora := 1;
			end;

		end if;

		if l_erro_impressora = 1 then

			begin

				SELECT a.impressora_id
				INTO l_id_impressora
				FROM doc_impressoes_dep a
					,co_empleados b
				WHERE b.cdemplea = l_usuario
					AND a.cddeparta = b.cddeparta
					AND a.ambiente_id = l_id_ambiente
					AND a.data_inicio <= sysdate
					AND nvl(a.data_fim, sysdate + 1) > sysdate;

				l_erro_impressora := 0;

			exception
				when no_data_found then
			--    	    record_error('ERRO_DOC','O Departamento do utilizador ' || l_usuario || ' nao tem impressora assignada.',l_id_modelo);
					l_erro_impressora := 1;
				when others then
					record_error('ERRO_DOC',sqlerrm,p_id_doc,l_id_documento);
					l_erro_impressora := 1;
			end;

		end if;

		if l_erro_impressora = 1 then

			begin

				SELECT b.impressora_id
				INTO l_id_impressora
				FROM doc_impressoras_doc b
				WHERE b.ambiente_id = l_id_ambiente
					AND b.data_inicio <= sysdate
					AND nvl(b.data_fim, sysdate + 1) > sysdate
					AND b.modelo_id = l_id_modelo;

				l_erro_impressora := 0;

			exception
				when no_data_found then
				--  	    record_error('ERRO_DOC','O Documento nao tem impressora assignada.',l_id_modelo);
					l_erro_impressora := 1;
				when others then
					record_error('ERRO_DOC',sqlerrm,p_id_doc,l_id_documento);
					l_erro_impressora := 1;
			end;

		end if;

		if l_erro_impressora = 1 then

			begin

				SELECT b.impressora_id
				INTO l_id_impressora
				FROM svr_ambientes_impressao b
				WHERE b.id = l_id_ambiente
					AND b.data_inicio <= sysdate
					AND nvl(b.data_fim, sysdate + 1) > sysdate;

			exception
				when no_data_found then
					record_error('ERRO_DOC','O Documento nao tem impressora assignada no ambiente ' || l_id_ambiente || '.',l_id_modelo);
					l_error := -1;
				when others then
					record_error('ERRO_DOC',sqlerrm,p_id_doc,l_id_documento);
					l_error := -1;

			end;

		end if;

		l_nome_output := l_id_modelo || '.' || l_id_documento || '.siid';

		INSERT INTO svr_documentos (
			id
			,modelo_id
			,report_id
			,ambiente_id
			,impressora_id
			,nome_output
			,criado_por
			,data_pedido
			)
		VALUES (
			l_id_documento
			,l_id_modelo
			,l_id_report
			,l_id_ambiente
			,l_id_impressora
			,l_nome_output
			,l_usuario
			,sysdate
			);


		if p_parametros is not null then

			l_idoc := '';

			for i in 1..p_parametros.count loop

				SELECT LPAD(TO_CHAR(a.n_parametro), 2, '0')
					,a.check_unique
				INTO l_N_Parametro_Rep
					,l_check_unique
				FROM svr_parametros_report a
				WHERE a.nome = p_parametros(i).nome
					AND a.report_id = l_id_report;

				l_query :=	'UPDATE svr_documentos ' ||
							'SET parametro' || l_N_Parametro_Rep || ' = ''' || REPLACE(p_parametros(i).valor, '''', '''''') || ''' ' ||
							'WHERE id = ' || TO_CHAR(l_id_documento);

				execute immediate l_query;

			end loop;

			begin

				if l_dataactual is null then

					update svr_documentos
					set parametro03 = TO_CHAR(SYSDATE,'DD-MM-YYYY')
					where id = l_id_documento;

				end if;

			exception
				when others then
					record_error('ERRO_DOC', 'Documento sem parametro P_DATAACTUAL', p_id_doc, l_id_documento);

			end;

			FOR RW IN PARAMETROS_DOCUMENTO(l_id_documento) LOOP
				L_IDOC := L_IDOC||'|'||GET_PAR_VALOR(P_PARAMETROS,RW.NOME);
			END LOOP;

			begin

				SELECT LPAD(TO_CHAR(nvl(n_parametro, '')), 2, '0')
				INTO l_N_Parametro_Rep
				FROM svr_parametros_report
				WHERE nome = 'P_ID'
					AND report_id = l_id_report;


				l_query :=	'UPDATE svr_documentos ' ||
							'SET parametro' || l_N_Parametro_Rep || ' = ''' || l_id_documento || ''' ' ||
							'WHERE id = ' || TO_CHAR(l_id_documento);
				--record_error('ERRO_DOC',l_query,p_id_doc,l_id_documento);

				execute immediate l_query;

			exception
				when no_data_found then
				--record_error('ERRO_DOC','O parametro não existe.',p_id_doc,l_id_documento);
					record_error('ERRO_DOC','O parametro não existe.',p_id_doc);
			end;

			begin

				SELECT LPAD(TO_CHAR(nvl(n_parametro, '')), 2, '0')
				INTO l_N_Parametro_Rep
				FROM svr_parametros_report
				WHERE nome = 'P_MODELO_ID'
					AND report_id = l_id_report;

				l_query:=	'UPDATE svr_documentos ' ||
							'SET parametro' || l_N_Parametro_Rep || ' = ''' || p_id_doc || ''' ' ||
							'WHERE id = ' || TO_CHAR(l_id_documento);

				--record_error('ERRO_DOC',l_query,p_id_doc,l_id_documento);

				execute immediate l_query;

			exception
				when no_data_found then
					--record_error('ERRO_DOC','O parametro não existe.',p_id_doc,l_id_documento);
					record_error('ERRO_DOC','O parametro não existe.',p_id_doc);
			end;


			if (length(l_idoc) > 0) then

				update svr_documentos
				set idoc = MODELO_ID||l_idoc
				where id = l_id_documento;

			end if;

		end if;
	/*
		if l_forma_reimpressao = 'V' then

			SELECT count(*)
			INTO l_n_identicos
			FROM (
				SELECT a.id
					,count(*) n_parametros
				FROM svr_documentos a
					,svr_parametros_documento b
					,svr_parametros_documento c
					,svr_parametros_report d
				WHERE a.modelo_id = l_id_modelo
					AND a.id != l_id_documento
					AND b.documento_id = a.id
					AND c.documento_id = l_id_documento
					AND b.valor = c.valor
					AND b.paramrep_id = d.id
					AND c.paramrep_id = d.id
					AND d.nome != 'P_USUARIO'
				GROUP BY a.id
				)
			WHERE n_parametros = p_parametros.count;

			if l_n_identicos > 0 then
				record_error('ERRO_DOC','DOCUMENTO JA PRODUZIDO. NECESSITA DE SEGUNDA VIA',p_id_doc,l_id_documento);
				l_error := -1;
			end if;
		end if;
	*/
		if l_error = 0 then

			INSERT INTO svr_queue (
				id
				,tipo_queue_rf
				,documento_id
				,data_pedido
				,estado
				,criado_por
				)
			VALUES (
				id_queue_seq.nextval
				,'EXECUCAO'
				,l_id_documento
				,sysdate
				,'ESPERA'
				,l_usuario
				);

			commit;

			return l_id_documento;

		elsif l_error = -2 then

			commit;

			return l_id_documento;

		end if;

		commit;
		return -1;

	exception
		when others then
			record_error('ERRO_DOC','**'||sqlerrm,p_id_doc,l_id_documento);
			RETURN -1;
	end;

	FUNCTION FUN_CHECK_UNIQUE ( P_MODELO   IN VARCHAR2
								, P_PARAMETROS IN LISTA_PARAMETROS)
	RETURN NUMBER IS

		CURSOR PARAMETROS_MODELO(P_MODELO IN VARCHAR2) IS
			SELECT P.NOME
			FROM DOC_MODELOS_DOCUMENTO D
				,SVR_PARAMETROS_REPORT P
			WHERE P.CHECK_UNIQUE = 'U'
				AND D.REPORT_ID = P.REPORT_ID
				AND D.ID = P_MODELO
			ORDER BY P.REPORT_ID
				,P.N_PARAMETRO;

		N_DOCUMENTO NUMBER := -1;
		N_PAR       NUMBER := 1;

		CFROM VARCHAR2(2000);
		CWHERE VARCHAR2(2000);
		CSQL   VARCHAR2(4000);

		N_P_ID NUMBER;

		L_IDOC VARCHAR2(2000);

	BEGIN

		L_IDOC := '';

		FOR RW IN PARAMETROS_MODELO(P_MODELO) LOOP
			L_IDOC := L_IDOC||'|'||GET_PAR_VALOR(P_PARAMETROS,RW.NOME);
		END LOOP;

		SELECT ID
		INTO N_DOCUMENTO
		FROM SVR_DOCUMENTOS
		WHERE IDOC = P_MODELO || L_IDOC;

		RETURN N_DOCUMENTO;

    EXCEPTION
		WHEN NO_DATA_FOUND THEN RETURN -1;
    END;

	FUNCTION FUN_CHECK_UNIQUE_OLD ( P_MODELO   IN VARCHAR2
									, P_PARAMETROS IN LISTA_PARAMETROS)
	RETURN NUMBER IS

		CURSOR PARAMETROS_MODELO(P_MODELO IN VARCHAR2, P_NOME IN VARCHAR2) IS
			SELECT P.REPORT_ID
				,LPAD(TO_CHAR(P.N_PARAMETRO), 2, '0') N_PARAMETRO
				,P.NOME
			FROM DOC_MODELOS_DOCUMENTO D
				,SVR_PARAMETROS_REPORT P
			WHERE P.NOME = P_NOME
				AND P.CHECK_UNIQUE = 'U' /* PARAMETRO eNICO */
				AND D.REPORT_ID = P.REPORT_ID
				AND D.ID = P_MODELO;

		N_DOCUMENTO NUMBER := -1;
		N_PAR       NUMBER := 1;

		CFROM VARCHAR2(2000);
		CWHERE VARCHAR2(2000);
		CSQL   VARCHAR2(4000);

		N_P_REPORT_ID     NUMBER;
		N_P_N_PARAMETRO   VARCHAR2(2);

    BEGIN

		FOR IDX IN 1..P_PARAMETROS.COUNT LOOP

			FOR RW IN PARAMETROS_MODELO(P_MODELO,P_PARAMETROS(IDX).NOME) LOOP
				N_P_REPORT_ID := RW.REPORT_ID;
				N_P_N_PARAMETRO := RW.N_PARAMETRO;
			END LOOP;

			IF N_P_REPORT_ID IS NOT NULL AND N_P_N_PARAMETRO IS NOT NULL THEN

				IF N_PAR = 1 THEN
					CFROM := 'SELECT A1.ID FROM SVR_DOCUMENTOS A1';
					CWHERE:= ' WHERE A1.REPORT_ID = '||N_P_REPORT_ID||' AND A1.PARAMETRO'||N_P_N_PARAMETRO||' = '''||replace(P_PARAMETROS(IDX).VALOR,'''','''''')||'''';
				ELSE
					CFROM := CFROM||', SVR_DOCUMENTOS A'||N_PAR;
					CWHERE:= CWHERE||' AND A1.ID = A'||N_PAR||'.ID AND A'||N_PAR||'.REPORT_ID = '||N_P_REPORT_ID||' AND A'||N_PAR||'.PARAMETRO'||N_P_N_PARAMETRO||' = '''||replace(P_PARAMETROS(IDX).VALOR,'''','''''')||'''';
				END IF;

			N_P_REPORT_ID := NULL;
			N_P_N_PARAMETRO := NULL;
			N_PAR  := N_PAR + 1;

			END IF;

		END LOOP;

		CSQL := CFROM||CWHERE;

		record_error('ERRO_DOC',CSQL,p_modelo);

		IF CWHERE IS NOT NULL THEN

			begin

				EXECUTE IMMEDIATE CSQL INTO N_DOCUMENTO;

			exception when no_data_found then n_documento := -1;

			end;

		END IF;

		RETURN N_DOCUMENTO;

    END;

	function FPEDIDO_EXECUCAO ( p_id_doc             	varchar2
								, p_val_parametros		lista_parametros )
	return number is

		cursor associacoes(c_modelo_id varchar2) is
			SELECT docmestre_id
				,docdetalhe_id docdetalhe_id
				,tipoassoc_rf
				,data_inicio
				,data_fim
				,sql_validacao
			FROM doc_associacoes_documento
			WHERE docmestre_id = c_modelo_id
				AND data_inicio <= sysdate
				AND nvl(data_fim, sysdate + 1) > sysdate
			;

		cursor parametros_associacao( c_docmestre_id  varchar2
									, c_docdetalhe_id varchar2
									, c_data_inicio   date
									, c_tipoassoc_rf  varchar2
									, c_documento_id  number   ) is
			SELECT a.nome_parametro
				,CASE c.n_parametro
					WHEN 1
						THEN b.parametro01
					WHEN 2
						THEN b.parametro02
					WHEN 3
						THEN b.parametro03
					WHEN 4
						THEN b.parametro04
					WHEN 5
						THEN b.parametro05
					WHEN 6
						THEN b.parametro06
					WHEN 7
						THEN b.parametro07
					WHEN 8
						THEN b.parametro08
					WHEN 9
						THEN b.parametro09
					WHEN 10
						THEN b.parametro10
					WHEN 11
						THEN b.parametro11
					WHEN 12
						THEN b.parametro12
					WHEN 13
						THEN b.parametro13
					WHEN 14
						THEN b.parametro14
					WHEN 15
						THEN b.parametro15
					WHEN 16
						THEN b.parametro16
					WHEN 17
						THEN b.parametro17
					WHEN 18
						THEN b.parametro18
					WHEN 19
						THEN b.parametro19
					WHEN 20
						THEN b.parametro20
					ELSE NULL
					END valor
				,c.obrigatorio
			FROM doc_parametros_assoc a
				,svr_documentos b
				,svr_parametros_report c
			WHERE a.docmestre_id = c_docmestre_id
				AND a.docdetalhe_id = c_docdetalhe_id
				AND a.data_inicio = c_data_inicio
				AND a.tipo_associacao_rf = c_tipoassoc_rf
				AND a.nome_parametro = c.nome
				AND c.report_id = b.report_id
				AND b.id = c_documento_id;


		cursor parametros_detalhe( c_documento_mestre_id number
								 , c_modelo_id           varchar2 ) is
			SELECT a.nome
				,CASE a.n_parametro
					WHEN 1
						THEN b.parametro01
					WHEN 2
						THEN b.parametro02
					WHEN 3
						THEN b.parametro03
					WHEN 4
						THEN b.parametro04
					WHEN 5
						THEN b.parametro05
					WHEN 6
						THEN b.parametro06
					WHEN 7
						THEN b.parametro07
					WHEN 8
						THEN b.parametro08
					WHEN 9
						THEN b.parametro09
					WHEN 10
						THEN b.parametro10
					WHEN 11
						THEN b.parametro11
					WHEN 12
						THEN b.parametro12
					WHEN 13
						THEN b.parametro13
					WHEN 14
						THEN b.parametro14
					WHEN 15
						THEN b.parametro15
					WHEN 16
						THEN b.parametro16
					WHEN 17
						THEN b.parametro17
					WHEN 18
						THEN b.parametro18
					WHEN 19
						THEN b.parametro19
					WHEN 20
						THEN b.parametro20
					ELSE NULL
					END valor
			FROM svr_parametros_report a
				,svr_documentos b
				,doc_modelos_documento c
				,svr_parametros_report d
			WHERE b.id = c_documento_mestre_id
				AND b.report_id = a.report_id
				AND c.id = c_modelo_id
				AND d.report_id = c.report_id
				AND d.valido = 'S'
				AND a.nome = d.nome;


		cursor parametros_modelo(c_modelo_id in varchar2) is
			SELECT b.report_id
				,LPAD(TO_CHAR(b.n_parametro), 2, '0') n_parametro
				,b.nome
			FROM doc_modelos_documento a
				,svr_parametros_report b
			WHERE a.report_id = b.report_id
				AND a.id = c_modelo_id
				AND b.nome != 'P_USUARIO';


		l_id_main_documento number;
		l_id_slave_documento number;
		l_forma_controlo doc_modelos_documento.forma_controlo_rf%type;

		l_parametros_slave lista_parametros := lista_parametros();
		n_parametro number;
		n_condicao  number;

		type dyn_cursor is ref cursor;

		l_posicao      varchar2(2);
		l_username     varchar2(255);
		l_usuario      varchar2(255);
		l_allowed_user number;
		l_sqlPosicao   varchar2(2000);
		l_sql          varchar2(2000);
		l_sql_from     varchar2(2000);
		l_sql_where    varchar2(2000);
		documentos     dyn_cursor;

		valid_assoc number;
		printing number;
		rows_processed number;

	begin

		SELECT forma_controlo_rf
		INTO l_forma_controlo
		FROM doc_modelos_documento
		WHERE id = p_id_doc;


		record_error('ERRO_DOC','INICIAR PROCEDIMENTO',p_id_doc);

		if l_forma_controlo = 'C' then

			l_id_main_documento :=  executa_documento( p_id_doc
													 , p_val_parametros );

			record_error('ERRO_DOC','Testar Associacoes',p_id_doc);

			for associacao in associacoes(p_id_doc) loop

				record_error('ERRO_DOC','  Associacao com ' || associacao.docmestre_id  		|| ' '
															|| associacao.docdetalhe_id 		|| ' '
															|| to_char(associacao.data_inicio) 	|| ' '
															|| associacao.tipoassoc_rf 			|| ' '
															|| l_id_main_documento, p_id_doc);

				begin
					SELECT LPAD(TO_CHAR(b.n_parametro), 2, '0')
					INTO l_posicao
					FROM svr_documentos a
						,svr_parametros_report b
					WHERE a.id = l_id_main_documento
						AND a.report_id = b.report_id
						AND b.nome = '_USER';


					l_sqlPosicao := 'SELECT parametro'||l_posicao||' '||
									'FROM svr_documentos ' ||
									'WHERE id = ' || l_id_main_documento;

					record_error('ERRO_DOC', l_sqlPosicao, p_id_doc);

					execute immediate l_sqlPosicao into l_username;

					l_sql := replace(associacao.sql_validacao,'#USERNAME#',l_username);

				exception
					when others then
						l_sql := associacao.sql_validacao;
				end;

				valid_assoc := dbms_sql.open_cursor;
				record_error('ERRO_DOC','  Valida associacao ' || l_sql, p_id_doc);
				dbms_sql.parse(valid_assoc,l_sql,dbms_sql.native);

				-- Associacão de parametros
				for parametro_associacao in parametros_associacao( associacao.docmestre_id
																, associacao.docdetalhe_id
																, associacao.data_inicio
																, associacao.tipoassoc_rf
																, l_id_main_documento) loop

					record_error('ERRO_DOC','  Associa parametro ' || parametro_associacao.nome_parametro || ' = ' || parametro_associacao.valor , p_id_doc);

					IF parametro_associacao.valor IS NULL and parametro_associacao.obrigatorio = 'N' THEN
						DBMS_SQL.BIND_VARIABLE(
								c   => valid_assoc, 
								name     => parametro_associacao.nome_parametro, 
								value    => NULL,  -- Explicitly pass NULL
								out_value_size => 100    -- Specify max size if applicable
							);
					ELSE
							DBMS_SQL.BIND_VARIABLE(
									c   => valid_assoc, 
									name     => parametro_associacao.nome_parametro, 
									value    => parametro_associacao.valor
							);
					END IF;

					--dbms_sql.bind_variable(valid_assoc,parametro_associacao.nome_parametro,parametro_associacao.valor);

				end loop;

				dbms_sql.define_column(valid_assoc,1,printing);
				rows_processed := dbms_sql.execute(valid_assoc);
				rows_processed := dbms_sql.fetch_rows(valid_assoc);
				dbms_sql.column_value(valid_assoc,1,printing);
				record_error('ERRO_DOC','  Resultado da validacao ' || to_char(printing), p_id_doc);
				dbms_sql.close_cursor(valid_assoc);

				if printing = 1 then

					n_parametro := 1;

					for parametro_detalhe in parametros_detalhe(l_id_main_documento,associacao.docdetalhe_id) loop

						if parametro_detalhe.nome != 'P_ID' then
							l_parametros_slave.extend;
							l_parametros_slave(n_parametro) := parametro(parametro_detalhe.nome, parametro_detalhe.valor );
							n_parametro := n_parametro + 1;
						end if;

					end loop;

					l_id_slave_documento := FPEDIDO_EXECUCAO( associacao.docdetalhe_id, l_parametros_slave);
					l_parametros_slave.delete;

					if l_id_slave_documento != -1 then

						INSERT INTO svr_anexos_documento (
							tipo_anexo_rf
							,documento_id
							,anexodoc_id
							)
						VALUES (
							1
							,l_id_main_documento
							,l_id_slave_documento
							);

					end if;
				end if; -- printing = 1
			end loop;

			commit;

		else
			l_id_main_documento := fun_check_unique(p_id_doc,p_val_parametros);

			if l_id_main_documento = -1 then

				l_id_main_documento :=  executa_documento( p_id_doc
														, p_val_parametros );

				record_error('ERRO_DOC','Testar Associacoes',p_id_doc);

				for associacao in associacoes(p_id_doc) loop

					record_error('ERRO_DOC','  Associacao com ' || associacao.docmestre_id  || ' '
																|| associacao.docdetalhe_id || ' '
																|| to_char(associacao.data_inicio) || ' '
																|| associacao.tipoassoc_rf || ' '
																|| l_id_main_documento, p_id_doc);

					begin

						SELECT LPAD(TO_CHAR(b.n_parametro), 2, '0')
						INTO l_posicao
						FROM svr_documentos a
							,svr_parametros_report b
						WHERE a.id = l_id_main_documento
							AND a.report_id = b.report_id
							AND b.nome = '_USER';


						l_sqlPosicao := 'SELECT parametro'||l_posicao||' '||
										'FROM svr_documentos ' ||
										'WHERE id = ' || l_id_main_documento;

						execute immediate l_sqlPosicao into l_username;

						l_sql := replace(associacao.sql_validacao,'#USERNAME#',l_username);

					exception
						when others then
							l_sql := associacao.sql_validacao;
					end;

					valid_assoc := dbms_sql.open_cursor;
					record_error('ERRO_DOC','  Valida associacao ' || l_sql, p_id_doc);
					dbms_sql.parse(valid_assoc,l_sql,dbms_sql.native);

					-- Associacão de parametros
					for parametro_associacao in parametros_associacao( associacao.docmestre_id
																	, associacao.docdetalhe_id
																	, associacao.data_inicio
																	, associacao.tipoassoc_rf
																	, l_id_main_documento) loop

						record_error('ERRO_DOC','  Associa parametro ' || parametro_associacao.nome_parametro || ' = ' || parametro_associacao.valor , p_id_doc);

						IF parametro_associacao.valor IS NULL and parametro_associacao.obrigatorio = 'N' THEN
							DBMS_SQL.BIND_VARIABLE(
									c   => valid_assoc, 
									name     => parametro_associacao.nome_parametro, 
									value    => NULL,  -- Explicitly pass NULL
									out_value_size => 100    -- Specify max size if applicable
								);
						ELSE
								DBMS_SQL.BIND_VARIABLE(
										c   => valid_assoc, 
										name     => parametro_associacao.nome_parametro, 
										value    => parametro_associacao.valor
								);
						END IF;

					--dbms_sql.bind_variable(valid_assoc,parametro_associacao.nome_parametro,parametro_associacao.valor);


					end loop;

					dbms_sql.define_column(valid_assoc,1,printing);
					rows_processed := dbms_sql.execute(valid_assoc);
					rows_processed := dbms_sql.fetch_rows(valid_assoc);
					dbms_sql.column_value(valid_assoc,1,printing);
					record_error('ERRO_DOC','  Resultado da validacao ' || to_char(printing), p_id_doc);
					dbms_sql.close_cursor(valid_assoc);

					if printing = 1 then

						n_parametro := 1;

						for parametro_detalhe in parametros_detalhe(l_id_main_documento,associacao.docdetalhe_id) loop

							if parametro_detalhe.nome != 'P_ID' then
								l_parametros_slave.extend;
								l_parametros_slave(n_parametro) := parametro(parametro_detalhe.nome, parametro_detalhe.valor );
								n_parametro := n_parametro + 1;
							end if;

						end loop;

						l_id_slave_documento := FPEDIDO_EXECUCAO( associacao.docdetalhe_id, l_parametros_slave);
						l_parametros_slave.delete;

						if l_id_slave_documento != -1 then

							INSERT INTO svr_anexos_documento (
								tipo_anexo_rf
								,documento_id
								,anexodoc_id
								)
							VALUES (
								1
								,l_id_main_documento
								,l_id_slave_documento
								);

						end if;
					end if; -- printing = 1

				end loop;

				commit;
			else

				SELECT COUNT(*)
				INTO l_allowed_user
				FROM cfg_utilizadores
				WHERE USERNAME = upper(L_USUARIO);


				if l_usuario != 'ADMINISTRADOR' and l_allowed_user =0 then

					SELECT count(*)
					INTO l_allowed_user
					FROM cfg_permissoes_siid a
					WHERE a.modelo_id = p_id_doc
						AND a.username = l_usuario
						AND a.data_inicio <= sysdate
						AND nvl(a.data_fim, sysdate + 1) > sysdate
						AND a.tipo_permissao_rf = 0;

				else
					l_allowed_user := 1;
				end if;

				if l_allowed_user = 0 then

					record_error('ERRO_DOC',l_usuario || ' Nao tem autorizacao para executar o doc.',p_id_doc,l_id_main_documento);
					l_id_main_documento := -2;

				else

					record_error('ERRO_DOC','Documento ja foi gerado.',p_id_doc,l_id_main_documento);
					record_error('ERRO_DOC','Parametros submetidos.',p_id_doc);

					for n_parametro in 1..p_val_parametros.count loop
						record_error('ERRO_DOC',p_val_parametros(n_parametro).nome || ' = ' || p_val_parametros(n_parametro).valor,p_id_doc);
					end loop;

					if l_forma_controlo = 'V' then
						record_error('ERRO_DOC','Documento necessita de segunda via!!!!',p_id_doc,l_id_main_documento);
						l_id_main_documento := -1;
					end if;
				end if;
			end if;
		end if;

		return l_id_main_documento;

	exception
		when others then
		record_error('ERRO_DOC','**'||sqlerrm,p_id_doc,l_id_main_documento);
		RETURN -10;
	end;


	function FPEDIDO_REEXECUCAO ( p_id_doc         varchar2
								, p_val_parametros lista_parametros )
	return number is

		cursor associacoes(c_modelo_id varchar2) is
			SELECT docmestre_id
				,docdetalhe_id docdetalhe_id
				,tipoassoc_rf
				,data_inicio
				,data_fim
				,sql_validacao
			FROM doc_associacoes_documento
			WHERE docmestre_id = c_modelo_id
				AND data_inicio <= sysdate
				AND nvl(data_fim, sysdate + 1) > sysdate;

		cursor parametros_associacao( c_docmestre_id  varchar2
									, c_docdetalhe_id varchar2
									, c_data_inicio   date
									, c_tipoassoc_rf  varchar2
									, c_documento_id  number   ) is
			SELECT a.nome_parametro
				,CASE c.n_parametro
					WHEN 1
						THEN b.parametro01
					WHEN 2
						THEN b.parametro02
					WHEN 3
						THEN b.parametro03
					WHEN 4
						THEN b.parametro04
					WHEN 5
						THEN b.parametro05
					WHEN 6
						THEN b.parametro06
					WHEN 7
						THEN b.parametro07
					WHEN 8
						THEN b.parametro08
					WHEN 9
						THEN b.parametro09
					WHEN 10
						THEN b.parametro10
					WHEN 11
						THEN b.parametro11
					WHEN 12
						THEN b.parametro12
					WHEN 13
						THEN b.parametro13
					WHEN 14
						THEN b.parametro14
					WHEN 15
						THEN b.parametro15
					WHEN 16
						THEN b.parametro16
					WHEN 17
						THEN b.parametro17
					WHEN 18
						THEN b.parametro18
					WHEN 19
						THEN b.parametro19
					WHEN 20
						THEN b.parametro20
					ELSE NULL
					END valor
				,c.obrigatorio
			FROM doc_parametros_assoc a
				,svr_documentos b
				,svr_parametros_report c
			WHERE a.docmestre_id = c_docmestre_id
				AND a.docdetalhe_id = c_docdetalhe_id
				AND a.data_inicio = c_data_inicio
				AND a.tipo_associacao_rf = c_tipoassoc_rf
				AND a.nome_parametro = c.nome
				AND c.report_id = b.report_id
				AND b.id = c_documento_id;

		cursor parametros_detalhe( c_documento_mestre_id number
								, c_modelo_id           varchar2 ) is
			SELECT a.nome
				,CASE a.n_parametro
					WHEN 1
						THEN b.parametro01
					WHEN 2
						THEN b.parametro02
					WHEN 3
						THEN b.parametro03
					WHEN 4
						THEN b.parametro04
					WHEN 5
						THEN b.parametro05
					WHEN 6
						THEN b.parametro06
					WHEN 7
						THEN b.parametro07
					WHEN 8
						THEN b.parametro08
					WHEN 9
						THEN b.parametro09
					WHEN 10
						THEN b.parametro10
					WHEN 11
						THEN b.parametro11
					WHEN 12
						THEN b.parametro12
					WHEN 13
						THEN b.parametro13
					WHEN 14
						THEN b.parametro14
					WHEN 15
						THEN b.parametro15
					WHEN 16
						THEN b.parametro16
					WHEN 17
						THEN b.parametro17
					WHEN 18
						THEN b.parametro18
					WHEN 19
						THEN b.parametro19
					WHEN 20
						THEN b.parametro20
					ELSE NULL
					END valor
			FROM svr_parametros_report a
				,svr_documentos b
				,doc_modelos_documento c
				,svr_parametros_report d
			WHERE b.id = c_documento_mestre_id
				AND b.report_id = a.report_id
				AND c.id = c_modelo_id
				AND d.report_id = c.report_id
				AND d.valido = 'S'
				AND a.nome = d.nome;

		cursor parametros_modelo(c_modelo_id in varchar2) is
			SELECT b.report_id
				,LPAD(TO_CHAR(b.n_parametro), 2, '0') n_parametro
				,b.nome
			FROM doc_modelos_documento a
				,svr_parametros_report b
			WHERE a.report_id = b.report_id
				AND a.id = c_modelo_id
				AND b.nome != 'P_USUARIO';

		l_id_main_documento number;
		l_id_slave_documento number;
		l_forma_controlo doc_modelos_documento.forma_controlo_rf%type;

		l_parametros_slave lista_parametros := lista_parametros();
		n_parametro number;
		n_condicao  number;

		type dyn_cursor is ref cursor;

		l_username     varchar2(255);
		l_posicao      varchar2(2);
		l_usuario      varchar2(255);
		l_allowed_user number;
		l_version      number;
		l_sqlPosicao   varchar2(2000);
		l_sql          varchar2(2000);
		l_sql_from     varchar2(2000);
		l_sql_where    varchar2(2000);
		documentos     dyn_cursor;

		valid_assoc number;
		printing number;
		rows_processed number;
	begin

		SELECT forma_controlo_rf
		INTO l_forma_controlo
		FROM doc_modelos_documento
		WHERE id = p_id_doc;


		if l_forma_controlo != 'UV' then
			return fpedido_execucao(p_id_doc, p_val_parametros);
		end if;

		l_sql	:= 'select a1.paramrep_id '||
                   'from   ';
		l_sql_from  := '';
		l_sql_where := '';
		n_condicao  := 1;

		for parametro_modelo in parametros_modelo(p_id_doc) loop

			n_parametro := 1;

			while n_parametro < p_val_parametros.count and
				p_val_parametros(n_parametro).nome != parametro_modelo.nome loop

				n_parametro := n_parametro + 1;

			end loop;

			if n_parametro < p_val_parametros.count then

				if n_condicao = 1 then
					l_sql_from  := 	'    svr_documentos a1 ';
					l_sql_where := 	'where a1.parametro' || TO_CHAR(parametro_modelo.n_parametro) || ' = ''' || replace(p_val_parametros(n_parametro).valor,'''','''''') || ''' ' ||
									'and   a1.report_id   = ' || to_char(parametro_modelo.report_id) || ' ';
				else
					l_sql_from  := l_sql_from ||
								',   svr_documentos a' || to_char(n_condicao) || ' ';
					l_sql_where := l_sql_where ||
								'and   a' || to_char(n_condicao) || '.id = a1.id '	||
								'and   a' || to_char(n_condicao) || '.parametro'	|| TO_CHAR(parametro_modelo.n_parametro) || ' = ''' || replace(p_val_parametros(n_parametro).valor,'''','''''') || ''' ' ||
								'and   a' || to_char(n_condicao) || '.report_id = '	|| to_char(parametro_modelo.report_id) || ' ';
				end if;

				n_condicao := n_condicao + 1;

			end if;

		end loop;

		for n_parametro in 1..p_val_parametros.count loop

			if p_val_parametros(n_parametro).nome = 'P_USUARIO' then
				l_usuario := p_val_parametros(n_parametro).valor;
			end if;

		end loop;

		record_error('ERRO_DOC','  A Correr ' || l_sql || l_sql_from || l_sql_where, p_id_doc);

		open documentos for l_sql || l_sql_from || l_sql_where;
			fetch documentos into l_version;
		close documentos;

		l_id_main_documento :=  executa_documento( p_id_doc
												, p_val_parametros );

		update svr_documentos
		set    versao = l_version + 1
		where  id     = l_id_main_documento;

		record_error('ERRO_DOC','Testar Associacoes',p_id_doc);

		for associacao in associacoes(p_id_doc) loop
			record_error('ERRO_DOC','  Associacao com ' || associacao.docmestre_id  || ' '
														|| associacao.docdetalhe_id || ' '
														|| to_char(associacao.data_inicio) || ' '
														|| associacao.tipoassoc_rf || ' '
														|| l_id_main_documento, p_id_doc);

			begin

				SELECT LPAD(TO_CHAR(b.n_parametro), 2, '0')
				INTO l_posicao
				FROM svr_documentos a
					,svr_parametros_report b
				WHERE a.id = l_id_main_documento
					AND a.report_id = b.report_id
					AND b.nome = '_USER';

				l_sqlPosicao := 'SELECT parametro'||l_posicao||' '||
								'FROM svr_documentos ' ||
								'WHERE id = ' || l_id_main_documento;

				execute immediate l_sqlPosicao into l_username;

				l_sql := replace(associacao.sql_validacao,'#USERNAME#',l_username);

			exception
				when others then
					l_sql := associacao.sql_validacao;
			end;

			valid_assoc := dbms_sql.open_cursor;
			record_error('ERRO_DOC','  Valida associacao ' || l_sql, p_id_doc);
			dbms_sql.parse(valid_assoc,l_sql,dbms_sql.native);

			-- Associacão de parametros
			for parametro_associacao in parametros_associacao( associacao.docmestre_id
															, associacao.docdetalhe_id
															, associacao.data_inicio
															, associacao.tipoassoc_rf
															, l_id_main_documento) loop

				record_error('ERRO_DOC','  Associa parametro ' || parametro_associacao.nome_parametro || ' = ' || parametro_associacao.valor , p_id_doc);

				IF parametro_associacao.valor IS NULL and parametro_associacao.obrigatorio = 'N' THEN
					DBMS_SQL.BIND_VARIABLE(
							c   => valid_assoc, 
							name     => parametro_associacao.nome_parametro, 
							value    => NULL,  -- Explicitly pass NULL
							out_value_size => 100    -- Specify max size if applicable
						);
				ELSE
						DBMS_SQL.BIND_VARIABLE(
								c   => valid_assoc, 
								name     => parametro_associacao.nome_parametro, 
								value    => parametro_associacao.valor
						);
				END IF;

				--dbms_sql.bind_variable(valid_assoc,parametro_associacao.nome_parametro,parametro_associacao.valor);

			end loop;

			dbms_sql.define_column(valid_assoc,1,printing);
			rows_processed := dbms_sql.execute(valid_assoc);
			rows_processed := dbms_sql.fetch_rows(valid_assoc);
			dbms_sql.column_value(valid_assoc,1,printing);
			record_error('ERRO_DOC','  Resultado da validacao ' || to_char(printing), p_id_doc);
			dbms_sql.close_cursor(valid_assoc);

			if printing = 1 then

				n_parametro := 1;

				for parametro_detalhe in parametros_detalhe(l_id_main_documento,associacao.docdetalhe_id) loop

					if parametro_detalhe.nome != 'P_ID' then
						l_parametros_slave.extend;
						l_parametros_slave(n_parametro) := parametro(parametro_detalhe.nome, parametro_detalhe.valor );
						n_parametro := n_parametro + 1;
					end if;

				end loop;

				l_id_slave_documento := FPEDIDO_EXECUCAO( associacao.docdetalhe_id, l_parametros_slave);
				l_parametros_slave.delete;

				if l_id_slave_documento != -1 then

					INSERT INTO svr_anexos_documento (
						tipo_anexo_rf
						,documento_id
						,anexodoc_id
						)
					VALUES (
						1
						,l_id_main_documento
						,l_id_slave_documento
						);

				end if;
			end if; -- printing = 1

		end loop;

		commit;

		return l_id_main_documento;

	exception
		when others then
		record_error('ERRO_DOC','**'||sqlerrm,p_id_doc,l_id_main_documento);
		RETURN -1;
	end;


	procedure ACTUALIZA_IDOC( p_ambiente varchar2) is

		CURSOR c_documents(pc_ambiente varchar2) IS
			SELECT A.ID MODELO
				,b.id
			FROM DOC_MODELOS_DOCUMENTO a
				,SVR_DOCUMENTOS b
			WHERE b.MODELO_ID = a.ID
				AND b.ambiente_id = pc_ambiente
				AND A.FORMA_CONTROLO_RF != 'C';

		CURSOR c_parametros(P_document_id NUMBER) IS
			SELECT CASE a.N_PARAMETRO
					WHEN 1
						THEN '|' || b.parametro01
					WHEN 2
						THEN '|' || b.parametro02
					WHEN 3
						THEN '|' || b.parametro03
					WHEN 4
						THEN '|' || b.parametro04
					WHEN 5
						THEN '|' || b.parametro05
					WHEN 6
						THEN '|' || b.parametro06
					WHEN 7
						THEN '|' || b.parametro07
					WHEN 8
						THEN '|' || b.parametro08
					WHEN 9
						THEN '|' || b.parametro09
					WHEN 10
						THEN '|' || b.parametro10
					WHEN 11
						THEN '|' || b.parametro11
					WHEN 12
						THEN '|' || b.parametro12
					WHEN 13
						THEN '|' || b.parametro13
					WHEN 14
						THEN '|' || b.parametro14
					WHEN 15
						THEN '|' || b.parametro15
					WHEN 16
						THEN '|' || b.parametro16
					WHEN 17
						THEN '|' || b.parametro17
					WHEN 18
						THEN '|' || b.parametro18
					WHEN 19
						THEN '|' || b.parametro19
					WHEN 20
						THEN '|' || b.parametro20
					ELSE ''
					END parametro
			FROM SVR_PARAMETROS_REPORT a
				,SVR_DOCUMENTOS b
			WHERE a.REPORT_ID = b.REPORT_ID
				AND b.id = p_document_id
				AND a.CHECK_UNIQUE = 'U'
			ORDER BY a.N_PARAMETRO;

		l_signature VARCHAR2(2000);

	BEGIN

		FOR r_documento IN c_documents(p_ambiente) LOOP

			BEGIN

				l_signature := '';

				FOR r_parametro IN c_parametros(r_documento.id) LOOP

					l_signature := SUBSTR(l_signature || r_parametro.parametro,0,2000);

				END LOOP;

				UPDATE SVR_DOCUMENTOS
				SET idoc = r_documento.modelo||l_signature
				WHERE id = r_documento.id;

			EXCEPTION
				WHEN OTHERS THEN
					NULL;
			END;

		END LOOP;

	END;


	procedure ACTUALIZA_IDOC(p_modelo_id varchar2
							, p_ambiente varchar2) is

		CURSOR c_documents(pc_modelo_id varchar2
						, pc_ambiente varchar2) IS
			SELECT b.id
			FROM SVR_DOCUMENTOS b
			WHERE b.MODELO_ID = pc_modelo_id
				AND b.ambiente_id = pc_ambiente;


		CURSOR c_parametros(P_document_id NUMBER) IS
			SELECT CASE a.N_PARAMETRO
					WHEN 1
						THEN '|' || b.parametro01
					WHEN 2
						THEN '|' || b.parametro02
					WHEN 3
						THEN '|' || b.parametro03
					WHEN 4
						THEN '|' || b.parametro04
					WHEN 5
						THEN '|' || b.parametro05
					WHEN 6
						THEN '|' || b.parametro06
					WHEN 7
						THEN '|' || b.parametro07
					WHEN 8
						THEN '|' || b.parametro08
					WHEN 9
						THEN '|' || b.parametro09
					WHEN 10
						THEN '|' || b.parametro10
					WHEN 11
						THEN '|' || b.parametro11
					WHEN 12
						THEN '|' || b.parametro12
					WHEN 13
						THEN '|' || b.parametro13
					WHEN 14
						THEN '|' || b.parametro14
					WHEN 15
						THEN '|' || b.parametro15
					WHEN 16
						THEN '|' || b.parametro16
					WHEN 17
						THEN '|' || b.parametro17
					WHEN 18
						THEN '|' || b.parametro18
					WHEN 19
						THEN '|' || b.parametro19
					WHEN 20
						THEN '|' || b.parametro20
					ELSE ''
					END parametro
			FROM SVR_PARAMETROS_REPORT a
				,SVR_DOCUMENTOS b
			WHERE a.REPORT_ID = b.REPORT_ID
				AND b.id = p_document_id
				AND a.CHECK_UNIQUE = 'U'
			ORDER BY a.N_PARAMETRO;

		l_signature VARCHAR2(2000);

	BEGIN

		FOR r_documento IN c_documents(p_modelo_id, p_ambiente) LOOP

			BEGIN

				l_signature := '';

				FOR r_parametro IN c_parametros(r_documento.id) LOOP
					l_signature := SUBSTR(l_signature || r_parametro.parametro,0,2000);
				END LOOP;

				UPDATE SVR_DOCUMENTOS
				SET idoc = p_modelo_id||l_signature
				WHERE id = r_documento.id;

			EXCEPTION
				WHEN OTHERS THEN
					NULL;
			END;

		END LOOP;

	END;


	procedure GERA_ID_DOCUMENTO(p_DOCID varchar2) is

		CURSOR c_parametros(P_document_id NUMBER) IS
			SELECT CASE a.N_PARAMETRO
					WHEN 1
						THEN '|' || b.parametro01
					WHEN 2
						THEN '|' || b.parametro02
					WHEN 3
						THEN '|' || b.parametro03
					WHEN 4
						THEN '|' || b.parametro04
					WHEN 5
						THEN '|' || b.parametro05
					WHEN 6
						THEN '|' || b.parametro06
					WHEN 7
						THEN '|' || b.parametro07
					WHEN 8
						THEN '|' || b.parametro08
					WHEN 9
						THEN '|' || b.parametro09
					WHEN 10
						THEN '|' || b.parametro10
					WHEN 11
						THEN '|' || b.parametro11
					WHEN 12
						THEN '|' || b.parametro12
					WHEN 13
						THEN '|' || b.parametro13
					WHEN 14
						THEN '|' || b.parametro14
					WHEN 15
						THEN '|' || b.parametro15
					WHEN 16
						THEN '|' || b.parametro16
					WHEN 17
						THEN '|' || b.parametro17
					WHEN 18
						THEN '|' || b.parametro18
					WHEN 19
						THEN '|' || b.parametro19
					WHEN 20
						THEN '|' || b.parametro20
					ELSE ''
					END parametro
			FROM SVR_PARAMETROS_REPORT a
				,SVR_DOCUMENTOS b
			WHERE a.REPORT_ID = b.REPORT_ID
				AND b.id = p_document_id
				AND a.CHECK_UNIQUE = 'U'
			ORDER BY a.n_parametro;

		l_signature VARCHAR2(2000);

	BEGIN

		l_signature := '';

		FOR r_parametro IN c_parametros(P_DOCID) LOOP

			l_signature := SUBSTR(l_signature || r_parametro.parametro,0,2000);

		END LOOP;

		UPDATE SVR_DOCUMENTOS
		SET idoc = MODELO_ID||l_signature
		WHERE id = P_DOCID;

	EXCEPTION
		WHEN OTHERS THEN
		NULL;

	END;


	PROCEDURE PEDIDO_IMPRESSAO  ( p_id_doc           varchar2
                                , p_val_parametros lista_parametros
                                , p_tipo_validacao varchar2 DEFAULT 'F'
                                , p_impressora_id  varchar2 DEFAULT '0' ) is

    l_id_documento		svr_documentos.id%type;
    l_user              varchar2(30);
    l_tipo_queue        varchar2(10);
    l_forma_controlo    doc_modelos_documento.forma_controlo_rf%type;
    l_n_copias          doc_modelos_documento.n_copias%type;
    l_n_impressoes      svr_documentos.n_impressoes%type;
    l_counter           number;

	begin

		SELECT forma_controlo_rf
			,n_copias
		INTO l_forma_controlo
			,l_n_copias
		FROM doc_modelos_documento
		WHERE id = p_id_doc;

		record_error('ERRO_DOC','CHAMADA AO PKG_DOCUMENTOS.IMPRESSAO',p_id_doc);

		l_id_documento := fpedido_execucao( p_id_doc, p_val_parametros );

		if l_id_documento = -1 then
			return;
		end if;

		IF p_tipo_validacao = 'C' THEN
			l_tipo_queue := 'COPIA';
		ELSIF p_tipo_validacao = 'F' THEN
			l_tipo_queue := 'IMPRESSAO';
		ELSE
			select n_impressoes
			into l_n_impressoes
			from svr_documentos
			where id = l_id_documento;

			if l_n_impressoes <> 0 then
				l_tipo_queue := '2.VIA';
			else
				record_error('ERRO_DOC','So e permitido imprimir 2ª Vias apos o documento ter sido impresso pelo menos uma vez.',p_id_doc);
				return;
			end if;
		END IF;

		for l_counter in 1..l_n_copias loop
			IF p_impressora_id = '0' THEN
				record_error('ERRO_DOC','Não foi associada impressora para o pedido na svr_queue.',p_id_doc);

				INSERT INTO svr_queue (
					id
					,tipo_queue_rf
					,documento_id
					,data_pedido
					,estado
					,criado_por
					)
				VALUES (
					id_queue_Seq.nextval
					,l_tipo_queue
					,l_id_documento
					,sysdate
					,'ESPERA'
					,user
					);

				INSERT INTO svr_queue (
					id
					,tipo_queue_rf
					,documento_id
					,data_pedido
					,estado
					,criado_por
					)
				SELECT id_queue_seq.nextval
					,l_tipo_queue
					,anexodoc_id
					,sysdate
					,'ESPERA'
					,user
				FROM svr_anexos_documento
				WHERE documento_id = l_id_documento;

			ELSE
				record_error('ERRO_DOC','Foi associada impressora para o pedido na svr_queue.',p_id_doc);

				INSERT INTO svr_queue (
					id
					,tipo_queue_rf
					,documento_id
					,data_pedido
					,estado
					,impressora_id
					,criado_por
					)
				VALUES (
					id_queue_Seq.nextval
					,l_tipo_queue
					,l_id_documento
					,sysdate
					,'ESPERA'
					,p_impressora_id
					,user
					);

				INSERT INTO svr_queue (
					id
					,tipo_queue_rf
					,documento_id
					,data_pedido
					,estado
					,impressora_id
					,criado_por
					)
				SELECT id_queue_seq.nextval
					,l_tipo_queue
					,anexodoc_id
					,sysdate
					,'ESPERA'
					,p_impressora_id
					,user
				FROM svr_anexos_documento
				WHERE documento_id = l_id_documento;

			END IF;
		end loop;

		commit;

	exception
		when others then
		record_error('ERRO_DOC',sqlerrm,p_id_doc,l_id_documento);
	end;


	PROCEDURE PEDIDO_REIMPRESSAO  ( p_id_doc           varchar2
                                  , p_val_parametros lista_parametros
                                  , p_tipo_validacao varchar2 DEFAULT 'F'
                                  , p_impressora_id  varchar2 DEFAULT '0' ) is

		l_id_documento         svr_documentos.id%type;
		l_user              varchar2(30);
		l_tipo_queue        varchar2(10);
		l_forma_controlo    doc_modelos_documento.forma_controlo_rf%type;
		l_n_copias          doc_modelos_documento.n_copias%type;
		l_n_impressoes      svr_documentos.n_impressoes%type;
		l_counter           number;

	begin

		SELECT forma_controlo_rf
			,n_copias
		INTO l_forma_controlo
			,l_n_copias
		FROM doc_modelos_documento
		WHERE id = p_id_doc;

		record_error('ERRO_DOC','CHAMADA AO PKG_DOCUMENTOS.REIMPRESSAO',p_id_doc);

		if l_forma_controlo != 'UV' then
			pedido_impressao(p_id_doc,p_val_parametros,p_tipo_validacao,p_impressora_id);
			return;
		end if;

		l_id_documento := fpedido_reexecucao( p_id_doc, p_val_parametros );

		if l_id_documento = -1 then
			return;
		end if;

		IF p_tipo_validacao = 'C' THEN
			l_tipo_queue := 'COPIA';
		ELSIF p_tipo_validacao = 'F' THEN
			l_tipo_queue := 'IMPRESSAO';
		ELSE

			SELECT n_impressoes
			INTO l_n_impressoes
			FROM svr_documentos
			WHERE id = l_id_documento;


			if l_n_impressoes <> 0 then
				l_tipo_queue := '2.VIA';
			else
				record_error('ERRO_DOC','So e permitido imprimir 2ª Vias apos o documento ter sido impresso pelo menos uma vez.',p_id_doc);
				return;
			end if;
		END IF;

		for l_counter in 1..l_n_copias loop
			IF p_impressora_id = '0' THEN
				record_error('ERRO_DOC','Não foi associada impressora para o pedido na svr_queue.',p_id_doc);

				INSERT INTO svr_queue (
					id
					,tipo_queue_rf
					,documento_id
					,data_pedido
					,estado
					,criado_por
					)
				VALUES (
					id_queue_Seq.nextval
					,l_tipo_queue
					,l_id_documento
					,sysdate
					,'ESPERA'
					,user
					);

				INSERT INTO svr_queue (
					id
					,tipo_queue_rf
					,documento_id
					,data_pedido
					,estado
					,criado_por
					)
				SELECT id_queue_seq.nextval
					,l_tipo_queue
					,anexodoc_id
					,sysdate
					,'ESPERA'
					,user
				FROM svr_anexos_documento
				WHERE documento_id = l_id_documento;

			ELSE
				record_error('ERRO_DOC','Foi associada impressora para o pedido na svr_queue.',p_id_doc);

				INSERT INTO svr_queue (
					id
					,tipo_queue_rf
					,documento_id
					,data_pedido
					,estado
					,impressora_id
					,criado_por
					)
				VALUES (
					id_queue_Seq.nextval
					,l_tipo_queue
					,l_id_documento
					,sysdate
					,'ESPERA'
					,p_impressora_id
					,user
					);

				INSERT INTO svr_queue (
					id
					,tipo_queue_rf
					,documento_id
					,data_pedido
					,estado
					,impressora_id
					,criado_por
					)
				SELECT id_queue_seq.nextval
					,l_tipo_queue
					,anexodoc_id
					,sysdate
					,'ESPERA'
					,p_impressora_id
					,user
				FROM svr_anexos_documento
				WHERE documento_id = l_id_documento;

			END IF;
		end loop;

		commit;
	exception
		when others then
		record_error('ERRO_DOC',sqlerrm,p_id_doc,l_id_documento);
	end;

	PROCEDURE PEDIDO_IMPRESSAO  ( p_docid    number
                                , p_usuario  varchar2
                                , p_ambiente varchar2
                                , p_tipo_validacao varchar2 DEFAULT 'F'
                                , p_impressora_id  varchar2 DEFAULT '0' ) is

		l_user              varchar2(30);
		l_tipo_queue        varchar2(10);
		l_tipo_queue_rf     number;
		l_forma_controlo    doc_modelos_documento.forma_controlo_rf%type;
		l_n_copias          doc_modelos_documento.n_copias%type;
		l_n_impressoes      svr_documentos.n_impressoes%type;
		l_id_modelo         doc_modelos_documento.id%type;
		l_counter           number;
		l_allowed_user      number;
		dummy               number;

	begin

		SELECT a.forma_controlo_rf
			,a.n_copias
			,a.id
			,b.n_impressoes
		INTO l_forma_controlo
			,l_n_copias
			,l_id_modelo
			,l_n_impressoes
		FROM doc_modelos_documento a
			,svr_documentos b
		WHERE b.id = p_docid
			AND a.id = b.modelo_id;

		record_error('ERRO_DOC','CHAMADA AO PKG_DOCUMENTOS.IMPRESSAO por ' || p_usuario || ' ' || p_ambiente,l_id_modelo);

		--if l_forma_controlo not in ('C','U') then
		--  record_error('ERRO_DOC','Forma de reimpressao nao e permitida!!',l_id_modelo, p_docid);
		--  return;
		--end if;

		if p_usuario != 'ADMINISTRADOR' then
			IF p_tipo_validacao = 'C' THEN
				l_tipo_queue := 'COPIA';
				l_tipo_queue_rf := 2;
			ELSIF p_tipo_validacao = 'F' THEN
				l_tipo_queue := 'IMPRESSAO';
				l_tipo_queue_rf := 1;
			ELSE
				if l_n_impressoes <> 0 then
					l_tipo_queue := '2.VIA';
					l_tipo_queue_rf := 3;
				else
					record_error('ERRO_DOC','So e permitido imprimir 2ª Vias apos o documento ter sido impresso pelo menos uma vez.',p_docid);
					return;
				end if;
			END IF;

			SELECT count(*)
			INTO l_allowed_user
			FROM cfg_permissoes_siid a
			WHERE a.modelo_id = l_id_modelo
				AND a.username = p_usuario
				AND a.data_inicio <= sysdate
				AND nvl(a.data_fim, sysdate + 1) > sysdate
				AND a.tipo_permissao_rf = l_tipo_queue_rf;

		else
			l_allowed_user := 1;
		end if;

		if l_allowed_user = 0 then
			record_error('ERRO_DOC',p_usuario || ' Nao tem autorizacao para executar.',l_id_modelo,p_docid);
			return;
		end if;

		begin
			select id
			into   dummy
			from   svr_documentos
			where  id = p_docid
			and    ambiente_id = p_ambiente;
		exception
			when no_data_found then
				record_error('ERRO_DOC','O documento nao existe!!',l_id_modelo,p_docid);
		end;

		IF p_tipo_validacao = 'C' THEN
			l_tipo_queue := 'COPIA';
			l_tipo_queue_rf := 2;
		ELSIF p_tipo_validacao = 'F' THEN
			l_tipo_queue := 'IMPRESSAO';
			l_tipo_queue_rf := 1;
		ELSE
			if l_n_impressoes <> 0 then
				l_tipo_queue := '2.VIA';
				l_tipo_queue_rf := 3;
			else
				record_error('ERRO_DOC','So e permitido imprimir 2ª Vias apos o documento ter sido impresso pelo menos uma vez.',p_docid);
				return;
			end if;
		END IF;

		for l_counter in 1..l_n_copias loop
			IF p_impressora_id = '0' THEN
				record_error('ERRO_DOC','Não foi associada impressora para o pedido na svr_queue.',l_id_modelo);

				INSERT INTO svr_queue (
					id
					,tipo_queue_rf
					,documento_id
					,data_pedido
					,estado
					,criado_por
					)
				VALUES (
					id_queue_Seq.nextval
					,l_tipo_queue
					,p_docid
					,sysdate
					,'ESPERA'
					,p_usuario
					);

				INSERT INTO svr_queue (
					id
					,tipo_queue_rf
					,documento_id
					,data_pedido
					,estado
					,criado_por
					)
				SELECT id_queue_seq.nextval
					,l_tipo_queue
					,anexodoc_id
					,sysdate
					,'ESPERA'
					,p_usuario
				FROM svr_anexos_documento
				WHERE documento_id = p_docid;

			ELSE
				record_error('ERRO_DOC','Foi associada impressora para o pedido na svr_queue.',l_id_modelo);

				INSERT INTO svr_queue (
					id
					,tipo_queue_rf
					,documento_id
					,data_pedido
					,estado
					,impressora_id
					,criado_por
					)
				VALUES (
					id_queue_Seq.nextval
					,l_tipo_queue
					,p_docid
					,sysdate
					,'ESPERA'
					,p_impressora_id
					,p_usuario
					);

				INSERT INTO svr_queue (
					id
					,tipo_queue_rf
					,documento_id
					,data_pedido
					,estado
					,impressora_id
					,criado_por
					)
				SELECT id_queue_seq.nextval
					,l_tipo_queue
					,anexodoc_id
					,sysdate
					,'ESPERA'
					,p_impressora_id
					,p_usuario
				FROM svr_anexos_documento
				WHERE documento_id = p_docid;
			END IF;
		end loop;

		commit;

	exception
		when others then
			record_error('ERRO_DOC',sqlerrm,l_id_modelo,p_docid);
	end;


	PROCEDURE PEDIDO_EMAIL  ( p_id_doc         varchar2
                            , p_val_parametros lista_parametros
                            , p_address        varchar2 ) is

		l_id_documento      svr_documentos.id%type;

	begin
		record_error('ERRO_DOC','CHAMADA AO PKG_DOCUMENTOS.EMAIL',p_id_doc);
		l_id_documento := fpedido_execucao( p_id_doc, p_val_parametros );

		if l_id_documento = -1 then
			return;
		end if;

		INSERT INTO svr_queue (
			id
			,tipo_queue_rf
			,documento_id
			,data_pedido
			,estado
			,criado_por
			,atributo01
			)
		VALUES (
			id_queue_Seq.nextval
			,'EMAIL'
			,l_id_documento
			,sysdate
			,'ESPERA'
			,user
			,p_address
			);

		INSERT INTO svr_queue (
			id
			,tipo_queue_rf
			,documento_id
			,data_pedido
			,estado
			,criado_por
			,atributo01
			)
		SELECT id_queue_seq.nextval
			,'EMAIL'
			,anexodoc_id
			,sysdate
			,'ESPERA'
			,user
			,p_address
		FROM svr_anexos_documento
		WHERE documento_id = l_id_documento;

		commit;

	exception
		when others then
		record_error('ERRO_DOC',sqlerrm,p_id_doc,l_id_documento);
	end;

	PROCEDURE PEDIDO_REEMAIL  ( p_id_doc         varchar2
                              , p_val_parametros lista_parametros
                              , p_address        varchar2) is

		l_id_documento         svr_documentos.id%type;
		l_forma_controlo doc_modelos_documento.forma_controlo_rf%type;

	begin

		select forma_controlo_rf
		into   l_forma_controlo
		from   doc_modelos_documento
		where  id = p_id_doc;

		record_error('ERRO_DOC','CHAMADA AO PKG_DOCUMENTOS.REEMAIL',p_id_doc);

		if l_forma_controlo != 'UV' then
			pedido_impressao(p_id_doc,p_val_parametros);
			return;
		end if;

		l_id_documento := fpedido_reexecucao( p_id_doc, p_val_parametros );

		if l_id_documento = -1 then
			return;
		end if;

		INSERT INTO svr_queue (
			id
			,tipo_queue_rf
			,documento_id
			,data_pedido
			,estado
			,criado_por
			,atributo01
			)
		VALUES (
			id_queue_Seq.nextval
			,'EMAIL'
			,l_id_documento
			,sysdate
			,'ESPERA'
			,user
			,p_address
			);


		INSERT INTO svr_queue (
			id
			,tipo_queue_rf
			,documento_id
			,data_pedido
			,estado
			,criado_por
			,atributo01
			)
		SELECT id_queue_seq.nextval
			,'EMAIL'
			,anexodoc_id
			,sysdate
			,'ESPERA'
			,user
			,p_address
		FROM svr_anexos_documento
		WHERE documento_id = l_id_documento;

		commit;

	exception
		when others then
			record_error('ERRO_DOC',sqlerrm,p_id_doc,l_id_documento);
	end;

	PROCEDURE PEDIDO_EMAIL  ( p_docid    number
                            , p_address  varchar2
                            , p_usuario  varchar2
                            , p_ambiente varchar2 ) is

		l_user              varchar2(30);
		l_forma_controlo    doc_modelos_documento.forma_controlo_rf%type;
		l_n_copias          doc_modelos_documento.n_copias%type;
		l_id_modelo         doc_modelos_documento.id%type;
		l_counter           number;
		l_allowed_user      number;
		dummy               number;

	begin

		SELECT a.forma_controlo_rf
			,a.n_copias
			,a.id
		INTO l_forma_controlo
			,l_n_copias
			,l_id_modelo
		FROM doc_modelos_documento a
			,svr_documentos b
		WHERE b.id = p_docid
			AND a.id = b.modelo_id;

		record_error('ERRO_DOC','CHAMADA AO PKG_DOCUMENTOS.EMAIL por ' || p_usuario || ' ' || p_ambiente,l_id_modelo);

		if l_forma_controlo not in ('C','U') then
			record_error('ERRO_DOC','Forma de reimpressao (email) nao e permitida!!',l_id_modelo, p_docid);
			return;
		end if;

		SELECT COUNT(*)
		INTO l_allowed_user
		FROM cfg_utilizadores
		WHERE USERNAME = upper(p_usuario);


		if p_usuario != 'ADMINISTRADOR' and l_allowed_user =0 then
			SELECT count(*)
			INTO l_allowed_user
			FROM cfg_permissoes_siid a
			WHERE a.modelo_id = l_id_modelo
				AND a.username = p_usuario
				AND a.data_inicio <= sysdate
				AND nvl(a.data_fim, sysdate + 1) > sysdate
				AND a.tipo_permissao_rf = 5;

		else
			l_allowed_user := 1;
		end if;

		if l_allowed_user = 0 then
			record_error('ERRO_DOC',p_usuario || ' Nao tem autorizacao para executar.',l_id_modelo,p_docid);
			return;
		end if;

		begin
			SELECT id
			INTO DUMMY
			FROM svr_documentos
			WHERE id = p_docid
				AND ambiente_id = p_ambiente;

		exception
			when no_data_found then
			record_error('ERRO_DOC','O documento nao existe!!',l_id_modelo,p_docid);
		end;

		INSERT INTO svr_queue (
			id
			,tipo_queue_rf
			,documento_id
			,data_pedido
			,estado
			,criado_por
			,atributo01
			)
		VALUES (
			id_queue_Seq.nextval
			,'EMAIL'
			,p_docid
			,sysdate
			,'ESPERA'
			,p_usuario
			,p_address
			);

		INSERT INTO svr_queue (
			id
			,tipo_queue_rf
			,documento_id
			,data_pedido
			,estado
			,criado_por
			,atributo01
			)
		SELECT id_queue_seq.nextval
			,'EMAIL'
			,anexodoc_id
			,sysdate
			,'ESPERA'
			,p_usuario
			,p_address
		FROM svr_anexos_documento
		WHERE documento_id = p_docid;

		commit;
	exception
		when others then
			record_error('ERRO_DOC',sqlerrm,l_id_modelo,p_docid);
	end;




	function gera_lote_normal(p_descricao in varchar2, p_list_documentos in varchar2)
	return number is

		type dyn_cursor is ref cursor;

		l_id_documento svr_documentos.id%type;
		l_ordem_lote   svr_documentos.lote_ordem%type;
		l_id_lote      svr_lotes.id%type;
		l_query    varchar2(2000);
		documentos dyn_cursor;

		cursor anexos(id_documento number) is
			SELECT anexodoc_id
			FROM svr_anexos_documento
			WHERE documento_id = id_documento;

	begin

		record_error('ERRO_DOC','GERA LOTE NORMAL ' || p_descricao ,null);
		record_error('ERRO_DOC','  1 ' || p_list_documentos ,null);
		select id_lote_seq.nextval
		into   l_id_lote
		from   dual;
		--    record_error('ERRO_DOC','  2 ' || to_char(l_id_lote) ,null);

		INSERT INTO svr_lotes (
			id
			,descricao
			,tipo_lote_rf
			,criado_por
			,data_criacao
			)
		VALUES (
			l_id_lote
			,p_descricao
			,1
			,user
			,sysdate
			);


		l_query := 	'select '                        ||
					'  id '                          ||
					'from '                          ||
					'  svr_documentos '              ||
					'where '                         ||
					'  id in (' || p_list_documentos || ') ' ||
					'order by '                      ||
					'  codigo_postal, destinatario, id ';

		l_ordem_lote := 0;

		open documentos for l_query;
		loop
			fetch documentos into l_id_documento;
			exit when documentos%notfound;

			l_ordem_lote := l_ordem_lote + 1;
			-- record_error('ERRO_DOC','  3 - A adicionar o documento ' || to_char(l_id_documento) ,null);

			update svr_documentos
			set    lote_ordem = l_ordem_lote
			,      lote_id    = l_id_lote
			where  id         = l_id_documento;

			for anexo in anexos(l_id_documento) loop
				l_ordem_lote := l_ordem_lote + 1;

				update svr_documentos
				set    lote_ordem = l_ordem_lote
				,      lote_id    = l_id_lote
				where  id         = anexo.anexodoc_id;

			end loop;
		end loop;
		close documentos;

		commit;
		return l_id_lote;
	end;

	function gera_lote_ordem_recibo(p_descricao in varchar2
									, p_list_documentos in varchar2)
	return number is

		type dyn_cursor is ref cursor;
		l_id_documento svr_documentos.id%type;
		l_nmrecibo     svr_documentos.parametro01%type;
		l_ordem_lote   svr_documentos.lote_ordem%type;
		l_id_lote      svr_lotes.id%type;
		l_query    varchar2(2000);
		documentos dyn_cursor;

		cursor anexos(id_documento number) is
			SELECT anexodoc_id
			FROM svr_anexos_documento
			WHERE documento_id = id_documento;

	begin

		record_error('ERRO_DOC','GERA LOTE ORDENADO POR RECIBO ' || p_descricao ,null);
		record_error('ERRO_DOC','  ' || p_list_documentos ,null);

		select id_lote_seq.nextval
		into   l_id_lote
		from   dual;

		INSERT INTO svr_lotes (
			id
			,descricao
			,tipo_lote_rf
			,criado_por
			,data_criacao
			)
		VALUES (
			l_id_lote
			,p_descricao
			,1
			,user
			,sysdate
			);

		l_query := 	'select '                                    	||
					'	a.id documento_id '                       	||
					', a.P_NMRECIBO nmrecibo '                   	||
					'from '                                      	||
					'	V_DOCUMENTOS_RECIBOS a '                    ||
					'where '                                     	||
					'	a.id in (' || p_list_documentos || ') '   	||
					'order by '                                  	||
					'	nmrecibo ';

		l_ordem_lote := 0;

		open documentos for l_query;
		loop
			fetch documentos into l_id_documento, l_nmrecibo;
			exit when documentos%notfound;

			l_ordem_lote := l_ordem_lote + 1;

			update svr_documentos
			set    lote_ordem = l_ordem_lote
			,      lote_id    = l_id_lote
			where  id         = l_id_documento;

			for anexo in anexos(l_id_documento) loop

				l_ordem_lote := l_ordem_lote + 1;

				update svr_documentos
				set    lote_ordem = l_ordem_lote
				,      lote_id    = l_id_lote
				where  id         = anexo.anexodoc_id;

			end loop;
		end loop;
		close documentos;

		return l_id_lote;
	end;

	function gera_lote_r2_d26x(p_descricao in varchar2
							, p_list_documentos in varchar2)
	return number is

		type dyn_cursor is ref cursor;
		l_id_documento        svr_documentos.id%type;
		l_id_carta            svr_documentos.id%type;
		l_ordem_lote          svr_documentos.lote_ordem%type;
		l_ordem_lote_carta    svr_documentos.lote_ordem%type;
		l_id_lote             svr_lotes.id%type;
		l_n_documentos        number;
		l_list_documentos     varchar2(5000) := '';
		l_ambiente_id         svr_documentos.ambiente_id%type;
		l_ultimo_destinatario svr_documentos.destinatario%type;
		l_destinatario        svr_documentos.destinatario%type;
		l_ultimo_codigo       svr_documentos.destinatario%type;
		l_codigo              svr_documentos.destinatario%type;
		l_cdunieco            svr_documentos.parametro01%type;
		l_nmpoliza            svr_documentos.parametro01%type;
		l_cdramo              svr_documentos.parametro01%type;
		l_dataactual          svr_documentos.parametro01%type;
		l_dataefeito	      svr_documentos.parametro01%type;
		l_estado		      svr_documentos.parametro01%type;
		l_usuario	          svr_documentos.parametro01%type;
		l_referencia          varchar2(4000); --indica a referencia a guardar na bd
		csql                  varchar(30);
		l_n_referencia        number;         --indica  o numero de 15 em 15
		l_parametros_carta    lista_parametros := lista_parametros();
		l_query               varchar2(4000);
		documentos            dyn_cursor;

	begin

		record_error('ERRO_DOC','GERA LOTE DE ATAS R2.D26X ' || p_descricao ,null);
		record_error('ERRO_DOC','  ' || p_list_documentos ,null);

		select id_lote_seq.nextval
		into   l_id_lote
		from   dual;

		INSERT INTO svr_lotes (
			id
			,descricao
			,tipo_lote_rf
			,criado_por
			,data_criacao
			)
		VALUES (
			l_id_lote
			,p_descricao
			,1
			,user
			,sysdate
			);


		l_query := 	'SELECT * '											||
					'FROM ( '											||
					'	SELECT a.id '									||
					'		,a.ambiente_id '							||
					'		,a.parametro02 P_USUARIO '					||
					'		,a.parametro03 P_DATAACTUAL '				||
					'		,a.parametro04 P_NMPOLIZA '					||
					'		,a.parametro05 P_CDUNIECO '					||
					'		,a.parametro06 P_CDRAMO '					||
					'		,a.parametro09 P_DATAEFEITO '				||
					'		,a.parametro10 P_ESTADO '					||
					'	FROM svr_documentos a '							||
					'	WHERE a.id IN (' || p_list_documentos  || ') )'	||
					'WHERE p_cdunieco IS NOT NULL '						||
					'	OR p_cdramo IS NOT NULL '						||
					'	OR P_NMPOLIZA IS NOT NULL '						||
					'	OR P_DATAEFEITO IS NOT NULL '					||
					'ORDER BY p_cdunieco '								||
					'	,p_cdramo '										||
					'	,P_NMPOLIZA '									||
					'	,P_DATAEFEITO ';

		l_ordem_lote       := 0;
		l_ordem_lote_carta := 0;
		l_n_documentos     := 0;
		l_n_referencia     := 0; --count da pagina por referencia

		open documentos for l_query;
		loop
			fetch documentos into l_id_documento, l_ambiente_id, l_usuario, l_dataactual, l_nmpoliza, l_cdunieco, l_cdramo, l_dataefeito,l_estado;
				l_ordem_lote   := l_ordem_lote   + 1;
			exit when documentos%notfound;

			l_dataactual := to_char(trunc(sysdate),'DD-MM-YYYY');

			l_parametros_carta.extend;
			l_parametros_carta(1) := parametro('_USER', l_ambiente_id );
			l_parametros_carta.extend;
			l_parametros_carta(2) := parametro('P_USUARIO',  l_usuario );
			l_parametros_carta.extend;
			l_parametros_carta(3) := parametro('P_DATAACTUAL',   l_dataactual );
			l_parametros_carta.extend;
			l_parametros_carta(4) := parametro('P_NMPOLIZA',l_nmpoliza );
			l_parametros_carta.extend;
			l_parametros_carta(5) := parametro('P_CDUNIECO', l_cdunieco );
			l_parametros_carta.extend;
			l_parametros_carta(6) := parametro('P_CDRAMO', l_cdramo );
			l_parametros_carta.extend;
			l_parametros_carta(7) := parametro('P_DATAEFEITO', l_dataefeito );
			l_parametros_carta.extend;
			l_parametros_carta(8) := parametro('P_ESTADO', l_estado );
			l_parametros_carta.extend;
			l_parametros_carta(9) := parametro('P_MODELO_ID', 'D1.A9');

			l_id_carta := FPEDIDO_EXECUCAO( 'D1.A9', l_parametros_carta);

			l_parametros_carta.delete;

			update svr_documentos
			set    lote_ordem = l_ordem_lote
			,      lote_id    = l_id_lote
			where  id         = l_id_carta;

			l_ordem_lote   := l_ordem_lote   + 1;

			update svr_documentos
			set    lote_ordem = l_ordem_lote
			,      lote_id    = l_id_lote
			where  id         = l_id_documento;

		end loop;

		close documentos;

		return l_id_lote;
	end;

	function gera_lote_r3_d25(p_descricao in varchar2
							, p_list_documentos in varchar2)
	return number is

		type dyn_cursor is ref cursor;
		l_id_documento        svr_documentos.id%type;
		l_id_carta            svr_documentos.id%type;
		l_ordem_lote          svr_documentos.lote_ordem%type;
		l_ordem_lote_carta    svr_documentos.lote_ordem%type;
		l_id_lote             svr_lotes.id%type;
		l_n_documentos        number;
		l_list_documentos     varchar2(5000) := '';
		l_ambiente_id         svr_documentos.ambiente_id%type;
		l_ultimo_destinatario svr_documentos.destinatario%type;
		l_destinatario        svr_documentos.destinatario%type;
		l_ultimo_codigo       svr_documentos.destinatario%type;
		l_codigo              svr_documentos.destinatario%type;
		l_cdunieco            svr_documentos.parametro01%type;
		l_apolice             svr_documentos.parametro01%type;
		l_cdramo              svr_documentos.parametro01%type;
		l_nmgarant            svr_documentos.parametro01%type;
		l_ultimo_cdunieco     svr_documentos.parametro01%type;
		l_ultimo_apolice      svr_documentos.parametro01%type;
		l_ultimo_cdramo       svr_documentos.parametro01%type;
		l_referencia          varchar2(4000); --indica a referencia a guardar na bd
		csql                  varchar(30);
		l_n_referencia        number;         --indica  o numero de 15 em 15
		l_parametros_carta    lista_parametros := lista_parametros();
		l_query               varchar2(4000);
		documentos            dyn_cursor;

	begin

		select id_lote_seq.nextval
		into   l_id_lote
		from   dual;

		INSERT INTO svr_lotes (
			id
			,descricao
			,tipo_lote_rf
			,criado_por
			,data_criacao
			)
		VALUES (
			l_id_lote
			,p_descricao || ' teste'
			,1
			,user
			,sysdate
			);


		l_query := 'SELECT * '                                    ||
				   'FROM ( '                                      ||
				   '  select '                                    ||
				   '    a.id '                                    ||
				   '  , a.ambiente_id '                           ||
				   '  , a.destinatario '                          ||
				   '  , a.codigo_postal '                         ||
				   '  , a.parametro05 P_CDUNIECO'                 ||
				   '  , a.parametro04 P_APOLICE'                  ||
				   '  , a.parametro06 P_CDRAMO'                   ||
				   '  , a.parametro07 P_NMGARANT'                 ||
				   '  from '                                      ||
				   '    svr_documentos           a '              ||
				   '  where '                                     ||
				   '    a.id in (' || p_list_documentos  || ') )' ||
				   'WHERE '                                       ||
				   '  p_cdunieco IS NOT NULL '                    ||
				   'OR '                                          ||
				   '  p_cdramo IS NOT NULL '                      ||
				   'OR '                                          ||
				   '  p_APOLICE IS NOT NULL '                     ||
				   'OR '                                          ||
				   '  p_nmgarant IS NOT NULL '                    ||
				   'order by '                                    ||
				   '  p_cdunieco, p_cdramo, p_APOLICE, to_number(p_nmgarant) ';

		l_ordem_lote       := 0;
		l_ordem_lote_carta := 0;
		l_n_documentos     := 0;
		l_n_referencia     := 0; --count da pagina por referencia

		-- depois com select
		l_n_referencia := l_n_referencia + 1; --count para comecar com o valor 1 ( pagina 1)

		SELECT 'DCM/' || trim(TO_CHAR(DCM_DOCSEQ.NEXTVAL,'000000')) || '/'
		INTO csql
		FROM dual;

		l_referencia := csql || l_n_referencia;

		open documentos for l_query;
		loop
			fetch documentos into l_id_documento, l_ambiente_id, l_destinatario, l_codigo, l_cdunieco, l_apolice, l_cdramo, l_nmgarant;
				l_ordem_lote   := l_ordem_lote   + 1;
			exit when documentos%notfound;

			l_n_documentos := l_n_documentos + 1;
			l_referencia := csql || l_n_referencia; --afectar quando entra

			if (nvl(l_destinatario,'XX') != nvl(l_ultimo_destinatario, nvl(l_destinatario,'XX')) ) or
				(nvl(l_cdunieco,'XX')     != nvl(l_ultimo_cdunieco    , nvl(l_cdunieco,'XX'))     ) or
				(nvl(l_apolice,'XX')      != nvl(l_ultimo_apolice     , nvl(l_apolice,'XX'))      ) or
				(nvl(l_cdramo,'XX')       != nvl(l_ultimo_cdramo      , nvl(l_cdramo,'XX'))       ) then

				if length(l_list_documentos) > 0 then
					/* Acrescentado por Jose Viegas 25-11-2004             */
					/* So envia carta se o destinatario estiver preenchido */
					if l_ultimo_destinatario is not null then

						l_parametros_carta.extend;
						l_parametros_carta(1) := parametro('P_CDUNIECO', l_ultimo_cdunieco );
						l_parametros_carta.extend;
						l_parametros_carta(2) := parametro('P_NMPOLIZA',  l_ultimo_apolice);
						l_parametros_carta.extend;
						l_parametros_carta(3) := parametro('P_CDRAMO',   l_ultimo_cdramo);
						l_parametros_carta.extend;
						l_parametros_carta(4) := parametro('P_LISTA_GARANTIAS',' AND GARANTIA.NMGARANT IN (' || l_list_documentos || ')');
						l_parametros_carta.extend;
						l_parametros_carta(5) := parametro('P_USUARIO', 'ADMINISTRADOR' );
						l_parametros_carta.extend;
						l_parametros_carta(6) := parametro('_USER', l_ambiente_id);
						l_parametros_carta.extend;
						l_parametros_carta(7) := parametro('P_N_REFERENCIA', l_referencia);
						l_id_carta := FPEDIDO_EXECUCAO( 'D1.A7', l_parametros_carta);
					end if;

					l_parametros_carta.delete;

					/* MOVIDO BLOCO B23 2010-10-07 */

					update svr_documentos
					set    lote_ordem = l_ordem_lote_carta
					,      lote_id    = l_id_lote
					where  id         = l_id_carta;

					l_ordem_lote_carta := l_ordem_lote;
					l_ordem_lote       := l_ordem_lote + 1;

				end if;

				/* BLOCO B23 alterado jose viegas 2010-10-07 */
				SELECT 'DCM/' || trim(TO_CHAR(DCM_DOCSEQ.NEXTVAL,'000000')) || '/'
				INTO csql
				FROM dual;

				l_n_referencia := 1;
				/* */

				l_list_documentos  := l_nmgarant;

				update svr_documentos
				set    lote_ordem = l_ordem_lote
				,      lote_id    = l_id_lote
				where  id         = l_id_documento;

				l_ultimo_destinatario := l_destinatario;
				l_ultimo_cdunieco     := l_cdunieco;
				l_ultimo_apolice      := l_apolice;
				l_ultimo_cdramo       := l_cdramo;
				l_n_documentos        := 1;

			else

				if length(l_list_documentos) > 0 then
					l_list_documentos := l_list_documentos || ', ' || l_nmgarant;
				else
					l_list_documentos := l_nmgarant;
				end if;

				update svr_documentos
				set    lote_ordem = l_ordem_lote
				,      lote_id    = l_id_lote
				where  id         = l_id_documento;

				l_ultimo_destinatario := l_destinatario;
				l_ultimo_cdunieco     := l_cdunieco;
				l_ultimo_apolice      := l_apolice;
				l_ultimo_cdramo       := l_cdramo;

				if l_n_documentos = 15 then
					l_parametros_carta.extend;
					l_parametros_carta(1) := parametro('P_CDUNIECO', l_cdunieco);
					l_parametros_carta.extend;
					l_parametros_carta(2) := parametro('P_NMPOLIZA',  l_apolice);
					l_parametros_carta.extend;
					l_parametros_carta(3) := parametro('P_CDRAMO',   l_cdramo);
					l_parametros_carta.extend;
					l_parametros_carta(4) := parametro('P_LISTA_GARANTIAS',' AND GARANTIA.NMGARANT IN (' || l_list_documentos || ')');
					l_parametros_carta.extend;
					l_parametros_carta(5) := parametro('P_USUARIO', 'ADMINISTRADOR' );
					l_parametros_carta.extend;
					l_parametros_carta(6) := parametro('_USER', l_ambiente_id);
					l_parametros_carta.extend;
					l_parametros_carta(7) := parametro('P_N_REFERENCIA', l_referencia);
					l_id_carta := FPEDIDO_EXECUCAO( 'D1.A7', l_parametros_carta);

					l_parametros_carta.delete;
					l_n_referencia := l_n_referencia + 1; -- acualizar o count ( pagina n+1)

					update svr_documentos
					set    lote_ordem = l_ordem_lote_carta
					,      lote_id    = l_id_lote
					where  id         = l_id_carta;

					l_ordem_lote := l_ordem_lote + 1;
					l_ordem_lote_carta := l_ordem_lote;

					l_list_documentos := '';
					l_n_documentos    := 0;
				end if;
			end if;
		end loop;

		if l_n_documentos > 0 then

			l_referencia := csql || l_n_referencia;

			l_parametros_carta.extend;
			l_parametros_carta(1) := parametro('P_CDUNIECO', l_cdunieco);
			l_parametros_carta.extend;
			l_parametros_carta(2) := parametro('P_NMPOLIZA',  l_apolice);
			l_parametros_carta.extend;
			l_parametros_carta(3) := parametro('P_CDRAMO',   l_cdramo);
			l_parametros_carta.extend;
			l_parametros_carta(4) := parametro('P_LISTA_GARANTIAS',' AND GARANTIA.NMGARANT IN (' || l_list_documentos || ')');
			l_parametros_carta.extend;
			l_parametros_carta(5) := parametro('P_USUARIO', 'ADMINISTRADOR' );
			l_parametros_carta.extend;
			l_parametros_carta(6) := parametro('_USER', l_ambiente_id);
			l_parametros_carta.extend;
			l_parametros_carta(7) := parametro('P_N_REFERENCIA', l_referencia);
			l_id_carta := FPEDIDO_EXECUCAO( 'D1.A7', l_parametros_carta);
			l_parametros_carta.delete;
			l_n_referencia := 1;

			l_ordem_lote := l_ordem_lote + 1;

			update svr_documentos
			set    lote_ordem = l_ordem_lote_carta
			,      lote_id    = l_id_lote
			where  id         = l_id_carta;

		end if;

		close documentos;

		return l_id_lote;
	end;

	function gera_lote_r3_d25r(p_descricao in varchar2
							, p_list_documentos in varchar2)
	return number is

		type dyn_cursor is ref cursor;
		l_id_documento        svr_documentos.id%type;
		l_id_carta            svr_documentos.id%type;
		l_ordem_lote          svr_documentos.lote_ordem%type;
		l_ordem_lote_carta    svr_documentos.lote_ordem%type;
		l_id_lote             svr_lotes.id%type;
		l_n_documentos        number;
		l_list_documentos     varchar2(5000) := '';
		l_ambiente_id         svr_documentos.ambiente_id%type;
		l_ultimo_destinatario svr_documentos.destinatario%type;
		l_destinatario        svr_documentos.destinatario%type;
		l_ultimo_codigo       svr_documentos.destinatario%type;
		l_codigo              svr_documentos.destinatario%type;
		l_cdunieco            svr_documentos.parametro01%type;
		l_apolice             svr_documentos.parametro01%type;
		l_cdramo              svr_documentos.parametro01%type;
		l_nmgarant            svr_documentos.parametro01%type;
		l_ultimo_cdunieco     svr_documentos.parametro01%type;
		l_ultimo_apolice      svr_documentos.parametro01%type;
		l_ultimo_cdramo       svr_documentos.parametro01%type;
		l_referencia          varchar2(4000); --indica a referencia a guardar na bd
		csql                  varchar(30);
		l_n_referencia        number;         --indica  o numero de 15 em 15
		l_parametros_carta    lista_parametros := lista_parametros();
		l_query               varchar2(4000);
		documentos            dyn_cursor;

	begin

		select id_lote_seq.nextval
		into   l_id_lote
		from   dual;

		INSERT INTO svr_lotes (
			id
			,descricao
			,tipo_lote_rf
			,criado_por
			,data_criacao
			)
		VALUES (
			l_id_lote
			,p_descricao || ' teste'
			,1
			,user
			,sysdate
			);

		l_query := 'SELECT * '                                    ||
				   'FROM ( '                                      ||
				   '  select '                                    ||
				   '    a.id '                                    ||
				   '  , a.ambiente_id '                           ||
				   '  , a.destinatario '                          ||
				   '  , a.codigo_postal '                         ||
				   '  , a.parametro05 P_CDUNIECO'                 ||
				   '  , a.parametro04 P_APOLICE'                  ||
				   '  , a.parametro06 P_CDRAMO'                   ||
				   '  , a.parametro07 P_NMGARANT'                 ||
				   '  from '                                      ||
				   '    svr_documentos           a '              ||
				   '  where '                                     ||
				   '    a.id in (' || p_list_documentos  || ') )' ||
				   'WHERE '                                       ||
				   '  p_cdunieco IS NOT NULL '                    ||
				   'OR '                                          ||
				   '  p_cdramo IS NOT NULL '                      ||
				   'OR '                                          ||
				   '  p_APOLICE IS NOT NULL '                     ||
				   'OR '                                          ||
				   '  p_nmgarant IS NOT NULL '                    ||
				   'order by '                                    ||
				   '  p_cdunieco, p_cdramo, p_APOLICE, to_number(p_nmgarant) ';

		l_ordem_lote       := 0;
		l_ordem_lote_carta := 0;
		l_n_documentos     := 0;
		l_n_referencia     := 0; --count da pagina por referencia

		-- depois com select
		l_n_referencia := l_n_referencia + 1; --count para comecar com o valor 1 ( pagina 1)

		SELECT 'DCM/' || trim(TO_CHAR(DCM_DOCSEQ.NEXTVAL,'000000')) || '/'
		INTO csql
		FROM dual;

		l_referencia := csql || l_n_referencia;

		open documentos for l_query;
		loop
			fetch documentos into l_id_documento, l_ambiente_id, l_destinatario, l_codigo, l_cdunieco, l_apolice, l_cdramo, l_nmgarant;
				l_ordem_lote   := l_ordem_lote   + 1;
			exit when documentos%notfound;

			l_n_documentos := l_n_documentos + 1;
			l_referencia := csql || l_n_referencia; --afectar quando entra

			if (nvl(l_destinatario,'XX') != nvl(l_ultimo_destinatario, nvl(l_destinatario,'XX')) ) or
				(nvl(l_cdunieco,'XX')     != nvl(l_ultimo_cdunieco    , nvl(l_cdunieco,'XX'))     ) or
				(nvl(l_apolice,'XX')      != nvl(l_ultimo_apolice     , nvl(l_apolice,'XX'))      ) or
				(nvl(l_cdramo,'XX')       != nvl(l_ultimo_cdramo      , nvl(l_cdramo,'XX'))       ) then

				if length(l_list_documentos) > 0 then
				/* Acrescentado por Jose Viegas 25-11-2004             */
				/* So envia carta se o destinatario estiver preenchido */
					if l_ultimo_destinatario is not null then

						l_parametros_carta.extend;
						l_parametros_carta(1) := parametro('P_CDUNIECO', l_ultimo_cdunieco );
						l_parametros_carta.extend;
						l_parametros_carta(2) := parametro('P_NMPOLIZA',  l_ultimo_apolice);
						l_parametros_carta.extend;
						l_parametros_carta(3) := parametro('P_CDRAMO',   l_ultimo_cdramo);
						l_parametros_carta.extend;
						l_parametros_carta(4) := parametro('P_LISTA_GARANTIAS',' AND GARANTIA.NMGARANT IN (' || l_list_documentos || ')');
						l_parametros_carta.extend;
						l_parametros_carta(5) := parametro('P_USUARIO', 'ADMINISTRADOR' );
						l_parametros_carta.extend;
						l_parametros_carta(6) := parametro('_USER', l_ambiente_id);
						l_parametros_carta.extend;
						l_parametros_carta(7) := parametro('P_N_REFERENCIA', l_referencia);
						l_id_carta := FPEDIDO_EXECUCAO( 'D1.A7R', l_parametros_carta);

					end if;

					l_parametros_carta.delete;

					/* BLOCO B23 MOVIDO 2010-10-07
					SELECT 'DCM/' || trim(TO_CHAR(DCM_DOCSEQ.NEXTVAL,'000000')) || '/'
					INTO csql
					FROM dual;

					l_n_referencia := 1;
					/* */

					update svr_documentos
					set    lote_ordem = l_ordem_lote_carta
					,      lote_id    = l_id_lote
					where  id         = l_id_carta;

					l_ordem_lote_carta := l_ordem_lote;
					l_ordem_lote       := l_ordem_lote + 1;

				end if;

				/* BLOCO B23 alterado jose viegas 2010-10-07 */
				SELECT 'DCM/' || trim(TO_CHAR(DCM_DOCSEQ.NEXTVAL,'000000')) || '/'
				INTO csql
				FROM dual;

				l_n_referencia := 1;
				/* */
				l_list_documentos  := l_nmgarant;

				update svr_documentos
				set    lote_ordem = l_ordem_lote
				,      lote_id    = l_id_lote
				where  id         = l_id_documento;

				l_ultimo_destinatario := l_destinatario;
				l_ultimo_cdunieco     := l_cdunieco;
				l_ultimo_apolice      := l_apolice;
				l_ultimo_cdramo       := l_cdramo;
				l_n_documentos        := 1;

			else

				if length(l_list_documentos) > 0 then
					l_list_documentos := l_list_documentos || ', ' || l_nmgarant;
				else
					l_list_documentos := l_nmgarant;
				end if;

				update svr_documentos
				set    lote_ordem = l_ordem_lote
				,      lote_id    = l_id_lote
				where  id         = l_id_documento;

				l_ultimo_destinatario := l_destinatario;
				l_ultimo_cdunieco     := l_cdunieco;
				l_ultimo_apolice      := l_apolice;
				l_ultimo_cdramo       := l_cdramo;

				if l_n_documentos = 15 then
					l_parametros_carta.extend;
					l_parametros_carta(1) := parametro('P_CDUNIECO', l_cdunieco);
					l_parametros_carta.extend;
					l_parametros_carta(2) := parametro('P_NMPOLIZA',  l_apolice);
					l_parametros_carta.extend;
					l_parametros_carta(3) := parametro('P_CDRAMO',   l_cdramo);
					l_parametros_carta.extend;
					l_parametros_carta(4) := parametro('P_LISTA_GARANTIAS',' AND GARANTIA.NMGARANT IN (' || l_list_documentos || ')');
					l_parametros_carta.extend;
					l_parametros_carta(5) := parametro('P_USUARIO', 'ADMINISTRADOR' );
					l_parametros_carta.extend;
					l_parametros_carta(6) := parametro('_USER', l_ambiente_id);
					l_parametros_carta.extend;
					l_parametros_carta(7) := parametro('P_N_REFERENCIA', l_referencia);
					l_id_carta := FPEDIDO_EXECUCAO( 'D1.A7R', l_parametros_carta);
					l_parametros_carta.delete;

					l_n_referencia := l_n_referencia + 1; -- acualizar o count ( pagina n+1)

					update svr_documentos
					set    lote_ordem = l_ordem_lote_carta
					,      lote_id    = l_id_lote
					where  id         = l_id_carta;

					l_ordem_lote := l_ordem_lote + 1;
					l_ordem_lote_carta := l_ordem_lote;

					l_list_documentos := '';
					l_n_documentos    := 0;
				end if;
			end if;
		end loop;

		if l_n_documentos > 0 then

			l_referencia := csql || l_n_referencia;
			l_parametros_carta.extend;
			l_parametros_carta(1) := parametro('P_CDUNIECO', l_cdunieco);
			l_parametros_carta.extend;
			l_parametros_carta(2) := parametro('P_NMPOLIZA',  l_apolice);
			l_parametros_carta.extend;
			l_parametros_carta(3) := parametro('P_CDRAMO',   l_cdramo);
			l_parametros_carta.extend;
			l_parametros_carta(4) := parametro('P_LISTA_GARANTIAS',' AND GARANTIA.NMGARANT IN (' || l_list_documentos || ')');
			l_parametros_carta.extend;
			l_parametros_carta(5) := parametro('P_USUARIO', 'ADMINISTRADOR' );
			l_parametros_carta.extend;
			l_parametros_carta(6) := parametro('_USER', l_ambiente_id);
			l_parametros_carta.extend;
			l_parametros_carta(7) := parametro('P_N_REFERENCIA', l_referencia);
			l_id_carta := FPEDIDO_EXECUCAO( 'D1.A7R', l_parametros_carta);
			l_parametros_carta.delete;

			l_n_referencia := 1;

			l_ordem_lote := l_ordem_lote + 1;

			update svr_documentos
			set    lote_ordem = l_ordem_lote_carta
			,      lote_id    = l_id_lote
			where  id         = l_id_carta;

		end if;

		close documentos;
		return l_id_lote;

	end;

	function gera_lote_r3_d27(p_descricao in varchar2
							, p_list_documentos in varchar2)
	return number is

		type dyn_cursor is ref cursor;
		l_id_documento        svr_documentos.id%type;
		l_id_carta            svr_documentos.id%type;
		l_ordem_lote          svr_documentos.lote_ordem%type;
		l_ordem_lote_carta    svr_documentos.lote_ordem%type;
		l_id_lote             svr_lotes.id%type;
		l_n_documentos        number;
		l_list_documentos     varchar2(5000) := '';
		l_ambiente_id         svr_documentos.ambiente_id%type;
		l_ultimo_destinatario svr_documentos.destinatario%type;
		l_destinatario        svr_documentos.destinatario%type;
		l_ultimo_codigo       svr_documentos.destinatario%type;
		l_codigo              svr_documentos.destinatario%type;
		l_cdunieco            svr_documentos.parametro01%type;
		l_apolice             svr_documentos.parametro01%type;
		l_cdramo              svr_documentos.parametro01%type;
		l_nmsituac            svr_documentos.parametro01%type;
		l_nmgarant            svr_documentos.parametro01%type;
		l_ultimo_cdunieco     svr_documentos.parametro01%type;
		l_ultimo_cdramo       svr_documentos.parametro01%type;
		l_ultimo_apolice      svr_documentos.parametro01%type;
		l_ultimo_nmsituac     svr_documentos.parametro01%type;
		l_referencia          varchar2(4000); --indica a referencia a guardar na bd
		csql                  varchar(30);
		l_n_referencia        number;         --indica  o numero de 15 em 15
		l_parametros_carta    lista_parametros := lista_parametros();
		l_query               varchar2(4000);
		documentos            dyn_cursor;

	begin

		select id_lote_seq.nextval
		into   l_id_lote
		from   dual;

		INSERT INTO svr_lotes (
			id
			,descricao
			,tipo_lote_rf
			,criado_por
			,data_criacao
			)
		VALUES (
			l_id_lote
			,p_descricao
			,1
			,user
			,sysdate
			);


		l_query := 'SELECT * '                                    ||
				   'FROM ( '                                      ||
				   '  select '                                    ||
				   '    a.id '                                    ||
				   '  , a.ambiente_id '                           ||
				   '  , a.destinatario '                          ||
				   '  , a.codigo_postal '                         ||
				   '  , a.parametro05 P_CDUNIECO'                 ||
				   '  , a.parametro04 P_APOLICE'                  ||
				   '  , a.parametro06 P_CDRAMO'                   ||
				   '  , a.parametro08 P_NMSITUAC'                 ||
				   '  , a.parametro07 P_nmgarant'                 ||
				   '  from '                                      ||
				   '    svr_documentos           a '              ||
				   '  where '                                     ||
				   '    a.id in (' || p_list_documentos  || ') )' ||
				   'WHERE '                                       ||
				   '  p_cdunieco IS NOT NULL '                    ||
				   'OR '                                          ||
				   '  p_cdramo IS NOT NULL '                      ||
				   'OR '                                          ||
				   '  p_APOLICE IS NOT NULL '                     ||
				   'OR '                                          ||
				   '  p_nmsituac IS NOT NULL '                    ||
				   'OR '                                          ||
				   '  p_nmgarant IS NOT NULL '                    ||
				   'order by '                                    ||
				   '  codigo_postal, destinatario, p_cdunieco, p_apolice, p_cdramo , to_number(p_nmgarant)';

		l_ordem_lote       := 0;
		l_ordem_lote_carta := 0;
		l_n_documentos     := 0;
		l_n_referencia     := 0; --count da pagina por referencia

		-- depois com select
		l_n_referencia := l_n_referencia + 1; --count para comecar com o valor 1 ( pagina 1)

		SELECT 'DCM/' || trim(TO_CHAR(DCM_DOCSEQ.NEXTVAL,'000000')) || '/'
		INTO csql
		FROM dual;

		l_referencia := csql || l_n_referencia;

		open documentos for l_query;
		loop
			fetch documentos into l_id_documento, l_ambiente_id, l_destinatario, l_codigo, l_cdunieco,
								l_apolice     , l_cdramo     , l_nmsituac    , l_nmgarant;
				l_ordem_lote   := l_ordem_lote   + 1;
			exit when documentos%notfound;

			l_n_documentos := l_n_documentos + 1;
			l_referencia := csql || l_n_referencia; --afectar quando entra

			if (nvl(l_destinatario,'XX') != nvl(l_ultimo_destinatario,nvl(l_destinatario,'XX'))) or
				(nvl(l_cdunieco,'XX')     != nvl(l_ultimo_cdunieco,nvl(l_cdunieco,'XX'))    ) or
				(nvl(l_apolice,'XX')      != nvl(l_ultimo_apolice,nvl(l_apolice,'XX'))     ) or
				(nvl(l_cdramo,'XX')       != nvl(l_ultimo_cdramo,nvl(l_cdramo,'XX'))      ) then

				if length(l_list_documentos) > 0  then
				/* Acrescentado por Jose Viegas 25-11-2004             */
				/* So envia carta se o destinatario estiver preenchido */
					if l_ultimo_destinatario is not null then

						l_parametros_carta.extend;
						l_parametros_carta(1) := parametro('P_CDUNIECO', l_ultimo_cdunieco);
						l_parametros_carta.extend;
						l_parametros_carta(2) := parametro('P_NMPOLIZA',  l_ultimo_apolice);
						l_parametros_carta.extend;
						l_parametros_carta(3) := parametro('P_CDRAMO',   l_ultimo_cdramo);
						l_parametros_carta.extend;
						l_parametros_carta(4) := parametro('P_NMSITUAC', l_ultimo_nmsituac );
						l_parametros_carta.extend;
						l_parametros_carta(5) := parametro('P_LISTA_GARANTIAS',' AND GARANTIA.NMGARANT IN (' || l_list_documentos || ')');
						l_parametros_carta.extend;
						l_parametros_carta(6) := parametro('P_CDPERSON', l_ultimo_destinatario );
						l_parametros_carta.extend;
						l_parametros_carta(7) := parametro('P_USUARIO', 'ADMINISTRADOR' );
						l_parametros_carta.extend;
						l_parametros_carta(8) := parametro('_USER', l_ambiente_id);
						l_parametros_carta.extend;
						l_parametros_carta(9) := parametro('P_N_REFERENCIA', l_referencia);
						l_id_carta := FPEDIDO_EXECUCAO( 'D1.A5', l_parametros_carta);

					end if;

					l_parametros_carta.delete;

					/* BLOCO B23 MOVIDO 2010-10-07
					SELECT 'DCM/' || trim(TO_CHAR(DCM_DOCSEQ.NEXTVAL,'000000')) || '/'
					INTO csql
					FROM dual;

					l_n_referencia := 1;
					/* */

					update svr_documentos
					set    lote_ordem = l_ordem_lote_carta
					,      lote_id    = l_id_lote
					where  id         = l_id_carta;

					l_ordem_lote_carta := l_ordem_lote;
					l_ordem_lote       := l_ordem_lote   + 1;

				end if;

				/* BLOCO B23 alterado jose viegas 2010-10-07 */
				SELECT 'DCM/' || trim(TO_CHAR(DCM_DOCSEQ.NEXTVAL,'000000')) || '/'
				INTO csql
				FROM dual;

				l_n_referencia := 1;
				/* */

				l_list_documentos  := l_nmgarant;

				update svr_documentos
				set    lote_ordem = l_ordem_lote
				,      lote_id    = l_id_lote
				where  id         = l_id_documento;

				l_ultimo_destinatario := l_destinatario;
				l_ultimo_nmsituac     := l_nmsituac;
				l_ultimo_cdunieco     := l_cdunieco;
				l_ultimo_apolice      := l_apolice;
				l_ultimo_cdramo       := l_cdramo;
				l_n_documentos        := 1;
			else

				if length(l_list_documentos) > 0 then
					l_list_documentos := l_list_documentos || ', ' || l_nmgarant;
				else
					l_list_documentos := l_nmgarant;
				end if;

				update svr_documentos
				set    lote_ordem = l_ordem_lote
				,      lote_id    = l_id_lote
				where  id         = l_id_documento;

				l_ultimo_destinatario := l_destinatario;
				l_ultimo_nmsituac     := l_nmsituac;
				l_ultimo_cdunieco     := l_cdunieco;
				l_ultimo_apolice      := l_apolice;
				l_ultimo_cdramo       := l_cdramo;

				if l_n_documentos = 15 then

					l_parametros_carta.extend;
					l_parametros_carta(1) := parametro('P_CDUNIECO', l_ultimo_cdunieco);
					l_parametros_carta.extend;
					l_parametros_carta(2) := parametro('P_NMPOLIZA',  l_ultimo_apolice);
					l_parametros_carta.extend;
					l_parametros_carta(3) := parametro('P_CDRAMO',   l_ultimo_cdramo);
					l_parametros_carta.extend;
					l_parametros_carta(4) := parametro('P_NMSITUAC', l_ultimo_nmsituac );
					l_parametros_carta.extend;
					l_parametros_carta(5) := parametro('P_LISTA_GARANTIAS',' AND GARANTIA.NMGARANT IN (' || l_list_documentos || ')');
					l_parametros_carta.extend;
					l_parametros_carta(6) := parametro('P_CDPERSON', l_ultimo_destinatario );
					l_parametros_carta.extend;
					l_parametros_carta(7) := parametro('P_USUARIO', 'ADMINISTRADOR');
					l_parametros_carta.extend;
					l_parametros_carta(8) := parametro('_USER', l_ambiente_id);
					l_parametros_carta.extend;
					l_parametros_carta(9) := parametro('P_N_REFERENCIA', l_referencia);
					l_id_carta := FPEDIDO_EXECUCAO( 'D1.A5', l_parametros_carta);
					l_parametros_carta.delete;

					l_n_referencia := l_n_referencia + 1; -- acualizar o count ( pagina n+1)

					update svr_documentos
					set    lote_ordem = l_ordem_lote_carta
					,      lote_id    = l_id_lote
					where  id         = l_id_carta;

					l_ordem_lote       := l_ordem_lote + 1;
					l_ordem_lote_carta := l_ordem_lote;

					l_list_documentos := '';
					l_n_documentos    := 0;
				end if;
			end if;
		end loop;

		if l_n_documentos > 0 then

			l_referencia := csql || l_n_referencia;
			l_parametros_carta.extend;
			l_parametros_carta(1) := parametro('P_CDUNIECO', l_ultimo_cdunieco);
			l_parametros_carta.extend;
			l_parametros_carta(2) := parametro('P_NMPOLIZA',  l_ultimo_apolice);
			l_parametros_carta.extend;
			l_parametros_carta(3) := parametro('P_CDRAMO',   l_ultimo_cdramo);
			l_parametros_carta.extend;
			l_parametros_carta(4) := parametro('P_NMSITUAC', l_ultimo_nmsituac );
			l_parametros_carta.extend;
			l_parametros_carta(5) := parametro('P_LISTA_GARANTIAS',' AND GARANTIA.NMGARANT IN (' || l_list_documentos || ')');
			l_parametros_carta.extend;
			l_parametros_carta(6) := parametro('P_CDPERSON', l_ultimo_destinatario );
			l_parametros_carta.extend;
			l_parametros_carta(7) := parametro('P_USUARIO', 'ADMINISTRADOR' );
			l_parametros_carta.extend;
			l_parametros_carta(8) := parametro('_USER', l_ambiente_id);
			l_parametros_carta.extend;
			l_parametros_carta(9) := parametro('P_N_REFERENCIA', l_referencia);
			l_id_carta := FPEDIDO_EXECUCAO( 'D1.A5', l_parametros_carta);
			l_parametros_carta.delete;

			l_n_referencia := 1;

			update svr_documentos
			set    lote_ordem = l_ordem_lote_carta
			,      lote_id    = l_id_lote
			where  id         = l_id_carta;

		end if;

		close documentos;
		return l_id_lote;
	end;

	function gera_lote_r3_d31(p_descricao in varchar2
							, p_list_documentos in varchar2)
	return number is

		type dyn_cursor is ref cursor;
		l_id_documento        svr_documentos.id%type;
		l_id_carta            svr_documentos.id%type;
		l_ordem_lote          svr_documentos.lote_ordem%type;
		l_ordem_lote_carta    svr_documentos.lote_ordem%type;
		l_id_lote             svr_lotes.id%type;
		l_n_documentos        number;
		l_list_documentos     varchar2(5000) := '';
		l_ambiente_id         svr_documentos.ambiente_id%type;
		l_ultimo_destinatario svr_documentos.destinatario%type;
		l_destinatario        svr_documentos.destinatario%type;
		l_ultimo_codigo       svr_documentos.destinatario%type;
		l_codigo              svr_documentos.destinatario%type;
		l_cdunieco            svr_documentos.parametro01%type;
		l_apolice             svr_documentos.parametro01%type;
		l_cdramo              svr_documentos.parametro01%type;
		l_nmsituac            svr_documentos.parametro01%type;
		l_nmgarant            svr_documentos.parametro01%type;
		l_ultimo_cdunieco     svr_documentos.parametro01%type;
		l_ultimo_cdramo       svr_documentos.parametro01%type;
		l_ultimo_apolice      svr_documentos.parametro01%type;
		l_ultimo_nmsituac     svr_documentos.parametro01%type;
		l_referencia          varchar2(4000); --indica a referencia a guardar na bd
		csql                  varchar(30);
		l_n_referencia        number;         --indica  o numero de 15 em 15
		l_parametros_carta    lista_parametros := lista_parametros();
		l_query               varchar2(4000);
		documentos            dyn_cursor;

	begin

		select id_lote_seq.nextval
		into   l_id_lote
		from   dual;

		INSERT INTO svr_lotes (
			id
			,descricao
			,tipo_lote_rf
			,criado_por
			,data_criacao
			)
		VALUES (
			l_id_lote
			,p_descricao
			,1
			,user
			,sysdate
			);


		l_query := 'SELECT * '                                    ||
				   'FROM ( '                                      ||
				   '  select '                                    ||
				   '    a.id '                                    ||
				   '  , a.ambiente_id '                           ||
				   '  , a.destinatario '                          ||
				   '  , a.codigo_postal '                         ||
				   '  , a.parametro05 P_CDUNIECO'                 ||
				   '  , a.parametro04 P_APOLICE'                  ||
				   '  , a.parametro06 P_CDRAMO'                   ||
				   '  , a.parametro08 P_NMSITUAC'                 ||
				   '  , a.parametro07 P_nmgarant'                 ||
				   '  from '                                      ||
				   '    svr_documentos           a '              ||
				   '  where '                                     ||
				   '    a.id in (' || p_list_documentos  || ') )' ||
				   'WHERE '                                       ||
				   '  p_cdunieco IS NOT NULL '                    ||
				   'OR '                                          ||
				   '  p_cdramo IS NOT NULL '                      ||
				   'OR '                                          ||
				   '  p_APOLICE IS NOT NULL '                     ||
				   'OR '                                          ||
				   '  p_nmsituac IS NOT NULL '                    ||
				   'OR '                                          ||
				   '  p_nmgarant IS NOT NULL '                    ||
				   'order by '                                    ||
				   '  codigo_postal, destinatario, p_cdunieco, p_apolice, p_cdramo , to_number(p_nmgarant)';

		l_ordem_lote       := 0;
		l_ordem_lote_carta := 0;
		l_n_documentos     := 0;
		l_n_referencia     := 0; --count da pagina por referencia

		-- depois com select
		l_n_referencia := l_n_referencia + 1; --count para comecar com o valor 1 ( pagina 1)

		SELECT 'DCM/' || trim(TO_CHAR(DCM_DOCSEQ.NEXTVAL,'000000')) || '/'
		INTO csql
		FROM dual;

		l_referencia := csql || l_n_referencia;

		open documentos for l_query;
		loop
			fetch documentos into l_id_documento, l_ambiente_id, l_destinatario, l_codigo, l_cdunieco,
								l_apolice     , l_cdramo     , l_nmsituac    , l_nmgarant;
				l_ordem_lote   := l_ordem_lote   + 1;
			exit when documentos%notfound;

			l_n_documentos := l_n_documentos + 1;
			l_referencia := csql || l_n_referencia; --afectar quando entra

			if (nvl(l_destinatario,'XX') != nvl(l_ultimo_destinatario,nvl(l_destinatario,'XX'))) or
				(nvl(l_cdunieco,'XX')     != nvl(l_ultimo_cdunieco,nvl(l_cdunieco,'XX'))    ) or
				(nvl(l_apolice,'XX')      != nvl(l_ultimo_apolice,nvl(l_apolice,'XX'))     ) or
				(nvl(l_cdramo,'XX')       != nvl(l_ultimo_cdramo,nvl(l_cdramo,'XX'))      ) then

				if length(l_list_documentos) > 0  then
				/* Acrescentado por Jose Viegas 25-11-2004             */
				/* So envia carta se o destinatario estiver preenchido */
					if l_ultimo_destinatario is not null then

						l_parametros_carta.extend;
						l_parametros_carta(1) := parametro('P_CDUNIECO', l_ultimo_cdunieco);
						l_parametros_carta.extend;
						l_parametros_carta(2) := parametro('P_NMPOLIZA',  l_ultimo_apolice);
						l_parametros_carta.extend;
						l_parametros_carta(3) := parametro('P_CDRAMO',   l_ultimo_cdramo);
						l_parametros_carta.extend;
						l_parametros_carta(4) := parametro('P_NMSITUAC', l_ultimo_nmsituac );
						l_parametros_carta.extend;
						l_parametros_carta(5) := parametro('P_LISTA_GARANTIAS',' AND GARANTIA.NMGARANT IN (' || l_list_documentos || ')');
						l_parametros_carta.extend;
						l_parametros_carta(6) := parametro('P_CDPERSON', l_ultimo_destinatario );
						l_parametros_carta.extend;
						l_parametros_carta(7) := parametro('P_USUARIO', 'ADMINISTRADOR' );
						l_parametros_carta.extend;
						l_parametros_carta(8) := parametro('_USER', l_ambiente_id);
						l_parametros_carta.extend;
						l_parametros_carta(9) := parametro('P_N_REFERENCIA', l_referencia);
						l_id_carta := FPEDIDO_EXECUCAO( 'D1.A5', l_parametros_carta);

					end if;

					l_parametros_carta.delete;

					/* BLOCO B23 MOVIDO 2010-10-07
					SELECT 'DCM/' || trim(TO_CHAR(DCM_DOCSEQ.NEXTVAL,'000000')) || '/'
					INTO csql
					FROM dual;

					l_n_referencia := 1;
					/* */

					update svr_documentos
					set    lote_ordem = l_ordem_lote_carta
					,      lote_id    = l_id_lote
					where  id         = l_id_carta;

					l_ordem_lote_carta := l_ordem_lote;
					l_ordem_lote       := l_ordem_lote   + 1;

				end if;

				/* BLOCO B23 alterado jose viegas 2010-10-07 */
				SELECT 'DCM/' || trim(TO_CHAR(DCM_DOCSEQ.NEXTVAL,'000000')) || '/'
				INTO csql
				FROM dual;

				l_n_referencia := 1;
				/* */

				l_list_documentos  := l_nmgarant;

				update svr_documentos
				set    lote_ordem = l_ordem_lote
				,      lote_id    = l_id_lote
				where  id         = l_id_documento;

				l_ultimo_destinatario := l_destinatario;
				l_ultimo_nmsituac     := l_nmsituac;
				l_ultimo_cdunieco     := l_cdunieco;
				l_ultimo_apolice      := l_apolice;
				l_ultimo_cdramo       := l_cdramo;
				l_n_documentos        := 1;
			else

				if length(l_list_documentos) > 0 then
					l_list_documentos := l_list_documentos || ', ' || l_nmgarant;
				else
					l_list_documentos := l_nmgarant;
				end if;

				update svr_documentos
				set    lote_ordem = l_ordem_lote
				,      lote_id    = l_id_lote
				where  id         = l_id_documento;

				l_ultimo_destinatario := l_destinatario;
				l_ultimo_nmsituac     := l_nmsituac;
				l_ultimo_cdunieco     := l_cdunieco;
				l_ultimo_apolice      := l_apolice;
				l_ultimo_cdramo       := l_cdramo;

				if l_n_documentos = 15 then

					l_parametros_carta.extend;
					l_parametros_carta(1) := parametro('P_CDUNIECO', l_ultimo_cdunieco);
					l_parametros_carta.extend;
					l_parametros_carta(2) := parametro('P_NMPOLIZA',  l_ultimo_apolice);
					l_parametros_carta.extend;
					l_parametros_carta(3) := parametro('P_CDRAMO',   l_ultimo_cdramo);
					l_parametros_carta.extend;
					l_parametros_carta(4) := parametro('P_NMSITUAC', l_ultimo_nmsituac );
					l_parametros_carta.extend;
					l_parametros_carta(5) := parametro('P_LISTA_GARANTIAS',' AND GARANTIA.NMGARANT IN (' || l_list_documentos || ')');
					l_parametros_carta.extend;
					l_parametros_carta(6) := parametro('P_CDPERSON', l_ultimo_destinatario );
					l_parametros_carta.extend;
					l_parametros_carta(7) := parametro('P_USUARIO', 'ADMINISTRADOR');
					l_parametros_carta.extend;
					l_parametros_carta(8) := parametro('_USER', l_ambiente_id);
					l_parametros_carta.extend;
					l_parametros_carta(9) := parametro('P_N_REFERENCIA', l_referencia);
					l_id_carta := FPEDIDO_EXECUCAO( 'D1.A5', l_parametros_carta);
					l_parametros_carta.delete;

					l_n_referencia := l_n_referencia + 1; -- acualizar o count ( pagina n+1)

					update svr_documentos
					set    lote_ordem = l_ordem_lote_carta
					,      lote_id    = l_id_lote
					where  id         = l_id_carta;

					l_ordem_lote       := l_ordem_lote + 1;
					l_ordem_lote_carta := l_ordem_lote;

					l_list_documentos := '';
					l_n_documentos    := 0;
				end if;
			end if;
		end loop;

		if l_n_documentos > 0 then

			l_referencia := csql || l_n_referencia;
			l_parametros_carta.extend;
			l_parametros_carta(1) := parametro('P_CDUNIECO', l_ultimo_cdunieco);
			l_parametros_carta.extend;
			l_parametros_carta(2) := parametro('P_NMPOLIZA',  l_ultimo_apolice);
			l_parametros_carta.extend;
			l_parametros_carta(3) := parametro('P_CDRAMO',   l_ultimo_cdramo);
			l_parametros_carta.extend;
			l_parametros_carta(4) := parametro('P_NMSITUAC', l_ultimo_nmsituac );
			l_parametros_carta.extend;
			l_parametros_carta(5) := parametro('P_LISTA_GARANTIAS',' AND GARANTIA.NMGARANT IN (' || l_list_documentos || ')');
			l_parametros_carta.extend;
			l_parametros_carta(6) := parametro('P_CDPERSON', l_ultimo_destinatario );
			l_parametros_carta.extend;
			l_parametros_carta(7) := parametro('P_USUARIO', 'ADMINISTRADOR' );
			l_parametros_carta.extend;
			l_parametros_carta(8) := parametro('_USER', l_ambiente_id);
			l_parametros_carta.extend;
			l_parametros_carta(9) := parametro('P_N_REFERENCIA', l_referencia);
			l_id_carta := FPEDIDO_EXECUCAO( 'D1.A5', l_parametros_carta);
			l_parametros_carta.delete;

			l_n_referencia := 1;

			update svr_documentos
			set    lote_ordem = l_ordem_lote_carta
			,      lote_id    = l_id_lote
			where  id         = l_id_carta;

		end if;

		close documentos;
		return l_id_lote;
	end;

	function gera_lote_r3_d27r(p_descricao in varchar2
							, p_list_documentos in varchar2)
	return number is

		type dyn_cursor is ref cursor;
		l_id_documento        svr_documentos.id%type;
		l_id_carta            svr_documentos.id%type;
		l_ordem_lote          svr_documentos.lote_ordem%type;
		l_ordem_lote_carta    svr_documentos.lote_ordem%type;
		l_id_lote             svr_lotes.id%type;
		l_n_documentos        number;
		l_list_documentos     varchar2(5000) := '';
		l_ambiente_id         svr_documentos.ambiente_id%type;
		l_ultimo_destinatario svr_documentos.destinatario%type;
		l_destinatario        svr_documentos.destinatario%type;
		l_ultimo_codigo       svr_documentos.destinatario%type;
		l_codigo              svr_documentos.destinatario%type;
		l_cdunieco            svr_documentos.parametro01%type;
		l_apolice             svr_documentos.parametro01%type;
		l_cdramo              svr_documentos.parametro01%type;
		l_nmsituac            svr_documentos.parametro01%type;
		l_nmgarant            svr_documentos.parametro01%type;
		l_ultimo_cdunieco     svr_documentos.parametro01%type;
		l_ultimo_apolice      svr_documentos.parametro01%type;
		l_ultimo_cdramo       svr_documentos.parametro01%type;
		l_ultimo_nmsituac     svr_documentos.parametro01%type;
		l_referencia          varchar2(4000); --indica a referencia a guardar na bd
		csql                  varchar(30);
		l_n_referencia        number;         --indica  o numero de 15 em 15
		l_parametros_carta    lista_parametros := lista_parametros();
		l_query               varchar2(4000);
		documentos            dyn_cursor;

	begin

		select id_lote_seq.nextval
		into   l_id_lote
		from   dual;

		INSERT INTO svr_lotes (
			id
			,descricao
			,tipo_lote_rf
			,criado_por
			,data_criacao
			)
		VALUES (
			l_id_lote
			,p_descricao
			,1
			,user
			,sysdate
			);


		l_query := 'SELECT * '                                    ||
				   'FROM ( '                                      ||
				   '  select '                                    ||
				   '    a.id '                                    ||
				   '  , a.ambiente_id '                           ||
				   '  , a.destinatario '                          ||
				   '  , a.codigo_postal '                         ||
				   '  , a.parametro05 P_CDUNIECO'                 ||
				   '  , a.parametro04 P_APOLICE'                  ||
				   '  , a.parametro06 P_CDRAMO'                   ||
				   '  , a.parametro08 P_NMSITUAC'                 ||
				   '  , a.parametro07 P_nmgarant'                 ||
				   '  from '                                      ||
				   '    svr_documentos           a '              ||
				   '  where '                                     ||
				   '    a.id in (' || p_list_documentos  || ') )' ||
				   'WHERE '                                       ||
				   '  p_cdunieco IS NOT NULL '                    ||
				   'OR '                                          ||
				   '  p_cdramo IS NOT NULL '                      ||
				   'OR '                                          ||
				   '  p_APOLICE IS NOT NULL '                     ||
				   'OR '                                          ||
				   '  p_nmsituac IS NOT NULL '                    ||
				   'OR '                                          ||
				   '  p_nmgarant IS NOT NULL '                    ||
				   'order by '                                    ||
				   '  codigo_postal, destinatario, p_cdunieco, p_apolice, p_cdramo , to_number(p_nmgarant)';

		l_ordem_lote       := 0;
		l_ordem_lote_carta := 0;
		l_n_documentos     := 0;
		l_n_referencia     := 0; --count da pagina por referencia

		-- depois com select
		l_n_referencia := l_n_referencia + 1; --count para comecar com o valor 1 ( pagina 1)

		SELECT 'DCM/' || trim(TO_CHAR(DCM_DOCSEQ.NEXTVAL,'000000')) || '/'
		INTO csql
		FROM dual;

		l_referencia := csql || l_n_referencia;

		open documentos for l_query;
		loop
			fetch documentos into l_id_documento, l_ambiente_id, l_destinatario, l_codigo, l_cdunieco,
									l_apolice     , l_cdramo     , l_nmsituac    , l_nmgarant;
				l_ordem_lote   := l_ordem_lote   + 1;
			exit when documentos%notfound;

			l_n_documentos := l_n_documentos + 1;
			l_referencia := csql || l_n_referencia; --afectar quando entra

			if (nvl(l_destinatario,'XX') != nvl(l_ultimo_destinatario,nvl(l_destinatario,'XX'))) or
				(nvl(l_cdunieco,'XX')     != nvl(l_ultimo_cdunieco,nvl(l_cdunieco,'XX'))    ) or
				(nvl(l_apolice,'XX')      != nvl(l_ultimo_apolice,nvl(l_apolice,'XX'))     ) or
				(nvl(l_cdramo,'XX')       != nvl(l_ultimo_cdramo,nvl(l_cdramo,'XX'))      ) then

				if length(l_list_documentos) > 0 then
					/* Acrescentado por Jose Viegas 25-11-2004             */
					/* So envia carta se o destinatario estiver preenchido */
					if l_ultimo_destinatario is not null then

						l_parametros_carta.extend;
						l_parametros_carta(1) := parametro('P_CDUNIECO', l_ultimo_cdunieco);
						l_parametros_carta.extend;
						l_parametros_carta(2) := parametro('P_NMPOLIZA',  l_ultimo_apolice);
						l_parametros_carta.extend;
						l_parametros_carta(3) := parametro('P_CDRAMO',   l_ultimo_cdramo);
						l_parametros_carta.extend;
						l_parametros_carta(4) := parametro('P_NMSITUAC', l_ultimo_nmsituac );
						l_parametros_carta.extend;
						l_parametros_carta(5) := parametro('P_LISTA_GARANTIAS',' AND GARANTIA.NMGARANT IN (' || l_list_documentos || ')');
						l_parametros_carta.extend;
						l_parametros_carta(6) := parametro('P_CDPERSON', l_ultimo_destinatario );
						l_parametros_carta.extend;
						l_parametros_carta(7) := parametro('P_USUARIO', 'ADMINISTRADOR' );
						l_parametros_carta.extend;
						l_parametros_carta(8) := parametro('_USER', l_ambiente_id);
						l_parametros_carta.extend;
						l_parametros_carta(9) := parametro('P_N_REFERENCIA', l_referencia);
						l_id_carta := FPEDIDO_EXECUCAO( 'D1.A5R', l_parametros_carta);

					end if;

					l_parametros_carta.delete;

					/* BLOCO B23 MOVIDO 2010-10-07
					SELECT 'DCM/' || trim(TO_CHAR(DCM_DOCSEQ.NEXTVAL,'000000')) || '/'
					INTO csql
					FROM dual;

					l_n_referencia := 1;
					/* */

					update svr_documentos
					set    lote_ordem = l_ordem_lote_carta
					,      lote_id    = l_id_lote
					where  id         = l_id_carta;

					l_ordem_lote_carta := l_ordem_lote;
					l_ordem_lote       := l_ordem_lote   + 1;

				end if;

				/* BLOCO B23 alterado jose viegas 2010-10-07 */
				SELECT 'DCM/' || trim(TO_CHAR(DCM_DOCSEQ.NEXTVAL,'000000')) || '/'
				INTO csql
				FROM dual;
				l_n_referencia := 1;
				/* */

				l_list_documentos  := l_nmgarant;
				update svr_documentos
				set    lote_ordem = l_ordem_lote
				,      lote_id    = l_id_lote
				where  id         = l_id_documento;

				l_ultimo_destinatario := l_destinatario;
				l_ultimo_cdunieco     := l_cdunieco;
				l_ultimo_nmsituac     := l_nmsituac;
				l_ultimo_apolice      := l_apolice;
				l_ultimo_cdramo       := l_cdramo;
				l_n_documentos        := 1;

			else

				if length(l_list_documentos) > 0 then
					l_list_documentos := l_list_documentos || ', ' || l_nmgarant;
				else
					l_list_documentos := l_nmgarant;
				end if;

				update svr_documentos
				set    lote_ordem = l_ordem_lote
				,      lote_id    = l_id_lote
				where  id         = l_id_documento;

				l_ultimo_destinatario := l_destinatario;
				l_ultimo_cdunieco     := l_cdunieco;
				l_ultimo_nmsituac     := l_nmsituac;
				l_ultimo_apolice      := l_apolice;
				l_ultimo_cdramo       := l_cdramo;

				if l_n_documentos = 15 then
					l_parametros_carta.extend;
					l_parametros_carta(1) := parametro('P_CDUNIECO', l_ultimo_cdunieco);
					l_parametros_carta.extend;
					l_parametros_carta(2) := parametro('P_NMPOLIZA',  l_ultimo_apolice);
					l_parametros_carta.extend;
					l_parametros_carta(3) := parametro('P_CDRAMO',   l_ultimo_cdramo);
					l_parametros_carta.extend;
					l_parametros_carta(4) := parametro('P_NMSITUAC', l_ultimo_nmsituac );
					l_parametros_carta.extend;
					l_parametros_carta(5) := parametro('P_LISTA_GARANTIAS',' AND GARANTIA.NMGARANT IN (' || l_list_documentos || ')');
					l_parametros_carta.extend;
					l_parametros_carta(6) := parametro('P_CDPERSON', l_ultimo_destinatario );
					l_parametros_carta.extend;
					l_parametros_carta(7) := parametro('P_USUARIO', 'ADMINISTRADOR' );
					l_parametros_carta.extend;
					l_parametros_carta(8) := parametro('_USER', l_ambiente_id);
					l_parametros_carta.extend;
					l_parametros_carta(9) := parametro('P_N_REFERENCIA', l_referencia);
					l_id_carta := FPEDIDO_EXECUCAO( 'D1.A5R', l_parametros_carta);
					l_parametros_carta.delete;

					l_n_referencia := l_n_referencia + 1; -- acualizar o count ( pagina n+1)

					update svr_documentos
					set    lote_ordem = l_ordem_lote_carta
					,      lote_id    = l_id_lote
					where  id         = l_id_carta;

					l_ordem_lote       := l_ordem_lote + 1;
					l_ordem_lote_carta := l_ordem_lote;

					l_list_documentos := '';
					l_n_documentos    := 0;
				end if;
			end if;
		end loop;

		if l_n_documentos > 0 then

			l_referencia := csql || l_n_referencia;
			l_parametros_carta.extend;
			l_parametros_carta(1) := parametro('P_CDUNIECO', l_ultimo_cdunieco);
			l_parametros_carta.extend;
			l_parametros_carta(2) := parametro('P_NMPOLIZA',  l_ultimo_apolice);
			l_parametros_carta.extend;
			l_parametros_carta(3) := parametro('P_CDRAMO',   l_ultimo_cdramo);
			l_parametros_carta.extend;
			l_parametros_carta(4) := parametro('P_NMSITUAC', l_ultimo_nmsituac );
			l_parametros_carta.extend;
			l_parametros_carta(5) := parametro('P_LISTA_GARANTIAS',' AND GARANTIA.NMGARANT IN (' || l_list_documentos || ')');
			l_parametros_carta.extend;
			l_parametros_carta(6) := parametro('P_CDPERSON', l_ultimo_destinatario );
			l_parametros_carta.extend;
			l_parametros_carta(7) := parametro('P_USUARIO', 'ADMINISTRADOR' );
			l_parametros_carta.extend;
			l_parametros_carta(8) := parametro('_USER', l_ambiente_id);
			l_parametros_carta.extend;
			l_parametros_carta(9) := parametro('P_N_REFERENCIA', l_referencia);
			l_id_carta := FPEDIDO_EXECUCAO( 'D1.A5R', l_parametros_carta);
			l_parametros_carta.delete;

			l_n_referencia := 1;

			update svr_documentos
			set    lote_ordem = l_ordem_lote_carta
			,      lote_id    = l_id_lote
			where  id         = l_id_carta;

		end if;

		close documentos;
		return l_id_lote;

	end;

	function gera_lote_r3_d28(p_descricao in varchar2
							, p_list_documentos in varchar2)
	return number is

		type dyn_cursor is ref cursor;
		l_id_documento        svr_documentos.id%type;
		l_id_carta            svr_documentos.id%type;
		l_ordem_lote          svr_documentos.lote_ordem%type;
		l_ordem_lote_carta    svr_documentos.lote_ordem%type;
		l_id_lote             svr_lotes.id%type;
		l_n_documentos        number;
		l_list_documentos     varchar2(5000) := '';
		l_ambiente_id         svr_documentos.ambiente_id%type;
		l_ultimo_destinatario svr_documentos.destinatario%type;
		l_destinatario        svr_documentos.destinatario%type;
		l_ultimo_codigo       svr_documentos.destinatario%type;
		l_codigo              svr_documentos.destinatario%type;
		l_cdunieco            svr_documentos.parametro01%type;
		l_apolice             svr_documentos.parametro01%type;
		l_cdramo              svr_documentos.parametro01%type;
		l_nmgarant            svr_documentos.parametro01%type;
		l_ultimo_cdunieco     svr_documentos.parametro01%type;
		l_ultimo_apolice      svr_documentos.parametro01%type;
		l_ultimo_cdramo       svr_documentos.parametro01%type;
		l_referencia          varchar2(4000); --indica a referencia a guardar na bd
		csql                  varchar(30);
		l_n_referencia        number;         --indica  o numero de 15 em 15
		l_parametros_carta    lista_parametros := lista_parametros();
		l_query               varchar2(4000);
		documentos            dyn_cursor;

	begin

		select id_lote_seq.nextval
		into   l_id_lote
		from   dual;

		INSERT INTO svr_lotes (
			id
			,descricao
			,tipo_lote_rf
			,criado_por
			,data_criacao
			)
		VALUES (
			l_id_lote
			,p_descricao || ' teste'
			,1
			,user
			,sysdate
			);


		l_query := 'SELECT * '                                    ||
				   'FROM ( '                                      ||
				   '  select '                                    ||
				   '    a.id '                                    ||
				   '  , a.ambiente_id '                           ||
				   '  , a.destinatario '                          ||
				   '  , a.codigo_postal '                         ||
				   '  , a.parametro05 P_CDUNIECO'                 ||
				   '  , a.parametro04 P_APOLICE'                  ||
				   '  , a.parametro06 P_CDRAMO'                   ||
				   '  , a.parametro07 P_NMGARANT'                 ||
				   '  from '                                      ||
				   '    svr_documentos           a '              ||
				   '  where '                                     ||
				   '    a.id in (' || p_list_documentos  || ') )' ||
				   'WHERE '                                       ||
				   '  p_cdunieco IS NOT NULL '                    ||
				   'OR '                                          ||
				   '  p_cdramo IS NOT NULL '                      ||
				   'OR '                                          ||
				   '  p_APOLICE IS NOT NULL '                     ||
				   'OR '                                          ||
				   '  p_nmgarant IS NOT NULL '                    ||
				   'order by '                                    ||
				   '  p_cdunieco, p_cdramo, p_APOLICE, to_number(p_nmgarant) ';

		l_ordem_lote       := 0;
		l_ordem_lote_carta := 0;
		l_n_documentos     := 0;

		l_n_referencia     := 0; --count da pagina por referencia

		-- depois com select
		l_n_referencia := l_n_referencia + 1; --count para comecar com o valor 1 ( pagina 1)

		SELECT 'DCM/' || trim(TO_CHAR(DCM_DOCSEQ.NEXTVAL,'000000')) || '/'
		INTO csql
		FROM dual;

		l_referencia := csql || l_n_referencia;

		open documentos for l_query;
		loop
			fetch documentos into l_id_documento, l_ambiente_id, l_destinatario, l_codigo, l_cdunieco, l_apolice, l_cdramo, l_nmgarant;
				l_ordem_lote   := l_ordem_lote   + 1;
			exit when documentos%notfound;

			l_n_documentos := l_n_documentos + 1;
			l_referencia := csql || l_n_referencia; --afectar quando entra

			if (nvl(l_destinatario,'XX') != nvl(l_ultimo_destinatario, nvl(l_destinatario,'XX')) ) or
				(nvl(l_cdunieco,'XX')     != nvl(l_ultimo_cdunieco    , nvl(l_cdunieco,'XX'))     ) or
				(nvl(l_apolice,'XX')      != nvl(l_ultimo_apolice     , nvl(l_apolice,'XX'))      ) or
				(nvl(l_cdramo,'XX')       != nvl(l_ultimo_cdramo      , nvl(l_cdramo,'XX'))       ) then

				if length(l_list_documentos) > 0 then
				/* Acrescentado por Jose Viegas 25-11-2004             */
				/* So envia carta se o destinatario estiver preenchido */
					if l_ultimo_destinatario is not null then

						l_parametros_carta.extend;
						l_parametros_carta(1) := parametro('P_CDUNIECO', l_ultimo_cdunieco );
						l_parametros_carta.extend;
						l_parametros_carta(2) := parametro('P_NMPOLIZA',  l_ultimo_apolice);
						l_parametros_carta.extend;
						l_parametros_carta(3) := parametro('P_CDRAMO',   l_ultimo_cdramo);
						l_parametros_carta.extend;
						l_parametros_carta(4) := parametro('P_LISTA_GARANTIAS',' AND GARANTIA.NMGARANT IN (' || l_list_documentos || ')');
						l_parametros_carta.extend;
						l_parametros_carta(5) := parametro('P_USUARIO', 'ADMINISTRADOR' );
						l_parametros_carta.extend;
						l_parametros_carta(6) := parametro('_USER', l_ambiente_id);
						l_parametros_carta.extend;
						l_parametros_carta(7) := parametro('P_N_REFERENCIA', l_referencia);
						l_id_carta := FPEDIDO_EXECUCAO( 'D1.A7D', l_parametros_carta);
					end if;

					l_parametros_carta.delete;

					/* MOVIDO BLOCO B23 2010-10-07 */

					update svr_documentos
					set    lote_ordem = l_ordem_lote_carta
					,      lote_id    = l_id_lote
					where  id         = l_id_carta;

					l_ordem_lote_carta := l_ordem_lote;
					l_ordem_lote       := l_ordem_lote + 1;

				end if;

				/* BLOCO B23 alterado jose viegas 2010-10-07 */
				SELECT 'DCM/' || trim(TO_CHAR(DCM_DOCSEQ.NEXTVAL,'000000')) || '/'
				INTO csql
				FROM dual;

				l_n_referencia := 1;
				/* */
				l_list_documentos  := l_nmgarant;

				update svr_documentos
				set    lote_ordem = l_ordem_lote
				,      lote_id    = l_id_lote
				where  id         = l_id_documento;

				l_ultimo_destinatario := l_destinatario;
				l_ultimo_cdunieco     := l_cdunieco;
				l_ultimo_apolice      := l_apolice;
				l_ultimo_cdramo       := l_cdramo;
				l_n_documentos        := 1;

			else

				if length(l_list_documentos) > 0 then
					l_list_documentos := l_list_documentos || ', ' || l_nmgarant;
				else
					l_list_documentos := l_nmgarant;
				end if;

				update svr_documentos
				set    lote_ordem = l_ordem_lote
				,      lote_id    = l_id_lote
				where  id         = l_id_documento;

				l_ultimo_destinatario := l_destinatario;
				l_ultimo_cdunieco     := l_cdunieco;
				l_ultimo_apolice      := l_apolice;
				l_ultimo_cdramo       := l_cdramo;

				if l_n_documentos = 15 then
					l_parametros_carta.extend;
					l_parametros_carta(1) := parametro('P_CDUNIECO', l_cdunieco);
					l_parametros_carta.extend;
					l_parametros_carta(2) := parametro('P_NMPOLIZA',  l_apolice);
					l_parametros_carta.extend;
					l_parametros_carta(3) := parametro('P_CDRAMO',   l_cdramo);
					l_parametros_carta.extend;
					l_parametros_carta(4) := parametro('P_LISTA_GARANTIAS',' AND GARANTIA.NMGARANT IN (' || l_list_documentos || ')');
					l_parametros_carta.extend;
					l_parametros_carta(5) := parametro('P_USUARIO', 'ADMINISTRADOR' );
					l_parametros_carta.extend;
					l_parametros_carta(6) := parametro('_USER', l_ambiente_id);
					l_parametros_carta.extend;
					l_parametros_carta(7) := parametro('P_N_REFERENCIA', l_referencia);
					l_id_carta := FPEDIDO_EXECUCAO( 'D1.A7D', l_parametros_carta);

					l_parametros_carta.delete;
					l_n_referencia := l_n_referencia + 1; -- acualizar o count ( pagina n+1)

					update svr_documentos
					set    lote_ordem = l_ordem_lote_carta
					,      lote_id    = l_id_lote
					where  id         = l_id_carta;

					l_ordem_lote := l_ordem_lote + 1;
					l_ordem_lote_carta := l_ordem_lote;

					l_list_documentos := '';
					l_n_documentos    := 0;
				end if;
			end if;
		end loop;

		if l_n_documentos > 0 then

			l_referencia := csql || l_n_referencia;

			l_parametros_carta.extend;
			l_parametros_carta(1) := parametro('P_CDUNIECO', l_cdunieco);
			l_parametros_carta.extend;
			l_parametros_carta(2) := parametro('P_NMPOLIZA',  l_apolice);
			l_parametros_carta.extend;
			l_parametros_carta(3) := parametro('P_CDRAMO',   l_cdramo);
			l_parametros_carta.extend;
			l_parametros_carta(4) := parametro('P_LISTA_GARANTIAS',' AND GARANTIA.NMGARANT IN (' || l_list_documentos || ')');
			l_parametros_carta.extend;
			l_parametros_carta(5) := parametro('P_USUARIO', 'ADMINISTRADOR' );
			l_parametros_carta.extend;
			l_parametros_carta(6) := parametro('_USER', l_ambiente_id);
			l_parametros_carta.extend;
			l_parametros_carta(7) := parametro('P_N_REFERENCIA', l_referencia);
			l_id_carta := FPEDIDO_EXECUCAO( 'D1.A7D', l_parametros_carta);
			l_parametros_carta.delete;
			l_n_referencia := 1;

			l_ordem_lote := l_ordem_lote + 1;

			update svr_documentos
			set    lote_ordem = l_ordem_lote_carta
			,      lote_id    = l_id_lote
			where  id         = l_id_carta;

		end if;

		close documentos;
		return l_id_lote;

	end;

	function gera_lote_r3_d28r(p_descricao in varchar2
							, p_list_documentos in varchar2)
	return number is

		type dyn_cursor is ref cursor;
		l_id_documento        svr_documentos.id%type;
		l_id_carta            svr_documentos.id%type;
		l_ordem_lote          svr_documentos.lote_ordem%type;
		l_ordem_lote_carta    svr_documentos.lote_ordem%type;
		l_id_lote             svr_lotes.id%type;
		l_n_documentos        number;
		l_list_documentos     varchar2(5000) := '';
		l_ambiente_id         svr_documentos.ambiente_id%type;
		l_ultimo_destinatario svr_documentos.destinatario%type;
		l_destinatario        svr_documentos.destinatario%type;
		l_ultimo_codigo       svr_documentos.destinatario%type;
		l_codigo              svr_documentos.destinatario%type;
		l_cdunieco            svr_documentos.parametro01%type;
		l_apolice             svr_documentos.parametro01%type;
		l_cdramo              svr_documentos.parametro01%type;
		l_nmgarant            svr_documentos.parametro01%type;
		l_ultimo_cdunieco     svr_documentos.parametro01%type;
		l_ultimo_apolice      svr_documentos.parametro01%type;
		l_ultimo_cdramo       svr_documentos.parametro01%type;
		l_referencia          varchar2(4000); --indica a referencia a guardar na bd
		csql                  varchar(30);
		l_n_referencia        number;         --indica  o numero de 15 em 15
		l_parametros_carta    lista_parametros := lista_parametros();
		l_query               varchar2(4000);
		documentos            dyn_cursor;

	begin

		select id_lote_seq.nextval
		into   l_id_lote
		from   dual;

		INSERT INTO svr_lotes (
			id
			,descricao
			,tipo_lote_rf
			,criado_por
			,data_criacao
			)
		VALUES (
			l_id_lote
			,p_descricao || ' teste'
			,1
			,user
			,sysdate
			);

		l_query := 'SELECT * '                                    ||
				   'FROM ( '                                      ||
				   '  select '                                    ||
				   '    a.id '                                    ||
				   '  , a.ambiente_id '                           ||
				   '  , a.destinatario '                          ||
				   '  , a.codigo_postal '                         ||
				   '  , a.parametro05 P_CDUNIECO'                 ||
				   '  , a.parametro04 P_APOLICE'                  ||
				   '  , a.parametro06 P_CDRAMO'                   ||
				   '  , a.parametro07 P_NMGARANT'                 ||
				   '  from '                                      ||
				   '    svr_documentos           a '              ||
				   '  where '                                     ||
				   '    a.id in (' || p_list_documentos  || ') )' ||
				   'WHERE '                                       ||
				   '  p_cdunieco IS NOT NULL '                    ||
				   'OR '                                          ||
				   '  p_cdramo IS NOT NULL '                      ||
				   'OR '                                          ||
				   '  p_APOLICE IS NOT NULL '                     ||
				   'OR '                                          ||
				   '  p_nmgarant IS NOT NULL '                    ||
				   'order by '                                    ||
				   '  p_cdunieco, p_cdramo, p_APOLICE, to_number(p_nmgarant) ';

		l_ordem_lote       := 0;
		l_ordem_lote_carta := 0;
		l_n_documentos     := 0;
		l_n_referencia     := 0; --count da pagina por referencia

		-- depois com select
		l_n_referencia := l_n_referencia + 1; --count para comecar com o valor 1 ( pagina 1)

		SELECT 'DCM/' || trim(TO_CHAR(DCM_DOCSEQ.NEXTVAL,'000000')) || '/'
		INTO csql
		FROM dual;

		l_referencia := csql || l_n_referencia;

		open documentos for l_query;
		loop
			fetch documentos into l_id_documento, l_ambiente_id, l_destinatario, l_codigo, l_cdunieco, l_apolice, l_cdramo, l_nmgarant;
				l_ordem_lote   := l_ordem_lote   + 1;
			exit when documentos%notfound;

			l_n_documentos := l_n_documentos + 1;
			l_referencia := csql || l_n_referencia; --afectar quando entra

			if (nvl(l_destinatario,'XX') != nvl(l_ultimo_destinatario, nvl(l_destinatario,'XX')) ) or
				(nvl(l_cdunieco,'XX')     != nvl(l_ultimo_cdunieco    , nvl(l_cdunieco,'XX'))     ) or
				(nvl(l_apolice,'XX')      != nvl(l_ultimo_apolice     , nvl(l_apolice,'XX'))      ) or
				(nvl(l_cdramo,'XX')       != nvl(l_ultimo_cdramo      , nvl(l_cdramo,'XX'))       ) then

				if length(l_list_documentos) > 0 then
					/* Acrescentado por Jose Viegas 25-11-2004             */
					/* So envia carta se o destinatario estiver preenchido */
					if l_ultimo_destinatario is not null then

						l_parametros_carta.extend;
						l_parametros_carta(1) := parametro('P_CDUNIECO', l_ultimo_cdunieco );
						l_parametros_carta.extend;
						l_parametros_carta(2) := parametro('P_NMPOLIZA',  l_ultimo_apolice);
						l_parametros_carta.extend;
						l_parametros_carta(3) := parametro('P_CDRAMO',   l_ultimo_cdramo);
						l_parametros_carta.extend;
						l_parametros_carta(4) := parametro('P_LISTA_GARANTIAS',' AND GARANTIA.NMGARANT IN (' || l_list_documentos || ')');
						l_parametros_carta.extend;
						l_parametros_carta(5) := parametro('P_USUARIO', 'ADMINISTRADOR' );
						l_parametros_carta.extend;
						l_parametros_carta(6) := parametro('_USER', l_ambiente_id);
						l_parametros_carta.extend;
						l_parametros_carta(7) := parametro('P_N_REFERENCIA', l_referencia);
						l_id_carta := FPEDIDO_EXECUCAO( 'D1.A7DR', l_parametros_carta);

					end if;

					l_parametros_carta.delete;

					/* BLOCO B23 MOVIDO 2010-10-07
					SELECT 'DCM/' || trim(TO_CHAR(DCM_DOCSEQ.NEXTVAL,'000000')) || '/'
					INTO csql
					FROM dual;

					l_n_referencia := 1;
					/* */

					update svr_documentos
					set    lote_ordem = l_ordem_lote_carta
					,      lote_id    = l_id_lote
					where  id         = l_id_carta;

					l_ordem_lote_carta := l_ordem_lote;
					l_ordem_lote       := l_ordem_lote + 1;

				end if;

				/* BLOCO B23 alterado jose viegas 2010-10-07 */
				SELECT 'DCM/' || trim(TO_CHAR(DCM_DOCSEQ.NEXTVAL,'000000')) || '/'
				INTO csql
				FROM dual;
				l_n_referencia := 1;
				/* */

				l_list_documentos  := l_nmgarant;
				update svr_documentos
				set    lote_ordem = l_ordem_lote
				,      lote_id    = l_id_lote
				where  id         = l_id_documento;

				l_ultimo_destinatario := l_destinatario;
				l_ultimo_cdunieco     := l_cdunieco;
				l_ultimo_apolice      := l_apolice;
				l_ultimo_cdramo       := l_cdramo;
				l_n_documentos        := 1;

			else
				if length(l_list_documentos) > 0 then
					l_list_documentos := l_list_documentos || ', ' || l_nmgarant;
				else
					l_list_documentos := l_nmgarant;
				end if;

				update svr_documentos
				set    lote_ordem = l_ordem_lote
				,      lote_id    = l_id_lote
				where  id         = l_id_documento;

				l_ultimo_destinatario := l_destinatario;
				l_ultimo_cdunieco     := l_cdunieco;
				l_ultimo_apolice      := l_apolice;
				l_ultimo_cdramo       := l_cdramo;

				if l_n_documentos = 15 then
					l_parametros_carta.extend;
					l_parametros_carta(1) := parametro('P_CDUNIECO', l_cdunieco);
					l_parametros_carta.extend;
					l_parametros_carta(2) := parametro('P_NMPOLIZA',  l_apolice);
					l_parametros_carta.extend;
					l_parametros_carta(3) := parametro('P_CDRAMO',   l_cdramo);
					l_parametros_carta.extend;
					l_parametros_carta(4) := parametro('P_LISTA_GARANTIAS',' AND GARANTIA.NMGARANT IN (' || l_list_documentos || ')');
					l_parametros_carta.extend;
					l_parametros_carta(5) := parametro('P_USUARIO', 'ADMINISTRADOR' );
					l_parametros_carta.extend;
					l_parametros_carta(6) := parametro('_USER', l_ambiente_id);
					l_parametros_carta.extend;
					l_parametros_carta(7) := parametro('P_N_REFERENCIA', l_referencia);
					l_id_carta := FPEDIDO_EXECUCAO( 'D1.A7DR', l_parametros_carta);
					l_parametros_carta.delete;

					l_n_referencia := l_n_referencia + 1; -- acualizar o count ( pagina n+1)

					update svr_documentos
					set    lote_ordem = l_ordem_lote_carta
					,      lote_id    = l_id_lote
					where  id         = l_id_carta;

					l_ordem_lote := l_ordem_lote + 1;
					l_ordem_lote_carta := l_ordem_lote;

					l_list_documentos := '';
					l_n_documentos    := 0;
				end if;
			end if;
		end loop;

		if l_n_documentos > 0 then

			l_referencia := csql || l_n_referencia;
			l_parametros_carta.extend;
			l_parametros_carta(1) := parametro('P_CDUNIECO', l_cdunieco);
			l_parametros_carta.extend;
			l_parametros_carta(2) := parametro('P_NMPOLIZA',  l_apolice);
			l_parametros_carta.extend;
			l_parametros_carta(3) := parametro('P_CDRAMO',   l_cdramo);
			l_parametros_carta.extend;
			l_parametros_carta(4) := parametro('P_LISTA_GARANTIAS',' AND GARANTIA.NMGARANT IN (' || l_list_documentos || ')');
			l_parametros_carta.extend;
			l_parametros_carta(5) := parametro('P_USUARIO', 'ADMINISTRADOR' );
			l_parametros_carta.extend;
			l_parametros_carta(6) := parametro('_USER', l_ambiente_id);
			l_parametros_carta.extend;
			l_parametros_carta(7) := parametro('P_N_REFERENCIA', l_referencia);
			l_id_carta := FPEDIDO_EXECUCAO( 'D1.A7DR', l_parametros_carta);
			l_parametros_carta.delete;

			l_n_referencia := 1;

			l_ordem_lote := l_ordem_lote + 1;
			update svr_documentos
			set    lote_ordem = l_ordem_lote_carta
			,      lote_id    = l_id_lote
			where  id         = l_id_carta;

		end if;

		close documentos;
		return l_id_lote;

	end;

	PROCEDURE ANULADO (p_REFDOC IN VARCHAR2) is

		v_existe number;
		v_existe1 number;

	begin

		select count(*)
		into v_existe
		from svr_documentos
		where N_REFERENCIA = p_REFDOC;

		if v_existe = 0 then 

			SELECT count(*)
			INTO v_existe1
			FROM svr_parametros_report r
				,svr_documentos d
			WHERE 1 = 1
				AND r.report_id = d.report_id
				AND r.nome = 'P_DOCNO'
				AND CASE r.n_parametro
					WHEN 1
						THEN d.parametro01
					WHEN 2
						THEN d.parametro02
					WHEN 3
						THEN d.parametro03
					WHEN 4
						THEN d.parametro04
					WHEN 5
						THEN d.parametro05
					WHEN 6
						THEN d.parametro06
					WHEN 7
						THEN d.parametro07
					WHEN 8
						THEN d.parametro08
					WHEN 9
						THEN d.parametro09
					WHEN 10
						THEN d.parametro10
					WHEN 11
						THEN d.parametro11
					WHEN 12
						THEN d.parametro12
					WHEN 13
						THEN d.parametro13
					WHEN 14
						THEN d.parametro14
					WHEN 15
						THEN d.parametro15
					WHEN 16
						THEN d.parametro16
					WHEN 17
						THEN d.parametro17
					WHEN 18
						THEN d.parametro18
					WHEN 19
						THEN d.parametro19
					WHEN 20
						THEN d.parametro20
					ELSE '0'
					END = p_REFDOC;

			IF v_existe1 > 0 then

				UPDATE svr_documentos
				SET atributo9 = 'A'
				WHERE id IN (
						SELECT d.id
						FROM svr_parametros_report r
							,svr_documentos d
						WHERE 1 = 1
							AND r.report_id = d.report_id
							AND r.nome = 'P_DOCNO'
							AND CASE r.n_parametro
								WHEN 1
									THEN d.parametro01
								WHEN 2
									THEN d.parametro02
								WHEN 3
									THEN d.parametro03
								WHEN 4
									THEN d.parametro04
								WHEN 5
									THEN d.parametro05
								WHEN 6
									THEN d.parametro06
								WHEN 7
									THEN d.parametro07
								WHEN 8
									THEN d.parametro08
								WHEN 9
									THEN d.parametro09
								WHEN 10
									THEN d.parametro10
								WHEN 11
									THEN d.parametro11
								WHEN 12
									THEN d.parametro12
								WHEN 13
									THEN d.parametro13
								WHEN 14
									THEN d.parametro14
								WHEN 15
									THEN d.parametro15
								WHEN 16
									THEN d.parametro16
								WHEN 17
									THEN d.parametro17
								WHEN 18
									THEN d.parametro18
								WHEN 19
									THEN d.parametro19
								WHEN 20
									THEN d.parametro20
								ELSE '0'
								END = p_REFDOC
						)
					;
			end if;			

		elsif v_existe > 0 then

			update svr_documentos
			set atributo9 = 'A'
			where N_REFERENCIA = p_REFDOC;

			--commit;
		end if;

	end;




	procedure gera_lote(p_tipo in number
						, p_descricao in varchar2
						, p_list_documentos in varchar2) is

		l_id_lote             svr_lotes.id%type;
		l_id_impressora       svr_impressoras.id%type;
		l_ambiente_id         svr_documentos.ambiente_id%type;
		l_id_carta            svr_documentos.id%type;
		l_ordem_lote          svr_documentos.lote_ordem%type;
		l_parametros_carta    lista_parametros := lista_parametros();
		l_email				  svr_queue.atributo01%type;

		cursor documentos(c_id_lote number) is
			SELECT b.id
				,a.n_copias
			FROM doc_modelos_documento a
				,svr_documentos b
			WHERE b.lote_id = c_id_lote
				AND a.id = b.modelo_id
			ORDER BY b.lote_ordem;

		l_user          varchar2(30);
		l_tipo_queue    varchar2(10);
		l_first_imp     number;
		n_copias        number;

	begin

	--    record_error('ERRO_DOC','GERA LOTE NORMAL ' || p_descricao ,null);
	--    record_error('ERRO_DOC','  ' || p_list_documentos ,null);
	--    record_error('ERRO_DOC','  ' || user ,null);
		SELECT decode(username, user, 'ADMINISTRADOR', user)
		INTO l_user
		FROM user_users;


		if p_list_documentos is not null then

			if p_tipo = 4 then
				l_id_lote := gera_lote_r3_d25(p_descricao,p_list_documentos);

			elsif p_tipo = 2 then
				l_id_lote := gera_lote_r3_d27(p_descricao,p_list_documentos);

			elsif p_tipo = 3 then
				l_id_lote := gera_lote_r3_d31(p_descricao,p_list_documentos);

			elsif p_tipo = 5 then
				l_id_lote := gera_lote_ordem_recibo(p_descricao,p_list_documentos);

			elsif p_tipo = 6 then
				l_id_lote := gera_lote_r3_d28(p_descricao,p_list_documentos);

			elsif p_tipo = 7 then
				l_id_lote := gera_lote_r2_d26x(p_descricao,p_list_documentos);

			elsif p_tipo = 88 then
				l_id_lote := gera_lote_r3_d28r(p_descricao,p_list_documentos);

			elsif p_tipo = 85 then

				begin

					SELECT impressora_id
					INTO l_id_impressora
					FROM doc_impressoras_doc
					WHERE modelo_id = 'E.E1';


				exception
					when no_data_found then null;
				end;

				l_id_lote := gera_lote_ordem_recibo(p_descricao,p_list_documentos);

			elsif p_tipo = 84 then
				l_id_lote := gera_lote_r3_d25r(p_descricao,p_list_documentos);

			elsif p_tipo = 82 then
				l_id_lote := gera_lote_r3_d27r(p_descricao,p_list_documentos);

			else
				l_id_lote := gera_lote_normal(p_descricao,p_list_documentos);
			--        record_error('ERRO_DOC','  ' || to_char(l_id_lote) ,null);
			end if;


			/* IMPRIME CARTA DE ACOMPANHAMENTO DE LOTE */
			FOR RW IN (SELECT DOCUMENTO_GERADO_ID FROM DOC_LOTES_IMPRESSAO WHERE ID = P_TIPO AND DOCUMENTO_GERADO_ID IS NOT NULL) LOOP
				BEGIN

					SELECT MAX(AMBIENTE_ID)
						,MAX(LOTE_ORDEM)
					INTO l_ambiente_id
						,l_ordem_lote
					FROM SVR_DOCUMENTOS
					WHERE LOTE_ID = l_id_lote;

					l_parametros_carta.extend;
					l_parametros_carta(1) := parametro('P_LOTE_ID', l_ID_LOTE);
					l_parametros_carta.extend;
					l_parametros_carta(2) := parametro('P_USUARIO', 'ADMINISTRADOR' );
					l_parametros_carta.extend;
					l_parametros_carta(3) := parametro('_USER', l_ambiente_id);
					l_id_carta := FPEDIDO_EXECUCAO( RW.documento_gerado_id, l_parametros_carta);
					l_parametros_carta.delete;

					l_ordem_lote := l_ordem_lote + 1;
					update svr_documentos
					set    lote_ordem = l_ordem_lote
					,      lote_id    = l_id_lote
					where  id         = l_id_carta;

				EXCEPTION
					WHEN OTHERS THEN
						record_error('ERRO_DOC','CARTA ASSOCIADA AO LOTE NAO IMPRESSA  ' || to_char(l_id_lote) ,null);
				END;

			END LOOP;

			SELECT count(id)
			INTO l_first_imp
			FROM svr_documentos
			WHERE lote_id = l_id_lote
				AND n_impressoes = 0;


			if l_first_imp = 0 then
				l_tipo_queue := 'COPIA';
			else
				l_tipo_queue := 'IMPRESSAO';
			end if;

			for documento in documentos(l_id_lote) loop
				for n_copias in 1..documento.n_copias loop
					INSERT INTO svr_queue (
						id
						,tipo_queue_rf
						,documento_id
						,data_pedido
						,estado
						,criado_por
						,impressora_id
						)
					VALUES (
						id_queue_Seq.nextval
						,l_tipo_queue
						,documento.id
						,sysdate
						,'ESPERA'
						,l_user
						,l_id_impressora
						);

				end loop;

				/* -- comentado para o issue 1342 --

				l_email := null;

				begin

					select email
					into l_email
					from v_recibos_email
					where id = documento.id;


					EXCEPTION
					WHEN OTHERS THEN
						l_email := null;
				end;

				if l_email is not null then

					INSERT INTO svr_queue (
						id
						,tipo_queue_rf
						,documento_id
						,data_pedido
						,estado
						,criado_por
						,atributo01
						)
					VALUES (
						id_queue_Seq.nextval
						,'EMAIL'
						,documento.id
						,sysdate
						,'ESPERA'
						,user
						,l_email
						);
				end if;

				-- fim comentario para o issue 1342 -- */

			end loop;

			commit;
		end if;
	end;

	function processa_lote(p_tipo in number
							, p_descricao in varchar2
							, p_list_documentos in varchar2)
	return number is

		l_id_lote       svr_lotes.id%type;

	begin

		if p_list_documentos is not null then
			if p_tipo = 4 then
				l_id_lote := gera_lote_r3_d25(p_descricao,p_list_documentos);

			elsif p_tipo = 5 then
				l_id_lote := gera_lote_ordem_recibo(p_descricao,p_list_documentos);

			elsif p_tipo = 6 then
				l_id_lote := gera_lote_r3_d28(p_descricao,p_list_documentos);

			elsif p_tipo = 88 then
				l_id_lote := gera_lote_r3_d28r(p_descricao,p_list_documentos);

			elsif p_tipo = 85 then
				l_id_lote := gera_lote_ordem_recibo(p_descricao,p_list_documentos);

			elsif p_tipo = 84 then
				l_id_lote := gera_lote_r3_d25r(p_descricao,p_list_documentos);

			elsif p_tipo = 2 then
				l_id_lote := gera_lote_r3_d27(p_descricao,p_list_documentos);

			elsif p_tipo = 3 then
				l_id_lote := gera_lote_r3_d31(p_descricao,p_list_documentos);

			elsif p_tipo = 82 then
				l_id_lote := gera_lote_r3_d27r(p_descricao,p_list_documentos);

			else
				l_id_lote := gera_lote_normal(p_descricao,p_list_documentos);

			end if;

		end if;

		return l_id_lote;

	end;


	procedure add_to_lote(p_documento_id number
							, p_lote_id number
							, p_ordem_lote number default null) is
	begin

		update svr_documentos
		set    lote_id    = p_lote_id
		,      lote_ordem = p_ordem_lote
		where  id         = p_documento_id;
		commit;

	end;


	procedure imprime_lote(p_lote_id in number) is

		cursor documentos(c_id_lote number) is
			SELECT id
			FROM svr_documentos
			WHERE lote_id = c_id_lote
			ORDER BY lote_ordem;

		l_user          varchar2(30);
		l_tipo_queue    varchar2(10);
		l_first_imp     number;

	begin

		select decode(username,user,'ADMINISTRADOR',user)
		into   l_user
		from   user_users;

		SELECT count(id)
		INTO l_first_imp
		FROM svr_documentos
		WHERE lote_id = p_lote_id
			AND n_impressoes = 0;

		if l_first_imp = 0 then
			l_tipo_queue := 'COPIA';
		else
			l_tipo_queue := 'IMPRESSAO';
		end if;

		for documento in documentos(p_lote_id) loop

			INSERT INTO svr_queue (
				id
				,tipo_queue_rf
				,documento_id
				,data_pedido
				,estado
				,criado_por
				)
			VALUES (
				id_queue_Seq.nextval
				,l_tipo_queue
				,documento.id
				,sysdate
				,'ESPERA'
				,l_user
				);

		end loop;

		commit;
	end;

	function CHECK_DOCUMENTO(P_MODELO_ID VARCHAR2
							, P_FILTER VARCHAR2  DEFAULT NULL
							, P_USER VARCHAR2 DEFAULT 'COSEC')
	return number is

		type dyn_cursor is ref cursor;
		l_result   number;
		l_query    varchar2(2000);
		documentos dyn_cursor;
		l_user varchar2(30);

	begin

		record_error('ERRO_DOC','Check do documento ' || p_filter,p_modelo_id);

		l_query := 	'select '                                  ||
					'  id '                                    ||
					'from '                                    ||
					'  svr_documentos '                        ||
					'where '                                   ||
					'  modelo_id = ''' || p_modelo_id || ''' ' ||
					'and '                                     ||
					'  ambiente_id = ''' || p_user || '''';

		if p_filter is not null then
			l_query := l_query || ' and ' || p_filter;
		end if;

		l_query := l_query || ' order by id desc ';
		--    dbms_output.put_line ( l_query);

		--      record_error('ERRO_DOC',l_query,p_modelo_id);

		if slistaparameter is not null and
			slistaparameter.count > 0 then
			null;
		else
			open documentos for l_query;
			fetch documentos into l_result;

			if documentos%notfound then
				l_result := -1;
			end if;

			close documentos;
		end if;

		record_error('ERRO_DOC','Check do documento finalizado.',p_modelo_id,l_result);

		return l_result;
	end;

	function ALTER_DOCUMENTO(P_MODELO_ID VARCHAR2
							,P_ID NUMBER
							, P_USER VARCHAR2 DEFAULT 'COSEC')
	return number is

		l_Posicao_parametro VARCHAR(2);
		l_query VARCHAR(2000);
		l_report_id        svr_documentos.report_id%type;
		l_documento_impresso number;
		l_documento_existe   number;
		l_queue_count    number;

	begin
		record_error('ERRO_DOC','Alteracao dos Parametros do Documento.',p_modelo_id,p_id);

		SELECT count(*)
		INTO l_documento_existe
		FROM svr_documentos
		WHERE id = p_id;

		if l_documento_existe = 0 then
			record_error('ERRO_DOC','Documento N.'||P_ID||' nao existe!',p_modelo_id,p_id);
			/*        SLISTAPARAMETER.DELETE; */
			return -1;
		end if;

		SELECT count(*)
		INTO l_queue_count
		FROM svr_queue
		WHERE documento_id = p_id;

		if l_queue_count > 0 then

			SELECT count(*)
				,max(report_id)
			INTO l_documento_impresso
				,l_report_id
			FROM svr_queue a
				,svr_documentos b
			WHERE a.documento_id = p_id
				AND b.id = a.documento_id
				AND a.tipo_queue_rf = 'IMPRESSAO'
				AND a.estado NOT IN (
					'CANCELLED'
					,'ERRO'
					);

			if l_documento_impresso != 0 then
				record_error('ERRO_DOC','Documento Impresso ou a espera de imprimir.',p_modelo_id,p_id);
				return -1;
			end if;

		end if;

		if slistaparameter.count = 0 then
			record_error('ERRO_DOC','Nao foram submetidos parametros.',p_modelo_id,p_id);
			PARAMCOUNT:=0;
			SLISTAPARAMETER.DELETE;
			return -1;
		end if;

		set_parametro_string('_USER',p_user);

		if slistaparameter is not null then

			for i in 1..slistaparameter.count loop

				begin
					SELECT LPAD(TO_CHAR(b.n_parametro), 2, '0')
					INTO l_Posicao_parametro
					FROM svr_documentos a
						,svr_parametros_report b
					WHERE a.id = p_id
						AND a.report_id = b.report_id
						AND b.nome = slistaparameter(i).nome;

					l_query:= 	'update svr_documentos ' ||
								'set parametro' || l_Posicao_parametro || ' = ''' || slistaparameter(i).valor || ''' ' ||
								'where id = ' || p_id || ' ' ;

					execute immediate l_query;

				end;

			end loop;

			if l_queue_count > 0 then
				update svr_queue
				set    estado      = 'CANCELLED'
				where  documento_id = p_id
				and    tipo_queue_rf = 'EXECUCAO'
				and    estado     != 'ERRO';

				INSERT INTO svr_queue (
					id
					,tipo_queue_rf
					,documento_id
					,data_pedido
					,estado
					)
				VALUES (
					id_queue_Seq.nextval
					,'EXECUCAO'
					,p_id
					,sysdate
					,'ESPERA'
					);

			end if;

			update svr_documentos
			set    data_pedido = sysdate
			where  id          = p_id;

			PARAMCOUNT:=0;
			slistaparameter.delete;
			commit;

		else
			record_error('ERRO_DOC','Nao foram submetidos parametros.',p_modelo_id,p_id);
			PARAMCOUNT:=0;
			SLISTAPARAMETER.DELETE;
			return -1;
		end if;

		return 1;
	end;

	PROCEDURE GERA_BACKUP(p_nome_media IN VARCHAR2
						, p_tipo_media IN VARCHAR2
						, p_destino IN VARCHAR2
						, p_observacoes IN VARCHAR2
						, p_user IN VARCHAR2 DEFAULT 'COSEC') IS

		l_backups_mes number;

	BEGIN
		record_error('ERRO_DOC', 'GERA_BACKUP ' || p_nome_media, null);

		SELECT COUNT(*) + 1
		INTO l_backups_mes
		FROM svr_backups
		WHERE SUBSTR(nome, INSTR(nome, '_') + 1, 6) = p_nome_media;

		INSERT INTO svr_backups (
			id
			,nome
			,tipo_midia_id
			,destino
			,observacoes
			,criado_por
			)
		VALUES (
			Seq_backup_id.nextval
			,'COSEC_' || p_nome_media || '_CD' || TO_CHAR(l_backups_mes)
			,p_tipo_media
			,p_destino || 'COSEC_' || p_nome_media || '_CD' || TO_CHAR(l_backups_mes)
			,p_observacoes
			,p_user
			);

		COMMIT;

	EXCEPTION
		WHEN OTHERS THEN
			record_error('ERRO_DOC', 'BACKUP não efectuado', null);
	END;

	PROCEDURE INSERE_DOCS_BACKUP(p_backup_id IN NUMBER
								,p_list_documentos IN VARCHAR2
								,p_user IN VARCHAR2 DEFAULT 'COSEC') IS

		type dyn_cursor is ref cursor;
		documentos dyn_cursor;
		l_query varchar2(256);
		documento svr_documentos.id%type;

	BEGIN
		record_error('ERRO_DOC', 'INSERE_DOCS_BACKUP ' || p_list_documentos, null);

		IF LENGTH(p_list_documentos) = 0 THEN
			record_error('ERRO_DOC', 'A lista de documentos a associar ao backup esta invalida ', null);
			return;
		END IF;

		l_query := 	'SELECT '                                ||
					'  id '                                  ||
					'FROM '                                  ||
					'  svr_documentos '                      ||
					'WHERE '                                 ||
					'  id IN (' || p_list_documentos || ') ' ||
					'ORDER BY '                              ||
					'  id ';

		OPEN documentos FOR l_query;

		--Actualizar todos os documentos (associa-los ao backup) e registo-los para a queue
		LOOP
			FETCH documentos into documento;
			EXIT WHEN documentos%NOTFOUND;

			UPDATE svr_documentos
			SET backup_id = p_backup_id
			WHERE id = documento;


			INSERT INTO svr_queue (
				id
				,tipo_queue_rf
				,documento_id
				,data_pedido
				,estado
				,criado_por
				)
			VALUES (
				id_queue_Seq.nextval
				,'BACKUP'
				,documento
				,SYSDATE
				,'ESPERA'
				,user
				);

		END LOOP;

		--Inserir a data de criacao do backup (deixa de ser possivel alterar o backup)
		UPDATE svr_backups
		SET data_criacao = SYSDATE
		WHERE id = p_backup_id;


		COMMIT;
	EXCEPTION
		WHEN OTHERS THEN
			record_error('ERRO_DOC', 'Documentos não associados ao backup', null);
	END;

	PROCEDURE SET_BACKUP_ONLINE(p_backup_id IN NUMBER
								, p_isOnline IN VARCHAR2) IS
	BEGIN
		record_error('ERRO_DOC', 'SET_BACKUP_ONLINE ' || p_backup_id, null);

		IF p_isOnline <> 'S' AND p_isOnline <> 'N' THEN
			record_error('ERRO_DOC', 'Não foi inserido um estado correcto para o backup', null);
			RETURN;
		END IF;

		--Actualizar o estado do backup (online/offline)
		UPDATE
			svr_backups
		SET
			media_online = p_isOnline
		WHERE
			id = p_backup_id;

		COMMIT;

	EXCEPTION
		WHEN OTHERS THEN
			record_error('ERRO_DOC', 'BACKUP não colocado online/offline', null);
	END;


	PROCEDURE ALTERA_DISPONIBILIDADE (P_DOCID IN VARCHAR2
									, P_USER IN VARCHAR2
									, P_DISPONIBILIDADE IN VARCHAR2) IS

		v_disponibilidade varchar2(10);

	BEGIN
		record_error('ERRO_DOC', 'ALTERA_DISPONIBILIDADE doc. ' || P_DOCID, null);

		IF P_DISPONIBILIDADE = 'ON' THEN
			v_disponibilidade := 'ONL';
		ELSIF P_DISPONIBILIDADE = 'OFF' THEN
			v_disponibilidade := 'OFF';
		ELSIF P_DISPONIBILIDADE = 'A' THEN
			v_disponibilidade := 'ANU';
		ELSE
			v_disponibilidade := null;
		END IF;

		IF v_disponibilidade = null THEN
			record_error('ERRO_DOC', 'Não foi inserida uma disponibilidade correcta para o documento', null);
		ELSE
			UPDATE
				svr_documentos
			SET
				disponivel_rf = v_disponibilidade
			WHERE
				id = P_DOCID;
		END IF;

		IF P_DISPONIBILIDADE = 'A' THEN

			INSERT INTO svr_queue (
				id
				,tipo_queue_rf
				,documento_id
				,data_pedido
				,estado
				,criado_por
				)
			VALUES (
				id_queue_seq.nextval
				,'ANULADO'
				,P_DOCID
				,SYSDATE
				,'TERMINADO'
				,P_USER
				);

		END IF;

	EXCEPTION
		WHEN OTHERS THEN
			record_error('ERRO_DOC', 'O documento não foi devidamente anulado', null);
	END;


	PROCEDURE SET_PARAMETRO_STRING(P_NOMEPAR IN VARCHAR2, P_VAL IN VARCHAR2) IS
	BEGIN
		PARAMCOUNT:=PARAMCOUNT+1;
		SLISTAPARAMETER.EXTEND;
		SLISTAPARAMETER(paramcount):= PARAMETRO(UPPER(P_NOMEPAR), P_VAL);
	END;

	PROCEDURE SET_PARAMETRO_NUMERO(P_NOMEPAR IN VARCHAR2, P_VAL IN NUMBER) IS
	BEGIN
		PARAMCOUNT:=PARAMCOUNT+1;
		SLISTAPARAMETER.EXTEND;
		SLISTAPARAMETER(paramcount):= PARAMETRO(UPPER(P_NOMEPAR),TO_CHAR(P_VAL));
	END;

	PROCEDURE SET_PARAMETRO_DATA(P_NOMEPAR IN VARCHAR2, P_VAL IN DATE) IS
	BEGIN
		PARAMCOUNT:=PARAMCOUNT+1;
		SLISTAPARAMETER.EXTEND;
		SLISTAPARAMETER(paramcount):= PARAMETRO(UPPER(P_NOMEPAR),TO_CHAR(P_VAL,'DD-MM-YYYY'));
	END;

	PROCEDURE EXECUTA (P_NOMEDOC IN VARCHAR2) IS
	BEGIN
		V_ID_EXEC:=FPEDIDO_EXECUCAO(P_NOMEDOC,SLISTAPARAMETER);
		PARAMCOUNT:=0;
		SLISTAPARAMETER.DELETE;
	END;

	PROCEDURE REEXECUTA (P_NOMEDOC IN VARCHAR2) IS
	BEGIN
		V_ID_EXEC:=FPEDIDO_REEXECUCAO(P_NOMEDOC,SLISTAPARAMETER);
		PARAMCOUNT:=0;
		SLISTAPARAMETER.DELETE;
	END;

	FUNCTION GET_ID_EXECUCAO RETURN NUMBER
	IS
	BEGIN
		RETURN V_ID_EXEC;
	END;

	PROCEDURE IMPRIME (P_NOMEDOC IN VARCHAR2
						, P_TIPO_VALIDACAO IN VARCHAR2 DEFAULT 'F'
						, P_IMPRESSORA_ID IN VARCHAR2 DEFAULT '0') IS
	BEGIN
		PEDIDO_IMPRESSAO(P_NOMEDOC,SLISTAPARAMETER,P_TIPO_VALIDACAO,P_IMPRESSORA_ID);
		PARAMCOUNT:=0;
		SLISTAPARAMETER.DELETE;
	END;

	PROCEDURE IMPRIME (P_DOCID IN NUMBER
						, P_USUARIO IN VARCHAR2
						, P_AMBIENTE IN VARCHAR2
						, P_TIPO_VALIDACAO IN VARCHAR2 DEFAULT 'F'
						, P_IMPRESSORA_ID IN VARCHAR2 DEFAULT '0') IS
	BEGIN
		PEDIDO_IMPRESSAO(P_DOCID,P_USUARIO,P_AMBIENTE,P_TIPO_VALIDACAO,P_IMPRESSORA_ID);
	END;

	PROCEDURE REIMPRIME (P_NOMEDOC IN VARCHAR2
						, P_TIPO_VALIDACAO IN VARCHAR2 DEFAULT 'F'
						, P_IMPRESSORA_ID IN VARCHAR2 DEFAULT '0') IS
	BEGIN
		PEDIDO_REIMPRESSAO(P_NOMEDOC,SLISTAPARAMETER,P_TIPO_VALIDACAO,P_IMPRESSORA_ID);
		PARAMCOUNT:=0;
		SLISTAPARAMETER.DELETE;
	END;


	PROCEDURE EMAIL (P_NOMEDOC IN VARCHAR2
					, P_ADDRESS IN VARCHAR2) IS
	BEGIN
		PEDIDO_EMAIL(P_NOMEDOC,SLISTAPARAMETER, P_ADDRESS);
		PARAMCOUNT:=0;
		SLISTAPARAMETER.DELETE;
	END;

	PROCEDURE EMAIL (P_DOCID IN NUMBER
					, P_ADDRESS IN VARCHAR2
					, P_USUARIO IN VARCHAR2
					, P_AMBIENTE IN VARCHAR2) IS
	BEGIN
		PEDIDO_EMAIL(P_DOCID,P_ADDRESS,P_USUARIO,P_AMBIENTE);
	END;

	PROCEDURE REEMAIL (P_NOMEDOC IN VARCHAR2
						, P_ADDRESS IN VARCHAR2) IS
	BEGIN
		PEDIDO_REEMAIL(P_NOMEDOC,SLISTAPARAMETER, P_ADDRESS);
		PARAMCOUNT:=0;
		SLISTAPARAMETER.DELETE;
	END;

	PROCEDURE ANULAR (P_DOCID IN VARCHAR2
					, P_USER IN VARCHAR2) IS
	BEGIN
		ALTERA_DISPONIBILIDADE(P_DOCID, P_USER, 'A');
	END;


	FUNCTION HASPERMISSAO(P_USER VARCHAR2
						, P_MODELO VARCHAR2
						, P_TIPOPERMISSAO NUMBER) RETURN VARCHAR2 IS

		countPermissao number;

	BEGIN

		SELECT count(1)
		INTO countPermissao
		FROM cfg_permissoes_siid p
		WHERE p.modelo_id = P_MODELO
			AND p.username = decode(substr(P_USER, 1, 5), 'COSEC', 'ADMINISTRADOR', P_USER)
			AND tipo_permissao_rf = P_TIPOPERMISSAO
			AND data_inicio <= sysdate
			AND nvl(data_fim, sysdate + 1) >= sysdate;

		if countPermissao = 0 then
			return '0';
		else
			return '1';
		end if;

	END;

	FUNCTION GETDOCDIRECTORY(P_DOCID NUMBER) RETURN VARCHAR2 IS
		docDirectory varchar(2000);

	BEGIN
		SELECT DECODE(docs.disponivel_rf
					, 'ONL', NVL(REPLACE(gd.valor, ';') || to_char(docs.data_pedido, 'YYYY') || '\' || to_char(docs.data_pedido, 'MM') || '\' || to_char(docs.data_pedido, 'DD') || '\' || docs.nome_output || '.pdf', '')
					, 'ANU', 'ANULADO'
					, 'OFF', DECODE(bck.media_online, 'S', bck.drive_online || '\' || bck.nome || '\pdf\' || to_char(docs.data_pedido, 'YYYY') || '\' || to_char(docs.data_pedido, 'MM') || '\' || to_char(docs.data_pedido, 'DD') || '\' || docs.nome_output || '.pdf'
					, 'OFFLINE')) DOC_DIRECTORY
		INTO docDirectory
		FROM svr_variaveis_siid gd
			,svr_backups bck
			,svr_documentos docs
		WHERE docs.id = P_DOCID
			AND gd.tipo_variavel_rf(+) = 'PDF'
			AND docs.ambiente_id = gd.ambiente_id
			AND docs.backup_id = bck.id(+);

		return docDirectory;
	END;

	procedure SET_NOTIFICACAO ( P_DOCID in number) is
		cursor CURDOC is 
			SELECT *
			FROM SVR_DOCUMENTOS DOC
			WHERE DOC.id = P_DOCID
				AND DOC.MODELO_ID IN (
					'R3.D25'
					,'R3.D25R'
					,'R3.D28'
					,'R3.D28R'
					)
				AND 1 = (
					SELECT COUNT(*)
					FROM SVR_QUEUE Q
					WHERE Q.TIPO_QUEUE_RF = 'IMPRESSAO'
						AND Q.DOCUMENTO_ID = DOC.id
					);

		SQLERR         varchar2(2000);
		IMPUSER        varchar2(60);
		DDATAIMPRESSAO date;
		QUEUE_ID       NUMBER;

	begin
		record_error('ERRO_DOC',USER||'> SIID > DOCUMENTO PARA NOTIFICAR: '||P_DOCID);

		for DOC in CURDOC LOOP

			begin
				record_error('ERRO_DOC','VAMOS OBTER ID DA QUEUE DE IMPRESSAO',DOC.MODELO_ID, P_DOCID);

				SELECT CRIADO_POR
					,DATA_FINALIZACAO
					,ID
				INTO IMPUSER
					,DDATAIMPRESSAO
					,QUEUE_ID
				FROM SVR_QUEUE
				WHERE TIPO_QUEUE_RF = 'IMPRESSAO'
					AND DOCUMENTO_ID = DOC.id;
				--        and DATA_FINALIZACAO is not null;

				if DOC.MODELO_ID in ('R3.D25','R3.D25R','R3.D28','R3.D28R') then

					record_error('ERRO_DOC','NOTIFICA DOCUMENTO',P_DOCID);

					P_SET_GARNOTIF ( IMPUSER
									, DOC.PARAMETRO05
									, DOC.PARAMETRO06
									, DOC.PARAMETRO04
									, 'IMP'
									, DOC.PARAMETRO07
									, SQLERR); 

					record_error('ERRO_DOC','VALIDA SE HOUVE ERRO NA NOTIFICACAO',DOC.MODELO_ID, P_DOCID);

					if SQLERR is not null then

						record_error('ERRO_DOC','HOUVE ERRO NA NOTIFICACAO:'||SUBSTR(SQLERR,1,1500),DOC.MODELO_ID, P_DOCID);

						update SVR_QUEUE
						set RESULTADO = NVL(RESULTADO,'-')||' FALHOU NOTIFICACAO: '||SQLERR
						where id = queue_id;

					else
						record_error('ERRO_DOC','FEZ NOTIFICACAO',DOC.MODELO_ID, P_DOCID);

						update SVR_QUEUE
						set RESULTADO = NVL(RESULTADO,'-')||' FEZ NOTIFICACAO DO DOCUMENTO'
						where id = queue_id;

					end if;
				END IF;

			EXCEPTION
				when NO_DATA_FOUND then

					RECORD_ERROR('ERRO_DOC','FALHOU PROCESSO DE NOTIFICACAO DE DOCUMENTO',NULL,P_DOCID);

					update SVR_QUEUE
					set RESULTADO = NVL(RESULTADO,'-')||' FALHOU NOTIFICACAO: Documento ainda a imprimir!'
					where id = QUEUE_ID;
			END;

		end LOOP;

	EXCEPTION
		when OTHERS then
			RECORD_ERROR('ERRO_DOC','FALHOU SET_NOTIFICACAO',P_DOCID);
	END SET_NOTIFICACAO;

    /*
	*  SET_READY_EDOCLINK
	*
	* OBJECTIVO: Enviar ao EDOCLINK a INFORMACÃO do documento gerado pelo SIID
	* AUTOR    : Jose Viegas
	* DATA     : 15-12-2014
	*
	* ULTIMAS ALTERACÕES
	*
	*   DATA       AUTOR           DESCRICÃO
	*   ========== =============== =================================================
	*/
	PROCEDURE SET_READY_EDOCLINK ( P_DOCID in number)  is

		cursor CURDOC is 
			SELECT *
			FROM SVR_DOCUMENTOS DOC
			WHERE DOC.id = P_DOCID
				AND DOC.MODELO_ID IN (
					'R3.D25'
					,'R3.D25R'
					,'R3.D28'
					,'R3.D28R'
					)
				AND 1 = (
					SELECT COUNT(*)
					FROM SVR_QUEUE Q
					WHERE Q.TIPO_QUEUE_RF = 'EXECUCAO'
						AND Q.DOCUMENTO_ID = DOC.id
					);

		SQLERR         varchar2(2000);
		IMPUSER        varchar2(60);
		DDATAIMPRESSAO date;
		QUEUE_ID       NUMBER;

	begin

		record_error('ERRO_DOC',USER||'> SIID > DOCUMENTO PARA ENVIAR AO EDOCLINK: '||P_DOCID);

		for DOC in CURDOC LOOP

			begin

				record_error('ERRO_DOC','VAMOS OBTER ID DA QUEUE DE EXECUCAO',DOC.MODELO_ID, P_DOCID);

				SELECT CRIADO_POR
					,DATA_FINALIZACAO
					,ID
				INTO IMPUSER
					,DDATAIMPRESSAO
					,QUEUE_ID
				FROM SVR_QUEUE
				WHERE TIPO_QUEUE_RF = 'EXECUCAO'
					AND DOCUMENTO_ID = DOC.id;
				--        and DATA_FINALIZACAO is not null;

				if DOC.MODELO_ID in ('R3.D25','R3.D25R','R3.D28','R3.D28R') then

					record_error('ERRO_DOC','ENVIA DOCUMENTO',P_DOCID);

					p_set_GarRegis ( IMPUSER
									, DOC.PARAMETRO05
									, DOC.PARAMETRO06
									, DOC.PARAMETRO04
									, DOC.PARAMETRO07
									, SQLERR); 

					record_error('ERRO_DOC','VALIDA SE HOUVE ERRO NO ENVIO',DOC.MODELO_ID, P_DOCID);

					If SQLERR='C4141' THEN
						record_error('ERRO_DOC','HOUVE ERRO NO ENVIO: Deve preencher os campos obrigatorios',DOC.MODELO_ID, P_DOCID);
					ELSIF SQLERR='000156' THEN
						record_error('ERRO_DOC','HOUVE ERRO NO ENVIO: Valor erroneo',DOC.MODELO_ID, P_DOCID);
					ELSIF SQLERR='000157' THEN
						record_error('ERRO_DOC','HOUVE ERRO NO ENVIO: Valor numerico invalido',DOC.MODELO_ID, P_DOCID);
					ELSIF SQLERR='20000' THEN
						record_error('ERRO_DOC','HOUVE ERRO NO ENVIO: Erro interno. Operacao anulada',DOC.MODELO_ID, P_DOCID);
					else
						If SQLERR != NULL THEN
							record_error('ERRO_DOC','HOUVE ERRO NO ENVIO: Erro Desconhecido. Operacao anulada'||SUBSTR(SQLERR,1,1500),DOC.MODELO_ID, P_DOCID);
						else
							record_error('ERRO_DOC','FOI ENVIADO O DOCUMENTO',DOC.MODELO_ID, P_DOCID);
						end IF;
					end IF;
				END IF;

			EXCEPTION
				when NO_DATA_FOUND then
					RECORD_ERROR('ERRO_DOC','FALHOU PROCESSO DE ENVIO DE DOCUMENTO',NULL,P_DOCID);
			END;
		end LOOP;
	EXCEPTION
		when OTHERS then
			RECORD_ERROR('ERRO_DOC','FALHOU SET_READY_EDOCLINK',P_DOCID);
	END SET_READY_EDOCLINK;

	/*
	*  CLEAN_EDOCS
	*
	* OBJECTIVO: LIMPAR A INFORMACÃO NO SIID DAS GARANTIAS CARREGADAS NO EDOCLINK
	* AUTOR    : Jose Viegas
	* DATA     : 01-11-2011
	*
	* ULTIMAS ALTERACÕES
	*
	*   DATA       AUTOR           DESCRICÃO
	*   ========== =============== =================================================
	*/
	PROCEDURE CLEAN_EDOCS (P_NORMAL IN NUMBER DEFAULT 2, P_URGENT IN NUMBER DEFAULT 1) is

		cursor LST_EDOCS_F76 is
			SELECT /*+ LEADING(A) use_nl(a,B) index(A,IDX_ESTADOTYPE_SQUE) */
				DOC.id DOCUMENTO_ID
				,DOC.MODELO_ID MODELO_ID
				,REP.NOME_FICHEIRO NOME_REPORT
				,TO_CHAR(DOC.data_pedido, 'YYYY\MM\DD') DIRECTORIA
				,DOC.NOME_OUTPUT NOME_FICHEIRO
				,PARAMETRO01
				,PARAMETRO02
				,PARAMETRO03
				,PARAMETRO04
				,PARAMETRO05
				,PARAMETRO06
				,PARAMETRO07
				,PARAMETRO08
				,DOC.DATA_PEDIDO
				,DOC.DATA_EXECUCAO
				,DOC.DATA_ARQUIVO
				,DOC.ARQUIVADO
				,DOC.DATA_IMPRESSAO
				,DOC.IMPRESSO_POR
				,DOC.CRIADO_POR CRIADO_POR
				,MODELO.MODO_CERTIFICADO_RF CERTIFICACAO
				,MODELO.MODO_IMPRESSAO_RF MODO_IMPRESSAO
				,MODELO.MODO_EXPEDICAO_RF MODO_EXPEDICAO
				,DOC.DISPONIVEL_RF
			FROM SVR_REPORT_SIID REP
				,DOC_MODELOS_DOCUMENTO MODELO
				,SVR_DOCUMENTOS DOC
			WHERE DOC.REPORT_ID = REP.id
				AND DOC.MODELO_ID = MODELO.id
				--and DOC.DISPONIVEL_RF='EDC'
				AND DOC.DATA_ARQUIVO IS NULL
				AND DOC.DATA_EXECUCAO IS NOT NULL
				AND DOC.DATA_IMPRESSAO IS NULL
				AND MODELO.MODO_EXPEDICAO_RF = 'G'
				AND TRUNC(sysdate + 1) - DATA_PEDIDO > CASE MODELO_ID
					WHEN 'R3.D25R'
						THEN P_URGENT
					WHEN 'R3.D28R'
						THEN P_URGENT
					ELSE P_NORMAL
					END
				AND EXISTS (
					SELECT 1
					FROM co_usupolfu F76
						,CO_PROGAR GARANTIA
					WHERE F76.nmpoliza = GARANTIA.nmpoliza
						AND F76.ESTADO = 'M'
						AND F76.CDRAMO = GARANTIA.CDRAMO
						AND F76.CDUNIECO = GARANTIA.CDUNIECO
						AND F76.cdfuncion = '76'
						AND F76.swacceso = 'S'
						AND trunc(F76.FECHACCES) <= trunc(GARANTIA.FEREGISGAR)
						AND GARANTIA.CDUNIECO = DOC.PARAMETRO05
						AND GARANTIA.CDRAMO = DOC.PARAMETRO06
						AND GARANTIA.NMPOLIZA = DOC.PARAMETRO04
						AND GARANTIA.NMGARANT = DOC.PARAMETRO07
					);


		cursor LST_EDOCS_NORM is
			SELECT /*+ LEADING(A) use_nl(a,B) index(A,IDX_ESTADOTYPE_SQUE) */
				DOC.id DOCUMENTO_ID
				,DOC.MODELO_ID MODELO_ID
				,REP.NOME_FICHEIRO NOME_REPORT
				,TO_CHAR(DOC.data_pedido, 'YYYY\MM\DD') DIRECTORIA
				,DOC.NOME_OUTPUT NOME_FICHEIRO
				,PARAMETRO01
				,PARAMETRO02
				,PARAMETRO03
				,PARAMETRO04
				,PARAMETRO05
				,PARAMETRO06
				,PARAMETRO07
				,PARAMETRO08
				,DOC.DATA_PEDIDO
				,DOC.DATA_EXECUCAO
				,DOC.DATA_ARQUIVO
				,DOC.ARQUIVADO
				,DOC.DATA_IMPRESSAO
				,DOC.IMPRESSO_POR
				,DOC.CRIADO_POR CRIADO_POR
				,MODELO.MODO_CERTIFICADO_RF CERTIFICACAO
				,MODELO.MODO_IMPRESSAO_RF MODO_IMPRESSAO
				,MODELO.MODO_EXPEDICAO_RF MODO_EXPEDICAO
				,DOC.DISPONIVEL_RF
			FROM SVR_REPORT_SIID REP
				,DOC_MODELOS_DOCUMENTO MODELO
				,SVR_DOCUMENTOS DOC
			WHERE DOC.REPORT_ID = REP.id
				AND DOC.MODELO_ID = MODELO.id
				--and DOC.DISPONIVEL_RF='EDC'
				AND DOC.DATA_ARQUIVO IS NULL
				AND DOC.DATA_EXECUCAO IS NOT NULL
				AND DOC.DATA_IMPRESSAO IS NULL
				AND MODELO.MODO_EXPEDICAO_RF = 'G'
				AND NOT EXISTS (
					SELECT 1
					FROM co_usupolfu F76
						,CO_PROGAR GARANTIA
					WHERE F76.nmpoliza = GARANTIA.nmpoliza
						AND F76.ESTADO = 'M'
						AND F76.CDRAMO = GARANTIA.CDRAMO
						AND F76.CDUNIECO = GARANTIA.CDUNIECO
						AND F76.cdfuncion = '76'
						AND F76.swacceso = 'S'
						AND trunc(F76.FECHACCES) <= trunc(GARANTIA.FEREGISGAR)
						AND GARANTIA.CDUNIECO = DOC.PARAMETRO05
						AND GARANTIA.CDRAMO = DOC.PARAMETRO06
						AND GARANTIA.NMPOLIZA = DOC.PARAMETRO04
						AND GARANTIA.NMGARANT = DOC.PARAMETRO07
					);

		DATA_NOTIFICACAO DATE;

	BEGIN

		FOR RW in LST_EDOCS_F76 LOOP

			BEGIN

				SELECT FENOTIF
				INTO DATA_NOTIFICACAO
				FROM CO_PROGAR X
				WHERE X.CDUNIECO = RW.PARAMETRO05
					AND X.CDRAMO = RW.PARAMETRO06
					AND X.NMPOLIZA = RW.PARAMETRO04
					AND X.NMGARANT = RW.PARAMETRO07;

				IF (DATA_NOTIFICACAO IS NOT NULL ) THEN

					UPDATE SVR_DOCUMENTOS
					SET arquivado = 'S'
						,DATA_ARQUIVO = DATA_NOTIFICACAO
						,DISPONIVEL_RF = 'EDC'
					WHERE ID = RW.DOCUMENTO_ID;  

					COMMIT;

					RECORD_ERROR('ERRO_DOC','CLEAN_EDOCS: GARANTIA NOTIFICADA ',RW.MODELO_ID,RW.DOCUMENTO_ID);

				ELSE

					IF RW.DISPONIVEL_RF = 'EDC' THEN

						UPDATE SVR_DOCUMENTOS
						SET DISPONIVEL_RF = 'ONL'
						WHERE id = RW.DOCUMENTO_ID;

						RECORD_ERROR('ERRO_DOC','CLEAN_EDOCS: GARANTIA RESGATADA PARA IMPRESSAO!',RW.MODELO_ID,RW.DOCUMENTO_ID);

						commit;
					END IF;

				END IF;
			EXCEPTION
				WHEN NO_DATA_FOUND THEN
					RECORD_ERROR('ERRO_DOC','CLEAN_EDOCS: GARANTIA INEXISTENTE NO SISTEMA ',RW.MODELO_ID,RW.DOCUMENTO_ID);
			END;
		END LOOP;

		FOR RW in LST_EDOCS_NORM LOOP

			IF RW.DISPONIVEL_RF = 'EDC' THEN

				UPDATE SVR_DOCUMENTOS
				SET DISPONIVEL_RF = 'ONL'
				WHERE id = RW.DOCUMENTO_ID;

				RECORD_ERROR('ERRO_DOC','CLEAN_EDOCS: GARANTIA RESGATADA PARA IMPRESSAO - nof76!',RW.MODELO_ID,RW.DOCUMENTO_ID);

				commit;
			END IF;

		END LOOP;     

	END CLEAN_EDOCS;

	FUNCTION GETNOMEBACKUP(P_DOCID NUMBER) RETURN VARCHAR2 IS

		nomeBackup varchar(2000);

	BEGIN
		SELECT
			DECODE(docs.disponivel_rf,
					'ONL', 'Ocorreu um erro ao mostrar o documento. Por Favor, contacte o Administrador.',
					'ANU', 'O documento encontra-se no estado "ANULADO".',
					'OFF', DECODE(bck.media_online, 'S', 'Ocorreu um erro ao mostrar o documento. Por Favor, contacte o Administrador.', 'Por favor, contacte o Administrador para que seja inserido o backup ' || bck.nome || '.')) NOME_BACKUP
		INTO
			nomeBackup
		FROM
			svr_backups bck
			,svr_documentos docs
		WHERE
            docs.id = P_DOCID
			AND docs.backup_id = bck.id(+) ;

		return nomeBackup;
	END;
END PKG_DOCUMENTOS_SVR;

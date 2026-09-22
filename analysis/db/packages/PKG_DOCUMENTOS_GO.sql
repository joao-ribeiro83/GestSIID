-- PKG_DOCUMENTOS_GO (owner: SIID_TESTES)


-- ===== SPEC (PACKAGE) =====

PACKAGE Pkg_Documentos_Go
AS

	/*
	-* NOME      : ADD_NUMERO_ATA_R2_D21
	-* OBJECTIVO : RETORNA O NUMERO DA ATA SEGUINTE DA APÓLICE INDICADA
	-* UTILIZACAO: PKG_DOCUMENTOS_GO.ADD_NUMERO_ATA_R2_D21(CDUNIECO, CDRAMO, NMPOLIZA);
	-* AUTOR     : JOÃO RIBEIRO
	-* DATA      : 06-11-2019
	-* VERSÃO    : 1.0
	-*
	-* ÚLTIMAS ALTERAÇÕES
	-*
	-*   DATA       AUTOR           DESCRIÇÃO
	-*   ========== =============== =================================================
	-*
	-*/
	FUNCTION ADD_NUMERO_ATA_R2_D21 (PI_CDUNIECO IN NUMBER, PI_CDRAMO IN NUMBER, PI_NMPOLIZA IN NUMBER, PI_ATA IN VARCHAR2  ) RETURN NUMBER;

	/*
	-* NOME      : GET_NUMERO_ATA_R2_D21
	-* OBJECTIVO : RETORNA O NUMERO DA ATA ATUAL DA APÓLICE INDICADA
	-* UTILIZACAO: PKG_DOCUMENTOS_GO.GET_NUMERO_ATA_R2_D21(CDUNIECO, CDRAMO, NMPOLIZA);
	-* AUTOR     : JOÃO RIBEIRO
	-* DATA      : 06-11-2019
	-* VERSÃO    : 1.0
	-*
	-* ÚLTIMAS ALTERAÇÕES
	-*
	-*   DATA       AUTOR           DESCRIÇÃO
	-*   ========== =============== =================================================
	-*
	-*/
	FUNCTION GET_NUMERO_ATA_R2_D21 (PI_CDUNIECO IN NUMBER, PI_CDRAMO IN NUMBER, PI_NMPOLIZA IN NUMBER ) RETURN NUMBER;


	/*
	-* NOME      : CREATE_R2_D21
	-* OBJECTIVO : Cria o pedido de criação da carta R2.D21.
	-* UTILIZACAO: PKG_DOCUMENTOS_GO.CREATE_R2_D21(CDUNIECO, CDRAMO, NMPOLIZA, DATA_EFEITO, N_ATA, ATA, TIPO_APOLICE, P_ALTERADOS, OUTROS, USUARIO);
	-* AUTOR     : JOÃO RIBEIRO
	-* DATA      : 26-02-2021
	-* VERSÃO    : 1.0
	-*
	-* ÚLTIMAS ALTERAÇÕES
	-*
	-*   DATA       AUTOR           DESCRIÇÃO
	-*   ========== =============== =================================================
	-*
	-*/
	PROCEDURE CREATE_R2_D21(	  P_CDUNIECO 		in 		mpolizas.cdunieco%TYPE
								, P_CDRAMO 			in 		mpolizas.cdramo%TYPE
								, P_NMPOLIZA 		in 		mpolizas.nmpoliza%TYPE
								, P_DATA_EFEITO 	in 		DATE
								, P_N_ATA 			in 		NUMBER default null
								, P_ATA 			in 		VARCHAR2
								, TIPO_APOLICE  	in 		VARCHAR2
								, P_P_ALTERADOS 	in 		VARCHAR2
								, P_OUTROS 			in 		VARCHAR2
								, P_USUARIO			in		VARCHAR2
								, pout_sqlcode    		OUT NUMBER
								, pout_sqlerrm    		OUT VARCHAR2
								) 
	;

	/*
	-* NOME      : CREATE_R2_D20
	-* OBJECTIVO : Cria o pedido de criação da carta R2.D20.
	-* UTILIZACAO: PKG_DOCUMENTOS_GO.CREATE_R2_D20(CDUNIECO, CDRAMO, NMPROPUE, NMPOLIZA, TIPO_APOL, ATA, DT_INI_VIG, DT_FIM_VIG, P_ALTERADOS, PREMIO_SIMP, PREMIO_CIMP, CUSTO_ABERTURA_SIVA, CUSTO_ABERTURA_CIVA
												, TX_FAB, LS_FAB, LC_FAB, TX_CRE, LS_CRE, LC_CRE, VALOR_PRE_CAP, PRAZO_VAL_GAR, OUTROS, USUARIO);
	-* AUTOR     : JOÃO RIBEIRO
	-* DATA      : 26-02-2021
	-* VERSÃO    : 2.0
	-*
	-* ÚLTIMAS ALTERAÇÕES
	-*
	-*   DATA       AUTOR           DESCRIÇÃO
	-*   ========== =============== =================================================
	-*	 02-02-2022	João RIBEIRO	Acrescentado mais um parametro de entrada no processo e mais um parametro de criação do documento.
	-*								O parametro novo indica a lista de condições a ser usado no documento.
	-*	 27-09-2022	João RIBEIRO	Acrescentado parametros para a informação de multibanco.
	-*
	-*/
	PROCEDURE CREATE_R2_D20(  P_CDUNIECO 			in 		mpolizas.cdunieco%TYPE
							, P_CDRAMO 				in 		mpolizas.cdramo%TYPE
							, P_NMPROPUE			in		co_propol.nmpropue%TYPE
							, P_NMPOLIZA 			in 		mpolizas.nmpoliza%TYPE
							, P_TIPO_APOL			in		NUMBER
							, P_ATA					in		VARCHAR2
							, P_DT_INI_VIG			in		DATE
							, P_DT_FIM_VIG			in		DATE
							, P_P_ALTERADOS			in		VARCHAR2
							, P_PREMIO_SIMP			in		NUMBER
							, P_PREMIO_CIMP			in		NUMBER
							, P_CUSTO_ABERTURA_SIVA	in		NUMBER
							, P_CUSTO_ABERTURA_CIVA	in		NUMBER
							, P_TX_FAB				in		VARCHAR2
							, P_LS_FAB				in		NUMBER
							, P_LC_FAB				in		NUMBER
							, P_TX_CRE				in		VARCHAR2
							, P_LS_CRE				in		NUMBER
							, P_LC_CRE				in		NUMBER
							, P_VALOR_PRE_CAP		in		NUMBER
							, P_PRAZO_VAL_GAR		in		VARCHAR2
							, P_OUTROS				in		VARCHAR2
							, P_USUARIO				in		VARCHAR2
							, P_TCONCDIT			in		VARCHAR2
							, pout_sqlcode    			OUT NUMBER
							, pout_sqlerrm    			OUT VARCHAR2
							)
	;


	/*
	-* NOME      : CREATE_R2_D20_V2
	-* OBJECTIVO : Cria o pedido de criação da carta R2.D20.
	-* UTILIZACAO: PKG_DOCUMENTOS_GO.CREATE_R2_D20(CDUNIECO, CDRAMO, NMPROPUE, NMPOLIZA, TIPO_APOL, ATA, DT_INI_VIG, DT_FIM_VIG, P_ALTERADOS, PREMIO_SIMP, PREMIO_CIMP, CUSTO_ABERTURA_SIVA, CUSTO_ABERTURA_CIVA
												, TX_FAB, LS_FAB, LC_FAB, TX_CRE, LS_CRE, LC_CRE, VALOR_PRE_CAP, PRAZO_VAL_GAR, OUTROS, USUARIO);
	-* AUTOR     : JOÃO RIBEIRO
	-* DATA      : 26-02-2021
	-* VERSÃO    : 2.0
	-*
	-* ÚLTIMAS ALTERAÇÕES
	-*
	-*   DATA       AUTOR           DESCRIÇÃO
	-*   ========== =============== =================================================
	-*	 02-02-2022	João RIBEIRO	Acrescentado mais um parametro de entrada no processo e mais um parametro de criação do documento.
	-*								O parametro novo indica a lista de condições a ser usado no documento.
	-*	 27-09-2022	João RIBEIRO	Acrescentado parametros para a informação de multibanco.
	-*
	-*/
	PROCEDURE CREATE_R2_D20_V2(  P_CDUNIECO 			in 		mpolizas.cdunieco%TYPE
							, P_CDRAMO 				in 		mpolizas.cdramo%TYPE
							, P_NMPROPUE			in		co_propol.nmpropue%TYPE
							, P_NMPOLIZA 			in 		mpolizas.nmpoliza%TYPE
							, P_TIPO_APOL			in		NUMBER
							, P_ATA					in		VARCHAR2
							, P_DT_INI_VIG			in		DATE
							, P_DT_FIM_VIG			in		DATE
							, P_P_ALTERADOS			in		VARCHAR2
							, P_PREMIO_SIMP			in		NUMBER
							, P_PREMIO_CIMP			in		NUMBER
							, P_CUSTO_ABERTURA_SIVA	in		NUMBER
							, P_CUSTO_ABERTURA_CIVA	in		NUMBER
							, P_TX_FAB				in		VARCHAR2
							, P_LS_FAB				in		NUMBER
							, P_LC_FAB				in		NUMBER
							, P_TX_CRE				in		VARCHAR2
							, P_LS_CRE				in		NUMBER
							, P_LC_CRE				in		NUMBER
							, P_VALOR_PRE_CAP		in		NUMBER
							, P_PRAZO_VAL_GAR		in		VARCHAR2
							, P_OUTROS				in		VARCHAR2
							, P_USUARIO				in		VARCHAR2
							, P_TCONCDIT			in		VARCHAR2
							, P_CODIGOENT			in		NUMBER
							, P_REFMB				in		NUMBER
							, P_VALOR				in		NUMBER
							, P_DTLIMITE			in		DATE
							, pout_sqlcode    			OUT NUMBER
							, pout_sqlerrm    			OUT VARCHAR2
							)
	;


	/*
	-* NOME      : GET_PROCESSO_GO
	-* OBJECTIVO : RETORNA O ID DO PROCESSO GO DE UMA APÓLICE À DATA DA CRIAÇÃO DO DOCUMENTO
	-* UTILIZACAO: PKG_DOCUMENTOS_GO.GET_PROCESSO_GO(CDUNIECO, CDRAMO, NMPOLIZA, DOC_ID);
	-* AUTOR     : JOÃO RIBEIRO
	-* DATA      : 09-10-2019
	-* VERSÃO    : 1.0
	-*
	-* ÚLTIMAS ALTERAÇÕES
	-*
	-*   DATA       AUTOR           DESCRIÇÃO
	-*   ========== =============== =================================================
	-*
	-*/
	FUNCTION GET_PROCESSO_GO (PI_CDUNIECO IN NUMBER, PI_CDRAMO IN NUMBER, PI_NMPOLIZA IN NUMBER, PI_DOC_ID IN NUMBER ) RETURN VARCHAR2;

	/*
	-* NOME      : GET_PROCESSO_GO_RECIBO
	-* OBJECTIVO : RETORNA O ID DO PROCESSO GO DE UMA APÓLICE À DATA DA CRIAÇÃO DO DOCUMENTO
	-* UTILIZACAO: PKG_DOCUMENTOS_GO.GET_PROCESSO_GO_RECIBO(CDUNIECO, CDRAMO, NMRECIBO, DOC_ID);
	-* AUTOR     : JOÃO RIBEIRO
	-* DATA      : 09-10-2019
	-* VERSÃO    : 1.0
	-*
	-* ÚLTIMAS ALTERAÇÕES
	-*
	-*   DATA       AUTOR           DESCRIÇÃO
	-*   ========== =============== =================================================
	-*
	-*/
	FUNCTION GET_PROCESSO_GO_RECIBO (PI_CDUNIECO IN NUMBER, PI_NMRECIBO IN NUMBER, PI_DOC_ID IN NUMBER ) RETURN VARCHAR2;


	/*
	-* NOME      : CREATE_O2_OD73
	-* OBJECTIVO : Cria o pedido de envio do email da carta O2.OD73 para uma entidade.
	-* UTILIZACAO: PKG_DOCUMENTOS_GO.CREATE_O2_OD73(CDUNIECO, CDRAMO, CDPERSON, DATAEFEITO, USUARIO);
	-* AUTOR     : JOÃO RIBEIRO
	-* DATA      : 26-02-2021
	-* VERSÃO    : 1.0
	-*
	-* ÚLTIMAS ALTERAÇÕES
	-*
	-*   DATA       AUTOR           DESCRIÇÃO
	-*   ========== =============== =================================================
	-*
	-*/
	PROCEDURE CREATE_O2_OD73(  P_CDUNIECO 			in 		mpolizas.cdunieco%TYPE
							, P_CDRAMO 				in 		mpolizas.cdramo%TYPE
							, P_CDPERSON			in		mpersona.cdperson%TYPE
							, P_DATAEFEITO 			in 		mpolizas.feemisio%TYPE
							, P_USUARIO				in		VARCHAR2
							, pout_sqlcode    			OUT NUMBER
							, pout_sqlerrm    			OUT VARCHAR2
							)
	;

	/*
	-* NOME      : CREATE_O2_OD63
	-* OBJECTIVO : Cria o pedido de criação da carta O2.OD63 para uma entidade.
	-* UTILIZACAO: PKG_DOCUMENTOS_GO.CREATE_O2_OD63(CDUNIECO, CDRAMO, ESTADO, NMPROPUE, DATAACTUAL, TEXTOLIVRE, USUARIO);
	-* AUTOR     : JOÃO RIBEIRO
	-* DATA      : 22-10-2021
	-* VERSÃO    : 1.0
	-*
	-* ÚLTIMAS ALTERAÇÕES
	-*
	-*   DATA       AUTOR           DESCRIÇÃO
	-*   ========== =============== =================================================
	-*
	-*/
	PROCEDURE CREATE_O2_OD63(  P_CDUNIECO 			in 		co_propol.cdunieco%TYPE
							, P_CDRAMO 				in 		co_propol.cdramo%TYPE
							, P_ESTADO				in		co_propol.swestado%TYPE
							, P_NMPROPUE			in		co_propol.nmpropue%TYPE
							, P_DATAACTUAL 			in 		mpolizas.feemisio%TYPE
							, P_TEXTOLIVRE			in		VARCHAR2
							, P_USUARIO				in		VARCHAR2
							, pout_sqlcode    			OUT NUMBER
							, pout_sqlerrm    			OUT VARCHAR2
							)
	;

END Pkg_Documentos_Go;

-- ===== BODY (PACKAGE BODY) =====

PACKAGE BODY PKG_DOCUMENTOS_GO
AS

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
					,'ERRO_GO'
					,p_modelo_id
					,NULL
					,sysdate
					,NULL
					,l_msg
					,NULL
					);

				commit;
	end;

	/*
	-* NOME      : ADD_NUMERO_ATA_R2_D21
	-* OBJECTIVO : RETORNA O NUMERO DA ATA SEGUINTE DA APÓLICE INDICADA
	-* UTILIZACAO: PKG_DOCUMENTOS_GO.ADD_NUMERO_ATA_R2_D21(CDUNIECO, CDRAMO, NMPOLIZA);
	-* AUTOR     : JOÃO RIBEIRO
	-* DATA      : 06-11-2019
	-* VERSÃO    : 1.0
	-*
	-* ÚLTIMAS ALTERAÇÕES
	-*
	-*   DATA       AUTOR           DESCRIÇÃO
	-*   ========== =============== =================================================
	-*
	-*/
	FUNCTION ADD_NUMERO_ATA_R2_D21 (PI_CDUNIECO IN NUMBER, PI_CDRAMO IN NUMBER, PI_NMPOLIZA IN NUMBER, PI_ATA IN VARCHAR2 ) RETURN NUMBER
	IS
		vDATA_PED DATE;
		vNMPOLIZA MRECIBO.NMPOLIZA%type;
		vCDRAMO MRECIBO.CDRAMO%type;
		vOTVALOR tvalopol.otvalor%type;
		vNUM_ATA NUMBER;

	BEGIN	

		begin

			SELECT num_ata
			INTO vNUM_ATA
			FROM GD_NUM_ATAS_R2_D21
			WHERE 1 = 1
				AND cdunieco = PI_CDUNIECO
				AND cdramo = PI_CDRAMO
				AND nmpoliza = PI_NMPOLIZA;

		EXCEPTION
			WHEN OTHERS THEN
				vNUM_ATA := null;
		end;

		if vNUM_ATA is null then

			INSERT INTO GD_NUM_ATAS_R2_D21 (
				CDUNIECO
				,CDRAMO
				,NMPOLIZA
				,NUM_ATA
				)
			VALUES (
				PI_CDUNIECO
				,PI_CDRAMO
				,PI_NMPOLIZA
				,0
				)
			;

			if PI_ATA = 'E' then

				vNUM_ATA := 0;

			else

				vNUM_ATA := 1;

			end if;

		else

			UPDATE GD_NUM_ATAS_R2_D21
			SET NUM_ATA = (vNUM_ATA + 1)
			WHERE 1 = 1
				AND cdunieco = PI_CDUNIECO
				AND cdramo = PI_CDRAMO
				AND nmpoliza = PI_NMPOLIZA;

			vNUM_ATA := vNUM_ATA + 1;

		end if;

		commit;

		return vNUM_ATA;	

	END ADD_NUMERO_ATA_R2_D21;

	/*
	-* NOME      : GET_NUMERO_ATA_R2_D21
	-* OBJECTIVO : RETORNA O NUMERO DA ATA ATUAL DA APÓLICE INDICADA
	-* UTILIZACAO: PKG_DOCUMENTOS_GO.GET_NUMERO_ATA_R2_D21(CDUNIECO, CDRAMO, NMPOLIZA);
	-* AUTOR     : JOÃO RIBEIRO
	-* DATA      : 06-11-2019
	-* VERSÃO    : 1.0
	-*
	-* ÚLTIMAS ALTERAÇÕES
	-*
	-*   DATA       AUTOR           DESCRIÇÃO
	-*   ========== =============== =================================================
	-*
	-*/
	FUNCTION GET_NUMERO_ATA_R2_D21 (PI_CDUNIECO IN NUMBER, PI_CDRAMO IN NUMBER, PI_NMPOLIZA IN NUMBER ) RETURN NUMBER
	IS
		vDATA_PED DATE;
		vNMPOLIZA MRECIBO.NMPOLIZA%type;
		vCDRAMO MRECIBO.CDRAMO%type;
		vOTVALOR tvalopol.otvalor%type;
		vNUM_ATA NUMBER;

	BEGIN	

		begin

			SELECT num_ata
			INTO vNUM_ATA
			FROM GD_NUM_ATAS_R2_D21
			WHERE 1 = 1
				AND cdunieco = PI_CDUNIECO
				AND cdramo = PI_CDRAMO
				AND nmpoliza = PI_NMPOLIZA;

		EXCEPTION
			WHEN OTHERS THEN
			vNUM_ATA := null;
		end;

		if vNUM_ATA is null then

			vNUM_ATA := 0;

		end if;

		return vNUM_ATA;	

	END GET_NUMERO_ATA_R2_D21;

	/*
	-* NOME      : CREATE_R2_D21
	-* OBJECTIVO : Cria o pedido de criação da carta R2.D21.
	-* UTILIZACAO: PKG_DOCUMENTOS_GO.CREATE_R2_D21(CDUNIECO, CDRAMO, NMPOLIZA, DATA_EFEITO, N_ATA, ATA, TIPO_APOLICE, P_ALTERADOS, OUTROS, USUARIO);
	-* AUTOR     : JOÃO RIBEIRO
	-* DATA      : 26-02-2021
	-* VERSÃO    : 1.0
	-*
	-* ÚLTIMAS ALTERAÇÕES
	-*
	-*   DATA       AUTOR           DESCRIÇÃO
	-*   ========== =============== =================================================
	-*
	-*/
	PROCEDURE CREATE_R2_D21(	  P_CDUNIECO 		in 		mpolizas.cdunieco%TYPE
								, P_CDRAMO 			in 		mpolizas.cdramo%TYPE
								, P_NMPOLIZA 		in 		mpolizas.nmpoliza%TYPE
								, P_DATA_EFEITO 	in 		DATE
								, P_N_ATA 			in 		NUMBER default null
								, P_ATA 			in 		VARCHAR2
								, TIPO_APOLICE  	in 		VARCHAR2
								, P_P_ALTERADOS 	in 		VARCHAR2
								, P_OUTROS 			in 		VARCHAR2
								, P_USUARIO			in		VARCHAR2
								, pout_sqlcode    		OUT NUMBER
								, pout_sqlerrm    		OUT VARCHAR2
								) 
	IS
		DOCUMENTO NUMBER;
		nBotao NUMBER;
		ambiente varchar2(15);
		v_outros varchar2(32767);
		l_outros number;
		l_ponto number;
		m_outros NUMBER;
		i number :=1;
		j number :=1;
		posicao0 number := 0;
		posicao1 number := 1;
		posicao2 number := 1;
		sub_outros varchar2(32767);
		v_ponto varchar2(4000);
		v_condicao  varchar2(4000);
		ambiente_id SVR_AMBIENTES_IMPRESSAO.ID%TYPE;
		v_p_n_ata number;

	BEGIN

		IF P_N_ATA is null then
			v_p_n_ata := ADD_NUMERO_ATA_R2_D21(P_CDUNIECO, P_CDRAMO, P_NMPOLIZA, P_ATA);
		else
			v_p_n_ata := P_N_ATA;
		end if;

		IF v_p_n_ata = 0 and P_ATA = 'E' then v_p_n_ata := null;
		end if;

		record_error('ERRO_GO','CHAMADA AO PKG_DOCUMENTOS_GO.CREATE_R2_D21 '||P_CDUNIECO||' - '||P_CDRAMO||' - '||P_NMPOLIZA||' - '||P_DATA_EFEITO||' - '||v_p_n_ata||' - '||P_ATA,'R2.D21 - GO');

		IF TIPO_APOLICE = 'T' AND P_ATA = 'R'
			THEN
				pout_sqlcode := 1;
				pout_sqlerrm := 'ERRO: foi selecionada uma apólice temporária. Não é possível imprimir uma Ata de renovação!!';
				record_error('ERRO_GO','ERRO: foi selecionada uma apólice temporária. Não é possível imprimir uma Ata de renovação!! - 1','R2.D21 - GO');
				return;
		ELSE
			IF P_NMPOLIZA IS NOT NULL AND
				P_CDUNIECO IS NOT NULL AND
				P_CDRAMO IS NOT NULL AND
				P_DATA_EFEITO IS NOT NULL AND
				P_ATA IS NOT NULL
			THEN

				select R2D21_DOCSEQ.NEXTVAL into DOCUMENTO from dual;

				v_outros := P_OUTROS;
				l_outros := LENGTH(v_outros);

				if l_outros < 2 then
					m_outros := null;
				else
					m_outros := 0 ;
				end if;

				INSERT INTO GD_ATAS_R2_D21 (
					ID
					,CDUNIECO
					,CDRAMO
					,NMPOLIZA
					,DATA_EFEITO
					,N_ATA
					,P_ATA
					,P_ALTERADOS
					,P_OUTROS
					,SWAUTOMAN
					)
					VALUES
					(DOCUMENTO
					,P_CDUNIECO
					,P_CDRAMO
					,P_NMPOLIZA
					,P_DATA_EFEITO
					,v_p_n_ata
					,P_ATA
					,UPPER(REPLACE(P_P_ALTERADOS,' ',''))
					,l_outros --P_OUTROS
					,'A'
					);

				if P_ATA != 'C' and l_outros > 1 then	

					loop

						posicao1 := INSTR( v_outros, '§' , 1, (i*2)-1 );
						posicao2 := INSTR( v_outros, '§' , 1, (i*2) );

						if posicao1 != 0 and posicao2 != 0 then
							v_ponto := SUBSTR( v_outros, posicao0+1 , (posicao1-posicao0)-1  );
							v_condicao := SUBSTR( v_outros, posicao1+1 , (posicao2-posicao1)-1  );
						elsif posicao1 != 0 and (posicao2 = 0 or posicao2 = l_outros ) then
							v_ponto := SUBSTR( v_outros, posicao0+1 , (posicao1-posicao0)-1  );
							v_condicao := SUBSTR( v_outros, posicao1+1 , (l_outros-posicao1)-1  );
						else
							j := 2;
							EXIT WHEN posicao1 = 0;
						end if;

						l_ponto := LENGTH(v_ponto);

						if l_ponto > 30 then
							j := 3;
							EXIT WHEN j = 3;
						end if;

						insert into GD_ATAS_R2_D21_OUTROS (
							id
							,linha
							,ponto
							,condicao
							)
							values
							(DOCUMENTO
							,i
							,v_ponto
							,v_condicao
							);

						i := i + 1;
						posicao0 := posicao2;
					end loop;		

				end if;

				if j = 3 then

					rollback;
					pout_sqlcode := 2;
					pout_sqlerrm := 'ERRO: Não foi inserido as condições correctamente.';

					record_error('ERRO_GO','ERRO: Não foi inserido as condições correctamente. - 2','R2.D21 - GO');

					return;
				else			
					commit;

					select id
					into ambiente_id
					from SVR_AMBIENTES_IMPRESSAO;

					PKG_DOCUMENTOS_SVR.SET_PARAMETRO_NUMERO('P_CDUNIECO',P_CDUNIECO);
					PKG_DOCUMENTOS_SVR.SET_PARAMETRO_NUMERO('P_CDRAMO',P_CDRAMO);
					PKG_DOCUMENTOS_SVR.SET_PARAMETRO_NUMERO('P_NMPOLIZA',P_NMPOLIZA);
					PKG_DOCUMENTOS_SVR.SET_PARAMETRO_STRING('P_ATA',P_ATA);
					PKG_DOCUMENTOS_SVR.SET_PARAMETRO_NUMERO('P_N_ATA',v_p_n_ata);
					PKG_DOCUMENTOS_SVR.SET_PARAMETRO_NUMERO('P_ID_ATA',DOCUMENTO);
					PKG_DOCUMENTOS_SVR.SET_PARAMETRO_STRING('P_USUARIO',P_USUARIO);
					PKG_DOCUMENTOS_SVR.SET_PARAMETRO_DATA('P_DATAACTUAL', SYSDATE);
					PKG_DOCUMENTOS_SVR.SET_PARAMETRO_STRING('_USER',ambiente_id);
					PKG_DOCUMENTOS_SVR.EXECUTA('R2.D21');

					IF P_ATA != 'E' THEN
						PKG_DOCUMENTOS_SVR.SET_PARAMETRO_NUMERO('P_CDUNIECO',P_CDUNIECO);
						PKG_DOCUMENTOS_SVR.SET_PARAMETRO_NUMERO('P_CDRAMO',P_CDRAMO);
						PKG_DOCUMENTOS_SVR.SET_PARAMETRO_NUMERO('P_NMPOLIZA',P_NMPOLIZA);
						PKG_DOCUMENTOS_SVR.SET_PARAMETRO_STRING('P_ATA',P_ATA);
						PKG_DOCUMENTOS_SVR.SET_PARAMETRO_NUMERO('P_N_ATA',v_p_n_ata );
						PKG_DOCUMENTOS_SVR.SET_PARAMETRO_NUMERO('P_ID_ATA',DOCUMENTO);
						PKG_DOCUMENTOS_SVR.SET_PARAMETRO_STRING('P_USUARIO',P_USUARIO);
						PKG_DOCUMENTOS_SVR.SET_PARAMETRO_DATA('P_DATAACTUAL', SYSDATE);
						PKG_DOCUMENTOS_SVR.SET_PARAMETRO_STRING('_USER',ambiente_id);
						PKG_DOCUMENTOS_SVR.EXECUTA('D1.A2');
					END IF;

				end if;

				pout_sqlcode := 0;
				pout_sqlerrm := 'Documento R2.D21 enviado para impressão.';
				record_error('ERRO_GO','Documento R2.D21 enviado para impressão. - 0','R2.D21 - GO');

				return;

			else

				pout_sqlcode := 3;
				pout_sqlerrm := 'ERRO: Não foram preenchidos todos os campos';
				record_error('ERRO_GO','ERRO: Não foram preenchidos todos os campos - 3','R2.D21 - GO');

				return;
			end if;

		END IF;
	EXCEPTION
		WHEN OTHERS THEN
			pout_sqlcode := SQLCODE;
			pout_sqlerrm := SUBSTR(SQLERRM,1,299);
			record_error('ERRO_GO','ERRO: ' || SQLCODE || ' - ' || SQLERRM,'R2.D21 - GO');
	END CREATE_R2_D21;

	/*
	-* NOME      : CREATE_R2_D20
	-* OBJECTIVO : Cria o pedido de criação da carta R2.D20.
	-* UTILIZACAO: PKG_DOCUMENTOS_GO.CREATE_R2_D20(CDUNIECO, CDRAMO, NMPROPUE, NMPOLIZA, TIPO_APOL, ATA, DT_INI_VIG, DT_FIM_VIG, P_ALTERADOS, PREMIO_SIMP, PREMIO_CIMP, CUSTO_ABERTURA_SIVA, CUSTO_ABERTURA_CIVA
												, TX_FAB, LS_FAB, LC_FAB, TX_CRE, LS_CRE, LC_CRE, VALOR_PRE_CAP, PRAZO_VAL_GAR, OUTROS, USUARIO);
	-* AUTOR     : JOÃO RIBEIRO
	-* DATA      : 26-02-2021
	-* VERSÃO    : 2.0
	-*
	-* ÚLTIMAS ALTERAÇÕES
	-*
	-*   DATA       AUTOR           DESCRIÇÃO
	-*   ========== =============== =================================================
	-*	 02-02-2022	João RIBEIRO	Acrescentado mais um parametro de entrada no processo e mais um parametro de criação do documento.
	-*								O parametro novo indica a lista de condições a ser usado no documento.
	-*	 27-09-2022	João RIBEIRO	Acrescentado parametros para a informação de multibanco.
	-*/
	PROCEDURE CREATE_R2_D20(  P_CDUNIECO 			in 		mpolizas.cdunieco%TYPE
							, P_CDRAMO 				in 		mpolizas.cdramo%TYPE
							, P_NMPROPUE			in		co_propol.nmpropue%TYPE
							, P_NMPOLIZA 			in 		mpolizas.nmpoliza%TYPE
							, P_TIPO_APOL			in		NUMBER
							, P_ATA					in		VARCHAR2
							, P_DT_INI_VIG			in		DATE
							, P_DT_FIM_VIG			in		DATE
							, P_P_ALTERADOS			in		VARCHAR2
							, P_PREMIO_SIMP			in		NUMBER
							, P_PREMIO_CIMP			in		NUMBER
							, P_CUSTO_ABERTURA_SIVA	in		NUMBER
							, P_CUSTO_ABERTURA_CIVA	in		NUMBER
							, P_TX_FAB				in		VARCHAR2
							, P_LS_FAB				in		NUMBER
							, P_LC_FAB				in		NUMBER
							, P_TX_CRE				in		VARCHAR2
							, P_LS_CRE				in		NUMBER
							, P_LC_CRE				in		NUMBER
							, P_VALOR_PRE_CAP		in		NUMBER
							, P_PRAZO_VAL_GAR		in		VARCHAR2
							, P_OUTROS				in		VARCHAR2
							, P_USUARIO				in		VARCHAR2
							, P_TCONCDIT			in		VARCHAR2
							, pout_sqlcode    			OUT NUMBER
							, pout_sqlerrm    			OUT VARCHAR2
							)
	IS
		DOCUMENTO NUMBER;
		nBotao NUMBER;
		ambiente varchar2(15);
		tipodoc number;
		v_outros varchar2(32767);
		l_outros number;
		l_ponto number;
		m_outros NUMBER;
		i number :=1;
		j number :=1;
		posicao0 number := 0;
		posicao1 number := 1;
		posicao2 number := 1;
		sub_outros varchar2(32767);
		v_ponto varchar2(4000);
		v_condicao  varchar2(4000);
		ambiente_id SVR_AMBIENTES_IMPRESSAO.ID%TYPE;

	BEGIN

		record_error('ERRO_GO','CHAMADA AO PKG_DOCUMENTOS_GO.CREATE_R2_D20 '||P_CDUNIECO||' - '||P_CDRAMO||' - '||P_NMPROPUE||' - '||P_NMPOLIZA||' - '||P_TIPO_APOL||' - '||P_ATA,'R2.D20 - GO');

		IF (P_NMPOLIZA IS NOT NULL AND P_NMPROPUE IS NOT NULL) or
			(P_NMPOLIZA IS NULL AND P_NMPROPUE IS NULL) THEN

			pout_sqlcode := 1;
			pout_sqlerrm := 'ERRO: Os campos proposta e apólice estão ambos preenchidos ou um deles está em falta.';
			record_error('ERRO_GO','ERRO: Os campos proposta e apólice estão ambos preenchidos ou um deles está em falta. - 1','R2.D20 - GO');

			return;

		/* PROPOSTA */
		ELSIF P_NMPROPUE IS NOT NULL
			AND P_CDUNIECO IS NOT NULL
			AND P_CDRAMO IS NOT NULL
			AND P_NMPOLIZA IS NULL
			THEN
				IF (P_PREMIO_SIMP IS NULL
					OR P_PREMIO_CIMP IS NULL
					OR P_CUSTO_ABERTURA_SIVA IS NULL
					OR P_CUSTO_ABERTURA_CIVA IS NULL) THEN

					pout_sqlcode := 2;
					pout_sqlerrm := 'ERRO: Os campos de prémio e custo de abertura não estão todos preenchidos';
					record_error('ERRO_GO','ERRO: Os campos de prémio e custo de abertura não estão todos preenchidos - 2','R2.D20 - GO');

					return;

				else

					if (P_TX_FAB IS NULL AND P_LS_FAB IS NULL AND P_LC_FAB IS NOT NULL)
						OR (P_TX_FAB IS NULL AND P_LS_FAB IS NOT NULL AND P_LC_FAB IS NULL)
						OR (P_TX_FAB IS NOT NULL AND P_LS_FAB IS NULL AND P_LC_FAB IS NULL)
						OR (P_TX_FAB IS NOT NULL AND P_LS_FAB IS NOT NULL AND P_LC_FAB IS NULL)
						OR (P_TX_FAB IS NOT NULL AND P_LS_FAB IS NULL AND P_LC_FAB IS NOT NULL)
						OR (P_TX_FAB IS NULL AND P_LS_FAB IS NOT NULL AND P_LC_FAB IS NOT NULL)
						then

							pout_sqlcode := 3;
							pout_sqlerrm := 'ERRO: Os campos da Fase de Fabrico não estão todos preenchidos.';
							record_error('ERRO_GO','ERRO: Os campos da Fase de Fabrico não estão todos preenchidos. - 3','R2.D20 - GO');

							return;

					else
						if P_LC_FAB > P_LS_FAB THEN

							pout_sqlcode := 4;
							pout_sqlerrm := 'ERRO: O limite Concedido de Fabrico não pode ser superior ao limite Solicitado de fabrico.';
							record_error('ERRO_GO','ERRO: O limite Concedido de Fabrico não pode ser superior ao limite Solicitado de fabrico. - 4','R2.D20 - GO');

							return;

						end if;
					end if;

					if P_TX_CRE IS NULL OR P_LS_CRE IS NULL OR P_LC_CRE IS NULL
						then

							pout_sqlcode := 5;
							pout_sqlerrm := 'ERRO: Os campos da Fase de Crédito não estão todos preenchidos.';
							record_error('ERRO_GO','ERRO: Os campos da Fase de Crédito não estão todos preenchidos. - 5','R2.D20 - GO');

							return;
					else
						if P_LC_CRE > P_LS_CRE THEN

							pout_sqlcode := 6;
							pout_sqlerrm := 'ERRO: O limite Concedido de Crédito não pode ser superior ao limite Solicitado de Crédito.';
							record_error('ERRO_GO','ERRO: O limite Concedido de Crédito não pode ser superior ao limite Solicitado de Crédito. - 6','R2.D20 - GO');

							return;

						end if;
					end if;

					if P_TIPO_APOL = 1 and P_PRAZO_VAL_GAR is null then

						pout_sqlcode := 7;
						pout_sqlerrm := 'ERRO: A PROPOSTA é do tipo de operação Individual. Falta preencher o Prazo de validade da Garantia';
						record_error('ERRO_GO','ERRO: A PROPOSTA é do tipo de operação Individual. Falta preencher o Prazo de validade da Garantia - 7','R2.D20 - GO');

						return;

					elsif P_TCONCDIT is null then

						pout_sqlcode := 15;
						pout_sqlerrm := 'ERRO: Falta preencher o parametro da lista de condições.';
						record_error('ERRO_GO','ERRO: Falta preencher o parametro da lista de condições. - 15','R2.D20 - GO');

						return;

					else
						select R2D20_DOCSEQ.NEXTVAL into DOCUMENTO from dual;

						v_outros := P_OUTROS;
						l_outros := LENGTH(v_outros);

						if l_outros < 2 then
							m_outros := null;
						else
							m_outros := 0 ;
						end if;

						INSERT INTO GD_CARTAS_R2_D20 (
							id
							,CDUNIECO
							,CDRAMO
							,NMPROPUE
							,NMPOLIZA
							,DT_ini_vig
							,dt_fim_vig
							,tipo_apol
							,P_ALTERADOS
							,P_OUTROS
							,TX_FAB
							,LS_FAB
							,LC_FAB
							,TX_CRE
							,LS_CRE
							,LC_CRE
							,PREMIO_SIMP
							,PREMIO_CIMP
							,CUSTO_ABERTURA_SIVA
							,CUSTO_ABERTURA_CIVA
							,VALOR_PREM_CAP
							,PRAZO_VAL_GAR
							,SWAUTOMAN
							,TCONCDIT
							)
							VALUES
							(DOCUMENTO
							,P_CDUNIECO
							,P_CDRAMO
							,P_NMPROPUE
							,NULL
							,NULL
							,NULL
							,P_TIPO_APOL
							,REPLACE(UPPER(P_P_ALTERADOS),' ','')
							,l_outros --P_OUTROS
							,P_TX_FAB
							,P_LS_FAB
							,P_LC_FAB
							,P_TX_CRE
							,P_LS_CRE
							,P_LC_CRE
							,P_PREMIO_SIMP
							,P_PREMIO_CIMP
							,P_CUSTO_ABERTURA_SIVA
							,P_CUSTO_ABERTURA_CIVA
							,P_VALOR_PRE_CAP
							,P_PRAZO_VAL_GAR
							,'A'
							,P_TCONCDIT
							);


						if l_outros > 1 then	

							loop

								posicao1 := INSTR( v_outros, '§' , 1, (i*2)-1 );
								posicao2 := INSTR( v_outros, '§' , 1, (i*2) );

								if posicao1 != 0 and posicao2 != 0 then
									v_ponto := SUBSTR( v_outros, posicao0+1 , (posicao1-posicao0)-1  );
									v_condicao := SUBSTR( v_outros, posicao1+1 , (posicao2-posicao1)-1  );
								elsif posicao1 != 0 and (posicao2 = 0 or posicao2 = l_outros ) then
									v_ponto := SUBSTR( v_outros, posicao0+1 , (posicao1-posicao0)-1  );
									v_condicao := SUBSTR( v_outros, posicao1+1 , (l_outros-posicao1)-1  );
								else
									j := 2;
									EXIT WHEN posicao1 = 0;
								end if;

								l_ponto := LENGTH(v_ponto);

								if l_ponto > 30 then
									j := 3;
									EXIT WHEN j = 3;
								end if;

								insert into GD_CARTAS_R2_D20_OUTROS (
									id
									,linha
									,ponto
									,condicao
									)
									values
									(DOCUMENTO
									,i
									,TRIM(v_ponto)
									,TRIM(v_condicao)
									);


								i := i + 1;
								posicao0 := posicao2;
							end loop;	

						end if;

						if j = 3 then

							rollback;
							pout_sqlcode := 8;
							pout_sqlerrm := 'ERRO: Não foi inserido as condições correctamente.';
							record_error('ERRO_GO','ERRO: Não foi inserido as condições correctamente. - 8','R2.D20 - GO');

							return;

						else			
							commit;

							select id
							into ambiente_id
							from SVR_AMBIENTES_IMPRESSAO;

							PKG_DOCUMENTOS_SVR.SET_PARAMETRO_NUMERO('P_CDUNIECO',P_CDUNIECO);
							PKG_DOCUMENTOS_SVR.SET_PARAMETRO_NUMERO('P_CDRAMO',P_CDRAMO);
							PKG_DOCUMENTOS_SVR.SET_PARAMETRO_NUMERO('P_NMPOLIZA',P_NMPOLIZA);
							PKG_DOCUMENTOS_SVR.SET_PARAMETRO_NUMERO('P_NMPROPUE',P_NMPROPUE);
							PKG_DOCUMENTOS_SVR.SET_PARAMETRO_NUMERO('P_ID_CARTA',DOCUMENTO);
							PKG_DOCUMENTOS_SVR.SET_PARAMETRO_STRING('P_USUARIO',P_USUARIO);
							PKG_DOCUMENTOS_SVR.SET_PARAMETRO_DATA('P_DATAACTUAL', SYSDATE);
							PKG_DOCUMENTOS_SVR.SET_PARAMETRO_STRING('_USER',ambiente_id);
							PKG_DOCUMENTOS_SVR.EXECUTA('R2.D20');

							pout_sqlcode := 0;
							pout_sqlerrm := 'Documento R2.D20 - PROPOSTA enviado para impressão.';
							record_error('ERRO_GO','Documento R2.D20 - PROPOSTA enviado para impressão. - 0P','R2.D20 - GO');

							return;
						end if;
					end if;
				end if;	

		/* APOLICE */
		ELSIF P_NMPROPUE IS NULL
			AND P_CDUNIECO IS NOT NULL
			AND P_CDRAMO IS NOT NULL
			AND P_NMPOLIZA IS NOT NULL
			THEN
				IF (P_PREMIO_SIMP IS NULL
				OR P_PREMIO_CIMP IS NULL
				OR P_CUSTO_ABERTURA_SIVA IS NULL
				OR P_CUSTO_ABERTURA_CIVA IS NULL) THEN

					pout_sqlcode := 8;
					pout_sqlerrm := 'ERRO: Os campos de prémio e custo de abertura não estão todos preenchidos. Verifique os valores de novo.';
					record_error('ERRO_GO','ERRO: Os campos de prémio e custo de abertura não estão todos preenchidos. Verifique os valores de novo. - 8','R2.D20 - GO');

					return;

				else

					if P_ATA is null or P_DT_INI_VIG is null or P_DT_FIM_VIG is null then

						pout_sqlcode := 9;
						pout_sqlerrm := 'ERRO: Falta o tipo de carta ou o periodo de vigência para a emissão da carta de apólice.';
						record_error('ERRO_GO','ERRO: Falta o tipo de carta ou o periodo de vigência para a emissão da carta de apólice. - 9','R2.D20 - GO');

						return;

					elsIF P_TIPO_APOL = 3 and UPPER(P_ATA) = 'R' then

						pout_sqlcode := 10;
						pout_sqlerrm := 'ERRO: A Apólice selecionada é uma apólice temporária. Não é possível tirar uma carta de Renovação.';
						record_error('ERRO_GO','ERRO: A Apólice selecionada é uma apólice temporária. Não é possível tirar uma carta de Renovação. - 10','R2.D20 - GO');

						return;

					else

						IF (P_TX_FAB IS NULL AND P_LC_FAB IS NOT NULL)
							OR (P_TX_FAB IS NOT NULL AND P_LC_FAB IS NULL)
							then

								pout_sqlcode := 11;
								pout_sqlerrm := 'ERRO: Os campos da Fase de Fabrico não estão todos preenchidos.';
								record_error('ERRO_GO','ERRO: Os campos da Fase de Fabrico não estão todos preenchidos. - 11','R2.D20 - GO');

								return;

						end if;

						IF (P_TX_CRE IS NULL OR P_LC_CRE IS NULL)
							then

								pout_sqlcode := 12;
								pout_sqlerrm := 'ERRO: Os campos da Fase de Crédito não estão todos preenchidos.';
								record_error('ERRO_GO','ERRO: Os campos da Fase de Crédito não estão todos preenchidos. - 12','R2.D20 - GO');

								return;

						end if;

						IF P_TIPO_APOL = 4 and UPPER(P_ATA) = 'R' then
							tipodoc := 5;
						else tipodoc := P_TIPO_APOL;
						end if;

						IF P_TCONCDIT is null and tipodoc = 5 then

							pout_sqlcode := 16;
							pout_sqlerrm := 'ERRO: Falta preencher o parametro da lista de condições.';
							record_error('ERRO_GO','ERRO: Falta preencher o parametro da lista de condições. - 16','R2.D20 - GO');

						return;

						end if;						

						select R2D20_DOCSEQ.NEXTVAL into DOCUMENTO from dual;
						--DOCUMENTO := R2D21_DOCSEQ.NEXTVAL;

						v_outros := P_OUTROS;
						l_outros := LENGTH(v_outros);

						if l_outros < 2 then
							m_outros := null;
						else
							m_outros := 0 ;
						end if;

						INSERT INTO GD_CARTAS_R2_D20 (
							id
							,CDUNIECO
							,CDRAMO
							,NMPROPUE
							,NMPOLIZA
							,DT_ini_vig
							,dt_fim_vig
							,tipo_apol
							,P_ALTERADOS
							,P_OUTROS
							,TX_FAB
							,LS_FAB
							,LC_FAB
							,TX_CRE
							,LS_CRE
							,LC_CRE
							,PREMIO_SIMP
							,PREMIO_CIMP
							,CUSTO_ABERTURA_SIVA
							,CUSTO_ABERTURA_CIVA
							,VALOR_PREM_CAP
							,PRAZO_VAL_GAR
							,SWAUTOMAN
							,TCONCDIT
							)
							VALUES
							(DOCUMENTO
							,P_CDUNIECO
							,P_CDRAMO
							,null
							,P_NMPOLIZA
							,P_DT_INI_VIG
							,P_DT_FIM_VIG
							,tipodoc
							,REPLACE(UPPER(P_P_ALTERADOS),' ','')
							,l_outros --P_OUTROS
							,P_TX_FAB
							,P_LS_FAB
							,P_LC_FAB
							,P_TX_CRE
							,P_LS_CRE
							,P_LC_CRE
							,P_PREMIO_SIMP
							,P_PREMIO_CIMP
							,P_CUSTO_ABERTURA_SIVA
							,P_CUSTO_ABERTURA_CIVA
							,P_VALOR_PRE_CAP
							,P_PRAZO_VAL_GAR
							,'A'
							,P_TCONCDIT
							);

						if l_outros > 1 then	

							loop

								posicao1 := INSTR( v_outros, '§' , 1, (i*2)-1 );
								posicao2 := INSTR( v_outros, '§' , 1, (i*2) );

								if posicao1 != 0 and posicao2 != 0 then
									v_ponto := SUBSTR( v_outros, posicao0+1 , (posicao1-posicao0)-1  );
									v_condicao := SUBSTR( v_outros, posicao1+1 , (posicao2-posicao1)-1  );
								elsif posicao1 != 0 and (posicao2 = 0 or posicao2 = l_outros ) then
									v_ponto := SUBSTR( v_outros, posicao0+1 , (posicao1-posicao0)-1  );
									v_condicao := SUBSTR( v_outros, posicao1+1 , (l_outros-posicao1)-1  );
								else
									j := 2;
									EXIT WHEN posicao1 = 0;
								end if;

								l_ponto := LENGTH(v_ponto);

								if l_ponto > 30 then
									j := 3;
									EXIT WHEN j = 3;
								end if;

								insert into GD_CARTAS_R2_D20_OUTROS (
									id
									,linha
									,ponto
									,condicao
									)
									values
									(DOCUMENTO
									,i
									,TRIM(v_ponto)
									,TRIM(v_condicao)
									);


								i := i + 1;
								posicao0 := posicao2;
							end loop;	

						end if;

						if j = 3 then

							rollback;
							pout_sqlcode := 13;
							pout_sqlerrm := 'ERRO: Não foi inserido as condições correctamente.';
							record_error('ERRO_GO','ERRO: Não foi inserido as condições correctamente. - 13','R2.D20 - GO');

							return;

						else			
							commit;

							select id
							into ambiente_id
							from SVR_AMBIENTES_IMPRESSAO;

							PKG_DOCUMENTOS_SVR.SET_PARAMETRO_NUMERO('P_CDUNIECO',P_CDUNIECO);
							PKG_DOCUMENTOS_SVR.SET_PARAMETRO_NUMERO('P_CDRAMO',P_CDRAMO);
							PKG_DOCUMENTOS_SVR.SET_PARAMETRO_NUMERO('P_NMPOLIZA',P_NMPOLIZA);
							PKG_DOCUMENTOS_SVR.SET_PARAMETRO_NUMERO('P_NMPROPUE',P_NMPROPUE);
							PKG_DOCUMENTOS_SVR.SET_PARAMETRO_NUMERO('P_ID_CARTA',DOCUMENTO);
							PKG_DOCUMENTOS_SVR.SET_PARAMETRO_STRING('P_USUARIO',P_USUARIO);
							PKG_DOCUMENTOS_SVR.SET_PARAMETRO_DATA('P_DATAACTUAL', SYSDATE);
							PKG_DOCUMENTOS_SVR.SET_PARAMETRO_STRING('_USER',ambiente_id);
							PKG_DOCUMENTOS_SVR.EXECUTA('R2.D20');

						end if;

						pout_sqlcode := 0;
						pout_sqlerrm := 'Documento R2.D20 - APÓLICE enviado para impressão.';
						record_error('ERRO_GO','Documento R2.D20 - APÓLICE enviado para impressão. - 0A','R2.D20 - GO');

						return;
					end if;
				end if;


		else

			pout_sqlcode := 14;
			pout_sqlerrm := 'ERRO: Não foram preenchidos todos os campos';
			record_error('ERRO_GO','ERRO: Não foram preenchidos todos os campos - 14','R2.D20 - GO');

			return;

		end if;

	EXCEPTION
		WHEN OTHERS THEN
			pout_sqlcode := SQLCODE;
			pout_sqlerrm := SUBSTR(SQLERRM,1,299);
			record_error('ERRO_GO','ERRO: ' || SQLCODE || ' - ' || SQLERRM,'R2.D20 - GO');
	END CREATE_R2_D20;

	/*
	-* NOME      : CREATE_R2_D20_V2
	-* OBJECTIVO : Cria o pedido de criação da carta R2.D20.
	-* UTILIZACAO: PKG_DOCUMENTOS_GO.CREATE_R2_D20(CDUNIECO, CDRAMO, NMPROPUE, NMPOLIZA, TIPO_APOL, ATA, DT_INI_VIG, DT_FIM_VIG, P_ALTERADOS, PREMIO_SIMP, PREMIO_CIMP, CUSTO_ABERTURA_SIVA, CUSTO_ABERTURA_CIVA
												, TX_FAB, LS_FAB, LC_FAB, TX_CRE, LS_CRE, LC_CRE, VALOR_PRE_CAP, PRAZO_VAL_GAR, OUTROS, USUARIO);
	-* AUTOR     : JOÃO RIBEIRO
	-* DATA      : 26-02-2021
	-* VERSÃO    : 2.0
	-*
	-* ÚLTIMAS ALTERAÇÕES
	-*
	-*   DATA       AUTOR           DESCRIÇÃO
	-*   ========== =============== =================================================
	-*	 02-02-2022	João RIBEIRO	Acrescentado mais um parametro de entrada no processo e mais um parametro de criação do documento.
	-*								O parametro novo indica a lista de condições a ser usado no documento.
	-*	 27-09-2022	João RIBEIRO	Acrescentado parametros para a informação de multibanco.
	-*/
	PROCEDURE CREATE_R2_D20_V2(  P_CDUNIECO 			in 		mpolizas.cdunieco%TYPE
							, P_CDRAMO 				in 		mpolizas.cdramo%TYPE
							, P_NMPROPUE			in		co_propol.nmpropue%TYPE
							, P_NMPOLIZA 			in 		mpolizas.nmpoliza%TYPE
							, P_TIPO_APOL			in		NUMBER
							, P_ATA					in		VARCHAR2
							, P_DT_INI_VIG			in		DATE
							, P_DT_FIM_VIG			in		DATE
							, P_P_ALTERADOS			in		VARCHAR2
							, P_PREMIO_SIMP			in		NUMBER
							, P_PREMIO_CIMP			in		NUMBER
							, P_CUSTO_ABERTURA_SIVA	in		NUMBER
							, P_CUSTO_ABERTURA_CIVA	in		NUMBER
							, P_TX_FAB				in		VARCHAR2
							, P_LS_FAB				in		NUMBER
							, P_LC_FAB				in		NUMBER
							, P_TX_CRE				in		VARCHAR2
							, P_LS_CRE				in		NUMBER
							, P_LC_CRE				in		NUMBER
							, P_VALOR_PRE_CAP		in		NUMBER
							, P_PRAZO_VAL_GAR		in		VARCHAR2
							, P_OUTROS				in		VARCHAR2
							, P_USUARIO				in		VARCHAR2
							, P_TCONCDIT			in		VARCHAR2
							, P_CODIGOENT			in		NUMBER
							, P_REFMB				in		NUMBER
							, P_VALOR				in		NUMBER
							, P_DTLIMITE			in		DATE
							, pout_sqlcode    			OUT NUMBER
							, pout_sqlerrm    			OUT VARCHAR2
							)
	IS
		DOCUMENTO NUMBER;
		nBotao NUMBER;
		ambiente varchar2(15);
		tipodoc number;
		v_outros varchar2(32767);
		l_outros number;
		l_ponto number;
		m_outros NUMBER;
		i number :=1;
		j number :=1;
		posicao0 number := 0;
		posicao1 number := 1;
		posicao2 number := 1;
		sub_outros varchar2(32767);
		v_ponto varchar2(4000);
		v_condicao  varchar2(4000);
		ambiente_id SVR_AMBIENTES_IMPRESSAO.ID%TYPE;

	BEGIN

		record_error('ERRO_GO','CHAMADA AO PKG_DOCUMENTOS_GO.CREATE_R2_D20 '||P_CDUNIECO||' - '||P_CDRAMO||' - '||P_NMPROPUE||' - '||P_NMPOLIZA||' - '||P_TIPO_APOL||' - '||P_ATA,'R2.D20 - GO');

		IF (P_NMPOLIZA IS NOT NULL AND P_NMPROPUE IS NOT NULL) or
			(P_NMPOLIZA IS NULL AND P_NMPROPUE IS NULL) THEN

			pout_sqlcode := 1;
			pout_sqlerrm := 'ERRO: Os campos proposta e apólice estão ambos preenchidos ou um deles está em falta.';
			record_error('ERRO_GO','ERRO: Os campos proposta e apólice estão ambos preenchidos ou um deles está em falta. - 1','R2.D20 - GO');

			return;

		/* PROPOSTA */
		ELSIF P_NMPROPUE IS NOT NULL
			AND P_CDUNIECO IS NOT NULL
			AND P_CDRAMO IS NOT NULL
			AND P_NMPOLIZA IS NULL
			THEN
				IF (P_PREMIO_SIMP IS NULL
					OR P_PREMIO_CIMP IS NULL
					OR P_CUSTO_ABERTURA_SIVA IS NULL
					OR P_CUSTO_ABERTURA_CIVA IS NULL) THEN

					pout_sqlcode := 2;
					pout_sqlerrm := 'ERRO: Os campos de prémio e custo de abertura não estão todos preenchidos';
					record_error('ERRO_GO','ERRO: Os campos de prémio e custo de abertura não estão todos preenchidos - 2','R2.D20 - GO');

					return;

				else

					if (P_TX_FAB IS NULL AND P_LS_FAB IS NULL AND P_LC_FAB IS NOT NULL)
						OR (P_TX_FAB IS NULL AND P_LS_FAB IS NOT NULL AND P_LC_FAB IS NULL)
						OR (P_TX_FAB IS NOT NULL AND P_LS_FAB IS NULL AND P_LC_FAB IS NULL)
						OR (P_TX_FAB IS NOT NULL AND P_LS_FAB IS NOT NULL AND P_LC_FAB IS NULL)
						OR (P_TX_FAB IS NOT NULL AND P_LS_FAB IS NULL AND P_LC_FAB IS NOT NULL)
						OR (P_TX_FAB IS NULL AND P_LS_FAB IS NOT NULL AND P_LC_FAB IS NOT NULL)
						then

							pout_sqlcode := 3;
							pout_sqlerrm := 'ERRO: Os campos da Fase de Fabrico não estão todos preenchidos.';
							record_error('ERRO_GO','ERRO: Os campos da Fase de Fabrico não estão todos preenchidos. - 3','R2.D20 - GO');

							return;

					else
						if P_LC_FAB > P_LS_FAB THEN

							pout_sqlcode := 4;
							pout_sqlerrm := 'ERRO: O limite Concedido de Fabrico não pode ser superior ao limite Solicitado de fabrico.';
							record_error('ERRO_GO','ERRO: O limite Concedido de Fabrico não pode ser superior ao limite Solicitado de fabrico. - 4','R2.D20 - GO');

							return;

						end if;
					end if;

					if P_TX_CRE IS NULL OR P_LS_CRE IS NULL OR P_LC_CRE IS NULL
						then

							pout_sqlcode := 5;
							pout_sqlerrm := 'ERRO: Os campos da Fase de Crédito não estão todos preenchidos.';
							record_error('ERRO_GO','ERRO: Os campos da Fase de Crédito não estão todos preenchidos. - 5','R2.D20 - GO');

							return;
					else
						if P_LC_CRE > P_LS_CRE THEN

							pout_sqlcode := 6;
							pout_sqlerrm := 'ERRO: O limite Concedido de Crédito não pode ser superior ao limite Solicitado de Crédito.';
							record_error('ERRO_GO','ERRO: O limite Concedido de Crédito não pode ser superior ao limite Solicitado de Crédito. - 6','R2.D20 - GO');

							return;

						end if;
					end if;

					if P_TIPO_APOL = 1 and P_PRAZO_VAL_GAR is null then

						pout_sqlcode := 7;
						pout_sqlerrm := 'ERRO: A PROPOSTA é do tipo de operação Individual. Falta preencher o Prazo de validade da Garantia';
						record_error('ERRO_GO','ERRO: A PROPOSTA é do tipo de operação Individual. Falta preencher o Prazo de validade da Garantia - 7','R2.D20 - GO');

						return;

					elsif P_TCONCDIT is null then

						pout_sqlcode := 15;
						pout_sqlerrm := 'ERRO: Falta preencher o parametro da lista de condições.';
						record_error('ERRO_GO','ERRO: Falta preencher o parametro da lista de condições. - 15','R2.D20 - GO');

						return;

					else
						select R2D20_DOCSEQ.NEXTVAL into DOCUMENTO from dual;

						v_outros := P_OUTROS;
						l_outros := LENGTH(v_outros);

						if l_outros < 2 then
							m_outros := null;
						else
							m_outros := 0 ;
						end if;

						INSERT INTO GD_CARTAS_R2_D20 (
							id
							,CDUNIECO
							,CDRAMO
							,NMPROPUE
							,NMPOLIZA
							,DT_ini_vig
							,dt_fim_vig
							,tipo_apol
							,P_ALTERADOS
							,P_OUTROS
							,TX_FAB
							,LS_FAB
							,LC_FAB
							,TX_CRE
							,LS_CRE
							,LC_CRE
							,PREMIO_SIMP
							,PREMIO_CIMP
							,CUSTO_ABERTURA_SIVA
							,CUSTO_ABERTURA_CIVA
							,VALOR_PREM_CAP
							,PRAZO_VAL_GAR
							,SWAUTOMAN
							,TCONCDIT
							,CODIGOENT
							,REFMB
							,VALOR
							,DTLIMITE
							)
							VALUES
							(DOCUMENTO
							,P_CDUNIECO
							,P_CDRAMO
							,P_NMPROPUE
							,NULL
							,NULL
							,NULL
							,P_TIPO_APOL
							,REPLACE(UPPER(P_P_ALTERADOS),' ','')
							,l_outros --P_OUTROS
							,P_TX_FAB
							,P_LS_FAB
							,P_LC_FAB
							,P_TX_CRE
							,P_LS_CRE
							,P_LC_CRE
							,P_PREMIO_SIMP
							,P_PREMIO_CIMP
							,P_CUSTO_ABERTURA_SIVA
							,P_CUSTO_ABERTURA_CIVA
							,P_VALOR_PRE_CAP
							,P_PRAZO_VAL_GAR
							,'A'
							,P_TCONCDIT
							,P_CODIGOENT
							,P_REFMB
							,P_VALOR
							,P_DTLIMITE
							);


						if l_outros > 1 then	

							loop

								posicao1 := INSTR( v_outros, '§' , 1, (i*2)-1 );
								posicao2 := INSTR( v_outros, '§' , 1, (i*2) );

								if posicao1 != 0 and posicao2 != 0 then
									v_ponto := SUBSTR( v_outros, posicao0+1 , (posicao1-posicao0)-1  );
									v_condicao := SUBSTR( v_outros, posicao1+1 , (posicao2-posicao1)-1  );
								elsif posicao1 != 0 and (posicao2 = 0 or posicao2 = l_outros ) then
									v_ponto := SUBSTR( v_outros, posicao0+1 , (posicao1-posicao0)-1  );
									v_condicao := SUBSTR( v_outros, posicao1+1 , (l_outros-posicao1)-1  );
								else
									j := 2;
									EXIT WHEN posicao1 = 0;
								end if;

								l_ponto := LENGTH(v_ponto);

								if l_ponto > 30 then
									j := 3;
									EXIT WHEN j = 3;
								end if;

								insert into GD_CARTAS_R2_D20_OUTROS (
									id
									,linha
									,ponto
									,condicao
									)
									values
									(DOCUMENTO
									,i
									,TRIM(v_ponto)
									,TRIM(v_condicao)
									);


								i := i + 1;
								posicao0 := posicao2;
							end loop;	

						end if;

						if j = 3 then

							rollback;
							pout_sqlcode := 8;
							pout_sqlerrm := 'ERRO: Não foi inserido as condições correctamente.';
							record_error('ERRO_GO','ERRO: Não foi inserido as condições correctamente. - 8','R2.D20 - GO');

							return;

						else			
							commit;

							select id
							into ambiente_id
							from SVR_AMBIENTES_IMPRESSAO;

							PKG_DOCUMENTOS_SVR.SET_PARAMETRO_NUMERO('P_CDUNIECO',P_CDUNIECO);
							PKG_DOCUMENTOS_SVR.SET_PARAMETRO_NUMERO('P_CDRAMO',P_CDRAMO);
							PKG_DOCUMENTOS_SVR.SET_PARAMETRO_NUMERO('P_NMPOLIZA',P_NMPOLIZA);
							PKG_DOCUMENTOS_SVR.SET_PARAMETRO_NUMERO('P_NMPROPUE',P_NMPROPUE);
							PKG_DOCUMENTOS_SVR.SET_PARAMETRO_NUMERO('P_ID_CARTA',DOCUMENTO);
							PKG_DOCUMENTOS_SVR.SET_PARAMETRO_STRING('P_USUARIO',P_USUARIO);
							PKG_DOCUMENTOS_SVR.SET_PARAMETRO_DATA('P_DATAACTUAL', SYSDATE);
							PKG_DOCUMENTOS_SVR.SET_PARAMETRO_STRING('_USER',ambiente_id);
							PKG_DOCUMENTOS_SVR.EXECUTA('R2.D20');

							pout_sqlcode := 0;
							pout_sqlerrm := 'Documento R2.D20 - PROPOSTA enviado para impressão.';
							record_error('ERRO_GO','Documento R2.D20 - PROPOSTA enviado para impressão. - 0P','R2.D20 - GO');

							return;
						end if;
					end if;
				end if;	

		/* APOLICE */
		ELSIF P_NMPROPUE IS NULL
			AND P_CDUNIECO IS NOT NULL
			AND P_CDRAMO IS NOT NULL
			AND P_NMPOLIZA IS NOT NULL
			THEN
				IF (P_PREMIO_SIMP IS NULL
				OR P_PREMIO_CIMP IS NULL
				OR P_CUSTO_ABERTURA_SIVA IS NULL
				OR P_CUSTO_ABERTURA_CIVA IS NULL) THEN

					pout_sqlcode := 8;
					pout_sqlerrm := 'ERRO: Os campos de prémio e custo de abertura não estão todos preenchidos. Verifique os valores de novo.';
					record_error('ERRO_GO','ERRO: Os campos de prémio e custo de abertura não estão todos preenchidos. Verifique os valores de novo. - 8','R2.D20 - GO');

					return;

				else

					if P_ATA is null or P_DT_INI_VIG is null or P_DT_FIM_VIG is null then

						pout_sqlcode := 9;
						pout_sqlerrm := 'ERRO: Falta o tipo de carta ou o periodo de vigência para a emissão da carta de apólice.';
						record_error('ERRO_GO','ERRO: Falta o tipo de carta ou o periodo de vigência para a emissão da carta de apólice. - 9','R2.D20 - GO');

						return;

					elsIF P_TIPO_APOL = 3 and UPPER(P_ATA) = 'R' then

						pout_sqlcode := 10;
						pout_sqlerrm := 'ERRO: A Apólice selecionada é uma apólice temporária. Não é possível tirar uma carta de Renovação.';
						record_error('ERRO_GO','ERRO: A Apólice selecionada é uma apólice temporária. Não é possível tirar uma carta de Renovação. - 10','R2.D20 - GO');

						return;

					else

						IF (P_TX_FAB IS NULL AND P_LC_FAB IS NOT NULL)
							OR (P_TX_FAB IS NOT NULL AND P_LC_FAB IS NULL)
							then

								pout_sqlcode := 11;
								pout_sqlerrm := 'ERRO: Os campos da Fase de Fabrico não estão todos preenchidos.';
								record_error('ERRO_GO','ERRO: Os campos da Fase de Fabrico não estão todos preenchidos. - 11','R2.D20 - GO');

								return;

						end if;

						IF (P_TX_CRE IS NULL OR P_LC_CRE IS NULL)
							then

								pout_sqlcode := 12;
								pout_sqlerrm := 'ERRO: Os campos da Fase de Crédito não estão todos preenchidos.';
								record_error('ERRO_GO','ERRO: Os campos da Fase de Crédito não estão todos preenchidos. - 12','R2.D20 - GO');

								return;

						end if;

						IF P_TIPO_APOL = 4 and UPPER(P_ATA) = 'R' then
							tipodoc := 5;
						else tipodoc := P_TIPO_APOL;
						end if;

						IF P_TCONCDIT is null and tipodoc = 5 then

							pout_sqlcode := 16;
							pout_sqlerrm := 'ERRO: Falta preencher o parametro da lista de condições.';
							record_error('ERRO_GO','ERRO: Falta preencher o parametro da lista de condições. - 16','R2.D20 - GO');

						return;

						end if;						

						select R2D20_DOCSEQ.NEXTVAL into DOCUMENTO from dual;
						--DOCUMENTO := R2D21_DOCSEQ.NEXTVAL;

						v_outros := P_OUTROS;
						l_outros := LENGTH(v_outros);

						if l_outros < 2 then
							m_outros := null;
						else
							m_outros := 0 ;
						end if;

						INSERT INTO GD_CARTAS_R2_D20 (
							id
							,CDUNIECO
							,CDRAMO
							,NMPROPUE
							,NMPOLIZA
							,DT_ini_vig
							,dt_fim_vig
							,tipo_apol
							,P_ALTERADOS
							,P_OUTROS
							,TX_FAB
							,LS_FAB
							,LC_FAB
							,TX_CRE
							,LS_CRE
							,LC_CRE
							,PREMIO_SIMP
							,PREMIO_CIMP
							,CUSTO_ABERTURA_SIVA
							,CUSTO_ABERTURA_CIVA
							,VALOR_PREM_CAP
							,PRAZO_VAL_GAR
							,SWAUTOMAN
							,TCONCDIT
							,CODIGOENT
							,REFMB
							,VALOR
							,DTLIMITE
							)
							VALUES
							(DOCUMENTO
							,P_CDUNIECO
							,P_CDRAMO
							,null
							,P_NMPOLIZA
							,P_DT_INI_VIG
							,P_DT_FIM_VIG
							,tipodoc
							,REPLACE(UPPER(P_P_ALTERADOS),' ','')
							,l_outros --P_OUTROS
							,P_TX_FAB
							,P_LS_FAB
							,P_LC_FAB
							,P_TX_CRE
							,P_LS_CRE
							,P_LC_CRE
							,P_PREMIO_SIMP
							,P_PREMIO_CIMP
							,P_CUSTO_ABERTURA_SIVA
							,P_CUSTO_ABERTURA_CIVA
							,P_VALOR_PRE_CAP
							,P_PRAZO_VAL_GAR
							,'A'
							,P_TCONCDIT
							,P_CODIGOENT
							,P_REFMB
							,P_VALOR
							,P_DTLIMITE
							);

						if l_outros > 1 then	

							loop

								posicao1 := INSTR( v_outros, '§' , 1, (i*2)-1 );
								posicao2 := INSTR( v_outros, '§' , 1, (i*2) );

								if posicao1 != 0 and posicao2 != 0 then
									v_ponto := SUBSTR( v_outros, posicao0+1 , (posicao1-posicao0)-1  );
									v_condicao := SUBSTR( v_outros, posicao1+1 , (posicao2-posicao1)-1  );
								elsif posicao1 != 0 and (posicao2 = 0 or posicao2 = l_outros ) then
									v_ponto := SUBSTR( v_outros, posicao0+1 , (posicao1-posicao0)-1  );
									v_condicao := SUBSTR( v_outros, posicao1+1 , (l_outros-posicao1)-1  );
								else
									j := 2;
									EXIT WHEN posicao1 = 0;
								end if;

								l_ponto := LENGTH(v_ponto);

								if l_ponto > 30 then
									j := 3;
									EXIT WHEN j = 3;
								end if;

								insert into GD_CARTAS_R2_D20_OUTROS (
									id
									,linha
									,ponto
									,condicao
									)
									values
									(DOCUMENTO
									,i
									,TRIM(v_ponto)
									,TRIM(v_condicao)
									);


								i := i + 1;
								posicao0 := posicao2;
							end loop;	

						end if;

						if j = 3 then

							rollback;
							pout_sqlcode := 13;
							pout_sqlerrm := 'ERRO: Não foi inserido as condições correctamente.';
							record_error('ERRO_GO','ERRO: Não foi inserido as condições correctamente. - 13','R2.D20 - GO');

							return;

						else			
							commit;

							select id
							into ambiente_id
							from SVR_AMBIENTES_IMPRESSAO;

							PKG_DOCUMENTOS_SVR.SET_PARAMETRO_NUMERO('P_CDUNIECO',P_CDUNIECO);
							PKG_DOCUMENTOS_SVR.SET_PARAMETRO_NUMERO('P_CDRAMO',P_CDRAMO);
							PKG_DOCUMENTOS_SVR.SET_PARAMETRO_NUMERO('P_NMPOLIZA',P_NMPOLIZA);
							PKG_DOCUMENTOS_SVR.SET_PARAMETRO_NUMERO('P_NMPROPUE',P_NMPROPUE);
							PKG_DOCUMENTOS_SVR.SET_PARAMETRO_NUMERO('P_ID_CARTA',DOCUMENTO);
							PKG_DOCUMENTOS_SVR.SET_PARAMETRO_STRING('P_USUARIO',P_USUARIO);
							PKG_DOCUMENTOS_SVR.SET_PARAMETRO_DATA('P_DATAACTUAL', SYSDATE);
							PKG_DOCUMENTOS_SVR.SET_PARAMETRO_STRING('_USER',ambiente_id);
							PKG_DOCUMENTOS_SVR.EXECUTA('R2.D20');

						end if;

						pout_sqlcode := 0;
						pout_sqlerrm := 'Documento R2.D20 - APÓLICE enviado para impressão.';
						record_error('ERRO_GO','Documento R2.D20 - APÓLICE enviado para impressão. - 0A','R2.D20 - GO');

						return;
					end if;
				end if;


		else

			pout_sqlcode := 14;
			pout_sqlerrm := 'ERRO: Não foram preenchidos todos os campos';
			record_error('ERRO_GO','ERRO: Não foram preenchidos todos os campos - 14','R2.D20 - GO');

			return;

		end if;

	EXCEPTION
		WHEN OTHERS THEN
			pout_sqlcode := SQLCODE;
			pout_sqlerrm := SUBSTR(SQLERRM,1,299);
			record_error('ERRO_GO','ERRO: ' || SQLCODE || ' - ' || SQLERRM,'R2.D20 - GO');
	END CREATE_R2_D20_V2;


	/*
	-* NOME      : GET_PROCESSO_GO
	-* OBJECTIVO : RETORNA O ID DO PROCESSO GO DE UMA APÓLICE À DATA DA CRIAÇÃO DO DOCUMENTO
	-* UTILIZACAO: PKG_DOCUMENTOS_GO.GET_PROCESSO_GO(CDUNIECO, CDRAMO, NMPOLIZA, DOC_ID);
	-* AUTOR     : JOÃO RIBEIRO
	-* DATA      : 09-10-2019
	-* VERSÃO    : 1.0
	-*
	-* ÚLTIMAS ALTERAÇÕES
	-*
	-*   DATA       AUTOR           DESCRIÇÃO
	-*   ========== =============== =================================================
	-*
	-*/
	FUNCTION GET_PROCESSO_GO (PI_CDUNIECO IN NUMBER, PI_CDRAMO IN NUMBER, PI_NMPOLIZA IN NUMBER, PI_DOC_ID IN NUMBER ) RETURN VARCHAR2
	IS
		vDATA_PED DATE;
		vOTVALOR tvalopol.otvalor%type;

	BEGIN

		begin
			select data_pedido
			into vDATA_PED
			from svr_documentos
			where id = PI_DOC_ID;

		EXCEPTION
			WHEN OTHERS THEN
				vDATA_PED := null;
		end;

		if vDATA_PED is not null then

			begin

				SELECT a.otvalor
				INTO vOTVALOR
				FROM (
					SELECT a.cdunieco
						,a.cdramo
						,a.estado
						,a.nmpoliza
						,a.nmsuplem
						,a.STATUS
						,a.otvalor
						,b.feinival
						,b.fefinval
						,b.nsuplogi
						,c.cdtipsup
						,c.fesolici as feemisio
						,NVL((
								LEAD(c.fesolici) OVER (
									PARTITION BY a.cdunieco
									,a.cdramo
									,a.estado
									,a.nmpoliza ORDER BY b.nsuplogi
									)
								) - 1 / 86400, to_date('31122200', 'ddmmyyyy')) AS fefimisio
					FROM tvalopol a
						,msupleme b
						,tdescsup c
					WHERE 1 = 1
						AND a.cdunieco = PI_CDUNIECO
						AND a.cdramo = PI_CDRAMO
						AND a.nmpoliza = PI_NMPOLIZA
						AND a.cdatribu = 42
						AND b.cdunieco = a.cdunieco
						AND b.cdramo = a.cdramo
						AND b.nmpoliza = a.nmpoliza
						AND b.nmsuplem = a.nmsuplem
						AND c.cdunieco = b.cdunieco
						AND c.cdramo = b.cdramo
						AND c.nmpoliza = b.nmpoliza
						AND c.nsuplogi = b.nsuplogi
					) a
				WHERE 1 = 1
					AND vDATA_PED BETWEEN a.feemisio
						AND a.fefimisio;

			EXCEPTION
				WHEN OTHERS THEN
					vOTVALOR := null;
			end;


		end if;

		if vOTVALOR is not null then
			return vOTVALOR;
		else

			begin

				SELECT /*+ ordered */
					proposta.otvalor
				INTO vOTVALOR
				FROM mpolizas apol
					,co_tvalopro proposta
				WHERE 1 = 1
					AND apol.cdunieco = PI_CDUNIECO
					AND apol.ESTADO = 'M'
					AND apol.cdramo = PI_CDRAMO
					AND apol.nmpoliza = PI_NMPOLIZA
					AND nvl(apol.NMSUPLEM, 0) = (
						SELECT nvl(MAX(NMSUPLEM), 0)
						FROM mpolizas X
						WHERE X.Cdunieco = apol.Cdunieco
							AND x.nmsuplem <= TO_CHAR(NVL(vDATA_PED,sysdate), 'J') || '999999999999'
							AND X.Cdramo = apol.Cdramo
							AND X.Estado = apol.Estado
							AND X.Nmpoliza = apol.Nmpoliza
						)
					AND proposta.cdunieco(+) = apol.cdunieco
					AND proposta.cdramo(+) = apol.cdramo
					AND proposta.nmpropue(+) = apol.nmsolici
					AND proposta.cdatribu(+) IN (34)
					AND NVL(Proposta.femodif, sysdate) = (
						SELECT NVL(MAX(X.femodif), sysdate)
						FROM co_tvalopro X
						WHERE X.nmpropue = Proposta.nmpropue
							AND X.femodif <= NVL(vDATA_PED,sysdate)
							AND X.cdatribu = Proposta.cdatribu
							AND X.cdramo = Proposta.cdramo
							AND X.cdunieco = Proposta.cdunieco
						);

			EXCEPTION
				WHEN OTHERS THEN
					vOTVALOR := null;
			end;	
		end if;

		return vOTVALOR;

	END GET_PROCESSO_GO;


	/*
	-* NOME      : GET_PROCESSO_GO_RECIBO
	-* OBJECTIVO : RETORNA O ID DO PROCESSO GO DE UMA APÓLICE À DATA DA CRIAÇÃO DO DOCUMENTO
	-* UTILIZACAO: PKG_DOCUMENTOS_GO.GET_PROCESSO_GO_RECIBO(CDUNIECO, CDRAMO, NMRECIBO, DOC_ID);
	-* AUTOR     : JOÃO RIBEIRO
	-* DATA      : 09-10-2019
	-* VERSÃO    : 1.0
	-*
	-* ÚLTIMAS ALTERAÇÕES
	-*
	-*   DATA       AUTOR           DESCRIÇÃO
	-*   ========== =============== =================================================
	-*
	-*/
	FUNCTION GET_PROCESSO_GO_RECIBO (PI_CDUNIECO IN NUMBER, PI_NMRECIBO IN NUMBER, PI_DOC_ID IN NUMBER ) RETURN VARCHAR2
	IS
		vDATA_PED DATE;
		vNMPOLIZA MRECIBO.NMPOLIZA%type;
		vCDRAMO MRECIBO.CDRAMO%type;
		vOTVALOR tvalopol.otvalor%type;

	BEGIN

		begin

			select data_pedido
			into vDATA_PED
			from svr_documentos
			where id = PI_DOC_ID;

		EXCEPTION
			WHEN OTHERS THEN
				vDATA_PED := null;
		end;

		begin

			select CDRAMO
			,NMPOLIZA
			into vCDRAMO
			,vNMPOLIZA
			from MRECIBO
			where CDUNIECO = PI_CDUNIECO
			and NMRECIBO = PI_NMRECIBO;

		EXCEPTION
			WHEN OTHERS THEN
				vNMPOLIZA := null;
		end;

		if vDATA_PED is not null and vNMPOLIZA is not null then

			begin

				SELECT a.otvalor
				INTO vOTVALOR
				FROM (
					SELECT a.cdunieco
						,a.cdramo
						,a.estado
						,a.nmpoliza
						,a.nmsuplem
						,a.STATUS
						,a.otvalor
						,b.feinival
						,b.fefinval
						,b.nsuplogi
						,c.cdtipsup
						,c.fesolici as feemisio
						,NVL((
								LEAD(c.fesolici) OVER (
									PARTITION BY a.cdunieco
									,a.cdramo
									,a.estado
									,a.nmpoliza ORDER BY b.nsuplogi
									)
								) - 1 / 86400, to_date('31122200', 'ddmmyyyy')) AS fefimisio
					FROM tvalopol a
						,msupleme b
						,tdescsup c
					WHERE 1 = 1
						AND a.cdunieco = PI_CDUNIECO
						AND a.cdramo = vCDRAMO
						AND a.nmpoliza = vNMPOLIZA
						AND a.cdatribu = 42
						AND b.cdunieco = a.cdunieco
						AND b.cdramo = a.cdramo
						AND b.nmpoliza = a.nmpoliza
						AND b.nmsuplem = a.nmsuplem
						AND c.cdunieco = b.cdunieco
						AND c.cdramo = b.cdramo
						AND c.nmpoliza = b.nmpoliza
						AND c.nsuplogi = b.nsuplogi
					) a
				WHERE 1 = 1
					AND vDATA_PED BETWEEN a.feemisio
						AND a.fefimisio;

			EXCEPTION
				WHEN OTHERS THEN
					vOTVALOR := null;
			end;


		end if;

		if vOTVALOR is not null then
			return vOTVALOR;
		else

			begin

				SELECT /*+ ordered */
					proposta.otvalor
				INTO vOTVALOR
				FROM mpolizas apol
					,co_tvalopro proposta
				WHERE 1 = 1
					AND apol.cdunieco = PI_CDUNIECO
					AND apol.ESTADO = 'M'
					AND apol.cdramo = vCDRAMO
					AND apol.nmpoliza = vNMPOLIZA
					AND nvl(apol.NMSUPLEM, 0) = (
						SELECT nvl(MAX(NMSUPLEM), 0)
						FROM mpolizas X
						WHERE X.Cdunieco = apol.Cdunieco
							AND x.nmsuplem <= TO_CHAR(NVL(vDATA_PED,sysdate), 'J') || '999999999999'
							AND X.Cdramo = apol.Cdramo
							AND X.Estado = apol.Estado
							AND X.Nmpoliza = apol.Nmpoliza
						)
					AND proposta.cdunieco(+) = apol.cdunieco
					AND proposta.cdramo(+) = apol.cdramo
					AND proposta.nmpropue(+) = apol.nmsolici
					AND proposta.cdatribu(+) IN (34)
					AND NVL(Proposta.femodif, sysdate) = (
						SELECT NVL(MAX(X.femodif), sysdate)
						FROM co_tvalopro X
						WHERE X.nmpropue = Proposta.nmpropue
							AND X.femodif <= NVL(vDATA_PED,sysdate)
							AND X.cdatribu = Proposta.cdatribu
							AND X.cdramo = Proposta.cdramo
							AND X.cdunieco = Proposta.cdunieco
						);

			EXCEPTION
				WHEN OTHERS THEN
					vOTVALOR := null;
			end;	
		end if;

		return vOTVALOR;

	END GET_PROCESSO_GO_RECIBO;

	/*
	-* NOME      : CREATE_O2_OD73
	-* OBJECTIVO : Cria o pedido de envio do email da carta O2.OD73 para uma entidade.
	-* UTILIZACAO: PKG_DOCUMENTOS_GO.CREATE_O2_OD73(CDUNIECO, CDRAMO, CDPERSON, DATAEFEITO, USUARIO);
	-* AUTOR     : JOÃO RIBEIRO
	-* DATA      : 26-02-2021
	-* VERSÃO    : 1.0
	-*
	-* ÚLTIMAS ALTERAÇÕES
	-*
	-*   DATA       AUTOR           DESCRIÇÃO
	-*   ========== =============== =================================================
	-*
	-*/
	PROCEDURE CREATE_O2_OD73(  P_CDUNIECO 			in 		mpolizas.cdunieco%TYPE
							, P_CDRAMO 				in 		mpolizas.cdramo%TYPE
							, P_CDPERSON			in		mpersona.cdperson%TYPE
							, P_DATAEFEITO 			in 		mpolizas.feemisio%TYPE
							, P_USUARIO				in		VARCHAR2
							, pout_sqlcode    			OUT NUMBER
							, pout_sqlerrm    			OUT VARCHAR2
							)
	IS
		nconta NUMBER;
		n_email number;
		ambiente_id SVR_AMBIENTES_IMPRESSAO.ID%TYPE;

		CURSOR TOMADOR(PIN_CDPERSON IN NUMBER) is
		SELECT cdperson
			,email
		FROM GD_TOM_CAUCAO_INF_P
		WHERE 1 = 1
			AND swemailvalido = 'S'
			and cdperson = PIN_CDPERSON;

	BEGIN

		record_error('ERRO_GO','CHAMADA AO PKG_DOCUMENTOS_GO.CREATE_O2_OD73 '||P_CDUNIECO||' - '||P_CDRAMO||' - '||P_CDPERSON||' - '||P_DATAEFEITO||' - '||P_USUARIO,'O2.OD73 - GO');

		if P_CDPERSON is not null then

			SELECT count(cdperson)
			INTO nconta
			FROM GD_TOM_CAUCAO_INFP_VW
			WHERE CDPERSON = P_CDPERSON;


			IF nconta = 0 then

				pout_sqlcode := 1;
				pout_sqlerrm := 'ERRO: A entidade ainda não se encontra na tabelas dos tomadores permitidos de receber o documento.';
				record_error('ERRO_GO','ERRO: A entidade ainda não se encontra na tabelas dos tomadores permitidos de receber o documento. - 1','R2.D20 - GO');

				return;

			else
				n_email := 0;

				select id
				into ambiente_id
				from SVR_AMBIENTES_IMPRESSAO;

				FOR RW in TOMADOR(P_CDPERSON) loop

					PKG_DOCUMENTOS_SVR.SET_PARAMETRO_NUMERO('P_CDUNIECO', P_CDUNIECO);

					if P_CDRAMO is not null then
						PKG_DOCUMENTOS_SVR.SET_PARAMETRO_NUMERO('P_CDRAMO',   P_CDRAMO);
					end if;

					PKG_DOCUMENTOS_SVR.SET_PARAMETRO_NUMERO('P_CDPERSON', RW.CDPERSON);
					PKG_DOCUMENTOS_SVR.SET_PARAMETRO_DATA('P_DATAACTUAL', P_DATAEFEITO);
					PKG_DOCUMENTOS_SVR.SET_PARAMETRO_STRING('P_USUARIO',  P_USUARIO);
					PKG_DOCUMENTOS_SVR.SET_PARAMETRO_STRING('_USER',ambiente_id);

					PKG_DOCUMENTOS_SVR.EMAIL('O2.OD73', RW.EMAIL);					

					record_error('ERRO_GO','Envio do documento O2.OD73 - '||P_CDUNIECO||' - '||P_CDRAMO||' - '||RW.CDPERSON||' - '||P_DATAEFEITO||' - '||P_USUARIO||' - '||RW.EMAIL,'O2.OD73 - GO');

					n_email := n_email +1;

				end loop;

				IF n_email = 0 then

					pout_sqlcode := 2;
					pout_sqlerrm := 'ERRO: Não foram encontrados endereços de email válidos para a entidade referida. '|| P_CDPERSON;
					record_error('ERRO_GO','ERRO: Não foram encontrados endereços de email válidos para a entidade referida. -2 '|| P_CDPERSON,'R2.D20 - GO');

					return;

				else

					pout_sqlcode := 0;
					pout_sqlerrm := 'Sucesso. Foi criado o pedido de criação da carta O2.OD73 e o seu respectivo envio';
					record_error('ERRO_GO','Sucesso. Foi criado o pedido de criação da carta O2.OD73 e o seu respectivo envio -0 '|| P_CDPERSON,'R2.D20 - GO');

					return;

				end if;
			end if;


		else 
			pout_sqlcode := 3;
			pout_sqlerrm := 'ERRO: Não foi encontrado a entidade no parametro de entrada.';
			record_error('ERRO_GO','ERRO: Não foi encontrado a entidade no parametro de entrada. - 3','O2.OD73 - GO');

		end if;

	EXCEPTION
		WHEN OTHERS THEN
			pout_sqlcode := SQLCODE;
			pout_sqlerrm := SUBSTR(SQLERRM,1,299);
			record_error('ERRO_GO','ERRO: ' || SQLCODE || ' - ' || SQLERRM,'O2.OD73 - GO');
	END CREATE_O2_OD73;

	/*
	-* NOME      : CREATE_O2_OD63
	-* OBJECTIVO : Cria o pedido de criação da carta O2.OD63 para uma entidade.
	-* UTILIZACAO: PKG_DOCUMENTOS_GO.CREATE_O2_OD63(CDUNIECO, CDRAMO, ESTADO, NMPROPUE, DATAACTUAL, TEXTOLIVRE, USUARIO);
	-* AUTOR     : JOÃO RIBEIRO
	-* DATA      : 22-10-2021
	-* VERSÃO    : 1.0
	-*
	-* ÚLTIMAS ALTERAÇÕES
	-*
	-*   DATA       AUTOR           DESCRIÇÃO
	-*   ========== =============== =================================================
	-*
	-*/
	PROCEDURE CREATE_O2_OD63(  P_CDUNIECO 			in 		co_propol.cdunieco%TYPE
							, P_CDRAMO 				in 		co_propol.cdramo%TYPE
							, P_ESTADO				in		co_propol.swestado%TYPE
							, P_NMPROPUE			in		co_propol.nmpropue%TYPE
							, P_DATAACTUAL 			in 		mpolizas.feemisio%TYPE
							, P_TEXTOLIVRE			in		VARCHAR2
							, P_USUARIO				in		VARCHAR2
							, pout_sqlcode    			OUT NUMBER
							, pout_sqlerrm    			OUT VARCHAR2
							)
	IS
		nconta NUMBER;
		n_email number;
		ambiente_id SVR_AMBIENTES_IMPRESSAO.ID%TYPE;


	BEGIN

		record_error('ERRO_GO','CHAMADA AO PKG_DOCUMENTOS_GO.CREATE_O2_OD63 '||P_CDUNIECO||' - '||P_CDRAMO||' - '||P_ESTADO||' - '||P_NMPROPUE||' - '||P_DATAACTUAL||' - '||P_TEXTOLIVRE||' - '||P_USUARIO,'O2.OD63 - GO');

		if P_NMPROPUE is not null then

		select id
			into ambiente_id
			from SVR_AMBIENTES_IMPRESSAO;

			PKG_DOCUMENTOS_SVR.SET_PARAMETRO_NUMERO('P_NMPROPUE',P_NMPROPUE);
			PKG_DOCUMENTOS_SVR.SET_PARAMETRO_NUMERO('P_CDUNIECO',P_CDUNIECO);
			PKG_DOCUMENTOS_SVR.SET_PARAMETRO_STRING('P_ESTADO',P_ESTADO);
			PKG_DOCUMENTOS_SVR.SET_PARAMETRO_NUMERO('P_CDRAMO',P_CDRAMO);
			PKG_DOCUMENTOS_SVR.SET_PARAMETRO_STRING('P_USUARIO',P_USUARIO);
			PKG_DOCUMENTOS_SVR.SET_PARAMETRO_DATA('P_DATAACTUAL',SYSDATE);
			PKG_DOCUMENTOS_SVR.SET_PARAMETRO_STRING('P_TEXTOLIVRE',P_TEXTOLIVRE);
			PKG_DOCUMENTOS_SVR.SET_PARAMETRO_STRING('_USER',ambiente_id);
			PKG_DOCUMENTOS_SVR.EXECUTA('O2.OD63');

			/*PKG_DOCUMENTOS_SVR.SET_PARAMETRO_NUMERO('P_NMPROPUE',P_NMPROPUE);
			PKG_DOCUMENTOS_SVR.SET_PARAMETRO_NUMERO('P_CDUNIECO',P_CDUNIECO);
			PKG_DOCUMENTOS_SVR.SET_PARAMETRO_STRING('P_ESTADO',P_ESTADO);
			PKG_DOCUMENTOS_SVR.SET_PARAMETRO_NUMERO('P_CDRAMO',P_CDRAMO);
			PKG_DOCUMENTOS_SVR.SET_PARAMETRO_STRING('P_USUARIO',P_USUARIO);
			PKG_DOCUMENTOS_SVR.SET_PARAMETRO_DATA('P_DATAACTUAL',SYSDATE);
			PKG_DOCUMENTOS_SVR.SET_PARAMETRO_STRING('_USER',ambiente_id);
			PKG_DOCUMENTOS_SVR.EXECUTA('O2.OD63A');		*/			

			record_error('ERRO_GO','Envio do documento O2.OD63 - '||P_CDUNIECO||' - '||P_CDRAMO||' - '||P_ESTADO||' - '||P_NMPROPUE||' - '||P_DATAACTUAL||' - '||P_TEXTOLIVRE||' - '||P_USUARIO,'O2.OD63 - GO');

		else 
			pout_sqlcode := 1;
			pout_sqlerrm := 'ERRO: Não foi encontrado a proposta no parametro de entrada.';
			record_error('ERRO_GO','ERRO: Não foi encontrado a entidade no parametro de entrada. - 3','O2.OD63 - GO');

		end if;

	EXCEPTION
		WHEN OTHERS THEN
			pout_sqlcode := SQLCODE;
			pout_sqlerrm := SUBSTR(SQLERRM,1,299);
			record_error('ERRO_GO','ERRO: ' || SQLCODE || ' - ' || SQLERRM,'O2.OD63 - GO');

	END CREATE_O2_OD63;


END Pkg_Documentos_Go;

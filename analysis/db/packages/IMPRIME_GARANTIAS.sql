-- IMPRIME_GARANTIAS (owner: SIID_TESTES)


-- ===== PROCEDURE =====

PROCEDURE IMPRIME_GARANTIAS IS

CURSOR LST_EDOCS_TO_ONL IS
    SELECT DOC.id DOCUMENTO_ID /* lista de todas as garantias que ainda não foram impressas e arquivadas e ainda se encontram no estado EDC */
        ,DOC.MODELO_ID MODELO_ID
        ,TO_CHAR(DOC.data_pedido, 'YYYY\MM\DD') DIRECTORIA
        ,DOC.NOME_OUTPUT NOME_FICHEIRO
        ,DOC.LOTE_ORDEM
        ,DOC.LOTE_ID
        ,DOC.N_REFERENCIA
        ,DOC.DESTINATARIO
        ,DOC.PARAMETRO01
        ,DOC.PARAMETRO02
        ,DOC.PARAMETRO03
        ,DOC.PARAMETRO04
        ,DOC.PARAMETRO05
        ,DOC.PARAMETRO06
        ,DOC.PARAMETRO07
        ,DOC.PARAMETRO08
        ,to_date(DOC.parametro03, 'DD-MM-YYYY') P_DATAACTUAL
        ,DOC.DATA_PEDIDO
        ,DOC.DATA_EXECUCAO
        ,DOC.DATA_ARQUIVO
        ,DOC.ARQUIVADO
        ,DOC.DATA_IMPRESSAO
        ,DOC.IMPRESSO_POR
        ,DOC.CRIADO_POR CRIADO_POR
        ,DOC.DISPONIVEL_RF
    FROM SVR_DOCUMENTOS DOC
    WHERE 1 = 1
        AND DOC.MODELO_ID IN (
            'R3.D25'
            ,'R3.D25R'
            ,'R3.D28'
            ,'R3.D28R'
            )
        AND doc.data_pedido > to_date('15-05-2014', 'dd-mm-yyyy') -- data de inicio de implentação destas regras
        --AND doc.data_pedido <= P_DIA
        AND DOC.destinatario IS NOT NULL -- retirar os documentos que estão em branco
        AND DOC.DISPONIVEL_RF = 'EDC'
        AND DOC.DATA_ARQUIVO IS NULL
        AND DOC.DATA_EXECUCAO IS NOT NULL
        AND DOC.DATA_IMPRESSAO IS NULL
        -- condição para verificação de documentos que seriam impressos por este processo
        --AND not exists (select 1 from T_GARANTS_IMPRIME TGI where TGI.ID = DOC.ID);
        ;

	vDATA_NOTIFICACAO 	DATE := null;
	vDATA_REGISTO     	DATE := null;
	vDATA_ACESSO      	DATE := null;
	vDATA_RESTRICAO   	DATE := null;
	vDATA_ANULACAO   	DATE := null;
	vDATA_DIA   		DATE := null;
	ESTADO_GARANTIA CO_PROGAR.SWESTADO%type;
	vACESSOS 			number := 0;
	vRESTRICOES 		number := 0;
	vPG 				number := 0;
	vLN 				number := 0;
	vFEEMISIO 			DATE := null;
	vFEEFECTO 			DATE := null;

	BEGIN

	vDATA_DIA := trunc(sysdate);

	begin

		SELECT valor
		INTO vPG
		FROM svr_variaveis_siid
		WHERE TIPO_VARIAVEL_RF = 'PERIODO_GRACA';

	EXCEPTION
		WHEN NO_DATA_FOUND THEN
		vPG := 15;
	end;


	begin

		SELECT valor
		INTO vLN
		FROM svr_variaveis_siid
		WHERE TIPO_VARIAVEL_RF = 'LIMITE_NOTIF';

	EXCEPTION
		WHEN NO_DATA_FOUND THEN
		vLN := 14;
	end;

	FOR RW in LST_EDOCS_TO_ONL LOOP

		BEGIN

			SELECT FENOTIF
				,FEREGISGAR
				,SWESTADO
				,NVL(GREATEST(TRUNC(PKG_FORMULAS_COSEC.GET_DT_ANULACAO_REAL_APOL(RW.PARAMETRO05,RW.PARAMETRO06,RW.PARAMETRO04)),
						TRUNC(PKG_FORMULAS_COSEC.GET_DT_ANULACAO_APOLICE(RW.PARAMETRO05,RW.PARAMETRO06,RW.PARAMETRO04))),to_date('31122200','ddmmyyyy'))
						-- data maior entre a data efectiva da anulação e a data da inicial da vigencia do suplemento de anulação
			INTO vDATA_NOTIFICACAO
				,vDATA_REGISTO
				,ESTADO_GARANTIA
				,vDATA_ANULACAO
			FROM CO_PROGAR X
			WHERE X.CDUNIECO = RW.PARAMETRO05
				AND X.CDRAMO = RW.PARAMETRO06
				AND X.NMPOLIZA = RW.PARAMETRO04
				AND X.NMGARANT = RW.PARAMETRO07;

			IF (vDATA_NOTIFICACAO IS NOT NULL AND TRUNC(vDATA_NOTIFICACAO) <= vDATA_DIA) THEN

				UPDATE SVR_DOCUMENTOS
				SET arquivado = 'S'
					,DATA_ARQUIVO = vDATA_NOTIFICACAO
					,DISPONIVEL_RF = 'EDC'
				WHERE ID = RW.DOCUMENTO_ID;

				INSERT INTO T_GARANTS_IMPRIME (
					ID
					,MODELO_ID
					,LOTE_ORDEM
					,LOTE_ID
					,N_REFERENCIA
					,DATA_PEDIDO
					,DATA_EXECUCAO
					,PARAMETRO01
					,PARAMETRO02
					,PARAMETRO03
					,PARAMETRO04
					,PARAMETRO05
					,PARAMETRO06
					,PARAMETRO07
					,PARAMETRO08
					,DESTINATARIO
					,DATA_PROCESSAMENTO
					,DATA_NOTIFICACAO
					,DATA_ACESSO
					,DATA_ANULACAO
					,DATA_REGISTO
					,DATA_EMISSAO_APOLICE
					,DATA_VIG_APOLICE
					,SWIMPRESSO
					,OBSERVACAO
					)
				VALUES (
					RW.DOCUMENTO_ID
					,RW.MODELO_ID
					,RW.LOTE_ORDEM
					,RW.LOTE_ID
					,RW.N_REFERENCIA
					,RW.DATA_PEDIDO
					,RW.DATA_EXECUCAO
					,RW.PARAMETRO01
					,RW.PARAMETRO02
					,RW.PARAMETRO03
					,RW.PARAMETRO04
					,RW.PARAMETRO05
					,RW.PARAMETRO06
					,RW.PARAMETRO07
					,RW.PARAMETRO08
					,RW.DESTINATARIO
					,sysdate
					,vDATA_NOTIFICACAO
					,null
					,null
					,vDATA_REGISTO
					,null
					,null
					,'NOTIFICADO'
					,'GARANTIA NOTIFICADA'
					)
				;

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
					,RW.MODELO_ID
					,NULL
					,sysdate
					,NULL
					,'IMPRIME_GARANTIAS: GARANTIA NOTIFICADA'
					,RW.DOCUMENTO_ID
					);


                commit;

			ELSIF (vDATA_NOTIFICACAO IS NULL AND ESTADO_GARANTIA in ('E')) THEN

				UPDATE SVR_DOCUMENTOS
				SET arquivado = 'S'
					,DATA_ARQUIVO = TRUNC(SYSDATE)
					,DISPONIVEL_RF = 'EDC'
				WHERE ID = RW.DOCUMENTO_ID;

				INSERT INTO T_GARANTS_IMPRIME (
					ID
					,MODELO_ID
					,LOTE_ORDEM
					,LOTE_ID
					,N_REFERENCIA
					,DATA_PEDIDO
					,DATA_EXECUCAO
					,PARAMETRO01
					,PARAMETRO02
					,PARAMETRO03
					,PARAMETRO04
					,PARAMETRO05
					,PARAMETRO06
					,PARAMETRO07
					,PARAMETRO08
					,DESTINATARIO
					,DATA_PROCESSAMENTO
					,DATA_NOTIFICACAO
					,DATA_ACESSO
					,DATA_ANULACAO
					,DATA_REGISTO
					,DATA_EMISSAO_APOLICE
					,DATA_VIG_APOLICE
					,SWIMPRESSO
					,OBSERVACAO
					)
				VALUES (
					RW.DOCUMENTO_ID
					,RW.MODELO_ID
					,RW.LOTE_ORDEM
					,RW.LOTE_ID
					,RW.N_REFERENCIA
					,RW.DATA_PEDIDO
					,RW.DATA_EXECUCAO
					,RW.PARAMETRO01
					,RW.PARAMETRO02
					,RW.PARAMETRO03
					,RW.PARAMETRO04
					,RW.PARAMETRO05
					,RW.PARAMETRO06
					,RW.PARAMETRO07
					,RW.PARAMETRO08
					,RW.DESTINATARIO
					,sysdate
					,vDATA_NOTIFICACAO
					,null
					,null
					,vDATA_REGISTO
					,null
					,null
					,'ELEMINADA'
					,'GARANTIA ELEMINADA'
					)
				;

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
					,RW.MODELO_ID
					,NULL
					,sysdate
					,NULL
					,'IMPRIME_GARANTIAS: GARANTIA ELEMINADA'
					,RW.DOCUMENTO_ID
					);

				COMMIT;


			ELSIF (vDATA_NOTIFICACAO IS NULL AND TRUNC(vDATA_ANULACAO) = vDATA_DIA) THEN

				UPDATE SVR_DOCUMENTOS
				SET arquivado = 'S'
					,DATA_ARQUIVO = TRUNC(SYSDATE)
					,DISPONIVEL_RF = 'EDC'
				WHERE ID = RW.DOCUMENTO_ID;

				INSERT INTO T_GARANTS_IMPRIME (
					ID
					,MODELO_ID
					,LOTE_ORDEM
					,LOTE_ID
					,N_REFERENCIA
					,DATA_PEDIDO
					,DATA_EXECUCAO
					,PARAMETRO01
					,PARAMETRO02
					,PARAMETRO03
					,PARAMETRO04
					,PARAMETRO05
					,PARAMETRO06
					,PARAMETRO07
					,PARAMETRO08
					,DESTINATARIO
					,DATA_PROCESSAMENTO
					,DATA_NOTIFICACAO
					,DATA_ACESSO
					,DATA_ANULACAO
					,DATA_REGISTO
					,DATA_EMISSAO_APOLICE
					,DATA_VIG_APOLICE
					,SWIMPRESSO
					,OBSERVACAO
					)
				VALUES (
					RW.DOCUMENTO_ID
					,RW.MODELO_ID
					,RW.LOTE_ORDEM
					,RW.LOTE_ID
					,RW.N_REFERENCIA
					,RW.DATA_PEDIDO
					,RW.DATA_EXECUCAO
					,RW.PARAMETRO01
					,RW.PARAMETRO02
					,RW.PARAMETRO03
					,RW.PARAMETRO04
					,RW.PARAMETRO05
					,RW.PARAMETRO06
					,RW.PARAMETRO07
					,RW.PARAMETRO08
					,RW.DESTINATARIO
					,sysdate
					,vDATA_NOTIFICACAO
					,null
					,vDATA_ANULACAO
					,vDATA_REGISTO
					,null
					,null
					,'ELEMINADA'
					,'GARANTIA ELEMINADA POR ELIMINAÇÃO DA APÓLICE'
					)
				;

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
					,RW.MODELO_ID
					,NULL
					,sysdate
					,NULL
					,'IMPRIME_GARANTIAS: GARANTIA ELEMINADA POR ELIMINAÇÃO DA APÓLICE'
					,RW.DOCUMENTO_ID
					);

				COMMIT;


			ELSE

				SELECT NVL(MAX(ACESSO), 0) ACESSOS --numero de acessos válidos
					,DECODE(NVL(MAX(ACESSO), 0),0,null,MAX(FECHACCES)) FECHACCES -- data mais antiga com acesso válido
					,NVL(MAX(restricoes), 0) RESTRICOES 
					,NVL(MAX(FEFINACC),to_date('31122200','ddmmyyyy')) FEFINACC -- data mais recente da anulação ao acesso da funcionalidade
				INTO vACESSOS
					,vDATA_ACESSO
					,vRESTRICOES
					,vDATA_RESTRICAO
				FROM (
					SELECT SUM(DECODE(F76.SWACCESO, 'S', 1, 0)) acesso
						,min(TRUNC(FECHACCES)) FECHACCES
						,SUM(DECODE(F76.SWACCESO, 'N', 1, 0)) restricoes
						,max(TRUNC(FEFINACC)) FEFINACC
					FROM co_usupolfu F76
					WHERE 1 = 1
						AND F76.cdfuncion = '76'
						AND F76.nmpoliza = RW.PARAMETRO04
						AND F76.CDRAMO = RW.PARAMETRO06
						AND F76.CDUNIECO = RW.PARAMETRO05
						and vDATA_DIA between FECHACCES and NVL(FEFINACC,to_date('31122200','ddmmyyyy'))
					GROUP BY CDUNIECO
						,CDRAMO
						,NMPOLIZA
					);


				IF RW.MODELO_ID in ('R3.D25R','R3.D28R') AND (vDATA_ACESSO is null) THEN

					SELECT MAX(trunc(APOLICE.FEEMISIO)) FEEMISIO
						,MAX(trunc(APOLICE.FEEFECTO)) FEEFECTO
					INTO vFEEMISIO
						,vFEEFECTO
					FROM mpolizas APOLICE
					WHERE APOLICE.ESTADO = 'M'
						AND APOLICE.nmpoliza = RW.PARAMETRO04
						AND APOLICE.CDRAMO = RW.PARAMETRO06
						AND APOLICE.CDUNIECO = RW.PARAMETRO05
						AND APOLICE.NMSUPLEM = (
							SELECT MIN(NMSUPLEM)
							FROM MPOLIZAS X
							WHERE X.CDUNIECO = APOLICE.CDUNIECO
								AND X.CDRAMO = APOLICE.CDRAMO
								AND X.ESTADO = APOLICE.ESTADO
								AND X.NMPOLIZA = APOLICE.NMPOLIZA
								--AND X.NMSUPLEM <= TO_CHAR(RW.P_DATAACTUAL, 'J') || '99999999999'
							)
					GROUP BY APOLICE.CDUNIECO
						,APOLICE.CDRAMO
						,APOLICE.nmpoliza;

					IF (trunc(vDATA_DIA) - GREATEST(NVL(trunc(vFEEMISIO), NVL(trunc(vFEEFECTO), trunc(vDATA_DIA))), NVL(trunc(vFEEFECTO), NVL(trunc(vFEEMISIO), trunc(vDATA_DIA)))) >  vPG) AND (TRUNC(vDATA_DIA) != TRUNC(vDATA_ANULACAO)) THEN

						--IF TRUNC(vDATA_DIA) - TRUNC(RW.DATA_PEDIDO) > 10 THEN

							UPDATE SVR_DOCUMENTOS
							SET DISPONIVEL_RF = 'ONL'
							WHERE id = RW.DOCUMENTO_ID;

							INSERT INTO T_GARANTS_IMPRIME (
								ID
								,MODELO_ID
								,LOTE_ORDEM
								,LOTE_ID
								,N_REFERENCIA
								,DATA_PEDIDO
								,DATA_EXECUCAO
								,PARAMETRO01
								,PARAMETRO02
								,PARAMETRO03
								,PARAMETRO04
								,PARAMETRO05
								,PARAMETRO06
								,PARAMETRO07
								,PARAMETRO08
								,DESTINATARIO
								,DATA_PROCESSAMENTO
								,DATA_NOTIFICACAO
								,DATA_ACESSO
								,DATA_ANULACAO
								,DATA_REGISTO
								,DATA_EMISSAO_APOLICE
								,DATA_VIG_APOLICE
								,SWIMPRESSO
								,OBSERVACAO
								)
							VALUES (
								RW.DOCUMENTO_ID
								,RW.MODELO_ID
								,RW.LOTE_ORDEM
								,RW.LOTE_ID
								,RW.N_REFERENCIA
								,RW.DATA_PEDIDO
								,RW.DATA_EXECUCAO
								,RW.PARAMETRO01
								,RW.PARAMETRO02
								,RW.PARAMETRO03
								,RW.PARAMETRO04
								,RW.PARAMETRO05
								,RW.PARAMETRO06
								,RW.PARAMETRO07
								,RW.PARAMETRO08
								,RW.DESTINATARIO
								,sysdate
								,vDATA_NOTIFICACAO
								,vDATA_ACESSO
								,vDATA_ANULACAO
								,vDATA_REGISTO
								,vFEEMISIO
								,vFEEFECTO
								,'IMPRESSO'
								,'GARANTIA REGISTADA RESGATADA PARA IMPRESSAO - SEM F76 e FALHOU PRAZO DE NOTIFICAÇÃO!'
								)
							;

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
								,RW.MODELO_ID
								,NULL
								,sysdate
								,NULL
								,'IMPRIME_GARANTIAS: GARANTIA REGISTADA RESGATADA PARA IMPRESSAO - SEM F76 e FALHOU PRAZO DE NOTIFICAÇÃO!'
								,RW.DOCUMENTO_ID
								);

							commit;

						--END IF;
					END IF;

					IF TRUNC(vDATA_DIA) = TRUNC(vDATA_ANULACAO) THEN

						UPDATE SVR_DOCUMENTOS
						SET DISPONIVEL_RF = 'ONL'
						WHERE id = RW.DOCUMENTO_ID;

						INSERT INTO T_GARANTS_IMPRIME (
							ID
							,MODELO_ID
							,LOTE_ORDEM
							,LOTE_ID
							,N_REFERENCIA
							,DATA_PEDIDO
							,DATA_EXECUCAO
							,PARAMETRO01
							,PARAMETRO02
							,PARAMETRO03
							,PARAMETRO04
							,PARAMETRO05
							,PARAMETRO06
							,PARAMETRO07
							,PARAMETRO08
							,DESTINATARIO
							,DATA_PROCESSAMENTO
							,DATA_NOTIFICACAO
							,DATA_ACESSO
							,DATA_ANULACAO
							,DATA_REGISTO
							,DATA_EMISSAO_APOLICE
							,DATA_VIG_APOLICE
							,SWIMPRESSO
							,OBSERVACAO
							)
						VALUES (
							RW.DOCUMENTO_ID
							,RW.MODELO_ID
							,RW.LOTE_ORDEM
							,RW.LOTE_ID
							,RW.N_REFERENCIA
							,RW.DATA_PEDIDO
							,RW.DATA_EXECUCAO
							,RW.PARAMETRO01
							,RW.PARAMETRO02
							,RW.PARAMETRO03
							,RW.PARAMETRO04
							,RW.PARAMETRO05
							,RW.PARAMETRO06
							,RW.PARAMETRO07
							,RW.PARAMETRO08
							,RW.DESTINATARIO
							,sysdate
							,vDATA_NOTIFICACAO
							,vDATA_ACESSO
							,vDATA_ANULACAO
							,vDATA_REGISTO
							,null
							,null
							,'IMPRESSO'
							,'GARANTIA REGISTADA RESGATADA PARA IMPRESSAO - FALHOU PRAZO DE NOTIFICAÇÃO ANTES DA ANULAÇÃO DA APÓLICE!'
							)
						;

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
							,RW.MODELO_ID
							,NULL
							,sysdate
							,NULL
							,'IMPRIME_GARANTIAS: GARANTIA REGISTADA RESGATADA PARA IMPRESSAO - FALHOU PRAZO DE NOTIFICAÇÃO ANTES DA ANULAÇÃO DA APÓLICE!'
							,RW.DOCUMENTO_ID
							);

						commit;

					END IF;

				ELSIF RW.MODELO_ID in ('R3.D25R','R3.D28R') AND (vDATA_ACESSO is not  null and TRUNC(vDATA_ACESSO) > TRUNC(RW.DATA_PEDIDO)) THEN

					SELECT MAX(trunc(APOLICE.FEEMISIO)) FEEMISIO
						,MAX(trunc(APOLICE.FEEFECTO)) FEEFECTO
					INTO vFEEMISIO
						,vFEEFECTO
					FROM mpolizas APOLICE
					WHERE APOLICE.ESTADO = 'M'
						AND APOLICE.nmpoliza = RW.PARAMETRO04
						AND APOLICE.CDRAMO = RW.PARAMETRO06
						AND APOLICE.CDUNIECO = RW.PARAMETRO05
						AND APOLICE.NMSUPLEM = (
							SELECT MIN(NMSUPLEM)
							FROM MPOLIZAS X
							WHERE X.CDUNIECO = APOLICE.CDUNIECO
								AND X.CDRAMO = APOLICE.CDRAMO
								AND X.ESTADO = APOLICE.ESTADO
								AND X.NMPOLIZA = APOLICE.NMPOLIZA
								--AND X.NMSUPLEM <= TO_CHAR(RW.P_DATAACTUAL, 'J') || '99999999999'
							)
					GROUP BY APOLICE.CDUNIECO
						,APOLICE.CDRAMO
						,APOLICE.nmpoliza;

					IF (trunc(vDATA_DIA) - GREATEST(NVL(trunc(vFEEMISIO), NVL(trunc(vFEEFECTO), trunc(vDATA_DIA))), NVL(trunc(vFEEFECTO), NVL(trunc(vFEEMISIO), trunc(vDATA_DIA)))) >  vPG) AND (TRUNC(vDATA_DIA) != TRUNC(vDATA_ANULACAO)) 
						and ( GREATEST(NVL(trunc(vFEEMISIO), NVL(trunc(vFEEFECTO), trunc(vDATA_ACESSO))), NVL(trunc(vFEEFECTO), NVL(trunc(vFEEMISIO), trunc(vDATA_ACESSO)))) + vPG <  trunc(vDATA_ACESSO) ) THEN

						IF TRUNC(vDATA_DIA) - TRUNC(RW.DATA_PEDIDO) > vLN THEN 

							UPDATE SVR_DOCUMENTOS
							SET DISPONIVEL_RF = 'ONL'
							WHERE id = RW.DOCUMENTO_ID;

							INSERT INTO T_GARANTS_IMPRIME (
								ID
								,MODELO_ID
								,LOTE_ORDEM
								,LOTE_ID
								,N_REFERENCIA
								,DATA_PEDIDO
								,DATA_EXECUCAO
								,PARAMETRO01
								,PARAMETRO02
								,PARAMETRO03
								,PARAMETRO04
								,PARAMETRO05
								,PARAMETRO06
								,PARAMETRO07
								,PARAMETRO08
								,DESTINATARIO
								,DATA_PROCESSAMENTO
								,DATA_NOTIFICACAO
								,DATA_ACESSO
								,DATA_ANULACAO
								,DATA_REGISTO
								,DATA_EMISSAO_APOLICE
								,DATA_VIG_APOLICE
								,SWIMPRESSO
								,OBSERVACAO
								)
							VALUES (
								RW.DOCUMENTO_ID
								,RW.MODELO_ID
								,RW.LOTE_ORDEM
								,RW.LOTE_ID
								,RW.N_REFERENCIA
								,RW.DATA_PEDIDO
								,RW.DATA_EXECUCAO
								,RW.PARAMETRO01
								,RW.PARAMETRO02
								,RW.PARAMETRO03
								,RW.PARAMETRO04
								,RW.PARAMETRO05
								,RW.PARAMETRO06
								,RW.PARAMETRO07
								,RW.PARAMETRO08
								,RW.DESTINATARIO
								,sysdate
								,vDATA_NOTIFICACAO
								,vDATA_ACESSO
								,vDATA_ANULACAO
								,vDATA_REGISTO
								,vFEEMISIO
								,vFEEFECTO
								,'IMPRESSO'
								,'GARANTIA REGISTADA RESGATADA PARA IMPRESSAO - FALHOU PRAZO DE NOTIFICAÇÃO!'
								)
							;

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
								,RW.MODELO_ID
								,NULL
								,sysdate
								,NULL
								,'IMPRIME_GARANTIAS: GARANTIA REGISTADA RESGATADA PARA IMPRESSAO - FALHOU PRAZO DE NOTIFICAÇÃO!'
								,RW.DOCUMENTO_ID
								);

							commit;

						END IF;
					END IF;

					IF TRUNC(vDATA_DIA) = TRUNC(vDATA_ANULACAO) THEN

						UPDATE SVR_DOCUMENTOS
						SET DISPONIVEL_RF = 'ONL'
						WHERE id = RW.DOCUMENTO_ID;

						INSERT INTO T_GARANTS_IMPRIME (
							ID
							,MODELO_ID
							,LOTE_ORDEM
							,LOTE_ID
							,N_REFERENCIA
							,DATA_PEDIDO
							,DATA_EXECUCAO
							,PARAMETRO01
							,PARAMETRO02
							,PARAMETRO03
							,PARAMETRO04
							,PARAMETRO05
							,PARAMETRO06
							,PARAMETRO07
							,PARAMETRO08
							,DESTINATARIO
							,DATA_PROCESSAMENTO
							,DATA_NOTIFICACAO
							,DATA_ACESSO
							,DATA_ANULACAO
							,DATA_REGISTO
							,DATA_EMISSAO_APOLICE
							,DATA_VIG_APOLICE
							,SWIMPRESSO
							,OBSERVACAO
							)
						VALUES (
							RW.DOCUMENTO_ID
							,RW.MODELO_ID
							,RW.LOTE_ORDEM
							,RW.LOTE_ID
							,RW.N_REFERENCIA
							,RW.DATA_PEDIDO
							,RW.DATA_EXECUCAO
							,RW.PARAMETRO01
							,RW.PARAMETRO02
							,RW.PARAMETRO03
							,RW.PARAMETRO04
							,RW.PARAMETRO05
							,RW.PARAMETRO06
							,RW.PARAMETRO07
							,RW.PARAMETRO08
							,RW.DESTINATARIO
							,sysdate
							,vDATA_NOTIFICACAO
							,vDATA_ACESSO
							,vDATA_ANULACAO
							,vDATA_REGISTO
							,null
							,null
							,'IMPRESSO'
							,'GARANTIA REGISTADA RESGATADA PARA IMPRESSAO - FALHOU PRAZO DE NOTIFICAÇÃO ANTES DA ANULAÇÃO DA APÓLICE!'
							)
						;

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
							,RW.MODELO_ID
							,NULL
							,sysdate
							,NULL
							,'IMPRIME_GARANTIAS: GARANTIA REGISTADA RESGATADA PARA IMPRESSAO - FALHOU PRAZO DE NOTIFICAÇÃO ANTES DA ANULAÇÃO DA APÓLICE!'
							,RW.DOCUMENTO_ID
							);

						commit;

					END IF;

				ELSIF RW.MODELO_ID in ('R3.D25R','R3.D28R') AND (vDATA_ACESSO is not  null and TRUNC(vDATA_ACESSO) <= TRUNC(RW.DATA_PEDIDO)) THEN

					IF TRUNC(vDATA_DIA) - TRUNC(RW.DATA_PEDIDO) > vLN THEN 

							UPDATE SVR_DOCUMENTOS
							SET DISPONIVEL_RF = 'ONL'
							WHERE id = RW.DOCUMENTO_ID;

							INSERT INTO T_GARANTS_IMPRIME (
								ID
								,MODELO_ID
								,LOTE_ORDEM
								,LOTE_ID
								,N_REFERENCIA
								,DATA_PEDIDO
								,DATA_EXECUCAO
								,PARAMETRO01
								,PARAMETRO02
								,PARAMETRO03
								,PARAMETRO04
								,PARAMETRO05
								,PARAMETRO06
								,PARAMETRO07
								,PARAMETRO08
								,DESTINATARIO
								,DATA_PROCESSAMENTO
								,DATA_NOTIFICACAO
								,DATA_ACESSO
								,DATA_ANULACAO
								,DATA_REGISTO
								,DATA_EMISSAO_APOLICE
								,DATA_VIG_APOLICE
								,SWIMPRESSO
								,OBSERVACAO
								)
							VALUES (
								RW.DOCUMENTO_ID
								,RW.MODELO_ID
								,RW.LOTE_ORDEM
								,RW.LOTE_ID
								,RW.N_REFERENCIA
								,RW.DATA_PEDIDO
								,RW.DATA_EXECUCAO
								,RW.PARAMETRO01
								,RW.PARAMETRO02
								,RW.PARAMETRO03
								,RW.PARAMETRO04
								,RW.PARAMETRO05
								,RW.PARAMETRO06
								,RW.PARAMETRO07
								,RW.PARAMETRO08
								,RW.DESTINATARIO
								,sysdate
								,vDATA_NOTIFICACAO
								,vDATA_ACESSO
								,vDATA_ANULACAO
								,vDATA_REGISTO
								,vFEEMISIO
								,vFEEFECTO
								,'IMPRESSO'
								,'GARANTIA REGISTADA RESGATADA PARA IMPRESSAO - FALHOU PRAZO DE NOTIFICAÇÃO!'
								)
							;

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
								,RW.MODELO_ID
								,NULL
								,sysdate
								,NULL
								,'IMPRIME_GARANTIAS: GARANTIA REGISTADA RESGATADA PARA IMPRESSAO - FALHOU PRAZO DE NOTIFICAÇÃO!'
								,RW.DOCUMENTO_ID
								);

							commit;

						END IF;

				ELSIF RW.MODELO_ID in ('R3.D25','R3.D28') AND (vDATA_ACESSO is null ) THEN

					SELECT MAX(trunc(APOLICE.FEEMISIO)) FEEMISIO
						,MAX(trunc(APOLICE.FEEFECTO)) FEEFECTO
					INTO vFEEMISIO
						,vFEEFECTO
					FROM mpolizas APOLICE
					WHERE APOLICE.ESTADO = 'M'
						AND APOLICE.nmpoliza = RW.PARAMETRO04
						AND APOLICE.CDRAMO = RW.PARAMETRO06
						AND APOLICE.CDUNIECO = RW.PARAMETRO05
						AND APOLICE.NMSUPLEM = (
							SELECT MIN(NMSUPLEM)
							FROM MPOLIZAS X
							WHERE X.CDUNIECO = APOLICE.CDUNIECO
								AND X.CDRAMO = APOLICE.CDRAMO
								AND X.ESTADO = APOLICE.ESTADO
								AND X.NMPOLIZA = APOLICE.NMPOLIZA
								--AND X.NMSUPLEM <= TO_CHAR(RW.P_DATAACTUAL, 'J') || '99999999999'
							)
					GROUP BY APOLICE.CDUNIECO
						,APOLICE.CDRAMO
						,APOLICE.nmpoliza;

					IF trunc(vDATA_DIA) - GREATEST(NVL(trunc(vFEEMISIO), NVL(trunc(vFEEFECTO), trunc(vDATA_DIA))), NVL(trunc(vFEEFECTO), NVL(trunc(vFEEMISIO), trunc(vDATA_DIA)))) >  vPG and vRESTRICOES = 0 THEN

						UPDATE SVR_DOCUMENTOS
						SET DISPONIVEL_RF = 'ONL'
						WHERE id = RW.DOCUMENTO_ID;

						INSERT INTO T_GARANTS_IMPRIME (
							ID
							,MODELO_ID
							,LOTE_ORDEM
							,LOTE_ID
							,N_REFERENCIA
							,DATA_PEDIDO
							,DATA_EXECUCAO
							,PARAMETRO01
							,PARAMETRO02
							,PARAMETRO03
							,PARAMETRO04
							,PARAMETRO05
							,PARAMETRO06
							,PARAMETRO07
							,PARAMETRO08
							,DESTINATARIO
							,DATA_PROCESSAMENTO
							,DATA_NOTIFICACAO
							,DATA_ACESSO
							,DATA_ANULACAO
							,DATA_REGISTO
							,DATA_EMISSAO_APOLICE
							,DATA_VIG_APOLICE
							,SWIMPRESSO
							,OBSERVACAO
							)
						VALUES (
							RW.DOCUMENTO_ID
							,RW.MODELO_ID
							,RW.LOTE_ORDEM
							,RW.LOTE_ID
							,RW.N_REFERENCIA
							,RW.DATA_PEDIDO
							,RW.DATA_EXECUCAO
							,RW.PARAMETRO01
							,RW.PARAMETRO02
							,RW.PARAMETRO03
							,RW.PARAMETRO04
							,RW.PARAMETRO05
							,RW.PARAMETRO06
							,RW.PARAMETRO07
							,RW.PARAMETRO08
							,RW.DESTINATARIO
							,sysdate
							,vDATA_NOTIFICACAO
							,vDATA_ACESSO
							,vDATA_ANULACAO
							,vDATA_REGISTO
							,vFEEMISIO
							,vFEEFECTO
							,'IMPRESSO'
							,'GARANTIA RESGATADA PARA IMPRESSAO - SEM F76_1! - FALHOU PRAZO DE NOTIFICAÇÃO APÓS PERIODO DE GRAÇA!'
							)
						;

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
							,RW.MODELO_ID
							,NULL
							,sysdate
							,NULL
							,'IMPRIME_GARANTIAS: GARANTIA RESGATADA PARA IMPRESSAO - SEM F76_1! - FALHOU PRAZO DE NOTIFICAÇÃO APÓS PERIODO DE GRAÇA!'
							,RW.DOCUMENTO_ID
							);

						commit;

					END IF;

					IF trunc(vDATA_DIA) - GREATEST(NVL(trunc(vFEEMISIO), NVL(trunc(vFEEFECTO), trunc(vDATA_DIA))), NVL(trunc(vFEEFECTO), NVL(trunc(vFEEMISIO), trunc(vDATA_DIA)))) >  vPG and vRESTRICOES > 0
						and  vDATA_RESTRICAO < RW.DATA_PEDIDO THEN

						UPDATE SVR_DOCUMENTOS
						SET DISPONIVEL_RF = 'ONL'
						WHERE id = RW.DOCUMENTO_ID;

						INSERT INTO T_GARANTS_IMPRIME (
							ID
							,MODELO_ID
							,LOTE_ORDEM
							,LOTE_ID
							,N_REFERENCIA
							,DATA_PEDIDO
							,DATA_EXECUCAO
							,PARAMETRO01
							,PARAMETRO02
							,PARAMETRO03
							,PARAMETRO04
							,PARAMETRO05
							,PARAMETRO06
							,PARAMETRO07
							,PARAMETRO08
							,DESTINATARIO
							,DATA_PROCESSAMENTO
							,DATA_NOTIFICACAO
							,DATA_ACESSO
							,DATA_ANULACAO
							,DATA_REGISTO
							,DATA_EMISSAO_APOLICE
							,DATA_VIG_APOLICE
							,SWIMPRESSO
							,OBSERVACAO
							)
						VALUES (
							RW.DOCUMENTO_ID
							,RW.MODELO_ID
							,RW.LOTE_ORDEM
							,RW.LOTE_ID
							,RW.N_REFERENCIA
							,RW.DATA_PEDIDO
							,RW.DATA_EXECUCAO
							,RW.PARAMETRO01
							,RW.PARAMETRO02
							,RW.PARAMETRO03
							,RW.PARAMETRO04
							,RW.PARAMETRO05
							,RW.PARAMETRO06
							,RW.PARAMETRO07
							,RW.PARAMETRO08
							,RW.DESTINATARIO
							,sysdate
							,vDATA_NOTIFICACAO
							,vDATA_ACESSO
							,vDATA_ANULACAO
							,vDATA_REGISTO
							,vFEEMISIO
							,vFEEFECTO
							,'IMPRESSO'
							,'GARANTIA RESGATADA PARA IMPRESSAO - SEM F76_2! - FALHOU PRAZO DE NOTIFICAÇÃO APÓS PERIODO DE GRAÇA!'
							)
						;

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
							,RW.MODELO_ID
							,NULL
							,sysdate
							,NULL
							,'IMPRIME_GARANTIAS: GARANTIA RESGATADA PARA IMPRESSAO - SEM F76_2! - FALHOU PRAZO DE NOTIFICAÇÃO APÓS PERIODO DE GRAÇA!'
							,RW.DOCUMENTO_ID
							);

						commit;

					END IF;

				ELSIF RW.MODELO_ID in ('R3.D25','R3.D28') AND (TRUNC(vDATA_ACESSO) > TRUNC(RW.DATA_PEDIDO)) THEN

					SELECT MAX(trunc(APOLICE.FEEMISIO)) FEEMISIO
						,MAX(trunc(APOLICE.FEEFECTO)) FEEFECTO
					INTO vFEEMISIO
						,vFEEFECTO
					FROM mpolizas APOLICE
					WHERE APOLICE.ESTADO = 'M'
						AND APOLICE.nmpoliza = RW.PARAMETRO04
						AND APOLICE.CDRAMO = RW.PARAMETRO06
						AND APOLICE.CDUNIECO = RW.PARAMETRO05
						AND APOLICE.NMSUPLEM = (
							SELECT MIN(NMSUPLEM)
							FROM MPOLIZAS X
							WHERE X.CDUNIECO = APOLICE.CDUNIECO
								AND X.CDRAMO = APOLICE.CDRAMO
								AND X.ESTADO = APOLICE.ESTADO
								AND X.NMPOLIZA = APOLICE.NMPOLIZA
								--AND X.NMSUPLEM <= TO_CHAR(RW.P_DATAACTUAL, 'J') || '99999999999'
							)
					GROUP BY APOLICE.CDUNIECO
						,APOLICE.CDRAMO
						,APOLICE.nmpoliza;

					IF trunc(vDATA_DIA) - GREATEST(NVL(trunc(vFEEMISIO), NVL(trunc(vFEEFECTO), trunc(vDATA_DIA))), NVL(trunc(vFEEFECTO), NVL(trunc(vFEEMISIO), trunc(vDATA_DIA)))) >  vPG 
						and  ( GREATEST(NVL(trunc(vFEEMISIO), NVL(trunc(vFEEFECTO), trunc(vDATA_ACESSO))), NVL(trunc(vFEEFECTO), NVL(trunc(vFEEMISIO), trunc(vDATA_ACESSO)))) + vPG <  trunc(vDATA_ACESSO) ) THEN

						UPDATE SVR_DOCUMENTOS
						SET DISPONIVEL_RF = 'ONL'
						WHERE id = RW.DOCUMENTO_ID;

						INSERT INTO T_GARANTS_IMPRIME (
							ID
							,MODELO_ID
							,LOTE_ORDEM
							,LOTE_ID
							,N_REFERENCIA
							,DATA_PEDIDO
							,DATA_EXECUCAO
							,PARAMETRO01
							,PARAMETRO02
							,PARAMETRO03
							,PARAMETRO04
							,PARAMETRO05
							,PARAMETRO06
							,PARAMETRO07
							,PARAMETRO08
							,DESTINATARIO
							,DATA_PROCESSAMENTO
							,DATA_NOTIFICACAO
							,DATA_ACESSO
							,DATA_ANULACAO
							,DATA_REGISTO
							,DATA_EMISSAO_APOLICE
							,DATA_VIG_APOLICE
							,SWIMPRESSO
							,OBSERVACAO
							)
						VALUES (
							RW.DOCUMENTO_ID
							,RW.MODELO_ID
							,RW.LOTE_ORDEM
							,RW.LOTE_ID
							,RW.N_REFERENCIA
							,RW.DATA_PEDIDO
							,RW.DATA_EXECUCAO
							,RW.PARAMETRO01
							,RW.PARAMETRO02
							,RW.PARAMETRO03
							,RW.PARAMETRO04
							,RW.PARAMETRO05
							,RW.PARAMETRO06
							,RW.PARAMETRO07
							,RW.PARAMETRO08
							,RW.DESTINATARIO
							,sysdate
							,vDATA_NOTIFICACAO
							,vDATA_ACESSO
							,vDATA_ANULACAO
							,vDATA_REGISTO
							,vFEEMISIO
							,vFEEFECTO
							,'IMPRESSO'
							,'GARANTIA RESGATADA PARA IMPRESSAO - FALHOU PRAZO DE NOTIFICAÇÃO APÓS PERIODO DE GRAÇA!'
							)
						;

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
							,RW.MODELO_ID
							,NULL
							,sysdate
							,NULL
							,'IMPRIME_GARANTIAS: GARANTIA RESGATADA PARA IMPRESSAO - FALHOU PRAZO DE NOTIFICAÇÃO APÓS PERIODO DE GRAÇA!'
							,RW.DOCUMENTO_ID
							);

						commit;

					END IF;

				END IF;

			END IF;

			EXCEPTION
				WHEN NO_DATA_FOUND THEN

					UPDATE SVR_DOCUMENTOS
						SET arquivado = 'S'
						,DATA_ARQUIVO = TRUNC(SYSDATE)
						,DISPONIVEL_RF = 'EDC'
					WHERE ID = RW.DOCUMENTO_ID;

					INSERT INTO T_GARANTS_IMPRIME (
						ID
						,MODELO_ID
						,LOTE_ORDEM
						,LOTE_ID
						,N_REFERENCIA
						,DATA_PEDIDO
						,DATA_EXECUCAO
						,PARAMETRO01
						,PARAMETRO02
						,PARAMETRO03
						,PARAMETRO04
						,PARAMETRO05
						,PARAMETRO06
						,PARAMETRO07
						,PARAMETRO08
						,DESTINATARIO
						,DATA_PROCESSAMENTO
						,DATA_NOTIFICACAO
						,DATA_ACESSO
						,DATA_ANULACAO
						,DATA_REGISTO
						,DATA_EMISSAO_APOLICE
						,DATA_VIG_APOLICE
						,SWIMPRESSO
						,OBSERVACAO
						)
					VALUES (
						RW.DOCUMENTO_ID
						,RW.MODELO_ID
						,RW.LOTE_ORDEM
						,RW.LOTE_ID
						,RW.N_REFERENCIA
						,RW.DATA_PEDIDO
						,RW.DATA_EXECUCAO
						,RW.PARAMETRO01
						,RW.PARAMETRO02
						,RW.PARAMETRO03
						,RW.PARAMETRO04
						,RW.PARAMETRO05
						,RW.PARAMETRO06
						,RW.PARAMETRO07
						,RW.PARAMETRO08
						,RW.DESTINATARIO
						,sysdate
						,vDATA_NOTIFICACAO
						,vDATA_ACESSO
						,vDATA_ANULACAO
						,vDATA_REGISTO
						,vFEEMISIO
						,vFEEFECTO
						,'ERRO'
						,'GARANTIA INEXISTENTE NO SISTEMA'
						)
					;

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
							,RW.MODELO_ID
							,NULL
							,sysdate
							,NULL
							,'IMPRIME_GARANTIAS: GARANTIA INEXISTENTE NO SISTEMA'
							,RW.DOCUMENTO_ID
							);

					commit;

		END;   

	END LOOP;

    DBMS_STATS.GATHER_TABLE_STATS(ownname => '"DISCOSEC"', tabname => '"T_GARANTS_IMPRIME"', estimate_percent => 100);
    DBMS_STATS.GATHER_INDEX_STATS('"DISCOSEC"', '"PK_GAR_IMP"', estimate_percent => 100);


END IMPRIME_GARANTIAS;

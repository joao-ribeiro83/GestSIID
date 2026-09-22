-- ENVIA_EMAILS_O2_OD73 (owner: SIID_TESTES)


-- ===== PROCEDURE =====

PROCEDURE
  ENVIA_EMAILS_O2_OD73
IS
  	CURSOR TOMADORES is
		SELECT cdunieco
			,cdperson
			,email
		FROM (
			SELECT cdunieco
				,cdperson
				,LISTAGG(email, ',') WITHIN
			GROUP (
					ORDER BY cdperson
					) AS email
			FROM (
				SELECT cdunieco
					,cdperson
					,email
				FROM (
					SELECT cdunieco
						,cdperson
						,email
					FROM (
						SELECT 
							Apolice.cdunieco
							,Obras.CDRAMO RAMO
							,Apolice.nmpoliza
							,Obras.cdpersot cdperson
							,tcau.email
						FROM gd_tom_caucao_inf_p tcau
							,co_contra Obras
							,mpoliper TomadorApol
							,mpolizas Apolice
						WHERE 1 = 1
							AND tcau.swemailvalido = 'S'
							--AND tcau.swenvianotif = 'S'
							AND Obras.cdpersot = tcau.cdperson
							AND Apolice.cdunieco = TomadorApol.cdunieco
							AND Apolice.cdramo = TomadorApol.cdramo
							AND Apolice.estado = TomadorApol.estado
							AND Apolice.nmpoliza = TomadorApol.nmpoliza
							AND nvl(PKG_FORMULAS_COSEC.GET_DT_ANULACAO_APOLICE(APOLICE.CDUNIECO, APOLICE.CDRAMO, APOLICE.NMPOLIZA), trunc(sysdate)) >= trunc(sysdate)
							AND Apolice.nmsuplem = (
								SELECT Max(ApoliceA.nmsuplem)
								FROM mpolizas ApoliceA
								WHERE ApoliceA.estado = Apolice.estado
									AND ApoliceA.nmsuplem <= TO_CHAR(trunc(sysdate), 'J') || '99999999999'
									AND ApoliceA.cdramo = Apolice.cdramo
									AND ApoliceA.cdunieco = Apolice.cdunieco
									AND ApoliceA.nmpoliza = Apolice.nmpoliza
								)
							AND TomadorApol.cdperson = Obras.cdpersot
							AND TomadorApol.estado = 'M'
							AND TomadorApol.cdramo = Obras.cdramo
							AND TomadorApol.STATUS = 'V'
							AND TomadorApol.nmsituac = 0
							AND TomadorApol.cdrol = 'TO'
							AND TomadorApol.nmsuplem = (
								SELECT MAX(MpoliperA.nmsuplem)
								FROM mpoliper MpoliperA
								WHERE MpoliperA.cdrol = TomadorApol.cdrol
									AND MpoliperA.nmsuplem <= TO_CHAR(trunc(sysdate), 'J') || '99999999999'
									AND MpoliperA.cdperson = TomadorApol.cdperson
									AND MpoliperA.nmpoliza = TomadorApol.nmpoliza
									AND MpoliperA.cdrol = TomadorApol.cdrol
									AND MpoliperA.nmsituac = TomadorApol.nmsituac
									AND MpoliperA.estado = TomadorApol.estado
									AND MpoliperA.cdramo = TomadorApol.cdramo
									AND MpoliperA.cdunieco = TomadorApol.cdunieco
								)
							AND Obras.cdramo LIKE '2%'
						)
					
					UNION ALL
					
					SELECT cdunieco
						,cdperson
						,email
					FROM (
						SELECT /*+ ordered */
							Apolice.cdunieco
							,Obras.CDRAMO RAMO
							,Apolice.nmpoliza
							,EntGrupo.cdperfil cdperson
							,tcau.email
						FROM gd_tom_caucao_inf_p tcau
							,co_entirel EntGrupo
							,co_contra Obras
							,mpersona Persona
							,mpoliper TomadorApol
							,mpolizas Apolice
						WHERE 1 = 1
							AND tcau.swemailvalido = 'S'
							--AND tcau.swenvianotif = 'S'
							AND EntGrupo.cdperfil = tcau.cdperson
							AND Obras.cdpersot = EntGrupo.cdperpai
							AND Persona.cdperson = EntGrupo.cdperpai
							AND Persona.cdtipide = 3
							AND EntGrupo.cdperpai != 0
							AND Apolice.cdunieco = TomadorApol.cdunieco
							AND Apolice.cdramo = TomadorApol.cdramo
							AND Apolice.estado = TomadorApol.estado
							AND Apolice.nmpoliza = TomadorApol.nmpoliza
							AND PKG_FORMULAS_COSEC.IS_APOLICE_VALIDA(Apolice.CDUNIECO, APOLICE.CDRAMO, APOLICE.ESTADO, APOLICE.NMPOLIZA) = 'S'
							AND Apolice.nmsuplem = (
								SELECT Max(ApoliceA.nmsuplem)
								FROM mpolizas ApoliceA
								WHERE ApoliceA.estado = Apolice.estado
									AND ApoliceA.nmsuplem <= TO_CHAR(trunc(sysdate), 'J') || '99999999999'
									AND ApoliceA.cdramo = Apolice.cdramo
									AND ApoliceA.cdunieco = Apolice.cdunieco
									AND ApoliceA.nmpoliza = Apolice.nmpoliza
								)
							AND TomadorApol.cdperson = Obras.cdpersot
							AND TomadorApol.estado = 'M'
							AND TomadorApol.cdramo = Obras.cdramo
							AND TomadorApol.STATUS = 'V'
							AND TomadorApol.nmsituac = 0
							AND TomadorApol.cdrol = 'TO'
							AND TomadorApol.nmsuplem = (
								SELECT MAX(MpoliperA.nmsuplem)
								FROM mpoliper MpoliperA
								WHERE MpoliperA.cdrol = TomadorApol.cdrol
									AND MpoliperA.nmsuplem <= TO_CHAR(trunc(sysdate), 'J') || '99999999999'
									AND MpoliperA.cdperson = TomadorApol.cdperson
									AND MpoliperA.nmpoliza = TomadorApol.nmpoliza
									AND MpoliperA.cdrol = TomadorApol.cdrol
									AND MpoliperA.nmsituac = TomadorApol.nmsituac
									AND MpoliperA.estado = TomadorApol.estado
									AND MpoliperA.cdramo = TomadorApol.cdramo
									AND MpoliperA.cdunieco = TomadorApol.cdunieco
								)
							AND Obras.cdramo LIKE '2%'
						)
					)
				GROUP BY cdunieco
					,cdperson
					,email
				ORDER BY cdunieco
					,cdperson
					,email
				)
			GROUP BY cdunieco
				,cdperson
			);


	nTexto err_erros_siid.descricao%type;
	nAmbiente svr_variaveis_siid.ambiente_id%type;

BEGIN

	select ambiente_id
    into nAmbiente
    from svr_variaveis_siid
    where tipo_variavel_rf = 'ONLINE';

	FOR RW in TOMADORES loop

		nTexto := '' || RW.CDUNIECO || ' ' || RW.CDPERSON || ' ' || SYSDATE || ' ' || 'ADMINISTRADOR' || ' ' || RW.EMAIL;

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
			,'ERRO_EXE'
			,'O2.OD73'
			,null
			,sysdate
			,1
			,nTexto
			,null
			);

		PKG_DOCUMENTOS_SVR.SET_PARAMETRO_STRING('_USER', nAmbiente);
		PKG_DOCUMENTOS_SVR.SET_PARAMETRO_NUMERO('P_CDUNIECO', RW.CDUNIECO);	
		PKG_DOCUMENTOS_SVR.SET_PARAMETRO_NUMERO('P_CDPERSON', RW.CDPERSON);
		PKG_DOCUMENTOS_SVR.SET_PARAMETRO_DATA('P_DATAACTUAL', SYSDATE);
		PKG_DOCUMENTOS_SVR.SET_PARAMETRO_STRING('P_USUARIO',  'ADMINISTRADOR');

		PKG_DOCUMENTOS_SVR.EMAIL('O2.OD73', RW.EMAIL);

	end loop;

	/*
    update gd_tom_caucao_inf_p
    set swenvianotif = 'N'
    ;

    commit;
	*/

	EXCEPTION
    WHEN OTHERS THEN 

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
			,'ERRO_EXE'
			,'O2.OD73'
			,null
			,sysdate
			,1
			,'Erro na execução do processo ENVIA_EMAILS_O2_OD73'
			,null
			);

		commit;

END ENVIA_EMAILS_O2_OD73;

-- CREATE_M121 (owner: SIID_TESTES)


-- ===== PROCEDURE =====

PROCEDURE
  CREATE_M121
IS
  NRESULT NUMBER;

  VALIDA_OBJ NUMBER;

BEGIN

	VALIDA_OBJ := 0;
    
    DBMS_OUTPUT.put_line('INICIO');

	begin

		SELECT COUNT(1)
		INTO VALIDA_OBJ
		FROM USER_TABLES
		WHERE TABLE_NAME = 'GD_ENT_RISCO_CREDITO';
		
		DBMS_OUTPUT.put_line('GD_ENT_RISCO_CREDITO - ' || VALIDA_OBJ);

		if VALIDA_OBJ > 0 then
            DBMS_OUTPUT.put_line('drop table GD_ENT_RISCO_CREDITO');
			execute immediate 'drop table GD_ENT_RISCO_CREDITO';
            DBMS_OUTPUT.put_line('drop table GD_ENT_RISCO_CREDITO - end');
		end if;

        DBMS_OUTPUT.put_line('create table as GD_ENT_RISCO_CREDITO');
		execute immediate 
			q'{create table GD_ENT_RISCO_CREDITO as
			SELECT /* + ordered */
				proposta.CDPERSON
				,proposta.capital Risco_acum_cred
			FROM (
				SELECT proposta.CDPERSON
					,SUM(NVL(proposta.capital, 0) * PKG_FORMULAS_COSEC.FUN_TAXA_CAMBIO(PROPOSTA.CDMOEDA)) capital
				FROM (
					SELECT /* + ordered use_hash(PROPOSTA GARANTIA) */
						PROPOSTA.CDUNIECO
						,PROPOSTA.CDRAMO
						,PROPOSTA.NMPROPUE
						,proposta.nmpoliza
						,PROPOSTA.CDMOEDA
						,proposta.CDROL
						,proposta.FEEFECTO
						,proposta.OTVALOR
						,proposta.NMGARANT
						,proposta.CDPERSON
						,proposta.CDIDEPER
						,GARANTIA.IMPCONCO capital
					FROM (
						SELECT /* + ordered use_hash(PROPOSTA ENTIDADE_RISCO) */
							PROPOSTA.CDUNIECO
							,PROPOSTA.CDRAMO
							,PROPOSTA.NMPROPUE
							,proposta.nmpoliza
							,PROPOSTA.CDMOEDA
							,proposta.CDROL
							,proposta.FEEFECTO
							,proposta.OTVALOR
							,ENTIDADE_RISCO.NMGARANT
							,ENTIDADE_RISCO.CDPERSON
							,ENTIDADE_RISCO.CDIDEPER
						FROM (
							SELECT /* + ordered use_hash(PROPOSTA ATRIBUTOS) */
								PROPOSTA.CDUNIECO
								,PROPOSTA.CDRAMO
								,PROPOSTA.NMPROPUE
								,proposta.nmpoliza
								,PROPOSTA.CDMOEDA
								,proposta.CDROL
								,proposta.FEEFECTO
								,ATRIBUTOS.OTVALOR
							FROM (
								SELECT /* + ordered use_hash(PROPOSTA apolice) */
									PROPOSTA.CDUNIECO
									,PROPOSTA.CDRAMO
									,PROPOSTA.NMPROPUE
									,proposta.nmpoliza
									,PROPOSTA.CDMOEDA
									,proposta.CDROL
									,apolice.FEEFECTO
								FROM (
									SELECT /* + ordered use_hash(PROPOSTA rol) */
										PROPOSTA.CDUNIECO
										,PROPOSTA.CDRAMO
										,PROPOSTA.NMPROPUE
										,proposta.nmpoliza
										,PROPOSTA.CDMOEDA
										,rol.CDROLase CDROL
									FROM CO_PROPOL PROPOSTA
										,mparapro rol
									WHERE 1 = 1
										AND PROPOSTA.FEMODIF = (
											SELECT MAX(FEMODIF)
											FROM CO_PROPOL X
											WHERE X.CDUNIECO = PROPOSTA.CDUNIECO
												AND X.CDRAMO = PROPOSTA.CDRAMO
												AND X.NMPROPUE = PROPOSTA.NMPROPUE
											)
										AND rol.cdramo = PROPOSTA.CDRAMO
										AND PROPOSTA.cdunieco = 1
										AND proposta.cdramo < 200
									) proposta
									,MPOLIZAS APOLICE
								WHERE 1 = 1
									AND APOLICE.NMSUPLEM = (
										SELECT MAX(X.NMSUPLEM)
										FROM MPOLIZAS X
										WHERE 1 = 1
											AND X.NMRENOVA = APOLICE.NMRENOVA
											AND X.NMPOLIZA = APOLICE.nmpoliza
											AND X.CDRAMO = APOLICE.CDRAMO
											AND X.ESTADO = APOLICE.ESTADO
											AND X.CDUNIECO = APOLICE.CDUNIECO
										)
									AND APOLICE.NMRENOVA = 0
									AND APOLICE.NMPOLIZA = proposta.nmpoliza
									AND APOLICE.ESTADO = 'M'
									AND APOLICE.CDRAMO = PROPOSTA.CDRAMO
									AND APOLICE.CDUNIECO = PROPOSTA.CDUNIECO
								) proposta
								,TVALOPOL ATRIBUTOS
							WHERE 1 = 1
								AND ATRIBUTOS.STATUS = 'V'
								AND ATRIBUTOS.CDATRIBU = 11
								AND ATRIBUTOS.NMSUPLEM = (
									SELECT NVL(MAX(X.NMSUPLEM), 0)
									FROM TVALOPOL X
									WHERE X.CDATRIBU = ATRIBUTOS.CDATRIBU
										AND X.NMSUPLEM <= DECODE(proposta.FEEFECTO, NULL, TO_CHAR(SYSDATE, 'J'), TO_CHAR(proposta.FEEFECTO, 'J')) || '99999999999'
										AND X.STATUS = ATRIBUTOS.STATUS
										AND X.NMPOLIZA = ATRIBUTOS.NMPOLIZA
										AND X.ESTADO = ATRIBUTOS.ESTADO
										AND X.CDRAMO = ATRIBUTOS.CDRAMO
										AND X.CDUNIECO = ATRIBUTOS.CDUNIECO
									)
								AND ATRIBUTOS.NMPOLIZA = proposta.nmpoliza
								AND ATRIBUTOS.ESTADO = 'M'
								AND ATRIBUTOS.CDRAMO = PROPOSTA.CDRAMO
								AND ATRIBUTOS.CDUNIECO = PROPOSTA.CDUNIECO
							) proposta
							,co_prorol entidade_risco
						WHERE 1 = 1
							AND ENTIDADE_RISCO.STATUS = 'V'
							AND ENTIDADE_RISCO.NMORDINA = (
								SELECT MAX(NMORDINA)
								FROM CO_PROROL X
								WHERE X.CDUNIECO = ENTIDADE_RISCO.CDUNIECO
									AND X.CDRAMO = ENTIDADE_RISCO.CDRAMO
									AND X.NMPROPUE = ENTIDADE_RISCO.NMPROPUE
									AND X.CDPERSON = ENTIDADE_RISCO.CDPERSON
									AND X.NMGARANT = ENTIDADE_RISCO.NMGARANT
									AND X.CDROL = ENTIDADE_RISCO.CDROL
								)
							AND ENTIDADE_RISCO.CDROL = PROPOSTA.CDROL
							AND ENTIDADE_RISCO.CDUNIECO = PROPOSTA.CDUNIECO
							AND ENTIDADE_RISCO.CDRAMO = PROPOSTA.CDRAMO
							AND ENTIDADE_RISCO.NMPROPUE = PROPOSTA.NMPROPUE
						) proposta
						,CO_PROGAR GARANTIA
					WHERE 1 = 1
						and NVL(GARANTIA.IMPCONCO, 0) > 0
						AND GARANTIA.CDUNIECO = proposta.CDUNIECO
						AND GARANTIA.CDRAMO = proposta.CDRAMO
						AND GARANTIA.NMPROPUE = proposta.NMPROPUE
						AND GARANTIA.NMGARANT = proposta.NMGARANT
						AND GARANTIA.CDTIPGAR != 'A'
						AND GARANTIA.SWESTADO IN (
							'D'
							,'M'
							,'PR'
							)
						AND (
							GARANTIA.CDRAMO != '100'
							OR proposta.OTVALOR NOT IN (
								11
								,12
								,16
								,17
								,19
								)
							)
					) proposta
				GROUP BY proposta.CDPERSON
				) proposta
			WHERE 1 = 1
				and proposta.capital > 0}';
				
		DBMS_OUTPUT.put_line('create table as GD_ENT_RISCO_CREDITO - end');

		execute immediate 'CREATE UNIQUE INDEX "GD_ENT_RISC_CRED_INDX" ON "GD_ENT_RISCO_CREDITO" ("CDPERSON") COMPUTE STATISTICS';

		commit;

	exception
		when others then
			DBMS_OUTPUT.put_line(sqlerrm);
	end;

	DBMS_STATS.GATHER_TABLE_STATS(ownname => '"SIID_TESTES"', tabname => '"GD_ENT_RISCO_CREDITO"', estimate_percent => 100);
	DBMS_STATS.GATHER_INDEX_STATS('"SIID_TESTES"', '"GD_ENT_RISC_CRED_INDX"', estimate_percent => 100);

	VALIDA_OBJ := 0;

	begin

		SELECT COUNT(1)
		INTO VALIDA_OBJ
		FROM USER_TABLES
		WHERE TABLE_NAME = 'GD_ENT_RISCO_CAUCAO';
		
		DBMS_OUTPUT.put_line('GD_ENT_RISCO_CAUCAO - ' || VALIDA_OBJ);

		if VALIDA_OBJ > 0 then
			DBMS_OUTPUT.put_line('drop table GD_ENT_RISCO_CAUCAO');
			execute immediate 'drop table GD_ENT_RISCO_CAUCAO';
			DBMS_OUTPUT.put_line('drop table GD_ENT_RISCO_CAUCAO - end');
		end if;
		
		DBMS_OUTPUT.put_line('create table as GD_ENT_RISCO_CREDITO');
		execute immediate 
			q'{create table GD_ENT_RISCO_CAUCAO as
			SELECT apolice.cdperson
				,NVL(COUNT(DISTINCT APOLICE.NMPOLIZA), 0) N_APOLICES
				,NVL(SUM(NVL(apolice.capital, 0)), 0) ra_caucao
				,NVL(SUM(decode(apolice.cdtipcau, 1, NVL(apolice.capital, 0), 0)), 0) ra_caucao_1
				,NVL(SUM(decode(apolice.cdtipcau, 2, NVL(apolice.capital, 0), 0)), 0) ra_caucao_2
				,NVL(SUM(decode(apolice.cdtipcau, 3, NVL(apolice.capital, 0), 0)), 0) ra_caucao_3
				,NVL(SUM(decode(apolice.cdtipcau, 4, NVL(apolice.capital, 0), 0)), 0) ra_caucao_4
				,NVL(SUM(decode(apolice.cdtipcau, 5, NVL(apolice.capital, 0), 0)), 0) ra_caucao_5
				,NVL(SUM(decode(apolice.cdtipcau, 6, NVL(apolice.capital, 0), 0)), 0) ra_caucao_6
				,NVL(SUM(decode(apolice.cdtipcau, 7, NVL(apolice.capital, 0), 0)), 0) ra_caucao_7
				,NVL(SUM(decode(apolice.cdtipcau, 8, NVL(apolice.capital, 0), 0)), 0) ra_caucao_8
				,NVL(SUM(decode(apolice.cdtipcau, 9, NVL(apolice.capital, 0), 0)), 0) ra_caucao_9
				,NVL(SUM(decode(apolice.cdtipcau, 10, NVL(apolice.capital, 0), 0)), 0) ra_caucao_10
				,NVL(SUM(decode(apolice.cdtipcau, 11, NVL(apolice.capital, 0), 0)), 0) ra_caucao_11
				,NVL(SUM(decode(apolice.cdtipcau, 12, NVL(apolice.capital, 0), 0)), 0) ra_caucao_12
				,NVL(SUM(decode(apolice.cdtipcau, 13, NVL(apolice.capital, 0), 0)), 0) ra_caucao_13
				,NVL(SUM(decode(apolice.cdtipcau, 14, NVL(apolice.capital, 0), 0)), 0) ra_caucao_14
				,NVL(SUM(decode(apolice.cdtipcau, 15, NVL(apolice.capital, 0), 0)), 0) ra_caucao_15
				,NVL(SUM(decode(apolice.cdtipcau, 16, NVL(apolice.capital, 0), 0)), 0) ra_caucao_16
				,NVL(SUM(decode(apolice.cdtipcau, 17, NVL(apolice.capital, 0), 0)), 0) ra_caucao_17
				,NVL(SUM(decode(apolice.cdtipcau, 18, NVL(apolice.capital, 0), 0)), 0) ra_caucao_18
				,NVL(SUM(decode(apolice.cdtipcau, 19, NVL(apolice.capital, 0), 0)), 0) ra_caucao_19
				,NVL(SUM(decode(apolice.cdtipcau, 20, NVL(apolice.capital, 0), 0)), 0) ra_caucao_20
			FROM (
				SELECT /* + ordered use_hash(apolice tramcau) */
					apolice.cdunieco
					,apolice.cdramo
					,apolice.ESTADO
					,apolice.nmpoliza
					,apolice.CDMONEDA
					,apolice.feefecto
					,apolice.CDATRIBU
					,apolice.cdperson
					,apolice.capital * PKG_FORMULAS_COSEC.FUN_TAXA_CAMBIO(APOLICE.CDMONEDA) capital
					,apolice.quadleg
					,NVL(tramcau.cdtipcau, 0) cdtipcau
				FROM (
					SELECT /* + ordered use_hash(apolice val) */
						apolice.cdunieco
						,apolice.cdramo
						,apolice.ESTADO
						,apolice.nmpoliza
						,apolice.CDMONEDA
						,apolice.feefecto
						,apolice.CDATRIBU
						,apolice.cdperson
						,apolice.capital
						,val.otvalor quadleg
					FROM (
						SELECT /* + ordered use_hash(apolice cap) */
							apolice.cdunieco
							,apolice.cdramo
							,apolice.ESTADO
							,apolice.nmpoliza
							,apolice.CDMONEDA
							,apolice.feefecto
							,apolice.CDATRIBU
							,apolice.cdperson
							,SUM(NVL(cap.PTCAPITA, 0)) capital
						FROM (
							SELECT /* + ordered use_hash(apolice pero) */
								apolice.cdunieco
								,apolice.cdramo
								,apolice.ESTADO
								,apolice.nmpoliza
								,apolice.CDMONEDA
								,apolice.feefecto
								,apolice.CDATRIBU
								,pero.cdperson
								,pero.NMSITUAC
							FROM (
								SELECT /* + ordered use_hash(SUPLOGIC apolice atripol rol) */
									SUPLOGIC.cdunieco
									,SUPLOGIC.cdramo
									,SUPLOGIC.ESTADO
									,SUPLOGIC.nmpoliza
									,apolice.CDMONEDA
									,apolice.feefecto
									,atripol.CDATRIBU
									,rol.CDROLRIE CDROL
								FROM (
									SELECT SUPLOGIC.cdunieco
										,SUPLOGIC.cdramo
										,SUPLOGIC.ESTADO
										,SUPLOGIC.nmpoliza
									FROM TDESCSUP SUPLOGIC
									WHERE 1 = 1
										AND SUPLOGIC.NSUPLOGI = (
											SELECT MAX(X.NSUPLOGI)
											FROM MSUPLEME X
											WHERE 2 = 2
												AND X.NMSUPLEM <= TO_CHAR(sysdate, 'J') || '99999999999'
												AND X.NMPOLIZA = SUPLOGIC.NMPOLIZA
												AND X.ESTADO = SUPLOGIC.ESTADO
												AND X.CDRAMO = SUPLOGIC.CDRAMO
												AND X.CDUNIECO = SUPLOGIC.CDUNIECO
											)
										AND SUPLOGIC.ESTADO = 'M'
										AND SUPLOGIC.CDRAMO > 199
										AND SUPLOGIC.CDUNIECO = 1
										AND SUPLOGIC.CDTIPSUP != '52'
									) SUPLOGIC
									,mpolizas apolice
									,tatripol atripol
									,mparapro rol
								WHERE 1 = 1
									AND apolice.NMPOLIZA = SUPLOGIC.NMPOLIZA
									AND apolice.ESTADO = SUPLOGIC.ESTADO
									AND apolice.CDRAMO = SUPLOGIC.CDRAMO
									AND apolice.CDUNIECO = SUPLOGIC.CDUNIECO
									AND APOLICE.NMSUPLEM = (
										SELECT MAX(NMSUPLEM)
										FROM MPOLIZAS X
										WHERE X.CDUNIECO = APOLICE.CDUNIECO
											AND X.CDRAMO = APOLICE.CDRAMO
											AND X.ESTADO = APOLICE.ESTADO
											AND X.NMPOLIZA = APOLICE.NMPOLIZA
											AND X.NMSUPLEM <= TO_CHAR(sysdate, 'J') || '99999999999'
										)
									AND atripol.cdramo = SUPLOGIC.CDRAMO
									AND atripol.ottabval = 'QLEGAL'
									AND rol.cdramo = SUPLOGIC.CDRAMO
								) apolice
								,mpoliper pero
							WHERE 1 = 1
								AND pero.NMPOLIZA = apolice.NMPOLIZA
								AND pero.ESTADO = apolice.ESTADO
								AND pero.CDRAMO = apolice.CDRAMO
								AND pero.CDUNIECO = apolice.CDUNIECO
								AND pero.STATUS = 'V'
								AND pero.CDROL = apolice.CDROL
								AND pero.NMSUPLEM = (
									SELECT MAX(D.NMSUPLEM)
									FROM MPOLIPER D
									WHERE D.CDUNIECO = pero.CDUNIECO
										AND D.CDRAMO = pero.CDRAMO
										AND D.ESTADO = pero.ESTADO
										AND D.NMPOLIZA = pero.NMPOLIZA
										AND D.CDPERSON = pero.CDPERSON
										AND D.NMSITUAC = pero.NMSITUAC
										AND D.CDROL = pero.CDROL
										AND D.NMSUPLEM <= TO_CHAR(sysdate, 'J') || '99999999999'
									)
							) apolice
							,MPOLICAP cap
						WHERE 1 = 1
							AND NVL(cap.PTCAPITA, 0) > 0
							AND cap.CDUNIECO = apolice.CDUNIECO
							AND cap.CDRAMO = apolice.CDRAMO
							AND cap.ESTADO = apolice.ESTADO
							AND cap.NMPOLIZA = apolice.NMPOLIZA
							AND cap.NMSITUAC = apolice.NMSITUAC
							AND cap.STATUS = 'V'
							AND cap.CDCAPITA = '1'
							AND cap.NMSUPLEM = (
								SELECT MAX(B.NMSUPLEM)
								FROM MPOLICAP B
								WHERE B.CDUNIECO = cap.CDUNIECO
									AND B.CDRAMO = cap.CDRAMO
									AND B.ESTADO = cap.ESTADO
									AND B.NMPOLIZA = cap.NMPOLIZA
									AND B.NMSITUAC = cap.NMSITUAC
									AND B.CDCAPITA = cap.CDCAPITA
									AND B.NMSUPLEM <= TO_CHAR(SYSDATE, 'J') || '99999999999'
								)
						GROUP BY apolice.cdunieco
							,apolice.cdramo
							,apolice.ESTADO
							,apolice.nmpoliza
							,apolice.CDMONEDA
							,apolice.feefecto
							,apolice.CDATRIBU
							,apolice.cdperson
						) apolice
						,tvalopol val
					WHERE 1 = 1
						AND val.cdunieco = apolice.cdunieco
						AND val.cdramo = apolice.cdramo
						AND val.nmpoliza = apolice.nmpoliza
						AND val.cdatribu = apolice.cdatribu
						AND val.STATUS = 'V'
						AND val.nmsuplem = (
							SELECT MAX(x.nmsuplem)
							FROM tvalopol x
							WHERE x.nmsuplem < TO_CHAR(SYSDATE, 'J') || '99999999999'
								AND x.cdatribu = val.cdatribu
								AND x.nmpoliza = val.nmpoliza
								AND x.estado = val.estado
								AND x.cdramo = val.cdramo
								AND x.cdunieco = val.cdunieco
							)
					) apolice
					,co_tramcau tramcau
				WHERE 1 = 1
					AND tramcau.cdramo(+) = apolice.cdramo
					AND tramcau.quadleg(+) = apolice.quadleg
				) apolice
			GROUP BY apolice.cdperson}';
			
		DBMS_OUTPUT.put_line('create table as GD_ENT_RISCO_CAUCAO - end');
		
		execute immediate 'CREATE UNIQUE INDEX "GD_ENT_RISC_CAU_INDX" ON "GD_ENT_RISCO_CAUCAO" ("CDPERSON") COMPUTE STATISTICS';

		commit;

	exception
		when others then
			DBMS_OUTPUT.put_line(sqlerrm);
	end;

	DBMS_STATS.GATHER_TABLE_STATS(ownname => '"SIID_TESTES"', tabname => '"GD_ENT_RISCO_CAUCAO"', estimate_percent => 100);
	DBMS_STATS.GATHER_INDEX_STATS('"SIID_TESTES"', '"GD_ENT_RISC_CAU_INDX"', estimate_percent => 100);

	VALIDA_OBJ := 0;

	begin

		SELECT COUNT(1)
		INTO VALIDA_OBJ
		FROM USER_TABLES
		WHERE TABLE_NAME = 'GD_ENT_RISCO_CREDITO_EXP';
		
		DBMS_OUTPUT.put_line('GD_ENT_RISCO_CREDITO_EXP - ' || VALIDA_OBJ);

		if VALIDA_OBJ > 0 then
			DBMS_OUTPUT.put_line('drop table GD_ENT_RISCO_CREDITO_EXP');
			execute immediate 'drop table GD_ENT_RISCO_CREDITO_EXP';
			DBMS_OUTPUT.put_line('drop table GD_ENT_RISCO_CREDITO_EXP - end');
		end if;
		
		DBMS_OUTPUT.put_line('create table as GD_ENT_RISCO_CREDITO_EXP');

		execute immediate 
			q'{create table GD_ENT_RISCO_CREDITO_EXP as
			SELECT CDIDEPER
				,valor risco_exposicao
			FROM (
				SELECT CDIDEPER
					,SUM(VALOR) valor
				FROM (
					SELECT CDIDEPER
						,NVL(SUM(IMPCONCO), 0) VALOR
					FROM co_limext
					WHERE 1 = 1
						AND SWESTADO = 'M'
						AND NVL(TO_DATE(FEFINVIG, 'YYYY-MM-DD'), SYSDATE + 1) >= SYSDATE
					GROUP BY CDIDEPER

					UNION ALL

					SELECT CDIDEPER
						,NVL(SUM(TEMP_INC_M), 0) VALOR
					FROM co_limext
					WHERE 1 = 1
						AND NVL(TO_DATE(temp_inc_expy_d, 'YYYY-MM-DD'), SYSDATE + 1) >= SYSDATE
						AND TO_DATE(temp_inc_REFER_d, 'YYYY-MM-DD') <= SYSDATE
					GROUP BY CDIDEPER
					)
				GROUP BY CDIDEPER
				)
			WHERE valor > 0}';
			
		DBMS_OUTPUT.put_line('create table as GD_ENT_RISCO_CREDITO_EXP - END');

		execute immediate 'CREATE UNIQUE INDEX "GD_ENT_RISC_CRED_EXP_INDX" ON "GD_ENT_RISCO_CREDITO_EXP" ("CDIDEPER") COMPUTE STATISTICS';

		commit;

	exception
		when others then
			DBMS_OUTPUT.put_line(sqlerrm);
	end;

	DBMS_STATS.GATHER_TABLE_STATS(ownname => '"SIID_TESTES"', tabname => '"GD_ENT_RISCO_CREDITO_EXP"', estimate_percent => 100);
	DBMS_STATS.GATHER_INDEX_STATS('"SIID_TESTES"', '"GD_ENT_RISC_CRED_EXP_INDX"', estimate_percent => 100);

	VALIDA_OBJ := 0;

	begin

		SELECT COUNT(1)
		INTO VALIDA_OBJ
		FROM USER_TABLES
		WHERE TABLE_NAME = 'GD_ENT_PESSOAS_TEMP';
		
		DBMS_OUTPUT.put_line('GD_ENT_PESSOAS_TEMP - ' || VALIDA_OBJ);

		if VALIDA_OBJ > 0 then
			DBMS_OUTPUT.put_line('drop table GD_ENT_PESSOAS_TEMP');
			execute immediate 'drop table GD_ENT_PESSOAS_TEMP';
			DBMS_OUTPUT.put_line('drop table GD_ENT_PESSOAS_TEMP - end');
		end if;
		
		DBMS_OUTPUT.put_line('create table as GD_ENT_PESSOAS_TEMP');

		execute immediate 
			q'{create table GD_ENT_PESSOAS_TEMP as
			SELECT /* + ordered */
				PESSOA.CDIDEPER
				,PESSOA.CDPERSON
				,PESSOA.DSNOMBRE
				,PESSOA.CDPAIS
				,PESSOA.CDNATJUR
				,pessoa.MS
				,PESSOA.desc_pais
				,PESSOA.CDCAE
				,PESSOA.setor_atividade
				,PESSOA.desc_setor_atividade
				,PESSOA.risco_sector
				,PESSOA.ZONA
				,PESSOA.DSPROVIN
				,PESSOA.cdprovin
				,PESSOA.CDCONCEJ
				,PESSOA.concelho_desc
				,PESSOA.N_APOLICES
				,PESSOA.ra_caucao
				,PESSOA.ra_caucao_1
				,PESSOA.ra_caucao_2
				,PESSOA.ra_caucao_3
				,PESSOA.ra_caucao_4
				,PESSOA.ra_caucao_5
				,PESSOA.ra_caucao_6
				,PESSOA.ra_caucao_7
				,PESSOA.ra_caucao_8
				,PESSOA.ra_caucao_9
				,PESSOA.ra_caucao_10
				,PESSOA.ra_caucao_11
				,PESSOA.ra_caucao_12
				,PESSOA.ra_caucao_13
				,PESSOA.ra_caucao_14
				,PESSOA.ra_caucao_15
				,PESSOA.ra_caucao_16
				,PESSOA.ra_caucao_17
				,PESSOA.ra_caucao_18
				,PESSOA.ra_caucao_19
				,PESSOA.ra_caucao_20
				,PESSOA.risco_acum_cred
				,PESSOA.risco_exposicao
				,PESSOA.risco_acum_total
				,PESSOA.risco_acum_congeneres
			FROM (
				SELECT /* + ordered */
					PESSOA.CDIDEPER
					,PESSOA.CDPERSON
					,PESSOA.DSNOMBRE
					,PESSOA.CDPAIS
					,PESSOA.CDNATJUR
					,pessoa.MS
					,PESSOA.desc_pais
					,PESSOA.CDCAE
					,PESSOA.setor_atividade
					,PESSOA.desc_setor_atividade
					,PESSOA.risco_sector
					,PESSOA.ZONA
					,PESSOA.DSPROVIN
					,PESSOA.cdprovin
					,PESSOA.CDCONCEJ
					,PESSOA.concelho_desc
					,riscacum_caucao.N_APOLICES
					,riscacum_caucao.ra_caucao
					,riscacum_caucao.ra_caucao_1
					,riscacum_caucao.ra_caucao_2
					,riscacum_caucao.ra_caucao_3
					,riscacum_caucao.ra_caucao_4
					,riscacum_caucao.ra_caucao_5
					,riscacum_caucao.ra_caucao_6
					,riscacum_caucao.ra_caucao_7
					,riscacum_caucao.ra_caucao_8
					,riscacum_caucao.ra_caucao_9
					,riscacum_caucao.ra_caucao_10
					,riscacum_caucao.ra_caucao_11
					,riscacum_caucao.ra_caucao_12
					,riscacum_caucao.ra_caucao_13
					,riscacum_caucao.ra_caucao_14
					,riscacum_caucao.ra_caucao_15
					,riscacum_caucao.ra_caucao_16
					,riscacum_caucao.ra_caucao_17
					,riscacum_caucao.ra_caucao_18
					,riscacum_caucao.ra_caucao_19
					,riscacum_caucao.ra_caucao_20
					,riscacum_cred.risco_acum_cred
					,exposicao.risco_exposicao
					,NVL(NVL(riscacum_caucao.ra_caucao, 0) + NVL(riscacum_cred.risco_acum_cred, 0) + DECODE(PESSOA.CDPAIS, 'PRT', NVL(exposicao.risco_exposicao, 0), 0), 0) risco_acum_total
					,NVL(NVL(riscacum_cred.risco_acum_cred, 0) + DECODE(PESSOA.CDPAIS, 'PRT', NVL(exposicao.risco_exposicao, 0), 0), 0) risco_acum_congeneres
				FROM (
					SELECT /* + ordered */
						PESSOA.CDIDEPER
						,PESSOA.CDPERSON
						,PESSOA.DSNOMBRE
						,PESSOA.CDPAIS
						,PESSOA.CDNATJUR
						,pessoa.MS
						,PESSOA.desc_pais
						,PESSOA.CDCAE
						,PESSOA.setor_atividade
						,PESSOA.desc_setor_atividade
						,PESSOA.risco_sector
						,PESSOA.ZONA
						,PESSOA.DSPROVIN
						,PESSOA.cdprovin
						,PESSOA.CDCONCEJ
						,CONC_desc.otvalor26 concelho_desc
					FROM (
						SELECT /* + ORDERED */
							PESSOA.CDIDEPER
							,PESSOA.CDPERSON
							,PESSOA.DSNOMBRE
							,PESSOA.CDPAIS
							,PESSOA.CDNATJUR
							,pessoa.cdgrdsb MS
							,PAIS.DESCRIPL desc_pais
							,ENTIDADE.CDCAE
							,desccae.CDGRUCAE2 setor_atividade
							,desc_cae.DESCRIPL desc_setor_atividade
							,desccae.riscsec risco_sector
							,CASE 
								WHEN morada.cdpais = 'PRT'
									THEN Concelho.cdzona
								WHEN morada.cdpais IN (
										'AGO'
										,'MOZ'
										,'CPV'
										)
									THEN 'ZCAN'
								ELSE 'ZME'
								END ZONA
							,Distrito.DSPROVIN
							,CASE 
								WHEN morada.cdprovin < 10
									THEN '0' || morada.cdprovin
								ELSE to_char(morada.cdprovin)
								END cdprovin
							,CASE 
								WHEN morada.CDCONCEJ < 10
									THEN '0' || morada.CDCONCEJ
								ELSE to_char(morada.CDCONCEJ)
								END CDCONCEJ
						FROM MPERSONA PESSOA
							,CO_ENTIDAD ENTIDADE
							,MDOMICIL morada
							,co_caes desccae
							,co_concejo Concelho
							,TPROVIN Distrito
							,TMANTENI desc_cae
							,TMANTENI PAIS
						WHERE 1 = 1
							AND desc_cae.cdtabla(+) = 'CO_GCAES'
							AND desc_cae.codigo(+) = desccae.CDGRUCAE2
							AND desccae.cdcae(+) = ENTIDADE.cdcae
							AND PESSOA.CDPERSON = ENTIDADE.CDPERSON
							AND Concelho.cdprovin(+) = morada.cdprovin
							AND Concelho.cdconcej(+) = morada.cdconcej
							AND Concelho.cdpais(+) = morada.cdpais
							AND Distrito.cdprovin(+) = morada.cdprovin
							AND Distrito.cdpais(+) = morada.cdpais
							AND morada.cdperson(+) = pessoa.CDPERSON
							AND morada.cdtipdom(+) = '01'
							AND PAIS.CODIGO = PESSOA.CDPAIS
							AND PAIS.CDTABLA = 'TPAISES'
							AND NVL(PESSOA.FECBAJA, TO_DATE('01-01-2100', 'DD-MM-YYYY')) >= SYSDATE
						) PESSOA
						,TABLE (PKG_APP_UTIL.LISTA_TABAPOIO('CONCELHO')) CONC_desc
					WHERE 1 = 1
						AND CONC_desc.otclave1(+) = PESSOA.cdprovin || PESSOA.CDCONCEJ
					) PESSOA
					,GD_ENT_RISCO_CREDITO riscacum_cred
					,GD_ENT_RISCO_CAUCAO riscacum_caucao
					,GD_ENT_RISCO_CREDITO_EXP exposicao
				WHERE 1 = 1
					AND riscacum_caucao.CDPERSON(+) = PESSOA.CDPERSON
					AND riscacum_cred.CDPERSON(+) = PESSOA.CDPERSON
					AND exposicao.CDIDEPER(+) = PESSOA.CDIDEPER
				) pessoa
			WHERE risco_acum_total > 0}';
			
		DBMS_OUTPUT.put_line('create table as GD_ENT_PESSOAS_TEMP - END');

		execute immediate 'CREATE UNIQUE INDEX "GD_ENT_PESSOAS_TMP_INDX" ON "GD_ENT_PESSOAS_TEMP" ("CDPERSON") COMPUTE STATISTICS';

		commit;

	exception
		when others then
			DBMS_OUTPUT.put_line(sqlerrm);
	end;

	DBMS_STATS.GATHER_TABLE_STATS(ownname => '"SIID_TESTES"', tabname => '"GD_ENT_PESSOAS_TEMP"', estimate_percent => 100);
	DBMS_STATS.GATHER_INDEX_STATS('"SIID_TESTES"', '"GD_ENT_PESSOAS_TMP_INDX"', estimate_percent => 100);

	VALIDA_OBJ := 0;

	begin

		SELECT COUNT(1)
		INTO VALIDA_OBJ
		FROM USER_TABLES
		WHERE TABLE_NAME = 'GD_ENT_PESSOAS';
		
		DBMS_OUTPUT.put_line('GD_ENT_PESSOAS - ' || VALIDA_OBJ);

		if VALIDA_OBJ > 0 then
			DBMS_OUTPUT.put_line('drop table GD_ENT_PESSOAS');
			execute immediate 'drop table GD_ENT_PESSOAS';
			DBMS_OUTPUT.put_line('drop table GD_ENT_PESSOAS - end');
		end if;

		DBMS_OUTPUT.put_line('create table as GD_ENT_PESSOAS');
		execute immediate 
			q'{create table GD_ENT_PESSOAS as
			SELECT pessoa.*
				,NVL(tomador.NUM_APOLICES, 0) NUM_APOLICES
				,NVL(tomador.num_apolices_cred, 0) num_apolices_cred
				,NVL(tomador.num_apolices_cau, 0) num_apolices_cau
			FROM GD_ENT_PESSOAS_TEMP pessoa
				,TABLE (LISTA_ENTTOMADOR(pessoa.cdperson)) tomador
			WHERE tomador.cdperson(+) = pessoa.cdperson}';
		
		DBMS_OUTPUT.put_line('create table as GD_ENT_PESSOAS');

		execute immediate 'CREATE UNIQUE INDEX "GD_ENT_PESSOAS_INDX" ON "GD_ENT_PESSOAS" ("CDPERSON") COMPUTE STATISTICS';

		commit;

	exception
		when others then
			DBMS_OUTPUT.put_line(sqlerrm);
	end;

	DBMS_STATS.GATHER_TABLE_STATS(ownname => '"SIID_TESTES"', tabname => '"GD_ENT_PESSOAS"', estimate_percent => 100);
	DBMS_STATS.GATHER_INDEX_STATS('"SIID_TESTES"', '"GD_ENT_PESSOAS_INDX"', estimate_percent => 100);

	VALIDA_OBJ:=0;

	begin

		SELECT COUNT(1)
		INTO VALIDA_OBJ
		FROM USER_TABLES
		WHERE TABLE_NAME = 'GD_ENT_RATINGS';
		
		DBMS_OUTPUT.put_line('GD_ENT_RATINGS - ' || VALIDA_OBJ);

		if VALIDA_OBJ > 0 then
			DBMS_OUTPUT.put_line('drop table GD_ENT_RATINGS');
			execute immediate 'drop table GD_ENT_RATINGS';
			DBMS_OUTPUT.put_line('drop table GD_ENT_RATINGS - end');
		end if;

		DBMS_OUTPUT.put_line('create table as GD_ENT_RATINGS');
		execute immediate 
			q'{create table GD_ENT_RATINGS as
			SELECT /* + ordered */
				a.cdperson cdperson
				,a.cdvalor rating
				,b.cdvalor rating_30
				,a.swmanual
				,a.CREATED_DATE
			FROM (
				SELECT CDPERSON
					,cdvalor
					,swmanual
					,CREATED_DATE
				FROM tprocmod
				) a
				,(
					SELECT z.cdperson
						,z.cdvalor
					FROM MPROCMOD Z
					WHERE to_date(substr(z.NMORDINA, 1, 7), 'J') < trunc(sysdate) - 30
						AND z.nmordina = (
							SELECT MAX(x.nmordina)
							FROM MPROCMOD X
							WHERE to_date(substr(x.NMORDINA, 1, 7), 'J') < trunc(sysdate) - 30
								AND x.cdperson = z.cdperson
							)
					) b
			WHERE 1 = 1
				AND a.cdperson = b.cdperson(+)}';
		
		DBMS_OUTPUT.put_line('create table as GD_ENT_RATINGS - end');

		execute immediate 'CREATE UNIQUE INDEX "GD_ENT_RATINGS_INDX" ON "GD_ENT_RATINGS" ("CDPERSON") COMPUTE STATISTICS';

		commit;

	exception
		when others then
			DBMS_OUTPUT.put_line(sqlerrm);
	end;

	DBMS_STATS.GATHER_TABLE_STATS(ownname => '"SIID_TESTES"', tabname => '"GD_ENT_RATINGS"', estimate_percent => 100);
	DBMS_STATS.GATHER_INDEX_STATS('"SIID_TESTES"', '"GD_ENT_RATINGS_INDX"', estimate_percent => 100);

	VALIDA_OBJ:=0;

	begin

		SELECT COUNT(1)
		INTO VALIDA_OBJ
		FROM USER_TABLES
		WHERE TABLE_NAME = 'GD_ENT_TOTAL_CRED';
		
		DBMS_OUTPUT.put_line('GD_ENT_TOTAL_CRED - ' || VALIDA_OBJ);

		if VALIDA_OBJ > 0 then
			DBMS_OUTPUT.put_line('drop table GD_ENT_TOTAL_CRED');
			execute immediate 'drop table GD_ENT_TOTAL_CRED';
			DBMS_OUTPUT.put_line('drop table GD_ENT_TOTAL_CRED - end');
		end if;

		DBMS_OUTPUT.put_line('create table as GD_ENT_TOTAL_CRED');
		execute immediate 
			q'{create table GD_ENT_TOTAL_CRED as
			SELECT cdperson
				,total_cred
			FROM (
				SELECT a.cdperson
					,a.NMORDCRC
					,NVL(a.valagd, 0) + NVL(b.val, 0) total_cred
					,ROW_NUMBER() OVER (
						PARTITION BY a.cdperson ORDER BY a.cdperson
							,a.NMORDCRC DESC
						) posicao
				FROM CO_INFSLD_CRC a
					,CO_INFSLDwcr_CRC b
				WHERE 1 = 1
					AND a.cdperson = b.cdperson
					AND a.NMORDCRC = b.NMORDCRC
					AND a.nmsaldo = b.nmsaldo
				)
			WHERE posicao = 1}';
			
		DBMS_OUTPUT.put_line('create table as GD_ENT_TOTAL_CRED - end');

		execute immediate 'CREATE UNIQUE INDEX "GD_ENT_TOT_CRED_INDX" ON "GD_ENT_TOTAL_CRED" ("CDPERSON") COMPUTE STATISTICS';

		commit;

	exception
		when others then
			DBMS_OUTPUT.put_line(sqlerrm);
	end;

	DBMS_STATS.GATHER_TABLE_STATS(ownname => '"SIID_TESTES"', tabname => '"GD_ENT_TOTAL_CRED"', estimate_percent => 100);
	DBMS_STATS.GATHER_INDEX_STATS('"SIID_TESTES"', '"GD_ENT_TOT_CRED_INDX"', estimate_percent => 100);

	VALIDA_OBJ:=0;

	begin

		SELECT COUNT(1)
		INTO VALIDA_OBJ
		FROM USER_TABLES
		WHERE TABLE_NAME = 'GD_ENT_SIT_REL';
		
		DBMS_OUTPUT.put_line('GD_ENT_SIT_REL - ' || VALIDA_OBJ);

		if VALIDA_OBJ > 0 then
			DBMS_OUTPUT.put_line('drop table GD_ENT_SIT_REL');
			execute immediate 'drop table GD_ENT_SIT_REL';
			DBMS_OUTPUT.put_line('drop table GD_ENT_SIT_REL - end');
		end if;

		DBMS_OUTPUT.put_line('create table as GD_ENT_SIT_REL');
		execute immediate 
			q'{create table GD_ENT_SIT_REL as
			SELECT cdperson
				,CDORIGVI
				,CDFUENTE
				,sit_rel
			FROM (
				SELECT d.cdperson
					,d.CDORIGVI
					,d.CDFUENTE
					,f.descripl sit_rel
					,ROW_NUMBER() OVER (
						PARTITION BY d.cdperson ORDER BY d.cdperson
							,e.FEVISITA DESC
						) posicao
				FROM co_pedidos d
					,co_recontrol e
					,TMANTENI f
				WHERE 1 = 1
					AND d.NMPEDIDO = e.NMPEDIDO
					AND d.cdperson = e.cdperson
					AND f.CDTABLA(+) = 'CO_SITREL'
					AND f.CODIGO(+) = e.CDSITREL
				)
			WHERE posicao = 1}';
		
		DBMS_OUTPUT.put_line('create table as GD_ENT_SIT_REL - end');

		execute immediate 'CREATE UNIQUE INDEX "GD_ENT_SITREL_INDX" ON "GD_ENT_SIT_REL" ("CDPERSON") COMPUTE STATISTICS';

		commit;

	exception
		when others then
			DBMS_OUTPUT.put_line(sqlerrm);
	end;

	DBMS_STATS.GATHER_TABLE_STATS(ownname => '"SIID_TESTES"', tabname => '"GD_ENT_SIT_REL"', estimate_percent => 100);
	DBMS_STATS.GATHER_INDEX_STATS('"SIID_TESTES"', '"GD_ENT_SITREL_INDX"', estimate_percent => 100);

EXCEPTION
  WHEN OTHERS THEN
	DBMS_OUTPUT.put_line(sqlerrm);
    ROLLBACK;
END;

-- PKG_DOCUMENTOS_SAFT (owner: SIID_TESTES)


-- ===== SPEC (PACKAGE) =====

PACKAGE Pkg_Documentos_SAFT
AS

	/*
	-* NOME      : GET_QR_CODE_SAFT
	-* OBJECTIVO : RETORNA UMA IMAGEM DO CODIGO QR A INSERIR NOS DOCUMENTOS DE FATURACAO
	-* UTILIZACAO: PKG_DOCUMENTOS_SAFT.GET_QR_CODE_SAFT( );
	-* AUTOR     : JOÃO RIBEIRO
	-* DATA      : 10-09-2021
	-* VERSÃO    : 1.0
	-*
	-* ÚLTIMAS ALTERAÇÕES
	-*
	-*   DATA       AUTOR           DESCRIÇÃO
	-*   ========== =============== =================================================
	-*
	-*/
	FUNCTION GET_QR_CODE_SAFT (PI_DOCNO IN VARCHAR2, PI_CDPERSON IN NUMBER, PI_OUTROINFO IN VARCHAR2 DEFAULT NULL ) RETURN BLOB;

	/*
	-* NOME      : GET_LABEL_ATCUD_SAFT
	-* OBJECTIVO : RETORNA A LABEL DO ATCUD QUE FICA POR CIMA DO QRCODE
	-* UTILIZACAO: PKG_DOCUMENTOS_SAFT.GET_LABEL_ATCUD_SAFT( CO_SAFTDOC.DOCNO );
	-* AUTOR     : JOÃO RIBEIRO
	-* DATA      : 15-09-2021
	-* VERSÃO    : 1.0
	-*
	-* ÚLTIMAS ALTERAÇÕES
	-*
	-*   DATA       AUTOR           DESCRIÇÃO
	-*   ========== =============== =================================================
	-*
	-*/
	FUNCTION GET_LABEL_ATCUD_SAFT (PI_DOCNO IN VARCHAR2) RETURN VARCHAR2;



END Pkg_Documentos_SAFT;

-- ===== BODY (PACKAGE BODY) =====

PACKAGE BODY Pkg_Documentos_SAFT
AS

	/*
	-* NOME      : GENERATE_QR_CODE_SAFT
	-* OBJECTIVO : RETORNA UMA IMAGEM DO CODIGO QR A INSERIR NOS DOCUMENTOS DE FATURACAO
	-* UTILIZACAO:
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
	procedure GENERATE_QR_CODE_SAFT (PI_DOCNO IN VARCHAR2, PI_CDPERSON IN NUMBER, PI_OUTROINFO IN VARCHAR2 DEFAULT NULL, POUT_IMAGE OUT BLOB )

	AS

	P_DOCNO				co_saftdoc.docno%type;
	P_DOCDT				varchar(8);
	P_ESTADO			co_saftdoc.estado%type;
	P_atcud				co_saftdoc.atcud%type;
	P_cdgrsaft			co_saftdoc.cdgrsaft%type;
	P_CDSERIE			co_saftdoc.CDSERIE%type;
	P_GROSSTOT			VARCHAR(15);
	P_valor_recibo		VARCHAR(15);
	P_impostos_selo		VARCHAR(15);
	P_impostos_total	VARCHAR(15);
	P_IVAS				VARCHAR(15);
	P_IMPSELO			VARCHAR(15);
	P_OUTROSIMP			VARCHAR(15);
	P_DETALHES			VARCHAR(15);
	P_otvalor			VARCHAR(4);
	P_HASHDOC			VARCHAR(4);

	P_CDIDEPER	mpersona.cdideper%type;
	P_CDPAIS	mdomicil.cdpais%type;
	P_CDPOSTAL	NUMBER;
	P_CODPAIS	tgadconv.irpvalue%type;

	P_ID_IMP_EM	TTAPVAAT.OTVALOR03%type;
	P_N_CERT_AT	TTAPVAAT.OTVALOR14%type;

	P_erro number := 0;

	P_STR VARCHAR(4000);

	P_existe number := 0;

	lbQR blob;

	begin

		begin

			SELECT /*+ ordered */
				doc.DOCNO
				,to_char(doc.docdt, 'YYYYMMDD') docdt
				,doc.estado
				,NVL(doc.atcud, 0) atcud
				,CASE 
					WHEN doc.cdgrsaft = 'F'
						THEN 'FT'
					WHEN doc.cdgrsaft = 'N'
						THEN 'NC'
					WHEN doc.cdgrsaft = 'R'
						THEN 'RG'
					WHEN doc.cdgrsaft = 'A'
						AND doc.GROSSTOT >= 0
						THEN 'RP'
					WHEN doc.cdgrsaft = 'A'
						AND doc.GROSSTOT < 0
						THEN 'RE'
					ELSE doc.cdgrsaft
					END cdgrsaft
				,doc.CDSERIE
				,REPLACE(trim(to_char(ABS(ROUND(NVL(doc.GROSSTOT, rec.valor_recibo), 2)), '999999999990D99')), ',', '.') GROSSTOT
				,REPLACE(trim(to_char(ABS(ROUND(rec.valor_recibo, 2)), '999999999990D99')), ',', '.') valor_recibo
				,REPLACE(trim(to_char(ABS(ROUND((rec.IMPSELO + rec.OUTROSIMP), 2)), '999999999990D99')), ',', '.') impostos_selo
				,REPLACE(trim(to_char(ABS(ROUND((rec.IVAS + rec.IMPSELO + rec.OUTROSIMP), 2)), '999999999990D99')), ',', '.') impostos_total
				,REPLACE(trim(to_char(ABS(ROUND(rec.IVAS, 2)), '999999999990D99')), ',', '.') IVAS
				,REPLACE(trim(to_char(ABS(ROUND(rec.IMPSELO, 2)), '999999999990D99')), ',', '.') IMPSELO
				,REPLACE(trim(to_char(ABS(ROUND(rec.OUTROSIMP, 2)), '999999999990D99')), ',', '.') OUTROSIMP
				,REPLACE(trim(to_char(ABS(ROUND(rec.DETALHES, 2)), '999999999990D99')), ',', '.') DETALHES
				,doc.otvalor
				,SUBSTR(doc.HASHDOC, 1, 1) || SUBSTR(doc.HASHDOC, 11, 1) || SUBSTR(doc.HASHDOC, 21, 1) || SUBSTR(doc.HASHDOC, 31, 1) HASHDOC
			INTO P_DOCNO
				,P_DOCDT
				,P_ESTADO
				,P_atcud
				,P_cdgrsaft
				,P_CDSERIE
				,P_GROSSTOT
				,P_valor_recibo
				,P_impostos_selo
				,P_impostos_total
				,P_IVAS
				,P_IMPSELO
				,P_OUTROSIMP
				,P_DETALHES
				,P_otvalor
				,P_HASHDOC
			FROM co_saftdoc doc
				,(
					SELECT rec.cdunieco
						,rec.cdramo
						,rec.nmrecibo
						,rec.tiporeci
						,rec.ptimport valor_recibo
						,SUM(decode(det.cdtipcon, 'IVA', det.ptimport, 0)) IVAS
						,SUM(decode(det.cdtipcon, 'IS', det.ptimport, 0)) IMPSELO
						,SUM(decode(det.cdtipcon, 'OUT', det.ptimport, 0)) OUTROSIMP
						,SUM(decode(det.cdtipcon, 'IVA', 0, 'IS', 0, 'OUT', 0, det.ptimport)) DETALHES
					FROM mrecibo rec
						,(
							SELECT cdunieco
								,nmrecibo
								,ptimport
								,CASE 
									WHEN cdtipcon LIKE 'IS%'
										THEN 'IS'
									WHEN cdtipcon LIKE 'OUT%'
										THEN 'OUT'
									ELSE cdtipcon
									END cdtipcon
							FROM mrecidet
							) det
					WHERE rec.cdunieco = det.CDUNIECO
						AND rec.nmrecibo = det.nmrecibo
					GROUP BY rec.cdunieco
						,rec.cdramo
						,rec.nmrecibo
						,rec.tiporeci
						,rec.ptimport

					UNION ALL

					SELECT rec.cdunieco
						,rec.cdramo
						,rec.nmrecibo
						,rec.tiporeci
						,rec.ptimport valor_recibo
						,SUM(decode(det.cdtipcon, 'IVA', det.ptimport, 0)) IVAS
						,SUM(decode(det.cdtipcon, 'IS', det.ptimport, 0)) IMPSELO
						,SUM(decode(det.cdtipcon, 'OUT', det.ptimport, 0)) OUTROSIMP
						,SUM(decode(det.cdtipcon, 'IVA', 0, 'IS', 0, 'OUT', 0, det.ptimport)) DETALHES
					FROM co_dit_mrecibo rec
						,(
							SELECT cdunieco
								,nmrecibo
								,ptimport
								,CASE 
									WHEN cdtipcon LIKE 'IS%'
										THEN 'IS'
									WHEN cdtipcon LIKE 'OUT%'
										THEN 'OUT'
									ELSE cdtipcon
									END cdtipcon
							FROM co_dit_mrecidet
							) det
					WHERE rec.cdunieco = det.CDUNIECO
						AND rec.nmrecibo = det.nmrecibo
					GROUP BY rec.cdunieco
						,rec.cdramo
						,rec.nmrecibo
						,rec.tiporeci
						,rec.ptimport

					UNION ALL

					SELECT rec.cdunieco
						,0 cdramo
						,rec.nmrecibo
						,rec.tiporeci
						,rec.ptimport valor_recibo
						,SUM(decode(det.cdtipcon, 'IVA', det.ptimport, 0)) IVAS
						,SUM(decode(det.cdtipcon, 'IS', det.ptimport, 0)) IMPSELO
						,SUM(decode(det.cdtipcon, 'OUT', det.ptimport, 0)) OUTROSIMP
						,SUM(decode(det.cdtipcon, 'IVA', 0, 'IS', 0, 'OUT', 0, det.ptimport)) DETALHES
					FROM CO_SAF_FACTURA rec
						,(
							SELECT cdunieco
								,nmrecibo
								,ptimport
								,CASE 
									WHEN cdtipcon LIKE 'IS%'
										THEN 'IS'
									WHEN cdtipcon LIKE 'OUT%'
										THEN 'OUT'
									ELSE cdtipcon
									END cdtipcon
							FROM CO_SAF_FACTDET
							) det
					WHERE rec.cdunieco = det.CDUNIECO
						AND rec.nmrecibo = det.nmrecibo
					GROUP BY rec.cdunieco
						,rec.nmrecibo
						,rec.tiporeci
						,rec.ptimport
					) rec
			WHERE rec.cdunieco = doc.cdunieco
				AND rec.nmrecibo = doc.nmrecibo
				AND doc.docno = PI_DOCNO;


		EXCEPTION
			WHEN OTHERS THEN
				P_ERRO := 1;
		end;

		if P_ERRO = 1 then return;
		end if;

		begin

			SELECT /*+ ordered */
				per.cdideper
				,dom.cdpais dom_cdpais
				,decode(dom.cdpais, 'PRT', NVL(to_number(regexp_replace(decode(trim(dom.cdpostal), NULL, SUBSTR(TRIM(dom.otpiso), 1, 4), SUBSTR(TRIM(dom.cdpostal), 1, 4)), '[^[:digit:]]', '')),0), NULL) cdpostal
				,tconv.irpvalue codpais
			INTO P_CDIDEPER
				,P_CDPAIS
				,P_CDPOSTAL
				,P_CODPAIS
			FROM mpersona per
				,mdomicil dom
				,tgadconv tconv
			WHERE per.cdperson = dom.cdperson
				AND dom.CDTIPDOM = '01'
				AND dom.NMORDDOM = (
					SELECT max(x.nmorddom)
					FROM mdomicil x
					WHERE x.cdperson = dom.cdperson
						AND x.cdtipdom = dom.cdtipdom
					)
				AND tconv.gadtabla = 'TPAISES'
				AND tconv.IRPTABLA = 'CTRY'
				AND tconv.gadvalue = dom.cdpais
				AND per.cdperson = PI_CDPERSON;

		EXCEPTION
			WHEN OTHERS THEN
				P_ERRO := 1;
		end;

		if P_ERRO = 1 then return;
		end if;

		begin

			SELECT vat.otvalor03 ID_IMPOSTO_EMISSOR
				,vat.otvalor14 n_certificado_at
			INTO P_ID_IMP_EM
				,P_N_CERT_AT
			FROM TTAPVAAT vat
				,TTAPTABL tab
			WHERE vat.NMTABLA = tab.NMTABLA
				AND tab.CDTABLA = 'TSAFTDEF'
				AND trunc(sysdate) BETWEEN vat.fedesde
					AND vat.fehasta
			;

		EXCEPTION
			WHEN OTHERS THEN
				P_ERRO := 1;
		end;

		if P_ERRO = 1 then return;
		end if;

		P_STR := 'A:' || P_ID_IMP_EM || '*';
		P_STR := P_STR || 'B:' || P_CDIDEPER || '*';
		P_STR := P_STR || 'C:' || P_CODPAIS || '*';
		P_STR := P_STR || 'D:' || P_cdgrsaft || '*';
		P_STR := P_STR || 'E:' || P_ESTADO || '*';
		P_STR := P_STR || 'F:' || P_DOCDT || '*';
		P_STR := P_STR || 'G:' || P_DOCNO || '*';
		P_STR := P_STR || 'H:' || P_atcud || '*';

		IF P_CDGRSAFT in ('RP','RE') or P_CDGRSAFT = 'FR' or P_CDSERIE like 'NCP%' then

			P_STR := P_STR || 'I1:' || P_CODPAIS || '*';
			P_STR := P_STR || 'I2:' || P_DETALHES || '*';

		/*elsif P_CDGRSAFT = 'FR' or P_CDSERIE like 'NCP%' then

			IF P_CDPAIS != 'PRT' or (P_CDPAIS = 'PRT' and P_CDPOSTAL < 9000 ) then

				P_STR := P_STR || 'I1:' || P_CODPAIS || '*';
				P_STR := P_STR || 'I2:' || P_DETALHES || '*';

			ELSIF (P_CDPAIS = 'PRT' and P_CDPOSTAL >= 9500 ) then

				P_STR := P_STR || 'I1:' || 'PT-AC' || '*';
				P_STR := P_STR || 'I2:' || P_DETALHES || '*';

			ELSIF (P_CDPAIS = 'PRT' and P_CDPOSTAL < 9500 and P_CDPOSTAL >= 9000 ) then

				P_STR := P_STR || 'I1:' || 'PT-MA' || '*';
				P_STR := P_STR || 'I2:' || P_DETALHES || '*';

		end if;*/

		elsif P_CDGRSAFT = 'FT' or P_CDGRSAFT = 'RG' or P_CDSERIE like 'NCN%' then

			IF P_CDPAIS != 'PRT' then

				P_STR := P_STR || 'I1:' || P_CODPAIS || '*';

			elsif P_CDPAIS = 'PRT' then

				IF P_otvalor like 'I%' then

					IF  P_CDPOSTAL < 9000  then

						P_STR := P_STR || 'I1:' || P_CODPAIS || '*';
						P_STR := P_STR || 'I2:' || P_DETALHES || '*';

					ELSIF P_CDPOSTAL >= 9500  then

						P_STR := P_STR || 'I1:' || 'PT-AC' || '*';
						P_STR := P_STR || 'I2:' || P_DETALHES || '*';

					ELSIF P_CDPOSTAL < 9500 and P_CDPOSTAL >= 9000 then

						P_STR := P_STR || 'I1:' || 'PT-MA' || '*';
						P_STR := P_STR || 'I2:' || P_DETALHES || '*';

					end if;

				elsif P_otvalor like 'S%' and P_otvalor not in ('SA','SM') then	

					P_STR := P_STR || 'I1:' || P_CODPAIS || '*';
					P_STR := P_STR || 'I7:' || P_DETALHES || '*';
					P_STR := P_STR || 'I8:' || P_IVAS || '*';

				elsif P_otvalor = 'SA' then	

					P_STR := P_STR || 'I1:' || 'PT-AC' || '*';
					P_STR := P_STR || 'I7:' || P_DETALHES || '*';
					P_STR := P_STR || 'I8:' || P_IVAS || '*';

				elsif P_otvalor = 'SM' then	

					P_STR := P_STR || 'I1:' || 'PT-MA' || '*';
					P_STR := P_STR || 'I7:' || P_DETALHES || '*';
					P_STR := P_STR || 'I8:' || P_IVAS || '*';

				ELSE

					IF  P_CDPOSTAL < 9000  then

						P_STR := P_STR || 'I1:' || P_CODPAIS || '*';

					ELSIF P_CDPOSTAL >= 9500  then	

						P_STR := P_STR || 'I1:' || 'PT-AC' || '*';

					ELSIF P_CDPOSTAL < 9500 and P_CDPOSTAL >= 9000 then

						P_STR := P_STR || 'I1:' || 'PT-MA' || '*';

					END IF;

				end if;

			end if;

		end if;

		IF P_otvalor like 'N%' or P_otvalor like 'A%' then

			P_STR := P_STR || 'L:' || P_valor_recibo || '*';

		end if;

		IF P_impostos_selo != '0.00' and P_impostos_selo is not null then

			P_STR := P_STR || 'M:' || P_impostos_selo || '*';

		end if;

		P_STR := P_STR || 'N:' || P_impostos_total || '*';

		P_STR := P_STR || 'O:' || P_GROSSTOT || '*';

		P_STR := P_STR || 'Q:' || P_HASHDOC || '*';

		P_STR := P_STR || 'R:' || P_N_CERT_AT;

		IF PI_OUTROINFO is not null then

			P_STR := P_STR || '*S:' || PI_OUTROINFO;

		end if;

		P_STR := TRIM(P_STR);

		lbQR := f_bmp2jpg( 
					ZT_QR.F_QR_AS_BMP(
						p_data => P_STR,
						p_error_correction => 'M',
						p_type_qr => 3)
		);

		begin

			select 1
			into P_existe
			from GD_DOC_SAFT_QRCODE
			where docno = PI_DOCNO
			and cdperson = PI_CDPERSON;

		EXCEPTION
			WHEN OTHERS THEN
				P_existe := 0;
		end;


		if P_existe = 1 then

			UPDATE GD_DOC_SAFT_QRCODE
			SET STR_QRCODE = P_STR
				,QR_CODE = lbQR
			WHERE docno = PI_DOCNO
				AND cdperson = PI_CDPERSON;

			commit;


		else

			INSERT INTO GD_DOC_SAFT_QRCODE (
				DOCNO
				,CDPERSON
				,STR_QRCODE
				,QR_CODE
				)
			VALUES (
				PI_DOCNO
				,PI_CDPERSON
				,P_STR
				,lbQR
				);

			commit;

		end if;


		POUT_IMAGE := lbQR;

	end GENERATE_QR_CODE_SAFT;


	/*
	-* NOME      : GET_QR_CODE_SAFT
	-* OBJECTIVO : RETORNA UMA IMAGEM DO CODIGO QR A INSERIR NOS DOCUMENTOS DE FATURACAO
	-* UTILIZACAO: PKG_DOCUMENTOS_SAFT.GET_QR_CODE_SAFT( );
	-* AUTOR     : JOÃO RIBEIRO
	-* DATA      : 10-09-2021
	-* VERSÃO    : 1.0
	-*
	-* ÚLTIMAS ALTERAÇÕES
	-*
	-*   DATA       AUTOR           DESCRIÇÃO
	-*   ========== =============== =================================================
	-*
	-*/
	FUNCTION GET_QR_CODE_SAFT (PI_DOCNO IN VARCHAR2, PI_CDPERSON IN NUMBER, PI_OUTROINFO IN VARCHAR2 DEFAULT NULL ) RETURN BLOB

	IS
	PRAGMA AUTONOMOUS_TRANSACTION;

	lbQR blob;

	begin

		GENERATE_QR_CODE_SAFT(PI_DOCNO,PI_CDPERSON,PI_OUTROINFO,lbQR);

		return lbQR;	

	end GET_QR_CODE_SAFT;

	/*
	-* NOME      : GET_LABEL_ATCUD_SAFT
	-* OBJECTIVO : RETORNA A LABEL DO ATCUD QUE FICA POR CIMA DO QRCODE
	-* UTILIZACAO: PKG_DOCUMENTOS_SAFT.GET_LABEL_ATCUD_SAFT( CO_SAFTDOC.DOCNO );
	-* AUTOR     : JOÃO RIBEIRO
	-* DATA      : 15-09-2021
	-* VERSÃO    : 1.0
	-*
	-* ÚLTIMAS ALTERAÇÕES
	-*
	-*   DATA       AUTOR           DESCRIÇÃO
	-*   ========== =============== =================================================
	-*
	-*/
	FUNCTION GET_LABEL_ATCUD_SAFT (PI_DOCNO IN VARCHAR2) RETURN VARCHAR2
	IS

	P_erro number := 0;

	P_atcud co_saftdoc.docno%type;

	P_LABEL varchar2(200);

	begin

		begin

			SELECT 
				doc.atcud
			INTO P_atcud
			FROM co_saftdoc doc
			WHERE doc.docno = PI_DOCNO;

		EXCEPTION
			WHEN OTHERS THEN
				P_ERRO := 1;
		end;

		if P_ERRO = 1 then return null;
		end if;

		IF P_atcud != '0' then 

			P_LABEL := 'ATCUD:'||P_atcud;

			return P_LABEL;	

		else 

			return null;

		end if;

	end GET_LABEL_ATCUD_SAFT;

END Pkg_Documentos_SAFT;

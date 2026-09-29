-- PCK_ESTADO_GAR (owner: SIID_TESTES)


-- ===== SPEC (PACKAGE) =====

PACKAGE PCK_ESTADO_GAR AS
	   FUNCTION GET_GAR_ER(PI_CDUNIECO CO_PROROL.CDUNIECO%TYPE,PI_CDRAMO   CO_PROROL.CDRAMO%TYPE,PI_NMPROPUE CO_PROROL.NMPROPUE%TYPE,PI_NMGARANT CO_PROROL.NMGARANT%TYPE) RETURN NUMBER; 
	   FUNCTION GET_ESTAPG(V_SWESTADO VARCHAR2, V_FECHA DATE, V_FEDECISI DATE,V_NMPEDIDO VARCHAR2, V_NMEVENTO NUMBER,V_CDANADEC VARCHAR2, V_CDPERSON NUMBER) RETURN VARCHAR2;
	   FUNCTION GET_ESTAPG_v2(V_SWESTADO VARCHAR2, V_FECHA DATE, V_FEDECISI DATE,V_NMPEDIDO VARCHAR2, V_NMEVENTO NUMBER,V_CDANADEC VARCHAR2, V_CDPERSON NUMBER) RETURN VARCHAR2;
	   FUNCTION GET_ESTAPG_v3(V_SWESTADO VARCHAR2, V_FECHA DATE, V_FEDECISI DATE,V_NMPEDIDO VARCHAR2, V_NMEVENTO NUMBER,V_CDANADEC VARCHAR2, V_CDPERSON NUMBER, V_CDORIGEN VARCHAR2, V_CDTIPGAR VARCHAR2) RETURN VARCHAR2;
       FUNCTION GET_ESTAPG_v4(V_SWESTADO VARCHAR2, V_FECHA DATE, V_FEDECISI DATE,V_NMPEDIDO VARCHAR2, V_NMEVENTO NUMBER,V_CDANADEC VARCHAR2, V_CDPERSON NUMBER, V_CDORIGEN VARCHAR2, V_CDTIPGAR VARCHAR2) RETURN VARCHAR2;
END PCK_ESTADO_GAR;

-- ===== BODY (PACKAGE BODY) =====

PACKAGE BODY PCK_ESTADO_GAR AS

FUNCTION GET_GAR_ER(PI_CDUNIECO CO_PROROL.CDUNIECO%TYPE, 
		 			PI_CDRAMO   CO_PROROL.CDRAMO%TYPE, 
                    PI_NMPROPUE CO_PROROL.NMPROPUE%TYPE, 
					PI_NMGARANT CO_PROROL.NMGARANT%TYPE) RETURN NUMBER 
AS
   RETORNO NUMBER(9);
BEGIN
	SELECT a.CDPERSON
	INTO RETORNO
	FROM CO_PROROL a
	WHERE a.CDUNIECO = PI_cdunieco
		AND a.CDRAMO = PI_cdramo
		AND a.NMPROPUE = PI_nmpropue
		AND a.CDROL = DECODE(PI_CDRAMO, 201, 'CR', 'ER')
		AND a.NMGARANT = PI_nmgarant
		AND a.STATUS = 'V'
		AND a.NMORDINA = (
			SELECT Max(b.NMORDINA)
			FROM CO_PROROL b
			WHERE b.CDUNIECO = a.CDUNIECO
				AND b.CDRAMO = a.CDRAMO
				AND b.NMPROPUE = a.NMPROPUE
				AND b.CDROL = a.CDROL
				AND b.NMGARANT = a.NMGARANT
				AND b.STATUS = a.STATUS
			);


	RETURN RETORNO;

EXCEPTION
	WHEN NO_DATA_FOUND THEN
		RETURN 0;
END;


FUNCTION GET_ESTAPG(V_SWESTADO VARCHAR2, V_FECHA DATE, V_FEDECISI DATE,
                    V_NMPEDIDO VARCHAR2, V_NMEVENTO NUMBER,
                    V_CDANADEC VARCHAR2, V_CDPERSON NUMBER) RETURN VARCHAR2 
AS
   CAD VARCHAR2(4);
   AUX_SWESTADO VARCHAR2(10);
   AUX_ESTDET   VARCHAR2(2);
   aux_dataini  DATE;
   aux_ptimpind NUMBER(17,5);
   aux_ptimpglo NUMBER(17,5);
   aux_riesacum NUMBER(17,5);
   aux_swplacas VARCHAR2(1);
BEGIN
    IF (V_FEDECISI IS NOT NULL AND V_SWESTADO IN ('PR','DB','D','M','S','A','AP') ) THEN /* Decididas */
        BEGIN
			begin
				SELECT PTIMPIND
					,PTIMPGLO
					,SWPLACAS
					,DATAINI
				INTO aux_ptimpind
					,aux_ptimpglo
					,aux_swplacas
					,aux_dataini
				FROM CO_PLAFOCRE
				WHERE CDPERSON = v_cdperson
					AND V_FEDECISI BETWEEN DATAINI
						AND DATAFIN
					AND rownum < 2
				ORDER BY NMPLAFON;

			exception
				when no_data_found then
					AUX_SWESTADO := 'DE04';
					RETURN AUX_SWESTADO;
			end;

			-- Si llega aqui es que hay plafond. 
			IF (V_CDANADEC = 'REPAES') THEN      /* Ped. de garantia decidido Automát.*/

				IF (AUX_SWPLACAS = 'N') THEN 
					AUX_SWESTADO := 'DE01';   /* "Enquadradas nas REPAE's" */

				ELSE  /* SWPLACAS = 'S'*/
					AUX_SWESTADO := 'DE02';   /*  "Enquadradas no Plafond casuístico" */

				END IF;

			ELSE   /* Ped. de garantia decidido Casuisticamente.*/

				IF V_FEDECISI = aux_dataini THEN
					AUX_SWESTADO := 'DE03'; /* Não enquadradas com necessidades de novo plafond */ 

				ELSE
					AUX_SWESTADO := 'DE04';  /* Fora do Plafond */
				END IF;

			END IF;
        END;         /* Fin Decicidas */

        RETURN AUX_SWESTADO;

    ELSIF (V_SWESTADO = 'PE') THEN
        BEGIN
			SELECT CDESTADO
			INTO AUX_ESTDET
			FROM CO_DETAANR
			WHERE NMPEDIDO = V_NMPEDIDO
				AND NMEVENTO = V_NMEVENTO;

			AUX_SWESTADO := V_SWESTADO||AUX_ESTDET;

		EXCEPTION
			WHEN OTHERS THEN
				RETURN 'PE';
        END;

    ELSIF (V_SWESTADO IN ('PP','E','PN','B')) THEN
        AUX_SWESTADO := V_SWESTADO;
    END IF;


	CAD := '';
	IF (V_SWESTADO IN ('PE','PN','PP')) THEN
		BEGIN
			IF TRUNC((sysdate-V_FECHA)/30) > 1  THEN CAD := '03';

			ELSE
				BEGIN
					IF TRUNC((sysdate-V_FECHA)/7) >= 1  THEN CAD := '02';
					ELSE   CAD := '01';
					END IF;
				END;
			END IF;
		END;

	END IF;

   RETURN  (AUX_SWESTADO||CAD);

END;   



FUNCTION GET_ESTAPG_V2(V_SWESTADO VARCHAR2, V_FECHA DATE, V_FEDECISI DATE,
                       V_NMPEDIDO VARCHAR2, V_NMEVENTO NUMBER,
                       V_CDANADEC VARCHAR2, V_CDPERSON NUMBER) RETURN VARCHAR2 
AS
   CAD VARCHAR2(4);
   AUX_SWESTADO VARCHAR2(10);
   AUX_ESTDET   VARCHAR2(2);
   aux_dataini  DATE;
   aux_ptimpind NUMBER(17,5);
   aux_ptimpglo NUMBER(17,5);
   aux_riesacum NUMBER(17,5);
   aux_swplacas VARCHAR2(1);
BEGIN
    IF ( V_FEDECISI IS NOT NULL AND V_SWESTADO IN ('PR','DB','D','M','S','A','AP')) THEN /* Decididas */
        BEGIN
			begin
				SELECT PTIMPIND
					,PTIMPGLO
					,SWPLACAS
					,DATAINI
				INTO aux_ptimpind
					,aux_ptimpglo
					,aux_swplacas
					,aux_dataini
				FROM CO_PLAFOCRE
				WHERE CDPERSON = v_cdperson
					AND V_FEDECISI BETWEEN DATAINI
						AND DATAFIN
					AND rownum < 2
				ORDER BY NMPLAFON;

			exception
				when no_data_found then
					AUX_SWESTADO := 'DE04';
					RETURN AUX_SWESTADO;
			end;


          -- Si llega aqui es que hay plafond. 
			IF (V_CDANADEC = 'REPAES') THEN      
				AUX_SWESTADO := 'DE01';   /* "Enquadradas nas REPAE's" */
			ELSIF ((V_CDANADEC <> 'REPAES' or V_CDANADEC is null) and v_nmpedido is null) THEN      
				AUX_SWESTADO := 'DE02';   /* "Enquadradas no plafon casuístico */
			ELSIF (v_nmpedido is not null) THEN      
				AUX_SWESTADO := 'DE03';   /* "nÃO ENQUADRADAS COM NECESSIDADE */
			ELSE
				AUX_SWESTADO := 'ERRO';   /* Enquadradas no plafon casuístico */
			END if;

		end;


		RETURN AUX_SWESTADO;

    ELSIF (V_SWESTADO = 'PE') THEN

        BEGIN
			SELECT CDESTADO
			INTO AUX_ESTDET
			FROM CO_DETAANR
			WHERE NMPEDIDO = V_NMPEDIDO
				AND NMEVENTO = V_NMEVENTO;

			AUX_SWESTADO := V_SWESTADO||AUX_ESTDET;

        EXCEPTION
			WHEN OTHERS THEN
				RETURN 'PE';
        END;

    ELSIF (V_SWESTADO IN ('PP','E','PN','B')) THEN
        AUX_SWESTADO := V_SWESTADO;
    END IF;
   --
	CAD := '';
	IF (V_SWESTADO IN ('PE','PN','PP')) THEN
		BEGIN
			IF TRUNC((sysdate-V_FECHA)/30) > 1  THEN CAD := '03';
			ELSE
				BEGIN
					IF TRUNC((sysdate-V_FECHA)/7) >= 1 THEN CAD := '02';
					ELSE CAD := '01';
					END IF;
				END;
			END IF;
		END;

	END IF;

	RETURN  (AUX_SWESTADO||CAD);
END; 


FUNCTION GET_ESTAPG_V3(V_SWESTADO VARCHAR2, V_FECHA DATE, V_FEDECISI DATE,
                       V_NMPEDIDO VARCHAR2, V_NMEVENTO NUMBER,
                       V_CDANADEC VARCHAR2, V_CDPERSON NUMBER,
					   V_CDORIGEN VARCHAR2, V_CDTIPGAR VARCHAR2) RETURN VARCHAR2 
AS
   CAD VARCHAR2(4);
   AUX_SWESTADO VARCHAR2(10);
   AUX_ESTDET   VARCHAR2(2);
   aux_dataini  DATE;
   aux_ptimpind NUMBER(17,5);
   aux_ptimpglo NUMBER(17,5);
   aux_riesacum NUMBER(17,5);
   aux_swplacas VARCHAR2(1);
BEGIN
    IF (V_FEDECISI IS NOT NULL AND V_SWESTADO IN ('PR','DB','D','M','S','A','AP')) THEN /* Decididas */
        BEGIN
			IF (V_CDORIGEN ='06' OR V_CDANADEC = 'VA NEUTRA' OR V_CDTIPGAR='P') THEN
				AUX_SWESTADO := 'DE00';  /* TRANSF AUTOM. VA NEUTRA OU PROVISORIA */
			ELSE  
				begin
					SELECT PTIMPIND
						,PTIMPGLO
						,SWPLACAS
						,DATAINI
					INTO aux_ptimpind
						,aux_ptimpglo
						,aux_swplacas
						,aux_dataini
					FROM CO_PLAFOCRE
					WHERE CDPERSON = v_cdperson
						AND V_FEDECISI BETWEEN DATAINI
							AND DATAFIN
						AND rownum < 2
					ORDER BY NMPLAFON;

				exception
					when no_data_found then
						AUX_SWESTADO := 'DE04';
						RETURN AUX_SWESTADO;
				end;

				-- Si llega aqui es que hay plafond.

				IF (V_CDANADEC = 'REPAES') THEN      
					AUX_SWESTADO := 'DE01';   /* "Enquadradas nas REPAE's" */
				ELSIF ((V_CDANADEC <> 'REPAES' or V_CDANADEC is null) and v_nmpedido is null) THEN      
					AUX_SWESTADO := 'DE02';   /* "Enquadradas no plafon casuístico */
				ELSIF (v_nmpedido is not null) THEN      
					AUX_SWESTADO := 'DE03';   /* "nÃO ENQUADRADAS COM NECESSIDADE */
				ELSE
					AUX_SWESTADO := 'ERRO';   /* Enquadradas no plafon casuístico */
				END if;

			END IF;

		end;

		RETURN AUX_SWESTADO;

    ELSIF (V_SWESTADO = 'PE') THEN
        BEGIN
			SELECT CDESTADO
			INTO AUX_ESTDET
			FROM CO_DETAANR
			WHERE NMPEDIDO = V_NMPEDIDO
				AND NMEVENTO = V_NMEVENTO;

			AUX_SWESTADO := V_SWESTADO||AUX_ESTDET;
        EXCEPTION
			WHEN OTHERS THEN
				RETURN 'PE';
        END;

    ELSIF (V_SWESTADO IN ('PP','E','PN','B')) THEN
		AUX_SWESTADO := V_SWESTADO;
    END IF;
   --
	CAD := '';
	IF (V_SWESTADO IN ('PE','PN','PP')) THEN
		BEGIN
			IF TRUNC((sysdate-V_FECHA)/30) > 1 THEN CAD := '03';
			ELSE
				BEGIN
				IF TRUNC((sysdate-V_FECHA)/7) >= 1 THEN CAD := '02';
				ELSE CAD := '01';
				END IF;
				END;
			END IF;
		END;

	END IF;

	RETURN  (AUX_SWESTADO||CAD);
END; 


FUNCTION GET_ESTAPG_V4(V_SWESTADO VARCHAR2, V_FECHA DATE, V_FEDECISI DATE,
                       V_NMPEDIDO VARCHAR2, V_NMEVENTO NUMBER,
                       V_CDANADEC VARCHAR2, V_CDPERSON NUMBER,
                       V_CDORIGEN VARCHAR2, V_CDTIPGAR VARCHAR2) RETURN VARCHAR2 
AS
   CAD VARCHAR2(4);
   AUX_SWESTADO VARCHAR2(10);
   AUX_ESTDET   VARCHAR2(2);
   aux_dataini  DATE;
   aux_ptimpind NUMBER(17,5);
   aux_ptimpglo NUMBER(17,5);
   aux_riesacum NUMBER(17,5);
   aux_swplacas VARCHAR2(1);
BEGIN
    IF (V_FEDECISI IS NOT NULL AND V_SWESTADO IN ('PR','DB','D','M','S','A','AP')) THEN /* Decididas */
        BEGIN
			IF (V_CDORIGEN ='06' OR V_CDANADEC = 'VA NEUTRA' OR V_CDTIPGAR='P') THEN
				AUX_SWESTADO := 'DE00';  /* TRANSF AUTOM. VA NEUTRA OU PROVISORIA */
			ELSE  
				begin
					SELECT PTIMPIND
						,PTIMPGLO
						,SWPLACAS
						,DATAINI
					INTO aux_ptimpind
						,aux_ptimpglo
						,aux_swplacas
						,aux_dataini
					FROM CO_PLAFOCRE
					WHERE CDPERSON = v_cdperson
						AND V_FEDECISI BETWEEN DATAINI
							AND DATAFIN
						AND rownum < 2
					ORDER BY NMPLAFON;

				exception
					when no_data_found then
						AUX_SWESTADO := 'DE04';
						RETURN AUX_SWESTADO;
				end;

			-- Si llega aqui es que hay plafond.

				IF (V_CDANADEC = 'DECRT') THEN      
					AUX_SWESTADO := 'DE01';   /* "Enquadradas nas REPAE's" */
				ELSIF ((V_CDANADEC <> 'DECRT' or V_CDANADEC is null) and v_nmpedido is null) THEN      
					AUX_SWESTADO := 'DE02';   /* "Enquadradas no plafon casuístico */
				ELSIF (v_nmpedido is not null) THEN      
					AUX_SWESTADO := 'DE03';   /* "nÃO ENQUADRADAS COM NECESSIDADE */
				ELSE
					AUX_SWESTADO := 'ERRO';   /* Enquadradas no plafon casuístico */
				END if;

			END IF;

		end;

		RETURN AUX_SWESTADO;

    ELSIF (V_SWESTADO = 'PE') THEN
        BEGIN
			SELECT CDESTADO
			INTO AUX_ESTDET
			FROM CO_DETAANR
			WHERE NMPEDIDO = V_NMPEDIDO
				AND NMEVENTO = V_NMEVENTO;

			AUX_SWESTADO := V_SWESTADO||AUX_ESTDET;
        EXCEPTION
			WHEN OTHERS THEN
				RETURN 'PE';
        END;

    ELSIF (V_SWESTADO IN ('PP','E','PN','B')) THEN
		AUX_SWESTADO := V_SWESTADO;
    END IF;
   --
	CAD := '';
	IF (V_SWESTADO IN ('PE','PN','PP')) THEN
		BEGIN
			IF TRUNC((sysdate-V_FECHA)/30) > 1  THEN CAD := '03';
			ELSE
				BEGIN
					IF TRUNC((sysdate-V_FECHA)/7) >= 1 THEN CAD := '02';
					ELSE CAD := '01';
					END IF;
				END;
			END IF;
		END;

	END IF;

	RETURN  (AUX_SWESTADO||CAD);
END; 


END PCK_ESTADO_GAR;

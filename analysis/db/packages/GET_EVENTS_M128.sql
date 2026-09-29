-- GET_EVENTS_M128 (owner: SIID_TESTES)


-- ===== FUNCTION =====

FUNCTION GET_EVENTS_M128 
(
  P_CDEVENTO IN VARCHAR2 
, P_COD IN NUMBER 
, P_DATA_INIT IN DATE 
, P_DATA_FIM IN DATE 
) RETURN NUMBER AS 
V_AUX_EVENT VARCHAR2(10);
V_AUX_NUMBER NUMBER;
BEGIN
	if P_COD = 1 then
	
		begin
					
			SELECT a.cdevento
				,count(*)
			INTO V_AUX_EVENT
				,V_AUX_NUMBER
			FROM co_detaanr a
			WHERE 1 = 1
				AND a.cdevento = P_CDEVENTO
				AND (
					(
						a.cdestado NOT IN (
							'AN'
							,'DE'
							)
						AND trunc(a.feevento) < TRUNC(P_DATA_INIT)
						)
					OR (
						a.cdestado IN (
							'AN'
							,'DE'
							)
						AND trunc(a.feultest) >= TRUNC(P_DATA_INIT)
						AND trunc(a.feevento) < TRUNC(P_DATA_INIT)
						)
					)
			group by a.cdevento
			;
		
			return V_AUX_NUMBER;
			
		EXCEPTION
			WHEN OTHERS THEN
				RETURN null;
		END;
		
	
	ELSIF P_COD = 2 then
	
		begin
					
			SELECT a.cdevento
				,count(*)
			INTO V_AUX_EVENT
				,V_AUX_NUMBER
			FROM co_detaanr a
			WHERE 1 = 1
				AND a.cdevento = P_CDEVENTO
				AND trunc(a.feevento) >= TRUNC(P_DATA_INIT)
				AND trunc(a.feevento) <= TRUNC(P_DATA_FIM)
			group by a.cdevento
			;
		
			return V_AUX_NUMBER;
			
		EXCEPTION
			WHEN OTHERS THEN
				RETURN null;
		END;
		
	
	ELSIF P_COD = 3 then
	
		begin
					
			SELECT a.cdevento
				,count(*)
			INTO V_AUX_EVENT
				,V_AUX_NUMBER
			FROM co_detaanr a
			WHERE 1 = 1
				AND a.cdevento = P_CDEVENTO
				AND a.cdestado IN (
					'AN'
					,'DE'
					)
				AND trunc(a.FEULTEST) >= TRUNC(P_DATA_INIT)
				AND trunc(a.FEULTEST) <= TRUNC(P_DATA_FIM)
			group by a.cdevento
			;
		
			return V_AUX_NUMBER;
			
		EXCEPTION
			WHEN OTHERS THEN
				RETURN null;
		END;
		
	
	ELSIF P_COD = 4 then
	
		begin
					
			SELECT a.cdevento
				,count(*)
			INTO V_AUX_EVENT
				,V_AUX_NUMBER
			FROM co_detaanr a
			WHERE 1 = 1
				AND a.cdevento = P_CDEVENTO
				AND (
					(
						a.cdestado NOT IN (
							'AN'
							,'DE'
							)
						AND trunc(a.feevento) <= TRUNC(P_DATA_FIM)
						)
					OR (
						a.cdestado IN (
							'AN'
							,'DE'
							)
						AND trunc(a.feultest) > TRUNC(P_DATA_FIM)
						AND trunc(a.feevento) <= TRUNC(P_DATA_FIM)
						)
					)
			group by a.cdevento
			;
		
			return V_AUX_NUMBER;
			
		EXCEPTION
			WHEN OTHERS THEN
				RETURN null;
		END;
		
	
	ELSIF P_COD = 5 then
	
		begin
					
			SELECT a.cdevento
				,SUM(decode(b.CDCOCUR, NULL, 0, 1))
			INTO V_AUX_EVENT
				,V_AUX_NUMBER
			FROM co_detaanr a
				,co_ocuranr b
			WHERE 1 = 1
				AND a.cdevento = P_CDEVENTO
				AND (
					(
						a.cdestado NOT IN (
							'AN'
							,'DE'
							)
						AND trunc(a.feevento) < TRUNC(P_DATA_INIT)
						)
					OR (
						a.cdestado IN (
							'AN'
							,'DE'
							)
						AND trunc(a.feultest) >= TRUNC(P_DATA_INIT)
						AND trunc(a.feevento) < TRUNC(P_DATA_INIT)
						)
					)
                AND b.nmpedido = a.nmpedido
                AND b.nmevento = a.nmevento
			GROUP BY a.cdevento;

		
			return V_AUX_NUMBER;
			
		EXCEPTION
			WHEN OTHERS THEN
				RETURN null;
		END;
		
	
	ELSIF P_COD = 6 then
	
		begin
					
			SELECT a.cdevento
				,SUM(decode(b.CDCOCUR, NULL, 0, 1))
			INTO V_AUX_EVENT
				,V_AUX_NUMBER
			FROM co_detaanr a
				,co_ocuranr b
			WHERE 1 = 1
				AND a.cdevento = P_CDEVENTO
				AND trunc(a.feevento) >= TRUNC(P_DATA_INIT)
				AND trunc(a.feevento) <= TRUNC(P_DATA_FIM)
                AND b.nmpedido = a.nmpedido
                AND b.nmevento = a.nmevento
			GROUP BY a.cdevento;

		
			return V_AUX_NUMBER;
			
		EXCEPTION
			WHEN OTHERS THEN
				RETURN null;
		END;
		
	
	ELSIF P_COD = 7 then
	
		begin
					
			SELECT a.cdevento
				,SUM(decode(b.CDCOCUR, NULL, 0, 1))
			INTO V_AUX_EVENT
				,V_AUX_NUMBER
			FROM co_detaanr a
				,co_ocuranr b
			WHERE 1 = 1
				AND a.cdevento = P_CDEVENTO
				AND a.cdestado IN (
					'AN'
					,'DE'
					)
				AND trunc(a.FEULTEST) >= TRUNC(P_DATA_INIT)
				AND trunc(a.FEULTEST) <= TRUNC(P_DATA_FIM)
                AND b.nmpedido = a.nmpedido
                AND b.nmevento = a.nmevento
			GROUP BY a.cdevento;

		
			return V_AUX_NUMBER;
			
		EXCEPTION
			WHEN OTHERS THEN
				RETURN null;
		END;
		
	
	ELSIF P_COD = 8 then
	
		begin
					
			SELECT a.cdevento
				,SUM(decode(b.CDCOCUR, NULL, 0, 1))
			INTO V_AUX_EVENT
				,V_AUX_NUMBER
			FROM co_detaanr a
				,co_ocuranr b
			WHERE 1 = 1
				AND a.cdevento = P_CDEVENTO
				AND (
					(
						a.cdestado NOT IN (
							'AN'
							,'DE'
							)
						AND trunc(a.feevento) <= TRUNC(P_DATA_FIM)
						)
					OR (
						a.cdestado IN (
							'AN'
							,'DE'
							)
						AND trunc(a.feultest) > TRUNC(P_DATA_FIM)
						AND trunc(a.feevento) <= TRUNC(P_DATA_FIM)
						)
					)
                AND b.nmpedido = a.nmpedido
                AND b.nmevento = a.nmevento
			GROUP BY a.cdevento;

		
			return V_AUX_NUMBER;
			
		EXCEPTION
			WHEN OTHERS THEN
				RETURN null;
		END;
		
	
	ELSE return null;
			
	END if;
END GET_EVENTS_M128;

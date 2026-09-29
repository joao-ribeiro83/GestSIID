-- LISTA_ENTTOMADOR (owner: SIID_TESTES)


-- ===== FUNCTION =====

FUNCTION LISTA_ENTTOMADOR(P_ENTIDADE IN NUMBER) RETURN TAB_ENTTOMADOR
PIPELINED IS

    CURSOR selTABELA IS
		SELECT pero.cdperson
      ,NVL(COUNT(DISTINCT pero.NMPOLIZA), 0) NUM_APOLICES
      ,SUM(pero.apolice_cred) num_apolices_cred
      ,SUM(pero.apolice_cau) num_apolices_cau
    FROM (
      SELECT apolice.cdunieco
        ,apolice.cdramo
        ,apolice.ESTADO
        ,apolice.nmpoliza
        ,CASE 
          WHEN apolice.cdramo < 200
            THEN 1
          ELSE 0
          END apolice_cred
        ,CASE 
          WHEN apolice.cdramo > 199
            THEN 1
          ELSE 0
          END apolice_cau
        ,apolice.cdperson
      FROM (
        SELECT /* + ordered */
          apolice.cdunieco
          ,apolice.cdramo
          ,apolice.estado
          ,apolice.nmpoliza
          ,apolice.cdperson
        FROM (
          SELECT /* + ordered */
            per.cdunieco
            ,per.cdramo
            ,per.estado
            ,per.nmpoliza
            ,per.cdperson
            ,MAX(X.NSUPLOGI) NSUPLOGI
          FROM mpoliper per
            ,MSUPLEME X
          WHERE 2 = 2
            AND X.NMSUPLEM <= TO_CHAR(sysdate, 'J') || '99999999999'
            AND X.NMPOLIZA = per.NMPOLIZA
            AND X.ESTADO = per.ESTADO
            AND X.CDRAMO = per.CDRAMO
            AND X.CDUNIECO = per.CDUNIECO
            AND per.STATUS = 'V'
            AND per.CDROL = 'TO'
            AND per.cdunieco = 1
            AND per.cdperson = P_ENTIDADE
          GROUP BY per.cdunieco
            ,per.cdramo
            ,per.estado
            ,per.nmpoliza
            ,per.cdperson
          ) apolice
          ,TDESCSUP SUPLOGIC
        WHERE 1 = 1
          AND SUPLOGIC.NMPOLIZA = apolice.NMPOLIZA
          AND SUPLOGIC.ESTADO = apolice.ESTADO
          AND SUPLOGIC.CDRAMO = apolice.CDRAMO
          AND SUPLOGIC.CDUNIECO = apolice.CDUNIECO
          and SUPLOGIC.NSUPLOGI = apolice.NSUPLOGI
          AND SUPLOGIC.ESTADO = 'M'
          AND SUPLOGIC.CDUNIECO = 1
          AND SUPLOGIC.CDTIPSUP != '52'
        ) apolice
      ) pero
    GROUP BY pero.cdperson;

  BEGIN

    FOR RW IN selTABELA LOOP
		PIPE ROW (LINHA_ENTTOMADOR(RW.cdperson
							,RW.NUM_APOLICES 
							,RW.num_apolices_cred
							,RW.num_apolices_cau
                              )
				);
    END LOOP;

    RETURN;

END LISTA_ENTTOMADOR;

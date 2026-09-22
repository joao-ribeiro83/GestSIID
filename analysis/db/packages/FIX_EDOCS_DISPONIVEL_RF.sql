-- FIX_EDOCS_DISPONIVEL_RF (owner: SIID_TESTES)


-- ===== PROCEDURE =====

PROCEDURE FIX_EDOCS_DISPONIVEL_RF IS 
BEGIN
    update  SVR_DOCUMENTOS          DOC  
    set doc.disponivel_rf='EDC'
    where  
      DOC.MODELO_ID                          = 'R3.D25R'
    and DOC.DISPONIVEL_RF='ONL'
    And DOC.DATA_ARQUIVO is null
    and DOC.DATA_EXECUCAO is not null
    and DOC.DATA_IMPRESSAO is null
    and doc.n_geracoes>0
    and doc.data_pedido > to_date('15-05-2014','dd-mm-yyyy')
    and sysdate - doc.data_pedido < 10
    and destinatario is not null
    AND EXISTS ( 
               SELECT 
               1 
               FROM 
               co_usupolfu F76 
               , CO_PROGAR   GARANTIA
               where 
                 F76.nmpoliza      = GARANTIA.nmpoliza
               AND F76.ESTADO        = 'M'
               AND F76.CDRAMO        = GARANTIA.CDRAMO
               AND F76.CDUNIECO      = GARANTIA.CDUNIECO
               and F76.cdfuncion     = '76' 
               and F76.swacceso      = 'S' 
               AND trunc(F76.FECHACCES)    <= trunc(GARANTIA.FEREGISGAR)
               AND GARANTIA.CDUNIECO = DOC.PARAMETRO05
               AND GARANTIA.CDRAMO   = DOC.PARAMETRO06
               AND GARANTIA.NMPOLIZA = DOC.PARAMETRO04
               AND GARANTIA.NMGARANT = DOC.PARAMETRO07
             );
    update  SVR_DOCUMENTOS          DOC  
    set doc.disponivel_rf='EDC'
    where  
      DOC.MODELO_ID                          = 'R3.D25'
    and DOC.DISPONIVEL_RF='ONL'
    And DOC.DATA_ARQUIVO is null
    and DOC.DATA_EXECUCAO is not null
    and DOC.DATA_IMPRESSAO is null
    and doc.n_geracoes>0
    and doc.data_pedido > to_date('15-05-2014','dd-mm-yyyy')
    and destinatario is not null
    AND EXISTS ( 
               SELECT 
               1 
               FROM 
               co_usupolfu F76 
               , CO_PROGAR   GARANTIA
               where 
                 F76.nmpoliza      = GARANTIA.nmpoliza
               AND F76.ESTADO        = 'M'
               AND F76.CDRAMO        = GARANTIA.CDRAMO
               AND F76.CDUNIECO      = GARANTIA.CDUNIECO
               and F76.cdfuncion     = '76' 
               and F76.swacceso      = 'S' 
               AND trunc(F76.FECHACCES)    <= trunc(GARANTIA.FEREGISGAR)
               AND GARANTIA.CDUNIECO = DOC.PARAMETRO05
               AND GARANTIA.CDRAMO   = DOC.PARAMETRO06
               AND GARANTIA.NMPOLIZA = DOC.PARAMETRO04
               AND GARANTIA.NMGARANT = DOC.PARAMETRO07
             );
    COMMIT;
END FIX_EDOCS_DISPONIVEL_RF;

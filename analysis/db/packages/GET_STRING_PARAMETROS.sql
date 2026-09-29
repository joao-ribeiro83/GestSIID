-- GET_STRING_PARAMETROS (owner: SIID_TESTES)


-- ===== FUNCTION =====

function get_string_parametros( p_id     number
                              , p_tipo   number) return varchar2 is
  l_par varchar2(5000) := '';

  cursor parametros(c_documento number, c_tipo number) is
    SELECT *
    FROM (
      select DECODE(b.nome,'P_CDUNIECO',1
                          ,'P_CDRAMO'  ,2
                          ,'P_NMPOLIZA',3
                          , 4) ordem
      , b.nome
      , CASE b.n_parametro
          WHEN  1 THEN a.parametro01
          WHEN  2 THEN a.parametro02
          WHEN  3 THEN a.parametro03
          WHEN  4 THEN a.parametro04
          WHEN  5 THEN a.parametro05
          WHEN  6 THEN a.parametro06
          WHEN  7 THEN a.parametro07
          WHEN  8 THEN a.parametro08
          WHEN  9 THEN a.parametro09
          WHEN 10 THEN a.parametro10
          WHEN 11 THEN a.parametro11
          WHEN 12 THEN a.parametro12
          WHEN 13 THEN a.parametro13
          WHEN 14 THEN a.parametro14
          WHEN 15 THEN a.parametro15
          WHEN 16 THEN a.parametro16
          WHEN 17 THEN a.parametro17
          WHEN 18 THEN a.parametro18
          WHEN 19 THEN a.parametro19
          WHEN 20 THEN a.parametro20
          ELSE NULL
        END valor
      from
        svr_documentos a
      , svr_parametros_report    b
      where
        a.id = c_documento
      and
        b.report_id = a.report_id
      and
        b.tipo_parametro_rf = c_tipo)
    WHERE valor IS NOT NULL
    ORDER BY
      1    ;

begin


  for par in parametros(p_id,p_tipo) loop
   l_par := l_par || ' ' || par.nome || '=' || par.valor;
 end loop;

 return l_par;
end ; 

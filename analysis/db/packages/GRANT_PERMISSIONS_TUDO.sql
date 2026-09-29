-- GRANT_PERMISSIONS_TUDO (owner: SIID_TESTES)


-- ===== PROCEDURE =====

procedure grant_permissions_tudo(username varchar2) is
  cursor impressao_tables is
  select
    object_name
  from
    user_objects
  where object_type in ('VIEW','TABLE');
begin
  for impressao_table in impressao_tables loop
    execute immediate
      'grant select on ' || impressao_table.object_name ||
      ' to ' || username;
  end loop;
  --execute immediate
  --  'grant execute on pkg_formulas_cosec to ' || username|| ' with grant option';
  --  'grant execute on pkg_documentos_util to ' || username|| ' with grant option';
end;


